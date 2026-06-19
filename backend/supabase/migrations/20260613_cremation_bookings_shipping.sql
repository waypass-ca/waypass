-- Extend cremation_bookings to coordinate with an optional shipping partner.
-- Sequential flow: crematorium responds first; their available slots become the
-- proposed window presented to the shipping partner.

ALTER TABLE cremation_bookings
  ADD COLUMN IF NOT EXISTS shipping_partner_id    TEXT,
  ADD COLUMN IF NOT EXISTS shipping_partner_email TEXT,
  ADD COLUMN IF NOT EXISTS shipping_partner_name  TEXT,
  ADD COLUMN IF NOT EXISTS shipping_response_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS shipping_slots         JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shipping_responded_at  TIMESTAMPTZ DEFAULT NULL;

-- Expand status check to include the awaiting_shipping state.
ALTER TABLE cremation_bookings DROP CONSTRAINT IF EXISTS cremation_bookings_status_check;
ALTER TABLE cremation_bookings ADD CONSTRAINT cremation_bookings_status_check
  CHECK (status IN ('pending','awaiting_shipping','responded','confirmed','cancelled'));

CREATE UNIQUE INDEX IF NOT EXISTS cremation_bookings_shipping_token_idx
  ON cremation_bookings (shipping_response_token);
