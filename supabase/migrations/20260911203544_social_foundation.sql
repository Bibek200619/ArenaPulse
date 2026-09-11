SET local check_function_bodies = off;

CREATE TABLE "private"."social_write_limits" (
  "user_id"   uuid                     NOT NULL,
  "scope"     text                     NOT NULL,
  "resets_at" timestamp with time zone NOT NULL,
  "used"      integer                  NOT NULL,
  CONSTRAINT "social_write_limits_pkey" PRIMARY KEY (user_id, scope),
  CONSTRAINT "social_write_limits_used_check" CHECK ((used > 0))
);

ALTER TABLE "private"."social_write_limits"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."comments" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "post_id"    uuid                     NOT NULL,
  "author_id"  uuid                     NOT NULL,
  "parent_id"  uuid,
  "body"       text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "comments_body_check" CHECK (((length(btrim(body)) >= 1) AND (length(btrim(body)) <= 1000))),
  CONSTRAINT "comments_check" CHECK ((parent_id IS DISTINCT FROM id)),
  CONSTRAINT "comments_id_post_id_key" UNIQUE (id, post_id),
  CONSTRAINT "comments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."comments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."posts" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "author_id"  uuid                     NOT NULL,
  "body"       text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "posts_body_check" CHECK (((length(btrim(body)) >= 1) AND (length(btrim(body)) <= 2000))),
  CONSTRAINT "posts_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."posts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."reactions" (
  "post_id"    uuid                     NOT NULL,
  "user_id"    uuid                     NOT NULL,
  "kind"       text                     NOT NULL DEFAULT 'like'::text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "reactions_kind_check" CHECK ((kind = 'like'::text)),
  CONSTRAINT "reactions_pkey" PRIMARY KEY (post_id, user_id)
);

ALTER TABLE "public"."reactions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_follows" (
  "follower_id" uuid                     NOT NULL,
  "followed_id" uuid                     NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_follows_check" CHECK ((follower_id <> followed_id)),
  CONSTRAINT "user_follows_pkey" PRIMARY KEY (follower_id, followed_id)
);

ALTER TABLE "public"."user_follows"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.check_comment_parent()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
 if new.parent_id is not null and not exists(select 1 from public.comments c where c.id=new.parent_id and c.post_id=new.post_id) then
  raise exception 'Reply target is unavailable' using errcode='42501';
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION private.check_social_write_limit()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare actor uuid := auth.uid(); current_used integer;
begin
 if actor is null or actor is distinct from (to_jsonb(new)->>TG_ARGV[0])::uuid then raise exception 'Authentication required' using errcode='42501'; end if;
 insert into private.social_write_limits(user_id,scope,resets_at,used) values(actor,TG_TABLE_NAME,clock_timestamp()+interval '1 minute',1)
 on conflict(user_id,scope) do update set
 used=case when private.social_write_limits.resets_at <= clock_timestamp() then 1 else private.social_write_limits.used+1 end,
 resets_at=case when private.social_write_limits.resets_at <= clock_timestamp() then clock_timestamp()+interval '1 minute' else private.social_write_limits.resets_at end
 returning used into current_used;
 if current_used > TG_ARGV[1]::integer then raise exception 'Social write limit reached' using errcode='P0001'; end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION private.sports_follower_count (
  p_kind text,
  p_id   uuid
)
  RETURNS bigint
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 case p_kind
 when 'team' then return (select count(*) from public.team_follows where team_id=p_id);
 when 'player' then return (select count(*) from public.player_follows where player_id=p_id);
 when 'competition' then return (select count(*) from public.competition_follows where competition_id=p_id);
 else raise exception 'Invalid entity kind' using errcode='22023';
 end case;
end $function$;

CREATE OR REPLACE FUNCTION public.sports_follower_count (
  p_kind text,
  p_id   uuid
)
  RETURNS bigint
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$ select private.sports_follower_count(p_kind,p_id) $function$;

ALTER TABLE "private"."social_write_limits"
  ADD CONSTRAINT "social_write_limits_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."comments"
  ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."comments"
  ADD CONSTRAINT "comments_parent_id_post_id_fkey" FOREIGN KEY (parent_id, post_id) REFERENCES public.comments(id, post_id) ON DELETE CASCADE;

