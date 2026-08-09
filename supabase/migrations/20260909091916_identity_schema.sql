SET local check_function_bodies = off;

CREATE SCHEMA "private";

CREATE TABLE "public"."profile_preferences" (
  "user_id"              uuid                     NOT NULL,
  "favorite_sports"      text[]                   NOT NULL DEFAULT '{}'::text[],
  "onboarding_completed" boolean                  NOT NULL DEFAULT false,
  "updated_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profile_preferences_favorite_sports_check"
    CHECK (((cardinality(favorite_sports) <= 5) AND (favorite_sports <@ ARRAY['football'::text, 'cricket'::text, 'basketball'::text, 'tennis'::text, 'motorsport'::text]))),
  CONSTRAINT "profile_preferences_pkey" PRIMARY KEY (user_id)
);

ALTER TABLE "public"."profile_preferences"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"           uuid                     NOT NULL,
  "username"     text                     NOT NULL,
  "display_name" text                     NOT NULL,
  "bio"          text                     NOT NULL DEFAULT ''::text,
  "country"      text                     NOT NULL DEFAULT ''::text,
  "avatar_url"   text,
  "is_private"   boolean                  NOT NULL DEFAULT false,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_bio_check" CHECK ((char_length(bio) <= 280)),
  CONSTRAINT "profiles_country_check" CHECK ((char_length(country) <= 60)),
  CONSTRAINT "profiles_display_name_check" CHECK (((char_length(btrim(display_name)) >= 1) AND (char_length(btrim(display_name)) <= 60))),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_username_check" CHECK ((username ~ '^[a-z][a-z0-9_]{2,23}$'::text)),
  CONSTRAINT "profiles_username_key" UNIQUE (username)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.touch_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$ begin new.updated_at = now(); return new; end; $function$;

CREATE OR REPLACE FUNCTION public.save_profile (
  p_username        text,
  p_display_name    text,
  p_bio             text,
  p_country         text,
  p_favorite_sports text[],
  p_is_private      boolean
)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
 insert into public.profiles (id, username, display_name, bio, country, is_private)
 values (auth.uid(), lower(btrim(p_username)), btrim(p_display_name), btrim(p_bio), btrim(p_country), p_is_private)
 on conflict (id) do update set username = excluded.username, display_name = excluded.display_name, bio = excluded.bio, country = excluded.country, is_private = excluded.is_private;
 insert into public.profile_preferences (user_id, favorite_sports, onboarding_completed)
 values (auth.uid(), p_favorite_sports, true)
 on conflict (user_id) do update set favorite_sports = excluded.favorite_sports, onboarding_completed = true;
end; $function$;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."profile_preferences"
  ADD CONSTRAINT "profile_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TRIGGER preferences_updated
  BEFORE UPDATE ON public.profile_preferences
  FOR EACH ROW
  EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.touch_updated_at();

CREATE POLICY "preferences_create" ON "public"."profile_preferences"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "preferences_edit" ON "public"."profile_preferences"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "preferences_read" ON "public"."profile_preferences"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "profiles_create" ON "public"."profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "profiles_edit" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "profiles_read" ON "public"."profiles"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((NOT is_private) OR (id = ( SELECT auth.uid() AS uid))));

REVOKE ALL ON FUNCTION "private"."touch_updated_at"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."touch_updated_at"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."save_profile"(text, text, text, text, text[], boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."save_profile"(text, text, text, text, text[], boolean) TO "authenticated", "postgres", "service_role";

GRANT CREATE, USAGE ON SCHEMA "private" TO "postgres";

REVOKE ALL ON TABLE "public"."profile_preferences" FROM "authenticated";

GRANT INSERT, SELECT, UPDATE ON TABLE "public"."profile_preferences" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profile_preferences" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM "anon";

GRANT SELECT ON TABLE "public"."profiles" TO "anon";

REVOKE ALL ("bio") ON TABLE "public"."profiles" FROM "authenticated";

GRANT INSERT ("bio"), UPDATE ("bio") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ("country") ON TABLE "public"."profiles" FROM "authenticated";

GRANT INSERT ("country"), UPDATE ("country") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ("display_name") ON TABLE "public"."profiles" FROM "authenticated";

GRANT INSERT ("display_name"), UPDATE ("display_name") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ("id") ON TABLE "public"."profiles" FROM "authenticated";

GRANT INSERT ("id") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ("is_private") ON TABLE "public"."profiles" FROM "authenticated";

GRANT INSERT ("is_private"), UPDATE ("is_private") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ("username") ON TABLE "public"."profiles" FROM "authenticated";

GRANT INSERT ("username"), UPDATE ("username") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres", "service_role";


-- Explicit ACL baseline: the schema diff must not inherit local/default grants.
revoke all on public.profiles, public.profile_preferences from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert (id, username, display_name, bio, country, is_private), update (username, display_name, bio, country, is_private) on public.profiles to authenticated;
grant select, insert, update on public.profile_preferences to authenticated;
revoke all on function public.save_profile(text,text,text,text,text[],boolean) from public, anon;
grant execute on function public.save_profile(text,text,text,text,text[],boolean) to authenticated;
