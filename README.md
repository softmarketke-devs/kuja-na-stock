# Kuja Na Stock (KNS)

**Order tonight. Stocked by 7 AM.**

Nairobi shop owners (dukas, kibandas, mama mbogas) order stock in the evening from farms and depots near them. The supplier confirms and packs overnight, and a boda rider collects at 05:00 and delivers between 05:00 and 07:00, before the shop opens. No 4 AM trip to Wakulima, Marikiti or Gikomba.

A Next.js PWA on Supabase (Postgres + Auth + Realtime), with SMS through Africa's Talking.

---

## How an order moves

```
 Retailer                 Supplier                  Rider                    System
 ────────                 ────────                  ─────                    ──────
 compares suppliers
 (price, km, fee)
 places order ─────────▶ SMS "new order"
 before 21:00            confirm (stock reserved)
                         ─ or decline ──▶ SMS to retailer
                         order joins the supplier's
                         morning run (max 6 drops) ──▶ SMS to nearby
                                                       available riders
                                                     accepts run ──────────▶ first to accept wins
 SMS "rider booked"  ◀── SMS "rider booked"
                                                     05:00 collects goods
 SMS "on the way" +  ◀──────────────────────────────  marks picked up
 4-digit code
 checks goods, pays,
 gives code ──────────────────────────────────────▶ enters code + payment
 stock auto-updated                                  ─ or "couldn't deliver"
 can report a problem
 within 24 h ──────────▶ SMS; resolves it
                                                                              21:05 nudge suppliers, re-offer runs
                                                                              03:30 cancel unconfirmed orders,
                                                                                    warn runs with no rider
```

### Rules

| Rule | Value |
|---|---|
| Order cutoff | 21:00 Nairobi time. Before → delivered tomorrow, after → the day after |
| Delivery window | 05:00–07:00 |
| Delivery fee | KSh 50 per road-km (straight line × 1.3), min KSh 100, paid to the rider |
| Run size | Up to 6 drops per supplier run |
| Unconfirmed orders | Cancelled at 03:30 on the delivery day |
| Delivery proof | Retailer's 4-digit code; 5 wrong tries locks it |
| Problems | Reportable within 24 h of delivery |

These live in `supabase/schema.sql` (enforced) and `src/lib/constants.ts` (display).

---

## Roles

| Role | Screens | Can |
|---|---|---|
| **Retailer** | `/dashboard/retailer` (+ `/order`, `/history`) | Track stock with low-stock alerts, compare suppliers by landed cost, order, repeat last basket, cancel before confirmation, see delivery code, report problems |
| **Supplier** (farm or depot) | `/dashboard/supplier` (+ `/listings`) | Manage prices and stock, confirm or decline orders, see morning runs with packing lists, book their own rider by phone, resolve problems |
| **Rider** | `/dashboard/rider` (+ `/run/[id]`) | Mark available mornings, accept nearby runs, pickup checklist, directions per drop, confirm delivery with code and payment, settlement summary |

Everyone sets their location in `/dashboard/settings` (GPS button or lat/lng). Distances and fees are calculated from it.

---

## Architecture

- **All state changes are Postgres functions** (`SECURITY DEFINER`, each checks the caller's role): `place_order`, `supplier_respond`, `accept_run`, `confirm_delivery`, … Server Actions in `src/app/actions/` only validate the form and call them. The app cannot put an order in an impossible state.
- **Row Level Security** limits what each user can read: their own orders, runs they're on, and contacts of people they share an order with. The delivery code sits in `order_secrets`, which only the retailer can read.
- **Realtime:** dashboards subscribe to `orders`, `delivery_runs` and `notifications` and refresh when something changes (`src/components/LiveRefresh.tsx`).
- **SMS:** `notify(..., p_sms => true)` writes to `sms_outbox` in the same transaction. `src/lib/sms.ts` drains it after each action and on each cron run, and retries failures up to 3 times.
- **Auth:** Supabase email + password. `src/proxy.ts` refreshes the session and redirects signed-out users away from `/dashboard`. A trigger creates the profile at signup; users can't change their own role.
- **Cron** (`vercel.json`): `/api/cron/evening` 18:05 UTC (21:05 EAT), `/api/cron/morning` 00:30 UTC (03:30 EAT), both protected by `CRON_SECRET`.

```
src/
├── proxy.ts                    session refresh + auth redirects
├── app/
│   ├── actions/                Server Actions (auth, profile, retailer, supplier, rider, notifications)
│   ├── api/cron/               evening / morning sweeps, SMS retry
│   ├── auth/confirm/           email confirmation callback
│   ├── dashboard/              role dashboards, settings, notifications
│   ├── login/ signup/
│   └── page.tsx                landing page
├── components/                 ActionForm, OrderCard, LiveRefresh, ui primitives
├── lib/                        supabase clients, auth, sms, cron, format, constants, queries
└── types/                      row types matching supabase/schema.sql
supabase/schema.sql             tables, functions, RLS, grants, realtime, product seed
```

---

## Setup

1. **Supabase project.** Use a fresh project. `supabase/schema.sql` replaces the old demo schema and doesn't migrate it. Run the whole file in the SQL editor.
2. **Auth → URL configuration:** add `https://YOUR-DOMAIN/auth/confirm` (and `http://localhost:3000/auth/confirm`) to the redirect URLs.
3. **Environment:** copy `.env.example` to `.env.local` and fill it in. Without `AT_USERNAME`/`AT_API_KEY`, SMS are printed to the server log instead of sent.
4. Run:
   ```bash
   npm install
   npm run dev
   ```
5. **Try the full flow:** sign up three accounts (retailer, supplier, rider) and set a location for each within a few km of one another. Add a listing as the supplier, order as the retailer, confirm as the supplier, mark the rider available and accept, pick up, then enter the code the retailer sees.
6. **Deploy on Vercel:** set the same env vars. The crons in `vercel.json` are picked up automatically.

To make someone an admin: `update profiles set role = 'admin' where id = '…';` in the SQL editor.

---

## Not built yet

- M-Pesa STK Push (Daraja). Payment is recorded by the rider today: cash, or M-Pesa with its confirmation code.
- Route optimisation. Drops are ordered nearest-first from the pickup.
- Admin console. Admin can read everything via RLS, but has no dedicated screens.
- Automated tests for the SQL functions (needs a local Supabase / Postgres).
