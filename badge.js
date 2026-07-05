const lifetimeBpInput = document.getElementById("lifetimeBp");
const upgradeCostEl = document.getElementById("upgradeCost");
const bpRemainingEl = document.getElementById("bpRemaining");
const slotSummaryEl = document.getElementById("slotSummary");
const rechargeCostEl = document.getElementById("rechargeCost");
const powerSummaryEl = document.getElementById("powerSummary");
const validationMessageEl = document.getElementById("validationMessage");
const stateJsonStatusEl = document.getElementById("stateJsonStatus");
const badgeProfileStatusEl = document.getElementById("badgeProfileStatus");
const badgeProfileSelect = document.getElementById("badgeProfileSelect");
const badgeProfileLoad = document.getElementById("badgeProfileLoad");
const badgeProfileSaveButtons = Array.from(document.querySelectorAll(".badge-profile-save"));
const badgeProfileReloadButtons = Array.from(document.querySelectorAll(".badge-profile-reload"));

const componentTable = document.getElementById("componentTable");
const boostTable = document.getElementById("boostTable");
const sharedStorage = globalThis.GS4Storage;

// Pure rules + game data live in badge/badge-logic.js (shared with the test suite).
const BadgeLogic = globalThis.BadgeLogic;
const {
  componentNames,
  boostDefs,
  boostById,
  upgradeCostForLevel,
  nextUpgradeCost,
  totalUpgrades,
  slotCount,
  slotAdvice,
  requiredUpgradesForCost,
  availableEnhancementPowerForComponents,
  boostCost,
  rechargeCostForBoosts,
} = BadgeLogic;

const OK_COLOR = "#1f4e42";
const BAD_COLOR = "#b42318";

function formatNumber(value) {
  return Math.round(value).toLocaleString("en-US");
}

function ordinal(n) {
  const names = { 1: "1st", 2: "2nd", 3: "3rd" };
  return names[n] || `${n}th`;
}

function pluralUpgrades(n) {
  return `${n} upgrade${n === 1 ? "" : "s"}`;
}

const state = {
  lifetimeBp: 0,
  components: [0, 0, 0, 0, 0],
  boosts: [
    { id: 0, value: 0 },
    { id: 0, value: 0 },
    { id: 0, value: 0 },
  ],
};

function safeInt(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.trunc(number);
}

function profileKey(profile, index) {
  if (profile && profile.id != null && profile.id !== "") return String(profile.id);
  const safeName = profile && profile.name ? String(profile.name).toLowerCase() : "profile";
  return `legacy-${index}-${safeName}`;
}

function refreshProfileSelect(profiles) {
  if (!badgeProfileSelect) return;
  const selected = badgeProfileSelect.value || localStorage.getItem(sharedStorage.SELECTED_PROFILE_KEY) || "";
  badgeProfileSelect.innerHTML = '<option value="">Select from Profile</option>';
  profiles.forEach((profile, index) => {
    const option = document.createElement("option");
    option.value = profileKey(profile, index);
    option.textContent = profile.name;
    badgeProfileSelect.appendChild(option);
  });
  if (selected) {
    badgeProfileSelect.value = selected;
    if (badgeProfileSelect.value !== selected && badgeProfileStatusEl) {
      badgeProfileStatusEl.textContent = "Selected profile is no longer available.";
      badgeProfileStatusEl.style.color = "#b42318";
    }
  }
}

function findProfileByKey(profiles, key) {
  for (let index = 0; index < profiles.length; index += 1) {
    const profile = profiles[index];
    if (profileKey(profile, index) === key) return { profile, index };
  }
  return null;
}

function currentStateSnapshot() {
  return {
    lifetimeBp: state.lifetimeBp,
    components: [...state.components],
    boosts: state.boosts.map((entry) => ({ id: entry.id, value: entry.value })),
  };
}

function setStateJsonStatus(message, isError = false) {
  if (!stateJsonStatusEl) return;
  stateJsonStatusEl.textContent = message;
  stateJsonStatusEl.style.color = isError ? "#b42318" : "#1f4e42";
}

