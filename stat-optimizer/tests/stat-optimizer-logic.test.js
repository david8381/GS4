const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../stat-optimizer-logic.js');

const STATS = [
  { key: 'str', abbr: 'STR' },
  { key: 'con', abbr: 'CON' },
  { key: 'dex', abbr: 'DEX' },
  { key: 'agi', abbr: 'AGI' },
  { key: 'dis', abbr: 'DIS' },
  { key: 'aur', abbr: 'AUR' },
  { key: 'log', abbr: 'LOG' },
  { key: 'int', abbr: 'INT' },
  { key: 'wis', abbr: 'WIS' },
  { key: 'inf', abbr: 'INF' },
];

const DATA = {
  stats: STATS,
  professionPrimeReqs: { Wizard: ['aur', 'log'] },
  levelThresholds: Array.from({ length: 101 }, (_, i) => i * 1000),
  baseGrowthRates: {
    Wizard: {
      str: 1000, con: 1000, dex: 1000, agi: 1000, dis: 1000,
      aur: 1000, log: 1000, int: 1000, wis: 1000, inf: 1000,
    },
  },
  raceGrowthModifiers: {
    Human: {
      str: 0, con: 0, dex: 0, agi: 0, dis: 0,
      aur: 0, log: 0, int: 0, wis: 0, inf: 0,
    },
  },
};

const CONSTRAINTS = {
  minStat: 20,
  maxStat: 22,
  totalPoints: 205,
  maxStatsAbove70: 10,
  maxStatsAbove90: 10,
};

const OBJECTIVE = { priorities: ['ptp', 'mtp', 'overall'] };

test('validateStartStats enforces sum and min', () => {
  const start = {
    str: 20, con: 20, dex: 20, agi: 20, dis: 20,
    aur: 20, log: 20, int: 20, wis: 20, inf: 20,
  };
  const result = logic.validateStartStats(start, CONSTRAINTS);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((msg) => msg.includes('sum')));
});

test('applyPrimeBonuses adds +10 to prime stats', () => {
  const start = {
    str: 22, con: 22, dex: 22, agi: 22, dis: 22,
    aur: 23, log: 24, int: 21, wis: 22, inf: 22,
  };
  const level0 = logic.applyPrimeBonuses(start, ['aur', 'log']);
  assert.equal(level0.aur, 33);
  assert.equal(level0.log, 34);
});

test('evaluateBuild computes metrics for feasible build', () => {
  const start = {
    str: 22, con: 21, dex: 21, agi: 21, dis: 20,
    aur: 20, log: 20, int: 20, wis: 20, inf: 20,
  };
  const result = logic.evaluateBuild({
    data: DATA,
    startStats: start,
    constraints: CONSTRAINTS,
    raceName: 'Human',
    profession: 'Wizard',
    targetLevel: 10,
    targetExperience: -1,
    minimums: { minPtp: 0, minMtp: 0, minFinalStats: {} },
    objectivePreset: OBJECTIVE,
  });

  assert.equal(result.ok, true);
  assert.ok(result.metrics.ptp > 0);
  assert.ok(result.metrics.mtp > 0);
});

test('solveFast returns a feasible best-found build', () => {
  const result = logic.solveFast({
    data: DATA,
    constraints: CONSTRAINTS,
    raceName: 'Human',
    profession: 'Wizard',
    targetLevel: 20,
    targetExperience: -1,
    minimums: { minPtp: 0, minMtp: 0, minFinalStats: {} },
    objectivePreset: OBJECTIVE,
    fastRestarts: 4,
    fastIterations: 400,
  });

  assert.equal(result.status, 'best_found');
  assert.equal(result.build.ok, true);
  assert.equal(logic.sumStats(result.build.startStats), CONSTRAINTS.totalPoints);
});

test('solveExact can prove optimal on small bounded search', () => {
  const result = logic.solveExact({
    data: DATA,
    constraints: CONSTRAINTS,
    raceName: 'Human',
    profession: 'Wizard',
    targetLevel: 20,
    targetExperience: -1,
    minimums: { minPtp: 0, minMtp: 0, minFinalStats: {} },
    objectivePreset: OBJECTIVE,
    maxSeconds: 3,
  });

  assert.equal(result.provenOptimal, true);
  assert.equal(result.status, 'optimal');
  assert.equal(logic.sumStats(result.build.startStats), CONSTRAINTS.totalPoints);
});
