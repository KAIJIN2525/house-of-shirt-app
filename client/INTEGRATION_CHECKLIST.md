# House of Shirts Integration Checklist

Last audited: 2026-08-01

This reflects what exists in the repository, not a guarantee that every external service is configured in the deployed environment. `[x]` means implemented in code; `[ ]` means incomplete, simulated, configuration-dependent, or still needing production verification.

## Foundation and experience

- [x] Expo SDK 54/React Native 0.81 app for iOS, Android, and static web.
- [x] Typed Expo Router navigation, New Architecture, React Compiler, EAS build profiles.
- [x] Dark/light themes, custom fonts, loaders, skeletons, toast feedback, and haptics.
- [x] Customer tabs: Home, Shop, Bag, Favorites, Profile.
- [x] Full in-app administration route group.
- [ ] Add unit, integration, and end-to-end tests plus CI checks.
- [ ] Complete accessibility review: screen readers, focus, contrast, dynamic text, and reduced motion.
- [x] Removed unused Expo starter assets/scripts and bundled fake order/return records; normalized the public brand to “House of Shirts.”

## Authentication and accounts

- [x] Supabase email/password auth, persisted sessions, registration, login, and reset-email request.
- [x] Google OAuth browser/callback flow and Zod input validation.
- [x] Profile-creation trigger, sign-out store cleanup, and `profiles.is_admin` model.
- [ ] Configure and test production OAuth/redirect URLs.
- [x] Set-new-password deep-link flow with recovery-session verification.
- [x] Verified privileged admin Edge Functions and database writes require server-side admin authorization; admin routes are also guarded in-app.
- [ ] Run final staff-access acceptance testing with a real non-admin colleague account before release.
- [x] Added authenticated account deletion, privacy-safe user data export, and email verification/resend UX.
- [ ] Run account deletion/export/email verification acceptance with a disposable real user before release.

## Catalogue, search, favorites, and restock

- [x] Home/editorial, shop, search, filters, product details, variants, and stock states.
- [x] Shopify Storefront client and synchronized Supabase product store.
- [x] Supabase-persisted favorites and back-in-stock request/admin workflows.
- [ ] Validate production Storefront credentials, pagination, images, pricing, options, and inventory.
- [ ] Add robust offline, rate-limit, empty, and partial-sync states.
- [ ] Add privacy-safe product and search analytics.

## Bag, checkout, and payment

- [x] Persistent Supabase bag with variant IDs, totals, quantity updates, and clearing.
- [x] Shopify cart creation, delivery address/options, Customer Account OAuth/PKCE, SecureStore, and native Checkout Sheet.
- [x] Checkout success/failure routes and promo-code/order-summary UI.
- [ ] Verify completion, cancellation, order reconciliation, and interrupted checkout end to end.
- [ ] Confirm Paystack/card and Cash on Delivery configuration in Shopify.
- [ ] Validate promo codes through Shopify rather than client-only logic.
- [x] Removed the mock saved-card flow; Shopify Checkout owns card collection and storage.
- [ ] Prove no PAN/CVV data is persisted or logged; add duplicate-submit/idempotency tests.

## Address, delivery, and orders

- [x] Supabase address CRUD/default selection and Nigeria-restricted Google Places lookup.
- [x] Lagos/other Nigeria/international logic with House Rider, GIGL, and DHL representations.
- [x] Customer/admin orders, timelines, milestone updates, import, bulk dispatch, and alerts.
- [x] Supabase orders/RLS, Shopify order sync fields, and Admin API order-creation function.
- [x] Added the Google Places variable to `.env.example`; production key restriction still requires Google Cloud verification.
- [ ] Replace simulated `gigl-tracking` data with the real GIGL API; add real DHL/Rider tracking as needed.
- [ ] Verify shipping quotes/estimates and the Shopify API version against production.
- [ ] Make order creation/webhook reconciliation idempotent and cover cancellations, refunds, partial fulfilment, and exchanges.
- [x] Added immutable, administrator-only audit logging for privileged order changes.

