-- BIG Premium Cuts: the beef + chicken menu (prices, sections). Safe to re-run. Run in Supabase -> SQL Editor.
-- Needs schema.sql run first only for the category column; this script adds it too if it is missing.
--
-- What it does:
--   1. Adds the menu section (category) to every cut.
--   2. Sets price, section, display order and "shown" for every cut on the menu (overwrites old prices).
--      It never changes stock_kg of an existing cut. New cuts start at 20 kg as a PLACEHOLDER: set real kilos on
--      the admin Stock page before you sell.
--   3. Deletes the old cuts that are not on the menu.
-- Cuts sold per PIECE or per HEAD are added switched OFF: the shop sells by the kilo only and would charge the piece
-- price per kg. Switch them on only after piece selling is supported.
-- Naming: Fillet = Tenderloin, Minced Meat = lean mince, Osso Buco = Ossobuco.

alter table public.shop_items add column if not exists category text;

insert into public.shop_items (name, blurb, price_per_kg, category, sort_order, is_active, stock_kg) values
  ('Ribeye', null, 1500, 'Signature Steaks & Premium Cuts', 10, true, 20),
  ('Sirloin Steak', null, 1450, 'Signature Steaks & Premium Cuts', 11, true, 20),
  ('Tomahawk', 'Bone-in ribeye, the showpiece.', 1600, 'Signature Steaks & Premium Cuts', 12, true, 20),
  ('Rib Steak', null, 1460, 'Signature Steaks & Premium Cuts', 13, true, 20),
  ('Denver Steak', null, 1450, 'Signature Steaks & Premium Cuts', 14, true, 20),
  ('Tri-tip Sirloin Steak', null, 1650, 'Signature Steaks & Premium Cuts', 15, true, 20),
  ('Picanha Steak', null, 1850, 'Signature Steaks & Premium Cuts', 16, true, 20),
  ('Fillet', 'Tenderloin.', 3500, 'Signature Steaks & Premium Cuts', 17, true, 20),
  ('T-bone', null, 1550, 'Signature Steaks & Premium Cuts', 18, true, 20),
  ('Rump Steak', null, 1600, 'Signature Steaks & Premium Cuts', 19, true, 20),
  ('New York Strip Steak', null, 1550, 'Signature Steaks & Premium Cuts', 20, true, 20),
  ('Chuck Steak (Dino Ribs)', null, 1500, 'Signature Steaks & Premium Cuts', 21, true, 20),
  ('Beef Fillet Stir Fry', null, 3500, 'Signature Steaks & Premium Cuts', 22, true, 20),
  ('Flat Iron Steak', null, 1450, 'Signature Steaks & Premium Cuts', 23, true, 20),
  ('Brisket', null, 1850, 'Signature Steaks & Premium Cuts', 24, true, 20),
  ('Flank Steak', null, 1400, 'Signature Steaks & Premium Cuts', 25, true, 20),
  ('Skirt Steak', null, 1400, 'Signature Steaks & Premium Cuts', 26, true, 20),
  ('Beef Hump', null, 1550, 'Signature Steaks & Premium Cuts', 27, true, 20),
  ('Thor''s Hammer Steak', null, 1500, 'Signature Steaks & Premium Cuts', 28, true, 20),
  ('Ribeye (14-day aged)', null, 3500, 'Prime Aged Beef Cuts', 29, true, 20),
  ('Ribeye (21-day aged)', null, 4500, 'Prime Aged Beef Cuts', 30, true, 20),
  ('T-bone (14-day aged)', null, 3600, 'Prime Aged Beef Cuts', 31, true, 20),
  ('T-bone (21-day aged)', null, 4600, 'Prime Aged Beef Cuts', 32, true, 20),
  ('Sirloin (14-day aged)', null, 3500, 'Prime Aged Beef Cuts', 33, true, 20),
  ('Sirloin (21-day aged)', null, 4500, 'Prime Aged Beef Cuts', 34, true, 20),
  ('Rump (14-day aged)', null, 3500, 'Prime Aged Beef Cuts', 35, true, 20),
  ('Rump (21-day aged)', null, 4500, 'Prime Aged Beef Cuts', 36, true, 20),
  ('Minced Meat', 'Lean beef mince.', 1250, 'Everyday Essentials', 37, true, 20),
  ('Beef Mince 80:20', null, 1200, 'Everyday Essentials', 38, true, 20),
  ('Short Ribs', null, 1200, 'Everyday Essentials', 39, true, 20),
  ('Beef Cubes', null, 1300, 'Everyday Essentials', 40, true, 20),
  ('Beef on Bone', null, 850, 'Everyday Essentials', 41, true, 20),
  ('Oxtail', 'Our best seller.', 900, 'Everyday Essentials', 42, true, 20),
  ('Half a Beef', null, 800, 'Bulk Order', 43, true, 20),
  ('Front Quarter', null, 790, 'Bulk Order', 44, true, 20),
  ('Hind Quarter', null, 800, 'Bulk Order', 45, true, 20),
  ('Matumbo / Tripe (bulk)', null, 480, 'Bulk Order', 46, true, 20),
  ('Osso Buco', null, 1000, 'Specialty & Offal', 47, true, 20),
  ('Bone Marrow', null, 400, 'Specialty & Offal', 48, true, 20),
  ('Special Bones', null, 500, 'Specialty & Offal', 49, true, 20),
  ('Soup Bones', null, 400, 'Specialty & Offal', 50, true, 20),
  ('Beef Tallow', null, 650, 'Specialty & Offal', 51, true, 20),
  ('Liver', null, 900, 'Specialty & Offal', 52, true, 20),
  ('Heart', null, 850, 'Specialty & Offal', 53, true, 20),
  ('Tripe / Matumbo', null, 500, 'Specialty & Offal', 54, true, 20),
  ('Kidney', null, 1100, 'Specialty & Offal', 55, true, 20),
  ('Mutura', 'Prime beef, traditional recipe, rich flavour. 1 kg pack.', 1350, 'Mutura', 56, true, 20),
  ('Chicken Wings', null, 750, 'Chicken', 57, true, 20),
  ('Chicken Thighs', null, 800, 'Chicken', 58, true, 20),
  ('Chicken Drumsticks', null, 850, 'Chicken', 59, true, 20),
  ('Chicken Liver', null, 500, 'Chicken', 60, true, 20),
  ('Chicken Breast / Boneless', null, 850, 'Chicken', 61, true, 20),
  ('Chicken Feet', null, 400, 'Chicken', 62, true, 20)
