create table public.fantasy_competitions (
  id uuid primary key,
  source_competition_id uuid not null,
  sport_id uuid not null,
  name text not null check (length(name) between 3 and 120),
  status text not null default 'draft' check (status = any(array['draft','open','closed'])),
  current_rule_version integer not null default 1 check (current_rule_version > 0),
  created_at timestamptz not null default now(),
  unique (id, sport_id),
  foreign key (source_competition_id, sport_id)
    references public.competitions(id, sport_id) on delete restrict
);
alter table public.fantasy_competitions enable row level security;

create table public.fantasy_rules (
  competition_id uuid not null references public.fantasy_competitions(id) on delete cascade,
  version integer not null check (version > 0),
  squad_size smallint not null check (squad_size between 2 and 40),
  budget numeric(10,2) not null check (budget > 0),
  position_limits jsonb not null check (jsonb_typeof(position_limits) = 'object'),
  team_cap smallint not null check (team_cap between 1 and 40),
  captain_multiplier numeric(5,2) not null check (captain_multiplier between 1 and 10),
  vice_captain_multiplier numeric(5,2) not null check (vice_captain_multiplier between 1 and 10),
  transfers_per_gameweek smallint not null check (transfers_per_gameweek between 0 and 40),
  created_at timestamptz not null default now(),
  primary key (competition_id, version)
);
alter table public.fantasy_rules enable row level security;

create table public.fantasy_player_prices (
  competition_id uuid not null,
  rule_version integer not null,
  sport_id uuid not null,
  player_id uuid not null,
  price numeric(10,2) not null check (price > 0),
  primary key (competition_id, rule_version, player_id),
  foreign key (competition_id, rule_version)
    references public.fantasy_rules(competition_id, version) on delete cascade,
  foreign key (competition_id, sport_id)
    references public.fantasy_competitions(id, sport_id) on delete cascade,
  foreign key (player_id, sport_id)
    references public.players(id, sport_id) on delete restrict
);
alter table public.fantasy_player_prices enable row level security;

create table public.fantasy_gameweeks (
  id uuid primary key,
  competition_id uuid not null references public.fantasy_competitions(id) on delete cascade,
  number smallint not null check (number > 0),
  name text not null check (length(name) between 1 and 80),
  rule_version integer not null,
  deadline_at timestamptz not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'upcoming'
    check (status = any(array['upcoming','open','locked','complete'])),
  unique (competition_id, number),
  unique (id, competition_id),
  foreign key (competition_id, rule_version)
    references public.fantasy_rules(competition_id, version) on delete restrict,
  check (deadline_at <= starts_at and starts_at < ends_at)
);
create index fantasy_gameweeks_open_idx
  on public.fantasy_gameweeks (competition_id, number)
  where status = 'open';
alter table public.fantasy_gameweeks enable row level security;

create table public.fantasy_teams (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.fantasy_competitions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'My squad' check (length(name) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (competition_id, user_id),
  unique (id, competition_id)
);
create index fantasy_teams_user_idx on public.fantasy_teams (user_id, competition_id);
alter table public.fantasy_teams enable row level security;

create table public.fantasy_team_gameweeks (
  team_id uuid not null,
  competition_id uuid not null,
  gameweek_id uuid not null,
  rule_version integer not null,
  captain_player_id uuid not null,
  vice_captain_player_id uuid not null,
  transfers_used smallint not null default 0 check (transfers_used >= 0),
  submitted_at timestamptz not null default now(),
  primary key (team_id, gameweek_id),
  unique (team_id, competition_id, gameweek_id),
  check (captain_player_id <> vice_captain_player_id),
  foreign key (team_id, competition_id)
    references public.fantasy_teams(id, competition_id) on delete cascade,
  foreign key (gameweek_id, competition_id)
    references public.fantasy_gameweeks(id, competition_id) on delete cascade,
  foreign key (competition_id, rule_version)
    references public.fantasy_rules(competition_id, version) on delete restrict
);
alter table public.fantasy_team_gameweeks enable row level security;

create table public.fantasy_team_selections (
  team_id uuid not null,
  competition_id uuid not null,
  gameweek_id uuid not null,
  rule_version integer not null,
  player_id uuid not null,
  price_at_pick numeric(10,2) not null check (price_at_pick > 0),
  primary key (team_id, gameweek_id, player_id),
  foreign key (team_id, competition_id, gameweek_id)
    references public.fantasy_team_gameweeks(team_id, competition_id, gameweek_id) on delete cascade,
  foreign key (competition_id, rule_version, player_id)
    references public.fantasy_player_prices(competition_id, rule_version, player_id) on delete restrict
);
create index fantasy_team_selections_gameweek_idx
  on public.fantasy_team_selections (gameweek_id, player_id);
alter table public.fantasy_team_selections enable row level security;

create or replace function private.prevent_published_fantasy_rule_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.fantasy_gameweeks g
    where g.competition_id=old.competition_id and g.rule_version=old.version
  ) then
    raise exception 'Published fantasy rules are immutable; create a new version' using errcode='23514';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create trigger fantasy_rules_are_versioned
  before update or delete on public.fantasy_rules
  for each row execute function private.prevent_published_fantasy_rule_update();

