# Kuja Na Stock (KNS)

B2B commodity supply and boda dispatch Progressive Web App built for informal food retailers, wholesale depots, farm gates, and motorcycle couriers across Nairobi.

[![Production Build](https://img.shields.io/badge/Production-Live%20on%20Vercel-success?style=flat-square)](https://supplier-hub-rouge.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-orange?style=flat-square)](https://web.dev/progressive-web-apps/)

---

## The Problem

In Nairobi, more than 70% of food retail moves through informal kiosks (dukas and Mama Mbogas). These retailers face three structural bottlenecks:

1. **Broker Markups:** Middlemen extract 20% to 35% between rural farm gates (e.g. Limuru, Kinangop) and retail stalls in Westlands or Kawangware.
2. **Delivery App Mismatch:** Consumer delivery apps (Uber Eats, Glovo, Bolt Food) are designed for 1–3 kg restaurant meals with 25%+ commissions. They do not handle 50 kg sacks of dry maize, 40 kg bags of beans, or 30 kg crates of tomatoes.
3. **Courier Exclusion:** Local stage-based boda boda riders lack access to scheduled B2B cargo runs, relying instead on unpredictable passenger gigs with long idle hours.

Kuja Na Stock connects corner kiosks directly to bulk wholesale depots and farm gates, using local stage boda riders for on-demand cargo transport with zero broker markups.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         KUJA NA STOCK PROTOCOL                         │
└────────────────────────────────────────────────────────────────────────┘
          │                                            │
          ▼                                            ▼
   [NODE 03: FARM GATE]                      [NODE 02: WHOLESALE DEPOT]
   Limuru / Kinangop                         Wakulima / Industrial Area
   Direct crop lots (Maize, Tomatoes)        Bulk stock & calibrated unit rates
          │                                            │
          └─────────────────────┬──────────────────────┘
                                │ Sourcing Matrix
                                ▼ (Cheapest vs Fastest)
                     [NODE 01: RETAIL KIOSK]
                     Stock monitoring, automated shortage
                     triggers, hands-free voice requisition
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
