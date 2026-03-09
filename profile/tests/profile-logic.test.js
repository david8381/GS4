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
  getActiveEnhanciveEquipmentItems,
  getEquipmentEnhanciveTotals,
  getEffectiveSkillEnhancive,
  createManualEnhanciveItem,
  getManualEffectsLinkedToImportedItem,
  normalizeEnhanciveItemLinkName,
  normalizeProfileNameForMatch,
  normalizeBadgeDefaults,
  resolveStatKeyFromAscName,
  getAscensionDisplayGroup,
  ascensionRankCost,
  ascensionPointsForRanks,
  buildDefaultAscensionAbilities,
  normalizeAscensionAbilities,
  calculateAscensionPointsUsed,
  getAscensionAbilityContext,
  getAscensionAbilityGate,
  getMaxAllowedAscensionRanks,
  getNextAscensionCostDisplay,
  enforceAscensionPointBudget,
  syncAscensionStateFromAbilities,
  populateAbilitiesFromAscensionState,
  trainingPointsPerLevelForStats,
  estimateTotalTrainingPointsFromExperience,
  estimateSpentTrainingPointsFromRanks,
  getTrainingPointStatsSnapshot,
  getStatAdjustment,
  buildDerivedStatRows,
  enforceStatEnhanciveRowLimits,
  enforceSkillEnhanciveRowLimits,
  getSkillTrainingRowName,
  getSkillPoolKey,
  getSkillPoolLabel,
  formatPoolHeaderText,
  formatTrainingCostDisplay,
  getDisplaySkillCategory,
  buildSkillRankCapContext,
  getNextRankCostDisplay,
  collectSkills,
  getVisibleSkills,
  getSkillsImportFlagSets,
  buildSkillsStatusMessage,
  buildCurrentProfileRecord,
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

test("equipment enhancive helpers honor linked manual effects and aggregate totals", () => {
  const equipmentState = {
    importedSnapshot: {
      items: [
        {
          name: "a tin-bound ceramic badge",
          active: true,
          effects: [{ category: "Stats", label: "Agility (AGI)", value: 4 }],
        },
        {
          name: "a gilded locus",
          active: false,
          effects: [{ category: "Resources", label: "Max Mana", value: 1 }],
        },
      ],
    },
    manualResolutions: {
      items: [
        {
          name: "Linked Bonus",
          active: true,
          linkedImportedName: "a tin-bound ceramic badge",
          effects: [{ category: "Skills", label: "Arcane Symbols", type: "skill_bonus", target: "arcane symbols", value: 5 }],
        },
        {
          name: "Standalone",
          active: true,
          effects: [{ category: "Skills", label: "Magic Item Use", type: "skill_rank", target: "magic item use", value: 2 }],
        },
      ],
    },
  };

  const activeItems = getActiveEnhanciveEquipmentItems({
    currentEnhanciveEquipment: equipmentState,
    normalizeEnhanciveEquipmentStateFn: (value) => value,
    normalizeEnhanciveItemLinkNameFn: normalizeEnhanciveItemLinkName,
  });
  assert.deepEqual(activeItems.map((item) => item.name), [
    "a tin-bound ceramic badge",
    "Linked Bonus",
    "Standalone",
  ]);

  const totals = getEquipmentEnhanciveTotals({
    currentEnhanciveEquipment: equipmentState,
    defaultStatMapFn: (value) => ({ agi: value, aur: value }),
    skillCatalog,
    skillKeyFn: skillKey,
    normalizeEnhanciveEffectForUseFn: (effect) => normalizeEnhanciveEffectForUse(effect, stats, skillCatalog, skillAliasMap),
    normalizeEnhanciveEquipmentStateFn: (value) => value,
    normalizeEnhanciveItemLinkNameFn: normalizeEnhanciveItemLinkName,
  });
  assert.deepEqual(totals, {
    stats: { agi: 4, aur: 0 },
    skillRanks: { "arcane symbols": 0, "magic item use": 2 },
    skillBonuses: { "arcane symbols": 5, "magic item use": 0 },
    resources: {},
  });
  assert.deepEqual(getEffectiveSkillEnhancive("arcane symbols", {
    skills: { "arcane symbols": { rank: 1, bonus: 2 } },
  }, totals), {
    rank: 1,
    bonus: 7,
  });
});

