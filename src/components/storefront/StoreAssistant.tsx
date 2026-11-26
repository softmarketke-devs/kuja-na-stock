'use client'

import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { Bot, Send, X } from 'lucide-react'
import { MAX_KG, MIN_KG, useCart } from '@/lib/cart'

type Msg = { from: 'bot' | 'me'; text: string; action?: { label: string; run: 'cart' } }

const QUICK = ['2kg ribeye and 1kg oxtail', 'What is in my cart?', 'Checkout']

// Words people use that are not the exact cut name on the menu.
const ALIASES: Record<string, string> = {
  'rib eye': 'Ribeye', 'rib-eye': 'Ribeye', steak: 'Sirloin Steak', tbone: 'T-bone', 't bone': 'T-bone',
  mince: 'Minced Meat', minced: 'Minced Meat', 'ox tail': 'Oxtail', 'short rib': 'Short Ribs', 'stew': 'Beef Cubes',
  sirloin: 'Sirloin Steak', 'osso bucco': 'Osso Buco', tenderloin: 'Fillet', wings: 'Chicken Wings', thighs: 'Chicken Thighs',
  drumsticks: 'Chicken Drumsticks', 'chicken breast': 'Chicken Breast / Boneless', 'new york': 'New York Strip Steak',
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9.\s-]/g, ' ').replace(/\s+/g, ' ').trim()

function findCut(seg: string, names: string[]): string | null {
  const s = norm(seg)
  let best: string | null = null
  let bestLen = 0
  const consider = (key: string, cut: string) => {
    if (key.length > bestLen && s.includes(key)) {
      best = cut
      bestLen = key.length
    }
  }
  for (const c of names) consider(norm(c), c)
  for (const [k, c] of Object.entries(ALIASES)) if (names.includes(c)) consider(k, c)
  return best
}

function findKg(seg: string): number {
  const m = norm(seg).match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilo|kilos)?/)
  const n = m ? parseFloat(m[1]) : 1
  return Math.min(MAX_KG, Math.max(MIN_KG, n))
}

const kgText = (n: number) => `${n} kg`

