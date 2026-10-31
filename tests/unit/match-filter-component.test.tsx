// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MatchFilters } from '@/components/matches/match-filters';
import catalog from '@/features/sports/demo-catalog';
import { matchFiltersSchema } from '@/features/matches/filters';

afterEach(cleanup);

it('always offers the supported football leagues', () => {
  render(
    <MatchFilters
      filters={matchFiltersSchema.parse({ footballLeague: 'la-liga' })}
      sports={catalog.sports}
      competitions={catalog.competitions}
    />,
  );
  const league = screen.getByLabelText('Football league');
  expect(league).toHaveValue('la-liga');
  expect(
    within(league)
      .getAllByRole('option')
      .map((option) => option.textContent),
  ).toEqual([
    'All football leagues',
    'Champions League',
    'English Premier League',
    'Spanish La Liga',
    'Italian Serie A',
    'Bundesliga',
    'French Ligue 1',
    'Netherlands Eredivisie',
    'Brazilian Serie A',
    'English Football League Championship',
    'Austrian Bundesliga',
  ]);
  expect(screen.queryByLabelText('Competition')).not.toBeInTheDocument();
});

it('keeps the catalog competition filter when no football league is selected', () => {
  render(
    <MatchFilters
      filters={matchFiltersSchema.parse({})}
      sports={catalog.sports}
      competitions={catalog.competitions}
    />,
  );
  expect(screen.getByLabelText('Football league')).toBeInTheDocument();
  expect(screen.getByLabelText('Competition')).toBeInTheDocument();
});