on conflict (name) do update
  set price_per_kg = excluded.price_per_kg, category = excluded.category, sort_order = excluded.sort_order,
      is_active = true, updated_at = now();

-- Per piece / per head: OFF for now.
insert into public.shop_items (name, blurb, price_per_kg, category, sort_order, is_active, stock_kg) values
  ('Beef Tongue (per piece)', null, 1300, 'Specialty & Offal', 200, false, 0),
  ('Cow Head (per head, scrapped)', null, 5000, 'Specialty & Offal', 201, false, 0),
  ('Cow Feet (per piece)', null, 550, 'Specialty & Offal', 202, false, 0),
  ('Chicken Coupon (per piece)', null, 650, 'Chicken', 203, false, 0),
  ('Kienyeji Chicken (per piece)', null, 1500, 'Chicken', 204, false, 0),
  ('Big Kingsized Chicken 3-5 kg (per piece)', null, 3500, 'Chicken', 205, false, 0)
on conflict (name) do update
  set price_per_kg = excluded.price_per_kg, category = excluded.category, sort_order = excluded.sort_order, updated_at = now();

-- Old cuts that are not on the menu. Past orders keep their own copy of what was bought, so history is unaffected.
delete from public.shop_items
 where name in ('Cowboy Rib', 'Shank', 'Stew Cuts', 'Chunk', 'Pork Rib-eye Chops', 'Whole Rabbit', 'Sirloin on Bone', 'The Steak Bundle');
