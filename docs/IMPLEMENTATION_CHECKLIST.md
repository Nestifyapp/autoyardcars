# Phased implementation checklist

Status against the build order. ✅ in this repository, ◻ remaining.

**1. Foundation and design system** — ✅ tokens, typography, card/CTA patterns, mobile-first
layout; ◻ full shadcn component set.

**2. Firebase configuration** — ✅ `firestore.rules`, `storage.rules`, 65 composite indexes,
emulator config, typed model for all 25 collections, seed script.

**3. Auth / RBAC / multi-tenancy** — ✅ role matrix, `assertTenantPermission`, actor
resolution from session cookie, membership-based rules; ◻ sign-in screens, session cookie
exchange route, invitation acceptance flow.

**4. Dealer onboarding** — ✅ states (pending/verified/suspended/rejected), private
verification fields, admin-created dealership support; ◻ onboarding wizard UI.

**5. Vehicle CRUD and media** — ✅ schema, workflow states, draft-only client creation,
Storage rules with MIME/size validation; ◻ upload UI with drag-reorder, `sharp` resize
pipeline, draft autosave.

**6. Public marketplace and search** — ✅ provider abstraction, Firestore provider, URL-synced
filters, cursor pagination, empty states, indexing policy.

**7. Vehicle details** — ✅ gallery, specs, dealer identity, financing estimate, similar
vehicles, sticky mobile CTAs, sold-state handling.

**8. Dealer storefronts** — ✅ routing, denormalised snapshot, metadata; ◻ storefront
hero/branding editor, QR download.

**9. Lead capture** — ✅ validated rate-limited API, attribution, atomic counters, lead
events; ◻ CRM board UI.

**10. Admin moderation** — ✅ audit log model, report model, server-only write paths;
◻ admin dashboards.

**11. Financing engine** — ✅ rule matching, calculator, adapters, routing, outcome recording
fields, disclaimers.

**12. Subscriptions and boosts** — ✅ plans, limits enforced server-side, boosts as campaigns
with placements and expiry; ◻ dealer billing screens.

**13. Payments** — ✅ Daraja STK push, simulated provider with real callback, idempotent
reconciliation, transaction records.

**14. Analytics** — ✅ event taxonomy, server-side storage, `dayKey` partitioning;
◻ aggregation function and dealer charts.

**15. SEO** — ✅ dynamic metadata, Vehicle JSON-LD, sitemap, robots, canonicals, thin-page
policy; ◻ editorial landing pages.

**16. Testing and hardening** — ✅ 24 passing domain/permission tests; ◻ rules unit tests
against the emulator, end-to-end acceptance suite.

## Acceptance scenarios and where they are enforced

| Scenario | Mechanism |
| --- | --- |
| Dealer A cannot access Dealer B's records | `assertTenantPermission` + `dealership_members` rule check |
| Inventory appears publicly only when eligible | Rules restrict client-created status to `draft`; publish is a server transition |
| Subscription restrictions enforced server-side | `assertCanPublishAnotherListing` with aggregation count |
| Boosts begin and expire correctly | `applySuccessfulPayment` sets `startsAt`/`endsAt`; daily sweep expires |
| WhatsApp attribution is recorded | `/api/leads` writes lead + event + counter before redirect |
| Sold vehicles disappear from active inventory | Search filters `status == 'active'`; record retained for analytics |
| SEO metadata changes per vehicle/dealer/location | `src/lib/seo/metadata.ts` |
