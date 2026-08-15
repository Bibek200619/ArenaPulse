CREATE TABLE "public"."competition_follows" (
  "user_id"        uuid                     NOT NULL,
  "competition_id" uuid                     NOT NULL,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "competition_follows_pkey" PRIMARY KEY (user_id, competition_id)
);

ALTER TABLE "public"."competition_follows"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."competitions" (
  "id"       uuid NOT NULL,
  "sport_id" uuid NOT NULL,
  "name"     text NOT NULL,
  "country"  text NOT NULL,
  CONSTRAINT "competitions_id_sport_id_key" UNIQUE (id, sport_id),
  CONSTRAINT "competitions_name_check" CHECK (((length(name) >= 1) AND (length(name) <= 160))),
  CONSTRAINT "competitions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."competitions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."match_events" (
  "id"             uuid    NOT NULL,
  "match_id"       uuid    NOT NULL,
  "participant_id" uuid    NOT NULL,
  "player_id"      uuid,
  "type"           text    NOT NULL,
  "period"         text    NOT NULL,
  "clock"          text    NOT NULL,
  "description"    text    NOT NULL,
  "sequence"       integer NOT NULL,
  CONSTRAINT "match_events_match_id_sequence_key" UNIQUE (match_id, SEQUENCE),
  CONSTRAINT "match_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "match_events_sequence_check" CHECK ((sequence >= 0))
);

ALTER TABLE "public"."match_events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."match_lineups" (
  "match_id"       uuid    NOT NULL,
  "participant_id" uuid    NOT NULL,
  "player_id"      uuid    NOT NULL,
  "position"       text    NOT NULL,
  "starter"        boolean NOT NULL,
  CONSTRAINT "match_lineups_pkey" PRIMARY KEY (match_id, player_id)
);

ALTER TABLE "public"."match_lineups"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."match_participants" (
  "id"            uuid     NOT NULL,
  "match_id"      uuid     NOT NULL,
  "sport_id"      uuid     NOT NULL,
  "team_id"       uuid,
  "player_id"     uuid,
  "score"         text,
  "winner"        boolean,
  "display_order" smallint NOT NULL,
  CONSTRAINT "match_participants_check" CHECK (((((team_id IS NOT NULL))::integer + ((player_id IS NOT NULL))::integer) = 1)),
  CONSTRAINT "match_participants_display_order_check" CHECK ((display_order >= 0)),
  CONSTRAINT "match_participants_id_match_id_key" UNIQUE (id, match_id),
  CONSTRAINT "match_participants_match_id_display_order_key" UNIQUE (match_id, display_order),
  CONSTRAINT "match_participants_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."match_participants"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."match_statistics" (
  "match_id"       uuid    NOT NULL,
  "participant_id" uuid    NOT NULL,
  "code"           text    NOT NULL,
  "label"          text    NOT NULL,
  "value"          numeric NOT NULL,
  "unit"           text,
  CONSTRAINT "match_statistics_pkey" PRIMARY KEY (match_id, participant_id, code)
);

ALTER TABLE "public"."match_statistics"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."matches" (
  "id"             uuid                     NOT NULL,
  "sport_id"       uuid                     NOT NULL,
  "competition_id" uuid                     NOT NULL,
  "season_id"      uuid                     NOT NULL,
  "venue_id"       uuid,
  "starts_at"      timestamp with time zone NOT NULL,
  "state"          text                     NOT NULL,
  "clock"          text,
  "source_id"      text                     NOT NULL,
  "observed_at"    timestamp with time zone NOT NULL,
  CONSTRAINT "matches_id_sport_id_key" UNIQUE (id, sport_id),
  CONSTRAINT "matches_pkey" PRIMARY KEY (id),
  CONSTRAINT "matches_state_check"
    CHECK ((state = ANY (ARRAY['scheduled'::text, 'live'::text, 'paused'::text, 'finished'::text, 'postponed'::text, 'cancelled'::text, 'abandoned'::text])))
);

ALTER TABLE "public"."matches"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."player_follows" (
  "user_id"    uuid                     NOT NULL,
  "player_id"  uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "player_follows_pkey" PRIMARY KEY (user_id, player_id)
);

