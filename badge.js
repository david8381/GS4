const lifetimeBpInput = document.getElementById("lifetimeBp");
const upgradeCostEl = document.getElementById("upgradeCost");
const bpRemainingEl = document.getElementById("bpRemaining");
const slotSummaryEl = document.getElementById("slotSummary");
const rechargeCostEl = document.getElementById("rechargeCost");

const componentTable = document.getElementById("componentTable");
const boostTable = document.getElementById("boostTable");

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
  "Multi Opponent Combat Ranks",
  "Physical Fitness Ranks",
  "Dodging Ranks",
  "Arcane Symbols Ranks",
  "Magic Item Use Ranks",
  "Spell Aiming Ranks",
  "Harness Power Ranks",
  "Elemental Mana Control Ranks",
  "Spirit Mana Control Ranks",
  "Mental Mana Control Ranks",
  "Elemental Lore - Air Ranks",
  "Elemental Lore - Earth Ranks",
  "Elemental Lore - Fire Ranks",
  "Elemental Lore - Water Ranks",
  "Spiritual Lore - Blessings Ranks",
  "Spiritual Lore - Religion Ranks",
  "Spiritual Lore - Summoning Ranks",
  "Spiritual Lore - Transformation Ranks",
  "Mental Lore - Divination Ranks",
  "Mental Lore - Manipulation Ranks",
  "Mental Lore - Telepathy Ranks",
  "Mental Lore - Transference Ranks",
  "Survival Ranks",
  "Disarm Traps Ranks",
  "Picking Locks Ranks",
  "Stalking and Hiding Ranks",
  "Perception Ranks",
  "Climbing Ranks",
  "Swimming Ranks",
  "First Aid Ranks",
  "Trading Ranks",
  "Pickpocketing Ranks",
  "Spell Research Ranks",
  "Spiritual CS",
  "Elemental CS",
  "Mental CS",
  "Brawling Ranks",
  "Ambush Ranks",
  "Thrown Weapons Ranks",
  "Polearms Ranks",
  "Ranged Weapons Ranks",
  "Edged Weapons Ranks",
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
  const used = nonZeroCount(components);
  let slots = total > 0 ? 1 : 0;
  if (total >= 10 && used <= 2) slots = Math.max(slots, 2);
  if (total >= 20 && used <= 3) slots = Math.max(slots, 3);
  return slots;
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
    29: { unit: 4000 },
    40: { unit: 4800, max: 4 },
    41: { unit: 1600 },
    43: { unit: 3200 },
    44: { unit: 3200 },
    69: { unit: 800, max: 10 },
    70: { unit: 800, max: 10 },
  };

  for (let id = 50; id <= 63; id += 1) rankUnitOverrides[id] = { unit: 4000 };
  for (let id = 64; id <= 68; id += 1) rankUnitOverrides[id] = { unit: 1600 };
  for (let id = 71; id <= 73; id += 1) rankUnitOverrides[id] = { unit: 1600 };

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
    69: 80,
    70: 80,
  };
  for (let id = 50; id <= 63; id += 1) bonusUnitOverrides[id] = 400;
  for (let id = 64; id <= 68; id += 1) bonusUnitOverrides[id] = 160;
  for (let id = 71; id <= 73; id += 1) bonusUnitOverrides[id] = 160;

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

function currentUpgradeCost() {
  return state.components.reduce((sum, level) => sum + upgradeCostForLevel(level), 0);
}

function boostCost(entry) {
  const def = boostById.get(entry.id);
  if (!def) return 0;
  return triangularCost(def.unit, entry.value);
}

function currentRechargeCost() {
  return state.boosts.reduce((sum, entry) => sum + boostCost(entry), 0);
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
  const slots = slotCount(state.components);

  upgradeCostEl.textContent = `${formatNumber(upgrade)} BP`;

  bpRemainingEl.textContent = `${formatNumber(state.lifetimeBp - upgrade)} BP`;
  slotSummaryEl.textContent = `Slots: ${slots} / 3`;

  rechargeCostEl.textContent = `${formatNumber(recharge)} BP`;
}

function renderComponentTable() {
  componentTable.innerHTML = "";
  state.components.forEach((level, index) => {
    const row = document.createElement("tr");
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

    const row = document.createElement("tr");
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
          <button class="btn ghost" data-boost-minus="${index}" type="button">-</button>
          <span>${entry.value}</span>
          <button class="btn ghost" data-boost-plus="${index}" type="button">+</button>
        </div>
      </td>
      <td>${def.max}</td>
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
}

lifetimeBpInput.addEventListener("input", () => {
  state.lifetimeBp = Math.max(0, Number(lifetimeBpInput.value) || 0);
  render();
});

render();
