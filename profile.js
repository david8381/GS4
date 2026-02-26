const profileSelect = document.getElementById("profileSelect");
const profileApply = document.getElementById("profileApply");
const profileDelete = document.getElementById("profileDelete");
const profileSave = document.getElementById("profileSave");
const profileName = document.getElementById("profileName");
const profileRace = document.getElementById("profileRace");
const profileProfession = document.getElementById("profileProfession");
const profileLevel = document.getElementById("profileLevel");
const recalcStats = document.getElementById("recalcStats");
const infoImport = document.getElementById("infoImport");
const parseInfoStart = document.getElementById("parseInfoStart");
const importStatus = document.getElementById("importStatus");
const statGrid = document.getElementById("statGrid");
const skillsImport = document.getElementById("skillsImport");
const skillsStatus = document.getElementById("skillsStatus");
const skillsTable = document.getElementById("skillsTable");

const armorAsgSelect = document.getElementById("armorAsg");
const armorWeightInput = document.getElementById("armorWeight");
const accessoryWeightInput = document.getElementById("accessoryWeight");
const gearWeightInput = document.getElementById("gearWeight");
const silversInput = document.getElementById("silvers");
const pfBonusInput = document.getElementById("pfBonus");

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

const stats = [
  { key: "str", label: "Strength", abbr: "STR" },
  { key: "con", label: "Constitution", abbr: "CON" },
  { key: "dex", label: "Dexterity", abbr: "DEX" },
  { key: "agi", label: "Agility", abbr: "AGI" },
  { key: "dis", label: "Discipline", abbr: "DIS" },
  { key: "aur", label: "Aura", abbr: "AUR" },
  { key: "log", label: "Logic", abbr: "LOG" },
  { key: "int", label: "Intuition", abbr: "INT" },
  { key: "wis", label: "Wisdom", abbr: "WIS" },
  { key: "inf", label: "Influence", abbr: "INF" },
];

let currentSkills = [];
let currentLevel0Stats = null;

const professions = [
  "Bard",
  "Cleric",
  "Empath",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warrior",
  "Wizard",
];

const baseGrowthRates = {
  Bard: { str: 25, con: 20, dex: 25, agi: 20, dis: 15, aur: 25, log: 10, int: 15, wis: 20, inf: 30 },
  Cleric: { str: 20, con: 20, dex: 10, agi: 15, dis: 25, aur: 15, log: 25, int: 25, wis: 30, inf: 20 },
  Empath: { str: 10, con: 20, dex: 15, agi: 15, dis: 25, aur: 20, log: 25, int: 20, wis: 30, inf: 25 },
  Monk: { str: 25, con: 25, dex: 20, agi: 30, dis: 25, aur: 15, log: 20, int: 20, wis: 15, inf: 10 },
  Paladin: { str: 30, con: 25, dex: 20, agi: 20, dis: 25, aur: 15, log: 10, int: 15, wis: 25, inf: 20 },
  Ranger: { str: 25, con: 20, dex: 30, agi: 20, dis: 20, aur: 15, log: 15, int: 25, wis: 25, inf: 10 },
  Rogue: { str: 25, con: 20, dex: 25, agi: 30, dis: 20, aur: 15, log: 20, int: 25, wis: 10, inf: 15 },
  Sorcerer: { str: 10, con: 15, dex: 20, agi: 15, dis: 25, aur: 30, log: 25, int: 20, wis: 25, inf: 20 },
  Warrior: { str: 30, con: 25, dex: 25, agi: 25, dis: 20, aur: 15, log: 10, int: 20, wis: 15, inf: 20 },
  Wizard: { str: 10, con: 15, dex: 25, agi: 15, dis: 20, aur: 30, log: 25, int: 25, wis: 20, inf: 20 },
};

