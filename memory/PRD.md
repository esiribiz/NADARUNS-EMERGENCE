# NadaRuns Driver – PRD

## Brand
**NadaRuns** — modern Scandinavian logistics platform reducing empty delivery runs. The codebase ships:
- **Driver app** (full operational flow)
- **Business / Shipper experience** (role switch inside the same app — create-shipment + live tracking)

App display name: **NadaRuns Driver** (`app.json` → `expo.name`).

## Stack
- React Native + Expo Router (mobile + web preview)
- FastAPI + MongoDB backend
- Maps: react-native-maps + Google provider on iOS/Android, stylized SVG fallback on web (Platform.select)
- Routing: Google Directions API → fallback haversine straight-line when billing unavailable
- Theming: ThemeContext (light/system/dark) persisted via `@/src/utils/storage`
- Role: persisted via `@nadaruns/role` storage key
- Animations: react-native-reanimated; Gestures: react-native-gesture-handler; Haptics: expo-haptics; Camera/gallery: expo-image-picker

## Routes (Expo Router)
- `/welcome` — role picker (Driver / Shipper)
- `/` — driver dashboard (auto-redirects to /welcome if no role, /business if shipper)
- `/order` — active delivery operational flow
- `/summary` — post-delivery summary + rating
- `/history` — driver's delivery history
- `/wallet` — driver wallet
- `/settings` — driver settings (theme, role switch, sign out, etc.)
- `/business` — business home (active shipments + stats)
- `/business/new` — 3-step create-shipment form
- `/business/track?id=...` — live shipment tracking with polling

## Driver Operational Flow
Home → online toggle → incoming order → accept → enroute_pickup → arrived_pickup (OTP + items) → picked_up → enroute_dropoff → arrived_dropoff (**OTP + photo proof**) → delivered → summary → rating → history. Wallet shows balance + transactions; settings has theme selector and role switch.

## Business Operational Flow
Welcome → I'm a Shipper → Business home (stats + shipments list) → New shipment (3-step form: pickup, customer, package + priority) → automatic creation as `status=pending` order → live track screen (polling every 4s, progress through 6 stages, proof banner when captured).

## Backend Endpoints (prefixed /api)
### Driver
- GET /driver/me, PATCH /driver/me, POST /driver/toggle-online, GET /driver/wallet
- GET /orders/pending, GET /orders/active, GET /orders/history
- POST /orders/{id}/accept, /reject, /advance, /rate
- POST /orders/{id}/verify-otp body `{otp, kind: 'pickup'|'dropoff'}`
- POST /orders/{id}/proof body `{proof_photo: base64-data-url}`
- GET /orders/{id}/route — Google Directions polyline (cached + fallback)
- POST /orders/seed-new-pending (demo helper)
### Business
- GET /business/me — business profile + derived total_shipments
- GET /business/shipments — list of shipments for current business
- POST /business/shipments — create new shipment (auto-distance, eta, earnings; express=1.5×)
- GET /business/shipments/{id} — single shipment

## Smart Business Enhancement
- **Tip-surfacing** on the incoming-order card so drivers see total payout up-front.
- **48-hour earnings clearance** visualised in the wallet (pending vs available).
- **Express priority pricing** on the business side (1.5× multiplier) — instantly upsells faster turnaround.

## Test Coverage
- **Backend: 32/32 pytest passing** across 4 spec files (driver lifecycle, settings, OTP, wallet, business + proof).
- **Frontend: every iter4 testID verified** via Playwright (welcome, role-driver/business, business-home, new-shipment 3-step form, track-shipment, theme toggle, photo-proof modal).

## Known Operational Notes
- Google Directions falls back to straight-line until billing is enabled on the GCP project. Once enabled, behaviour auto-switches; clear `db.route_cache` once.
- React-native-maps requires an EAS dev build for iOS/Android — Expo Go cannot bundle the native Google Maps SDK. Web preview always shows the SVG map.
- Dark mode tokens are exposed via `useTheme()`. Legacy screens (order, summary, history, wallet, settings card backgrounds) still import the static `theme` (light palette); a full migration of these to `useTheme()` is queued for iter 5 alongside the admin dashboard.
- Expo auto-link emits a non-blocking PluginError for react-native-maps in dev logs (no app.plugin.js export). Bundle still builds.

## Planned Next Iterations
- Iter 5: Admin web dashboard (driver approval, live driver map, analytics) + NadaRuns marketing landing page + complete dark-mode migration of legacy screens
- Iter 6: JWT auth + real signup flow (replace local role storage), KYC document upload
- Iter 7: Push notifications via Expo push tokens
