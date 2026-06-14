-- Denormalize the chosen shipping partner onto the case row so the
-- shipping-partner detail page can list recent cases the same way the
-- crematorium detail page does.
ALTER TABLE cases ADD COLUMN IF NOT EXISTS shipping_partner_id TEXT;