const raceGrowthModifiers = {
  Aelotoi: { str: 0, con: -2, dex: 3, agi: 3, dis: 2, aur: 0, log: 0, int: 2, wis: 0, inf: -2 },
  "Burghal Gnome": { str: -5, con: 0, dex: 3, agi: 3, dis: -3, aur: -2, log: 5, int: 5, wis: 0, inf: 0 },
  "Dark Elf": { str: 0, con: -2, dex: 5, agi: 5, dis: -2, aur: 0, log: 0, int: 0, wis: 0, inf: 0 },
  Dwarf: { str: 5, con: 5, dex: -3, agi: -5, dis: 3, aur: 0, log: 0, int: 0, wis: 3, inf: -2 },
  Elf: { str: 0, con: -5, dex: 5, agi: 3, dis: -5, aur: 5, log: 0, int: 0, wis: 0, inf: 3 },
  Erithian: { str: -2, con: 0, dex: 0, agi: 0, dis: 3, aur: 0, log: 2, int: 0, wis: 0, inf: 3 },
  "Forest Gnome": { str: -3, con: 2, dex: 2, agi: 3, dis: 2, aur: 0, log: 0, int: 0, wis: 0, inf: 0 },
  Giantman: { str: 5, con: 3, dex: -2, agi: -2, dis: 0, aur: 0, log: 0, int: 2, wis: 0, inf: 0 },
  "Half-Elf": { str: 2, con: 0, dex: 2, agi: 2, dis: -2, aur: 0, log: 0, int: 0, wis: 0, inf: 2 },
  "Half-Krolvin": { str: 3, con: 5, dex: 2, agi: 2, dis: 0, aur: -2, log: -2, int: 0, wis: 0, inf: -2 },
  Halfling: { str: -5, con: 5, dex: 5, agi: 5, dis: -2, aur: 0, log: -2, int: 0, wis: 0, inf: 0 },
  Human: { str: 2, con: 2, dex: 0, agi: 0, dis: 0, aur: 0, log: 0, int: 2, wis: 0, inf: 0 },
  Sylvankind: { str: -3, con: -2, dex: 5, agi: 5, dis: -5, aur: 3, log: 0, int: 0, wis: 0, inf: 3 },
};

function fillSelect(select, items, labelKey = "name") {
  select.innerHTML = "";
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.key;
    option.textContent = item[labelKey];
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

function saveProfiles(profiles) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
}

function refreshProfileSelect(profiles) {
  profileSelect.innerHTML = "<option value=\"\">Select a profile</option>";
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

function normalizeRaceName(raw) {
  const cleaned = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (cleaned === "darkelf") return "Dark Elf";
  if (cleaned === "halfelf") return "Half-Elf";
  if (cleaned === "halfkrolvin") return "Half-Krolvin";
  if (cleaned === "giantman") return "Giantman";
  if (cleaned === "forestgnome" || cleaned === "forestrgnome") return "Forest Gnome";
  return raw;
}

function parseInfoBlock(text) {
  const nameMatch = text.match(/Name:\s*([^\n]+?)\s+Race:\s*([A-Za-z -]+?)(?:\s+Profession:|$)/i);
  if (!nameMatch) return null;

  const result = {
    name: nameMatch[1].trim().split(/\s{2,}/)[0],
    race: normalizeRaceName(nameMatch[2].trim()),
    stats: {},
  };

  stats.forEach((stat) => {
    const statMatch = text.match(
      new RegExp(
        `${stat.label}\\\\s*\\\\(${stat.abbr}\\\\):\\\\s*(\\\\d+)\\\\s*\\\\([^)]*\\\\)\\\\s*(?:\\\\.\\\\.\\\\.|…)\\\\s*(\\\\d+)`,
        "i"
      )
    );
    if (statMatch) {
      result.stats[stat.key] = {
        base: Number(statMatch[1]),
        enhanced: Number(statMatch[2]),
      };
    }
  });

  if (!result.stats.str || !result.stats.con) return null;
  return result;
}

function parseInfoStartBlock(text) {
  const cleaned = text.replace(/^s>\s?.*$/gim, "");
  const lines = cleaned.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headerLine = lines.find((line) => /Level\s+0\s+Stats\s+for/i.test(line));
  if (!headerLine) return null;

  const headerMatch = headerLine.match(/Level\s+0\s+Stats\s+for\s+([^,]+),\s+(.+)/i);
  if (!headerMatch) return null;

  const name = headerMatch[1].trim();
  const tail = headerMatch[2].trim().replace(/^[^A-Za-z]*/, "");
  const parts = tail.split(/\s+/);
  if (parts.length < 2) return null;
  const profession = parts.pop();
  const race = normalizeRaceName(parts.join(" "));

  const level0Stats = {};
  lines.forEach((line) => {
    const match = line.match(/^([A-Za-z ]+)\s*\(([A-Z]{3})\):\s*(\d+)/i);
    if (!match) return;
    const abbr = match[2].toUpperCase();
    const stat = stats.find((s) => s.abbr === abbr);
    if (stat) level0Stats[stat.key] = Number(match[3]);
  });

  if (level0Stats.str == null || level0Stats.con == null) return null;

  return {
    name,
    race,
    profession,
    level0Stats,
  };
}

function getGrowthRate(raceName, profession, statKey) {
  const base = baseGrowthRates[profession]?.[statKey];
  const mod = raceGrowthModifiers[raceName]?.[statKey] ?? 0;
  if (base == null) return null;
  return base + mod;
}

function computeStatsFromLevel0(level0Stats, level, raceName, profession) {
  const computed = {};
  stats.forEach((stat) => {
    const rate = getGrowthRate(raceName, profession, stat.key);
    if (!rate || level0Stats[stat.key] == null) return;
    let value = level0Stats[stat.key];
    for (let lvl = 1; lvl <= level; lvl += 1) {
      const gi = Math.max(Math.trunc(value / rate), 1);
      if (lvl % gi === 0) {
        value = Math.min(100, value + 1);
      }
    }
    computed[stat.key] = { base: value, enhanced: value };
  });
  if (Object.keys(computed).length === 0) {
    importStatus.textContent = "Could not compute stats. Check race/profession selection.";
  }
  return computed;
}

function parseSkillsBlock(text) {
  const lines = text.split(/\r?\n/);
  const parsed = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("Skill Name")) return;
    if (trimmed.startsWith("Spell Lists")) return;
    if (trimmed.startsWith("Training Points")) return;
    if (!trimmed.includes("|")) return;

    const parts = trimmed.split("|");
    if (parts.length < 2) return;

    const name = parts[0].replace(/\.+$/, "").trim();
    const right = parts[1].trim();
    const numbers = right.match(/-?\d+/g);
    if (!name || !numbers || numbers.length === 0) return;

    const bonus = numbers.length >= 2 ? Number(numbers[0]) : null;
    const ranks = numbers.length >= 2 ? Number(numbers[1]) : Number(numbers[0]);

    parsed.push({ name, bonus, ranks });
  });

  return parsed;
}

