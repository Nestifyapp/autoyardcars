import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Firestore-backed fixed-window limiter. No extra infrastructure at MVP scale;
 * swap for Redis/Cloud Armor behind the same signature when traffic justifies it.
 */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const ref = adminDb.collection('rate_limits').doc(`${key}:${window}`);
  try {
    return await adminDb.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const count = (snap.data()?.count as number | undefined) ?? 0;
      if (count >= max) return false;
      tx.set(ref, { count: FieldValue.increment(1), expiresAt: new Date((window + 1) * windowSeconds * 1000) }, { merge: true });
      return true;
    });
  } catch (error) {
    console.error('[rate-limit] failing open', error);
    return true;
  }
}
