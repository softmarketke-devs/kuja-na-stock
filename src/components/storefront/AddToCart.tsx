'use client'

import { useEffect, useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart'

/** Adds one kilo of a cut to the cart and briefly confirms it. */
export function AddToCart({ name }: { name: string }) {
  const { add } = useCart()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 1500)
    return () => clearTimeout(t)
  }, [done])
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
