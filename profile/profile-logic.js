(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ProfileLogic = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const ENHANCIVE_RESOURCE_OPTIONS = [
    { value: 'max_health', label: 'Max Health' },
    { value: 'max_mana', label: 'Max Mana' },
    { value: 'max_spirit', label: 'Max Spirit' },
    { value: 'max_stamina', label: 'Max Stamina' },
    { value: 'health_recovery', label: 'Health Recovery' },
    { value: 'mana_recovery', label: 'Mana Recovery' },
    { value: 'spirit_recovery', label: 'Spirit Recovery' },
    { value: 'stamina_recovery', label: 'Stamina Recovery' },
  ];

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

  function normalizeEnhanciveTargetLabel(label) {
    return String(label || '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildEnhanciveTargetOptions(effectType, stats, skillCatalog) {
    if (effectType === 'stat' || effectType === 'stat_bonus') {
      return (stats || []).map((stat) => ({ value: stat.key, label: stat.label }));
    }
    if (effectType === 'skill_rank' || effectType === 'skill_bonus') {
      return (skillCatalog || []).map((name) => ({ value: skillKey(name), label: name }));
    }
    return ENHANCIVE_RESOURCE_OPTIONS;
  }

  function guessEnhanciveEffectType(category, label, stats) {
    const normalizedCategory = String(category || '').trim().toLowerCase();
    const normalizedLabel = normalizeEnhanciveTargetLabel(label);
    const stat = (stats || []).find((entry) => entry.label.toLowerCase() === normalizedLabel.toLowerCase());
    if (normalizedCategory === 'stats' || stat) return 'stat';
    if (normalizedCategory === 'skills') return 'skill_bonus';
    if (normalizedCategory === 'resources') return 'resource';
    return 'unknown';
  }

  function guessEnhanciveTarget(params) {
    const {
      effectType,
      label,
      stats,
      skillCatalog,
      skillAliasMap,
    } = params || {};
    const normalizedLabel = normalizeEnhanciveTargetLabel(label);
    if (effectType === 'stat' || effectType === 'stat_bonus') {
      const stat = (stats || []).find((entry) => (
        entry.label.toLowerCase() === normalizedLabel.toLowerCase()
        || entry.abbr.toLowerCase() === normalizedLabel.toLowerCase()
      ));
      return stat?.key || '';
    }
    if (effectType === 'skill_rank' || effectType === 'skill_bonus') {
      const canonical = canonicalSkillName(normalizedLabel, skillAliasMap, skillCatalog);
      return canonical ? skillKey(canonical) : '';
    }
    if (effectType === 'resource') {
      const labelKey = normalizedLabel.toLowerCase();
      if (labelKey === 'max health' || labelKey === 'maximum health') return 'max_health';
      if (labelKey === 'max mana' || labelKey === 'maximum mana') return 'max_mana';
      if (labelKey === 'max spirit' || labelKey === 'maximum spirit' || labelKey === 'spirit') return 'max_spirit';
      if (labelKey === 'max stamina' || labelKey === 'maximum stamina') return 'max_stamina';
      if (labelKey === 'health recovery' || labelKey === 'health regen' || labelKey === 'health regeneration') return 'health_recovery';
      if (labelKey === 'mana recovery' || labelKey === 'mana regen' || labelKey === 'mana regeneration') return 'mana_recovery';
      if (labelKey === 'spirit recovery' || labelKey === 'spirit regen' || labelKey === 'spirit regeneration') return 'spirit_recovery';
      if (labelKey === 'stamina recovery' || labelKey === 'stamina regen' || labelKey === 'stamina regeneration') return 'stamina_recovery';
    }
    return '';
  }

  function effectDisplayType(effect) {
    const type = String(effect?.type || '');
    if (type === 'stat') return 'Stat +';
    if (type === 'stat_bonus') return 'Stat Bonus +';
    if (type === 'skill_rank') return 'Skill Rank +';
    if (type === 'skill_bonus') return 'Skill Bonus +';
    if (type === 'resource') return 'Resource';
    return 'Unknown';
  }

  function effectDisplayTarget(effect, stats, skillCatalog) {
    const type = String(effect?.type || '');
    const target = String(effect?.target || '');
    if (type === 'stat' || type === 'stat_bonus') {
      return (stats || []).find((entry) => entry.key === target)?.label || effect?.label || target;
    }
    if (type === 'skill_rank' || type === 'skill_bonus') {
      return (skillCatalog || []).find((name) => skillKey(name) === target) || effect?.label || target;
    }
    if (type === 'resource') {
      return ENHANCIVE_RESOURCE_OPTIONS.find((entry) => entry.value === target)?.label || effect?.label || target;
    }
    return effect?.label || target || 'Unknown';
  }

  function normalizeEnhanciveEffectForUse(effect, stats, skillCatalog, skillAliasMap) {
    const guessedType = guessEnhanciveEffectType(effect?.category, effect?.label || effect?.target, stats);
    const type = effect?.type && effect.type !== 'unknown' ? effect.type : guessedType;
    const target = effect?.target && effect.target !== effect?.label
      ? effect.target
      : guessEnhanciveTarget({ effectType: type, label: effect?.label || effect?.target, stats, skillCatalog, skillAliasMap });
    return {
      ...effect,
      type,
      target,
      label: effect?.label || effect?.target || '',
      value: Math.max(0, Math.trunc(Number(effect?.value) || 0)),
      limit: Math.max(0, Math.trunc(Number(effect?.limit) || 0)),
    };
  }

  function normalizeEnhanciveItemLinkName(value) {
    return String(value || '')
      .normalize('NFKC')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function normalizeProfileNameForMatch(value) {
    return String(value || '')
      .normalize('NFKC')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function normalizeBadgeDefaults(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const components = Array.isArray(source.components)
      ? source.components.slice(0, 5).map((value) => clamp(Math.trunc(Number(value) || 0), 0, 10))
      : [0, 0, 0, 0, 0];
    while (components.length < 5) components.push(0);

    const fallbackBoosts = [{ id: 1, value: 0 }, { id: 22, value: 0 }, { id: 87, value: 0 }];
    const boosts = Array.isArray(source.boosts)
      ? source.boosts.slice(0, 3).map((entry, index) => {
        const fallback = fallbackBoosts[index] || fallbackBoosts[0];
        return {
          id: Math.max(1, Math.trunc(Number(entry?.id) || fallback.id)),
          value: Math.max(0, Math.trunc(Number(entry?.value) || 0)),
        };
      })
      : fallbackBoosts.map((entry) => ({ ...entry }));
    while (boosts.length < 3) boosts.push({ ...fallbackBoosts[boosts.length] });

    return {
      lifetimeBp: Math.max(0, Math.trunc(Number(source.lifetimeBp) || 0)),
      components,
      boosts,
    };
  }

  function resolveStatKeyFromAscName(name, stats) {
    const raw = String(name || '').trim().toLowerCase();
    if (!raw) return null;
    const direct = (stats || []).find((stat) => stat.key === raw);
    if (direct) return direct.key;
    const byAbbr = (stats || []).find((stat) => stat.abbr.toLowerCase() === raw);
    if (byAbbr) return byAbbr.key;
    const byLabel = (stats || []).find((stat) => stat.label.toLowerCase() === raw);
    if (byLabel) return byLabel.key;
    return null;
  }

  function getAscensionDisplayGroup(ability) {
    const mnemonic = String(ability?.mnemonic || '').toLowerCase();
    if (mnemonic === 'porter' || mnemonic === 'trandest') return 'other';
    const raw = String(ability?.subcategory || '').toLowerCase();
    if (raw.includes('stat')) return 'stat';
    if (raw.includes('skill')) return 'skill';
    if (raw.includes('resist')) return 'resist';
    if (raw.includes('regen')) return 'regen';
    return 'other';
  }

  function ascensionRankCost(ability, rankOrdinal) {
    const ordinal = Math.max(1, Math.trunc(Number(rankOrdinal) || 1));
    if (ability?.mnemonic === 'trandest') {
      return ordinal <= 5 ? ordinal * 10 : 50;
    }
    return Math.ceil(ordinal / 5);
  }

  function ascensionPointsForRanks(ranks, ability = null) {
    const capped = Math.max(0, Math.trunc(Number(ranks) || 0));
    let total = 0;
    for (let rank = 1; rank <= capped; rank += 1) {
      total += ascensionRankCost(ability, rank);
    }
    return total;
  }

  function buildDefaultAscensionAbilities(defaultCatalog) {
    return (defaultCatalog || []).map((entry) => ({
      name: entry.name,
      mnemonic: entry.mnemonic,
      cap: entry.cap,
      category: entry.category || 'Common',
      subcategory: entry.subcategory || 'Skill',
      ranks: 0,
    }));
  }

  function normalizeAscensionAbilities(entries, defaultCatalog) {
    const byMnemonic = new Map();
    buildDefaultAscensionAbilities(defaultCatalog).forEach((entry) => {
      byMnemonic.set(entry.mnemonic, { ...entry });
    });

    (entries || []).forEach((entry) => {
      const mnemonic = String(entry?.mnemonic || '').trim().toLowerCase();
      if (!mnemonic) return;
      const existing = byMnemonic.get(mnemonic);
      const cap = Math.max(0, Math.trunc(Number(entry?.cap ?? existing?.cap ?? 50) || 50));
      const ranks = clamp(Math.trunc(Number(entry?.ranks ?? existing?.ranks ?? 0) || 0), 0, cap);
      byMnemonic.set(mnemonic, {
        name: String(entry?.name || existing?.name || mnemonic).trim() || mnemonic,
        mnemonic,
        cap,
        category: String(entry?.category || existing?.category || 'Common'),
        subcategory: String(entry?.subcategory || existing?.subcategory || 'Skill'),
        ranks,
      });
    });

    const groupOrder = { stat: 0, skill: 1, resist: 2, regen: 3, other: 4 };
    const groupIndex = (ability) => {
      const raw = String(ability?.subcategory || '').toLowerCase();
      if (raw.includes('stat')) return groupOrder.stat;
      if (raw.includes('skill')) return groupOrder.skill;
      if (raw.includes('resist')) return groupOrder.resist;
      if (raw.includes('regen')) return groupOrder.regen;
      return groupOrder.other;
    };

    return Array.from(byMnemonic.values()).sort((a, b) => {
      const groupDiff = groupIndex(a) - groupIndex(b);
      if (groupDiff !== 0) return groupDiff;
      return a.name.localeCompare(b.name);
    });
  }

  function trainingPointsPerLevelForStats(statSnapshot, profession, professionPrimeReqs) {
    const primes = new Set(professionPrimeReqs?.[profession] || []);
    const weighted = (key) => {
      const value = clamp(Number(statSnapshot?.[key] ?? 50), 1, 100);
      return primes.has(key) ? value * 2 : value;
    };
    const str = weighted('str');
    const con = weighted('con');
    const dex = weighted('dex');
    const agi = weighted('agi');
    const aur = weighted('aur');
    const dis = weighted('dis');
    const log = weighted('log');
    const int = weighted('int');
    const wis = weighted('wis');
    const inf = weighted('inf');
    const hybrid = (aur + dis) / 2;

    const ptpPerLevel = Math.max(0, Math.floor((str + con + dex + agi + hybrid) / 20 + 25));
    const mtpPerLevel = Math.max(0, Math.floor((log + int + wis + inf + hybrid) / 20 + 25));
    return { ptpPerLevel, mtpPerLevel };
  }

  function estimateTotalTrainingPointsFromExperience(params) {
    const {
      experience,
      profession,
      levelThresholds,
      getTrainingPointStatsForLevel,
      professionPrimeReqs,
    } = params || {};
    const totalExp = Math.max(0, Math.trunc(Number(experience) || 0));
    const thresholdEntries = Array.isArray(levelThresholds) ? levelThresholds : [];
    const capIndex = thresholdEntries.length > 100 ? 100 : Math.max(0, thresholdEntries.length - 1);
    const capExp = Math.max(0, Math.trunc(Number(levelThresholds?.[capIndex]) || 0));
    const expForLeveledGain = Math.min(totalExp, capExp);

    let totalPtp = 0;
    let totalMtp = 0;

    const level0Stats = getTrainingPointStatsForLevel?.(0) || {};
    const level0Gain = trainingPointsPerLevelForStats(level0Stats, profession, professionPrimeReqs);
    totalPtp += level0Gain.ptpPerLevel;
    totalMtp += level0Gain.mtpPerLevel;

    for (let level = 0; level < 100; level += 1) {
      const start = levelThresholds?.[level];
      const end = levelThresholds?.[level + 1];
      if (expForLeveledGain <= start) break;
      const gained = Math.min(expForLeveledGain, end) - start;
      if (gained <= 0) continue;
      const interval = Math.max(1, end - start);
      const perLevel = trainingPointsPerLevelForStats(
        getTrainingPointStatsForLevel?.(Math.min(100, level + 1)) || {},
        profession,
        professionPrimeReqs
      );
      if (gained >= interval) {
        totalPtp += perLevel.ptpPerLevel;
        totalMtp += perLevel.mtpPerLevel;
      } else {
        totalPtp += Math.floor((gained * perLevel.ptpPerLevel) / interval);
        totalMtp += Math.floor((gained * perLevel.mtpPerLevel) / interval);
        break;
      }
    }

    if (totalExp > capExp) {
      const postCapChunks = Math.floor((totalExp - capExp) / 2500);
      totalPtp += postCapChunks;
      totalMtp += postCapChunks;
    }

    return {
      ptp: Math.max(0, Math.trunc(totalPtp)),
      mtp: Math.max(0, Math.trunc(totalMtp)),
    };
  }

  function estimateSpentTrainingPointsFromRanks(params) {
    const {
      skills,
      profession,
      level,
      costProfessionOrder,
      trainingCostRows,
      getSkillTrainingRowName,
      getSkillPoolKey,
      multiplierUnitsForRanksFn = multiplierUnitsForRanks,
    } = params || {};
    const professionIndex = (costProfessionOrder || []).indexOf(profession);
    if (professionIndex < 0) return { ptp: 0, mtp: 0 };

    const effectiveLevels = Math.max(0, Math.trunc(Number(level) || 0)) + 2;
    const pools = new Map();

    (skills || []).forEach((skill) => {
      const ranks = Math.max(0, Math.trunc(Number(skill?.ranks) || 0));
      if (ranks <= 0) return;
      const trainingRowName = getSkillTrainingRowName?.(skill.name);
      const poolKey = getSkillPoolKey?.(skill.name, trainingRowName);
      if (!pools.has(poolKey)) {
        pools.set(poolKey, { trainingRowName, ranks: 0 });
      }
      pools.get(poolKey).ranks += ranks;
    });

    let spentPtp = 0;
    let spentMtp = 0;
    pools.forEach((pool) => {
      const costRow = trainingCostRows?.[pool.trainingRowName]?.[professionIndex];
      if (!Array.isArray(costRow) || costRow.length < 2) return;
      const basePtp = Math.max(0, Math.trunc(Number(costRow[0]) || 0));
      const baseMtp = Math.max(0, Math.trunc(Number(costRow[1]) || 0));
      const units = multiplierUnitsForRanksFn(pool.ranks, effectiveLevels);
      spentPtp += basePtp * units;
      spentMtp += baseMtp * units;
    });

    return {
      ptp: Math.max(0, Math.trunc(spentPtp)),
      mtp: Math.max(0, Math.trunc(spentMtp)),
    };
  }

  return {
    ENHANCIVE_RESOURCE_OPTIONS,
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
    normalizeEnhanciveTargetLabel,
    buildEnhanciveTargetOptions,
    guessEnhanciveEffectType,
    guessEnhanciveTarget,
    effectDisplayType,
    effectDisplayTarget,
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
  };
});
