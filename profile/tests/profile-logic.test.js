const test = require("node:test");
const assert = require("node:assert/strict");

const {
  clamp,
  normalizeRaceName,
  skillKey,
  canonicalSkillName,
  defaultStatMap,
  computeStatsFromLevel0,
  getRaceBonusModifier,
  mergeSkillsWithCatalog,
  skillBonusFromRanks,
  experienceForLevel,
  estimateTotalAscensionPoints,
  multiplierUnitsForRanks,
  summarizeTrainingPointConversion,
} = require("../profile-logic.js");

test("clamp limits values", () => {
  assert.equal(clamp(5, 1, 10), 5);
  assert.equal(clamp(-1, 1, 10), 1);
  assert.equal(clamp(99, 1, 10), 10);
});

test("normalizeRaceName normalizes known aliases", () => {
  assert.equal(normalizeRaceName("darkelf"), "Dark Elf");
  assert.equal(normalizeRaceName("halfelf"), "Half-Elf");
  assert.equal(normalizeRaceName("forestgnome"), "Forest Gnome");
});

test("canonicalSkillName uses alias, exact, and fuzzy matching", () => {
  const skillCatalog = ["Arcane Symbols", "Magic Item Use", "Elemental Mana Control"];
  const skillAliasMap = {
    "arc symbols": "Arcane Symbols",
  };
  assert.equal(canonicalSkillName("arc symbols", skillAliasMap, skillCatalog), "Arcane Symbols");
  assert.equal(canonicalSkillName("Magic Item Use", skillAliasMap, skillCatalog), "Magic Item Use");
  assert.equal(canonicalSkillName("Elemental Mana", skillAliasMap, skillCatalog), "Elemental Mana Control");
  assert.equal(skillKey(" Arcane Symbols "), "arcane symbols");
});

test("defaultStatMap builds keyed payload", () => {
  assert.deepEqual(
    defaultStatMap([{ key: "str" }, { key: "con" }], 50),
    { str: 50, con: 50 }
  );
});

test("computeStatsFromLevel0 computes growth per level", () => {
  const result = computeStatsFromLevel0({
    stats: [{ key: "str" }],
    level0Stats: { str: 70 },
    level: 10,
    raceName: "Human",
    profession: "Wizard",
    baseGrowthRates: { Wizard: { str: 20 } },
    raceGrowthModifiers: { Human: { str: 0 } },
  });
  assert.deepEqual(result, {
    str: { base: 73, enhanced: 73 },
  });
});

test("getRaceBonusModifier uses normalized race key", () => {
  const modifiers = {
    "Dark Elf": { agi: 5 },
  };
  assert.equal(getRaceBonusModifier(modifiers, "darkelf", "agi"), 5);
  assert.equal(getRaceBonusModifier(modifiers, "human", "agi"), 0);
});

test("mergeSkillsWithCatalog canonicalizes and fills missing skills", () => {
  const merged = mergeSkillsWithCatalog(
    [{ name: "arc symbols", ranks: 10 }, { name: "Trading", ranks: 5 }],
    ["Arcane Symbols", "Trading", "Magic Item Use"],
    { "arc symbols": "Arcane Symbols" }
  );
  assert.deepEqual(merged, [
    { name: "Arcane Symbols", ranks: 10 },
    { name: "Trading", ranks: 5 },
    { name: "Magic Item Use", ranks: 0 },
  ]);
});

test("skillBonusFromRanks follows GS curve", () => {
  assert.equal(skillBonusFromRanks(10), 50);
  assert.equal(skillBonusFromRanks(20), 90);
  assert.equal(skillBonusFromRanks(30), 120);
  assert.equal(skillBonusFromRanks(40), 140);
  assert.equal(skillBonusFromRanks(41), 141);
});

test("experienceForLevel reads bounded thresholds", () => {
  const thresholds = [0, 100, 250, 500];
  assert.equal(experienceForLevel(0, thresholds), 0);
  assert.equal(experienceForLevel(2, thresholds), 250);
  assert.equal(experienceForLevel(999, thresholds), 0);
});

test("estimateTotalAscensionPoints combines experience ATP and milestones", () => {
  assert.deepEqual(estimateTotalAscensionPoints(0, 0), {
    totalAtp: 0,
    expAtp: 0,
    milestones: 0,
  });
  assert.deepEqual(estimateTotalAscensionPoints(125000, 3), {
    totalAtp: 5,
    expAtp: 2,
    milestones: 3,
  });
});

test("multiplierUnitsForRanks applies 1x, 2x, and 4x bands", () => {
  assert.equal(multiplierUnitsForRanks(5, 10), 5);
  assert.equal(multiplierUnitsForRanks(15, 10), 20);
  assert.equal(multiplierUnitsForRanks(25, 10), 50);
});

test("summarizeTrainingPointConversion mirrors 2:1 pool conversion", () => {
  assert.deepEqual(
    summarizeTrainingPointConversion({ ptp: 100, mtp: 20 }, { ptp: 40, mtp: 40 }),
    {
      phyToMnt: 40,
      mntToPhy: 0,
      pointsLeftPtp: 20,
      pointsLeftMtp: 0,
      remainingDeficitPtp: 0,
      remainingDeficitMtp: 0,
    }
  );

  assert.deepEqual(
    summarizeTrainingPointConversion({ ptp: 20, mtp: 100 }, { ptp: 40, mtp: 40 }),
    {
      phyToMnt: 0,
      mntToPhy: 40,
      pointsLeftPtp: 0,
      pointsLeftMtp: 20,
      remainingDeficitPtp: 0,
      remainingDeficitMtp: 0,
    }
  );
});
