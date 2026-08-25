# Waypass

Funeral home management and cremation booking platform. Waypass digitizes cremation workflows — from case intake through cremation completion — connecting funeral homes with crematoriums and shipping partners.

## Features

- **Case management** — Track deceased individuals through intake, custody stages, documentation, and cremation completion
- **Cremation bookings** — Send slot proposals to crematoriums; crematoriums respond with availability; funeral homes confirm
- **Partner network** — Discover nearby crematoriums via Google Maps; manage shipping partners for remains logistics
- **Inbox & notifications** — In-app and email alerts for booking updates, case events, and admin messages with per-user preferences
- **Financial dashboard** — Revenue tracking, package pricing, billing summaries, and weekly revenue reports
- **Document management** — Case-scoped document folders with file storage
- **Email templates** — Customizable branded transactional emails per funeral home
- **Family portal** — External-facing portal for families to view case information and send messages
- **Global search** — Cmd+K command palette across cases, crematoriums, partners, and messages
- **Multi-tenant workspaces** — Isolated funeral home accounts with role-based access (admin, staff, read-only)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router v7, Tailwind CSS 4 |
| Backend | Node.js, Express 4 |
| Database | Supabase PostgreSQL with PostGIS (geospatial queries) |
| Auth | Supabase Auth (email/password, JWT) |
| File storage | Cloudinary |
| Email | Resend |
| Maps | Google Maps JS API |

## Project Structure

```
Waypass/
├── frontend/          # React SPA (Vite)
│   └── src/
│       ├── pages/     # Route-level pages
│       ├── components/
│       ├── context/   # Auth, user, funeral home, dark mode
│       ├── hooks/
│       └── lib/       # API client, Supabase, utilities
├── backend/           # Express API server
│   ├── routes/        # API endpoints
│   ├── middleware/    # Auth, RBAC, logging
│   ├── lib/           # Supabase client, email, notifications
│   ├── scripts/       # DB seeding and data refresh
│   └── supabase/
│       └── migrations/ # Versioned SQL migrations
└── docs/
    └── openapi.yaml   # OpenAPI spec
```

## Local Development

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with PostGIS enabled
- Supabase CLI (for running migrations)
- API keys: Google Maps, Cloudinary, Resend

### Setup

1. **Install dependencies**

   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Configure environment**

   ```bash
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   ```

   Fill in both `.env` files — see [Environment Variables](#environment-variables) below.

3. **Run database migrations**

   ```bash
   supabase db push
   # or apply files in backend/supabase/migrations/ manually
   ```

4. **Seed data** (optional)

   ```bash
   cd backend
   npm run seed                     # Core data
   npm run seed:crematoriums        # Load crematoriums from Google Places
   npm run seed:shippingPartners    # Load shipping partners
   ```

5. **Start dev servers** (two terminals)

   ```bash
   # Terminal 1
   cd frontend && npm run dev       # http://localhost:5173

   # Terminal 2
   cd backend && npm run dev        # http://localhost:3001
   ```

## Environment Variables

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_GOOGLE_MAPS_API_KEY=
VITE_ENABLE_GOOGLE_MAPS=true
VITE_ENABLE_CLOUDINARY=true
```

### Backend (`backend/.env`)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3001
GOOGLE_MAPS_API_KEY=
RESEND_API_KEY=
RESEND_FROM=
APP_BASE_URL=http://localhost:5173
ENABLE_RESEND=true
ADMIN_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Scripts

### Frontend

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests (Vitest)
npm run lint         # Run ESLint
```

### Backend

```bash
npm run dev                        # Start with auto-restart
npm start                          # Start server
npm run seed                       # Seed database
npm run seed:crematoriums          # Load crematoriums from Google Places
npm run refresh:crematoriums       # Refresh crematorium data
npm run seed:shippingPartners      # Load shipping partners
npm run test                       # Run tests (Vitest)
```

## Security

- JWT authentication via Supabase Auth; all API requests require `Authorization: Bearer <token>`
- Row-level security (RLS) on all Supabase tables for multi-tenant isolation
- Role-based access control enforced server-side (admin, staff, read-only)
- Platform admin endpoints protected by a separate `ADMIN_API_KEY`
- Crematoriums and shipping partners respond to booking requests via token-authenticated public forms (no login required)
