// Meat transport permit status. The database enforces validity on the run
// date (carrier_block_reason); this is for display. Keep PERMIT_WARNING_DAYS
// in step with the reminders in evening_sweep (supabase/schema.sql).

export const PERMIT_WARNING_DAYS = 30

export type PermitState = 'missing' | 'expired' | 'expiring' | 'valid'

export interface PermitStatus {
  state: PermitState
  label: string
  daysLeft: number | null
}

function dayNumber(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

export function permitStatus(
  permitNo: string | null | undefined,
  expiry: string | null | undefined,
  today: string,
): PermitStatus {
  if (!permitNo || !expiry) return { state: 'missing', label: 'No permit recorded', daysLeft: null }
  const daysLeft = dayNumber(expiry) - dayNumber(today)
  if (daysLeft < 0) return { state: 'expired', label: 'Permit expired', daysLeft }
  if (daysLeft <= PERMIT_WARNING_DAYS) {
    return { state: 'expiring', label: daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft} days`, daysLeft }
  }
  return { state: 'valid', label: 'Permit valid', daysLeft }
}
