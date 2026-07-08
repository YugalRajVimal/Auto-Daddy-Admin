# AutoDaddy (Expo / React Native)

AutoDaddy is a mobile app built with **Expo** + **React Native** using **Expo Router** (file-based routing). The product has two primary experiences:

- **Car Owner**: browse auto shops, view content pages (About/FAQ/Documents/etc), manage profile, and more.
- **Auto Shop Owner**: manage profile + business profile, customers, job cards, services, deals, wallet, website templates, and team members.

The app uses **OTP-based authentication** and stores session state in **SecureStore**.

## Tech stack

- **Expo**: `~54`
- **React Native**: `0.81`
- **Expo Router**: file-based navigation with route groups
- **React Navigation**: tabs + drawer (wrapped by Expo Router)
- **TypeScript**: strict mode
- **Storage**: `expo-secure-store` for auth/session cache
- **UI**: `@expo/vector-icons`, `expo-image`, `expo-linear-gradient`

## Getting started

### Prerequisites

- Node.js (LTS recommended)
- Xcode (for iOS simulator) and/or Android Studio (for emulator)
- Expo development build support (this project uses `expo run:*`)

### Install

```bash
npm install
```

### Environment variables

API base URL is read from (in order):

1. `EXPO_PUBLIC_API_URL`
2. `API_URL`
3. fallback: `https://app.autodaddy.ca`

In local dev you can set `API_URL` in `.env`:

```bash
API_URL=https://app.autodaddy.ca
```

### Run

```bash
# Metro bundler
npm run start

# iOS / Android dev builds
npm run ios
npm run android

# Convenience: run on an iPhone simulator
npm run iphone

# Web
npm run web
```

### Lint

```bash
npm run lint
```

## App structure (high level)

### Routing (`app/`)

The app is organized with Expo Router route groups:

- `app/_layout.tsx`
  - Sets up global providers: `AuthProvider`, `ToastProvider`
  - Uses a **Drawer** (`expo-router/drawer`) for the shell
  - Registers tab roots for role groups:
    - `app/(shop-owner)/(tabs)`
    - `app/(car-owner)/(tabs)`
- `app/index.tsx`
  - Cold-start router. Redirects to `/login` when logged out.
  - When authenticated, redirects based on role + profile completion using `getPostAuthRoute()` from `lib/auth`.
- `app/login.tsx`
  - OTP login flow (send OTP, verify OTP)
  - After verification, calls `refreshSession()` to hydrate role/profile caches before navigation.

**Car owner screens** live in `app/(car-owner)/…` and the tab root is `app/(car-owner)/(tabs)/home.tsx`.

**Shop owner screens** live in `app/(shop-owner)/…` with nested areas like:

- `customers/`
- `job-cards/`
- `services/`
- `deals/`

### Authentication & session (`context/`, `lib/auth.ts`)

- `context/auth-provider.tsx`
  - Holds `token`, `meta`, `isAuthenticated`, and `sessionRevision`
  - `sendOtp()` and `verifyOtp()` call API endpoints and persist session
  - `refreshSession()` enriches session by fetching:
    - `/api/user/profile` (role + completion flags)
    - shop-owner data like `/api/auto-shop-owner/profile` when role is `autoshopowner`
    - car-owner dashboard like `/api/user/dashboard` when relevant
- `lib/auth.ts`
  - SecureStore keys + helpers:
    - `AUTH_TOKEN_KEY`, `AUTH_META_KEY`, role caching, dashboard/profile caches
  - `getPostAuthRoute()` decides the first screen after auth based on:
    - role (`carowner` / `autoshopowner`)
    - profile completion flags

### API layer (`lib/api.ts`)

- `getJson`, `postJson`, `putJson`, `deleteJson` for JSON endpoints
- Automatically composes full URL from `API_BASE_URL` + `path`
- Adds `Authorization` header when `authToken` is provided
- Logs request + response status (without logging auth token values)

### Hooks & types (`hooks/`, `types/`)

Hooks follow a pattern:

- Get token from `useAuth()`
- Optionally read cached payloads from `SecureStore` (for faster first paint)
- Fetch from API and update local state
- Expose `loading`, `error` (when needed), and a `refresh()` callback

Example car-owner shop listing:

- `hooks/use-car-owner-auto-shops.ts` → GET `/api/user/auto-shops`
- `lib/car-owner-auto-shops.ts` → normalizes backend shape into UI-friendly fields (including weekday parsing and “open today” logic)
- `app/(car-owner)/schedule-service.tsx` → list UI with search/sort/filter

