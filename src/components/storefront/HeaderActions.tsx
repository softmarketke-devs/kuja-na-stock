'use client'

import { useEffect, useState } from 'react'
import { Minus, Plus, Search, ShoppingCart, Trash2, X } from 'lucide-react'
import { MAX_KG, MIN_KG, useCart } from '@/lib/cart'
import { priceFor } from '@/lib/catalogue'
import { ALL_CUTS } from '@/lib/steak-map'
import { BRAND_NAME, SUPPORT_WHATSAPP } from '@/lib/brand'
import Link from 'next/link'
import { placeCustomerOrder } from '@/app/actions/customer'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import type { UserRole } from '@/types'

const iconBtn = 'relative w-10 h-10 flex items-center justify-center rounded-sm text-[#efe6d3] hover:bg-[#c8a25a22]'
const money = (n: number) => `KSh ${Math.round(n).toLocaleString('en-KE')}`
const kgLabel = (kg: number) => `${kg % 1 === 0 ? kg : kg.toFixed(1)} kg`

/** Search and cart buttons for the header, plus their panels. The profile menu is passed in as children. */
export function HeaderActions({ children, role = null }: { children: React.ReactNode; role?: UserRole | null }) {
  const { count, openCart, openSearch } = useCart()
  return (
    <>
      <button type="button" aria-label="Search cuts" onClick={openSearch} className={iconBtn}>
        <Search className="w-5 h-5" aria-hidden />
      </button>
      <button type="button" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`} onClick={openCart} className={iconBtn}>
        <ShoppingCart className="w-5 h-5" aria-hidden />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#c8a25a] text-[#14100c] text-[11px] font-bold flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
      {children}
      <SearchPanel />
      <CartPanel role={role} />
    </>
  )
}

function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [active, onClose])
}

function SearchPanel() {
  const { searchOpen, closePanels } = useCart()
  useEscape(searchOpen, closePanels)
  // The body mounts only while open, so the query resets itself each time.
  return searchOpen ? <SearchBody /> : null
}

function SearchBody() {
  const { closePanels, add, openCart } = useCart()
  const [q, setQ] = useState('')

  const term = q.trim().toLowerCase()
  const results = term ? ALL_CUTS.filter((c) => c.toLowerCase().includes(term)) : ALL_CUTS

  return (
    <div className="fixed inset-0 z-40 bg-black/60" onClick={closePanels}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search cuts"
        className="mx-auto mt-16 w-[min(560px,calc(100%-24px))] bg-[#1b1613] text-[#efe6d3] border border-[#2f2721] rounded-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[#2f2721] px-4">
          <Search className="w-4 h-4 text-[#a79c8b]" aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search cuts, e.g. ribeye"
            aria-label="Search cuts"
            className="flex-1 bg-transparent py-3.5 outline-none placeholder:text-[#a79c8b]"
          />
          <button type="button" aria-label="Close search" onClick={closePanels} className="p-1 text-[#a79c8b] hover:text-[#efe6d3]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-0 m-0 list-none">
          {results.length === 0 && <li className="px-4 py-6 text-[#a79c8b]">No cut matches “{q}”.</li>}
          {results.map((c) => {
            const p = priceFor(c)
            return (
              <li key={c} className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[#2f2721] last:border-0">
                <span>
                  {c}
                  <small className="block text-[#a79c8b]">{p ? `${money(p.perKg)}/kg` : 'Ask for price'}</small>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    add(c)
                    openCart()
                  }}
                  className="text-sm font-semibold rounded-sm bg-[#c8a25a] text-[#14100c] px-3.5 py-2 hover:bg-[#dcbb78]"
                >
                  Add to cart
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function CartPanel({ role }: { role: UserRole | null }) {
  const { cartOpen, closePanels, lines, setKg, remove, clear } = useCart()
  useEscape(cartOpen, closePanels)
  if (!cartOpen) return null

  const priced = lines.map((l) => ({ ...l, p: priceFor(l.name) }))
  const total = priced.reduce((s, l) => s + (l.p ? l.p.perKg * l.kg : 0), 0)
  const unpriced = priced.filter((l) => !l.p).length
  const message = `Hello ${BRAND_NAME}, I’d like to order: ${lines.map((l) => `${l.name} ${kgLabel(l.kg)}`).join('; ')}.`

  return (
    <div className="fixed inset-0 z-40 bg-black/60" onClick={closePanels}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className="absolute right-0 top-0 h-full w-[min(420px,100%)] bg-[#1b1613] text-[#efe6d3] border-l border-[#2f2721] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-[#2f2721] shrink-0">
          <h2 className="font-display font-semibold text-xl">Your cart</h2>
          <button type="button" aria-label="Close cart" onClick={closePanels} className="p-1 text-[#a79c8b] hover:text-[#efe6d3]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="px-5 py-8 text-[#a79c8b]">Your cart is empty. Add cuts from the list or use search.</p>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto p-0 m-0 list-none">
              {priced.map((l) => (
                <li key={l.name} className="px-5 py-4 border-b border-[#2f2721]">
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold">{l.name}</span>
                    <button type="button" aria-label={`Remove ${l.name}`} onClick={() => remove(l.name)} className="text-[#a79c8b] hover:text-[#efe6d3]">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-[#2f2721] rounded-sm">
                      <button type="button" aria-label={`Less ${l.name}`} disabled={l.kg <= MIN_KG} onClick={() => setKg(l.name, l.kg - 0.5)} className="w-9 h-9 flex items-center justify-center disabled:opacity-40">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-16 text-center text-sm tabular-nums">{kgLabel(l.kg)}</span>
                      <button type="button" aria-label={`More ${l.name}`} disabled={l.kg >= MAX_KG} onClick={() => setKg(l.name, l.kg + 0.5)} className="w-9 h-9 flex items-center justify-center disabled:opacity-40">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm text-[#a79c8b]">{l.p ? money(l.p.perKg * l.kg) : 'Price on confirmation'}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-5 py-4 border-t border-[#2f2721] shrink-0 space-y-3">
              <div className="flex justify-between font-semibold">
                <span>{unpriced ? 'Priced items' : 'Total'}</span>
                <span className="tabular-nums">{money(total)}</span>
              </div>
              {unpriced > 0 && (
                <p className="text-xs text-[#a79c8b]">
                  {unpriced} {unpriced === 1 ? 'item has' : 'items have'} no price yet. We confirm those with you. Delivery is confirmed separately.
                </p>
              )}
              {role === 'customer' ? (
                <ActionForm
                  action={placeCustomerOrder}
                  className="space-y-2"
                  onSuccess={() => {
                    clear()
                    closePanels()
                  }}
                >
                  <input type="hidden" name="items" value={JSON.stringify(lines.map((l) => ({ name: l.name, kg: l.kg })))} />
                  <input name="address" required maxLength={300} placeholder="Delivery address (area, street, landmark)" aria-label="Delivery address" className="w-full rounded-sm bg-[#120e0c] border border-[#2f2721] px-3 py-2.5 text-sm text-[#efe6d3] placeholder:text-[#a79c8b]" />
                  <input name="notes" maxLength={500} placeholder="Note (optional)" aria-label="Note" className="w-full rounded-sm bg-[#120e0c] border border-[#2f2721] px-3 py-2.5 text-sm text-[#efe6d3] placeholder:text-[#a79c8b]" />
                  <SubmitButton pendingText="Sending…">Place order</SubmitButton>
                  <p className="text-xs text-[#a79c8b]">We confirm the price and delivery, then you pay. Track it under My orders.</p>
                </ActionForm>
              ) : role ? (
                <p className="text-xs text-[#a79c8b]">Ordering in the app is for customer accounts. You can still send this cart to us on WhatsApp.</p>
              ) : (
                <Link href="/signup" className="block text-center rounded-sm bg-[#c8a25a] hover:bg-[#dcbb78] text-[#14100c] font-semibold py-3">
                  Sign up to order in the app
                </Link>
              )}
              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`}
                rel="noopener"
                className="block text-center rounded-sm border border-[#2f2721] hover:border-[#c8a25a] text-[#efe6d3] text-sm py-2.5"
              >
                Or send it on WhatsApp
              </a>
              <button type="button" onClick={clear} className="text-sm text-[#a79c8b] underline">Clear cart</button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
