export type FantasyDemoCompetition = {
  id: string;
  sourceCompetitionId: string;
  sportId: string;
  name: string;
  squadSize: number;
  budget: number;
  teamCap: number;
  captainMultiplier: number;
  viceCaptainMultiplier: number;
  transfersPerGameweek: number;
  scoringRules: Record<string, number>;
  positionLimits: Record<string, { min: number; max: number }>;
  prices: Record<string, number>;
  gameweeks: { id: string; number: number }[];
};

export const fantasyDemoCompetitions: FantasyDemoCompetition[] = [
  {
    id: 'f0000000-0000-4000-8000-000000000001',
    sourceCompetitionId: 'd8130560-9c76-5511-99d5-2f27d88fec0a',
    sportId: '4d1c1748-a630-5b7e-9080-9c0cc99f60fa',
    name: 'Harbour Fantasy League',
    squadSize: 4,
    budget: 32,
    teamCap: 2,
    captainMultiplier: 2,
    viceCaptainMultiplier: 1.5,
    transfersPerGameweek: 2,
    scoringRules: {
      goal: 5,
      assist: 3,
      yellow_card: -1,
      red_card: -3,
      own_goal: -2,
    },
    positionLimits: {
      Goalkeeper: { min: 1, max: 1 },
      Defender: { min: 1, max: 1 },
      Midfielder: { min: 1, max: 1 },
      Forward: { min: 1, max: 1 },
    },
    prices: { Goalkeeper: 6, Defender: 6, Midfielder: 8, Forward: 10 },
    gameweeks: [
      { id: 'f0000000-0000-4000-8000-000000000101', number: 1 },
      { id: 'f0000000-0000-4000-8000-000000000102', number: 2 },
      { id: 'f0000000-0000-4000-8000-000000000103', number: 3 },
    ],
  },
  {
    id: 'f0000000-0000-4000-8000-000000000002',
    sourceCompetitionId: '6b859309-c119-5773-8244-b62037f640e4',
    sportId: '890b07ac-6e1d-501d-82b2-800b6f2e8439',
    name: 'Coastal T20 Fantasy Cup',
    squadSize: 4,
    budget: 30,
    teamCap: 2,
    captainMultiplier: 2,
    viceCaptainMultiplier: 1.5,
    transfersPerGameweek: 2,
    scoringRules: { run: 1, four: 1, six: 2, wicket: 20, catch: 8 },
    positionLimits: {
      Wicketkeeper: { min: 1, max: 1 },
      Batter: { min: 1, max: 1 },
      'All-rounder': { min: 1, max: 1 },
      Bowler: { min: 1, max: 1 },
    },
    prices: { Wicketkeeper: 6, Batter: 7, 'All-rounder': 8, Bowler: 6 },
    gameweeks: [
      { id: 'f0000000-0000-4000-8000-000000000201', number: 1 },
      { id: 'f0000000-0000-4000-8000-000000000202', number: 2 },
      { id: 'f0000000-0000-4000-8000-000000000203', number: 3 },
    ],
  },
  {
    id: 'f0000000-0000-4000-8000-000000000003',
    sourceCompetitionId: '2f67d248-ca38-502b-b0dc-996d0216d348',
    sportId: 'eda44f75-c7f5-570c-a588-54db4cf1afbf',
    name: 'Metro Basketball Fantasy Series',
    squadSize: 4,
    budget: 50,
    teamCap: 2,
    captainMultiplier: 2,
    viceCaptainMultiplier: 1.5,
    transfersPerGameweek: 2,
    scoringRules: {
      field_goal: 2,
      three_pointer: 3,
      rebound: 1,
      assist: 2,
      block: 3,
      steal: 3,
      turnover: -1,
    },
    positionLimits: {
      Guard: { min: 2, max: 2 },
      Forward: { min: 1, max: 1 },
      Center: { min: 1, max: 1 },
    },
    prices: { Guard: 10, Forward: 12, Center: 13 },
    gameweeks: [
      { id: 'f0000000-0000-4000-8000-000000000301', number: 1 },
      { id: 'f0000000-0000-4000-8000-000000000302', number: 2 },
      { id: 'f0000000-0000-4000-8000-000000000303', number: 3 },
    ],
  },
];