## Feature notes

### Car owner: auto shops list

The schedule-service screen uses `GET /api/user/auto-shops` and supports:

- Search (name/address/schedule)
- Sort (default, rating, name)
- Filters:
  - **Open today** (derived from `openDays` / `closedDays`)
  - Has phone
  - Has website

Backend schedule quirks are handled (ex: double-encoded JSON strings inside `openDays`).

### Media URLs

When API returns relative media paths like `Uploads/...`, images are normalized to absolute URLs using:

- `lib/normalize-media-url.ts`

## UI / design system

Shared tokens live in `constants/autodaddy.ts`:

- `colors`, `spacing`, `radii`, `shadows`, `typography`

Reusable primitives live in `components/reusables/`:

- Layout: `Screen`, `StackScreenFrame`, `TabScreenFrame`, headers
- Feedback: `ToastProvider`, `AppSplash`, loading helpers
- UI: `SurfaceCard`, `Pill`, `SegmentedControl`, etc.

Car-owner-specific frames:

- `components/car-owner/car-owner-stack-screen-frame.tsx`
- `components/car-owner/car-owner-screen-frame.tsx`

## API reference

All clients talk to the same backend. Default base URL: `https://app.autodaddy.ca`.

| Client | Env var | Storage key |
|--------|---------|-------------|
| **Mobile** (`MOBILE/`) | `EXPO_PUBLIC_API_URL` or `API_URL` | `expo-secure-store` (`authToken`) |
| **Web** (`src/`) | `VITE_API_BASE_URL` | `localStorage` (`so-token`) |

**Auth header:** `Authorization: <token>` (raw token from `verify-otp`, no `Bearer` prefix).

**JSON requests:** `Content-Type: application/json` on POST/PUT/PATCH/DELETE with a body.

**Multipart requests:** do not set `Content-Type`; the client sets the boundary.

Source files: mobile `lib/api.ts`, `lib/auto-shop-owner-api.ts`, `context/auth-provider.tsx`; web `src/lib/api.js`, `src/lib/*Api.js`.

---

### Shared — authentication (all roles)

| Method | Path | Auth | Body | Used by |
|--------|------|------|------|---------|
| `POST` | `/api/auth/sign-up-log-in` | No | `{ countryCode, phone, deviceId, fcmToken }` — phone digits only | Mobile, Web |
| `POST` | `/api/auth/verify-otp` | No | above + `{ otp }` | Mobile, Web |
| `POST` | `/api/auth/` | Yes | `{ countryCode, phone }` — session check on boot/resume | Mobile, Web |
| `GET` | `/api/user/profile` | Yes | — | Mobile, Web |

**OTP body notes**

- Mobile sends real `deviceId` + `fcmToken` (push). Web sends `deviceId` + empty `fcmToken`.
- `verify-otp` response fields used: `token`, `role`, `name`, `profilePhoto`, `isProfileComplete`, `isAutoShopBusinessProfileComplete`.
- `POST /api/auth/` success when `message === "verified"` (case-insensitive); `401`/`403` → logout.

**Session refresh after login**

| Role | Extra calls on refresh |
|------|------------------------|
| Shop owner | `GET /api/auto-shop-owner/profile`, `GET /api/auto-shop-owner/dashboard-details-new` |
| Car owner | `GET /api/user/dashboard` |
| Associate (mobile) | None — dev-only local session (`__dev_associate_session__`) |

Web (`bootstrapShopOwnerSession.js`) only bootstraps **shop owner** profile + dashboard. It does not implement car-owner or associate flows.

---

### Car owner (`role`: `carowner`)

Mobile only — the web panel (`src/`) has no car-owner UI.

#### Profile & dashboard

| Method | Path | Body / query | Notes |
|--------|------|--------------|-------|
| `GET` | `/api/user/profile` | — | Role, name, flags, phone, city |
| `PUT` | `/api/user/edit-profile` | JSON: `name`, `email`, `phone`, `countryCode`, `pincode`, `address`, `cityId`, `city` | Text fields |
| `PUT` | `/api/user/edit-profile` | multipart: same text fields + `profilePhoto` file | Photo upload (`profile.tsx`) |
| `GET` | `/api/user/dashboard` | — | Home stats, thought-of-the-day, `userProfile` overlay |
| `POST` | `/api/user/thought-of-the-day/toggle-like` | `{}` | Toggle like on dashboard quote |
| `GET` | `/api/user/cities` | `?page=&search=` | City picker (schedule-service, profile) |

