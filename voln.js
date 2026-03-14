(function () {
  const storage = globalThis.GS4Storage;
  const volnData = globalThis.GS4_VOLN_DATA;

  if (!storage) throw new Error("GS4Storage is not loaded. Ensure shared.js is loaded before voln.js.");
  if (!volnData) throw new Error("GS4_VOLN_DATA is not loaded. Ensure data/societies/voln.js is loaded before voln.js.");

  const profileSelect = document.getElementById("volnProfileSelect");
  const profileLoad = document.getElementById("volnProfileLoad");
  const status = document.getElementById("volnStatus");
  const currentStep = document.getElementById("volnCurrentStep");
  const currentFavor = document.getElementById("volnCurrentFavor");
  const sinceStep = document.getElementById("volnSinceStep");
  const nextStepCost = document.getElementById("volnNextStepCost");
  const characterName = document.getElementById("volnCharacterName");
  const lastUpdated = document.getElementById("volnLastUpdated");
  const atLastStepChange = document.getElementById("volnAtLastStepChange");
  const remainingFavor = document.getElementById("volnRemainingFavor");
  const historyTable = document.getElementById("volnHistoryTable");
  const abilityTable = document.getElementById("volnAbilityTable");
  const atLastStepInput = document.getElementById("volnAtLastStepInput");
  const atLastStepSave = document.getElementById("volnAtLastStepSave");
  const VOLN_RETURN_COSTS = {
    3: 4, 4: 6, 5: 9, 6: 12, 7: 15, 8: 19, 9: 23, 10: 28, 11: 34, 12: 40, 13: 46, 14: 53, 15: 61, 16: 69,
    17: 77, 18: 86, 19: 95, 20: 105, 21: 115, 22: 125, 23: 136, 24: 147, 25: 159, 26: 171, 27: 183, 28: 196,
    29: 209, 30: 223, 31: 237, 32: 251, 33: 266, 34: 281, 35: 297, 36: 313, 37: 329, 38: 346, 39: 363, 40: 380,
    41: 398, 42: 416, 43: 434, 44: 453, 45: 472, 46: 491, 47: 511, 48: 531, 49: 551, 50: 572, 51: 593, 52: 614,
    53: 635, 54: 657, 55: 679, 56: 702, 57: 724, 58: 747, 59: 771, 60: 794, 61: 818, 62: 842, 63: 867, 64: 891,
    65: 916, 66: 942, 67: 967, 68: 993, 69: 1019, 70: 1046, 71: 1072, 72: 1099, 73: 1127, 74: 1154, 75: 1182,
    76: 1210, 77: 1239, 78: 1267, 79: 1296, 80: 1325, 81: 1355, 82: 1384, 83: 1414, 84: 1445, 85: 1475, 86: 1506,
    87: 1537, 88: 1568, 89: 1600, 90: 1631, 91: 1663, 92: 1696, 93: 1728, 94: 1761, 95: 1794, 96: 1827, 97: 1861,
    98: 1895, 99: 1929, 100: 1963,
  };
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

  function loadProfiles() {
    return storage.loadProfiles();
  }

  function refreshProfileSelect() {
    const profiles = loadProfiles();
    const selectedId = localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "";
    profileSelect.innerHTML = '<option value="">Select from Profile</option>';
    profiles.forEach((profile) => {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.name;
      profileSelect.appendChild(option);
    });
    if (selectedId && profiles.some((profile) => profile.id === selectedId)) {
      profileSelect.value = selectedId;
    }
  }

  function getSelectedProfile() {
    const profiles = loadProfiles();
    return storage.findProfile(profiles, profileSelect.value || localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "");
  }

  function setEditControlsEnabled(enabled) {
    if (atLastStepInput) atLastStepInput.disabled = !enabled;
    if (atLastStepSave) atLastStepSave.disabled = !enabled;
  }

  function cloneFavorState(favor) {
    if (!favor || typeof favor !== "object") {
      return {
        current: null,
        atLastStepChange: null,
        history: [],
        lastUpdated: "",
      };
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

  function saveAtLastStepBaseline() {
    const profile = getSelectedProfile();
    if (!profile) {
      status.textContent = "Load a Voln profile before editing favor at the last step change.";
      status.style.color = "#b42318";
      return;
    }
    if (String(profile.society?.key || "") !== "voln") {
      status.textContent = "Only Voln profiles can store a favor changeover value.";
      status.style.color = "#b42318";
      return;
    }
    const rawValue = String(atLastStepInput?.value || "").trim();
    if (!rawValue) {
      status.textContent = "Enter a favor value to save for the last Voln step change.";
      status.style.color = "#b42318";
      return;
    }
    const baseline = Number(rawValue);
    if (!Number.isFinite(baseline) || baseline < 0) {
      status.textContent = "Favor at last step change must be a non-negative number.";
      status.style.color = "#b42318";
      return;
    }

    const profiles = loadProfiles();
    const selected = storage.findProfile(profiles, profile.id);
    if (!selected) {
      status.textContent = "Selected profile could not be found in storage.";
      status.style.color = "#b42318";
      return;
    }

    const currentFavorState = cloneFavorState(selected.society?.favor);
    const nextFavorState = {
      ...currentFavorState,
      atLastStepChange: Math.max(0, Math.trunc(baseline)),
    };
    const nextProfile = {
      ...selected,
      society: {
        ...selected.society,
        favor: nextFavorState,
      },
    };
    const nextProfiles = profiles.map((entry) => (entry.id === selected.id ? nextProfile : entry));
    storage.saveProfiles(nextProfiles);
    localStorage.setItem(storage.SELECTED_PROFILE_KEY, selected.id);
    status.textContent = "Updated favor at last step change for the selected profile.";
    status.style.color = "#1f4e42";
    renderProfile();
  }

  function calculateNextStepCost(profile, step) {
    const nextStep = Math.min(step + 1, Number(volnData.max_rank) || 26);
    if (nextStep <= step) return null;
    const nextAbility = Array.isArray(volnData.abilities)
      ? volnData.abilities.find((ability) => Number(ability.rank_required) === nextStep)
      : null;
    const advancementCost = nextAbility?.advancement_cost;
    if (!advancementCost) return null;
    const level = Math.max(0, Math.trunc(Number(profile?.level) || 0));
    const base = Number(advancementCost.base) || 0;
    const factor = Number(advancementCost.factor) || 0;
    return Math.ceil(base + ((level * level * factor) / 3));
  }

  function calculateSymbolReturnCost(level) {
    const normalized = Math.max(3, Math.min(100, Math.trunc(Number(level) || 0)));
    return VOLN_RETURN_COSTS[normalized] || null;
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

  function renderAbilities(profile) {
    if (!abilityTable) return;
    abilityTable.innerHTML = "";
    const abilities = Array.isArray(volnData?.abilities) ? volnData.abilities : [];
    const currentStepValue = Math.max(0, Math.trunc(Number(profile?.society?.rank) || 0));
    const levelValue = Math.max(0, Math.trunc(Number(profile?.level) || 0));
    if (!profile || String(profile.society?.key || "") !== "voln") {
      const row = document.createElement("tr");
      row.innerHTML = '<td colspan="6">Load a Voln profile to review symbol unlocks and favor costs.</td>';
      abilityTable.appendChild(row);
      return;
    }
    abilities.forEach((ability) => {
      const owned = currentStepValue >= Number(ability.rank_required || 0);
      const effectiveStep = owned ? currentStepValue : Math.max(0, Math.trunc(Number(ability.rank_required) || 0));
      const row = document.createElement("tr");
      row.className = owned ? "voln-owned-row" : "voln-locked-row";
      row.innerHTML = `
        <td>${formatNumber(ability.rank_required)}</td>
        <td><strong>${ability.name}</strong></td>
        <td>${owned ? "Owned" : "Locked"}</td>
        <td>${ability.effect_summary || "—"}</td>
        <td>${ability.combat_relevant ? `${resolveCombatPreview(ability, effectiveStep)}${owned ? "" : ` (at step ${formatNumber(effectiveStep)})`}` : "—"}</td>
        <td>${formatUseCost(calculateUseCost(levelValue, ability.use_cost))}</td>
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

  function renderProfile() {
    const profile = getSelectedProfile();
    if (!profile) {
      currentStep.textContent = "—";
      currentFavor.textContent = "—";
      sinceStep.textContent = "—";
      nextStepCost.textContent = "—";
      characterName.textContent = "No profile loaded";
      lastUpdated.textContent = "No captured favor yet";
      atLastStepChange.textContent = "Favor at last step change: —";
      remainingFavor.textContent = "Remaining to next step: —";
      status.textContent = "Load a Voln character profile to review captured favor progress.";
      status.style.color = "";
      if (atLastStepInput) atLastStepInput.value = "";
      setEditControlsEnabled(false);
      renderAbilities(null);
      renderHistory([]);
      return;
    }

    localStorage.setItem(storage.SELECTED_PROFILE_KEY, profile.id);
    const society = profile.society || {};
    const favor = society.favor || null;
    if (String(society.key || "") !== "voln") {
      currentStep.textContent = "—";
      currentFavor.textContent = "—";
      sinceStep.textContent = "—";
      nextStepCost.textContent = "—";
      characterName.textContent = profile.name || "Loaded profile";
      lastUpdated.textContent = "Not a Voln character";
      atLastStepChange.textContent = "Favor at last step change: —";
      remainingFavor.textContent = "Remaining to next step: —";
      status.textContent = `${profile.name || "Loaded profile"} is not currently marked as a Voln character.`;
      status.style.color = "#b42318";
      if (atLastStepInput) atLastStepInput.value = "";
      setEditControlsEnabled(false);
      renderAbilities(null);
      renderHistory([]);
      return;
    }

    const step = Math.max(0, Math.trunc(Number(society.rank) || 0));
    const currentFavorValue = favor && Number.isFinite(Number(favor.current)) ? Math.max(0, Math.trunc(Number(favor.current))) : null;
    const atLastStepValue = favor && Number.isFinite(Number(favor.atLastStepChange)) ? Math.max(0, Math.trunc(Number(favor.atLastStepChange))) : null;
    const sinceStepValue = currentFavorValue != null && atLastStepValue != null ? Math.max(0, currentFavorValue - atLastStepValue) : null;
    const nextCost = calculateNextStepCost(profile, step);
    const remaining = nextCost != null && sinceStepValue != null ? Math.max(0, nextCost - sinceStepValue) : null;

    currentStep.textContent = String(step);
    currentFavor.textContent = formatNumber(currentFavorValue);
    sinceStep.textContent = formatNumber(sinceStepValue);
    nextStepCost.textContent = formatNumber(nextCost);
    characterName.textContent = profile.name || "Loaded profile";
    lastUpdated.textContent = favor?.lastUpdated ? `Last updated ${new Date(favor.lastUpdated).toLocaleString()}` : "No captured favor yet";
    atLastStepChange.textContent = `Favor at last step change: ${formatNumber(atLastStepValue)}`;
    remainingFavor.textContent = `Remaining to next step: ${formatNumber(remaining)}`;
    status.textContent = favor
      ? "Voln favor progress is loaded from the profile snapshot."
      : "No favor snapshot stored yet. Run ;gs4tools sync or ;gs4tools collect voln.";
    status.style.color = "";
    if (atLastStepInput) {
      atLastStepInput.value = atLastStepValue == null ? "" : String(atLastStepValue);
    }
    setEditControlsEnabled(true);
    renderAbilities(profile);
    renderHistory(favor?.history || []);
  }

  refreshProfileSelect();
  renderProfile();

  profileLoad.addEventListener("click", renderProfile);
  profileSelect.addEventListener("change", renderProfile);
  atLastStepSave?.addEventListener("click", saveAtLastStepBaseline);
  atLastStepInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") saveAtLastStepBaseline();
  });
})();
