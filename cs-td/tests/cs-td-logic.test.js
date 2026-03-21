const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const logic = require("../cs-td-logic.js");
const csTdData = require("../../data/cs-td-data.js");

function buildProfile({ level = 60, stats = {}, skills = [], race = "Human", profession = "Wizard" } = {}) {
  const defaultStats = { str: 50, con: 50, dex: 50, agi: 50, dis: 50, aur: 50, log: 50, int: 50, wis: 50, inf: 50 };
  const merged = { ...defaultStats, ...stats };
  const statMap = {};
  Object.entries(merged).forEach(([key, value]) => {
    statMap[key] = { base: value, enhanced: value };
  });
  return { level, stats: statMap, skills, race, profession };
}

// --- statToBonus ---
test("statToBonus computes floor((stat - 50) / 2)", () => {
  assert.equal(logic.statToBonus(50), 0);
  assert.equal(logic.statToBonus(100), 25);
  assert.equal(logic.statToBonus(51), 0);
  assert.equal(logic.statToBonus(52), 1);
  assert.equal(logic.statToBonus(48), -1);
  assert.equal(logic.statToBonus(1), -25);
});

// --- primaryCircleCS ---
test("primary circle CS gives 1.0 per rank up to level", () => {
  const cs = logic.primaryCircleCS(60, 60, csTdData.primaryRankTiers);
  assert.equal(cs, 60);
});

test("primary circle CS applies diminishing tiers above level", () => {
  // 60 ranks at level 40: 40@1.0 + 20@0.75 = 40 + 15 = 55
  const cs = logic.primaryCircleCS(60, 40, csTdData.primaryRankTiers);
  assert.equal(cs, 55);
});

test("primary circle CS handles large over-training", () => {
  // 100 ranks at level 20: 20@1.0 + 20@0.75 + 40@0.5 + 20@0.25 = 20+15+20+5 = 60
  const cs = logic.primaryCircleCS(100, 20, csTdData.primaryRankTiers);
  assert.equal(cs, 60);
});

// --- secondaryCircleCS ---
test("secondary circle CS gives 1/3 per rank up to 2/3 level", () => {
  // 40 ranks at level 60: floor(60*2/3) = 40, so 40 @ 1/3 = 13.33
  const cs = logic.secondaryCircleCS(40, 60, csTdData.secondaryRankTiers);
  assert.ok(Math.abs(cs - 40 / 3) < 0.001);
});

test("secondary circle CS applies tiers above 2/3 level", () => {
  // 60 ranks at level 60: 40@(1/3) + 20@(1/9) = 13.33 + 2.22 = 15.55
  const cs = logic.secondaryCircleCS(60, 60, csTdData.secondaryRankTiers);
  const expected = 40 / 3 + 20 / 9;
  assert.ok(Math.abs(cs - expected) < 0.001);
});

// --- getCSStatBonus ---
test("getCSStatBonus returns single stat bonus for pure circles", () => {
  const statBonuses = { wis: 25 };
  const bonus = logic.getCSStatBonus("Cleric", statBonuses, csTdData);
  assert.equal(bonus, 25);
});

test("getCSStatBonus averages two stats for Sorcerer", () => {
  const statBonuses = { aur: 25, wis: 15 };
  const bonus = logic.getCSStatBonus("Sorcerer", statBonuses, csTdData);
  // ceil((25 + 15) / 2) = ceil(20) = 20
  assert.equal(bonus, 20);
});

test("getCSStatBonus ceil rounds up for Sorcerer with odd sum", () => {
  const statBonuses = { aur: 25, wis: 16 };
  const bonus = logic.getCSStatBonus("Sorcerer", statBonuses, csTdData);
  // ceil((25 + 16) / 2) = ceil(20.5) = 21
  assert.equal(bonus, 21);
});

