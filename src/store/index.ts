import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Profile,
  Product,
  RetailerInventory,
  SupplierListing,
  Order,
  BodaAssignment,
  Notification,
  UserRole,
} from '@/types'

// Demo Seed Profiles
export const DEMO_PROFILES: Record<UserRole, Profile> = {
  retailer: {
    id: 'user-retailer-1',
    role: 'retailer',
    full_name: 'Mama Sarah (Sarah Wanjiku)',
    email: 'sarah.wanjiku@kiosk.co.ke',
    phone: '+254 712 345 678',
    business_name: 'Mama Sarah Fresh Kiosk',
    location: { type: 'Point', coordinates: [36.807, -1.265] }, // Westlands, Nairobi
    address: 'Kipande Road, Westlands, Nairobi',
    is_verified: true,
    is_active: true,
    elevenlabs_voice_id: null,
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
  },
  wholesaler: {
    id: 'user-wholesaler-1',
    role: 'wholesaler',
    full_name: 'David Kiprono',
    email: 'david@kilimotraders.co.ke',
    phone: '+254 722 111 222',
    business_name: 'Kilimo Traders Wholesalers',
    location: { type: 'Point', coordinates: [36.845, -1.305] }, // Industrial Area, Nairobi
    address: 'Enterprise Road, Industrial Area, Nairobi',
    is_verified: true,
    is_active: true,
    elevenlabs_voice_id: null,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
  },
  farmer: {
    id: 'user-farmer-1',
    role: 'farmer',
    full_name: 'Peter Njoroge',
    email: 'peter@greenvalley.co.ke',
    phone: '+254 733 999 888',
    business_name: 'Green Valley Farmers Co-op',
    location: { type: 'Point', coordinates: [36.721, -1.218] }, // Kiambu / Limuru road
    address: 'Limuru Agricultural Corridor, Kiambu',
    is_verified: true,
    is_active: true,
    elevenlabs_voice_id: null,
    created_at: '2026-02-01T08:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
  },
  boda_rider: {
    id: 'user-boda-1',
    role: 'boda_rider',
    full_name: 'James Otieno (Boda Rider)',
    email: 'james.boda@express.co.ke',
    phone: '+254 799 444 555',
    business_name: 'James Boda Express Logistics',
    location: { type: 'Point', coordinates: [36.812, -1.268] }, // Westlands stage
    address: 'Westlands Stage #4, Nairobi',
    is_verified: true,
    is_active: true,
    elevenlabs_voice_id: null,
    created_at: '2026-03-05T08:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
  },
  admin: {
    id: 'user-admin-1',
    role: 'admin',
    full_name: 'System Admin',
    email: 'admin@kujanastock.co.ke',
    phone: '+254 700 000 000',
    business_name: 'Kuja Na Stock Central Operations',
    location: null,
    address: 'Nairobi Central',
    is_verified: true,
    is_active: true,
    elevenlabs_voice_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
  },
}

export const SEED_PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'Maize', category: 'Grains', unit: 'kg', description: 'Dry grade 1 white maize', image_url: null, created_at: '2026-01-01' },
  { id: 'prod-2', name: 'Beans (Rosecoco)', category: 'Grains', unit: 'kg', description: 'Clean Rosecoco red speckled beans', image_url: null, created_at: '2026-01-01' },
  { id: 'prod-3', name: 'Rice (Pishori)', category: 'Grains', unit: 'kg', description: 'Aromatic Mwea Pure Pishori rice', image_url: null, created_at: '2026-01-01' },
  { id: 'prod-4', name: 'Tomatoes', category: 'Vegetables', unit: 'kg', description: 'Fresh firm plum salad tomatoes', image_url: null, created_at: '2026-01-01' },
  { id: 'prod-5', name: 'Red Onions', category: 'Vegetables', unit: 'kg', description: 'Cured red onions from Kieni', image_url: null, created_at: '2026-01-01' },
  { id: 'prod-6', name: 'Irish Potatoes', category: 'Vegetables', unit: 'kg', description: 'Shangi variety potatoes, clean skin', image_url: null, created_at: '2026-01-01' },
  { id: 'prod-7', name: 'Fresh Milk', category: 'Dairy', unit: 'litres', description: 'Fresh pasteurized farm milk', image_url: null, created_at: '2026-01-01' },
  { id: 'prod-8', name: 'Farm Eggs', category: 'Dairy', unit: 'trays', description: 'Grade A fresh brown eggs (30 count)', image_url: null, created_at: '2026-01-01' },
  { id: 'prod-9', name: 'Cooking Oil', category: 'Essentials', unit: 'litres', description: 'Fortified pure vegetable palm oil', image_url: null, created_at: '2026-01-01' },
]

