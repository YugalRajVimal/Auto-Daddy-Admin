# AutoDaddy Admin & Mobile

Monorepo for the [AutoDaddy](https://autodaddy.ca) automotive services platform — frontend clients that connect car owners, auto shop owners, associates, and platform administrators to a shared backend API.

| App | Path | Stack | Purpose |
|-----|------|-------|---------|
| **Admin panel** | `/` (repo root) | React 19, Vite, TypeScript, Tailwind CSS v4 | Operations back office for platform admins |
| **Mobile app** | `MOBILE/` | Expo 54, React Native, Expo Router | Car owner, shop owner, and associate mobile experiences |

All clients talk to the same backend (default: `https://app.autodaddy.ca`). Configure the base URL per app via environment variables.

## Repository structure

```
.
├── src/                  # Admin web app source
│   ├── components/       # Shared UI, auth forms, admin shells
│   ├── config/           # Navigation and permission mapping (adminNav.ts)
│   ├── layout/Admin/     # App shell (sidebar, header, auth gate)
│   ├── pages/            # Admin screens, auth, onboarding
│   ├── portals/admin/    # Admin route definitions
│   └── auth/             # Guards, permissions, role registry
├── MOBILE/               # Expo / React Native mobile app
│   ├── app/              # File-based routes (car-owner, shop-owner, associate)
│   ├── components/       # Shared and role-specific UI
│   ├── context/          # Auth provider, session state
│   ├── hooks/            # Data-fetching hooks per feature
│   └── lib/              # API client, auth helpers, normalizers
├── public/               # Static assets for admin web build
├── package.json          # Admin web dependencies
└── vercel.json           # SPA rewrites for admin deployment
```

## Prerequisites

- **Node.js** 18.x or later (20.x recommended)
- Access to the AutoDaddy backend API
- For mobile: Xcode (iOS) and/or Android Studio (Android) — see [MOBILE/README.md](MOBILE/README.md)

---

## Admin web panel

The admin panel is the **operations back office** for the AutoDaddy ecosystem. Administrators manage users, services, geography, marketing content, leads, accounts, reports, and delegated sub-admin access.

Sign-in is the app entry point at `/`. There is no separate public landing page.

UI foundation: [TailAdmin React](https://github.com/TailAdmin/free-react-tailwind-admin-dashboard) (MIT), customized for AutoDaddy.

### User roles

| Role | Sign-in | Access |
|------|---------|--------|
| **Admin** | Email + OTP at `/` or `/admin/signin` | Full access to all modules |
| **Sub-admin** | Email + password (currently disabled in UI) | Module-level permissions when re-enabled |

Sub-admin sign-in is commented out in the UI, but `RequirePermission` guards and `usePermissions` remain in place for future use.

### Primary navigation

| Section | Modules |
|---------|---------|
| **Home** | Dashboard, Thought of Day, Features, FAQs, Privacy, Website Templates, Invoice Templates |
| **Locations** | Provinces, Cities |
| **Services** | Services, Sub-services, Car Brands |
| **Users** | Car owners, Auto shop owners, Dealers |
| **Leads** | All leads, Visited, Completed |
| **Accounts** | Expenses, Income, Bank |
| **Messages** | Notifications sent, Notifications received |
| **Reports** | Report hub |
| **Domain** | Domain manager |

Additional routes (wallet, running deals, tasks, car companies, sub-admin management, etc.) remain reachable by URL or the admin utility menu.

### Getting started (admin)

```bash
# From repo root
npm install
# If peer dependency issues:
# npm install --legacy-peer-deps

cp .env.example .env
# Edit .env with your API URLs

npm run dev      # http://localhost:5173
npm run build    # production build
npm run preview  # preview production build
npm run lint     # ESLint
```

### Environment variables (admin)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL for the AutoDaddy backend API |
| `VITE_UPLOADS_URL` | Base URL for uploaded assets (images, files) |
| `VITE_IMAGE_URL` | Optional; used in some user management views |

### Authentication (admin)

- **Admin** — OTP via `POST /api/auth/admin/signin`, verified with `POST /api/auth/admin/verify-account`; token stored in `localStorage` as `admin-token`.
- **Session check** — `POST /api/auth/admin/check-auth/` from the admin layout on protected routes.
- **Sub-admin** — `POST /api/auth/subadmin/login` (UI disabled); permissions stored as `subadmin-permissions`.

Unauthenticated access to `/admin/*` redirects to `/`.

### Deployment (admin)

The admin app is a Vite SPA deployed to Vercel (`vercel.json` rewrites all routes to `index.html`).

---

## Mobile app

The mobile app (`MOBILE/`) is built with **Expo** and **Expo Router**. It provides OTP-based authentication and role-specific experiences:

| Role | Route group | Highlights |
|------|-------------|------------|
| **Car owner** | `app/(car-owner)/` | Auto shops, vehicles, deals, documents, service history, scheduling |
| **Shop owner** | `app/(shop-owner)/` | Customers, job cards, services, deals, wallet, website, team |
| **Associate** | `app/(associate)/` | UI shell (dev session; no backend APIs yet) |

Session state is stored in **expo-secure-store**.

### Getting started (mobile)

```bash
cd MOBILE
npm install

cp .env.example .env
# Set API_URL or EXPO_PUBLIC_API_URL

npm run start    # Metro bundler
npm run ios      # iOS dev build
npm run android  # Android dev build
npm run lint
```

### Environment variables (mobile)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | API base URL (preferred for Expo) |
| `API_URL` | Fallback API base URL |
| `EXPO_PUBLIC_CASHFREE_ENV` | Cashfree payment environment (`sandbox` / `production`) |

Default fallback: `https://app.autodaddy.ca`

For architecture, API reference, and troubleshooting, see **[MOBILE/README.md](MOBILE/README.md)**.

---

## Shared backend

| Client | Env var | Auth storage | Auth header |
|--------|---------|--------------|-------------|
| Admin web | `VITE_API_URL` | `localStorage` (`admin-token`) | Per admin auth endpoints |
| Mobile | `EXPO_PUBLIC_API_URL` / `API_URL` | SecureStore (`authToken`) | `Authorization: <token>` |

API paths are organized under `/api/auth/*`, `/api/admin/*`, `/api/user/*`, and `/api/auto-shop-owner/*`.

---

## Permissions (admin sub-admins)

When sub-admin access is enabled, `RequirePermission` enforces granular actions per module: `view`, `add`, `edit`, `delete`.

Main admin (`admin-role` = `admin`) bypasses all checks. Navigation items in `src/config/adminNav.ts` map to permission modules such as `dashboard`, `users`, `services`, `categories`, `provinces`, `cities`, `carCompanies`, `domain`, and `inviteHelp`.

---

## Other routes

| Path | Description |
|------|-------------|
| `/auto-shop-owner/onboarding` | Public auto shop owner onboarding flow |
| `/calendar`, `/form-elements`, etc. | TailAdmin template demo routes (not core product) |

---

## License

Private project. TailAdmin template components remain under the MIT License where applicable.