test("manual enhancive item helpers build canonical rows and linked lookups", () => {
  const item = createManualEnhanciveItem({
    partial: {
      name: " Badge Resolve ",
      category: "Stats",
      label: "Agility (AGI)",
      value: "4",
      linkedImportedName: "a tin-bound ceramic badge",
    },
    guessEnhanciveEffectTypeFn: (category) => (category === "Stats" ? "stat" : "unknown"),
    guessEnhanciveTargetFn: () => "agi",
    idFactory: () => "manual-123",
  });
  assert.deepEqual(item, {
    id: "manual-123",
    name: "Badge Resolve",
    worn: true,
    active: true,
    source: "manual",
    linkedImportedName: "a tin-bound ceramic badge",
    effects: [{
      category: "Stats",
      type: "stat",
      target: "agi",
      label: "Agility (AGI)",
      value: 4,
      limit: 0,
      knownSource: true,
    }],
  });

  const linked = getManualEffectsLinkedToImportedItem({
    manualResolutions: {
      items: [
        item,
        { name: "Other", linkedImportedName: "a gilded locus", effects: [] },
      ],
    },
  }, "A Tin-Bound Ceramic Badge", normalizeEnhanciveItemLinkName);
  assert.deepEqual(linked.map((entry) => entry.id), ["manual-123"]);
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

test("ascension gating helpers enforce trandest and porter requirements", () => {
  const abilities = [
    { name: "Strength", mnemonic: "strength", category: "Common", subcategory: "Stat", cap: 40, ranks: 5 },
    { name: "Physical Fitness", mnemonic: "physicalfitness", category: "Common", subcategory: "Skill", cap: 50, ranks: 5 },
    { name: "Transcend Destiny", mnemonic: "trandest", category: "Elite", subcategory: "Other", cap: 10, ranks: 0 },
    { name: "Porter", mnemonic: "porter", category: "Common", subcategory: "Other", cap: 50, ranks: 0 },
  ];

  assert.equal(calculateAscensionPointsUsed(abilities), 10);
  assert.deepEqual(getAscensionAbilityContext(abilities), {
    byMnemonic: new Map(abilities.map((ability) => [ability.mnemonic, ability])),
    commonAtpSpent: 10,
    strengthRanks: 5,
    physicalFitnessRanks: 5,
  });
  assert.deepEqual(getAscensionAbilityGate(abilities[2], abilities), {
    allowed: false,
    reason: "Requires 150 ATP spent in Common abilities.",
  });
  assert.deepEqual(getAscensionAbilityGate(abilities[3], abilities), {
    allowed: true,
    reason: "",
  });
  assert.equal(getMaxAllowedAscensionRanks({ ...abilities[2], ranks: 2 }, abilities), 2);
  assert.deepEqual(getNextAscensionCostDisplay(abilities[2], abilities), {
    display: "Locked",
    gateReason: "Requires 150 ATP spent in Common abilities.",
  });

  const budgeted = enforceAscensionPointBudget({
    abilities: [{ ...abilities[0], ranks: 8 }, { ...abilities[1], ranks: 8 }],
    availablePoints: 10,
    getMaxAllowedAscensionRanksFn: (ability) => ability.cap,
    calculateAscensionPointsUsedFn: (next) => next.reduce((sum, ability) => sum + ability.ranks, 0),
  });
  assert.deepEqual(budgeted.map((ability) => ability.ranks), [2, 8]);
});

test("ascension state sync helpers translate between abilities and state maps", () => {
  const currentAscensionAbilities = [
    { name: "Agility", mnemonic: "agility", cap: 40, category: "Common", subcategory: "Stat", ranks: 5 },
    { name: "Arcane Symbols", mnemonic: "arcanesymbols", cap: 50, category: "Common", subcategory: "Skill", ranks: 3 },
  ];
  const ascMnemonicMap = {
    agility: "Agility",
    arcanesymbols: "Arcane Symbols",
  };
  const nextState = syncAscensionStateFromAbilities({
    currentAscensionAbilities,
    stats,
    currentSkills: [{ name: "Arcane Symbols" }],
    ascensionState: { stats: { agi: { stat: 0, bonus: 2 } }, skills: {} },
    ascMnemonicMap,
    resolveStatKeyFromAscNameFn: (name) => (name === "Agility" ? "agi" : ""),
    canonicalSkillNameFn: (name) => name,
  });
  assert.deepEqual(nextState, {
    stats: {
      agi: { stat: 5, bonus: 2 },
      aur: { stat: 0, bonus: 0 },
    },
    skills: {
      "arcane symbols": { bonus: 3 },
    },
  });

  const roundTripped = populateAbilitiesFromAscensionState({
    currentAscensionAbilities: currentAscensionAbilities.map((ability) => ({ ...ability, ranks: 0 })),
    ascensionState: nextState,
    ascMnemonicMap,
    resolveStatKeyFromAscNameFn: (name) => (name === "Agility" ? "agi" : ""),
    canonicalSkillNameFn: (name) => name,
    normalizeAscensionAbilitiesFn: (entries) => entries.map((entry) => ({ ...entry })),
  });
  assert.deepEqual(roundTripped.map((ability) => ability.ranks), [5, 3]);
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

  const snapshot = getTrainingPointStatsSnapshot({
    currentLevel0Stats: { str: 70, con: 40 },
    currentBaseStats: { str: 50, con: 50 },
    level: 10,
    stats: [{ key: "str" }, { key: "con" }],
    raceName: "Human",
    profession: "Wizard",
    computeStatsFromLevel0Fn: () => ({ str: { base: 73 }, con: { base: 42 } }),
  });
  assert.deepEqual(snapshot, { str: 73, con: 42 });
});

test("derived stat helpers combine ascension, enhancives, and racial bonus", () => {
  const equipmentTotals = { stats: { agi: 4 } };
  assert.deepEqual(
    getStatAdjustment({
      statKey: "agi",
      ascensionState: { stats: { agi: { stat: 5, bonus: 0 } } },
      enhanciveState: { stats: { agi: { stat: 0, bonus: 0 } } },
      equipmentTotals,
    }),
    { ascStat: 5, ascBonus: 0, enhStat: 4, enhBonus: 0 }
  );

  const rows = buildDerivedStatRows({
    stats: [{ key: "agi" }],
    currentBaseStats: { agi: 70 },
    raceName: "Dark Elf",
    getRaceBonusModifierFn: (race, key) => (race === "Dark Elf" && key === "agi" ? 5 : 0),
    ascensionState: { stats: { agi: { stat: 5, bonus: 0 } } },
    enhanciveState: { stats: { agi: { stat: 0, bonus: 0 } } },
    equipmentTotals,
  });
  assert.deepEqual(rows.agi, {
    baseStat: 70,
    baseBonus: 15,
    ascStat: 5,
    ascBonus: 0,
    enhStat: 4,
    enhBonus: 0,
    enhEffective: 2,
    enhValid: true,
    finalStat: 79,
    finalBonus: 19,
  });
});

test("enhancive row limit helpers clamp stat and skill entries", () => {
  assert.deepEqual(enforceStatEnhanciveRowLimits({ stat: 40, bonus: 20 }, "stat"), { stat: 40, bonus: 0 });
  assert.deepEqual(
    enforceSkillEnhanciveRowLimits({
      entry: { rank: 50, bonus: 50 },
      baseRanks: 0,
    }),
    { rank: 0, bonus: 50 }
  );
});

test("skill cap helpers group pools and compute next rank cost", () => {
  const spellCircles = new Set(["Minor Elemental"]);
  const loreSkillNames = new Set(["Elemental Lore - Air"]);
  assert.equal(getSkillTrainingRowName("Minor Elemental", spellCircles, loreSkillNames), "Spell Research");
  assert.equal(getSkillTrainingRowName("Elemental Lore - Air", spellCircles, loreSkillNames), "Elemental Lore");
  assert.equal(getSkillPoolKey("Minor Elemental", "Spell Research", spellCircles), "pool:spell-research");
  assert.equal(getSkillPoolLabel("pool:lore-elemental", "Elemental Lore"), "Elemental Lore");
  assert.equal(formatPoolHeaderText("Spell Research", 10, 20), "Spell Research Max Ranks: 20 (Used: 10)");
  assert.equal(formatTrainingCostDisplay(1, 2), "1/2");
  assert.equal(getDisplaySkillCategory("Perception", { Perception: "Survival and Utility" }), "General Skills");

  const capContext = buildSkillRankCapContext({
    skills: [
      { name: "Minor Elemental", ranks: 35 },
      { name: "Elemental Lore - Air", ranks: 12 },
    ],
    profession: "Sorcerer",
    level: 80,
    costProfessionOrder: ["Sorcerer"],
    maxPerLevelRows: {
      "Spell Research": [3],
      "Elemental Lore": [1],
    },
    spellCircles,
    loreSkillNames,
  });

  assert.equal(capContext.bySkill.get("minor elemental").maxRanks, 246);
  assert.equal(
    getNextRankCostDisplay({
      skill: { name: "Minor Elemental", ranks: 35 },
      profession: "Sorcerer",
      level: 80,
      capContext,
      costProfessionOrder: ["Sorcerer"],
      trainingCostRows: { "Spell Research": [[0, 20]] },
      spellCircles,
      loreSkillNames,
    }),
    "0/20"
  );
});

test("skill collection and visibility helpers include ascension and enhancive state", () => {
  const skills = [
    { name: "Arcane Symbols", ranks: 10 },
    { name: "Minor Elemental", ranks: 0 },
  ];
  const ascensionState = {
    skills: {
      "arcane symbols": { bonus: 0 },
      "minor elemental": { bonus: 5 },
    },
  };
  const getEffectiveSkillEnhanciveFn = (key) => (
    key === "arcane symbols" ? { rank: 2, bonus: 3 } : { rank: 0, bonus: 0 }
  );

  const collected = collectSkills({
    currentSkills: skills,
    ascensionState,
    getEffectiveSkillEnhanciveFn,
  });
  assert.deepEqual(collected, [
    { name: "Arcane Symbols", ranks: 10, finalRanks: 12, bonus: 61 },
    { name: "Minor Elemental", ranks: 0, finalRanks: 0, bonus: 5 },
  ]);

  const visible = getVisibleSkills({
    skills,
    showTrainedOnly: true,
    allowedCircles: new Set(),
    ascensionState,
    getEffectiveSkillEnhanciveFn,
    spellCircles: new Set(["Minor Elemental"]),
  });
  assert.deepEqual(visible.map((entry) => entry.name), ["Arcane Symbols", "Minor Elemental"]);
});

test("skills import flag and status helpers report off-profession circles and unmatched rows", () => {
  const currentSkills = [
    { name: "Minor Elemental", ranks: 35 },
    { name: "Sorcerer", ranks: 100 },
    { name: "Arcane Symbols", ranks: 80 },
  ];
  const flags = getSkillsImportFlagSets({
    currentSkills,
    profession: "Sorcerer",
    professionSpellCircleMap: {
      Sorcerer: new Set(["Minor Elemental", "Minor Spiritual", "Sorcerer"]),
    },
    spellCircles: new Set(["Minor Elemental", "Minor Spiritual", "Sorcerer", "Wizard"]),
  });
  assert.deepEqual([...flags.offProfession], []);

  const mismatchFlags = getSkillsImportFlagSets({
    currentSkills: [{ name: "Wizard", ranks: 5 }],
    profession: "Sorcerer",
    professionSpellCircleMap: {
      Sorcerer: new Set(["Sorcerer"]),
    },
    spellCircles: new Set(["Wizard", "Sorcerer"]),
  });
  assert.deepEqual([...mismatchFlags.offProfession], ["wizard"]);

  const message = buildSkillsStatusMessage({
    currentSkills: [{ name: "Wizard", ranks: 5 }, { name: "Arcane Symbols", ranks: 80 }],
    prefix: "Loaded SKILLS.",
    skillsImportUnmatchedKeys: new Set(["arcane symbols"]),
    skillsImportOffProfessionKeys: new Set(["wizard"]),
    profession: "Sorcerer",
  });
  assert.equal(
    message.text,
    "Loaded SKILLS. Unmatched from paste: Arcane Symbols. Off-profession circles for Sorcerer: Wizard."
  );
  assert.equal(message.isError, true);
});

test("buildCurrentProfileRecord assembles normalized core profile payload", () => {
  const record = buildCurrentProfileRecord({
    name: " Sajehn ",
    raceName: "Dark Elf",
    profession: "Sorcerer",
    level: 80,
    experience: 5504113,
    ascensionExperience: 1000368,
    ascensionMilestones: 4,
    currentAscensionAbilities: [{ name: "Agility", mnemonic: "agility", cap: 40, category: "Common", subcategory: "Stat", ranks: 5 }],
    currentLevel0Stats: { agi: 70, aur: 90 },
    stats,
    currentSkills: [{ name: "Arcane Symbols", ranks: 80 }],
    ascensionState: {
      stats: { agi: { stat: 5, bonus: 0 }, aur: { stat: 5, bonus: 0 } },
      skills: { "arcane symbols": { bonus: 0 } },
    },
    enhanciveState: {
      stats: { agi: { stat: 4, bonus: 0 }, aur: { stat: 0, bonus: 0 } },
      skills: { "arcane symbols": { rank: 0, bonus: 3 } },
    },
    currentEnhanciveEquipment: { importedSnapshot: { items: [] }, manualResolutions: { items: [] } },
    currentBadgeDefaults: { lifetimeBp: 123 },
    normalizeAscensionAbilitiesFn: (entries) => entries,
    normalizeBadgeDefaultsFn: (badge) => ({ lifetimeBp: badge.lifetimeBp }),
    normalizeEnhanciveEquipmentState: (equipment) => ({ importedSnapshot: equipment.importedSnapshot, manualResolutions: equipment.manualResolutions }),
    getDerivedStatRowsFn: () => ({
      agi: { baseStat: 70, finalStat: 79 },
      aur: { baseStat: 90, finalStat: 95 },
    }),
    collectSkillsFn: () => [{ name: "Arcane Symbols", ranks: 80, finalRanks: 80, bonus: 180 }],
  });

  assert.deepEqual(record, {
    name: "Sajehn",
    race: "Dark Elf",
    profession: "Sorcerer",
    level: 80,
    experience: 5504113,
    ascensionExperience: 1000368,
    ascensionMilestones: 4,
    ascensionAbilities: [{ name: "Agility", mnemonic: "agility", cap: 40, category: "Common", subcategory: "Stat", ranks: 5 }],
    level0Stats: { agi: 70, aur: 90 },
    stats: {
      agi: { base: 70, enhanced: 79 },
      aur: { base: 90, enhanced: 95 },
    },
    ascension: {
      stats: { agi: { stat: 5, bonus: 0 }, aur: { stat: 5, bonus: 0 } },
      skills: { "arcane symbols": { bonus: 0 } },
    },
    enhancive: {
      stats: { agi: { stat: 4, bonus: 0 }, aur: { stat: 0, bonus: 0 } },
      skills: { "arcane symbols": { rank: 0, bonus: 3 } },
    },
    equipment: {
      enhancives: {
        importedSnapshot: { items: [] },
        manualResolutions: { items: [] },
      },
    },
    skills: [{ name: "Arcane Symbols", ranks: 80, finalRanks: 80, bonus: 180 }],
    defaults: {
      badge: { lifetimeBp: 123 },
    },
  });
});
