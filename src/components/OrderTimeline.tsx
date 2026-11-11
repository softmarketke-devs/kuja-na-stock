import { clsx } from 'clsx'
import { Check } from 'lucide-react'
import type { OrderStatus } from '@/types'

const STAGES = ['Placed', 'Confirmed', 'Carrier', 'On the way', 'Delivered']
const STAGE_OF: Partial<Record<OrderStatus, number>> = {
  pending: 0,
  confirmed: 1,
  assigned: 2,
  picked_up: 3,
  delivered: 4,
}

/** Five-step progress bar for an order. Not shown for declined, failed or cancelled orders. */
export function OrderTimeline({ status }: { status: OrderStatus }) {
  const current = STAGE_OF[status]
  if (current === undefined) return null

  return (
    <ol className="flex items-start" aria-label={`Order progress: ${STAGES[current]}`}>
      {STAGES.map((label, i) => {
        const done = i < current || status === 'delivered'
        const active = i === current && status !== 'delivered'
        return (
          <li key={label} className="relative flex-1 flex flex-col items-center text-center" aria-current={active ? 'step' : undefined}>
            {i > 0 && (
              <span
                aria-hidden
                className={clsx('absolute top-3 right-1/2 w-full h-0.5 -z-0', i <= current || status === 'delivered' ? 'bg-orange-500' : 'bg-slate-200')}
              />
            )}
            <span
              className={clsx(
                'relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border-2',
                done && (status === 'delivered' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-orange-600 border-orange-600 text-white'),
                active && 'bg-white border-orange-600 text-orange-700 ring-4 ring-orange-500/20',
                !done && !active && 'bg-white border-slate-300 text-slate-400',
              )}
            >
              {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className={clsx('mt-1.5 text-[11px] leading-tight font-bold', active ? 'text-orange-700' : done ? 'text-slate-700' : 'text-slate-400')}>
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
