-- inbox_items hardening:
--   * row-level security
--   * foreign keys with cascade so deletes don't orphan notifications
--   * archived_at for soft-delete + undo
--   * scheduled_for as real timestamptz instead of pre-formatted text

-- ── RLS ─────────────────────────────────────────────────────────────────
alter table inbox_items enable row level security;

-- Read/write your own rows. Casting both sides to text works regardless
-- of whether user_id is text (per migration) or uuid (some Supabase setups).
drop policy if exists inbox_items_select on inbox_items;
create policy inbox_items_select on inbox_items
  for select using (user_id::text = auth.uid()::text);

drop policy if exists inbox_items_insert on inbox_items;
create policy inbox_items_insert on inbox_items
  for insert with check (user_id::text = auth.uid()::text);

drop policy if exists inbox_items_update on inbox_items;
create policy inbox_items_update on inbox_items
  for update using (user_id::text = auth.uid()::text)
            with check (user_id::text = auth.uid()::text);

drop policy if exists inbox_items_delete on inbox_items;
create policy inbox_items_delete on inbox_items
  for delete using (user_id::text = auth.uid()::text);

-- ── Foreign keys ────────────────────────────────────────────────────────
do $$ begin
  alter table inbox_items
    add constraint inbox_items_booking_fk
      foreign key (booking_id) references cremation_bookings(id) on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table inbox_items
    add constraint inbox_items_case_fk
      foreign key (case_id) references cases(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- ── Soft delete ─────────────────────────────────────────────────────────
alter table inbox_items add column if not exists archived_at timestamptz;

-- Replace the hot-path index with a partial one that ignores archived rows.
drop index if exists inbox_items_user_idx;
create index if not exists inbox_items_user_active_idx
  on inbox_items (user_id, created_at desc)
  where archived_at is null;
create index if not exists inbox_items_user_archived_idx
  on inbox_items (user_id, created_at desc)
  where archived_at is not null;

-- ── scheduled_for → timestamptz ─────────────────────────────────────────
-- Existing rows hold pre-formatted display strings that can't be parsed
-- reliably (locale-dependent). Null them out; UI will fall back to no badge.
-- No-op if the column is already timestamptz (idempotent).
do $$
declare
  current_type text;
begin
  select data_type into current_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'inbox_items'
      and column_name = 'scheduled_for';
  if current_type = 'text' then
    alter table inbox_items
      alter column scheduled_for type timestamptz
      using (case when scheduled_for ~ '^\d{4}-\d{2}-\d{2}T' then scheduled_for::timestamptz else null end);
  end if;
end $$;
