import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ORDER_WITH_DETAILS } from '@/lib/queries'
import { ISSUE_LABEL, formatDateTime, isWithinHours, ksh, nairobiDate } from '@/lib/format'
import { ISSUE_REPORT_HOURS } from '@/lib/constants'
import { reportIssue } from '@/app/actions/retailer'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { OrderCard } from '@/components/OrderCard'
import { Badge, Empty, dangerButton, inputClass, labelClass } from '@/components/ui'
import type { Order } from '@/types'

export default async function RetailerHistory() {
  const profile = await requireProfile('retailer')
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select(ORDER_WITH_DETAILS)
    .eq('retailer_id', profile.id)
    .in('status', ['delivered', 'failed', 'cancelled', 'rejected'])
    .gte('delivery_date', nairobiDate(new Date(), -60))
    .order('delivery_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  const orders = (data ?? []) as Order[]
  const delivered = orders.filter((o) => o.status === 'delivered')
  const spent = delivered.reduce((s, o) => s + Number(o.payment?.amount ?? o.total), 0)
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black uppercase tracking-tight">Order history</h1>
        <p className="text-sm text-slate-600">
          Last 60 days: {delivered.length} deliveries, {ksh(spent)} paid.
        </p>
      </div>

      {orders.length === 0 ? (
        <Empty>No past orders yet.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {orders.map((order) => {
            const canReport =
              order.status === 'delivered' &&
              order.delivered_at !== null &&
              isWithinHours(order.delivered_at, ISSUE_REPORT_HOURS)
            return (
              <OrderCard key={order.id} order={order} counterparty="supplier">
                {order.payment && (
                  <p className="text-sm text-slate-600">
                    Paid {ksh(order.payment.amount)} by {order.payment.method === 'mpesa' ? `M-Pesa (${order.payment.mpesa_ref})` : 'cash'} ·{' '}
                    {formatDateTime(order.payment.collected_at)}
                  </p>
                )}
                {order.issues?.map((issue) => (
                  <div key={issue.id} className="border border-slate-200 bg-slate-50 p-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-bold">{ISSUE_LABEL[issue.issue_type]}</span>
                      <Badge color={issue.status === 'open' ? 'orange' : 'green'}>{issue.status === 'open' ? 'Open' : 'Resolved'}</Badge>
                    </div>
                    <p>{issue.description}</p>
                    {issue.resolution && <p className="text-emerald-800">Supplier: {issue.resolution}</p>}
                  </div>
                ))}
                {canReport && (
                  <details>
                    <summary className="text-sm font-bold text-red-700 cursor-pointer">Report a problem</summary>
                    <ActionForm action={reportIssue} resetOnSuccess className="mt-2 space-y-2">
                      <input type="hidden" name="order_id" value={order.id} />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelClass}>Problem</label>
                          <select name="issue_type" className={inputClass} defaultValue="short_delivery">
                            {Object.entries(ISSUE_LABEL).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Qty short (optional)</label>
                          <input name="quantity_short" type="number" min={0} step="any" className={inputClass} />
                        </div>
                      </div>
                      <textarea name="description" required rows={2} placeholder="What went wrong?" className={inputClass} />
                      <SubmitButton className={dangerButton} pendingText="Sending…">
                        Send to supplier
                      </SubmitButton>
                    </ActionForm>
                  </details>
                )}
              </OrderCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
