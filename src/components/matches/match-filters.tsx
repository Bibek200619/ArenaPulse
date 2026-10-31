import Link from 'next/link';
import {
  footballLeagues,
  type Sport,
  type Competition,
} from '@/features/sports/types';
import type { MatchFilters as Filters } from '@/features/matches/filters';
export function MatchFilters({
  filters,
  sports,
  competitions,
  liveFootballEnabled,
}: {
  filters: Filters;
  sports: Sport[];
  competitions: Competition[];
  liveFootballEnabled: boolean;
}) {
  return (
    <form action="/matches" className="match-filters">
      <div className="filter-field">
        <label htmlFor="match-view">Show</label>
        <select id="match-view" name="view" defaultValue={filters.view}>
          <option value="all">All matches</option>
          <option value="live">Live</option>
          <option value="today">Today (UTC)</option>
          <option value="upcoming">Upcoming</option>
          <option value="finished">Finished</option>
        </select>
      </div>
      <div className="filter-field">
        <label htmlFor="match-sport">Sport</label>
        <select
          id="match-sport"
          name="sportId"
          defaultValue={filters.sportId ?? ''}
        >
          <option value="">All sports</option>
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>
      </div>
      {liveFootballEnabled && (
        <div className="filter-field">
          <label htmlFor="match-football-league">Football league</label>
          <select
            id="match-football-league"
            name="footballLeague"
            defaultValue={filters.footballLeague ?? ''}
          >
            <option value="">All football leagues</option>
            {footballLeagues.map((league) => (
              <option key={league.value} value={league.value}>
                {league.label}
              </option>
            ))}
          </select>
          <small>
            League selection shows fixtures for the selected UTC date.
          </small>
        </div>
      )}
      {!filters.footballLeague && (
        <div className="filter-field">
          <label htmlFor="match-competition">Competition</label>
          <select
            id="match-competition"
            name="competitionId"
            defaultValue={filters.competitionId ?? ''}
          >
            <option value="">All competitions</option>
            {competitions.map((competition) => (
              <option key={competition.id} value={competition.id}>
                {competition.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="filter-field">
        <label htmlFor="match-date">Date (UTC)</label>
        <input
          id="match-date"
          type="date"
          name="date"
          defaultValue={filters.date ?? ''}
          aria-describedby="date-help"
        />
      </div>
      <button className="button" type="submit">
        Apply filters
      </button>
      <Link className="text-link" href="/matches">
        Clear filters
      </Link>
      <p id="date-help" className="muted">
        Today uses the current UTC date and overrides the date field.
      </p>
    </form>
  );
}
