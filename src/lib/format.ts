import { TIMEZONE } from './constants'

export function ksh(amount: number | string | null | undefined) {
  return `KSh ${Math.round(Number(amount ?? 0)).toLocaleString('en-KE')}`
}

export function qty(n: number | string) {
  const v = Number(n)
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

/** "Thu 25 Sep" for a YYYY-MM-DD date. */
export function formatDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  })
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  })
}

/** Nairobi calendar date (YYYY-MM-DD) for an instant, plus N days. */
export function nairobiDate(at = new Date(), addDays = 0) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at)
  const d = new Date(`${parts}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + addDays)
  return d.toISOString().slice(0, 10)
}

/** 0712 345 678 / 254712345678 → +254712345678. Mirrors normalize_ke_phone(). */
export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, '')
  if (/^0[17]\d{8}$/.test(digits)) return `+254${digits.slice(1)}`
  if (/^254[17]\d{8}$/.test(digits)) return `+${digits}`
  return input.trim()
}

export function isKenyanMobile(input: string) {
  return /^\+254[17]\d{8}$/.test(normalizePhone(input))
}