/** Public assistant: talk to it, it fills the cart. It never takes payment; checkout stays a button the customer presses. */
export function StoreAssistant() {
  const cart = useCart()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: 'Hi! Tell me what you would like, for example “2kg ribeye and 1kg oxtail”, and I will add it to your cart.' },
  ])
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [msgs, open])

  const names = cart.items.map((i) => i.name)
  const priceOf = (n: string) => {
    const v = cart.itemFor(n)?.price_per_kg
    return v ? { perKg: v } : null
  }

  const summary = () => {
    if (cart.lines.length === 0) return 'Your cart is empty.'
    let total = 0
    let allPriced = true
    const rows = cart.lines.map((l) => {
      const p = priceOf(l.name)
      if (p) total += p.perKg * l.kg
      else allPriced = false
      return `${kgText(l.kg)} ${l.name}${p ? ` (KSh ${(p.perKg * l.kg).toLocaleString('en-KE')})` : ''}`
    })
    return `In your cart: ${rows.join(', ')}.${total ? ` Priced so far: KSh ${total.toLocaleString('en-KE')}${allPriced ? '' : ' (other cuts are priced when you confirm)'}.` : ''}`
  }

  const reply = (text: string): Msg => {
    const t = norm(text)
    if (/\b(checkout|check out|pay|send|place( the)? order|confirm)\b/.test(t)) {
      return cart.lines.length === 0
        ? { from: 'bot', text: 'Your cart is empty. Tell me what you would like first.' }
        : { from: 'bot', text: `${summary()} Review it and send it when you are happy.`, action: { label: 'Review and send order', run: 'cart' } }
    }
    if (/\b(clear|empty|start over|cancel)\b/.test(t)) {
      cart.clear()
      return { from: 'bot', text: 'Cart cleared.' }
    }
    if (/\b(cart|basket|what do i have|total)\b/.test(t) && !/\badd\b/.test(t)) return { from: 'bot', text: summary() }

    const removing = /\b(remove|delete|take out|drop)\b/.test(t)
    const asking = /\b(price|cost|how much|bei)\b/.test(t)
    const segs = text.split(/,|\band\b|\+|&|\bna\b/i).filter((s) => s.trim())
    const done: string[] = []
    const asked: string[] = []
    const issues: string[] = []
    for (const seg of segs) {
      const cut = findCut(seg, names)
      if (!cut) continue
      if (asking) {
        const p = priceOf(cut)
        asked.push(p ? `${cut} is KSh ${p.perKg.toLocaleString('en-KE')}/kg` : `${cut}: we confirm the price when you order`)
      } else if (removing) {
        cart.remove(cut)
        done.push(`removed ${cut}`)
      } else {
        const stock = cart.itemFor(cut)?.stock_kg ?? 0
        const inCart = cart.lines.find((l) => l.name === cut)?.kg ?? 0
        const room = Math.floor((stock - inCart) / 0.5) * 0.5
        if (stock < MIN_KG) {
          issues.push(`${cut} is sold out`)
          continue
        }
        if (room < MIN_KG) {
          issues.push(`you already have all ${kgText(stock)} of ${cut} that we have`)
          continue
        }
        const want = findKg(seg)
        const kg = Math.min(want, room)
        cart.add(cut, kg)
        done.push(`added ${kgText(kg)} ${cut}`)
        if (kg < want) issues.push(`we only have ${kgText(stock)} of ${cut}`)
      }
    }
    if (asked.length) return { from: 'bot', text: asked.join('. ') + '.' }
    if (!done.length && issues.length) return { from: 'bot', text: `Sorry, ${issues.join(', ')}.` }
    if (done.length) {
      return {
        from: 'bot',
        text: `Done: ${done.join(', ')}.${issues.length ? ` Note: ${issues.join(', ')}.` : ''} Anything else? Say “checkout” when you are ready.`,
        action: removing ? undefined : { label: 'View cart', run: 'cart' },
      }
    }
    if (/\b(hi|hello|hey|jambo|habari)\b/.test(t)) return { from: 'bot', text: 'Hello! What would you like to order today?' }
    if (/\b(menu|cuts|what do you (have|sell)|available)\b/.test(t)) return { from: 'bot', text: cart.items.filter((i) => i.stock_kg >= MIN_KG).length ? `In stock now: ${cart.items.filter((i) => i.stock_kg >= MIN_KG).map((i) => i.name).join(', ')}.` : 'We are restocking right now. Please check back soon.' }
    if (/\b(deliver|delivery)\b/.test(t)) return { from: 'bot', text: 'Yes, we deliver. We confirm the fee and time when you send your order.' }
    return { from: 'bot', text: 'I did not catch a cut name. Try “2kg ribeye”, or say “menu” to see what we have.' }
  }

  const send = (text: string) => {
    const message = text.trim()
    if (!message) return
    setInput('')
    const answer = reply(message) // changes the cart, so it must not run inside the state updater
    setMsgs((m) => [...m, { from: 'me', text: message }, answer])
  }

  return (
    <>
      {open && (
        <section aria-label="Order assistant" className="fixed z-40 inset-x-3 sm:inset-x-auto sm:right-6 bottom-24 sm:w-96 flex flex-col max-h-[65vh] bg-white border border-slate-300 shadow-xl">
          <header className="flex items-center justify-between gap-2 bg-orange-600 text-[#14100c] px-3 py-2">
            <span className="font-black text-sm flex items-center gap-2">
              <Bot className="w-4 h-4" /> Order assistant
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="p-1.5 hover:bg-orange-700/30">
              <X className="w-4 h-4" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={clsx('flex', m.from === 'me' && 'justify-end')}>
                <div className={clsx('max-w-[85%] px-3 py-2 text-sm', m.from === 'me' ? 'bg-orange-400 text-[#14100c]' : 'bg-white border border-slate-200 text-slate-800')}>
                  <p>{m.text}</p>
                  {m.action && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        cart.openCart()
                      }}
                      className="mt-2 text-xs font-bold text-orange-700 border border-orange-300 bg-orange-50 px-2 py-1"
                    >
                      {m.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="flex flex-wrap gap-1.5 px-3 pt-2 border-t border-slate-200">
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => send(q)} className="text-xs font-bold border border-slate-300 bg-white px-2 py-1 hover:border-orange-400">
                {q}
              </button>
            ))}
          </div>
          <form
            className="flex gap-1.5 p-3"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 2kg ribeye and 1kg oxtail"
              aria-label="Message"
              maxLength={300}
              className="flex-1 min-w-0 border border-slate-300 px-3 py-2 text-base focus:outline-none focus:border-orange-500"
            />
            <button type="submit" disabled={!input.trim()} aria-label="Send" className="min-h-11 w-11 flex items-center justify-center bg-orange-400 text-[#14100c] disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Open order assistant'}
        className="fixed z-40 right-4 sm:right-6 bottom-6 w-14 h-14 flex items-center justify-center bg-orange-400 hover:bg-orange-300 text-[#14100c] border-2 border-white shadow-lg"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>
    </>
  )
}
