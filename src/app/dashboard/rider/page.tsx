import Link from 'next/link'
import { clsx } from 'clsx'
import { ChevronRight } from 'lucide-react'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, ksh, nairobiDate } from '@/lib/format'
import { acceptRun, setAvailability } from '@/app/actions/rider'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { Card, Empty, RunStatusBadge, SectionTitle, primaryButton } from '@/components/ui'
import type { DeliveryRun, OpenRun } from '@/types'

export default async function RiderHome() {
  const profile = await requireProfile('rider')
  const supabase = await createClient()
  const today = nairobiDate()
  const days = [0, 1, 2, 3].map((n) => nairobiDate(new Date(), n))

  const [{ data: availability }, { data: openRuns }, { data: myRuns }, { data: recent }] = await Promise.all([
    supabase.from('rider_availability').select('available_date').eq('rider_id', profile.id).gte('available_date', today),
    supabase.rpc('open_runs_for_me'),
    supabase
      .from('delivery_runs')
      .select('*, supplier:profiles!delivery_runs_supplier_id_fkey(id, full_name, business_name, phone, address, lat, lng), orders(id)')
      .eq('rider_id', profile.id)
      .in('status', ['assigned', 'picked_up'])
      .order('run_date'),
    supabase
      .from('delivery_runs')
      .select('rider_fee')
      .eq('rider_id', profile.id)
      .eq('status', 'completed')
      .gte('run_date', nairobiDate(new Date(), -6)),
  ])

  const availableDates = new Set((availability ?? []).map((a: { available_date: string }) => a.available_date))
  const offers = (openRuns ?? []) as OpenRun[]
  const active = (myRuns ?? []) as DeliveryRun[]
  const weekEarnings = (recent ?? []).reduce((s: number, r: { rider_fee: number }) => s + Number(r.rider_fee), 0)

  return (
    <div className="space-y-6">
      <Card className="p-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-slate-500">Earned last 7 days</div>
          <div className="text-2xl font-black">{ksh(weekEarnings)}</div>
        </div>
        <div className="text-sm text-slate-600 text-right">
          Range {profile.service_radius_km} km
          <br />
          from {profile.address || 'your stage'}
        </div>
      </Card>

      <section>
        <SectionTitle>My runs</SectionTitle>
        {active.length === 0 ? (
          <Empty>No runs booked. Accept one below; pickups are at 05:00.</Empty>
        ) : (
          <div className="space-y-2">
            {active.map((run) => (
              <Link key={run.id} href={`/dashboard/rider/run/${run.id}`} className="block">
                <Card className="p-4 flex items-center justify-between gap-3 hover:border-orange-400">
                  <div>
                    <div className="font-black">
                      {formatDate(run.run_date)} · {run.supplier?.business_name || run.supplier?.full_name}
                    </div>
                    <div className="text-sm text-slate-600">
                      {run.orders?.length ?? 0} drops · earn {ksh(run.rider_fee)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RunStatusBadge status={run.status} />
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>When can you ride?</SectionTitle>
        <p className="text-sm text-slate-600 mb-2">Mark the mornings you’re free. We SMS you when a run near you opens.</p>
        <div className="grid grid-cols-4 gap-2">
          {days.map((d) => {
            const on = availableDates.has(d)
            return (
              <ActionForm key={d} action={setAvailability}>
                <input type="hidden" name="date" value={d} />
                <input type="hidden" name="available" value={on ? 'false' : 'true'} />
                <SubmitButton
                  className={clsx(
                    'w-full border px-2 py-2.5 text-xs font-bold',
                    on ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-700',
                  )}
                  pendingText="…"
                >
                  {d === today ? 'Today' : formatDate(d)}
                  <br />
                  {on ? 'Available' : 'Off'}
                </SubmitButton>
              </ActionForm>
            )
          })}
        </div>
      </section>

      <section>
        <SectionTitle>Runs near you</SectionTitle>
        {profile.lat === null ? (
          <Empty>Set your stage location in Settings to see runs.</Empty>
        ) : offers.length === 0 ? (
          <Empty>No open runs in your range right now. Suppliers confirm orders through the evening.</Empty>
        ) : (
          <div className="space-y-2">
            {offers.map((run) => (
              <Card key={run.run_id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black">
                      {formatDate(run.run_date)} · {run.supplier_name}
                    </div>
                    <div className="text-sm text-slate-600">
                      Pickup 05:00 at {run.supplier_address || 'supplier'} ({run.pickup_km} km from you) · {run.drops} drop
                      {run.drops === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black">{ksh(run.rider_fee)}</div>
                    <div className="text-[11px] text-slate-500">so far</div>
                  </div>
                </div>
                {!run.i_am_available && (
                  <p className="text-xs text-slate-500">Accepting marks you available on {formatDate(run.run_date)}.</p>
                )}
                <ActionForm action={acceptRun}>
                  <input type="hidden" name="run_id" value={run.run_id} />
                  <SubmitButton className={primaryButton + ' w-full'} pendingText="Booking…">
                    Accept run
                  </SubmitButton>
                </ActionForm>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
