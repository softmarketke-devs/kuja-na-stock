# Kuja Na Stock (KNS)

B2B commodity supply and boda dispatch Progressive Web App built for informal food retailers, wholesale depots, farm gates, and motorcycle couriers across Nairobi.

[![Production Build](https://img.shields.io/badge/Production-Live%20on%20Vercel-success?style=flat-square)](https://supplier-hub-rouge.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-orange?style=flat-square)](https://web.dev/progressive-web-apps/)

---

## The Problem

In Nairobi, more than 70% of food retail moves through informal kiosks (dukas and Mama Mbogas). These micro-retailers face three critical operational bottlenecks:

1. **Opaque Pricing & Middleman Rent-Seeking:** Informal food pricing is completely opaque. Brokers at central markets arbitrarily dictate daily commodity rates, extracting 20% to 35% in hidden markups with zero price transparency for the kiosk owner.
2. **The Exhausting 4 AM Market Trek:** Retailers are forced to wake up at 3:30 AM–4:00 AM, pay for round-trip matatus to congested, muddy wholesale hubs (Wakulima/Marikiti or Gikomba), haggle in person, hire pushcart porters, and haul 50 kg sacks back to their kiosks—wasting 3 to 4 productive hours and exposing themselves to pre-dawn crime and harassment before their shop even opens.
3. **Consumer Delivery Apps Fail Bulk Cargo:** Consumer logistics apps (Uber Eats, Glovo, Bolt Food) are engineered for 1–2 kg prepared restaurant takeout with steep 25%+ commissions. They are structurally incapable of handling bulk food sacks (40 kg beans, 50 kg maize, 30 kg tomato crates).

---

## The Solution: Kuja Na Stock (KNS)

Kuja Na Stock is an industrial PWA logistics terminal that bridges corner kiosks directly with nearby food producers and wholesale hubs, dispatching local stage boda couriers for rapid cargo delivery.

### MVP Focus: Hyper-Local Urban & Peri-Urban Farms

For our initial MVP rollout, the platform focuses strictly on **urban and peri-urban farms in close proximity to vendors** (3–10 km radius across Nairobi corridors such as Ruaka, Wangige, Kiambu road, Kasarani, and Ngong):

- **Proximity-First Transit:** Freshly harvested greens, tomatoes, potatoes, and dairy can be dispatched and delivered directly to the kiosk doorstep in 15–25 minutes via standard stage boda bodas.
- **Low Unit Friction:** Eliminates the need for long-haul multi-day cold chains, keeping platform unit economics lean and reliable for MVP validation.

### Core Value Propositions & Benefits

1. **Multiple Transparent Price Options (Zero Opaque Pricing):**
   - The platform provides an instant, side-by-side sourcing radar comparing **Cheapest (Urban Farm Gate)** vs. **Fastest (Wholesale Depot)**.
   - Retailers see the exact item unit price, distance in kilometers, delivery fee, and net profit margins—eliminating broker extortion.
2. **Eliminates the Need to Physically Go to the Market:**
   - Kiosk operators order digitally or via hands-free voice without leaving their counter.
   - Reclaims 3 to 4 hours of sleep and daily labor; produce arrives at the kiosk while morning customers are served.
3. **Guaranteed Boda Cargo Work:**
   - Converts idle stage riders into calibrated B2B freight carriers with guaranteed round-trip payouts.

### Future Expansion Horizon

While the MVP validates hyper-local urban farm proximity, the system architecture is built to support a phased scale-out:
- **Inter-County Corridors:** Direct farm-to-depot sourcing routes connecting high-yield agricultural basins (Rift Valley maize, Nyandarua potatoes, Meru bananas).
- **Cross-Border / Intercountry Trade:** Digital customs waybills and bulk aggregation from regional trade corridors (e.g., Uganda grain flows, Tanzania produce).
- **Multi-Modal Fleet Dispatch:** Expanding carrier matching beyond Boda motorcycles to include 1-tonne Pickups, 3-tonne Canters, and refrigerated lorries for large-batch bulk orders.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         KUJA NA STOCK PROTOCOL                         │
└────────────────────────────────────────────────────────────────────────┘
          │                                            │
          ▼                                            ▼
   [NODE 03: URBAN FARM GATE]                [NODE 02: WHOLESALE DEPOT]
   Ruaka / Wangige / Kiambu (3-8 km)         Wakulima / Industrial Area
   Direct fresh harvest (Tomatoes, Greens)   Calibrated bulk depot stock
          │                                            │
          └─────────────────────┬──────────────────────┘
                                │ Sourcing Radar
                                ▼ (Cheapest vs Fastest Transparent Rates)
                     [NODE 01: RETAIL KIOSK]
                     Stock monitoring, automated shortage
                     triggers, hands-free voice requisition
                     (Zero 4 AM market commutes needed)
                                │
                                │ Dispatch Ping
                                ▼
                     [NODE 04: BODA DISPATCH]
                     Stage-based riders receive trip fee,
                     route telemetry, and 1-tap accept
```

### System Workflows

```mermaid
sequenceDiagram
    autonumber
    participant K as Retail Kiosk (Mama Sarah)
    participant E as KNS Sourcing Engine
    participant S as Supplier (Wholesale / Farm)
    participant B as Boda Courier (James)

    K->>E: Low-stock alarm triggered (e.g., Maize < 20kg)
    E->>K: Compares Cheapest (Farm Gate) vs Fastest (Depot)
    K->>E: Submits requisition (Manual or Voice HUD)
    E->>S: Notifies supplier node to pack cargo
    S->>E: Confirms order ready for carrier
    E->>B: Broadcasts dispatch radar offer (KSh fee + KM distance)
    B->>E: Accepts trip & updates status to "Picked Up"
    B->>K: Delivers bulk produce to kiosk & collects settlement
    K->>E: System marks delivered; inventory auto-increments
```

---

## Core Features

- **Cheapest vs. Fastest Sourcing Radar:** Instant price and arrival-time comparison between direct farm gates (maximum margin savings) and local wholesale depots (fastest restocking during rush hours).
- **Hands-Free Voice Dispatch HUD:** Speech-to-order interface designed for shopkeepers managing busy counters. Runs on the browser Web Speech API with an ElevenLabs neural audio pipeline (`hpp4J3VqNfWAUOO0d1Us`) and an inline fallback command bar for network-restricted environments (Brave/Edge).
- **4 Dedicated Operator Terminals:**
  - `Retailer HUD (/dashboard/retailer)`: Real-time stock levels, shortage warning alerts, 1-tap requisition modal.
  - `Wholesale Terminal (/dashboard/wholesaler)`: Depot inventory management, bulk dynamic rate calibration, order dispatch queue.
  - `Farm Gate Terminal (/dashboard/farmer)`: Direct harvest lot listings, crop availability, farm-gate payout logs.
  - `Boda Rider Radar (/dashboard/boda_rider)`: Live dispatch radar, trip earnings, turn-by-turn cargo tracking from pickup to kiosk drop-off.
- **High-Contrast Field UI:** Clean white substrate (`#ffffff` / `#f8fafc`) with safety-orange action triggers (`#ea580c`), monospace Inconsolata telemetry typography, and sunlight-readable data tables.
- **PWA Architecture:** Service worker caching, offline asset manifest, installable on mobile devices without app store gatekeeping.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16.3.5 (App Router, Turbopack) |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS v4 |
| **State Management** | Zustand (persistent client state with multi-role simulation) |
| **Database & Auth** | Supabase (PostgreSQL with Row Level Security) |
| **Voice & Speech** | Web Speech API + ElevenLabs Neural TTS API |
| **Icons & Font** | Lucide React + Google Fonts (Inconsolata) |
| **Deployment** | Vercel Serverless / Edge Network |

---

## Directory Structure

```
kuja-na-stock/
├── public/
│   ├── icons/              # PWA manifest icons (192x192, 512x512, square)
│   ├── favicon.ico         # Multi-size RGBA browser icon
│   ├── logo.jpg            # Brand logo and social graph image
│   ├── manifest.json       # Web app manifest configuration
│   └── sw.js               # Service worker offline caching
├── src/
│   ├── app/
│   │   ├── api/tts/        # ElevenLabs neural audio synthesis endpoint
│   │   ├── dashboard/
│   │   │   ├── boda_rider/ # Node 04: Rider telemetry cockpit
│   │   │   ├── farmer/     # Node 03: Farm gate lot manager
│   │   │   ├── retailer/   # Node 01: Kiosk inventory & ordering HUD
│   │   │   └── wholesaler/ # Node 02: Bulk depot & pricing terminal
│   │   ├── login/          # Operator authentication & quick demo access
│   │   ├── signup/         # Node registration & role onboarding
│   │   ├── globals.css     # Theme tokens & tactical micro-grid styles
│   │   ├── layout.tsx      # Root layout, Inconsolata font, metadataBase
│   │   ├── manifest.ts     # Next.js dynamic PWA manifest route
│   │   └── page.tsx        # Public sourcing radar & architecture showcase
│   ├── components/
│   │   ├── DemoRoleSwitcher.tsx    # Role simulator and alert center
│   │   └── VoiceAssistantModal.tsx # Dual speech engine dispatch modal
│   ├── hooks/
│   │   ├── useAuth.ts      # Authentication handler
│   │   └── useVoice.ts     # Speech synthesis abstraction
│   ├── lib/
│   │   └── supabase/       # Client and server database connectors
│   ├── store/
│   │   └── index.ts        # Zustand store (inventory, orders, telemetry)
│   └── types/
│       └── index.ts        # Domain models (Product, Order, Listing, Rider)
├── IMPLEMENTATION.md       # Engineering sprints, ADRs, and backlog tracking
├── CHANGELOG.md            # Version release notes
└── .env.example            # Environment variable template
```

---

## Getting Started

### Prerequisites

- Node.js 18.18+ (Node 20 or 22 recommended)
- npm, pnpm, or yarn

### 1. Clone the repository

```bash
git clone https://github.com/softmarketke-devs/kuja-na-stock.git
cd kuja-na-stock
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your configuration:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ELEVENLABS_API_KEY=your-elevenlabs-key # Optional: falls back to browser voice
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Production build check

```bash
npm run build
```

---

## Live Deployment

- **Production URL:** [https://supplier-hub-rouge.vercel.app](https://supplier-hub-rouge.vercel.app)
- **Manifest:** [https://supplier-hub-rouge.vercel.app/manifest.webmanifest](https://supplier-hub-rouge.vercel.app/manifest.webmanifest)

---

## License

MIT License. Designed and developed for the East African informal retail logistics ecosystem.
