// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MatchFilters } from '@/components/matches/match-filters';
import catalog from '@/features/sports/demo-catalog';
import { matchFiltersSchema } from '@/features/matches/filters';

afterEach(cleanup);

it('offers the requested football leagues when SportScore is active', () => {
  render(
    <MatchFilters
      filters={matchFiltersSchema.parse({ footballLeague: 'la-liga' })}
      sports={catalog.sports}
      competitions={catalog.competitions}
      liveFootballEnabled
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
    'Premier League',
    'La Liga',
  ]);
  expect(screen.queryByLabelText('Competition')).not.toBeInTheDocument();
});

it('keeps the catalog competition filter when live football is disabled', () => {
  render(
    <MatchFilters
      filters={matchFiltersSchema.parse({})}
      sports={catalog.sports}
      competitions={catalog.competitions}
      liveFootballEnabled={false}
    />,
  );
  expect(screen.queryByLabelText('Football league')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Competition')).toBeInTheDocument();
});