// --- calculateCircleCS: wiki example ---
test("calculateCircleCS matches wiki Mentok example", () => {
  // Mentok: level 60 Sorcerer, 80 Sorcerer ranks, 30 MnE, 20 MnS
  // Aura bonus +30, Wisdom bonus +25
  // Casting Sorcerer Base:
  //   Level: 180
  //   Primary (Sorcerer): 60@1.0 + 20@0.75 = round(75) = 75
  //   Secondary A (MnE): ceil(30 @ 1/3) = ceil(10) = 10
  //   Secondary B (MnS): ceil(20 @ 1/3) = ceil(6.67) = 7
  //   Stat: ceil((30+25)/2) = 28
  //   Total: 180 + 75 + 10 + 7 + 28 = 300
  const profile = buildProfile({
    level: 60,
    stats: { aur: 110, wis: 100 },
    skills: [
      { name: "Sorcerer", ranks: 80, finalRanks: 80 },
      { name: "Minor Elemental", ranks: 30, finalRanks: 30 },
      { name: "Minor Spiritual", ranks: 20, finalRanks: 20 },
    ],
    profession: "Sorcerer",
  });
  const circles = new Set(["Sorcerer", "Minor Elemental", "Minor Spiritual"]);
  const statBonuses = { aur: 30, wis: 25 };
  const result = logic.calculateCircleCS("Sorcerer", profile, circles, csTdData, {}, statBonuses);

  assert.equal(result.level, 180);
  assert.equal(result.primaryCS, 75);
  assert.equal(result.secondaryCS, 17); // 10 + 7
  assert.equal(result.statBonus, 28);
  assert.equal(result.total, 300);
});

// --- getRacialTDModifier ---
test("getRacialTDModifier returns halfling elemental bonus", () => {
  assert.equal(logic.getRacialTDModifier("Halfling", "elemental", csTdData), 40);
});

test("getRacialTDModifier returns dwarf elemental bonus", () => {
  assert.equal(logic.getRacialTDModifier("Dwarf", "elemental", csTdData), 30);
});

test("getRacialTDModifier returns zero for human", () => {
  assert.equal(logic.getRacialTDModifier("Human", "elemental", csTdData), 0);
  assert.equal(logic.getRacialTDModifier("Human", "spiritual", csTdData), 0);
});

test("getRacialTDModifier returns dark elf penalties", () => {
  assert.equal(logic.getRacialTDModifier("Dark Elf", "spiritual", csTdData), -5);
  assert.equal(logic.getRacialTDModifier("Dark Elf", "elemental", csTdData), -5);
  assert.equal(logic.getRacialTDModifier("Dark Elf", "mental", csTdData), 0);
});

// --- calculateSphereTD ---
test("calculateSphereTD computes base TD correctly", () => {
  const profile = buildProfile({ level: 100, stats: { wis: 100 }, race: "Human" });
  const statBonuses = { wis: 25, aur: 0, dis: 0 };
  const result = logic.calculateSphereTD("spiritual", profile, csTdData, {}, undefined, statBonuses);
  assert.equal(result.level, 300);
  assert.equal(result.statBonus, 25);
  assert.equal(result.racialMod, 0);
  assert.equal(result.total, 325);
});

test("calculateSphereTD includes racial modifier", () => {
  const profile = buildProfile({ level: 100, stats: { aur: 100 }, race: "Halfling" });
  const statBonuses = { aur: 25, wis: 0, dis: 0 };
  const result = logic.calculateSphereTD("elemental", profile, csTdData, {}, undefined, statBonuses);
  assert.equal(result.level, 300);
  assert.equal(result.statBonus, 25);
  assert.equal(result.racialMod, 40);
  assert.equal(result.total, 365);
});

test("calculateSphereTD includes spell buff TD", () => {
  const profile = buildProfile({ level: 50, stats: { wis: 80 }, race: "Human" });
  const buffs = { td_spiritual: 30 };
  const statBonuses = { wis: 15, aur: 0, dis: 0 };
  const result = logic.calculateSphereTD("spiritual", profile, csTdData, buffs, undefined, statBonuses);
  assert.equal(result.spellBuffTD, 30);
  assert.equal(result.total, 150 + 15 + 0 + 30);
});

test("calculateSphereTD respects raceOverride", () => {
  const profile = buildProfile({ level: 50, stats: { aur: 80 }, race: "Human" });
  const statBonuses = { aur: 15, wis: 0, dis: 0 };
  const result = logic.calculateSphereTD("elemental", profile, csTdData, {}, "Dwarf", statBonuses);
  assert.equal(result.racialMod, 30);
});

