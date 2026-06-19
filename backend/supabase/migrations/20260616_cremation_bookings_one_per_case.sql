-- Enforce one active (non-cancelled) booking per case.
-- Cancelled rows are allowed to accumulate so the cancel+rebook flow keeps working.

CREATE UNIQUE INDEX IF NOT EXISTS cremation_bookings_one_active_per_case_idx
  ON cremation_bookings (case_id, funeral_home_id)
  WHERE status <> 'cancelled';
