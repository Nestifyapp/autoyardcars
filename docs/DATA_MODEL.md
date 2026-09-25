# Firestore data model

Collections are shaped around query patterns, not around a relational schema. Top-level
collections carry `dealershipId` / `vehicleId` / `userId` so marketplace-wide and admin
queries stay possible; subcollections are used only where data is never queried across
tenants.

## Collection map

| Collection | Doc ID | Why top-level | Key queries |
| --- | --- | --- | --- |
| `users` | Auth uid | Admin needs cross-user queries | by uid |
| `dealerships` | slug | Public storefronts, admin listing | status + location, status + activeListings |
| `dealership_members` | `{dealershipId}_{userId}` | Deterministic ID lets security rules check membership with one `get()` — no queries in rules | userId + status, dealershipId + status |
| `locations` | slug-ish id | Self-referencing tree | parentId, `ancestorIds` array-contains, `path` prefix |
| `vehicles` | generated | The marketplace reads across all tenants | ~20 filter/sort combinations, see `firestore.indexes.json` |
| `vehicle_media` | generated | Canonical media record; vehicle carries the ordered copy | vehicleId |
| `makes`, `models` | slug | Filter dropdowns, SEO pages | popular, makeId |
| `marketplace_collections` | slug | Intent browsing | active + showOnHomepage + sortOrder |
| `leads` | generated | Dealer CRM + admin aggregate | dealershipId + status + createdAt |
| `lead_events` | generated | Audit trail per lead | leadId + createdAt |
| `favourites` | `{userId}_{vehicleId}` | Prevents duplicates by construction | userId + createdAt |
| `financiers`, `financing_products` | slug / generated | Rule matching at render time | active + sortOrder |
| `financing_applications` | generated | Admin reconciliation per partner | financierId + createdAt, outcome.status |
| `subscription_plans`, `boost_products` | slug | Admin-priced, never hard-coded | active + sortOrder |
| `dealer_subscriptions`, `vehicle_boosts` | generated | Billing history retained | dealershipId + status, status + endsAt |
| `payment_transactions` | generated | Reconciliation, disputes | `providerRefs.checkoutRequestId`, dealershipId + status |
| `listing_reports` | generated | Moderation queue | status + createdAt |
| `admin_audit_logs` | generated | Append-only | actorId, targetType |
| `analytics_events` | generated | Server-side truth for dealer reporting and billing | dayKey + type, dealershipId + dayKey |

## Denormalisation contract

A vehicle document carries a `dealerSnapshot` (name, slug, logo, verified, phones,
location) so a marketplace grid of 24 cards is 24 reads, not 48. The canonical record
stays in `dealerships`.

When a dealership's name, slug, verification status or phone numbers change, the
`onDealershipUpdated` Cloud Function fans the change out to that dealer's vehicles in
batches of 400. Snapshot fields are never written by the client — security rules reject
vehicle writes that change `dealershipId`, and the fan-out runs with Admin SDK privileges.

The same pattern applies to `leads.vehicleSnapshot` (title, slug, price, cover image),
which is deliberately frozen at lead creation: a dealer looking at a six-week-old lead
should see the price the buyer actually saw.

## Timestamps and deletion

All documents use `FieldValue.serverTimestamp()` for `createdAt` / `updatedAt`. Vehicles
additionally track `publishedAt`, `soldAt`, `lastConfirmedAt` and `expiresAt`.

Nothing commercially meaningful is hard-deleted. Dealerships use `deletedAt`, vehicles move
to `archived`, and sold vehicles keep their full record so dealer analytics and lead
history remain intact while disappearing from active results.

## Inventory freshness

`lastConfirmedAt` drives the honesty of the whole marketplace. A scheduled function
(`sweepStaleInventory`, daily) prompts dealers to confirm listings older than 21 days and
moves listings past `expiresAt` to `expired`. Cards display what is true — "Confirmed this
week" or "Availability not confirmed recently" — rather than implying freshness.

## Atomicity

- Lead creation writes the lead, its event, the vehicle counters and the analytics event in
  one batch.
- Payment entitlement (subscription period extension or boost activation plus the vehicle's
  boost field) runs in a Firestore transaction.
- Plan limit checks use an aggregation `count()` query inside the publish transition.
