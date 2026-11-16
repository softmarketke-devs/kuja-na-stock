// One-off: pull the base64 images out of the BIG Premium Cuts v4 HTML into public/.
// Reads the file as text only; nothing in it is executed.
import { readFileSync, writeFileSync } from 'node:fs'
const src = readFileSync(process.argv[2], 'utf8')
const write = (path, uri) => {
  const m = uri.match(/^data:image\/(png|jpeg);base64,(.+)$/s)
  if (!m) throw new Error('bad data uri for ' + path)
  writeFileSync(path, Buffer.from(m[2], 'base64'))
  console.log(path, Buffer.from(m[2], 'base64').length)
}
const logo = src.match(/<img src="(data:image\/png;base64,[^"]+)" alt="BIG Premium Cuts"/)
write('public/brand/big-logo.png', logo[1])
const art = src.match(/const ART=\[(.*?)\];const IMG=/s)[1].match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g)
const names = ['overview', 'rib', 'chuck', 'loin', 'round', 'flank', 'plate']
art.forEach((u, i) => write(`public/steak-map/${names[i]}.png`, u))
const img = src.match(/const IMG=\{(.*?)\};\s*const PH=/s)[1]
const slug = s => s.toLowerCase().replace(/[^a-z]+/g, '-')
for (const m of img.matchAll(/"([^"]+)":\s*"(data:image\/jpeg;base64,[A-Za-z0-9+/=]+)"/g)) write(`public/cuts/${slug(m[1])}.jpg`, m[2])