create or replace function private.prevent_published_fantasy_price_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_competition_id uuid; v_rule_version integer;
begin
  if tg_op='DELETE' then
    v_competition_id := old.competition_id;
    v_rule_version := old.rule_version;
  else
    v_competition_id := new.competition_id;
    v_rule_version := new.rule_version;
  end if;
  if exists (
    select 1 from public.fantasy_gameweeks g
    where g.competition_id=v_competition_id and g.rule_version=v_rule_version
  ) then
    raise exception 'Published fantasy prices are immutable; create a new rules version' using errcode='23514';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create trigger fantasy_player_prices_are_versioned
  before insert or update or delete on public.fantasy_player_prices
  for each row execute function private.prevent_published_fantasy_price_update();

create policy fantasy_competitions_public_read on public.fantasy_competitions
  for select to anon, authenticated using (status <> 'draft');
create policy fantasy_rules_public_read on public.fantasy_rules
  for select to anon, authenticated using (
    exists (select 1 from public.fantasy_competitions c where c.id=competition_id and c.status <> 'draft')
  );
create policy fantasy_prices_public_read on public.fantasy_player_prices
  for select to anon, authenticated using (
    exists (select 1 from public.fantasy_competitions c where c.id=competition_id and c.status <> 'draft')
  );
create policy fantasy_gameweeks_public_read on public.fantasy_gameweeks
  for select to anon, authenticated using (
    exists (select 1 from public.fantasy_competitions c where c.id=competition_id and c.status <> 'draft')
  );
create policy fantasy_teams_owner_read on public.fantasy_teams
  for select to authenticated using (user_id=auth.uid());
create policy fantasy_team_gameweeks_owner_read on public.fantasy_team_gameweeks
  for select to authenticated using (
    exists (select 1 from public.fantasy_teams t where t.id=team_id and t.user_id=auth.uid())
  );
create policy fantasy_selections_owner_read on public.fantasy_team_selections
  for select to authenticated using (
    exists (select 1 from public.fantasy_teams t where t.id=team_id and t.user_id=auth.uid())
  );

