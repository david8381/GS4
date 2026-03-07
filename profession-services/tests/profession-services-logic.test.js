const test = require("node:test");
const assert = require("node:assert/strict");

const servicesData = require("../../data/profession-services/services.js");
const logic = require("../profession-services-logic.js");

function contributionMap(result) {
  return Object.fromEntries(result.contributions.map((entry) => [entry.id, entry.value]));
}

function expectedContributionRowCount(service) {
  return (service.contributions || []).reduce(
    (count, contribution) => count + (contribution.type === "weighted_pair_split_by_greater" ? 2 : 1),
    0
  );
}

function buildRepresentativeProfile() {
  const skillNames = new Set();
  Object.values(servicesData.factorDefinitions).forEach((definition) => {
    const source = definition.profileSource;
    if (!source) return;
    if (source.type === "skill_ranks") skillNames.add(source.skillName);
    if (source.type === "sum_skill_ranks" || source.type === "nth_highest_skill_ranks_in_group") {
      (source.skillNames || []).forEach((skillName) => skillNames.add(skillName));
    }
  });

  return {
    level: 55,
    stats: {
      str: { enhanced: 88 },
      con: { enhanced: 82 },
      dex: { enhanced: 76 },
      agi: { enhanced: 74 },
      dis: { enhanced: 84 },
      aur: { enhanced: 72 },
      log: { enhanced: 80 },
      int: { enhanced: 78 },
      wis: { enhanced: 86 },
      inf: { enhanced: 90 },
    },
    skills: Array.from(skillNames).sort().map((name, index) => ({
      name,
      ranks: index + 5,
      finalRanks: index + 6,
    })),
  };
}

test("Ensorcell sample resolves to expected character skill", () => {
  const result = logic.calculateServiceScoreById(servicesData, "ensorcell", null, {
    level: 80,
    wisdom_bonus: 30,
    intuition_bonus: 26,
    sorcerer_spell_ranks: 100,
    arcane_symbols_ranks: 80,
    magic_item_use_ranks: 80,
    elemental_mana_control_ranks: 80,
    spiritual_mana_control_ranks: 80,
    magical_workshop_bonus: 20,
  });

  assert.equal(result.total, 412);
  const contributionById = Object.fromEntries(result.contributions.map((entry) => [entry.id, entry.value]));
  assert.equal(contributionById.sorcerer_spells, 180);
  assert.equal(contributionById.mana_controls_a, 40);
  assert.equal(contributionById.mana_controls_b, 20);
});

test("group skill factors use finalRanks and highest weapon ranks", () => {
  const profile = {
    skills: [
      { name: "Minor Elemental", ranks: 20, finalRanks: 20 },
      { name: "Wizard", ranks: 50, finalRanks: 51 },
      { name: "Arcane Symbols", ranks: 25, finalRanks: 25 },
      { name: "Edged Weapons", ranks: 30, finalRanks: 30 },
      { name: "Polearm Weapons", ranks: 40, finalRanks: 42 },
      { name: "Brawling", ranks: 15, finalRanks: 18 },
    ],
  };

  assert.equal(logic.resolveFactorValue("total_spell_research_ranks", servicesData.factorDefinitions, profile, {}), 71);
  assert.equal(logic.resolveFactorValue("primary_weapon_skill_ranks", servicesData.factorDefinitions, profile, {}), 42);
  assert.equal(logic.resolveFactorValue("secondary_weapon_skill_one_ranks", servicesData.factorDefinitions, profile, {}), 30);
  assert.equal(logic.resolveFactorValue("secondary_weapon_skill_two_ranks", servicesData.factorDefinitions, profile, {}), 18);
});

