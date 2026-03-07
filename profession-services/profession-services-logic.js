(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ProfessionServicesLogic = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const WPS_CER_SERVICE_COUNTS = [
    0, 10, 20, 30, 40, 50, 70, 90, 110, 130, 150,
    180, 210, 240, 270, 300, 340, 380, 420, 460, 500,
    600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500,
    1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500,
    2700, 2900, 3100, 3300, 3500, 3800, 4100, 4400, 4700, 5000,
  ];

  function asNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function asInteger(value, fallback) {
    return Math.trunc(asNumber(value, fallback));
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ");
  }

  function getByPath(object, path) {
    if (!object || !path) return undefined;

    const parts = String(path).split(".");
    let current = object;
    for (let index = 0; index < parts.length; index += 1) {
      if (current == null) return undefined;
      current = current[parts[index]];
    }
    return current;
  }

  function statToBonus(statValue) {
    return Math.floor((asNumber(statValue, 0) - 50) / 2);
  }

  function findSkill(profile, skillName) {
    const target = normalizeText(skillName);
    const skills = Array.isArray(profile?.skills) ? profile.skills : [];
    return skills.find((skill) => normalizeText(skill?.name) === target) || null;
  }

  function getResolvedSkillRanks(profile, skillName) {
    const skill = findSkill(profile, skillName);
    if (!skill) return 0;

    if (Number.isFinite(Number(skill.finalRanks))) {
      return Math.max(0, asNumber(skill.finalRanks, 0));
    }

    return Math.max(0, asNumber(skill.ranks, 0));
  }

  function getSortedSkillRanks(profile, skillNames) {
    return (skillNames || [])
      .map((skillName) => getResolvedSkillRanks(profile, skillName))
      .sort((left, right) => right - left);
  }

  function resolveProfileSourceValue(profile, profileSource) {
    if (!profileSource) return undefined;

    if (profileSource.type === "field") {
      return getByPath(profile, profileSource.path);
    }

    if (profileSource.type === "skill_ranks") {
      return getResolvedSkillRanks(profile, profileSource.skillName);
    }

    if (profileSource.type === "sum_skill_ranks") {
      return (profileSource.skillNames || []).reduce(
        (sum, skillName) => sum + getResolvedSkillRanks(profile, skillName),
        0
      );
    }

    if (profileSource.type === "nth_highest_skill_ranks_in_group") {
      const ranks = getSortedSkillRanks(profile, profileSource.skillNames || []);
      const index = Math.max(0, asInteger(profileSource.index, 0));
      return ranks[index] || 0;
    }

    if (profileSource.type === "stat_bonus") {
      const statRecord = profile?.stats?.[profileSource.statKey];
      const preferredField = profileSource.field || "enhanced";
      const statValue =
        statRecord?.[preferredField] ??
        statRecord?.enhanced ??
        statRecord?.base;
      if (!Number.isFinite(Number(statValue))) return undefined;
      return statToBonus(statValue);
    }

    return undefined;
  }

  function resolveFactorValue(factorKey, factorDefinitions, profile, overrides) {
    if (overrides && Object.prototype.hasOwnProperty.call(overrides, factorKey)) {
      return overrides[factorKey];
    }

    const factorDefinition = factorDefinitions?.[factorKey];
    if (!factorDefinition) return undefined;

    const resolved = resolveProfileSourceValue(profile, factorDefinition.profileSource);
    if (resolved !== undefined) return resolved;
    return factorDefinition.defaultValue;
  }

  function resolveServiceFactorValues(serviceDefinition, factorDefinitions, profile, overrides) {
    const factorValues = {};
    (serviceDefinition?.factors || []).forEach((factorKey) => {
      factorValues[factorKey] = resolveFactorValue(factorKey, factorDefinitions, profile, overrides);
    });
    return factorValues;
  }

  function applyRounding(value, roundingMode) {
    if (roundingMode === "floor") return Math.floor(value);
    if (roundingMode === "floor_each") return Math.floor(value);
    if (roundingMode === "ceil") return Math.ceil(value);
    if (roundingMode === "round") return Math.round(value);
    return value;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function evaluateContribution(contribution, factorValues) {
    const type = contribution?.type;

    if (type === "direct") {
      const input = asNumber(factorValues?.[contribution.factor], 0);
      return {
        id: contribution.id,
        label: contribution.label,
        value: input,
        inputs: { [contribution.factor]: input },
      };
    }

    if (type === "direct_multiplier") {
      const input = asNumber(factorValues?.[contribution.factor], 0);
      const multiplier = asNumber(contribution.multiplier, 0);
      return {
        id: contribution.id,
        label: contribution.label,
        value: applyRounding(input * multiplier, contribution.roundingMode),
        inputs: { [contribution.factor]: input },
      };
    }

    if (type === "up_to_reference_then_above") {
      const input = Math.max(0, asNumber(factorValues?.[contribution.factor], 0));
      const referenceBase = Math.max(0, asNumber(factorValues?.[contribution.referenceFactor], 0));
      const referenceOffset = asNumber(contribution.referenceOffset, 0);
      const reference = referenceBase + referenceOffset;
      const upToReferenceMultiplier = asNumber(contribution.upToReferenceMultiplier, 0);
      const aboveReferenceMultiplier = asNumber(contribution.aboveReferenceMultiplier, 0);
      const upToReference = Math.min(input, reference);
      const aboveReference = Math.max(input - reference, 0);
      return {
        id: contribution.id,
        label: contribution.label,
        value:
          applyRounding(upToReference * upToReferenceMultiplier, contribution.roundingMode) +
          applyRounding(aboveReference * aboveReferenceMultiplier, contribution.roundingMode),
        inputs: {
          [contribution.factor]: input,
          [contribution.referenceFactor]: referenceBase,
        },
      };
    }

    if (type === "weighted_pair_split_by_greater") {
      const valueA = Math.max(0, asNumber(factorValues?.[contribution.factorA], 0));
      const valueB = Math.max(0, asNumber(factorValues?.[contribution.factorB], 0));
      const greaterMultiplier = asNumber(contribution.greaterMultiplier, 0);
      const lesserMultiplier = asNumber(contribution.lesserMultiplier, 0);
      const equalFirstMultiplier = asNumber(
        contribution.equalFirstMultiplier,
        greaterMultiplier
      );
      const equalSecondMultiplier = asNumber(
        contribution.equalSecondMultiplier,
        lesserMultiplier
      );
      const roundingMode = contribution.roundingMode;

      let valueForA;
      let valueForB;

      if (valueA > valueB) {
        valueForA = applyRounding(valueA * greaterMultiplier, roundingMode);
        valueForB = applyRounding(valueB * lesserMultiplier, roundingMode);
      } else if (valueB > valueA) {
        valueForA = applyRounding(valueA * lesserMultiplier, roundingMode);
        valueForB = applyRounding(valueB * greaterMultiplier, roundingMode);
      } else {
        valueForA = applyRounding(valueA * equalFirstMultiplier, roundingMode);
        valueForB = applyRounding(valueB * equalSecondMultiplier, roundingMode);
      }

      return [
        {
          id: contribution.id + "_a",
          label: contribution.labelA || contribution.factorA,
          value: valueForA,
          inputs: { [contribution.factorA]: valueA },
        },
        {
          id: contribution.id + "_b",
          label: contribution.labelB || contribution.factorB,
          value: valueForB,
          inputs: { [contribution.factorB]: valueB },
        },
      ];
    }

    return {
      id: contribution?.id || "unknown",
      label: contribution?.label || "Unknown",
      value: 0,
      inputs: {},
    };
  }

  function listAllServices(servicesData) {
    const professionServices = servicesData?.professionServices || {};
    return Object.keys(professionServices).flatMap((profession) =>
      (professionServices[profession] || []).map((service) => ({
        profession,
        ...service,
      }))
    );
  }

  function findServiceDefinition(servicesData, serviceId) {
    return listAllServices(servicesData).find((service) => service.id === serviceId) || null;
  }

  function calculateServiceScore(serviceDefinition, factorDefinitions, profile, overrides) {
    const factorValues = resolveServiceFactorValues(
      serviceDefinition,
      factorDefinitions,
      profile,
      overrides
    );
    const contributions = (serviceDefinition?.contributions || []).flatMap((contribution) => {
      const evaluated = evaluateContribution(contribution, factorValues);
      return Array.isArray(evaluated) ? evaluated : [evaluated];
    });

    const total = contributions.reduce(
      (sum, contribution) => sum + asNumber(contribution.value, 0),
      0
    );

    return {
      factorValues,
      contributions,
      total,
    };
  }

  function calculateServiceScoreById(servicesData, serviceId, profile, overrides) {
    const serviceDefinition = findServiceDefinition(servicesData, serviceId);
    if (!serviceDefinition) {
      throw new Error("Unknown service id: " + serviceId);
    }

    return calculateServiceScore(
      serviceDefinition,
      servicesData?.factorDefinitions || {},
      profile,
      overrides
    );
  }

  function buildStageLabel(prefix, stage) {
    return prefix ? prefix + stage : String(stage);
  }

  function getDefaultProgressionState(serviceDefinition) {
    const progression = serviceDefinition?.progression;
    if (!progression) return {};

    if (progression.type === "item_tiered_property") {
      return { baseItemDifficulty: 0, currentStage: 0 };
    }
    if (progression.type === "fixed_tiers") {
      return { currentStage: 0 };
    }
    if (progression.type === "fixed_tiers_with_existing_count") {
      return { currentStage: 0, existingCount: 0 };
    }
    if (progression.type === "ranked_training") {
      return { currentRank: 0, existingCount: 0 };
    }
    if (progression.type === "wps_services") {
      const defaultItemType = progression.itemTypes?.[0]?.value || "";
      return { currentServices: 0, baseItemDifficulty: 0, itemType: defaultItemType };
    }
    if (progression.type === "enchant_bonus_steps") {
      return { currentBonus: 0, baseItemDifficulty: 0 };
    }
    return {};
  }

  function deriveProgressionState(serviceDefinition, progressionState, relatedServices, progressionStatesByServiceId) {
    const progression = serviceDefinition?.progression;
    const baseState = {
      ...getDefaultProgressionState(serviceDefinition),
      ...(progressionState || {}),
    };

    if (!progression?.sharedExistingCount) {
      return baseState;
    }

    if (progression.sharedExistingCount.mode === "sum_other_rank") {
      const group = progression.sharedExistingCount.group;
      const otherRankTotal = (relatedServices || []).reduce((sum, candidateService) => {
        if (!candidateService || candidateService.id === serviceDefinition.id) return sum;
        const candidateProgression = candidateService.progression;
        if (!candidateProgression?.sharedExistingCount) return sum;
        if (candidateProgression.sharedExistingCount.group !== group) return sum;

        const candidateState = {
          ...getDefaultProgressionState(candidateService),
          ...(progressionStatesByServiceId?.[candidateService.id] || {}),
        };
        return sum + Math.max(0, asInteger(candidateState.currentRank, 0));
      }, 0);

      baseState.existingCount = clamp(
        otherRankTotal,
        0,
        Number.isFinite(Number(progression.maxExistingCount))
          ? Number(progression.maxExistingCount)
          : otherRankTotal
      );
    }

    return baseState;
  }

  function getResourceCostFromMap(costMap, targetStage) {
    return asNumber(costMap?.[targetStage], 0);
  }

  function calculateItemTierDifficulty(baseItemDifficulty, currentStage, progression, overridePenalty, overridePerStagePenalty) {
    return Math.max(0, (
      asNumber(baseItemDifficulty, 0) +
      asNumber(overridePenalty, progression.staticPenalty || 0) +
      (asNumber(overridePerStagePenalty, progression.perCurrentStagePenalty || 0) * asNumber(currentStage, 0))
    ));
  }

  function getEnchantEssenceCost(currentBonus) {
    const bonus = clamp(asInteger(currentBonus, 0), 0, 49);
    if (bonus < 25) return Math.floor(bonus * 312.5);
    return 7500 + ((bonus - 24) * 7500);
  }

  function getEnchantDifficultyOffset(currentBonus) {
    const bonus = asNumber(currentBonus, 0);
    return -Math.round(((bonus - 2) * (bonus - 2)) / 9);
  }

  function getWpsCer(services) {
    const count = Math.max(0, asNumber(services, 0));
    if (count >= WPS_CER_SERVICE_COUNTS[WPS_CER_SERVICE_COUNTS.length - 1]) {
      return WPS_CER_SERVICE_COUNTS.length - 1;
    }

    for (let index = 0; index < WPS_CER_SERVICE_COUNTS.length - 1; index += 1) {
      const start = WPS_CER_SERVICE_COUNTS[index];
      const end = WPS_CER_SERVICE_COUNTS[index + 1];
      if (count >= start && count <= end) {
        const span = end - start || 1;
        const progress = (count - start) / span;
        return index + progress;
      }
    }

    return 0;
  }

  function getWpsCerAnchorServices(currentServices, direction) {
    const count = clamp(
      asInteger(currentServices, 0),
      0,
      WPS_CER_SERVICE_COUNTS[WPS_CER_SERVICE_COUNTS.length - 1]
    );

    if (direction < 0) {
      for (let index = WPS_CER_SERVICE_COUNTS.length - 1; index >= 0; index -= 1) {
        if (WPS_CER_SERVICE_COUNTS[index] < count) {
          return WPS_CER_SERVICE_COUNTS[index];
        }
      }
      return 0;
    }

    for (let index = 0; index < WPS_CER_SERVICE_COUNTS.length; index += 1) {
      if (WPS_CER_SERVICE_COUNTS[index] > count) {
        return WPS_CER_SERVICE_COUNTS[index];
      }
    }
    return WPS_CER_SERVICE_COUNTS[WPS_CER_SERVICE_COUNTS.length - 1];
  }

  function calculateProjectionRows(serviceDefinition, progressionState, currentTotal, whatIfTotal) {
    const progression = serviceDefinition?.progression;
    if (!progression) return [];

    const rows = [];

    if (progression.type === "item_tiered_property") {
      const baseItemDifficulty = asNumber(progressionState?.baseItemDifficulty, 0);
      let currentStage = clamp(asInteger(progressionState?.currentStage, 0), 0, progression.maxStage);
      for (let targetStage = currentStage + 1; targetStage <= progression.maxStage; targetStage += 1) {
        const difficulty = calculateItemTierDifficulty(baseItemDifficulty, currentStage, progression);
        rows.push({
          fromLabel: buildStageLabel(progression.stagePrefix, currentStage),
          toLabel: buildStageLabel(progression.stagePrefix, targetStage),
          difficulty,
          resourceCost: getResourceCostFromMap(progression.resourceCostsByTargetStage, targetStage),
          currentMargin: asNumber(currentTotal, 0) - difficulty,
          whatIfMargin: asNumber(whatIfTotal, 0) - difficulty,
        });
        currentStage = targetStage;
      }

      (progression.specialStages || []).forEach((stage) => {
        if (currentStage !== asInteger(stage.fromStage, currentStage)) return;
        const difficulty = calculateItemTierDifficulty(
          baseItemDifficulty,
          currentStage,
          progression,
          stage.staticPenalty,
          stage.perCurrentStagePenalty
        );
        rows.push({
          fromLabel: buildStageLabel(progression.stagePrefix, currentStage),
          toLabel: stage.targetLabel,
          difficulty,
          resourceCost: asNumber(stage.resourceCost, 0),
          currentMargin: asNumber(currentTotal, 0) - difficulty,
          whatIfMargin: asNumber(whatIfTotal, 0) - difficulty,
        });
      });
      return rows;
    }

    if (progression.type === "fixed_tiers") {
      const currentStage = clamp(asInteger(progressionState?.currentStage, 0), 0, progression.maxStage);
      for (let targetStage = currentStage + 1; targetStage <= progression.maxStage; targetStage += 1) {
        const difficulty =
          asNumber(progression.difficultyBase, 0) +
          (asNumber(progression.difficultyPerTargetStage, 0) * targetStage);
        rows.push({
          fromLabel: buildStageLabel(progression.stagePrefix, currentStage + (targetStage - currentStage - 1)),
          toLabel: buildStageLabel(progression.stagePrefix, targetStage),
          difficulty,
          resourceCost: getResourceCostFromMap(progression.resourceCostsByTargetStage, targetStage),
          currentMargin: asNumber(currentTotal, 0) - difficulty,
          whatIfMargin: asNumber(whatIfTotal, 0) - difficulty,
        });
      }
      return rows;
    }

    if (progression.type === "fixed_tiers_with_existing_count") {
      const currentStage = clamp(asInteger(progressionState?.currentStage, 0), 0, progression.maxStage);
      const existingCount = Math.max(0, asInteger(progressionState?.existingCount, 0));
      for (let targetStage = currentStage + 1; targetStage <= progression.maxStage; targetStage += 1) {
        const difficulty =
          asNumber(progression.difficultyBase, 0) +
          (asNumber(progression.difficultyPerTargetStage, 0) * targetStage) +
          (asNumber(progression.extraCountMultiplier, 0) * existingCount);
        rows.push({
          fromLabel: buildStageLabel(progression.stagePrefix, currentStage + (targetStage - currentStage - 1)),
          toLabel: buildStageLabel(progression.stagePrefix, targetStage),
          difficulty,
          resourceCost: getResourceCostFromMap(progression.resourceCostsByTargetStage, targetStage),
          currentMargin: asNumber(currentTotal, 0) - difficulty,
          whatIfMargin: asNumber(whatIfTotal, 0) - difficulty,
        });
      }
      return rows;
    }

    if (progression.type === "ranked_training") {
      const currentRank = clamp(asInteger(progressionState?.currentRank, 0), 0, progression.maxRank);
      const existingCount = Math.max(0, asInteger(progressionState?.existingCount, 0));
      for (let targetRank = currentRank + 1; targetRank <= progression.maxRank; targetRank += 1) {
        const difficulty =
          (asNumber(progression.difficultyPerTargetRank, 0) * targetRank) +
          (asNumber(progression.extraCountMultiplier, 0) * existingCount);
        rows.push({
          fromLabel: "Rank " + (currentRank + (targetRank - currentRank - 1)),
          toLabel: "Rank " + targetRank,
          difficulty,
          resourceCost: getResourceCostFromMap(progression.resourceCostsByTargetStage, targetRank),
          currentMargin: asNumber(currentTotal, 0) - difficulty,
          whatIfMargin: asNumber(whatIfTotal, 0) - difficulty,
        });
      }
      return rows;
    }

    if (progression.type === "wps_services") {
      const currentServices = Math.max(0, asInteger(progressionState?.currentServices, 0));
      const baseItemDifficulty = asNumber(progressionState?.baseItemDifficulty, 0);
      const itemType = String(progressionState?.itemType || "");
      const resourceCost = asNumber(
        (progression.itemTypes || []).find((entry) => entry.value === itemType)?.resourceCost,
        0
      );

      let serviceCount = currentServices;
      for (let step = 0; step < asInteger(progression.rowCount, 0); step += 1) {
        const cer = getWpsCer(serviceCount);
        const difficultyModifier = -Math.round(cer * cer);
        const difficulty = baseItemDifficulty + difficultyModifier;
        rows.push({
          fromLabel: String(serviceCount),
          toLabel: String(serviceCount + 1),
          difficulty,
          resourceCost,
          currentMargin: asNumber(currentTotal, 0) - difficulty,
          whatIfMargin: asNumber(whatIfTotal, 0) - difficulty,
          note: "CER " + cer.toFixed(2),
        });
        serviceCount += 1;
      }
      return rows;
    }

    if (progression.type === "enchant_bonus_steps") {
      let currentBonus = clamp(asInteger(progressionState?.currentBonus, 0), 0, progression.maxBonus);
      const baseItemDifficulty = asNumber(progressionState?.baseItemDifficulty, 0);

      for (let step = 0; step < asInteger(progression.rowCount, 0) && currentBonus < progression.maxBonus; step += 1) {
        const difficulty = baseItemDifficulty + getEnchantDifficultyOffset(currentBonus);
        rows.push({
          fromLabel: "+" + currentBonus,
          toLabel: "+" + (currentBonus + 1),
          difficulty,
          resourceCost: getEnchantEssenceCost(currentBonus),
          currentMargin: asNumber(currentTotal, 0) - difficulty,
          whatIfMargin: asNumber(whatIfTotal, 0) - difficulty,
          note: "Offset " + getEnchantDifficultyOffset(currentBonus),
        });
        currentBonus += 1;
      }
      return rows;
    }

    return rows;
  }

  return {
    clamp,
    statToBonus,
    getResolvedSkillRanks,
    resolveFactorValue,
    resolveServiceFactorValues,
    evaluateContribution,
    listAllServices,
    findServiceDefinition,
    calculateServiceScore,
    calculateServiceScoreById,
    getDefaultProgressionState,
    deriveProgressionState,
    getWpsCer,
    getWpsCerAnchorServices,
    calculateProjectionRows,
  };
});