export const INITIAL_INVENTORY: RetailerInventory[] = [
  {
    id: 'inv-1',
    retailer_id: 'user-retailer-1',
    product_id: 'prod-1',
    current_stock: 8,
    low_stock_threshold: 20,
    reorder_quantity: 50,
    last_updated: '2026-09-21T18:00:00Z',
    product: SEED_PRODUCTS[0],
  },
  {
    id: 'inv-2',
    retailer_id: 'user-retailer-1',
    product_id: 'prod-2',
    current_stock: 35,
    low_stock_threshold: 15,
    reorder_quantity: 40,
    last_updated: '2026-09-21T18:00:00Z',
    product: SEED_PRODUCTS[1],
  },
  {
    id: 'inv-3',
    retailer_id: 'user-retailer-1',
    product_id: 'prod-3',
    current_stock: 45,
    low_stock_threshold: 20,
    reorder_quantity: 50,
    last_updated: '2026-09-21T18:00:00Z',
    product: SEED_PRODUCTS[2],
  },
  {
    id: 'inv-4',
    retailer_id: 'user-retailer-1',
    product_id: 'prod-4',
    current_stock: 4,
    low_stock_threshold: 15,
    reorder_quantity: 30,
    last_updated: '2026-09-21T18:00:00Z',
    product: SEED_PRODUCTS[3],
  },
  {
    id: 'inv-5',
    retailer_id: 'user-retailer-1',
    product_id: 'prod-5',
    current_stock: 22,
    low_stock_threshold: 15,
    reorder_quantity: 25,
    last_updated: '2026-09-21T18:00:00Z',
    product: SEED_PRODUCTS[4],
  },
  {
    id: 'inv-6',
    retailer_id: 'user-retailer-1',
    product_id: 'prod-8',
    current_stock: 3,
    low_stock_threshold: 10,
    reorder_quantity: 15,
    last_updated: '2026-09-21T18:00:00Z',
    product: SEED_PRODUCTS[7],
  },
]