function parseSkillsLevel(text) {
  const match = text.match(/\(at level\s+(\d+)\)/i);
  if (!match) return null;
  return Number(match[1]);
}

function buildStatInputs() {
  statGrid.innerHTML = "";
  stats.forEach((stat) => {
    const wrapper = document.createElement("div");
    wrapper.className = "stat-row";
    wrapper.innerHTML = `
      <div class=\"stat-label\">${stat.abbr}</div>
      <input type=\"number\" min=\"1\" max=\"100\" step=\"1\" data-stat=\"${stat.key}\" data-type=\"base\" value=\"50\" />
      <input type=\"number\" min=\"1\" max=\"100\" step=\"1\" data-stat=\"${stat.key}\" data-type=\"enhanced\" value=\"50\" />
    `;
    statGrid.appendChild(wrapper);
  });
}

function setStatInputs(statValues) {
  statGrid.querySelectorAll("input").forEach((input) => {
    const key = input.dataset.stat;
    const type = input.dataset.type;
    if (statValues[key] && statValues[key][type] != null) {
      input.value = String(statValues[key][type]);
    }
  });
}

function getStatInputs() {
  const values = {};
  statGrid.querySelectorAll("input").forEach((input) => {
    const key = input.dataset.stat;
    const type = input.dataset.type;
    if (!values[key]) values[key] = { base: 50, enhanced: 50 };
    values[key][type] = clamp(Number(input.value), 1, 100);
  });
  return values;
}

function recalcFromLevel0() {
  if (!currentLevel0Stats) {
    const parsedStart = parseInfoStartBlock(infoImport.value);
    if (parsedStart) {
      currentLevel0Stats = parsedStart.level0Stats;
      const raceOption = races.find((race) => race.name.toLowerCase() === parsedStart.race.toLowerCase());
      if (raceOption) profileRace.value = raceOption.key;
      const professionOption = professions.find(
        (prof) => prof.toLowerCase() === parsedStart.profession.toLowerCase()
      );
      if (professionOption) profileProfession.value = professionOption;
      if (!profileName.value.trim()) profileName.value = parsedStart.name;
    } else {
      importStatus.textContent = "No level 0 stats found. Paste INFO START output or re-check the format.";
      return;
    }
  }
  const level = clamp(Number(profileLevel.value), 0, 100);
  const raceName = races.find((race) => race.key === profileRace.value)?.name || "Human";
  const profession = profileProfession.value;
  if (!baseGrowthRates[profession]) {
    importStatus.textContent = "Select a profession to calculate stats from level 0.";
    return;
  }
  const computed = computeStatsFromLevel0(currentLevel0Stats, level, raceName, profession);
  setStatInputs(computed);
}