ALTER TABLE "public"."posts"
  ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."comments"
  ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE "public"."reactions"
  ADD CONSTRAINT "reactions_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE "public"."reactions"
  ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_follows"
  ADD CONSTRAINT "user_follows_followed_id_fkey" FOREIGN KEY (followed_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_follows"
  ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX comments_author_idx ON public.comments USING btree (author_id);

CREATE INDEX comments_parent_idx ON public.comments USING btree (parent_id, post_id);

CREATE INDEX comments_post_created_idx ON public.comments USING btree (post_id, created_at, id);

CREATE INDEX posts_author_created_idx ON public.posts USING btree (author_id, created_at DESC, id DESC);

CREATE INDEX posts_created_idx ON public.posts USING btree (created_at DESC, id DESC);

CREATE INDEX reactions_user_idx ON public.reactions USING btree (user_id);

CREATE INDEX user_follows_followed_idx ON public.user_follows USING btree (followed_id);

CREATE TRIGGER comments_reply_check
  BEFORE INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION private.check_comment_parent();

CREATE TRIGGER comments_write_limit
  BEFORE INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION private.check_social_write_limit('author_id', '30');

CREATE TRIGGER posts_touch
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER posts_write_limit
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION private.check_social_write_limit('author_id', '10');

CREATE TRIGGER reactions_write_limit
  BEFORE INSERT ON public.reactions
  FOR EACH ROW
  EXECUTE FUNCTION private.check_social_write_limit('user_id', '60');

CREATE TRIGGER follows_write_limit
  BEFORE INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION private.check_social_write_limit('follower_id', '30');

CREATE POLICY "comments_owner_delete" ON "public"."comments"
  FOR DELETE
  TO "authenticated"
  USING ((author_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "comments_owner_insert" ON "public"."comments"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((author_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.posts p
  WHERE (p.id = comments.post_id)))));

CREATE POLICY "comments_visible" ON "public"."comments"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((author_id = ( SELECT auth.uid() AS uid)) OR ((EXISTS ( SELECT 1
   FROM public.posts p
  WHERE (p.id = comments.post_id))) AND (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = comments.author_id) AND (NOT p.is_private)))))));

CREATE POLICY "posts_owner_delete" ON "public"."posts"
  FOR DELETE
  TO "authenticated"
  USING ((author_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "posts_owner_insert" ON "public"."posts"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((author_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "posts_owner_update" ON "public"."posts"
  FOR UPDATE
  TO "authenticated"
  USING ((author_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((author_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "posts_visible" ON "public"."posts"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((author_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = posts.author_id) AND (NOT p.is_private))))));

CREATE POLICY "reactions_owner_delete" ON "public"."reactions"
  FOR DELETE
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "reactions_owner_insert" ON "public"."reactions"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.posts p
  WHERE (p.id = reactions.post_id)))));

CREATE POLICY "reactions_visible" ON "public"."reactions"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR ((EXISTS ( SELECT 1
   FROM public.posts p
  WHERE (p.id = reactions.post_id))) AND (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = reactions.user_id) AND (NOT p.is_private)))))));

CREATE POLICY "user_follows_owner_delete" ON "public"."user_follows"
  FOR DELETE
  TO "authenticated"
  USING ((follower_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "user_follows_owner_insert" ON "public"."user_follows"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((follower_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = user_follows.followed_id) AND (NOT p.is_private))))));

CREATE POLICY "user_follows_visible" ON "public"."user_follows"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((follower_id = ( SELECT auth.uid() AS uid)) OR ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = user_follows.follower_id) AND (NOT p.is_private)))) AND (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = user_follows.followed_id) AND (NOT p.is_private)))))));

REVOKE ALL ON FUNCTION "private"."check_comment_parent"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."check_comment_parent"() TO "postgres";

REVOKE ALL ON FUNCTION "private"."check_social_write_limit"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."check_social_write_limit"() TO "postgres";

