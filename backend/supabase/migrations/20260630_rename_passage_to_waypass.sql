-- Rename branding columns: passage → waypass

-- crematoriums_db
alter table crematoriums_db rename column is_passage_network to is_waypass_network;
alter table crematoriums_db rename column passage_tier to waypass_tier;

-- shipping_partners_db
alter table shipping_partners_db rename column is_passage_network to is_waypass_network;
alter table shipping_partners_db rename column passage_tier to waypass_tier;

-- shipping_partners (user-connected table)
alter table shipping_partners rename column passage_revenue_share to waypass_revenue_share;

-- crematoriums (user-connected table) — guarded in case column doesn't exist
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crematoriums' and column_name = 'passage_revenue_share'
  ) then
    alter table crematoriums rename column passage_revenue_share to waypass_revenue_share;
  end if;
end $$;

-- Drop and recreate RPCs — return type changes require a full drop
drop function if exists nearby_crematoriums(float, float, float);
drop function if exists nearby_shipping_partners(float, float, float);

-- Recreate nearby_crematoriums RPC with renamed columns
create or replace function nearby_crematoriums(user_lat float, user_lng float, radius_m float)
returns table (
  id uuid, google_place_id text, name text, address text, city text, state text,
  zip text, phone text, website text, lat float, lng float,
  is_waypass_network boolean, waypass_tier text, last_verified_at timestamptz,
  rating float, user_ratings_total int, opening_hours jsonb,
  distance_miles float
) language sql stable as $$
  select
    id, google_place_id, name, address, city, state, zip, phone, website, lat, lng,
    is_waypass_network, waypass_tier, last_verified_at,
    rating, user_ratings_total, opening_hours,
    round((st_distance(location, st_point(user_lng, user_lat)::geography) / 1609.34)::numeric, 2)::float as distance_miles
  from crematoriums_db
  where
    needs_review = false
    and st_dwithin(location, st_point(user_lng, user_lat)::geography, radius_m)
  order by distance_miles;
$$;

-- Recreate nearby_shipping_partners RPC with renamed columns
create or replace function nearby_shipping_partners(user_lat float, user_lng float, radius_m float)
returns table (
  id uuid, google_place_id text, name text, address text, city text, state text,
  zip text, phone text, website text, lat float, lng float,
  is_waypass_network boolean, waypass_tier text, last_verified_at timestamptz,
  rating float, user_ratings_total int, opening_hours jsonb,
  distance_miles float
) language sql stable as $$
  select
    id, google_place_id, name, address, city, state, zip, phone, website, lat, lng,
    is_waypass_network, waypass_tier, last_verified_at,
    rating, user_ratings_total, opening_hours,
    round((st_distance(location, st_point(user_lng, user_lat)::geography) / 1609.34)::numeric, 2)::float as distance_miles
  from shipping_partners_db
  where
    needs_review = false
    and st_dwithin(location, st_point(user_lng, user_lat)::geography, radius_m)
  order by distance_miles;
$$;
