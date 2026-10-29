alter table public.posts
  add column community_id uuid references public.communities(id) on delete cascade,
  add column is_pinned boolean not null default false,
  add column is_removed boolean not null default false;

alter table public.community_audit drop constraint community_audit_action_check;
alter table public.community_audit add constraint community_audit_action_check
  check (action = any (array['create','join','request','cancel-request','leave','approve','reject','role','ban','unban','transfer','pin-post','unpin-post','remove-post','report-post','resolve-report','dismiss-report']));

create index posts_community_created_idx on public.posts(community_id, is_pinned desc, created_at desc, id desc) where community_id is not null and not is_removed;

create table public.community_post_reports (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (length(btrim(reason)) between 1 and 500),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  unique (post_id, reporter_id)
);
alter table public.community_post_reports enable row level security;
create index community_post_reports_staff_idx on public.community_post_reports(community_id, status, created_at desc, id desc);

create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.user_blocks enable row level security;
create index user_blocks_target_idx on public.user_blocks(blocked_id, blocker_id);

create or replace function private.has_block(p_other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.user_blocks b where
      (b.blocker_id=auth.uid() and b.blocked_id=p_other) or
      (b.blocker_id=p_other and b.blocked_id=auth.uid())
  )
$$;

create or replace function private.can_read_post(p_post uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.posts p
    join public.profiles author on author.id = p.author_id
    where p.id = p_post and not p.is_removed
      and (p.community_id is not null or auth.uid() = p.author_id or not author.is_private)
      and (p.community_id is null or (
        private.community_role(p.community_id) is not null
        and not exists (select 1 from public.community_bans b where b.community_id=p.community_id and b.user_id=auth.uid())
      ))
      and not private.has_block(p.author_id)
  )
$$;

create or replace function private.can_interact_post(p_post uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.posts p join public.profiles author on author.id=p.author_id
    where p.id=p_post and not p.is_removed
      and (p.community_id is not null or p.author_id=auth.uid() or not author.is_private)
      and (p.community_id is null or (
        private.community_role(p.community_id) is not null
        and not exists (select 1 from public.community_bans b where b.community_id=p.community_id and b.user_id=auth.uid())
      ))
      and not private.has_block(p.author_id)
  )
$$;

drop policy posts_visible on public.posts;
create policy posts_visible on public.posts for select to anon, authenticated using (private.can_read_post(id));
drop policy posts_owner_insert on public.posts;
create policy posts_owner_insert on public.posts for insert to authenticated
  with check (author_id=auth.uid() and (community_id is null or (
    private.community_role(community_id) is not null and
    not exists(select 1 from public.community_bans b where b.community_id=posts.community_id and b.user_id=auth.uid())
  )));
drop policy posts_owner_update on public.posts;
create policy posts_owner_update on public.posts for update to authenticated
  using (author_id=auth.uid() and private.can_interact_post(id))
  with check (author_id=auth.uid() and private.can_interact_post(id));

drop policy comments_visible on public.comments;
create policy comments_visible on public.comments for select to anon,authenticated
  using (private.can_read_post(post_id) and
    (exists(select 1 from public.posts p where p.id=comments.post_id and p.community_id is not null) or author_id=auth.uid() or exists(select 1 from public.profiles p where p.id=comments.author_id and not p.is_private)) and
    not private.has_block(comments.author_id));
drop policy comments_owner_insert on public.comments;
create policy comments_owner_insert on public.comments for insert to authenticated
  with check (author_id=auth.uid() and private.can_interact_post(post_id));
drop policy reactions_visible on public.reactions;
create policy reactions_visible on public.reactions for select to anon,authenticated
  using (private.can_read_post(post_id) and
    (exists(select 1 from public.posts p where p.id=reactions.post_id and p.community_id is not null) or user_id=auth.uid() or exists(select 1 from public.profiles p where p.id=reactions.user_id and not p.is_private)) and
    not private.has_block(reactions.user_id));
drop policy reactions_owner_insert on public.reactions;
create policy reactions_owner_insert on public.reactions for insert to authenticated
  with check (user_id=auth.uid() and private.can_interact_post(post_id));

create policy user_blocks_owner_select on public.user_blocks for select to authenticated using (blocker_id=auth.uid());
create policy user_blocks_owner_insert on public.user_blocks for insert to authenticated with check (blocker_id=auth.uid());
create policy user_blocks_owner_delete on public.user_blocks for delete to authenticated using (blocker_id=auth.uid());
create trigger user_blocks_write_limit before insert on public.user_blocks
  for each row execute function private.check_social_write_limit('blocker_id','30');

create policy community_post_reports_visible on public.community_post_reports for select to authenticated
  using (reporter_id=auth.uid() or private.community_role(community_id) in ('owner','admin','moderator'));