export const INITIAL_LISTINGS: SupplierListing[] = [
  // Wholesaler listings (Close in Industrial Area / Westlands, slightly higher base rate, fast Boda delivery)
  {
    id: 'list-1',
    supplier_id: 'user-wholesaler-1',
    product_id: 'prod-1',
    price_per_unit: 45,
    available_stock: 800,
    min_order_quantity: 10,
    unit: 'kg',
    is_active: true,
    location: { type: 'Point', coordinates: [36.845, -1.305] },
    delivery_radius_km: 25,
    delivery_fee_per_km: 50,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
    product: SEED_PRODUCTS[0],
    supplier: DEMO_PROFILES.wholesaler,
    distance_km: 3.2,
    total_delivery_fee: 160,
  },
  {
    id: 'list-2',
    supplier_id: 'user-wholesaler-1',
    product_id: 'prod-2',
    price_per_unit: 125,
    available_stock: 450,
    min_order_quantity: 10,
    unit: 'kg',
    is_active: true,
    location: { type: 'Point', coordinates: [36.845, -1.305] },
    delivery_radius_km: 25,
    delivery_fee_per_km: 50,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
    product: SEED_PRODUCTS[1],
    supplier: DEMO_PROFILES.wholesaler,
    distance_km: 3.2,
    total_delivery_fee: 160,
  },
  {
    id: 'list-3',
    supplier_id: 'user-wholesaler-1',
    product_id: 'prod-3',
    price_per_unit: 175,
    available_stock: 600,
    min_order_quantity: 10,
    unit: 'kg',
    is_active: true,
    location: { type: 'Point', coordinates: [36.845, -1.305] },
    delivery_radius_km: 25,
    delivery_fee_per_km: 50,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
    product: SEED_PRODUCTS[2],
    supplier: DEMO_PROFILES.wholesaler,
    distance_km: 3.2,
    total_delivery_fee: 160,
  },
  {
    id: 'list-wh-4',
    supplier_id: 'user-wholesaler-1',
    product_id: 'prod-4', // Tomatoes
    price_per_unit: 80,
    available_stock: 250,
    min_order_quantity: 5,
    unit: 'kg',
    is_active: true,
    location: { type: 'Point', coordinates: [36.845, -1.305] },
    delivery_radius_km: 25,
    delivery_fee_per_km: 50,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
    product: SEED_PRODUCTS[3],
    supplier: DEMO_PROFILES.wholesaler,
    distance_km: 3.2,
    total_delivery_fee: 160,
  },
  {
    id: 'list-wh-6',
    supplier_id: 'user-wholesaler-1',
    product_id: 'prod-6', // Irish Potatoes
    price_per_unit: 58,
    available_stock: 900,
    min_order_quantity: 15,
    unit: 'kg',
    is_active: true,
    location: { type: 'Point', coordinates: [36.845, -1.305] },
    delivery_radius_km: 25,
    delivery_fee_per_km: 50,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
    product: SEED_PRODUCTS[5],
    supplier: DEMO_PROFILES.wholesaler,
    distance_km: 3.2,
    total_delivery_fee: 160,
  },
  {
    id: 'list-wh-8',
    supplier_id: 'user-wholesaler-1',
    product_id: 'prod-8', // Eggs
    price_per_unit: 390,
    available_stock: 120,
    min_order_quantity: 2,
    unit: 'trays',
    is_active: true,
    location: { type: 'Point', coordinates: [36.845, -1.305] },
    delivery_radius_km: 25,
    delivery_fee_per_km: 50,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
    product: SEED_PRODUCTS[7],
    supplier: DEMO_PROFILES.wholesaler,
    distance_km: 3.2,
    total_delivery_fee: 160,
  },
  // Farmer listings (Further in Limuru / Kiambu, cheaper farm gate rate, longer Boda transit)
  {
    id: 'list-4',
    supplier_id: 'user-farmer-1',
    product_id: 'prod-1', // Maize
    price_per_unit: 40,
    available_stock: 1500,
    min_order_quantity: 25,
    unit: 'kg',
    is_active: true,
    location: { type: 'Point', coordinates: [36.721, -1.218] },
    delivery_radius_km: 40,
    delivery_fee_per_km: 45,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
    product: SEED_PRODUCTS[0],
    supplier: DEMO_PROFILES.farmer,
    distance_km: 6.8,
    total_delivery_fee: 306,
  },
  {
    id: 'list-fm-2',
    supplier_id: 'user-farmer-1',
    product_id: 'prod-2', // Beans
    price_per_unit: 110,
    available_stock: 800,
    min_order_quantity: 10,
    unit: 'kg',
    is_active: true,
    location: { type: 'Point', coordinates: [36.721, -1.218] },
    delivery_radius_km: 40,
    delivery_fee_per_km: 45,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
    product: SEED_PRODUCTS[1],
    supplier: DEMO_PROFILES.farmer,
    distance_km: 6.8,
    total_delivery_fee: 306,
  },
  {
    id: 'list-5',
    supplier_id: 'user-farmer-1',
    product_id: 'prod-4', // Tomatoes
    price_per_unit: 65,
    available_stock: 320,
    min_order_quantity: 5,
    unit: 'kg',
    is_active: true,
    location: { type: 'Point', coordinates: [36.721, -1.218] },
    delivery_radius_km: 40,
    delivery_fee_per_km: 45,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
    product: SEED_PRODUCTS[3],
    supplier: DEMO_PROFILES.farmer,
    distance_km: 6.8,
    total_delivery_fee: 306,
  },
  {
    id: 'list-fm-6',
    supplier_id: 'user-farmer-1',
    product_id: 'prod-6', // Irish Potatoes
    price_per_unit: 42,
    available_stock: 1200,
    min_order_quantity: 20,
    unit: 'kg',
    is_active: true,
    location: { type: 'Point', coordinates: [36.721, -1.218] },
    delivery_radius_km: 40,
    delivery_fee_per_km: 45,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
    product: SEED_PRODUCTS[5],
    supplier: DEMO_PROFILES.farmer,
    distance_km: 6.8,
    total_delivery_fee: 306,
  },
  {
    id: 'list-6',
    supplier_id: 'user-farmer-1',
    product_id: 'prod-8', // Eggs
    price_per_unit: 360,
    available_stock: 80,
    min_order_quantity: 2,
    unit: 'trays',
    is_active: true,
    location: { type: 'Point', coordinates: [36.721, -1.218] },
    delivery_radius_km: 40,
    delivery_fee_per_km: 45,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
    product: SEED_PRODUCTS[7],
    supplier: DEMO_PROFILES.farmer,
    distance_km: 6.8,
    total_delivery_fee: 306,
  },
]

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'order-101',
    retailer_id: 'user-retailer-1',
    supplier_id: 'user-wholesaler-1',
    product_id: 'prod-2',
    quantity: 30,
    unit_price: 125,
    delivery_fee: 160,
    total_amount: 3910,
    status: 'delivered',
    delivery_address: 'Mama Sarah Fresh Kiosk, Kipande Road, Westlands',
    delivery_location: { type: 'Point', coordinates: [36.807, -1.265] },
    delivery_notes: 'Leave at front counter, ask for Mama Sarah',
    estimated_delivery: '2026-09-21T14:30:00Z',
    actual_delivery: '2026-09-21T14:25:00Z',
    created_at: '2026-09-21T12:00:00Z',
    updated_at: '2026-09-21T14:25:00Z',
    product: SEED_PRODUCTS[1],
    supplier: DEMO_PROFILES.wholesaler,
    retailer: DEMO_PROFILES.retailer,
  },
]

