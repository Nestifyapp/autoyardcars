/**
 * Development seed. Populates Firestore with realistic Kenyan sample inventory
 * across several locations so the architecture can be verified as
 * location-agnostic. Run against the emulators:
 *
 *   npm run emulators
 *   npm run seed
 *
 * Every vehicle is flagged `sampleData: true` and titled with a SAMPLE marker in
 * the dealer portal so demo stock is never mistaken for live inventory.
 */
import { adminDb, col } from '../src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { BodyType, FuelType, Transmission, VehicleCondition } from '../src/lib/domain/types';
import { computeCarGroupings } from '../src/lib/domain/groupings';

const now = FieldValue.serverTimestamp();
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const tokens = (...parts: (string | number | undefined)[]) =>
  Array.from(new Set(parts.filter(Boolean).flatMap(p => String(p).toLowerCase().split(/\s+/))));

/* ------------------------------- locations ------------------------------- */
const LOCATIONS = [
  { id: 'ke', level: 'country', name: 'Kenya', parentId: null, path: 'ke' },
  { id: 'ke-nairobi-county', level: 'county', name: 'Nairobi County', parentId: 'ke', path: 'ke/nairobi' },
  { id: 'ke-nairobi-city', level: 'city', name: 'Nairobi', parentId: 'ke-nairobi-county', path: 'ke/nairobi/nairobi' },
  { id: 'ke-kangundo-road', level: 'area', name: 'Kangundo Road', parentId: 'ke-nairobi-city', path: 'ke/nairobi/nairobi/kangundo-road' },
  { id: 'ke-ngong-road', level: 'area', name: 'Ngong Road', parentId: 'ke-nairobi-city', path: 'ke/nairobi/nairobi/ngong-road' },
  { id: 'ke-mombasa-road', level: 'area', name: 'Mombasa Road', parentId: 'ke-nairobi-city', path: 'ke/nairobi/nairobi/mombasa-road' },
  { id: 'ke-thika-road', level: 'area', name: 'Thika Road', parentId: 'ke-nairobi-city', path: 'ke/nairobi/nairobi/thika-road' },
  { id: 'ke-mombasa-county', level: 'county', name: 'Mombasa County', parentId: 'ke', path: 'ke/mombasa' },
  { id: 'ke-mombasa-city', level: 'city', name: 'Mombasa', parentId: 'ke-mombasa-county', path: 'ke/mombasa/mombasa' },
  { id: 'ke-nyali', level: 'area', name: 'Nyali', parentId: 'ke-mombasa-city', path: 'ke/mombasa/mombasa/nyali' },
  { id: 'ke-kiambu-county', level: 'county', name: 'Kiambu County', parentId: 'ke', path: 'ke/kiambu' },
  { id: 'ke-ruiru', level: 'city', name: 'Ruiru', parentId: 'ke-kiambu-county', path: 'ke/kiambu/ruiru' },
] as const;

const ancestorsOf = (id: string): string[] => {
  const out: string[] = [];
  let node = LOCATIONS.find(l => l.id === id);
  while (node?.parentId) { out.push(node.parentId); node = LOCATIONS.find(l => l.id === node!.parentId); }
  return out;
};

/* ------------------------------ dealerships ------------------------------ */
const DEALERS = [
  { name: 'Kangundo Motors', locationId: 'ke-kangundo-road', status: 'verified', plan: 'pro', phone: '0712345001' },
  { name: 'Eastern Bypass Auto Hub', locationId: 'ke-kangundo-road', status: 'verified', plan: 'pro', phone: '0712345002' },
  { name: 'Njiru Car Bazaar', locationId: 'ke-kangundo-road', status: 'verified', plan: 'free', phone: '0712345003' },
  { name: 'Ngong Road Prestige Cars', locationId: 'ke-ngong-road', status: 'verified', plan: 'premium', phone: '0712345004' },
  { name: 'Coastline Motors Nyali', locationId: 'ke-nyali', status: 'verified', plan: 'free', phone: '0712345005' },
  { name: 'Ruiru Family Autos', locationId: 'ke-ruiru', status: 'pending_verification', plan: 'free', phone: '0712345006' },
];

