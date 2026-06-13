-- Shipping partners: body-transport providers, parallel to crematoriums.
-- PostGIS extension is enabled by the crematoriums_postgis migration.

-- User-connected shipping partners (parallel to the crematoriums table)
create table if not exists shipping_partners (
  id                          text primary key,
  name                        text not null,
  location                    text,
  street_address              text,
  city                        text,
  state                       text,
  zip                         text,
  distance                    text,
  contact                     text,
  contact_name                text,
  contact_email               text,
  phone                       text,
  website                     text,
  rating                      float,
  user_ratings_total          int,
  opening_hours               jsonb,
  avg_turnaround              text,
  avg_fee                     text,
  base_fee                    text,
  passage_revenue_share       text,
  network_status              text default 'private',
  status                      text default 'active',
  active                      int default 0,
  active_orders               int default 0,
  completed_ytd               int default 0,
  partner_since               text,
  since                       text,
  license_number              text,
  vetting_notes               text,
  connected_funeral_home_ids  text[] default '{}',
  needs_review                boolean default false,
  created_at                  timestamptz default now(),
  modified_at                 timestamptz,
  deleted_at                  timestamptz
);

-- Canonical Google-sourced shipping_partners_db (mirrors crematoriums_db)
create table if not exists shipping_partners_db (
  id                  uuid primary key default gen_random_uuid(),
  google_place_id     text unique not null,
  name                text not null,
  address             text,
  city                text,
  state               text,
  zip                 text,
  phone               text,
  website             text,
  lat                 double precision not null,
  lng                 double precision not null,
  location            geography(Point, 4326),
  rating              float,
  user_ratings_total  int,
  opening_hours       jsonb,
  is_passage_network  boolean default false,
  passage_tier        text,
  needs_review        boolean default false,
  last_verified_at    timestamptz,
  created_at          timestamptz default now()
);

create index if not exists shipping_partners_db_location_idx
  on shipping_partners_db using gist(location);

create or replace function sync_shipping_partner_location()
returns trigger language plpgsql as $$
begin
  new.location := st_point(new.lng, new.lat)::geography;
  return new;
end;
$$;

drop trigger if exists shipping_partners_db_sync_location on shipping_partners_db;
create trigger shipping_partners_db_sync_location
  before insert or update of lat, lng on shipping_partners_db
  for each row execute function sync_shipping_partner_location();

-- RPC: nearby_shipping_partners (PostGIS distance search, mirrors nearby_crematoriums)
create or replace function nearby_shipping_partners(user_lat float, user_lng float, radius_m float)
returns table (
  id uuid, google_place_id text, name text, address text, city text, state text,
  zip text, phone text, website text, lat float, lng float,
  is_passage_network boolean, passage_tier text, last_verified_at timestamptz,
  rating float, user_ratings_total int, opening_hours jsonb,
  distance_miles float
) language sql stable as $$
  select
    id, google_place_id, name, address, city, state, zip, phone, website, lat, lng,
    is_passage_network, passage_tier, last_verified_at,
    rating, user_ratings_total, opening_hours,
    round((st_distance(location, st_point(user_lng, user_lat)::geography) / 1609.34)::numeric, 2)::float as distance_miles
  from shipping_partners_db
  where
    needs_review = false
    and st_dwithin(location, st_point(user_lng, user_lat)::geography, radius_m)
  order by distance_miles;
$$;
