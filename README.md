# aSone — Web (Phase 0: frontend-only with mock data)

**aSone** (Burmese **အစုံ**, "everything") — a second-hand marketplace for anything and everything.

A fully clickable Next.js frontend for the aSone marketplace. **There is no
backend** — every action (browse, search, bid, buy, list, log in, moderate)
runs against an in-memory **mock API** that behaves like a real server (async,
stateful, simulated latency) and persists to `localStorage`.

See the root docs for product/architecture context:
[../FEATURES.md](../FEATURES.md), [../TECH_STACK.md](../TECH_STACK.md), [../PLAN.md](../PLAN.md).

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`.

> Built with **Next.js 16** (App Router, Turbopack), **React 19**,
> **Tailwind CSS v4** (CSS-first `@theme`), and Radix-based shadcn-style UI.

## Demo accounts

Use the floating **Demo** toolbar (bottom-right) to switch accounts or reset
data, or log in on `/login`:

| Account | Email | What you see |
|---------|-------|--------------|
| Buyer   | `demo@asone.app` | Bidding, watchlist, orders, selling |
| Admin   | `admin@asone.app` | Everything + the `/admin` back-office |

Any password works. **Reset demo data** in the toolbar wipes `localStorage`
back to the seed.

## What works

- **Home** — hero search, category tiles, ending-soon & trending grids.
- **Search/Browse** — faceted filters (category tree, price, condition, type,
  location), sorting, pagination — all URL-driven.
- **Listing page** — gallery, sticky buy/bid panel with a **live countdown**,
  real bid placement (validates min increment, animates price, "you're the
  highest bidder" / outbid), bid history, Buy It Now, seller card, related items.
- **Sell** — multi-step wizard (photos → details → pricing → review) with a
  **live preview**; photo upload via file picker or sample images.
- **Checkout** — fee/shipping breakdown, escrow note, order creation.
- **Dashboard** — overview, my bids, watchlist, selling (+ mark shipped), orders
  (+ confirm delivery).
- **Admin** — dashboard with stats/chart, user management (suspend/ban/verify/
  roles), listing moderation, reports queue, orders (refund/cancel), audit log.
- **Auctions auto-close** client-side at `end_at` (idempotent sweep), creating
  an order for the winner.

## Architecture (the swap seam)

Components never call `fetch` — they call a typed API object:

```
src/lib/api/index.ts      ← the active API (mock today)
src/lib/api/store.ts      ← in-memory DB + localStorage + auction-close sweep
src/lib/mock-data/seed.ts ← deterministic seed (users, listings, bids, orders…)
src/lib/types.ts          ← domain types + Zod schemas (the contract)
```

To go live later: implement `src/lib/api/http/*` against the Express API and
re-export them from `lib/api/index.ts`. **No component changes.**

```
src/
├── app/
│   ├── (site)/        # public shell: home, search, listings, sell, checkout,
│   │                  #   dashboard, login, profile (Header + Footer)
│   └── admin/         # role-gated back-office (own layout)
├── components/
│   ├── ui/            # shadcn-style primitives (Button, Card, Dialog, …)
│   └── layout/        # Header, Footer, theme toggle, dev toolbar
├── features/          # feature-scoped logic (listings, bidding, sell, admin…)
└── lib/               # api, types, utils, mock-data
```

## Theming

All colors/radii are CSS variables in `src/app/globals.css`. Edit them once and
the whole app updates. Dark mode flips `<html data-theme="dark">` (next-themes);
semantic tokens (`bg-primary`, `text-foreground`, …) re-resolve automatically.