test("stat bonus factors include racial and explicit stat-bonus adjustments", () => {
  const profile = {
    race: "Halfling",
    stats: {
      log: { enhanced: 78 },
      int: { enhanced: 78 },
    },
    ascension: {
      stats: {
        log: { bonus: 0 },
        int: { bonus: 0 },
      },
    },
    enhancive: {
      stats: {
        log: { bonus: 0 },
        int: { bonus: 0 },
      },
    },
  };

  assert.equal(logic.resolveFactorValue("logic_bonus", servicesData.factorDefinitions, profile, {}, servicesData), 19);
  assert.equal(logic.resolveFactorValue("intuition_bonus", servicesData.factorDefinitions, profile, {}, servicesData), 24);

  profile.ascension.stats.log.bonus = 2;
  profile.enhancive.stats.int.bonus = 3;
  assert.equal(logic.resolveFactorValue("logic_bonus", servicesData.factorDefinitions, profile, {}, servicesData), 21);
  assert.equal(logic.resolveFactorValue("intuition_bonus", servicesData.factorDefinitions, profile, {}, servicesData), 27);
});

test("Ensorcell projections use sequential current tiers", () => {
  const service = logic.findServiceDefinition(servicesData, "ensorcell");
  const rows = logic.calculateProjectionRows(service, {
    baseItemDifficulty: 400,
    currentStage: 3,
  }, 412, 450);

  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    fromLabel: "T3",
    toLabel: "T4",
    difficulty: 600,
    resourceCost: 125000,
    currentMargin: -188,
    whatIfMargin: -150,
  });
  assert.deepEqual(rows[1], {
    fromLabel: "T4",
    toLabel: "T5",
    difficulty: 650,
    resourceCost: 150000,
    currentMargin: -238,
    whatIfMargin: -200,
  });
});

test("item-tier services include the first-step offset at tier zero", () => {
  const ensorcell = logic.findServiceDefinition(servicesData, "ensorcell");
  const sanctify = logic.findServiceDefinition(servicesData, "sanctify");

  const ensorcellRows = logic.calculateProjectionRows(ensorcell, {
    baseItemDifficulty: 300,
    currentStage: 0,
  }, 0, 0);
  const sanctifyRows = logic.calculateProjectionRows(sanctify, {
    baseItemDifficulty: 300,
    currentStage: 0,
  }, 0, 0);

  assert.equal(ensorcellRows[0].difficulty, 350);
  assert.equal(sanctifyRows[0].difficulty, 320);
});

test("service charge models distinguish resource recharge from imbedded charges", () => {
  assert.equal(logic.findServiceDefinition(servicesData, "song_of_luck").chargeModel, "resource_recharge");
  assert.equal(logic.findServiceDefinition(servicesData, "bloodsmith").chargeModel, "resource_recharge");
  assert.equal(logic.findServiceDefinition(servicesData, "mystic_tattoo_self").chargeModel, "resource_recharge");
  assert.equal(logic.findServiceDefinition(servicesData, "battle_standard").chargeModel, "resource_recharge");
  assert.equal(logic.findServiceDefinition(servicesData, "covert_arts_swift_recovery").chargeModel, "resource_recharge");
  assert.equal(logic.findServiceDefinition(servicesData, "resist_nature").chargeModel, "imbedded_item");
  assert.equal(logic.findServiceDefinition(servicesData, "sanctify").chargeModel, "none");
  assert.equal(logic.findServiceDefinition(servicesData, "covert_arts_swift_recovery").chargeInfo.rechargeRequiresSkill, true);
  assert.equal(logic.findServiceDefinition(servicesData, "song_of_luck").chargeInfo.rechargeRequiresSkill, false);
  assert.equal(logic.findServiceDefinition(servicesData, "resist_nature").progression.maxExistingCount, 4);
  assert.equal(logic.findServiceDefinition(servicesData, "covert_arts_swift_recovery").progression.maxExistingCount, 20);
});

test("Ranger progression can model a new resist line with existing full lines", () => {
  const service = logic.findServiceDefinition(servicesData, "resist_nature");
  const rows = logic.calculateProjectionRows(service, {
    currentStage: 0,
    existingCount: 2,
  }, 500, 500);

  assert.equal(rows[0].fromLabel, "T0");
  assert.equal(rows[0].toLabel, "T1");
  assert.equal(rows[0].difficulty, 400);
});

