# AutoDaddy Admin

Admin panel for [AutoDaddy](https://autodaddy.ca) — an automotive services platform connecting car owners, auto shop owners, deals, ads, and related operations.

Built on the [TailAdmin](https://tailadmin.com) React dashboard template and customized for AutoDaddy’s domain.

## Overview

This is the **operations back office** for the AutoDaddy ecosystem. It lets administrators manage users, services, geography, marketing content, wallets, tasks, and delegated sub-admin access. All data is served by a separate backend API configured via environment variables.

Sign-in is the app entry point at `/`. There is no separate public landing page.

### User roles

| Role | Sign-in | Access |
|------|---------|--------|
| **Admin** | Email + OTP at `/` or `/admin/signin` | Full access to all modules |
| **Sub-admin** | Email + password (currently disabled) | Module-level permissions when enabled |

Sub-admin sign-in and navigation exist in the codebase but are commented out for now. Permission checks via `ProtectedRoute` and `usePermissions` remain in place for when sub-admin access is re-enabled.

## Features

### Primary navigation

| Section | Modules |
|---------|---------|
| **Home** | Dashboard, Thought of Day, Features, FAQs, Privacy, Website Templates, Invoice Templates |
| **Locations** | Provinces, Cities |
| **Services** | Categories, Sub-services |
| **Users** | Car owners, Auto shop owners, Associates (coming soon), Dealers (coming soon) |
| **Leads** | Coming soon |
| **Accounts** | Coming soon |
| **Messages** | Coming soon |
| **Reports** | Coming soon |
| **Ads** | Ad management |

### Additional modules (reachable by URL)

These routes are still active but are not shown in the current primary nav:

- Running deals, Wallet, Invite help, Task management, Car companies, Sub-admin management
- Admin profile and logout

### Other

- **Onboarding** — Public auto shop owner onboarding flow at `/auto-shop-owner/onboarding`
- **Shared admin UI** — `AdminPage` and `ContentPanel` components for consistent page layout across content screens

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Ant Design](https://ant.design/), [Recharts](https://recharts.org/), [Framer Motion](https://www.framer.com/motion/)
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) for forms and validation
- [Axios](https://axios-http.com/) / `fetch` for API calls
- [React Toastify](https://fkhadra.github.io/react-toastify/) for notifications

## Prerequisites

- **Node.js** 18.x or later (20.x recommended)
- Access to the AutoDaddy backend API

## Getting started

### 1. Clone and install

```bash
git clone <repository-url>
cd Auto-Daddy-Admin
npm install
```

If you hit peer dependency issues:

```bash
npm install --legacy-peer-deps
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
VITE_API_URL=https://app.autodaddy.ca
VITE_UPLOADS_URL=https://app.autodaddy.ca
```

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL for the AutoDaddy backend API |
| `VITE_UPLOADS_URL` | Base URL for uploaded assets (images, files) |
| `VITE_IMAGE_URL` | Optional; used in some user management views |

### 3. Run the dev server

```bash
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

### 4. Build for production

```bash
npm run build
npm run preview
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Routes

### Auth and public

| Path | Description |
|------|-------------|
| `/` | Admin OTP sign-in (default entry) |
| `/admin/signin` | Admin OTP sign-in (alias) |
| `/auto-shop-owner/onboarding` | Auto shop owner onboarding |

### Admin — Home and content

| Path | Description |
|------|-------------|
| `/admin` | Dashboard |
| `/admin/thought-of-day` | Thought of the day list |
| `/admin/thought-of-day/new` | Create thought of the day |
| `/admin/features` | Product features |
| `/admin/faqs` | FAQs |
| `/admin/privacy` | Privacy policy content |
| `/admin/website-templates` | Website templates |
| `/admin/invoice-templates` | Invoice templates |

### Admin — Users, services, and locations

| Path | Description |
|------|-------------|
| `/admin/car-owners` | Car owner management |
| `/admin/auto-shop-owners` | Auto shop owner management |
| `/admin/associates` | Associates (coming soon) |
| `/admin/dealers` | Dealers (coming soon) |
| `/admin/categories` | Service categories |
| `/admin/services` | Sub-services |
| `/admin/provinces` | Province management |
| `/admin/cities` | City management |

### Admin — Marketing and operations

| Path | Description |
|------|-------------|
| `/admin/ads` | Ads management |
| `/admin/running-deals` | Running deals |
| `/admin/wallet` | Wallet |
| `/admin/invite-help` | Invite help section |
| `/admin/manage-task` | Task management |
| `/admin/car-companies` | Car company management |
| `/admin/subadmins` | Sub-admin management (admin only) |

### Admin — Placeholders and account

| Path | Description |
|------|-------------|
| `/admin/leads` | Leads (coming soon) |
| `/admin/accounts` | Accounts (coming soon) |
| `/admin/messages` | Messages (coming soon) |
| `/admin/reports` | Reports (coming soon) |
| `/admin/profile` | Admin profile |
| `/admin/logout` | Log out |
| `/admin/unauthorized` | Permission denied page |

## Authentication

- **Admin** — OTP flow via `POST /api/auth/admin/signin`, verified with `POST /api/auth/admin/verify-account`; token stored in `localStorage` as `admin-token`.
- **Session check** — `POST /api/auth/admin/check-auth/` from the admin layout on protected routes.
- **Sub-admin** — Login via `POST /api/auth/subadmin/login` (disabled in UI); permissions stored as `subadmin-permissions`.

Unauthenticated access to `/admin/*` redirects to `/`.

## Permissions

Sub-admin access is enforced by `ProtectedRoute` and the `usePermissions` hook. Each module supports granular actions:

- `view`, `add`, `edit`, `delete`

Main admin (`admin-role` = `admin`) bypasses all permission checks.

Permission modules include: `dashboard`, `users`, `services`, `categories`, `websiteTemplates`, `dashboardData`, `carCompanies`, `provinces`, `cities`, `ads`, `runningDeals`, `wallet`, `inviteHelp`, `tasks`, and `subAdminManagement`.

Navigation items in `src/config/adminNav.ts` map to these modules via `permissionModule`.

## Project structure

```
src/
├── components/
│   ├── admin/          # AdminPage, ContentPanel, AdminShell, ComingSoon
│   ├── auth/           # Sign-in forms
│   └── common/         # ProtectedRoute, shared UI
├── config/
│   └── adminNav.ts     # Primary navigation and permission mapping
├── context/            # Theme and sidebar state
├── hooks/              # usePermissions, useModal, etc.
├── layout/Admin/       # App shell (header, layout, auth gate)
├── pages/
│   ├── AdminPages/     # Domain-specific admin screens
│   ├── AuthPages/      # Admin sign-in
│   └── AutoShopOwnerOnboarding.tsx
├── utils/              # Helpers (e.g. Razorpay)
├── App.tsx             # Route definitions
└── main.tsx            # App entry point
```

## API integration

Most admin pages call endpoints under:

- `/api/auth/*` — Authentication
- `/api/admin/*` — Admin CRUD and dashboard data

The base URL is always `${VITE_API_URL}` from your `.env` file.

## Template credit

UI foundation: [TailAdmin React](https://github.com/TailAdmin/free-react-tailwind-admin-dashboard) (MIT License). Demo routes from the original template (charts, form elements, etc.) may still exist at paths like `/line-chart` and `/form-elements` but are not part of the core AutoDaddy product.

## License

Private project. TailAdmin template components remain under the MIT License where applicable.