export const INITIAL_ASSIGNMENTS: BodaAssignment[] = [
  {
    id: 'assign-101',
    order_id: 'order-101',
    boda_rider_id: 'user-boda-1',
    status: 'delivered',
    pickup_location: { type: 'Point', coordinates: [36.845, -1.305] },
    delivery_location: { type: 'Point', coordinates: [36.807, -1.265] },
    distance_km: 3.2,
    delivery_fee: 160,
    offered_at: '2026-09-21T12:05:00Z',
    accepted_at: '2026-09-21T12:08:00Z',
    picked_up_at: '2026-09-21T12:45:00Z',
    delivered_at: '2026-09-21T14:25:00Z',
    cancelled_at: null,
    cancellation_reason: null,
    rider: DEMO_PROFILES.boda_rider,
    order: INITIAL_ORDERS[0],
  },
]

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'user-retailer-1',
    type: 'low_stock',
    title: '⚠️ Low Stock Alert: Maize',
    message: 'Maize has dropped to 8 kg (minimum threshold: 20 kg). Tap to compare suppliers and reorder.',
    data: { product_id: 'prod-1', current_stock: 8, threshold: 20 },
    is_read: false,
    created_at: '2026-09-21T18:05:00Z',
  },
  {
    id: 'notif-2',
    user_id: 'user-retailer-1',
    type: 'low_stock',
    title: '⚠️ Low Stock Alert: Tomatoes',
    message: 'Tomatoes have dropped to 4 kg (minimum threshold: 15 kg). Fresh farm harvest available nearby.',
    data: { product_id: 'prod-4', current_stock: 4, threshold: 15 },
    is_read: false,
    created_at: '2026-09-21T18:02:00Z',
  },
]

