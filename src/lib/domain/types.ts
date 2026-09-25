/**
 * Motoyard domain model.
 * Every type here maps to a Firestore collection documented in docs/DATA_MODEL.md.
 * Nothing in this file is Kenya-specific or Kangundo-Road-specific: geography is data.
 */
import type { Timestamp } from 'firebase-admin/firestore';

export type ISO = string;
export type Ts = Timestamp | Date | ISO;

/* ------------------------------ Identity & roles ------------------------------ */

export type PlatformRole = 'buyer' | 'super_admin' | 'platform_staff';
export type DealerRole = 'dealer_owner' | 'dealer_manager' | 'dealer_sales';

export interface User {
  id: string;                 // === Firebase Auth uid
  email?: string;
  phone?: string;
  displayName?: string;
  photoUrl?: string;
  platformRole: PlatformRole; // mirrored into custom claims for super_admin only
  dealershipIds: string[];    // denormalised for "which tenants am I in" queries
  consent: { marketing: boolean; dataProcessing: boolean; capturedAt?: Ts };
  createdAt: Ts;
  updatedAt: Ts;
  disabled?: boolean;
}

/** dealership_members/{dealershipId}_{userId} — canonical tenancy edge. */
export interface DealershipMember {
  id: string;
  dealershipId: string;
  userId: string;
  role: DealerRole;
  permissions: DealerPermission[]; // explicit grants override role defaults
  invitedBy?: string;
  invitedEmail?: string;
  status: 'invited' | 'active' | 'revoked';
  createdAt: Ts;
  updatedAt: Ts;
}

export type DealerPermission =
  | 'inventory:read' | 'inventory:write' | 'inventory:publish' | 'inventory:delete'
  | 'leads:read' | 'leads:write'
  | 'analytics:read'
  | 'dealership:edit' | 'team:manage'
  | 'billing:manage';

/* --------------------------------- Locations --------------------------------- */

export type LocationLevel = 'country' | 'county' | 'city' | 'area';

/** locations/{id} — a single self-referencing tree: Country > County > City > Area. */
export interface LocationNode {
  id: string;
  level: LocationLevel;
  name: string;              // "Kangundo Road"
  slug: string;              // "kangundo-road"
  path: string;              // "ke/nairobi/nairobi/kangundo-road" — prefix queries
  ancestorIds: string[];     // array-contains queries for "everything under Nairobi"
  parentId: string | null;
  coordinates?: { lat: number; lng: number };
  seo?: { title?: string; description?: string; intro?: string };
  vehicleCount?: number;     // maintained by aggregation function
  dealerCount?: number;
  active: boolean;
  createdAt: Ts;
  updatedAt: Ts;
}

/* -------------------------------- Dealerships -------------------------------- */

export type DealershipStatus = 'pending_verification' | 'verified' | 'suspended' | 'rejected';

export interface Dealership {
  id: string;
  name: string;
  slug: string;                       // /yards/kangundo-motors
  tagline?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  contact: {
    primaryPhone: string;
    whatsappPhone: string;            // E.164 without '+', e.g. 2547XXXXXXXX
    email?: string;
    website?: string;
  };
  location: {
    locationId: string;               // → locations/{id} (area level)
    locationPath: string;             // denormalised for filtering
    addressLine?: string;
    coordinates?: { lat: number; lng: number };
    directionsNote?: string;
  };
  openingHours?: Record<'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun', { open: string; close: string; closed?: boolean }>;
  social?: { facebook?: string; instagram?: string; tiktok?: string; x?: string };
  status: DealershipStatus;
  verification: {
    verifiedAt?: Ts;
    verifiedBy?: string;
    /** PRIVATE. Never returned to public reads — see firestore.rules. */
    kraPin?: string;
    businessRegistrationNumber?: string;
    idDocumentPath?: string;
    notes?: string;
  };
  subscription: {
    planId: string;
    planName: string;                 // denormalised for portal display
    status: 'active' | 'past_due' | 'cancelled' | 'trialing';
    activeListingLimit: number;
    currentPeriodEnd?: Ts;
  };
  stats: { activeListings: number; totalLeads30d: number; avgResponseMinutes?: number };
  ownerUserId: string;
  createdBy: 'self_signup' | 'admin_onboarded';
  createdAt: Ts;
  updatedAt: Ts;
  deletedAt?: Ts | null;              // soft delete
}

/* ---------------------------------- Vehicles ---------------------------------- */

export type VehicleStatus =
  | 'draft' | 'pending_approval' | 'active' | 'reserved'
  | 'sold' | 'rejected' | 'expired' | 'archived';