create or replace function public.save_fantasy_squad(
  p_competition_id uuid,
  p_gameweek_id uuid,
  p_rule_version integer,
  p_player_ids uuid[],
  p_captain_player_id uuid,
  p_vice_captain_player_id uuid
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  competition_row public.fantasy_competitions%rowtype;
  gameweek_row public.fantasy_gameweeks%rowtype;
  rule_row public.fantasy_rules%rowtype;
  v_team_id uuid;
  prior_gameweek_id uuid;
  prior_number smallint;
  selected_count integer;
  roster_cost numeric(12,2);
  transfers integer := 0;
  position_min_sum integer := 0;
  position_max_sum integer := 0;
  position_min integer;
  position_max integer;
  position_row record;
  actual_count integer;
begin
  if actor is null then
    raise exception 'Sign in required' using errcode='42501';
  end if;
  if p_player_ids is null or p_captain_player_id is null or p_vice_captain_player_id is null then
    raise exception 'A complete squad is required' using errcode='23514';
  end if;
  if cardinality(p_player_ids) > 40 then
    raise exception 'Your squad is too large' using errcode='23514';
  end if;
  if cardinality(p_player_ids) <> (select count(distinct picked.player_id) from unnest(p_player_ids) as picked(player_id)) then
    raise exception 'Each player can only be selected once' using errcode='23514';
  end if;
  if p_captain_player_id = p_vice_captain_player_id
    or not (p_captain_player_id = any(p_player_ids))
    or not (p_vice_captain_player_id = any(p_player_ids)) then
    raise exception 'Choose two different captains from your squad' using errcode='23514';
  end if;

  -- Serializes first-time team creation and transfer checks for this competition.
  select * into competition_row from public.fantasy_competitions
    where id=p_competition_id and status='open' for update;
  if not found then
    raise exception 'Fantasy competition is not open' using errcode='23514';
  end if;
  select * into gameweek_row from public.fantasy_gameweeks
    where id=p_gameweek_id and competition_id=p_competition_id and status='open'
      and now() < deadline_at;
  if not found then
    raise exception 'Gameweek deadline has passed or is not open' using errcode='23514';
  end if;
  if p_rule_version <> gameweek_row.rule_version then
    raise exception 'Fantasy rules changed. Refresh and try again.' using errcode='23514';
  end if;
  select * into rule_row from public.fantasy_rules
    where competition_id=p_competition_id and version=gameweek_row.rule_version;
  if not found then
    raise exception 'Fantasy rules are unavailable' using errcode='23514';
  end if;
  if cardinality(p_player_ids) <> rule_row.squad_size then
    raise exception 'Choose the required number of players' using errcode='23514';
  end if;

  select count(*), coalesce(sum(price),0) into selected_count,roster_cost
    from public.fantasy_player_prices
    where competition_id=p_competition_id and rule_version=gameweek_row.rule_version
      and player_id=any(p_player_ids);
  if selected_count <> rule_row.squad_size then
    raise exception 'One or more players are unavailable for this competition' using errcode='23514';
  end if;
  if roster_cost > rule_row.budget then
    raise exception 'Your squad is over budget' using errcode='23514';
  end if;
  if exists (
    select 1 from public.fantasy_player_prices fp
    join public.players p on p.id=fp.player_id and p.sport_id=fp.sport_id
    where fp.competition_id=p_competition_id and fp.rule_version=gameweek_row.rule_version
      and fp.player_id=any(p_player_ids) and p.team_id is not null
    group by p.team_id having count(*) > rule_row.team_cap
  ) then
    raise exception 'Your squad exceeds the per-team player limit' using errcode='23514';
  end if;
  for position_row in select key,value from jsonb_each(rule_row.position_limits) loop
    if jsonb_typeof(position_row.value) <> 'object'
      or not (position_row.value ?& array['min','max'])
      or (position_row.value->>'min') !~ '^[0-9]{1,2}$'
      or (position_row.value->>'max') !~ '^[0-9]{1,2}$' then
      raise exception 'Fantasy position rules are invalid' using errcode='23514';
    end if;
    position_min := (position_row.value->>'min')::integer;
    position_max := (position_row.value->>'max')::integer;
    if position_min > position_max or position_max > rule_row.squad_size then
      raise exception 'Fantasy position rules are invalid' using errcode='23514';
    end if;
    position_min_sum := position_min_sum + position_min;
    position_max_sum := position_max_sum + position_max;
    select count(*) into actual_count
      from public.fantasy_player_prices fp
      join public.players p on p.id=fp.player_id and p.sport_id=fp.sport_id
      where fp.competition_id=p_competition_id and fp.rule_version=gameweek_row.rule_version
        and fp.player_id=any(p_player_ids) and p.position=position_row.key;
    if actual_count < position_min or actual_count > position_max then
      raise exception 'Your squad does not match the required player positions' using errcode='23514';
    end if;
  end loop;
  if position_min_sum > rule_row.squad_size or position_max_sum < rule_row.squad_size then
    raise exception 'Fantasy position rules do not match the roster size' using errcode='23514';
  end if;
  if exists (
    select 1 from public.fantasy_player_prices fp
    join public.players p on p.id=fp.player_id and p.sport_id=fp.sport_id
    where fp.competition_id=p_competition_id and fp.rule_version=gameweek_row.rule_version
      and fp.player_id=any(p_player_ids)
      and not (rule_row.position_limits ? p.position)
  ) then
    raise exception 'A selected player has no position rule' using errcode='23514';
  end if;

  select id into v_team_id from public.fantasy_teams
    where competition_id=p_competition_id and user_id=actor for update;
  if v_team_id is null then
    insert into public.fantasy_teams(competition_id,user_id)
      values(p_competition_id,actor) returning id into v_team_id;
  end if;
  select g.id,g.number into prior_gameweek_id,prior_number
    from public.fantasy_team_gameweeks tg
    join public.fantasy_gameweeks g on g.id=tg.gameweek_id
    where tg.team_id=v_team_id and g.competition_id=p_competition_id and g.number < gameweek_row.number
    order by g.number desc limit 1;
  if prior_gameweek_id is not null then
    select count(*) into transfers from unnest(p_player_ids) proposed(player_id)
      where not exists (
        select 1 from public.fantasy_team_selections old
        where old.team_id=v_team_id and old.gameweek_id=prior_gameweek_id
          and old.player_id=proposed.player_id
      );
    if transfers > rule_row.transfers_per_gameweek then
      raise exception 'Your squad exceeds the transfer limit for this gameweek' using errcode='23514';
    end if;
  end if;
  insert into public.fantasy_team_gameweeks(
    team_id,competition_id,gameweek_id,rule_version,captain_player_id,vice_captain_player_id,transfers_used,submitted_at
  ) values (
    v_team_id,p_competition_id,p_gameweek_id,gameweek_row.rule_version,
    p_captain_player_id,p_vice_captain_player_id,transfers,now()
  ) on conflict (team_id,gameweek_id) do update set
    rule_version=excluded.rule_version,
    captain_player_id=excluded.captain_player_id,
    vice_captain_player_id=excluded.vice_captain_player_id,
    transfers_used=excluded.transfers_used,
    submitted_at=excluded.submitted_at;
  delete from public.fantasy_team_selections
    where team_id=v_team_id and gameweek_id=p_gameweek_id;
  insert into public.fantasy_team_selections(team_id,competition_id,gameweek_id,rule_version,player_id,price_at_pick)
    select v_team_id,p_competition_id,p_gameweek_id,gameweek_row.rule_version,fp.player_id,fp.price
    from public.fantasy_player_prices fp
    where fp.competition_id=p_competition_id and fp.rule_version=gameweek_row.rule_version
      and fp.player_id=any(p_player_ids);
  update public.fantasy_teams set updated_at=now() where id=v_team_id;
  return v_team_id;
end $$;

revoke all on public.fantasy_competitions,public.fantasy_rules,public.fantasy_player_prices,
  public.fantasy_gameweeks,public.fantasy_teams,public.fantasy_team_gameweeks,
  public.fantasy_team_selections from public,anon,authenticated,service_role;
grant select on public.fantasy_competitions,public.fantasy_rules,
  public.fantasy_player_prices,public.fantasy_gameweeks to anon,authenticated;
grant select on public.fantasy_teams,public.fantasy_team_gameweeks,
  public.fantasy_team_selections to authenticated;
grant all on public.fantasy_competitions,public.fantasy_rules,public.fantasy_player_prices,
  public.fantasy_gameweeks,public.fantasy_teams,public.fantasy_team_gameweeks,
  public.fantasy_team_selections to service_role;
revoke all on function public.save_fantasy_squad(uuid,uuid,integer,uuid[],uuid,uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.save_fantasy_squad(uuid,uuid,integer,uuid[],uuid,uuid)
  to authenticated;
revoke all on function private.prevent_published_fantasy_rule_update(),
  private.prevent_published_fantasy_price_update() from public,anon,authenticated,service_role;
