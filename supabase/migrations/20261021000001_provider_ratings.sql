-- Customer ratings, compatible with the existing live RPC contract.
CREATE TABLE IF NOT EXISTS public.provider_ratings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
 customer_id uuid NOT NULL REFERENCES public.profiles(id),
 provider_id uuid NOT NULL REFERENCES public.profiles(id),
 stars integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
 comment text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_ratings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.provider_ratings FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.submit_provider_rating_v1(p_booking_id uuid,p_stars integer,p_comment text DEFAULT NULL)
RETURNS public.provider_ratings LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE b public.bookings; r public.provider_ratings;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'login required'; END IF;
 IF p_stars<1 OR p_stars>5 THEN RAISE EXCEPTION 'rating must be 1 to 5'; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=p_booking_id FOR UPDATE;
 IF b.id IS NULL OR b.customer_id<>auth.uid() THEN RAISE EXCEPTION 'customer booking required'; END IF;
 IF b.provider_id IS NULL THEN RAISE EXCEPTION 'provider missing'; END IF;
 IF b.status NOT IN ('completed','done','cancelled_settled') THEN RAISE EXCEPTION 'rating allowed after closed booking'; END IF;
 IF lower(btrim(coalesce(b.category,'')))='tempo / goods transport' AND b.status NOT IN ('completed','done') THEN
   RAISE EXCEPTION 'Transport rating allowed only after completed trip';
 END IF;
 INSERT INTO public.provider_ratings(booking_id,customer_id,provider_id,stars,comment,updated_at)
 VALUES(b.id,b.customer_id,b.provider_id,p_stars,nullif(left(btrim(coalesce(p_comment,'')),1000),''),now())
 ON CONFLICT(booking_id) DO UPDATE SET stars=excluded.stars,comment=excluded.comment,updated_at=now()
 RETURNING * INTO r;
 RETURN r;
END;
$function$;
CREATE OR REPLACE FUNCTION public.provider_rating_summary_v1(p_provider_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_provider uuid:=coalesce(p_provider_id,auth.uid()); v_avg numeric; v_count bigint; v_rows jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'login required'; END IF;
 SELECT round(avg(stars)::numeric,2),count(*) INTO v_avg,v_count
 FROM public.provider_ratings WHERE provider_id=v_provider;
 SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC),'[]'::jsonb) INTO v_rows
 FROM (
 SELECT r.id,r.booking_id,r.stars,r.comment,r.created_at,coalesce(p.full_name,'Customer') AS customer_name
 FROM public.provider_ratings r LEFT JOIN public.profiles p ON p.id=r.customer_id
 WHERE r.provider_id=v_provider ORDER BY r.created_at DESC LIMIT 20
 ) x;
 RETURN jsonb_build_object('provider_id',v_provider,'average',coalesce(v_avg,0),'count',v_count,'ratings',v_rows);
END;
$function$;
REVOKE ALL ON FUNCTION public.submit_provider_rating_v1(uuid,integer,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.provider_rating_summary_v1(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_provider_rating_v1(uuid,integer,text) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.provider_rating_summary_v1(uuid) TO authenticated,service_role;