export type Transmission = 'automatic' | 'manual' | 'cvt' | 'dct' | 'amt';
export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric' | 'plugin_hybrid' | 'lpg';
export type Drivetrain = 'fwd' | 'rwd' | 'awd' | '4wd';
export type BodyType =
  | 'hatchback' | 'sedan' | 'saloon' | 'suv' | 'crossover' | 'station_wagon'
  | 'pickup' | 'van' | 'minivan' | 'bus' | 'truck' | 'coupe' | 'convertible';
export type VehicleCondition = 'brand_new' | 'foreign_used' | 'locally_used';
export type VehicleUsageType = 'brand_new' | 'foreign_used' | 'locally_used';
export type VehicleGrouping =
  | 'uber_ready' | 'low_mileage' | 'fresh_import' | 'hot_today'
  | 'locally_used' | 'luxury_executive' | 'under_50k_miles' | 'original_paint';

export interface Vehicle {
  id: string;
  slug: string;                       // 2018-toyota-axio-hybrid-kangundo-road-a1b2
  dealershipId: string;               // tenant key — never trusted from client input

  /** Denormalised dealer snapshot so a listing card is a single read. */
  dealerSnapshot: {
    name: string; slug: string; logoUrl?: string;
    verified: boolean; whatsappPhone: string; primaryPhone: string;
    locationName: string; locationPath: string;
  };

  makeId: string; make: string;
  modelId: string; model: string;
  variant?: string;
  yearOfManufacture: number;
  yearOfRegistration?: number;

  price: number;                      // minor unit not used; KES whole shillings
  currency: string;
  negotiable: boolean;
  priceHistory?: { price: number; at: Ts }[];

  mileageKm?: number;
  transmission: Transmission;
  engineCapacityCc?: number;
  fuelType: FuelType;
  drivetrain?: Drivetrain;
  bodyType: BodyType;
  exteriorColour?: string;
  interiorColour?: string;
  seats?: number;
  doors?: number;
  condition: VehicleCondition;
  /** Optional grouping metadata; older listings may not have these fields. */
  usageType?: VehicleUsageType;
  isOriginalPaint?: boolean;
  isLuxury?: boolean;
  groupings?: VehicleGrouping[];
  isSponsored?: boolean;

  origin: { locallyUsed: boolean; imported: boolean; importedFrom?: string };
  dutyStatus?: 'duty_paid' | 'duty_not_paid' | 'not_applicable';
  registrationStatus?: 'registered' | 'unregistered';
  /** PRIVATE: dealer-only stock reference. Not exposed on public documents. */
  stockReference?: string;
  previousOwners?: number;
  logbookAvailable?: boolean;
  inspection?: { status: 'none' | 'requested' | 'passed' | 'failed'; provider?: string; reportUrl?: string; inspectedAt?: Ts };
  financingEligible: boolean;

  title: string;                      // generated: "2018 Toyota Axio Hybrid"
  description?: string;
  features: string[];

  coverImage?: VehicleImage;
  images: VehicleImage[];             // ordered; canonical media lives in vehicle_media
  videoUrl?: string;

  location: { locationId: string; locationPath: string; locationName: string; coordinates?: { lat: number; lng: number } };

  collectionSlugs: string[];          // array-contains: rule engine output + manual curation
  boost?: { active: boolean; placements: BoostPlacement[]; expiresAt?: Ts; campaignId?: string };

  status: VehicleStatus;
  moderation?: { rejectedReason?: string; reviewedBy?: string; reviewedAt?: Ts; flagged?: boolean };

  metrics: { impressions: number; detailViews: number; whatsappClicks: number; callClicks: number; financingClicks: number; leads: number };

  createdAt: Ts; updatedAt: Ts;
  publishedAt?: Ts; soldAt?: Ts;
  lastConfirmedAt?: Ts;               // dealer availability confirmation
  expiresAt?: Ts;                     // staleness sweep target
  searchTokens?: string[];            // lowercase prefix tokens for Firestore keyword search
  sampleData?: boolean;               // seed inventory flag
}

export interface VehicleImage {
  id: string; path: string; url: string;
  width: number; height: number;
  variants?: { thumb?: string; card?: string; full?: string };
  order: number; alt?: string;
}

/* ------------------------- Collections (intent browsing) ------------------------- */

export type CollectionRuleOperator = 'eq' | 'neq' | 'gte' | 'lte' | 'in' | 'not_in' | 'exists';

export interface CollectionRule {
  field: keyof Vehicle | string;      // dot-path allowed: 'location.locationPath'
  operator: CollectionRuleOperator;
  value: unknown;
}