function handleInfoStartParse() {
  const parsedStart = parseInfoStartBlock(infoImport.value);
  if (!parsedStart) {
    const preview = infoImport.value.trim().split(/\r?\n/).slice(0, 3).join(" / ");
    importStatus.textContent = `Could not parse INFO START output. First lines: ${preview || "empty"}`;
    return;
  }
  importStatus.textContent = `Parsed ${parsedStart.name} (${parsedStart.race} ${parsedStart.profession}). Stats recalculated from level 0.`;
  profileName.value = parsedStart.name;
  const raceOption = races.find((race) => race.name.toLowerCase() === parsedStart.race.toLowerCase());
  if (raceOption) profileRace.value = raceOption.key;
  const professionOption = professions.find((prof) => prof.toLowerCase() === parsedStart.profession.toLowerCase());
  if (professionOption) profileProfession.value = professionOption;
  currentLevel0Stats = parsedStart.level0Stats;
  recalcFromLevel0();
}

function applyProfile(profile) {
  profileName.value = profile.name;
  const raceOption = races.find((race) => race.name.toLowerCase() === profile.race.toLowerCase());
  if (raceOption) profileRace.value = raceOption.key;
  if (profile.profession) profileProfession.value = profile.profession;
  if (profile.level != null) profileLevel.value = profile.level;

  currentLevel0Stats = profile.level0Stats || null;
  if (currentLevel0Stats) {
    recalcFromLevel0();
  } else if (profile.stats) {
    setStatInputs(profile.stats);
  }

  if (profile.defaults) {
    armorAsgSelect.value = profile.defaults.armorAsg || "none";
    armorWeightInput.value = String(profile.defaults.armorWeight ?? 0);
    accessoryWeightInput.value = String(profile.defaults.accessoryWeight ?? 0);
    gearWeightInput.value = String(profile.defaults.gearWeight ?? 0);
    silversInput.value = String(profile.defaults.silvers ?? 0);
    pfBonusInput.value = String(profile.defaults.pfBonus ?? 0);
  }

  if (profile.skills) {
    currentSkills = profile.skills;
    renderSkillsTable(currentSkills);
  }
}

function updateArmorWeight() {
  const selected = armorAsg.find((item) => item.key === armorAsgSelect.value);
  if (!selected) return;
  armorWeightInput.value = String(selected.standardWeight);
}

