# Implementation Tracking & Architecture Log

Engineering progression, architectural decisions, and development roadmap for **Kuja Na Stock (KNS)**.

---

## 1. Development Milestones & Sprint Progress

```
[Phase 1: Architecture] ───► [Phase 2: Sourcing Engine] ───► [Phase 3: Speech HUD] ───► [Phase 4: Field UI] ───► [Phase 5: Production]
      (COMPLETED)                  (COMPLETED)                    (COMPLETED)               (COMPLETED)             (COMPLETED)
```

### Sprint 1: Domain Modeling & Multi-Node Architecture (Completed)
- [x] Defined core TypeScript interfaces for agricultural commodities, bulk listings, retail inventory, and boda assignments (`src/types/index.ts`).
- [x] Implemented multi-role simulator (`src/components/DemoRoleSwitcher.tsx`) allowing instant switching between:
  - `Node 01`: Retailer (Mama Sarah Kiosk)
  - `Node 02`: Wholesaler (Kilimo Traders Depot)
  - `Node 03`: Farm Gate (Green Valley Co-op)
  - `Node 04`: Boda Carrier (James Otieno)
- [x] Seeded baseline Nairobi commodity catalog across staple food groups: Dry White Maize, Rosecoco Beans, Plum Salad Tomatoes, Shangi Irish Potatoes, Cow Milk, and Fresh Farm Eggs.
- [x] Structured Zustand state store (`src/store/index.ts`) handling state mutations across the full order lifecycle.

### Sprint 2: Sourcing Arbitration Engine (Completed)
- [x] Implemented algorithmic comparison engine: **Cheapest vs. Fastest** sourcing.
  - **Cheapest Option:** Computes lowest all-in invoice including road distance delivery fee (prioritizes rural farm gates).
  - **Fastest Option:** Computes shortest transit ETA based on Boda road distance (prioritizes neighborhood wholesale depots).
- [x] Embedded dual decision radar cards in the public homepage (`src/app/page.tsx`) and the retailer requisition modal (`src/app/dashboard/retailer/page.tsx`).
- [x] Automated low-stock trigger: when kiosk inventory drops below safety threshold (e.g., maize < 20kg), system flags critical shortage and recommends optimal supplier.

### Sprint 3: Dual-Layer Speech Engine (Completed)
- [x] Integrated ElevenLabs Neural Audio endpoint (`/api/tts`) utilizing the multilingual voice pipeline (`hpp4J3VqNfWAUOO0d1Us` - Bella).
- [x] Implemented browser Web Speech API (`SpeechRecognition`) for hands-free shopkeeper ordering.
- [x] Handled browser network drops and privacy shields (e.g. Brave / Edge privacy blocks) by providing:
  - Standardized `en-US` cloud recognition routing.
  - Persistent inline tactical command input (`<input>` + `[TRANSMIT]`) allowing 100% testability without working microphone permissions.
  - 1-tap hardware macro test buttons (`[★ SMART RADAR]`, `[REQUISITION]`).

### Sprint 4: Field UI Hardening & Theme Overhaul (Completed)
- [x] Overhauled UI from dark brutalist palette to an accessible **White & Orange** high-contrast theme:
  - Background: light substrate `#f8fafc` with subtle tactical grid.
  - Surface cards: `#ffffff` with `border-slate-200` and soft shadows.
  - Action triggers: safety orange `#ea580c` for high outdoor sunlight visibility.
- [x] Integrated Google font **Inconsolata** with optical sizing (`font-mono`) to prevent layout shifts when prices, tonnages, and coordinates update.
- [x] Standardized design across all 4 operator dashboards, login, signup, and modals.

### Sprint 5: PWA Hardening & Production Deployment (Completed)
- [x] Generated multi-size PWA assets:
  - `public/icons/icon-192.png` & `public/icons/icon-512.png` (maskable home screen icons).
  - `public/icons/logo-square.png` (master 417x417 asset).
  - `public/favicon.ico` (multi-resolution 16/32/48 RGBA ICO).
  - `public/logo.jpg` (OpenGraph social card).
