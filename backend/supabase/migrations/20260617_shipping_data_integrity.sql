-- Shipping connector data-integrity tightening.

-- 1. FK from cremation_bookings.shipping_partner_id -> shipping_partners(id).
--    ON DELETE SET NULL so a deleted partner doesn't cascade-kill bookings —
--    the cached shipping_partner_name/email on the booking keeps history readable.
ALTER TABLE cremation_bookings
  ADD CONSTRAINT cremation_bookings_shipping_partner_fk
  FOREIGN KEY (shipping_partner_id) REFERENCES shipping_partners(id) ON DELETE SET NULL;

-- 2. Invalidate public response tokens after first response. Both columns
--    nullable; non-null means the token has been used and should reject.
ALTER TABLE cremation_bookings
  ADD COLUMN IF NOT EXISTS response_token_invalidated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipping_response_token_invalidated_at TIMESTAMPTZ;

-- 3. Mark when a booking has been rescheduled so vendor invites can label
--    themselves accordingly.
ALTER TABLE cremation_bookings
  ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ;
