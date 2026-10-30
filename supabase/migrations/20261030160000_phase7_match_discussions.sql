create table public.match_discussion_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid,
  body text not null check (length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  is_removed boolean not null default false,
  removal_reason text check (removal_reason in ('author','moderator')),
  removed_at timestamptz,
  removed_by uuid references public.profiles(id) on delete set null,
  unique (id,match_id),
  foreign key (parent_id,match_id)
    references public.match_discussion_messages(id,match_id) on delete cascade,
  check ((parent_id is null) or (parent_id is distinct from id)),
  check ((is_removed and removal_reason is not null and removed_at is not null)
      or (not is_removed and removal_reason is null and removed_at is null))
);
alter table public.match_discussion_messages enable row level security;
create index match_discussion_messages_history_idx
  on public.match_discussion_messages(match_id,created_at desc,id desc);
create index match_discussion_messages_parent_idx
  on public.match_discussion_messages(match_id,parent_id,created_at,id)
  where parent_id is not null;

create table public.match_discussion_reactions (
  match_id uuid not null,
  message_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'like' check (kind='like'),
  created_at timestamptz not null default now(),
  primary key (message_id,user_id),
  foreign key (message_id,match_id)
    references public.match_discussion_messages(id,match_id) on delete cascade
);
alter table public.match_discussion_reactions enable row level security;
create index match_discussion_reactions_match_idx
  on public.match_discussion_reactions(match_id,message_id);

create table public.match_discussion_reports (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null,
  message_id uuid not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (length(btrim(reason)) between 1 and 500),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  unique (message_id,reporter_id),
  foreign key (message_id,match_id)
    references public.match_discussion_messages(id,match_id) on delete cascade,
  check ((status='open') = (resolved_at is null))
);
alter table public.match_discussion_reports enable row level security;
create index match_discussion_reports_staff_idx
  on public.match_discussion_reports(match_id,status,created_at desc,id desc);

create table public.match_discussion_moderation_log (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null,
  message_id uuid,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('author-delete','moderator-remove','resolve-report','dismiss-report')),
  detail text not null default '' check (length(detail)<=500),
  created_at timestamptz not null default now()
);
alter table public.match_discussion_moderation_log enable row level security;
create index match_discussion_moderation_log_match_idx
  on public.match_discussion_moderation_log(match_id,created_at desc);

create or replace function private.is_match_moderator()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt()->'app_metadata'->>'role' in ('moderator','admin'),false)
$$;

