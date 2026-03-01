(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ProfileLogic = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const stats = [
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

  const skillCatalog = [
    'Armor Use', 'Shield Use', 'Combat Maneuvers', 'Edged Weapons', 'Blunt Weapons',
    'Two-Handed Weapons', 'Ranged Weapons', 'Thrown Weapons', 'Polearm Weapons', 'Brawling',
    'Two Weapon Combat', 'Ambush', 'Multi Opponent Combat', 'Physical Fitness', 'Dodging',
    'Arcane Symbols', 'Magic Item Use', 'Spell Aiming', 'Harness Power', 'Elemental Mana Control',
    'Mental Mana Control', 'Spirit Mana Control', 'Elemental Lore - Air', 'Elemental Lore - Earth',
    'Elemental Lore - Fire', 'Elemental Lore - Water', 'Spiritual Lore - Blessings',
    'Spiritual Lore - Religion', 'Spiritual Lore - Summoning', 'Sorcerous Lore - Demonology',
    'Sorcerous Lore - Necromancy', 'Mental Lore - Divination', 'Mental Lore - Manipulation',
    'Mental Lore - Telepathy', 'Mental Lore - Transference', 'Mental Lore - Transformation',
    'Stalking and Hiding', 'Perception', 'Climbing', 'Swimming', 'Disarming Traps', 'Picking Locks',
    'Picking Pockets', 'First Aid', 'Survival', 'Trading', 'Minor Elemental', 'Major Elemental',
    'Minor Spiritual', 'Major Spiritual', 'Minor Mental', 'Major Mental', 'Wizard', 'Bard',
    'Cleric', 'Empath', 'Ranger', 'Paladin', 'Sorcerer', 'Monk',
  ];

  const skillAliasMap = {
    pickpocketing: 'Picking Pockets',
    'picking pockets': 'Picking Pockets',
    'elemental lore, air': 'Elemental Lore - Air',
    'elemental lore, earth': 'Elemental Lore - Earth',
    'elemental lore, fire': 'Elemental Lore - Fire',
    'elemental lore, water': 'Elemental Lore - Water',
    'spiritual lore, blessings': 'Spiritual Lore - Blessings',
    'spiritual lore, religion': 'Spiritual Lore - Religion',
    'spiritual lore, summoning': 'Spiritual Lore - Summoning',
    'sorcerous lore, demonology': 'Sorcerous Lore - Demonology',
    'sorcerous lore, necromancy': 'Sorcerous Lore - Necromancy',
    'mental lore, divination': 'Mental Lore - Divination',
    'mental lore, manipulation': 'Mental Lore - Manipulation',
    'mental lore, telepathy': 'Mental Lore - Telepathy',
    'mental lore, transference': 'Mental Lore - Transference',
    'mental lore, transformation': 'Mental Lore - Transformation',
  };

  const spellCircles = new Set([
    'Minor Elemental', 'Major Elemental', 'Minor Spiritual', 'Major Spiritual',
    'Minor Mental', 'Major Mental', 'Wizard', 'Bard', 'Cleric', 'Empath',
    'Ranger', 'Paladin', 'Sorcerer', 'Monk',
  ]);

  const professionSpellCircleMap = {
    Bard: new Set(['Bard', 'Minor Elemental']),
    Cleric: new Set(['Cleric', 'Major Spiritual', 'Minor Spiritual']),
    Empath: new Set(['Empath', 'Major Spiritual', 'Minor Spiritual']),
    Monk: new Set(['Minor Mental', 'Minor Spiritual']),
    Paladin: new Set(['Paladin', 'Minor Spiritual']),
    Ranger: new Set(['Ranger', 'Minor Spiritual']),
    Rogue: new Set(['Minor Elemental', 'Minor Spiritual']),
    Sorcerer: new Set(['Sorcerer', 'Minor Elemental', 'Minor Spiritual']),
    Warrior: new Set(['Minor Elemental', 'Minor Spiritual']),
    Wizard: new Set(['Wizard', 'Major Elemental', 'Minor Elemental']),
  };

  function skillKey(name) {
    return String(name || '').trim().toLowerCase();
  }

  function normalizeRaceName(raw) {
    const cleaned = String(raw || '').toLowerCase().replace(/[^a-z]/g, '');
    if (cleaned === 'darkelf') return 'Dark Elf';
    if (cleaned === 'halfelf') return 'Half-Elf';
    if (cleaned === 'halfkrolvin') return 'Half-Krolvin';
    if (cleaned === 'giantman') return 'Giantman';
    if (cleaned === 'forestgnome' || cleaned === 'forestrgnome') return 'Forest Gnome';
    return raw;
  }

  function canonicalSkillName(rawName) {
    const cleaned = String(rawName || '').trim();
    if (!cleaned) return '';
    const normalized = skillKey(cleaned.replace(/\s+/g, ' '));
    if (skillAliasMap[normalized]) return skillAliasMap[normalized];

    const exact = skillCatalog.find((name) => skillKey(name) === normalized);
    if (exact) return exact;

    const fuzzy = skillCatalog.find((name) => {
      const key = skillKey(name);
      return key.startsWith(normalized) || normalized.startsWith(key);
    });
    return fuzzy || cleaned;
  }

  function parseInfoStartBlock(text) {
    const cleaned = String(text || '').replace(/^s>\s?.*$/gim, '');
    const lines = cleaned.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const headerLine = lines.find((line) => /Level\s+0\s+Stats\s+for/i.test(line));
    const headerMatch = headerLine ? headerLine.match(/Level\s+0\s+Stats\s+for\s+([^,]+),\s+(.+)/i) : null;

    let name = '';
    let race = '';
    let profession = '';
    if (headerMatch) {
      name = headerMatch[1].trim();
      const tail = headerMatch[2].trim().replace(/^[^A-Za-z]*/, '');
      const parts = tail.split(/\s+/);
      if (parts.length >= 2) {
        profession = parts.pop();
        race = normalizeRaceName(parts.join(' '));
      }
    }

    const level0Stats = {};
    let statLineCount = 0;
    let looksLikeInfoBlock = false;
    lines.forEach((line) => {
      if (/\.\.\.|[)]\s*\.\.\.\s*\d+\s*\(/.test(line) || /\(\s*[-+]?\d+\s*\)\s*(?:\.{3}|…)/.test(line)) {
        looksLikeInfoBlock = true;
      }
      const match = line.match(/^([A-Za-z ]+)\s*\(([A-Z]{3})\):\s*(\d+)/i);
      if (!match) return;
      statLineCount += 1;
      const abbr = match[2].toUpperCase();
      const stat = stats.find((s) => s.abbr === abbr);
      if (stat) level0Stats[stat.key] = Number(match[3]);
    });

    const required = stats.map((s) => s.key);
    const missing = required.filter((key) => level0Stats[key] == null);
    if (missing.length) {
      if (looksLikeInfoBlock) return { error: 'wrong_block_info' };
      if (statLineCount > 0) return { error: 'partial_level0', missing };
      return { error: 'no_level0_stats' };
    }

    return { name, race, profession, level0Stats };
  }

  function parseSkillsBlock(text) {
    const lines = String(text || '').split(/\r?\n/);
    const parsed = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('Skill Name')) return;
      if (trimmed.startsWith('Spell Lists')) return;
      if (trimmed.startsWith('Training Points')) return;
      if (!trimmed.includes('|')) return;

      const parts = trimmed.split('|');
      if (parts.length < 2) return;

      const name = parts[0].replace(/\.+$/, '').trim();
      const right = parts[1].trim();
      const numbers = right.match(/-?\d+/g);
      if (!name || !numbers || numbers.length === 0) return;

      const bonus = numbers.length >= 2 ? Number(numbers[0]) : null;
      const ranks = numbers.length >= 2 ? Number(numbers[1]) : Number(numbers[0]);
      parsed.push({ name, bonus, ranks });
    });

    return parsed;
  }

  function findOffProfessionCircles(skills, profession) {
    const allowed = professionSpellCircleMap[profession] || new Set();
    return skills
      .filter((skill) => spellCircles.has(skill.name) && Number(skill.ranks) > 0 && !allowed.has(skill.name))
      .map((skill) => skill.name);
  }

  return {
    stats,
    skillCatalog,
    spellCircles,
    professionSpellCircleMap,
    skillKey,
    canonicalSkillName,
    parseInfoStartBlock,
    parseSkillsBlock,
    findOffProfessionCircles,
  };
});
