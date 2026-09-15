SET local check_function_bodies = off;

CREATE TABLE "public"."communities" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"           text                     NOT NULL,
  "slug"           text                     NOT NULL,
  "description"    text                     NOT NULL DEFAULT ''::text,
  "rules"          text                     NOT NULL DEFAULT ''::text,
  "visibility"     text                     NOT NULL,
  "owner_id"       uuid                     NOT NULL,
  "sport_id"       uuid,
  "team_id"        uuid,
  "competition_id" uuid,
  "image_url"      text,
  "banner_url"     text,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "communities_check" CHECK ((((team_id IS NULL) AND (competition_id IS NULL)) OR (sport_id IS NOT NULL))),
  CONSTRAINT "communities_description_check" CHECK ((length(description) <= 1500)),
  CONSTRAINT "communities_name_check" CHECK (((length(btrim(name)) >= 3) AND (length(btrim(name)) <= 80))),
  CONSTRAINT "communities_pkey" PRIMARY KEY (id),
  CONSTRAINT "communities_rules_check" CHECK ((length(rules) <= 3000)),
  CONSTRAINT "communities_slug_check" CHECK (((slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text) AND ((length(slug) >= 3) AND (length(slug) <= 60)))),
  CONSTRAINT "communities_slug_key" UNIQUE (slug),
  CONSTRAINT "communities_visibility_check" CHECK ((visibility = ANY (ARRAY['public'::text, 'private'::text])))
);

ALTER TABLE "public"."communities"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."community_audit" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "community_id" uuid                     NOT NULL,
  "actor_id"     uuid,
  "target_id"    uuid,
  "action"       text                     NOT NULL,
  "detail"       text                     NOT NULL DEFAULT ''::text,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "community_audit_action_check"
    CHECK
    ((action = ANY (ARRAY['create'::text, 'join'::text, 'request'::text, 'cancel-request'::text, 'leave'::text, 'approve'::text, 'reject'::text, 'role'::text, 'ban'::text,
    'unban'::text, 'transfer'::text]))),
  CONSTRAINT "community_audit_detail_check" CHECK ((length(detail) <= 500)),
  CONSTRAINT "community_audit_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."community_audit"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."community_bans" (
  "community_id" uuid                     NOT NULL,
  "user_id"      uuid                     NOT NULL,
  "reason"       text                     NOT NULL,
  "banned_by"    uuid,
  "issuer_rank"  smallint                 NOT NULL,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "community_bans_issuer_rank_check" CHECK (((issuer_rank >= 2) AND (issuer_rank <= 4))),
  CONSTRAINT "community_bans_pkey" PRIMARY KEY (community_id, user_id),
  CONSTRAINT "community_bans_reason_check" CHECK (((length(btrim(reason)) >= 1) AND (length(btrim(reason)) <= 500)))
);

