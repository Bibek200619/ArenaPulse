import { writeFileSync, readFileSync } from 'node:fs';
import catalog from '../src/features/sports/demo-catalog.ts';
// Pure file generation. Never connects to a database or reads credentials.
const lines = [
  '-- GENERATED fictional demo data. Not live sports. Regenerate: npm run db:seed:generate',
  'begin;',
];
const quote = (value) =>
  value === null
    ? 'null'
    : typeof value === 'boolean' || typeof value === 'number'
      ? String(value)
      : "'" + String(value).replaceAll("'", "''") + "'";
function insert(table, rows) {
  for (const row of rows) {
    const keys = Object.keys(row);
    lines.push(
      `insert into public.${table} (${keys.join(',')}) values (${keys.map((key) => quote(row[key])).join(',')}) on conflict do nothing;`,
    );
  }
}
insert('sports_data_sources', [
  {
    id: 'arenapulse-demo-v1',
    label: 'Fictional demo data · Snapshot 9 Sep 2026 · Not live coverage',
    is_demo: true,
  },
]);
insert('sports', catalog.sports);
insert(
  'competitions',
  catalog.competitions.map((c) => ({
    id: c.id,
    sport_id: c.sportId,
    name: c.name,
    country: c.country,
  })),
);
insert(
  'seasons',
  catalog.seasons.map((s) => ({
    id: s.id,
    competition_id: s.competitionId,
    name: s.name,
    starts_on: s.startsOn,
    ends_on: s.endsOn,
  })),
);
insert(
  'teams',
  catalog.teams.map((t) => ({
    id: t.id,
    sport_id: t.sportId,
    name: t.name,
    short_name: t.shortName,
    country: t.country,
    color: t.color,
  })),
);
insert(
  'players',
  catalog.players.map((p) => ({
    id: p.id,
    sport_id: p.sportId,
    team_id: p.teamId,
    name: p.name,
    position: p.position,
    nationality: p.nationality,
  })),
);
insert('venues', catalog.venues);
for (const m of catalog.matches) {
  insert('matches', [
    {
      id: m.id,
      sport_id: m.sportId,
      competition_id: m.competitionId,
      season_id: m.seasonId,
      venue_id: m.venueId,
      starts_at: m.startsAt,
      state: m.state,
      clock: m.clock,
      source_id: 'arenapulse-demo-v1',
      observed_at: '2026-09-09T18:00:00Z',
    },
  ]);
  insert(
    'match_participants',
    m.participants.map((p, i) => ({
      id: p.id,
      match_id: m.id,
      sport_id: m.sportId,
      team_id: p.kind === 'team' ? p.entityId : null,
      player_id: p.kind === 'player' ? p.entityId : null,
      score: p.score,
      winner: p.winner,
      display_order: i,
    })),
  );
  insert(
    'match_events',
    m.events.map((e) => ({
      id: e.id,
      match_id: m.id,
      participant_id: e.participantId,
      player_id: e.playerId,
      type: e.type,
      period: e.period,
      clock: e.clock,
      description: e.description,
      sequence: e.sequence,
    })),
  );
  insert(
    'match_statistics',
    m.statistics.map((s) => ({
      match_id: m.id,
      participant_id: s.participantId,
      code: s.code,
      label: s.label,
      value: s.value,
      unit: s.unit,
    })),
  );
  insert(
    'match_lineups',
    m.lineups.map((l) => ({
      match_id: m.id,
      participant_id: l.participantId,
      player_id: l.playerId,
      position: l.position,
      starter: l.starter,
    })),
  );
}
insert(
  'standings',
  catalog.standings.map((s) => ({
    competition_id: s.competitionId,
    season_id: s.seasonId,
    team_id: s.teamId,
    sport_id: catalog.competitions.find((c) => c.id === s.competitionId)
      .sportId,
    rank: s.rank,
    played: s.played,
    won: s.won,
    drawn: s.drawn,
    lost: s.lost,
    points: s.points,
  })),
);
lines.push('commit;', '');
const output = lines.join('\n');
const path = new URL('../supabase/seed.sql', import.meta.url);
if (process.argv.includes('--check')) {
  if (readFileSync(path, 'utf8') !== output)
    throw new Error(
      'Sports SQL seed differs from the typed catalog. Regenerate it.',
    );
  console.log('Sports seed matches the typed demo catalog.');
} else {
  writeFileSync(path, output);
  console.log('Generated fictional sports seed.');
}