function parseStateJson(text) {
  const reasons = [];
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { ok: false, reasons: ["Invalid JSON syntax."] };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reasons: ["Top-level JSON must be an object."] };
  }

  const lifetimeBp = safeInt(parsed.lifetimeBp);
  if (lifetimeBp == null || lifetimeBp < 0) reasons.push("lifetimeBp must be an integer >= 0.");

  if (!Array.isArray(parsed.components) || parsed.components.length !== 5) {
    reasons.push("components must be an array of exactly 5 integers (0-10).");
  }

  const components = [];
  if (Array.isArray(parsed.components)) {
    parsed.components.forEach((value, index) => {
      const intValue = safeInt(value);
      if (intValue == null || intValue < 0 || intValue > 10) {
        reasons.push(`components[${index}] must be an integer between 0 and 10.`);
      }
      components.push(intValue ?? 0);
    });
  }

  if (!Array.isArray(parsed.boosts) || parsed.boosts.length !== 3) {
    reasons.push("boosts must be an array of exactly 3 objects.");
  }

  const boosts = [];
  if (Array.isArray(parsed.boosts)) {
    parsed.boosts.forEach((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        reasons.push(`boosts[${index}] must be an object with id and value.`);
        boosts.push({ id: 0, value: 0 });
        return;
      }

      const id = safeInt(entry.id);
      const def = id === 0 ? null : boostById.get(id);
      if (id !== 0 && !def) reasons.push(`boosts[${index}].id is not a valid boost id.`);

      const value = safeInt(entry.value);
      if (id === 0 && value !== 0 && value != null) {
        reasons.push(`boosts[${index}].value must be 0 when no boost is selected.`);
      } else if (value == null || value < 0 || (def && value > def.max)) {
        reasons.push(`boosts[${index}].value must be between 0 and max for selected id.`);
      }

      boosts.push({ id: (id === 0 || def) ? (id ?? 0) : 0, value: value ?? 0 });
    });
  }

  if (reasons.length > 0) return { ok: false, reasons };
  return { ok: true, value: { lifetimeBp, components, boosts } };
}

function parseBadgeStateObject(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, reasons: ["Badge state object missing or invalid."] };
  }
  return parseStateJson(JSON.stringify(raw));
}

function applyParsedState(parsedState) {
  state.lifetimeBp = parsedState.lifetimeBp;
  state.components = [...parsedState.components];
  state.boosts = parsedState.boosts.map((entry) => ({ id: entry.id, value: entry.value }));
  lifetimeBpInput.value = String(state.lifetimeBp);
}

function statesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getSavedBadgeState() {
  if (!badgeProfileSelect || !badgeProfileSelect.value) return null;
  const profiles = sharedStorage.loadProfiles();
  const found = findProfileByKey(profiles, badgeProfileSelect.value);
  if (!found) return null;
  const parsed = parseBadgeStateObject(found.profile.defaults?.badge);
  return parsed.ok ? parsed.value : null;
}

