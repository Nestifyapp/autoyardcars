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
| 65 composite indexes | `firestore.indexes.json` |
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
