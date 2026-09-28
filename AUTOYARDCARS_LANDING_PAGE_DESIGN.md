# Autoyardcars Landing Page Design

## Purpose

Make vehicle discovery the homepage's primary job: help buyers search live Kenyan inventory, browse by vehicle type, and explore useful groups without changing the marketplace's existing data or business rules.

## Page Hierarchy

The shared site layout renders the global header, homepage content, and global footer in that order. Homepage content is organized as:

1. Compact hero with a real marketplace search and vehicle imagery.
2. Compact, horizontally navigable vehicle types.
3. Recently listed vehicles and qualifying vehicle-discovery groups.
4. A concise trust/value section.
5. A dealer-focused listing call to action.

The existing header and footer are shared across routes; their redesign must keep their links valid outside the homepage too.

## Header

Use a light, compact header with the brand, links to `/cars`, `/sell/dealer`, `/financing`, and the homepage trust section, plus the existing dealer account entry at `/yard/login`. On small screens, keep the brand and account access visible and provide an accessible collapsible navigation menu. There is no buyer account, favorites, or saved-cars feature in the current application; do not present decorative controls for them.

## Hero and Search

Use a light two-column desktop composition: concise marketplace copy and search on the left, vehicle imagery on the right. Stack it on mobile and keep its height controlled. Prefer the first live listing's cover image when one is available; use the already configured Unsplash vehicle image only as a visual fallback, never as a listing or inventory record.

Reuse `VehicleSearch` and its `/cars` form action. The search query is submitted as `q`; the cars page turns URL parameters into `VehicleQuery` and the Firestore search provider applies supported filters. Do not add controls that do not submit a supported filter.

## Vehicle Type Navigation

Replace the large hero tiles with a compact, horizontally scrollable row. Body-type links use `/cars?bodyType=...`; electric vehicles use `/cars?fuelType=electric`; the final browse-all link uses `/cars`. These parameters are already supported by the cars page and search provider.

## Smart Group Architecture

The server-rendered homepage uses `getSearchProvider().searchVehicles()` for both recent inventory and grouping rows. The Firestore provider restricts public search to active vehicles and computes discoverability tags through `computeCarGroupings`. Each grouping query is isolated in its own `try/catch`; a failed query does not prevent the rest of the page rendering. The page revalidates every 120 seconds.

Keep group display metadata together in an ordered configuration (id and customer-facing title) rather than scattering order and labels across page markup. `GroupingSection` remains the reusable row component and `VehicleCard` remains the shared inventory card. Each row links to `/cars?grouping=<id>` so the existing URL filter performs the actual filtering.

### Smart Group Configuration

| Customer-facing title | Group id | Existing matching behavior |
| --- | --- | --- |
| Hot today | `hot_today` | Derived when detail views reach 25 or leads reach 3. |
| Fresh arrivals | `fresh_import` | Derived for foreign-used vehicles created within the last 14 days. This is not a claim that the vehicle arrived by ship. |
| Low-mile gems | `low_mileage` | Derived when mileage is at most 50,000 km. |
| Luxury & Executive | `luxury_executive` | Derived from the luxury flag, configured premium makes, or price of at least KES 4,000,000. |
| Locally loved | `locally_used` | Derived from locally-used condition/usage type. |
| Ride-share ready | `uber_ready` | Yard-supplied tag; no automatic vehicle eligibility rule currently exists. |
| Original paint | `original_paint` | Derived from the original-paint flag. |

Group order is configured in the homepage presentation layer, with Hot today, Fresh arrivals, Low-mile gems, Luxury & Executive, Locally loved, Ride-share ready, and Original paint as the intended priority. Do not change the tag computation to support presentation changes.

## Group Display Rules

Render a group only when at least three matching vehicles are returned. Display no more than four cards per group. Empty, under-threshold, or failed groups render no heading or empty shell. The existing data source is server-rendered, so there is no client loading phase on the homepage; loading skeletons belong to the existing client-navigation/search patterns, not to a fake homepage fetch.

On mobile and narrow tablet widths, each group is a horizontal scroll row with a prominent card and a visible portion of the next card. On desktop, use a four-column grid. Preserve keyboard focus visibility and native touch scrolling.

## Vehicle Card

Use one reusable card component across recent inventory, grouping rows, and other marketplace pages. Link the card to `/cars/[slug]`. Show optimized cover imagery with stable aspect ratio and a neutral missing-photo fallback; use meaningful alt text. Show title, price, year, and only metadata that exists (for example mileage, transmission, and location). Show a verified marker only when `dealerSnapshot.verified` is true. Do not render empty values or fabricate dealer/location data. Keep any card-level future favorite control out until a real favorites flow exists.

