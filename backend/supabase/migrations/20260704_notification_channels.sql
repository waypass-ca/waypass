-- Split notification preferences into two channels: email (existing columns)
-- and in-app (new columns). The existing boolean columns keep their meaning
-- as the email channel; the new `*_in_app` columns gate whether an inbox
-- item is created for the same event.
--
-- `new_crematorium_request` is now dormant in the UI but the column stays
-- to avoid breaking the RLS/upsert path used by older clients.

alter table notifications
  add column if not exists new_case_submitted_in_app       boolean not null default true,
  add column if not exists case_status_updated_in_app      boolean not null default true,
  add column if not exists document_uploaded_in_app        boolean not null default true,
  add column if not exists case_marked_complete_in_app     boolean not null default true,
  add column if not exists weekly_revenue_summary_in_app   boolean not null default true,
  add column if not exists family_message_received_in_app  boolean not null default true;