function updateProfileButtonState() {
  if (!badgeProfileSelect || !badgeProfileLoad || badgeProfileSaveButtons.length === 0) return;
  const key = badgeProfileSelect.value;
  badgeProfileLoad.classList.remove("attention", "success-attention");
  badgeProfileSaveButtons.forEach((button) => button.classList.remove("success-attention"));
  badgeProfileReloadButtons.forEach((button) => button.classList.remove("attention"));

  if (!key) {
    badgeProfileSaveButtons.forEach((button) => {
      button.disabled = true;
    });
    badgeProfileReloadButtons.forEach((button) => {
      button.disabled = true;
    });
    if (badgeProfileStatusEl) {
      badgeProfileStatusEl.textContent = "Save disabled: select a character profile first.";
      badgeProfileStatusEl.style.color = "";
    }
    return;
  }

  const profiles = sharedStorage.loadProfiles();
  const found = findProfileByKey(profiles, key);
  if (!found) {
    badgeProfileSaveButtons.forEach((button) => {
      button.disabled = true;
    });
    badgeProfileReloadButtons.forEach((button) => {
      button.disabled = true;
    });
    if (badgeProfileStatusEl) {
      badgeProfileStatusEl.textContent = "Selected profile was not found.";
      badgeProfileStatusEl.style.color = "#b42318";
    }
    return;
  }
  badgeProfileSaveButtons.forEach((button) => {
    button.disabled = false;
  });
  badgeProfileReloadButtons.forEach((button) => {
    button.disabled = false;
  });
  const parsed = parseBadgeStateObject(found.profile.defaults?.badge);
  if (!parsed.ok) {
    badgeProfileSaveButtons.forEach((button) => button.classList.add("success-attention"));
    badgeProfileReloadButtons.forEach((button) => {
      button.disabled = true;
    });
    if (badgeProfileStatusEl) {
      badgeProfileStatusEl.textContent = "No badge state is saved yet for this profile.";
      badgeProfileStatusEl.style.color = "#1f7a4d";
    }
    return;
  }

  const changed = !statesEqual(currentStateSnapshot(), parsed.value);
  if (changed) {
    badgeProfileLoad.classList.add("attention");
    badgeProfileSaveButtons.forEach((button) => button.classList.add("success-attention"));
    badgeProfileReloadButtons.forEach((button) => button.classList.add("attention"));
    if (badgeProfileStatusEl) {
      badgeProfileStatusEl.textContent = "Current badge values differ from the saved profile.";
      badgeProfileStatusEl.style.color = "#1f7a4d";
    }
  } else if (badgeProfileStatusEl) {
    badgeProfileStatusEl.textContent = "Badge values match the selected profile.";
    badgeProfileStatusEl.style.color = "";
  }
}

function currentUpgradeCost() {
  return state.components.reduce((sum, level) => sum + upgradeCostForLevel(level), 0);
}

function currentRechargeCost() {
  return rechargeCostForBoosts(state.boosts);
}

function availableEnhancementPower() {
  return availableEnhancementPowerForComponents(state.components);
}

function slotIsUnlocked(index) {
  return index < slotCount(state.components);
}

function changeComponent(index, delta) {
  const next = Math.max(0, Math.min(10, state.components[index] + delta));
  state.components[index] = next;
  render();
}

function changeBoostValue(index, delta) {
  const def = boostById.get(state.boosts[index].id);
  if (!def) return;
  const next = Math.max(0, Math.min(def.max, state.boosts[index].value + delta));
  state.boosts[index].value = next;
  render();
}

function setBoostId(index, id) {
  const numeric = Number(id);
  if (numeric === 0) {
    state.boosts[index].id = 0;
    state.boosts[index].value = 0;
    render();
    return;
  }
  const def = boostById.get(numeric);
  if (!def) return;
  state.boosts[index].id = numeric;
  state.boosts[index].value = Math.min(state.boosts[index].value, def.max);
  render();
}