test("Rogue progression includes ranks in other arts", () => {
  const service = logic.findServiceDefinition(servicesData, "covert_arts_swift_recovery");
  const rows = logic.calculateProjectionRows(service, {
    currentRank: 2,
    existingCount: 6,
  }, 500, 500);

  assert.equal(rows[0].fromLabel, "Rank 2");
  assert.equal(rows[0].toLabel, "Rank 3");
  assert.equal(rows[0].difficulty, 480);
});

test("WPS CER anchor helpers jump to previous and next whole CER breakpoints", () => {
  assert.equal(logic.getWpsCerAnchorServices(20, 1), 30);
  assert.equal(logic.getWpsCerAnchorServices(21, -1), 20);
  assert.equal(logic.getWpsCerAnchorServices(69, 1), 70);
  assert.equal(logic.getWpsCerAnchorServices(5000, 1), 5000);
});

test("Rogue shared-track progression derives other ranks from the other art rows", () => {
  const services = servicesData.professionServices.Rogue;
  const activeService = logic.findServiceDefinition(servicesData, "covert_arts_swift_recovery");
  const derived = logic.deriveProgressionState(activeService, { currentRank: 2 }, services, {
    covert_arts_sidestep: { currentRank: 1 },
    covert_arts_keen_eye: { currentRank: 2 },
    covert_arts_escape_artist: { currentRank: 0 },
    covert_arts_swift_recovery: { currentRank: 2 },
    covert_arts_poisoncraft: { currentRank: 3 },
  });

  assert.equal(derived.currentRank, 2);
  assert.equal(derived.existingCount, 6);
});

test("every profession service resolves from representative profile data", () => {
  const profile = buildRepresentativeProfile();
  const allServices = logic.listAllServices(servicesData);

  assert.equal(allServices.length, 16);

  allServices.forEach((service) => {
    const result = logic.calculateServiceScoreById(servicesData, service.id, profile, {});
    assert.ok(Number.isFinite(result.total), `${service.id} total should be finite`);
    assert.ok(result.total >= 0, `${service.id} total should be non-negative`);
    assert.equal(
      result.contributions.length,
      expectedContributionRowCount(service),
      `${service.id} should expand contribution rows correctly`
    );
    service.factors.forEach((factorKey) => {
      assert.ok(
        Object.prototype.hasOwnProperty.call(result.factorValues, factorKey),
        `${service.id} should resolve factor ${factorKey}`
      );
    });

    if (service.progression) {
      const rows = logic.calculateProjectionRows(
        service,
        logic.getDefaultProgressionState(service),
        result.total,
        result.total
      );
      assert.ok(rows.length > 0, `${service.id} should produce projection rows from default state`);
      rows.forEach((row) => {
        assert.ok(Number.isFinite(row.difficulty), `${service.id} row difficulty should be finite`);
        assert.ok(Number.isFinite(row.resourceCost), `${service.id} row resource cost should be finite`);
      });
    }
  });
});

