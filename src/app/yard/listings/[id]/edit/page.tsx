import { notFound } from 'next/navigation';
import { requireActor } from '@/lib/firebase/admin';
import { getDealerVehicle } from '@/lib/repositories/vehicles';
import { VehicleForm } from '@/components/yard/VehicleForm';

export default async function EditListingPage({ params }: { params: { id: string } }) {
  try { return <main className="mx-auto max-w-5xl px-4 py-8 md:px-6"><VehicleForm vehicle={await getDealerVehicle(await requireActor(), params.id)} /></main>; }
  catch { notFound(); }
}