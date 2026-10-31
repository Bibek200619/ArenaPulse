create or replace function private.valid_notification_timezone(p_timezone text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone)
$$;

create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  in_app_enabled boolean not null default true,
  social_enabled boolean not null default true,
  community_enabled boolean not null default true,
  match_enabled boolean not null default true,
  fantasy_enabled boolean not null default true,
  time_zone text not null default 'UTC',
  updated_at timestamptz not null default now(),
  check (private.valid_notification_timezone(time_zone))
);
alter table public.notification_preferences enable row level security;

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type = any(array[
    'social_comment','social_reply','social_like','social_follow',
    'community_request','community_join','community_approved',
    'match_reply','match_like','fantasy_join','reminder'
  ])),
  target_type text not null check (target_type = any(array[
    'post','profile','community','match','fantasy_league','match_message','fantasy_gameweek'
  ])),
  target_id uuid not null,
  related_id uuid,
  dedupe_key text not null,
  status text not null default 'queued' check (status = any(array['queued','delivered','skipped'])),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (recipient_id,dedupe_key),
  check ((status='queued') = (processed_at is null))
);
create index notification_outbox_queue_idx
  on public.notification_outbox(recipient_id,created_at,id) where status='queued';
alter table public.notification_outbox enable row level security;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid not null unique references public.notification_outbox(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  target_type text not null,
  target_id uuid not null,
  related_id uuid,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_inbox_idx on public.notifications(recipient_id,created_at desc,id desc);
alter table public.notifications enable row level security;

create table public.notification_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null check (length(btrim(label)) between 1 and 120),
  target_type text not null check (target_type = any(array['match','fantasy_gameweek'])),
  target_id uuid not null,
  local_scheduled_for timestamp without time zone not null,
  time_zone text not null check (private.valid_notification_timezone(time_zone)),
  scheduled_for timestamptz not null,
  status text not null default 'scheduled' check (status = any(array['scheduled','queued','delivered','skipped','cancelled'])),
  created_at timestamptz not null default now(),
  check (scheduled_for = local_scheduled_for at time zone time_zone)
);
create index notification_reminders_due_idx on public.notification_reminders(scheduled_for,id)
  where status='scheduled';
alter table public.notification_reminders enable row level security;