function renderSummary() {
  const saved = getSavedBadgeState();
  const upgrade = currentUpgradeCost();
  const recharge = currentRechargeCost();
  const slotsUnlocked = slotCount(state.components);
  const slotsUsed = state.boosts.filter((entry) => entry.value > 0).length;
  const upgrades = totalUpgrades(state.components);
  const powerAvailable = availableEnhancementPower();
  const slotValid = slotsUsed <= slotsUnlocked;
  const powerValid = recharge <= powerAvailable;
  const isValid = slotValid && powerValid;
  const upgradeValid = upgrade <= state.lifetimeBp;

  const allValid = upgradeValid && isValid;
  const advice = slotAdvice(state.components);

  upgradeCostEl.textContent = `${formatNumber(upgrade)} BP`;
  upgradeCostEl.style.color = upgradeValid ? OK_COLOR : BAD_COLOR;

  bpRemainingEl.textContent = `${formatNumber(state.lifetimeBp - upgrade)} BP`;
  bpRemainingEl.style.color = upgradeValid && isValid ? OK_COLOR : BAD_COLOR;

  // Slots shown as pips: ● unlocked, ○ still locked.
  const pips = "●".repeat(slotsUnlocked) + "○".repeat(3 - slotsUnlocked);
  slotSummaryEl.textContent = `Slots ${pips} · ${slotsUsed} used / ${slotsUnlocked} unlocked · ${pluralUpgrades(upgrades)}`;
  slotSummaryEl.style.color = slotValid ? OK_COLOR : BAD_COLOR;

  rechargeCostEl.textContent = `${formatNumber(recharge)} BP`;
  rechargeCostEl.style.color = isValid ? OK_COLOR : BAD_COLOR;
  powerSummaryEl.textContent = `Boost strength used: ${formatNumber(recharge)} / ${formatNumber(powerAvailable)} power`;
  powerSummaryEl.style.color = isValid ? OK_COLOR : BAD_COLOR;

  const reasons = [];
  if (!upgradeValid) {
    reasons.push(
      `Component upgrades cost ${formatNumber(upgrade)} BP, but you only have ${formatNumber(
        state.lifetimeBp
      )} lifetime BP to spend. Lower a component level or raise your lifetime BP.`
    );
  }
  if (!slotValid) {
    let msg = `You've configured ${slotsUsed} enhancement${slotsUsed === 1 ? "" : "s"}, but only ${slotsUnlocked} slot${
      slotsUnlocked === 1 ? " is" : "s are"
    } unlocked.`;
    if (advice && advice.needed > 0) {
      msg += ` Add ${pluralUpgrades(advice.needed)} across your top ${advice.withinTop} components to unlock the ${ordinal(
        advice.nextSlot
      )} enhancement, or clear a boost.`;
    } else {
      msg += " Clear a boost to fix this.";
    }
    reasons.push(msg);
  }
  if (!powerValid) {
    reasons.push(
      `Your enhancements need ${formatNumber(recharge)} power, but the badge only supplies ${formatNumber(
        powerAvailable
      )} from its ${pluralUpgrades(upgrades)}. Add more component upgrades or lower a boost value.`
    );
  }

  validationMessageEl.classList.toggle("status-ok", reasons.length === 0);
  validationMessageEl.classList.toggle("status-error", reasons.length > 0);
  validationMessageEl.style.color = "";
  if (reasons.length === 0) {
    let okMsg = "<strong>✓ Valid setup.</strong> This badge configuration works in-game.";
    if (advice && advice.needed > 0) {
      okMsg += ` <span class="status-tip">Tip: ${advice.needed} more upgrade${
        advice.needed === 1 ? "" : "s"
      } in your top ${advice.withinTop} components unlocks the ${ordinal(advice.nextSlot)} enhancement.</span>`;
    }
    validationMessageEl.innerHTML = okMsg;
  } else {
    const body =
      reasons.length === 1
        ? reasons[0]
        : `<ul class="status-reasons">${reasons.map((reason) => `<li>${reason}</li>`).join("")}</ul>`;
    validationMessageEl.innerHTML = `<strong>⚠ Needs fixing:</strong> ${body}`;
  }

  lifetimeBpInput.classList.remove("changed-from-profile");
  if (saved && state.lifetimeBp !== saved.lifetimeBp) {
    lifetimeBpInput.classList.add("changed-from-profile");
  }
}

function renderComponentTable() {
  componentTable.innerHTML = "";
  const saved = getSavedBadgeState();
  const overspent = currentUpgradeCost() > state.lifetimeBp;
  state.components.forEach((level, index) => {
    const row = document.createElement("tr");
    row.style.color = overspent ? BAD_COLOR : OK_COLOR;
    if (overspent) row.classList.add("row-invalid");
    if (saved && level !== saved.components[index]) {
      row.classList.add("changed-from-profile");
    }
    const total = upgradeCostForLevel(level);
    const next = nextUpgradeCost(level);

    row.innerHTML = `
      <td>${overspent ? '<span class="row-flag" title="Costs more than your lifetime BP">⚠</span> ' : ""}${componentNames[index]}</td>
      <td>
        <div class="inline-actions">
          <button class="btn ghost" data-comp-minus="${index}" type="button">-</button>
          <span>${level}</span>
          <button class="btn ghost" data-comp-plus="${index}" type="button">+</button>
        </div>
      </td>
      <td>${next ? `${formatNumber(next)} BP` : "Max"}</td>
      <td>${formatNumber(total)} BP</td>
    `;

    componentTable.appendChild(row);
  });

  componentTable.querySelectorAll("button[data-comp-minus]").forEach((button) => {
    button.addEventListener("click", () => changeComponent(Number(button.dataset.compMinus), -1));
  });

  componentTable.querySelectorAll("button[data-comp-plus]").forEach((button) => {
    button.addEventListener("click", () => changeComponent(Number(button.dataset.compPlus), 1));
  });
}

