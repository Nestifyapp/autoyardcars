# Motoyard

A multi-tenant vehicle marketplace and dealer operating system for Kenya. Launching with
independent car yards on Kangundo Road, Nairobi — built so geography is data, never code.

> **Motoyard is a placeholder name.** Rename the product by changing
> `NEXT_PUBLIC_BRAND_NAME` in the environment. No route, collection, component or
> database field carries the brand.

**Buyer promise:** Discover cars. Compare options. Find financing. Contact verified dealers.

## What is in this repository

| Area | Path |
| --- | --- |
| Domain model (all 25 collections typed) | `src/lib/domain/types.ts` |
| Financing engine (pure, tested) | `src/lib/domain/financing.ts` |
| Collection rule engine (admin-configurable) | `src/lib/domain/collections.ts` |
| Role matrix and server-side guards | `src/lib/auth/permissions.ts` |
| Firebase client + Admin SDK, actor resolution | `src/lib/firebase/` |
| Search provider abstraction (Firestore today, Algolia later) | `src/lib/services/search/` |
| M-Pesa Daraja + simulated fallback | `src/lib/services/payments/` |
| WhatsApp deep links, email/SMS providers | `src/lib/services/messaging/` |
| Financier adapters (`submitApplication`, `checkEligibility`, `getQuote`) | `src/lib/services/financing/` |
| Subscription enforcement, payment entitlement | `src/lib/repositories/subscriptions.ts` |
| Lead capture with attribution | `src/lib/repositories/leads.ts`, `src/app/api/leads/` |
| SEO metadata, JSON-LD, indexing policy, sitemap | `src/lib/seo/`, `src/app/sitemap.ts` |
| Security rules | `firestore.rules`, `storage.rules` |
| 64 composite indexes + 3 field overrides | `firestore.indexes.json` |
| Seed data (6 yards, 26 vehicles, 11 collections, 3 financiers) | `scripts/seed.ts` |
| Tests | `tests/` |

## Local setup

```bash
npm install
cp .env.example .env.local          # defaults run fully simulated — no credentials needed
npm run emulators                   # Auth 9099, Firestore 8080, Storage 9199, UI 4000
npm run seed                        # sample marketplace data
npm run dev                         # http://localhost:3000
npm test                            # domain + permission tests
```

With `NEXT_PUBLIC_USE_EMULATORS=true` the app talks to the emulator suite, so nothing
touches a real Firebase project during development.

### Deploying Firebase configuration

