# Loyalty Co. — Loyalty Management Prototype

A high-end, deployment-ready **Loyalty Management System** prototype with two
experiences:

- **Customer Loyalty** — `/user/*` member-facing app
- **Back Office Admin** — `/admin/*` staff console

This is the **foundation build (v0.1)**. The scaffolding, design system, RBAC
model, mock data, and navigation are all wired up so the next iterations can
focus on feature logic, forms, and persistence.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a custom design-system token set
- **shadcn/ui**-style primitives (Radix UI under the hood)
- **lucide-react** icons
- **recharts** reserved for the dashboard charts
- **localStorage** for mock persistence

## Project structure

```
app/
  layout.tsx              Root layout + Inter font
  page.tsx                Landing page with three experience cards
  user/                   Member experience (separate shell)
    layout.tsx
    loyalty/page.tsx      Member dashboard (preview)
    rewards/page.tsx
    history/page.tsx
  admin/                  Back office (uses AppShell)
    layout.tsx
    dashboard/page.tsx
    users/page.tsx
    tiers/page.tsx
    earning-rules/page.tsx
    merchants/page.tsx
    vouchers/page.tsx
    api-config/page.tsx
    redemption-config/page.tsx
    reports/page.tsx
    audit/page.tsx
    roles/page.tsx

components/
  ui/                     shadcn-style primitives (Button, Card, Dialog, …)
  common/                 PageHeader, StatCard, StatusBadge, SectionCard, …
  layout/                 AppShell, AdminSidebar, TopBar, RoleSwitcher

data/                     Realistic mock datasets
lib/                      storage, rbac, utils
types/loyalty.ts          Domain types shared across the app
```

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # Production build
```

Requires **Node.js 20.19+** (the build relies on the native SWC binary).

## Role-based access

The back-office sidebar reacts to the active role. Switch roles from the
**"View as"** menu in the top bar; the choice is persisted in `localStorage`.

| Role      | Modules accessible                                          |
| --------- | ----------------------------------------------------------- |
| Admin     | All 11 modules                                              |
| Merchant  | Dashboard · Vouchers · Reports · Audit                      |
| Viewer    | Dashboard · Reports                                         |

Access is enforced through a single allow-list matrix in `lib/rbac.ts`.

## Foundation status

The shell, navigation, mock data, and design system are done. Each module
page renders a **"coming next"** placeholder card that documents the planned
capabilities, so the team can pick up the work item by item.

## Next steps

The next iterations will replace the `ModulePlaceholder` blocks with:

1. Real, type-safe data fetching (today it’s all in-memory mock data).
2. Forms with validation (FormDrawer is already wired up).
3. Charts on the dashboard (recharts).
4. Live RBAC enforcement on every server action.