/* -------------------------------- vehicles -------------------------------- */
type Seed = [make: string, model: string, variant: string, year: number, price: number, mileage: number,
  body: BodyType, fuel: FuelType, trans: Transmission, seats: number, cc: number, condition: VehicleCondition];

const VEHICLES: Seed[] = [
  ['Toyota','Axio','Hybrid G',2018,1_450_000,78_000,'sedan','hybrid','cvt',5,1500,'foreign_used'],
  ['Toyota','Premio','2.0 New Shape',2017,2_150_000,96_000,'sedan','petrol','cvt',5,1800,'foreign_used'],
  ['Toyota','Probox','GL',2016,880_000,145_000,'station_wagon','petrol','automatic',5,1300,'locally_used'],
  ['Toyota','Prado','TX 2.8',2015,6_900_000,120_000,'suv','diesel','automatic',7,2800,'foreign_used'],
  ['Toyota','Hilux','Double Cab 2.4',2019,4_300_000,88_000,'pickup','diesel','manual',5,2400,'locally_used'],
  ['Toyota','Voxy','Noah 2.0',2017,2_050_000,102_000,'minivan','petrol','cvt',8,2000,'foreign_used'],
  ['Mazda','Demio','Skyactiv 1.3',2017,1_050_000,84_000,'hatchback','petrol','automatic',5,1300,'foreign_used'],
  ['Mazda','CX-5','2.2 Diesel AWD',2016,2_650_000,118_000,'suv','diesel','automatic',5,2200,'foreign_used'],
  ['Nissan','Note','e-Power',2018,1_320_000,66_000,'hatchback','hybrid','cvt',5,1200,'foreign_used'],
  ['Nissan','X-Trail','20X 4WD',2016,2_480_000,112_000,'suv','petrol','cvt',5,2000,'foreign_used'],
  ['Subaru','Forester','XT Turbo',2016,2_750_000,108_000,'suv','petrol','cvt',5,2000,'foreign_used'],
  ['Subaru','Impreza','G4 2.0i',2017,1_690_000,91_000,'sedan','petrol','cvt',5,2000,'foreign_used'],
  ['Mercedes-Benz','C200','AMG Line',2017,4_150_000,72_000,'sedan','petrol','automatic',5,2000,'foreign_used'],
  ['BMW','X3','xDrive20d',2016,3_850_000,99_000,'suv','diesel','automatic',5,2000,'foreign_used'],
  ['Volkswagen','Golf','TSI Comfortline',2017,1_980_000,87_000,'hatchback','petrol','dct',5,1400,'foreign_used'],
  ['Volkswagen','Tiguan','2.0 TSI',2016,2_450_000,104_000,'suv','petrol','dct',5,2000,'foreign_used'],
  ['Mitsubishi','Outlander','PHEV',2017,2_390_000,95_000,'suv','plugin_hybrid','automatic',5,2000,'foreign_used'],
  ['Mitsubishi','L200','Double Cab',2018,3_600_000,110_000,'pickup','diesel','manual',5,2400,'locally_used'],
  ['Honda','Fit','Hybrid F Package',2018,1_190_000,74_000,'hatchback','hybrid','dct',5,1500,'foreign_used'],
  ['Honda','CR-V','2.0 4WD',2016,2_580_000,106_000,'suv','petrol','cvt',5,2000,'foreign_used'],
  ['Suzuki','Swift','RS 1.2',2018,1_090_000,58_000,'hatchback','petrol','cvt',5,1200,'foreign_used'],
  ['Suzuki','Vitara','Brezza',2019,1_780_000,49_000,'crossover','petrol','automatic',5,1500,'locally_used'],
  ['Isuzu','D-Max','LS Double Cab',2018,3_950_000,124_000,'pickup','diesel','manual',5,2500,'locally_used'],
  ['Isuzu','NQR','5-Tonne Body',2015,3_200_000,180_000,'truck','diesel','manual',3,5200,'locally_used'],
  ['Ford','Ranger','Wildtrak 3.2',2017,4_450_000,115_000,'pickup','diesel','automatic',5,3200,'foreign_used'],
  ['Ford','EcoSport','Titanium',2018,1_650_000,68_000,'crossover','petrol','automatic',5,1500,'foreign_used'],
];