function renderSkillsTable(skills) {
  skillsTable.innerHTML = "";
  if (!skills.length) {
    const row = document.createElement("tr");
    row.innerHTML = "<td colspan=\"3\">No skills loaded yet.</td>";
    skillsTable.appendChild(row);
    return;
  }
  skills.forEach((skill, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${skill.name}</td>
      <td><input type="number" data-skill-index="${index}" data-skill-field="bonus" value="${skill.bonus ?? ""}" /></td>
      <td><input type="number" data-skill-index="${index}" data-skill-field="ranks" value="${skill.ranks ?? ""}" /></td>
    `;
    skillsTable.appendChild(row);
  });
}

function collectSkills() {
  const updated = currentSkills.map((skill) => ({ ...skill }));
  skillsTable.querySelectorAll("input").forEach((input) => {
    const index = Number(input.dataset.skillIndex);
    const field = input.dataset.skillField;
    if (!Number.isNaN(index) && updated[index]) {
      const value = input.value.trim();
      updated[index][field] = value === "" ? null : Number(value);
    }
  });
  return updated.filter((skill) => skill.name);
}

buildStatInputs();
fillSelect(profileRace, races);
fillSelect(profileProfession, professions.map((name) => ({ key: name, name })));
fillSelect(armorAsgSelect, armorAsg);
updateArmorWeight();

let profiles = loadProfiles();
refreshProfileSelect(profiles);
renderSkillsTable(currentSkills);

profileApply.addEventListener("click", () => {
  const selected = profileSelect.value;
  if (!selected) return;
  const profile = findProfile(profiles, selected);
  if (profile) applyProfile(profile);
});

profileDelete.addEventListener("click", () => {
  const selected = profileSelect.value;
  if (!selected) return;
  profiles = profiles.filter((profile) => profile.id !== selected);
  saveProfiles(profiles);
  refreshProfileSelect(profiles);
  profileSelect.value = "";
});

profileSave.addEventListener("click", () => {
  const parsedInfoStart = parseInfoStartBlock(infoImport.value);
  const parsedInfo = parsedInfoStart || parseInfoBlock(infoImport.value);
  const name = profileName.value.trim() || (parsedInfo ? parsedInfo.name : "");

  if (!name) {
    importStatus.textContent = "Paste INFO output or enter a profile name.";
    return;
  }

  const statsPayload = parsedInfo && parsedInfo.stats ? parsedInfo.stats : getStatInputs();
  const racePayload = parsedInfo ? parsedInfo.race : races.find((race) => race.key === profileRace.value)?.name || "Human";
  const professionPayload = parsedInfoStart?.profession || profileProfession.value;
  const levelPayload = clamp(Number(profileLevel.value), 0, 100);

  const record = {
    id: "",
    name,
    race: racePayload,
    stats: statsPayload,
    profession: professionPayload,
    level: levelPayload,
    level0Stats: parsedInfoStart?.level0Stats || currentLevel0Stats,
    skills: collectSkills(),
    defaults: {
      armorAsg: armorAsgSelect.value,
      armorWeight: Math.max(0, Number(armorWeightInput.value) || 0),
      accessoryWeight: Math.max(0, Number(accessoryWeightInput.value) || 0),
      gearWeight: Math.max(0, Number(gearWeightInput.value) || 0),
      silvers: Math.max(0, Number(silversInput.value) || 0),
      pfBonus: Math.max(0, Number(pfBonusInput.value) || 0),
    },
  };

  const existing = profiles.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
  const id = existing ? existing.id : `profile-${Date.now()}`;
  record.id = id;

  profiles = profiles.filter((entry) => entry.id !== id).concat(record);
  saveProfiles(profiles);
  refreshProfileSelect(profiles);
  profileSelect.value = id;
  importStatus.textContent = `Saved profile: ${record.name}`;
});

infoImport.addEventListener("input", () => {
  const parsedStart = parseInfoStartBlock(infoImport.value);
  if (parsedStart) {
    handleInfoStartParse();
    return;
  }

  const parsed = parseInfoBlock(infoImport.value);
  if (!parsed) {
    importStatus.textContent = "Paste INFO START output to auto-fill race, profession, and level 0 stats.";
    return;
  }

  importStatus.textContent = `Parsed ${parsed.name} (${parsed.race}). Click Save/Update to store.`;
  profileName.value = parsed.name;
  const raceOption = races.find((race) => race.name.toLowerCase() === parsed.race.toLowerCase());
  if (raceOption) profileRace.value = raceOption.key;
  currentLevel0Stats = null;
  setStatInputs(parsed.stats);
});

infoImport.addEventListener("change", () => {
  const parsedStart = parseInfoStartBlock(infoImport.value);
  if (parsedStart) {
    handleInfoStartParse();
  }
});

skillsImport.addEventListener("input", () => {
  const parsed = parseSkillsBlock(skillsImport.value);
  if (!parsed.length) {
    skillsStatus.textContent = "Paste SKILLS output to auto-fill skill bonuses and ranks.";
    return;
  }
  skillsStatus.textContent = `Parsed ${parsed.length} skills. You can edit bonus or ranks before saving.`;
  currentSkills = parsed;
  renderSkillsTable(currentSkills);

  const level = parseSkillsLevel(skillsImport.value);
  if (level != null) {
    profileLevel.value = String(level);
    if (currentLevel0Stats) recalcFromLevel0();
  }
});

armorAsgSelect.addEventListener("change", updateArmorWeight);

profileLevel.addEventListener("input", () => {
  if (currentLevel0Stats) recalcFromLevel0();
});

profileProfession.addEventListener("change", () => {
  if (currentLevel0Stats) recalcFromLevel0();
});

profileRace.addEventListener("change", () => {
  if (currentLevel0Stats) recalcFromLevel0();
});

recalcStats.addEventListener("click", recalcFromLevel0);
parseInfoStart.addEventListener("click", handleInfoStartParse);
