# Changelog

All notable changes to House of Shirts should be recorded here. This file follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and should use Semantic Versioning once releases are tagged.

## [Unreleased]

### Added

- Comprehensive product/architecture README and production-readiness checklist.
- Supabase-backed authentication, profiles, persistence, database policies, Storage, and admin model.
- Customer catalogue, search, product, favorites, bag, address, checkout, order, return, notification, and support flows.
- Shopify Storefront cart/Checkout Sheet, Customer Account OAuth, Admin synchronization, webhooks, customer mirror, and order creation.
- Edge Functions for admin orders, customer notifications, blacklist alerts, synchronization, webhooks, and delivery tracking.
- In-app admin console for orders, customers, returns, support, restock, notifications, editorial content, brands, exports, alerts, and settings.
- Managed editorial scheduling/versioning and media library.
- Resend, Twilio, Expo push, in-app, and local-notification foundations.
- EAS development, preview, and production build profiles.

### Changed

- Moved domain state toward Zustand stores with Supabase/AsyncStorage persistence.
- Expanded the original storefront into a combined commerce and store-operations platform.
- Updated to Expo SDK 54, React Native 0.81, React 19, and typed Expo Router routes.
- Added branded fonts, theme handling, dark mode, loaders, haptics, and notification feedback.
- Changed admin order browsing to reveal additional orders automatically as staff scroll.
- Added immediate navigation feedback and a data-loading skeleton for admin order details.

### Fixed

- Prevented the admin restock screen from showing duplicate or indefinite loading indicators when product refresh state becomes stale.
- Filled customer email and phone details from profiles, orders, and synchronized Shopify customer records.
- Replaced decorative local-only admin settings with shared campaign controls and operational workspace links.

### Security

- Restricted profile visibility and blocked users from self-promoting through is_admin.
- Added protected admin route gating and auditable owner/admin staff access grants.
- Enforced admin authorization for privileged Edge Functions and secured scheduled Shopify sync calls with a Vault-backed secret.
- Restored Shopify webhook HMAC verification and removed the predictable notification test-bypass fallback.
- Added persistent Shopify webhook delivery deduplication with safe retry recovery and idempotent order upserts.
- Prevented delayed Shopify events from overwriting newer order state across webhooks, scheduled sync, and admin refreshes.
- Added monitored Shopify sync outcomes, deduplicated admin incidents, stale-sync checks, and automatic incident recovery.
- Added repeatable large-catalog Shopify load testing plus 429/server-error retries, Retry-After support, and request-bucket throttling.
- Added immutable administrator audit history, an in-app audit viewer, and shared persistence for notification campaigns.

### Known limitations

- GIG Logistics tracking is simulated.
- Saved payment methods can use a mock token and are not production-ready vaulting.
- External credentials/provider configuration and end-to-end production verification are outstanding.
- Automated tests and CI are not present.
- Admin authorization, webhook idempotency, notifications, and release compliance need final verification.

## [1.0.0] - 2025-12-09

### Added

- Root documentation and ignore configuration.
- Monorepo-oriented repository structure.
- Redesigned Home and Shop tabs, branded onboarding, and updated visual identity.
- Initial House of Shirts mobile storefront foundation.

## [0.1.0] - 2025-11-29

### Added

- Initial project commit.

## Maintenance rules

For each meaningful pull request:

1. Add an item under `Unreleased`.
2. Use `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`, or `Known limitations`.
3. Describe customer or operational impact, not only filenames.
4. Move entries into a dated version when releasing.
5. Link version headings to tags/comparisons after the remote release workflow is established.