REVOKE ALL ON FUNCTION "private"."sports_follower_count"(text, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."sports_follower_count"(text, uuid) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "public"."sports_follower_count"(text, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sports_follower_count"(text, uuid) TO "authenticated", "postgres";

REVOKE ALL ON SCHEMA "private" FROM "authenticated";

GRANT USAGE ON SCHEMA "private" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "private"."social_write_limits" TO "postgres";

REVOKE ALL ON TABLE "public"."comments" FROM "anon";

GRANT SELECT ON TABLE "public"."comments" TO "anon";

REVOKE ALL ("author_id") ON TABLE "public"."comments" FROM "authenticated";

GRANT INSERT ("author_id") ON TABLE "public"."comments" TO "authenticated";

REVOKE ALL ("body") ON TABLE "public"."comments" FROM "authenticated";

GRANT INSERT ("body") ON TABLE "public"."comments" TO "authenticated";

REVOKE ALL ("parent_id") ON TABLE "public"."comments" FROM "authenticated";

GRANT INSERT ("parent_id") ON TABLE "public"."comments" TO "authenticated";

REVOKE ALL ("post_id") ON TABLE "public"."comments" FROM "authenticated";

GRANT INSERT ("post_id") ON TABLE "public"."comments" TO "authenticated";

REVOKE ALL ON TABLE "public"."comments" FROM "authenticated";

GRANT DELETE, SELECT ON TABLE "public"."comments" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."comments" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."posts" FROM "anon";

GRANT SELECT ON TABLE "public"."posts" TO "anon";

REVOKE ALL ("author_id") ON TABLE "public"."posts" FROM "authenticated";

GRANT INSERT ("author_id") ON TABLE "public"."posts" TO "authenticated";

REVOKE ALL ("body") ON TABLE "public"."posts" FROM "authenticated";

GRANT INSERT ("body"), UPDATE ("body") ON TABLE "public"."posts" TO "authenticated";

REVOKE ALL ON TABLE "public"."posts" FROM "authenticated";

GRANT DELETE, SELECT ON TABLE "public"."posts" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."posts" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."reactions" FROM "anon";

GRANT SELECT ON TABLE "public"."reactions" TO "anon";

REVOKE ALL ("post_id") ON TABLE "public"."reactions" FROM "authenticated";

GRANT INSERT ("post_id") ON TABLE "public"."reactions" TO "authenticated";

REVOKE ALL ("user_id") ON TABLE "public"."reactions" FROM "authenticated";

GRANT INSERT ("user_id") ON TABLE "public"."reactions" TO "authenticated";

REVOKE ALL ON TABLE "public"."reactions" FROM "authenticated";

GRANT DELETE, SELECT ON TABLE "public"."reactions" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reactions" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."user_follows" FROM "anon";

GRANT SELECT ON TABLE "public"."user_follows" TO "anon";

REVOKE ALL ("followed_id") ON TABLE "public"."user_follows" FROM "authenticated";

GRANT INSERT ("followed_id") ON TABLE "public"."user_follows" TO "authenticated";

REVOKE ALL ("follower_id") ON TABLE "public"."user_follows" FROM "authenticated";

GRANT INSERT ("follower_id") ON TABLE "public"."user_follows" TO "authenticated";

REVOKE ALL ON TABLE "public"."user_follows" FROM "authenticated";

GRANT DELETE, SELECT ON TABLE "public"."user_follows" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_follows" TO "postgres", "service_role";

-- Final ACL baseline: pg-delta emits table revokes after column grants.
-- Reassert least privilege after all generated statements and default privileges.
revoke all on public.posts,public.comments,public.reactions,public.user_follows from anon,authenticated;
grant select on public.posts,public.comments,public.reactions,public.user_follows to anon,authenticated;
grant insert(author_id,body) on public.posts to authenticated;
grant update(body) on public.posts to authenticated;
grant insert(author_id,post_id,parent_id,body) on public.comments to authenticated;
grant insert(post_id,user_id) on public.reactions to authenticated;
grant insert(follower_id,followed_id) on public.user_follows to authenticated;
grant delete on public.posts,public.comments,public.reactions,public.user_follows to authenticated;
grant all on public.posts,public.comments,public.reactions,public.user_follows to service_role;


revoke all on private.social_write_limits from public,anon,authenticated,service_role;
revoke all on function private.check_comment_parent() from public,anon,authenticated,service_role;
revoke all on function private.check_social_write_limit() from public,anon,authenticated,service_role;
revoke all on function private.sports_follower_count(text,uuid) from public,anon,authenticated,service_role;
revoke all on function public.sports_follower_count(text,uuid) from public,anon,authenticated,service_role;
grant execute on function private.sports_follower_count(text,uuid) to authenticated;
grant execute on function public.sports_follower_count(text,uuid) to authenticated;
