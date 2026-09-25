import { notFound } from 'next/navigation';
import Link from 'next/link';
import { adminDb, col } from '@/lib/firebase/admin';
import { VehicleCard } from '@/components/marketplace/VehicleCard';
import type { Vehicle } from '@/lib/domain/types';
import type { Dealership } from '@/lib/domain/types';
import { dealershipMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const snap = await adminDb.collection(col.dealerships).where('slug', '==', params.slug).where('status', '==', 'verified').limit(1).get();
  if (snap.empty) return {};
  const dealer = snap.docs[0].data() as Dealership;
  return dealershipMetadata(dealer, dealer.stats?.activeListings ?? 0);
}

export default async function YardPage({ params }: { params: { slug: string } }) {
  const yard = await adminDb.collection(col.dealerships).where('slug', '==', params.slug).where('status', '==', 'verified').limit(1).get();
  if (yard.empty) notFound();
  const dealer = yard.docs[0].data();
  const stock = await adminDb.collection(col.vehicles).where('dealershipId', '==', yard.docs[0].id).where('status', '==', 'active').orderBy('publishedAt', 'desc').limit(24).get();
  const vehicles = stock.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Vehicle);
  const profile = dealer as Dealership;
  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6"><Link href="/cars" className="text-sm text-yard-600 hover:underline">Back to cars</Link><section className="mt-5 overflow-hidden rounded-card border border-line bg-white shadow-sm"><div className="h-40 bg-yard-900 bg-cover bg-center" style={profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})` } : undefined} /><div className="p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h1 className="font-display text-3xl font-bold">{profile.name}</h1><span className="rounded-full bg-yard-50 px-2.5 py-1 text-xs font-semibold text-yard-700">Verified yard</span></div><p className="mt-2 text-ink-muted">{profile.location.addressLine ?? 'Kenya'}</p><p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">{profile.description ?? profile.tagline}</p></div><div className="flex gap-2"><a href={`tel:${profile.contact.primaryPhone}`} className="rounded-lg border border-yard-500 px-4 py-2 text-sm font-semibold text-yard-700">Call yard</a><a href={`https://wa.me/${profile.contact.whatsappPhone}`} className="rounded-lg bg-yard-500 px-4 py-2 text-sm font-semibold text-white">WhatsApp</a></div></div></div></section><h2 className="mt-10 font-display text-xl font-semibold">Available stock</h2>{vehicles.length ? <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{vehicles.map((vehicle, i) => <VehicleCard key={vehicle.id} vehicle={{ ...vehicle, groupings: vehicle.groupings ?? [] }} position={i} />)}</div> : <p className="mt-4 text-ink-muted">No active stock is listed yet.</p>}</main>;
}