function renderBoostTable() {
  boostTable.innerHTML = "";
  const saved = getSavedBadgeState();
  const usedIds = new Set(state.boosts.map((b) => b.id).filter((id) => id !== 0));

  state.boosts.forEach((entry, index) => {
    const def = boostById.get(entry.id);
    const isSelected = def != null;
    const maxVal = isSelected ? def.max : 0;
    const rowCost = boostCost(entry);
    const required = requiredUpgradesForCost(rowCost);
    const unlocked = slotIsUnlocked(index);
    const powerOk = required <= totalUpgrades(state.components);
    const rowValid = (unlocked || entry.value === 0) && powerOk;

    const row = document.createElement("tr");
    row.style.color = rowValid ? OK_COLOR : BAD_COLOR;
    if (!rowValid) row.classList.add("row-invalid");
    if (!unlocked) row.classList.add("slot-locked");
    const savedEntry = saved?.boosts?.[index];
    if (savedEntry && (entry.id !== savedEntry.id || entry.value !== savedEntry.value)) {
      row.classList.add("changed-from-profile");
    }

    const lockNote = unlocked
      ? ""
      : `<div class="slot-note">🔒 Locked — this is the ${ordinal(index + 1)} enhancement. Concentrate more upgrades to unlock it.</div>`;
    const powerNote =
      unlocked && isSelected && entry.value > 0 && !powerOk
        ? `<div class="slot-note">⚠ Needs ${pluralUpgrades(required)} of badge power; the badge has ${pluralUpgrades(
            totalUpgrades(state.components)
          )}.</div>`
        : "";
    const rowFlag = rowValid ? "" : '<span class="row-flag" title="This enhancement will not hold">⚠</span> ';

    row.innerHTML = `
      <td>${rowFlag}${index + 1}${unlocked ? "" : " 🔒"}</td>
      <td>
        <select data-boost-id="${index}">
          <option value="0" ${entry.id === 0 ? "selected" : ""}>Select Boost</option>
          ${boostDefs
            .map(
              (opt) =>
                `<option value="${opt.id}" ${opt.id === entry.id ? "selected" : ""} ${opt.id !== entry.id && usedIds.has(opt.id) ? "disabled" : ""}>${opt.id}. ${opt.name}</option>`
            )
            .join("")}
        </select>
        <button class="btn ghost" data-boost-clear="${index}" type="button" ${entry.id === 0 ? "disabled" : ""}>clear</button>
        ${lockNote}${powerNote}
      </td>
      <td>
        <div class="inline-actions">
          <button class="btn ghost" data-boost-minus="${index}" type="button" ${entry.value <= 0 || !isSelected ? "disabled" : ""}>-</button>
          <span>${entry.value}</span>
          <button class="btn ghost" data-boost-plus="${index}" type="button" ${entry.value >= maxVal || !isSelected ? "disabled" : ""}>+</button>
        </div>
      </td>
      <td>${isSelected ? maxVal : "—"}</td>
      <td>${required}</td>
      <td>${formatNumber(rowCost)} BP</td>
    `;
    boostTable.appendChild(row);
  });

  boostTable.querySelectorAll("select[data-boost-id]").forEach((select) => {
    select.addEventListener("change", () => {
      setBoostId(Number(select.dataset.boostId), select.value);
    });
  });

  boostTable.querySelectorAll("button[data-boost-minus]").forEach((button) => {
    button.addEventListener("click", () => changeBoostValue(Number(button.dataset.boostMinus), -1));
  });

  boostTable.querySelectorAll("button[data-boost-plus]").forEach((button) => {
    button.addEventListener("click", () => changeBoostValue(Number(button.dataset.boostPlus), 1));
  });

  boostTable.querySelectorAll("button[data-boost-clear]").forEach((button) => {
    button.addEventListener("click", () => setBoostId(Number(button.dataset.boostClear), 0));
  });
}

