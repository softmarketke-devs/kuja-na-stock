import { Check } from 'lucide-react'

const DIGITS = ['4', '8', '1', '7']

/** Four code boxes fill in, then a green "Delivered" tick. Pure CSS (see .code-anim in globals.css), so no JavaScript is shipped. */
export function DeliveryCodeDemo() {
  return (
    <div className="bg-[#0B1020] text-white border border-slate-800 rounded-3xl shadow-[var(--shadow-lift)] p-6">
      <h3 className="font-display font-extrabold text-xl">Nothing changes hands without your code</h3>
      <p className="text-sm text-slate-300 mt-1">
        You get a 4-digit code by SMS. Give it to the carrier only once the weight and the inspection stamp check out.
      </p>
      <div className="flex gap-2 mt-4" role="img" aria-label="Example: a four digit code is entered and the delivery is marked as delivered">
        {DIGITS.map((d, i) => (
          <div key={i} className="w-14 h-16 rounded-xl border-2 border-orange-500 bg-white/5 flex items-center justify-center text-3xl font-black tabular-nums">
            <span className="code-anim" style={{ animationDelay: `${i * 0.5}s` }}>
              {d}
            </span>
          </div>
        ))}
      </div>
      <div
        className="code-anim mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white font-black text-sm px-4 py-2.5"
        style={{ animationDelay: '2.6s' }}
      >
        <Check className="w-5 h-5" aria-hidden /> Delivered. Your stock count is updated.
      </div>
      <p className="text-xs text-slate-400 mt-3">Example only. Wrong code 5 times and the delivery is locked for the supplier to resolve.</p>
    </div>
  )
}
