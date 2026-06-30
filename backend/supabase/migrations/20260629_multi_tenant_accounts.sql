-- Multi-tenant accounts migration
-- Adds invite table, fixes broken RLS policies, adds funeral_home_id to per-tenant settings tables
-- Pre-launch: wipes orphaned test data

-- ── 1. Invite table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funeral_home_invites (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  funeral_home_id uuid      NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
  email         text        NOT NULL,
  role          text        NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','staff','read_only')),
  token         text        NOT NULL UNIQUE,
  invited_by    uuid        REFERENCES users(id),
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_at   timestamptz,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS funeral_home_invites_token_idx ON funeral_home_invites(token);
CREATE INDEX IF NOT EXISTS funeral_home_invites_fh_idx   ON funeral_home_invites(funeral_home_id);

-- ── 2. Role constraint on users ─────────────────────────────────────────────
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('admin','staff','read_only'));

-- ── 3. Add funeral_home_id to single-row settings tables ────────────────────
ALTER TABLE email_template_settings
  ADD COLUMN IF NOT EXISTS funeral_home_id uuid REFERENCES funeral_homes(id) ON DELETE CASCADE;

ALTER TABLE portal_settings
  ADD COLUMN IF NOT EXISTS funeral_home_id uuid REFERENCES funeral_homes(id) ON DELETE CASCADE;

-- ── 4. Convert cremation_bookings.funeral_home_id from text → uuid ──────────
-- Bookings have a FK to cases; cascade through. Table will be emptied by truncate below.
-- We need to drop and recreate the column to change its type cleanly.
ALTER TABLE cremation_bookings
  ALTER COLUMN funeral_home_id DROP NOT NULL;
ALTER TABLE cremation_bookings
  ALTER COLUMN funeral_home_id TYPE uuid USING NULL;
ALTER TABLE cremation_bookings
  ALTER COLUMN funeral_home_id SET NOT NULL;

-- booking_events.funeral_home_id is also text
ALTER TABLE booking_events
  ALTER COLUMN funeral_home_id TYPE uuid USING NULL;

-- ── 5. Wipe orphaned test data (pre-launch) ──────────────────────────────────
TRUNCATE TABLE booking_events;
TRUNCATE TABLE cremation_bookings;
TRUNCATE TABLE cases CASCADE;
TRUNCATE TABLE folders;
TRUNCATE TABLE crematoriums;
TRUNCATE TABLE crematorium_orders;
DELETE FROM email_template_settings;
DELETE FROM portal_settings;

-- ── 6. Fix broken / missing RLS policies ────────────────────────────────────

-- cases: replace open "anon all" with tenant-scoped policy
DROP POLICY IF EXISTS "anon all" ON cases;
CREATE POLICY "tenant cases all" ON cases
  FOR ALL
  USING  (funeral_home_id = get_my_funeral_home_id())
  WITH CHECK (funeral_home_id = get_my_funeral_home_id());

-- case_notes: replace open "anon all" with join-via-case policy
DROP POLICY IF EXISTS "anon all" ON case_notes;
CREATE POLICY "tenant case_notes all" ON case_notes
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = case_notes.case_id
      AND cases.funeral_home_id = get_my_funeral_home_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = case_notes.case_id
      AND cases.funeral_home_id = get_my_funeral_home_id()
  ));

-- crematoriums: replace open "anon all" with connected-home policy
DROP POLICY IF EXISTS "anon all" ON crematoriums;
CREATE POLICY "tenant crematoriums all" ON crematoriums
  FOR ALL
  USING  (auth.uid() = ANY(connected_funeral_home_ids))
  WITH CHECK (auth.uid() = ANY(connected_funeral_home_ids));

-- crematorium_orders: replace open "anon all" with tenant-scoped policy
DROP POLICY IF EXISTS "anon all" ON crematorium_orders;
CREATE POLICY "tenant crematorium_orders all" ON crematorium_orders
  FOR ALL
  USING  (funeral_home_id = get_my_funeral_home_id())
  WITH CHECK (funeral_home_id = get_my_funeral_home_id());

-- cremation_bookings: had RLS enabled but NO policies — add them now
CREATE POLICY "tenant bookings all" ON cremation_bookings
  FOR ALL
  USING  (funeral_home_id = get_my_funeral_home_id())
  WITH CHECK (funeral_home_id = get_my_funeral_home_id());

-- booking_events: was scoped to JWT claim; switch to get_my_funeral_home_id()
DROP POLICY IF EXISTS "booking_events_fh_read" ON booking_events;
CREATE POLICY "tenant booking_events select" ON booking_events
  FOR SELECT
  USING (funeral_home_id = get_my_funeral_home_id());
CREATE POLICY "tenant booking_events insert" ON booking_events
  FOR INSERT
  WITH CHECK (funeral_home_id = get_my_funeral_home_id());

-- email_template_settings: replace open policies with tenant-scoped
DROP POLICY IF EXISTS "email_template_settings_modify" ON email_template_settings;
DROP POLICY IF EXISTS "email_template_settings_select" ON email_template_settings;
CREATE POLICY "tenant email_template_settings all" ON email_template_settings
  FOR ALL
  USING  (funeral_home_id = get_my_funeral_home_id())
  WITH CHECK (funeral_home_id = get_my_funeral_home_id());

-- portal_settings: keep public SELECT (families read it), restrict writes
DROP POLICY IF EXISTS "Public read"  ON portal_settings;
DROP POLICY IF EXISTS "Auth write"   ON portal_settings;
CREATE POLICY "public portal_settings select" ON portal_settings
  FOR SELECT
  USING (true);
CREATE POLICY "tenant portal_settings write" ON portal_settings
  FOR ALL
  USING  (funeral_home_id = get_my_funeral_home_id())
  WITH CHECK (funeral_home_id = get_my_funeral_home_id());

-- funeral_home_invites: tenant-scoped
ALTER TABLE funeral_home_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant invites all" ON funeral_home_invites
  FOR ALL
  USING  (funeral_home_id = get_my_funeral_home_id())
  WITH CHECK (funeral_home_id = get_my_funeral_home_id());
