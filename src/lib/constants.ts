// Business rules. The database enforces these (supabase/schema.sql); the UI
// only uses them for display, so change both places together.

export const TIMEZONE = 'Africa/Nairobi'
export const ORDER_CUTOFF_HOUR = 21 // 9 PM
export const DELIVERY_WINDOW = '05:00–07:00'
export const FEE_PER_KM = 50
export const MIN_DELIVERY_FEE = 100
export const MAX_DROPS_PER_RUN = 6
export const ISSUE_REPORT_HOURS = 24

export const DASHBOARD_HOME: Record<string, string> = {
  retailer: '/dashboard/retailer',
  supplier: '/dashboard/supplier',
  rider: '/dashboard/rider',
  admin: '/dashboard/settings',
}
