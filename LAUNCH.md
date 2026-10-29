# Launch notes

Working notes on what stands between the current code and a public launch. Updated 2026-10-28.
Tick items off as they are done; keep the "why" so the order can be revisited.

## Route chosen

Pilot first, not a public launch. The flow depends on real SMS, real carriers with real permits and a database
that has actually run the schema, so the plan is: close the compliance and branding gaps in code, then run the
untested parts with 2–3 butcheries, 1 slaughterhouse and a couple of carriers before opening signups.

Order matters: name and domain first (everything else hangs off them), then verify the flow, then SMS, then pilot.

## Done in code (2026-10-28)

- [x] Brand name, short name, site URL and support email live in `src/lib/brand.ts`. A rename is now one file
      plus the static assets listed under "Renaming checklist".
- [x] Admin screen `/dashboard/admin` to review carriers' permits and mark them checked or unchecked.
      Backed by the new Postgres function `admin_set_carrier_verified()` (admin-only, like every other state change).
      It notifies the carrier by SMS.
- [x] `carrier_block_reason` now also requires `is_verified`, so an unchecked carrier cannot be offered or accept a run.
      **Schema change, not yet run against a database.**
- [x] Draft `/terms` and `/privacy` pages, linked from the footer and signup. Drafts only. See "Needs a human".
- [x] `metadataBase` reads `NEXT_PUBLIC_SITE_URL` with a fallback of the production URL `https://kuja-na-stock.vercel.app` (live as of 2026-10-29).
- [x] README duplicate lines removed; "Not built yet" updated; CHANGELOG has an Unreleased entry.
- [x] `npx eslint src`, `npx tsc --noEmit` and `next build` pass. The SQL changes are NOT tested: no Postgres here.

## Needs a human (cannot be done from the repo)

1. **Choose the name.** "Kuja Na Stock" came from the produce/kiosk version. Check domain, trademark (KIPI) and
   social handles before committing. Do this before buying the domain or registering the SMS sender ID.
2. **Wire the production URL** `https://kuja-na-stock.vercel.app`: in Vercel set `NEXT_PUBLIC_SITE_URL` to it, and in
   Supabase → Authentication → URL Configuration set Site URL to it and add `https://kuja-na-stock.vercel.app/auth/confirm`
   (keep `http://localhost:3000/auth/confirm` for local work). Redeploy after changing env vars. Buying a custom domain
   later means repeating this with the new address.
3. **Database changes. Applied 2026-10-29** (39 products, `admin_set_carrier_verified` present). Original steps, kept for reference: The project in `.env.local` already has the v0.6.0 schema (checked 2026-10-29 with
   the anon key: 9 products, `accept_run` present). It does NOT yet have the admin function, the `is_verified` rule or
   the larger catalogue. Run `supabase/migrations/20261029_admin_verify_and_catalogue.sql` in the SQL editor (safe to
   re-run). Then mark existing test carriers with `update profiles set is_verified = true where role = 'rider';` or
   check them in `/dashboard/admin`. Make an admin with `update profiles set role = 'admin' where id = '…';`.
   Then walk through the README's "Try the full flow". `schema.sql` never drops anything; run on a project that
   already has the objects, it fails with "already exists".
   **The service-role key in `.env.local` is rejected (HTTP 401 "Invalid API key").** Replace
   `SUPABASE_SERVICE_ROLE_KEY` from Supabase → Project Settings → API. Until then cron, the SMS outbox and anything
   using the admin client fail.
4. **Africa's Talking**: create the account, test in sandbox, then apply for a sender ID (takes days) and top up.
   Fill `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID`.
5. **Vercel**: set all env vars including `CRON_SECRET`; confirm the two crons are registered on your plan.
6. **Legal**: have a Kenyan lawyer review `/terms` and `/privacy`; register with the ODPC as a data controller;
   confirm which meat-transport and food-handling licences the platform itself needs, if any.
7. **New logo.** The 3D boda mascot (`public/icons/*`, `public/logo.*`, `src/app/icon.png`) does not fit a meat brand.
8. **Landing copy review** with a real butcher.

## Benchmark: kamundiabutchery.co.ke (scraped 2026-10-29)

A Nairobi retail butchery (City Market, since 1959). It is B2C, we are B2B, so only the structure transfers.

How they organise it:
- **Products:** 82 cuts in 6 sections (Beef 26, Poultry 19, Goat/Mutton/Lamb 12, Fish & Seafood 11, Delicatessen 9,
  Pet Food 5). Offal sits inside Beef. Every item: name, one-line description, price per kg (or piece), a badge
  ("Prime cut", "Best value", "Cleaned in-house"), an "Unavailable" state, and a notes box for thickness and trim.
- **Browse tools:** section filter with counts, search, sort (section / name / price low-high / price high-low).
- **Services:** Delivery, Wholesale & Bulk, Nyama Choma cuts, Delivery & Payment, FAQ.
- **Areas:** 15 named Nairobi areas, each with its own page, plus an "all areas" page. Good for search traffic.
- **Trust and ordering:** founding year, stall address, opening hours, a stated delivery cutoff (4 pm), "weights confirmed
  before dispatch", and one-tap WhatsApp and call buttons everywhere.

Taken so far:
- [x] Section filter chips with counts, search and a tap list replace the single product dropdown (`OrderBuilder.tsx`).
- [x] Supplier "Add a product" list grouped by section.
- [x] Catalogue grown from 9 to 40 red-meat cuts using their trade names (gichiri, matumbo, ossobuco, ox tail, whole
      carcass…). Seed only; applies when the schema is run.
- [x] Order note prompts for cut size or trim.

Deliberately not copied:
- **Poultry, fish, deli, pet food.** Different suppliers and rules. Revisit after the red-meat pilot.
- **Sell-by-piece items** (samosas, mshikaki). Run load is computed in kg only (`run_load_kg`).
- **Retail price list.** Ours is a supplier comparison, so prices stay per supplier.

Worth doing next, in order of value:
1. **Areas.** Name the Nairobi areas we serve (needs a supplier/butchery `area` field or a lookup from lat/lng), show them
   on the landing page, and later one SEO page per area. Do not publish areas until suppliers and carriers exist there.
2. **WhatsApp and call buttons** on the landing page, login and signup. Fastest way to get help from a butcher.
3. **Product badges and descriptions** ("Best value", "Cleaned in-house") once suppliers can set them.
4. **Sort** options on the order screen (price, distance).
5. **Stated trust facts** on the landing page: hours, cutoff, what happens if weight is short.
6. **FAQ and Delivery & Payment pages** (they have both).

## After the pilot

- [ ] M-Pesa STK Push (Daraja). Cash plus recorded M-Pesa code is enough for the pilot.
- [ ] Automated tests for the SQL functions (needs local Supabase/Postgres; none is installed on this machine).
- [ ] Route optimisation, cold-chain monitoring.

## Renaming checklist

Code: edit `src/lib/brand.ts`.
The SMS prefix `'KNS: '` inside `notify()` in `supabase/schema.sql` (also the Postgres side of the name).
Static files that cannot import it: `public/manifest.json`, `public/offline.html`, `public/sw.js`
(cache name `kuja-na-stock-v2`: bump it so old caches are dropped), the icons and `public/logo.*`.
Outside the repo: GitHub repo name, Vercel project, Supabase project name, SMS sender ID, email templates in
Supabase → Authentication → Emails.
