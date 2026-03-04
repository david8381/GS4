(() => {
  const data = window.GS4_DATA;
  const config = window.STAT_OPTIMIZER_DATA;
  const logic = window.StatOptimizerLogic;
  const profileLogic = window.ProfileLogic;

  if (!data || !logic || !config) {
    console.error("Stat optimizer dependencies are missing.");
    return;
  }

  const PROFILE_KEY = "gs4.characterProfiles";

  const profileSelect = document.getElementById("profileSelect");
  const profileLoad = document.getElementById("profileLoad");

  const useCaseSelect = document.getElementById("useCase");
  const raceSelect = document.getElementById("race");
  const professionSelect = document.getElementById("profession");
  const targetLevelInput = document.getElementById("targetLevel");
  const tpBiasSlider = document.getElementById("tpBiasSlider");
  const tpBiasValue = document.getElementById("tpBiasValue");

  const solverModeSelect = document.getElementById("solverMode");
  const maxSecondsGroup = document.getElementById("maxSecondsGroup");
  const maxSecondsInput = document.getElementById("maxSeconds");
  const runSolverBtn = document.getElementById("runSolver");
  const resumeSolverBtn = document.getElementById("resumeSolver");
  const solverStatus = document.getElementById("solverStatus");
  const resumeStatus = document.getElementById("resumeStatus");
  const solverProgress = document.getElementById("solverProgress");

  const minPtpInput = document.getElementById("minPtp");
  const minMtpInput = document.getElementById("minMtp");
  const minStartPtpInput = document.getElementById("minStartPtp");
  const minStartMtpInput = document.getElementById("minStartMtp");
  const finalAllMinStatInput = document.getElementById("finalAllMinStat");
  const applyFinalAllMinStatBtn = document.getElementById("applyFinalAllMinStat");
  const clearMinFinalStatsBtn = document.getElementById("clearMinFinalStats");
  const copySuggestedRangeBtn = document.getElementById("copySuggestedRange");
  const startConstraintLabels = document.getElementById("startConstraintLabels");
  const finalConstraintLabels = document.getElementById("finalConstraintLabels");
  const startConstraintMinBody = document.getElementById("startConstraintMinBody");
  const startConstraintSuggested = document.getElementById("startConstraintSuggested");
  const startConstraintFinalFromMax = document.getElementById("startConstraintFinalFromMax");
  const startConstraintMaxBody = document.getElementById("startConstraintMaxBody");
  const startConstraintWarning = document.getElementById("startConstraintWarning");
  const minFinalStatsBody = document.getElementById("minFinalStatsBody");
  const resultSummary = document.getElementById("resultSummary");
  const resultCurrentLevelDelta = document.getElementById("resultCurrentLevelDelta");
  const resultStatsHead = document.getElementById("resultStatsHead");
  const resultStatsBody = document.getElementById("resultStatsBody");
  const resultTotals = document.getElementById("resultTotals");
  const manualRunLabelInput = document.getElementById("manualRunLabel");
  const manualStartStatsBody = document.getElementById("manualStartStatsBody");
  const manualStartClearBtn = document.getElementById("manualStartClear");
  const addManualRunBtn = document.getElementById("addManualRun");
  const manualAllocationStatus = document.getElementById("manualAllocationStatus");
  const manualRunStatus = document.getElementById("manualRunStatus");
  const manualConstraintWarning = document.getElementById("manualConstraintWarning");
  const manualRunPreview = document.getElementById("manualRunPreview");
  const runHistory = [];
  let resumeContext = null;

  const useCases = [
    { key: "stats", name: "Maximize stats with constraints" },
  ];

  function loadProfiles() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PROFILE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function fillSelect(select, items, key = "key", label = "name") {
    if (!select) return;
    select.innerHTML = "";
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item[key];
      option.textContent = item[label];
      select.appendChild(option);
    });
  }

  function initializeStaticInputs() {
    fillSelect(useCaseSelect, useCases);
    fillSelect(raceSelect, data.races || []);
    fillSelect(professionSelect, (data.professions || []).map((name) => ({ key: name, name })));

    const defaults = config.solverDefaults;
    solverModeSelect.value = defaults.mode;
    maxSecondsInput.value = String(defaults.maxSeconds);
    targetLevelInput.value = "100";
    if (tpBiasSlider) tpBiasSlider.value = "50";
    updateTpBiasLabel();

    renderMinimumFinalStatsInputs();
    renderStartConstraintInputs();
    updateSolverModeUI();
  }

  function updateTpBiasLabel() {
    if (!tpBiasSlider || !tpBiasValue) return;
    const mtpWeight = logic.clamp(logic.toInt(tpBiasSlider.value, 50), 0, 100);
    const ptpWeight = 100 - mtpWeight;
    tpBiasValue.textContent = `${ptpWeight}/${mtpWeight}`;
  }

  function renderMinimumFinalStatsInputs() {
    if (!minFinalStatsBody) return;
    if (finalConstraintLabels) finalConstraintLabels.innerHTML = "";
    const existing = {};
    minFinalStatsBody.querySelectorAll("input[data-min-final]").forEach((input) => {
      existing[input.dataset.minFinal] = String(input.value || "");
    });

    minFinalStatsBody.innerHTML = "";
    (data.stats || []).forEach((stat) => {
      if (finalConstraintLabels) {
        const labelCell = document.createElement("div");
        labelCell.className = "stat-constraint-cell stat-constraint-label-cell";
        labelCell.textContent = stat.abbr;
        finalConstraintLabels.appendChild(labelCell);
      }
      const cell = document.createElement("label");
      cell.className = "optimizer-min-stat";
      cell.innerHTML = `
        <input id="min-final-${stat.key}" type="number" min="0" max="100" step="1" value="${existing[stat.key] || ""}" data-min-final="${stat.key}" />
      `;
      minFinalStatsBody.appendChild(cell);
    });
  }

  function computeSuggestedStartForTarget(statKey, targetFinal, startFloor = 20) {
    const raceName = (data.races || []).find((entry) => entry.key === raceSelect?.value)?.name || "Human";
    const profession = professionSelect?.value || "";
    const targetLevel = logic.clamp(logic.toInt(targetLevelInput?.value, 0), 0, 100);
    const desiredFinal = logic.clamp(logic.toInt(targetFinal, 100), 0, 100);
    if (!profession) return 100;

    const floor = logic.clamp(logic.toInt(startFloor, 20), 0, 100);
    for (let level0 = floor; level0 <= 100; level0 += 1) {
      const computed = profileLogic.computeStatsFromLevel0({
        stats: data.stats,
        level0Stats: { [statKey]: level0 },
        level: targetLevel,
        raceName,
        profession,
        baseGrowthRates: data.baseGrowthRates,
        raceGrowthModifiers: data.raceGrowthModifiers,
      });
      const finalValue = logic.toInt(computed?.[statKey]?.base, level0);
      if (finalValue >= desiredFinal) return level0;
    }
    return 100;
  }

  function getMinFinalTargetByKey(statKey) {
    const input = minFinalStatsBody?.querySelector(`input[data-min-final="${statKey}"]`);
    const raw = String(input?.value || "").trim();
    return raw ? logic.clamp(logic.toInt(raw, 100), 0, 100) : 100;
  }

  function computeSuggestedRanges() {
    const primeSet = new Set(logic.getPrimeStatKeys(data, professionSelect?.value));
    const ranges = {};
    (data.stats || []).forEach((stat) => {
      const minFloor = primeSet.has(stat.key) ? 30 : 20;
      const minTarget = getMinFinalTargetByKey(stat.key);
      const minSuggestedRaw = computeSuggestedStartForTarget(stat.key, minTarget, minFloor);
      const minSuggested = Math.max(minFloor, minSuggestedRaw);
      const maxSuggestedRaw = computeSuggestedStartForTarget(stat.key, 100, minFloor);
      const maxSuggested = Math.max(minSuggested, maxSuggestedRaw);
      ranges[stat.key] = {
        minSuggested,
        maxSuggested,
      };
    });
    return ranges;
  }

  function renderStartConstraintInputs() {
    if (!startConstraintLabels || !startConstraintMinBody || !startConstraintSuggested || !startConstraintMaxBody) return;
    const existingMin = {};
    const existingMax = {};
    startConstraintMinBody.querySelectorAll("input[data-start-min]").forEach((input) => {
      existingMin[input.dataset.startMin] = String(input.value || "");
    });
    startConstraintMaxBody.querySelectorAll("input[data-start-max]").forEach((input) => {
      existingMax[input.dataset.startMax] = String(input.value || "");
    });

    startConstraintLabels.innerHTML = "";
    startConstraintMinBody.innerHTML = "";
    startConstraintSuggested.innerHTML = "";
    if (startConstraintFinalFromMax) startConstraintFinalFromMax.innerHTML = "";
    startConstraintMaxBody.innerHTML = "";

    const suggestedRanges = computeSuggestedRanges();
    (data.stats || []).forEach((stat) => {
      const minSuggested = suggestedRanges[stat.key]?.minSuggested ?? getLevel0FloorByKey(stat.key);
      const suggestedMax = suggestedRanges[stat.key]?.maxSuggested ?? 100;

      const labelCell = document.createElement("div");
      labelCell.className = "stat-constraint-cell stat-constraint-label-cell";
      labelCell.textContent = stat.abbr;
      startConstraintLabels.appendChild(labelCell);

      const minCell = document.createElement("label");
      minCell.className = "optimizer-min-stat";
      minCell.innerHTML = `
        <input id="start-min-${stat.key}" type="number" min="0" max="100" step="1" value="${existingMin[stat.key] || ""}" data-start-min="${stat.key}" />
      `;
      startConstraintMinBody.appendChild(minCell);

      const suggestedCell = document.createElement("div");
      suggestedCell.className = "stat-constraint-cell";
      suggestedCell.textContent = `${minSuggested}-${suggestedMax}`;
      startConstraintSuggested.appendChild(suggestedCell);

      const maxCell = document.createElement("label");
      maxCell.className = "optimizer-min-stat";
      maxCell.innerHTML = `
        <input id="start-max-${stat.key}" type="number" min="0" max="100" step="1" value="${existingMax[stat.key] || ""}" data-start-max="${stat.key}" />
      `;
      startConstraintMaxBody.appendChild(maxCell);
    });
    updateFinalFromCurrentMaxRow();
  }

  function finalStatFromLevel0(statKey, level0Value) {
    const raceName = (data.races || []).find((entry) => entry.key === raceSelect?.value)?.name || "Human";
    const profession = professionSelect?.value || "";
    const targetLevel = logic.clamp(logic.toInt(targetLevelInput?.value, 0), 0, 100);
    if (!profession) return level0Value;
    const computed = profileLogic.computeStatsFromLevel0({
      stats: data.stats,
      level0Stats: { [statKey]: level0Value },
      level: targetLevel,
      raceName,
      profession,
      baseGrowthRates: data.baseGrowthRates,
      raceGrowthModifiers: data.raceGrowthModifiers,
    });
    return logic.toInt(computed?.[statKey]?.base, level0Value);
  }

  function updateFinalFromCurrentMaxRow() {
    if (!startConstraintFinalFromMax) return;
    startConstraintFinalFromMax.innerHTML = "";
    const suggested = computeSuggestedRanges();
    (data.stats || []).forEach((stat) => {
      const key = stat.key;
      const maxInput = startConstraintMaxBody?.querySelector(`input[data-start-max="${key}"]`);
      const maxRaw = String(maxInput?.value || "").trim();
      const level0Max = maxRaw ? logic.clamp(logic.toInt(maxRaw, 100), 0, 100) : (suggested[key]?.maxSuggested ?? 100);
      const finalValue = finalStatFromLevel0(key, level0Max);
      const cell = document.createElement("div");
      cell.className = "stat-constraint-cell";
      cell.textContent = String(finalValue);
      startConstraintFinalFromMax.appendChild(cell);
    });
  }

  function copySuggestedRangeToBounds() {
    const ranges = computeSuggestedRanges();
    startConstraintMinBody?.querySelectorAll("input[data-start-min]").forEach((input) => {
      const key = input.dataset.startMin;
      const value = ranges[key]?.minSuggested ?? getLevel0FloorByKey(key);
      input.value = String(value);
    });
    startConstraintMaxBody?.querySelectorAll("input[data-start-max]").forEach((input) => {
      const key = input.dataset.startMax;
      const value = ranges[key]?.maxSuggested ?? 100;
      input.value = String(value);
    });
    updateFinalFromCurrentMaxRow();
    updateStartConstraintWarning();
    updateResumeAvailability();
  }

  function renderManualStartInputs() {
    manualStartStatsBody.innerHTML = "";
    const targetLevel = logic.clamp(logic.toInt(targetLevelInput?.value, 0), 0, 100);
    (data.stats || []).forEach((stat) => {
      const cell = document.createElement("label");
      cell.className = "optimizer-min-stat";
      cell.innerHTML = `
        <span>${stat.abbr}</span>
        <input id="manual-start-${stat.key}" type="number" min="1" max="100" step="1" value="" data-manual-start="${stat.key}" />
        <span class="manual-target-stat" data-manual-target="${stat.key}">L${targetLevel}: --</span>
      `;
      manualStartStatsBody.appendChild(cell);
    });
  }

  function readManualStartStats() {
    const payload = {};
    manualStartStatsBody.querySelectorAll("input[data-manual-start]").forEach((input) => {
      const raw = String(input.value || "").trim();
      payload[input.dataset.manualStart] = raw ? logic.toInt(raw, 0) : 0;
    });
    return payload;
  }

  function getManualLevel0Budget() {
    const constraints = constraintsFromInputs();
    const primeCount = logic.getPrimeStatKeys(data, professionSelect?.value).length;
    return constraints.totalPoints + (primeCount * 10);
  }

  function manualInputsHaveAnyBlank() {
    return Array.from(manualStartStatsBody.querySelectorAll("input[data-manual-start]"))
      .some((input) => String(input.value || "").trim() === "");
  }

  function validateManualLevel0Inputs(level0Stats) {
    const primeKeys = new Set(logic.getPrimeStatKeys(data, professionSelect?.value));
    const invalidKeys = [];
    let hasBlank = false;

    manualStartStatsBody.querySelectorAll("input[data-manual-start]").forEach((input) => {
      const key = input.dataset.manualStart;
      const raw = String(input.value || "").trim();
      if (!raw) {
        hasBlank = true;
        input.classList.remove("manual-input-invalid", "manual-input-valid");
        return;
      }

      const value = logic.toInt(raw, 0);
      const min = primeKeys.has(key) ? 30 : 20;
      const isValid = value >= min && value <= 100;
      input.classList.toggle("manual-input-invalid", !isValid);
      input.classList.toggle("manual-input-valid", isValid);
      if (!isValid) invalidKeys.push(key);
    });

    return {
      hasBlank,
      invalidKeys,
      hasInvalid: invalidKeys.length > 0,
      level0Stats,
    };
  }

  function clearManualStartStats() {
    if (manualRunLabelInput) manualRunLabelInput.value = "";
    manualStartStatsBody.querySelectorAll("input[data-manual-start]").forEach((input) => {
      input.value = "";
    });
    updateManualValidation();
    if (manualRunStatus) {
      manualRunStatus.textContent = "Enter starting stats (must satisfy creation rules) and add to comparison.";
      manualRunStatus.style.color = "";
    }
  }

  function toBaseStartFromPrimeIncluded(level0Stats) {
    const prime = new Set(logic.getPrimeStatKeys(data, professionSelect?.value));
    const base = {};
    (data.stats || []).forEach((stat) => {
      const key = stat.key;
      const value = Math.max(1, logic.toInt(level0Stats?.[key], 20));
      base[key] = prime.has(key) ? Math.max(1, value - 10) : value;
    });
    return base;
  }

  function renderManualFinalStatsPreview(level0Stats) {
    const raceName = (data.races || []).find((entry) => entry.key === raceSelect?.value)?.name || "Human";
    const profession = professionSelect?.value || "";
    const targetLevel = logic.clamp(logic.toInt(targetLevelInput?.value, 0), 0, 100);
    const targetNodes = manualStartStatsBody.querySelectorAll("[data-manual-target]");

    if (!profession || !targetNodes.length) return;

    let hasBlanks = false;
    const computed = profileLogic.computeStatsFromLevel0({
      stats: data.stats,
      level0Stats,
      level: targetLevel,
      raceName,
      profession,
      baseGrowthRates: data.baseGrowthRates,
      raceGrowthModifiers: data.raceGrowthModifiers,
    });

    targetNodes.forEach((node) => {
      const key = node.dataset.manualTarget;
      const sourceInput = manualStartStatsBody.querySelector(`input[data-manual-start="${key}"]`);
      const raw = String(sourceInput?.value || "").trim();
      if (!raw) {
        hasBlanks = true;
        node.textContent = `L${targetLevel}: --`;
        return;
      }
      const value = logic.toInt(computed?.[key]?.base, logic.toInt(level0Stats?.[key], 0));
      node.textContent = `L${targetLevel}: ${value}`;
    });

    if (manualRunPreview) {
      if (hasBlanks) {
        manualRunPreview.textContent = `Projected TP at level ${targetLevel}: -- (enter all start stats)`;
        return;
      }
      const experience = logic.deriveExperienceTarget(data, targetLevel, -1);
      const totalTp = logic.estimateTotalTrainingPointsFromExperience({
        data,
        profileLogic,
        experience,
        raceName,
        profession,
        level0Stats,
      });
      manualRunPreview.textContent = `Projected TP at level ${targetLevel}: PTP ${totalTp.ptp} / MTP ${totalTp.mtp}`;
    }
  }

  function updateManualValidation() {
    const enteredLevel0Stats = readManualStartStats();
    renderManualFinalStatsPreview(enteredLevel0Stats);
    const inputValidation = validateManualLevel0Inputs(enteredLevel0Stats);
    const startStats = toBaseStartFromPrimeIncluded(enteredLevel0Stats);
    const constraints = constraintsFromInputs();
    const validation = logic.validateStartStats(startStats, constraints);
    const remaining = getManualLevel0Budget() - logic.sumStats(enteredLevel0Stats);

    if (manualAllocationStatus) {
      manualAllocationStatus.textContent = `Level-0 points remaining: ${remaining}`;
      manualAllocationStatus.style.color = remaining === 0 ? "#1f7a4d" : "#b42318";
    }

    if (!manualRunStatus) return;
    if (manualConstraintWarning) {
      manualConstraintWarning.textContent = "";
      manualConstraintWarning.style.color = "";
    }
    if (inputValidation.hasBlank) {
      manualRunStatus.textContent = "Enter all 10 level-0 stats to validate this manual run.";
      manualRunStatus.style.color = "#b42318";
      return;
    }
    if (inputValidation.hasInvalid) {
      manualRunStatus.textContent = "Fix highlighted stats (prime stats min 30, others min 20, max 100).";
      manualRunStatus.style.color = "#b42318";
      return;
    }
    if (validation.ok) {
      manualRunStatus.textContent = "Manual starting stats are valid.";
      manualRunStatus.style.color = "#1f7a4d";
      return;
    }

    manualRunStatus.textContent = validation.errors.join(" ");
    manualRunStatus.style.color = "#b42318";
    if (manualConstraintWarning) {
      manualConstraintWarning.textContent = `GS creation-limit warning: ${validation.errors.join(" ")}`;
      manualConstraintWarning.style.color = "#b42318";
    }
  }

  function clearMinimumFinalStats() {
    minFinalStatsBody?.querySelectorAll("input[data-min-final]").forEach((input) => {
      input.value = "";
    });
    if (minStartPtpInput) minStartPtpInput.value = "0";
    if (minStartMtpInput) minStartMtpInput.value = "0";
    startConstraintMinBody?.querySelectorAll("input[data-start-min]").forEach((input) => {
      input.value = "";
    });
    startConstraintMaxBody?.querySelectorAll("input[data-start-max]").forEach((input) => {
      input.value = "";
    });
    renderStartConstraintInputs();
    updateFinalFromCurrentMaxRow();
    updateStartConstraintWarning();
    updateResumeAvailability();
  }

  function readMinimumFinalStats() {
    const payload = {};
    minFinalStatsBody?.querySelectorAll("input[data-min-final]").forEach((input) => {
      const key = input.dataset.minFinal;
      const raw = String(input.value || "").trim();
      payload[key] = raw ? Math.max(0, logic.toInt(raw, 0)) : 0;
    });
    return payload;
  }

  function applyFinalAllMinStat() {
    const control = document.getElementById("finalAllMinStat");
    const raw = String(control?.value || "").trim();
    if (!raw) return;
    const floor = logic.clamp(logic.toInt(raw, 0), 0, 100);
    const inputs = document.querySelectorAll("#minFinalStatsBody input[data-min-final]");
    inputs.forEach((input) => {
      input.value = String(floor);
    });
    if (inputs[0]) {
      inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
    }
    renderStartConstraintInputs();
    updateStartConstraintWarning();
    updateResumeAvailability();
  }

  function readStartStatBounds() {
    const minStartStats = {};
    const maxStartStats = {};

    startConstraintMinBody?.querySelectorAll("input[data-start-min]").forEach((input) => {
      const key = input.dataset.startMin;
      const raw = String(input.value || "").trim();
      minStartStats[key] = raw ? Math.max(0, logic.toInt(raw, 0)) : 0;
    });

    startConstraintMaxBody?.querySelectorAll("input[data-start-max]").forEach((input) => {
      const key = input.dataset.startMax;
      const raw = String(input.value || "").trim();
      maxStartStats[key] = raw ? Math.max(0, logic.toInt(raw, 0)) : 0;
    });

    return { minStartStats, maxStartStats };
  }

  function enforceStartConstraintPair(changedKind, statKey) {
    const minInput = startConstraintMinBody?.querySelector(`input[data-start-min="${statKey}"]`);
    const maxInput = startConstraintMaxBody?.querySelector(`input[data-start-max="${statKey}"]`);
    if (!minInput || !maxInput) return;

    const minRaw = String(minInput.value || "").trim();
    const maxRaw = String(maxInput.value || "").trim();
    if (!minRaw || !maxRaw) return;

    const minValue = logic.toInt(minRaw, 0);
    const maxValue = logic.toInt(maxRaw, 0);
    if (minValue <= maxValue) return;

    if (changedKind === "min") {
      maxInput.value = String(minValue);
    } else {
      minInput.value = String(maxValue);
    }
  }

  function getLevel0FloorByKey(statKey) {
    const primeSet = new Set(logic.getPrimeStatKeys(data, professionSelect?.value));
    return primeSet.has(statKey) ? 30 : 20;
  }

  function updateStartConstraintWarning() {
    if (!startConstraintWarning) return;
    const constraints = constraintsFromInputs();
    const primeSet = new Set(logic.getPrimeStatKeys(data, professionSelect?.value));
    const issues = [];
    let minBaseSum = 0;
    let maxBaseSum = 0;
    let forcedAbove70 = 0;
    let forcedAbove90 = 0;

    (data.stats || []).forEach((stat) => {
      const key = stat.key;
      const minInput = startConstraintMinBody?.querySelector(`input[data-start-min="${key}"]`);
      const maxInput = startConstraintMaxBody?.querySelector(`input[data-start-max="${key}"]`);
      const minRaw = String(minInput?.value || "").trim();
      const maxRaw = String(maxInput?.value || "").trim();
      const floorL0 = getLevel0FloorByKey(key);
      const shift = primeSet.has(key) ? 10 : 0;
      const minL0 = minRaw ? logic.toInt(minRaw, floorL0) : floorL0;
      const maxL0 = maxRaw ? logic.toInt(maxRaw, 100) : 100;
      if (primeSet.has(key) && maxRaw && maxL0 < floorL0) {
        issues.push(`${stat.abbr} max ${maxL0} is below prime minimum ${floorL0}`);
      }
      const minBase = Math.max(20, minL0 - shift);
      const maxBase = Math.min(100, maxL0 - shift);
      if (minBase > maxBase) {
        issues.push(`${stat.abbr} min/max is impossible`);
      }
      minBaseSum += minBase;
      maxBaseSum += maxBase;
      if (minBase > 70) forcedAbove70 += 1;
      if (minBase > 90) forcedAbove90 += 1;
    });

    if (minBaseSum > constraints.totalPoints) {
      issues.push(`minimum total ${minBaseSum} exceeds ${constraints.totalPoints}`);
    }
    if (maxBaseSum < constraints.totalPoints) {
      issues.push(`maximum total ${maxBaseSum} is below ${constraints.totalPoints}`);
    }
    if (forcedAbove70 > constraints.maxStatsAbove70) {
      issues.push(`forces ${forcedAbove70} stats above 70 (limit ${constraints.maxStatsAbove70})`);
    }
    if (forcedAbove90 > constraints.maxStatsAbove90) {
      issues.push(`forces ${forcedAbove90} stats above 90 (limit ${constraints.maxStatsAbove90})`);
    }

    if (issues.length) {
      startConstraintWarning.textContent = `GS creation-limit warning: ${issues.join("; ")}.`;
      startConstraintWarning.style.color = "#b42318";
    } else {
      startConstraintWarning.textContent = "";
      startConstraintWarning.style.color = "";
    }
  }

  function updateSolverModeUI() {
    maxSecondsGroup.hidden = false;
  }

  function initializeProfileSelect() {
    const profiles = loadProfiles();
    profileSelect.innerHTML = '<option value="">Select from Profile</option>';
    profiles.forEach((profile) => {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.name;
      profileSelect.appendChild(option);
    });

    const selected = localStorage.getItem("gs4.selectedProfileId") || "";
    if (selected) profileSelect.value = selected;
  }

  function applySelectedProfileFromPicker() {
    const selected = profileSelect?.value || "";
    if (!selected) return;
    const profiles = loadProfiles();
    const profile = profiles.find((entry) => entry.id === selected);
    if (!profile) return;

    applyProfile(profile);
    renderStartConstraintInputs();
    updateFinalFromCurrentMaxRow();
    updateStartConstraintWarning();
    updateManualValidation();
    updateResumeAvailability();
  }

  function applyProfile(profile) {
    if (!profile) return;
    const race = (data.races || []).find((entry) => String(entry.name).toLowerCase() === String(profile.race || "").toLowerCase());
    if (race) raceSelect.value = race.key;
    if (profile.profession && (data.professions || []).includes(profile.profession)) {
      professionSelect.value = profile.profession;
    }
  }

  function getSelectedProfile() {
    const selected = profileSelect?.value || "";
    if (!selected) return null;
    const profiles = loadProfiles();
    return profiles.find((entry) => entry.id === selected) || null;
  }

  function updateCurrentLevelTpDelta() {
    if (!resultCurrentLevelDelta) return;
    const selectedProfile = getSelectedProfile();
    const latest = runHistory.length > 0 ? runHistory[runHistory.length - 1] : null;

    if (!selectedProfile || !latest?.build?.level0Stats) {
      resultCurrentLevelDelta.textContent = "";
      return;
    }

    if (!selectedProfile.level0Stats || typeof selectedProfile.level0Stats !== "object") {
      resultCurrentLevelDelta.textContent = "Current-level TP change unavailable: selected profile has no level-0 stats.";
      return;
    }

    const raceName = String(selectedProfile.race || "Human");
    const profession = String(selectedProfile.profession || "");
    if (!profession) {
      resultCurrentLevelDelta.textContent = "Current-level TP change unavailable: selected profile has no profession.";
      return;
    }

    const experience = Math.max(
      0,
      logic.toInt(
        selectedProfile.experience,
        logic.deriveExperienceTarget(data, logic.toInt(selectedProfile.level, 0), -1)
      )
    );

    const baseline = logic.estimateTotalTrainingPointsFromExperience({
      data,
      profileLogic,
      experience,
      raceName,
      profession,
      level0Stats: selectedProfile.level0Stats,
    });

    const candidate = logic.estimateTotalTrainingPointsFromExperience({
      data,
      profileLogic,
      experience,
      raceName,
      profession,
      level0Stats: latest.build.level0Stats,
    });

    const levelAtExp = logic.levelFromExperience(data?.levelThresholds || [], experience);
    const dPtp = logic.toInt(candidate?.ptp, 0) - logic.toInt(baseline?.ptp, 0);
    const dMtp = logic.toInt(candidate?.mtp, 0) - logic.toInt(baseline?.mtp, 0);
    const formatSigned = (value) => (value >= 0 ? `+${value}` : `${value}`);

    resultCurrentLevelDelta.textContent = `Current-level change (L${levelAtExp}): ${formatSigned(dPtp)} PTP / ${formatSigned(dMtp)} MTP if applied now.`;
  }

  function constraintsFromInputs() {
    return {
      minStat: config.defaultCreationConstraints.minStat,
      maxStat: 100,
      totalPoints: config.defaultCreationConstraints.totalPoints,
      maxStatsAbove70: config.defaultCreationConstraints.maxStatsAbove70,
      maxStatsAbove90: config.defaultCreationConstraints.maxStatsAbove90,
    };
  }

  function minimumsFromInputs() {
    const { minStartStats, maxStartStats } = readStartStatBounds();
    return {
      minPtp: Math.max(0, logic.toInt(minPtpInput.value, 0)),
      minMtp: Math.max(0, logic.toInt(minMtpInput.value, 0)),
      minStartPtp: Math.max(0, logic.toInt(minStartPtpInput?.value, 0)),
      minStartMtp: Math.max(0, logic.toInt(minStartMtpInput?.value, 0)),
      minFinalStats: readMinimumFinalStats(),
      minStartStats,
      maxStartStats,
    };
  }

  function renderResultTable() {
    resultStatsHead.innerHTML = "";
    resultStatsBody.innerHTML = "";
    if (runHistory.length === 0) return;

    const groupRow = document.createElement("tr");
    const statHead = document.createElement("th");
    statHead.textContent = "Stat";
    statHead.rowSpan = 2;
    groupRow.appendChild(statHead);

    runHistory.forEach((entry, index) => {
      const th = document.createElement("th");
      th.innerHTML = `
        <div class="optimizer-run-head">
          <span>${entry.label}</span>
          <div class="optimizer-run-actions">
            <button type="button" class="btn ghost btn tiny optimizer-copy-run" data-run-index="${index}">Adjust</button>
            <button type="button" class="btn ghost btn tiny optimizer-delete-run" data-run-index="${index}">Delete</button>
          </div>
        </div>
      `;
      th.colSpan = 2;
      th.className = `optimizer-run-band optimizer-run-band-${index % 4}`;
      groupRow.appendChild(th);
    });
    resultStatsHead.appendChild(groupRow);

    const subRow = document.createElement("tr");
    runHistory.forEach((_, index) => {
      const startTh = document.createElement("th");
      startTh.textContent = "Start";
      startTh.className = `optimizer-run-band optimizer-run-band-${index % 4}`;
      subRow.appendChild(startTh);
      const targetTh = document.createElement("th");
      targetTh.textContent = "Target";
      targetTh.className = `optimizer-run-band optimizer-run-band-${index % 4}`;
      subRow.appendChild(targetTh);
    });
    resultStatsHead.appendChild(subRow);

    const stats = data.stats || [];
    stats.forEach((stat) => {
      const key = stat.key;
      const row = document.createElement("tr");
      const statCell = document.createElement("td");
      statCell.textContent = stat.abbr;
      row.appendChild(statCell);

      runHistory.forEach((entry, index) => {
        const build = entry.build;
        const startCell = document.createElement("td");
        startCell.textContent = String(build.level0Stats[key]);
        startCell.className = `optimizer-run-band optimizer-run-band-${index % 4}`;
        row.appendChild(startCell);
        const targetCell = document.createElement("td");
        targetCell.textContent = String(build.metrics.finalStats[key]);
        targetCell.className = `optimizer-run-band optimizer-run-band-${index % 4}`;
        row.appendChild(targetCell);
      });
      resultStatsBody.appendChild(row);
    });

    const totalsRow = document.createElement("tr");
    totalsRow.className = "optimizer-totals-row";
    const totalsLabel = document.createElement("td");
    totalsLabel.textContent = "Totals";
    totalsRow.appendChild(totalsLabel);
    runHistory.forEach((entry, index) => {
      const totalCell = document.createElement("td");
      totalCell.colSpan = 2;
      totalCell.className = `optimizer-run-band optimizer-run-band-${index % 4} optimizer-totals-cell`;
      totalCell.innerHTML = `
        <div>PTP ${entry.build.metrics.ptp} / MTP ${entry.build.metrics.mtp}</div>
        <div class="optimizer-totals-sub">Total Stats ${entry.build.metrics.overall}</div>
      `;
      totalsRow.appendChild(totalCell);
    });
    resultStatsBody.appendChild(totalsRow);
  }

  function renderResult(result) {
    if (!result?.build) {
      resultSummary.textContent = result?.message || "No result for this run.";
      if (resultCurrentLevelDelta) resultCurrentLevelDelta.textContent = "";
      return;
    }

    const nextDefaultLabel = `Run ${runHistory.length + 1}`;
    const label = result._label || nextDefaultLabel;
    runHistory.push({
      label,
      build: result.build,
      status: result.provenOptimal ? "optimal" : result.status,
    });
    renderResultTable();

    const build = result.build;
    const statusText = result.provenOptimal
      ? "Optimal (proven)."
      : (result.status === "best_found" ? "Best found (not guaranteed optimal)." : "Best found so far (not proven optimal).");
    resultSummary.textContent = `${statusText} Latest run: Run ${runHistory.length}. Prime stats: ${(build.metrics.primeKeys || []).map((k) => k.toUpperCase()).join(", ") || "None"}.`;

    resultTotals.textContent = `Run ${runHistory.length} added. Start values are level-0 stats (prime bonuses already included).`;
    updateCurrentLevelTpDelta();
  }

  function setStatus(text, tone = "") {
    solverStatus.textContent = text;
    solverStatus.style.color = tone === "error" ? "#b42318" : tone === "ok" ? "#1f7a4d" : "";
  }

  function createSolverSignature(params) {
    return JSON.stringify({
      mode: params.mode,
      raceName: params.raceName,
      profession: params.profession,
      targetLevel: params.targetLevel,
      targetExperience: params.targetExperience,
      objectiveId: params.objectivePreset?.id || "stats_weighted_tp",
      ptpWeight: params.objectivePreset?.ptpWeight ?? null,
      mtpWeight: params.objectivePreset?.mtpWeight ?? null,
      constraints: params.constraints,
      minimums: params.minimums,
      useCase: useCaseSelect?.value || "",
    });
  }

  function canResumeWithCurrentInputs() {
    if (!resumeContext?.canResume) return false;
    const params = buildSolveParams();
    return createSolverSignature(params) === resumeContext.signature;
  }

  function updateResumeAvailability() {
    const available = canResumeWithCurrentInputs();
    if (resumeSolverBtn) resumeSolverBtn.disabled = !available;
    if (resumeStatus) {
      if (available) {
        resumeStatus.textContent = `Resume ready for ${resumeContext.mode.toUpperCase()} with unchanged inputs.`;
        resumeStatus.style.color = "#1f7a4d";
      } else if (resumeContext?.canResume) {
        resumeStatus.textContent = "Resume unavailable: solver inputs changed (including minimums/objective/mode).";
        resumeStatus.style.color = "#8a5a00";
      } else {
        resumeStatus.textContent = "Resume is available only when solver inputs are unchanged.";
        resumeStatus.style.color = "";
      }
    }
  }

  function buildSolveParams() {
    const mode = solverModeSelect.value === "exact" ? "exact" : "fast";
    const mtpWeightPct = logic.clamp(logic.toInt(tpBiasSlider?.value, 50), 0, 100);
    const ptpWeight = (100 - mtpWeightPct) / 100;
    const mtpWeight = mtpWeightPct / 100;
    const objectivePreset = {
      id: "stats_weighted_tp",
      priorities: ["overall", "tp_blend", "ptp", "mtp"],
      ptpWeight,
      mtpWeight,
    };

    return {
      mode,
      data,
      profileLogic,
      constraints: constraintsFromInputs(),
      raceName: (data.races || []).find((entry) => entry.key === raceSelect.value)?.name || "Human",
      profession: professionSelect.value,
      targetLevel: logic.toInt(targetLevelInput.value, 0),
      targetExperience: -1,
      minimums: minimumsFromInputs(),
      objectivePreset,
      maxSeconds: logic.toInt(maxSecondsInput.value, config.solverDefaults.maxSeconds),
      fastRestarts: config.solverDefaults.fastRestarts,
      fastIterations: config.solverDefaults.fastIterations,
      onProgress: (progress) => {
        const elapsed = (progress.elapsedMs / 1000).toFixed(2);
        const eta = progress.etaSeconds == null || !Number.isFinite(progress.etaSeconds) || progress.etaSeconds > 86400
          ? "ETA unknown"
          : `ETA ~${Math.max(0, progress.etaSeconds).toFixed(1)}s`;
        solverProgress.textContent = `Progress: ${progress.nodes.toLocaleString()} nodes, ${progress.leaves.toLocaleString()} leaves, elapsed ${elapsed}s, ${eta}.`;
      },
    };
  }

  function runSolver(options = {}) {
    const resume = Boolean(options.resume);
    solverProgress.textContent = "";
    const params = buildSolveParams();

    if (!params.profession) {
      setStatus("Select a profession first.", "error");
      return;
    }
    if (resume && !canResumeWithCurrentInputs()) {
      setStatus("Resume is not available for current inputs.", "error");
      updateResumeAvailability();
      return;
    }

    if (resume && resumeContext?.bestStartStats) {
      params.seedStartStats = { ...resumeContext.bestStartStats };
      if (resumeContext?.mode === "exact" && params.mode === "exact" && resumeContext?.bestBuild) {
        params.initialBestBuild = resumeContext.bestBuild;
      }
    }

    const started = performance.now();
    if (resume) {
      setStatus(params.mode === "exact" ? "Resuming exact solver..." : "Resuming fast solver...");
    } else {
      setStatus(params.mode === "exact" ? "Running exact solver..." : "Running fast solver...");
    }

    setTimeout(() => {
      const result = logic.solve(params);
      result._label = `Run ${runHistory.length + 1}`;
      const elapsedMs = performance.now() - started;

      if (result.status === "infeasible") {
        setStatus(result.message || "No feasible solution.", "error");
        if (result.diagnostic) {
          solverProgress.textContent = `Diagnostic: ${result.diagnostic}`;
        }
        renderResult(result);
        return;
      }

      const status = result.provenOptimal
        ? `Done in ${(elapsedMs / 1000).toFixed(2)}s. Optimal solution proven.`
        : `Done in ${(elapsedMs / 1000).toFixed(2)}s. ${result.status === "timeout" ? "Timed out before proof." : "Best found."}`;
      setStatus(status, "ok");

      if (result.nodesExplored || result.leavesExplored) {
        const eta = result.etaSeconds == null || !Number.isFinite(result.etaSeconds) || result.etaSeconds > 86400
          ? "ETA unknown"
          : `Estimated additional time: ${Math.max(0, result.etaSeconds).toFixed(1)}s`;
        solverProgress.textContent = `Explored ${Number(result.nodesExplored || 0).toLocaleString()} nodes and ${Number(result.leavesExplored || 0).toLocaleString()} leaves. ${eta}.`;
      }

      const canResume = result.status === "timeout" || (result.status === "best_found" && !result.provenOptimal);
      resumeContext = {
        signature: createSolverSignature(params),
        canResume,
        mode: params.mode,
        bestStartStats: result?.build?.startStats ? { ...result.build.startStats } : null,
        bestBuild: result?.build?.ok ? result.build : null,
      };
      updateResumeAvailability();
      renderResult(result);
    }, 0);
  }

  function addManualRun() {
    const enteredLevel0Stats = readManualStartStats();
    const inputValidation = validateManualLevel0Inputs(enteredLevel0Stats);
    if (inputValidation.hasBlank) {
      if (manualRunStatus) {
        manualRunStatus.textContent = "Enter all 10 level-0 stats before adding a manual run.";
        manualRunStatus.style.color = "#b42318";
      }
      return;
    }
    if (inputValidation.hasInvalid) {
      if (manualRunStatus) {
        manualRunStatus.textContent = "Fix highlighted stats before adding a manual run.";
        manualRunStatus.style.color = "#b42318";
      }
      return;
    }
    const params = buildSolveParams();
    const startStats = toBaseStartFromPrimeIncluded(enteredLevel0Stats);
    const evaluated = logic.evaluateBuild({
      ...params,
      startStats,
    });

    if (!evaluated.ok) {
      if (manualRunStatus) {
        const reasons = evaluated.validation?.errors?.join(" ") || evaluated.reason || "Manual run is invalid.";
        manualRunStatus.textContent = reasons;
        manualRunStatus.style.color = "#b42318";
      }
      return;
    }

    const labelRaw = (manualRunLabelInput?.value || "").trim();
    const manualCount = runHistory.filter((entry) => entry.label.startsWith("Manual")).length + 1;
    const manualRun = {
      status: "manual",
      provenOptimal: false,
      build: evaluated,
      _label: labelRaw || `Manual ${manualCount}`,
    };
    renderResult(manualRun);

    if (manualRunStatus) {
      manualRunStatus.textContent = evaluated.meetsMinimums
        ? `Added ${manualRun._label}.`
        : `Added ${manualRun._label}. Note: this manual run does not satisfy current minimum requirements.`;
      manualRunStatus.style.color = evaluated.meetsMinimums ? "#1f7a4d" : "#8a5a00";
    }
  }

  function copyRunToManual(runIndex) {
    const entry = runHistory[runIndex];
    if (!entry?.build?.level0Stats) return;
    const level0Stats = entry.build.level0Stats;
    manualStartStatsBody.querySelectorAll("input[data-manual-start]").forEach((input) => {
      const key = input.dataset.manualStart;
      const value = logic.toInt(level0Stats[key], 0);
      input.value = value > 0 ? String(value) : "";
    });
    if (manualRunLabelInput) {
      manualRunLabelInput.value = `${entry.label} (copy)`;
    }
    updateManualValidation();
    if (manualRunStatus) {
      manualRunStatus.textContent = `Loaded ${entry.label} into manual run inputs for adjustment.`;
      manualRunStatus.style.color = "#1f7a4d";
    }
  }

  function deleteRun(runIndex) {
    if (runIndex < 0 || runIndex >= runHistory.length) return;
    const [removed] = runHistory.splice(runIndex, 1);
    renderResultTable();
    if (runHistory.length === 0) {
      resultSummary.textContent = "Run optimizer to see a recommended start stat layout.";
      resultTotals.textContent = "";
      if (resultCurrentLevelDelta) resultCurrentLevelDelta.textContent = "";
    } else {
      resultSummary.textContent = `Removed ${removed?.label || "run"}. ${runHistory.length} run(s) remaining.`;
      resultTotals.textContent = "";
      updateCurrentLevelTpDelta();
    }
  }

  runSolverBtn.addEventListener("click", () => runSolver({ resume: false }));
  resumeSolverBtn?.addEventListener("click", () => runSolver({ resume: true }));
  solverModeSelect.addEventListener("change", () => {
    updateSolverModeUI();
    updateResumeAvailability();
  });
  clearMinFinalStatsBtn?.addEventListener("click", clearMinimumFinalStats);
  applyFinalAllMinStatBtn?.addEventListener("click", applyFinalAllMinStat);
  copySuggestedRangeBtn?.addEventListener("click", copySuggestedRangeToBounds);
  manualStartClearBtn?.addEventListener("click", clearManualStartStats);
  addManualRunBtn?.addEventListener("click", addManualRun);
  professionSelect?.addEventListener("change", () => {
    renderStartConstraintInputs();
    updateStartConstraintWarning();
    updateManualValidation();
    updateResumeAvailability();
  });
  raceSelect?.addEventListener("change", () => {
    renderStartConstraintInputs();
    updateStartConstraintWarning();
    updateManualValidation();
    updateResumeAvailability();
  });
  targetLevelInput?.addEventListener("input", () => {
    renderStartConstraintInputs();
    updateStartConstraintWarning();
    updateManualValidation();
    updateResumeAvailability();
  });
  tpBiasSlider?.addEventListener("input", () => {
    updateTpBiasLabel();
    updateResumeAvailability();
  });

  profileSelect.addEventListener("change", () => {
    const value = profileSelect.value || "";
    if (value) localStorage.setItem("gs4.selectedProfileId", value);
    else localStorage.removeItem("gs4.selectedProfileId");
    applySelectedProfileFromPicker();
    updateCurrentLevelTpDelta();
  });

  profileLoad.addEventListener("click", () => {
    applySelectedProfileFromPicker();
    updateCurrentLevelTpDelta();
  });

  initializeStaticInputs();
  renderManualStartInputs();
  minFinalStatsBody?.addEventListener("input", () => {
    renderStartConstraintInputs();
    updateFinalFromCurrentMaxRow();
    updateStartConstraintWarning();
    updateResumeAvailability();
  });
  startConstraintMinBody?.addEventListener("input", (event) => {
    const input = event.target.closest("input[data-start-min]");
    if (!input) return;
    enforceStartConstraintPair("min", input.dataset.startMin);
    updateFinalFromCurrentMaxRow();
    updateStartConstraintWarning();
    updateResumeAvailability();
  });
  startConstraintMaxBody?.addEventListener("input", (event) => {
    const input = event.target.closest("input[data-start-max]");
    if (!input) return;
    enforceStartConstraintPair("max", input.dataset.startMax);
    updateFinalFromCurrentMaxRow();
    updateStartConstraintWarning();
    updateResumeAvailability();
  });
  minPtpInput?.addEventListener("input", updateResumeAvailability);
  minMtpInput?.addEventListener("input", updateResumeAvailability);
  minStartPtpInput?.addEventListener("input", updateResumeAvailability);
  minStartMtpInput?.addEventListener("input", updateResumeAvailability);
  useCaseSelect?.addEventListener("change", updateResumeAvailability);
  maxSecondsInput?.addEventListener("input", updateResumeAvailability);
  manualStartStatsBody.addEventListener("input", updateManualValidation);
  resultStatsHead.addEventListener("click", (event) => {
    const adjustButton = event.target.closest(".optimizer-copy-run");
    if (adjustButton) {
      const runIndex = logic.toInt(adjustButton.dataset.runIndex, -1);
      if (runIndex < 0) return;
      copyRunToManual(runIndex);
      return;
    }

    const deleteButton = event.target.closest(".optimizer-delete-run");
    if (deleteButton) {
      const runIndex = logic.toInt(deleteButton.dataset.runIndex, -1);
      if (runIndex < 0) return;
      deleteRun(runIndex);
    }
  });
  updateManualValidation();
  updateFinalFromCurrentMaxRow();
  updateStartConstraintWarning();
  initializeProfileSelect();
  applySelectedProfileFromPicker();
  updateCurrentLevelTpDelta();
  updateResumeAvailability();
})();
