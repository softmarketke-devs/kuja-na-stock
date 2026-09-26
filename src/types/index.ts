// Row types for supabase/schema.sql. Keep in sync when the schema changes.

export type UserRole = 'retailer' | 'supplier' | 'rider' | 'admin'
export type SupplierType = 'farm' | 'depot'
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'assigned'
  | 'picked_up'
  | 'delivered'
  | 'failed'
  | 'cancelled'
export type RunStatus = 'open' | 'assigned' | 'picked_up' | 'completed' | 'cancelled'
export type PaymentMethod = 'cash' | 'mpesa'
export type IssueType = 'short_delivery' | 'bad_quality' | 'wrong_item' | 'other'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  phone: string | null
  business_name: string | null
  supplier_type: SupplierType | null
  address: string | null
  lat: number | null
  lng: number | null
  service_radius_km: number
  is_verified: boolean
  created_at: string
  updated_at: string
}

/** The subset of a profile other parties on an order can see. */
export type Contact = Pick<Profile, 'id' | 'full_name' | 'business_name' | 'phone' | 'address' | 'lat' | 'lng'>

export interface Product {
  id: string
  name: string
  category: string
  unit: string
}

export interface SupplierListing {
  id: string
  supplier_id: string
  product_id: string
  price_per_unit: number
  available_qty: number
  min_order_qty: number
  is_active: boolean
  updated_at: string
  product?: Product
}

export interface RetailerInventory {
  id: string
  retailer_id: string
  product_id: string
  current_stock: number
  low_stock_threshold: number
  reorder_qty: number
  updated_at: string
  product?: Product
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  line_total: number
  product?: Product
}

export interface Payment {
  id: string
  order_id: string
  method: PaymentMethod
  amount: number
  mpesa_ref: string | null
  collected_at: string
}

export interface DeliveryIssue {
  id: string
  order_id: string
  issue_type: IssueType
  description: string
  quantity_short: number | null
  status: 'open' | 'resolved'
  resolution: string | null
  created_at: string
  resolved_at: string | null
}

export interface DeliveryRun {
  id: string
  supplier_id: string
  rider_id: string | null
  run_date: string
  status: RunStatus
  rider_fee: number
  created_at: string
  accepted_at: string | null
  picked_up_at: string | null
  completed_at: string | null
  rider?: Contact | null
  supplier?: Contact | null
  orders?: Order[]
}

export interface Order {
  id: string
  order_no: number
  retailer_id: string
  supplier_id: string
  run_id: string | null
  status: OrderStatus
  delivery_date: string
  delivery_window: string
  delivery_address: string
  delivery_lat: number
  delivery_lng: number
  distance_km: number
  subtotal: number
  delivery_fee: number
  total: number
  notes: string | null
  status_reason: string | null
  confirmed_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
  created_at: string
  items?: OrderItem[]
  retailer?: Contact | null
  supplier?: Contact | null
  run?: Pick<DeliveryRun, 'id' | 'status' | 'rider_id'> & { rider?: Contact | null } | null
  secret?: { delivery_code: string } | null
  payment?: Payment | null
  issues?: DeliveryIssue[]
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

/** Row returned by the quote_suppliers() RPC. */
export interface SupplierQuote {
  listing_id: string
  supplier_id: string
  supplier_name: string
  supplier_type: SupplierType
  supplier_verified: boolean
  product_id: string
  product_name: string
  category: string
  unit: string
  price_per_unit: number
  available_qty: number
  min_order_qty: number
  distance_km: number
  delivery_fee: number
  in_range: boolean
}

/** Row returned by the open_runs_for_me() RPC. */
export interface OpenRun {
  run_id: string
  run_date: string
  supplier_name: string
  supplier_address: string | null
  pickup_km: number
  drops: number
  rider_fee: number
  i_am_available: boolean
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string } | null
