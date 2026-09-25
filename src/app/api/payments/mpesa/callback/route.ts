import { NextResponse, type NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, col } from '@/lib/firebase/admin';
import { getPaymentProvider } from '@/lib/services/payments';
import { applySuccessfulPayment } from '@/lib/repositories/subscriptions';
import type { PaymentTransaction } from '@/lib/domain/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The only place subscriptions and boosts are activated. Pressing a payment
 * button grants nothing; benefits follow a confirmed provider callback.
 */
export async function POST(request: NextRequest) {
  if (request.nextUrl.searchParams.get('k') !== process.env.MPESA_CALLBACK_SECRET) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Rejected' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload) return NextResponse.json({ ResultCode: 1, ResultDesc: 'Malformed' }, { status: 400 });

  const result = getPaymentProvider().parseCallback(payload);

  const snap = await adminDb.collection(col.paymentTransactions)
    .where('providerRefs.checkoutRequestId', '==', result.checkoutRequestId).limit(1).get();

  if (snap.empty) {
    console.warn('[mpesa] callback for unknown checkout', result.checkoutRequestId);
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' }); // never retry-loop the operator
  }

  const doc = snap.docs[0];
  const transaction = { id: doc.id, ...doc.data() } as PaymentTransaction;

  if (transaction.status === 'succeeded') {
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Already processed' }); // idempotent
  }

  await doc.ref.update({
    status: result.status,
    'providerRefs.mpesaReceiptNumber': result.mpesaReceiptNumber,
    failureReason: result.failureReason,
    rawCallback: result.raw,
    settledAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (result.status === 'succeeded') {
    try {
      await applySuccessfulPayment({ ...transaction, status: 'succeeded' });
    } catch (error) {
      console.error('[mpesa] entitlement failed — needs reconciliation', doc.id, error);
      await doc.ref.update({ failureReason: `Entitlement error: ${(error as Error).message}` });
    }
  }
  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
