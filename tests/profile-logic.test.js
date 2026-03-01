const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../profile-logic.js');

const LEVEL0_HEADER_BLOCK = `Level 0 Stats for Vadulose, Halfling Wizard

    Strength (STR): 94
Constitution (CON): 58
   Dexterity (DEX): 80
     Agility (AGI): 73
  Discipline (DIS): 46
        Aura (AUR): 80
       Logic (LOG): 68
   Intuition (INT): 65
      Wisdom (WIS): 73
   Influence (INF): 23`;

const LEVEL0_STATS_ONLY = `    Strength (STR): 94
Constitution (CON): 58
   Dexterity (DEX): 80
     Agility (AGI): 73
  Discipline (DIS): 46
        Aura (AUR): 80
       Logic (LOG): 68
   Intuition (INT): 65
      Wisdom (WIS): 73
   Influence (INF): 23`;

const WRONG_INFO_BLOCK = `Name: Vadulose Race: Halfling  Profession: Wizard (not shown)
Strength (STR):    98 (9)     ...   98 (9)
Constitution (CON):    69 (19)    ...   69 (19)`;

test('parseInfoStartBlock parses full INFO START header block', () => {
  const parsed = logic.parseInfoStartBlock(LEVEL0_HEADER_BLOCK);
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.name, 'Vadulose');
  assert.equal(parsed.race, 'Halfling');
  assert.equal(parsed.profession, 'Wizard');
  assert.equal(parsed.level0Stats.str, 94);
  assert.equal(parsed.level0Stats.inf, 23);
});

test('parseInfoStartBlock parses stats-only level 0 block', () => {
  const parsed = logic.parseInfoStartBlock(LEVEL0_STATS_ONLY);
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.name, '');
  assert.equal(parsed.race, '');
  assert.equal(parsed.profession, '');
  assert.equal(parsed.level0Stats.dex, 80);
});

test('parseInfoStartBlock flags INFO block as wrong input', () => {
  const parsed = logic.parseInfoStartBlock(WRONG_INFO_BLOCK);
  assert.equal(parsed.error, 'wrong_block_info');
});

test('parseInfoStartBlock flags partial level 0 block', () => {
  const parsed = logic.parseInfoStartBlock('Strength (STR): 94\nConstitution (CON): 58');
  assert.equal(parsed.error, 'partial_level0');
  assert.ok(parsed.missing.includes('dex'));
});

test('canonicalSkillName normalizes aliases', () => {
  assert.equal(logic.canonicalSkillName('pickpocketing'), 'Picking Pockets');
  assert.equal(logic.canonicalSkillName('mental lore, manipulation'), 'Mental Lore - Manipulation');
  assert.equal(logic.canonicalSkillName('Wizard'), 'Wizard');
});

test('parseSkillsBlock parses standard SKILLS lines', () => {
  const block = `Skill Name                           | Current Current
Armor Use............................|      130      35
Minor Elemental......................|       80      20`;
  const parsed = logic.parseSkillsBlock(block);
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0], { name: 'Armor Use', bonus: 130, ranks: 35 });
  assert.deepEqual(parsed[1], { name: 'Minor Elemental', bonus: 80, ranks: 20 });
});

test('findOffProfessionCircles detects mismatched circles', () => {
  const skills = [
    { name: 'Wizard', ranks: 20 },
    { name: 'Minor Elemental', ranks: 15 },
    { name: 'Sorcerer', ranks: 0 },
  ];
  const off = logic.findOffProfessionCircles(skills, 'Sorcerer');
  assert.deepEqual(off, ['Wizard']);
});
