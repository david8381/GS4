const lifetimeBpInput = document.getElementById("lifetimeBp");
const upgradeCostEl = document.getElementById("upgradeCost");
const bpRemainingEl = document.getElementById("bpRemaining");
const slotSummaryEl = document.getElementById("slotSummary");
const rechargeCostEl = document.getElementById("rechargeCost");
const powerSummaryEl = document.getElementById("powerSummary");
const validationMessageEl = document.getElementById("validationMessage");
const runBadgeTestsBtn = document.getElementById("runBadgeTests");
const testOutputEl = document.getElementById("testOutput");
const stateJsonInput = document.getElementById("stateJson");
const validateStateJsonBtn = document.getElementById("validateStateJson");
const stateJsonStatusEl = document.getElementById("stateJsonStatus");
const badgeProfileSelect = document.getElementById("badgeProfileSelect");
const badgeProfileLoad = document.getElementById("badgeProfileLoad");
const badgeProfileSave = document.getElementById("badgeProfileSave");

const componentTable = document.getElementById("componentTable");
const boostTable = document.getElementById("boostTable");
const POWER_PER_UPGRADE = 1200;
const PROFILE_KEY = "gs4.characterProfiles";

const componentNames = ["Material", "Binding", "Device", "Motif", "Gem"];

const statNames = [
  "Strength",
  "Constitution",
  "Dexterity",
  "Agility",
  "Discipline",
  "Aura",
  "Logic",
  "Intuition",
  "Wisdom",
  "Influence",
];

const rankNames = [
  "Two Weapon Combat Ranks",
  "Armor Use Ranks",
  "Shield Use Ranks",
  "Combat Maneuvers Ranks",
  "Edged Weapons Ranks",
  "Blunt Weapons Ranks",
  "Two-Handed Weapons Ranks",
  "Ranged Weapons Ranks",
  "Thrown Weapons Ranks",
  "Polearm Weapons Ranks",
  "Brawling Ranks",
  "Ambushing Ranks",
  "Multi Opponent Combat Ranks",
  "Physical Fitness Ranks",
  "Dodging Ranks",
  "Arcane Symbols Ranks",
  "Magic Item Use Ranks",
  "Spell Aiming Ranks",
  "Harness Power Ranks",
  "Elemental Mana Control Ranks",
  "Mental Mana Control Ranks",
  "Spirit Mana Control Ranks",
  "Elemental Lore - Air Ranks",
  "Elemental Lore - Earth Ranks",
  "Elemental Lore - Fire Ranks",
  "Elemental Lore - Water Ranks",
  "Spiritual Lore - Blessings Ranks",
  "Spiritual Lore - Religion Ranks",
  "Spiritual Lore - Summoning Ranks",
  "Sorcerous Lore - Demonology Ranks",
  "Sorcerous Lore - Necromancy Ranks",
  "Mental Lore - Divination Ranks",
  "Mental Lore - Manipulation Ranks",
  "Mental Lore - Telepathy Ranks",
  "Mental Lore - Transference Ranks",
  "Mental Lore - Transformation Ranks",
  "Survival Ranks",
  "Disarming Traps Ranks",
  "Picking Locks Ranks",
  "Stalking and Hiding Ranks",
  "Perception Ranks",
  "Climbing Ranks",
  "Swimming Ranks",
  "First Aid Ranks",
  "Trading Ranks",
  "Pickpocketing Ranks",
];

function formatNumber(value) {
  return Math.round(value).toLocaleString("en-US");
}

function triangularCost(unit, value) {
  if (value <= 0) return 0;
  return unit * ((value * (value + 1)) / 2);
}

function upgradeCostForLevel(level) {
  return 10000 * ((level * (level + 1)) / 2);
}

function nextUpgradeCost(level) {
  if (level >= 10) return 0;
  return (level + 1) * 10000;
}

function nonZeroCount(components) {
  return components.filter((value) => value > 0).length;
}

function slotCount(components) {
  const total = components.reduce((sum, value) => sum + value, 0);
  let slots = total > 0 ? 1 : 0;
  if (total >= 10) slots = Math.max(slots, 2);
  if (total >= 20) slots = Math.max(slots, 3);
  return slots;
}

function totalUpgrades(components) {
  return components.reduce((sum, value) => sum + value, 0);
}

