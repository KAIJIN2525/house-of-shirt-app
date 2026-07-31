# House of Shirts Mobile App

House of Shirts is a cross-platform luxury fashion commerce and store-operations app for iOS, Android, and web. Customers can discover products, manage a bag, check out through Shopify, track orders, request returns, contact support, and manage their account. Store staff use an administration workspace inside the same app for orders, customers, content, communications, returns, support, and Shopify synchronization.

> Status: active development. Major flows are implemented, but production use still requires external credentials, end-to-end validation, and the work in [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md).

## What the app does

### Customer experience

- Branded onboarding, sign-up, login, password reset, Google OAuth, and persisted Supabase sessions.
- Managed home content, featured categories, trending products, catalogue search/filtering, product details, variants, and stock state.
- Favorites, persistent shopping bag, back-in-stock requests, and saved shipping addresses.
- Nigerian address autocomplete through Google Places.
- Shopify Cart API and native Checkout Sheet with live delivery choices and Shopify-configured payment methods.
- Order history, details, milestone tracking, returns, support chat, contact, and notifications.
- Profile management, newsletter subscription, deep links, haptics, and light/dark themes.

### Administration experience

The `/admin` route group provides:

- Dashboard metrics, sales trajectory, quick actions, alerts, and arrival follow-ups.
- Order search/import/creation, details, milestone updates, bulk dispatch, and outreach notes.
- Customer CRM, Shopify customer records, history, notes, and blacklist/watchlist workflows.
- Return review, support inbox/replies, and restock-request management.
- Notification campaigns, templates, scheduling, and targeting.
- Editorial/banner editing, scheduling, versions, media library, and managed onboarding/welcome copy.
- Brands, product synchronization, sync logs, webhook history/details, exports, and settings.

## Architecture

```text
Expo Router UI (customer and admin)
        |
        +-- Zustand stores -- AsyncStorage / Supabase persistence
        +-- Shopify Storefront API -- catalogue, cart, delivery, checkout
        +-- Supabase Edge Functions -- Admin API, sync, webhooks,
                                      notifications and operations
```

| Area | Source of truth |
| --- | --- |
| Authentication/profile | Supabase Auth and `profiles` |
| Products/inventory snapshot | Shopify, synchronized to Supabase `products` |
| Checkout/payment choices | Shopify Cart and Checkout |
| Bag, favorites, addresses | Supabase user-owned tables |
| Orders/operations | Supabase `orders`, synchronized with Shopify |
| Returns/support | Supabase return and support tables |
| Editorial content/media | Supabase tables and Storage |
| Local preferences | Zustand and AsyncStorage |

## Technology

- Expo SDK 54, React Native 0.81, React 19, New Architecture, and React Compiler.
- Expo Router 6, TypeScript 5.9, Zustand 5, and AsyncStorage.
- Supabase Auth, Postgres, RLS, Storage, Edge Functions, and scheduled jobs.
- Shopify Storefront GraphQL, Customer Account OAuth/PKCE, Admin API functions, and Checkout Sheet Kit.
- NativeWind/Tailwind, Reanimated, Gesture Handler, Expo device APIs, Zod, custom fonts, and EAS Build.

## Repository map

| Path | Purpose |
| --- | --- |
| `app/` | Expo Router screens and layouts |
| `app/(onboarding)/`, `app/(auth)/` | First-run and authentication flows |
| `app/(tabs)/` | Home, shop, bag, favorites, and profile |
| `app/admin/` | Store administration workspace |
| `app/checkout/`, `app/orders/`, `app/returns/`, `app/support/` | Purchase and post-purchase flows |
| `components/` | Shared customer/admin UI |
| `stores/` | Zustand stores by business domain |
| `services/`, `lib/` | Shopify, Supabase, content, Places, and notifications |
| `constants/`, `schemas/` | Models, configuration, theme, and validation |
| `supabase/migrations/` | Schema, RLS, triggers, Storage, and scheduled jobs |
| `supabase/functions/` | Server integrations and privileged workflows |

## Local setup

Requirements: Node.js compatible with Expo SDK 54, npm, a device/emulator, Supabase, Shopify, and EAS for cloud builds.

```bash
npm install
cp .env.example .env
npm start
```

PowerShell: `Copy-Item .env.example .env`

Useful scripts: `npm run android`, `npm run ios`, `npm run web`, `npm run lint`, `npm run start:dev-client`, `npm run build:dev:android`, and `npm run build:preview:android`.

Checkout Sheet and other native modules require a development build; Expo Go is not sufficient for every feature.

## Environment

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_SHOPIFY_STORE_DOMAIN=
EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=
EXPO_PUBLIC_SHOPIFY_SYNC_API_URL=
EXPO_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=
EXPO_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI=houseofshirt://shopify-customer-auth
```

Server-only values belong in Supabase Edge Function secrets: Supabase URL/anon/service-role keys; Shopify domain, Admin token or client credentials, and webhook secret; Resend key/from address; Twilio SID/token/sender; admin notification emails; and scheduled-function secrets. Never expose these as `EXPO_PUBLIC_` or commit production credentials.

## Backend setup

1. Link Supabase and apply `supabase/migrations/` in timestamp order.
2. Deploy `supabase/functions/` and configure secrets.
3. Configure Shopify webhooks to call `shopify-webhook`.
4. Grant `profiles.is_admin = true` only to approved staff.
5. Verify the `assets` Storage bucket and hourly Shopify sync job.
6. Read [docs/shopify-sync-contract.md](./docs/shopify-sync-contract.md).

Admin access must be enforced by server-side profile checks and database policies; hiding routes is not a security boundary.

## Security and release notes

- User-owned Supabase tables use Row Level Security; privileged integrations live in Edge Functions.
- Shopify Customer Account tokens use OAuth/PKCE and SecureStore.
- Payment-method UI currently creates a local representation. Production saved cards require a PCI-compliant provider token; raw card data must never be stored.
- Review the checked-in `google-services.json` against the credential/environment policy.
- Run `npm run lint` and `npx tsc --noEmit`, then test all customer/admin flows on physical devices.

See [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md) for readiness and [CHANGELOG.md](./CHANGELOG.md) for history.

## Naming

The public brand name is **House of Shirts**. Existing package identifiers and the `houseofshirt` URL scheme remain stable for installed-app compatibility.
