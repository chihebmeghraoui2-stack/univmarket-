# UnivMarket

Le marché universitaire algérien — plateforme full-stack de services entre étudiants pour les 58 wilayas d'Algérie.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080, proxied to `/api`)
- `pnpm --filter @workspace/univmarket run dev` — React frontend (port varies, proxied to `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed the database with 58 wilayas, categories and demo accounts
- Required env: `DATABASE_URL` — Postgres connection string

## Demo Accounts

| Role   | Email                   | Password    |
|--------|-------------------------|-------------|
| Admin  | admin@univmarket.dz     | Admin123!   |
| Seller | seller@univmarket.dz    | Seller123!  |
| Client | client@univmarket.dz    | Client123!  |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, Wouter (routing), TanStack Query, Tailwind CSS, shadcn/ui, framer-motion, recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: Bearer token sessions (stored in localStorage as `univmarket_token`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/routes/` — all API route handlers
- `artifacts/api-server/src/middleware/auth.ts` — requireAuth / requireAdmin / requireSeller
- `artifacts/univmarket/src/pages/` — all React pages
- `artifacts/univmarket/src/components/` — Navbar, ServiceCard, shadcn/ui components
- `artifacts/univmarket/src/lib/auth.ts` — useAuth hook, AuthUser interface
- `lib/db/src/schema/index.ts` — source-of-truth DB schema
- `lib/api-spec/` — OpenAPI spec (source of truth for generated hooks)
- `lib/api-client-react/src/generated/` — generated TanStack Query hooks
- `lib/api-zod/src/` — generated Zod validation schemas
- `scripts/src/seed.ts` — database seed script

## Architecture Decisions

- **Escrow payments**: funds held in `escrow_transactions` table, released to seller wallet only when client confirms delivery (status → `completed`).
- **Commission**: 10% taken on every completed order, stored as `commission_amount` on the order.
- **Session auth**: token-based sessions in `sessions` table (no JWTs), Bearer token stored in localStorage.
- **Route ordering**: In Express, static routes (`/services/featured`, `/categories/popular`) must appear BEFORE parameterized routes (`/services/:id`) in the same router to avoid shadowing.
- **API contract-first**: OpenAPI spec in `lib/api-spec/openapi.yaml` is the source of truth; hooks and Zod schemas are generated from it via `pnpm --filter @workspace/api-spec run codegen`.

## Product

- Browse/search services across 58 Algerian wilayas (filter by wilaya, category, price, rating)
- Seller onboarding: create services, manage orders, seller wallet with escrow, withdraw earnings
- Client flow: register, search, order with escrow protection, confirm delivery, leave review
- Disputes: open/resolve disputes on orders; admin resolves with optional refund
- Admin dashboard: user management (ban/unban), service moderation (approve/reject), dispute resolution, withdrawal processing, wilaya analytics
- Leaderboard: top sellers ranked by revenue with wilaya filter
- Notifications: real-time event notifications (new orders, approvals, disputes, payments)
- Wishlist: save services for later
- Coupons: sellers create discount codes, clients validate at checkout

## User Preferences

- French as primary UI language (Arabic available in schema for bilingual content)
- Teal/green primary color (`#0d9488`), amber accent (`#f59e0b`)
- Amounts displayed in DZD (Algerian Dinar)

## Gotchas

- Always register static Express routes (e.g. `/categories/popular`) BEFORE parameterized routes (`/categories/:id`) in the same router file.
- The `pnpm run seed` script uses `onConflictDoNothing()` — safe to re-run.
- The `lib/api-client-react` generated hooks use camelCase for route mutations: `useAcceptOrder`, `useCancelOrder`, `useCompleteOrder`, `useDeliverOrder` — NOT a single `useUpdateOrderStatus`.
- `useAdminGetAllWilayaStats` (generated name) not `useGetAdminAllWilayaStats`.
- DB schema uses camelCase in Drizzle (e.g. `wilayaId`, `nameFr`, `verifiedAt`).
- Stats queries use `sql\`COALESCE(SUM(${col}), 0)\`` — do not shadow the drizzle `sum` import.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
