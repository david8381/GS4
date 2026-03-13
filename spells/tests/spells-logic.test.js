const test = require("node:test");
const assert = require("node:assert/strict");

require("../../data/spells.js");
const colData = require("../../data/societies/col.js");
const volnData = require("../../data/societies/voln.js");
const sunfistData = require("../../data/societies/sunfist.js");
const logic = require("../../spells-logic.js");

const spellsData = globalThis.GS4_SPELLS_DATA;
const societiesData = {
  col: colData,
  voln: volnData,
  sunfist: sunfistData,
};

function buildProfile(skillRanks = {}) {
  return {
    level: 80,
    skills: Object.entries(skillRanks).map(([name, ranks]) => ({
      name,
      ranks,
      finalRanks: ranks,
    })),
  };
}

test("outside cast uses only fixed modifiers", () => {
  const wardingSphere = spellsData.buff_spells.find((spell) => spell.id === 310);
  const totals = logic.calculateSpellModifiers(
    wardingSphere,
    "outside",
    { cleric_spell_ranks: 40 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 10);
  assert.equal(totals.td_spiritual, 10);
  assert.equal(totals.td_elemental, 10);
  assert.equal(totals.td_mental, 10);
});

test("self cast applies modeled scaling for Warding Sphere", () => {
  const wardingSphere = spellsData.buff_spells.find((spell) => spell.id === 310);
  const totals = logic.calculateSpellModifiers(
    wardingSphere,
    "self",
    { cleric_spell_ranks: 30 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 20);
  assert.equal(totals.td_spiritual, 20);
  assert.equal(totals.td_elemental, 20);
  assert.equal(totals.td_mental, 20);
});

test("calculateTotals resolves factor values from profile and applies what-if overrides", () => {
  const rangerSpell = spellsData.buff_spells.find((spell) => spell.id === 625);
  const castModesByKey = { [rangerSpell.key]: "self" };
  const profile = buildProfile({ Ranger: 50 });

  const results = logic.calculateTotals({
    spellsData,
    societiesData,
    profile,
    castModesByKey,
    activeSocietyKey: "",
    activeSocietyAbilityKeys: {},
    currentFactorOverrides: {},
    whatIfFactorOverrides: { ranger_spell_ranks: 70 },
  });

  assert.equal(results.currentFactorValues.ranger_spell_ranks, 50);
  assert.equal(results.whatIfFactorValues.ranger_spell_ranks, 70);
  assert.equal(results.currentTotals.td_spiritual, 12);
  assert.equal(results.whatIfTotals.td_spiritual, 12);
});

test("calculateTotals exposes non-active spell factors for row value rendering", () => {
  const results = logic.calculateTotals({
    spellsData,
    societiesData,
    profile: buildProfile({ "Minor Elemental": 80 }),
    castModesByKey: {},
    activeSocietyKey: "",
    activeSocietyAbilityKeys: {},
    currentFactorOverrides: {},
    whatIfFactorOverrides: { level: 80 },
  });

  assert.equal(results.currentFactorValues.minor_elemental_ranks, 80);
  assert.equal(results.whatIfFactorValues.level, 80);
});

test("collectRelevantFactors only includes active self-cast spells with modeled scaling", () => {
  const spells = spellsData.buff_spells;
  const active = [
    { spell: spells.find((entry) => entry.id === 310), castMode: "self" },
    { spell: spells.find((entry) => entry.id === 425), castMode: "self" },
    { spell: spells.find((entry) => entry.id === 503), castMode: "outside" },
  ];
  const factors = logic.collectRelevantFactors(active, [], spellsData.factor_definitions);

  assert.deepEqual(
    factors.map((entry) => entry.key).sort(),
    ["cleric_spell_ranks", "level", "minor_elemental_ranks"]
  );
});

test("Curse star mode is modeled as spell 715, not 703", () => {
  const starCurse = spellsData.buff_spells.find((spell) => spell.name === "Curse (Star)");
  const bad703 = spellsData.buff_spells.find((spell) => spell.id === 703);

  assert.equal(starCurse?.id, 715);
  assert.equal(bad703, undefined);
});

test("spell calculator relevance tags keep combat-supporting buffs and exclude pure utility", () => {
  const mobility = spellsData.buff_spells.find((spell) => spell.id === 618);
  const waterWalking = spellsData.buff_spells.find((spell) => spell.id === 112);
  const barkskin = spellsData.buff_spells.find((spell) => spell.id === 605);

  assert.equal(mobility?.calculator_relevant, true);
  assert.deepEqual(mobility?.calculator_tags, ["dodge"]);
  assert.equal(barkskin?.calculator_relevant, true);
  assert.equal(waterWalking?.calculator_relevant, false);
});

test("CoL Sign of Shields contributes fixed DS", () => {
  const shields = societiesData.col.abilities.find((ability) => ability.id === "sign_of_shields");
  const totals = logic.calculateSocietyAbilityModifiers(shields, true, { col_rank: 13 }, spellsData);

  assert.equal(totals.non_bolt_ds, 20);
});

test("Voln Symbol of Protection scales with Voln step", () => {
  const protection = societiesData.voln.abilities.find((ability) => ability.id === "symbol_of_protection");
  const totals = logic.calculateSocietyAbilityModifiers(protection, true, { voln_step: 20 }, spellsData);

  assert.equal(totals.non_bolt_ds, 20);
  assert.equal(totals.td_spiritual, 10);
  assert.equal(totals.td_elemental, 10);
  assert.equal(totals.td_mental, 10);
});

test("Sunfist Sigil of Focus scales with Sunfist rank", () => {
  const focus = societiesData.sunfist.abilities.find((ability) => ability.id === "sigil_of_focus");
  const totals = logic.calculateSocietyAbilityModifiers(focus, true, { sunfist_rank: 15 }, spellsData);

  assert.equal(totals.td_spiritual, 15);
  assert.equal(totals.td_elemental, 15);
  assert.equal(totals.td_mental, 15);
});

test("society rank factors read only from matching profile society", () => {
  const defs = logic.buildFactorDefinitions(spellsData);
  const colProfile = { society: { key: "col", rank: 12 } };
  const volnProfile = { society: { key: "voln", rank: 14 } };

  assert.equal(logic.getFactorValue(colProfile, defs.col_rank, null), 12);
  assert.equal(logic.getFactorValue(colProfile, defs.voln_step, null), 0);
  assert.equal(logic.getFactorValue(volnProfile, defs.voln_step, null), 14);
  assert.equal(logic.getFactorValue(volnProfile, defs.sunfist_rank, null), 0);
});

test("calculateTotals sums spell and society modifiers together", () => {
  const wardingSphere = spellsData.buff_spells.find((spell) => spell.id === 310);
  const signDefending = societiesData.col.abilities.find((ability) => ability.id === "sign_of_defending");
  assert.ok(signDefending);

  const results = logic.calculateTotals({
    spellsData,
    societiesData,
    profile: buildProfile({ Cleric: 20 }),
    castModesByKey: { [wardingSphere.key]: "outside" },
    activeSocietyKey: "col",
    activeSocietyAbilityKeys: { "col:sign_of_defending": true },
    currentFactorOverrides: { col_rank: 7 },
    whatIfFactorOverrides: { col_rank: 7 },
  });

  assert.equal(results.currentTotals.non_bolt_ds, 20);
  assert.equal(results.currentTotals.td_spiritual, 10);
});

test("425 Elemental Targeting gains additive value from Minor Elemental ranks", () => {
  const targeting = spellsData.buff_spells.find((spell) => spell.id === 425);
  const totals = logic.calculateSpellModifiers(
    targeting,
    "self",
    { level: 80, minor_elemental_ranks: 80 },
    spellsData
  );

  assert.equal(totals.as_physical, 50);
  assert.equal(totals.as_bolt, 50);
  assert.equal(totals.cs_elemental, 50);
  assert.equal(totals.cs_bard, 50);
  assert.equal(totals.cs_sorcerer, 25);
  assert.equal(totals.cs_spiritual, 0);
});

test("425 Elemental Targeting exposes dynamic additive value independent of cast mode", () => {
  const targeting = spellsData.buff_spells.find((spell) => spell.id === 425);
  const dynamicTotals = logic.calculateSpellDynamicTotals(
    targeting,
    { level: 80, minor_elemental_ranks: 80 },
    spellsData
  );

  assert.equal(dynamicTotals.as_physical, 25);
  assert.equal(dynamicTotals.as_bolt, 25);
  assert.equal(dynamicTotals.cs_elemental, 25);
  assert.equal(dynamicTotals.cs_bard, 25);
  assert.equal(dynamicTotals.cs_sorcerer, 12);
});

test("419 Mass Elemental Defense is excluded from the calculator spell list", () => {
  const massDefense = spellsData.buff_spells.find((spell) => spell.id === 419);

  assert.ok(massDefense);
  assert.equal(massDefense.calculator_relevant, false);
});

test("601 Natural Colors gains DS from Blessings lore seed summation", () => {
  const naturalColors = spellsData.buff_spells.find((spell) => spell.id === 601);
  const totals = logic.calculateSpellModifiers(
    naturalColors,
    "self",
    { spiritual_lore_blessings_ranks: 11 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 12);
});

test("602 Resist Elements keeps its flat bonus in bolt DS only", () => {
  const resistElements = spellsData.buff_spells.find((spell) => spell.id === 602);

  assert.equal(resistElements.modifiers.non_bolt_ds, 0);
  assert.equal(resistElements.modifiers.bolt_ds, 15);
});

test("307 Benediction adds generic scaling and extra bolt AS at higher cleric ranks", () => {
  const benediction = spellsData.buff_spells.find((spell) => spell.id === 307);
  const totals = logic.calculateSpellModifiers(
    benediction,
    "self",
    { level: 80, cleric_spell_ranks: 80 },
    spellsData
  );

  assert.equal(totals.as_physical, 15);
  assert.equal(totals.non_bolt_ds, 15);
  assert.equal(totals.bolt_ds, 15);
  assert.equal(totals.as_bolt, 41);
});

test("313 Prayer gains DS only once cleric ranks are high enough", () => {
  const prayer = spellsData.buff_spells.find((spell) => spell.id === 313);
  const lowTotals = logic.calculateSpellModifiers(
    prayer,
    "self",
    { level: 80, cleric_spell_ranks: 20 },
    spellsData
  );
  const thresholdTotals = logic.calculateSpellModifiers(
    prayer,
    "self",
    { level: 80, cleric_spell_ranks: 35 },
    spellsData
  );
  const highTotals = logic.calculateSpellModifiers(
    prayer,
    "self",
    { level: 80, cleric_spell_ranks: 50 },
    spellsData
  );

  assert.equal(lowTotals.non_bolt_ds, 0);
  assert.equal(lowTotals.td_spiritual, 10);
  assert.equal(thresholdTotals.non_bolt_ds, 10);
  assert.equal(thresholdTotals.bolt_ds, 10);
  assert.equal(highTotals.non_bolt_ds, 25);
  assert.equal(highTotals.bolt_ds, 25);
});

test("310 Warding Sphere scales by one per cleric rank above 10", () => {
  const wardingSphere = spellsData.buff_spells.find((spell) => spell.id === 310);
  const totals = logic.calculateSpellModifiers(
    wardingSphere,
    "self",
    { level: 30, cleric_spell_ranks: 30 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 20);
  assert.equal(totals.bolt_ds, 20);
  assert.equal(totals.td_spiritual, 20);
});

test("509 Strength gains self-cast strength bonus from Earth Lore seed summation", () => {
  const strength = spellsData.buff_spells.find((spell) => spell.id === 509);
  const selfTotals = logic.calculateSpellModifiers(
    strength,
    "self",
    { elemental_lore_earth_ranks: 20 },
    spellsData
  );
  const outsideTotals = logic.calculateSpellModifiers(
    strength,
    "outside",
    { elemental_lore_earth_ranks: 20 },
    spellsData
  );

  assert.equal(selfTotals.as_physical, 0);
  assert.equal(selfTotals.strength_bonus, 18);
  assert.equal(outsideTotals.strength_bonus, 15);
});

test("513 Elemental Focus scales bolt AS by two-rank steps above 13", () => {
  const elementalFocus = spellsData.buff_spells.find((spell) => spell.id === 513);
  const totals = logic.calculateSpellModifiers(
    elementalFocus,
    "self",
    { level: 80, major_elemental_ranks: 80 },
    spellsData
  );

  assert.equal(totals.as_bolt, 53);
});

test("618 Mobility adds ranger-only dodge ranks beyond the base 20", () => {
  const mobility = spellsData.buff_spells.find((spell) => spell.id === 618);
  const totals = logic.calculateSpellModifiers(
    mobility,
    "self",
    { level: 80, ranger_spell_ranks: 80 },
    spellsData
  );

  assert.equal(totals.dodge_ranks, 82);
});

test("913 Melgorehn's Aura scales both DS and elemental TD", () => {
  const aura = spellsData.buff_spells.find((spell) => spell.id === 913);
  const totals = logic.calculateSpellModifiers(
    aura,
    "self",
    { level: 80, wizard_spell_ranks: 80 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 77);
  assert.equal(totals.td_elemental, 42);
});

test("1711 Mystic Focus level scaling uses max(10, 30 - level)", () => {
  const mysticFocus = spellsData.buff_spells.find((spell) => spell.id === 1711);
  const lowTotals = logic.calculateSpellModifiers(
    mysticFocus,
    "self",
    { level: 10 },
    spellsData
  );
  const highTotals = logic.calculateSpellModifiers(
    mysticFocus,
    "self",
    { level: 80 },
    spellsData
  );

  assert.equal(lowTotals.cs_elemental, 20);
  assert.equal(lowTotals.cs_sorcerer, 20);
  assert.equal(highTotals.cs_elemental, 10);
  assert.equal(highTotals.cs_bard, 10);
});

test("1209 Dragonclaw gains self-cast UAF from Transformation Lore", () => {
  const dragonclaw = spellsData.buff_spells.find((spell) => spell.id === 1209);
  const totals = logic.calculateSpellModifiers(
    dragonclaw,
    "self",
    { mental_lore_transformation_ranks: 10 },
    spellsData
  );

  assert.equal(totals.uaf, 14);
});

test("1007 Kai's Triumph Song gains AS from bard ranks and telepathy lore", () => {
  const triumph = spellsData.buff_spells.find((spell) => spell.id === 1007);
  const totals = logic.calculateSpellModifiers(
    triumph,
    "self",
    { level: 80, bard_spell_ranks: 20, mental_lore_telepathy_ranks: 7 },
    spellsData
  );

  assert.equal(totals.as_physical, 22);
  assert.equal(totals.as_bolt, 22);
});

test("712 Cloak of Shadows scales DS and TD from Sorcerer ranks", () => {
  const cloak = spellsData.buff_spells.find((spell) => spell.id === 712);
  const totals = logic.calculateSpellModifiers(
    cloak,
    "self",
    { level: 80, sorcerer_spell_ranks: 80 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 93);
  assert.equal(totals.bolt_ds, 93);
  assert.equal(totals.td_spiritual, 26);
  assert.equal(totals.td_elemental, 26);
  assert.equal(totals.td_mental, 26);
});

test("715 Curse (Star) gains bolt AS from Sorcerer ranks", () => {
  const curse = spellsData.buff_spells.find((spell) => spell.id === 715);
  const totals = logic.calculateSpellModifiers(
    curse,
    "self",
    { level: 80, sorcerer_spell_ranks: 75 },
    spellsData
  );

  assert.equal(totals.as_bolt, 30);
});

test("1019 Song of Mirrors gains dodge ranks from Bard ranks", () => {
  const mirrors = spellsData.buff_spells.find((spell) => spell.id === 1019);
  const totals = logic.calculateSpellModifiers(
    mirrors,
    "self",
    { bard_spell_ranks: 40 },
    spellsData
  );

  assert.equal(totals.dodge_ranks, 30);
});

test("1035 Song of Tonis gains threshold-based dodge from Air Lore", () => {
  const tonis = spellsData.buff_spells.find((spell) => spell.id === 1035);
  const totals = logic.calculateSpellModifiers(
    tonis,
    "self",
    { elemental_lore_air_ranks: 10 },
    spellsData
  );

  assert.equal(totals.dodge_ranks, 26);
});

test("911 Mass Blur gains self-cast dodge from Air Lore", () => {
  const blur = spellsData.buff_spells.find((spell) => spell.id === 911);
  const selfTotals = logic.calculateSpellModifiers(
    blur,
    "self",
    { elemental_lore_air_ranks: 10 },
    spellsData
  );
  const outsideTotals = logic.calculateSpellModifiers(
    blur,
    "outside",
    { elemental_lore_air_ranks: 10 },
    spellsData
  );

  assert.equal(selfTotals.dodge_ranks, 24);
  assert.equal(outsideTotals.dodge_ranks, 20);
});

test("1119 Strength of Will scales both DS and spiritual TD from Empath ranks", () => {
  const will = spellsData.buff_spells.find((spell) => spell.id === 1119);
  const totals = logic.calculateSpellModifiers(
    will,
    "self",
    { empath_spell_ranks: 58 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 25);
  assert.equal(totals.bolt_ds, 25);
  assert.equal(totals.td_spiritual, 25);
});

test("1130 Intensity scales AS and DS from Empath ranks", () => {
  const intensity = spellsData.buff_spells.find((spell) => spell.id === 1130);
  const totals = logic.calculateSpellModifiers(
    intensity,
    "self",
    { level: 80, empath_spell_ranks: 80 },
    spellsData
  );

  assert.equal(totals.as_physical, 45);
  assert.equal(totals.as_bolt, 45);
  assert.equal(totals.non_bolt_ds, 45);
  assert.equal(totals.bolt_ds, 45);
});

test("1601 Mantle of Faith gains self-cast DS and TD from Blessings Lore", () => {
  const mantle = spellsData.buff_spells.find((spell) => spell.id === 1601);
  const selfTotals = logic.calculateSpellModifiers(
    mantle,
    "self",
    { spiritual_lore_blessings_ranks: 11 },
    spellsData
  );
  const outsideTotals = logic.calculateSpellModifiers(
    mantle,
    "outside",
    { spiritual_lore_blessings_ranks: 11 },
    spellsData
  );

  assert.equal(selfTotals.non_bolt_ds, 8);
  assert.equal(selfTotals.bolt_ds, 8);
  assert.equal(selfTotals.td_spiritual, 8);
  assert.equal(outsideTotals.non_bolt_ds, 5);
  assert.equal(outsideTotals.bolt_ds, 5);
  assert.equal(outsideTotals.td_spiritual, 5);
});

test("1610 Higher Vision gains DS from Paladin ranks and Religion Lore", () => {
  const vision = spellsData.buff_spells.find((spell) => spell.id === 1610);
  const totals = logic.calculateSpellModifiers(
    vision,
    "self",
    { paladin_spell_ranks: 50, spiritual_lore_religion_ranks: 11 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 32);
  assert.equal(totals.bolt_ds, 32);
});

test("1617 Zealot gains AS from Religion Lore", () => {
  const zealot = spellsData.buff_spells.find((spell) => spell.id === 1617);
  const totals = logic.calculateSpellModifiers(
    zealot,
    "self",
    { spiritual_lore_religion_ranks: 10 },
    spellsData
  );

  assert.equal(totals.as_physical, 34);
});

test("1619 Faith Shield gains spiritual TD from Religion Lore", () => {
  const faithShield = spellsData.buff_spells.find((spell) => spell.id === 1619);
  const totals = logic.calculateSpellModifiers(
    faithShield,
    "self",
    { spiritual_lore_religion_ranks: 55 },
    spellsData
  );

  assert.equal(totals.td_spiritual, 68);
});

test("503 Thurfel's Ward gains DS from Major Elemental ranks", () => {
  const ward = spellsData.buff_spells.find((spell) => spell.id === 503);
  const totals = logic.calculateSpellModifiers(
    ward,
    "self",
    { major_elemental_ranks: 43 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 30);
  assert.equal(totals.bolt_ds, 30);
});

test("507 Elemental Deflection gains DS from Major Elemental ranks", () => {
  const deflection = spellsData.buff_spells.find((spell) => spell.id === 507);
  const totals = logic.calculateSpellModifiers(
    deflection,
    "self",
    { major_elemental_ranks: 43 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 38);
  assert.equal(totals.bolt_ds, 38);
});

test("905 Prismatic Guard gains DS from Wizard ranks and Earth Lore", () => {
  const guard = spellsData.buff_spells.find((spell) => spell.id === 905);
  const totals = logic.calculateSpellModifiers(
    guard,
    "self",
    { wizard_spell_ranks: 45, elemental_lore_earth_ranks: 11 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 17);
  assert.equal(totals.bolt_ds, 32);
});

test("120 Lesser Shroud gains DS all from Minor Spiritual ranks above 20", () => {
  const shroud = spellsData.buff_spells.find((spell) => spell.id === 120);
  const totals = logic.calculateSpellModifiers(
    shroud,
    "self",
    { level: 80, minor_spiritual_ranks: 40 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 25);
  assert.equal(totals.bolt_ds, 25);
  assert.equal(totals.td_spiritual, 20);
});

test("202 Spirit Shield gains DS all from Major Spiritual ranks above 2", () => {
  const shield = spellsData.buff_spells.find((spell) => spell.id === 202);
  const totals = logic.calculateSpellModifiers(
    shield,
    "self",
    { level: 80, major_spiritual_ranks: 20 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 16);
  assert.equal(totals.bolt_ds, 16);
});

test("215 Heroism gains physical and bolt AS from Blessings Lore", () => {
  const heroism = spellsData.buff_spells.find((spell) => spell.id === 215);
  const totals = logic.calculateSpellModifiers(
    heroism,
    "self",
    { spiritual_lore_blessings_ranks: 50 },
    spellsData
  );

  assert.equal(totals.as_physical, 30);
  assert.equal(totals.as_bolt, 30);
});

test("303 Prayer of Protection gains DS all from Cleric ranks above 3", () => {
  const protection = spellsData.buff_spells.find((spell) => spell.id === 303);
  const totals = logic.calculateSpellModifiers(
    protection,
    "self",
    { level: 80, cleric_spell_ranks: 23 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 20);
  assert.equal(totals.bolt_ds, 20);
});

test("102 Spirit Barrier gains DS all from Minor Spiritual ranks above 2", () => {
  const barrier = spellsData.buff_spells.find((spell) => spell.id === 102);
  const totals = logic.calculateSpellModifiers(
    barrier,
    "self",
    { level: 20, minor_spiritual_ranks: 10 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 28);
  assert.equal(totals.bolt_ds, 28);
  assert.equal(totals.as_physical, -20);
});

test("613 Self Control uses spiritual TD only and scales DS/TD correctly", () => {
  const selfControl = spellsData.buff_spells.find((spell) => spell.id === 613);
  const totals = logic.calculateSpellModifiers(
    selfControl,
    "self",
    { level: 80, ranger_spell_ranks: 33, spiritual_lore_blessings_ranks: 11 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 30);
  assert.equal(totals.bolt_ds, 0);
  assert.equal(totals.td_spiritual, 22);
  assert.equal(totals.td_elemental, 0);
  assert.equal(totals.td_mental, 0);
});

test("625 Nature's Touch starts scaling above 27 Ranger ranks", () => {
  const touch = spellsData.buff_spells.find((spell) => spell.id === 625);
  const below = logic.calculateSpellModifiers(
    touch,
    "self",
    { ranger_spell_ranks: 27 },
    spellsData
  );
  const above = logic.calculateSpellModifiers(
    touch,
    "self",
    { ranger_spell_ranks: 29 },
    spellsData
  );

  assert.equal(below.td_spiritual, 1);
  assert.equal(above.td_spiritual, 2);
});

test("1220 Premonition gains DS all from Minor Mental ranks above 20", () => {
  const premonition = spellsData.buff_spells.find((spell) => spell.id === 1220);
  const totals = logic.calculateSpellModifiers(
    premonition,
    "self",
    { level: 60, minor_mental_ranks: 35 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 35);
  assert.equal(totals.bolt_ds, 35);
});

test("601 and 602 Blessings lore scaling is not prematurely capped at +9", () => {
  const naturalColors = spellsData.buff_spells.find((spell) => spell.id === 601);
  const resistElements = spellsData.buff_spells.find((spell) => spell.id === 602);
  const naturalTotals = logic.calculateSpellModifiers(
    naturalColors,
    "self",
    { spiritual_lore_blessings_ranks: 143 },
    spellsData
  );
  const resistTotals = logic.calculateSpellModifiers(
    resistElements,
    "self",
    { spiritual_lore_blessings_ranks: 143 },
    spellsData
  );

  assert.equal(naturalTotals.non_bolt_ds, 23);
  assert.equal(naturalTotals.bolt_ds, 23);
  assert.equal(resistTotals.bolt_ds, 28);
});

test("1010 Song of Valor gains DS all from Bard ranks above 10", () => {
  const valor = spellsData.buff_spells.find((spell) => spell.id === 1010);
  const totals = logic.calculateSpellModifiers(
    valor,
    "self",
    { level: 80, bard_spell_ranks: 20 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 15);
  assert.equal(totals.bolt_ds, 15);
  assert.equal(totals.td_elemental, 15);
});

test("1609 Divine Shield gains melee DS from Paladin ranks above 18", () => {
  const divineShield = spellsData.buff_spells.find((spell) => spell.id === 1609);
  const totals = logic.calculateSpellModifiers(
    divineShield,
    "self",
    { paladin_spell_ranks: 43 },
    spellsData
  );

  assert.equal(totals.non_bolt_ds, 20);
  assert.equal(totals.bolt_ds, 0);
});
