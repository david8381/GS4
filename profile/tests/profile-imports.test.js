const test = require("node:test");
const assert = require("node:assert/strict");

const profileImports = require("../profile-imports.js");

const parsers = profileImports.createParserSet({
  stats: [
    { key: "str", label: "Strength", abbr: "STR" },
    { key: "con", label: "Constitution", abbr: "CON" },
    { key: "agi", label: "Agility", abbr: "AGI" },
  ],
  normalizeRaceName(value) {
    if (value === "darkelf") return "Dark Elf";
    return String(value || "");
  },
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },
  levelThresholds: [0, 1000, 3000, 6000],
});

test("parseInfoStartBlock extracts level 0 stats", () => {
  const parsed = parsers.parseInfoStartBlock(`
Level 0 Stats for Sajehn, Dark Elf Sorcerer

Strength (STR): 70
Constitution (CON): 40
Agility (AGI): 70
  `);

  assert.equal(parsed.name, "Sajehn");
  assert.equal(parsed.race, "Dark Elf");
  assert.equal(parsed.profession, "Sorcerer");
  assert.deepEqual(parsed.level0Stats, { str: 70, con: 40, agi: 70 });
});

test("parseInfoStartBlock handles Sajehn full level 0 block", () => {
  const fullParsers = profileImports.createParserSet({
    stats: [
      { key: "str", label: "Strength", abbr: "STR" },
      { key: "con", label: "Constitution", abbr: "CON" },
      { key: "dex", label: "Dexterity", abbr: "DEX" },
      { key: "agi", label: "Agility", abbr: "AGI" },
      { key: "dis", label: "Discipline", abbr: "DIS" },
      { key: "aur", label: "Aura", abbr: "AUR" },
      { key: "log", label: "Logic", abbr: "LOG" },
      { key: "int", label: "Intuition", abbr: "INT" },
      { key: "wis", label: "Wisdom", abbr: "WIS" },
      { key: "inf", label: "Influence", abbr: "INF" },
    ],
    normalizeRaceName(value) {
      if (String(value) === "Dark Elf") return "Dark Elf";
      return String(value || "");
    },
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    levelThresholds: [0],
  });

  const parsed = fullParsers.parseInfoStartBlock(`
Level 0 Stats for Sajehn, Dark Elf Sorcerer

    Strength (STR): 70
Constitution (CON): 40
   Dexterity (DEX): 70
     Agility (AGI): 70
  Discipline (DIS): 70
        Aura (AUR): 90
       Logic (LOG): 70
   Intuition (INT): 70
      Wisdom (WIS): 90
   Influence (INF): 20

This character was created on Sun Jul  6 21:12:17 ET 2003.
  `);

  assert.equal(parsed.name, "Sajehn");
  assert.equal(parsed.race, "Dark Elf");
  assert.equal(parsed.profession, "Sorcerer");
  assert.deepEqual(parsed.level0Stats, {
    str: 70,
    con: 40,
    dex: 70,
    agi: 70,
    dis: 70,
    aur: 90,
    log: 70,
    int: 70,
    wis: 90,
    inf: 20,
  });
});

test("parseExpBlock derives level from experience thresholds", () => {
  const parsed = parsers.parseExpBlock(`
Level: 2
Experience: 3,500
Ascension Exp: 50,000
  `);

  assert.equal(parsed.experience, 3500);
  assert.equal(parsed.level, 2);
  assert.equal(parsed.hintedLevel, 2);
  assert.equal(parsed.ascensionExperience, 50000);
});

test("parseSkillsBlock handles Sajehn skills output including spell lists", () => {
  const parsed = profileImports.createParserSet({
    stats: [],
    normalizeRaceName(value) { return String(value || ""); },
    clamp(value, min, max) { return Math.min(Math.max(value, min), max); },
    levelThresholds: [0],
  }).parseSkillsBlock(`
 Sajehn (at level 80), your current skill bonuses and ranks (including all modifiers) are:
  Skill Name                         | Current Current
                                     |   Bonus   Ranks
  Armor Use..........................|      10       2
  Arcane Symbols.....................|     180      80
  Trading............................|     141      41

Spell Lists
  Minor Elemental....................|              35

Spell Lists
  Minor Spiritual....................|              25

Spell Lists
  Sorcerer...........................|             100

Training Points: 122 Phy 0 Mnt (1716 Phy converted to Mnt)
  `);

  assert.deepEqual(parsed, [
    { name: "Armor Use", bonus: 10, ranks: 2 },
    { name: "Arcane Symbols", bonus: 180, ranks: 80 },
    { name: "Trading", bonus: 141, ranks: 41 },
    { name: "Minor Elemental", bonus: null, ranks: 35 },
    { name: "Minor Spiritual", bonus: null, ranks: 25 },
    { name: "Sorcerer", bonus: null, ranks: 100 },
  ]);
});

