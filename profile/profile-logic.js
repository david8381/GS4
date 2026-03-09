(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ProfileLogic = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function normalizeRaceName(raw) {
    const text = String(raw || '');
    const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
    if (cleaned === 'darkelf') return 'Dark Elf';
    if (cleaned === 'halfelf') return 'Half-Elf';
    if (cleaned === 'halfkrolvin') return 'Half-Krolvin';
    if (cleaned === 'giantman') return 'Giantman';
    if (cleaned === 'forestgnome' || cleaned === 'forestrgnome') return 'Forest Gnome';
    return text;
  }

  function normalizeRaceForModifierLookup(raw) {
    const text = String(raw || '');
    if (!text) return '';
    const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
    if (cleaned === 'aelotoi') return 'Aelotoi';
    if (cleaned === 'burghalgnome' || cleaned === 'bgnome') return 'Burghal Gnome';
    if (cleaned === 'darkelf') return 'Dark Elf';
    if (cleaned === 'dwarf') return 'Dwarf';
    if (cleaned === 'elf') return 'Elf';
    if (cleaned === 'erithian') return 'Erithian';
    if (cleaned === 'forestgnome' || cleaned === 'fgnome') return 'Forest Gnome';
    if (cleaned === 'giantman') return 'Giantman';
    if (cleaned === 'halfelf') return 'Half-Elf';
    if (cleaned === 'halfkrolvin') return 'Half-Krolvin';
    if (cleaned === 'halfling') return 'Halfling';
    if (cleaned === 'human') return 'Human';
    if (cleaned === 'sylvan' || cleaned === 'sylvankind') return 'Sylvankind';
    return text;
  }

  function statToBonus(statValue) {
    return Math.floor((Number(statValue) - 50) / 2);
  }

  function skillKey(name) {
    return String(name || '').trim().toLowerCase();
  }

  function canonicalSkillName(rawName, skillAliasMap, skillCatalog) {
    const cleaned = String(rawName || '').trim();
    if (!cleaned) return '';

    const normalized = skillKey(cleaned.replace(/\s+/g, ' '));
    if (skillAliasMap?.[normalized]) return skillAliasMap[normalized];

    const exact = (skillCatalog || []).find((name) => skillKey(name) === normalized);
    if (exact) return exact;

    const fuzzy = (skillCatalog || []).find((name) => {
      const key = skillKey(name);
      return key.startsWith(normalized) || normalized.startsWith(key);
    });
    return fuzzy || cleaned;
  }

  function defaultStatMap(stats, value) {
    const payload = {};
    (stats || []).forEach((stat) => {
      payload[stat.key] = value;
    });
    return payload;
  }

  function getGrowthRate(baseGrowthRates, raceGrowthModifiers, raceName, profession, statKey) {
    const base = baseGrowthRates?.[profession]?.[statKey];
    const mod = raceGrowthModifiers?.[raceName]?.[statKey] ?? 0;
    if (base == null) return null;
    return base + mod;
  }

  function computeStatsFromLevel0(params) {
    const {
      stats,
      level0Stats,
      level,
      raceName,
      profession,
      baseGrowthRates,
      raceGrowthModifiers,
    } = params || {};

    const computed = {};
    (stats || []).forEach((stat) => {
      const rate = getGrowthRate(baseGrowthRates, raceGrowthModifiers, raceName, profession, stat.key);
      if (!rate || level0Stats?.[stat.key] == null) return;

      let value = level0Stats[stat.key];
      for (let lvl = 1; lvl <= level; lvl += 1) {
        const gi = Math.max(Math.trunc(value / rate), 1);
        if (lvl % gi === 0) value = Math.min(100, value + 1);
      }
      computed[stat.key] = { base: value, enhanced: value };
    });

    return computed;
  }

  function getRaceBonusModifier(raceStatBonusModifiers, raceName, statKey) {
    const normalizedRace = normalizeRaceForModifierLookup(raceName);
    return raceStatBonusModifiers?.[normalizedRace]?.[statKey] ?? 0;
  }

  function mergeSkillsWithCatalog(skills, skillCatalog, skillAliasMap) {
    const byKey = new Map();

    (skills || []).forEach((skill) => {
      const canonical = canonicalSkillName(skill?.name || '', skillAliasMap, skillCatalog);
      if (!canonical) return;
      byKey.set(skillKey(canonical), {
        name: canonical,
        ranks: Math.max(0, Math.trunc(Number(skill?.ranks) || 0)),
      });
    });

    const merged = (skillCatalog || []).map((name) => {
      const existing = byKey.get(skillKey(name));
      return existing || { name, ranks: 0 };
    });

    byKey.forEach((value, key) => {
      if (!merged.some((entry) => skillKey(entry.name) === key)) merged.push(value);
    });

    return merged;
  }

  function skillBonusFromRanks(ranks) {
    const value = Math.max(0, Math.trunc(Number(ranks) || 0));
    if (value <= 10) return value * 5;
    if (value <= 20) return 50 + (value - 10) * 4;
    if (value <= 30) return 90 + (value - 20) * 3;
    if (value <= 40) return 120 + (value - 30) * 2;
    return 100 + value;
  }

  function normalizeSkillEntry(skill, skillCatalog, skillAliasMap) {
    const baseRanks = Math.max(0, Math.trunc(Number(skill?.ranks) || 0));
    const canonical = canonicalSkillName(skill?.name || 'Unknown Skill', skillAliasMap, skillCatalog);
    return {
      name: canonical || 'Unknown Skill',
      ranks: baseRanks,
    };
  }

  function experienceForLevel(level, levelThresholds) {
    const safeLevel = clamp(Math.trunc(Number(level) || 0), 0, 100);
    return Math.max(0, Math.trunc(Number(levelThresholds?.[safeLevel]) || 0));
  }

  function estimateTotalAscensionPoints(ascensionExperience, ascensionMilestones) {
    const ascExp = Math.max(0, Math.trunc(Number(ascensionExperience) || 0));
    const milestones = clamp(Math.trunc(Number(ascensionMilestones) || 0), 0, 10);
    const expAtp = Math.floor(ascExp / 50000);
    return {
      totalAtp: expAtp + milestones,
      expAtp,
      milestones,
    };
  }

  function multiplierUnitsForRanks(rankCount, effectiveLevels) {
    const ranks = Math.max(0, Math.trunc(Number(rankCount) || 0));
    const oneX = Math.max(0, Math.trunc(Number(effectiveLevels) || 0));
    const baseCount = Math.min(ranks, oneX);
    const doubleCount = Math.min(Math.max(ranks - oneX, 0), oneX);
    const quadCount = Math.max(ranks - oneX * 2, 0);
    return baseCount + doubleCount * 2 + quadCount * 4;
  }

  function summarizeTrainingPointConversion(totalTp, spentTp) {
    let balancePtp = Math.trunc(Number(totalTp?.ptp) || 0) - Math.trunc(Number(spentTp?.ptp) || 0);
    let balanceMtp = Math.trunc(Number(totalTp?.mtp) || 0) - Math.trunc(Number(spentTp?.mtp) || 0);
    let phyToMnt = 0;
    let mntToPhy = 0;

    if (balancePtp > 0 && balanceMtp < 0) {
      const neededMtp = Math.abs(balanceMtp);
      let convertiblePtp = Math.min(balancePtp, neededMtp * 2);
      convertiblePtp = Math.floor(convertiblePtp / 2) * 2;
      phyToMnt = Math.max(0, convertiblePtp);
      balancePtp -= phyToMnt;
      balanceMtp += Math.floor(phyToMnt / 2);
    } else if (balanceMtp > 0 && balancePtp < 0) {
      const neededPtp = Math.abs(balancePtp);
      let convertibleMtp = Math.min(balanceMtp, neededPtp * 2);
      convertibleMtp = Math.floor(convertibleMtp / 2) * 2;
      mntToPhy = Math.max(0, convertibleMtp);
      balanceMtp -= mntToPhy;
      balancePtp += Math.floor(mntToPhy / 2);
    }

    return {
      phyToMnt,
      mntToPhy,
      pointsLeftPtp: Math.max(0, balancePtp),
      pointsLeftMtp: Math.max(0, balanceMtp),
      remainingDeficitPtp: Math.max(0, -balancePtp),
      remainingDeficitMtp: Math.max(0, -balanceMtp),
    };
  }

  return {
    clamp,
    normalizeRaceName,
    normalizeRaceForModifierLookup,
    statToBonus,
    skillKey,
    canonicalSkillName,
    defaultStatMap,
    getGrowthRate,
    computeStatsFromLevel0,
    getRaceBonusModifier,
    mergeSkillsWithCatalog,
    skillBonusFromRanks,
    normalizeSkillEntry,
    experienceForLevel,
    estimateTotalAscensionPoints,
    multiplierUnitsForRanks,
    summarizeTrainingPointConversion,
  };
});
