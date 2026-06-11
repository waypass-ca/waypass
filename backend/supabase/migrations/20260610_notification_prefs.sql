-- Notification email preferences (per-user).
-- Codebase already references this table (backend/routes/notifications.js)
-- but no migration ever shipped — this is the authoritative schema.
-- Idempotent so it can re-run cleanly over a table already created via
-- the Supabase UI (which may have a different user_id column type).

create table if not exists notifications (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   text not null unique,
  new_case_submitted        boolean not null default true,
  case_status_updated       boolean not null default true,
  document_uploaded         boolean not null default true,
  case_marked_complete      boolean not null default true,
  new_crematorium_request   boolean not null default true,
  weekly_revenue_summary    boolean not null default true,
  family_message_received   boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table notifications enable row level security;

-- Casting both sides to text works whether user_id was created as text
-- (per this migration) or as uuid (per a prior Supabase-UI table).
drop policy if exists notifications_select on notifications;
create policy notifications_select on notifications
  for select using (user_id::text = auth.uid()::text);

drop policy if exists notifications_insert on notifications;
create policy notifications_insert on notifications
  for insert with check (user_id::text = auth.uid()::text);

drop policy if exists notifications_update on notifications;
create policy notifications_update on notifications
  for update using (user_id::text = auth.uid()::text)
            with check (user_id::text = auth.uid()::text);
