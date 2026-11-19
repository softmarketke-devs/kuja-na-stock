import type { ShopItem } from '@/types'

// The cuts the homepage has always shown. They appear whenever the shop's own stock list (the shop_items table,
// managed on the admin Stock page) is empty or not set up yet, so the page is never blank. Once the owner switches
// cuts on in the Stock page, that list takes over and these are no longer used.
//
// Prices are only the ones the client has confirmed; the others read "Price on confirmation".
const FEATURED: { name: string; blurb: string; image: string; price: number | null }[] = [
  { name: 'Tomahawk', blurb: 'Bone-in ribeye, the showpiece.', image: '/cuts/tomahawk.jpg', price: null },
  { name: 'Sirloin on Bone', blurb: 'Dry-aged, bone-in.', image: '/cuts/sirloin-on-bone.jpg', price: 1420 },
  { name: 'Oxtail', blurb: 'Our best seller.', image: '/cuts/oxtail.jpg', price: null },
  { name: 'Mutura', blurb: 'Grilled Kenyan sausage, sold as a 1 kg pack.', image: '/cuts/mutura.png', price: 1350 },
  { name: 'The Steak Bundle', blurb: 'Tomahawk, T-bone and cowboy rib.', image: '/cuts/the-steak-bundle.jpg', price: null },
]

const ALL_CUTS = [
  'Tomahawk', 'Cowboy Rib', 'T-bone', 'Sirloin on Bone', 'Ribeye', 'Fillet', 'Oxtail', 'Short Ribs', 'Brisket', 'Shank',
  'Osso Buco', 'Stew Cuts', 'Chunk', 'Minced Meat', 'Liver', 'Kidney', 'Heart', 'Mutura', 'Pork Rib-eye Chops', 'Whole Rabbit', 'The Steak Bundle',
]
const OTHER_PRICES: Record<string, number> = { 'Whole Rabbit': 1550 }

// Plenty of "stock" so nothing shows as sold out while the shop is not tracking kilos yet.
const UNTRACKED_KG = 1000

export const DEFAULT_ITEMS: ShopItem[] = [
  ...FEATURED.map((f) => ({ id: `default-${f.name}`, name: f.name, blurb: f.blurb, image: f.image, price_per_kg: f.price, stock_kg: UNTRACKED_KG, is_active: true })),
  ...ALL_CUTS.filter((n) => !FEATURED.some((f) => f.name === n)).map((n) => ({
    id: `default-${n}`, name: n, blurb: null, image: null, price_per_kg: OTHER_PRICES[n] ?? null, stock_kg: UNTRACKED_KG, is_active: true,
  })),
]
