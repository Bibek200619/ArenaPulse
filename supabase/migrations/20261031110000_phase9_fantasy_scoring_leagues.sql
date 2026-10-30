alter table public.fantasy_rules
  add column scoring_rules jsonb not null default '{}'::jsonb
  check (jsonb_typeof(scoring_rules) = 'object');

alter table public.fantasy_teams
  add constraint fantasy_teams_id_competition_user_key
  unique (id, competition_id, user_id);

create table public.fantasy_leagues (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.fantasy_competitions(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(name) between 3 and 60),
  invite_code_hash bytea not null unique check (octet_length(invite_code_hash) = 32),
  created_at timestamptz not null default now(),
  unique (id, competition_id)
);
alter table public.fantasy_leagues enable row level security;

create table public.fantasy_league_members (
  league_id uuid not null,
  competition_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid not null,
  role text not null default 'member' check (role = any(array['owner','member'])),
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id),
  unique (league_id, team_id),
  foreign key (league_id, competition_id)
    references public.fantasy_leagues(id, competition_id) on delete cascade,
  foreign key (team_id, competition_id, user_id)
    references public.fantasy_teams(id, competition_id, user_id) on delete cascade
);
create index fantasy_league_members_user_idx
  on public.fantasy_league_members(user_id, joined_at desc);
alter table public.fantasy_league_members enable row level security;

create table public.fantasy_gameweek_score_runs (
  gameweek_id uuid primary key references public.fantasy_gameweeks(id) on delete cascade,
  revision integer not null check (revision > 0),
  source_event_count integer not null default 0 check (source_event_count >= 0),
  calculated_at timestamptz not null default now()
);
alter table public.fantasy_gameweek_score_runs enable row level security;

create table public.fantasy_gameweek_player_scores (
  competition_id uuid not null,
  gameweek_id uuid not null,
  rule_version integer not null,
  player_id uuid not null,
  points numeric(12,2) not null,
  revision integer not null check (revision > 0),
  primary key (competition_id, gameweek_id, player_id),
  foreign key (gameweek_id, competition_id)
    references public.fantasy_gameweeks(id, competition_id) on delete cascade,
  foreign key (competition_id, rule_version, player_id)
    references public.fantasy_player_prices(competition_id, rule_version, player_id) on delete restrict
);
alter table public.fantasy_gameweek_player_scores enable row level security;

create table public.fantasy_team_gameweek_scores (
  competition_id uuid not null,
  gameweek_id uuid not null,
  team_id uuid not null,
  base_points numeric(12,2) not null,
  captain_bonus numeric(12,2) not null,
  vice_captain_bonus numeric(12,2) not null,
  total_points numeric(12,2) not null,
  revision integer not null check (revision > 0),
  primary key (team_id, gameweek_id),
  foreign key (team_id, competition_id, gameweek_id)
    references public.fantasy_team_gameweeks(team_id, competition_id, gameweek_id) on delete cascade,
  foreign key (gameweek_id, competition_id)
    references public.fantasy_gameweeks(id, competition_id) on delete cascade
);
create index fantasy_team_gameweek_scores_leaderboard_idx
  on public.fantasy_team_gameweek_scores(gameweek_id, total_points desc, team_id);
alter table public.fantasy_team_gameweek_scores enable row level security;

create or replace function private.is_fantasy_league_member(p_league_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.fantasy_league_members m
    where m.league_id = p_league_id and m.user_id = auth.uid()
  );
$$;

create or replace function private.can_read_fantasy_team_score(p_team_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.fantasy_league_members mine
    join public.fantasy_league_members other on other.league_id = mine.league_id
    where mine.user_id = auth.uid() and other.team_id = p_team_id
  );
$$;

create policy fantasy_leagues_member_read on public.fantasy_leagues
  for select to authenticated using (private.is_fantasy_league_member(id));
create policy fantasy_league_members_member_read on public.fantasy_league_members
  for select to authenticated using (private.is_fantasy_league_member(league_id));
create policy fantasy_team_gameweek_scores_league_read
  on public.fantasy_team_gameweek_scores
  for select to authenticated using (private.can_read_fantasy_team_score(team_id));

