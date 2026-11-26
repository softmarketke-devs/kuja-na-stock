# BIG Premium Cuts

**Order tonight. Stocked by 7 AM.**

A B2B meat logistics app for Nairobi. Butcheries order in the evening from nearby slaughterhouses and meat wholesalers. A licensed meat carrier delivers between 05:00 and 07:00, before the butchery opens.

Next.js PWA · Supabase (Postgres, Auth, Realtime) · SMS via Africa's Talking · hosted on Vercel.

> **Status:** pre-pilot. The order flow passes automated end-to-end checks against a live Supabase project (`tests/`). Real SMS, browser click-through and real-user testing are still to do. See [LAUNCH.md](LAUNCH.md).

## How an order moves

1. **Butchery** compares suppliers (price per kg, distance, delivery fee) and orders before 21:00.
2. **Supplier** confirms (stock is reserved) or declines. Confirmed orders join the supplier's morning run, up to 6 drops.
3. **Carrier** nearby, with a checked and valid permit and enough load capacity, accepts the run. First to accept wins.
4. **05:00 pickup:** the carrier enters the certificate of transport number. The butchery gets an SMS with a 4-digit code.
5. **Delivery:** the butchery checks weight and stamp, pays the carrier, and gives the code. The carrier enters it and the stock count updates.
6. **Problems** can be reported within 24 hours.

Two cron jobs keep it moving: 21:05 nudges suppliers and re-offers runs; 03:30 cancels unconfirmed orders and warns about runs with no carrier.

## Rules

| Rule | Value |
|---|---|
| Order cutoff | 21:00 Nairobi time. Before: delivered tomorrow. After: the day after |
| Delivery window | 05:00–07:00 |
| Delivery fee | KSh 50 per road-km (straight line × 1.3), minimum KSh 100, paid to the carrier |
| Carrier eligibility | Checked by an admin, permit valid on the run date, vehicle recorded, run weight within capacity |
| Run size | Up to 6 drops |
| Unconfirmed orders | Cancelled at 03:30 on the delivery day |
| Delivery proof | 4-digit code. 5 wrong tries locks it |
| Permit reminders | SMS 30 and 7 days before expiry, and on the day |

Enforced in `supabase/schema.sql`; shown in the UI from `src/lib/constants.ts`. Change both together.

## Who does what

| Role | Home screen | Does |
|---|---|---|
| Butchery | `/dashboard/retailer` | Tracks stock, orders, repeats the last basket, reports problems |
| Supplier | `/dashboard/supplier` | Manages prices and stock, confirms orders, books their own rider |
| Meat carrier (`rider`) | `/dashboard/rider` | Registers permit, vehicle and capacity; accepts runs; picks up and delivers |
| Admin | `/dashboard/admin` | Checks carriers' permits and marks them checked |

Everyone sets a location on the account page (`/dashboard/settings`); distances and fees come from it.

## How it's built

- **Rules live in the database.** Every state change is a role-checked Postgres function (`place_order`, `accept_run`, `confirm_delivery`, …). Server Actions in `src/app/actions/` only validate input and call them.
- **Row Level Security** controls reads. The delivery code is in `order_secrets`, readable only by the butchery.
- **SMS** goes through an outbox table, drained after each action and by cron, with 3 retries. Without Africa's Talking credentials, messages print to the server log.
- **Cron:** `vercel.json` runs `/api/cron/evening` and `/api/cron/morning`, protected by `CRON_SECRET`.
- **Name and site URL** are set in `src/lib/brand.ts`.

```
src/app/            pages, Server Actions, cron routes, terms, privacy
src/components/     shared UI
src/lib/            Supabase clients, auth, SMS, constants, brand
src/proxy.ts        session refresh and sign-in redirects
supabase/schema.sql the whole database in one script: tables, functions, rules, seed data
supabase/make_admin.sql makes your account the shop owner (run once)
supabase/archive/   old scripts, history only: never run
```

## Run it

1. In Supabase → SQL Editor, run all of `supabase/schema.sql`. It works on a new project and on one that already has an older version of this database, and it is safe to run again. It also deletes the old butchery / supplier / carrier data, so take a backup first (Database → Backups).
2. In Supabase → Authentication → URL configuration, add `http://localhost:3000/auth/confirm` and `https://big-premium-cuts.vercel.app/auth/confirm`, and set Site URL to the production address.
3. Copy `.env.example` to `.env.local` and fill it in.
4. `npm install`, then `npm run dev`.
5. Make yourself the shop owner: edit your email into `supabase/make_admin.sql` and run it, then sign out and back in.
6. Try the full flow: as the owner, open Stock, set the delivery fee and kilos, and add prices. Sign up as a customer, add cuts to the cart, place an order, then open My orders to pay.

Production: https://big-premium-cuts.vercel.app. Deploy on Vercel with the same env vars, including `NEXT_PUBLIC_SITE_URL`; the crons in `vercel.json` are picked up automatically.

## Not built yet

- M-Pesa STK Push. For now the carrier records cash, or an M-Pesa confirmation code.
- Route optimisation (drops are ordered nearest first).
- Admin screens beyond permit checks.
- Automated tests for the SQL functions.
- Temperature monitoring in transit.

More docs: [LAUNCH.md](LAUNCH.md) (launch blockers), [IMPLEMENTATION.md](IMPLEMENTATION.md) (design decisions), [CHANGELOG.md](CHANGELOG.md).
