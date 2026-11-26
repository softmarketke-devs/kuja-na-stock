import type { ShopItem } from '@/types'

// The menu as printed (beef and chicken, per-kg cuts only). It shows whenever the shop's own stock list (the shop_items
// table, managed on the admin Stock page and filled by supabase/menu_update.sql) is empty or not set up yet, so the
// page is never blank. Once the table has cuts, that list takes over and this one is no longer used.
const MENU: { name: string; blurb: string | null; image: string | null; price: number; category: string }[] = [
  { name: "Ribeye", blurb: null, image: null, price: 1500, category: "Signature Steaks & Premium Cuts" },
  { name: "Sirloin Steak", blurb: null, image: null, price: 1450, category: "Signature Steaks & Premium Cuts" },
  { name: "Tomahawk", blurb: "Bone-in ribeye, the showpiece.", image: "/cuts/tomahawk.jpg", price: 1600, category: "Signature Steaks & Premium Cuts" },
  { name: "Rib Steak", blurb: null, image: null, price: 1460, category: "Signature Steaks & Premium Cuts" },
  { name: "Denver Steak", blurb: null, image: null, price: 1450, category: "Signature Steaks & Premium Cuts" },
  { name: "Tri-tip Sirloin Steak", blurb: null, image: null, price: 1650, category: "Signature Steaks & Premium Cuts" },
  { name: "Picanha Steak", blurb: null, image: null, price: 1850, category: "Signature Steaks & Premium Cuts" },
  { name: "Fillet", blurb: "Tenderloin.", image: null, price: 3500, category: "Signature Steaks & Premium Cuts" },
  { name: "T-bone", blurb: null, image: null, price: 1550, category: "Signature Steaks & Premium Cuts" },
  { name: "Rump Steak", blurb: null, image: null, price: 1600, category: "Signature Steaks & Premium Cuts" },
  { name: "New York Strip Steak", blurb: null, image: null, price: 1550, category: "Signature Steaks & Premium Cuts" },
  { name: "Chuck Steak (Dino Ribs)", blurb: null, image: null, price: 1500, category: "Signature Steaks & Premium Cuts" },
  { name: "Beef Fillet Stir Fry", blurb: null, image: null, price: 3500, category: "Signature Steaks & Premium Cuts" },
  { name: "Flat Iron Steak", blurb: null, image: null, price: 1450, category: "Signature Steaks & Premium Cuts" },
  { name: "Brisket", blurb: null, image: null, price: 1850, category: "Signature Steaks & Premium Cuts" },
  { name: "Flank Steak", blurb: null, image: null, price: 1400, category: "Signature Steaks & Premium Cuts" },
  { name: "Skirt Steak", blurb: null, image: null, price: 1400, category: "Signature Steaks & Premium Cuts" },
  { name: "Beef Hump", blurb: null, image: null, price: 1550, category: "Signature Steaks & Premium Cuts" },
  { name: "Thor's Hammer Steak", blurb: null, image: null, price: 1500, category: "Signature Steaks & Premium Cuts" },
  { name: "Ribeye (14-day aged)", blurb: null, image: null, price: 3500, category: "Prime Aged Beef Cuts" },
  { name: "Ribeye (21-day aged)", blurb: null, image: null, price: 4500, category: "Prime Aged Beef Cuts" },
  { name: "T-bone (14-day aged)", blurb: null, image: null, price: 3600, category: "Prime Aged Beef Cuts" },
  { name: "T-bone (21-day aged)", blurb: null, image: null, price: 4600, category: "Prime Aged Beef Cuts" },
  { name: "Sirloin (14-day aged)", blurb: null, image: null, price: 3500, category: "Prime Aged Beef Cuts" },
  { name: "Sirloin (21-day aged)", blurb: null, image: null, price: 4500, category: "Prime Aged Beef Cuts" },
  { name: "Rump (14-day aged)", blurb: null, image: null, price: 3500, category: "Prime Aged Beef Cuts" },
  { name: "Rump (21-day aged)", blurb: null, image: null, price: 4500, category: "Prime Aged Beef Cuts" },
  { name: "Minced Meat", blurb: "Lean beef mince.", image: null, price: 1250, category: "Everyday Essentials" },
  { name: "Beef Mince 80:20", blurb: null, image: null, price: 1200, category: "Everyday Essentials" },
  { name: "Short Ribs", blurb: null, image: null, price: 1200, category: "Everyday Essentials" },
  { name: "Beef Cubes", blurb: null, image: null, price: 1300, category: "Everyday Essentials" },
  { name: "Beef on Bone", blurb: null, image: null, price: 850, category: "Everyday Essentials" },
  { name: "Oxtail", blurb: "Our best seller.", image: "/cuts/oxtail.jpg", price: 900, category: "Everyday Essentials" },
  { name: "Half a Beef", blurb: null, image: null, price: 800, category: "Bulk Order" },
  { name: "Front Quarter", blurb: null, image: null, price: 790, category: "Bulk Order" },
  { name: "Hind Quarter", blurb: null, image: null, price: 800, category: "Bulk Order" },
  { name: "Matumbo / Tripe (bulk)", blurb: null, image: null, price: 480, category: "Bulk Order" },
  { name: "Osso Buco", blurb: null, image: null, price: 1000, category: "Specialty & Offal" },
  { name: "Bone Marrow", blurb: null, image: null, price: 400, category: "Specialty & Offal" },
  { name: "Special Bones", blurb: null, image: null, price: 500, category: "Specialty & Offal" },
  { name: "Soup Bones", blurb: null, image: null, price: 400, category: "Specialty & Offal" },
  { name: "Beef Tallow", blurb: null, image: null, price: 650, category: "Specialty & Offal" },
  { name: "Liver", blurb: null, image: null, price: 900, category: "Specialty & Offal" },
  { name: "Heart", blurb: null, image: null, price: 850, category: "Specialty & Offal" },
  { name: "Tripe / Matumbo", blurb: null, image: null, price: 500, category: "Specialty & Offal" },
  { name: "Kidney", blurb: null, image: null, price: 1100, category: "Specialty & Offal" },
  { name: "Mutura", blurb: "Prime beef, traditional recipe, rich flavour. 1 kg pack.", image: "/cuts/mutura.png", price: 1350, category: "Mutura" },
  { name: "Chicken Wings", blurb: null, image: null, price: 750, category: "Chicken" },
  { name: "Chicken Thighs", blurb: null, image: null, price: 800, category: "Chicken" },
  { name: "Chicken Drumsticks", blurb: null, image: null, price: 850, category: "Chicken" },
  { name: "Chicken Liver", blurb: null, image: null, price: 500, category: "Chicken" },
  { name: "Chicken Breast / Boneless", blurb: null, image: null, price: 850, category: "Chicken" },
  { name: "Chicken Feet", blurb: null, image: null, price: 400, category: "Chicken" },
]

// Plenty of "stock" so nothing shows as sold out while the shop is not tracking kilos yet.
const UNTRACKED_KG = 1000

export const DEFAULT_ITEMS: ShopItem[] = MENU.map((m) => ({
  id: `default-${m.name}`, name: m.name, blurb: m.blurb, image: m.image, category: m.category,
  price_per_kg: m.price, stock_kg: UNTRACKED_KG, is_active: true,
}))