ALTER TABLE "public"."community_bans"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."community_join_requests" (
  "community_id" uuid                     NOT NULL,
  "user_id"      uuid                     NOT NULL,
  "status"       text                     NOT NULL DEFAULT 'pending'::text,
  "requested_at" timestamp with time zone NOT NULL DEFAULT now(),
  "resolved_at"  timestamp with time zone,
  CONSTRAINT "community_join_requests_check" CHECK (((status = 'pending'::text) = (resolved_at IS NULL))),
  CONSTRAINT "community_join_requests_pkey" PRIMARY KEY (community_id, user_id),
  CONSTRAINT "community_join_requests_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);

ALTER TABLE "public"."community_join_requests"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."community_members" (
  "community_id" uuid                     NOT NULL,
  "user_id"      uuid                     NOT NULL,
  "role"         text                     NOT NULL,
  "joined_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "community_members_pkey" PRIMARY KEY (community_id, user_id),
  CONSTRAINT "community_members_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text, 'member'::text])))
);

ALTER TABLE "public"."community_members"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.community_rank (
  p_role text
)
  RETURNS smallint
  LANGUAGE sql
  IMMUTABLE
  SET search_path TO ''
  AS $function$
 select case p_role when 'owner' then 4 when 'admin' then 3 when 'moderator' then 2 when 'member' then 1 else 0 end::smallint
$function$;

CREATE OR REPLACE FUNCTION private.community_role (
  p_id uuid
)
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
 select m.role from public.community_members m where m.community_id=p_id and m.user_id=auth.uid()
 and not exists(select 1 from public.community_bans b where b.community_id=p_id and b.user_id=auth.uid())
$function$;

CREATE OR REPLACE FUNCTION private.community_transition (
  p_id     uuid,
  p_action text,
  p_target uuid,
  p_role   text,
  p_reason text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare actor uuid:=auth.uid(); group_row public.communities%rowtype; actor_role text; actor_rank smallint; target_role text; target_rank smallint; affected integer; result text;
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor) then raise exception 'Complete your profile first' using errcode='42501'; end if;
 select * into group_row from public.communities where id=p_id for update;
 if not found then raise exception 'Community unavailable' using errcode='42501'; end if;
 actor_role:=private.community_role(p_id); actor_rank:=private.community_rank(actor_role);
 if exists(select 1 from public.community_bans where community_id=p_id and user_id=actor) then raise exception 'Participation is unavailable' using errcode='42501'; end if;
 perform private.consume_community_budget('community_transition',30);
 if p_action='join' then
  if actor_role is not null then return 'joined'; end if;
  if group_row.visibility='public' then
   insert into public.community_members(community_id,user_id,role) values(p_id,actor,'member');
   insert into public.community_audit(community_id,actor_id,target_id,action) values(p_id,actor,actor,'join');
   return 'joined';
  end if;
  insert into public.community_join_requests(community_id,user_id) values(p_id,actor)
  on conflict(community_id,user_id) do update set status='pending',requested_at=now(),resolved_at=null where public.community_join_requests.status<>'pending';
  get diagnostics affected=row_count;
  if affected>0 then insert into public.community_audit(community_id,actor_id,target_id,action) values(p_id,actor,actor,'request'); end if;
  return 'requested';
 elsif p_action='cancel-request' then
  delete from public.community_join_requests where community_id=p_id and user_id=actor and status='pending';
  get diagnostics affected=row_count;
  if affected>0 then insert into public.community_audit(community_id,actor_id,target_id,action) values(p_id,actor,actor,'cancel-request'); end if;
  return 'cancelled';
 elsif p_action='leave' then
  if actor_role='owner' then raise exception 'Transfer ownership before leaving' using errcode='23514'; end if;
  delete from public.community_members where community_id=p_id and user_id=actor;
  get diagnostics affected=row_count;
  if affected>0 then insert into public.community_audit(community_id,actor_id,target_id,action) values(p_id,actor,actor,'leave'); end if;
  return 'left';
 end if;
 if actor_rank<2 then raise exception 'Staff permission required' using errcode='42501'; end if;
 if p_target is null or not exists(select 1 from public.profiles where id=p_target) then raise exception 'Invalid member' using errcode='23514'; end if;
 select role into target_role from public.community_members where community_id=p_id and user_id=p_target;
 target_rank:=private.community_rank(target_role);
 if p_action in ('approve','reject') then
  if not exists(select 1 from public.community_join_requests where community_id=p_id and user_id=p_target and status='pending') then raise exception 'No pending request' using errcode='23514'; end if;
  if exists(select 1 from public.community_bans where community_id=p_id and user_id=p_target) then raise exception 'Member is banned' using errcode='42501'; end if;
  if p_action='approve' then insert into public.community_members(community_id,user_id,role) values(p_id,p_target,'member'); end if;
  update public.community_join_requests set status=case when p_action='approve' then 'approved' else 'rejected' end,resolved_at=now() where community_id=p_id and user_id=p_target;
  result:=case when p_action='approve' then 'approved' else 'rejected' end;
 elsif p_action='role' then
  if actor_rank<3 or target_rank=0 or target_rank>=actor_rank or p_role not in ('admin','moderator','member') or p_role is null or private.community_rank(p_role)>=actor_rank then raise exception 'Role change is not permitted' using errcode='42501'; end if;
  update public.community_members set role=p_role where community_id=p_id and user_id=p_target;
  result:='role_updated';
 elsif p_action='transfer' then
  if actor_role<>'owner' or group_row.owner_id<>actor or target_rank=0 or p_target=actor then raise exception 'Ownership transfer is not permitted' using errcode='42501'; end if;
  update public.community_members set role='admin' where community_id=p_id and user_id=actor;
  update public.community_members set role='owner' where community_id=p_id and user_id=p_target;
  update public.communities set owner_id=p_target where id=p_id;
  result:='transferred';
 elsif p_action='ban' then
  if p_target=actor or p_target=group_row.owner_id or target_rank>=actor_rank then raise exception 'Cannot ban this member' using errcode='42501'; end if;
  if p_reason is null or length(btrim(p_reason)) not between 1 and 500 then raise exception 'A bounded reason is required' using errcode='23514'; end if;
  if exists(select 1 from public.community_bans where community_id=p_id and user_id=p_target and issuer_rank>actor_rank) then raise exception 'Cannot override this ban' using errcode='42501'; end if;
  insert into public.community_bans(community_id,user_id,reason,banned_by,issuer_rank) values(p_id,p_target,btrim(p_reason),actor,actor_rank)
  on conflict(community_id,user_id) do update set reason=excluded.reason,banned_by=excluded.banned_by,issuer_rank=excluded.issuer_rank,created_at=now();
  delete from public.community_members where community_id=p_id and user_id=p_target;
  delete from public.community_join_requests where community_id=p_id and user_id=p_target;
  result:='banned';
 elsif p_action='unban' then
  if not exists(select 1 from public.community_bans where community_id=p_id and user_id=p_target) then raise exception 'No ban exists' using errcode='23514'; end if;
  if exists(select 1 from public.community_bans where community_id=p_id and user_id=p_target and issuer_rank>actor_rank) then raise exception 'Cannot override this ban' using errcode='42501'; end if;
  delete from public.community_bans where community_id=p_id and user_id=p_target;
  result:='unbanned';
 else raise exception 'Unknown community action' using errcode='23514';
 end if;
 insert into public.community_audit(community_id,actor_id,target_id,action,detail) values(p_id,actor,p_target,p_action,case when p_action='role' then p_role when p_action='ban' then btrim(p_reason) else '' end);
 return result;
end $function$;

CREATE OR REPLACE FUNCTION private.consume_community_budget (
  p_scope text,
  p_limit integer
)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare used_now integer;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 insert into private.social_write_limits(user_id,scope,resets_at,used) values(auth.uid(),p_scope,clock_timestamp()+interval '1 minute',1)
 on conflict(user_id,scope) do update set
 used=case when private.social_write_limits.resets_at <= clock_timestamp() then 1 else private.social_write_limits.used+1 end,
 resets_at=case when private.social_write_limits.resets_at <= clock_timestamp() then clock_timestamp()+interval '1 minute' else private.social_write_limits.resets_at end
 returning used into used_now;
 if used_now>p_limit then raise exception 'Community write limit reached' using errcode='P0001'; end if;
end $function$;

CREATE OR REPLACE FUNCTION private.create_community (
  p_name           text,
  p_slug           text,
  p_description    text,
  p_rules          text,
  p_visibility     text,
  p_sport_id       uuid,
  p_team_id        uuid,
  p_competition_id uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare actor uuid:=auth.uid(); result uuid;
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor) then raise exception 'Complete your profile first' using errcode='42501'; end if;
 perform private.consume_community_budget('community_create',3);
 insert into public.communities(name,slug,description,rules,visibility,owner_id,sport_id,team_id,competition_id)
 values(btrim(p_name),lower(btrim(p_slug)),p_description,p_rules,p_visibility,actor,p_sport_id,p_team_id,p_competition_id) returning id into result;
 insert into public.community_members(community_id,user_id,role) values(result,actor,'owner');
 insert into public.community_audit(community_id,actor_id,target_id,action) values(result,actor,actor,'create');
 return result;
end $function$;

CREATE OR REPLACE FUNCTION public.community_transition (
  p_id     uuid,
  p_action text,
  p_target uuid DEFAULT NULL::uuid,
  p_role   text DEFAULT NULL::text,
  p_reason text DEFAULT NULL::text
)
  RETURNS text
  LANGUAGE sql
  SET search_path TO ''
  AS $function$ select private.community_transition(p_id,p_action,p_target,p_role,p_reason) $function$;

CREATE OR REPLACE FUNCTION public.create_community (
  p_name           text,
  p_slug           text,
  p_description    text DEFAULT ''::text,
  p_rules          text DEFAULT ''::text,
  p_visibility     text DEFAULT 'public'::text,
  p_sport_id       uuid DEFAULT NULL::uuid,
  p_team_id        uuid DEFAULT NULL::uuid,
  p_competition_id uuid DEFAULT NULL::uuid
)
  RETURNS uuid
  LANGUAGE sql
  SET search_path TO ''
  AS $function$ select private.create_community(p_name,p_slug,p_description,p_rules,p_visibility,p_sport_id,p_team_id,p_competition_id) $function$;

ALTER TABLE "public"."communities"
  ADD CONSTRAINT "communities_competition_id_sport_id_fkey" FOREIGN KEY (competition_id, sport_id) REFERENCES public.competitions(id, sport_id);

ALTER TABLE "public"."communities"
  ADD CONSTRAINT "communities_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."communities"
  ADD CONSTRAINT "communities_sport_id_fkey" FOREIGN KEY (sport_id) REFERENCES public.sports(id);

ALTER TABLE "public"."communities"
  ADD CONSTRAINT "communities_team_id_sport_id_fkey" FOREIGN KEY (team_id, sport_id) REFERENCES public.teams(id, sport_id);

ALTER TABLE "public"."community_audit"
  ADD CONSTRAINT "community_audit_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."community_audit"
  ADD CONSTRAINT "community_audit_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

ALTER TABLE "public"."community_audit"
  ADD CONSTRAINT "community_audit_target_id_fkey" FOREIGN KEY (target_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."community_bans"
  ADD CONSTRAINT "community_bans_banned_by_fkey" FOREIGN KEY (banned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."community_bans"
  ADD CONSTRAINT "community_bans_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

ALTER TABLE "public"."community_bans"
  ADD CONSTRAINT "community_bans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."community_join_requests"
  ADD CONSTRAINT "community_join_requests_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

ALTER TABLE "public"."community_join_requests"
  ADD CONSTRAINT "community_join_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."community_members"
  ADD CONSTRAINT "community_members_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

ALTER TABLE "public"."community_members"
  ADD CONSTRAINT "community_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX communities_competition_idx ON public.communities USING btree (competition_id, sport_id);

CREATE INDEX communities_owner_idx ON public.communities USING btree (owner_id);

CREATE INDEX communities_public_created_idx ON public.communities USING btree (created_at DESC, id DESC)
  WHERE (visibility = 'public'::text);

CREATE INDEX communities_sport_idx ON public.communities USING btree (sport_id);

CREATE INDEX communities_team_idx ON public.communities USING btree (team_id, sport_id);

CREATE INDEX community_audit_actor_idx ON public.community_audit USING btree (actor_id);

CREATE INDEX community_audit_recent_idx ON public.community_audit USING btree (community_id, created_at DESC, id DESC);

CREATE INDEX community_audit_target_idx ON public.community_audit USING btree (target_id);

CREATE INDEX community_bans_actor_idx ON public.community_bans USING btree (banned_by);

CREATE INDEX community_bans_user_idx ON public.community_bans USING btree (user_id);

CREATE INDEX community_members_user_idx ON public.community_members USING btree (user_id, community_id);

CREATE UNIQUE INDEX community_one_owner_idx ON public.community_members USING btree (community_id)
  WHERE (ROLE = 'owner'::text);

CREATE INDEX community_requests_pending_idx ON public.community_join_requests USING btree (community_id, requested_at)
  WHERE (status = 'pending'::text);

CREATE INDEX community_requests_user_idx ON public.community_join_requests USING btree (user_id);

CREATE TRIGGER communities_touch
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION private.touch_updated_at();

CREATE POLICY "communities_visible" ON "public"."communities"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((visibility = 'public'::text) OR (private.community_role(id) IS NOT NULL)));

CREATE POLICY "community_audit_staff" ON "public"."community_audit"
  FOR SELECT
  TO "authenticated"
  USING ((private.community_role(community_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text])));

CREATE POLICY "community_bans_visible" ON "public"."community_bans"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR (private.community_role(community_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text]))));