ALTER TABLE "public"."player_follows"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."players" (
  "id"          uuid NOT NULL,
  "sport_id"    uuid NOT NULL,
  "team_id"     uuid,
  "name"        text NOT NULL,
  "position"    text NOT NULL,
  "nationality" text NOT NULL,
  CONSTRAINT "players_id_sport_id_key" UNIQUE (id, sport_id),
  CONSTRAINT "players_name_check" CHECK (((length(name) >= 1) AND (length(name) <= 160))),
  CONSTRAINT "players_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."players"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."seasons" (
  "id"             uuid NOT NULL,
  "competition_id" uuid NOT NULL,
  "name"           text NOT NULL,
  "starts_on"      date NOT NULL,
  "ends_on"        date NOT NULL,
  CONSTRAINT "seasons_check" CHECK ((ends_on >= starts_on)),
  CONSTRAINT "seasons_id_competition_id_key" UNIQUE (id, competition_id),
  CONSTRAINT "seasons_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."seasons"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."sports_data_sources" (
  "id"      text    NOT NULL,
  "label"   text    NOT NULL,
  "is_demo" boolean NOT NULL,
  CONSTRAINT "sports_data_sources_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."sports_data_sources"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."sports" (
  "id"   uuid NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  CONSTRAINT "sports_name_check" CHECK (((length(name) >= 1) AND (length(name) <= 100))),
  CONSTRAINT "sports_pkey" PRIMARY KEY (id),
  CONSTRAINT "sports_slug_check" CHECK ((slug ~ '^[a-z][a-z0-9-]{1,39}$'::text)),
  CONSTRAINT "sports_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."sports"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."standings" (
  "competition_id" uuid    NOT NULL,
  "season_id"      uuid    NOT NULL,
  "team_id"        uuid    NOT NULL,
  "sport_id"       uuid    NOT NULL,
  "rank"           integer NOT NULL,
  "played"         integer NOT NULL,
  "won"            integer NOT NULL,
  "drawn"          integer,
  "lost"           integer NOT NULL,
  "points"         numeric NOT NULL,
  CONSTRAINT "standings_check" CHECK ((played = ((won + COALESCE(drawn, 0)) + lost))),
  CONSTRAINT "standings_drawn_check" CHECK ((drawn >= 0)),
  CONSTRAINT "standings_lost_check" CHECK ((lost >= 0)),
  CONSTRAINT "standings_pkey" PRIMARY KEY (season_id, team_id),
  CONSTRAINT "standings_played_check" CHECK ((played >= 0)),
  CONSTRAINT "standings_rank_check" CHECK ((rank > 0)),
  CONSTRAINT "standings_won_check" CHECK ((won >= 0))
);

ALTER TABLE "public"."standings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."team_follows" (
  "user_id"    uuid                     NOT NULL,
  "team_id"    uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "team_follows_pkey" PRIMARY KEY (user_id, team_id)
);

