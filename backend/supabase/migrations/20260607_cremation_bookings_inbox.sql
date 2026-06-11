-- inbox_items: all in-app notifications for a user (alerts, messages, schedule responses)
-- cremation_bookings already exists from 20260603_cremation_bookings.sql
create table if not exists inbox_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  type         text not null,   -- alert | message | schedule
  sender       text not null,
  subject      text not null,
  preview      text not null,
  body         text not null,
  case_id      text,
  booking_id   uuid,
  severity     text,            -- danger | warning | info | null
  scheduled_for text,
  read         boolean not null default false,
  starred      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists inbox_items_user_idx on inbox_items (user_id, created_at desc);

-- Enable realtime so the frontend can subscribe to new inserts
alter publication supabase_realtime add table inbox_items;