// --- calculateAll ---
test("calculateAll returns CS for each profession circle and TD for each sphere", () => {
  const profile = buildProfile({
    level: 50,
    stats: { wis: 80, aur: 70, dis: 60 },
    skills: [
      { name: "Cleric", ranks: 50, finalRanks: 50 },
      { name: "Major Spiritual", ranks: 20, finalRanks: 20 },
      { name: "Minor Spiritual", ranks: 30, finalRanks: 30 },
    ],
    race: "Giantman",
    profession: "Cleric",
  });
  const circles = new Set(["Cleric", "Major Spiritual", "Minor Spiritual"]);
  const statBonuses = { wis: 15, aur: 10, dis: 5 };
  const result = logic.calculateAll({ profile, professionCircles: circles, csTdData, spellBuffTotals: {}, statBonuses });

  assert.equal(result.csResults.length, 3);
  assert.equal(result.tdResults.length, 3);

  const clericCS = result.csResults.find((r) => r.circle === "Cleric");
  assert.ok(clericCS);
  assert.equal(clericCS.level, 150);

  const spirTD = result.tdResults.find((r) => r.sphere === "spiritual");
  assert.ok(spirTD);
  assert.equal(spirTD.racialMod, 5); // giantman +5 spiritual

  const elemTD = result.tdResults.find((r) => r.sphere === "elemental");
  assert.ok(elemTD);
  assert.equal(elemTD.racialMod, -5); // giantman -5 elemental
});

// --- applyTDBuffCrossover ---
test("applyTDBuffCrossover distributes 50% to other base spheres", () => {
  const input = { td_spiritual: 35, td_elemental: 0, td_mental: 0 };
  const result = logic.applyTDBuffCrossover(input);
  assert.equal(result.td_spiritual, 35);
  assert.equal(result.td_elemental, 17); // floor(35/2)
  assert.equal(result.td_mental, 17);
});

test("applyTDBuffCrossover handles bidirectional crossover", () => {
  const input = { td_spiritual: 20, td_elemental: 10, td_mental: 0 };
  const result = logic.applyTDBuffCrossover(input);
  assert.equal(result.td_spiritual, 20 + 5 + 0); // +floor(10/2)
  assert.equal(result.td_elemental, 10 + 10 + 0); // +floor(20/2)
  assert.equal(result.td_mental, 0 + 10 + 5);     // +floor(20/2) + floor(10/2)
});

test("applyTDBuffCrossover preserves non-TD keys", () => {
  const input = { td_spiritual: 10, td_elemental: 0, td_mental: 0, cs_spiritual: 5 };
  const result = logic.applyTDBuffCrossover(input);
  assert.equal(result.cs_spiritual, 5);
});

test("calculateAll applies crossover to TD spell buffs", () => {
  // Leonni scenario: level 21 Cleric, spiritual buffs +51, no direct ele/mental
  const profile = buildProfile({
    level: 21,
    stats: { wis: 94, aur: 76, dis: 77 },
    skills: [
      { name: "Cleric", ranks: 22, finalRanks: 22 },
      { name: "Major Spiritual", ranks: 18, finalRanks: 18 },
      { name: "Minor Spiritual", ranks: 7, finalRanks: 7 },
    ],
    race: "Human",
    profession: "Cleric",
  });
  const circles = new Set(["Cleric", "Major Spiritual", "Minor Spiritual"]);
  const buffs = { td_spiritual: 51 };
  const statBonuses = { wis: 22, aur: 13, dis: 13 };
  const result = logic.calculateAll({ profile, professionCircles: circles, csTdData, spellBuffTotals: buffs, statBonuses });

  const spirTD = result.tdResults.find((r) => r.sphere === "spiritual");
  const eleTD = result.tdResults.find((r) => r.sphere === "elemental");
  const menTD = result.tdResults.find((r) => r.sphere === "mental");

  // Spiritual: 63 + 22 + 51 = 136
  assert.equal(spirTD.spellBuffTD, 51);
  // Elemental: 63 + 13 + floor(51/2) = 63 + 13 + 25 = 101
  assert.equal(eleTD.spellBuffTD, 25); // crossover
  // Mental: 63 + 13 + floor(51/2) = 63 + 13 + 25 = 101
  assert.equal(menTD.spellBuffTD, 25); // crossover
});
