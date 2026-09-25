import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { requireActor, adminDb, col } from '@/lib/firebase/admin';

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    if (actor.membership) return NextResponse.json({ error: 'This account already belongs to a yard.' }, { status: 409 });
    const body = await request.json() as { name?: string; phone?: string; whatsappPhone?: string; email?: string; addressLine?: string; description?: string };
    const name = body.name?.trim();
    const phone = body.phone?.trim();
    if (!name || !phone) return NextResponse.json({ error: 'Yard name and phone are required.' }, { status: 400 });

    const dealershipRef = adminDb.collection(col.dealerships).doc();
    const memberRef = adminDb.collection(col.dealershipMembers).doc(`${dealershipRef.id}_${actor.uid}`);
    const userRef = adminDb.collection(col.users).doc(actor.uid);
    const slug = `${slugify(name)}-${dealershipRef.id.slice(0, 6)}`;
    const now = FieldValue.serverTimestamp();
    const batch = adminDb.batch();
    batch.set(dealershipRef, {
      id: dealershipRef.id, name, slug, description: body.description?.trim() ?? '',
      contact: { primaryPhone: phone, whatsappPhone: body.whatsappPhone?.trim() ?? phone, email: body.email?.trim() ?? '' },
      location: { locationId: '', locationPath: '', addressLine: body.addressLine?.trim() ?? '' },
      status: 'pending_verification', verification: {}, subscription: { planId: 'free', planName: 'Free', status: 'trialing', activeListingLimit: 5 },
      stats: { activeListings: 0, totalLeads30d: 0 }, ownerUserId: actor.uid, createdBy: 'self_signup', deletedAt: null, createdAt: now, updatedAt: now,
    });
    batch.set(memberRef, { id: memberRef.id, dealershipId: dealershipRef.id, userId: actor.uid, role: 'dealer_owner', permissions: [], status: 'active', createdAt: now, updatedAt: now });
    batch.set(userRef, { id: actor.uid, platformRole: 'buyer', dealershipIds: [dealershipRef.id], consent: { marketing: false, dataProcessing: true }, updatedAt: now }, { merge: true });
    await batch.commit();
    return NextResponse.json({ dealershipId: dealershipRef.id, slug, status: 'pending_verification' }, { status: 201 });
  } catch (error) {
    const e = error as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}