const serviceScoreCases = [
  {
    serviceId: "enchant",
    overrides: {
      level: 40,
      wizard_spell_ranks: 50,
      logic_bonus: 12,
      intuition_bonus: 10,
      magic_item_use_ranks: 30,
      arcane_symbols_ranks: 20,
      elemental_mana_control_ranks: 40,
      wizard_workshop_bonus: 20,
      familiar_bonus: 5,
    },
    expectedTotal: 203,
    expectedContributions: {
      wizard_spells: 91,
      elemental_mana_control: 20,
    },
  },
  {
    serviceId: "song_of_luck",
    overrides: {
      level: 30,
      intuition_bonus: 10,
      influence_bonus: 14,
      bard_spell_ranks: 35,
      mental_mana_control_ranks: 12,
      elemental_mana_control_ranks: 8,
      magic_item_use_ranks: 15,
      bard_location_bonus: 5,
    },
    expectedTotal: 159,
    expectedContributions: {
      bard_spells: 65,
      location: 5,
    },
  },
  {
    serviceId: "sanctify",
    overrides: {
      level: 40,
      cleric_spell_ranks: 45,
      wisdom_bonus: 20,
      influence_bonus: 18,
      spiritual_mana_control_ranks: 30,
      magic_item_use_ranks: 20,
      arcane_symbols_ranks: 30,
      cleric_shrine_bonus: 10,
    },
    expectedTotal: 195,
    expectedContributions: {
      cleric_spells: 87,
      shrine: 10,
    },
  },
  {
    serviceId: "bloodsmith",
    overrides: {
      level: 40,
      empath_spell_ranks: 45,
      constitution_bonus: 14,
      influence_bonus: 18,
      spiritual_mana_control_ranks: 40,
      mental_mana_control_ranks: 20,
      magic_item_use_ranks: 20,
      arcane_symbols_ranks: 30,
      physical_fitness_ranks: 20,
      first_aid_ranks: 40,
    },
    expectedTotal: 192,
    expectedContributions: {
      empath_spells: 87,
      mana_controls_a: 20,
      mana_controls_b: 5,
    },
  },
  {
    serviceId: "mystic_tattoo_self",
    overrides: {
      level: 30,
      dexterity_bonus: 16,
      discipline_bonus: 22,
      physical_fitness_ranks: 20,
      first_aid_ranks: 10,
      total_spell_research_ranks: 25,
      arcane_symbols_ranks: 10,
      mental_mana_control_ranks: 8,
      spiritual_mana_control_ranks: 6,
      mental_lore_transformation_ranks: 7,
    },
    expectedTotal: 207,
    expectedContributions: {
      spell_research: 50,
      mental_lore: 7,
    },
  },
  {
    serviceId: "mystic_tattoo_other",
    overrides: {
      level: 30,
      dexterity_bonus: 16,
      discipline_bonus: 22,
      physical_fitness_ranks: 20,
      first_aid_ranks: 10,
      total_spell_research_ranks: 25,
      arcane_symbols_ranks: 10,
      mental_mana_control_ranks: 8,
      spiritual_mana_control_ranks: 6,
      mental_lore_telepathy_ranks: 4,
    },
    expectedTotal: 204,
    expectedContributions: {
      spell_research: 50,
      mental_lore: 4,
    },
  },
  {
    serviceId: "battle_standard",
    overrides: {
      level: 35,
      paladin_spell_ranks: 40,
      wisdom_bonus: 20,
      influence_bonus: 18,
      spiritual_mana_control_ranks: 20,
      magic_item_use_ranks: 10,
      arcane_symbols_ranks: 20,
      paladin_shrine_bonus: 5,
    },
    expectedTotal: 220,
    expectedContributions: {
      paladin_spells: 77,
      magic_item_use: 15,
    },
  },
  {
    serviceId: "resist_nature",
    overrides: {
      level: 30,
      wisdom_bonus: 20,
      intuition_bonus: 14,
      survival_ranks: 20,
      magic_item_use_ranks: 10,
      ranger_spell_ranks: 20,
      harness_power_ranks: 12,
      spiritual_mana_control_ranks: 8,
      spiritual_lore_blessings_ranks: 6,
      ranger_outside_bonus: 20,
    },
    expectedTotal: 199,
    expectedContributions: {
      wisdom_bonus: 40,
      ranger_spells: 30,
    },
  },
  {
    serviceId: "covert_arts_sidestep",
    overrides: {
      level: 25,
      influence_bonus: 10,
      rogue_guild_ranks: 15,
      ambush_ranks: 20,
      pickpocketing_ranks: 10,
      dodging_ranks: 18,
      discipline_bonus: 12,
    },
    expectedTotal: 127,
    expectedContributions: {
      art_skill: 18,
      art_stat: 24,
    },
  },
  {
    serviceId: "covert_arts_keen_eye",
    overrides: {
      level: 25,
      influence_bonus: 10,
      rogue_guild_ranks: 15,
      ambush_ranks: 20,
      pickpocketing_ranks: 10,
      perception_ranks: 17,
      intuition_bonus: 11,
    },
    expectedTotal: 124,
    expectedContributions: {
      art_skill: 17,
      art_stat: 22,
    },
  },
  {
    serviceId: "covert_arts_escape_artist",
    overrides: {
      level: 25,
      influence_bonus: 10,
      rogue_guild_ranks: 15,
      ambush_ranks: 20,
      pickpocketing_ranks: 10,
      combat_maneuvers_ranks: 14,
      agility_bonus: 13,
    },
    expectedTotal: 125,
    expectedContributions: {
      art_skill: 14,
      art_stat: 26,
    },
  },
  {
    serviceId: "covert_arts_swift_recovery",
    overrides: {
      level: 25,
      influence_bonus: 10,
      rogue_guild_ranks: 15,
      ambush_ranks: 20,
      pickpocketing_ranks: 10,
      physical_fitness_ranks: 30,
      constitution_bonus: 9,
    },
    expectedTotal: 133,
    expectedContributions: {
      art_skill: 30,
      art_stat: 18,
    },
  },
  {
    serviceId: "covert_arts_poisoncraft",
    overrides: {
      level: 25,
      influence_bonus: 10,
      rogue_guild_ranks: 15,
      ambush_ranks: 20,
      pickpocketing_ranks: 10,
      survival_ranks: 22,
      dexterity_bonus: 8,
    },
    expectedTotal: 123,
    expectedContributions: {
      art_skill: 22,
      art_stat: 16,
    },
  },
  {
    serviceId: "wps_weapon",
    overrides: {
      level: 50,
      primary_weapon_skill_ranks: 60,
      strength_bonus: 25,
      discipline_bonus: 20,
      physical_fitness_ranks: 30,
      secondary_weapon_skill_one_ranks: 20,
      secondary_weapon_skill_two_ranks: 10,
      warrior_guild_workshop_bonus: 15,
    },
    expectedTotal: 238,
    expectedContributions: {
      primary_weapon_skill: 110,
      workshop: 15,
    },
  },
  {
    serviceId: "wps_armor",
    overrides: {
      level: 50,
      armor_use_ranks: 55,
      strength_bonus: 25,
      discipline_bonus: 20,
      physical_fitness_ranks: 30,
      shield_use_ranks: 9,
      warrior_guild_workshop_bonus: 15,
    },
    expectedTotal: 221,
    expectedContributions: {
      armor_use: 105,
      shield_use: 3,
    },
  },
];