create or replace function private.can_read_match_message(p_match uuid,p_author uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
    and not private.has_block(p_author)
    and (p_author=auth.uid() or private.is_match_moderator() or exists (
      select 1 from public.profiles p where p.id=p_author and not p.is_private
    ))
$$;

create or replace function private.can_react_to_match_message(p_message uuid,p_match uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.match_discussion_messages m
    where m.id=p_message and m.match_id=p_match and not m.is_removed
      and private.can_read_match_message(m.match_id,m.author_id)
  )
$$;

create or replace function public.create_match_discussion_message(
  p_match_id uuid,p_body text,p_parent_id uuid default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); result uuid;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_match_id is null or length(btrim(p_body)) not between 1 and 1000 then
    raise exception 'A bounded message and match are required' using errcode='23514';
  end if;
  if not exists(select 1 from public.profiles p where p.id=actor) then
    raise exception 'Complete your profile first' using errcode='42501';
  end if;
  if p_parent_id is not null and not exists (
    select 1 from public.match_discussion_messages parent
    where parent.id=p_parent_id and parent.match_id=p_match_id
      and parent.parent_id is null and not parent.is_removed
      and private.can_read_match_message(parent.match_id,parent.author_id)
  ) then raise exception 'Reply target is unavailable' using errcode='42501'; end if;
  insert into public.match_discussion_messages(match_id,author_id,parent_id,body)
    values(p_match_id,actor,p_parent_id,btrim(p_body)) returning id into result;
  return result;
end $$;

create or replace function public.set_match_discussion_reaction(
  p_match_id uuid,p_message_id uuid,p_active boolean
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); affected integer;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not private.can_react_to_match_message(p_message_id,p_match_id) then
    raise exception 'Message unavailable' using errcode='42501';
  end if;
  if p_active then
    insert into public.match_discussion_reactions(match_id,message_id,user_id)
      values(p_match_id,p_message_id,actor) on conflict(message_id,user_id) do nothing;
  else
    delete from public.match_discussion_reactions
      where match_id=p_match_id and message_id=p_message_id and user_id=actor;
  end if;
  get diagnostics affected=row_count;
  return affected>0;
end $$;

create or replace function public.delete_match_discussion_message(p_match_id uuid,p_message_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); affected integer;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  update public.match_discussion_messages set is_removed=true,body='[message deleted]',
    removal_reason='author',removed_at=now(),removed_by=actor
    where id=p_message_id and match_id=p_match_id and author_id=actor and not is_removed;
  get diagnostics affected=row_count;
  if affected>0 then
    insert into public.match_discussion_moderation_log(match_id,message_id,actor_id,action)
      values(p_match_id,p_message_id,actor,'author-delete');
  end if;
  return affected>0;
end $$;

create or replace function public.report_match_discussion_message(p_match_id uuid,p_message_id uuid,p_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); target uuid; result uuid;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if length(btrim(p_reason)) not between 1 and 500 then raise exception 'A bounded report reason is required' using errcode='23514'; end if;
  select author_id into target from public.match_discussion_messages
    where id=p_message_id and match_id=p_match_id and not is_removed
      and private.can_read_match_message(match_id,author_id);
  if target is null or target=actor then raise exception 'Message unavailable' using errcode='42501'; end if;
  insert into public.match_discussion_reports(match_id,message_id,reporter_id,reason)
    values(p_match_id,p_message_id,actor,btrim(p_reason))
    on conflict(message_id,reporter_id) do nothing returning id into result;
  if result is null then
    select id into result from public.match_discussion_reports
      where message_id=p_message_id and reporter_id=actor;
  end if;
  return result;
end $$;

create or replace function public.moderate_match_discussion_message(p_match_id uuid,p_message_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); affected integer;
begin
  if actor is null or not private.is_match_moderator() then
    raise exception 'Moderator permission required' using errcode='42501';
  end if;
  update public.match_discussion_messages set is_removed=true,body='[message removed by moderators]',
    removal_reason='moderator',removed_at=now(),removed_by=actor
    where id=p_message_id and match_id=p_match_id and not is_removed;
  get diagnostics affected=row_count;
  if affected>0 then
    insert into public.match_discussion_moderation_log(match_id,message_id,actor_id,action)
      values(p_match_id,p_message_id,actor,'moderator-remove');
  end if;
  return affected>0;
end $$;

create or replace function public.resolve_match_discussion_report(p_report_id uuid,p_action text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); report_row public.match_discussion_reports%rowtype; affected integer;
begin
  if actor is null or not private.is_match_moderator() then
    raise exception 'Moderator permission required' using errcode='42501';
  end if;
  if p_action not in ('resolve','dismiss') then raise exception 'Unknown report action' using errcode='23514'; end if;
  select * into report_row from public.match_discussion_reports where id=p_report_id for update;
  if not found or report_row.status<>'open' then return false; end if;
  update public.match_discussion_reports set status=case when p_action='resolve' then 'resolved' else 'dismissed' end,
    resolved_at=now(),resolved_by=actor where id=p_report_id and status='open';
  get diagnostics affected=row_count;
  if affected>0 then
    insert into public.match_discussion_moderation_log(match_id,message_id,actor_id,action,detail)
      values(report_row.match_id,report_row.message_id,actor,
        case when p_action='resolve' then 'resolve-report' else 'dismiss-report' end,p_report_id::text);
  end if;
  return affected>0;
end $$;

create trigger match_discussion_message_write_limit
  before insert on public.match_discussion_messages
  for each row execute function private.check_social_write_limit('author_id','20');
create trigger match_discussion_reaction_write_limit
  before insert on public.match_discussion_reactions
  for each row execute function private.check_social_write_limit('user_id','60');
create trigger match_discussion_report_write_limit
  before insert on public.match_discussion_reports
  for each row execute function private.check_social_write_limit('reporter_id','5');

create policy match_discussion_messages_visible on public.match_discussion_messages
  for select to authenticated
  using (private.can_read_match_message(match_id,author_id));
create policy match_discussion_reactions_visible on public.match_discussion_reactions
  for select to authenticated
  using (private.can_react_to_match_message(message_id,match_id));
create policy match_discussion_reports_visible on public.match_discussion_reports
  for select to authenticated
  using (reporter_id=auth.uid() or private.is_match_moderator());
create policy match_discussion_moderation_log_visible on public.match_discussion_moderation_log
  for select to authenticated
  using (private.is_match_moderator());

revoke all on public.match_discussion_messages,public.match_discussion_reactions,
  public.match_discussion_reports,public.match_discussion_moderation_log
  from public,anon,authenticated,service_role;
grant select on public.match_discussion_messages,public.match_discussion_reactions,
  public.match_discussion_reports,public.match_discussion_moderation_log to authenticated;
grant all on public.match_discussion_messages,public.match_discussion_reactions,
  public.match_discussion_reports,public.match_discussion_moderation_log to service_role;

revoke all on function private.is_match_moderator(),private.can_read_match_message(uuid,uuid),
  private.can_react_to_match_message(uuid,uuid),public.create_match_discussion_message(uuid,text,uuid),
  public.set_match_discussion_reaction(uuid,uuid,boolean),public.delete_match_discussion_message(uuid,uuid),
  public.report_match_discussion_message(uuid,uuid,text),public.moderate_match_discussion_message(uuid,uuid),
  public.resolve_match_discussion_report(uuid,text) from public,anon,authenticated,service_role;
grant execute on function private.is_match_moderator(),private.can_read_match_message(uuid,uuid),
  private.can_react_to_match_message(uuid,uuid) to authenticated;
grant execute on function public.create_match_discussion_message(uuid,text,uuid),
  public.set_match_discussion_reaction(uuid,uuid,boolean),public.delete_match_discussion_message(uuid,uuid),
  public.report_match_discussion_message(uuid,uuid,text),public.moderate_match_discussion_message(uuid,uuid),
  public.resolve_match_discussion_report(uuid,text) to authenticated;

alter publication supabase_realtime add table public.match_discussion_messages;
alter publication supabase_realtime add table public.match_discussion_reactions;