ALTER TABLE "public"."team_follows"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."teams" (
  "id"         uuid NOT NULL,
  "sport_id"   uuid NOT NULL,
  "name"       text NOT NULL,
  "short_name" text NOT NULL,
  "country"    text NOT NULL,
  "color"      text NOT NULL,
  CONSTRAINT "teams_color_check" CHECK ((color ~ '^#[0-9a-fA-F]{6}$'::text)),
  CONSTRAINT "teams_id_sport_id_key" UNIQUE (id, sport_id),
  CONSTRAINT "teams_name_check" CHECK (((length(name) >= 1) AND (length(name) <= 160))),
  CONSTRAINT "teams_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."teams"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."venues" (
  "id"      uuid NOT NULL,
  "name"    text NOT NULL,
  "city"    text NOT NULL,
  "country" text NOT NULL,
  CONSTRAINT "venues_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."venues"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."competition_follows"
  ADD CONSTRAINT "competition_follows_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."competition_follows"
  ADD CONSTRAINT "competition_follows_competition_id_fkey" FOREIGN KEY (competition_id) REFERENCES public.competitions(id) ON DELETE CASCADE;

ALTER TABLE "public"."match_events"
  ADD CONSTRAINT "match_events_participant_id_match_id_fkey" FOREIGN KEY (participant_id, match_id) REFERENCES public.match_participants(id, match_id) ON DELETE CASCADE;

ALTER TABLE "public"."match_lineups"
  ADD CONSTRAINT "match_lineups_participant_id_match_id_fkey" FOREIGN KEY (participant_id, match_id) REFERENCES public.match_participants(id, match_id) ON DELETE CASCADE;

ALTER TABLE "public"."match_statistics"
  ADD CONSTRAINT "match_statistics_participant_id_match_id_fkey" FOREIGN KEY (participant_id, match_id) REFERENCES public.match_participants(id, match_id) ON DELETE CASCADE;

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_competition_id_sport_id_fkey" FOREIGN KEY (competition_id, sport_id) REFERENCES public.competitions(id, sport_id);

ALTER TABLE "public"."match_participants"
  ADD CONSTRAINT "match_participants_match_id_sport_id_fkey" FOREIGN KEY (match_id, sport_id) REFERENCES public.matches(id, sport_id) ON DELETE CASCADE;

ALTER TABLE "public"."player_follows"
  ADD CONSTRAINT "player_follows_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."match_participants"
  ADD CONSTRAINT "match_participants_player_id_sport_id_fkey" FOREIGN KEY (player_id, sport_id) REFERENCES public.players(id, sport_id);

ALTER TABLE "public"."match_events"
  ADD CONSTRAINT "match_events_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.players(id);

ALTER TABLE "public"."match_lineups"
  ADD CONSTRAINT "match_lineups_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.players(id);

ALTER TABLE "public"."player_follows"
  ADD CONSTRAINT "player_follows_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;

ALTER TABLE "public"."seasons"
  ADD CONSTRAINT "seasons_competition_id_fkey" FOREIGN KEY (competition_id) REFERENCES public.competitions(id);

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_season_id_competition_id_fkey" FOREIGN KEY (season_id, competition_id) REFERENCES public.seasons(id, competition_id);

ALTER TABLE "public"."competitions"
  ADD CONSTRAINT "competitions_sport_id_fkey" FOREIGN KEY (sport_id) REFERENCES public.sports(id);

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_sport_id_fkey" FOREIGN KEY (sport_id) REFERENCES public.sports(id);

ALTER TABLE "public"."players"
  ADD CONSTRAINT "players_sport_id_fkey" FOREIGN KEY (sport_id) REFERENCES public.sports(id);

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.sports_data_sources(id);

ALTER TABLE "public"."standings"
  ADD CONSTRAINT "standings_competition_id_sport_id_fkey" FOREIGN KEY (competition_id, sport_id) REFERENCES public.competitions(id, sport_id);

ALTER TABLE "public"."standings"
  ADD CONSTRAINT "standings_season_id_competition_id_fkey" FOREIGN KEY (season_id, competition_id) REFERENCES public.seasons(id, competition_id);

ALTER TABLE "public"."team_follows"
  ADD CONSTRAINT "team_follows_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."match_participants"
  ADD CONSTRAINT "match_participants_team_id_sport_id_fkey" FOREIGN KEY (team_id, sport_id) REFERENCES public.teams(id, sport_id);

ALTER TABLE "public"."players"
  ADD CONSTRAINT "players_team_id_sport_id_fkey" FOREIGN KEY (team_id, sport_id) REFERENCES public.teams(id, sport_id);

ALTER TABLE "public"."standings"
  ADD CONSTRAINT "standings_team_id_sport_id_fkey" FOREIGN KEY (team_id, sport_id) REFERENCES public.teams(id, sport_id);

ALTER TABLE "public"."team_follows"
  ADD CONSTRAINT "team_follows_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE "public"."teams"
  ADD CONSTRAINT "teams_sport_id_fkey" FOREIGN KEY (sport_id) REFERENCES public.sports(id);

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_venue_id_fkey" FOREIGN KEY (venue_id) REFERENCES public.venues(id);

CREATE INDEX competition_follows_entity_idx ON public.competition_follows USING btree (competition_id);

CREATE INDEX competitions_sport_idx ON public.competitions USING btree (sport_id);

CREATE INDEX events_participant_idx ON public.match_events USING btree (participant_id, match_id);

CREATE INDEX events_player_idx ON public.match_events USING btree (player_id);

CREATE INDEX lineups_participant_idx ON public.match_lineups USING btree (participant_id, match_id);

CREATE INDEX lineups_player_idx ON public.match_lineups USING btree (player_id);

CREATE INDEX matches_competition_idx ON public.matches USING btree (competition_id, sport_id);

CREATE INDEX matches_season_idx ON public.matches USING btree (season_id, competition_id);

CREATE INDEX matches_source_idx ON public.matches USING btree (source_id);

CREATE INDEX matches_sport_start_idx ON public.matches USING btree (sport_id, starts_at, id);

CREATE INDEX matches_start_idx ON public.matches USING btree (starts_at, id);

CREATE INDEX matches_state_start_idx ON public.matches USING btree (state, starts_at, id);

CREATE INDEX matches_venue_idx ON public.matches USING btree (venue_id);

CREATE INDEX participants_player_idx ON public.match_participants USING btree (player_id, sport_id);

CREATE INDEX participants_team_idx ON public.match_participants USING btree (team_id, sport_id);

CREATE INDEX player_follows_entity_idx ON public.player_follows USING btree (player_id);

CREATE INDEX players_sport_idx ON public.players USING btree (sport_id);

CREATE INDEX players_team_idx ON public.players USING btree (team_id, sport_id);

CREATE INDEX seasons_competition_idx ON public.seasons USING btree (competition_id);

CREATE INDEX standings_competition_idx ON public.standings USING btree (competition_id, sport_id);

CREATE INDEX standings_team_idx ON public.standings USING btree (team_id, sport_id);

CREATE INDEX statistics_participant_idx ON public.match_statistics USING btree (participant_id, match_id);

CREATE INDEX team_follows_entity_idx ON public.team_follows USING btree (team_id);

CREATE INDEX teams_sport_idx ON public.teams USING btree (sport_id);

CREATE POLICY "competition_follows_owner_delete" ON "public"."competition_follows"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "competition_follows_owner_insert" ON "public"."competition_follows"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "competition_follows_owner_read" ON "public"."competition_follows"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "competitions_public_read" ON "public"."competitions"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "match_events_public_read" ON "public"."match_events"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "match_lineups_public_read" ON "public"."match_lineups"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "match_participants_public_read" ON "public"."match_participants"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "match_statistics_public_read" ON "public"."match_statistics"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "matches_public_read" ON "public"."matches"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "player_follows_owner_delete" ON "public"."player_follows"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "player_follows_owner_insert" ON "public"."player_follows"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "player_follows_owner_read" ON "public"."player_follows"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "players_public_read" ON "public"."players"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "seasons_public_read" ON "public"."seasons"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "sports_public_read" ON "public"."sports"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "sports_data_sources_public_read" ON "public"."sports_data_sources"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "standings_public_read" ON "public"."standings"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "team_follows_owner_delete" ON "public"."team_follows"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "team_follows_owner_insert" ON "public"."team_follows"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "team_follows_owner_read" ON "public"."team_follows"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "teams_public_read" ON "public"."teams"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "venues_public_read" ON "public"."venues"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

REVOKE ALL ("competition_id") ON TABLE "public"."competition_follows" FROM "authenticated";

GRANT INSERT ("competition_id") ON TABLE "public"."competition_follows" TO "authenticated";

REVOKE ALL ("user_id") ON TABLE "public"."competition_follows" FROM "authenticated";

GRANT INSERT ("user_id") ON TABLE "public"."competition_follows" TO "authenticated";

REVOKE ALL ON TABLE "public"."competition_follows" FROM "authenticated";

GRANT DELETE, SELECT ON TABLE "public"."competition_follows" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."competition_follows" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."competitions" FROM "anon";

GRANT SELECT ON TABLE "public"."competitions" TO "anon";

REVOKE ALL ON TABLE "public"."competitions" FROM "authenticated";

GRANT SELECT ON TABLE "public"."competitions" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."competitions" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."match_events" FROM "anon";

GRANT SELECT ON TABLE "public"."match_events" TO "anon";

REVOKE ALL ON TABLE "public"."match_events" FROM "authenticated";

GRANT SELECT ON TABLE "public"."match_events" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."match_events" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."match_lineups" FROM "anon";

GRANT SELECT ON TABLE "public"."match_lineups" TO "anon";

REVOKE ALL ON TABLE "public"."match_lineups" FROM "authenticated";

GRANT SELECT ON TABLE "public"."match_lineups" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."match_lineups" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."match_participants" FROM "anon";

GRANT SELECT ON TABLE "public"."match_participants" TO "anon";

REVOKE ALL ON TABLE "public"."match_participants" FROM "authenticated";

GRANT SELECT ON TABLE "public"."match_participants" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."match_participants" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."match_statistics" FROM "anon";

GRANT SELECT ON TABLE "public"."match_statistics" TO "anon";

REVOKE ALL ON TABLE "public"."match_statistics" FROM "authenticated";

GRANT SELECT ON TABLE "public"."match_statistics" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."match_statistics" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."matches" FROM "anon";

GRANT SELECT ON TABLE "public"."matches" TO "anon";

REVOKE ALL ON TABLE "public"."matches" FROM "authenticated";

GRANT SELECT ON TABLE "public"."matches" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."matches" TO "postgres", "service_role";

REVOKE ALL ("player_id") ON TABLE "public"."player_follows" FROM "authenticated";

GRANT INSERT ("player_id") ON TABLE "public"."player_follows" TO "authenticated";

REVOKE ALL ("user_id") ON TABLE "public"."player_follows" FROM "authenticated";

GRANT INSERT ("user_id") ON TABLE "public"."player_follows" TO "authenticated";

REVOKE ALL ON TABLE "public"."player_follows" FROM "authenticated";

GRANT DELETE, SELECT ON TABLE "public"."player_follows" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."player_follows" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."players" FROM "anon";

GRANT SELECT ON TABLE "public"."players" TO "anon";

REVOKE ALL ON TABLE "public"."players" FROM "authenticated";

GRANT SELECT ON TABLE "public"."players" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."players" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."seasons" FROM "anon";

GRANT SELECT ON TABLE "public"."seasons" TO "anon";

REVOKE ALL ON TABLE "public"."seasons" FROM "authenticated";

GRANT SELECT ON TABLE "public"."seasons" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."seasons" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."sports" FROM "anon";

GRANT SELECT ON TABLE "public"."sports" TO "anon";

REVOKE ALL ON TABLE "public"."sports" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sports" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sports" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."sports_data_sources" FROM "anon";

GRANT SELECT ON TABLE "public"."sports_data_sources" TO "anon";

REVOKE ALL ON TABLE "public"."sports_data_sources" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sports_data_sources" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sports_data_sources" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."standings" FROM "anon";

GRANT SELECT ON TABLE "public"."standings" TO "anon";

REVOKE ALL ON TABLE "public"."standings" FROM "authenticated";

GRANT SELECT ON TABLE "public"."standings" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."standings" TO "postgres", "service_role";

REVOKE ALL ("team_id") ON TABLE "public"."team_follows" FROM "authenticated";

GRANT INSERT ("team_id") ON TABLE "public"."team_follows" TO "authenticated";

REVOKE ALL ("user_id") ON TABLE "public"."team_follows" FROM "authenticated";

GRANT INSERT ("user_id") ON TABLE "public"."team_follows" TO "authenticated";

REVOKE ALL ON TABLE "public"."team_follows" FROM "authenticated";

GRANT DELETE, SELECT ON TABLE "public"."team_follows" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."team_follows" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."teams" FROM "anon";

GRANT SELECT ON TABLE "public"."teams" TO "anon";

REVOKE ALL ON TABLE "public"."teams" FROM "authenticated";

GRANT SELECT ON TABLE "public"."teams" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."teams" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."venues" FROM "anon";

GRANT SELECT ON TABLE "public"."venues" TO "anon";

REVOKE ALL ON TABLE "public"."venues" FROM "authenticated";

GRANT SELECT ON TABLE "public"."venues" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."venues" TO "postgres", "service_role";


-- Explicit final ACL baseline: table-level REVOKE also removes earlier column grants.
revoke all on public.team_follows from anon, authenticated;
grant select, delete on public.team_follows to authenticated;
grant insert (user_id,team_id) on public.team_follows to authenticated;
revoke all on public.player_follows from anon, authenticated;
grant select, delete on public.player_follows to authenticated;
grant insert (user_id,player_id) on public.player_follows to authenticated;
revoke all on public.competition_follows from anon, authenticated;
grant select, delete on public.competition_follows to authenticated;
grant insert (user_id,competition_id) on public.competition_follows to authenticated;