const COLLECTIONS = [
  { name: 'Ride-hailing friendly', slug: 'ride-hailing-friendly', showOnHomepage: true, sortOrder: 1,
    description: 'Cars that meet the vehicle age, size and economy requirements most ride-hailing platforms ask for today.',
    rules: [
      { field: 'yearOfManufacture', operator: 'gte', value: 2015 },
      { field: 'bodyType', operator: 'in', value: ['sedan', 'saloon', 'hatchback', 'station_wagon'] },
      { field: 'seats', operator: 'gte', value: 5 },
      { field: 'price', operator: 'lte', value: 2_000_000 },
    ] },
  { name: 'Family cars', slug: 'family-cars', showOnHomepage: true, sortOrder: 2,
    description: 'Space for car seats, school runs and weekend trips.',
    rules: [{ field: 'seats', operator: 'gte', value: 5 }, { field: 'bodyType', operator: 'in', value: ['suv','crossover','station_wagon','minivan','van'] }] },
  { name: '7-seaters', slug: '7-seaters', showOnHomepage: false, sortOrder: 3, description: 'Seven seats or more.',
    rules: [{ field: 'seats', operator: 'gte', value: 7 }] },
  { name: 'First car', slug: 'first-car', showOnHomepage: true, sortOrder: 4, description: 'Easy to park, cheap to run, simple to resell.',
    rules: [{ field: 'price', operator: 'lte', value: 1_300_000 }, { field: 'bodyType', operator: 'in', value: ['hatchback','sedan'] }] },
  { name: 'Under KES 1M', slug: 'under-1m', showOnHomepage: true, sortOrder: 5, description: 'Everything on the marketplace below one million shillings.',
    rules: [{ field: 'price', operator: 'lte', value: 1_000_000 }] },
  { name: 'Fuel savers', slug: 'fuel-savers', showOnHomepage: true, sortOrder: 6, description: 'Small engines and hybrids that survive Nairobi traffic.',
    rules: [{ field: 'engineCapacityCc', operator: 'lte', value: 1500 }] },
  { name: 'Hybrid cars', slug: 'hybrid-cars', showOnHomepage: true, sortOrder: 7, description: 'Petrol-electric and plug-in hybrids.',
    rules: [{ field: 'fuelType', operator: 'in', value: ['hybrid','plugin_hybrid'] }] },
  { name: 'Executive cars', slug: 'executive-cars', showOnHomepage: false, sortOrder: 8, description: 'Saloons and SUVs for business use.',
    rules: [{ field: 'price', operator: 'gte', value: 3_000_000 }] },
  { name: 'Pickups', slug: 'pickups', showOnHomepage: true, sortOrder: 9, description: 'Double cabs and workhorses.',
    rules: [{ field: 'bodyType', operator: 'eq', value: 'pickup' }] },
  { name: 'Commercial vehicles', slug: 'commercial-vehicles', showOnHomepage: false, sortOrder: 10, description: 'Trucks, vans and buses.',
    rules: [{ field: 'bodyType', operator: 'in', value: ['truck','van','bus'] }] },
  { name: 'Financing available', slug: 'financing-available', showOnHomepage: true, sortOrder: 11, description: 'Vehicles at least one partner will finance.',
    rules: [{ field: 'financingEligible', operator: 'eq', value: true }] },
];

const PLANS = [
  { id: 'free', name: 'Free', priceMonthly: 0, activeListings: 5, staffSeats: 1, boostCredits: 0, branded: false, analytics: false },
  { id: 'pro', name: 'Pro', priceMonthly: 3500, activeListings: 60, staffSeats: 5, boostCredits: 1, branded: true, analytics: true },
  { id: 'premium', name: 'Premium', priceMonthly: 9500, activeListings: null, staffSeats: 20, boostCredits: 4, branded: true, analytics: true },
];

const BOOSTS = [
  { id: 'featured-7', name: 'Homepage feature — 7 days', placements: ['featured_homepage','top_search'], durationDays: 7, price: 1500, maxConcurrentSlots: 8 },
  { id: 'top-search-14', name: 'Top of search — 14 days', placements: ['top_search'], durationDays: 14, price: 2000 },
  { id: 'urgent-7', name: 'Urgent badge — 7 days', placements: ['urgent_badge'], durationDays: 7, price: 800 },
];