- [x] Implemented service worker offline asset caching (`public/sw.js`).
- [x] Configured Next.js dynamic web manifest (`src/app/manifest.ts`) and static manifest fallback (`public/manifest.json`).
- [x] Successfully deployed to Vercel production edge network (`https://supplier-hub-rouge.vercel.app`).

---

## 2. Upcoming Roadmap (Phased Expansion)

### Sprint 6: Urban Farm Proximity & Transparent Multi-Tier Pricing
- [x] **Proximity-First Urban Farm Directory:** Integrated peri-urban agricultural hubs (Ruaka, Wangige, Kiambu road) within a 3–10 km vendor radius.
- [x] **Transparent Multi-Tier Pricing Engine:** Exposes side-by-side transparent unit rates (Urban Farm Gate vs Wholesale Depot) with exact delivery breakdown to eliminate opaque broker markups.
- [x] **Market Commute Elimination Flow:** Zero-commute requisition interface allowing shopkeepers to order without closing stalls or making 4 AM trips to Wakulima/Marikiti.
- [ ] **M-Pesa Daraja STK Push:** Direct C2B and B2B settlement triggering payment prompt on the retailer's phone upon Boda delivery confirmation.
- [x] **Africa's Talking SMS:** Outbox-based SMS for new orders, confirmations, run offers, pickup (with delivery code), delivery receipts and problems (v0.5.0).

### Sprint 7: Multi-Modal Transport Fleet & Inter-County Corridors (Expansion Horizon)
- [ ] **Multi-Modal Vehicle Dispatch:** Expand carrier matching beyond Boda boda motorcycles to include 1-tonne Pickups, 3-tonne Canters, and refrigerated lorries.
- [ ] **Inter-County Sourcing Corridors:** Scheduled batch freight connecting major agricultural production zones (Rift Valley, Nyandarua, Meru) to peri-urban aggregation depots.
- [ ] **Cross-Border / Intercountry Trade Gateway:** Digital waybills, customs manifests, and bulk lot verification for regional cross-border commodity flow (Uganda grain, Tanzania produce).
- [ ] **GPS Breadcrumb Telemetry:** Geolocation API integration to track courier coordinates in transit between farm/depot and kiosk.

---

### Sprint 6b: Next-Morning Delivery Rebuild (v0.5.0, current focus)
- [x] Supabase schema with orders, line items, delivery runs, delivery codes, payments, issues, rider availability.
- [x] Lifecycle as role-checked Postgres functions + RLS; Server Actions replace the Zustand demo store.
- [x] 21:00 cutoff, 05:00–07:00 delivery window, batched runs (max 6 drops), first-accept rider booking, supplier can book own rider.
- [x] Delivery-code handover, payment record, automatic restock, 24 h problem reporting.
- [x] Evening/morning cron sweeps; proxy auth redirects; realtime dashboard refresh.
- [ ] Run the schema on a live project and verify the end-to-end flow.
- [ ] Automated tests for the SQL functions.

## 3. Architecture Decision Records (ADRs)

### ADR-001: Progressive Web App (PWA) over Native Android APK
- **Status:** Accepted
- **Context:** Informal retailers and Boda riders in Nairobi predominantly use Android devices with limited internal storage (16GB–32GB) and prepaid mobile data bundles.
- **Decision:** Build as an installable PWA via Next.js and Service Workers rather than a 50MB–100MB Google Play Store APK.
- **Consequences:** Near-zero installation friction, instant updates without Play Store review latency, functional offline caching, and sub-second initial loads.

### ADR-002: Hybrid Speech Architecture (Web Speech + Neural TTS Fallback)
- **Status:** Accepted
- **Context:** While ElevenLabs generates human-grade audio responses, shopkeepers in noisy markets require low-latency inputs, and certain mobile browsers (Brave, Edge) restrict speech cloud services.
- **Decision:** Use browser-native `webkitSpeechRecognition` for listening with strict silence-detection auto-submit (1.8s), paired with server-side ElevenLabs synthesis. If the neural API is unreachable or quota-limited, gracefully fall back to local `window.speechSynthesis`. Provide a manual text command bar for silent operation.
- **Consequences:** 100% uptime regardless of API quota or browser security settings.