#### Vehicles

| Method | Path | Body | Notes |
|--------|------|------|-------|
| `GET` | `/api/user/vehicles` | — | Garage list |
| `POST` | `/api/user/vehicle` | multipart: `licensePlateNo`, `vinNo`, `name`, `model`, `year`, `odometerReading`, `dueOdometerReading`, `vehicleImage` | Add vehicle |
| `PUT` | `/api/user/vehicle/:vehicleId` | JSON fields above, or `{ disabled: boolean }` | Edit / disable |
| `PUT` | `/api/user/vehicle/:vehicleId` | multipart (image update path) | Alternate edit path in add-vehicle screen |
| `GET` | `/api/user/car-companies` | — | Make catalog for filters & vehicle form |
| `GET` | `/api/user/odometer-readings` | — | Per-vehicle odometer rows |
| `PUT` | `/api/user/odometer` | `{ vehicleId, odometerReading }` | Update reading |

#### Auto shops, favorites, booking

| Method | Path | Body / query | Notes |
|--------|------|--------------|-------|
| `GET` | `/api/user/auto-shops` | optional `?service=<ids>&carCompanies=<ids>` (comma-separated) | Shop directory |
| `GET` | `/api/user/favorite-auto-shops` | — | Favorited shop ids |
| `POST` | `/api/user/toggle-auto-shop-fav` | `{ autoShopId }` | Toggle favorite |
| `POST` | `/api/user/connect-autoshopowner` | `{ businessId, serviceId }` | “Connect” about a service (shop must be open) |
| `POST` | `/api/user/rate-auto-shop` | `{ autoShopId, rating }` | 1–5 stars |
| `GET` | `/api/auto-shop-owner/services` | — | Master service catalog (car-owner schedule-service filter; **shop-owner path**, auth required) |

#### Job cards (car-owner view)

| Method | Path | Body / query | Notes |
|--------|------|--------------|-------|
| `GET` | `/api/user/job-cards` | optional `?vehicleId=` | Service history |
| `POST` | `/api/user/job-cards/:id/approve` | `{}` | Approve estimate |
| `POST` | `/api/user/job-cards/:id/reject` | `{}` | Reject estimate |

#### Deals, documents, notifications

| Method | Path | Body | Notes |
|--------|------|------|-------|
| `GET` | `/api/user/deals` | — | Deals offered to this car owner |
| `POST` | `/api/user/discard-deal` | `{ dealId }` | Dismiss a deal |
| `GET` | `/api/user/documents` | — | Vehicle document metadata |
| `POST` | `/api/user/documents` | multipart: `vehicleId` + document field key + image | Upload insurance/registration/etc. |
| `GET` | `/api/user/get-notifications` | `?page=&limit=` | Paginated notifications |

---

### Shop owner (`role`: `autoshopowner`)

Implemented in both mobile and web. Paths live under `/api/auto-shop-owner/…`.

#### Profile & onboarding

| Method | Path | Body | Mobile | Web |
|--------|------|------|--------|-----|
| `GET` | `/profile` | — | ✓ | ✓ |
| `PUT` | `/edit-profile` | JSON: `name`, `email`, `phone`, `countryCode`, `pincode`, `address` (+ multipart `profilePhoto` on mobile) | ✓ | ✓ (JSON; photo via multipart in profile UI) |
| `PUT` | `/edit-business-profile` | multipart: `businessName`, `businessAddress`, `city`, `pincode`, `lat`, `lng`, `businessPhone`, `businessEmail`, `businessHSTNumber`, `gst`, `businessLogo`, `bannerImage`, `removeBusinessLogo`, `removeBannerImage`, `perDayOpenHours` (JSON string), `serviceWeWorkWith` (JSON string) | ✓ | ✓ |
| `PUT` / `POST` | `/complete-business-profile` | Same multipart fields as business profile + `perDayOpenHours`, `serviceWeWorkWith` on first setup | **PUT** (`businessprofile.tsx`) | **POST** (`shopOwnerProfileApi.js`) |
| `GET` | `/dashboard-details-new` | optional `?dateType=daily\|weekly\|monthly&date=&month=&year=` | ✓ (no query on session refresh; home may add filters) | ✓ (web Home/Website pass `dateType` for income charts) |
| `PUT` | `/update-business-active-status` | `{ isBusinessActive: boolean }` | ✓ | ✓ |

