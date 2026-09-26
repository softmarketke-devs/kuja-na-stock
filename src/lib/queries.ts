// PostgREST select strings shared by the dashboards. RLS decides what each
// role actually gets back (e.g. `secret` is only ever returned to the retailer).

const CONTACT = 'id, full_name, business_name, phone, address, lat, lng'

export const ORDER_ITEMS = 'items:order_items(*, product:products(*))'

export const ORDER_WITH_DETAILS = `*,
  ${ORDER_ITEMS},
  supplier:profiles!orders_supplier_id_fkey(${CONTACT}),
  retailer:profiles!orders_retailer_id_fkey(${CONTACT}),
  run:delivery_runs(id, status, rider_id, rider:profiles!delivery_runs_rider_id_fkey(${CONTACT})),
  secret:order_secrets(delivery_code),
  payment:payments(*),
  issues:delivery_issues(*)`

export const RUN_WITH_ORDERS = `*,
  supplier:profiles!delivery_runs_supplier_id_fkey(${CONTACT}),
  rider:profiles!delivery_runs_rider_id_fkey(${CONTACT}),
  orders(*, ${ORDER_ITEMS}, retailer:profiles!orders_retailer_id_fkey(${CONTACT}), payment:payments(*))`

export const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'assigned', 'picked_up'] as const
