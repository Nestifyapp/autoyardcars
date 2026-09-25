# Role and permission matrix

Platform roles live in Firebase custom claims (`super_admin`). Dealership roles live in
`dealership_members` so team changes never require token refresh or claim bloat.

| Capability | Visitor | Registered buyer | Dealer sales | Dealer manager | Dealer owner | Super admin |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| Browse marketplace, view listings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Contact dealer (WhatsApp / call / test drive) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit a financing application | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Favourites, saved searches | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create / edit own-yard vehicles | — | — | ✅ | ✅ | ✅ | ✅ |
| Publish a listing (subject to plan limit) | — | — | — | ✅ | ✅ | ✅ |
| Delete a listing | — | — | — | — | — | ✅ |
| Read / update own-yard leads | — | — | ✅ | ✅ | ✅ | ✅ |
| View own-yard analytics | — | — | — | ✅ | ✅ | ✅ |
| Edit dealership profile | — | — | — | ✅ | ✅ | ✅ |
| Invite or remove staff | — | — | — | — | ✅ | ✅ |
| Buy subscription or boosts | — | — | — | — | ✅ | ✅ |
| Change own verification status or plan limits | — | — | — | — | ❌ | ✅ |
| See another dealership's anything | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Verify / suspend dealerships | — | — | — | — | — | ✅ |
| Moderate listings, resolve reports | — | — | — | — | — | ✅ |
| Configure collections, locations, plans, boosts, financiers | — | — | — | — | — | ✅ |
| Record financing application outcomes | — | — | — | — | — | ✅ |
| Read audit logs, analytics events | — | — | — | — | — | ✅ |

Enforcement happens in three places, and the UI is not one of them:

1. `firestore.rules` — membership checked via `dealership_members/{dealershipId}_{uid}`.
2. `assertTenantPermission(actor, dealershipId, permission)` on every server mutation, where
   `dealershipId` is read from the stored resource, never from the request body.
3. Privileged workflows (payments, boost activation, financing routing, moderation,
   aggregation, cross-tenant reads) are Admin SDK only — clients cannot write those
   collections at all.
