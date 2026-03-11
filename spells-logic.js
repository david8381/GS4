(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SpellsLogic = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function asNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function asInteger(value, fallback = 0) {
    return Math.trunc(asNumber(value, fallback));
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function seedSumBonus(ranks, seed, maxExtra) {
    let bonus = 0;
    while ((seed * (bonus + 1)) + ((bonus * (bonus + 1)) / 2) <= ranks) {
      bonus += 1;
      if (Number.isFinite(Number(maxExtra)) && bonus >= asInteger(maxExtra, bonus)) {
        return asInteger(maxExtra, bonus);
      }
    }
    return bonus;
  }

  function getByPath(object, path) {
    if (!object || !path) return undefined;
    return String(path).split(".").reduce((current, part) => (current == null ? undefined : current[part]), object);
  }

  function findSkill(profile, skillName) {
    const target = normalizeText(skillName);
    return Array.isArray(profile?.skills)
      ? profile.skills.find((skill) => normalizeText(skill?.name) === target) || null
      : null;
  }

  function getSkillRanks(profile, skillName) {
    const skill = findSkill(profile, skillName);
    if (!skill) return 0;
    if (Number.isFinite(Number(skill.finalRanks))) return Math.max(0, asNumber(skill.finalRanks, 0));
    return Math.max(0, asNumber(skill.ranks, 0));
  }

  function getFactorValue(profile, factorDefinition, overrides) {
    if (!factorDefinition) return 0;
    const key = factorDefinition.key;
    if (overrides && Object.prototype.hasOwnProperty.call(overrides, key)) {
      return asNumber(overrides[key], 0);
    }
    const source = factorDefinition.profileSource || {};
    if (source.type === "field") return asNumber(getByPath(profile, source.path), 0);
    if (source.type === "skill_ranks") return getSkillRanks(profile, source.skillName);
    return asNumber(factorDefinition.defaultValue, 0);
  }

  function buildFactorDefinitions(spellsData) {
    return {
      ...(spellsData?.factor_definitions || {}),
      col_rank: { key: "col_rank", label: "CoL Rank", defaultValue: 0 },
      voln_step: { key: "voln_step", label: "Voln Step", defaultValue: 0 },
      sunfist_rank: { key: "sunfist_rank", label: "GoS Rank", defaultValue: 0 },
    };
  }

  function resolveFactorValues(profile, factorDefinitions, overrides) {
    const values = {};
    Object.entries(factorDefinitions || {}).forEach(([key, definition]) => {
      values[key] = getFactorValue(profile, { key, ...definition }, overrides || null);
    });
    Object.keys(overrides || {}).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(values, key)) {
        values[key] = asNumber(overrides[key], 0);
      }
    });
    return values;
  }

  function emptyTotals(spellsData) {
    const out = {};
    (spellsData?.modifier_keys || []).forEach((key) => {
      out[key] = 0;
    });
    return out;
  }

  function applyModifierDelta(target, key, amount) {
    if (!Object.prototype.hasOwnProperty.call(target, key)) target[key] = 0;
    target[key] += asInteger(amount, 0);
  }

  function evaluateDynamicRule(rule, factorValues) {
    if (!rule) return 0;
    if (rule.type === "ranks_above_threshold") {
      const sourceRanks = asNumber(factorValues[rule.factor], 0);
      const ranks = rule.cap_factor
        ? Math.min(sourceRanks, asNumber(factorValues[rule.cap_factor], sourceRanks))
        : sourceRanks;
      const threshold = asNumber(rule.threshold, 0);
      const divisor = Math.max(1, asInteger(rule.divisor, 1));
      const raw = Math.floor(Math.max(0, ranks - threshold) / divisor);
      if (Number.isFinite(Number(rule.maxExtra))) {
        return Math.min(raw, asInteger(rule.maxExtra, raw));
      }
      return raw;
    }
    if (rule.type === "base_plus_ranks_above_threshold") {
      const sourceRanks = asNumber(factorValues[rule.factor], 0);
      const ranks = rule.cap_factor
        ? Math.min(sourceRanks, asNumber(factorValues[rule.cap_factor], sourceRanks))
        : sourceRanks;
      const minimumRank = asNumber(rule.minimum_rank, asNumber(rule.threshold, 0));
      if (ranks < minimumRank) return 0;
      const threshold = asNumber(rule.threshold, 0);
      const divisor = Math.max(1, asInteger(rule.divisor, 1));
      const baseValue = asInteger(rule.base_value, 0);
      const extra = Math.floor(Math.max(0, ranks - threshold) / divisor);
      const total = baseValue + extra;
      if (Number.isFinite(Number(rule.maxExtra))) {
        return Math.min(total, asInteger(rule.maxExtra, total));
      }
      return total;
    }
    if (rule.type === "per_rank") {
      const rank = Math.max(0, asInteger(factorValues[rule.factor], 0));
      const perRank = asInteger(rule.amount_per_rank, 0);
      const total = rank * perRank;
      if (Number.isFinite(Number(rule.max_total))) {
        return Math.min(total, asInteger(rule.max_total, total));
      }
      return total;
    }
    if (rule.type === "per_n_ranks") {
      const rank = Math.max(0, asInteger(factorValues[rule.factor], 0));
      const divisor = Math.max(1, asInteger(rule.divisor, 1));
      const perStep = asInteger(rule.amount_per_step, 1);
      const total = Math.floor(rank / divisor) * perStep;
      if (Number.isFinite(Number(rule.max_total))) {
        return Math.min(total, asInteger(rule.max_total, total));
      }
      return total;
    }
    if (rule.type === "seed_sum") {
      const ranks = Math.max(0, asInteger(factorValues[rule.factor], 0));
      const steps = seedSumBonus(ranks, Math.max(1, asInteger(rule.seed, 1)), rule.maxExtra);
      return steps * Math.max(1, asInteger(rule.amount_per_step, 1));
    }
    if (rule.type === "threshold_table") {
      const rank = Math.max(0, asInteger(factorValues[rule.factor], 0));
      const thresholds = Array.isArray(rule.thresholds) ? rule.thresholds.map((v) => asInteger(v, 0)).sort((a,b)=>a-b) : [];
      let total = 0;
      thresholds.forEach((threshold) => {
        if (rank >= threshold) total += 1;
      });
      return total * Math.max(1, asInteger(rule.amount_per_step, 1));
    }
    if (rule.type === "minimum_of_base_minus_factor") {
      const factorValue = asInteger(factorValues[rule.factor], 0);
      const baseValue = asInteger(rule.base_value, 0);
      const minimum = asInteger(rule.minimum, 0);
      return Math.max(minimum, baseValue - factorValue);
    }
    return 0;
  }

  function calculateSpellModifiers(spell, castMode, factorValues, spellsData) {
    const totals = emptyTotals(spellsData);
    if (!spell || castMode === "off") return totals;

    Object.entries(spell.modifiers || {}).forEach(([key, value]) => {
      applyModifierDelta(totals, key, value);
    });

    if (castMode !== "self") return totals;
    (spell.self_cast_dynamic?.rules || []).forEach((rule) => {
      const extra = evaluateDynamicRule(rule, factorValues);
      (rule.modifierKeys || []).forEach((key) => applyModifierDelta(totals, key, extra));
    });
    return totals;
  }

  function calculateSpellDynamicTotals(spell, factorValues, spellsData) {
    const totals = emptyTotals(spellsData);
    if (!spell) return totals;
    (spell.self_cast_dynamic?.rules || []).forEach((rule) => {
      const extra = evaluateDynamicRule(rule, factorValues);
      (rule.modifierKeys || []).forEach((key) => applyModifierDelta(totals, key, extra));
    });
    return totals;
  }

  function calculateSocietyAbilityModifiers(ability, enabled, factorValues, spellsData) {
    const totals = emptyTotals(spellsData);
    if (!ability || !enabled) return totals;

    Object.entries(ability.modifiers || {}).forEach(([key, value]) => {
      applyModifierDelta(totals, key, value);
    });

    (ability.dynamic_rules || []).forEach((rule) => {
      const extra = evaluateDynamicRule(rule, factorValues);
      if (rule.metric) applyModifierDelta(totals, rule.metric, extra);
      (rule.modifierKeys || []).forEach((key) => applyModifierDelta(totals, key, extra));
    });

    return totals;
  }

  function sumModifierTotals(modifierMaps, spellsData) {
    return modifierMaps.reduce((sum, entry) => {
      Object.entries(entry || {}).forEach(([key, value]) => applyModifierDelta(sum, key, value));
      return sum;
    }, emptyTotals(spellsData));
  }

  function calculateDynamicOnlyModifiers(baseTotals, finalTotals, spellsData) {
    const dynamic = emptyTotals(spellsData);
    Object.keys(dynamic).forEach((key) => {
      dynamic[key] = asInteger(finalTotals?.[key], 0) - asInteger(baseTotals?.[key], 0);
    });
    return dynamic;
  }

  function getActiveSpellEntries(spells, castModesByKey) {
    return (spells || [])
      .map((spell) => ({ spell, castMode: castModesByKey?.[spell.key] || "off" }))
      .filter((entry) => entry.castMode !== "off");
  }

  function getCombatRelevantSocietyAbilities(societyData) {
    return (societyData?.abilities || []).filter((ability) => ability.combat_relevant);
  }

  function getActiveSocietyEntries(societiesData, activeSocietyKey, activeAbilityKeys) {
    if (!activeSocietyKey || !societiesData?.[activeSocietyKey]) return [];
    return getCombatRelevantSocietyAbilities(societiesData[activeSocietyKey])
      .map((ability) => ({
        societyKey: activeSocietyKey,
        ability,
        enabled: Boolean(activeAbilityKeys?.[`${activeSocietyKey}:${ability.id}`]),
      }))
      .filter((entry) => entry.enabled);
  }

  function collectRelevantFactors(activeSpellEntries, activeSocietyEntries, factorDefinitions) {
    const seen = new Set();
    const rows = [];
    activeSpellEntries.forEach(({ spell, castMode }) => {
      if (castMode !== "self") return;
      (spell.self_cast_dynamic?.factors || []).forEach((key) => {
        if (seen.has(key)) return;
        seen.add(key);
        const definition = factorDefinitions?.[key];
        if (definition) rows.push({ key, ...definition });
      });
      (spell.self_cast_dynamic?.rules || []).forEach((rule) => {
        const key = rule.cap_factor;
        if (!key || seen.has(key)) return;
        seen.add(key);
        const definition = factorDefinitions?.[key];
        if (definition) rows.push({ key, ...definition });
      });
    });
    return rows;
  }

  function calculateTotals({
    spellsData,
    societiesData,
    profile,
    castModesByKey,
    activeSocietyKey,
    activeSocietyAbilityKeys,
    currentFactorOverrides,
    whatIfFactorOverrides,
  }) {
    const spells = spellsData?.buff_spells || [];
    const factorDefinitions = buildFactorDefinitions(spellsData);
    const activeSpellEntries = getActiveSpellEntries(spells, castModesByKey);
    const activeSocietyEntries = getActiveSocietyEntries(
      societiesData,
      activeSocietyKey,
      activeSocietyAbilityKeys
    );
    const relevantFactors = collectRelevantFactors(activeSpellEntries, activeSocietyEntries, factorDefinitions);
    const currentFactorValues = resolveFactorValues(profile, factorDefinitions, currentFactorOverrides || null);
    const whatIfFactorValues = resolveFactorValues(profile, factorDefinitions, whatIfFactorOverrides || {});

    const currentSpellRows = activeSpellEntries.map(({ spell, castMode }) => ({
      spell,
      castMode,
      totals: calculateSpellModifiers(spell, castMode, currentFactorValues, spellsData),
    }));
    const whatIfSpellRows = activeSpellEntries.map(({ spell, castMode }) => ({
      spell,
      castMode,
      totals: calculateSpellModifiers(spell, castMode, whatIfFactorValues, spellsData),
    }));
    currentSpellRows.forEach((row) => {
      row.dynamicTotals = calculateSpellDynamicTotals(row.spell, currentFactorValues, spellsData);
    });
    whatIfSpellRows.forEach((row) => {
      row.dynamicTotals = calculateSpellDynamicTotals(row.spell, whatIfFactorValues, spellsData);
    });
    const currentSocietyRows = activeSocietyEntries.map(({ ability, societyKey, enabled }) => ({
      ability,
      societyKey,
      enabled,
      totals: calculateSocietyAbilityModifiers(ability, enabled, currentFactorValues, spellsData),
    }));
    const whatIfSocietyRows = activeSocietyEntries.map(({ ability, societyKey, enabled }) => ({
      ability,
      societyKey,
      enabled,
      totals: calculateSocietyAbilityModifiers(ability, enabled, whatIfFactorValues, spellsData),
    }));

    return {
      activeSpellEntries,
      activeSocietyEntries,
      relevantFactors,
      currentFactorValues,
      whatIfFactorValues,
      currentTotals: sumModifierTotals(
        [...currentSpellRows.map((row) => row.totals), ...currentSocietyRows.map((row) => row.totals)],
        spellsData
      ),
      whatIfTotals: sumModifierTotals(
        [...whatIfSpellRows.map((row) => row.totals), ...whatIfSocietyRows.map((row) => row.totals)],
        spellsData
      ),
      currentSpellRows,
      whatIfSpellRows,
      currentSocietyRows,
      whatIfSocietyRows,
    };
  }

  return {
    clamp,
    asInteger,
    normalizeText,
    getSkillRanks,
    getFactorValue,
    resolveFactorValues,
    getCombatRelevantSocietyAbilities,
    evaluateDynamicRule,
    calculateSpellModifiers,
    calculateSpellDynamicTotals,
    calculateSocietyAbilityModifiers,
    calculateTotals,
    collectRelevantFactors,
    seedSumBonus,
    calculateDynamicOnlyModifiers,
  };
});
