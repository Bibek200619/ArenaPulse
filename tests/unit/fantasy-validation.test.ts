import { describe, expect, it } from 'vitest';
import { saveFantasySquadSchema } from '@/features/fantasy/validation';

const playerIds = [
  '746cbcb5-71dd-58a3-b928-924b93d29b2d',
  '14eccdd6-495a-5f05-a8d9-1b28d89ffafe',
  'c491d82a-a1d4-5be9-8869-a1c0d5244f84',
  'c4ebb462-879a-5102-a8e5-feba3125ca14',
];
const valid = {
  competitionId: 'f0000000-0000-4000-8000-000000000001',
  gameweekId: 'f0000000-0000-4000-8000-000000000101',
  ruleVersion: 1,
  playerIds,
  captainPlayerId: playerIds[0],
  viceCaptainPlayerId: playerIds[1],
};

describe('fantasy squad input', () => {
  it('accepts a complete roster with distinct selected captains', () => {
    expect(saveFantasySquadSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects duplicate players, captains outside the roster, and reused captains', () => {
    expect(
      saveFantasySquadSchema.safeParse({
        ...valid,
        playerIds: [...playerIds, playerIds[0]],
      }).success,
    ).toBe(false);
    expect(
      saveFantasySquadSchema.safeParse({
        ...valid,
        captainPlayerId: '514420d3-75de-5815-b97e-fc424f9c272d',
      }).success,
    ).toBe(false);
    expect(
      saveFantasySquadSchema.safeParse({
        ...valid,
        viceCaptainPlayerId: valid.captainPlayerId,
      }).success,
    ).toBe(false);
  });

  it('rejects malformed IDs, invalid versions and oversized rosters', () => {
    expect(
      saveFantasySquadSchema.safeParse({ ...valid, gameweekId: 'bad' }).success,
    ).toBe(false);
    expect(
      saveFantasySquadSchema.safeParse({ ...valid, ruleVersion: 0 }).success,
    ).toBe(false);
    expect(
      saveFantasySquadSchema.safeParse({
        ...valid,
        playerIds: Array(41).fill(playerIds[0]),
      }).success,
    ).toBe(false);
  });
});
