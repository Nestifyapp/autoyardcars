import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, col } from '@/lib/firebase/admin';
import { assertTenantPermission, type ActorContext } from '@/lib/auth/permissions';
import { computeCarGroupings } from '@/lib/domain/groupings';
import type { Vehicle, VehicleStatus } from '@/lib/domain/types';

export type VehicleWriteInput = Pick<Vehicle, 'make' | 'model' | 'yearOfManufacture' | 'price' | 'mileageKm' | 'transmission' | 'fuelType' | 'bodyType' | 'condition'> &
  Partial<Pick<Vehicle, 'variant' | 'yearOfRegistration' | 'engineCapacityCc' | 'exteriorColour' | 'interiorColour' | 'seats' | 'doors' | 'description' | 'features' | 'negotiable' | 'financingEligible' | 'usageType' | 'isOriginalPaint' | 'isLuxury' | 'groupings' | 'isSponsored'>>;

function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function cleanInput(input: VehicleWriteInput, createdAt: Vehicle['createdAt'] = new Date()) {
  if (!input.make?.trim() || !input.model?.trim()) throw Object.assign(new Error('Make and model are required.'), { status: 400 });
  if (!Number.isFinite(input.yearOfManufacture) || !Number.isFinite(input.price)) throw Object.assign(new Error('Year and price are required.'), { status: 400 });
  return { ...input, make: input.make.trim(), model: input.model.trim(), features: input.features ?? [], negotiable: input.negotiable ?? false, financingEligible: input.financingEligible ?? false, isOriginalPaint: input.isOriginalPaint ?? false, isLuxury: input.isLuxury ?? false, isSponsored: input.isSponsored ?? false, groupings: computeCarGroupings({ ...input, createdAt }) };
}

async function dealerForActor(actor: ActorContext) {
  const dealershipId = actor.membership?.dealershipId;
  if (!dealershipId) throw Object.assign(new Error('No active dealership membership.'), { status: 403 });
  const snap = await adminDb.collection(col.dealerships).doc(dealershipId).get();
  if (!snap.exists) throw Object.assign(new Error('Dealership not found.'), { status: 404 });
  return { dealershipId, dealer: snap.data()! };
}

export async function listDealerVehicles(actor: ActorContext) {
  const { dealershipId } = await dealerForActor(actor);
  assertTenantPermission(actor, dealershipId, 'inventory:read');
  const snap = await adminDb.collection(col.vehicles).where('dealershipId', '==', dealershipId).orderBy('updatedAt', 'desc').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Vehicle);
}

export async function getDealerVehicle(actor: ActorContext, id: string) {
  const snap = await adminDb.collection(col.vehicles).doc(id).get();
  if (!snap.exists) throw Object.assign(new Error('Listing not found.'), { status: 404 });
  const vehicle = { id: snap.id, ...snap.data() } as Vehicle;
  assertTenantPermission(actor, vehicle.dealershipId, 'inventory:read');
  return vehicle;
}

export async function createDealerVehicle(actor: ActorContext, input: VehicleWriteInput) {
  const { dealershipId, dealer } = await dealerForActor(actor);
  assertTenantPermission(actor, dealershipId, 'inventory:write');
  const clean = cleanInput(input);
  const ref = adminDb.collection(col.vehicles).doc();
  const now = FieldValue.serverTimestamp();
  const vehicle = {
    ...clean, id: ref.id, dealershipId, title: `${clean.yearOfManufacture} ${clean.make} ${clean.model}${clean.variant ? ` ${clean.variant}` : ''}`,
    slug: `${slugify(`${clean.yearOfManufacture}-${clean.make}-${clean.model}`)}-${ref.id.slice(0, 6)}`, currency: 'KES', status: 'draft' as const,
    dealerSnapshot: { name: dealer.name, slug: dealer.slug, logoUrl: dealer.logoUrl, verified: dealer.status === 'verified', whatsappPhone: dealer.contact?.whatsappPhone ?? '', primaryPhone: dealer.contact?.primaryPhone ?? '', locationName: dealer.location?.addressLine ?? 'Kenya', locationPath: dealer.location?.locationPath ?? '' },
    origin: { locallyUsed: clean.usageType === 'locally_used', imported: clean.usageType === 'foreign_used' }, location: { locationId: dealer.location?.locationId ?? '', locationPath: dealer.location?.locationPath ?? '', locationName: dealer.location?.addressLine ?? 'Kenya' },
    images: [], metrics: { impressions: 0, detailViews: 0, whatsappClicks: 0, callClicks: 0, financingClicks: 0, leads: 0 }, collectionSlugs: [], createdAt: now, updatedAt: now,
  };
  await ref.set(vehicle);
  return { ...vehicle, createdAt: new Date(), updatedAt: new Date() } as unknown as Vehicle;
}

export async function updateDealerVehicle(actor: ActorContext, id: string, input: Partial<VehicleWriteInput> & { status?: VehicleStatus }) {
  const vehicle = await getDealerVehicle(actor, id);
  assertTenantPermission(actor, vehicle.dealershipId, 'inventory:write');
  const clean = cleanInput({ ...vehicle, ...input } as VehicleWriteInput, vehicle.createdAt);
  const updates: Record<string, unknown> = { ...clean, title: `${clean.yearOfManufacture} ${clean.make} ${clean.model}${clean.variant ? ` ${clean.variant}` : ''}`, updatedAt: FieldValue.serverTimestamp() };
  if (input.status) updates.status = input.status;
  await adminDb.collection(col.vehicles).doc(id).update(updates);
  return { ...vehicle, ...updates, groupings: clean.groupings } as unknown as Vehicle;
}

export async function deleteDealerVehicle(actor: ActorContext, id: string) {
  const vehicle = await getDealerVehicle(actor, id);
  assertTenantPermission(actor, vehicle.dealershipId, 'inventory:delete');
  await adminDb.collection(col.vehicles).doc(id).update({ status: 'archived', updatedAt: FieldValue.serverTimestamp() });
}