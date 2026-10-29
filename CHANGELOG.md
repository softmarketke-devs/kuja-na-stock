# Changelog

All notable changes to the Kuja Na Stock (KNS) platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Admin screen `/dashboard/admin` and `admin_set_carrier_verified()` to check carriers' permits; the carrier is notified by SMS.
- Draft `/terms` and `/privacy` pages, linked from the landing page footer and the signup form.
- `src/lib/brand.ts`: one place for the product name, site URL and support email.
- `supabase/migrations/20261029_admin_verify_and_catalogue.sql`: applies the admin check, the `is_verified` rule and the larger catalogue to a database that already has v0.6.0.
- `LAUNCH.md`: launch blockers, decisions and the renaming checklist.

### Security
- Upgraded Next.js 16.3.5 to 16.4.3 (and `eslint-config-next` to match) and ran `npm audit fix`: `npm audit` now reports 0 vulnerabilities (was 1 critical, 3 high).

### Added (continued)
- `/faq` and `/delivery-and-payment` pages, a facts strip on the landing page, and call/WhatsApp buttons (hidden until `NEXT_PUBLIC_SUPPORT_PHONE` / `_WHATSAPP` are set).
- Sort control (name, price) on the order screen.
- `tests/db_flow.py` and `tests/pages_flow.py`: live end-to-end checks (guarded by `KNS_TEST_OK=1`).

### Removed
- Unused dependencies left from the old demo: five `@radix-ui/*` packages, `leaflet`, `react-leaflet`, `@types/leaflet`, `tailwind-merge`, `next-pwa`, `workbox-webpack-plugin`.
- Default Next.js template images in `public/` and the unused OpenStreetMap image host.
- Untracked local tooling (`.mcp.json`, `supabase/.temp/`) now gitignored.

### Changed
- Carriers must be checked by an admin before they can be offered or accept a run (`carrier_block_reason`). Existing carriers need checking after the schema is applied.
- Metadata base URL comes from `NEXT_PUBLIC_SITE_URL`.

---

## [0.6.0] - 2026-10-03

Changed focus from fresh-produce retailers to butcheries. Kuja Na Stock is a B2B meat logistics platform: butcheries buy, slaughterhouses and wholesalers sell, licensed meat carriers deliver.

### Added
- Carriers register their meat transport permit number and expiry, vehicle registration and load capacity (kg) once, at signup. Signup rejects an already-expired permit.
- Account page (formerly Settings) shows the carrier's permit status: valid, expiring within 30 days, expired, or not recorded, plus whether Kuja Na Stock has checked it.
- Evening sweep sends permit reminders 30 and 7 days before expiry and on the expiry date.
- Suppliers see the booked carrier's vehicle, permit status and certificate of transport number.
- Carriers are only offered, and can only accept or be assigned, runs when their permit is recorded and valid on the run date and the run's weight fits their load capacity (`carrier_block_reason`, `run_load_kg`).
- Certificate of transport number required at pickup (`mark_run_picked_up(run_id, transport_cert_no)`), stored on the run.
- Pickup checklist: certificate of transport, inspection stamp, clean closed container.
- Changing permit or vehicle details clears `is_verified`.

### Changed
- Supplier types are now `slaughterhouse` and `wholesaler` (were `farm` and `depot`).
- Product catalogue is meat sold by the kg: beef, goat, mutton and offal.
- All user-facing text: butchery instead of shop, meat carrier instead of boda rider, base instead of stage.

---

## [0.5.0] - 2026-09-24

Refocused the product on one problem: getting stock to the kiosk before opening, without the 4 AM market trip.

### Added
- New Supabase schema (`supabase/schema.sql`): orders with line items, delivery runs (one per supplier per morning, max 6 drops), delivery codes, payments, delivery issues, rider availability, SMS outbox.
- Postgres functions for the whole lifecycle: `place_order`, `reorder_last_delivery`, `cancel_order`, `supplier_respond`, `supplier_assign_rider`, `accept_run`, `release_run`, `mark_run_picked_up`, `confirm_delivery`, `fail_delivery`, `report_issue`, `resolve_issue`, `evening_sweep`, `morning_sweep`.
- Row Level Security for every table, profile-creation trigger on signup, role-change guard.
- Next-morning delivery with a 21:00 cutoff and 05:00–07:00 window; distance-based delivery fee paid to the rider.
- Supplier comparison by landed cost (price + delivery fee) for the retailer's own location.
- 4-digit delivery code handed over by the retailer; stock is added to the retailer's inventory on delivery.
- Africa's Talking SMS via an outbox, with retries.
- Vercel cron routes for the evening (21:05) and morning (03:30) sweeps.
- `src/proxy.ts` session refresh and auth redirects; role checks in every dashboard page.
- Live dashboard refresh via Supabase Realtime.
- Settings page with GPS location capture.
- Offline fallback page.

