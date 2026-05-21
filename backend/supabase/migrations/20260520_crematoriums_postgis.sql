-- Enable PostGIS
create extension if not exists postgis;

-- Add needs_review column (used by refresh script)
alter table crematoriums add column if not exists needs_review boolean default false;

-- Create the canonical crematoriums_db table (separate from the existing crematoriums table)
create table if not exists crematoriums_db (
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
  is_passage_network  boolean default false,
  passage_tier        text,
  needs_review        boolean default false,
  last_verified_at    timestamptz,
  created_at          timestamptz default now()
);

-- Spatial index
create index if not exists crematoriums_db_location_idx
  on crematoriums_db using gist(location);

-- Trigger to keep location in sync with lat/lng
create or replace function sync_crematorium_location()
returns trigger language plpgsql as $$
begin
  new.location := st_point(new.lng, new.lat)::geography;
  return new;
end;
$$;

drop trigger if exists crematoriums_db_sync_location on crematoriums_db;
create trigger crematoriums_db_sync_location
  before insert or update of lat, lng on crematoriums_db
  for each row execute function sync_crematorium_location();

-- RPC: nearby_crematoriums (PostGIS distance search)
create or replace function nearby_crematoriums(user_lat float, user_lng float, radius_m float)
returns table (
  id uuid, google_place_id text, name text, address text, city text, state text,
  zip text, phone text, website text, lat float, lng float,
  is_passage_network boolean, passage_tier text, last_verified_at timestamptz,
  distance_miles float
) language sql stable as $$
  select
    id, google_place_id, name, address, city, state, zip, phone, website, lat, lng,
    is_passage_network, passage_tier, last_verified_at,
    round((st_distance(location, st_point(user_lng, user_lat)::geography) / 1609.34)::numeric, 2)::float as distance_miles
  from crematoriums_db
  where
    needs_review = false
    and st_dwithin(location, st_point(user_lng, user_lat)::geography, radius_m)
  order by distance_miles;
$$;
