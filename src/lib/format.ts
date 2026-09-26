import { ORDER_CUTOFF_HOUR, TIMEZONE } from './constants'
import type { IssueType, OrderStatus, RunStatus } from '@/types'

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

function nairobiHour(at = new Date()) {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, hour: '2-digit', hour12: false }).format(at),
  )
}

/** Same rule as next_delivery_date() in the database. */
export function nextDeliveryDate(at = new Date()) {
  return nairobiDate(at, nairobiHour(at) < ORDER_CUTOFF_HOUR ? 1 : 2)
}

export function isBeforeCutoff(at = new Date()) {
  return nairobiHour(at) < ORDER_CUTOFF_HOUR
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

export function isWithinHours(iso: string, hours: number) {
  return Date.now() - new Date(iso).getTime() < hours * 3600_000
}

export function mapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Waiting for supplier',
  confirmed: 'Confirmed, finding rider',
  rejected: 'Declined',
  assigned: 'Rider booked',
  picked_up: 'On the way',
  delivered: 'Delivered',
  failed: 'Not delivered',
  cancelled: 'Cancelled',
}

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  open: 'Needs a rider',
  assigned: 'Rider booked',
  picked_up: 'Out for delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const ISSUE_LABEL: Record<IssueType, string> = {
  short_delivery: 'Short delivery',
  bad_quality: 'Bad quality',
  wrong_item: 'Wrong item',
  other: 'Other',
}
