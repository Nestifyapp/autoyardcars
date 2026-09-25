import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, col } from '@/lib/firebase/admin';
import type { DealerSubscription, PaymentTransaction, SubscriptionPlan, VehicleBoost } from '@/lib/domain/types';

export class PlanLimitError extends Error { readonly status = 402; }

/**
 * Server-side subscription enforcement. Called before any publish transition —
 * a dealer cannot exceed their plan by calling the API directly.
 */
export async function assertCanPublishAnotherListing(dealershipId: string, vehicleId?: string): Promise<void> {
  const dealerSnap = await adminDb.collection(col.dealerships).doc(dealershipId).get();
  if (!dealerSnap.exists) throw new PlanLimitError('Dealership not found.');
  const dealer = dealerSnap.data()!;

  if (dealer.status !== 'verified') {
    throw new PlanLimitError('Your dealership is still being verified. Listings can be published once verification is complete.');
  }
  const limit: number | null = dealer.subscription?.activeListingLimit ?? 5;
  if (limit === null) return; // unlimited

  const activeSnap = await adminDb.collection(col.vehicles)
    .where('dealershipId', '==', dealershipId)
    .where('status', 'in', ['active', 'reserved'])
    .count().get();

  const currentlyActive = activeSnap.data().count;
  const alreadyCounted = vehicleId
    ? (await adminDb.collection(col.vehicles).doc(vehicleId).get()).get('status') === 'active'
    : false;

  if (!alreadyCounted && currentlyActive >= limit) {
    throw new PlanLimitError(`Your plan allows ${limit} live listings. Upgrade or mark a vehicle sold to publish another.`);
  }
}

/**
 * Applies a confirmed payment. Only ever called from the payment callback after
 * the provider reports success — never from a client request.
 */
export async function applySuccessfulPayment(transaction: PaymentTransaction): Promise<void> {
  await adminDb.runTransaction(async tx => {
    if (transaction.purpose === 'subscription') {
      const subRef = adminDb.collection(col.dealerSubscriptions).doc(transaction.referenceId);
      const sub = (await tx.get(subRef)).data() as DealerSubscription | undefined;
      if (!sub) throw new Error(`Subscription ${transaction.referenceId} missing`);

      const planSnap = await tx.get(adminDb.collection(col.subscriptionPlans).doc(sub.planId));
      const plan = planSnap.data() as SubscriptionPlan;
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + (sub.billingCycle === 'annual' ? 12 : 1));

      tx.update(subRef, { status: 'active', currentPeriodStart: FieldValue.serverTimestamp(), currentPeriodEnd: periodEnd, lastPaymentTransactionId: transaction.id, updatedAt: FieldValue.serverTimestamp() });
      tx.update(adminDb.collection(col.dealerships).doc(transaction.dealershipId), {
        'subscription.planId': sub.planId,
        'subscription.planName': plan?.name ?? sub.planSnapshot.name,
        'subscription.status': 'active',
        'subscription.activeListingLimit': plan?.limits.activeListings ?? sub.planSnapshot.limits.activeListings ?? 5,
        'subscription.currentPeriodEnd': periodEnd,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    if (transaction.purpose === 'boost') {
      const boostRef = adminDb.collection(col.vehicleBoosts).doc(transaction.referenceId);
      const boost = (await tx.get(boostRef)).data() as VehicleBoost | undefined;
      if (!boost) throw new Error(`Boost ${transaction.referenceId} missing`);

      const startsAt = new Date();
      const endsAt = new Date(startsAt.getTime() + boost.boostSnapshot.durationDays * 86_400_000);
      tx.update(boostRef, { status: 'active', startsAt, endsAt, paymentTransactionId: transaction.id, updatedAt: FieldValue.serverTimestamp() });
      tx.update(adminDb.collection(col.vehicles).doc(boost.vehicleId), {
        boost: { active: true, placements: boost.placements, expiresAt: endsAt, campaignId: boost.id },
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });
}
