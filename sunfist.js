(function () {
  const storage = globalThis.GS4Storage;
  const sunfistData = globalThis.GS4_SUNFIST_DATA;

  if (!storage) throw new Error("GS4Storage is not loaded. Ensure shared.js is loaded before sunfist.js.");
  if (!sunfistData) throw new Error("GS4_SUNFIST_DATA is not loaded. Ensure data/societies/sunfist.js is loaded before sunfist.js.");

  const status = document.getElementById("sunfistStatus");
  const currentRankEl = document.getElementById("sunfistCurrentRank");
  const ownedCountEl = document.getElementById("sunfistOwnedCount");
  const totalCountEl = document.getElementById("sunfistTotalCount");
  const characterNameEl = document.getElementById("sunfistCharacterName");
  const abilityTable = document.getElementById("sunfistAbilityTable");
  const currentLevelInput = document.getElementById("sunfistCurrentLevelInput");
  const currentRankInput = document.getElementById("sunfistCurrentRankInput");
  const whatIfLevelInput = document.getElementById("sunfistWhatIfLevelInput");
  const whatIfRankInput = document.getElementById("sunfistWhatIfRankInput");
  const profileLoadBtn = document.getElementById("sunfistProfileLoad");
  const profileSaveBtn = document.getElementById("sunfistProfileSave");

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

  function formatDuration(duration) {
    if (!duration || typeof duration !== "object") return "—";
    if (duration.type === "immediate") return "Immediate";
    if (duration.type === "instant") return "Instant";
    if (duration.type === "unknown") return "Variable";
    const parts = [];
    if (typeof duration.minutes === "number") {
      parts.push(duration.minutes === 1 ? "1 min" : `${duration.minutes} min`);
    }
    if (typeof duration.seconds === "number") {
      parts.push(duration.seconds === 1 ? "1 sec" : `${duration.seconds} sec`);
    }
    if (!parts.length) return "—";
    let result = parts.join(" ");
    if (typeof duration.stackable_to_seconds === "number") {
      result += ` (stackable to ${duration.stackable_to_seconds} sec)`;
    }
    return result;
  }

  function explainDuration(duration) {
    if (!duration || typeof duration !== "object") return "";
    if (duration.type === "immediate") return "Takes effect immediately, no ongoing duration";
    if (duration.type === "instant") return "Instant effect";
    if (duration.type === "unknown") return "Duration varies based on usage";
    const parts = [];
    if (typeof duration.minutes === "number") parts.push(`${duration.minutes} minute${duration.minutes !== 1 ? "s" : ""}`);
    if (typeof duration.seconds === "number") parts.push(`${duration.seconds} second${duration.seconds !== 1 ? "s" : ""}`);
    let tip = parts.length ? `Lasts ${parts.join(" ")}` : "";
    if (typeof duration.stackable_to_seconds === "number") {
      tip += `\nStackable up to ${duration.stackable_to_seconds} seconds`;
    }
    return tip;
  }

  function formatResourceCost(value) {
    if (value == null) return "—";
    if (value === "variable") return "Varies";
    if (typeof value === "number") return formatNumber(value);
    return String(value);
  }

  function explainResourceCost(ability) {
    if (!ability.resource_cost || typeof ability.resource_cost !== "object") return "";
    const parts = [];
    const mana = ability.resource_cost.mana;
    const stamina = ability.resource_cost.stamina;
    if (mana === "variable" && stamina === "variable") return "Mana and stamina costs vary based on usage";
    if (typeof mana === "number" && mana > 0) parts.push(`${mana} mana`);
    else if (mana === "variable") parts.push("variable mana");
    if (typeof stamina === "number" && stamina > 0) parts.push(`${stamina} stamina`);
    else if (stamina === "variable") parts.push("variable stamina");
    if (!parts.length) return "No resource cost";
    return `Costs ${parts.join(" and ")}`;
  }

  function resolveCombatPreview(ability, effectiveRank) {
    const totals = {};

    // Fixed modifiers
    const mods = ability.modifiers || {};
    Object.entries(mods).forEach(function (entry) {
      const metric = entry[0];
      const value = entry[1];
      if (metric in METRIC_LABELS && typeof value === "number" && value !== 0) {
        totals[metric] = (totals[metric] || 0) + value;
      }
    });

    // Dynamic rules (rank-scaling)
    const rules = Array.isArray(ability.dynamic_rules) ? ability.dynamic_rules : [];
    rules.forEach(function (rule) {
      if (!rule || typeof rule !== "object") return;
      const metric = String(rule.metric || "");
      if (!metric || !(metric in METRIC_LABELS)) return;
      var amount = 0;
      if (rule.type === "per_rank") {
        amount = effectiveRank * Number(rule.amount_per_rank || 0);
      } else if (rule.type === "per_n_ranks") {
        const divisor = Math.max(1, Number(rule.divisor) || 1);
        amount = Math.floor(effectiveRank / divisor) * Number(rule.amount_per_step || 0);
      }
      if (Number.isFinite(Number(rule.max_total))) {
        amount = Math.min(amount, Number(rule.max_total));
      }
      if (amount > 0) totals[metric] = (totals[metric] || 0) + amount;
    });

    const parts = Object.entries(METRIC_LABELS)
      .map(function (entry) {
        var metric = entry[0], label = entry[1];
        return totals[metric] ? "+" + formatNumber(totals[metric]) + " " + label : null;
      })
      .filter(Boolean);
    return parts.length ? parts.join(" / ") : "—";
  }

  function renderAbilities(currentRankValue, whatIfRankValue) {
    if (!abilityTable) return;
    abilityTable.innerHTML = "";
    const abilities = Array.isArray(sunfistData?.abilities) ? sunfistData.abilities : [];
    var ownedCount = 0;

    abilities.forEach(function (ability) {
      const rankReq = Number(ability.rank_required || 0);
      const owned = currentRankValue >= rankReq;
      if (owned) ownedCount++;
      const whatIfOwned = whatIfRankValue >= rankReq;

      const row = document.createElement("tr");
      row.className = owned ? "sunfist-owned-row" : "sunfist-locked-row";

      const currentEffectiveRank = owned ? currentRankValue : rankReq;
      const whatIfEffectiveRank = whatIfOwned ? whatIfRankValue : rankReq;

      const currentModsText = ability.combat_relevant
        ? resolveCombatPreview(ability, currentEffectiveRank) + (owned ? "" : " (at rank " + formatNumber(currentEffectiveRank) + ")")
        : "—";
      const whatIfModsText = ability.combat_relevant
        ? resolveCombatPreview(ability, whatIfEffectiveRank) + (whatIfOwned ? "" : " (at rank " + formatNumber(whatIfEffectiveRank) + ")")
        : "—";

      const rc = ability.resource_cost || {};

      row.innerHTML =
        "<td>" + formatNumber(ability.rank_required) + "</td>" +
        "<td><strong>" + (ability.name || "—") + "</strong></td>" +
        "<td>" + formatNumber(ability.points_required) + "</td>" +
        "<td>" + (owned ? "Owned" : "Locked") + "</td>" +
        "<td>" + (ability.effect_summary || "—") + "</td>" +
        "<td>" + currentModsText + "</td>" +
        "<td>" + whatIfModsText + "</td>" +
        "<td>" + formatResourceCost(rc.mana) + "</td>" +
        "<td>" + formatResourceCost(rc.stamina) + "</td>" +
        "<td>" + formatDuration(ability.duration) + "</td>";

      // Tooltips
      const cells = row.cells;
      const costTip = explainResourceCost(ability);
      if (costTip) {
        cells[7].title = costTip;
        cells[8].title = costTip;
      }
      const durationTip = explainDuration(ability.duration);
      if (durationTip) cells[9].title = durationTip;

      abilityTable.appendChild(row);
    });

    if (ownedCountEl) ownedCountEl.textContent = String(ownedCount);
    if (totalCountEl) totalCountEl.textContent = "of " + abilities.length + " sigils";
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
    const isSunfist = String(society.key || "") === "sunfist";
    const level = Math.max(0, Math.trunc(Number(profile.level) || 0));
    const rank = isSunfist ? Math.max(0, Math.trunc(Number(society.rank) || 0)) : 0;

    characterNameEl.textContent = profile.name || "Loaded profile";
    if (currentLevelInput) currentLevelInput.value = String(level);
    if (currentRankInput) currentRankInput.value = String(rank);
    if (whatIfLevelInput) whatIfLevelInput.value = String(level);
    if (whatIfRankInput) whatIfRankInput.value = String(rank);

    if (!isSunfist) {
      status.textContent = (profile.name || "Loaded profile") + " is not a Sunfist character. You can still enter values manually.";
      status.style.color = "";
      return;
    }

    status.textContent = "Showing sigil data for " + (profile.name || "selected profile") + ".";
    status.style.color = "";
  }

  function recalculate() {
    const currentRank = Math.max(0, Math.min(Number(sunfistData.max_rank) || 20, Math.trunc(Number(currentRankInput?.value) || 0)));
    const whatIfRank = Math.max(0, Math.min(Number(sunfistData.max_rank) || 20, Math.trunc(Number(whatIfRankInput?.value) || 0)));

    if (currentRankEl) currentRankEl.textContent = String(currentRank);

    renderAbilities(currentRank, whatIfRank);
  }

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
      society: { ...society, key: "sunfist", rank: current.rank },
    };
    const nextProfiles = profiles.map(function (entry) { return entry.id === selected.id ? nextProfile : entry; });
    storage.saveProfiles(nextProfiles);
    localStorage.setItem(storage.SELECTED_PROFILE_KEY, selected.id);

    loadedSnapshot = { ...current };
    updateButtonStates();
    status.textContent = "Updated profile for " + (selected.name || "selected profile") + ".";
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
      const isSunfist = String(society.key || "") === "sunfist";
      loadedSnapshot = {
        level: Math.max(0, Math.trunc(Number(profile.level) || 0)),
        rank: isSunfist ? Math.max(0, Math.trunc(Number(society.rank) || 0)) : 0,
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