create or replace function private.enqueue_notification(
  p_recipient uuid,p_actor uuid,p_event_type text,p_target_type text,
  p_target_id uuid,p_related_id uuid,p_dedupe_key text
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_recipient is null or p_actor is not distinct from p_recipient or p_target_id is null then return; end if;
  insert into public.notification_outbox(
    recipient_id,actor_id,event_type,target_type,target_id,related_id,dedupe_key
  ) values(p_recipient,p_actor,p_event_type,p_target_type,p_target_id,p_related_id,p_dedupe_key)
  on conflict (recipient_id,dedupe_key) do nothing;
end $$;

create or replace function private.enqueue_social_comment_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare recipient uuid; post_author uuid;
begin
  select p.author_id into post_author from public.posts p where p.id=new.post_id;
  if new.parent_id is not null then
    select c.author_id into recipient from public.comments c where c.id=new.parent_id and c.post_id=new.post_id;
  else recipient:=post_author;
  end if;
  perform private.enqueue_notification(
    recipient,new.author_id,
    case when new.parent_id is null then 'social_comment' else 'social_reply' end,
    'post',new.post_id,new.id,'comment:'||new.id::text
  );
  return new;
end $$;

create or replace function private.enqueue_social_like_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare recipient uuid;
begin
  select p.author_id into recipient from public.posts p where p.id=new.post_id;
  perform private.enqueue_notification(recipient,new.user_id,'social_like','post',new.post_id,null,
    'social-like:'||new.post_id::text||':'||new.user_id::text);
  return new;
end $$;

create or replace function private.enqueue_social_follow_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.enqueue_notification(new.followed_id,new.follower_id,'social_follow','profile',new.followed_id,null,
    'follow:'||new.follower_id::text||':'||new.followed_id::text);
  return new;
end $$;

create or replace function private.enqueue_community_request_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare recipient uuid;
begin
  if new.status <> 'pending' then return new; end if;
  select c.owner_id into recipient from public.communities c where c.id=new.community_id;
  perform private.enqueue_notification(recipient,new.user_id,'community_request','community',new.community_id,new.user_id,
    'community-request:'||new.community_id::text||':'||new.user_id::text);
  return new;
end $$;

create or replace function private.enqueue_community_member_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare recipient uuid; actor uuid := auth.uid(); event_name text;
begin
  if new.role='owner' then return new; end if;
  if actor is null or actor=new.user_id then
    select c.owner_id into recipient from public.communities c where c.id=new.community_id;
    actor:=new.user_id; event_name:='community_join';
  else
    recipient:=new.user_id; event_name:='community_approved';
  end if;
  perform private.enqueue_notification(recipient,actor,event_name,'community',new.community_id,new.user_id,
    event_name||':'||new.community_id::text||':'||new.user_id::text);
  return new;
end $$;

create or replace function private.enqueue_match_reply_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare recipient uuid;
begin
  if new.parent_id is null then return new; end if;
  select m.author_id into recipient from public.match_discussion_messages m
    where m.id=new.parent_id and m.match_id=new.match_id and not m.is_removed;
  perform private.enqueue_notification(recipient,new.author_id,'match_reply','match',new.match_id,new.parent_id,
    'match-reply:'||new.id::text);
  return new;
end $$;

create or replace function private.enqueue_match_like_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare recipient uuid;
begin
  select m.author_id into recipient from public.match_discussion_messages m
    where m.id=new.message_id and m.match_id=new.match_id and not m.is_removed;
  perform private.enqueue_notification(recipient,new.user_id,'match_like','match',new.match_id,new.message_id,
    'match-like:'||new.message_id::text||':'||new.user_id::text);
  return new;
end $$;

create or replace function private.enqueue_fantasy_join_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare recipient uuid;
begin
  if new.role <> 'member' then return new; end if;
  select l.owner_id into recipient from public.fantasy_leagues l where l.id=new.league_id;
  perform private.enqueue_notification(recipient,new.user_id,'fantasy_join','fantasy_league',new.league_id,new.team_id,
    'fantasy-join:'||new.league_id::text||':'||new.user_id::text);
  return new;
end $$;

create trigger notification_social_comment after insert on public.comments
  for each row execute function private.enqueue_social_comment_notification();
create trigger notification_social_like after insert on public.reactions
  for each row execute function private.enqueue_social_like_notification();
create trigger notification_social_follow after insert on public.user_follows
  for each row execute function private.enqueue_social_follow_notification();
create trigger notification_community_request after insert on public.community_join_requests
  for each row execute function private.enqueue_community_request_notification();
create trigger notification_community_member after insert on public.community_members
  for each row execute function private.enqueue_community_member_notification();
create trigger notification_match_reply after insert on public.match_discussion_messages
  for each row execute function private.enqueue_match_reply_notification();
create trigger notification_match_like after insert on public.match_discussion_reactions
  for each row execute function private.enqueue_match_like_notification();
create trigger notification_fantasy_join after insert on public.fantasy_league_members
  for each row execute function private.enqueue_fantasy_join_notification();

create or replace function public.save_notification_preferences(
  p_in_app_enabled boolean,p_social_enabled boolean,p_community_enabled boolean,
  p_match_enabled boolean,p_fantasy_enabled boolean,p_time_zone text
)
returns void language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid();
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not private.valid_notification_timezone(p_time_zone) then
    raise exception 'Use a valid IANA time zone' using errcode='22023';
  end if;
  insert into public.notification_preferences(user_id,in_app_enabled,social_enabled,community_enabled,match_enabled,fantasy_enabled,time_zone)
    values(actor,p_in_app_enabled,p_social_enabled,p_community_enabled,p_match_enabled,p_fantasy_enabled,p_time_zone)
  on conflict(user_id) do update set in_app_enabled=excluded.in_app_enabled,
    social_enabled=excluded.social_enabled,community_enabled=excluded.community_enabled,
    match_enabled=excluded.match_enabled,fantasy_enabled=excluded.fantasy_enabled,
    time_zone=excluded.time_zone,updated_at=now();
end $$;

create or replace function public.schedule_notification_reminder(
  p_label text,p_target_type text,p_target_id uuid,p_local_scheduled_for timestamp without time zone,p_time_zone text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); due_at timestamptz; result uuid;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_label is null or length(btrim(p_label)) not between 1 and 120
    or p_target_type not in ('match','fantasy_gameweek') or p_target_id is null
    or p_local_scheduled_for is null or not private.valid_notification_timezone(p_time_zone) then
    raise exception 'Check the reminder details and time zone' using errcode='23514';
  end if;
  due_at:=p_local_scheduled_for at time zone p_time_zone;
  if due_at at time zone p_time_zone <> p_local_scheduled_for then
    raise exception 'That local time does not exist in the selected time zone' using errcode='22023';
  end if;
  if due_at < now()+interval '5 minutes' or due_at > now()+interval '1 year' then
    raise exception 'Reminders must be between five minutes and one year ahead' using errcode='23514';
  end if;
  if (select count(*) from public.notification_reminders r where r.user_id=actor and r.status in ('scheduled','queued')) >= 100 then
    raise exception 'Reminder limit reached' using errcode='P0001';
  end if;
  insert into public.notification_reminders(user_id,label,target_type,target_id,local_scheduled_for,time_zone,scheduled_for)
    values(actor,btrim(p_label),p_target_type,p_target_id,p_local_scheduled_for,p_time_zone,due_at)
    returning id into result;
  return result;
end $$;

create or replace function public.cancel_notification_reminder(p_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); changed integer;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  update public.notification_reminders set status='cancelled'
    where id=p_id and user_id=actor and status='scheduled';
  get diagnostics changed=row_count;
  return changed=1;
end $$;

create or replace function public.process_my_notification_queue()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  actor uuid:=auth.uid(); item public.notification_outbox%rowtype; reminder public.notification_reminders%rowtype;
  preference public.notification_preferences%rowtype; has_preference boolean; enabled boolean; allowed boolean;
  processed integer:=0; reminder_id uuid;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into preference from public.notification_preferences where user_id=actor;
  has_preference:=found;
  if not has_preference then
    preference.in_app_enabled:=true; preference.social_enabled:=true; preference.community_enabled:=true;
    preference.match_enabled:=true; preference.fantasy_enabled:=true;
  end if;

  for reminder in select * from public.notification_reminders r
    where r.user_id=actor and r.status='scheduled' and r.scheduled_for<=now()
    order by r.scheduled_for,r.id for update skip locked limit 100
  loop
    update public.notification_reminders set status='queued' where id=reminder.id;
    perform private.enqueue_notification(actor,null,'reminder',reminder.target_type,reminder.target_id,reminder.id,
      'reminder:'||reminder.id::text);
  end loop;

  for item in select * from public.notification_outbox o
    where o.recipient_id=actor and o.status='queued'
    order by o.created_at,o.id for update skip locked limit 100
  loop
    enabled:=preference.in_app_enabled and case
      when item.event_type in ('social_comment','social_reply','social_like','social_follow') then preference.social_enabled
      when item.event_type in ('community_request','community_join','community_approved') then preference.community_enabled
      when item.event_type in ('match_reply','match_like') then preference.match_enabled
      when item.event_type='fantasy_join' then preference.fantasy_enabled
      else true end;
    allowed:=enabled and (item.actor_id is null or not exists(
      select 1 from public.user_blocks b where
        (b.blocker_id=actor and b.blocked_id=item.actor_id) or
        (b.blocker_id=item.actor_id and b.blocked_id=actor)
    ));
    if allowed then
      if item.event_type in ('social_comment','social_reply','social_like') then
        allowed:=exists(select 1 from public.posts p join public.profiles author on author.id=p.author_id
          where p.id=item.target_id and not p.is_removed and (
            (p.community_id is null and (p.author_id=actor or not author.is_private)) or
            (p.community_id is not null and exists(select 1 from public.community_members m
              where m.community_id=p.community_id and m.user_id=actor)
              and not exists(select 1 from public.community_bans b where b.community_id=p.community_id and b.user_id=actor))
          ));
      elsif item.event_type='social_follow' then
        allowed:=item.target_id=actor and exists(select 1 from public.user_follows f
          where f.follower_id=item.actor_id and f.followed_id=actor);
      elsif item.event_type='community_request' then
        allowed:=exists(select 1 from public.communities c where c.id=item.target_id and c.owner_id=actor)
          and exists(select 1 from public.community_join_requests r where r.community_id=item.target_id and r.user_id=item.related_id and r.status='pending');
      elsif item.event_type in ('community_join','community_approved') then
        allowed:=exists(select 1 from public.communities c where c.id=item.target_id)
          and exists(select 1 from public.community_members m where m.community_id=item.target_id and m.user_id=actor)
          and not exists(select 1 from public.community_bans b where b.community_id=item.target_id and b.user_id=actor);
      elsif item.event_type in ('match_reply','match_like') then
        allowed:=exists(select 1 from public.match_discussion_messages m
          where m.id=item.related_id and m.match_id=item.target_id and m.author_id=actor and not m.is_removed)
          and not exists(select 1 from public.profiles p where p.id=item.actor_id and p.is_private);
      elsif item.event_type='fantasy_join' then
        allowed:=exists(select 1 from public.fantasy_leagues l where l.id=item.target_id and l.owner_id=actor)
          and exists(select 1 from public.fantasy_league_members m where m.league_id=item.target_id and m.user_id=actor);
      elsif item.event_type='reminder' then
        allowed:=exists(select 1 from public.notification_reminders r
          where r.id=item.related_id and r.user_id=actor and r.status='queued');
      end if;
    end if;

    if allowed then
      insert into public.notifications(outbox_id,recipient_id,actor_id,event_type,target_type,target_id,related_id)
        values(item.id,item.recipient_id,item.actor_id,item.event_type,item.target_type,item.target_id,item.related_id)
        on conflict(outbox_id) do nothing;
      update public.notification_outbox set status='delivered',processed_at=now() where id=item.id and status='queued';
    else
      update public.notification_outbox set status='skipped',processed_at=now() where id=item.id and status='queued';
    end if;
    if item.event_type='reminder' then
      update public.notification_reminders set status=case when allowed then 'delivered' else 'skipped' end
        where id=item.related_id and user_id=actor and status='queued';
    end if;
    processed:=processed+1;
  end loop;
  return processed;
end $$;

create or replace function public.mark_notification_read(p_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); changed integer;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  update public.notifications set read_at=coalesce(read_at,now()) where id=p_id and recipient_id=actor;
  get diagnostics changed=row_count;
  return changed=1;
end $$;

create policy notification_preferences_read on public.notification_preferences
  for select to authenticated using (user_id=(select auth.uid()));
create policy notification_outbox_owner_read on public.notification_outbox
  for select to authenticated using (recipient_id=(select auth.uid()));
create policy notifications_owner_read on public.notifications
  for select to authenticated using (recipient_id=(select auth.uid()));
create policy notification_reminders_owner_read on public.notification_reminders
  for select to authenticated using (user_id=(select auth.uid()));

revoke all on public.notification_preferences,public.notification_outbox,public.notifications,public.notification_reminders
  from public,anon,authenticated,service_role;
grant select on public.notification_preferences,public.notifications,public.notification_reminders to authenticated;
grant select on public.notification_outbox to authenticated;
grant all on public.notification_preferences,public.notification_outbox,public.notifications,public.notification_reminders to service_role;

revoke all on function private.valid_notification_timezone(text),private.enqueue_notification(uuid,uuid,text,text,uuid,uuid,text),
  private.enqueue_social_comment_notification(),private.enqueue_social_like_notification(),private.enqueue_social_follow_notification(),
  private.enqueue_community_request_notification(),private.enqueue_community_member_notification(),
  private.enqueue_match_reply_notification(),private.enqueue_match_like_notification(),private.enqueue_fantasy_join_notification(),
  public.save_notification_preferences(boolean,boolean,boolean,boolean,boolean,text),
  public.schedule_notification_reminder(text,text,uuid,timestamp without time zone,text),
  public.cancel_notification_reminder(uuid),public.process_my_notification_queue(),public.mark_notification_read(uuid)
  from public,anon,authenticated,service_role;
grant execute on function private.valid_notification_timezone(text) to authenticated,service_role,postgres;
grant execute on function public.save_notification_preferences(boolean,boolean,boolean,boolean,boolean,text),
  public.schedule_notification_reminder(text,text,uuid,timestamp without time zone,text),
  public.cancel_notification_reminder(uuid),public.process_my_notification_queue(),public.mark_notification_read(uuid)
  to authenticated;
