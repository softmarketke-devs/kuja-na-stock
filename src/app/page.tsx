'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Store,
  Building2,
  Leaf,
  Bike,
  Mic,
  ArrowRight,
  Terminal,
  Activity,
  Zap,
  Radio,
  MapPin,
  Clock,
  Check,
} from 'lucide-react'

const COMMODITY_RADAR_DATA = [
  {
    name: 'Dry White Maize',
    category: 'Grains',
    unit: 'kg',
    batch: '50 kg',
    cheapest: {
      supplier: 'Wangige Urban Farm Gate',
      unitPrice: 40,
      distance: '5.2 km',
      eta: '~16 min',
      total: 2234,
      savings: 176,
    },
    fastest: {
      supplier: 'Kilimo Traders Wholesale',
      unitPrice: 45,
      distance: '3.2 km',
      eta: '~12 min',
      total: 2410,
      timeSaved: '4 min',
    },
    guidance: 'Save KSh 176 via Wangige Urban Farm, or receive 4 min earlier from Kilimo Wholesale depot.',
  },
  {
    name: 'Plum Salad Tomatoes',
    category: 'Vegetables',
    unit: 'kg',
    batch: '30 kg',
    cheapest: {
      supplier: 'Ruaka Greenhouse Farm',
      unitPrice: 65,
      distance: '4.8 km',
      eta: '~15 min',
      total: 2166,
      savings: 394,
    },
    fastest: {
      supplier: 'Kilimo Traders Wholesale',
      unitPrice: 80,
      distance: '3.2 km',
      eta: '~12 min',
      total: 2560,
      timeSaved: '3 min',
    },
    guidance: 'Substantial KSh 394 margin improvement direct from Ruaka greenhouse with only 3 min difference.',
  },
  {
    name: 'Rosecoco Clean Beans',
    category: 'Grains',
    unit: 'kg',
    batch: '40 kg',
    cheapest: {
      supplier: 'Kiambu Peri-Urban Gate',
      unitPrice: 110,
      distance: '5.5 km',
      eta: '~17 min',
      total: 4647,
      savings: 513,
    },
    fastest: {
      supplier: 'Kilimo Traders Wholesale',
      unitPrice: 125,
      distance: '3.2 km',
      eta: '~12 min',
      total: 5160,
      timeSaved: '5 min',
    },
    guidance: 'Direct peri-urban harvest delivers KSh 513 net savings on 40kg sacks with 17-min courier dispatch.',
  },
  {
    name: 'Shangi Irish Potatoes',
    category: 'Vegetables',
    unit: 'kg',
    batch: '50 kg',
    cheapest: {
      supplier: 'Wangige Urban Farm Gate',
      unitPrice: 42,
      distance: '5.2 km',
      eta: '~16 min',
      total: 2334,
      savings: 726,
    },
    fastest: {
      supplier: 'Kilimo Traders Wholesale',
      unitPrice: 58,
      distance: '3.2 km',
      eta: '~12 min',
      total: 3060,
      timeSaved: '4 min',
    },
    guidance: 'Heavy commodity: urban farm gate saves KSh 726 per 50kg bag with rapid 16-min Boda delivery.',
  },
]