function buildBoostDefs() {
  const defs = [];

  const statUnits = [320, 240, 240, 240, 240, 480, 160, 160, 400, 160];
  statNames.forEach((name, idx) => {
    defs.push({ id: idx + 1, name: `${name} Stat`, max: 10, unit: statUnits[idx] });
  });

  const statBonusUnits = [1120, 880, 880, 880, 880, 1680, 560, 560, 1440, 560];
  statNames.forEach((name, idx) => {
    defs.push({ id: idx + 11, name: `${name} Bonus`, max: 5, unit: statBonusUnits[idx] });
  });

  defs.push({ id: 21, name: "Max Mana", max: 20, unit: 240 });
  defs.push({ id: 22, name: "Mana Recovery", max: 10, unit: 800 });
  defs.push({ id: 23, name: "Max Health", max: 20, unit: 160 });
  defs.push({ id: 24, name: "Health Recovery", max: 10, unit: 800 });
  defs.push({ id: 25, name: "Max Stamina", max: 20, unit: 240 });
  defs.push({ id: 26, name: "Stamina Recovery", max: 10, unit: 240 });
  defs.push({ id: 27, name: "Spirit Recovery", max: 2, unit: 16000 });

  const rankUnitOverrides = {
    29: { unit: 4000 }, // Armor Use
    40: { unit: 4800, max: 4 }, // MOC
    41: { unit: 1600 }, // PF
    43: { unit: 3200 }, // Arcane Symbols
    44: { unit: 3200 }, // MIU
    50: { unit: 4000 },
    51: { unit: 4000 },
    52: { unit: 4000 },
    53: { unit: 4000 },
    54: { unit: 4000 },
    55: { unit: 4000 },
    56: { unit: 4000 },
    57: { unit: 4000 },
    58: { unit: 4000 },
    59: { unit: 4000 },
    60: { unit: 4000 },
    61: { unit: 4000 },
    62: { unit: 4000 },
    63: { unit: 4000 },
    64: { unit: 1600 },
    65: { unit: 1600 },
    66: { unit: 1600 },
    67: { unit: 1600 },
    68: { unit: 1600 },
    69: { unit: 800, max: 10 }, // Climbing
    70: { unit: 800, max: 10 }, // Swimming
    71: { unit: 1600 },
    72: { unit: 1600 },
    73: { unit: 1600 },
  };

  rankNames.forEach((name, idx) => {
    const id = 28 + idx;
    const override = rankUnitOverrides[id] || {};
    defs.push({
      id,
      name,
      max: override.max || 5,
      unit: override.unit || 2400,
    });
  });

  const bonusUnitOverrides = {
    29: 400,
    40: 480,
    41: 160,
    43: 320,
    44: 320,
    50: 400,
    51: 400,
    52: 400,
    53: 400,
    54: 400,
    55: 400,
    56: 400,
    57: 400,
    58: 400,
    59: 400,
    60: 400,
    61: 400,
    62: 400,
    63: 400,
    64: 160,
    65: 160,
    66: 160,
    67: 160,
    68: 160,
    69: 80,
    70: 80,
    71: 160,
    72: 160,
    73: 160,
  };

  rankNames.forEach((name, idx) => {
    const sourceId = 28 + idx;
    const id = 74 + idx;
    defs.push({
      id,
      name: name.replace("Ranks", "Bonus"),
      max: 10,
      unit: bonusUnitOverrides[sourceId] || 240,
    });
  });

  return defs;
}

const boostDefs = buildBoostDefs();
const boostById = new Map(boostDefs.map((def) => [def.id, def]));

const state = {
  lifetimeBp: 300000,
  components: [0, 0, 0, 0, 0],
  boosts: [
    { id: 1, value: 0 },
    { id: 22, value: 0 },
    { id: 87, value: 0 },
  ],
};

function safeInt(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.trunc(number);
}

function loadProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || "[]");
    if (Array.isArray(stored)) return stored;
  } catch (error) {
    return [];
  }
  return [];
}

function saveProfiles(profiles) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
}

function profileKey(profile, index) {
  if (profile && profile.id != null && profile.id !== "") return String(profile.id);
  const safeName = profile && profile.name ? String(profile.name).toLowerCase() : "profile";
  return `legacy-${index}-${safeName}`;
}

