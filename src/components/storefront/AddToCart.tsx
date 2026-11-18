'use client'

import { useEffect, useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import { MIN_KG, useCart } from '@/lib/cart'

/** Adds one kilo of a cut to the cart and briefly confirms it. Says "Sold out" when none is left. */
export function AddToCart({ name }: { name: string }) {
  const { add, itemFor } = useCart()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 1500)
    return () => clearTimeout(t)
  }, [done])
  const soldOut = (itemFor(name)?.stock_kg ?? 0) < MIN_KG
  if (soldOut) {
    return (
      <span className="inline-flex items-center text-sm font-semibold rounded-sm border border-slate-300 text-slate-500 px-3.5 py-2" aria-label={`${name} is sold out`}>
        Sold out
      </span>
    )
  }
  return (
    <button
      type="button"
      aria-label={`Add ${name} to cart`}
      onClick={() => {
        add(name)
        setDone(true)
      }}
      className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-sm bg-[#8a6420] text-white px-3.5 py-2 hover:bg-[#6f4f18]"
    >
      {done ? <Check className="w-4 h-4" aria-hidden /> : <ShoppingCart className="w-4 h-4" aria-hidden />}
      {done ? 'Added' : 'Add to cart'}
    </button>
  )
}
