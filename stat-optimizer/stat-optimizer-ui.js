(() => {
  const storage = window.GS4Storage;
  const data = window.GS4_DATA;
  const config = window.STAT_OPTIMIZER_DATA;
  const logic = window.StatOptimizerLogic;
  const profileLogic = window.ProfileLogic;

  if (!storage || !data || !logic || !config) {
    console.error("Stat optimizer dependencies are missing.");
    return;
  }

  const profileSelect = document.getElementById("profileSelect");
  const profileLoad = document.getElementById("profileLoad");

  const raceSelect = document.getElementById("race");
  const professionSelect = document.getElementById("profession");
  const targetLevelInput = document.getElementById("targetLevel");
  const alsoShowLevelInput = document.getElementById("alsoShowLevel");
  const tpBiasSlider = document.getElementById("tpBiasSlider");
  const tpBiasValue = document.getElementById("tpBiasValue");
  const primeSummary = document.getElementById("primeSummary");
  const statInfoGrid = document.getElementById("statInfoGrid");

  const solverModeSelect = document.getElementById("solverMode");
  const maxSecondsGroup = document.getElementById("maxSecondsGroup");
  const maxSecondsInput = document.getElementById("maxSeconds");
  const constraintFreeWarning = document.getElementById("constraintFreeWarning");
  const runSolverBtn = document.getElementById("runSolver");
  const stopSolverBtn = document.getElementById("stopSolver");
  const resumeSolverBtn = document.getElementById("resumeSolver");
  const solverStatus = document.getElementById("solverStatus");
  const resumeStatus = document.getElementById("resumeStatus");
  const solverProgress = document.getElementById("solverProgress");

  const finalAllMinStatInput = document.getElementById("finalAllMinStat");
  const applyFinalAllMinStatBtn = document.getElementById("applyFinalAllMinStat");
  const clearMinFinalStatsBtn = document.getElementById("clearMinFinalStats");
  const copySuggestedRangeBtn = document.getElementById("copySuggestedRange");
  const startConstraintLabels = document.getElementById("startConstraintLabels");
  const finalConstraintLabels = document.getElementById("finalConstraintLabels");
  const startConstraintMinBody = document.getElementById("startConstraintMinBody");
  const startConstraintSuggested = document.getElementById("startConstraintSuggested");
  const startConstraintFinalFromMin = document.getElementById("startConstraintFinalFromMin");
  const startConstraintFinalFromMax = document.getElementById("startConstraintFinalFromMax");
  const startConstraintMaxBody = document.getElementById("startConstraintMaxBody");
  const startConstraintWarning = document.getElementById("startConstraintWarning");
  const minFinalStatsBody = document.getElementById("minFinalStatsBody");
  const finalConstraintHelper = document.getElementById("finalConstraintHelper");
  const resultSummary = document.getElementById("resultSummary");
  const resultCurrentLevelDelta = document.getElementById("resultCurrentLevelDelta");
  const resultStatsHead = document.getElementById("resultStatsHead");
  const resultStatsBody = document.getElementById("resultStatsBody");
  const resultTotals = document.getElementById("resultTotals");
  const resultEditStatus = document.getElementById("resultEditStatus");
  const addManualRunBtn = document.getElementById("addManualRun");
  const addProfileRunBtn = document.getElementById("addProfileRun");
  const runHistory = [];
  let floatingTooltipEl = null;
  let floatingTooltipTarget = null;
  const inlineEditState = {
    active: false,
    runIndex: -1,
    draftLevel0Stats: null,
    draftRawValues: null,
    message: "",
    tone: "",
  };
  let resumeContext = null;
  const runningSolverState = {
    active: false,
    stopRequested: false,
    mode: "constraint_free_auto",
    modeLabel: "Constraint-Free Auto",
    maxElapsedSeconds: 0,
    iteration: 0,
    noImproveStreak: 0,
    startedAtMs: 0,
    paramsBase: null,
    bestResult: null,
    lockSnapshot: null,
    constraint_free_autoCurrentMax: 100,
    constraint_free_autoAttempts: 0,
    constraint_free_autoLastDiagnostic: "",
    constraint_free_autoOptimizing: false,
    constraint_free_autoOptimizeIterations: 0,
  };

  function loadProfiles() {
    return storage.loadProfiles();
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

  function getStatTooltip(statKey) {
    const profession = professionSelect?.value || "";
    const raceName = (data.races || []).find((entry) => entry.key === raceSelect?.value)?.name || "Human";
    const stat = (data.stats || []).find((entry) => entry.key === statKey);
    if (!stat) return "";
    const general = config?.statGeneralInfo?.[stat.key]?.summary || "";
    const professionReason = getProfessionStatReason(profession, stat.key).trim();
    const growthRate = profileLogic?.getGrowthRate
      ? profileLogic.getGrowthRate(data.baseGrowthRates, data.raceGrowthModifiers, raceName, profession, stat.key)
      : null;
    const parts = [
      stat.label,
      general ? `General: ${general}` : "",
      professionReason ? `${profession}: ${professionReason}` : "",
      Number.isFinite(growthRate) && growthRate > 0 ? `Growth Factor: ${growthRate}` : "",
    ].filter(Boolean);
    return parts.join("\n\n");
  }

  function renderStatAbbr(abbr, statKey = "") {
    const tooltip = statKey ? getStatTooltip(statKey) : "";
    const tooltipAttr = tooltip ? ` data-tooltip="${tooltip.replace(/"/g, "&quot;")}"` : "";
    return `<span class="optimizer-stat-abbr"${tooltipAttr}>${abbr}</span>`;
  }

  function getFloatingTooltip() {
    if (floatingTooltipEl) return floatingTooltipEl;
    const tooltip = document.createElement("div");
    tooltip.className = "optimizer-floating-tooltip";
    tooltip.hidden = true;
    document.body.appendChild(tooltip);
    floatingTooltipEl = tooltip;
    return tooltip;
  }

  function positionFloatingTooltip(target, pointerEvent = null) {
    if (!target) return;
    const tooltip = getFloatingTooltip();
    const tooltipRect = tooltip.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const margin = 12;
    let left;
    let top;

    if (pointerEvent && Number.isFinite(pointerEvent.clientX) && Number.isFinite(pointerEvent.clientY)) {
      left = pointerEvent.clientX + 14;
      top = pointerEvent.clientY - tooltipRect.height - 14;
    } else {
      left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
      top = targetRect.top - tooltipRect.height - 12;
    }

    const maxLeft = window.innerWidth - tooltipRect.width - margin;
    left = Math.min(Math.max(margin, left), Math.max(margin, maxLeft));

    if (top < margin) {
      top = targetRect.bottom + 12;
    }
    const maxTop = window.innerHeight - tooltipRect.height - margin;
    top = Math.min(Math.max(margin, top), Math.max(margin, maxTop));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function showFloatingTooltip(target, pointerEvent = null) {
    const text = target?.dataset?.tooltip || "";
    if (!text) return;
    const tooltip = getFloatingTooltip();
    floatingTooltipTarget = target;
    tooltip.textContent = text;
    tooltip.hidden = false;
    positionFloatingTooltip(target, pointerEvent);
  }

  function hideFloatingTooltip() {
    floatingTooltipTarget = null;
    if (!floatingTooltipEl) return;
    floatingTooltipEl.hidden = true;
  }

  function bindFloatingTooltips() {
    document.addEventListener("mouseover", (event) => {
      const target = event.target.closest(".optimizer-stat-abbr[data-tooltip]");
      if (!target) return;
      showFloatingTooltip(target, event);
    });

    document.addEventListener("mousemove", (event) => {
      if (!floatingTooltipTarget) return;
      if (!event.target.closest(".optimizer-stat-abbr[data-tooltip]")) return;
      positionFloatingTooltip(floatingTooltipTarget, event);
    });

    document.addEventListener("mouseout", (event) => {
      if (!floatingTooltipTarget) return;
      const fromTarget = event.target.closest(".optimizer-stat-abbr[data-tooltip]");
      if (!fromTarget || fromTarget !== floatingTooltipTarget) return;
      if (event.relatedTarget?.closest?.(".optimizer-stat-abbr[data-tooltip]") === floatingTooltipTarget) return;
      hideFloatingTooltip();
    });

    document.addEventListener("focusin", (event) => {
      const target = event.target.closest(".optimizer-stat-abbr[data-tooltip]");
      if (!target) return;
      showFloatingTooltip(target);
    });

    document.addEventListener("focusout", (event) => {
      if (!event.target.closest(".optimizer-stat-abbr[data-tooltip]")) return;
      hideFloatingTooltip();
    });

    window.addEventListener("resize", () => {
      if (floatingTooltipTarget) positionFloatingTooltip(floatingTooltipTarget);
    });
  }

  function renderPrimeSummary() {
    if (!primeSummary) return;
    const profession = professionSelect?.value || "";
    const primeKeys = logic.getPrimeStatKeys(data, profession);
    if (!primeKeys.length) {
      primeSummary.innerHTML = '<span class="optimizer-prime-note">Prime requisites are unavailable for the selected profession.</span>';
      return;
    }
    const labels = primeKeys
      .map((key) => (data.stats || []).find((stat) => stat.key === key))
      .filter(Boolean)
      .map((stat) => renderStatAbbr(stat.abbr, stat.key))
      .join(" ");
    primeSummary.innerHTML = `<span class="optimizer-prime-note">Prime requisites are ${labels}.</span>`;
  }

  function getProfessionStatReason(profession, statKey) {
    const explicit = config?.professionStatReasons?.[profession]?.[statKey];
    const reasons = [];
    if (explicit) reasons.push(explicit);
    const primeSet = new Set(logic.getPrimeStatKeys(data, profession));
    if (primeSet.has(statKey)) {
      reasons.push("Prime requisite.");
    }
    const manaStats = new Set(config?.professionManaStats?.[profession] || []);
    if (manaStats.has(statKey) && !reasons.some((reason) => reason.toLowerCase().includes("mana stat"))) {
      reasons.push(`Mana stat for ${profession}.`);
    }
    return reasons.join(" ");
  }

  function renderStatInfoGrid() {
    if (!statInfoGrid) return;
    const profession = professionSelect?.value || "";
    const raceName = (data.races || []).find((entry) => entry.key === raceSelect?.value)?.name || "Human";
    statInfoGrid.innerHTML = "";
    (data.stats || []).forEach((stat) => {
      const professionReason = getProfessionStatReason(profession, stat.key).trim();
      const growthRate = profileLogic?.getGrowthRate
        ? profileLogic.getGrowthRate(data.baseGrowthRates, data.raceGrowthModifiers, raceName, profession, stat.key)
        : null;
      const card = document.createElement("article");
      card.className = "optimizer-stat-info-card";
      card.innerHTML = `
        <div class="optimizer-stat-info-head">
          ${renderStatAbbr(stat.abbr, stat.key)}
          <span class="optimizer-stat-info-label">${stat.label}</span>
        </div>
        <div class="optimizer-stat-info-body">
          <div><strong>General:</strong> ${config?.statGeneralInfo?.[stat.key]?.summary || "No summary available."}</div>
          ${professionReason ? `<div><strong>${profession || "Profession"}:</strong> ${professionReason}</div>` : ""}
          ${Number.isFinite(growthRate) && growthRate > 0 ? `<div><strong>Growth Factor:</strong> ${growthRate}</div>` : ""}
        </div>
      `;
      statInfoGrid.appendChild(card);
    });
  }

  function initializeStaticInputs() {
    fillSelect(raceSelect, data.races || []);
    fillSelect(professionSelect, (data.professions || []).map((name) => ({ key: name, name })));

    const defaults = config.solverDefaults;
    if (solverModeSelect) solverModeSelect.value = defaults.mode || "exact";
    if (maxSecondsInput) maxSecondsInput.value = String(defaults.maxSeconds);
    targetLevelInput.value = "100";
    if (alsoShowLevelInput) alsoShowLevelInput.value = "100";
    if (tpBiasSlider) tpBiasSlider.value = "50";
    updateTpBiasLabel();

    renderMinimumFinalStatsInputs({ resetToDefaults: true });
    renderStartConstraintInputs({ resetToDefaults: true });
    renderPrimeSummary();
    renderStatInfoGrid();
    updateTargetLevelLabels();
    updateSolverModeUI();
  }

  function getTargetLevelValue() {
    return logic.clamp(logic.toInt(targetLevelInput?.value, 0), 0, 100);
  }

  function getAlsoShowLevels() {
    const raw = String(alsoShowLevelInput?.value || "").trim();
    if (!raw) return [100];
    const levels = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => logic.clamp(logic.toInt(part, 100), 0, 100));
    return Array.from(new Set(levels));
  }

  function updateTargetLevelLabels() {
    const targetLevel = getTargetLevelValue();
    if (finalConstraintHelper) {
      finalConstraintHelper.textContent = `Minimum final stats required at target level (L${targetLevel}):`;
    }
    if (addProfileRunBtn) {
      addProfileRunBtn.textContent = `Add Profile @ L${targetLevel}`;
    }
  }

  function updateTpBiasLabel() {
    if (!tpBiasSlider || !tpBiasValue) return;
    const mtpWeight = logic.clamp(logic.toInt(tpBiasSlider.value, 50), 0, 100);
    const ptpWeight = 100 - mtpWeight;
    tpBiasValue.textContent = `${ptpWeight}/${mtpWeight}`;
  }

  function renderMinimumFinalStatsInputs(options = {}) {
    const resetToDefaults = Boolean(options.resetToDefaults);
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
        labelCell.innerHTML = renderStatAbbr(stat.abbr, stat.key);
        finalConstraintLabels.appendChild(labelCell);
      }
      const cell = document.createElement("label");
      cell.className = "optimizer-min-stat";
      const defaultValue = getLevel0FloorByKey(stat.key);
      const value = resetToDefaults ? String(defaultValue) : (existing[stat.key] || String(defaultValue));
      cell.innerHTML = `
        <input id="min-final-${stat.key}" type="number" min="0" max="100" step="1" value="${value}" data-min-final="${stat.key}" />
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
    const ranges = {};
    (data.stats || []).forEach((stat) => {
      const minSuggested = getLevel0FloorByKey(stat.key);
      const maxSuggested = Math.max(
        minSuggested,
        computeSuggestedStartForTarget(stat.key, 100, minSuggested)
      );
      ranges[stat.key] = {
        minSuggested,
        maxSuggested,
      };
    });
    return ranges;
  }

  function renderStartConstraintInputs(options = {}) {
    const resetToDefaults = Boolean(options.resetToDefaults);
    if (!startConstraintLabels || !startConstraintMinBody || !startConstraintMaxBody) return;
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
    if (startConstraintSuggested) startConstraintSuggested.innerHTML = "";
    if (startConstraintFinalFromMin) startConstraintFinalFromMin.innerHTML = "";
    if (startConstraintFinalFromMax) startConstraintFinalFromMax.innerHTML = "";
    startConstraintMaxBody.innerHTML = "";
    const suggestedRanges = computeSuggestedRanges();
    (data.stats || []).forEach((stat) => {
      const minDefault = getLevel0FloorByKey(stat.key);
      const maxDefault = 100;
      const minValue = resetToDefaults ? String(minDefault) : (existingMin[stat.key] || String(minDefault));
      const maxValue = resetToDefaults ? String(maxDefault) : (existingMax[stat.key] || String(maxDefault));

      const labelCell = document.createElement("div");
      labelCell.className = "stat-constraint-cell stat-constraint-label-cell";
      labelCell.innerHTML = renderStatAbbr(stat.abbr, stat.key);
      startConstraintLabels.appendChild(labelCell);

      const minCell = document.createElement("label");
      minCell.className = "optimizer-min-stat";
      minCell.innerHTML = `
        <input id="start-min-${stat.key}" type="number" min="0" max="100" step="1" value="${minValue}" data-start-min="${stat.key}" />
      `;
      startConstraintMinBody.appendChild(minCell);

      if (startConstraintSuggested) {
        const suggestedCell = document.createElement("div");
        suggestedCell.className = "stat-constraint-cell";
        suggestedCell.textContent = `${suggestedRanges[stat.key]?.minSuggested ?? minDefault}-${suggestedRanges[stat.key]?.maxSuggested ?? 100}`;
        startConstraintSuggested.appendChild(suggestedCell);
      }

      const maxCell = document.createElement("label");
      maxCell.className = "optimizer-min-stat";
      maxCell.innerHTML = `
        <input id="start-max-${stat.key}" type="number" min="0" max="100" step="1" value="${maxValue}" data-start-max="${stat.key}" />
      `;
      startConstraintMaxBody.appendChild(maxCell);
    });
    updateFinalFromCurrentBoundsRows();
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

  function updateFinalFromCurrentBoundsRows() {
    if (startConstraintFinalFromMin) startConstraintFinalFromMin.innerHTML = "";
    if (startConstraintFinalFromMax) startConstraintFinalFromMax.innerHTML = "";
    (data.stats || []).forEach((stat) => {
      const key = stat.key;
      const minInput = startConstraintMinBody?.querySelector(`input[data-start-min="${key}"]`);
      const maxInput = startConstraintMaxBody?.querySelector(`input[data-start-max="${key}"]`);
      const minRaw = String(minInput?.value || "").trim();
      const maxRaw = String(maxInput?.value || "").trim();
      const level0Min = minRaw ? logic.clamp(logic.toInt(minRaw, getLevel0FloorByKey(key)), 0, 100) : getLevel0FloorByKey(key);
      const level0Max = maxRaw ? logic.clamp(logic.toInt(maxRaw, 100), 0, 100) : 100;
      if (startConstraintFinalFromMin) {
        const minCell = document.createElement("div");
        minCell.className = "stat-constraint-cell";
        minCell.textContent = String(finalStatFromLevel0(key, level0Min));
        startConstraintFinalFromMin.appendChild(minCell);
      }
      if (startConstraintFinalFromMax) {
        const maxCell = document.createElement("div");
        maxCell.className = "stat-constraint-cell";
        maxCell.textContent = String(finalStatFromLevel0(key, level0Max));
        startConstraintFinalFromMax.appendChild(maxCell);
      }
    });
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

  function clearMinimumFinalStats() {
    renderMinimumFinalStatsInputs({ resetToDefaults: true });
    renderStartConstraintInputs({ resetToDefaults: true });
    if (finalAllMinStatInput) finalAllMinStatInput.value = "";
    updateStartConstraintWarning();
    updateSajehnAvailability();
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
    renderStartConstraintInputs({ resetToDefaults: true });
    updateStartConstraintWarning();
    updateResumeAvailability();
  }

  function copySuggestedRangeToBounds() {
    const ranges = computeSuggestedRanges();
    startConstraintMinBody?.querySelectorAll("input[data-start-min]").forEach((input) => {
      const key = input.dataset.startMin;
      input.value = String(ranges[key]?.minSuggested ?? getLevel0FloorByKey(key));
    });
    startConstraintMaxBody?.querySelectorAll("input[data-start-max]").forEach((input) => {
      const key = input.dataset.startMax;
      input.value = String(ranges[key]?.maxSuggested ?? 100);
    });
    updateFinalFromCurrentBoundsRows();
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
    if (!maxSecondsGroup) return;
    const mode = solverModeSelect?.value || "exact";
    const show = mode === "exact";
    maxSecondsGroup.hidden = !show;
    maxSecondsGroup.style.display = show ? "" : "none";
    updateSajehnAvailability();
  }

  function updateSajehnAvailability() {
    if (!constraintFreeWarning) return;
    const mode = solverModeSelect?.value || "exact";
    if (mode !== "constraint_free_auto") {
      constraintFreeWarning.textContent = "";
      return;
    }
    if (hasAnyActiveConstraints()) {
      constraintFreeWarning.textContent = "Note: Constraint-Free Auto ignores the constraint fields below. Use Solve w/ Constraints to apply them.";
    } else {
      constraintFreeWarning.textContent = "";
    }
  }

  function hasAnyActiveConstraints() {
    const hasMinFinal = Array.from(minFinalStatsBody?.querySelectorAll("input[data-min-final]") || [])
      .some((input) => String(input.value || "").trim() !== "" && Math.max(0, logic.toInt(input.value, 0)) > 0);
    if (hasMinFinal) return true;

    const hasStartMin = Array.from(startConstraintMinBody?.querySelectorAll("input[data-start-min]") || [])
      .some((input) => String(input.value || "").trim() !== "" && Math.max(0, logic.toInt(input.value, 0)) > 0);
    if (hasStartMin) return true;

    const hasStartMax = Array.from(startConstraintMaxBody?.querySelectorAll("input[data-start-max]") || [])
      .some((input) => String(input.value || "").trim() !== "" && Math.max(0, logic.toInt(input.value, 0)) > 0);
    return hasStartMax;
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

    const selected = localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "";
    if (selected) profileSelect.value = selected;
  }

  function applySelectedProfileFromPicker() {
    const selected = profileSelect?.value || "";
    if (!selected) {
      upsertProfileBaselineRun(null);
      if (addProfileRunBtn) addProfileRunBtn.disabled = true;
      return;
    }
    const profiles = loadProfiles();
    const profile = profiles.find((entry) => entry.id === selected);
    if (!profile) {
      upsertProfileBaselineRun(null);
      if (addProfileRunBtn) addProfileRunBtn.disabled = true;
      return;
    }

    applyProfile(profile);
    upsertProfileBaselineRun(profile);
    if (addProfileRunBtn) addProfileRunBtn.disabled = false;
    renderMinimumFinalStatsInputs({ resetToDefaults: true });
    renderStartConstraintInputs({ resetToDefaults: true });
    updateFinalFromCurrentBoundsRows();
    updateStartConstraintWarning();
    updateResumeAvailability();
  }

  function applyProfile(profile) {
    if (!profile) return;
    const race = (data.races || []).find((entry) => String(entry.name).toLowerCase() === String(profile.race || "").toLowerCase());
    if (race) raceSelect.value = race.key;
    if (profile.profession && (data.professions || []).includes(profile.profession)) {
      professionSelect.value = profile.profession;
    }
    renderPrimeSummary();
    renderStatInfoGrid();
  }

  function getSelectedProfile() {
    const selected = profileSelect?.value || "";
    if (!selected) return null;
    const profiles = loadProfiles();
    return profiles.find((entry) => entry.id === selected) || null;
  }

  function normalizeLevel0StatsForRun(level0Stats) {
    const normalized = {};
    (data.stats || []).forEach((stat) => {
      const floor = getLevel0FloorByKey(stat.key);
      normalized[stat.key] = logic.clamp(logic.toInt(level0Stats?.[stat.key], floor), 1, 100);
    });
    return normalized;
  }

  function removeProfileBaselineRun() {
    const index = runHistory.findIndex((entry) => entry.sourceKind === "profile_baseline");
    if (index < 0) return false;
    runHistory.splice(index, 1);
    if (inlineEditState.active) {
      if (inlineEditState.runIndex === index) {
        inlineEditState.active = false;
        inlineEditState.runIndex = -1;
        inlineEditState.draftLevel0Stats = null;
        setInlineEditStatus("");
      } else if (inlineEditState.runIndex > index) {
        inlineEditState.runIndex -= 1;
      }
    }
    return true;
  }

  function upsertProfileBaselineRun(profile) {
    if (!profile || !profile.level0Stats || typeof profile.level0Stats !== "object") {
      const removed = removeProfileBaselineRun();
      if (removed) {
        renderResultTable();
        updateCurrentLevelTpDelta();
      }
      return;
    }

    const normalizedStart = normalizeLevel0StatsForRun(profile.level0Stats);
    const preview = buildPreviewFromDraft(normalizedStart);
    if (!preview) {
      const removed = removeProfileBaselineRun();
      if (removed) {
        renderResultTable();
        updateCurrentLevelTpDelta();
      }
      return;
    }

    const baselineEntry = {
      label: `${profile.name || "Profile"} @ L${getTargetLevelValue()}`,
      build: preview,
      status: "profile",
      sourceKind: "profile_baseline",
    };
    const existingIndex = runHistory.findIndex((entry) => entry.sourceKind === "profile_baseline");
    if (existingIndex >= 0) {
      runHistory[existingIndex] = baselineEntry;
    } else {
      runHistory.unshift(baselineEntry);
      if (inlineEditState.active && inlineEditState.runIndex >= 0) {
        inlineEditState.runIndex += 1;
      }
    }
    renderResultTable();
    if (runHistory.length === 1) {
      resultSummary.textContent = "Selected profile baseline added from INFO START level-0 stats.";
      resultTotals.textContent = "";
    }
    updateCurrentLevelTpDelta();
  }

  function appendProfileRun(profile) {
    if (!profile || !profile.level0Stats || typeof profile.level0Stats !== "object") return;
    const normalizedStart = normalizeLevel0StatsForRun(profile.level0Stats);
    const preview = buildPreviewFromDraft(normalizedStart);
    if (!preview) return;

    runHistory.push({
      label: `${profile.name || "Profile"} @ L${getTargetLevelValue()}`,
      build: preview,
      status: "profile",
      sourceKind: "profile_snapshot",
    });
    renderResultTable();
    updateCurrentLevelTpDelta();
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
      minFinalStats: readMinimumFinalStats(),
      minStartStats,
      maxStartStats,
    };
  }

  function renderResultTable() {
    resultStatsHead.innerHTML = "";
    resultStatsBody.innerHTML = "";
    if (runHistory.length === 0) return;
    const targetLevelValue = getTargetLevelValue();
    const comparisonLevels = Array.from(new Set([targetLevelValue, ...getAlsoShowLevels()]))
      .sort((left, right) => left - right);

    const groupRow = document.createElement("tr");
    const statHead = document.createElement("th");
    statHead.textContent = "Stat";
    statHead.rowSpan = 2;
    groupRow.appendChild(statHead);

    runHistory.forEach((entry, index) => {
      const editing = inlineEditState.active && inlineEditState.runIndex === index;
      const failed = entry.status === "failed_constraints";
      const build = getDisplayBuildForRun(entry, index);
      const targetLevel = logic.toInt(build?.metrics?.level, 0);
      const th = document.createElement("th");
      th.innerHTML = `
        <div class="optimizer-run-head">
          <div>
            <div>${entry.label}</div>
            <div class="optimizer-totals-sub">Target L${targetLevel}</div>
          </div>
          <div class="optimizer-run-actions">
            ${editing
              ? `<button type="button" class="btn ghost btn tiny optimizer-inline-done" data-run-index="${index}">Done</button>`
              : `<button type="button" class="btn ghost btn tiny optimizer-copy-run" data-run-index="${index}">Adjust</button>`}
            <button type="button" class="btn ghost btn tiny optimizer-delete-run" data-run-index="${index}">Delete</button>
          </div>
        </div>
      `;
      th.colSpan = 1 + comparisonLevels.length;
      const dimmed = inlineEditState.active && inlineEditState.runIndex !== index;
      th.className = `optimizer-run-band optimizer-run-band-${index % 4}${failed ? " optimizer-run-failed" : ""}${editing ? " optimizer-run-editing" : ""}${dimmed ? " optimizer-run-dim" : ""}`;
      groupRow.appendChild(th);
    });
    resultStatsHead.appendChild(groupRow);

    const subRow = document.createElement("tr");
    runHistory.forEach((entry, index) => {
      const failed = entry.status === "failed_constraints";
      const startTh = document.createElement("th");
      startTh.textContent = "Start";
      const editing = inlineEditState.active && inlineEditState.runIndex === index;
      const dimmed = inlineEditState.active && inlineEditState.runIndex !== index;
      startTh.className = `optimizer-run-band optimizer-run-band-${index % 4}${failed ? " optimizer-run-failed" : ""}${editing ? " optimizer-run-editing" : ""}${dimmed ? " optimizer-run-dim" : ""}`;
      subRow.appendChild(startTh);
      comparisonLevels.forEach((level) => {
        const levelTh = document.createElement("th");
        levelTh.textContent = level === targetLevelValue ? `Target (L${level})` : `L${level}`;
        levelTh.className = `optimizer-run-band optimizer-run-band-${index % 4}${failed ? " optimizer-run-failed" : ""}${editing ? " optimizer-run-editing" : ""}${dimmed ? " optimizer-run-dim" : ""}`;
        subRow.appendChild(levelTh);
      });
    });
    resultStatsHead.appendChild(subRow);

    const stats = data.stats || [];
    stats.forEach((stat) => {
      const key = stat.key;
      const row = document.createElement("tr");
      const statCell = document.createElement("td");
      statCell.innerHTML = renderStatAbbr(stat.abbr, stat.key);
      row.appendChild(statCell);

      runHistory.forEach((entry, index) => {
        const build = getDisplayBuildForRun(entry, index);
        const statsByLevel = new Map(
          comparisonLevels.map((level) => [
            level,
            level === targetLevelValue ? build.metrics.finalStats : buildFinalStatsAtLevel(build.level0Stats, level),
          ])
        );
        const editing = inlineEditState.active && inlineEditState.runIndex === index;
        const failed = entry.status === "failed_constraints";
        const dimmed = inlineEditState.active && inlineEditState.runIndex !== index;
        const startCell = document.createElement("td");
        if (editing) {
          const draftValue = String(
            inlineEditState.draftRawValues?.[key]
              ?? inlineEditState.draftLevel0Stats?.[key]
              ?? logic.toInt(build.level0Stats[key], 0)
          );
          startCell.innerHTML = `<input type="number" min="1" max="100" step="1" value="${draftValue}" data-inline-edit="${key}" />`;
        } else {
          startCell.textContent = String(build.level0Stats[key]);
        }
        startCell.className = `optimizer-run-band optimizer-run-band-${index % 4}${failed ? " optimizer-run-failed" : ""}${editing ? " optimizer-run-editing" : ""}${dimmed ? " optimizer-run-dim" : ""}`;
        row.appendChild(startCell);
        comparisonLevels.forEach((level) => {
          const levelCell = document.createElement("td");
          if (editing && level === targetLevelValue) levelCell.dataset.inlineTargetStat = key;
          const statsAtLevel = statsByLevel.get(level);
          levelCell.textContent = String(statsAtLevel?.[key] ?? build.metrics.finalStats[key]);
          levelCell.className = `optimizer-run-band optimizer-run-band-${index % 4}${failed ? " optimizer-run-failed" : ""}${editing ? " optimizer-run-editing" : ""}${dimmed ? " optimizer-run-dim" : ""}`;
          row.appendChild(levelCell);
        });
      });
      resultStatsBody.appendChild(row);
    });

    const totalsRow = document.createElement("tr");
    totalsRow.className = "optimizer-totals-row";
    const totalsLabel = document.createElement("td");
    totalsLabel.textContent = "Totals";
    totalsRow.appendChild(totalsLabel);
    runHistory.forEach((entry, index) => {
      const build = getDisplayBuildForRun(entry, index);
      const editing = inlineEditState.active && inlineEditState.runIndex === index;
      const failed = entry.status === "failed_constraints";
      const dimmed = inlineEditState.active && inlineEditState.runIndex !== index;
      const totalCell = document.createElement("td");
      totalCell.colSpan = 1 + comparisonLevels.length;
      if (editing) totalCell.dataset.inlineTotals = "true";
      totalCell.className = `optimizer-run-band optimizer-run-band-${index % 4} optimizer-totals-cell${failed ? " optimizer-run-failed" : ""}${editing ? " optimizer-run-editing" : ""}${dimmed ? " optimizer-run-dim" : ""}`;
      totalCell.innerHTML = `
        <div>PTP ${build.metrics.ptp} / MTP ${build.metrics.mtp}</div>
        <div class="optimizer-totals-sub">Start PTP ${build.metrics.startPtp} / Start MTP ${build.metrics.startMtp}</div>
        <div class="optimizer-totals-sub">Total Stats ${build.metrics.overall}</div>
      `;
      totalsRow.appendChild(totalCell);
    });
    resultStatsBody.appendChild(totalsRow);
  }

  function buildPreviewFromDraft(draftLevel0Stats) {
    if (!draftLevel0Stats) return null;
    const raceName = (data.races || []).find((entry) => entry.key === raceSelect?.value)?.name || "Human";
    const profession = professionSelect?.value || "";
    if (!profession) return null;
    const targetLevel = logic.clamp(logic.toInt(targetLevelInput?.value, 0), 0, 100);
    const targetExperience = logic.deriveExperienceTarget(data, targetLevel, -1);
    const effectiveLevel = logic.levelFromExperience(data?.levelThresholds || [], targetExperience);

    const computedAtTarget = profileLogic.computeStatsFromLevel0({
      stats: data.stats,
      level0Stats: draftLevel0Stats,
      level: effectiveLevel,
      raceName,
      profession,
      baseGrowthRates: data.baseGrowthRates,
      raceGrowthModifiers: data.raceGrowthModifiers,
    });
    const finalStats = logic.computeFinalStatSummary(computedAtTarget);
    const tpTotals = logic.estimateTotalTrainingPointsFromExperience({
      data,
      profileLogic,
      experience: targetExperience,
      raceName,
      profession,
      level0Stats: draftLevel0Stats,
    });
    const startTp = logic.trainingPointsPerLevelForStats(draftLevel0Stats, profession, data?.professionPrimeReqs);

    return {
      metrics: {
        ptp: tpTotals.ptp,
        mtp: tpTotals.mtp,
        startPtp: startTp.ptpPerLevel,
        startMtp: startTp.mtpPerLevel,
        overall: finalStats.total,
        finalStats,
        level0Stats: draftLevel0Stats,
        level: effectiveLevel,
        experience: targetExperience,
      },
      level0Stats: draftLevel0Stats,
    };
  }

  function buildFinalStatsAtLevel(level0Stats, level) {
    if (!level0Stats) return null;
    const raceName = (data.races || []).find((entry) => entry.key === raceSelect?.value)?.name || "Human";
    const profession = professionSelect?.value || "";
    if (!profession) return null;
    const computed = profileLogic.computeStatsFromLevel0({
      stats: data.stats,
      level0Stats,
      level: logic.clamp(logic.toInt(level, 0), 0, 100),
      raceName,
      profession,
      baseGrowthRates: data.baseGrowthRates,
      raceGrowthModifiers: data.raceGrowthModifiers,
    });
    return logic.computeFinalStatSummary(computed);
  }

  function getDisplayBuildForRun(entry, index) {
    if (!(inlineEditState.active && inlineEditState.runIndex === index)) return entry.build;
    const preview = buildPreviewFromDraft(inlineEditState.draftLevel0Stats);
    return preview || entry.build;
  }

  function setInlineEditStatus(message, tone = "") {
    inlineEditState.message = message || "";
    inlineEditState.tone = tone;
    if (!resultEditStatus) return;
    resultEditStatus.textContent = inlineEditState.message;
    resultEditStatus.style.color = tone === "error" ? "#b42318" : tone === "ok" ? "#1f7a4d" : "";
  }

  function startInlineEditCopy(runIndex) {
    const source = runHistory[runIndex];
    if (!source?.build?.level0Stats) return;
    const copyLabel = `${source.label} (copy)`;
    runHistory.push({
      label: copyLabel,
      build: source.build,
      status: "manual",
    });
    inlineEditState.active = true;
    inlineEditState.runIndex = runHistory.length - 1;
    inlineEditState.draftLevel0Stats = { ...source.build.level0Stats };
    inlineEditState.draftRawValues = Object.fromEntries(
      Object.entries(source.build.level0Stats).map(([key, value]) => [key, String(value)])
    );
    setInlineEditStatus("Editing copied run inline. Click Done to apply.", "");
    renderResultTable();
    const firstInput = resultStatsBody?.querySelector("input[data-inline-edit]");
    firstInput?.focus();
  }

  function startInlineEditNewRun() {
    const selectedProfile = getSelectedProfile();
    const seed = selectedProfile?.level0Stats
      ? normalizeLevel0StatsForRun(selectedProfile.level0Stats)
      : normalizeLevel0StatsForRun({});
    const preview = buildPreviewFromDraft(seed);
    if (!preview) {
      setStatus("Select race/profession before adding a manual run.", "error");
      return;
    }
    runHistory.push({
      label: `Run ${runHistory.length + 1} (manual)`,
      build: preview,
      status: "manual",
      sourceKind: "manual",
    });
    inlineEditState.active = true;
    inlineEditState.runIndex = runHistory.length - 1;
    inlineEditState.draftLevel0Stats = { ...seed };
    inlineEditState.draftRawValues = Object.fromEntries(
      Object.entries(seed).map(([key, value]) => [key, String(value)])
    );
    setInlineEditStatus("Editing manual run inline. Click Done to apply.", "");
    renderResultTable();
    const firstInput = resultStatsBody?.querySelector("input[data-inline-edit]");
    firstInput?.focus();
  }

  function updateInlineEditDraft(statKey, rawValue) {
    if (!inlineEditState.active || inlineEditState.runIndex < 0) return;
    if (!Object.prototype.hasOwnProperty.call(inlineEditState.draftRawValues || {}, statKey)) return;
    inlineEditState.draftRawValues[statKey] = String(rawValue ?? "");
    refreshInlineEditPreview();
  }

  function refreshInlineEditPreview() {
    if (!inlineEditState.active || inlineEditState.runIndex < 0) return false;
    const rawValues = inlineEditState.draftRawValues || {};
    const nextLevel0Stats = {};
    for (const stat of (data.stats || [])) {
      const key = stat.key;
      const raw = String(rawValues[key] ?? "").trim();
      if (raw === "") {
        setInlineEditStatus(`Enter a value for ${stat.abbr}.`, "error");
        return false;
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        setInlineEditStatus(`${stat.abbr} must be a number.`, "error");
        return false;
      }
      nextLevel0Stats[key] = Math.trunc(parsed);
    }

    inlineEditState.draftLevel0Stats = { ...nextLevel0Stats };
    const preview = buildPreviewFromDraft(nextLevel0Stats);
    if (preview) {
      const editingRowTargets = resultStatsBody?.querySelectorAll("td[data-inline-target-stat]") || [];
      editingRowTargets.forEach((cell) => {
        const key = cell.dataset.inlineTargetStat;
        if (!key) return;
        cell.textContent = String(preview.metrics.finalStats[key]);
      });
      const totalsCell = resultStatsBody?.querySelector("td[data-inline-totals='true']");
      if (totalsCell) {
        totalsCell.innerHTML = `
          <div>PTP ${preview.metrics.ptp} / MTP ${preview.metrics.mtp}</div>
          <div class="optimizer-totals-sub">Start PTP ${preview.metrics.startPtp} / Start MTP ${preview.metrics.startMtp}</div>
          <div class="optimizer-totals-sub">Total Stats ${preview.metrics.overall}</div>
        `;
      }
    }

    const params = buildSolveParams();
    const startStats = toBaseStartFromPrimeIncluded(nextLevel0Stats);
    const evaluated = logic.evaluateBuild({
      ...params,
      startStats,
    });

    if (!evaluated.ok) {
      const reasons = evaluated.validation?.errors?.join(" ") || evaluated.reason || "Inline edit is invalid.";
      setInlineEditStatus(reasons, "error");
      return false;
    }

    setInlineEditStatus("Inline edit is valid.", "ok");
    return true;
  }

  function applyInlineDraftToRun() {
    if (!refreshInlineEditPreview()) return false;
    const nextLevel0Stats = inlineEditState.draftLevel0Stats;
    inlineEditState.draftRawValues = Object.fromEntries(
      Object.entries(nextLevel0Stats).map(([key, value]) => [key, String(value)])
    );
    const params = buildSolveParams();
    const startStats = toBaseStartFromPrimeIncluded(nextLevel0Stats);
    const evaluated = logic.evaluateBuild({
      ...params,
      startStats,
    });
    runHistory[inlineEditState.runIndex].build = evaluated;
    return true;
  }

  function finishInlineEdit() {
    if (!inlineEditState.active) return;
    if (!applyInlineDraftToRun()) return;
    inlineEditState.active = false;
    inlineEditState.runIndex = -1;
    inlineEditState.draftLevel0Stats = null;
    inlineEditState.draftRawValues = null;
    setInlineEditStatus("Done adjusting run.", "ok");
    renderResultTable();
    updateCurrentLevelTpDelta();
  }

  function renderResult(result) {
    if (!result?.build) {
      resultSummary.textContent = result?.message || "No result for this run.";
      if (resultCurrentLevelDelta) resultCurrentLevelDelta.textContent = "";
      if (!inlineEditState.active) setInlineEditStatus("");
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
      : (result.status === "failed_constraints"
        ? "Unable to Find Solution, try more time or relax constraints."
        : (result.status === "best_found" ? "Best found (not guaranteed optimal)." : "Best found so far (not proven optimal)."));
    const primeSummaryHtml = ((build.metrics.primeKeys || [])
      .map((key) => (data.stats || []).find((stat) => stat.key === key))
      .filter(Boolean)
      .map((stat) => renderStatAbbr(stat.abbr, stat.key))
      .join(" ")) || "None";
    const runDescriptor = result.status === "failed_constraints"
      ? `Best attempt: Run ${runHistory.length}`
      : `Latest run: Run ${runHistory.length}`;
    resultSummary.innerHTML = `${statusText} ${runDescriptor}. Prime stats: ${primeSummaryHtml}.`;

    resultTotals.textContent = result.status === "failed_constraints"
      ? `Best attempt added as Run ${runHistory.length}. Start values are level-0 stats (prime bonuses already included).`
      : `Run ${runHistory.length} added. Start values are level-0 stats (prime bonuses already included).`;
    updateCurrentLevelTpDelta();
    if (!inlineEditState.active) setInlineEditStatus("");
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
    });
  }

  function canResumeWithCurrentInputs() {
    if (!resumeContext?.canResume) return false;
    const params = buildSolveParams();
    return createSolverSignature(params) === resumeContext.signature;
  }

  function updateResumeAvailability() {
    const available = canResumeWithCurrentInputs();
    if (resumeSolverBtn) resumeSolverBtn.disabled = runningSolverState.active || !available;
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
    const selectedMode = solverModeSelect?.value || "constraint_free_auto";
    const mode = selectedMode === "exact" ? "exact" : "fast";
    const mtpWeightPct = logic.clamp(logic.toInt(tpBiasSlider?.value, 50), 0, 100);
    const objectivePreset = logic.buildObjectivePresetFromBias(mtpWeightPct);

    return {
      mode,
      selectedMode,
      data,
      profileLogic,
      constraints: constraintsFromInputs(),
      raceName: (data.races || []).find((entry) => entry.key === raceSelect.value)?.name || "Human",
      profession: professionSelect.value,
      targetLevel: logic.toInt(targetLevelInput.value, 0),
      targetExperience: -1,
      minimums: minimumsFromInputs(),
      objectivePreset,
      maxSeconds: Math.max(0.1, Number(maxSecondsInput?.value || config.solverDefaults.maxSeconds)),
      fastRestarts: config.solverDefaults.fastRestarts,
      fastIterations: config.solverDefaults.fastIterations,
      iterationSliceSeconds: 0.25,
      maxElapsedSeconds: Math.max(0.1, Number(maxSecondsInput?.value || config.solverDefaults.maxSeconds)),
      onProgress: (progress) => {
        const elapsed = (progress.elapsedMs / 1000).toFixed(2);
        const eta = progress.etaSeconds == null || !Number.isFinite(progress.etaSeconds) || progress.etaSeconds > 86400
          ? "ETA unknown"
          : `ETA ~${Math.max(0, progress.etaSeconds).toFixed(1)}s`;
        solverProgress.textContent = `Progress: ${progress.nodes.toLocaleString()} nodes, ${progress.leaves.toLocaleString()} leaves, elapsed ${elapsed}s, ${eta}.`;
      },
    };
  }

  function setSolverControlsForRun(isRunning) {
    runningSolverState.active = isRunning;
    if (!isRunning) runningSolverState.stopRequested = false;
    setUiLockedForRun(isRunning);
    if (runSolverBtn) runSolverBtn.disabled = isRunning ? true : false;
    if (stopSolverBtn) stopSolverBtn.disabled = !isRunning;
    if (resumeSolverBtn) resumeSolverBtn.disabled = isRunning || !canResumeWithCurrentInputs();
  }

  function setUiLockedForRun(isRunning) {
    const scope = document.querySelector("main.calculator");
    if (!scope) return;
    scope.classList.toggle("solver-running", isRunning);

    if (isRunning) {
      const snapshot = new Map();
      const controls = scope.querySelectorAll("input, select, button, textarea");
      controls.forEach((control) => {
        if (!(control instanceof HTMLInputElement
          || control instanceof HTMLSelectElement
          || control instanceof HTMLButtonElement
          || control instanceof HTMLTextAreaElement)) return;
        if (control.id === "stopSolver") return;
        snapshot.set(control, Boolean(control.disabled));
        control.disabled = true;
      });
      runningSolverState.lockSnapshot = snapshot;
      return;
    }

    const snapshot = runningSolverState.lockSnapshot;
    if (snapshot instanceof Map) {
      snapshot.forEach((wasDisabled, control) => {
        if (control && control.isConnected) {
          control.disabled = wasDisabled;
        }
      });
    }
    runningSolverState.lockSnapshot = null;
  }

  function bestSummaryText(result) {
    if (!result?.build?.metrics) return "No best build yet.";
    const m = result.build.metrics;
    const order = ["str", "con", "dex", "agi", "dis", "aur", "log", "int", "wis", "inf"];
    const finalStats = order
      .map((key) => `${key.toUpperCase()} ${logic.toInt(m.finalStats?.[key], 0)}`)
      .join(", ");
    return `Current best: total stats ${m.overall}, PTP ${m.ptp}, MTP ${m.mtp}. Final stats: ${finalStats}.`;
  }

  function setSolverProgressLines(line1, line2, line3) {
    if (!solverProgress) return;
    solverProgress.innerHTML = `${line1}<br>${line2}<br>${line3}`;
  }

  function buildIterationParams(baseParams, iteration, bestResult) {
    const params = {
      ...baseParams,
      onProgress: baseParams.onProgress,
    };
    if (bestResult?.build?.startStats) {
      params.seedStartStats = { ...bestResult.build.startStats };
    }
    if (bestResult?.build?.ok && baseParams.mode === "exact") {
      params.initialBestBuild = bestResult.build;
    }

    params.maxSeconds = Math.max(0.1, Number(baseParams.maxSeconds || 1));
    return params;
  }

  function finalizeIterativeSolve(statusText, tone = "ok") {
    const best = runningSolverState.bestResult;
    setSolverControlsForRun(false);
    try {
      if (best?.build) {
        best._label = `Run ${runHistory.length + 1}`;
        renderResult(best);
        const canResume = best.status === "timeout" || (best.status === "best_found" && !best.provenOptimal);
        resumeContext = {
          signature: createSolverSignature(runningSolverState.paramsBase),
          canResume,
          mode: runningSolverState.paramsBase?.mode || "fast",
          bestStartStats: best?.build?.startStats ? { ...best.build.startStats } : null,
          bestBuild: best?.build?.ok ? best.build : null,
        };
      }
      setStatus(statusText, tone);
      updateResumeAvailability();
    } catch (error) {
      console.error(error);
      setStatus(`Solver finished, but UI update failed: ${error?.message || error}`, "error");
      updateResumeAvailability();
    }
  }

  function runIterativeStep() {
    if (!runningSolverState.active) return;
    if (runningSolverState.stopRequested) {
      const elapsed = ((performance.now() - runningSolverState.startedAtMs) / 1000).toFixed(2);
      finalizeIterativeSolve(`Stopped after ${elapsed}s. ${bestSummaryText(runningSolverState.bestResult)}`, "ok");
      return;
    }

    runningSolverState.iteration += 1;
    const params = buildIterationParams(
      runningSolverState.paramsBase,
      runningSolverState.iteration,
      runningSolverState.bestResult
    );
    const result = logic.solve(params);
    if (runningSolverState.mode === "exact" && result?.status === "infeasible") {
      const elapsedNow = ((performance.now() - runningSolverState.startedAtMs) / 1000).toFixed(2);
      const reason = "Unable to Find Solution, try more time or relax constraints.";
      setSolverProgressLines(
        `Solve w/ Constraints iteration ${runningSolverState.iteration}, elapsed ${elapsedNow}s`,
        result?.build?.metrics
          ? `Total stats ${result.build.metrics.overall}, PTP ${result.build.metrics.ptp}, MTP ${result.build.metrics.mtp}`
          : "Total stats --, PTP --, MTP --",
        result?.build?.metrics
          ? `Best attempt available. ${reason}`
          : reason
      );
      if (result?.build?.meetsMinimums) {
        runningSolverState.bestResult = result;
        runningSolverState.bestResult.status = "failed_constraints";
      } else if (runningSolverState.bestResult?.build) {
        runningSolverState.bestResult.status = "failed_constraints";
      }
      finalizeIterativeSolve(`${reason} (${elapsedNow}s)`, "error");
      return;
    }
    const validBuild = result?.build?.meetsMinimums ? result.build : null;
    const improved = Boolean(
      validBuild && (!runningSolverState.bestResult?.build
        || logic.compareVectors(validBuild.vector, runningSolverState.bestResult.build.vector) > 0)
    );
    if (improved) {
      runningSolverState.bestResult = { ...result, build: validBuild };
      runningSolverState.noImproveStreak = 0;
    } else if (!runningSolverState.bestResult && result?.build) {
      runningSolverState.bestResult = result;
      runningSolverState.noImproveStreak = 0;
    } else {
      runningSolverState.noImproveStreak += 1;
    }

    const elapsed = ((performance.now() - runningSolverState.startedAtMs) / 1000).toFixed(2);
    const elapsedSeconds = Number(elapsed);
    const modeName = runningSolverState.modeLabel || (runningSolverState.mode === "exact" ? "Exact" : "Fast");
    const best = runningSolverState.bestResult?.build?.metrics || null;
    const line1 = `${modeName} iteration ${runningSolverState.iteration}, elapsed ${elapsed}s${improved ? " (improved)" : ""}`;
    const line2 = best
      ? `Total stats ${best.overall}, PTP ${best.ptp}, MTP ${best.mtp}`
      : "Total stats --, PTP --, MTP --";
    const line3 = best
      ? `STR ${best.finalStats.str} CON ${best.finalStats.con} DEX ${best.finalStats.dex} AGI ${best.finalStats.agi} DIS ${best.finalStats.dis} AUR ${best.finalStats.aur} LOG ${best.finalStats.log} INT ${best.finalStats.int} WIS ${best.finalStats.wis} INF ${best.finalStats.inf}`
      : "No best build yet";
    setSolverProgressLines(line1, line2, line3);

    if (runningSolverState.mode === "exact" && result?.provenOptimal) {
      runningSolverState.bestResult = result;
      finalizeIterativeSolve(`Done in ${elapsed}s. Optimal solution proven.`, "ok");
      return;
    }

    if (runningSolverState.mode === "exact"
      && Number.isFinite(runningSolverState.maxElapsedSeconds)
      && runningSolverState.maxElapsedSeconds > 0
      && elapsedSeconds >= runningSolverState.maxElapsedSeconds) {
      if (runningSolverState.bestResult?.build && !runningSolverState.bestResult.build.meetsMinimums) {
        runningSolverState.bestResult.status = "failed_constraints";
        finalizeIterativeSolve(
          `Unable to Find Solution, try more time or relax constraints. Done in ${elapsed}s. Reached max seconds (${runningSolverState.maxElapsedSeconds}).`,
          "error"
        );
      } else {
        finalizeIterativeSolve(`Done in ${elapsed}s. Reached max seconds (${runningSolverState.maxElapsedSeconds}).`, "ok");
      }
      return;
    }

    setTimeout(runIterativeStep, 0);
  }

  function setAllFinalMinStats(value) {
    const finalTarget = logic.clamp(logic.toInt(value, 0), 0, 100);
    minFinalStatsBody?.querySelectorAll("input[data-min-final]").forEach((input) => {
      input.value = String(finalTarget);
    });
  }

  function buildConstraintFreeBounds(finalMin) {
    const minStartStats = {};
    const maxStartStats = {};
    const minFinalStats = {};
    (data.stats || []).forEach((stat) => {
      const key = stat.key;
      const floor = getLevel0FloorByKey(key);
      const minSuggested = computeSuggestedStartForTarget(key, finalMin, floor);
      const maxSuggestedRaw = computeSuggestedStartForTarget(key, 100, floor);
      const maxSuggested = Math.max(minSuggested, maxSuggestedRaw);
      minStartStats[key] = minSuggested;
      maxStartStats[key] = maxSuggested;
      minFinalStats[key] = finalMin;
    });
    return { minStartStats, maxStartStats, minFinalStats };
  }

  function runSolver(options = {}) {
    const resume = Boolean(options.resume);
    solverProgress.textContent = "";
    const params = buildSolveParams();
    if (!resume && params.selectedMode === "constraint_free_auto") {
      runSajehnAlgorithm();
      return;
    }

    if (!params.profession) {
      setStatus("Select a profession first.", "error");
      return;
    }
    if (runningSolverState.active) {
      setStatus("Solver is already running. Stop it before starting a new run.", "error");
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

    runningSolverState.mode = params.mode;
    runningSolverState.modeLabel = params.mode === "exact" ? "Solve w/ Constraints" : "Fast";
    runningSolverState.maxElapsedSeconds = Number(params.maxElapsedSeconds || 0);
    runningSolverState.iteration = 0;
    runningSolverState.noImproveStreak = 0;
    runningSolverState.startedAtMs = performance.now();
    runningSolverState.paramsBase = { ...params };
    runningSolverState.bestResult = params.initialBestBuild?.ok
      ? { status: "best_found", provenOptimal: false, build: params.initialBestBuild }
      : null;
    runningSolverState.stopRequested = false;
    setSolverControlsForRun(true);

    setStatus(
      resume ? "Resuming Solve w/ Constraints..." : "Running Solve w/ Constraints...",
      "ok"
    );
    setTimeout(runIterativeStep, 0);
  }

  function runSajehnAlgorithm() {
    if (runningSolverState.active) {
      setStatus("Solver is already running. Stop it before starting a new run.", "error");
      return;
    }

    const baseParams = buildSolveParams();
    baseParams.mode = "fast";
    baseParams.maxSeconds = 2;
    baseParams.objectivePreset = logic.buildConstraintFreeObjectivePresetFromBias(
      logic.clamp(logic.toInt(tpBiasSlider?.value, 50), 0, 100)
    );

    runningSolverState.mode = "constraint_free_auto";
    runningSolverState.modeLabel = "Constraint-Free Auto";
    runningSolverState.iteration = 0;
    runningSolverState.startedAtMs = performance.now();
    runningSolverState.paramsBase = { ...baseParams };
    runningSolverState.bestResult = null;
    runningSolverState.stopRequested = false;
    runningSolverState.noImproveStreak = 0;
    runningSolverState.constraint_free_autoCurrentMax = 100;
    runningSolverState.constraint_free_autoAttempts = 0;
    runningSolverState.constraint_free_autoLastDiagnostic = "";
    runningSolverState.constraint_free_autoOptimizing = false;
    runningSolverState.constraint_free_autoOptimizeIterations = 0;
    setSolverControlsForRun(true);
    setStatus("Running Constraint-Free Auto Solver...", "ok");
    setTimeout(runSajehnStep, 0);
  }

  function runSajehnStep() {
    if (!runningSolverState.active || runningSolverState.mode !== "constraint_free_auto") return;

    if (runningSolverState.stopRequested) {
      const elapsed = ((performance.now() - runningSolverState.startedAtMs) / 1000).toFixed(2);
      if (runningSolverState.bestResult?.build) {
        finalizeIterativeSolve(`Stopped after ${elapsed}s. ${bestSummaryText(runningSolverState.bestResult)}`, "ok");
      } else {
        setStatus(`Stopped after ${elapsed}s. No feasible build found yet.`, "ok");
        setSolverProgressLines(
          "Constraint-Free Auto Solver stopped",
          `Attempts: ${runningSolverState.constraint_free_autoAttempts}`,
          runningSolverState.constraint_free_autoLastDiagnostic || "No diagnostic."
        );
        setSolverControlsForRun(false);
      }
      return;
    }

    const finalMin = runningSolverState.constraint_free_autoCurrentMax;
    if (finalMin < 0) {
      setStatus("Constraint-Free Auto Solver could not find a feasible build from minimum final stat 100 down to 0.", "error");
      setSolverProgressLines(
        "Constraint-Free Auto Solver complete",
        `Attempts: ${runningSolverState.constraint_free_autoAttempts}`,
        runningSolverState.constraint_free_autoLastDiagnostic || "No diagnostic."
      );
      setSolverControlsForRun(false);
      return;
    }

    if (!runningSolverState.constraint_free_autoOptimizing) {
      runningSolverState.constraint_free_autoAttempts += 1;
    }
    const internalBounds = buildConstraintFreeBounds(finalMin);

    const elapsed = ((performance.now() - runningSolverState.startedAtMs) / 1000).toFixed(2);
    const baseLine = `Constraint-Free Auto Solver: minimum final stat ${finalMin}, attempt ${runningSolverState.constraint_free_autoAttempts}, elapsed ${elapsed}s`;

    const params = { ...runningSolverState.paramsBase };
    if (runningSolverState.bestResult?.build?.startStats) {
      params.seedStartStats = { ...runningSolverState.bestResult.build.startStats };
    }
    params.minimums = {
      minFinalStats: internalBounds.minFinalStats,
      minStartStats: internalBounds.minStartStats,
      maxStartStats: internalBounds.maxStartStats,
    };
    const result = logic.solve(params);

    if (!runningSolverState.constraint_free_autoOptimizing) {
      const line1 = `${baseLine} (search)`;
      if (result?.build?.meetsMinimums) {
        runningSolverState.bestResult = result;
        runningSolverState.noImproveStreak = 0;
        runningSolverState.constraint_free_autoOptimizing = true;
        runningSolverState.constraint_free_autoOptimizeIterations = 0;
        const best = result.build.metrics;
        setSolverProgressLines(
          line1,
          `Feasible found. Total stats ${best.overall}, PTP ${best.ptp}, MTP ${best.mtp}`,
          "Optimizing this minimum-final-stat target until 3 no-improve iterations."
        );
        setTimeout(runSajehnStep, 0);
        return;
      }

      runningSolverState.constraint_free_autoLastDiagnostic = result?.diagnostic || result?.message || "No feasible build.";
      setSolverProgressLines(line1, "No solution at this minimum-final-stat target.", runningSolverState.constraint_free_autoLastDiagnostic);
      runningSolverState.constraint_free_autoCurrentMax -= 1;
      setTimeout(runSajehnStep, 0);
      return;
    }

    runningSolverState.constraint_free_autoOptimizeIterations += 1;
    const validBuild = result?.build?.meetsMinimums ? result.build : null;
    const improved = Boolean(
      validBuild && (!runningSolverState.bestResult?.build
        || logic.compareVectors(validBuild.vector, runningSolverState.bestResult.build.vector) > 0)
    );
    if (improved) {
      runningSolverState.bestResult = { ...result, build: validBuild };
      runningSolverState.noImproveStreak = 0;
    } else {
      runningSolverState.noImproveStreak += 1;
    }

    if (validBuild) {
      const best = runningSolverState.bestResult?.build?.metrics || validBuild.metrics;
      const line1 = `${baseLine} (optimize ${runningSolverState.constraint_free_autoOptimizeIterations}, no-improve ${runningSolverState.noImproveStreak}/3${improved ? ", improved" : ""})`;
      const line2 = `Total stats ${best.overall}, PTP ${best.ptp}, MTP ${best.mtp}`;
      const line3 = `STR ${best.finalStats.str} CON ${best.finalStats.con} DEX ${best.finalStats.dex} AGI ${best.finalStats.agi} DIS ${best.finalStats.dis} AUR ${best.finalStats.aur} LOG ${best.finalStats.log} INT ${best.finalStats.int} WIS ${best.finalStats.wis} INF ${best.finalStats.inf}`;
      setSolverProgressLines(line1, line2, line3);
    } else {
      runningSolverState.constraint_free_autoLastDiagnostic = result?.diagnostic || result?.message || "No feasible build.";
      setSolverProgressLines(
        `${baseLine} (optimize ${runningSolverState.constraint_free_autoOptimizeIterations}, no-improve ${runningSolverState.noImproveStreak}/3)`,
        validBuild ? "No improvement on this iteration." : "No feasible improvement on this iteration.",
        runningSolverState.constraint_free_autoLastDiagnostic
      );
    }

    if (runningSolverState.noImproveStreak >= 3) {
      finalizeIterativeSolve(
        `Constraint-Free Auto Solver optimized minimum final stat ${finalMin} in ${elapsed}s (stopped after 3 no-improve iterations).`,
        "ok"
      );
      return;
    }

    setTimeout(runSajehnStep, 0);
  }

  function deleteRun(runIndex) {
    if (runIndex < 0 || runIndex >= runHistory.length) return;
    const [removed] = runHistory.splice(runIndex, 1);
    if (inlineEditState.active) {
      if (inlineEditState.runIndex === runIndex) {
        inlineEditState.active = false;
        inlineEditState.runIndex = -1;
        inlineEditState.draftLevel0Stats = null;
        setInlineEditStatus("");
      } else if (inlineEditState.runIndex > runIndex) {
        inlineEditState.runIndex -= 1;
      }
    }
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
  stopSolverBtn?.addEventListener("click", () => {
    if (!runningSolverState.active) return;
    runningSolverState.stopRequested = true;
  });
  resumeSolverBtn?.addEventListener("click", () => runSolver({ resume: true }));
  maxSecondsInput?.addEventListener("input", updateResumeAvailability);
  solverModeSelect?.addEventListener("change", () => {
    updateSolverModeUI();
    updateResumeAvailability();
  });
  clearMinFinalStatsBtn?.addEventListener("click", clearMinimumFinalStats);
  applyFinalAllMinStatBtn?.addEventListener("click", applyFinalAllMinStat);
  copySuggestedRangeBtn?.addEventListener("click", copySuggestedRangeToBounds);
  professionSelect?.addEventListener("change", () => {
    renderMinimumFinalStatsInputs({ resetToDefaults: true });
    renderPrimeSummary();
    renderStatInfoGrid();
    renderStartConstraintInputs({ resetToDefaults: true });
    updateStartConstraintWarning();
    updateSajehnAvailability();
    updateResumeAvailability();
  });
  raceSelect?.addEventListener("change", () => {
    renderMinimumFinalStatsInputs({ resetToDefaults: true });
    renderStartConstraintInputs({ resetToDefaults: true });
    updateStartConstraintWarning();
    updateSajehnAvailability();
    updateResumeAvailability();
  });
  targetLevelInput?.addEventListener("input", () => {
    updateTargetLevelLabels();
    renderStartConstraintInputs({ resetToDefaults: false });
    updateStartConstraintWarning();
    updateSajehnAvailability();
    updateResumeAvailability();
    renderResultTable();
  });
  alsoShowLevelInput?.addEventListener("input", () => {
    renderResultTable();
  });
  tpBiasSlider?.addEventListener("input", () => {
    updateTpBiasLabel();
    updateResumeAvailability();
  });

  profileSelect.addEventListener("change", () => {
    const value = profileSelect.value || "";
    if (value) localStorage.setItem(storage.SELECTED_PROFILE_KEY, value);
    else localStorage.removeItem(storage.SELECTED_PROFILE_KEY);
    applySelectedProfileFromPicker();
    updateCurrentLevelTpDelta();
  });

  profileLoad.addEventListener("click", () => {
    applySelectedProfileFromPicker();
    updateCurrentLevelTpDelta();
  });

  initializeStaticInputs();
  minFinalStatsBody?.addEventListener("input", () => {
    autoSelectConstraintSolverIfNeeded();
    renderStartConstraintInputs();
    updateFinalFromCurrentBoundsRows();
    updateStartConstraintWarning();
    updateSajehnAvailability();
    updateResumeAvailability();
  });
  startConstraintMinBody?.addEventListener("input", () => {
    autoSelectConstraintSolverIfNeeded();
    updateFinalFromCurrentBoundsRows();
    updateStartConstraintWarning();
    updateSajehnAvailability();
    updateResumeAvailability();
  });
  startConstraintMaxBody?.addEventListener("input", () => {
    autoSelectConstraintSolverIfNeeded();
    updateFinalFromCurrentBoundsRows();
    updateStartConstraintWarning();
    updateSajehnAvailability();
    updateResumeAvailability();
  });
  startConstraintMinBody?.addEventListener("change", (event) => {
    const input = event.target.closest("input[data-start-min]");
    if (!input) return;
    enforceStartConstraintPair("min", input.dataset.startMin);
    updateFinalFromCurrentBoundsRows();
    updateStartConstraintWarning();
    updateResumeAvailability();
  });
  startConstraintMaxBody?.addEventListener("change", (event) => {
    const input = event.target.closest("input[data-start-max]");
    if (!input) return;
    enforceStartConstraintPair("max", input.dataset.startMax);
    updateFinalFromCurrentBoundsRows();
    updateStartConstraintWarning();
    updateResumeAvailability();
  });
  resultStatsHead.addEventListener("click", (event) => {
    const doneButton = event.target.closest(".optimizer-inline-done");
    if (doneButton) {
      finishInlineEdit();
      return;
    }

    const adjustButton = event.target.closest(".optimizer-copy-run");
    if (adjustButton) {
      const runIndex = logic.toInt(adjustButton.dataset.runIndex, -1);
      if (runIndex < 0) return;
      startInlineEditCopy(runIndex);
      return;
    }

    const deleteButton = event.target.closest(".optimizer-delete-run");
    if (deleteButton) {
      const runIndex = logic.toInt(deleteButton.dataset.runIndex, -1);
      if (runIndex < 0) return;
      deleteRun(runIndex);
    }
  });
  resultStatsBody.addEventListener("input", (event) => {
    const input = event.target.closest("input[data-inline-edit]");
    if (!input) return;
    const key = input.dataset.inlineEdit;
    updateInlineEditDraft(key, input.value);
  });
  resultStatsBody.addEventListener("keydown", (event) => {
    const input = event.target.closest("input[data-inline-edit]");
    if (!input) return;
    if (event.key === "Enter") {
      event.preventDefault();
      finishInlineEdit();
    }
  });
  addManualRunBtn?.addEventListener("click", startInlineEditNewRun);
  addProfileRunBtn?.addEventListener("click", () => {
    const profile = getSelectedProfile();
    if (!profile) return;
    appendProfileRun(profile);
  });
  updateFinalFromCurrentBoundsRows();
  updateStartConstraintWarning();
  initializeProfileSelect();
  applySelectedProfileFromPicker();
  updateCurrentLevelTpDelta();
  updateSajehnAvailability();
  updateResumeAvailability();
  bindFloatingTooltips();
})();
