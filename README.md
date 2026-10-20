# Restaurant POS System Webapp

A full-stack restaurant point-of-sale web application that emulates the real-world sales pipeline of a restaurant — from seating a party, through kitchen preparation and serving, to final billing and end-of-day readings.

The waiter checks table availability and takes orders on the POS screen. Submitted orders appear **in real time** on a kitchen-facing view, where each dish is prepared and flagged ready **individually and asynchronously**. The server then delivers each ready dish; when every item of a round has been served, the table advances through the pipeline until the customer requests the bill. Philippine VAT rules and Senior/PWD statutory discounts are applied automatically at checkout.

> **Screenshots:** none are committed yet. If you'd like to add some, drop them in a `docs/images/` folder and link them here.

---

## Table of Contents

- [How It Works — The Order Pipeline](#how-it-works--the-order-pipeline)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Credentials](#demo-credentials)
- [Roles & Permissions](#roles--permissions)
- [API Reference](#api-reference)
- [Database Overview](#database-overview)
- [Order State Machine](#order-state-machine)
- [Scripts](#scripts)
- [Development Notes & Limitations](#development-notes--limitations)

---

## How It Works — The Order Pipeline

```
┌────────┐   submit    ┌───────────┐   all items    ┌─────────┐
│ SEATED │ ──────────► │ PREPARING │ ── served ───► │ SERVED  │
└────────┘             └───────────┘                └────┬────┘
     │                       ▲                           │ request-payment
     │ cancel                │ reopen (new round)        ▼
     ▼                       │                    ┌──────────────────┐
┌───────────┐                └─────────────────── │ PAYMENT_PENDING  │
│ CANCELLED │                                     └────────┬─────────┘
└───────────┘                                              │ complete-payment
                                                           ▼
                                                    ┌───────────────────┐
                                                    │ PAYMENT_FULFILLED │  (table freed)
                                                    └───────────────────┘
```

Key pipeline behaviors:

- **Per-item readiness** — the kitchen flags each dish ready as it finishes; dishes are prepared asynchronously, not as a batch.
- **Serving gate** — a server cannot mark an item *served* until the kitchen has marked it *ready* (HTTP 409 otherwise).
- **Auto-advance** — when the last item of the current round is served, the order automatically moves `PREPARING → SERVED`. Takeout orders jump straight to `PAYMENT_PENDING`.
- **Multi-round orders** — additional orders can be sent to the kitchen for the same table (`currentRound` increments); previous rounds stay visible on the ticket.
- **Table lifecycle** — occupying a table on order creation, freeing it only on payment fulfillment or cancellation.

---

## Tech Stack

This project follows a **MERN-style architecture** with MongoDB swapped out for a zero-config embedded database, making it trivial to run locally:

| Layer      | Technology |
|------------|------------|
| Frontend   | React 18, TypeScript, Vite 5, React Router 6 |
| Styling    | Hand-rolled plain-CSS design system (CSS custom properties, light/dark themes) |
| Backend    | Express 4, TypeScript (CommonJS) |
| Database   | SQLite via **Prisma** ORM (typed client, 12 migrations) |
| Realtime   | **Server-Sent Events** (`GET /api/events`) with 30-second polling fallback |
| Uploads    | Multer (disk storage, 5 MB image cap) |
| Validation | Zod (both env vars and request payloads) |
| Monorepo   | npm workspaces (`server` + `client`) driven by `concurrently` |

All money is stored as **integer centavos** and displayed as **PHP** (`Intl.NumberFormat`, `en-PH`).

---

## Features

### Order Management
- **Order pipeline board** — 5-column Kanban (`Seated → Preparing → Served → Payment Pending → Payment Fulfilled`) with live updates.
- **Per-item ready/served tracking** — kitchen and serving are decoupled per dish; progress bar and "N of M items ready" indicators.
- **Bulk "Serve Now"** — mark every ready-but-unserved item delivered in one tap.
- **Takeout** — full takeout orders, plus per-line takeout flags on dine-in orders.
- **Combo meals** — combos defined by category *slots* ("pick 1 from Main Course + 1 from Beverages"); price is computed from the actual selections with the combo's percentage discount applied, and component lines are zeroed so nothing is double-counted.
- **Kitchen notes** — per-item instructions (e.g. "no ice").
- **Hold-to-cancel** — destructive cancel requires a 2-second press-and-hold.
- **Status audit trail** — every transition is logged (`from → to`, staff, timestamp) and viewable on the order.

### Kitchen Display
- Dedicated kitchen-facing grid of all `PREPARING` orders.
- Elapsed-time counters, per-item ready checkboxes, and combo groupings.
- Orders refresh in real time via SSE; kitchen staff never reload the page.

### Staff & Security
- **PIN login** — staff PINs are hashed with `scrypt` (salt + hash, compared with `timingSafeEqual`); hashes never leave the server.
- **Three roles** — Manager, Server, Kitchen, enforced server-side on privileged endpoints and reflected in the UI (e.g. Reports hidden from Kitchen).
- Staff switcher with PIN confirmation modal; current staff persisted in `localStorage`.

### Billing & Philippine Tax Compliance
- **12% VAT** computed on VAT-inclusive menu prices (`vatableSales = subtotal / 1.12`).
- **Senior Citizen / PWD discounts** (RA 9994 / RA 10754) — 20% discount **plus VAT exemption**, with ID number and name captured on the order.
- Live VAT breakdown panel on the checkout screen.
- **Cash-only, manual confirmation** — no payment gateway; the server confirms payment received.

### End-of-Day Reports
- **X-Reading** — interim sales reading, available to Managers and Servers.
- **Z-Reading** — day-closing reading, **Manager-only and once per business day**.
- Reading history (last 30) with gross sales, VATable sales, VAT, VAT-exempt sales, discounts, net sales, transaction count, and cancelled count.

### Menu & Combo Management ("Inventory" page)
- CRUD for categories (with brand colors), menu items, and combos.
- Image upload per dish (JPEG/PNG/WebP/GIF ≤ 5 MB) served from `/uploads`.
- Activate/deactivate items without deleting them.

### UX
- **Realtime multi-device sync** — SSE broadcasts `orders-changed` on every mutation; polling fallback if the stream drops.
- **Dark / light theme** with system-preference detection.
- **Responsive** — desktop POS layout collapses to a mobile shell with fixed bottom navigation and safe-area insets.

---

## Project Structure

```
.
├── package.json                # npm workspaces root (dev/build/prisma scripts)
├── .env.example                # copy to server/.env
├── client/                     # React + Vite SPA
│   └── src/
│       ├── App.tsx             # route table
│       ├── pages/              # OrderBoard, NewOrder, KitchenView, OrderDetail,
│       │                       # InventoryDashboard, Reports
│       ├── components/
│       │   ├── layout/         # Header, BottomNav, StaffSelector, PinConfirmModal
│       │   ├── orders/         # OrderCard, OrderItemsList, ComboPanel, DiscountPanel…
│       │   ├── tables/         # TableCard
│       │   ├── inventory/      # MenuItemFormModal, ComboFormModal
│       │   └── common/         # Modal, Loading, EmptyState, ErrorBanner
│       ├── hooks/              # useOrder (mutations), useOrderEvents (SSE)
│       ├── api/                # typed fetch wrappers per resource
│       ├── context/            # CurrentStaffContext, ThemeContext
│       └── index.css           # full design system (light + dark)
└── server/                     # Express + Prisma API
    ├── prisma/
    │   ├── schema.prisma       # 12 models, SQLite
    │   ├── seed.ts             # Filipino demo restaurant
    │   └── migrations/         # 12 migrations
    └── src/
        ├── app.ts              # cors, static /uploads, routers, error handlers
        ├── env.ts              # zod-validated environment
        ├── controllers/        # orders (core), menuItems, combos, staff, tables, reports
        ├── routes/             # one router per resource
        ├── lib/                # orderStateMachine, transitionService, orderEvents (SSE),
        │                       # pin (scrypt), authorize, comboPricing, businessDay
        └── middleware/         # errorHandler, notFound, multer upload
```

---

## Getting Started

### Prerequisites
- **Node.js 20+**
- npm (bundled with Node)

### Setup

```bash
# 1. Install dependencies (npm workspaces)
npm install

# 2. Create the server env file
#    Windows:
copy .env.example server\.env
#    macOS / Linux:
cp .env.example server/.env

# 3. Create the database schema and seed demo data
npm run prisma:migrate
npm run prisma:seed

# 4. Start both server and client
npm run dev
```

Then open **http://localhost:5273**.

| Service | URL | Notes |
|---------|-----|-------|
| Client (Vite dev) | http://localhost:5273 | Proxies `/api` and `/uploads` to the server |
| API server | http://localhost:4100 | `GET /api/health` returns `{status:"ok"}` |

> `server/uploads/` and `server/prisma/dev.db` are gitignored — a fresh clone **must** run the migrate + seed steps above. Re-running `prisma:seed` is idempotent (uses upserts) and also regenerates the placeholder dish images.

### Environment Variables

`server/.env` (validated with Zod at boot; the server exits with a clear error if invalid):

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `file:./dev.db` | SQLite file path (relative to `server/prisma/`) |
| `PORT` | `4100` | API port |
| `CLIENT_ORIGIN` | `http://localhost:5273` | Allowed CORS origin |

---

## Demo Credentials

The seed creates a demo Filipino restaurant: **9 tables** (capacities 2–10), **5 categories**, **30 dishes** with generated placeholder images, and **4 combos**. Staff PINs are each staff's ID repeated four times:

| Staff | Role | PIN |
|-------|------|-----|
| Mara Santos | Manager | `1111` |
| Bea Cruz | Server | `2222` |
| Cy Reyes | Server | `3333` |
| Dan Ortiz | Server | `4444` |
| Ella Ramos | Server | `5555` |
| Fabio Lim | Kitchen | `6666` |
| Grace Uy | Kitchen | `7777` |

Pick a staff member from the header's staff selector and enter their PIN to act as them.

---

## Roles & Permissions

| Capability (intended usage) | Manager | Server | Kitchen |
|---|:---:|:---:|:---:|
| View order board / create orders / take items | ✅ | ✅ | ✅ |
| Mark items ready (kitchen display) | ✅ | ❌ | ✅ |
| Mark items served / request & complete payment | ✅ | ✅ | ❌ |
| Manage menu items, combos, images | ✅ | ✅ | ❌ |
| Run X-Reading | ✅ | ✅ | ❌ |
| Close day with Z-Reading (once per business day) | ✅ | ❌ | ❌ |
| View Reports tab | ✅ | ✅ | ❌ |

How enforcement works today:

- **Reports are strictly role-gated server-side** via `requireStaffWithRole` (`server/src/lib/authorize.ts`): X-reading and reading history require Manager/Server, Z-reading requires Manager. The client additionally hides the Reports tab from Kitchen staff.
- Other actions (ready/served/payment/menu) are attributed to the acting `staffId` — passed by the client after PIN verification — but are not role-restricted at the API level; they rely on staff using the appropriate view (kitchen display vs. POS/board).

---

## API Reference

All endpoints are prefixed with `/api`. Request bodies are validated with Zod; errors return `{ "error": "message" }` with an appropriate status code (400 validation, 403 forbidden, 404 missing, 409 conflict).

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check → `{status:"ok"}` |

### Tables
| Method | Path | Description |
|---|---|---|
| GET | `/tables` | List tables with their active order (if any) |
| GET | `/tables/:id` | Single table |

### Staff
| Method | Path | Description |
|---|---|---|
| GET | `/staff` | List staff (`?activeOnly=false` to include inactive); PIN hashes never included |
| POST | `/staff/:id/login` | Verify PIN (4–8 digits); 401 on failure |

### Categories
| Method | Path | Description |
|---|---|---|
| GET | `/categories` | List categories |

### Menu Items
| Method | Path | Description |
|---|---|---|
| GET | `/menu-items` | List (`?categoryId=`, `?activeOnly=`) |
| POST | `/menu-items` | Create |
| PATCH | `/menu-items/:id` | Update (incl. activate/deactivate) |
| DELETE | `/menu-items/:id` | Hard delete (+ removes image file) |
| POST | `/menu-items/:id/image` | Upload image (field `image`, ≤5 MB, jpeg/png/webp/gif) |
| DELETE | `/menu-items/:id/image` | Remove image |

### Combos
| Method | Path | Description |
|---|---|---|
| GET | `/combos` | List (`?activeOnly=`) |
| POST | `/combos` | Create with `slots[]` (category IDs + sort order) |
| PATCH | `/combos/:id` | Update; slots replaced transactionally |
| DELETE | `/combos/:id` | Delete |

### Orders
| Method | Path | Description |
|---|---|---|
| GET | `/orders` | List (`?status=SEATED,PREPARING` comma list, `?since=<iso>`) |
| GET | `/orders/:id` | Full order: table, server, items, combos, status logs |
| POST | `/orders` | Create DINE_IN (`tableId`,`partySize`,`serverId`) or TAKEOUT (`serverId`) |
| POST | `/orders/:id/items` | Add item (merges into identical unready line of same round+notes) |
| PATCH | `/orders/:id/items/:itemId` | Set quantity (0 deletes) |
| DELETE | `/orders/:id/items/:itemId` | Remove line |
| PATCH | `/orders/:id/items/:itemId/ready` | Kitchen flags prepared (only while PREPARING) |
| PATCH | `/orders/:id/items/:itemId/served` | Server delivers (409 unless ready first) |
| PATCH | `/orders/:id/items/:itemId/takeout` | Per-line takeout flag (dine-in orders) |
| PATCH | `/orders/:id/items/:itemId/notes` | Kitchen notes (≤200 chars) |
| POST | `/orders/:id/combos` | Add combo (`comboId` + one selection per slot) |
| DELETE | `/orders/:id/combos/:comboInstanceId` | Remove combo (blocked if any component ready/served) |
| PATCH | `/orders/:id/combos/:comboInstanceId/takeout` | Combo takeout flag |
| PATCH | `/orders/:id/discount` | Apply/remove SENIOR/PWD discount (ID number + name) |
| POST | `/orders/:id/submit` | `SEATED → PREPARING` (requires ≥1 item) |
| POST | `/orders/:id/cancel` | `SEATED → CANCELLED` |
| POST | `/orders/:id/serve-ready-items` | Bulk-serve all ready items |
| POST | `/orders/:id/reopen` | `SERVED → PREPARING`, increments `currentRound` |
| POST | `/orders/:id/request-payment` | `SERVED → PAYMENT_PENDING` |
| POST | `/orders/:id/complete-payment` | `PAYMENT_PENDING → PAYMENT_FULFILLED`, frees table |

### Events (Server-Sent Events)
| Method | Path | Description |
|---|---|---|
| GET | `/events` | `text/event-stream`; emits `orders-changed` on every mutation, heartbeat every 25 s |

### Reports
| Method | Path | Description |
|---|---|---|
| GET | `/reports/x-reading` | Generate X reading (`?staffId=&date=`) — Manager or Server |
| POST | `/reports/z-reading` | Close day (`{staffId, date?}`) — Manager only, once per business day |
| GET | `/reports/readings` | Last 30 readings (`?staffId=`) — Manager or Server |

---

## Database Overview

SQLite via Prisma (`server/prisma/schema.prisma`). Key models:

| Model | Purpose |
|---|---|
| `Staff` | Staff members with role and scrypt-hashed PIN |
| `Table` | Restaurant tables (`number`, capacity, occupancy flag) |
| `Category` | Menu categories with display colors |
| `MenuItem` | Dishes; price in centavos, optional image |
| `Combo` / `ComboSlot` | Combo meals defined by category slots + % discount |
| `Order` | The pipeline entity: type, status, party size, server, totals, VAT fields, discount info, current round |
| `OrderItem` | Individual dish lines: name/price snapshots, quantity, `ready`/`served`/`isTakeout` flags, round, notes |
| `OrderCombo` | Combo instances on an order with price snapshot and round |
| `OrderStatusLog` | Full audit trail of status transitions |
| `DailyReading` | X/Z readings with sales, VAT, discount, and count aggregates |

Menu prices are **VAT-inclusive** (Philippine law). The API derives `vatableSales = round(subtotal / 1.12)` and `vatAmount = subtotal − vatableSales`. With a Senior/PWD discount, the order becomes VAT-exempt and total = `vatExemptSales − 20% discount`.

---

## Order State Machine

```
SEATED            → PREPARING | CANCELLED
PREPARING         → SERVED                       (auto when all items served)
SERVED            → PREPARING (new round) | PAYMENT_PENDING
PAYMENT_PENDING   → PAYMENT_FULFILLED            (terminal — table freed)
CANCELLED         → terminal
```

Transitions run through a single service (`server/src/lib/orderTransitionService.ts`) inside a Prisma transaction: staff validation → transition assertion → status-log write → table free (on fulfillment/cancel) → SSE broadcast. Item mutations are guarded too: items can only be added while `SEATED`/`PREPARING`, and are locked once ready/served.

---

## Scripts

Run from the repo root:

| Script | Description |
|---|---|
| `npm run dev` | Start API (tsx watch, :4100) and client (Vite, :5273) together |
| `npm run build` | Compile server (`tsc`) and client (`tsc -b && vite build`) |
| `npm run prisma:migrate` | Create/apply migrations (creates `server/prisma/dev.db`) |
| `npm run prisma:seed` | Seed demo restaurant + regenerate placeholder images |
| `npm run prisma:studio` | Open Prisma Studio (DB browser) |

After building, run the API standalone with `npm run start -w server` and preview the client with `npm run preview -w client`.

---

## Development Notes & Limitations

This project was built as a **demo / portfolio piece**, developed with the assistance of AI tooling (Claude Code). It is a functional emulation of a restaurant sales pipeline, not production-hardened POS software. Known limitations:

- **No automated tests, linter config, or CI pipeline** — the repository currently ships none.
- **No payment gateway** — payment is a manual "cash received" confirmation.
- **X/Z readings are not BIR-accredited** fiscal reporting; they are operational sales summaries only.
- **"Inventory" means menu management**, not stock/ingredient tracking.
- **No reservations, receipts/printing, or analytics charts.**
- **Auth is PIN-based per-request staff identification**, not sessions/JWT — fine for a trusted in-house LAN device setup, not for exposure to the public internet.

---

## License

No license file is included yet. All rights reserved by default — add a `LICENSE` if you intend to open-source this project.
