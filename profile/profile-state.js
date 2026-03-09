(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ProfileState = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function mergeImportedProfileState(options) {
    const {
      existing,
      record,
      preserveUnsyncedFromExisting = false,
      normalizeBadgeDefaults,
      normalizeEnhanciveEquipmentState,
    } = options || {};

    if (!preserveUnsyncedFromExisting || !existing) {
      return record;
    }

    const existingDefaults = existing.defaults && typeof existing.defaults === "object" ? existing.defaults : {};
    const recordDefaults = record?.defaults && typeof record.defaults === "object" ? record.defaults : {};
    const existingEnhanciveEquipment = normalizeEnhanciveEquipmentState(existing?.equipment?.enhancives);
    const currentEnhanciveEquipmentState = normalizeEnhanciveEquipmentState(record?.equipment?.enhancives);
    const hasImportedEnhanciveInput = Boolean(
      currentEnhanciveEquipmentState.raw.list
      || currentEnhanciveEquipmentState.raw.totals
      || currentEnhanciveEquipmentState.raw.totalsDetails
      || currentEnhanciveEquipmentState.importedSnapshot.items.length
      || currentEnhanciveEquipmentState.importedSnapshot.unresolved.length
    );

    return {
      ...record,
      ascension: existing.ascension || record.ascension,
      enhancive: existing.enhancive || record.enhancive,
      equipment: {
        enhancives: hasImportedEnhanciveInput
          ? normalizeEnhanciveEquipmentState({
            ...currentEnhanciveEquipmentState,
            manualResolutions: existingEnhanciveEquipment.manualResolutions,
            enhancivesEnabled: currentEnhanciveEquipmentState.enhancivesEnabled,
          })
          : existingEnhanciveEquipment,
      },
      defaults: {
        ...recordDefaults,
        ...existingDefaults,
        badge: normalizeBadgeDefaults(existingDefaults.badge ?? recordDefaults.badge),
      },
    };
  }

  function normalizeLevel0Stats(level0Stats, stats, clamp) {
    if (!level0Stats || typeof level0Stats !== "object") return null;
    const normalized = {};
    stats.forEach((stat) => {
      const value = level0Stats[stat.key];
      if (value != null) normalized[stat.key] = clamp(Number(value), 1, 100);
    });
    return Object.keys(normalized).length ? normalized : null;
  }

  function normalizeSkillForCompare(skill, normalizeSkillEntry, skillBonusFromRanks) {
    const normalized = normalizeSkillEntry(skill);
    const finalRanks = Math.max(0, Math.trunc(Number(skill?.finalRanks) || normalized.ranks));
    const finalBonus = Math.trunc(Number(skill?.bonus) || skillBonusFromRanks(finalRanks));
    return {
      name: normalized.name,
      ranks: normalized.ranks,
      finalRanks,
      bonus: finalBonus,
    };
  }

  function comparableProfile(options) {
    const {
      record,
      stats,
      mergeSkillsWithCatalog,
      skillKey,
      normalizeSkillEntry,
      skillBonusFromRanks,
      normalizeBadgeDefaults,
      normalizeEnhanciveEquipmentState,
      normalizeAscensionAbilities,
      clamp,
      experienceForLevel,
    } = options || {};

    const mergedSkills = mergeSkillsWithCatalog(Array.isArray(record?.skills) ? record.skills : []);

    const statsPayload = {};
    stats.forEach((stat) => {
      statsPayload[stat.key] = {
        base: clamp(Number(record?.stats?.[stat.key]?.base ?? 50), 1, 200),
        enhanced: clamp(Number(record?.stats?.[stat.key]?.enhanced ?? record?.stats?.[stat.key]?.base ?? 50), 1, 200),
      };
    });

    const ascStats = {};
    const enhStats = {};
    stats.forEach((stat) => {
      ascStats[stat.key] = {
        stat: Math.max(0, Math.trunc(Number(record?.ascension?.stats?.[stat.key]?.stat) || 0)),
        bonus: Math.max(0, Math.trunc(Number(record?.ascension?.stats?.[stat.key]?.bonus) || 0)),
      };
      enhStats[stat.key] = {
        stat: Math.max(0, Math.trunc(Number(record?.enhancive?.stats?.[stat.key]?.stat) || 0)),
        bonus: Math.max(0, Math.trunc(Number(record?.enhancive?.stats?.[stat.key]?.bonus) || 0)),
      };
    });

    const ascSkills = {};
    const enhSkills = {};
    mergedSkills.forEach((skill) => {
      const key = skillKey(skill.name);
      ascSkills[key] = { bonus: Math.max(0, Math.trunc(Number(record?.ascension?.skills?.[key]?.bonus) || 0)) };
      enhSkills[key] = {
        rank: Math.max(0, Math.trunc(Number(record?.enhancive?.skills?.[key]?.rank) || 0)),
        bonus: Math.max(0, Math.trunc(Number(record?.enhancive?.skills?.[key]?.bonus) || 0)),
      };
    });

    const defaults = {
      armorAsg: record?.defaults?.armorAsg || "none",
      armorWeight: Math.max(0, Number(record?.defaults?.armorWeight) || 0),
      useCustomArmorBase: Boolean(record?.defaults?.useCustomArmorBase),
      armorBaseWeight: Math.max(0, Number(record?.defaults?.armorBaseWeight) || 0),
      accessoryWeight: Math.max(0, Number(record?.defaults?.accessoryWeight) || 0),
      gearWeight: Math.max(0, Number(record?.defaults?.gearWeight) || 0),
      silvers: Math.max(0, Number(record?.defaults?.silvers) || 0),
      badge: normalizeBadgeDefaults(record?.defaults?.badge),
    };

    const ascensionAbilities = normalizeAscensionAbilities(Array.isArray(record?.ascensionAbilities) ? record.ascensionAbilities : [])
      .map((entry) => ({
        name: entry.name,
        mnemonic: entry.mnemonic,
        cap: entry.cap,
        category: entry.category,
        subcategory: entry.subcategory,
        ranks: entry.ranks,
      }));

    return {
      name: String(record?.name || "").trim(),
      race: String(record?.race || "Human"),
      profession: String(record?.profession || ""),
      level: clamp(Number(record?.level), 0, 100),
      experience: Math.max(0, Math.trunc(Number(record?.experience) || experienceForLevel(record?.level))),
      ascensionExperience: Math.max(0, Math.trunc(Number(record?.ascensionExperience) || 0)),
      ascensionMilestones: clamp(Math.trunc(Number(record?.ascensionMilestones) || 0), 0, 10),
      ascensionAbilities,
      level0Stats: normalizeLevel0Stats(record?.level0Stats, stats, clamp),
      stats: statsPayload,
      ascension: { stats: ascStats, skills: ascSkills },
      enhancive: { stats: enhStats, skills: enhSkills },
      equipment: {
        enhancives: normalizeEnhanciveEquipmentState(record?.equipment?.enhancives),
      },
      skills: mergedSkills.map((skill) => normalizeSkillForCompare(skill, normalizeSkillEntry, skillBonusFromRanks)),
      defaults,
    };
  }

  function profilesEqual(options) {
    const { a, b } = options || {};
    return JSON.stringify(a) === JSON.stringify(b);
  }

  return {
    mergeImportedProfileState,
    normalizeLevel0Stats,
    normalizeSkillForCompare,
    comparableProfile,
    profilesEqual,
  };
});
