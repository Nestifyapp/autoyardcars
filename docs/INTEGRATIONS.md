# Third-party integrations

Every integration is behind an interface with a working development fallback, so the MVP
runs end to end with no vendor accounts. Nothing is a fake button.

| Integration | Interface | Dev fallback | Needs for production |
| --- | --- | --- | --- |
| Search | `SearchProvider` | Native Firestore queries (sufficient to launch) | Algolia/Typesense keys only when catalogue size demands it |
| M-Pesa | `PaymentProvider` | `mock` provider issues a real callback to the real webhook after ~2.5s, marked `simulated: true` | Daraja consumer key/secret, shortcode, passkey, HTTPS callback URL allowlisted by Safaricom, Go-Live approval |
| WhatsApp | `whatsappLink()` | None needed — `wa.me` deep links work today | Only if moving to the Business API for templated messaging |
| Email | `NotificationProvider` | Logs to console with recipient and subject | Resend/SendGrid key + verified sending domain (SPF/DKIM) |
| SMS | `NotificationProvider.sendSms` | Logs to console | Africa's Talking or Twilio credentials, sender ID registration |
| Financier APIs | `FinancingProviderAdapter` | `internal` adapter routes by email + admin dashboard; `http_webhook` posts JSON | Per-lender API contracts; each becomes one adapter file |
| Maps | `MAPS_PROVIDER` | Static coordinates + a directions deep link | Google Maps key with referrer restrictions |
| Analytics | Server-side `analytics_events` | Fully functional — this is the billing-grade source | Firebase Analytics for supplementary product analytics |

## M-Pesa go-live checklist

1. Daraja production credentials and shortcode.
2. `MPESA_CALLBACK_URL` on HTTPS, with `MPESA_CALLBACK_SECRET` rotated and stored in Secret
   Manager, not `.env`.
3. Confirm the callback is idempotent under retries (it is — the handler exits early on an
   already-succeeded transaction).
4. Reconciliation job for transactions stuck `pending` beyond 10 minutes; Daraja callbacks
   are not guaranteed.
5. Never grant entitlements from the client success screen. Poll `payment_transactions`.

## Data protection

Financing applications collect personal data and require explicit consent, captured with a
timestamp in `consent.capturedAt`. Verification documents (KRA PIN, business registration,
ID scans) are readable only by super admins in both Firestore and Storage rules and are
never returned in public queries. Kenya's Data Protection Act 2019 obligations — including
registration with the ODPC where applicable — should be reviewed with a qualified adviser
before launch; this repository provides the technical foundations, not legal assurance.