## Returns and support

- [x] Customer return initiation/list/status and admin review/detail workflows.
- [x] Customer support chat/history and admin ticket inbox/reply workflows.
- [x] Return, support thread/message, and support ticket/message database schemas.
- [ ] Consolidate or clearly separate the overlapping thread and ticket support models.
- [ ] Connect returns to Shopify refunds/returns and inventory adjustments.
- [ ] Add attachment controls, assignment, escalation, SLAs, closure notifications, and permission tests.

## Notifications and communications

- [x] Expo push registration, token persistence, foreground/response listeners, and deep links.
- [x] Local abandoned-bag/order notifications and Supabase in-app notifications.
- [x] Admin campaign/template/targeting UI and Edge Function channels for email, SMS, push, in-app, and admin alerts.
- [x] Resend and Twilio configuration hooks.
- [ ] Configure APNs/FCM/Expo credentials, Resend domain/sender, and Twilio sender; test physical devices.
- [ ] Add communication preferences, consent/unsubscribe, delivery receipts, retries, and rate limiting.
- [x] Cancel local abandoned-bag reminders by their stored notification identifier.
- [ ] Verify scheduled campaigns execute server-side while the app is closed.

## Shopify synchronization

- [x] Manual sync service/dashboard, scheduled hourly sync migration, products/orders Edge Function, and sync logs.
- [x] Webhook Edge Function with secret validation plus webhook history/detail UI.
- [x] Shopify customer mirror and documented sync contract.
- [ ] Configure production app credentials and webhook subscriptions.
- [x] Verified webhook HMAC, persistent delivery replay protection/deduplication, and Vault-backed scheduled-job authentication.
- [x] Prevented stale or out-of-order Shopify webhook deliveries from regressing newer order state using monotonic Shopify event timestamps.
- [x] Added deduplicated Shopify sync failure incidents, stale-sync monitoring, admin alerts, and automatic recovery resolution.
- [x] Load-tested 52,500 Shopify records and 100,000 order line items across 220 paginated requests with simulated rate limits and bounded memory.

## Admin and content management

- [x] Dashboard, CRM, blacklist, returns, support, restock, notifications, brands, alerts, exports, and settings screens.
- [x] Editorial banner states (draft/live/scheduled/default/archived), version history, managed copy, and media library.
- [x] Supabase Storage bucket and RLS policies for managed content/assets.
- [x] Added owner/admin staff-access grants with pending-email activation and protected grant/revoke controls.
- [ ] Add granular per-feature staff permissions if full admin access is too broad.
- [x] Added an append-only audit history and admin viewer for content, customers, orders, campaigns, templates, media, and staff access.
- [ ] Validate media compression, dimensions, type/size limits, orphan cleanup, and export retention/security.

## Supabase and operations

- [x] Migrations for profiles, products, orders, cart, favorites, addresses, payment methods, notifications, restock, customers, support, sync, newsletter, and managed content.
- [x] RLS policies, profile/timestamp/restock triggers, Storage policies, Edge Functions, and scheduled sync.
- [ ] Bootstrap a clean database from every migration and resolve overlapping product-schema migrations.
- [ ] Generate/use Supabase TypeScript database types instead of broad `any` usage.
- [ ] Add migration verification, recovery, backups/PITR, monitoring, and production index review.
- [ ] Perform a production threat-model/RLS/Edge Function security review.

## Privacy and release

- [ ] Add privacy policy, terms, returns policy, support URLs, and data retention/deletion rules.
- [ ] Rotate any credentials ever committed; review `google-services.json` and separate environments.
- [ ] Add crash reporting, performance monitoring, and privacy-safe analytics.
- [x] Removed Android microphone permission through the Image Picker config plugin.
- [ ] Prepare store assets, ratings, disclosures, signed builds, and physical-device validation.
- [ ] Verify production deep links/OAuth redirects and complete penetration/security testing.
