-- Harden the shipping-partner objects: pin search_path on the helper
-- functions, and add ownership-based RLS policies parallel to the
-- crematoriums_db pattern. Backend uses the service-role key (which
-- bypasses RLS), so these policies only gate direct PostgREST client
-- access via anon/authenticated.

ALTER FUNCTION public.sync_shipping_partner_location() SET search_path = public, pg_catalog;
ALTER FUNCTION public.nearby_shipping_partners(double precision, double precision, double precision)
  SET search_path = public, pg_catalog;

-- shipping_partners_db: authenticated read-only (mirrors crematoriums_db)
DROP POLICY IF EXISTS "auth shipping_partners_db select" ON public.shipping_partners_db;
CREATE POLICY "auth shipping_partners_db select"
  ON public.shipping_partners_db
  FOR SELECT
  TO authenticated
  USING (true);

-- shipping_partners: scoped by connected_funeral_home_ids membership
DROP POLICY IF EXISTS "auth shipping_partners select connected" ON public.shipping_partners;
CREATE POLICY "auth shipping_partners select connected"
  ON public.shipping_partners
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND connected_funeral_home_ids @> ARRAY[auth.uid()::text]
  );

DROP POLICY IF EXISTS "auth shipping_partners insert self" ON public.shipping_partners;
CREATE POLICY "auth shipping_partners insert self"
  ON public.shipping_partners
  FOR INSERT
  TO authenticated
  WITH CHECK (connected_funeral_home_ids @> ARRAY[auth.uid()::text]);

DROP POLICY IF EXISTS "auth shipping_partners update connected" ON public.shipping_partners;
CREATE POLICY "auth shipping_partners update connected"
  ON public.shipping_partners
  FOR UPDATE
  TO authenticated
  USING (connected_funeral_home_ids @> ARRAY[auth.uid()::text])
  WITH CHECK (connected_funeral_home_ids @> ARRAY[auth.uid()::text]);

DROP POLICY IF EXISTS "auth shipping_partners delete connected" ON public.shipping_partners;
CREATE POLICY "auth shipping_partners delete connected"
  ON public.shipping_partners
  FOR DELETE
  TO authenticated
  USING (connected_funeral_home_ids @> ARRAY[auth.uid()::text]);
