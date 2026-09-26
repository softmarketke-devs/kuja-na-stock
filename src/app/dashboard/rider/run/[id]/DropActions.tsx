'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { confirmDelivery, failDelivery } from '@/app/actions/rider'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { dangerButton, inputClass, labelClass, primaryButton } from '@/components/ui'
import type { PaymentMethod } from '@/types'

export function DropActions({ orderId, total }: { orderId: string; total: number }) {
  const [method, setMethod] = useState<PaymentMethod>('cash')

  return (
    <div className="space-y-2 border-t border-slate-100 pt-2">
      <ActionForm action={confirmDelivery} className="space-y-2">
        <input type="hidden" name="order_id" value={orderId} />
        <input type="hidden" name="method" value={method} />
        <div>
          <label className={labelClass} htmlFor={`code-${orderId}`}>Retailer’s 4-digit code</label>
          <input
            id={`code-${orderId}`}
            name="code"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            required
            autoComplete="off"
            className={inputClass + ' text-2xl tracking-[0.4em] font-black text-center'}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(['cash', 'mpesa'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={clsx(
                'border py-2 text-sm font-bold',
                method === m ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-slate-300 bg-white',
              )}
            >
              {m === 'cash' ? 'Cash' : 'M-Pesa'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass} htmlFor={`amount-${orderId}`}>Amount received</label>
            <input id={`amount-${orderId}`} name="amount" type="number" min={0} step="any" defaultValue={total} className={inputClass} />
          </div>
          {method === 'mpesa' && (
            <div>
              <label className={labelClass} htmlFor={`ref-${orderId}`}>M-Pesa code</label>
              <input id={`ref-${orderId}`} name="mpesa_ref" required placeholder="SJK3XXXXXX" className={inputClass + ' uppercase'} />
            </div>
          )}
        </div>
        <SubmitButton className={primaryButton + ' w-full'} pendingText="Confirming…">
          Confirm delivery
        </SubmitButton>
      </ActionForm>

      <details>
        <summary className="text-sm text-red-700 font-bold cursor-pointer">Couldn’t deliver?</summary>
        <ActionForm action={failDelivery} className="mt-2 space-y-2" confirmMessage="Mark this drop as not delivered?">
          <input type="hidden" name="order_id" value={orderId} />
          <input name="reason" required placeholder="e.g. Shop closed, no answer on phone" className={inputClass} />
          <SubmitButton className={dangerButton + ' w-full'} pendingText="Saving…">
            Mark not delivered
          </SubmitButton>
        </ActionForm>
      </details>
    </div>
  )
}