const FINANCIERS = [
  { id: 'stawi-asset-finance', name: 'Stawi Asset Finance', type: 'asset_finance', email: 'leads@stawi.example',
    product: { name: 'Used vehicle asset finance', minVehicleYear: 2014, maxVehicleAgeYears: 10, minDepositPercent: 20, repaymentMonths: [12,24,36,48], annualRatePercent: 15.5, rateType: 'reducing_balance', processingFeePercent: 2.5, requiresLogbook: true } },
  { id: 'harambee-sacco', name: 'Harambee Sacco', type: 'sacco', email: 'carloans@harambee.example',
    product: { name: 'Members car loan', minVehicleYear: 2012, maxVehicleAgeYears: 12, minDepositPercent: 30, repaymentMonths: [24,36,48,60], annualRatePercent: 13, rateType: 'reducing_balance', processingFeePercent: 1.5, requiresLogbook: true } },
  { id: 'mwangaza-bank', name: 'Mwangaza Bank', type: 'bank', email: 'autofinance@mwangaza.example',
    product: { name: 'Premium vehicle finance', minVehicleYear: 2016, maxVehicleAgeYears: 8, minDepositPercent: 25, minPrice: 2_000_000, repaymentMonths: [24,36,48,60], annualRatePercent: 14.25, rateType: 'reducing_balance', processingFeePercent: 2, requiresVerifiedDealer: true } },
];

const DEMO_CAR_IMAGES = [
  'photo-1503376780353-7e6692767b70',
  'photo-1542362567-b07e54358753',
  'photo-1492144534655-ae79c964c9d7',
  'photo-1553440569-bcc63803a83d',
];

const demoImages = (title: string, index: number) => {
  const images = [0, 1, 2].map((offset, order) => {
    const photo = DEMO_CAR_IMAGES[(index + offset) % DEMO_CAR_IMAGES.length];
    const query = `auto=format&fit=crop&w=1600&q=85`;
    return {
      id: `demo-${index + 1}-${order + 1}`,
      path: `demo/${slugify(title)}-${order + 1}.jpg`,
      url: `https://images.unsplash.com/${photo}?${query}`,
      width: 1600,
      height: 1067,
      variants: {
        thumb: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=240&q=75`,
        card: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=640&q=80`,
        full: `https://images.unsplash.com/${photo}?${query}`,
      },
      order,
      alt: `${title} demo photo ${order + 1}`,
    };
  });
  return images;
};