### Changed
- Roles are now retailer, supplier (farm or depot) and rider; the separate wholesaler and farmer dashboards are merged into one supplier dashboard.
- Dashboards read from and write to Supabase through Server Actions instead of a per-browser Zustand store.
- Service worker no longer caches pages (stale orders); only static assets are cached.

### Removed
- Demo role switcher and seeded demo store (`zustand`).
- Voice assistant and the ElevenLabs `/api/tts` endpoint (it was unauthenticated).

---

## [0.4.0] - 2026-09-24

### Added
- MVP Core Value Proposition block on the public dashboard highlighting multiple transparent price options, elimination of 4 AM market commutes, and hyper-local urban farm proximity (3–8 km).
- `ADR-005` in `IMPLEMENTATION.md`: Strategic scoping to urban/peri-urban agriculture for MVP validation and multi-modal roadmap (pickups, Canters, refrigerated trucks) for inter-county expansion.
- Phased Sprint 6 and Sprint 7 roadmap for inter-county corridors and regional cross-border freight waybills.

### Changed
- Refocused supplier Node 03 from generic rural farm gates to peri-urban agricultural hubs (Ruaka, Wangige, Kiambu road).
- Sourcing radar updated to reflect realistic 3–8 km proximity routes with 15–20 minute Boda fulfillment.
- Requisition modal updated with `DIRECT URBAN FARM` badge and transparent cost breakdown (commodity + carrier fee).

---

## [0.3.0] - 2026-09-22

### Added
- Official 3D Boda Courier brand mascot integrated across navigation bars, hero showcase card, and authentication views.
- Multi-resolution PWA asset pipeline (`logo.jpg`, `logo-square.png`, `icon-192.png`, `icon-512.png`, `favicon.ico`).
- `metadataBase` configuration in `layout.tsx` for social sharing graph cards.

### Changed
- Rebranded platform identity to **Kuja Na Stock (KNS)** across manifests, store states, and page titles.
- Complete theme overhaul from dark brutalist palette to an accessible **White & Orange** high-contrast field design (`#ffffff` surfaces, `#f8fafc` substrate, `#ea580c` action triggers).
- Integrated Google Font **Inconsolata** with optical sizing across all numerical telemetry and tabular data displays.

---

## [0.2.0] - 2026-09-21

### Added
- Sourcing intelligence engine highlighting **Cheapest vs. Fastest** routing across all commodities.
- Dual decision radar cards on the public homepage and retailer requisition modal.
- Automated safety stock threshold alerts on the retailer dashboard.
- ElevenLabs neural text-to-speech route (`/api/tts`) utilizing Bella voice profile (`hpp4J3VqNfWAUOO0d1Us`).
- Fallback inline tactical command input bar for environments where microphone access or cloud speech recognition is restricted.
- 1-tap hardware macro test buttons inside the voice terminal.

### Fixed
- Web Speech API premature disconnection by switching recognition mode to continuous and implementing a 1.8-second auto-silence timer.
- Standardized recognition language to `en-US` to avoid regional dialect drops on Chromium speech cloud servers.

---

## [0.1.0] - 2026-09-20

### Added
- Initial release of the Kuja Na Stock B2B dispatch architecture.
- 4 interactive operator nodes:
  - Retailer Kiosk HUD (`/dashboard/retailer`)
  - Bulk Wholesale Terminal (`/dashboard/wholesaler`)
  - Farm Gate Direct Terminal (`/dashboard/farmer`)
  - Boda Rider Telemetry Cockpit (`/dashboard/boda_rider`)
- Full B2B requisition and courier dispatch lifecycle state machine.
- Supabase PostgreSQL schema with Row Level Security (RLS) policies.
- Demo role switcher component for rapid role evaluation.
- Progressive Web App manifest and basic service worker configuration.
