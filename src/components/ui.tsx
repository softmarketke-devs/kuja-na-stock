import { clsx } from 'clsx'
import type { OrderStatus, RunStatus } from '@/types'
import { ORDER_STATUS_LABEL, RUN_STATUS_LABEL } from '@/lib/format'

export const inputClass =
  'w-full bg-white border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
export const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1'
export const primaryButton =
  'inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 transition-colors'
export const secondaryButton =
  'inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 disabled:opacity-50 border border-slate-300 text-slate-800 font-bold text-sm px-4 py-2.5 transition-colors'
export const dangerButton =
  'inline-flex items-center justify-center gap-2 bg-white hover:bg-red-50 disabled:opacity-50 border border-red-300 text-red-700 font-bold text-sm px-4 py-2.5 transition-colors'

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('bg-white border border-slate-200 shadow-xs', className)}>{children}</div>
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-2 mb-3">
      <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">{children}</h2>
      {aside}
    </div>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500 border border-dashed border-slate-300 bg-white p-4">{children}</p>
}

const tone = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-sky-50 text-sky-700 border-sky-200',
}

export function Badge({ children, color = 'slate' }: { children: React.ReactNode; color?: keyof typeof tone }) {
  return (
    <span className={clsx('inline-block border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap', tone[color])}>
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

export function PhoneLink({ phone }: { phone: string | null | undefined }) {
  if (!phone) return <span className="text-slate-400">no phone</span>
  return (
    <a href={`tel:${phone}`} className="text-orange-700 font-bold underline underline-offset-2">
      {phone}
    </a>
  )
}
