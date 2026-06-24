-- Replace old flat-column email_template with new JSONB-based settings table
create table if not exists email_template_settings (
  id                   text primary key default 'default',
  active_template_id   text not null default 'classic',
  favourite_ids        jsonb not null default '[]'::jsonb,
  customizations       jsonb not null default '{}'::jsonb,
  updated_at           timestamptz not null default now()
);

alter table email_template_settings enable row level security;

create policy email_template_settings_select on email_template_settings
  for select using (true);

create policy email_template_settings_modify on email_template_settings
  for all using (auth.role() = 'authenticated');

drop table if exists email_template;