async function run() {
  console.log('Seeding sample marketplace data…');
  let batch = adminDb.batch();
  let writes = 0;
  const flush = async () => { if (writes) { await batch.commit(); batch = adminDb.batch(); writes = 0; } };
  const set = async (path: string, id: string, data: Record<string, unknown>) => {
    batch.set(adminDb.collection(path).doc(id), data, { merge: true });
    if (++writes >= 400) await flush();
  };

  for (const loc of LOCATIONS) {
    await set(col.locations, loc.id, {
      id: loc.id, level: loc.level, name: loc.name, slug: slugify(loc.name), path: loc.path,
      parentId: loc.parentId, ancestorIds: ancestorsOf(loc.id), active: true,
      seo: { title: `Cars for sale in ${loc.name}`, description: `Browse verified car yards and vehicles in ${loc.name}.` },
      createdAt: now, updatedAt: now,
    });
  }

  for (const plan of PLANS) {
    await set(col.subscriptionPlans, plan.id, {
      id: plan.id, name: plan.name, slug: plan.id, priceMonthly: plan.priceMonthly,
      priceAnnual: plan.priceMonthly * 10, currency: 'KES',
      limits: { activeListings: plan.activeListings, staffSeats: plan.staffSeats, boostCreditsMonthly: plan.boostCredits, photosPerVehicle: plan.priceMonthly ? 20 : 8 },
      features: { brandedStorefront: plan.branded, analytics: plan.analytics, prioritySupport: plan.priceMonthly >= 9500, leadExport: plan.analytics, customDomain: plan.priceMonthly >= 9500 },
      sortOrder: PLANS.indexOf(plan), active: true, visible: true, createdAt: now, updatedAt: now,
    });
  }
  for (const boost of BOOSTS) {
    await set(col.boostProducts, boost.id, { ...boost, slug: boost.id, currency: 'KES', active: true, sortOrder: BOOSTS.indexOf(boost), createdAt: now, updatedAt: now });
  }
  for (const collection of COLLECTIONS) {
    await set(col.collections, collection.slug, {
      id: collection.slug, ...collection, mode: 'rule', manualVehicleIds: [], active: true,
      seo: { title: `${collection.name} for sale in Kenya`, description: collection.description },
      createdAt: now, updatedAt: now,
    });
  }
  for (const f of FINANCIERS) {
    await set(col.financiers, f.id, {
      id: f.id, name: f.name, slug: f.id, type: f.type, adapter: 'internal', active: true,
      contact: { email: f.email, leadRoutingEmails: [f.email] }, createdAt: now, updatedAt: now,
    });
    await set(col.financingProducts, `${f.id}-default`, {
      id: `${f.id}-default`, financierId: f.id, financierName: f.name, name: f.product.name,
      eligibility: {
        minVehicleYear: f.product.minVehicleYear, maxVehicleAgeYears: f.product.maxVehicleAgeYears,
        minPrice: (f.product as any).minPrice, requiresLogbook: (f.product as any).requiresLogbook ?? false,
        requiresVerifiedDealer: (f.product as any).requiresVerifiedDealer ?? false,
      },
      terms: {
        minDepositPercent: f.product.minDepositPercent, repaymentMonths: f.product.repaymentMonths,
        annualRatePercent: f.product.annualRatePercent, rateType: f.product.rateType,
        processingFeePercent: f.product.processingFeePercent,
      },
      active: true, sortOrder: FINANCIERS.indexOf(f), createdAt: now, updatedAt: now,
    });
  }

  const makes = Array.from(new Set(VEHICLES.map(v => v[0])));
  for (const make of makes) {
    await set(col.makes, slugify(make), { id: slugify(make), name: make, slug: slugify(make), popular: ['Toyota','Nissan','Mazda','Subaru'].includes(make), createdAt: now, updatedAt: now });
  }
  for (const [make, model] of VEHICLES) {
    await set(col.models, `${slugify(make)}-${slugify(model)}`, { id: `${slugify(make)}-${slugify(model)}`, makeId: slugify(make), make, name: model, slug: slugify(model), bodyTypes: [], createdAt: now, updatedAt: now });
  }

  const dealerRecords = DEALERS.map((d, i) => {
    const location = LOCATIONS.find(l => l.id === d.locationId)!;
    const plan = PLANS.find(p => p.id === d.plan)!;
    return {
      id: slugify(d.name), slug: slugify(d.name), name: d.name,
      tagline: `${location.name} car yard`,
      description: `${d.name} is a sample dealership used for development. Stock shown here is demonstration data.`,
      contact: { primaryPhone: d.phone, whatsappPhone: `254${d.phone.slice(1)}`, email: `sales@${slugify(d.name)}.example` },
      location: { locationId: location.id, locationPath: location.path, addressLine: `${location.name}, Kenya` },
      status: d.status,
      verification: d.status === 'verified' ? { verifiedAt: now, verifiedBy: 'seed' } : {},
      subscription: { planId: plan.id, planName: plan.name, status: 'active', activeListingLimit: plan.activeListings },
      stats: { activeListings: 0, totalLeads30d: 0 },
      ownerUserId: `seed-owner-${i + 1}`,
      createdBy: 'admin_onboarded', sampleData: true, deletedAt: null, createdAt: now, updatedAt: now,
    };
  });

  for (const dealer of dealerRecords) {
    await set(col.dealerships, dealer.id, { ...dealer, subscription: { ...dealer.subscription, activeListingLimit: dealer.subscription.activeListingLimit ?? 5 } });
    await set(col.users, dealer.ownerUserId, {
      id: dealer.ownerUserId, displayName: `${dealer.name} Owner`, email: `owner@${dealer.slug}.example`,
      platformRole: 'buyer', dealershipIds: [dealer.id], consent: { marketing: false, dataProcessing: true }, createdAt: now, updatedAt: now,
    });
    await set(col.dealershipMembers, `${dealer.id}_${dealer.ownerUserId}`, {
      id: `${dealer.id}_${dealer.ownerUserId}`, dealershipId: dealer.id, userId: dealer.ownerUserId,
      role: 'dealer_owner', permissions: [], status: 'active', createdAt: now, updatedAt: now,
    });
  }

  const verified = dealerRecords.filter(d => d.status === 'verified');
  let index = 0;
  for (const v of VEHICLES) {
    const [make, model, variant, year, price, mileage, bodyType, fuelType, transmission, seats, cc, condition] = v;
    const dealer = verified[index % verified.length];
    const location = LOCATIONS.find(l => l.id === dealer.location.locationId)!;
    const title = `${year} ${make} ${model} ${variant}`.trim();
    const id = `${slugify(`${year}-${make}-${model}`)}-${(index + 101).toString(36)}`;
    const images = demoImages(title, index);
    const isOriginalPaint = index % 4 === 0;
    const isLuxury = ['Mercedes-Benz', 'BMW'].includes(make) || price >= 4_000_000;
    const metrics = { impressions: 0, detailViews: 0, whatsappClicks: 0, callClicks: 0, financingClicks: 0, leads: 0 };
    const groupings = computeCarGroupings({ make, model, price, mileageKm: mileage, condition, usageType: condition, isOriginalPaint, isLuxury, metrics, createdAt: new Date() });
    const collectionSlugs = COLLECTIONS.filter(c => c.rules.every(rule => {
      const value = { yearOfManufacture: year, bodyType, seats, price, engineCapacityCc: cc, fuelType, financingEligible: price >= 500_000 }[rule.field as string];
      switch (rule.operator) {
        case 'gte': return (value as number) >= (rule.value as number);
        case 'lte': return (value as number) <= (rule.value as number);
        case 'in': return (rule.value as unknown[]).includes(value);
        case 'eq': return value === rule.value;
        default: return false;
      }
    })).map(c => c.slug);

    await set(col.vehicles, id, {
      id, slug: `${slugify(title)}-${slugify(location.name)}-${(index + 101).toString(36)}`,
      dealershipId: dealer.id,
      dealerSnapshot: { name: dealer.name, slug: dealer.slug, verified: dealer.status === 'verified',
        whatsappPhone: dealer.contact.whatsappPhone, primaryPhone: dealer.contact.primaryPhone,
        locationName: location.name, locationPath: location.path },
      makeId: slugify(make), make, modelId: `${slugify(make)}-${slugify(model)}`, model, variant,
      yearOfManufacture: year, price, currency: 'KES', negotiable: index % 3 !== 0,
      mileageKm: mileage, transmission, engineCapacityCc: cc, fuelType, bodyType, seats, doors: bodyType === 'pickup' ? 4 : 5,
      condition, origin: { locallyUsed: condition === 'locally_used', imported: condition === 'foreign_used' },
      usageType: condition, isOriginalPaint, isLuxury, groupings,
      dutyStatus: 'duty_paid', registrationStatus: 'registered', logbookAvailable: true,
      previousOwners: condition === 'locally_used' ? 1 : 0,
      inspection: { status: 'none' },
      financingEligible: price >= 500_000,
      title, description: `SAMPLE DATA — ${title} available at ${dealer.name}, ${location.name}. ${mileage.toLocaleString()} km, ${transmission}, ${fuelType}.`,
      features: ['Alloy rims', 'Reverse camera', 'Bluetooth audio', 'Dual airbags'].slice(0, 2 + (index % 3)),
      images, coverImage: images[0], videoUrl: null,
      location: { locationId: location.id, locationPath: location.path, locationName: location.name },
      collectionSlugs, boost: { active: false, placements: [] },
      status: 'active',
      metrics,
      searchTokens: tokens(make, model, variant, year, bodyType, fuelType, location.name),
      sampleData: true,
      createdAt: now, updatedAt: now, publishedAt: now,
      lastConfirmedAt: now,
      expiresAt: new Date(Date.now() + 45 * 86_400_000),
    });
    index++;
  }

  await flush();
  console.log(`Seeded ${LOCATIONS.length} locations, ${DEALERS.length} dealerships, ${VEHICLES.length} sample vehicles, ${COLLECTIONS.length} collections, ${FINANCIERS.length} financiers.`);
  console.log('All inventory is marked sampleData: true.');
}

run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
