(() => {
  const servicesData = window.GS4_PROFESSION_SERVICES_DATA;
  const serviceLogic = window.ProfessionServicesLogic;

  if (!servicesData || !serviceLogic) {
    console.error("Profession services page dependencies are missing.");
    return;
  }

  const PROFILE_KEY = "gs4.characterProfiles";
  const SELECTED_PROFILE_KEY = "gs4.selectedProfileId";

  const profileSelect = document.getElementById("profileSelect");
  const professionSelect = document.getElementById("resourceProfession");

  const profileStatus = document.getElementById("resourceProfileStatus");
  const overviewPanel = document.getElementById("resourceOverviewPanel");
  const overviewTable = document.getElementById("resourceOverviewTable");
  const overviewStatus = document.getElementById("resourceOverviewStatus");
  const factorName = document.getElementById("resourceFactorName");
  const factorHeadline = document.getElementById("resourceFactorHeadline");
  const factorServiceTabs = document.getElementById("resourceFactorServiceTabs");
  const factorTable = document.getElementById("resourceFactorTable");
  const factorStatus = document.getElementById("resourceFactorStatus");
  const resetOverridesButton = document.getElementById("resetResourceOverrides");
  const resetAllButton = document.getElementById("resetAllResourcesState");
  const runResourcesTestsBtn = document.getElementById("runResourcesTests");
  const resourcesTestOutput = document.getElementById("resourcesTestOutput");

  const state = {
    profiles: [],
    activeProfile: null,
    profession: "",
    activeServiceId: "",
    activeFactorViewId: "",
    overridesByServiceId: {},
    progressionByServiceId: {},
    chargeByServiceId: {},
    expandedPathByServiceId: {},
  };

  const ROGUE_RECHARGE_VIEW_ID = "rogue_recharge";

  function loadProfiles() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PROFILE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function findProfile(profileId) {
    return state.profiles.find((profile) => String(profile.id) === String(profileId)) || null;
  }

  function listProfessions() {
    return Object.keys(servicesData.professionServices || {});
  }

  function getServicesForProfession(profession) {
    return servicesData.professionServices?.[profession] || [];
  }

  function getActiveService() {
    return getServicesForProfession(state.profession).find((service) => service.id === state.activeServiceId) || null;
  }

  function getActiveFactorViewId() {
    return state.activeFactorViewId || state.activeServiceId;
  }

  function ensureActiveService() {
    const services = getServicesForProfession(state.profession);
    if (!services.length) {
      state.activeServiceId = "";
      return null;
    }
    if (!services.some((service) => service.id === state.activeServiceId)) {
      state.activeServiceId = services[0].id;
    }
    return getActiveService();
  }

  function refreshProfileSelect() {
    const selectedValue = state.activeProfile?.id || "";
    profileSelect.innerHTML = '<option value="">No profile selected</option>';
    state.profiles.forEach((profile) => {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.name;
      profileSelect.appendChild(option);
    });
    profileSelect.value = selectedValue;
  }

  function refreshProfessionSelect() {
    const professions = listProfessions();
    professionSelect.innerHTML = "";
    professions.forEach((profession) => {
      const option = document.createElement("option");
      option.value = profession;
      option.textContent = profession;
      professionSelect.appendChild(option);
    });
    professionSelect.value = state.profession || professions[0] || "";
  }

  function normalizeOverrideValue(factorKey, rawValue) {
    const factorDefinition = servicesData.factorDefinitions?.[factorKey];
    if (!factorDefinition) return undefined;

    if (factorDefinition.inputType === "boolean") {
      if (rawValue === true || rawValue === false) return rawValue;
      if (rawValue === "true") return true;
      if (rawValue === "false") return false;
      return undefined;
    }

    if (rawValue === "" || rawValue == null) return undefined;
    const numeric = Number(rawValue);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  function getNormalizedOverrides(service) {
    const rawOverrides = state.overridesByServiceId[service.id] || {};
    const normalized = {};
    (service.factors || []).forEach((factorKey) => {
      if (!Object.prototype.hasOwnProperty.call(rawOverrides, factorKey)) return;
      const value = normalizeOverrideValue(factorKey, rawOverrides[factorKey]);
      if (value !== undefined) normalized[factorKey] = value;
    });
    return normalized;
  }

  function getProgressionState(service) {
    if (!service?.progression) return {};
    if (!state.progressionByServiceId[service.id]) {
      state.progressionByServiceId[service.id] = serviceLogic.getDefaultProgressionState(service);
    }
    return state.progressionByServiceId[service.id];
  }

  function getEffectiveProgressionState(service) {
    if (!service?.progression) return {};
    return serviceLogic.deriveProgressionState(
      service,
      getProgressionState(service),
      getServicesForProfession(state.profession),
      state.progressionByServiceId
    );
  }

  function getChargeCapacity(service) {
    const chargeInfo = service?.chargeInfo || {};
    const progressionState = getProgressionState(service);

    if (Number.isFinite(Number(chargeInfo.maxCharges))) {
      return Math.max(0, Number(chargeInfo.maxCharges));
    }

    if (Number.isFinite(Number(chargeInfo.chargeCapacityPerTier))) {
      const tierLikeValue = Number.isFinite(Number(progressionState.currentStage))
        ? Number(progressionState.currentStage)
        : Number.isFinite(Number(progressionState.currentRank))
          ? Number(progressionState.currentRank)
          : 0;
      return Math.max(0, tierLikeValue * Number(chargeInfo.chargeCapacityPerTier));
    }

    return null;
  }

  function getChargeState(service) {
    if (!service) return { currentCharges: 0 };

    const maxCharges = getChargeCapacity(service);
    if (!state.chargeByServiceId[service.id]) {
      state.chargeByServiceId[service.id] = {
        currentCharges: Number.isFinite(Number(maxCharges)) ? Number(maxCharges) : 0,
      };
    }

    const chargeState = state.chargeByServiceId[service.id];
    if (Number.isFinite(Number(maxCharges))) {
      chargeState.currentCharges = serviceLogic.clamp(
        Number.isFinite(Number(chargeState.currentCharges)) ? Number(chargeState.currentCharges) : 0,
        0,
        Number(maxCharges)
      );
    } else {
      chargeState.currentCharges = Math.max(0, Number(chargeState.currentCharges) || 0);
    }

    return chargeState;
  }

  function calculateChargeSummary(service) {
    const chargeModel = service?.chargeModel || "none";
    const chargeInfo = service?.chargeInfo || {};
    const maxCharges = getChargeCapacity(service);
    const chargeState = getChargeState(service);

    if (chargeModel !== "resource_recharge") {
      return {
        chargeModel,
        maxCharges,
        currentCharges: chargeState.currentCharges,
        missingCharges: 0,
        rechargeCost: 0,
      };
    }

    const normalizedMaxCharges = Number.isFinite(Number(maxCharges)) ? Number(maxCharges) : 0;
    const currentCharges = serviceLogic.clamp(
      Number.isFinite(Number(chargeState.currentCharges)) ? Number(chargeState.currentCharges) : 0,
      0,
      normalizedMaxCharges
    );
    const missingCharges = Math.max(0, normalizedMaxCharges - currentCharges);
    const rechargeCost = missingCharges * (Number(chargeInfo.rechargeCostPerCharge) || 0);

    return {
      chargeModel,
      maxCharges: normalizedMaxCharges,
      currentCharges,
      missingCharges,
      rechargeCost,
    };
  }

  function calculateServiceResults(service) {
    const currentResult = serviceLogic.calculateServiceScoreById(servicesData, service.id, state.activeProfile, {});
    const whatIfResult = serviceLogic.calculateServiceScoreById(
      servicesData,
      service.id,
      state.activeProfile,
      getNormalizedOverrides(service)
    );
    const progressionState = getEffectiveProgressionState(service);
    const projectionRows = service.progression
      ? serviceLogic.calculateProjectionRows(
          service,
          progressionState,
          currentResult.total,
          whatIfResult.total
        )
      : [];
    const nextRow = projectionRows[0] || null;

    return { currentResult, whatIfResult, progressionState, projectionRows, nextRow };
  }

  function formatValue(value) {
    if (value === true) return "Yes";
    if (value === false) return "No";
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return String(value ?? "—");
    if (Math.abs(numeric - Math.round(numeric)) < 0.0001) return String(Math.round(numeric));
    return numeric.toFixed(2).replace(/\.00$/, "");
  }

  function formatSignedValue(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "—";
    if (Math.abs(numeric) < 0.0001) return "0";
    const formatted = formatValue(numeric);
    return numeric > 0 ? "+" + formatted : formatted;
  }

  function describeContribution(contribution) {
    if (contribution.type === "direct") return "Direct";
    if (contribution.type === "direct_multiplier") return "x" + contribution.multiplier;
    if (contribution.type === "up_to_reference_then_above") {
      const offset = Number(contribution.referenceOffset || 0);
      const offsetText = offset > 0 ? " + " + offset : "";
      return `x${contribution.upToReferenceMultiplier} to ${contribution.referenceFactor}${offsetText}, then x${contribution.aboveReferenceMultiplier}`;
    }
    if (contribution.type === "weighted_pair_split_by_greater") {
      return `higher x${contribution.greaterMultiplier}, lower x${contribution.lesserMultiplier}`;
    }
    return contribution.type || "Rule";
  }

  function expandContributionRows(service) {
    const rows = [];
    (service?.contributions || []).forEach((contribution) => {
      if (contribution.type === "weighted_pair_split_by_greater") {
        rows.push({
          id: contribution.id + "_a",
          label: contribution.labelA || contribution.factorA,
          factorKey: contribution.factorA,
          rule: describeContribution(contribution),
        });
        rows.push({
          id: contribution.id + "_b",
          label: contribution.labelB || contribution.factorB,
          factorKey: contribution.factorB,
          rule: describeContribution(contribution),
        });
        return;
      }

      rows.push({
        id: contribution.id,
        label: contribution.label,
        factorKey: contribution.factor,
        rule: describeContribution(contribution),
      });
    });
    return rows;
  }

  function setActiveProfile(profile) {
    state.activeProfile = profile;
    state.profession = profile?.profession || state.profession || listProfessions()[0] || "";
    state.activeServiceId = "";
    state.activeFactorViewId = "";
    state.overridesByServiceId = {};
    state.progressionByServiceId = {};
    state.chargeByServiceId = {};
    state.expandedPathByServiceId = {};

    getServicesForProfession(state.profession).forEach((service) => {
      state.progressionByServiceId[service.id] = serviceLogic.getDefaultProgressionState(service);
    });
    ensureActiveService();
  }

  function clearActiveServiceOverrides() {
    const service = getActiveService();
    if (!service) return;
    state.overridesByServiceId[service.id] = {};
  }

  function resetProfessionPlannerState() {
    const services = getServicesForProfession(state.profession);
    state.progressionByServiceId = {};
    state.chargeByServiceId = {};
    state.expandedPathByServiceId = {};
    services.forEach((service) => {
      state.progressionByServiceId[service.id] = serviceLogic.getDefaultProgressionState(service);
    });
  }

  function updateLoadButtonState() {
    return;
  }

  function setHelperLines(element, lines) {
    if (!element) return;
    element.replaceChildren();
    (lines || []).filter(Boolean).forEach((line) => {
      const row = document.createElement("div");
      row.textContent = line;
      element.appendChild(row);
    });
  }

  function describeChargeBehavior(service) {
    const chargeModel = service?.chargeModel || "none";
    const chargeInfo = service?.chargeInfo || {};

    if (chargeModel === "resource_recharge") {
      const parts = ["Charge model: resource-based recharge."];
      if (Number.isFinite(Number(chargeInfo.maxCharges))) {
        parts.push(`Max charges ${formatValue(chargeInfo.maxCharges)}.`);
      } else if (Number.isFinite(Number(chargeInfo.chargeCapacityPerTier))) {
        parts.push(`Charge capacity ${formatValue(chargeInfo.chargeCapacityPerTier)} per tier.`);
      }
      if (Number.isFinite(Number(chargeInfo.rechargeCostPerCharge))) {
        parts.push(
          `Recharge costs ${formatValue(chargeInfo.rechargeCostPerCharge)} ${chargeInfo.rechargeResourceLabel || service.resourceName} per missing charge.`
        );
      }
      if (chargeInfo.rechargeRequiresSkill) {
        parts.push(chargeInfo.rechargeSkillNote || "Recharge also uses the service skill formula.");
      } else {
        parts.push("Recharge is resource-only once the service has been created.");
      }
      if (chargeInfo.fullRechargeOnly) parts.push("Recharge must be done to full.");
      if (chargeInfo.refillOnUpgrade) parts.push("Tier/rank upgrades refill charges.");
      if (chargeInfo.noDrainForCreator) parts.push("Creator use does not drain the standard charge pool.");
      if (chargeInfo.chargesRefreshOnTraining) parts.push("Training a new rank refreshes the charge pool.");
      if (Array.isArray(chargeInfo.specialChargePools) && chargeInfo.specialChargePools.length) {
        const specialText = chargeInfo.specialChargePools
          .map((pool) => `${pool.label} max ${formatValue(pool.maxCharges)}`)
          .join("; ");
        parts.push(`Special pools: ${specialText}.`);
      }
      return parts.join(" ");
    }

    if (chargeModel === "imbedded_item") return "";

    return "Charge model: none. This service does not use a separate rechargeable charge pool.";
  }

  function renderProfileSummary() {
    const profile = state.activeProfile;
    if (!profile) {
      profileStatus.textContent = "No profile loaded. You can still browse services and enter what-if values manually.";
      return;
    }

    const identity = `${profile.name || "Unnamed"} | ${profile.race || "Unknown race"} ${profile.profession || "Unknown profession"} | Level ${profile.level ?? 0}`;

    if (state.profession && state.profession !== profile.profession) {
      profileStatus.textContent = `${identity}. Profile values populate the factor table. You can browse another profession and use the same character skills for that profession's formulas.`;
    } else {
      profileStatus.textContent = `${identity}. Profile values populate the factor table.`;
    }
  }

  function renderFactorServiceTabs() {
    const services = getServicesForProfession(state.profession);
    factorServiceTabs.innerHTML = "";

    if (!services.length) {
      return;
    }

    if (services.length === 1) {
      factorServiceTabs.hidden = true;
      return;
    }

    factorServiceTabs.hidden = false;
    const activeFactorViewId = getActiveFactorViewId();
    services.forEach((service) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "service-chip" + (service.id === activeFactorViewId ? " is-active" : "");
      button.textContent = service.name;
      button.addEventListener("click", () => {
        state.activeServiceId = service.id;
        state.activeFactorViewId = service.id;
        renderAll();
      });
      factorServiceTabs.appendChild(button);
    });

    if (state.profession === "Rogue") {
      const rechargeChip = document.createElement("button");
      rechargeChip.type = "button";
      rechargeChip.className = "service-chip" + (activeFactorViewId === ROGUE_RECHARGE_VIEW_ID ? " is-active" : "");
      rechargeChip.textContent = "Covert Arts Recharge";
      rechargeChip.addEventListener("click", () => {
        state.activeFactorViewId = ROGUE_RECHARGE_VIEW_ID;
        renderAll();
      });
      factorServiceTabs.appendChild(rechargeChip);
    }
  }

  function getRogueArtServices() {
    return getServicesForProfession("Rogue").filter((service) => service.id.startsWith("covert_arts_"));
  }

  function getRogueFactorOverrideSourceService() {
    const activeService = getActiveService();
    if (activeService?.id?.startsWith("covert_arts_")) return activeService;
    return getRogueArtServices()[0] || null;
  }

  function getRogueArtFactorKeys(service) {
    const skillContribution = (service?.contributions || []).find((row) => row.id === "art_skill");
    const statContribution = (service?.contributions || []).find((row) => row.id === "art_stat");
    return {
      skillFactorKey: skillContribution?.factor || "",
      statFactorKey: statContribution?.factor || "",
    };
  }

  function average(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
  }

  function buildRogueRechargeBreakdown() {
    const rogueServices = getRogueArtServices();
    const factorDefinitions = servicesData.factorDefinitions || {};
    const overrideSourceService = getRogueFactorOverrideSourceService();
    const overrideSource = overrideSourceService ? getNormalizedOverrides(overrideSourceService) : {};
    const sharedCurrentValues = {
      level: serviceLogic.resolveFactorValue("level", factorDefinitions, state.activeProfile, {}, servicesData),
      influence_bonus: serviceLogic.resolveFactorValue("influence_bonus", factorDefinitions, state.activeProfile, {}, servicesData),
      rogue_guild_ranks: serviceLogic.resolveFactorValue("rogue_guild_ranks", factorDefinitions, state.activeProfile, {}, servicesData),
      ambush_ranks: serviceLogic.resolveFactorValue("ambush_ranks", factorDefinitions, state.activeProfile, {}, servicesData),
      pickpocketing_ranks: serviceLogic.resolveFactorValue("pickpocketing_ranks", factorDefinitions, state.activeProfile, {}, servicesData),
    };
    const sharedWhatIfValues = Object.fromEntries(
      Object.entries(sharedCurrentValues).map(([factorKey, currentValue]) => [
        factorKey,
        Object.prototype.hasOwnProperty.call(overrideSource, factorKey) ? overrideSource[factorKey] : currentValue,
      ])
    );

    const artSnapshots = rogueServices.map((service) => {
      const serviceResults = calculateServiceResults(service);
      const factorKeys = getRogueArtFactorKeys(service);
      return {
        service,
        currentSkill: Number(serviceResults.currentResult.factorValues[factorKeys.skillFactorKey] || 0),
        whatIfSkill: Number(serviceResults.whatIfResult.factorValues[factorKeys.skillFactorKey] || 0),
        currentStat: Number(serviceResults.currentResult.factorValues[factorKeys.statFactorKey] || 0),
        whatIfStat: Number(serviceResults.whatIfResult.factorValues[factorKeys.statFactorKey] || 0),
        currentRank: Number(getEffectiveProgressionState(service).currentRank || 0),
      };
    });

    const avgCurrentSkill = average(artSnapshots.map((entry) => entry.currentSkill));
    const avgWhatIfSkill = average(artSnapshots.map((entry) => entry.whatIfSkill));
    const avgCurrentStat = average(artSnapshots.map((entry) => entry.currentStat));
    const avgWhatIfStat = average(artSnapshots.map((entry) => entry.whatIfStat));
    const maxCurrentRank = Math.max(0, ...artSnapshots.map((entry) => entry.currentRank));
    const totalKnownRanks = artSnapshots.reduce((sum, entry) => sum + entry.currentRank, 0);

    const rows = [
      {
        label: "Level",
        currentValue: sharedCurrentValues.level,
        whatIfValue: sharedWhatIfValues.level,
        currentContribution: sharedCurrentValues.level,
        whatIfContribution: sharedWhatIfValues.level,
        rule: "Direct",
      },
      {
        label: "Influence Bonus",
        currentValue: sharedCurrentValues.influence_bonus,
        whatIfValue: sharedWhatIfValues.influence_bonus,
        currentContribution: sharedCurrentValues.influence_bonus * 2,
        whatIfContribution: sharedWhatIfValues.influence_bonus * 2,
        rule: "x2",
      },
      {
        label: "Rogue Guild Ranks",
        currentValue: sharedCurrentValues.rogue_guild_ranks,
        whatIfValue: sharedWhatIfValues.rogue_guild_ranks,
        currentContribution: sharedCurrentValues.rogue_guild_ranks,
        whatIfContribution: sharedWhatIfValues.rogue_guild_ranks,
        rule: "Direct",
      },
      {
        label: "Ambush",
        currentValue: sharedCurrentValues.ambush_ranks,
        whatIfValue: sharedWhatIfValues.ambush_ranks,
        currentContribution: sharedCurrentValues.ambush_ranks,
        whatIfContribution: sharedWhatIfValues.ambush_ranks,
        rule: "Direct",
      },
      {
        label: "Picking Pockets",
        currentValue: sharedCurrentValues.pickpocketing_ranks,
        whatIfValue: sharedWhatIfValues.pickpocketing_ranks,
        currentContribution: sharedCurrentValues.pickpocketing_ranks * 0.5,
        whatIfContribution: sharedWhatIfValues.pickpocketing_ranks * 0.5,
        rule: "x0.5",
      },
      {
        label: "Average Art Skill",
        currentValue: avgCurrentSkill,
        whatIfValue: avgWhatIfSkill,
        currentContribution: avgCurrentSkill,
        whatIfContribution: avgWhatIfSkill,
        rule: "Average of the five art skills",
      },
      {
        label: "Average Art Stat",
        currentValue: avgCurrentStat,
        whatIfValue: avgWhatIfStat,
        currentContribution: avgCurrentStat * 2,
        whatIfContribution: avgWhatIfStat * 2,
        rule: "Average of the five art stats x2",
      },
      {
        label: "Max Art Rank",
        currentValue: maxCurrentRank,
        whatIfValue: maxCurrentRank,
        currentContribution: 0,
        whatIfContribution: 0,
        rule: "Info only: recharge uses highest known art rank in its separate modifier",
      },
      {
        label: "Total Known Art Ranks",
        currentValue: totalKnownRanks,
        whatIfValue: totalKnownRanks,
        currentContribution: 0,
        whatIfContribution: 0,
        rule: "Info only: planner ranks across all five arts",
      },
    ];

    const currentTotal = rows.reduce((sum, row) => sum + Number(row.currentContribution || 0), 0);
    const whatIfTotal = rows.reduce((sum, row) => sum + Number(row.whatIfContribution || 0), 0);

    return { rows, currentTotal, whatIfTotal };
  }

  function renderRogueRechargePlannerRow() {
    const recharge = buildRogueRechargeBreakdown();
    const tr = document.createElement("tr");
    tr.className = "resource-overview-subrow";

    const serviceCell = document.createElement("td");
    const serviceWrap = document.createElement("div");
    serviceWrap.className = "resource-overview-service";
    const name = document.createElement("div");
    name.className = "resource-overview-label";
    name.textContent = "Covert Arts Recharge";
    serviceWrap.appendChild(name);
    serviceCell.appendChild(serviceWrap);
    tr.appendChild(serviceCell);

    const plannerCell = document.createElement("td");
    const plannerWrap = document.createElement("div");
    plannerWrap.className = "resource-overview-track";
    const lineOne = document.createElement("div");
    lineOne.className = "resource-overview-subline";
    lineOne.textContent = "Uses all five art rows";
    plannerWrap.appendChild(lineOne);
    const lineTwo = document.createElement("div");
    lineTwo.className = "resource-overview-subline resource-overview-note";
    lineTwo.textContent = "Average art skill and stat";
    plannerWrap.appendChild(lineTwo);
    plannerCell.appendChild(plannerWrap);
    tr.appendChild(plannerCell);

    const currentCell = document.createElement("td");
    currentCell.textContent = formatValue(recharge.currentTotal);
    tr.appendChild(currentCell);

    const whatIfCell = document.createElement("td");
    whatIfCell.textContent = formatValue(recharge.whatIfTotal);
    tr.appendChild(whatIfCell);

    const nextDiffCell = document.createElement("td");
    nextDiffCell.textContent = "—";
    tr.appendChild(nextDiffCell);

    const nextCostCell = document.createElement("td");
    nextCostCell.textContent = "1,000 Guile / charge";
    tr.appendChild(nextCostCell);

    return tr;
  }

  function createOverviewNumberInput(id, value, min, max, onInput) {
    const input = document.createElement("input");
    input.type = "number";
    input.id = id;
    input.className = "resource-overview-input";
    input.value = String(value);
    input.step = "1";
    input.min = String(min);
    if (max != null) input.max = String(max);
    input.addEventListener("input", onInput);
    return input;
  }

  function createOverviewSelectInput(id, value, options, onChange) {
    const select = document.createElement("select");
    select.id = id;
    select.className = "resource-overview-select-input";
    (options || []).forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.value;
      option.textContent = entry.label;
      select.appendChild(option);
    });
    select.value = value;
    select.addEventListener("change", onChange);
    return select;
  }

  function appendOverviewLabeledInput(container, label, input) {
    const line = document.createElement("div");
    line.className = "resource-overview-subline";
    line.append(label + " ");
    line.appendChild(input);
    container.appendChild(line);
  }

  function createOverviewJumpButton(label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn ghost tiny resource-overview-jump";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function appendOverviewJumpLine(container, label, input, buttons) {
    const line = document.createElement("div");
    line.className = "resource-overview-subline";
    line.append(label + " ");
    line.appendChild(input);
    (buttons || []).forEach((button) => line.appendChild(button));
    container.appendChild(line);
  }

  function renderOverviewTrackCell(service, serviceResults) {
    const progression = service?.progression;
    const progressionState = getProgressionState(service);
    const effectiveProgressionState = serviceResults?.progressionState || progressionState;
    const cell = document.createElement("td");
    const wrap = document.createElement("div");
    wrap.className = "resource-overview-track";

    if (!progression) {
      cell.textContent = "—";
      return cell;
    }

    if (progression.type === "item_tiered_property") {
      appendOverviewLabeledInput(
        wrap,
        "Tier",
        createOverviewNumberInput(
          `overview-${service.id}-stage`,
          progressionState.currentStage,
          0,
          progression.maxStage,
          () => {
            const rawValue = Number(document.getElementById(`overview-${service.id}-stage`).value);
            progressionState.currentStage = serviceLogic.clamp(Number.isFinite(rawValue) ? rawValue : 0, 0, progression.maxStage);
            renderAll(true);
          }
        )
      );
      appendOverviewLabeledInput(
        wrap,
        "Base Diff",
        createOverviewNumberInput(
          `overview-${service.id}-difficulty`,
          progressionState.baseItemDifficulty,
          0,
          undefined,
          () => {
            progressionState.baseItemDifficulty = Math.max(0, Number(document.getElementById(`overview-${service.id}-difficulty`).value) || 0);
            renderAll(true);
          }
        )
      );
      cell.appendChild(wrap);
      return cell;
    }

    if (progression.type === "fixed_tiers") {
      appendOverviewLabeledInput(
        wrap,
        "Tier",
        createOverviewNumberInput(
          `overview-${service.id}-stage`,
          progressionState.currentStage,
          0,
          progression.maxStage,
          () => {
            const rawValue = Number(document.getElementById(`overview-${service.id}-stage`).value);
            progressionState.currentStage = serviceLogic.clamp(Number.isFinite(rawValue) ? rawValue : 0, 0, progression.maxStage);
            renderAll(true);
          }
        )
      );
      cell.appendChild(wrap);
      return cell;
    }

    if (progression.type === "fixed_tiers_with_existing_count") {
      const maxExistingCount = Number.isFinite(Number(progression.maxExistingCount))
        ? Number(progression.maxExistingCount)
        : undefined;
      appendOverviewLabeledInput(
        wrap,
        "Tier",
        createOverviewNumberInput(
          `overview-${service.id}-stage`,
          progressionState.currentStage,
          0,
          progression.maxStage,
          () => {
            const rawValue = Number(document.getElementById(`overview-${service.id}-stage`).value);
            progressionState.currentStage = serviceLogic.clamp(Number.isFinite(rawValue) ? rawValue : 0, 0, progression.maxStage);
            renderAll(true);
          }
        )
      );
      if (progression.sharedExistingCount) {
        const derived = document.createElement("div");
        derived.className = "resource-overview-subline resource-overview-note";
        derived.textContent = `Other: ${formatValue(effectiveProgressionState.existingCount || 0)}`;
        wrap.appendChild(derived);
      } else {
        appendOverviewLabeledInput(
          wrap,
          "Other T5",
          createOverviewNumberInput(
            `overview-${service.id}-existing`,
            progressionState.existingCount,
            0,
            maxExistingCount,
            () => {
              const rawValue = Number(document.getElementById(`overview-${service.id}-existing`).value);
              progressionState.existingCount = serviceLogic.clamp(
                Number.isFinite(rawValue) ? rawValue : 0,
                0,
                maxExistingCount ?? Number.MAX_SAFE_INTEGER
              );
              renderAll(true);
            }
          )
        );
      }
      cell.appendChild(wrap);
      return cell;
    }

    if (progression.type === "ranked_training") {
      const maxExistingCount = Number.isFinite(Number(progression.maxExistingCount))
        ? Number(progression.maxExistingCount)
        : undefined;
      appendOverviewLabeledInput(
        wrap,
        "Rank",
        createOverviewNumberInput(
          `overview-${service.id}-rank`,
          progressionState.currentRank,
          0,
          progression.maxRank,
          () => {
            const rawValue = Number(document.getElementById(`overview-${service.id}-rank`).value);
            progressionState.currentRank = serviceLogic.clamp(Number.isFinite(rawValue) ? rawValue : 0, 0, progression.maxRank);
            renderAll(true);
          }
        )
      );
      if (progression.sharedExistingCount) {
        const derived = document.createElement("div");
        derived.className = "resource-overview-subline resource-overview-note";
        derived.textContent = `Other: ${formatValue(effectiveProgressionState.existingCount || 0)}`;
        wrap.appendChild(derived);
      } else {
        appendOverviewLabeledInput(
          wrap,
          "Other",
          createOverviewNumberInput(
            `overview-${service.id}-existing`,
            progressionState.existingCount,
            0,
            maxExistingCount,
            () => {
              const rawValue = Number(document.getElementById(`overview-${service.id}-existing`).value);
              progressionState.existingCount = serviceLogic.clamp(
                Number.isFinite(rawValue) ? rawValue : 0,
                0,
                maxExistingCount ?? Number.MAX_SAFE_INTEGER
              );
              renderAll(true);
            }
          )
        );
      }
      cell.appendChild(wrap);
      return cell;
    }

    if (progression.type === "wps_services") {
      const servicesInput = createOverviewNumberInput(
          `overview-${service.id}-services`,
          progressionState.currentServices,
          0,
          progression.maxServices,
          () => {
            const rawValue = Number(document.getElementById(`overview-${service.id}-services`).value);
            progressionState.currentServices = serviceLogic.clamp(
              Number.isFinite(rawValue) ? rawValue : 0,
              0,
              Number.isFinite(Number(progression.maxServices)) ? Number(progression.maxServices) : Number.MAX_SAFE_INTEGER
            );
            renderAll(true);
          }
        );
      appendOverviewJumpLine(
        wrap,
        "Svcs",
        servicesInput,
        [
          createOverviewJumpButton("-CER", () => {
            progressionState.currentServices = serviceLogic.getWpsCerAnchorServices(progressionState.currentServices, -1);
            renderAll();
          }),
          createOverviewJumpButton("+CER", () => {
            progressionState.currentServices = serviceLogic.getWpsCerAnchorServices(progressionState.currentServices, 1);
            renderAll();
          }),
        ]
      );
      appendOverviewLabeledInput(
        wrap,
        "Base Diff",
        createOverviewNumberInput(
          `overview-${service.id}-difficulty`,
          progressionState.baseItemDifficulty,
          0,
          undefined,
          () => {
            progressionState.baseItemDifficulty = Math.max(0, Number(document.getElementById(`overview-${service.id}-difficulty`).value) || 0);
            renderAll(true);
          }
        )
      );
      appendOverviewLabeledInput(
        wrap,
        "Type",
        (progression.itemTypes || []).length > 1
          ? createOverviewSelectInput(
              `overview-${service.id}-item-type`,
              progressionState.itemType,
              progression.itemTypes || [],
              () => {
                progressionState.itemType = document.getElementById(`overview-${service.id}-item-type`).value;
                renderAll(true);
              }
            )
          : (() => {
              const text = document.createElement("span");
              text.className = "resource-overview-note";
              text.textContent = progression.itemTypes?.[0]?.label || "Fixed";
              return text;
            })()
      );
      cell.appendChild(wrap);
      return cell;
    }

    if (progression.type === "enchant_bonus_steps") {
      const bonusInput = createOverviewNumberInput(
          `overview-${service.id}-bonus`,
          progressionState.currentBonus,
          0,
          progression.maxBonus,
          () => {
            const rawValue = Number(document.getElementById(`overview-${service.id}-bonus`).value);
            progressionState.currentBonus = serviceLogic.clamp(Number.isFinite(rawValue) ? rawValue : 0, 0, progression.maxBonus);
            renderAll(true);
          }
        );
      appendOverviewJumpLine(
        wrap,
        "Bonus",
        bonusInput,
        [
          createOverviewJumpButton("-5", () => {
            const target = Math.max(0, Math.floor((Math.max(0, progressionState.currentBonus - 1)) / 5) * 5);
            progressionState.currentBonus = target;
            renderAll();
          }),
          createOverviewJumpButton("+5", () => {
            const nextBlock = Math.min(
              progression.maxBonus,
              Math.ceil((Math.max(0, progressionState.currentBonus + 1)) / 5) * 5
            );
            progressionState.currentBonus = nextBlock;
            renderAll();
          }),
        ]
      );
      appendOverviewLabeledInput(
        wrap,
        "Base Diff",
        createOverviewNumberInput(
          `overview-${service.id}-difficulty`,
          progressionState.baseItemDifficulty,
          0,
          undefined,
          () => {
            progressionState.baseItemDifficulty = Math.max(0, Number(document.getElementById(`overview-${service.id}-difficulty`).value) || 0);
            renderAll(true);
          }
        )
      );
      cell.appendChild(wrap);
      return cell;
    }

    cell.textContent = "—";
    return cell;
  }

  function createPathToggleButton(service, projectionRows) {
    if (!service?.progression) return null;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn ghost tiny resource-overview-path-toggle" +
      (state.expandedPathByServiceId[service.id] ? " is-open" : "");
    button.textContent = state.expandedPathByServiceId[service.id]
      ? "Hide path"
      : projectionRows.length
        ? `Show path (${projectionRows.length})`
        : "No remaining steps";
    button.disabled = !projectionRows.length;
    button.addEventListener("click", () => {
      state.expandedPathByServiceId[service.id] = !state.expandedPathByServiceId[service.id];
      renderAll();
    });
    return button;
  }

  function renderOverviewDetailRow(service, serviceResults) {
    if (!state.expandedPathByServiceId[service.id]) return null;

    const detailRow = document.createElement("tr");
    detailRow.className = "resource-overview-detail-row";

    const detailCell = document.createElement("td");
    detailCell.colSpan = 6;

    const shell = document.createElement("div");
    shell.className = "resource-overview-detail-shell";

    const meta = document.createElement("div");
    meta.className = "resource-overview-detail-meta";
    meta.textContent = `${service.name} full path`;
    shell.appendChild(meta);

    const rows = serviceResults?.projectionRows || [];
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "resource-overview-detail-empty";
      empty.textContent = "This track is already at its maximum modeled state.";
      shell.appendChild(empty);
      detailCell.appendChild(shell);
      detailRow.appendChild(detailCell);
      return detailRow;
    }

    const table = document.createElement("table");
    table.className = "resource-overview-path-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Step", "Difficulty", "Cost", "Current Margin", "What-If Margin", "Note"].forEach((label) => {
      const th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach((row) => {
      const tr = document.createElement("tr");

      const stepCell = document.createElement("td");
      stepCell.textContent = `${row.fromLabel} -> ${row.toLabel}`;
      tr.appendChild(stepCell);

      const difficultyCell = document.createElement("td");
      difficultyCell.textContent = formatValue(row.difficulty);
      tr.appendChild(difficultyCell);

      const costCell = document.createElement("td");
      costCell.textContent = `${formatValue(row.resourceCost)} ${service.progression.resourceLabel || service.resourceName}`;
      tr.appendChild(costCell);

      const currentMarginCell = document.createElement("td");
      currentMarginCell.textContent = formatSignedValue(row.currentMargin);
      tr.appendChild(currentMarginCell);

      const whatIfMarginCell = document.createElement("td");
      whatIfMarginCell.textContent = formatSignedValue(row.whatIfMargin);
      tr.appendChild(whatIfMarginCell);

      const noteCell = document.createElement("td");
      noteCell.textContent = row.note || "—";
      tr.appendChild(noteCell);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    shell.appendChild(table);

    detailCell.appendChild(shell);
    detailRow.appendChild(detailCell);
    return detailRow;
  }

  function renderRechargePlannerRow(service) {
    if (service?.chargeModel !== "resource_recharge") return null;
    if (service?.chargeInfo?.rechargeRequiresSkill) return null;

    const summary = calculateChargeSummary(service);
    const chargeInfo = service?.chargeInfo || {};
    const tr = document.createElement("tr");
    tr.className = "resource-overview-subrow";

    const serviceCell = document.createElement("td");
    const label = document.createElement("div");
    label.className = "resource-overview-subrow-label";
    label.textContent = `${service.name} Recharge`;
    serviceCell.appendChild(label);
    tr.appendChild(serviceCell);

    const plannerCell = document.createElement("td");
    const wrap = document.createElement("div");
    wrap.className = "resource-overview-charge";

    const currentRow = document.createElement("div");
    currentRow.className = "resource-overview-subline";
    currentRow.append("Cur ");
    currentRow.appendChild(
      createOverviewNumberInput(
        `overview-${service.id}-charges`,
        summary.currentCharges,
        0,
        summary.maxCharges,
        () => {
          const rawValue = Number(document.getElementById(`overview-${service.id}-charges`).value);
          const chargeState = getChargeState(service);
          chargeState.currentCharges = serviceLogic.clamp(
            Number.isFinite(rawValue) ? rawValue : 0,
            0,
            summary.maxCharges
          );
          renderAll(true);
        }
      )
    );
    currentRow.append(`/${formatValue(summary.maxCharges)}`);
    wrap.appendChild(currentRow);

    if (chargeInfo.rechargeRequiresSkill) {
      const note = document.createElement("div");
      note.className = "resource-overview-subline resource-overview-note";
      note.textContent = "Uses rogue-wide recharge skill";
      wrap.appendChild(note);
    } else {
      const note = document.createElement("div");
      note.className = "resource-overview-subline";
      note.textContent = "Resource-only recharge";
      wrap.appendChild(note);
    }

    plannerCell.appendChild(wrap);
    tr.appendChild(plannerCell);

    const currentCell = document.createElement("td");
    const whatIfCell = document.createElement("td");
    if (chargeInfo.rechargeRequiresSkill) {
      const recharge = buildRogueRechargeBreakdown();
      currentCell.textContent = formatValue(recharge.currentTotal);
      whatIfCell.textContent = formatValue(recharge.whatIfTotal);
    } else {
      currentCell.textContent = "—";
      whatIfCell.textContent = "—";
    }
    tr.appendChild(currentCell);
    tr.appendChild(whatIfCell);

    const difficultyCell = document.createElement("td");
    difficultyCell.textContent = "—";
    tr.appendChild(difficultyCell);

    const costCell = document.createElement("td");
    costCell.textContent = `${formatValue(summary.rechargeCost)} ${chargeInfo.rechargeResourceLabel || service.resourceName}`;
    tr.appendChild(costCell);

    return tr;
  }

  function renderServiceOverview() {
    const services = getServicesForProfession(state.profession);
    overviewTable.innerHTML = "";
    overviewPanel.hidden = !services.length;

    if (!services.length) {
      overviewStatus.textContent = "No services are available for the selected profession.";
      return;
    }

    services.forEach((service) => {
      const serviceResults = calculateServiceResults(service);
      const { currentResult, whatIfResult, nextRow } = serviceResults;
      const tr = document.createElement("tr");

      const serviceCell = document.createElement("td");
      const serviceWrap = document.createElement("div");
      serviceWrap.className = "resource-overview-service";
      const name = document.createElement("div");
      name.className = "resource-overview-label";
      name.textContent = service.name;
      serviceWrap.appendChild(name);
      const pathToggle = createPathToggleButton(service, serviceResults.projectionRows);
      if (pathToggle) serviceWrap.appendChild(pathToggle);
      serviceCell.appendChild(serviceWrap);
      tr.appendChild(serviceCell);

      tr.appendChild(renderOverviewTrackCell(service, serviceResults));

      const currentCell = document.createElement("td");
      currentCell.textContent = formatValue(currentResult.total);
      tr.appendChild(currentCell);

      const whatIfCell = document.createElement("td");
      whatIfCell.textContent = formatValue(whatIfResult.total);
      tr.appendChild(whatIfCell);

      const difficultyCell = document.createElement("td");
      difficultyCell.textContent = nextRow ? formatValue(nextRow.difficulty) : "—";
      tr.appendChild(difficultyCell);

      const costCell = document.createElement("td");
      costCell.textContent = nextRow ? formatValue(nextRow.resourceCost) : "—";
      tr.appendChild(costCell);

      overviewTable.appendChild(tr);
      const rechargeRow = renderRechargePlannerRow(service);
      if (rechargeRow) overviewTable.appendChild(rechargeRow);
      const detailRow = renderOverviewDetailRow(service, serviceResults);
      if (detailRow) overviewTable.appendChild(detailRow);
    });

    if (state.profession === "Rogue") {
      overviewTable.appendChild(renderRogueRechargePlannerRow());
    }

    overviewStatus.textContent = services.length > 1
      ? "All service tracks are shown here. Edit ranks, tiers, base difficulty, or recharge state directly in this planner. Use Show path in any row to inspect every remaining step."
      : "This planner shows the full service track, next-step costs, and recharge state. Use Show path to inspect every remaining step.";
  }

  function renderFactorHeadline(currentResult, whatIfResult) {
    if (getActiveFactorViewId() === ROGUE_RECHARGE_VIEW_ID) {
      const recharge = buildRogueRechargeBreakdown();
      const delta = recharge.whatIfTotal - recharge.currentTotal;
      factorName.textContent = "Covert Arts Recharge";
      factorHeadline.textContent = `Recharge Base ${formatValue(recharge.currentTotal)} | What-If ${formatValue(recharge.whatIfTotal)} | Delta ${formatSignedValue(delta)}`;
      setHelperLines(factorStatus, [
        "Recharge cost remains 1,000 Guile per missing charge.",
        "This view shows the rogue-wide average art skill and art stat inputs used by the recharge formula.",
        "Shared what-if values come from the Covert Art factor views.",
      ]);
      return;
    }

    const service = getActiveService();
    if (!service) {
      factorName.textContent = "Select a service chip above.";
      factorHeadline.textContent = "Detailed factor math will appear here.";
      setHelperLines(factorStatus, [
        "What-if values affect this page only.",
        "They do not update the saved profile.",
      ]);
      return;
    }

    const delta = Number(whatIfResult.total) - Number(currentResult.total);
    const prerequisites = (service.prerequisites || []).join(", ");
    factorName.textContent = service.name;
    factorHeadline.textContent = `${service.scoreLabel}: ${formatValue(currentResult.total)} | What-If: ${formatValue(whatIfResult.total)} | Delta ${formatSignedValue(delta)}`;
    setHelperLines(factorStatus, [
      prerequisites ? `Prerequisites: ${prerequisites}.` : "",
      ...(service.contextNotes || []),
      describeChargeBehavior(service),
      service.formulaStatus === "partial_known_factors_only" ? "This is a partial known-positive model." : "",
      "What-if values affect this page only.",
      "They do not update the saved profile.",
    ]);
  }

  function createOverrideControl(service, rowDefinition, currentValue) {
    const factorKey = rowDefinition.factorKey;
    const factorDefinition = servicesData.factorDefinitions?.[factorKey];
    const rawOverrides = state.overridesByServiceId[service.id] || {};
    const rawValue = rawOverrides[factorKey];

    if (factorDefinition?.inputType === "boolean") {
      const select = document.createElement("select");
      select.id = `override-${service.id}-${factorKey}`;
      select.className = "resource-override-select";
      [
        { value: "", label: "Profile" },
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ].forEach((entry) => {
        const option = document.createElement("option");
        option.value = entry.value;
        option.textContent = entry.label;
        select.appendChild(option);
      });
      select.value = rawValue === true ? "true" : rawValue === false ? "false" : "";
      select.addEventListener("change", () => {
        if (!state.overridesByServiceId[service.id]) state.overridesByServiceId[service.id] = {};
        if (select.value === "") delete state.overridesByServiceId[service.id][factorKey];
        else state.overridesByServiceId[service.id][factorKey] = select.value;
        renderAll();
      });
      return select;
    }

    const input = document.createElement("input");
    input.type = "number";
    input.id = `override-${service.id}-${factorKey}`;
    input.className = "resource-override-input";
    input.step = "1";
    input.placeholder = String(currentValue ?? 0);
    input.value = rawValue == null ? "" : String(rawValue);
    input.addEventListener("input", () => {
      if (!state.overridesByServiceId[service.id]) state.overridesByServiceId[service.id] = {};
      if (input.value === "") delete state.overridesByServiceId[service.id][factorKey];
      else state.overridesByServiceId[service.id][factorKey] = input.value;
      renderAll(true);
    });
    return input;
  }

  function renderFactorTable(currentResult, whatIfResult) {
    if (getActiveFactorViewId() === ROGUE_RECHARGE_VIEW_ID) {
      const recharge = buildRogueRechargeBreakdown();
      factorTable.innerHTML = "";
      recharge.rows.forEach((row) => {
        const tr = document.createElement("tr");

        const labelCell = document.createElement("td");
        labelCell.textContent = row.label;
        tr.appendChild(labelCell);

        const currentValueCell = document.createElement("td");
        currentValueCell.textContent = formatValue(row.currentValue);
        tr.appendChild(currentValueCell);

        const overrideCell = document.createElement("td");
        overrideCell.textContent = "Art what-if";
        tr.appendChild(overrideCell);

        const currentContributionCell = document.createElement("td");
        currentContributionCell.textContent = formatValue(row.currentContribution);
        tr.appendChild(currentContributionCell);

        const whatIfContributionCell = document.createElement("td");
        whatIfContributionCell.textContent = formatValue(row.whatIfContribution);
        tr.appendChild(whatIfContributionCell);

        const ruleCell = document.createElement("td");
        ruleCell.textContent = row.rule;
        tr.appendChild(ruleCell);

        factorTable.appendChild(tr);
      });
      return;
    }

    const service = getActiveService();
    factorTable.innerHTML = "";

    if (!service) {
      factorStatus.textContent = "No factor data available.";
      return;
    }

    const currentContributionMap = new Map(currentResult.contributions.map((row) => [row.id, row]));
    const whatIfContributionMap = new Map(whatIfResult.contributions.map((row) => [row.id, row]));
    const normalizedOverrides = getNormalizedOverrides(service);

    expandContributionRows(service).forEach((rowDefinition) => {
      const currentContribution = currentContributionMap.get(rowDefinition.id);
      const whatIfContribution = whatIfContributionMap.get(rowDefinition.id);
      const currentValue = currentResult.factorValues[rowDefinition.factorKey];

      const tr = document.createElement("tr");
      if (Object.prototype.hasOwnProperty.call(normalizedOverrides, rowDefinition.factorKey)) {
        tr.classList.add("resource-factor-row-changed");
      }

      const labelCell = document.createElement("td");
      labelCell.textContent = rowDefinition.label;
      tr.appendChild(labelCell);

      const currentValueCell = document.createElement("td");
      currentValueCell.textContent = formatValue(currentValue);
      tr.appendChild(currentValueCell);

      const overrideCell = document.createElement("td");
      overrideCell.appendChild(createOverrideControl(service, rowDefinition, currentValue));
      tr.appendChild(overrideCell);

      const currentContributionCell = document.createElement("td");
      currentContributionCell.textContent = formatValue(currentContribution?.value ?? 0);
      tr.appendChild(currentContributionCell);

      const whatIfContributionCell = document.createElement("td");
      whatIfContributionCell.textContent = formatValue(whatIfContribution?.value ?? 0);
      tr.appendChild(whatIfContributionCell);

      const ruleCell = document.createElement("td");
      ruleCell.textContent = rowDefinition.rule;
      tr.appendChild(ruleCell);

      factorTable.appendChild(tr);
    });

  }

  function runResourcesSelfTests() {
    const tests = [
      {
        name: "T1 Ensorcell base 300 at T0 projects 350 next difficulty",
        run: () => {
          const service = serviceLogic.findServiceDefinition(servicesData, "ensorcell");
          return serviceLogic.calculateProjectionRows(service, { baseItemDifficulty: 300, currentStage: 0 }, 0, 0)[0];
        },
        check: (got) => got?.difficulty === 350,
      },
      {
        name: "T2 Sanctify base 300 at S0 projects 320 next difficulty",
        run: () => {
          const service = serviceLogic.findServiceDefinition(servicesData, "sanctify");
          return serviceLogic.calculateProjectionRows(service, { baseItemDifficulty: 300, currentStage: 0 }, 0, 0)[0];
        },
        check: (got) => got?.difficulty === 320,
      },
      {
        name: "T3 Mystic Tattoo T4 to T5 projects difficulty 500",
        run: () => {
          const service = serviceLogic.findServiceDefinition(servicesData, "mystic_tattoo_self");
          return serviceLogic.calculateProjectionRows(service, { currentStage: 4 }, 0, 0)[0];
        },
        check: (got) => got?.difficulty === 500,
      },
      {
        name: "T4 Rogue other-art ranks derive to 6 from the other four rows",
        run: () => {
          const services = servicesData.professionServices.Rogue;
          const activeService = serviceLogic.findServiceDefinition(servicesData, "covert_arts_swift_recovery");
          return serviceLogic.deriveProgressionState(activeService, { currentRank: 2 }, services, {
            covert_arts_sidestep: { currentRank: 1 },
            covert_arts_keen_eye: { currentRank: 2 },
            covert_arts_escape_artist: { currentRank: 0 },
            covert_arts_swift_recovery: { currentRank: 2 },
            covert_arts_poisoncraft: { currentRank: 3 },
          });
        },
        check: (got) => got?.existingCount === 6,
      },
      {
        name: "T5 WPS CER jump helper goes 21 -> 20 and 20 -> 30",
        run: () => ({
          back: serviceLogic.getWpsCerAnchorServices(21, -1),
          forward: serviceLogic.getWpsCerAnchorServices(20, 1),
        }),
        check: (got) => got?.back === 20 && got?.forward === 30,
      },
      {
        name: "T6 WPS service cap stays at 5000",
        run: () => {
          const service = serviceLogic.findServiceDefinition(servicesData, "wps_weapon");
          return service?.progression?.maxServices;
        },
        check: (got) => got === 5000,
      },
    ];

    let pass = 0;
    const lines = [];
    tests.forEach((test) => {
      const got = test.run();
      const ok = Boolean(test.check(got));
      if (ok) pass += 1;
      lines.push(`${ok ? "PASS" : "FAIL"} ${test.name}`);
      if (!ok) lines.push(` got: ${JSON.stringify(got)}`);
    });
    lines.push("");
    lines.push(`Summary: ${pass}/${tests.length} passing`);

    if (resourcesTestOutput) {
      resourcesTestOutput.textContent = lines.join("\n");
      resourcesTestOutput.style.color = pass === tests.length ? "#1f4e42" : "#b42318";
    }
  }

  function renderAll(preserveFocus) {
    const activeElementId = preserveFocus ? document.activeElement?.id : "";
    const activeSelectionStart = preserveFocus && document.activeElement?.selectionStart != null
      ? document.activeElement.selectionStart
      : null;

    refreshProfileSelect();
    refreshProfessionSelect();
    const service = ensureActiveService();
    const activeResults = service ? calculateServiceResults(service) : null;
    const currentResult = activeResults?.currentResult || { factorValues: {}, contributions: [], total: 0 };
    const whatIfResult = activeResults?.whatIfResult || { factorValues: {}, contributions: [], total: 0 };

    renderProfileSummary();
    renderFactorServiceTabs();
    renderServiceOverview();
    renderFactorHeadline(currentResult, whatIfResult);
    renderFactorTable(currentResult, whatIfResult);
    updateLoadButtonState();

    if (activeElementId) {
      const nextElement = document.getElementById(activeElementId);
      if (nextElement) {
        nextElement.focus();
        if (activeSelectionStart != null && typeof nextElement.setSelectionRange === "function") {
          nextElement.setSelectionRange(activeSelectionStart, activeSelectionStart);
        }
      }
    }
  }

  function initialize() {
    state.profiles = loadProfiles();
    const professions = listProfessions();
    state.profession = professions[0] || "";

    refreshProfileSelect();
    refreshProfessionSelect();

    const storedProfileId = localStorage.getItem(SELECTED_PROFILE_KEY) || "";
    const storedProfile = storedProfileId ? findProfile(storedProfileId) : null;
    setActiveProfile(storedProfile);
    renderAll();
  }

  profileSelect.addEventListener("change", () => {
    const profileId = profileSelect.value || "";
    if (profileId) localStorage.setItem(SELECTED_PROFILE_KEY, profileId);
    else localStorage.removeItem(SELECTED_PROFILE_KEY);
    setActiveProfile(findProfile(profileId));
    renderAll();
  });

  professionSelect.addEventListener("change", () => {
    state.profession = professionSelect.value;
    state.activeServiceId = "";
    state.activeFactorViewId = "";
    getServicesForProfession(state.profession).forEach((service) => {
      if (!state.progressionByServiceId[service.id]) {
        state.progressionByServiceId[service.id] = serviceLogic.getDefaultProgressionState(service);
      }
    });
    renderAll();
  });

  resetOverridesButton.addEventListener("click", () => {
    clearActiveServiceOverrides();
    renderAll();
  });

  resetAllButton.addEventListener("click", () => {
    resetProfessionPlannerState();
    renderAll();
  });

  runResourcesTestsBtn?.addEventListener("click", runResourcesSelfTests);

  window.addEventListener("storage", () => {
    state.profiles = loadProfiles();
    const selectedProfileId = localStorage.getItem(SELECTED_PROFILE_KEY) || "";
    setActiveProfile(findProfile(selectedProfileId));
    renderAll();
  });

  initialize();
})();