create or replace function public.create_fantasy_league(
  p_competition_id uuid,
  p_name text,
  p_invite_code text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  v_team_id uuid;
  v_league_id uuid;
begin
  if actor is null then
    raise exception 'Sign in to create a private league' using errcode = '42501';
  end if;
  if p_name is null or length(btrim(p_name)) not between 3 and 60 then
    raise exception 'League name must be between 3 and 60 characters' using errcode = '23514';
  end if;
  if p_invite_code is null or p_invite_code !~ '^[A-Za-z0-9_-]{32}$' then
    raise exception 'A secure invitation code is required' using errcode = '23514';
  end if;
  select t.id into v_team_id
  from public.fantasy_teams t
  where t.competition_id = p_competition_id and t.user_id = actor
    and exists (select 1 from public.fantasy_team_gameweeks w where w.team_id = t.id)
  for update;
  if not found then
    raise exception 'Save a fantasy squad before creating a league' using errcode = '23514';
  end if;
  insert into public.fantasy_leagues(competition_id, owner_id, name, invite_code_hash)
    values (p_competition_id, actor, btrim(p_name), sha256(convert_to(p_invite_code, 'UTF8')))
    returning id into v_league_id;
  insert into public.fantasy_league_members(league_id, competition_id, user_id, team_id, role)
    values (v_league_id, p_competition_id, actor, v_team_id, 'owner');
  return v_league_id;
end;
$$;

create or replace function public.join_fantasy_league(p_invite_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  v_league public.fantasy_leagues%rowtype;
  v_team_id uuid;
begin
  if actor is null then
    raise exception 'Sign in to join a private league' using errcode = '42501';
  end if;
  if p_invite_code is null or p_invite_code !~ '^[A-Za-z0-9_-]{32}$' then
    raise exception 'Invalid invitation code or saved squad' using errcode = '23514';
  end if;
  select * into v_league from public.fantasy_leagues l
    where l.invite_code_hash = sha256(convert_to(p_invite_code, 'UTF8'))
    for update;
  if not found then
    raise exception 'Invalid invitation code or saved squad' using errcode = '23514';
  end if;
  select t.id into v_team_id from public.fantasy_teams t
  where t.competition_id = v_league.competition_id and t.user_id = actor
    and exists (select 1 from public.fantasy_team_gameweeks w where w.team_id = t.id)
  for update;
  if not found then
    raise exception 'Invalid invitation code or saved squad' using errcode = '23514';
  end if;
  insert into public.fantasy_league_members(league_id, competition_id, user_id, team_id)
    values (v_league.id, v_league.competition_id, actor, v_team_id)
    on conflict (league_id, user_id) do nothing;
  return v_league.id;
end;
$$;

create or replace function public.recalculate_fantasy_gameweek_scores(p_gameweek_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  gameweek_row public.fantasy_gameweeks%rowtype;
  competition_row public.fantasy_competitions%rowtype;
  rule_row public.fantasy_rules%rowtype;
  current_revision integer;
  event_count integer;
  team_count integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Only the scoring service may calculate fantasy scores' using errcode = '42501';
  end if;
  select * into gameweek_row from public.fantasy_gameweeks
    where id = p_gameweek_id for update;
  if not found or coalesce(gameweek_row.status, '') not in ('locked','complete') then
    raise exception 'Only locked or completed gameweeks can be scored' using errcode = '23514';
  end if;
  select * into competition_row from public.fantasy_competitions
    where id = gameweek_row.competition_id;
  select * into rule_row from public.fantasy_rules
    where competition_id = gameweek_row.competition_id and version = gameweek_row.rule_version;
  if rule_row.scoring_rules is null or jsonb_typeof(rule_row.scoring_rules) <> 'object'
    or exists (
      select 1 from jsonb_each_text(rule_row.scoring_rules) r
      where r.key <> lower(btrim(r.key)) or r.value !~ '^-?[0-9]{1,6}(\.[0-9]{1,2})?$'
    ) then
    raise exception 'Fantasy scoring rules are invalid' using errcode = '23514';
  end if;

  insert into public.fantasy_gameweek_score_runs(gameweek_id, revision, source_event_count, calculated_at)
    values (p_gameweek_id, 1, 0, now())
    on conflict (gameweek_id) do update
      set revision = public.fantasy_gameweek_score_runs.revision + 1,
          source_event_count = 0,
          calculated_at = now()
    returning revision into current_revision;
  delete from public.fantasy_gameweek_player_scores where gameweek_id = p_gameweek_id;
  delete from public.fantasy_team_gameweek_scores where gameweek_id = p_gameweek_id;

  select count(*) into event_count
  from public.match_events e
  join public.matches m on m.id = e.match_id
  where m.competition_id = competition_row.source_competition_id
    and m.sport_id = competition_row.sport_id
    and m.state = 'finished'
    and m.starts_at >= gameweek_row.starts_at and m.starts_at < gameweek_row.ends_at;

  insert into public.fantasy_gameweek_player_scores(
    competition_id, gameweek_id, rule_version, player_id, points, revision
  )
  with selected_players as (
    select distinct s.player_id
    from public.fantasy_team_selections s
    where s.competition_id = gameweek_row.competition_id and s.gameweek_id = p_gameweek_id
  ), points as (
    select p.player_id,
      coalesce(sum(case
        when rule_row.scoring_rules ? lower(btrim(e.type))
          then (rule_row.scoring_rules->>lower(btrim(e.type)))::numeric
        else 0
      end), 0)::numeric(12,2) as points
    from selected_players p
    left join public.match_events e on e.player_id = p.player_id
      and e.match_id in (
        select m.id from public.matches m
        where m.competition_id = competition_row.source_competition_id
          and m.sport_id = competition_row.sport_id
          and m.state = 'finished'
          and m.starts_at >= gameweek_row.starts_at and m.starts_at < gameweek_row.ends_at
      )
    group by p.player_id
  )
  select gameweek_row.competition_id, p_gameweek_id, gameweek_row.rule_version,
    p.player_id, p.points, current_revision from points p;

  insert into public.fantasy_team_gameweek_scores(
    competition_id, gameweek_id, team_id, base_points, captain_bonus,
    vice_captain_bonus, total_points, revision
  )
  select gameweek_row.competition_id, p_gameweek_id, tg.team_id,
    sum(ps.points),
    sum(case when s.player_id = tg.captain_player_id
      then ps.points * (r.captain_multiplier - 1) else 0 end),
    sum(case when s.player_id = tg.vice_captain_player_id
      then ps.points * (r.vice_captain_multiplier - 1) else 0 end),
    sum(ps.points)
      + sum(case when s.player_id = tg.captain_player_id
          then ps.points * (r.captain_multiplier - 1) else 0 end)
      + sum(case when s.player_id = tg.vice_captain_player_id
          then ps.points * (r.vice_captain_multiplier - 1) else 0 end),
    current_revision
  from public.fantasy_team_gameweeks tg
  join public.fantasy_team_selections s
    on s.team_id = tg.team_id and s.gameweek_id = tg.gameweek_id
  join public.fantasy_gameweek_player_scores ps
    on ps.competition_id = tg.competition_id and ps.gameweek_id = tg.gameweek_id
    and ps.player_id = s.player_id
  join public.fantasy_rules r
    on r.competition_id = tg.competition_id and r.version = tg.rule_version
  where tg.gameweek_id = p_gameweek_id
  group by tg.team_id;
  get diagnostics team_count = row_count;

  update public.fantasy_gameweek_score_runs
    set source_event_count = event_count where gameweek_id = p_gameweek_id;
  return team_count;
end;
$$;

create or replace function public.get_fantasy_league_leaderboard(p_league_id uuid)
returns table (
  gameweek_number smallint,
  rank bigint,
  team_name text,
  display_name text,
  total_points numeric
) language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  league_row public.fantasy_leagues%rowtype;
  latest_week_id uuid;
  latest_week_number smallint;
begin
  if actor is null then
    raise exception 'Sign in to view this leaderboard' using errcode = '42501';
  end if;
  select * into league_row from public.fantasy_leagues l
    where l.id = p_league_id and exists (
      select 1 from public.fantasy_league_members lm
      where lm.league_id = l.id and lm.user_id = actor
    );
  if not found then
    raise exception 'Fantasy league is unavailable' using errcode = '42501';
  end if;
  select g.id, g.number into latest_week_id, latest_week_number
  from public.fantasy_gameweek_score_runs r
  join public.fantasy_gameweeks g on g.id = r.gameweek_id
  where g.competition_id = league_row.competition_id
  order by g.number desc limit 1;
  if latest_week_id is null then return; end if;
  return query
  with ranked as (
    select m.joined_at, m.user_id, t.name as team_name, p.display_name,
      coalesce(s.total_points, 0)::numeric as total_points,
      rank() over (order by coalesce(s.total_points, 0) desc) as position
    from public.fantasy_league_members m
    join public.fantasy_teams t on t.id = m.team_id
    join public.profiles p on p.id = m.user_id
    left join public.fantasy_team_gameweek_scores s
      on s.team_id = m.team_id and s.gameweek_id = latest_week_id
    where m.league_id = league_row.id
  )
  select latest_week_number, r.position, r.team_name, r.display_name, r.total_points
  from ranked r
  order by r.total_points desc, r.joined_at asc, r.user_id asc;
end;
$$;

revoke all on public.fantasy_leagues, public.fantasy_league_members,
  public.fantasy_gameweek_score_runs, public.fantasy_gameweek_player_scores,
  public.fantasy_team_gameweek_scores from public, anon, authenticated, service_role;
grant select (id, competition_id, owner_id, name, created_at)
  on public.fantasy_leagues to authenticated;
grant select on public.fantasy_league_members to authenticated;
grant select on public.fantasy_team_gameweek_scores to authenticated;
grant all on public.fantasy_leagues, public.fantasy_league_members,
  public.fantasy_gameweek_score_runs, public.fantasy_gameweek_player_scores,
  public.fantasy_team_gameweek_scores to service_role;

revoke all on function private.is_fantasy_league_member(uuid),
  private.can_read_fantasy_team_score(uuid) from public, anon, authenticated, service_role;
grant execute on function private.is_fantasy_league_member(uuid),
  private.can_read_fantasy_team_score(uuid) to authenticated;
revoke all on function public.create_fantasy_league(uuid, text, text),
  public.join_fantasy_league(text), public.get_fantasy_league_leaderboard(uuid),
  public.recalculate_fantasy_gameweek_scores(uuid) from public, anon, authenticated, service_role;
grant execute on function public.create_fantasy_league(uuid, text, text),
  public.join_fantasy_league(text), public.get_fantasy_league_leaderboard(uuid)
  to authenticated;
grant execute on function public.recalculate_fantasy_gameweek_scores(uuid)
  to service_role;
