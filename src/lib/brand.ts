// The product's name and public address in one place, so a rename is a one-file
// change. Static files that cannot import this (public/manifest.json,
// offline.html, sw.js) are listed in LAUNCH.md under "Renaming checklist".

export const BRAND_NAME = 'Kuja Na Stock'
export const BRAND_SHORT_NAME = 'KujaNaStock'
export const BRAND_TAGLINE = 'Order tonight, stocked by 7 AM'
export const SUPPORT_EMAIL = 'softmarketke@gmail.com' // replace with a role address on the real domain

// Set NEXT_PUBLIC_SITE_URL in production. The fallback is the Vercel URL until a custom domain is attached.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kuja-na-stock.vercel.app'

// Public contact numbers, set per deployment so none is hard-coded. International format
// without + or spaces, e.g. 2547XXXXXXXX. The call and WhatsApp buttons stay hidden while empty.
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || ''
export const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || SUPPORT_PHONE