CREATE POLICY "community_requests_visible" ON "public"."community_join_requests"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR (private.community_role(community_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text]))));

CREATE POLICY "community_members_visible" ON "public"."community_members"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR (private.community_role(community_id) IS NOT NULL)));

REVOKE ALL ON FUNCTION "private"."community_rank"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."community_rank"(text) TO "postgres";

REVOKE ALL ON FUNCTION "private"."community_role"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."community_role"(uuid) TO "anon", "authenticated", "postgres";

REVOKE ALL ON FUNCTION "private"."community_transition"(uuid, text, uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."community_transition"(uuid, text, uuid, text, text) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "private"."consume_community_budget"(text, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."consume_community_budget"(text, integer) TO "postgres";

REVOKE ALL ON FUNCTION "private"."create_community"(text, text, text, text, text, uuid, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."create_community"(text, text, text, text, text, uuid, uuid, uuid) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "public"."community_transition"(uuid, text, uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."community_transition"(uuid, text, uuid, text, text) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "public"."create_community"(text, text, text, text, text, uuid, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."create_community"(text, text, text, text, text, uuid, uuid, uuid) TO "authenticated", "postgres";

REVOKE ALL ON SCHEMA "private" FROM "anon";

GRANT USAGE ON SCHEMA "private" TO "anon";

REVOKE ALL ON TABLE "public"."communities" FROM "anon";

GRANT SELECT ON TABLE "public"."communities" TO "anon";

REVOKE ALL ON TABLE "public"."communities" FROM "authenticated";

GRANT SELECT ON TABLE "public"."communities" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."communities" TO "postgres";

REVOKE ALL ON TABLE "public"."communities" FROM "service_role";

GRANT SELECT ON TABLE "public"."communities" TO "service_role";

REVOKE ALL ON TABLE "public"."community_audit" FROM "authenticated";

GRANT SELECT ON TABLE "public"."community_audit" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."community_audit" TO "postgres";

REVOKE ALL ON TABLE "public"."community_audit" FROM "service_role";

GRANT SELECT ON TABLE "public"."community_audit" TO "service_role";

REVOKE ALL ON TABLE "public"."community_bans" FROM "authenticated";

GRANT SELECT ON TABLE "public"."community_bans" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."community_bans" TO "postgres";

REVOKE ALL ON TABLE "public"."community_bans" FROM "service_role";

GRANT SELECT ON TABLE "public"."community_bans" TO "service_role";

REVOKE ALL ON TABLE "public"."community_join_requests" FROM "authenticated";

GRANT SELECT ON TABLE "public"."community_join_requests" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."community_join_requests" TO "postgres";

REVOKE ALL ON TABLE "public"."community_join_requests" FROM "service_role";

GRANT SELECT ON TABLE "public"."community_join_requests" TO "service_role";

REVOKE ALL ON TABLE "public"."community_members" FROM "authenticated";

GRANT SELECT ON TABLE "public"."community_members" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."community_members" TO "postgres";

REVOKE ALL ON TABLE "public"."community_members" FROM "service_role";

GRANT SELECT ON TABLE "public"."community_members" TO "service_role";


-- Explicit final ACL baseline, independent of schema-generator/default grant behavior.
revoke all on public.communities,public.community_members,public.community_join_requests,public.community_bans,public.community_audit from public,anon,authenticated,service_role;
grant select on public.communities to anon,authenticated,service_role;
grant select on public.community_members,public.community_join_requests,public.community_bans,public.community_audit to authenticated,service_role;

revoke all on function private.community_role(uuid),private.community_rank(text),private.consume_community_budget(text,integer),private.create_community(text,text,text,text,text,uuid,uuid,uuid),private.community_transition(uuid,text,uuid,text,text),public.create_community(text,text,text,text,text,uuid,uuid,uuid),public.community_transition(uuid,text,uuid,text,text) from public,anon,authenticated,service_role;
grant usage on schema private to anon,authenticated;
grant execute on function private.community_role(uuid) to anon,authenticated;
grant execute on function private.create_community(text,text,text,text,text,uuid,uuid,uuid),private.community_transition(uuid,text,uuid,text,text),public.create_community(text,text,text,text,text,uuid,uuid,uuid),public.community_transition(uuid,text,uuid,text,text) to authenticated;