test("parseExpBlock handles Sajehn exp output", () => {
  const fullParsers = profileImports.createParserSet({
    stats: [],
    normalizeRaceName(value) { return String(value || ""); },
    clamp(value, min, max) { return Math.min(Math.max(value, min), max); },
    levelThresholds: Array.from({ length: 101 }, (_, index) => index * 70000),
  });

  const parsed = fullParsers.parseExpBlock(`
          Level: 80                          Fame: 19,997,946
     Experience: 5,504,113              Field Exp: 363/998
  Ascension Exp: 1,000,368          Recent Deaths: 1
      Total Exp: 6,504,481          Death's Sting: None
  Long-Term Exp: 17,082                     Deeds: 7
  Exp until lvl: 16,387           Exp to next ATP: 49,632
      PTPs/MTPs: 122/0                       ATPs: 9
  `);

  assert.equal(parsed.experience, 5504113);
  assert.equal(parsed.hintedLevel, 80);
  assert.equal(parsed.ascensionExperience, 1000368);
});

test("parseAscListBlock handles Sajehn asc list output", () => {
  const parsed = profileImports.createParserSet({
    stats: [],
    normalizeRaceName(value) { return String(value || ""); },
    clamp(value, min, max) { return Math.min(Math.max(value, min), max); },
    levelThresholds: [0],
  }).parseAscListBlock(`
Sajehn, the following Ascension Abilities are available:

  Skill                Mnemonic        Ranks Type           Category        Subcategory
  -------------------------------------------------------------------------------------
  Agility              agility         5/40  Passive        Common          Stat
  Aura                 aura            5/40  Passive        Common          Stat
  Strength             strength        5/40  Passive        Common          Stat
  Transcend Destiny    trandest        0/10  Passive        Elite           Other
  `);

  assert.deepEqual(parsed, [
    { name: "Agility", mnemonic: "agility", ranks: 5, cap: 40, category: "Common", subcategory: "Stat" },
    { name: "Aura", mnemonic: "aura", ranks: 5, cap: 40, category: "Common", subcategory: "Stat" },
    { name: "Strength", mnemonic: "strength", ranks: 5, cap: 40, category: "Common", subcategory: "Stat" },
    { name: "Transcend Destiny", mnemonic: "trandest", ranks: 0, cap: 10, category: "Elite", subcategory: "Other" },
  ]);
});

test("parseAscMilestonesBlock handles Sajehn milestones output", () => {
  const parsed = profileImports.createParserSet({
    stats: [],
    normalizeRaceName(value) { return String(value || ""); },
    clamp(value, min, max) { return Math.min(Math.max(value, min), max); },
    levelThresholds: [0],
  }).parseAscMilestonesBlock(`
Sajehn, your Ascension Milestones are as follows:

  ##  Milestone                     Requirement                   Acquired
  ------------------------------------------------------------------------
  1.  A Noble Effort                Reach level 20                Yes
  2.  Great Expectations            Reach level 40                Yes
  3.  Master of My Fate             Reach level 60                Yes
  4.  High and Mighty               Reach level 80                Yes
  5.  A Grand Triumph               Reach level 100               No
  6.  Up to the Task                1,000,000 Bounty Points       No
  `);

  assert.equal(parsed, 4);
});

test("parseSocietyBlock parses Voln step", () => {
  const parsed = parsers.parseSocietyBlock(`
You are a Master of the Order of Voln.
You are currently at Step 14 of 26.
  `);
  assert.deepEqual(parsed, { society: "voln", rank: 14 });
});

test("parseSocietyBlock parses CoL rank", () => {
  const parsed = parsers.parseSocietyBlock(`
You are a member of the Council of Light.
You are currently at Rank 12 of 20.
  `);
  assert.deepEqual(parsed, { society: "col", rank: 12 });
});

test("parseSocietyBlock parses Sunfist rank", () => {
  const parsed = parsers.parseSocietyBlock(`
You are a member of the Guardians of Sunfist.
You are currently at Rank 8 of 20.
  `);
  assert.deepEqual(parsed, { society: "sunfist", rank: 8 });
});

test("parseSocietyBlock parses no society", () => {
  const parsed = parsers.parseSocietyBlock(`
You are not currently a member of any society.
  `);
  assert.deepEqual(parsed, { society: null, rank: 0 });
});

test("parseSocietyBlock returns null for unparseable text", () => {
  const parsed = parsers.parseSocietyBlock(`not society text`);
  assert.equal(parsed, null);
});

test("parseSocietyBlock preserves society when rank line is missing", () => {
  const parsed = parsers.parseSocietyBlock(`
You are a Master of the Order of Voln.
  `);
  assert.deepEqual(parsed, { society: "voln", rank: 0 });
});

test("parseSocietyBlock parses current society status format", () => {
  const parsed = parsers.parseSocietyBlock(`
Current society status:
   You are a member in the Order of Voln at step 12.

You have learned and are able to use the following abilities:
   Symbol of Recognition

Past society affiliations (resigned or cast out):
   The Council of Light
  `);
  assert.deepEqual(parsed, { society: "voln", rank: 12 });
});