export interface MarketplaceCollection {
  id: string;
  name: string;                       // "Ride-hailing friendly"
  slug: string;
  description?: string;
  heroImageUrl?: string;
  icon?: string;
  mode: 'rule' | 'manual' | 'hybrid';
  rules: CollectionRule[];            // ALL rules must match (AND)
  manualVehicleIds: string[];
  sortOrder: number;
  showOnHomepage: boolean;
  seo?: { title?: string; description?: string; intro?: string };
  active: boolean;
  vehicleCount?: number;
  createdAt: Ts; updatedAt: Ts;
}

/* ------------------------------------ Leads ----------------------------------- */

export type LeadSource =
  | 'whatsapp_click' | 'call_click' | 'test_drive_request'
  | 'financing_application' | 'inquiry_form' | 'storefront_form' | 'admin_manual';

export type LeadStatus =
  | 'new' | 'contacted' | 'qualified' | 'test_drive_scheduled'
  | 'negotiating' | 'won' | 'lost' | 'spam';

export interface Lead {
  id: string;
  dealershipId: string;
  vehicleId?: string;
  vehicleSnapshot?: { title: string; slug: string; price: number; coverImageUrl?: string };
  source: LeadSource;
  status: LeadStatus;
  buyer: { name?: string; phone?: string; email?: string; message?: string; userId?: string };
  attribution: { utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; referrer?: string; landingPath?: string };
  consent: { contactConsent: boolean; capturedAt: Ts };
  assignedTo?: string;
  notes: { id: string; authorId: string; body: string; createdAt: Ts }[];
  preferredTestDriveAt?: Ts;
  financingApplicationId?: string;
  createdAt: Ts; updatedAt: Ts; firstResponseAt?: Ts; closedAt?: Ts;
}

export interface LeadEvent {
  id: string; leadId: string; dealershipId: string;
  type: 'created' | 'status_changed' | 'note_added' | 'assigned' | 'contacted';
  from?: string; to?: string; actorId?: string; createdAt: Ts;
}

/* ---------------------------------- Financing --------------------------------- */

export interface Financier {
  id: string; name: string; slug: string; logoUrl?: string;
  type: 'bank' | 'sacco' | 'microfinance' | 'asset_finance' | 'other';
  contact: { email: string; phone?: string; leadRoutingEmails: string[] };
  /** Adapter key resolved by services/financing/registry.ts. 'internal' = email/dashboard routing. */
  adapter: 'internal' | 'http_webhook' | string;
  adapterConfig?: Record<string, string>;
  active: boolean; createdAt: Ts; updatedAt: Ts;
}

export interface FinancingProduct {
  id: string; financierId: string; financierName: string;
  name: string;                       // "Asset Finance — Used Vehicles"
  eligibility: {
    minVehicleYear?: number;
    maxVehicleAgeYears?: number;
    allowedBodyTypes?: BodyType[];
    allowedConditions?: VehicleCondition[];
    allowedMakes?: string[];
    minPrice?: number; maxPrice?: number;
    locationPathPrefixes?: string[];
    requiresLogbook?: boolean;
    requiresVerifiedDealer?: boolean;
  };
  terms: {
    minDepositPercent: number;        // 20 = 20%
    maxFinancedAmount?: number;
    repaymentMonths: number[];        // [12,24,36,48,60]
    annualRatePercent: number;        // representative, reducing balance
    rateType: 'reducing_balance' | 'flat';
    processingFeePercent?: number;
    otherFees?: { label: string; amount?: number; percent?: number }[];
  };
  disclaimer?: string;
  active: boolean; sortOrder: number;
  createdAt: Ts; updatedAt: Ts;
}

export interface FinancingApplication {
  id: string;
  vehicleId?: string; dealershipId?: string;
  financierId: string; financingProductId: string;
  applicant: { fullName: string; phone: string; email?: string; employmentType?: 'employed' | 'self_employed' | 'business'; monthlyIncomeBand?: string; county?: string };
  requested: { vehiclePrice: number; depositAmount: number; depositPercent: number; financedAmount: number; repaymentMonths: number; estimatedMonthlyPayment: number };
  consent: { dataSharing: boolean; capturedAt: Ts };
  routing: { deliveredAt?: Ts; deliveryMethod?: 'email' | 'webhook' | 'dashboard'; deliveryError?: string; externalReference?: string };
  outcome: { status: 'submitted' | 'received' | 'in_review' | 'approved' | 'declined' | 'disbursed' | 'abandoned'; amountApproved?: number; notes?: string; recordedBy?: string; recordedAt?: Ts };
  leadId?: string;
  createdAt: Ts; updatedAt: Ts;
}

/* -------------------------- Monetisation & payments --------------------------- */

