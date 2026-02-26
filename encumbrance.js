const raceSelect = document.getElementById("race");
const strInput = document.getElementById("strStat");
const conInput = document.getElementById("conStat");
const strDeltaInput = document.getElementById("strDelta");
const conDeltaInput = document.getElementById("conDelta");
const profileSelect = document.getElementById("profileSelect");
const useEnhanced = document.getElementById("useEnhanced");

const gearWeightInput = document.getElementById("gearWeight");
const silversInput = document.getElementById("silvers");
const armorAsgSelect = document.getElementById("armorAsg");
const armorWeightInput = document.getElementById("armorWeight");
const accessoryWeightInput = document.getElementById("accessoryWeight");
const pfBonusInput = document.getElementById("pfBonus");
const resultsBody = document.getElementById("results");

const PROFILE_KEY = "gs4.characterProfiles";

const races = [
  { key: "burghal", name: "Burghal Gnome", baseWeight: 40, weightFactor: 0.4, maxWeight: 120, encFactor: 0.5 },
  { key: "halfling", name: "Halfling", baseWeight: 45.3333, weightFactor: 0.4533, maxWeight: 136, encFactor: 0.5 },
  { key: "forest-gnome", name: "Forest Gnome", baseWeight: 47.6667, weightFactor: 0.4767, maxWeight: 143, encFactor: 0.6 },
  { key: "aelotoi", name: "Aelotoi", baseWeight: 67.6667, weightFactor: 0.6767, maxWeight: 203, encFactor: 0.75 },
  { key: "elf", name: "Elf", baseWeight: 70, weightFactor: 0.7, maxWeight: 210, encFactor: 0.78 },
  { key: "erithian", name: "Erithian", baseWeight: 72.3333, weightFactor: 0.7233, maxWeight: 217, encFactor: 0.85 },
  { key: "sylvankind", name: "Sylvankind", baseWeight: 72.3333, weightFactor: 0.7233, maxWeight: 217, encFactor: 0.81 },
  { key: "dark-elf", name: "Dark Elf", baseWeight: 77.6667, weightFactor: 0.7767, maxWeight: 233, encFactor: 0.84 },
  { key: "dwarf", name: "Dwarf", baseWeight: 77.6667, weightFactor: 0.7767, maxWeight: 233, encFactor: 0.8 },
  { key: "half-elf", name: "Half-Elf", baseWeight: 82.3333, weightFactor: 0.8233, maxWeight: 247, encFactor: 0.92 },
  { key: "human", name: "Human", baseWeight: 90, weightFactor: 0.9, maxWeight: 270, encFactor: 1.0 },
  { key: "half-krolvin", name: "Half-Krolvin", baseWeight: 100, weightFactor: 1.0, maxWeight: 300, encFactor: 1.1 },
  { key: "giantman", name: "Giantman", baseWeight: 120, weightFactor: 1.2, maxWeight: 360, encFactor: 1.33 },
];

const armorAsg = [
  { key: "none", name: "None / Normal Clothing (ASG 1)", standardWeight: 0, cmanPenalty: 0 },
  { key: "asg2", name: "Robes (ASG 2)", standardWeight: 8, cmanPenalty: 0 },
  { key: "asg5", name: "Light Leather (ASG 5)", standardWeight: 10, cmanPenalty: 0 },
  { key: "asg6", name: "Full Leather (ASG 6)", standardWeight: 13, cmanPenalty: 0 },
  { key: "asg7", name: "Reinforced Leather (ASG 7)", standardWeight: 15, cmanPenalty: 2 },
  { key: "asg8", name: "Double Leather (ASG 8)", standardWeight: 16, cmanPenalty: 2 },
  { key: "asg9", name: "Leather Breastplate (ASG 9)", standardWeight: 16, cmanPenalty: 3 },
  { key: "asg10", name: "Cuirbouilli Leather (ASG 10)", standardWeight: 17, cmanPenalty: 3 },
  { key: "asg11", name: "Studded Leather (ASG 11)", standardWeight: 20, cmanPenalty: 3 },
  { key: "asg12", name: "Brigandine Armor (ASG 12)", standardWeight: 25, cmanPenalty: 4 },
  { key: "asg13", name: "Chain Mail (ASG 13)", standardWeight: 25, cmanPenalty: 4 },
  { key: "asg14", name: "Double Chain (ASG 14)", standardWeight: 25, cmanPenalty: 4 },
  { key: "asg15", name: "Augmented Chain (ASG 15)", standardWeight: 26, cmanPenalty: 5 },
  { key: "asg16", name: "Chain Hauberk (ASG 16)", standardWeight: 27, cmanPenalty: 5 },
  { key: "asg17", name: "Metal Breastplate (ASG 17)", standardWeight: 23, cmanPenalty: 6 },
  { key: "asg18", name: "Augmented Plate (ASG 18)", standardWeight: 25, cmanPenalty: 7 },
  { key: "asg19", name: "Half Plate (ASG 19)", standardWeight: 50, cmanPenalty: 8 },
  { key: "asg20", name: "Full Plate (ASG 20)", standardWeight: 75, cmanPenalty: 10 },
];

