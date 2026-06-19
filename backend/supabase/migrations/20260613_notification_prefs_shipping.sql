-- Add per-user email preference for shipping partner booking requests.
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS new_shipping_request BOOLEAN NOT NULL DEFAULT true;
