import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ACTIVE_ORDER_STATUSES, ORDER_WITH_DETAILS } from './queries'
import { ORDER_STATUS_LABEL, qty } from './format'
import type { Order, RetailerInventory } from '@/types'

export type ChatLink = { label: string; href: string }
export type ChatReply = { reply: string; links?: ChatLink[] }

/**
 * Rule-based assistant for butcheries. It only reads the signed-in retailer's
 * own data (through their session, so RLS applies) and matches keywords in
 * English and common Swahili. No LLM is involved.
 */

const has = (text: string, words: RegExp) => words.test(text)

const RESTOCK = /\b(restock|re-?stock|reorder|re-?order|low|running (out|low)|out of|need(ed)? (more|stock)|shortage|ongeza|nimeishiwa|imeisha|stock)\b/
const WHERE = /\b(where|track|tracking|location|live|map|eta|arrive|arriving|how far|driver|carrier|rider|wapi|yuko wapi|amefika)\b/
const ORDERS = /\b(order|orders|status|delivery|deliveries|delivered|oda|mzigo)\b/
const HELLO = /^(hi|hello|hey|habari|mambo|jambo|sasa)\b/

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

async function activeOrders(supabase: SupabaseClient, retailerId: string) {
  const { data } = await supabase
    .from('orders')
    .select(ORDER_WITH_DETAILS)
    .eq('retailer_id', retailerId)
    .in('status', ACTIVE_ORDER_STATUSES)
    .order('delivery_date')
  return (data ?? []) as Order[]
}

async function inventory(supabase: SupabaseClient, retailerId: string) {
  const { data } = await supabase.from('retailer_inventory').select('*, product:products(*)').eq('retailer_id', retailerId)
  return (data ?? []) as RetailerInventory[]
}

async function restockReply(supabase: SupabaseClient, retailerId: string): Promise<ChatReply> {
  const stock = await inventory(supabase, retailerId)
  if (stock.length === 0) {
    return {
      reply: 'You are not tracking any stock yet. Add your products on the dashboard and set a low-stock level, then I can tell you when to reorder.',
      links: [{ label: 'Open dashboard', href: '/dashboard/retailer' }],
    }
  }
  const low = stock.filter((s) => s.current_stock <= s.low_stock_threshold)
  if (low.length === 0) {
    return { reply: `No restock needed right now. All ${stock.length} products you track are above their low-stock level.` }
  }
  const lines = low
    .map((s) => `${s.product?.name}: ${qty(s.current_stock)} ${s.product?.unit} left (reorder about ${qty(s.reorder_qty)})`)
    .join('. ')
  return {
    reply: `Yes, restock is needed for ${low.length} product${low.length > 1 ? 's' : ''}. ${lines}. Order before 9 PM for delivery tomorrow morning.`,
    links: low.slice(0, 4).map((s) => ({
      label: `Order ${s.product?.name}`,
      href: `/dashboard/retailer/order?product=${s.product_id}&qty=${s.reorder_qty}`,
    })),
  }
}

async function whereReply(supabase: SupabaseClient, retailerId: string): Promise<ChatReply> {
  const orders = await activeOrders(supabase, retailerId)
  if (orders.length === 0) return { reply: 'You have no orders on the way. Say "restock" to see what you need to order.' }

  const links: ChatLink[] = []
  const parts: string[] = []
  for (const o of orders) {
    const supplier = o.supplier?.business_name || o.supplier?.full_name || 'your supplier'
    let part = `Order #${o.order_no} from ${supplier}: ${ORDER_STATUS_LABEL[o.status].toLowerCase()}.`
    if (o.run_id && ['assigned', 'picked_up'].includes(o.status)) {
      links.push({ label: `Map for #${o.order_no}`, href: `/dashboard/retailer/track/${o.id}` })
    }
    if (o.status === 'picked_up' && o.run_id) {
      const { data: loc } = await supabase.from('run_locations').select('lat,lng,speed_kmh,updated_at').eq('run_id', o.run_id).maybeSingle()
      const ageMin = loc ? (Date.now() - new Date(loc.updated_at).getTime()) / 60000 : null
      if (loc && ageMin! < 3) {
        const km = haversineKm(loc, { lat: o.delivery_lat, lng: o.delivery_lng })
        const eta = Math.max(1, Math.round((km / 25) * 60)) // ~25 km/h average through Nairobi
        part += ` The carrier is about ${km.toFixed(1)} km away, roughly ${eta} minute${eta > 1 ? 's' : ''}.`
      } else {
        part += ' The carrier’s live location is not available right now.'
      }
    }
    parts.push(part)
  }
  return { reply: parts.join(' '), links }
}

async function ordersReply(supabase: SupabaseClient, retailerId: string): Promise<ChatReply> {
  const orders = await activeOrders(supabase, retailerId)
  if (orders.length === 0) return { reply: 'You have no active orders.', links: [{ label: 'Order stock', href: '/dashboard/retailer/order' }] }
  const text = orders
    .map((o) => `#${o.order_no} from ${o.supplier?.business_name || o.supplier?.full_name}: ${ORDER_STATUS_LABEL[o.status].toLowerCase()}`)
    .join('. ')
  return { reply: `You have ${orders.length} active order${orders.length > 1 ? 's' : ''}. ${text}.`, links: [{ label: 'See orders', href: '/dashboard/retailer' }] }
}

export async function answer(supabase: SupabaseClient, retailerId: string, message: string): Promise<ChatReply> {
  const text = message.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return { reply: 'Ask me about restocking or where your delivery is.' }

  // "how much mince do I have?" gets the product's stock, when the name is mentioned.
  const stock = await inventory(supabase, retailerId)
  const mentioned = stock.find((s) => s.product?.name && text.includes(s.product.name.toLowerCase()))
  if (mentioned && !has(text, WHERE)) {
    const low = mentioned.current_stock <= mentioned.low_stock_threshold
    return {
      reply: `You have ${qty(mentioned.current_stock)} ${mentioned.product?.unit} of ${mentioned.product?.name}. ${low ? `That is low, so I suggest ordering about ${qty(mentioned.reorder_qty)}.` : 'That is above your low-stock level.'}`,
      links: low ? [{ label: `Order ${mentioned.product?.name}`, href: `/dashboard/retailer/order?product=${mentioned.product_id}&qty=${mentioned.reorder_qty}` }] : undefined,
    }
  }

  if (has(text, WHERE)) return whereReply(supabase, retailerId)
  if (has(text, RESTOCK)) return restockReply(supabase, retailerId)
  if (has(text, ORDERS)) return ordersReply(supabase, retailerId)
  if (has(text, HELLO)) {
    return { reply: 'Hello! I can tell you if you need to restock, or where your delivery is. What would you like to know?' }
  }
  return {
    reply: 'I can help with three things: "Do I need to restock?", "Where is my order?" and "What are my orders?". Try one of those.',
  }
}