export default function HomePage() {
  const [filterMode, setFilterMode] = useState<'all' | 'cheapest' | 'fastest'>('all')

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-mono selection:bg-orange-500 selection:text-white">
      {/* Top Telemetry Ticker */}
      <div className="bg-white border-b border-slate-200 py-2 px-4 text-[11px] overflow-hidden shadow-2xs">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
            <span className="text-orange-600 font-black uppercase tracking-wider">LIVE NAIROBI COMMODITY FEED</span>
          </div>

          <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap text-slate-600 font-semibold">
            <span>[WAKULIMA DEPOT: MAIZE KSH 45/KG]</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-600 font-bold">[RUAKA URBAN FARM: TOMATOES KSH 65/KG (4.8 KM)]</span>
            <span className="text-slate-300">•</span>
            <span>[MULTIPLE TRANSPARENT PRICE OPTIONS // ZERO OPAQUE BROKER FEES]</span>
            <span className="text-slate-300">•</span>
            <span className="text-orange-600 font-bold">[ZERO 4 AM MARKET COMMUTES // 15-MIN BODA RESTOCK]</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">[EXPANSION HORIZON: INTER-COUNTY & CROSS-BORDER FREIGHT]</span>
          </div>

          <div className="hidden md:flex items-center gap-3 shrink-0 text-slate-400">
            <span>LAT -1.286389</span>
            <span>LON 36.817223</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-md overflow-hidden border border-orange-200 shrink-0 bg-orange-50 shadow-2xs">
              <img
                src="/icons/logo-square.png"
                alt="Kuja Na Stock Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-slate-900 font-black tracking-tight text-sm uppercase">
              KUJA NA STOCK // OPS HUD
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-400 bg-white transition-colors"
            >
              [AUTH LOGIN]
            </Link>
            <Link
              href="/dashboard/retailer"
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black tracking-wider uppercase transition-colors shadow-xs"
            >
              LAUNCH TERMINAL »
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-12">
        {/* Modern Clean Headline with Mascot Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="space-y-4 lg:col-span-8">
            <div className="inline-flex items-center gap-2 border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] text-orange-700 font-bold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-orange-600" />
              <span>MVP SCOPE // URBAN FARM PROXIMITY & ZERO-COMMUTE B2B LOGISTICS</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.95]">
              DIRECT URBAN FARM SUPPLY.
              <br />
              <span className="text-orange-600">ZERO 4 AM MARKET RUNS.</span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
              Eliminate opaque broker pricing. Connect neighborhood kiosks directly with urban farms in close proximity (3–8 km) and wholesale depots. Multiple transparent price options, automated low-stock alarms, and 15-minute Boda delivery right to your counter.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/retailer"
                className="px-6 py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-orange-600/20 transition-all hover:translate-x-0.5"
              >
                <span>[01 RETAILER KIOSK HUD]</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/boda_rider"
                className="px-6 py-3.5 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-500 text-slate-800 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs"
              >
                <span>[04 BODA DISPATCH RADAR]</span>
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </Link>
            </div>
          </div>

          {/* Mascot Logo Card */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="bg-white border border-slate-200 p-3 shadow-sm rounded-xl max-w-xs w-full text-center space-y-2">
              <div className="relative aspect-4/3 rounded-lg overflow-hidden border border-orange-100 bg-orange-50">
                <img
                  src="/logo.jpg"
                  alt="Kuja Na Stock Delivery Boda"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pt-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-900 uppercase">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                  <span>KUJA NA STOCK BODA FLEET</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  ON-DEMAND CARGO COURIERS // 12-20 MIN ETA
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MVP Core Value Proposition & Expansion Roadmap */}
        <section className="p-6 bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  MVP CORE VALUE PROPOSITION // SOLVING INFORMAL RETAIL FRICTION
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Initial MVP focuses on urban farms in close proximity (3–10 km) to validate fast unit economics, with a scalable foundation for inter-county & multi-modal freight.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold uppercase shrink-0">
              PHASE 1: URBAN AGRO PROXIMITY
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Benefit 1 */}
            <div className="p-4 bg-slate-50 border border-slate-200 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-orange-600 font-bold text-xs">[BENEFIT 01]</span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-xs">TRANSPARENT RATES</span>
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                MULTIPLE PRICE OPTIONS // ZERO OPAQUE PRICING
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Eliminates middleman price distortion. Kiosks compare live rates between direct Urban Farm Gates and Wholesale Depots with a 100% itemized breakdown of produce cost and courier fee.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="p-4 bg-slate-50 border border-slate-200 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-orange-600 font-bold text-xs">[BENEFIT 02]</span>
                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 text-[9px] font-black rounded-xs">SAVE 4 HOURS DAILY</span>
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                ELIMINATE 4 AM MARKET COMMUTES
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No more waking up before dawn to battle mud, crowds, pushcart porters, and security risks at Wakulima or Gikomba. Restock your kiosk digitally without stepping away from your counter.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="p-4 bg-slate-50 border border-slate-200 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-orange-600 font-bold text-xs">[BENEFIT 03]</span>
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-black rounded-xs">3-8 KM RADIUS</span>
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                HYPER-LOCAL URBAN FARM PROXIMITY
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fresh produce sourced directly from peri-urban greenhouses in Ruaka, Wangige, Kiambu, and Kasarani. Delivered by stage Boda riders in 15–20 minutes without multi-day cold-chain spoilage.
              </p>
            </div>
          </div>

          {/* Expansion Horizon Banner */}
          <div className="p-3.5 bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-orange-400 font-bold uppercase tracking-wider">[FUTURE EXPANSION HORIZON]</span>
                <span className="text-slate-400 text-[10px]">PHASE 2 ROADMAP</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Inter-county routes (Rift Valley maize, Nyandarua potatoes) & cross-border freight with 1-tonne pickups, 3-tonne Canters, and refrigerated lorries.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-white/10 text-orange-300 text-[10px] font-mono border border-white/20 uppercase shrink-0">
              MULTI-MODAL READY
            </span>
          </div>
        </section>

        {/* 4-Node Architecture Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
            <span className="text-orange-600 font-black tracking-wider uppercase">
              // 04 INTERACTIVE LOGISTICS NODES
            </span>
            <span className="text-slate-400">SELECT A NODE TO OPERATE LIVE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Node 1: Retailer */}
            <Link
              href="/dashboard/retailer"
              className="group p-5 bg-white border border-slate-200 hover:border-orange-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-orange-600 font-bold">[NODE 01]</span>
                  <span className="text-[10px] text-slate-400">WESTLANDS_KIOSK</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                  RETAIL KIOSK
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time inventory monitor. Automated shortage triggers, side-by-side supplier pricing comparison, and 1-tap ordering.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-orange-600 font-bold">
                <span>ENTER PORTAL</span>
                <span className="group-hover:translate-x-1 transition-transform">»</span>
              </div>
            </Link>

            {/* Node 2: Wholesaler */}
            <Link
              href="/dashboard/wholesaler"
              className="group p-5 bg-white border border-slate-200 hover:border-orange-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-orange-600 font-bold">[NODE 02]</span>
                  <span className="text-[10px] text-slate-400">INDUSTRIAL_AREA</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                  BULK WHOLESALE
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Depot inventory & bulk price controls. Incoming retailer orders queue with automated Boda rider broadcast dispatch.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-orange-600 font-bold">
                <span>ENTER PORTAL</span>
                <span className="group-hover:translate-x-1 transition-transform">»</span>
              </div>
            </Link>

            {/* Node 3: Farmer */}
            <Link
              href="/dashboard/farmer"
              className="group p-5 bg-white border border-slate-200 hover:border-orange-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-orange-600 font-bold">[NODE 03]</span>
                  <span className="text-[10px] text-slate-400">RUAKA_WANGIGE_AGRO</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                  URBAN FARM GATE
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Direct urban farm produce (Ruaka & Wangige greenhouses). Transparent farm-gate pricing in close proximity (3–8 km) for 15-minute Boda runs.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-orange-600 font-bold">
                <span>ENTER PORTAL</span>
                <span className="group-hover:translate-x-1 transition-transform">»</span>
              </div>
            </Link>

            {/* Node 4: Boda Rider */}
            <Link
              href="/dashboard/boda_rider"
              className="group p-5 bg-white border border-slate-200 hover:border-orange-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-orange-600 font-bold">[NODE 04]</span>
                  <span className="text-[10px] text-slate-400">STAGE_04_WESTLANDS</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                  BODA DISPATCH
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tactical delivery radar. Trip fees in KSh, distance breakdown, 1-tap accept/decline, and turn-by-turn cargo tracking.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-orange-600 font-bold">
                <span>ENTER PORTAL</span>
                <span className="group-hover:translate-x-1 transition-transform">»</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Live Consumer Commodity Routing Matrix: Price vs Speed */}
        <section className="p-6 bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  CONSUMER SOURCING RADAR // CHEAPEST VS FASTEST ROUTING
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time price arbitration: compare direct farm-gate savings vs local wholesale depot arrival speed
              </p>
            </div>

            {/* Interactive Mode Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 font-bold border transition-colors ${
                  filterMode === 'all'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                SHOW ALL
              </button>
              <button
                onClick={() => setFilterMode('cheapest')}
                className={`px-3 py-1.5 font-bold border transition-colors ${
                  filterMode === 'cheapest'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                ★ HIGHLIGHT CHEAPEST
              </button>
              <button
                onClick={() => setFilterMode('fastest')}
                className={`px-3 py-1.5 font-bold border transition-colors ${
                  filterMode === 'fastest'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                ⚡ HIGHLIGHT FASTEST
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {COMMODITY_RADAR_DATA.map((item) => {
              const showCheapestHighlight = filterMode === 'all' || filterMode === 'cheapest'
              const showFastestHighlight = filterMode === 'all' || filterMode === 'fastest'

              return (
                <div
                  key={item.name}
                  className="p-4 bg-white border border-slate-200 space-y-4 hover:border-orange-400 transition-colors shadow-xs"
                >
                  <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="text-[10px] text-orange-600 font-bold uppercase block tracking-wider">
                        {item.category} // REQUISITION BATCH: {item.batch}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 uppercase">{item.name}</h3>
                    </div>
                    <Link
                      href="/dashboard/retailer"
                      className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>ORDER »</span>
                    </Link>
                  </div>

                  {/* Dual Comparison Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Cheapest Pick */}
                    <div
                      className={`p-3 border transition-all space-y-1.5 ${
                        showCheapestHighlight
                          ? 'border-orange-400 bg-orange-50/50 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black px-1.5 py-0.5 bg-orange-600 text-white uppercase">
                          ★ CHEAPEST
                        </span>
                        <span className="text-[10px] text-orange-700 font-bold">
                          SAVE KSh {item.cheapest.savings}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.cheapest.supplier}</h4>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between">
                          <span>RATE:</span>
                          <strong className="text-slate-900">KSh {item.cheapest.unitPrice}/{item.unit}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>TRANSIT:</span>
                          <span>{item.cheapest.eta} ({item.cheapest.distance})</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                          <span>ALL-IN TOTAL:</span>
                          <span className="text-orange-600 font-black">KSh {item.cheapest.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Fastest Pick */}
                    <div
                      className={`p-3 border transition-all space-y-1.5 ${
                        showFastestHighlight
                          ? 'border-slate-800 bg-slate-50 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black px-1.5 py-0.5 bg-slate-900 text-white uppercase">
                          ⚡ FASTEST
                        </span>
                        <span className="text-[10px] text-slate-900 font-bold">
                          {item.fastest.timeSaved} FASTER
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.fastest.supplier}</h4>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between">
                          <span>RATE:</span>
                          <strong className="text-slate-900">KSh {item.fastest.unitPrice}/{item.unit}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>TRANSIT:</span>
                          <span className="text-slate-900 font-bold">{item.fastest.eta} ({item.fastest.distance})</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                          <span>ALL-IN TOTAL:</span>
                          <span className="text-slate-900 font-black">KSh {item.fastest.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decision Guidance Footer */}
                  <div className="p-2 bg-slate-50 border border-slate-200 text-[10px] text-slate-600">
                    <strong className="text-slate-900">TACTICAL VERDICT: </strong>
                    {item.guidance}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Live Operations Telemetry Preview */}
        <section className="p-6 bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                ACTIVE NAIROBI SUPPLY DISPATCH CYCLE
              </span>
            </div>
            <span className="text-[10px] text-slate-400">END-TO-END AUTOMATED REPLENISHMENT FLOW</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200">
              <span className="text-orange-600 font-bold block mb-1">01 // SHORTAGE DETECTED</span>
              <p className="text-slate-900 font-bold text-sm">Maize Drops to 8 kg</p>
              <p className="text-slate-600 text-[11px] mt-1">Retailer threshold (20 kg) breached. PWA pushes high-priority restock signal.</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200">
              <span className="text-orange-600 font-bold block mb-1">02 // COMPARISON MATRIX</span>
              <p className="text-slate-900 font-bold text-sm">Wholesale vs Farm Gate</p>
              <p className="text-slate-600 text-[11px] mt-1">System calculates: Kilimo Traders (KSh 45/kg + 160 fee) vs Farm (KSh 40/kg + 306 fee).</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200">
              <span className="text-orange-600 font-bold block mb-1">03 // BODA DISPATCH RADAR</span>
              <p className="text-slate-900 font-bold text-sm">James Boda Pinged</p>
              <p className="text-slate-600 text-[11px] mt-1">Offered KSh 210 delivery payout for 4.2 km transit. 1-tap accept.</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200">
              <span className="text-orange-600 font-bold block mb-1">04 // COUNTER RESTOCK</span>
              <p className="text-slate-900 font-bold text-sm">Delivered & Restocked</p>
              <p className="text-slate-600 text-[11px] mt-1">Goods handed over at kiosk. Retailer inventory updates +50 kg automatically.</p>
            </div>
          </div>
        </section>

        {/* Quick Demo Footer */}
        <footer className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 KUJA NA STOCK // NAIROBI LOGISTICS CORRIDOR. BUILT FOR INFORMAL ECONOMIES.</p>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/retailer" className="hover:text-orange-600">RETAILER</Link>
            <Link href="/dashboard/wholesaler" className="hover:text-orange-600">WHOLESALER</Link>
            <Link href="/dashboard/farmer" className="hover:text-orange-600">FARMER</Link>
            <Link href="/dashboard/boda_rider" className="hover:text-orange-600">BODA RIDER</Link>
          </div>
        </footer>
      </main>
    </div>
  )
}