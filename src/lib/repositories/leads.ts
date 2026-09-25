import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, col } from '@/lib/firebase/admin';
import type { Lead, LeadSource, Vehicle } from '@/lib/domain/types';

export interface CreateLeadInput {
  source: LeadSource;
  vehicleId?: string;
  dealershipId?: string;
  buyer: { name?: string; phone?: string; email?: string; message?: string; userId?: string };
  attribution?: Lead['attribution'];
  contactConsent: boolean;
  preferredTestDriveAt?: Date;
}

/**
 * Creates a lead, its audit event and the vehicle counter in one atomic batch.
 * The dealership is read from the vehicle document — a dealershipId supplied by
 * the caller is never trusted for attribution.
 */
export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const batch = adminDb.batch();
  const leadRef = adminDb.collection(col.leads).doc();

  let vehicleSnapshot: Lead['vehicleSnapshot'];
  let dealershipId = input.dealershipId;

  if (input.vehicleId) {
    const snap = await adminDb.collection(col.vehicles).doc(input.vehicleId).get();
    if (!snap.exists) throw Object.assign(new Error('That listing no longer exists.'), { status: 404 });
    const vehicle = snap.data() as Vehicle;
    dealershipId = vehicle.dealershipId;
    vehicleSnapshot = { title: vehicle.title, slug: vehicle.slug, price: vehicle.price, coverImageUrl: vehicle.coverImage?.url };

    const counter =
      input.source === 'whatsapp_click' ? 'metrics.whatsappClicks'
      : input.source === 'call_click' ? 'metrics.callClicks'
      : input.source === 'financing_application' ? 'metrics.financingClicks'
      : null;
    batch.update(snap.ref, {
      ...(counter ? { [counter]: FieldValue.increment(1) } : {}),
      'metrics.leads': FieldValue.increment(1),
    });
  }
  if (!dealershipId) throw Object.assign(new Error('A lead must belong to a dealership.'), { status: 400 });

  const lead = {
    id: leadRef.id,
    dealershipId,
    vehicleId: input.vehicleId,
    vehicleSnapshot,
    source: input.source,
    status: 'new' as const,
    buyer: input.buyer,
    attribution: input.attribution ?? {},
    consent: { contactConsent: input.contactConsent, capturedAt: FieldValue.serverTimestamp() },
    notes: [],
    preferredTestDriveAt: input.preferredTestDriveAt,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  batch.set(leadRef, lead);
  batch.set(adminDb.collection(col.leadEvents).doc(), {
    leadId: leadRef.id, dealershipId, type: 'created', to: 'new', createdAt: FieldValue.serverTimestamp(),
  });
  batch.set(adminDb.collection(col.analyticsEvents).doc(), {
    type: input.source === 'whatsapp_click' ? 'whatsapp_click' : input.source === 'call_click' ? 'call_click' : 'test_drive_request',
    vehicleId: input.vehicleId, dealershipId, sessionId: 'server',
    attribution: input.attribution ?? {},
    dayKey: new Date().toISOString().slice(0, 10),
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return lead as unknown as Lead;
}
