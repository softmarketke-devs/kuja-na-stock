// Retail prices in KSh per kg. PLACEHOLDERS: general Kenyan market ranges, not the
// client's prices. Replace with the client's list (or move to a database table)
// when it arrives. A cut missing here shows "Ask for price".
//
// Two prices are the client's own, seen on their Instagram.
export const CLIENT_CONFIRMED: Record<string, number> = {
  'Sirloin on Bone': 1420,
  'Whole Rabbit': 1550,
  'Mutura': 1350, // 1 kg pack, from the client
}

// Placeholder market prices. Empty on purpose: web research found only a general
// beef range (about KSh 750-900/kg retail in Nairobi, Nation; Numbeo average KSh 790
// for a 1 kg roast, Jul 2026) and no per-cut prices. Fill with approved estimates.
export const PLACEHOLDER_PRICES: Record<string, number> = {}

export function priceFor(name: string): { perKg: number; confirmed: boolean } | null {
  if (name in CLIENT_CONFIRMED) return { perKg: CLIENT_CONFIRMED[name], confirmed: true }
  if (name in PLACEHOLDER_PRICES) return { perKg: PLACEHOLDER_PRICES[name], confirmed: false }
  return null
}
