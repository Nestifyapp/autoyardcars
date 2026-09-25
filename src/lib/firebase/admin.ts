import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { cookies } from 'next/headers';
import type { ActorContext } from '@/lib/auth/permissions';
import type { DealershipMember, PlatformRole } from '@/lib/domain/types';

const serviceAccount = process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL
  ? cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  : undefined;

const existingApp = getApps()[0];
const app: App = existingApp ?? initializeApp({
  ...(serviceAccount ? { credential: serviceAccount } : {}),
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app);

if (!existingApp) adminDb.settings({ ignoreUndefinedProperties: true });

export const col = {
  users: 'users',
  dealerships: 'dealerships',
  dealershipMembers: 'dealership_members',
  locations: 'locations',
  vehicles: 'vehicles',
  vehicleMedia: 'vehicle_media',
  makes: 'makes',
  models: 'models',
  collections: 'marketplace_collections',
  leads: 'leads',
  leadEvents: 'lead_events',
  favourites: 'favourites',
  financiers: 'financiers',
  financingProducts: 'financing_products',
  financingApplications: 'financing_applications',
  subscriptionPlans: 'subscription_plans',
  dealerSubscriptions: 'dealer_subscriptions',
  boostProducts: 'boost_products',
  vehicleBoosts: 'vehicle_boosts',
  paymentTransactions: 'payment_transactions',
  adminAuditLogs: 'admin_audit_logs',
  listingReports: 'listing_reports',
  analyticsEvents: 'analytics_events',
} as const;

/**
 * Resolves the caller from the session cookie and loads their tenancy from
 * Firestore. Request bodies never decide tenancy.
 */
export async function getActor(): Promise<ActorContext | null> {
  const session = cookies().get('__session')?.value;
  if (!session) return null;
  let uid: string, claims: Record<string, unknown>;
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    uid = decoded.uid;
    claims = decoded as unknown as Record<string, unknown>;
  } catch {
    return null;
  }

  const platformRole: PlatformRole =
    claims.super_admin === true ? 'super_admin' : claims.platform_staff === true ? 'platform_staff' : 'buyer';

  const memberSnap = await adminDb
    .collection(col.dealershipMembers)
    .where('userId', '==', uid)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  const membership = memberSnap.empty
    ? null
    : ({ id: memberSnap.docs[0].id, ...memberSnap.docs[0].data() } as DealershipMember);

  return { uid, platformRole, membership };
}

export async function requireActor(): Promise<ActorContext> {
  const actor = await getActor();
  if (!actor) { const e: Error & { status?: number } = new Error('Sign in required.'); e.status = 401; throw e; }
  return actor;
}