function fillSelect(select, items) {
  select.innerHTML = "";
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.key;
    option.textContent = item.name;
    select.appendChild(option);
  });
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

function refreshProfileSelect(profiles) {
  profileSelect.innerHTML = "<option value=\"\">Select from Profile</option>";
  profiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.name;
    profileSelect.appendChild(option);
  });
}

function findProfile(profiles, id) {
  return profiles.find((profile) => profile.id === id);
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

// INFO parsing moved to profile manager page.

function normalizeRaceName(raw) {
  const cleaned = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (cleaned === "darkelf") return "Dark Elf";
  if (cleaned === "halfelf") return "Half-Elf";
  if (cleaned === "halfkrolvin") return "Half-Krolvin";
  if (cleaned === "giantman") return "Giantman";
  if (cleaned === "forestrgnome" || cleaned === "forestgnome") return "Forest Gnome";
  return raw;
}

function applyProfile(profile) {
  const raceName = normalizeRaceName(profile.race);
  const raceOption = races.find((race) => race.name.toLowerCase() === raceName.toLowerCase());
  if (raceOption) {
    raceSelect.value = raceOption.key;
  }

  const useEnhancedStats = useEnhanced.checked;
  const strValue = useEnhancedStats
    ? profile.stats?.str?.enhanced ?? profile.strEnhanced
    : profile.stats?.str?.base ?? profile.strBase;
  const conValue = useEnhancedStats
    ? profile.stats?.con?.enhanced ?? profile.conEnhanced
    : profile.stats?.con?.base ?? profile.conBase;

  strInput.value = String(strValue ?? strInput.value);
  conInput.value = String(conValue ?? conInput.value);
  gearWeightInput.value = String(profile.defaults?.gearWeight ?? gearWeightInput.value);
  silversInput.value = String(profile.defaults?.silvers ?? silversInput.value);
  armorAsgSelect.value = profile.defaults?.armorAsg ?? armorAsgSelect.value;
  armorWeightInput.value = String(profile.defaults?.armorWeight ?? armorWeightInput.value);
  accessoryWeightInput.value = String(profile.defaults?.accessoryWeight ?? accessoryWeightInput.value);
  const pfSkill = profile.skills?.find((skill) => skill.name.toLowerCase() === "physical fitness");
  const pfValue = pfSkill?.bonus ?? profile.defaults?.pfBonus;
  pfBonusInput.value = String(pfValue ?? pfBonusInput.value);
  updateResults();
}

function evenStat(value) {
  const clipped = clamp(Math.floor(value), 1, 100);
  return clipped % 2 === 0 ? clipped : clipped - 1;
}

function formatNumber(value, decimals = 2) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function truncToTwo(value) {
  return Math.trunc(value * 100) / 100;
}

function getRace() {
  return races.find((race) => race.key === raceSelect.value) || races[0];
}

function computeBodyWeight(strStat, conStat, race) {
  const strEven = evenStat(strStat);
  const conEven = evenStat(conStat);
  const weight = race.baseWeight + (strEven + conEven) * race.weightFactor;
  return Math.min(weight, race.maxWeight);
}

function computeUnencumbered(strStat, bodyWeight) {
  const base = ((strStat - 20) / 200) * bodyWeight + bodyWeight / 200;
  return truncToTwo(base);
}

function armorAdjustment(race, armorStandard, armorActual) {
  return (armorStandard - armorActual) * race.encFactor;
}

function encumbranceMessage(percent) {
  if (percent <= 0) return "None";
  if (percent <= 10) return "0-10%";
  if (percent <= 20) return "10-20%";
  if (percent <= 30) return "20-30%";
  if (percent <= 40) return "30-40%";
  if (percent <= 50) return "40-50%";
  if (percent <= 65) return "50-65%";
  if (percent <= 80) return "65-80%";
  if (percent <= 100) return "80-100%";
  return "100%+";
}

function computeResults(stats, inputs, race) {
  const bodyWeight = computeBodyWeight(stats.str, stats.con, race);
  const effectiveStr = clamp(stats.str, 1, 100);
  const unenc = computeUnencumbered(effectiveStr, bodyWeight);

  const armorAdj = armorAdjustment(race, inputs.armorStandard, inputs.armorActual);
  const adjustedCapacity = unenc + armorAdj;

  const silversWeight = inputs.silvers / 160;
  const accessoryWeight = inputs.accessoryWeight * race.encFactor;

  const totalCarry = inputs.gearWeight + silversWeight + accessoryWeight;
  const rawEncumbrance = Math.max(0, totalCarry - adjustedCapacity);
  const pfReduction = inputs.pfBonus / 10;
  const encumbrance = Math.max(0, rawEncumbrance - pfReduction);

  const encPercent = bodyWeight > 0 ? (encumbrance / bodyWeight) * 100 : 0;
  const smrPenalty = Math.ceil(encPercent);

  const maxCarry = 1.5 * bodyWeight + adjustedCapacity;
  const silverCap = 1.99 * bodyWeight + adjustedCapacity;
  const maxItemWeight = Math.max(0, 1.5 * bodyWeight - encumbrance);

  return {
    bodyWeight,
    effectiveStr,
    unenc,
    armorAdj,
    adjustedCapacity,
    totalCarry,
    rawEncumbrance,
    pfReduction,
    encumbrance,
    encPercent,
    encMessage: encumbranceMessage(encPercent),
    smrPenalty,
    maxCarry,
    silverCap,
    maxItemWeight,
  };
}

function renderRow(label, currentValue, futureValue) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${label}</td>
    <td>${currentValue}</td>
    <td>${futureValue}</td>
  `;
  resultsBody.appendChild(row);
}

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

function updateArmorWeight() {
  const selected = armorAsg.find((item) => item.key === armorAsgSelect.value);
  if (!selected) return;
  armorWeightInput.value = String(selected.standardWeight);
}

function updateResults() {
  resultsBody.innerHTML = "";

  const race = getRace();
  const strStat = clamp(Number(strInput.value), 1, 100);
  const conStat = clamp(Number(conInput.value), 1, 100);
  const strDelta = clamp(Number(strDeltaInput.value), -100, 100);
  const conDelta = clamp(Number(conDeltaInput.value), -100, 100);

  const armor = armorAsg.find((item) => item.key === armorAsgSelect.value) || armorAsg[0];

  const inputs = {
    gearWeight: Math.max(0, Number(gearWeightInput.value) || 0),
    silvers: Math.max(0, Number(silversInput.value) || 0),
    armorStandard: armor.standardWeight,
    armorActual: Math.max(0, Number(armorWeightInput.value) || 0),
    accessoryWeight: Math.max(0, Number(accessoryWeightInput.value) || 0),
    pfBonus: Math.max(0, Number(pfBonusInput.value) || 0),
  };

  const current = computeResults({ str: strStat, con: conStat }, inputs, race);
  const future = computeResults(
    { str: clamp(strStat + strDelta, 1, 100), con: clamp(conStat + conDelta, 1, 100) },
    inputs,
    race
  );

  renderRow(
    "STR used for capacity",
    `${formatNumber(current.effectiveStr, 0)}`,
    `${formatNumber(future.effectiveStr, 0)}`
  );
  renderRow("Body weight", `${formatNumber(current.bodyWeight)} lbs`, `${formatNumber(future.bodyWeight)} lbs`);
  renderRow("Unencumbered capacity", `${formatNumber(current.unenc)} lbs`, `${formatNumber(future.unenc)} lbs`);
  renderRow("Armor adjustment", `${formatNumber(current.armorAdj)} lbs`, `${formatNumber(future.armorAdj)} lbs`);
  renderRow("Adjusted capacity", `${formatNumber(current.adjustedCapacity)} lbs`, `${formatNumber(future.adjustedCapacity)} lbs`);
  renderRow("Total carry (excl. armor)", `${formatNumber(current.totalCarry)} lbs`, `${formatNumber(future.totalCarry)} lbs`);
  renderRow("PF reduction", `${formatNumber(current.pfReduction)} lbs`, `${formatNumber(future.pfReduction)} lbs`);
  renderRow("Encumbrance weight", `${formatNumber(current.encumbrance)} lbs`, `${formatNumber(future.encumbrance)} lbs`);
  renderRow("Encumbrance %", formatPercent(current.encPercent), formatPercent(future.encPercent));
  renderRow("Encumbrance tier", current.encMessage, future.encMessage);
  renderRow("Encumbrance penalty (CMAN/SMR)", `${current.smrPenalty}%`, `${future.smrPenalty}%`);
  renderRow("Armor CMAN penalty (ASG)", `${armor.cmanPenalty}`, `${armor.cmanPenalty}`);

  renderRow("Max carry (items)", `${formatNumber(current.maxCarry)} lbs`, `${formatNumber(future.maxCarry)} lbs`);
  renderRow("Silver cap", `${formatNumber(current.silverCap)} lbs`, `${formatNumber(future.silverCap)} lbs`);
  renderRow("Max single item weight", `${formatNumber(current.maxItemWeight)} lbs`, `${formatNumber(future.maxItemWeight)} lbs`);
}

fillSelect(raceSelect, races);
fillSelect(armorAsgSelect, armorAsg);
updateArmorWeight();
updateResults();

let profiles = loadProfiles();
refreshProfileSelect(profiles);

[raceSelect, strInput, conInput, strDeltaInput, conDeltaInput, gearWeightInput, silversInput, armorAsgSelect,
  armorWeightInput, accessoryWeightInput, pfBonusInput, useEnhanced].forEach((input) => {
  input.addEventListener("input", updateResults);
});

armorAsgSelect.addEventListener("change", () => {
  updateArmorWeight();
  updateResults();
});

profileSelect.addEventListener("change", () => {
  const selected = profileSelect.value;
  if (!selected) {
    updateResults();
    return;
  }
  const profile = findProfile(profiles, selected);
  if (profile) applyProfile(profile);
});

useEnhanced.addEventListener("change", () => {
  const selected = profileSelect.value;
  if (selected) {
    const profile = findProfile(profiles, selected);
    if (profile) applyProfile(profile);
  } else {
    updateResults();
  }
});
