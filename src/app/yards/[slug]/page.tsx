import { notFound } from 'next/navigation';
import Link from 'next/link';
import { adminDb, col } from '@/lib/firebase/admin';
import { VehicleCard } from '@/components/marketplace/VehicleCard';
import type { Vehicle } from '@/lib/domain/types';

export default async function YardPage({ params }: { params: { slug: string } }) {
  const yard = await adminDb.collection(col.dealerships).where('slug', '==', params.slug).limit(1).get();
  if (yard.empty) notFound();
  const dealer = yard.docs[0].data();
  const stock = await adminDb.collection(col.vehicles).where('dealershipId', '==', yard.docs[0].id).where('status', '==', 'active').orderBy('publishedAt', 'desc').limit(24).get();
  const vehicles = stock.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Vehicle);
  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6"><Link href="/cars" className="text-sm text-yard-600 hover:underline">Back to cars</Link><h1 className="mt-5 font-display text-3xl font-bold">{dealer.name as string}</h1><p className="mt-2 text-ink-muted">{(dealer.location as { addressLine?: string })?.addressLine ?? 'Kenya'}</p><h2 className="mt-10 font-display text-xl font-semibold">Available stock</h2>{vehicles.length ? <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{vehicles.map((vehicle, i) => <VehicleCard key={vehicle.id} vehicle={vehicle} position={i} />)}</div> : <p className="mt-4 text-ink-muted">No active stock is listed yet.</p>}</main>;
}
