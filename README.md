# AutoDaddy Admin

Admin and sub-admin panel for [AutoDaddy](https://autodaddy.ca) — an automotive services platform connecting car owners, auto shop owners, deals, ads, and related operations.

Built on the [TailAdmin](https://tailadmin.com) React dashboard template and customized for AutoDaddy’s domain.

## Overview

This is the **operations back office** for the AutoDaddy ecosystem. It lets administrators manage users, services, geography, marketing content, wallets, tasks, and delegated sub-admin access. All data is served by a separate backend API configured via environment variables.

### User roles

| Role | Sign-in | Access |
|------|---------|--------|
| **Admin** | Email + OTP at `/admin/signin` | Full access to all modules |
| **Sub-admin** | Email + password at `/subadmin/signin` | Module-level permissions (view / add / edit / delete) |

## Features

- **Dashboard** — Metrics for car owners, auto shop owners, job cards, deals, and services
- **Users** — Car owners and auto shop owners (associates and dealers planned)
- **Services** — Categories and sub-services
- **Location** — Provinces and cities
- **Marketing** — Ads and running deals
- **Wallet** — Wallet management
- **Content** — Website templates, dashboard data, invite/help section
- **Operations** — Tasks, car companies, sub-admin management
- **Onboarding** — Public auto shop owner onboarding flow

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Ant Design](https://ant.design/), [Recharts](https://recharts.org/), [Framer Motion](https://www.framer.com/motion/)
- [Axios](https://axios-http.com/) / `fetch` for API calls

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

| Path | Description |
|------|-------------|
| `/` | Landing page (admin / sub-admin entry) |
| `/admin/signin` | Admin OTP sign-in |
| `/subadmin/signin` | Sub-admin email/password sign-in |
| `/admin` | Dashboard |
| `/admin/car-owners` | Car owner management |
| `/admin/auto-shop-owners` | Auto shop owner management |
| `/admin/categories` | Service categories |
| `/admin/services` | Sub-services |
| `/admin/provinces` | Province management |
| `/admin/cities` | City management |
| `/admin/ads` | Ads management |
| `/admin/running-deals` | Running deals |
| `/admin/wallet` | Wallet |
| `/admin/invite-help` | Invite help section |
| `/admin/manage-task` | Task management |
| `/admin/website-templates` | Website templates |
| `/admin/dashboard-data` | Dashboard content (e.g. thought of the day) |
| `/admin/car-companies` | Car company management |
| `/admin/subadmins` | Sub-admin management (admin only) |
| `/auto-shop-owner/onboarding` | Auto shop owner onboarding |

## Authentication

- **Admin** — OTP flow via `POST /api/auth/admin/signin`; token stored in `localStorage` as `admin-token`.
- **Sub-admin** — Login via `POST /api/auth/subadmin/login`; permissions stored as `subadmin-permissions`.
- Session checks use `GET /api/auth/admin/check-auth/` from the admin layout.

## Permissions

Sub-admin access is enforced by `ProtectedRoute` and the `usePermissions` hook. Each module supports granular actions:

- `view`, `add`, `edit`, `delete`

Main admin (`admin-role` = `admin`) bypasses all permission checks.

Permission modules include: `dashboard`, `users`, `services`, `categories`, `websiteTemplates`, `dashboardData`, `carCompanies`, `provinces`, `cities`, `ads`, `runningDeals`, `wallet`, `inviteHelp`, `tasks`, and `subAdminManagement`.

## Project structure

```
src/
├── components/       # Shared UI, auth forms, charts, tables
├── context/          # Theme and sidebar state
├── hooks/            # usePermissions, useModal, etc.
├── layout/Admin/     # App shell (sidebar, header, layout)
├── pages/
│   ├── AdminPages/   # Domain-specific admin screens
│   ├── AuthPages/    # Admin and sub-admin sign-in
│   └── HomePage.tsx  # Public landing page
├── utils/            # Helpers (e.g. Razorpay)
├── App.tsx           # Route definitions
└── main.tsx          # App entry point
```

## API integration

Most admin pages call endpoints under:

- `/api/auth/*` — Authentication
- `/api/admin/*` — Admin CRUD and dashboard data

The base URL is always `${VITE_API_URL}` from your `.env` file.

## Template credit

UI foundation: [TailAdmin React](https://github.com/TailAdmin/free-react-tailwind-admin-dashboard) (MIT License). Demo routes from the original template (charts, form elements, etc.) may still exist but are not part of the core AutoDaddy product.

## License

Private project. TailAdmin template components remain under the MIT License where applicable.