## Recent Vehicles

Keep a recent-stock section as part of discovery. It uses the same Firestore-backed search provider with `sort: newest` and a limit of eight. Empty inventory gets a concise, accurate empty state; it must not imply fake sample inventory will automatically appear.

## Why Autoyardcars

Keep this section compact and grounded in implemented features: verified yard profiles, detailed listing information, direct dealer contact, and financing estimates. Avoid claims about comparison tools or guarantees that do not exist.

## Sell Your Car CTA

Use the existing `/sell/dealer` page as the CTA destination. The current seller flow is for dealers and yards, not a separate private-seller flow; phrase the CTA accordingly and do not link to a nonexistent listing form.

## Footer

Use a responsive, light marketplace footer with links grouped around buying, selling/dealers, and financing/company information. Only include implemented routes or real section anchors. There is currently no saved-cars, help-centre, contact-us, terms, or privacy page in the route tree, so do not add dead links for them.

## Responsive Behavior

- Desktop: constrained content width, balanced hero with large vehicle imagery, four cards per discovery row, and full navigation.
- Tablet: stacked or proportionally narrowed hero, compact type controls, and two or three visible cards in horizontal rows.
- Mobile: compact header, stacked hero, full-width search, horizontally scrollable type controls and group rows, one prominent card with a partial next card, and no page-level horizontal overflow.

Use stable image aspect ratios, responsive `sizes`, and lazy loading for below-the-fold imagery through Next Image defaults. Avoid client-side duplicate inventory requests.

## Loading, Empty, and Error Behavior

Homepage inventory is loaded on the server. Recent-stock and each group query are guarded independently; search errors are logged and the page continues with the remaining results. Recent stock has an explicit empty state. Empty and failed groups are omitted. The cars page retains its existing search skeleton and no-results state.

## Accessibility

Use semantic section headings, named navigation landmarks, visible focus states, descriptive image alt text, and labels for icon-only controls. Use native links for navigation and a keyboard-operable mobile menu. Maintain readable contrast and touch-friendly targets. Do not create inaccessible or nonfunctional favorite controls.

## Existing Functionality Preserved

- Firestore search provider, active inventory constraint, query/filter parsing, and URL-based search.
- Vehicle domain model, grouping derivation, card-to-detail links, financing flow, and dealer contact behavior.
- Dealer signup/login and listing routes.
- Shared site layout and the global header/footer placement.
- Existing marketplace APIs; the homepage redesign does not require new API endpoints or schema fields.

## Components and Data Dependencies

Existing components expected to be reused or refined: `SiteHeader`, `SiteFooter`, `VehicleSearch`, `BodyTypeTiles` (or its replacement type-navigation component), `GroupingSection`, and `VehicleCard`.

Data comes from `src/lib/services/search`, which currently selects `firestoreSearchProvider`; grouping tags are computed in `src/lib/domain/groupings.ts`. Search/listing APIs remain unchanged. The homepage uses these server-side services directly rather than making duplicate browser API requests.

## Routing Behavior

- Search form: `/cars?q=<query>`.
- Vehicle type: `/cars?bodyType=<body-type>` or `/cars?fuelType=electric`.
- Group row: `/cars?grouping=<group-id>`.
- Browse all: `/cars`.
- Dealer CTA: `/sell/dealer`; dealer account: `/yard/login` or `/yard/signup`.
- Individual card: `/cars/<vehicle-slug>`.

## Future Extension Points

Add a buyer favorites feature only when its persistence, authentication/guest behavior, and routes are implemented. Add a private-seller journey only when the product supports it. Ride-share eligibility needs a documented server-side rule if it is to be calculated instead of manually tagged. Search can continue to use the provider abstraction if inventory volume later requires a dedicated search service.

## Components Modified During Implementation

- `src/app/page.tsx`: live-data hero, recent-stock section, grouping query orchestration, trust section, and dealer CTA.
- `src/app/layout.tsx`: global document metadata aligned with the configurable brand.
- `src/components/SiteHeader.tsx`: compact shared navigation and native responsive menu.
- `src/components/SiteFooter.tsx`: light responsive footer with existing destinations only.
- `src/components/marketplace/VehicleSearch.tsx`: styled existing search form and compact type/filter links.
- `src/components/marketplace/GroupingSection.tsx`: ordered customer-facing group metadata, three-result threshold, and responsive row layout.
- `src/components/marketplace/VehicleCard.tsx`: consistent responsive listing card with optional data handling and verified-seller badge.

No backend schema, marketplace API, or authentication behavior was changed for this redesign.