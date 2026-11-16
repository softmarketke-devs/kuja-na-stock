// Builds the app icons from the BIG badge (public/brand/big-logo.png) on the brand's dark background.
// The badge source is only 129x130px, so the larger icons are upscaled and slightly soft until the
// client supplies the original logo file. Run: node scripts/make-brand-icons.mjs
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const BG = '#120e0c'
const logo = 'public/brand/big-logo.png'

async function tile(size, { fill = 0.64, radius = 0 } = {}) {
  const inner = Math.round(size * fill)
  const badge = await sharp(logo).resize(inner, inner, { fit: 'inside', kernel: 'lanczos3' }).toBuffer()
  const base = sharp({ create: { width: size, height: size, channels: 4, background: BG } })
  const img = base.composite([{ input: badge, gravity: 'centre' }]).png()
  if (!radius) return img.toBuffer()
  const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#fff"/></svg>`)
  return sharp(await img.toBuffer()).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
}

const out = async (path, buf) => {
  writeFileSync(path, buf)
  console.log(path, buf.length)
}

// Maskable PWA icon needs the badge inside the safe zone (about 60%), so keep fill modest.
await out('public/icons/icon-512.png', await tile(512, { fill: 0.6 }))
await out('public/icons/icon-192.png', await tile(192, { fill: 0.6 }))
await out('public/icons/icon-64.png', await tile(64, { fill: 0.78 }))
await out('public/icons/logo-square.png', await tile(256, { fill: 0.84, radius: 40 }))
const fav = await tile(64, { fill: 0.82, radius: 10 })
await out('src/app/icon.png', await tile(256, { fill: 0.84, radius: 40 }))

// favicon.ico: an ICO container holding one 64x64 PNG.
// Layout: 6-byte header, then one 16-byte entry (width, height, colours, reserved,
// planes, bit depth, data size, data offset), then the PNG bytes.
const ico = Buffer.alloc(22)
ico.writeUInt16LE(0, 0) // reserved
ico.writeUInt16LE(1, 2) // type: icon
ico.writeUInt16LE(1, 4) // image count
ico.writeUInt8(64, 6) // width
ico.writeUInt8(64, 7) // height
ico.writeUInt16LE(1, 10) // colour planes
ico.writeUInt16LE(32, 12) // bits per pixel
ico.writeUInt32LE(fav.length, 14) // image data size
ico.writeUInt32LE(22, 18) // image data offset
const icoFile = Buffer.concat([ico, fav])
await out('src/app/favicon.ico', icoFile)
await out('public/favicon.ico', icoFile)
