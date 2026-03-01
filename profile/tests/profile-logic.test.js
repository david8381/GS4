const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../profile-logic.js');

const STATS = [
  { key: 'str' },
  { key: 'con' },
  { key: 'dex' },
];

const SKILL_CATALOG = [
  'Armor Use',
  'Picking Pockets',
  'Mental Lore - Manipulation',
  'Wizard',
];

const SKILL_ALIAS_MAP = {
  pickpocketing: 'Picking Pockets',
  'mental lore, manipulation': 'Mental Lore - Manipulation',
};

test('clamp limits values', () => {
  assert.equal(logic.clamp(10, 1, 5), 5);
  assert.equal(logic.clamp(-1, 1, 5), 1);
  assert.equal(logic.clamp(3, 1, 5), 3);
});

test('normalizeRaceName normalizes known aliases', () => {
  assert.equal(logic.normalizeRaceName('darkelf'), 'Dark Elf');
  assert.equal(logic.normalizeRaceName('half krolvin'), 'Half-Krolvin');
  assert.equal(logic.normalizeRaceName('ForestGnome'), 'Forest Gnome');
});

test('canonicalSkillName uses alias, exact, and fuzzy matching', () => {
  assert.equal(logic.canonicalSkillName('pickpocketing', SKILL_ALIAS_MAP, SKILL_CATALOG), 'Picking Pockets');
  assert.equal(logic.canonicalSkillName('Wizard', SKILL_ALIAS_MAP, SKILL_CATALOG), 'Wizard');
  assert.equal(logic.canonicalSkillName('Mental Lore - Manip', SKILL_ALIAS_MAP, SKILL_CATALOG), 'Mental Lore - Manipulation');
});

test('defaultStatMap builds keyed payload', () => {
  assert.deepEqual(logic.defaultStatMap(STATS, 50), { str: 50, con: 50, dex: 50 });
});

test('computeStatsFromLevel0 computes growth per level', () => {
  const baseGrowthRates = {
    Wizard: { str: 10, con: 20, dex: 25 },
  };
  const raceGrowthModifiers = {
    Human: { str: 0, con: 0, dex: 0 },
  };
  const result = logic.computeStatsFromLevel0({
    stats: STATS,
    level0Stats: { str: 90, con: 50, dex: 30 },
    level: 10,
    raceName: 'Human',
    profession: 'Wizard',
    baseGrowthRates,
    raceGrowthModifiers,
  });

  assert.equal(result.str.base, 91);
  assert.equal(result.con.base, 55);
  assert.equal(result.dex.base, 40);
});

test('getRaceBonusModifier uses normalized race key', () => {
  const raceStatBonusModifiers = {
    'Dark Elf': { dex: 10 },
  };
  assert.equal(logic.getRaceBonusModifier(raceStatBonusModifiers, 'darkelf', 'dex'), 10);
  assert.equal(logic.getRaceBonusModifier(raceStatBonusModifiers, 'darkelf', 'str'), 0);
});

test('mergeSkillsWithCatalog canonicalizes and fills missing skills', () => {
  const merged = logic.mergeSkillsWithCatalog([
    { name: 'pickpocketing', ranks: 5 },
    { name: 'wizard', ranks: 20 },
  ], SKILL_CATALOG, SKILL_ALIAS_MAP);

  assert.equal(merged.find((s) => s.name === 'Picking Pockets').ranks, 5);
  assert.equal(merged.find((s) => s.name === 'Wizard').ranks, 20);
  assert.ok(merged.find((s) => s.name === 'Armor Use'));
});

test('skillBonusFromRanks follows GS curve', () => {
  assert.equal(logic.skillBonusFromRanks(10), 50);
  assert.equal(logic.skillBonusFromRanks(20), 90);
  assert.equal(logic.skillBonusFromRanks(30), 120);
  assert.equal(logic.skillBonusFromRanks(40), 140);
  assert.equal(logic.skillBonusFromRanks(50), 150);
});