function render() {
  renderSummary();
  renderComponentTable();
  renderBoostTable();
  updateProfileButtonState();
}

lifetimeBpInput.addEventListener("input", () => {
  state.lifetimeBp = Math.max(0, Number(lifetimeBpInput.value) || 0);
  render();
});

if (badgeProfileLoad && badgeProfileSelect) {
  badgeProfileSelect.addEventListener("change", () => {
    const key = badgeProfileSelect.value;
    if (!key) return;
    const profiles = sharedStorage.loadProfiles();
    const found = findProfileByKey(profiles, key);
    if (!found) return;
    const { profile } = found;
    const parsed = parseBadgeStateObject(profile.defaults?.badge);
    if (!parsed.ok) return;
    applyParsedState(parsed.value);
    setStateJsonStatus(`Auto-loaded badge state from profile: ${profile.name}`);
    render();
  });

  badgeProfileLoad.addEventListener("click", () => {
    handleBadgeProfileReload();
  });
}

function handleBadgeProfileSave() {
    const key = badgeProfileSelect.value;
    if (!key) {
      setStateJsonStatus("Select a profile first.", true);
      updateProfileButtonState();
      return false;
    }
    const profiles = sharedStorage.loadProfiles();
    const found = findProfileByKey(profiles, key);
    if (!found) {
      setStateJsonStatus("Selected profile was not found.", true);
      updateProfileButtonState();
      return false;
    }
    const { profile, index } = found;

    if (!profile.defaults || typeof profile.defaults !== "object") {
      profile.defaults = {};
    }
    profile.defaults.badge = currentStateSnapshot();
    profiles[index] = profile;
    sharedStorage.saveProfiles(profiles);
    refreshProfileSelect(profiles);
    badgeProfileSelect.value = key;
    setStateJsonStatus(`Saved current badge state to profile: ${profile.name}`);
    if (badgeProfileStatusEl) {
      badgeProfileStatusEl.textContent = `Saved badge values to profile: ${profile.name}`;
      badgeProfileStatusEl.style.color = "#1f7a4d";
    }
    render();
    return true;
}

function handleBadgeProfileReload() {
  const key = badgeProfileSelect.value;
  if (!key) {
    setStateJsonStatus("Select a profile first.", true);
    updateProfileButtonState();
    return false;
  }
  const profiles = sharedStorage.loadProfiles();
  const found = findProfileByKey(profiles, key);
  if (!found) {
    setStateJsonStatus("Selected profile was not found.", true);
    updateProfileButtonState();
    return false;
  }
  const { profile } = found;

  const badgeState = profile.defaults?.badge;
  const parsed = parseBadgeStateObject(badgeState);
  if (!parsed.ok) {
    setStateJsonStatus("Profile has no saved badge state yet.", true);
    updateProfileButtonState();
    return false;
  }

  applyParsedState(parsed.value);
  setStateJsonStatus(`Reloaded badge state from profile: ${profile.name}`);
  if (badgeProfileStatusEl) {
    badgeProfileStatusEl.textContent = `Reloaded badge values from profile: ${profile.name}`;
    badgeProfileStatusEl.style.color = "#b42318";
  }
  render();
  return true;
}

if (badgeProfileSelect && badgeProfileSaveButtons.length > 0) {
  badgeProfileSaveButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handleBadgeProfileSave();
    });
  });
}

if (badgeProfileSelect && badgeProfileReloadButtons.length > 0) {
  badgeProfileReloadButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handleBadgeProfileReload();
    });
  });
}

refreshProfileSelect(sharedStorage.loadProfiles());
if (badgeProfileSelect) {
  const selected = localStorage.getItem(sharedStorage.SELECTED_PROFILE_KEY) || "";
  if (selected) {
    badgeProfileSelect.value = selected;
    if (badgeProfileSelect.value === selected) {
      badgeProfileSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}
window.addEventListener("focus", () => {
  refreshProfileSelect(sharedStorage.loadProfiles());
  updateProfileButtonState();
});
render();