create or replace function public.report_community_post(p_post uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); group_id uuid; report_id uuid;
begin
  if actor is null or length(btrim(p_reason)) not between 1 and 500 then raise exception 'A bounded report reason is required' using errcode='23514'; end if;
  select community_id into group_id from public.posts where id=p_post and community_id is not null and not is_removed;
  if group_id is null or private.community_role(group_id) is null or not private.can_read_post(p_post) or exists(select 1 from public.posts where id=p_post and author_id=actor) then raise exception 'Post unavailable' using errcode='42501'; end if;
  perform private.consume_community_budget('community_report',10);
  insert into public.community_post_reports(community_id,post_id,reporter_id,reason)
    values(group_id,p_post,actor,btrim(p_reason)) returning id into report_id;
  insert into public.community_audit(community_id,actor_id,target_id,action,detail)
    select group_id,actor,p.author_id,'report-post',p_reason from public.posts p where p.id=p_post;
  return report_id;
end $$;

create or replace function public.moderate_community_post(p_post uuid, p_action text)
returns text language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); group_id uuid; actor_role text; actor_rank smallint; author_id uuid; affected integer;
begin
  select community_id,posts.author_id into group_id,author_id from public.posts where id=p_post and community_id is not null and not is_removed for update;
  if group_id is null then raise exception 'Post unavailable' using errcode='42501'; end if;
  perform 1 from public.communities where id=group_id for update;
  actor_role:=private.community_role(group_id); actor_rank:=private.community_rank(actor_role);
  if actor_rank<2 or exists(select 1 from public.community_bans b where b.community_id=group_id and b.user_id=actor) then raise exception 'Staff permission required' using errcode='42501'; end if;
  if p_action not in ('pin','unpin','remove') then raise exception 'Unknown moderation action' using errcode='23514'; end if;
  if p_action='remove' then
    if private.community_rank(private.community_role(group_id)) <= private.community_rank((select role from public.community_members where community_id=group_id and user_id=author_id)) then raise exception 'Cannot remove content from a peer or senior member' using errcode='42501'; end if;
    update public.posts set is_removed=true, body='[removed by community moderators]' where id=p_post and not is_removed;
    get diagnostics affected=row_count;
    if affected=0 then raise exception 'Post already removed' using errcode='23514'; end if;
    insert into public.community_audit(community_id,actor_id,target_id,action,detail) values(group_id,actor,author_id,'remove-post',p_post::text);
    return 'removed';
  end if;
  if private.community_role(group_id) not in ('owner','admin') then raise exception 'Admin permission required' using errcode='42501'; end if;
  if p_action='pin' then
    update public.posts set is_pinned=false where community_id=group_id and is_pinned;
    update public.posts set is_pinned=true where id=p_post and not is_removed;
  else update public.posts set is_pinned=false where id=p_post and is_pinned; end if;
  insert into public.community_audit(community_id,actor_id,target_id,action,detail)
    values(group_id,actor,author_id,case when p_action='pin' then 'pin-post' else 'unpin-post' end,p_post::text);
  return case when p_action='pin' then 'pinned' else 'unpinned' end;
end $$;

create or replace function public.resolve_community_report(p_report uuid, p_action text)
returns text language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); report_row public.community_post_reports%rowtype; actor_rank smallint;
begin
  select * into report_row from public.community_post_reports where id=p_report for update;
  if not found then raise exception 'Report unavailable' using errcode='42501'; end if;
  perform 1 from public.communities where id=report_row.community_id for update;
  actor_rank:=private.community_rank(private.community_role(report_row.community_id));
  if actor_rank<2 then raise exception 'Staff permission required' using errcode='42501'; end if;
  if p_action not in ('resolve','dismiss') or report_row.status<>'open' then raise exception 'Report is no longer open' using errcode='23514'; end if;
  update public.community_post_reports set status=case when p_action='resolve' then 'resolved' else 'dismissed' end,resolved_at=now(),resolved_by=actor where id=p_report;
  insert into public.community_audit(community_id,actor_id,target_id,action,detail) values(report_row.community_id,actor,report_row.reporter_id,case when p_action='resolve' then 'resolve-report' else 'dismiss-report' end,p_report::text);
  return p_action;
end $$;

revoke all on public.community_post_reports,public.user_blocks from public,anon,authenticated,service_role;
grant select,insert,delete on public.user_blocks to authenticated;
grant select on public.community_post_reports to authenticated;
revoke all on function private.has_block(uuid),private.can_read_post(uuid),private.can_interact_post(uuid),public.report_community_post(uuid,text),public.moderate_community_post(uuid,text),public.resolve_community_report(uuid,text) from public,anon,authenticated,service_role;
grant execute on function private.has_block(uuid),private.can_read_post(uuid),private.can_interact_post(uuid) to anon,authenticated;
grant execute on function public.report_community_post(uuid,text),public.moderate_community_post(uuid,text),public.resolve_community_report(uuid,text) to authenticated;
grant insert(community_id) on public.posts to authenticated;
grant execute on function public.report_community_post(uuid,text),public.moderate_community_post(uuid,text),public.resolve_community_report(uuid,text) to authenticated;
