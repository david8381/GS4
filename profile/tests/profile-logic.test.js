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
  normalizeEnhanciveTargetLabel,
  guessEnhanciveEffectType,
  guessEnhanciveTarget,
  normalizeEnhanciveEffectForUse,
  normalizeEnhanciveItemLinkName,
  normalizeProfileNameForMatch,
  normalizeBadgeDefaults,
  resolveStatKeyFromAscName,
  getAscensionDisplayGroup,
  ascensionRankCost,
  ascensionPointsForRanks,
  buildDefaultAscensionAbilities,
  normalizeAscensionAbilities,
  trainingPointsPerLevelForStats,
  estimateTotalTrainingPointsFromExperience,
  estimateSpentTrainingPointsFromRanks,
} = require("../profile-logic.js");

const stats = [
  { key: "agi", label: "Agility", abbr: "AGI" },
  { key: "aur", label: "Aura", abbr: "AUR" },
];
const skillCatalog = ["Arcane Symbols", "Magic Item Use"];
const skillAliasMap = { "arc symbols": "Arcane Symbols" };

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

test("enhancive target helpers normalize labels and infer types/targets", () => {
  assert.equal(normalizeEnhanciveTargetLabel("Agility (AGI)"), "Agility");
  assert.equal(guessEnhanciveEffectType("Stats", "Agility (AGI)", stats), "stat");
  assert.equal(guessEnhanciveEffectType("Resources", "Max Mana", stats), "resource");
  assert.equal(
    guessEnhanciveTarget({ effectType: "stat", label: "Agility (AGI)", stats, skillCatalog, skillAliasMap }),
    "agi"
  );
  assert.equal(
    guessEnhanciveTarget({ effectType: "skill_bonus", label: "arc symbols", stats, skillCatalog, skillAliasMap }),
    "arcane symbols"
  );
  assert.equal(
    guessEnhanciveTarget({ effectType: "resource", label: "Mana Regen", stats, skillCatalog, skillAliasMap }),
    "mana_recovery"
  );
});

test("normalizeEnhanciveEffectForUse canonicalizes effect fields", () => {
  assert.deepEqual(
    normalizeEnhanciveEffectForUse(
      { category: "Stats", label: "Agility (AGI)", value: "4", limit: "40" },
      stats,
      skillCatalog,
      skillAliasMap
    ),
    {
      category: "Stats",
      label: "Agility (AGI)",
      type: "stat",
      target: "agi",
      value: 4,
      limit: 40,
    }
  );
});

test("profile and item link name normalization is stable", () => {
  assert.equal(normalizeEnhanciveItemLinkName("  A Tin-Bound   Ceramic Badge "), "a tin-bound ceramic badge");
  assert.equal(normalizeProfileNameForMatch("  Sajehn "), "sajehn");
});

test("normalizeBadgeDefaults clamps malformed badge state", () => {
  assert.deepEqual(
    normalizeBadgeDefaults({
      lifetimeBp: "123",
      components: [1, 11],
      boosts: [{ id: "5", value: "9" }],
    }),
    {
      lifetimeBp: 123,
      components: [1, 10, 0, 0, 0],
      boosts: [{ id: 5, value: 9 }, { id: 22, value: 0 }, { id: 87, value: 0 }],
    }
  );
});

test("ascension helper functions group and cost ranks correctly", () => {
  assert.equal(resolveStatKeyFromAscName("Agility", stats), "agi");
  assert.equal(getAscensionDisplayGroup({ subcategory: "Resist", mnemonic: "resistacid" }), "resist");
  assert.equal(getAscensionDisplayGroup({ subcategory: "Other", mnemonic: "trandest" }), "other");
  assert.equal(ascensionRankCost({ mnemonic: "agility" }, 6), 2);
  assert.equal(ascensionRankCost({ mnemonic: "trandest" }, 5), 50);
  assert.equal(ascensionPointsForRanks(6, { mnemonic: "agility" }), 7);
});

test("buildDefaultAscensionAbilities and normalizeAscensionAbilities fill and sort abilities", () => {
  const catalog = [
    { name: "Agility", mnemonic: "agility", cap: 40, subcategory: "Stat", category: "Common" },
    { name: "Mana Regeneration", mnemonic: "regenmana", cap: 50, subcategory: "Regen", category: "Common" },
  ];
  assert.deepEqual(buildDefaultAscensionAbilities(catalog), [
    { name: "Agility", mnemonic: "agility", cap: 40, subcategory: "Stat", category: "Common", ranks: 0 },
    { name: "Mana Regeneration", mnemonic: "regenmana", cap: 50, subcategory: "Regen", category: "Common", ranks: 0 },
  ]);

  const normalized = normalizeAscensionAbilities([
    { name: "Mana Regeneration", mnemonic: "regenmana", ranks: 3 },
  ], catalog);
  assert.deepEqual(normalized, [
    { name: "Agility", mnemonic: "agility", cap: 40, subcategory: "Stat", category: "Common", ranks: 0 },
    { name: "Mana Regeneration", mnemonic: "regenmana", cap: 50, subcategory: "Regen", category: "Common", ranks: 3 },
  ]);
});

test("training point helpers compute per-level totals and spent pools", () => {
  const professionPrimeReqs = { Sorcerer: ["aur", "wis"] };
  assert.deepEqual(
    trainingPointsPerLevelForStats(
      { str: 70, con: 40, dex: 70, agi: 70, aur: 90, dis: 70, log: 70, int: 70, wis: 90, inf: 20 },
      "Sorcerer",
      professionPrimeReqs
    ),
    { ptpPerLevel: 43, mtpPerLevel: 48 }
  );

  const total = estimateTotalTrainingPointsFromExperience({
    experience: 1000,
    profession: "Sorcerer",
    levelThresholds: [0, 1000, 3000],
    professionPrimeReqs,
    getTrainingPointStatsForLevel: () => ({ str: 70, con: 40, dex: 70, agi: 70, aur: 90, dis: 70, log: 70, int: 70, wis: 90, inf: 20 }),
  });
  assert.deepEqual(total, { ptp: 86, mtp: 96 });

  const spent = estimateSpentTrainingPointsFromRanks({
    skills: [{ name: "Arcane Symbols", ranks: 5 }, { name: "Magic Item Use", ranks: 3 }],
    profession: "Sorcerer",
    level: 10,
    costProfessionOrder: ["Sorcerer"],
    trainingCostRows: { "MIU / AS": [[1, 2]] },
    getSkillTrainingRowName: () => "MIU / AS",
    getSkillPoolKey: (_skillName, rowName) => rowName,
  });
  assert.deepEqual(spent, { ptp: 8, mtp: 16 });
});
