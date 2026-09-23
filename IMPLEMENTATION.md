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

## 2. Upcoming Roadmap (Phase 2 Backlog)

### Sprint 6: Real-World Payment & SMS Rails (In Progress / Backlog)
- [ ] **M-Pesa Daraja STK Push:** Direct C2B and B2B settlement triggering payment prompt on the retailer's phone upon Boda delivery confirmation.
- [ ] **Africa's Talking SMS Fallback:** Send SMS notification to wholesalers and riders when a kiosk submits an order while offline.
- [ ] **GPS Breadcrumb Telemetry:** Geolocation API integration to track courier coordinates in transit between depot and kiosk.
- [ ] **Inventory Barcode / QR Scanning:** Camera-based quick check-in for received cargo sacks.

---

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

---

## 4. Verification & Testing Matrix

| Component | Test Case | Target State | Verified Status |
| :--- | :--- | :--- | :--- |
| **Retailer Inventory** | Requisition 50kg Maize | Stock increments +50 kg upon delivery | PASSED |
| **Sourcing Engine** | Price vs Speed comparison | Accurate KSh savings and ETA difference displayed | PASSED |
| **Wholesaler Terminal** | Calibration buttons (±5 KSh) | Listing rate updates and propagates across system | PASSED |
| **Boda HUD** | Advance trip state | Accepted → Picked Up → In Transit → Delivered | PASSED |
| **Voice Terminal** | "Order 50kg maize" command | Parser extracts item & qty, creates order, speaks response | PASSED |
| **PWA Manifest** | Install prompt & offline check | Returns 200 OK, standalone display configuration | PASSED |
| **Production Build** | `next build` with Turbopack | Zero TypeScript errors, zero lint warnings | PASSED |
