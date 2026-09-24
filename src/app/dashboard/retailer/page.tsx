'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Clock,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useAppStore } from '@/store'
import { RetailerInventory, SupplierListing } from '@/types'
import { DemoRoleSwitcher } from '@/components/DemoRoleSwitcher'

export default function RetailerDashboard() {
  const {
    currentUser,
    inventory,
    listings,
    orders,
    createOrder,
    updateInventoryStock,
    triggerLowStockSimulation,
  } = useAppStore()

  // Sourcing & Requisition Modal State
  const [selectedRestockItem, setSelectedRestockItem] = useState<RetailerInventory | null>(null)
  const [orderQuantity, setOrderQuantity] = useState<number>(50)
  const [deliveryNotes, setDeliveryNotes] = useState<string>('Standard Boda delivery to kiosk front')
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null)
  const [sortPreference, setSortPreference] = useState<'cheapest' | 'fastest' | 'unit_price'>('cheapest')

  const lowStockItems = inventory.filter((item) => item.current_stock <= item.low_stock_threshold)

  const handleOpenRestock = (item: RetailerInventory) => {
    setSelectedRestockItem(item)
    setOrderQuantity(item.reorder_quantity || 50)
  }

  // Realistic delivery speed calculator (traffic & distance adjusted)
  const getETA = (distanceKm: number) => {
    // 3.2km depot = ~12-14 mins; 6.8km farm gate = ~20-25 mins
    const mins = Math.round(distanceKm * 3.2 + 2)
    return { mins, label: `~${mins} MIN` }
  }

  // Real-time comparative sourcing radar for any inventory SKU
  const getProductSourcingIntel = (productId: string, quantity: number = 50) => {
    const active = listings.filter((l) => l.product_id === productId && l.is_active)
    if (active.length === 0) return null

    const withMetrics = active.map((l) => {
      const itemTotal = l.price_per_unit * quantity
      const deliveryFee = l.total_delivery_fee || Math.round((l.distance_km || 3) * 50)
      const grandTotal = itemTotal + deliveryFee
      const eta = getETA(l.distance_km || 3)
      return { listing: l, itemTotal, deliveryFee, grandTotal, etaMins: eta.mins, etaLabel: eta.label }
    })

    withMetrics.sort((a, b) => a.grandTotal - b.grandTotal)
    const cheapest = withMetrics[0]

    const withMetricsBySpeed = [...withMetrics].sort((a, b) => a.etaMins - b.etaMins)
    const fastest = withMetricsBySpeed[0]

    const maxCost = withMetrics[withMetrics.length - 1].grandTotal
    const maxETA = withMetricsBySpeed[withMetricsBySpeed.length - 1].etaMins

    return {
      cheapest,
      fastest,
      isSame: cheapest.listing.id === fastest.listing.id,
      savings: Math.max(0, maxCost - cheapest.grandTotal),
      timeSavedMins: Math.max(0, maxETA - fastest.etaMins),
    }
  }

  // Analyzed listings for currently active restock modal
  const analyzedListings = selectedRestockItem
    ? listings
        .filter((l) => l.product_id === selectedRestockItem.product_id && l.is_active)
        .map((l) => {
          const itemTotal = l.price_per_unit * orderQuantity
          const deliveryFee = l.total_delivery_fee || Math.round((l.distance_km || 3) * 50)
          const grandTotal = itemTotal + deliveryFee
          const eta = getETA(l.distance_km || 3)
          return {
            ...l,
            itemTotal,
            deliveryFee,
            grandTotal,
            etaMins: eta.mins,
            etaLabel: eta.label,
          }
        })
    : []

  const minCost = analyzedListings.length > 0 ? Math.min(...analyzedListings.map((l) => l.grandTotal)) : 0
  const maxCost = analyzedListings.length > 0 ? Math.max(...analyzedListings.map((l) => l.grandTotal)) : 0
  const minETA = analyzedListings.length > 0 ? Math.min(...analyzedListings.map((l) => l.etaMins)) : 0
  const maxETA = analyzedListings.length > 0 ? Math.max(...analyzedListings.map((l) => l.etaMins)) : 0

  // Apply chosen sort preference
  const sortedListings = [...analyzedListings].sort((a, b) => {
    if (sortPreference === 'cheapest') return a.grandTotal - b.grandTotal
    if (sortPreference === 'fastest') return a.etaMins - b.etaMins
    if (sortPreference === 'unit_price') return a.price_per_unit - b.price_per_unit
    return 0
  })

  const handlePlaceOrder = (listing: typeof analyzedListings[0]) => {
    if (!selectedRestockItem) return

    const newOrder = createOrder({
      productId: selectedRestockItem.product_id,
      supplierId: listing.supplier_id,
      quantity: orderQuantity,
      deliveryAddress: currentUser.address || 'Kipande Road, Westlands, Nairobi',
      notes: deliveryNotes,
    })

    setOrderSuccessMessage(
      `DISPATCH LOGGED: Requisition #${newOrder.id} confirmed with ${listing.supplier?.business_name}. Boda rider broadcast active.`
    )

    setTimeout(() => {
      setSelectedRestockItem(null)
      setOrderSuccessMessage(null)
    }, 2800)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-mono flex flex-col selection:bg-orange-500 selection:text-white">
      <DemoRoleSwitcher />

      <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Terminal Ops Header */}
        <div className="bg-white border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-orange-600 font-black tracking-wider uppercase mb-1">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span>TERMINAL NODE // RETAIL_OPS_01</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {currentUser.business_name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              LOC: {currentUser.address} • PHONE: {currentUser.phone}
            </p>
          </div>

          {/* Quick Hardware Macro Triggers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerLowStockSimulation('prod-1')}
              className="px-3 py-2 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-400 text-slate-700 text-xs font-bold transition-all shadow-xs"
            >
              [⚡ SHORTAGE: MAIZE]
            </button>
            <button
              onClick={() => triggerLowStockSimulation('prod-4')}
              className="px-3 py-2 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-400 text-slate-700 text-xs font-bold transition-all shadow-xs"
            >
              [⚡ SHORTAGE: TOMATOES]
            </button>
          </div>
        </div>

        {/* Urgent Shortages Warning Zone */}
        {lowStockItems.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span>ACTIVE SHORTAGE WARNING // {lowStockItems.length} SKUs BELOW THRESHOLD</span>
              </div>
              <span className="text-[10px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 font-bold">
                PRIORITY_DISPATCH_REQUIRED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.map((item) => {
                const intel = getProductSourcingIntel(item.product_id, item.reorder_quantity || 50)

                return (
                  <div
                    key={item.id}
                    className="bg-white border-2 border-orange-500 p-4 flex flex-col justify-between space-y-4 shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider block">
                            [CRITICAL SHORTAGE]
                          </span>
                          <h3 className="text-lg font-black text-slate-900 uppercase mt-0.5">
                            {item.product?.name}
                          </h3>
                          <span className="text-[10px] text-slate-500">CATEGORY: {item.product?.category}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-black text-slate-900">
                            {item.current_stock}
                          </span>
                          <span className="text-[10px] text-slate-400 block uppercase">
                            / MIN {item.low_stock_threshold} {item.product?.unit}
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 h-2 mt-3 border border-slate-200">
                        <div
                          className="bg-orange-600 h-full"
                          style={{
                            width: `${Math.min(100, (item.current_stock / item.low_stock_threshold) * 100)}%`,
                          }}
                        />
                      </div>

                      {/* Live Decision Radar: Cheaper vs Faster */}
                      {intel && (
                        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 space-y-2 text-[11px]">
                          <div className="flex items-center justify-between text-[10px] font-black tracking-wider text-slate-500 uppercase border-b border-slate-200 pb-1.5">
                            <span className="text-orange-600">SMART SOURCING RADAR</span>
                            <span>{item.reorder_quantity || 50} {item.product?.unit} BATCH</span>
                          </div>

                          {/* Cheapest Option */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 font-black text-slate-900">
                              <span className="w-2 h-2 bg-orange-500 rounded-full" />
                              ★ CHEAPEST:
                            </span>
                            <div className="text-right">
                              <span className="text-slate-900 font-bold">{intel.cheapest.listing.supplier?.business_name}</span>
                              <span className="text-orange-600 font-bold block text-[10px]">
                                KSh {intel.cheapest.listing.price_per_unit}/{item.product?.unit} • Total KSh {intel.cheapest.grandTotal.toLocaleString()}
                                {intel.savings > 0 && ` (Save KSh ${intel.savings})`}
                              </span>
                            </div>
                          </div>

                          {/* Fastest Option */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
                            <span className="inline-flex items-center gap-1.5 font-black text-slate-900">
                              <span className="w-2 h-2 bg-slate-900 rounded-full" />
                              ⚡ FASTEST:
                            </span>
                            <div className="text-right">
                              <span className="text-slate-900 font-bold">{intel.fastest.listing.supplier?.business_name}</span>
                              <span className="text-slate-500 font-bold block text-[10px]">
                                ETA {intel.fastest.etaLabel} ({intel.fastest.listing.distance_km}km) • Total KSh {intel.fastest.grandTotal.toLocaleString()}
                                {intel.timeSavedMins > 0 && ` (${intel.timeSavedMins}m faster)`}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenRestock(item)}
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white text-xs font-black py-2.5 px-3 uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
                    >
                      <span>[REQUISITION // COMPARE CHEAPEST & FASTEST]</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Real-time Inventory Telemetry Matrix */}
        <section className="bg-white border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                COMMODITY STOCK TELEMETRY // CURRENT BALANCE
              </h2>
              <p className="text-[10px] text-slate-400">Real-time shelf metrics with automatic threshold triggers</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold">
              <span>TOTAL SKUs: {inventory.length}</span>
              <span className="text-slate-300">•</span>
              <span className="text-orange-600">SHORTAGES: {lowStockItems.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-200 bg-slate-50/70">
                  <th className="py-2.5 px-3 font-bold">COMMODITY</th>
                  <th className="py-2.5 px-3 font-bold">CATEGORY</th>
                  <th className="py-2.5 px-3 font-bold">CURRENT STOCK</th>
                  <th className="py-2.5 px-3 font-bold">MIN THRESHOLD</th>
                  <th className="py-2.5 px-3 font-bold">STATUS</th>
                  <th className="py-2.5 px-3 font-bold">SMART SOURCING (CHEAPEST VS FASTEST)</th>
                  <th className="py-2.5 px-3 font-bold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((inv) => {
                  const isLow = inv.current_stock <= inv.low_stock_threshold
                  const intel = getProductSourcingIntel(inv.product_id, inv.reorder_quantity || 50)

                  return (
                    <tr key={inv.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 uppercase">
                        {inv.product?.name}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-500">{inv.product?.category}</td>
                      <td className="py-3 px-3 font-black">
                        <div className="flex items-center gap-2">
                          <span className={isLow ? 'text-orange-600 text-sm' : 'text-slate-900 text-sm'}>
                            {inv.current_stock} {inv.product?.unit}
                          </span>
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => updateInventoryStock(inv.product_id, -5)}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-700 border border-slate-200"
                              title="Sell 5 units"
                            >
                              -5
                            </button>
                            <button
                              onClick={() => updateInventoryStock(inv.product_id, 5)}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-700 border border-slate-200"
                              title="Add 5 units"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-500">
                        {inv.low_stock_threshold} {inv.product?.unit}
                      </td>
                      <td className="py-3 px-3">
                        {isLow ? (
                          <span className="text-[10px] font-black text-orange-700 bg-orange-50 border border-orange-300 px-2 py-0.5 uppercase">
                            CRITICAL
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 uppercase">
                            NOMINAL
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[11px]">
                        {intel ? (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px]">
                              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                              <strong className="text-slate-900 font-bold">★ CHEAPEST:</strong>
                              <span className="text-orange-600 font-bold">{intel.cheapest.listing.supplier?.business_name}</span>
                              <span className="text-slate-500">(KSh {intel.cheapest.listing.price_per_unit}/{inv.product?.unit})</span>
                            </span>
                            <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px]">
                              <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                              <strong className="text-slate-900 font-bold">⚡ FASTEST:</strong>
                              <span className="text-slate-800 font-bold">{intel.fastest.listing.supplier?.business_name}</span>
                              <span className="text-slate-500 font-bold">({intel.fastest.etaLabel})</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">LOCAL SOURCING ONLY</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleOpenRestock(inv)}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white font-black text-[11px] uppercase tracking-wider transition-colors shadow-2xs"
                        >
                          RESTOCK »
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Live Orders & Boda Telemetry */}
        <section className="bg-white border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                BODA DISPATCH LIFECYCLE // LIVE TRANSIT FEED
              </h2>
              <p className="text-[10px] text-slate-400">Real-time carrier assignment and delivery completion telemetry</p>
            </div>
            <span className="text-[10px] text-orange-600 font-bold">[ORDERS: {orders.length}]</span>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">NO RECENT DISPATCH ORDERS LOGGED</p>
            ) : (
              orders.map((ord) => {
                const statusTheme: Record<string, { label: string; text: string; bg: string }> = {
                  pending: { label: 'AWAITING SUPPLIER CONFIRMATION', text: 'text-slate-800', bg: 'bg-slate-100 border-slate-300' },
                  confirmed: { label: 'CONFIRMED // BROADCASTING BODA DISPATCH', text: 'text-orange-700', bg: 'bg-orange-50 border-orange-300' },
                  assigned: { label: 'BODA EN ROUTE TO SUPPLIER PICKUP', text: 'text-orange-700', bg: 'bg-orange-50 border-orange-300' },
                  picked_up: { label: 'CARGO LOADED ON BODA', text: 'text-orange-800', bg: 'bg-orange-100 border-orange-400' },
                  in_transit: { label: 'IN TRANSIT TO KIOSK (ETA ~3 MIN)', text: 'text-white', bg: 'bg-orange-600 border-orange-600' },
                  delivered: { label: 'DELIVERED // INVENTORY REPLENISHED', text: 'text-white', bg: 'bg-slate-900 border-slate-900' },
                }
                const st = statusTheme[ord.status] || { label: ord.status, text: 'text-slate-800', bg: 'bg-slate-100 border-slate-300' }

                return (
                  <div
                    key={ord.id}
                    className="p-4 bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">#{ord.id}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 border ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {ord.quantity} {ord.product?.unit} {ord.product?.name} from <span className="text-slate-900 font-bold">{ord.supplier?.business_name}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-slate-900">
                        KSh {ord.total_amount?.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        ITEM: KSh {ord.quantity * ord.unit_price} + BODA: KSh {ord.delivery_fee}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </main>

      {/* Supplier Comparison & Requisition Modal */}
      {selectedRestockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-mono">
          <div className="bg-white border border-slate-200 max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-900">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">
                  COMMODITY SOURCING MATRIX // REAL-TIME LOGISTICS
                </span>
                <h3 className="text-xl font-black text-slate-900 uppercase mt-0.5">
                  REQUISITION: {selectedRestockItem.product?.name}
                </h3>
                <span className="text-[11px] text-slate-500">
                  ON HAND: {selectedRestockItem.current_stock} {selectedRestockItem.product?.unit} • THRESHOLD: {selectedRestockItem.low_stock_threshold} {selectedRestockItem.product?.unit}
                </span>
              </div>
              <button
                onClick={() => setSelectedRestockItem(null)}
                className="text-slate-400 hover:text-slate-900 px-2 py-1 text-xs border border-slate-200 hover:border-slate-300"
              >
                [ESC / CLOSE]
              </button>
            </div>

            {/* Quantity Selector */}
            <div className="p-3 bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">REORDER VOLUME ({selectedRestockItem.product?.unit}):</span>
                <input
                  type="number"
                  min="5"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-28 bg-white border border-slate-300 text-slate-900 font-black text-center py-1.5 text-base mt-1 outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {[25, 50, 100, 200].map((q) => (
                  <button
                    key={q}
                    onClick={() => setOrderQuantity(q)}
                    className={`px-3 py-1.5 text-xs font-bold border transition-colors ${
                      orderQuantity === q
                        ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {q} {selectedRestockItem.product?.unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Status confirmation */}
            {orderSuccessMessage && (
              <div className="p-3 bg-orange-50 border-2 border-orange-500 text-orange-950 text-xs font-bold">
                {orderSuccessMessage}
              </div>
            )}

            {/* Dual Decision Radar: Cheapest vs Fastest Summary */}
            {analyzedListings.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Cheapest Spotlight */}
                {(() => {
                  const cheapestListing = [...analyzedListings].sort((a, b) => a.grandTotal - b.grandTotal)[0]
                  const savings = maxCost - minCost
                  return (
                    <div className="p-3 bg-orange-50/60 border-2 border-orange-500 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-600 text-white font-black text-[10px] uppercase tracking-wider">
                          ★ CHEAPEST OPTION
                        </span>
                        {savings > 0 && (
                          <span className="text-[10px] text-orange-800 font-bold bg-orange-100 px-1.5 py-0.5 border border-orange-300">
                            SAVE KSh {savings.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <h4 className="font-black text-slate-900 text-sm uppercase">
                            {cheapestListing.supplier?.business_name}
                          </h4>
                          <span className="text-[11px] text-slate-600 block">
                            KSh {cheapestListing.price_per_unit}/{cheapestListing.unit} • ETA {cheapestListing.etaLabel} ({cheapestListing.distance_km} km)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-slate-900 block">
                            KSh {cheapestListing.grandTotal.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-400">ALL-IN INVOICE</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePlaceOrder(cheapestListing)}
                        className="w-full py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-[11px] uppercase tracking-wider transition-colors shadow-xs"
                      >
                        [ORDER CHEAPEST NOW »]
                      </button>
                    </div>
                  )
                })()}

                {/* Fastest Spotlight */}
                {(() => {
                  const fastestListing = [...analyzedListings].sort((a, b) => a.etaMins - b.etaMins)[0]
                  const timeSaved = maxETA - minETA
                  return (
                    <div className="p-3 bg-slate-50 border-2 border-slate-800 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider">
                          ⚡ FASTEST ARRIVAL
                        </span>
                        {timeSaved > 0 && (
                          <span className="text-[10px] text-slate-800 font-bold bg-slate-200 px-1.5 py-0.5 border border-slate-300">
                            {timeSaved} MIN FASTER
                          </span>
                        )}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <h4 className="font-black text-slate-900 text-sm uppercase">
                            {fastestListing.supplier?.business_name}
                          </h4>
                          <span className="text-[11px] text-slate-600 block">
                            ETA {fastestListing.etaLabel} ({fastestListing.distance_km} km) • KSh {fastestListing.price_per_unit}/{fastestListing.unit}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-slate-900 block">
                            KSh {fastestListing.grandTotal.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-400">ALL-IN INVOICE</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePlaceOrder(fastestListing)}
                        className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-wider transition-colors shadow-xs"
                      >
                        [ORDER FASTEST NOW »]
                      </button>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Sorting & Filter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                ALL INDEXED DEPOTS & FARMS ({sortedListings.length}):
              </span>

              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-500 font-bold">SORT:</span>
                <button
                  onClick={() => setSortPreference('cheapest')}
                  className={`px-2.5 py-1 font-bold border transition-colors ${
                    sortPreference === 'cheapest'
                      ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ★ CHEAPEST FIRST
                </button>
                <button
                  onClick={() => setSortPreference('fastest')}
                  className={`px-2.5 py-1 font-bold border transition-colors ${
                    sortPreference === 'fastest'
                      ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ⚡ FASTEST FIRST
                </button>
                <button
                  onClick={() => setSortPreference('unit_price')}
                  className={`px-2.5 py-1 font-bold border transition-colors ${
                    sortPreference === 'unit_price'
                      ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  UNIT RATE
                </button>
              </div>
            </div>

            {/* Detailed Listings Comparison */}
            <div className="space-y-3">
              {sortedListings.map((list) => {
                const isCheapest = list.grandTotal === minCost && minCost > 0
                const isFastest = list.etaMins === minETA && minETA > 0
                const isFarmer = list.supplier?.role === 'farmer'

                return (
                  <div
                    key={list.id}
                    className={`p-4 bg-white border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                      isCheapest
                        ? 'border-orange-500 bg-orange-50/20'
                        : isFastest
                        ? 'border-slate-800 bg-slate-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {isCheapest && isFastest ? (
                          <span className="text-[10px] font-black px-2 py-0.5 uppercase bg-orange-600 text-white">
                            ★ OPTIMAL // CHEAPEST & FASTEST
                          </span>
                        ) : isCheapest ? (
                          <span className="text-[10px] font-black px-2 py-0.5 uppercase bg-orange-600 text-white">
                            ★ CHEAPEST INVOICE {maxCost > minCost && `// SAVE KSH ${(maxCost - minCost).toLocaleString()}`}
                          </span>
                        ) : isFastest ? (
                          <span className="text-[10px] font-black px-2 py-0.5 uppercase bg-slate-900 text-white">
                            ⚡ FASTEST ARRIVAL // ETA {list.etaLabel}
                          </span>
                        ) : null}

                        <span className="text-[9px] font-black px-1.5 py-0.5 uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {isFarmer ? 'DIRECT URBAN FARM' : 'WHOLESALE DEPOT'}
                        </span>
                        <h4 className="font-black text-slate-900 text-base uppercase">
                          {list.supplier?.business_name}
                        </h4>
                      </div>

                      <div className="text-[11px] text-slate-600 flex flex-wrap gap-4">
                        <span className="text-slate-900 font-bold">
                          TRANSIT: <strong className="text-orange-600">{list.etaLabel}</strong> ({list.distance_km} KM via Boda)
                        </span>
                        <span>STOCK: {list.available_stock} {list.unit}</span>
                        <span>RATE: <strong className="text-slate-900">KSh {list.price_per_unit}/{list.unit}</strong></span>
                      </div>

                      <div className="text-[10px] text-slate-400">
                        COST BREAKDOWN: Commodity (KSh {list.itemTotal.toLocaleString()}) + Boda Carrier (KSh {list.deliveryFee})
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:border-l sm:border-slate-200 sm:pl-4">
                      <div className="text-right min-w-[120px]">
                        <span className="text-[10px] text-slate-400 uppercase block font-bold">TOTAL INVOICE</span>
                        <span className="text-2xl font-black text-slate-900 block">
                          KSh {list.grandTotal.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-500 block font-bold">
                          ETA {list.etaLabel}
                        </span>
                      </div>

                      <button
                        onClick={() => handlePlaceOrder(list)}
                        className={`px-4 py-2.5 font-black text-xs uppercase tracking-wider transition-colors min-w-[130px] shadow-xs ${
                          isCheapest
                            ? 'bg-orange-600 hover:bg-orange-500 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        REQUISITION »
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
