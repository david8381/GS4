(function () {
  const storage = globalThis.GS4Storage;
  const colData = globalThis.GS4_COL_DATA;

  if (!storage) throw new Error("GS4Storage is not loaded. Ensure shared.js is loaded before col.js.");
  if (!colData) throw new Error("GS4_COL_DATA is not loaded. Ensure data/societies/col.js is loaded before col.js.");

  const status = document.getElementById("colStatus");
  const currentRankEl = document.getElementById("colCurrentRank");
  const signsOwnedEl = document.getElementById("colSignsOwned");
  const signsTotal = document.getElementById("colSignsTotal");
  const characterNameEl = document.getElementById("colCharacterName");
  const abilityTable = document.getElementById("colAbilityTable");
  const currentLevelInput = document.getElementById("colCurrentLevelInput");
  const currentRankInput = document.getElementById("colCurrentRankInput");
  const whatIfLevelInput = document.getElementById("colWhatIfLevelInput");
  const whatIfRankInput = document.getElementById("colWhatIfRankInput");
  const profileLoadBtn = document.getElementById("colProfileLoad");
  const profileSaveBtn = document.getElementById("colProfileSave");

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

  // --- Duration formatting ---

  function formatDuration(duration, rank) {
    if (!duration || typeof duration !== "object") return "—";

    // Handle type-based durations
    if (duration.type === "immediate") return "Immediate";
    if (duration.type === "instant") return "Instant";
    if (duration.type === "variable") return "Variable";
    if (duration.type === "n/a") return "N/A";

    // seconds_per_rank with optional base_minutes
    const baseSeconds = (Number(duration.base_minutes) || 0) * 60;
    const perRankSeconds = Number(duration.seconds_per_rank) || 0;
    const fixedSeconds = Number(duration.seconds) || 0;

    let totalSeconds = 0;
    if (perRankSeconds > 0) {
      totalSeconds = baseSeconds + (perRankSeconds * rank);
    } else if (fixedSeconds > 0) {
      totalSeconds = fixedSeconds;
    } else if (baseSeconds > 0) {
      totalSeconds = baseSeconds;
    }

    if (totalSeconds <= 0) return "—";

    if (totalSeconds >= 60) {
      const minutes = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    }
    return `${totalSeconds}s`;
  }

  function explainDuration(duration, rank) {
    if (!duration || typeof duration !== "object") return "";
    if (duration.type === "immediate") return "Takes effect immediately";
    if (duration.type === "instant") return "Instant effect, no ongoing duration";
    if (duration.type === "variable") return "Duration varies based on circumstances";
    if (duration.type === "n/a") return "Passive ability, no duration";

    const parts = [];
    if (duration.base_minutes) {
      parts.push(`Base: ${duration.base_minutes} minute${duration.base_minutes !== 1 ? "s" : ""}`);
    }
    if (duration.seconds_per_rank) {
      parts.push(`${duration.seconds_per_rank}s per rank (rank ${rank} = ${duration.seconds_per_rank * rank}s)`);
    }
    if (duration.seconds) {
      parts.push(`Fixed: ${duration.seconds} seconds`);
    }
    return parts.join("\n");
  }

  // --- Cost formatting ---

  function formatResourceCost(cost) {
    if (!cost || typeof cost !== "object") return { mana: "—", spirit: "—" };
    const mana = Number(cost.mana);
    const spirit = Number(cost.spirit);
    return {
      mana: Number.isFinite(mana) ? String(mana) : "—",
      spirit: Number.isFinite(spirit) ? String(spirit) : "—",
    };
  }

  function explainResourceCost(cost) {
    if (!cost || typeof cost !== "object") return "";
    const parts = [];
    if (Number(cost.mana) > 0) parts.push(`${cost.mana} mana`);
    if (Number(cost.spirit) > 0) parts.push(`${cost.spirit} spirit`);
    if (parts.length === 0 && Number(cost.mana) === 0 && Number(cost.spirit) === 0) {
      return "No resource cost";
    }
    const paid = cost.paid ? ` (${cost.paid})` : "";
    return parts.join(" + ") + paid;
  }

  // --- Combat modifier preview ---

  function resolveCombatPreview(ability, rank) {
    const totals = {};

    // Fixed modifiers from the modifiers object
    const mods = ability?.modifiers || {};
    for (const [metric, value] of Object.entries(mods)) {
      if (metric in METRIC_LABELS && Number.isFinite(Number(value)) && Number(value) !== 0) {
        totals[metric] = (totals[metric] || 0) + Number(value);
      }
    }

    // Dynamic per-rank rules
    const rules = Array.isArray(ability?.dynamic_rules) ? ability.dynamic_rules : [];
    rules.forEach((rule) => {
      if (!rule || typeof rule !== "object") return;
      const metric = String(rule.metric || "");
      if (!metric || !(metric in METRIC_LABELS)) return;
      let amount = 0;
      if (rule.type === "per_rank") {
        amount = rank * Number(rule.amount_per_rank || 0);
      } else if (rule.type === "per_n_ranks") {
        const divisor = Math.max(1, Number(rule.divisor) || 1);
        amount = Math.floor(rank / divisor) * Number(rule.amount_per_step || 0);
      }
      if (Number.isFinite(Number(rule.max_total))) {
        amount = Math.min(amount, Number(rule.max_total));
      }
      if (amount !== 0) totals[metric] = (totals[metric] || 0) + amount;
    });

    const parts = Object.entries(METRIC_LABELS)
      .map(([metric, label]) => {
        const val = totals[metric];
        if (!val) return null;
        const sign = val > 0 ? "+" : "";
        return `${sign}${formatNumber(val)} ${label}`;
      })
      .filter(Boolean);
    return parts.length ? parts.join(" / ") : "—";
  }

  // --- Render abilities table ---

  function renderAbilities(currentLevel, currentRank, whatIfLevel, whatIfRank) {
    if (!abilityTable) return;
    abilityTable.innerHTML = "";
    const abilities = Array.isArray(colData?.abilities) ? colData.abilities : [];

    abilities.forEach((ability) => {
      const owned = currentRank >= Number(ability.rank_required || 0);
      const whatIfOwned = whatIfRank >= Number(ability.rank_required || 0);
      const row = document.createElement("tr");
      row.className = owned ? "col-owned-row" : "col-locked-row";

      const costs = formatResourceCost(ability.resource_cost);
      const costTip = explainResourceCost(ability.resource_cost);
      const currentDuration = formatDuration(ability.duration, currentRank);
      const whatIfDuration = formatDuration(ability.duration, whatIfRank);
      const durationTip = explainDuration(ability.duration, currentRank);

      // Show duration with what-if in parentheses if different
      let durationDisplay = currentDuration;
      if (whatIfDuration !== currentDuration) {
        durationDisplay = `${currentDuration} (${whatIfDuration})`;
      }

      row.innerHTML = `
        <td>${formatNumber(ability.rank_required)}</td>
        <td><strong>${ability.name}</strong></td>
        <td>${owned ? "Owned" : "Locked"}</td>
        <td>${ability.effect_summary || "—"}</td>
        <td>${ability.combat_relevant ? resolveCombatPreview(ability, currentRank) : "—"}</td>
        <td>${ability.combat_relevant ? resolveCombatPreview(ability, whatIfRank) : "—"}</td>
        <td>${costs.mana}</td>
        <td>${costs.spirit}</td>
        <td>${durationDisplay}</td>
      `;

      const cells = row.cells;
      if (costTip) {
        cells[6].title = costTip;
        cells[7].title = costTip;
      }
      if (durationTip) cells[8].title = durationTip;

      abilityTable.appendChild(row);
    });
  }

  // --- Recalculate ---

  function recalculate() {
    const currentLevel = Math.max(0, Math.trunc(Number(currentLevelInput?.value) || 0));
    const currentRank = Math.max(0, Math.min(20, Math.trunc(Number(currentRankInput?.value) || 0)));
    const whatIfLevel = Math.max(0, Math.trunc(Number(whatIfLevelInput?.value) || currentLevel));
    const whatIfRank = Math.max(0, Math.min(20, Math.trunc(Number(whatIfRankInput?.value) || currentRank)));

    if (currentRankEl) currentRankEl.textContent = String(currentRank);

    const abilities = Array.isArray(colData?.abilities) ? colData.abilities : [];
    const ownedCount = abilities.filter((a) => currentRank >= Number(a.rank_required || 0)).length;
    if (signsOwnedEl) signsOwnedEl.textContent = String(ownedCount);
    if (signsTotal) signsTotal.textContent = `of ${abilities.length} signs`;

    renderAbilities(currentLevel, currentRank, whatIfLevel, whatIfRank);
  }

  // --- Profile load/save/snapshot ---

  let loadedSnapshot = null;

  function currentInputSnapshot() {
    return {
      level: Math.max(0, Math.trunc(Number(currentLevelInput?.value) || 0)),
      rank: Math.max(0, Math.trunc(Number(currentRankInput?.value) || 0)),
    };
  }

  function snapshotsMatch(a, b) {
    return a.level === b.level && a.rank === b.rank;
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
      return;
    }

    const society = profile.society || {};
    const isCol = String(society.key || "") === "col";
    const level = Math.max(0, Math.trunc(Number(profile.level) || 0));
    const rank = isCol ? Math.max(0, Math.min(20, Math.trunc(Number(society.rank) || 0))) : 0;

    characterNameEl.textContent = profile.name || "Loaded profile";
    if (currentLevelInput) currentLevelInput.value = String(level);
    if (currentRankInput) currentRankInput.value = String(rank);
    if (whatIfLevelInput) whatIfLevelInput.value = String(level);
    if (whatIfRankInput) whatIfRankInput.value = String(rank);

    if (!isCol) {
      status.textContent = `${profile.name || "Loaded profile"} is not a Council of Light character. You can still enter values manually.`;
      status.style.color = "";
      return;
    }

    status.textContent = `Showing sign data for ${profile.name || "selected profile"}.`;
    status.style.color = "";
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
    const nextProfile = {
      ...selected,
      level: current.level,
      society: { ...society, key: "col", rank: current.rank },
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
      const isCol = String(society.key || "") === "col";
      loadedSnapshot = {
        level: Math.max(0, Math.trunc(Number(profile.level) || 0)),
        rank: isCol ? Math.max(0, Math.min(20, Math.trunc(Number(society.rank) || 0))) : 0,
      };
    } else {
      loadedSnapshot = null;
    }
    recalculate();
    if (profileLoadBtn) { profileLoadBtn.disabled = true; profileLoadBtn.classList.remove("attention"); }
    if (profileSaveBtn) { profileSaveBtn.disabled = true; profileSaveBtn.classList.remove("success-attention"); }
  }

  // --- Initial load ---
  doLoadProfile();

  // --- Event listeners ---

  function onInputChange() {
    recalculate();
    updateButtonStates();
  }

  currentLevelInput?.addEventListener("input", onInputChange);
  currentRankInput?.addEventListener("input", onInputChange);
  whatIfLevelInput?.addEventListener("input", recalculate);
  whatIfRankInput?.addEventListener("input", recalculate);

  profileLoadBtn?.addEventListener("click", doLoadProfile);
  profileSaveBtn?.addEventListener("click", saveProfileFromInputs);

  window.addEventListener("storage", flagReload);
  window.addEventListener("gs4:profile-saved", flagReload);
  window.addEventListener("gs4:selected-profile-changed", doLoadProfile);
})();