interface AppState {
  // Active Persona / Auth
  currentRole: UserRole
  currentUser: Profile
  isDemoMode: boolean
  
  // App Data
  products: Product[]
  inventory: RetailerInventory[]
  listings: SupplierListing[]
  orders: Order[]
  assignments: BodaAssignment[]
  notifications: Notification[]
  unreadCount: number

  // Actions
  switchRole: (role: UserRole) => void
  setUser: (user: Profile | null) => void
  
  // Retailer Actions
  updateInventoryStock: (productId: string, delta: number) => void
  triggerLowStockSimulation: (productId: string) => void
  createOrder: (params: {
    productId: string
    supplierId: string
    quantity: number
    deliveryAddress?: string
    notes?: string
  }) => Order

  // Supplier Actions
  updateListing: (listingId: string, updates: Partial<SupplierListing>) => void
  addListing: (listing: Omit<SupplierListing, 'id' | 'created_at' | 'updated_at'>) => void
  supplierConfirmOrder: (orderId: string) => void

  // Boda Rider Actions
  bodaAcceptAssignment: (assignmentId: string) => void
  bodaDeclineAssignment: (assignmentId: string) => void
  bodaAdvanceTrip: (assignmentId: string) => void // picked_up -> in_transit -> delivered

  // Notifications
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // Reset
  resetDemoData: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentRole: 'retailer',
      currentUser: DEMO_PROFILES.retailer,
      isDemoMode: true,

      products: SEED_PRODUCTS,
      inventory: INITIAL_INVENTORY,
      listings: INITIAL_LISTINGS,
      orders: INITIAL_ORDERS,
      assignments: INITIAL_ASSIGNMENTS,
      notifications: INITIAL_NOTIFICATIONS,
      unreadCount: INITIAL_NOTIFICATIONS.filter(n => !n.is_read).length,

      switchRole: (role: UserRole) => {
        const newProfile = DEMO_PROFILES[role]
        set({
          currentRole: role,
          currentUser: newProfile,
        })
      },

      setUser: (user) => {
        if (user) {
          set({ currentUser: user, currentRole: user.role })
        }
      },

      updateInventoryStock: (productId, delta) => {
        set((state) => {
          const updated = state.inventory.map((item) => {
            if (item.product_id === productId) {
              const newStock = Math.max(0, item.current_stock + delta)
              return {
                ...item,
                current_stock: newStock,
                last_updated: new Date().toISOString(),
              }
            }
            return item
          })

          // Check if triggered low stock
          const target = updated.find((i) => i.product_id === productId)
          let newNotifs = [...state.notifications]
          if (target && target.current_stock <= target.low_stock_threshold) {
            const prodName = target.product?.name || 'Item'
            newNotifs.unshift({
              id: `notif-${Date.now()}`,
              user_id: target.retailer_id,
              type: 'low_stock',
              title: `⚠️ Low Stock Alert: ${prodName}`,
              message: `${prodName} is running low (${target.current_stock} ${target.product?.unit} left). Tap to restock now.`,
              data: { product_id: productId, current_stock: target.current_stock, threshold: target.low_stock_threshold },
              is_read: false,
              created_at: new Date().toISOString(),
            })
          }

          return {
            inventory: updated,
            notifications: newNotifs,
            unreadCount: newNotifs.filter((n) => !n.is_read).length,
          }
        })
      },

