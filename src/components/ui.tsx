import { clsx } from 'clsx'
import type { OrderStatus, RunStatus } from '@/types'
import { ORDER_STATUS_LABEL, RUN_STATUS_LABEL } from '@/lib/format'
import type { PermitState, PermitStatus } from '@/lib/permit'

// Tap targets are 48px (min-h-12), the size a thumb can hit reliably on a phone.
export const inputClass =
  'w-full min-h-12 bg-white border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-shadow'
export const labelClass = 'block text-[13px] font-bold text-slate-700 mb-1.5'
export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm min-h-12 px-5 py-2.5 shadow-[0_6px_16px_-6px_rgb(217_72_15/0.7)] hover:shadow-[0_8px_20px_-6px_rgb(217_72_15/0.8)]'
export const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300 text-slate-800 font-bold text-sm min-h-12 px-5 py-2.5 shadow-xs'
export const dangerButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed border border-red-300 text-red-700 font-bold text-sm min-h-12 px-5 py-2.5'

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('bg-white border border-slate-200 rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden', className)}>
      {children}
    </div>
  )
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.12em] text-slate-800">
        <span className="w-1.5 h-4 rounded-full bg-orange-600" aria-hidden />
        {children}
      </h2>
      {aside}
    </div>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-slate-600 border-2 border-dashed border-slate-300 rounded-2xl bg-white/60 p-5 text-center leading-relaxed">
      {children}
    </p>
  )
}

const tone = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  orange: 'bg-orange-50 text-orange-800 border-orange-200',
  green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  red: 'bg-red-50 text-red-800 border-red-200',
  blue: 'bg-sky-50 text-sky-800 border-sky-200',
}

export function Badge({ children, color = 'slate' }: { children: React.ReactNode; color?: keyof typeof tone }) {
  return (
    <span className={clsx('inline-block border rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap', tone[color])}>
      {children}
    </span>
  )
}

const ORDER_TONE: Record<OrderStatus, keyof typeof tone> = {
  pending: 'orange',
  confirmed: 'blue',
  assigned: 'blue',
  picked_up: 'orange',
  delivered: 'green',
  rejected: 'red',
  failed: 'red',
  cancelled: 'slate',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge color={ORDER_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>
}

const RUN_TONE: Record<RunStatus, keyof typeof tone> = {
  open: 'red',
  assigned: 'blue',
  picked_up: 'orange',
  completed: 'green',
  cancelled: 'slate',
}

export function RunStatusBadge({ status }: { status: RunStatus }) {
  return <Badge color={RUN_TONE[status]}>{RUN_STATUS_LABEL[status]}</Badge>
}

const PERMIT_TONE: Record<PermitState, keyof typeof tone> = {
  missing: 'red',
  expired: 'red',
  expiring: 'orange',
  valid: 'green',
}

export function PermitBadge({ status }: { status: PermitStatus }) {
  return <Badge color={PERMIT_TONE[status.state]}>{status.label}</Badge>
}

export function PhoneLink({ phone }: { phone: string | null | undefined }) {
  if (!phone) return <span className="text-slate-400">no phone</span>
  return (
    <a href={`tel:${phone}`} className="text-orange-700 font-bold underline underline-offset-2">
      {phone}
    </a>
  )
}
