-- Drop legacy duplicate columns on shipping_partners. The originals were
-- copy-pasted from crematoriums and ended up with three name pairs.
-- shapeRow() in routes/shippingPartners.js already prefers the kept column.

UPDATE shipping_partners SET contact_name   = COALESCE(contact_name, contact);
UPDATE shipping_partners SET partner_since  = COALESCE(partner_since, since);
UPDATE shipping_partners SET active_orders  = COALESCE(active_orders, active);

ALTER TABLE shipping_partners
  DROP COLUMN IF EXISTS contact,
  DROP COLUMN IF EXISTS since,
  DROP COLUMN IF EXISTS active;
