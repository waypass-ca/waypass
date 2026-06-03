CREATE TABLE IF NOT EXISTS cremation_bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           TEXT NOT NULL,
  crematorium_id    TEXT NOT NULL,
  crematorium_email TEXT,
  crematorium_name  TEXT NOT NULL,
  funeral_home_id   TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','responded','confirmed','cancelled')),
  proposed_slots    JSONB NOT NULL DEFAULT '[]',
  crematorium_slots JSONB DEFAULT NULL,
  confirmed_slot    JSONB DEFAULT NULL,
  response_token    UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at      TIMESTAMPTZ DEFAULT NULL,
  confirmed_at      TIMESTAMPTZ DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS cremation_bookings_token_idx ON cremation_bookings (response_token);
CREATE INDEX IF NOT EXISTS cremation_bookings_owner_idx ON cremation_bookings (funeral_home_id, status);