serviceScoreCases.forEach((scoreCase) => {
  test(`service score fixture: ${scoreCase.serviceId}`, () => {
    const result = logic.calculateServiceScoreById(
      servicesData,
      scoreCase.serviceId,
      null,
      scoreCase.overrides
    );
    assert.equal(result.total, scoreCase.expectedTotal);
    const contributions = contributionMap(result);
    Object.entries(scoreCase.expectedContributions).forEach(([key, expectedValue]) => {
      assert.equal(contributions[key], expectedValue, `${scoreCase.serviceId} contribution ${key}`);
    });
  });
});

const progressionCases = [
  {
    serviceId: "enchant",
    state: { currentBonus: 8, baseItemDifficulty: 100 },
    currentTotal: 203,
    whatIfTotal: 210,
    expectedFirstRow: {
      fromLabel: "+8",
      toLabel: "+9",
      difficulty: 96,
      resourceCost: 2500,
      currentMargin: 107,
      whatIfMargin: 114,
      note: "Offset -4",
    },
  },
  {
    serviceId: "song_of_luck",
    state: { currentStage: 2 },
    currentTotal: 159,
    whatIfTotal: 170,
    expectedFirstRow: {
      fromLabel: "T2",
      toLabel: "T3",
      difficulty: 300,
      resourceCost: 100000,
      currentMargin: -141,
      whatIfMargin: -130,
    },
  },
  {
    serviceId: "sanctify",
    state: { baseItemDifficulty: 100, currentStage: 5 },
    currentTotal: 195,
    whatIfTotal: 225,
    expectedFirstRow: {
      fromLabel: "S5",
      toLabel: "Holy Fire",
      difficulty: 250,
      resourceCost: 200000,
      currentMargin: -55,
      whatIfMargin: -25,
    },
  },
  {
    serviceId: "bloodsmith",
    state: { currentStage: 3 },
    currentTotal: 192,
    whatIfTotal: 200,
    expectedFirstRow: {
      fromLabel: "T3",
      toLabel: "T4",
      difficulty: 375,
      resourceCost: 125000,
      currentMargin: -183,
      whatIfMargin: -175,
    },
  },
  {
    serviceId: "mystic_tattoo_self",
    state: { currentStage: 4 },
    currentTotal: 207,
    whatIfTotal: 215,
    expectedFirstRow: {
      fromLabel: "T4",
      toLabel: "T5",
      difficulty: 500,
      resourceCost: 150000,
      currentMargin: -293,
      whatIfMargin: -285,
    },
  },
  {
    serviceId: "battle_standard",
    state: { currentStage: 5 },
    currentTotal: 220,
    whatIfTotal: 240,
    expectedFirstRow: {
      fromLabel: "T5",
      toLabel: "T6",
      difficulty: 525,
      resourceCost: 175000,
      currentMargin: -305,
      whatIfMargin: -285,
    },
  },
  {
    serviceId: "resist_nature",
    state: { currentStage: 0, existingCount: 2 },
    currentTotal: 199,
    whatIfTotal: 215,
    expectedFirstRow: {
      fromLabel: "T0",
      toLabel: "T1",
      difficulty: 400,
      resourceCost: 50000,
      currentMargin: -201,
      whatIfMargin: -185,
    },
  },
  {
    serviceId: "covert_arts_swift_recovery",
    state: { currentRank: 2, existingCount: 6 },
    currentTotal: 133,
    whatIfTotal: 145,
    expectedFirstRow: {
      fromLabel: "Rank 2",
      toLabel: "Rank 3",
      difficulty: 480,
      resourceCost: 100000,
      currentMargin: -347,
      whatIfMargin: -335,
    },
  },
  {
    serviceId: "wps_weapon",
    state: { currentServices: 20, baseItemDifficulty: 100, itemType: "weapon" },
    currentTotal: 238,
    whatIfTotal: 250,
    expectedFirstRow: {
      fromLabel: "20",
      toLabel: "21",
      difficulty: 96,
      resourceCost: 25000,
      currentMargin: 142,
      whatIfMargin: 154,
      note: "CER 2.00",
    },
  },
  {
    serviceId: "wps_armor",
    state: { currentServices: 50, baseItemDifficulty: 200, itemType: "torso" },
    currentTotal: 221,
    whatIfTotal: 230,
    expectedFirstRow: {
      fromLabel: "50",
      toLabel: "51",
      difficulty: 175,
      resourceCost: 25000,
      currentMargin: 46,
      whatIfMargin: 55,
      note: "CER 5.00",
    },
  },
];

progressionCases.forEach((progressionCase) => {
  test(`progression fixture: ${progressionCase.serviceId}`, () => {
    const service = logic.findServiceDefinition(servicesData, progressionCase.serviceId);
    const rows = logic.calculateProjectionRows(
      service,
      progressionCase.state,
      progressionCase.currentTotal,
      progressionCase.whatIfTotal
    );
    assert.deepEqual(rows[0], progressionCase.expectedFirstRow);
  });
});
