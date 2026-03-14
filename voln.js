(function () {
  const storage = globalThis.GS4Storage;
  const volnData = globalThis.GS4_VOLN_DATA;

  if (!storage) throw new Error("GS4Storage is not loaded. Ensure shared.js is loaded before voln.js.");
  if (!volnData) throw new Error("GS4_VOLN_DATA is not loaded. Ensure data/societies/voln.js is loaded before voln.js.");

  const status = document.getElementById("volnStatus");
  const currentStepEl = document.getElementById("volnCurrentStep");
  const currentFavorEl = document.getElementById("volnCurrentFavor"); // may be null if summary card removed
  const stepProgressEl = document.getElementById("volnStepProgress");
  const characterNameEl = document.getElementById("volnCharacterName");
  const lastUpdatedEl = document.getElementById("volnLastUpdated");
  const remainingFavorEl = document.getElementById("volnRemainingFavor");
  const historyTable = document.getElementById("volnHistoryTable");
  const abilityTable = document.getElementById("volnAbilityTable");
  const currentFavorInput = document.getElementById("volnCurrentFavorInput");
  const atLastStepInput = document.getElementById("volnAtLastStepInput");
  const progressTrack = document.getElementById("volnProgressTrack");
  const progressFill = document.getElementById("volnProgressFill");
  const totalNeededEl = document.getElementById("volnTotalNeeded");
  const currentLevelInput = document.getElementById("volnCurrentLevelInput");
  const currentRankInput = document.getElementById("volnCurrentRankInput");
  const whatIfLevelInput = document.getElementById("volnWhatIfLevelInput");
  const whatIfRankInput = document.getElementById("volnWhatIfRankInput");
  const profileLoadBtn = document.getElementById("volnProfileLoad");
  const METRIC_LABELS = {
    non_bolt_ds: "DS",
    bolt_ds: "Bolt DS",
    as_physical: "AS",
    as_bolt: "Bolt AS",
    td_spiritual: "Spiritual TD",
    td_elemental: "Elemental TD",
    td_mental: "Mental TD",
    cs_spiritual: "Spiritual CS",
    cs_elemental: "Elemental CS",
    cs_mental: "Mental CS",
    cs_sorcerer: "Sorcerer CS",
    cs_bard: "Bard CS",
    uaf: "UAF",
  };

  function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString() : "—";
  }

  function getSelectedProfile() {
    const profiles = storage.loadProfiles();
    return storage.findProfile(profiles, localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "");
  }

  function cloneFavorState(favor) {
    if (!favor || typeof favor !== "object") {
      return { current: null, atLastStepChange: null, history: [], lastUpdated: "" };
    }
    return {
      current: Number.isFinite(Number(favor.current)) ? Math.max(0, Math.trunc(Number(favor.current))) : null,
      atLastStepChange: Number.isFinite(Number(favor.atLastStepChange))
        ? Math.max(0, Math.trunc(Number(favor.atLastStepChange)))
        : null,
      history: Array.isArray(favor.history) ? favor.history.map((entry) => ({ ...entry })) : [],
      lastUpdated: String(favor.lastUpdated || ""),
    };
  }

  function calculateNextStepCost(level, step) {
    const nextStep = Math.min(step + 1, Number(volnData.max_rank) || 26);
    if (nextStep <= step) return null;
    const nextAbility = Array.isArray(volnData.abilities)
      ? volnData.abilities.find((ability) => Number(ability.rank_required) === nextStep)
      : null;
    const advancementCost = nextAbility?.advancement_cost;
    if (!advancementCost) return null;
    const base = Number(advancementCost.base) || 0;
    const factor = Number(advancementCost.factor) || 0;
    return Math.ceil(base + ((level * level * factor) / 3));
  }

  function calculateSymbolReturnCost(level) {
    const normalized = Math.max(3, Math.min(100, Math.trunc(Number(level) || 0)));
    return volnData?.favor?.base_favor_cost_by_level?.[normalized] || null;
  }

  function formatUseCost(value) {
    if (value == null) return "—";
    if (typeof value === "number") return formatNumber(value);
    return String(value);
  }

  function calculateUseCost(level, useCost) {
    if (!useCost || typeof useCost !== "object") return "—";
    const baseReturnCost = calculateSymbolReturnCost(level);
    switch (useCost.mode) {
      case "none":
        return "Free";
      case "symbol_return_table":
        return baseReturnCost == null ? "—" : baseReturnCost;
      case "fixed_range":
        return `${formatNumber(useCost.min)}-${formatNumber(useCost.max)}`;
      case "factor":
        if (!baseReturnCost) return "—";
        if (typeof useCost.relative_cost_factor === "number") {
          return Math.ceil(baseReturnCost * useCost.relative_cost_factor);
        }
        if (useCost.relative_cost_factor && typeof useCost.relative_cost_factor === "object") {
          return Object.entries(useCost.relative_cost_factor)
            .map(([key, factor]) => `${key}: ${formatNumber(Math.ceil(baseReturnCost * Number(factor || 0)))}`)
            .join(" / ");
        }
        return "—";
      case "variable_factor":
        if (!baseReturnCost) return "—";
        return `${formatNumber(Math.ceil(baseReturnCost * Number(useCost.base_factor || 0)))}-${formatNumber(Math.ceil(baseReturnCost * Number(useCost.max_factor || useCost.base_factor || 0)))}`;
      case "variant_factor":
        if (!baseReturnCost) return "—";
        return Object.entries(useCost)
          .filter(([key]) => key !== "mode")
          .map(([key, factor]) => `${key}: ${formatNumber(Math.ceil(baseReturnCost * Number(factor || 0)))}`)
          .join(" / ");
      default:
        return "Varies";
    }
  }

  function escapeAttr(str) {
    return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/\n/g, "&#10;");
  }

  function explainUseCost(level, useCost) {
    if (!useCost || typeof useCost !== "object") return "";
    const baseReturnCost = calculateSymbolReturnCost(level);
    const baseLine = baseReturnCost != null ? `Symbol of Return cost at level ${level}: ${formatNumber(baseReturnCost)}` : "";
    let tip = "";
    switch (useCost.mode) {
      case "none":
        tip = "No favor cost"; break;
      case "symbol_return_table":
        tip = baseLine || "Base Symbol of Return cost by level"; break;
      case "fixed_range":
        tip = `Fixed cost: ${formatNumber(useCost.min)}-${formatNumber(useCost.max)}`; break;
      case "factor":
        if (typeof useCost.relative_cost_factor === "number") {
          tip = `${(useCost.relative_cost_factor * 100).toFixed(0)}% of Symbol of Return cost\n${baseLine}`;
        } else if (useCost.relative_cost_factor && typeof useCost.relative_cost_factor === "object") {
          const parts = Object.entries(useCost.relative_cost_factor)
            .map(([key, factor]) => `${key}: ${(Number(factor) * 100).toFixed(0)}%`);
          tip = `Factor of Symbol of Return cost:\n${parts.join(", ")}\n${baseLine}`;
        }
        break;
      case "variable_factor": {
        const base = (Number(useCost.base_factor || 0) * 100).toFixed(0);
        const max = (Number(useCost.max_factor || useCost.base_factor || 0) * 100).toFixed(0);
        tip = `${base}%-${max}% of Symbol of Return cost\n${baseLine}`;
        break;
      }
      case "variant_factor": {
        const parts = Object.entries(useCost)
          .filter(([key]) => key !== "mode")
          .map(([key, factor]) => `${key}: ${(Number(factor) * 100).toFixed(0)}%`);
        tip = `Factor of Symbol of Return cost:\n${parts.join(", ")}\n${baseLine}`;
        break;
      }
      default:
        tip = "Variable cost";
    }
    return escapeAttr(tip);
  }

  function resolveCombatPreview(ability, effectiveStep) {
    const totals = {};
    const rules = Array.isArray(ability?.dynamic_rules) ? ability.dynamic_rules : [];
    rules.forEach((rule) => {
      if (!rule || typeof rule !== "object") return;
      const metric = String(rule.metric || "");
      if (!metric || !(metric in METRIC_LABELS)) return;
      let amount = 0;
      if (rule.type === "per_rank") {
        amount = effectiveStep * Number(rule.amount_per_rank || 0);
      } else if (rule.type === "per_n_ranks") {
        const divisor = Math.max(1, Number(rule.divisor) || 1);
        amount = Math.floor(effectiveStep / divisor) * Number(rule.amount_per_step || 0);
      }
      if (Number.isFinite(Number(rule.max_total))) {
        amount = Math.min(amount, Number(rule.max_total));
      }
      if (amount > 0) totals[metric] = (totals[metric] || 0) + amount;
    });
    const parts = Object.entries(METRIC_LABELS)
      .map(([metric, label]) => (totals[metric] ? `+${formatNumber(totals[metric])} ${label}` : null))
      .filter(Boolean);
    return parts.length ? parts.join(" / ") : "—";
  }

  function renderAbilities(currentLevelValue, currentStepValue, whatIfLevelValue, whatIfStepValue) {
    if (!abilityTable) return;
    abilityTable.innerHTML = "";
    const abilities = Array.isArray(volnData?.abilities) ? volnData.abilities : [];
    abilities.forEach((ability) => {
      const owned = currentStepValue >= Number(ability.rank_required || 0);
      const currentEffectiveStep = owned ? currentStepValue : Math.max(0, Math.trunc(Number(ability.rank_required) || 0));
      const whatIfOwned = whatIfStepValue >= Number(ability.rank_required || 0);
      const whatIfEffectiveStep = whatIfOwned ? whatIfStepValue : Math.max(0, Math.trunc(Number(ability.rank_required) || 0));
      const row = document.createElement("tr");
      row.className = owned ? "voln-owned-row" : "voln-locked-row";
      const currentTip = explainUseCost(currentLevelValue, ability.use_cost);
      const whatIfTip = explainUseCost(whatIfLevelValue, ability.use_cost);
      row.innerHTML = `
        <td>${formatNumber(ability.rank_required)}</td>
        <td><strong>${ability.name}</strong></td>
        <td>${owned ? "Owned" : "Locked"}</td>
        <td>${ability.effect_summary || "—"}</td>
        <td>${ability.combat_relevant ? `${resolveCombatPreview(ability, currentEffectiveStep)}${owned ? "" : ` (at step ${formatNumber(currentEffectiveStep)})`}` : "—"}</td>
        <td>${ability.combat_relevant ? `${resolveCombatPreview(ability, whatIfEffectiveStep)}${whatIfOwned ? "" : ` (at step ${formatNumber(whatIfEffectiveStep)})`}` : "—"}</td>
        <td title="${currentTip}">${formatUseCost(calculateUseCost(currentLevelValue, ability.use_cost))}</td>
        <td title="${whatIfTip}">${formatUseCost(calculateUseCost(whatIfLevelValue, ability.use_cost))}</td>
      `;
      abilityTable.appendChild(row);
    });
  }

  function renderHistory(history) {
    historyTable.innerHTML = "";
    const entries = Array.isArray(history) ? history.slice().reverse() : [];
    if (!entries.length) {
      const row = document.createElement("tr");
      row.innerHTML = '<td colspan="4">No Voln history captured yet.</td>';
      historyTable.appendChild(row);
      return;
    }
    entries.forEach((entry) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${formatNumber(entry.step)}</td>
        <td>${entry.previousStep == null ? "—" : formatNumber(entry.previousStep)}</td>
        <td>${formatNumber(entry.favor)}</td>
        <td>${entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "—"}</td>
      `;
      historyTable.appendChild(row);
    });
  }

  // Load profile data into input boxes. Does NOT recalculate.
  function loadProfileIntoInputs() {
    const profile = getSelectedProfile();
    if (!profile) {
      characterNameEl.textContent = "No profile loaded";
      status.textContent = "Enter values manually or select a profile from the header.";
      status.style.color = "";
      if (currentLevelInput) currentLevelInput.value = "";
      if (currentRankInput) currentRankInput.value = "";
      if (whatIfLevelInput) whatIfLevelInput.value = "";
      if (whatIfRankInput) whatIfRankInput.value = "";
      if (currentFavorInput) currentFavorInput.value = "";
      if (atLastStepInput) atLastStepInput.value = "";
      if (lastUpdatedEl) lastUpdatedEl.textContent = "No captured favor yet";
      renderHistory([]);
      return;
    }

    const society = profile.society || {};
    const favor = society.favor || null;
    const isVoln = String(society.key || "") === "voln";
    const level = Math.max(0, Math.trunc(Number(profile.level) || 0));
    const step = isVoln ? Math.max(0, Math.trunc(Number(society.rank) || 0)) : 0;

    characterNameEl.textContent = profile.name || "Loaded profile";
    if (currentLevelInput) currentLevelInput.value = String(level);
    if (currentRankInput) currentRankInput.value = String(step);
    if (whatIfLevelInput) whatIfLevelInput.value = String(level);
    if (whatIfRankInput) whatIfRankInput.value = String(step);

    if (!isVoln) {
      status.textContent = `${profile.name || "Loaded profile"} is not a Voln character. You can still enter values manually.`;
      status.style.color = "";
      if (lastUpdatedEl) lastUpdatedEl.textContent = "Not a Voln character";
      if (currentFavorInput) currentFavorInput.value = "";
      if (atLastStepInput) atLastStepInput.value = "";
      return;
    }

    const currentFavorValue = favor && Number.isFinite(Number(favor.current)) ? Math.max(0, Math.trunc(Number(favor.current))) : null;
    const atLastStepValue = favor && Number.isFinite(Number(favor.atLastStepChange)) ? Math.max(0, Math.trunc(Number(favor.atLastStepChange))) : null;

    if (lastUpdatedEl) lastUpdatedEl.textContent = favor?.lastUpdated ? `Last updated ${new Date(favor.lastUpdated).toLocaleString()}` : "No captured favor yet";
    if (currentFavorInput) currentFavorInput.value = currentFavorValue == null ? "" : String(currentFavorValue);
    if (atLastStepInput) atLastStepInput.value = atLastStepValue == null ? "" : String(atLastStepValue);

    status.textContent = favor
      ? `Showing favor data for ${profile.name || "selected profile"}.`
      : "No favor snapshot stored. Run ;gs4tools sync or ;gs4tools collect voln.";
    status.style.color = "";

    renderHistory(favor?.history || []);
  }

  // Recalculate summary cards and ability table from current input values.
  function recalculate() {
    const currentLevel = Math.max(0, Math.trunc(Number(currentLevelInput?.value) || 0));
    const currentStep = Math.max(0, Math.trunc(Number(currentRankInput?.value) || 0));
    const whatIfLevel = Math.max(0, Math.trunc(Number(whatIfLevelInput?.value) || currentLevel));
    const whatIfStep = Math.max(0, Math.trunc(Number(whatIfRankInput?.value) || currentStep));

    currentStepEl.textContent = String(currentStep);

    const rawFavor = String(currentFavorInput?.value || "").trim();
    const currentFavorValue = rawFavor !== "" && Number.isFinite(Number(rawFavor)) ? Math.max(0, Math.trunc(Number(rawFavor))) : null;
    const rawAtLast = String(atLastStepInput?.value || "").trim();
    const atLastStepValue = rawAtLast !== "" && Number.isFinite(Number(rawAtLast)) ? Math.max(0, Math.trunc(Number(rawAtLast))) : null;
    const sinceStepValue = currentFavorValue != null && atLastStepValue != null ? Math.max(0, currentFavorValue - atLastStepValue) : null;
    const nextCost = calculateNextStepCost(currentLevel, currentStep);
    const remaining = nextCost != null && sinceStepValue != null ? Math.max(0, nextCost - sinceStepValue) : null;

    if (currentFavorEl) currentFavorEl.textContent = formatNumber(currentFavorValue);
    if (stepProgressEl) {
      if (sinceStepValue != null && nextCost != null) {
        stepProgressEl.textContent = `${formatNumber(sinceStepValue)} / ${formatNumber(nextCost)}`;
      } else if (nextCost != null) {
        stepProgressEl.textContent = `— / ${formatNumber(nextCost)}`;
      } else {
        stepProgressEl.textContent = "—";
      }
    }
    if (progressTrack) {
      if (nextCost != null) {
        progressTrack.hidden = false;
        const pct = sinceStepValue != null ? Math.min(100, (sinceStepValue / nextCost) * 100) : 0;
        if (progressFill) progressFill.style.width = `${pct}%`;
      } else {
        progressTrack.hidden = true;
      }
    }
    if (totalNeededEl) {
      if (nextCost != null && atLastStepValue != null) {
        totalNeededEl.textContent = `Total favor needed: ${formatNumber(atLastStepValue + nextCost)}`;
      } else if (nextCost != null) {
        totalNeededEl.textContent = `Step cost: ${formatNumber(nextCost)}`;
      } else {
        totalNeededEl.textContent = "Max step reached";
      }
    }
    if (remainingFavorEl) {
      remainingFavorEl.textContent = remaining != null ? `${formatNumber(remaining)} remaining` : "";
    }

    renderAbilities(currentLevel, currentStep, whatIfLevel, whatIfStep);
  }

  const profileSaveBtn = document.getElementById("volnProfileSave");
  let loadedSnapshot = null;

  function currentInputSnapshot() {
    const rawFavor = String(currentFavorInput?.value || "").trim();
    const rawAtLastStep = String(atLastStepInput?.value || "").trim();
    return {
      level: Math.max(0, Math.trunc(Number(currentLevelInput?.value) || 0)),
      step: Math.max(0, Math.trunc(Number(currentRankInput?.value) || 0)),
      currentFavor: rawFavor === "" ? null : Math.max(0, Math.trunc(Number(rawFavor) || 0)),
      atLastStepChange: rawAtLastStep === "" ? null : Math.max(0, Math.trunc(Number(rawAtLastStep) || 0)),
    };
  }

  function snapshotsMatch(a, b) {
    return a.level === b.level && a.step === b.step && a.currentFavor === b.currentFavor && a.atLastStepChange === b.atLastStepChange;
  }

  function updateButtonStates() {
    if (!loadedSnapshot) {
      if (profileLoadBtn) { profileLoadBtn.disabled = true; profileLoadBtn.classList.remove("attention"); }
      if (profileSaveBtn) { profileSaveBtn.disabled = true; profileSaveBtn.classList.remove("success-attention"); }
      return;
    }
    const current = currentInputSnapshot();
    const changed = !snapshotsMatch(current, loadedSnapshot);
    if (profileLoadBtn) {
      profileLoadBtn.disabled = !changed;
      profileLoadBtn.classList.toggle("attention", changed);
    }
    if (profileSaveBtn) {
      profileSaveBtn.disabled = !changed;
      profileSaveBtn.classList.toggle("success-attention", changed);
    }
  }

  function saveProfileFromInputs() {
    const profile = getSelectedProfile();
    if (!profile) {
      status.textContent = "Select a profile before updating.";
      status.style.color = "#b42318";
      return;
    }
    const current = currentInputSnapshot();
    const profiles = storage.loadProfiles();
    const selected = storage.findProfile(profiles, profile.id);
    if (!selected) {
      status.textContent = "Selected profile could not be found in storage.";
      status.style.color = "#b42318";
      return;
    }

    const society = selected.society || {};
    const favor = cloneFavorState(society.favor);
    if (current.currentFavor != null) {
      favor.current = current.currentFavor;
    }
    if (current.atLastStepChange != null) {
      favor.atLastStepChange = current.atLastStepChange;
    }

    const nextProfile = {
      ...selected,
      level: current.level,
      society: { ...society, rank: current.step, favor },
    };
    const nextProfiles = profiles.map((entry) => (entry.id === selected.id ? nextProfile : entry));
    storage.saveProfiles(nextProfiles);
    localStorage.setItem(storage.SELECTED_PROFILE_KEY, selected.id);

    loadedSnapshot = { ...current };
    updateButtonStates();
    status.textContent = `Updated profile for ${selected.name || "selected profile"}.`;
    status.style.color = "#1f4e42";
    window.dispatchEvent(new CustomEvent("gs4:profile-saved"));
  }

  function flagReload() {
    if (profileLoadBtn) { profileLoadBtn.disabled = false; profileLoadBtn.classList.add("attention"); }
    if (profileSaveBtn) { profileSaveBtn.disabled = false; profileSaveBtn.classList.add("success-attention"); }
  }

  function doLoadProfile() {
    loadProfileIntoInputs();
    const profile = getSelectedProfile();
    if (profile) {
      const society = profile.society || {};
      const isVoln = String(society.key || "") === "voln";
      const favor = society.favor || null;
      loadedSnapshot = {
        level: Math.max(0, Math.trunc(Number(profile.level) || 0)),
        step: isVoln ? Math.max(0, Math.trunc(Number(society.rank) || 0)) : 0,
        currentFavor: favor && Number.isFinite(Number(favor.current))
          ? Math.max(0, Math.trunc(Number(favor.current)))
          : null,
        atLastStepChange: favor && Number.isFinite(Number(favor.atLastStepChange))
          ? Math.max(0, Math.trunc(Number(favor.atLastStepChange)))
          : null,
      };
    } else {
      loadedSnapshot = null;
    }
    recalculate();
    if (profileLoadBtn) { profileLoadBtn.disabled = true; profileLoadBtn.classList.remove("attention"); }
    if (profileSaveBtn) { profileSaveBtn.disabled = true; profileSaveBtn.classList.remove("success-attention"); }
  }

  // Initial load
  doLoadProfile();

  function onInputChange() {
    recalculate();
    updateButtonStates();
  }

  // Input changes recalculate and check for drift from profile
  currentLevelInput?.addEventListener("input", onInputChange);
  currentRankInput?.addEventListener("input", onInputChange);
  currentFavorInput?.addEventListener("input", onInputChange);
  atLastStepInput?.addEventListener("input", onInputChange);
  whatIfLevelInput?.addEventListener("input", recalculate);
  whatIfRankInput?.addEventListener("input", recalculate);

  // Profile load/save buttons
  profileLoadBtn?.addEventListener("click", doLoadProfile);
  profileSaveBtn?.addEventListener("click", saveProfileFromInputs);

  // Profile selection changes auto-load; external profile data changes flag reload
  window.addEventListener("storage", flagReload);
  window.addEventListener("gs4:profile-saved", flagReload);
  window.addEventListener("gs4:selected-profile-changed", doLoadProfile);
})();
