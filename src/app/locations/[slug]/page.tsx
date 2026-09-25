import Link from 'next/link';
import { adminDb, col } from '@/lib/firebase/admin';
import { VehicleCard } from '@/components/marketplace/VehicleCard';
import type { Vehicle } from '@/lib/domain/types';

export default async function LocationPage({ params }: { params: { slug: string } }) {
  const location = await adminDb.collection(col.locations).where('slug', '==', params.slug).limit(1).get();
  const locationName = location.empty ? params.slug.replace(/-/g, ' ') : location.docs[0].get('name') as string;
  const path = location.empty ? params.slug : location.docs[0].get('path') as string;
  const stock = await adminDb.collection(col.vehicles).where('status', '==', 'active').where('location.locationPath', '>=', path).where('location.locationPath', '<=', `${path}\uf8ff`).orderBy('location.locationPath').orderBy('publishedAt', 'desc').limit(24).get();
  const vehicles = stock.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Vehicle);
  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6"><Link href="/cars" className="text-sm text-yard-600 hover:underline">Back to all cars</Link><h1 className="mt-5 font-display text-3xl font-bold">Cars for sale in {locationName}</h1><p className="mt-2 text-ink-muted">Browse verified vehicle stock in this area.</p>{vehicles.length ? <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{vehicles.map((vehicle, i) => <VehicleCard key={vehicle.id} vehicle={vehicle} position={i} />)}</div> : <p className="mt-8 text-ink-muted">No active stock is listed here yet.</p>}</main>;
}