function refreshProfileSelect(profiles) {
  if (!badgeProfileSelect) return;
  const selected = badgeProfileSelect.value;
  badgeProfileSelect.innerHTML = '<option value="">Select from Profile</option>';
  profiles.forEach((profile, index) => {
    const option = document.createElement("option");
    option.value = profileKey(profile, index);
    option.textContent = profile.name;
    badgeProfileSelect.appendChild(option);
  });
  if (selected) badgeProfileSelect.value = selected;
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

function syncStateJson() {
  if (!stateJsonInput) return;
  stateJsonInput.value = JSON.stringify(currentStateSnapshot(), null, 2);
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
        boosts.push({ id: 1, value: 0 });
        return;
      }

      const id = safeInt(entry.id);
      const def = boostById.get(id);
      if (!def) reasons.push(`boosts[${index}].id is not a valid boost id.`);

      const value = safeInt(entry.value);
      if (value == null || value < 0 || (def && value > def.max)) {
        reasons.push(`boosts[${index}].value must be between 0 and max for selected id.`);
      }

      boosts.push({ id: def ? id : 1, value: value ?? 0 });
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

function currentUpgradeCost() {
  return state.components.reduce((sum, level) => sum + upgradeCostForLevel(level), 0);
}

function upgradeCostForComponents(components) {
  return components.reduce((sum, level) => sum + upgradeCostForLevel(level), 0);
}

function boostCost(entry) {
  const def = boostById.get(entry.id);
  if (!def) return 0;
  return triangularCost(def.unit, entry.value);
}

function boostCostFor(id, value) {
  const def = boostById.get(id);
  if (!def) return 0;
  return triangularCost(def.unit, value);
}

function currentRechargeCost() {
  return state.boosts.reduce((sum, entry) => sum + boostCost(entry), 0);
}

function rechargeCostForBoosts(boosts) {
  return boosts.reduce((sum, entry) => sum + boostCost(entry), 0);
}

function requiredUpgradesForCost(cost) {
  if (cost <= 0) return 0;
  return Math.ceil(cost / POWER_PER_UPGRADE);
}

function availableEnhancementPower() {
  return totalUpgrades(state.components) * POWER_PER_UPGRADE;
}

function availableEnhancementPowerForComponents(components) {
  return totalUpgrades(components) * POWER_PER_UPGRADE;
}

function slotIsUnlocked(index) {
  return index < slotCount(state.components);
}

function evaluateTestState(testState) {
  const upgrade = upgradeCostForComponents(testState.components);
  const slotsUnlocked = slotCount(testState.components);
  const slotsUsed = testState.boosts.filter((entry) => entry.value > 0).length;
  const recharge = rechargeCostForBoosts(testState.boosts);
  const power = availableEnhancementPowerForComponents(testState.components);
  return {
    upgrade,
    upgradeValid: upgrade <= testState.lifetimeBp,
    slotsUnlocked,
    slotsUsed,
    recharge,
    power,
    enhValid: slotsUsed <= slotsUnlocked && recharge <= power,
  };
}

function runSelfTests() {
  const tests = [
    {
      name: "T1 fresh badge valid",
      state: { lifetimeBp: 300000, components: [0, 0, 0, 0, 0], boosts: [{ id: 1, value: 0 }, { id: 22, value: 0 }, { id: 87, value: 0 }] },
      expect: { upgrade: 0, upgradeValid: true, slotsUnlocked: 0, enhValid: true },
    },
    {
      name: "T2 component overspend invalid",
      state: { lifetimeBp: 50000, components: [3, 0, 0, 0, 0], boosts: [{ id: 1, value: 0 }, { id: 22, value: 0 }, { id: 87, value: 0 }] },
      expect: { upgrade: 60000, upgradeValid: false },
    },
    {
      name: "T3 unlock second slot",
      state: { lifetimeBp: 9999999, components: [5, 5, 0, 0, 0], boosts: [{ id: 1, value: 1 }, { id: 22, value: 1 }, { id: 87, value: 0 }] },
      expect: { slotsUnlocked: 2, enhValid: true },
    },
    {
      name: "T4 third boost invalid when only two slots unlocked",
      state: { lifetimeBp: 9999999, components: [5, 5, 0, 0, 0], boosts: [{ id: 1, value: 1 }, { id: 22, value: 1 }, { id: 87, value: 1 }] },
      expect: { slotsUnlocked: 2, enhValid: false },
    },
    {
      name: "T5 high-cost boost invalid at low upgrades",
      state: { lifetimeBp: 9999999, components: [1, 0, 0, 0, 0], boosts: [{ id: 29, value: 5 }, { id: 22, value: 0 }, { id: 87, value: 0 }] },
      expect: { power: 1200, enhValid: false },
    },
    {
      name: "T6 valid at higher upgrades",
      state: { lifetimeBp: 9999999, components: [10, 10, 0, 0, 0], boosts: [{ id: 29, value: 2 }, { id: 22, value: 2 }, { id: 87, value: 0 }] },
      expect: { slotsUnlocked: 3, enhValid: true },
    },
    {
      name: "T7 distributed upgrades still unlock three slots",
      state: { lifetimeBp: 9999999, components: [10, 10, 10, 10, 10], boosts: [{ id: 1, value: 1 }, { id: 22, value: 1 }, { id: 87, value: 1 }] },
      expect: { slotsUnlocked: 3, enhValid: true },
    },
  ];

  let pass = 0;
  const lines = [];
  tests.forEach((test) => {
    const got = evaluateTestState(test.state);
    let ok = true;
    Object.entries(test.expect).forEach(([key, expected]) => {
      if (got[key] !== expected) ok = false;
    });
    if (ok) pass += 1;
    lines.push(`${ok ? "PASS" : "FAIL"} ${test.name}`);
    lines.push(` got: ${JSON.stringify(got)}`);
    lines.push(` exp: ${JSON.stringify(test.expect)}`);
  });
  lines.push("");
  lines.push(`Summary: ${pass}/${tests.length} passing`);
  testOutputEl.textContent = lines.join("\n");
  testOutputEl.style.color = pass === tests.length ? "#1f4e42" : "#b42318";
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
  const def = boostById.get(numeric);
  if (!def) return;
  state.boosts[index].id = numeric;
  state.boosts[index].value = Math.min(state.boosts[index].value, def.max);
  render();
}

function renderSummary() {
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

  upgradeCostEl.textContent = `${formatNumber(upgrade)} BP`;
  upgradeCostEl.style.color = upgradeValid ? "#1f4e42" : "#b42318";

  bpRemainingEl.textContent = `${formatNumber(state.lifetimeBp - upgrade)} BP`;
  bpRemainingEl.style.color = upgradeValid && isValid ? "#1f4e42" : "#b42318";
  slotSummaryEl.textContent = `Slots Used: ${slotsUsed} / ${slotsUnlocked} · Upgrades: ${upgrades}`;
  slotSummaryEl.style.color = slotValid ? "#1f4e42" : "#b42318";

  rechargeCostEl.textContent = `${formatNumber(recharge)} BP`;
  rechargeCostEl.style.color = isValid ? "#1f4e42" : "#b42318";
  powerSummaryEl.textContent = `Enhancive power: ${formatNumber(recharge)} / ${formatNumber(powerAvailable)}`;
  powerSummaryEl.style.color = isValid ? "#1f4e42" : "#b42318";

  const reasons = [];
  if (!upgradeValid) {
    reasons.push(
      `Component upgrades cost ${formatNumber(upgrade)} BP but lifetime BP is only ${formatNumber(state.lifetimeBp)}.`
    );
  }
  if (!slotValid) {
    reasons.push(`Using ${slotsUsed} boost slots, but only ${slotsUnlocked} slot(s) are unlocked.`);
  }
  if (!powerValid) {
    reasons.push(
      `Enhancement power required is ${formatNumber(recharge)}, but only ${formatNumber(powerAvailable)} is available from upgrades.`
    );
  }

  if (reasons.length === 0) {
    validationMessageEl.textContent = "Configuration valid.";
    validationMessageEl.style.color = "#1f4e42";
  } else {
    validationMessageEl.textContent = `Invalid configuration: ${reasons.join(" ")}`;
    validationMessageEl.style.color = "#b42318";
  }
}

function renderComponentTable() {
  componentTable.innerHTML = "";
  const overspent = currentUpgradeCost() > state.lifetimeBp;
  state.components.forEach((level, index) => {
    const row = document.createElement("tr");
    row.style.color = overspent ? "#b42318" : "#1f4e42";
    const total = upgradeCostForLevel(level);
    const next = nextUpgradeCost(level);

    row.innerHTML = `
      <td>${componentNames[index]}</td>
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

  state.boosts.forEach((entry, index) => {
    const def = boostById.get(entry.id);
    const rowCost = boostCost(entry);
    const required = requiredUpgradesForCost(rowCost);
    const unlocked = slotIsUnlocked(index);
    const rowValid = (unlocked || entry.value === 0) && required <= totalUpgrades(state.components);

    const row = document.createElement("tr");
    row.style.color = rowValid ? "#1f4e42" : "#b42318";
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <select data-boost-id="${index}">
          ${boostDefs
            .map(
              (opt) =>
                `<option value="${opt.id}" ${opt.id === entry.id ? "selected" : ""}>${opt.id}. ${opt.name}</option>`
            )
            .join("")}
        </select>
      </td>
      <td>
        <div class="inline-actions">
          <button class="btn ghost" data-boost-minus="${index}" type="button" ${entry.value <= 0 ? "disabled" : ""}>-</button>
          <span>${entry.value}</span>
          <button class="btn ghost" data-boost-plus="${index}" type="button" ${entry.value >= def.max ? "disabled" : ""}>+</button>
        </div>
      </td>
      <td>${def.max}</td>
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
}

function render() {
  renderSummary();
  renderComponentTable();
  renderBoostTable();
  syncStateJson();
}

lifetimeBpInput.addEventListener("input", () => {
  state.lifetimeBp = Math.max(0, Number(lifetimeBpInput.value) || 0);
  render();
});

runBadgeTestsBtn.addEventListener("click", runSelfTests);

if (validateStateJsonBtn && stateJsonInput) {
  validateStateJsonBtn.addEventListener("click", () => {
    const parsed = parseStateJson(stateJsonInput.value);
    if (!parsed.ok) {
      setStateJsonStatus(`JSON invalid: ${parsed.reasons.join(" ")}`, true);
      return;
    }
    applyParsedState(parsed.value);
    setStateJsonStatus("JSON valid. Planner updated.");
    render();
  });

  stateJsonInput.addEventListener("input", () => {
    const parsed = parseStateJson(stateJsonInput.value);
    if (!parsed.ok) {
      setStateJsonStatus("Waiting for valid JSON...", true);
      return;
    }
    applyParsedState(parsed.value);
    setStateJsonStatus("JSON applied from editor.");
    render();
  });
}

if (badgeProfileLoad && badgeProfileSelect) {
  badgeProfileSelect.addEventListener("change", () => {
    const key = badgeProfileSelect.value;
    if (!key) return;
    const profiles = loadProfiles();
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
    const key = badgeProfileSelect.value;
    if (!key) {
      setStateJsonStatus("Select a profile first.", true);
      return;
    }
    const profiles = loadProfiles();
    const found = findProfileByKey(profiles, key);
    if (!found) {
      setStateJsonStatus("Selected profile was not found.", true);
      return;
    }
    const { profile } = found;

    const badgeState = profile.defaults?.badge;
    const parsed = parseBadgeStateObject(badgeState);
    if (!parsed.ok) {
      setStateJsonStatus("Profile has no saved badge state yet.", true);
      return;
    }

    applyParsedState(parsed.value);
    setStateJsonStatus(`Loaded badge state from profile: ${profile.name}`);
    render();
  });
}

if (badgeProfileSave && badgeProfileSelect) {
  badgeProfileSave.addEventListener("click", () => {
    const key = badgeProfileSelect.value;
    if (!key) {
      setStateJsonStatus("Select a profile first.", true);
      return;
    }
    const profiles = loadProfiles();
    const found = findProfileByKey(profiles, key);
    if (!found) {
      setStateJsonStatus("Selected profile was not found.", true);
      return;
    }
    const { profile, index } = found;

    if (!profile.defaults || typeof profile.defaults !== "object") {
      profile.defaults = {};
    }
    profile.defaults.badge = currentStateSnapshot();
    profiles[index] = profile;
    saveProfiles(profiles);
    refreshProfileSelect(profiles);
    badgeProfileSelect.value = key;
    setStateJsonStatus(`Saved current badge state to profile: ${profile.name}`);
  });
}

refreshProfileSelect(loadProfiles());
window.addEventListener("focus", () => {
  refreshProfileSelect(loadProfiles());
});
render();
