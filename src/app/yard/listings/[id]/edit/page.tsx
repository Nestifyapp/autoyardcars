import { notFound } from 'next/navigation';
import { requireActor } from '@/lib/firebase/admin';
import { getDealerVehicle } from '@/lib/repositories/vehicles';
import { VehicleForm } from '@/components/yard/VehicleForm';

export default async function EditListingPage({ params }: { params: { id: string } }) {
  try {
    const vehicle = await getDealerVehicle(await requireActor(), params.id);
    const formVehicle = {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      variant: vehicle.variant,
      yearOfManufacture: vehicle.yearOfManufacture,
      price: vehicle.price,
      mileageKm: vehicle.mileageKm,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuelType,
      bodyType: vehicle.bodyType,
      condition: vehicle.condition,
      usageType: vehicle.usageType,
      engineCapacityCc: vehicle.engineCapacityCc,
      exteriorColour: vehicle.exteriorColour,
      seats: vehicle.seats,
      description: vehicle.description,
      isOriginalPaint: vehicle.isOriginalPaint,
      isLuxury: vehicle.isLuxury,
      groupings: vehicle.groupings,
      images: vehicle.images ?? [],
      coverImage: vehicle.coverImage,
    };
    return <main className="mx-auto max-w-5xl px-4 py-8 md:px-6"><VehicleForm vehicle={formVehicle} /></main>;
  }
  catch { notFound(); }
}