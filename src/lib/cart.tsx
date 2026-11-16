'use client'

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from 'react'

export interface CartLine {
  name: string
  kg: number
}

export const MIN_KG = 0.5
export const MAX_KG = 50
const STEP = 0.5
const KEY = 'big-cart-v1'

const clampKg = (kg: number) => Math.min(MAX_KG, Math.max(MIN_KG, Math.round(kg / STEP) * STEP))

// The cart lives in this browser (localStorage) in a tiny external store, so React
// reads it with useSyncExternalStore: the server and first client render see an empty
// cart, then the saved one appears. It is replaced by a saved cart once ordering moves into the app.
const EMPTY: CartLine[] = []
let cache: CartLine[] | null = null
const listeners = new Set<() => void>()

function read(): CartLine[] {
  if (cache === null) {
    cache = EMPTY
    try {
      const raw = localStorage.getItem(KEY)
      const parsed = raw ? (JSON.parse(raw) as unknown) : null
      if (Array.isArray(parsed)) {
        cache = parsed
          .filter((l): l is CartLine => !!l && typeof l.name === 'string' && typeof l.kg === 'number')
          .map((l) => ({ name: l.name, kg: clampKg(l.kg) }))
      }
    } catch {
      /* corrupt or unavailable storage: start with an empty cart */
    }
  }
  return cache
}

function write(next: CartLine[]) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* private mode or full storage: the cart just won't persist */
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null // another tab changed it
      l()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(l)
    window.removeEventListener('storage', onStorage)
  }
}

interface CartApi {
  lines: CartLine[]
  count: number
  add: (name: string, kg?: number) => void
  setKg: (name: string, kg: number) => void
  remove: (name: string) => void
  clear: () => void
  cartOpen: boolean
  searchOpen: boolean
  openCart: () => void
  openSearch: () => void
  closePanels: () => void
}

const Ctx = createContext<CartApi | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY)
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const add = useCallback((name: string, kg = 1) => {
    const cur = read()
    const found = cur.find((l) => l.name === name)
    write(found ? cur.map((l) => (l.name === name ? { ...l, kg: clampKg(l.kg + kg) } : l)) : [...cur, { name, kg: clampKg(kg) }])
  }, [])
  const setKg = useCallback((name: string, kg: number) => write(read().map((l) => (l.name === name ? { ...l, kg: clampKg(kg) } : l))), [])
  const remove = useCallback((name: string) => write(read().filter((l) => l.name !== name)), [])
  const clear = useCallback(() => write([]), [])

  const value = useMemo<CartApi>(
    () => ({
      lines,
      count: lines.length,
      add,
      setKg,
      remove,
      clear,
      cartOpen,
      searchOpen,
      openCart: () => {
        setSearchOpen(false)
        setCartOpen(true)
      },
      openSearch: () => {
        setCartOpen(false)
        setSearchOpen(true)
      },
      closePanels: () => {
        setCartOpen(false)
        setSearchOpen(false)
      },
    }),
    [lines, add, setKg, remove, clear, cartOpen, searchOpen],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart must be used inside <CartProvider>')
  return c
}