```bash
firebase use <project-id>
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

Indexes take a few minutes to build; marketplace filters return errors with index
creation links until they finish.

### Granting a super admin

Platform roles live in custom claims, tenancy lives in Firestore.

```bash
node -e "require('firebase-admin').initializeApp();\
require('firebase-admin').auth().setCustomUserClaims('<uid>',{super_admin:true})"
```

## Design decisions worth knowing

- **Nothing about Kangundo Road is hard-coded.** Locations are a self-referencing tree
  (`country → county → city → area`) with a `path` string, so `ke/nairobi` matches every
  Nairobi listing by prefix. Adding Mombasa or Eldoret is a data entry task.
- **Ride-hailing eligibility is a rule document, not an `if` statement.** Regulations
  change; an admin edits `marketplace_collections/ride-hailing-friendly` and the next
  vehicle write re-resolves membership.
- **A WhatsApp click is an enquiry, not a sale.** Click-to-call and click-to-WhatsApp are
  counted separately from any confirmed outcome, and nothing claims a conversion the data
  cannot support.
- **Payment buttons grant nothing.** Subscriptions and boosts activate only in the
  provider callback, inside a transaction, and repeated callbacks are idempotent.
- **A dealer can create a draft, not a published listing.** Publishing is a server
  transition so plan limits, verification status and moderation cannot be bypassed by
  calling Firestore directly.
- **Estimates are labelled estimates.** The financing calculator never shows anything that
  could be read as an approval.

## Simulated integrations

Everything runs without third-party credentials. See `docs/INTEGRATIONS.md` for what to
swap in for production and what each fallback does meanwhile.

## Database and query guide

Motoyard uses **Cloud Firestore**, not SQL tables or Prisma. The TypeScript interfaces in
`src/lib/domain/types.ts` are the application schema. Firestore is document-oriented, so
the design keeps frequently queried records in top-level collections and denormalises a
small amount of display data for fast marketplace reads.

### Collection schema

| Collection | Document identity | Main purpose and important fields |
| --- | --- | --- |
| `users` | Firebase Auth UID | Platform role, dealership IDs, consent, profile data |
| `dealerships` | Generated ID; public slug is stored in the document | Yard profile, verification status, contacts, location, subscription, stats |
| `dealership_members` | `{dealershipId}_{userId}` | Tenant membership, role, explicit permissions, active/revoked status |
| `locations` | Location ID | Country/county/city/area tree, `path`, ancestors, SEO data |
| `vehicles` | Generated ID | Listing data, tenant ID, dealer snapshot, price, mileage, vehicle specs, status, images, grouping tags, metrics, timestamps |
| `vehicle_media` | Generated ID | Canonical media records associated with a vehicle |
| `makes`, `models` | Slug | Vehicle reference data and filter/SEO support |
| `marketplace_collections` | Collection slug | Admin-configured intent groups and rule definitions |
| `leads` | Generated ID | Buyer enquiry, vehicle/dealer attribution, status, consent, timestamps |
| `lead_events` | Generated ID | Append-only lead audit history |
| `favourites` | `{userId}_{vehicleId}` | One favourite per user/listing by deterministic ID |
| `financiers`, `financing_products` | Slug/generated | Financing providers and eligibility rules |
| `subscription_plans`, `boost_products` | Slug | Admin-priced dealer plans and promotion products |
| `dealer_subscriptions`, `vehicle_boosts` | Generated ID | Subscription and boost lifecycle records |
| `payment_transactions` | Generated ID | Provider references, callbacks, reconciliation, payment status |
| `financing_applications` | Generated ID | Buyer financing applications and partner outcomes |
| `listing_reports` | Generated ID | Moderation queue |
| `admin_audit_logs` | Generated ID | Administrative audit trail |
| `analytics_events` | Generated ID | Server-side events used for reporting and attribution |

### Vehicle document

The marketplace-critical `vehicles` fields are:

- Identity and tenancy: `id`, `slug`, `dealershipId`, `dealerSnapshot`.
- Vehicle facts: `make`, `model`, `variant`, `yearOfManufacture`, `price`, `mileageKm`,
  `transmission`, `fuelType`, `bodyType`, colours, seats, doors and `condition`.
- Yard and grouping metadata: `usageType`, `isOriginalPaint`, `isLuxury`, `groupings`,
  `isSponsored`, `collectionSlugs` and `boost`.
- Lifecycle: `status`, `createdAt`, `updatedAt`, `publishedAt`, `soldAt`,
  `lastConfirmedAt` and `expiresAt`.
- Marketplace data: `images`, `coverImage`, `location`, `financingEligible`,
  `searchTokens` and the `metrics` counters.

Older vehicle records may not contain the newer grouping fields. The read path applies
`computeCarGroupings()` in `src/lib/domain/groupings.ts`, so missing fields use safe
defaults instead of breaking cards or search results.

### How data is created

1. **Yard onboarding**: Firebase Auth creates the user. `/api/yard/onboarding` then writes
   a pending `dealerships` document, an active `dealer_owner` membership, and the user's
   dealership ID in one batch. Yard verification remains a separate admin action.
2. **Vehicle drafts**: `/api/yard/listings` calls the tenant repository in
   `src/lib/repositories/vehicles.ts`. The server takes the dealership from the session,
   never from the request body, creates a `draft`, computes grouping tags, and writes
   timestamps and counters.
3. **Vehicle updates**: `/api/yard/listings/[id]` checks ownership and permissions before
   updating. Delete is an archive transition, not a hard delete.
4. **Buyer leads**: `/api/leads` validates the request, applies an IP rate limit, reads
   the dealership from the vehicle when available, and atomically writes the lead,
   lead event, vehicle metrics and analytics event.
5. **Seed/demo data**: `scripts/seed.ts` writes locations, yards, memberships, plans,
   collections, financiers and 26 sample vehicles. Sample vehicles are marked
   `sampleData: true`.
6. **Payments**: payment callbacks update subscriptions or boosts in a Firestore
   transaction. Client requests never grant entitlements directly.

All important writes use Admin SDK repositories or server routes. Firestore rules enforce
the same tenant boundary for direct client access: active membership is required, and a
normal dealer can create only draft inventory.

### How marketplace queries work

The marketplace uses the provider abstraction in `src/lib/services/search/`. The current
provider is native Firestore:

```ts
adminDb.collection('vehicles')
  .where('status', '==', 'active')
  .where('bodyType', '==', 'suv')
  .orderBy('publishedAt', 'desc')
  .limit(24)
