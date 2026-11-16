// Content for the homepage steak map and the cut list. Copy of the notes is
// transcribed from the client's Instagram carousel. Prices are NOT here: they
// live in src/lib/catalogue.ts so the client can change them in one place.

export interface MapSlide {
  title: string
  art: string
  notes: string
  cuts: string[]
}

const art = (n: string) => `/steak-map/${n}.png`

export const SLIDES: MapSlide[] = [
  { title: 'All cuts', art: art('overview'), notes: 'Tap a part of the animal on the map, or follow along, to see what comes from it.', cuts: [] },
  { title: 'The Rib', art: art('rib'), notes: 'The rib section is prized for its rich marbling, exceptional tenderness, and deep beefy flavour. This is where juiciness meets bold taste, delivering steaks that stay succulent, buttery, and full of character in every bite. (A true favorite)', cuts: ['Ribeye'] },
  { title: 'The Chuck', art: art('chuck'), notes: 'The chuck is known for its bold beef flavor and generous marbling. Cuts from this section offer a satisfying balance of tenderness and richness when prepared correctly. Ideal for grilling, pan-searing, or slow cooking, the chuck delivers depth of taste and value without compromising on quality.', cuts: ['Chuck steak', 'Denver steak', 'Flat iron'] },
  { title: 'The Loin', art: art('loin'), notes: 'The loin is prized for its tenderness and refined flavor. This section yields some of the most sought-after cuts, including tenderloin, strip-loin, and T-bone steaks. With minimal muscle work, the meat remains naturally soft and finely textured. For best results, cook quickly over high heat to medium-rare, allow it to rest briefly, and season simply to let its natural quality shine.', cuts: ['Filet mignon', 'New York strip', 'Porterhouse', 'T-bone'] },
  { title: 'The Round/Loin', art: art('round'), notes: 'The round comes from the hind leg and is known for its lean structure and bold, beef-forward flavor. Because these muscles are well exercised, the cuts are firm with minimal fat, making them ideal for slow cooking, roasting, or thin slicing. For the best result, cook low and slow or slice against the grain to maintain tenderness and maximize flavor.', cuts: ['Sirloin steak'] },
  { title: 'The Flank', art: art('flank'), notes: 'Flank steak is lean, flavorful, and known for its bold beef taste. It performs best with high-heat cooking such as grilling or pan-searing and benefits from marination. Always slice against the grain to ensure a tender, juicy eating experience.', cuts: ['Flank steak'] },
  { title: 'The Plate', art: art('plate'), notes: 'The plate offers some of the most versatile cuts on the beef. Beyond skirt steak, this area is also where short ribs come from. Because these muscles work hard, they are richly marbled and full of deep flavor. For the perfect bite, cook to medium-rare, let it rest for 10 minutes, and finish with a squeeze of lime to cut through the richness.', cuts: ['Skirt steak'] },
]

/** Clickable regions on the overview slide: label, slide index, x%, y%. */
export const HOTSPOTS: [string, number, number, number][] = [
  ['Round', 4, 30.3, 60.2],
  ['Loin', 3, 41.2, 61.3],
  ['Rib', 1, 52.6, 59.8],
  ['Chuck', 2, 61.5, 61.4],
  ['Flank', 5, 43, 72.6],
  ['Plate', 6, 51.3, 72.1],
]

export const FEATURED: { name: string; blurb: string; image: string }[] = [
  { name: 'Tomahawk', blurb: 'Bone-in ribeye, the showpiece.', image: '/cuts/tomahawk.jpg' },
  { name: 'Sirloin on Bone', blurb: 'Dry-aged, bone-in.', image: '/cuts/sirloin-on-bone.jpg' },
  { name: 'Oxtail', blurb: 'Our best seller.', image: '/cuts/oxtail.jpg' },
  { name: 'Mutura', blurb: 'Grilled Kenyan sausage, sold as a 1 kg pack.', image: '/cuts/mutura.png' },
  { name: 'The Steak Bundle', blurb: 'Tomahawk, T-bone and cowboy rib.', image: '/cuts/the-steak-bundle.jpg' },
]

export const ALL_CUTS = [
  'Tomahawk', 'Cowboy Rib', 'T-bone', 'Sirloin on Bone', 'Ribeye', 'Fillet', 'Oxtail', 'Short Ribs', 'Brisket', 'Shank',
  'Osso Buco', 'Stew Cuts', 'Chunk', 'Minced Meat', 'Liver', 'Kidney', 'Heart', 'Mutura', 'Pork Rib-eye Chops', 'Whole Rabbit', 'The Steak Bundle',
]
