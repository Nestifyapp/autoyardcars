import 'server-only';
import { adminDb, col } from '@/lib/firebase/admin';
import { assertTenantPermission, type ActorContext } from '@/lib/auth/permissions';
import { listDealerVehicles } from './vehicles';

export interface YardReport {
  periodDays: number;
  totals: { views: number; leads: number; whatsappClicks: number; callClicks: number; financingClicks: number; activeListings: number };
  events: Record<string, number>;
  topListings: { id: string; title: string; views: number; leads: number; price: number }[];
}

export async function getYardReport(actor: ActorContext, periodDays = 30): Promise<YardReport> {
  const dealershipId = actor.membership?.dealershipId;
  if (!dealershipId) throw Object.assign(new Error('No active dealership membership.'), { status: 403 });
  assertTenantPermission(actor, dealershipId, 'analytics:read');
  const vehicles = await listDealerVehicles(actor);
  const since = new Date(Date.now() - periodDays * 86_400_000).toISOString().slice(0, 10);
  const eventSnap = await adminDb.collection(col.analyticsEvents).where('dealershipId', '==', dealershipId).where('dayKey', '>=', since).get();
  const events: Record<string, number> = {};
  for (const doc of eventSnap.docs) {
    const type = String(doc.get('type') ?? 'unknown');
    events[type] = (events[type] ?? 0) + 1;
  }
  const totals = vehicles.reduce((result, vehicle) => ({
    views: result.views + (vehicle.metrics?.detailViews ?? 0), leads: result.leads + (vehicle.metrics?.leads ?? 0),
    whatsappClicks: result.whatsappClicks + (vehicle.metrics?.whatsappClicks ?? 0), callClicks: result.callClicks + (vehicle.metrics?.callClicks ?? 0),
    financingClicks: result.financingClicks + (vehicle.metrics?.financingClicks ?? 0), activeListings: result.activeListings + (vehicle.status === 'active' ? 1 : 0),
  }), { views: 0, leads: 0, whatsappClicks: 0, callClicks: 0, financingClicks: 0, activeListings: 0 });
  return { periodDays, totals, events, topListings: vehicles.filter(vehicle => vehicle.status !== 'archived').sort((a, b) => (b.metrics?.detailViews ?? 0) - (a.metrics?.detailViews ?? 0)).slice(0, 5).map(vehicle => ({ id: vehicle.id, title: vehicle.title, views: vehicle.metrics?.detailViews ?? 0, leads: vehicle.metrics?.leads ?? 0, price: vehicle.price })) };
}
