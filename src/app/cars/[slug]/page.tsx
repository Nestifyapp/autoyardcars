import { notFound } from 'next/navigation';
import Link from 'next/link';
import { adminDb, col } from '@/lib/firebase/admin';
import { vehicleJsonLd, vehicleMetadata } from '@/lib/seo/metadata';
import { productMatchesVehicle } from '@/lib/domain/financing';
import { ContactActions } from '@/components/marketplace/ContactActions';
import { FinancingCalculator } from '@/components/marketplace/FinancingCalculator';
import { VehicleGallery } from '@/components/marketplace/VehicleGallery';
import { VehicleCard } from '@/components/marketplace/VehicleCard';
import { formatKes } from '@/lib/brand';
import { ArrowUpRight, BadgeCheck, MapPin } from 'lucide-react';
import type { FinancingProduct, Vehicle } from '@/lib/domain/types';

export const revalidate = 300;

async function getVehicle(slug: string): Promise<Vehicle | null> {
  const snap = await adminDb.collection(col.vehicles).where('slug', '==', slug).limit(1).get();
  if (snap.empty) return null;
  const vehicle = { id: snap.docs[0].id, ...snap.docs[0].data() } as Vehicle;
  // Drafts, rejected and archived listings are not public.
  return ['active', 'reserved', 'sold'].includes(vehicle.status) ? vehicle : null;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const vehicle = await getVehicle(params.slug);
  return vehicle ? vehicleMetadata(vehicle) : { title: 'Listing not found' };
}

export default async function VehiclePage({ params }: { params: { slug: string } }) {
  const vehicle = await getVehicle(params.slug);
  if (!vehicle) notFound();

  const [productsSnap, similarSnap] = await Promise.all([
    adminDb.collection(col.financingProducts).where('active', '==', true).get(),
    adminDb.collection(col.vehicles).where('status', '==', 'active').where('bodyType', '==', vehicle.bodyType)
      .orderBy('publishedAt', 'desc').limit(7).get(),
  ]);

  const products = productsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }) as FinancingProduct)
    .filter(p => productMatchesVehicle(p, vehicle));

  const similar = similarSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Vehicle)
    .filter(v => v.id !== vehicle.id).slice(0, 6);

  const specs: [string, string | number | undefined][] = [
    ['Year', vehicle.yearOfManufacture], ['Mileage', vehicle.mileageKm ? `${vehicle.mileageKm.toLocaleString()} km` : undefined],
    ['Transmission', vehicle.transmission], ['Fuel', vehicle.fuelType],
    ['Engine', vehicle.engineCapacityCc ? `${vehicle.engineCapacityCc} cc` : undefined],
    ['Body', vehicle.bodyType], ['Drive', vehicle.drivetrain], ['Seats', vehicle.seats],
    ['Condition', vehicle.condition.replace('_', ' ')], ['Colour', vehicle.exteriorColour],
    ['Logbook', vehicle.logbookAvailable ? 'Available' : undefined],
  ];
  const galleryImages = [
    ...(vehicle.coverImage ? [vehicle.coverImage] : []),
    ...vehicle.images.filter(image => image.id !== vehicle.coverImage?.id).sort((a, b) => a.order - b.order),
  ];

  return (
    <main className="pb-24 md:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd(vehicle)) }} />

      <div className="grid gap-8 md:grid-cols-[1.6fr_1fr] md:px-6">
        <div>
          <VehicleGallery title={vehicle.title} images={galleryImages} />
          <div className="relative">
            {vehicle.status === 'sold' && (
              <div className="absolute inset-x-0 bottom-0 bg-ink/85 p-3 text-center text-white">
                This vehicle is sold. <Link className="underline" href={`/cars?make=${vehicle.make}`}>See similar {vehicle.make}s</Link>
              </div>
            )}
          </div>

          <section className="space-y-4 p-4 md:px-0">
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">{vehicle.title}</h1>
              <p className="mt-1 font-display text-3xl font-bold tabular-nums text-yard-900">{formatKes(vehicle.price)}</p>
              {vehicle.negotiable && <p className="text-sm text-ink-muted">Price negotiable</p>}
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-card border border-line p-4 text-sm sm:grid-cols-3">
              {specs.filter(([, v]) => v != null).map(([label, value]) => (
                <div key={label}><dt className="text-ink-muted">{label}</dt><dd className="capitalize">{value}</dd></div>
              ))}
            </dl>

            {vehicle.description && <p className="whitespace-pre-line text-[15px] leading-relaxed">{vehicle.description}</p>}

            {vehicle.features.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {vehicle.features.map(f => <li key={f} className="rounded-full bg-surface px-3 py-1 text-sm">{f}</li>)}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-5 px-4 md:px-0">
          <div className="rounded-card border border-line p-4">
            <Link href={`/yards/${vehicle.dealerSnapshot.slug}`} className="group flex items-center justify-between rounded-lg border border-yard-100 bg-yard-50 px-3 py-2 font-semibold text-yard-900 transition hover:border-yard-500 hover:bg-yard-100">
              <span className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-yard-500" aria-hidden />{vehicle.dealerSnapshot.name}</span>
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-label="Open car yard" />
            </Link>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted"><MapPin className="h-4 w-4 text-rose-600" aria-hidden />{vehicle.location.locationName}</p>
            {vehicle.dealerSnapshot.verified
              ? <p className="mt-2 inline-block rounded bg-yard-50 px-2 py-1 text-xs text-yard-600">Verified by our team</p>
              : <p className="mt-2 text-xs text-ink-muted">Verification in progress</p>}
            <div className="mt-4"><ContactActions vehicle={{
              id: vehicle.id,
              title: vehicle.title,
              dealerSnapshot: {
                whatsappPhone: vehicle.dealerSnapshot.whatsappPhone,
                primaryPhone: vehicle.dealerSnapshot.primaryPhone,
              },
            }} /></div>
          </div>

          {products.length > 0 && (
            <section>
              <h2 className="mb-2 font-display text-lg font-semibold">Financing estimate</h2>
              <FinancingCalculator price={vehicle.price} products={products.map(product => ({
                id: product.id,
                financierName: product.financierName,
                name: product.name,
                terms: {
                  minDepositPercent: product.terms.minDepositPercent,
                  repaymentMonths: product.terms.repaymentMonths,
                  annualRatePercent: product.terms.annualRatePercent,
                  rateType: product.terms.rateType,
                  processingFeePercent: product.terms.processingFeePercent,
                },
              }))} />
            </section>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-10 px-4 md:px-6">
          <h2 className="mb-3 font-display text-lg font-semibold">Similar vehicles</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {similar.map((v, i) => <VehicleCard key={v.id} vehicle={v} position={i} />)}
          </div>
        </section>
      )}
    </main>
  );
}