```

The public API accepts the same query concepts through `/api/cars`:

```text
/api/cars?grouping=luxury_executive
/api/cars?usage_type=locally_used
/api/cars?bodyType=suv&sort=price_asc
/api/cars?collection=family-cars
/api/cars?dealershipId=<yard-id>
```

The `/cars` page maps URL parameters into `VehicleQuery`. Supported filters include make,
model, price range, body type, fuel, transmission, location prefix, dealership,
collection, grouping, usage type, financing eligibility, verified dealer and sponsorship.
Search text uses the first normalized token in `searchTokens`.

### Why the indexes exist

Firestore automatically indexes individual fields. `firestore.indexes.json` adds composite
indexes for queries that combine equality filters with sorting or multiple filter fields.
The current configuration contains **64 composite indexes**:

| Collection group | Composite indexes | Typical query purpose |
| --- | ---: | --- |
| `vehicles` | 27 | Active stock by price, mileage, make, model, body type, fuel, transmission, financing, dealer verification and collections |
| `leads` | 5 | Dealer lead queues by status/time, source/time and vehicle/time |
| `financing_applications` | 3 | Partner queues and application outcomes |
| `vehicle_boosts` | 3 | Active boosts by dealership, placement and expiry |
| `dealerships` | 3 | Verified/pending yards and location/status views |
| `locations` | 3 | Active location tree and prefix navigation |
| `analytics_events` | 3 | Daily event aggregation by dealership/type |
| `admin_audit_logs` | 2 | Actor and target audit views |
| `dealer_subscriptions` | 2 | Dealer subscription status and renewal views |
| `dealership_members` | 2 | Active membership lookup patterns |
| `lead_events` | 2 | Lead history ordered by creation time |
| `marketplace_collections` | 2 | Active homepage collections ordered for display |
| `payment_transactions` | 2 | Dealer payment queues and callback reconciliation |
| `financing_products` | 2 | Active financier products ordered for selection |
| `listing_reports` | 2 | Moderation queues by status/time |
| `favourites` | 1 | User favourites ordered by creation time |

There are also 3 field overrides that disable automatic indexing for large or opaque
fields: vehicle descriptions, analytics metadata and raw payment callbacks. Do not add a
single-field entry to this file; Firestore rejects redundant single-field indexes. Add a
composite index only when a real query requires a combination that Firestore cannot serve
with its automatic indexes.

### Query limitations and operational notes

- Firestore permits range filters on only one field per query. Year, mileage and seat
  constraints are therefore applied in memory after the provider fetches up to 60 records.
  This is acceptable for the MVP but can under-fill result pages at larger volume.
- Grouping filters are computed in memory for backward compatibility with old vehicles.
  New writes persist `groupings`, so a future migration can use `array-contains` indexes.
- Location prefix searches add a location range and order. Some combinations with other
  sorts need additional composite indexes as the query catalog grows.
- Cursor pagination stores the current sort value in a base64 token. If multiple
  `orderBy` fields are introduced, the cursor must encode all ordered values.
- Index deployment is separate from application deployment:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Index builds can take time in a production Firebase project. A missing index error from
Firestore includes a console link for the exact query, but the index should be reviewed
and added deliberately rather than blindly committing every suggested index.