export interface SubscriptionPlan {
  id: string; name: string; slug: string;
  priceMonthly: number; priceAnnual?: number; currency: string;
  limits: { activeListings: number | null; staffSeats: number | null; boostCreditsMonthly: number; photosPerVehicle: number };
  features: { brandedStorefront: boolean; analytics: boolean; prioritySupport: boolean; leadExport: boolean; customDomain: boolean };
  sortOrder: number; active: boolean; visible: boolean;
  createdAt: Ts; updatedAt: Ts;
}

export interface DealerSubscription {
  id: string; dealershipId: string; planId: string; planSnapshot: Pick<SubscriptionPlan,'name'|'priceMonthly'|'limits'|'features'>;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled';
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: Ts; currentPeriodEnd: Ts;
  lastPaymentTransactionId?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: Ts; updatedAt: Ts;
}

export type BoostPlacement = 'featured_homepage' | 'top_search' | 'category_feature' | 'urgent_badge' | 'storefront_hero';

export interface BoostProduct {
  id: string; name: string; slug: string;
  placements: BoostPlacement[];
  durationDays: number; price: number; currency: string;
  maxConcurrentSlots?: number;        // scarcity control for homepage placements
  active: boolean; sortOrder: number;
  createdAt: Ts; updatedAt: Ts;
}

export interface VehicleBoost {
  id: string; dealershipId: string; vehicleId: string;
  boostProductId: string; boostSnapshot: Pick<BoostProduct,'name'|'placements'|'durationDays'|'price'>;
  placements: BoostPlacement[];
  status: 'pending_payment' | 'scheduled' | 'active' | 'expired' | 'cancelled' | 'refunded';
  startsAt?: Ts; endsAt?: Ts;
  paymentTransactionId?: string;
  metrics: { impressions: number; clicks: number };
  createdAt: Ts; updatedAt: Ts;
}

export interface PaymentTransaction {
  id: string;
  dealershipId: string;
  purpose: 'subscription' | 'boost';
  referenceId: string;                // dealer_subscriptions or vehicle_boosts doc id
  provider: 'mpesa' | 'mock' | 'manual';
  amount: number; currency: string;
  payerPhone?: string;
  /** Provider-side identifiers for reconciliation. */
  providerRefs: { merchantRequestId?: string; checkoutRequestId?: string; mpesaReceiptNumber?: string; accountReference?: string };
  status: 'initiated' | 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'reversed';
  failureReason?: string;
  rawCallback?: unknown;              // stored for dispute resolution
  idempotencyKey: string;
  createdAt: Ts; updatedAt: Ts; settledAt?: Ts;
}

/* ------------------------- Trust, moderation, analytics ------------------------ */

export interface ListingReport {
  id: string; vehicleId: string; dealershipId: string;
  reason: 'sold_already' | 'wrong_price' | 'misleading_photos' | 'scam_suspected' | 'duplicate' | 'other';
  details?: string; reporterContact?: string; reporterIp?: string;
  status: 'open' | 'reviewing' | 'actioned' | 'dismissed';
  resolutionNote?: string; resolvedBy?: string;
  createdAt: Ts; updatedAt: Ts;
}

export interface AdminAuditLog {
  id: string; actorId: string; actorEmail?: string;
  action: string;                     // 'dealership.verify', 'vehicle.reject', 'plan.update'
  targetType: string; targetId: string;
  before?: unknown; after?: unknown; reason?: string;
  ip?: string; createdAt: Ts;
}

export type AnalyticsEventType =
  | 'vehicle_impression' | 'vehicle_detail_view' | 'dealer_storefront_view'
  | 'whatsapp_click' | 'call_click' | 'financing_click' | 'financing_submit'
  | 'test_drive_request' | 'favourite_added' | 'search_performed' | 'filter_used'
  | 'boost_impression' | 'listing_report';

export interface AnalyticsEvent {
  id: string; type: AnalyticsEventType;
  vehicleId?: string; dealershipId?: string; collectionSlug?: string; locationPath?: string;
  userId?: string; sessionId: string;
  attribution?: { utmSource?: string; utmMedium?: string; utmCampaign?: string; referrer?: string };
  meta?: Record<string, unknown>;
  dayKey: string;                     // '2026-09-17' — partition key for aggregation
  createdAt: Ts;
}

export interface Favourite {
  id: string; userId: string; vehicleId: string; dealershipId: string; createdAt: Ts;
}

export interface Make { id: string; name: string; slug: string; logoUrl?: string; popular: boolean; vehicleCount?: number; }
export interface Model { id: string; makeId: string; make: string; name: string; slug: string; bodyTypes: BodyType[]; vehicleCount?: number; }