### ADR-003: Zustand Local State with Supabase Backend Sync
- **Status:** Accepted
- **Context:** Commodity markets in Nairobi experience intermittent 3G/4G connectivity drops. Blocking transactions on synchronous cloud database roundtrips creates unacceptable operational delays.
- **Decision:** Implement an optimistic client-side Zustand store for immediate UI updates, backed by asynchronous Supabase PostgreSQL synchronization with Row Level Security (RLS).
- **Consequences:** Kiosk orders log instantly without UI freeze; synchronization occurs opportunistically when connectivity is active.

### ADR-004: Monospace Typography with Optical Sizing
- **Status:** Accepted
- **Context:** Telemetry dashboards displaying dynamic unit prices (KSh/kg), distances (km), and batch tonnages suffer from layout jitter when rendered in proportional sans-serif fonts.
- **Decision:** Standardized on `Inconsolata` with CSS `font-optical-sizing: auto` and variable width for all numeric data and tabular readouts.
- **Consequences:** Rock-solid columnar alignment across small mobile viewports and large depot screens.

### ADR-005: Urban Agriculture Proximity for MVP vs Inter-County Freight Expansion
- **Status:** Accepted
- **Context:** Long-distance agricultural freight (e.g., Rift Valley, Western Kenya, Uganda/Tanzania borders) involves multi-day routing, cold-chain risks, inter-county cess taxes, and multi-tonne trucks. Meanwhile, urban kiosks suffer immediately from two acute daily pain points: opaque broker pricing and losing 3–4 hours every morning commuting to Wakulima/Marikiti market at 4 AM.
- **Decision:** Scope the initial MVP strictly to **Urban and Peri-Urban Farms in close proximity to vendors (3–10 km)** (Ruaka, Wangige, Kiambu road, Kasarani, Ngong). This enables rapid 15–25 minute Boda cargo runs, provides transparent side-by-side pricing to kill broker markups, and eliminates the 4 AM market trip. Decouple transport vehicle interfaces in domain models (`src/types/index.ts`) so that Phase 2 can seamlessly onboard 1-tonne pickups, Canters, and inter-county transit corridors.
- **Consequences:** Drastically compressed fulfillment cycle (minutes vs days), minimal capital expenditure for carriers, verified vendor product-market fit, and a clean architectural runway for regional freight scaling.

---

### ADR-006: Single focus on next-morning stock delivery (supersedes ADR-002, ADR-003)
- **Status:** Accepted (2026-09-24)
- **Context:** The prototype covered sourcing, voice ordering, instant dispatch and four operator terminals, but kept all data in each browser's Zustand store, so no two phones shared an order. The problem shopkeepers feel most every day is the pre-dawn market trip.
- **Decision:** Build only the flow that removes that trip. Retailers order by 21:00, suppliers confirm and reserve stock, orders are batched into one run per supplier per morning, a nearby rider accepts the run and delivers 05:00–07:00, and the retailer's code confirms the handover. Every state change is a Postgres function guarded by the caller's role, and RLS controls reads. Voice, TTS and the demo store are removed.
- **Consequences:** The app now works across devices, and the rules are enforced in one place (the database). Instant on-demand delivery is out of scope. The schema is new and does not migrate the demo data.

---

## 4. Verification & Testing Matrix (v0.5.0)

| Check | Status |
| :--- | :--- |
| `next build` (Turbopack, TypeScript) | Passed |
| `eslint src` | Passed, 0 problems |
| `supabase/schema.sql` executed against Postgres/Supabase | **Not yet run.** Reviewed by hand only |
| End-to-end flow (retailer → supplier → rider → delivered) on a live Supabase project | **Not yet run** |
| Africa's Talking sandbox SMS | **Not yet run** |

Run `supabase/schema.sql` on a fresh project and walk through the "Try the full flow" steps in the README before relying on these.