      triggerLowStockSimulation: (productId) => {
        set((state) => {
          const updated = state.inventory.map((item) => {
            if (item.product_id === productId) {
              return {
                ...item,
                current_stock: Math.max(2, Math.floor(item.low_stock_threshold * 0.4)),
                last_updated: new Date().toISOString(),
              }
            }
            return item
          })

          const target = updated.find((i) => i.product_id === productId)
          const prodName = target?.product?.name || 'Product'
          const newNotif: Notification = {
            id: `notif-${Date.now()}`,
            user_id: 'user-retailer-1',
            type: 'low_stock',
            title: `⚠️ Critical Low Stock: ${prodName}`,
            message: `${prodName} has fallen below threshold (${target?.current_stock} ${target?.product?.unit} remaining). Reorder recommended!`,
            data: { product_id: productId, current_stock: target?.current_stock },
            is_read: false,
            created_at: new Date().toISOString(),
          }

          return {
            inventory: updated,
            notifications: [newNotif, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }
        })
      },

      createOrder: ({ productId, supplierId, quantity, deliveryAddress, notes }) => {
        const state = get()
        const product = state.products.find((p) => p.id === productId)
        const listing = state.listings.find((l) => l.product_id === productId && l.supplier_id === supplierId)
        const unitPrice = listing?.price_per_unit || 50
        const deliveryFee = listing?.total_delivery_fee || 150
        const totalAmount = quantity * unitPrice + deliveryFee
        const supplier = DEMO_PROFILES[supplierId.includes('farmer') ? 'farmer' : 'wholesaler'] || listing?.supplier

        const newOrder: Order = {
          id: `KNS-${Date.now().toString().slice(-4)}`,
          retailer_id: state.currentUser.id,
          supplier_id: supplierId,
          product_id: productId,
          quantity,
          unit_price: unitPrice,
          delivery_fee: deliveryFee,
          total_amount: totalAmount,
          status: 'pending',
          delivery_address: deliveryAddress || state.currentUser.address || 'Westlands, Nairobi',
          delivery_location: state.currentUser.location,
          delivery_notes: notes || null,
          estimated_delivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
          actual_delivery: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product,
          supplier,
          retailer: state.currentUser,
        }

        // Add notification for supplier
        const supplierNotif: Notification = {
          id: `notif-${Date.now()}`,
          user_id: supplierId,
          type: 'new_order',
          title: `📦 New Order #${newOrder.id}`,
          message: `${state.currentUser.business_name || state.currentUser.full_name} placed an order for ${quantity} ${product?.unit || 'kg'} of ${product?.name}. Total: KSh ${totalAmount.toLocaleString()}.`,
          data: { order_id: newOrder.id },
          is_read: false,
          created_at: new Date().toISOString(),
        }

        // Add notification for retailer
        const retailerNotif: Notification = {
          id: `notif-${Date.now() + 1}`,
          user_id: state.currentUser.id,
          type: 'order_placed',
          title: `✅ Order Placed: #${newOrder.id}`,
          message: `Your order for ${quantity} ${product?.unit || 'kg'} of ${product?.name} has been sent to ${supplier?.business_name}. We will notify a nearby boda once confirmed!`,
          data: { order_id: newOrder.id },
          is_read: false,
          created_at: new Date().toISOString(),
        }

        set((s) => ({
          orders: [newOrder, ...s.orders],
          notifications: [retailerNotif, supplierNotif, ...s.notifications],
          unreadCount: s.unreadCount + 2,
        }))

        return newOrder
      },

      updateListing: (listingId, updates) => {
        set((state) => ({
          listings: state.listings.map((l) =>
            l.id === listingId
              ? { ...l, ...updates, updated_at: new Date().toISOString() }
              : l
          ),
        }))
      },

      addListing: (listingData) => {
        const newListing: SupplierListing = {
          ...listingData,
          id: `list-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set((state) => ({
          listings: [newListing, ...state.listings],
        }))
      },

      supplierConfirmOrder: (orderId) => {
        set((state) => {
          const targetOrder = state.orders.find((o) => o.id === orderId)
          if (!targetOrder) return state

          const updatedOrders = state.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: 'confirmed' as const, updated_at: new Date().toISOString() }
              : o
          )

          // Dispatch to nearest Boda rider!
          const bodaRider = DEMO_PROFILES.boda_rider
          const distanceKm = 4.2
          const deliveryFee = targetOrder.delivery_fee || Math.round(distanceKm * 50)

          const newAssignment: BodaAssignment = {
            id: `assign-${Date.now().toString().slice(-4)}`,
            order_id: orderId,
            boda_rider_id: bodaRider.id,
            status: 'offered',
            pickup_location: targetOrder.supplier?.location || null,
            delivery_location: targetOrder.delivery_location,
            distance_km: distanceKm,
            delivery_fee: deliveryFee,
            offered_at: new Date().toISOString(),
            accepted_at: null,
            picked_up_at: null,
            delivered_at: null,
            cancelled_at: null,
            cancellation_reason: null,
            rider: bodaRider,
            order: targetOrder,
          }

          const bodaNotif: Notification = {
            id: `notif-${Date.now()}`,
            user_id: bodaRider.id,
            type: 'boda_dispatch',
            title: `🛵 Delivery Request: KSh ${deliveryFee}`,
            message: `New delivery from ${targetOrder.supplier?.business_name} to ${targetOrder.retailer?.business_name || 'Retailer'}. Distance: ${distanceKm} km. Tap to accept or decline.`,
            data: { assignment_id: newAssignment.id, order_id: orderId },
            is_read: false,
            created_at: new Date().toISOString(),
          }

          const retailerNotif: Notification = {
            id: `notif-${Date.now() + 1}`,
            user_id: targetOrder.retailer_id,
            type: 'order_confirmed',
            title: `👍 Order Confirmed: #${orderId}`,
            message: `${targetOrder.supplier?.business_name} confirmed your order. Dispatching to nearest boda rider now.`,
            data: { order_id: orderId },
            is_read: false,
            created_at: new Date().toISOString(),
          }

          return {
            orders: updatedOrders,
            assignments: [newAssignment, ...state.assignments],
            notifications: [bodaNotif, retailerNotif, ...state.notifications],
            unreadCount: state.unreadCount + 2,
          }
        })
      },

      bodaAcceptAssignment: (assignmentId) => {
        set((state) => {
          const assign = state.assignments.find((a) => a.id === assignmentId)
          if (!assign) return state

          const updatedAssignments = state.assignments.map((a) =>
            a.id === assignmentId
              ? {
                  ...a,
                  status: 'accepted' as const,
                  accepted_at: new Date().toISOString(),
                }
              : a
          )

          const updatedOrders = state.orders.map((o) =>
            o.id === assign.order_id
              ? { ...o, status: 'assigned' as const, updated_at: new Date().toISOString() }
              : o
          )

          const retailerNotif: Notification = {
            id: `notif-${Date.now()}`,
            user_id: assign.order?.retailer_id || 'user-retailer-1',
            type: 'boda_accepted',
            title: `🛵 Boda Rider Assigned!`,
            message: `${assign.rider?.full_name} accepted your delivery for Order #${assign.order_id}. Heading to supplier for pickup.`,
            data: { order_id: assign.order_id, assignment_id: assignmentId },
            is_read: false,
            created_at: new Date().toISOString(),
          }

          return {
            assignments: updatedAssignments,
            orders: updatedOrders,
            notifications: [retailerNotif, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }
        })
      },

      bodaDeclineAssignment: (assignmentId) => {
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === assignmentId
              ? {
                  ...a,
                  status: 'declined' as const,
                  cancelled_at: new Date().toISOString(),
                  cancellation_reason: 'Rider busy or out of range',
                }
              : a
          ),
        }))
      },

      bodaAdvanceTrip: (assignmentId) => {
        set((state) => {
          const assign = state.assignments.find((a) => a.id === assignmentId)
          if (!assign) return state

          let nextStatus: 'picked_up' | 'in_transit' | 'delivered' = 'picked_up'
          let nextOrderStatus: Order['status'] = 'picked_up'
          let notifTitle = ''
          let notifMsg = ''

          if (assign.status === 'accepted') {
            nextStatus = 'picked_up'
            nextOrderStatus = 'picked_up'
            notifTitle = '📦 Package Picked Up'
            notifMsg = `${assign.rider?.full_name} has picked up goods from ${assign.order?.supplier?.business_name}. In transit to you!`
          } else if (assign.status === 'picked_up') {
            nextStatus = 'in_transit'
            nextOrderStatus = 'in_transit'
            notifTitle = '🛵 Rider On the Way'
            notifMsg = `James is 0.8 km away. Arriving in ~3 minutes!`
          } else if (assign.status === 'in_transit') {
            nextStatus = 'delivered'
            nextOrderStatus = 'delivered'
            notifTitle = '🎉 Order Delivered!'
            notifMsg = `Order #${assign.order_id} has been delivered successfully. Payment confirmed at counter.`
          }

          const updatedAssignments = state.assignments.map((a) =>
            a.id === assignmentId
              ? {
                  ...a,
                  status: nextStatus,
                  picked_up_at: nextStatus === 'picked_up' ? new Date().toISOString() : a.picked_up_at,
                  delivered_at: nextStatus === 'delivered' ? new Date().toISOString() : a.delivered_at,
                }
              : a
          )

          const updatedOrders = state.orders.map((o) =>
            o.id === assign.order_id
              ? {
                  ...o,
                  status: nextOrderStatus,
                  actual_delivery: nextStatus === 'delivered' ? new Date().toISOString() : null,
                  updated_at: new Date().toISOString(),
                }
              : o
          )

          // If delivered, automatically replenish the retailer's inventory stock!
          let updatedInventory = state.inventory
          if (nextStatus === 'delivered' && assign.order) {
            updatedInventory = state.inventory.map((inv) => {
              if (inv.product_id === assign.order?.product_id) {
                return {
                  ...inv,
                  current_stock: inv.current_stock + (assign.order?.quantity || 0),
                  last_updated: new Date().toISOString(),
                }
              }
              return inv
            })
          }

          const notif: Notification = {
            id: `notif-${Date.now()}`,
            user_id: assign.order?.retailer_id || 'user-retailer-1',
            type: `boda_${nextStatus}`,
            title: notifTitle,
            message: notifMsg,
            data: { order_id: assign.order_id, assignment_id: assignmentId },
            is_read: false,
            created_at: new Date().toISOString(),
          }

          return {
            assignments: updatedAssignments,
            orders: updatedOrders,
            inventory: updatedInventory,
            notifications: [notif, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }
        })
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }))
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
          unreadCount: 0,
        }))
      },

      resetDemoData: () => {
        set({
          products: SEED_PRODUCTS,
          inventory: INITIAL_INVENTORY,
          listings: INITIAL_LISTINGS,
          orders: INITIAL_ORDERS,
          assignments: INITIAL_ASSIGNMENTS,
          notifications: INITIAL_NOTIFICATIONS,
          unreadCount: INITIAL_NOTIFICATIONS.filter((n) => !n.is_read).length,
          currentRole: 'retailer',
          currentUser: DEMO_PROFILES.retailer,
        })
      },
    }),
    {
      name: 'kuja-na-stock-master-store',
    }
  )
)

// Legacy store compatibility hooks so existing references don't break
export const useAuthStore = create<{
  user: Profile | null
  session: any | null
  isLoading: boolean
  setUser: (u: Profile | null) => void
  setSession: (s: any) => void
  setLoading: (l: boolean) => void
  logout: () => void
}>()((set) => ({
  user: DEMO_PROFILES.retailer,
  session: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, session: null }),
}))

export const useNotificationStore = create<{
  notifications: Notification[]
  unreadCount: number
  addNotification: (n: Omit<Notification, 'id'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}>()((set) => ({
  notifications: INITIAL_NOTIFICATIONS,
  unreadCount: INITIAL_NOTIFICATIONS.length,
  addNotification: (n) =>
    set((s) => ({
      notifications: [{ ...n, id: `notif-${Date.now()}` }, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),
  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}))

export const useVoiceStore = create<{
  isListening: boolean
  isSpeaking: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  setTranscript: (t: string) => void
  setSpeaking: (s: boolean) => void
}>((set) => ({
  isListening: false,
  isSpeaking: false,
  transcript: '',
  startListening: () => set({ isListening: true, transcript: '' }),
  stopListening: () => set({ isListening: false }),
  setTranscript: (transcript) => set({ transcript }),
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
}))