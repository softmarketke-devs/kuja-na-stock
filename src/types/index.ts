// Row types for the Supabase tables the app uses. Keep in sync when the schema changes.

export type UserRole = 'customer' | 'admin'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  phone: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export interface ShopItem {
  id: string
  name: string
  blurb: string | null
  image: string | null
  price_per_kg: number | null
  stock_kg: number
  is_active: boolean
}

export type CustomerOrderStatus = 'pending' | 'quoted' | 'paid' | 'delivered' | 'cancelled'
export type CustomerPaymentMethod = 'mpesa' | 'cash_on_delivery'

export interface CustomerOrder {
  id: number
  customer_id: string
  items: { name: string; kg: number }[]
  delivery_address: string
  phone: string | null
  notes: string | null
  status: CustomerOrderStatus
  payment_method: CustomerPaymentMethod
  mpesa_receipt: string | null
  paid_at: string | null
  estimated_total_kes: number | null
  items_total_kes: number | null
  delivery_fee_kes: number | null
  created_at: string
}

export interface MpesaAttempt {
  id: number
  order_id: number
  status: 'pending' | 'paid' | 'failed' | 'paid_needs_review'
  amount: number
  receipt: string | null
  result_desc: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string } | null
