-- booking_events: canonical audit log for cremation_bookings lifecycle.
-- Inbox notifications and the case activity feed both read from this table;
-- cremation_bookings remains the current-state row and this captures every
-- transition with a typed event + structured payload.
CREATE TABLE IF NOT EXISTS booking_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES cremation_bookings(id) ON DELETE CASCADE,
  case_id         TEXT NOT NULL,
  funeral_home_id TEXT NOT NULL,
  event_type      TEXT NOT NULL CHECK (event_type IN (
    'booking_created',
    'crematorium_invited',
    'crematorium_responded',
    'shipping_invited',
    'shipping_responded',
    'booking_confirmed',
    'booking_rescheduled',
    'booking_cancelled'
  )),
  actor_type      TEXT NOT NULL CHECK (actor_type IN ('user','crematorium','shipping_partner','system')),
  actor_id        TEXT,
  actor_label     TEXT,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_events_case_idx    ON booking_events (case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS booking_events_booking_idx ON booking_events (booking_id, created_at);
CREATE INDEX IF NOT EXISTS booking_events_fh_idx      ON booking_events (funeral_home_id, created_at DESC);

-- Idempotency for the backfill script: at most one row per (booking, event_type, created_at).
CREATE UNIQUE INDEX IF NOT EXISTS booking_events_dedupe_idx
  ON booking_events (booking_id, event_type, created_at);

ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS booking_events_fh_read ON booking_events;
CREATE POLICY booking_events_fh_read ON booking_events FOR SELECT
  USING (funeral_home_id = auth.jwt() ->> 'funeral_home_id');
