-- Inbox rows that originate from a booking lifecycle event point back to the
-- canonical booking_events row. Nullable because inbox carries other sources
-- too (custody alerts, family messages).
ALTER TABLE inbox_items
  ADD COLUMN IF NOT EXISTS booking_event_id UUID REFERENCES booking_events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS inbox_items_booking_event_idx
  ON inbox_items (booking_event_id);