#### Customers

| Method | Path | Body / query | Notes |
|--------|------|--------------|-------|
| `GET` | `/search-carowner` | `?search=` | Find existing car owners |
| `GET` | `/my-customers` | optional period: `dateType=daily&date=YYYY-M-D`, `weekly&week=YYYY-M-D` (Sunday end of week), `monthly&month=MM&year=YYYY` | Mobile job-cards + customers use period filter; **web customers list does not pass period query today** |
| `POST` | `/my-customers` | `{ carOwnerId }` | Link existing owner |
| `PUT` | `/my-customers` | multipart: `carOwnerId`, `name`, `email`, `countryCode`, `phone`, `pincode`, `address`, `city`, `vehicles` (JSON string), `profilePhoto`, `carImage_0…` | Update linked customer |
| `DELETE` | `/my-customers` | query `?carOwnerId=` + JSON body `{ carOwnerId }` | Mobile sends body for Android DELETE compat |
| `POST` | `/onboard-carowner` | same multipart shape as PUT customer | New owner + OTP |
| `POST` | `/verify-onboarded-carowner` | `{ phone, countryCode, otp }` | Complete onboard OTP |
| `GET` | `/cities` | `?page=&search=` | Business/city pickers |

#### Services & car companies

| Method | Path | Body | Notes |
|--------|------|------|-------|
| `GET` | `/my-services` | — | Shop’s configured categories/sub-services |
| `POST` | `/my-services` | `{ services: [...] }` | Create |
| `PUT` | `/my-services` | `{ services: [...] }` | Update; or `{ services: [{ id, removeSubServices: true, subServices: [{ name }] }] }` to delete sub-services |
| `GET` | `/services` | — | Master catalog |
| `GET` | `/vehicle-types-and-services` | — | Deals form metadata |
| `GET` | `/main-car-companies` | — | Brand catalog |
| `PATCH` | `/my-car-companies` | `{ carCompanyIds: string[] }` | Add brands |
| `DELETE` | `/my-car-companies` | `{ carCompanyIds: string[] }` | Remove brands |

#### Deals

| Method | Path | Body | Notes |
|--------|------|------|-------|
| `GET` | `/my-deals` | — | |
| `POST` | `/my-deals` | multipart: `dealType` (`Service`\|`Parts`), `description`, `discountedPrice`, `offerEndsOnDate`, `dealImage`, plus Service: `serviceId`, `servicesId`, `productName`, `price`, `dealEnabled` — Parts: `partName`, `vehicleId`, `vehicleName`, `vehicleModel`, `vehicleYear` | |
| `PUT` | `/my-deals/:dealId` | same multipart | |
| `DELETE` | `/my-deals/:dealId` | — | |

#### Job cards, payments, wallet

| Method | Path | Body / query | Mobile | Web |
|--------|------|--------------|--------|-----|
| `GET` | `/job-cards` | optional same period query as `my-customers` | ✓ | ✓ (no period filter in web list today) |
| `GET` | `/job-cards/search` | `?q=` | ✓ | ✓ |
| `GET` | `/job-cards/:id` | — | ✓ | ✓ |
| `POST` | `/job-cards` | multipart (see below) | ✓ | ✓ |
| `PUT` | `/job-cards/:id` | multipart | ✓ | ✓ |
| `DELETE` | `/job-cards/:id` | — | ✓ | ✓ |
| `POST` | `/job-cards/:id/mark-payment-status` | `{ paymentStatus }` e.g. `"Paid"` | ✓ | — |
| `POST` | `/job-cards/:id/mark-job-status` | `{ status }` | ✓ (API exists) | — |
| `POST` | `/job-cards/:id/resend-notification` | `{}` | ✓ | ✓ |
| `POST` | `/job-cards/collect-payment` | `{ jobCardId, paymentMethod: "Cash"\|"Online", amount, remark? }` | ✓ | ✓ (Invoices) |
| `POST` | `/job-cards/mark-payment-invoice` | `{ jobCardId }` | ✓ | ✓ (Invoices) |
| `GET` | `/job-cards/paid` | — | ✓ (wallet) | ✓ (Invoices) |
| `GET` | `/job-cards/unpaid` | — | ✓ (wallet) | ✓ (Invoices) |
| `GET` | `/payments` | — | ✓ (helper exists) | — |

