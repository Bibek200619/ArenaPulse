create or replace function private.can_read_post_row(p_author uuid, p_community uuid, p_removed boolean)
returns boolean language sql stable security definer set search_path = '' as $$
  select not p_removed
    and (p_community is not null or auth.uid()=p_author or exists (
      select 1 from public.profiles author where author.id=p_author and not author.is_private
    ))
    and (p_community is null or (
      private.community_role(p_community) is not null
      and not exists (select 1 from public.community_bans b where b.community_id=p_community and b.user_id=auth.uid())
    ))
    and not private.has_block(p_author)
$$;

create or replace function private.can_create_post(p_author uuid, p_community uuid)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null or p_author is distinct from actor then return false; end if;
  if p_community is null then return true; end if;
  return private.community_role(p_community) is not null and not exists (
    select 1 from public.community_bans b
    where b.community_id=p_community and b.user_id=actor
  );
end $$;

create or replace function private.check_social_write_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); current_used integer;
begin
  if tg_table_name='posts' and tg_op='UPDATE' then
    if new.community_id is not null
      and current_setting('app.community_moderation_community', true)=new.community_id::text
      and new.community_id=old.community_id and new.author_id=old.author_id
      and ((new.is_removed and not old.is_removed
          and new.body='[removed by community moderators]'
          and new.is_pinned=old.is_pinned)
        or (new.is_removed=old.is_removed and new.body=old.body
          and new.is_pinned is distinct from old.is_pinned)) then
      return new;
    end if;
  end if;
  if actor is null or actor is distinct from (to_jsonb(new)->>tg_argv[0])::uuid then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  insert into private.social_write_limits(user_id,scope,resets_at,used)
    values(actor,tg_table_name,clock_timestamp()+interval '1 minute',1)
  on conflict(user_id,scope) do update set
    used=case when private.social_write_limits.resets_at <= clock_timestamp() then 1 else private.social_write_limits.used+1 end,
    resets_at=case when private.social_write_limits.resets_at <= clock_timestamp() then clock_timestamp()+interval '1 minute' else private.social_write_limits.resets_at end
  returning used into current_used;
  if current_used > tg_argv[1]::integer then raise exception 'Social write limit reached' using errcode='P0001'; end if;
  return new;
end $$;

drop policy posts_visible on public.posts;
create policy posts_visible on public.posts for select to anon, authenticated
  using (private.can_read_post_row(author_id, community_id, is_removed));
drop policy posts_owner_insert on public.posts;
create policy posts_owner_insert on public.posts for insert to authenticated
  with check (private.can_create_post(author_id, community_id));

drop policy comments_visible on public.comments;
create policy comments_visible on public.comments for select to anon,authenticated
  using ((author_id=auth.uid() or (private.can_read_post(post_id) and
    (exists(select 1 from public.posts p where p.id=comments.post_id and p.community_id is not null) or exists(select 1 from public.profiles p where p.id=comments.author_id and not p.is_private)))) and
    not private.has_block(comments.author_id));

drop policy reactions_visible on public.reactions;
create policy reactions_visible on public.reactions for select to anon,authenticated
  using ((user_id=auth.uid() or (private.can_read_post(post_id) and
    (exists(select 1 from public.posts p where p.id=reactions.post_id and p.community_id is not null) or exists(select 1 from public.profiles p where p.id=reactions.user_id and not p.is_private)))) and
    not private.has_block(reactions.user_id));

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
    perform set_config('app.community_moderation_community',group_id::text,true);
    update public.posts set is_removed=true, body='[removed by community moderators]' where id=p_post and not is_removed;
    perform set_config('app.community_moderation_community','',true);
    get diagnostics affected=row_count;
    if affected=0 then raise exception 'Post already removed' using errcode='23514'; end if;
    insert into public.community_audit(community_id,actor_id,target_id,action,detail) values(group_id,actor,author_id,'remove-post',p_post::text);
    return 'removed';
  end if;
  if private.community_role(group_id) not in ('owner','admin') then raise exception 'Admin permission required' using errcode='42501'; end if;
  perform set_config('app.community_moderation_community',group_id::text,true);
  if p_action='pin' then
    update public.posts set is_pinned=false where community_id=group_id and is_pinned;
    update public.posts set is_pinned=true where id=p_post and not is_removed;
  else update public.posts set is_pinned=false where id=p_post and is_pinned; end if;
  perform set_config('app.community_moderation_community','',true);
  insert into public.community_audit(community_id,actor_id,target_id,action,detail)
    values(group_id,actor,author_id,case when p_action='pin' then 'pin-post' else 'unpin-post' end,p_post::text);
  return case when p_action='pin' then 'pinned' else 'unpinned' end;
end $$;

revoke all on function private.can_read_post_row(uuid,uuid,boolean),private.can_create_post(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function private.can_read_post_row(uuid,uuid,boolean),private.can_create_post(uuid,uuid) to anon,authenticated;