**Job card multipart fields:** `customerId`, `vehicleId`, `odometerReading`, `dueOdometerReading`, `issueDescription`, `serviceType`, `priorityLevel`, `services` (JSON string of service lines), `labourCharge`, `labourDuration` (discount), `additionalNotes`, `technicalRemarks`, up to 5 × `vehiclePhotos`.

Web loads form dropdown data via `fetchJobCardFormData()` = `my-customers` + `my-services` (replaces legacy `job-card-page`).

#### Website, subscription, team, enquiries

| Method | Path | Body | Mobile | Web |
|--------|------|------|--------|-----|
| `GET` | `/website-templates` | — | ✓ | ✓ |
| `POST` | `/purchase-subscription` | `{ amount, days, paymentMethod: "cashfree", referenceId, year }` | ✓ | ✓ |
| `GET` | `/team-members` | — | ✓ | ✓ |
| `POST` | `/team-members` | multipart: `name`, `email`, `phone`, `designation`, `isActive`, `teamMemberPhoto` | ✓ | ✓ |
| `PUT` | `/team-members/:id` | multipart | ✓ | ✓ |
| `DELETE` | `/team-members/:id` | — | ✓ | ✓ |
| `GET` | `/get-notifications` | `?page=&limit=` | ✓ | ✓ |
| `POST` | `/submit-enquiry` | multipart: `serviceId`, `serviceName?`, **`voiceNote`** (audio file) | ✓ (`invite-help`) | ✓ (`shopOwnerEnquiryApi.js`) |
| `POST` | `/invite-help-admin` | multipart: `serviceId`, `serviceName`, **`audio`** (webm) | — | ✓ (`NewEnquirySidebar.jsx` only) |

#### Notifications & voice enquiries — field-name difference

Both apps record voice enquiries, but they hit **different endpoints** with **different file field names**:

- Mobile shop-owner **Invite Help** → `POST /api/auto-shop-owner/submit-enquiry` with field `voiceNote` (`.m4a` / `.3gp`).
- Web dashboard sidebar → `POST /api/auto-shop-owner/invite-help-admin` with field `audio` (`.webm`).

---

### Associate (mobile only)

Route group `app/(associate)/` is a **UI shell** with a dev bypass (`enterDevAssociateSession` / `DEV_ASSOCIATE_TOKEN`). No associate-specific backend APIs are called; screens use placeholder/local data.

---

### Mobile vs web — summary of differences

| Area | Mobile | Web |
|------|--------|-----|
| **Roles supported** | Car owner, shop owner, associate (dev) | Shop owner only |
| **Auth storage** | SecureStore | `localStorage` (`so-token`) |
| **FCM / device** | Real `fcmToken` + `deviceId` on OTP | Empty `fcmToken` |
| **Complete business profile HTTP method** | `PUT` | `POST` |
| **Customer / job-card period filters** | `dateType` query on list endpoints | Not wired on customer list; job cards list unfiltered |
| **Dashboard on refresh** | Shop: profile + dashboard; Car: `/api/user/dashboard` | Shop: profile + dashboard only |
| **Mark job paid (quick)** | `mark-payment-status` | Uses `collect-payment` / invoices flow instead |
| **Mark job status** | API wired in mobile lib | Not used in web UI |
| **`GET /payments`** | Defined in mobile API layer | Not used |
| **Voice “invite help”** | `submit-enquiry` + `voiceNote` | `invite-help-admin` + `audio` |
| **Car-owner APIs** | Full app | None |
| **Associate** | Dev mock session | N/A |
| **Web-only catalog call** | — | `GET /api/user/car-companies` used in `useCarCompanyCatalog.js` for deal vehicle makes (shop-owner context) |

When adding a new endpoint, prefer implementing it in the shared `*Api.js` / `auto-shop-owner-api.ts` helpers on both clients to keep payloads aligned.

## Troubleshooting

- **Blank screen on cold start**: `app/index.tsx` shows `AppSplash` until auth meta is enriched (role can be null briefly).
- **API not hitting your server**: verify `EXPO_PUBLIC_API_URL` or `API_URL` is set; see `lib/api.ts`.
- **Images not loading**: confirm backend is returning a reachable URL or a relative path supported by `normalizeMediaUrl()`.

## Notes for contributors

- TypeScript is **strict**; avoid `any` unless absolutely necessary.
- Prefer `lib/*` helpers for data normalization instead of doing shape-fixing inside screens.
- Don’t commit secrets. `.env` is for local dev.
