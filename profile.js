const profileSelect = document.getElementById("profileSelect");
const profileApply = document.getElementById("profileApply");
const profileDelete = document.getElementById("profileDelete");
const profileSave = document.getElementById("profileSave");
const profileName = document.getElementById("profileName");
const profileRace = document.getElementById("profileRace");
const profileProfession = document.getElementById("profileProfession");
const profileLevel = document.getElementById("profileLevel");
const infoImport = document.getElementById("infoImport");
const importStatus = document.getElementById("importStatus");
const statGrid = document.getElementById("statGrid");
const skillsImport = document.getElementById("skillsImport");
const skillsStatus = document.getElementById("skillsStatus");
const skillsShowTrainedOnly = document.getElementById("skillsShowTrainedOnly");
const ascImport = document.getElementById("ascImport");
const ascImportStatus = document.getElementById("ascImportStatus");
const skillsTable = document.getElementById("skillsTable");
const ascStatTable = document.getElementById("ascStatTable");
const ascSkillTable = document.getElementById("ascSkillTable");
const ascStatus = document.getElementById("ascStatus");
const enhStatTable = document.getElementById("enhStatTable");
const enhSkillTable = document.getElementById("enhSkillTable");
const enhStatus = document.getElementById("enhStatus");
const quickStartSection = document.getElementById("quickStartSection");
const adjustmentsSection = document.getElementById("adjustmentsSection");
const runProfileTestsBtn = document.getElementById("runProfileTests");
const profileTestOutputEl = document.getElementById("profileTestOutput");
const saveProfileButtons = Array.from(document.querySelectorAll(".save-profile-btn"));
const reloadProfileButtons = Array.from(document.querySelectorAll(".profile-reload-btn"));

const armorAsgSelect = document.getElementById("armorAsg");
const armorWeightInput = document.getElementById("armorWeight");
const accessoryWeightInput = document.getElementById("accessoryWeight");
const gearWeightInput = document.getElementById("gearWeight");
const silversInput = document.getElementById("silvers");

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

const skillCatalog = [
  "Armor Use",
  "Shield Use",
  "Combat Maneuvers",
  "Edged Weapons",
  "Blunt Weapons",
  "Two-Handed Weapons",
  "Ranged Weapons",
  "Thrown Weapons",
  "Polearm Weapons",
  "Brawling",
  "Two Weapon Combat",
  "Ambush",
  "Multi Opponent Combat",
  "Physical Fitness",
  "Dodging",
  "Arcane Symbols",
  "Magic Item Use",
  "Spell Aiming",
  "Harness Power",
  "Elemental Mana Control",
  "Mental Mana Control",
  "Spirit Mana Control",
  "Elemental Lore - Air",
  "Elemental Lore - Earth",
  "Elemental Lore - Fire",
  "Elemental Lore - Water",
  "Spiritual Lore - Blessings",
  "Spiritual Lore - Religion",
  "Spiritual Lore - Summoning",
  "Sorcerous Lore - Demonology",
  "Sorcerous Lore - Necromancy",
  "Mental Lore - Divination",
  "Mental Lore - Manipulation",
  "Mental Lore - Telepathy",
  "Mental Lore - Transference",
  "Mental Lore - Transformation",
  "Stalking and Hiding",
  "Perception",
  "Climbing",
  "Swimming",
  "Disarming Traps",
  "Picking Locks",
  "Picking Pockets",
  "First Aid",
  "Survival",
  "Trading",
  "Minor Elemental",
  "Major Elemental",
  "Minor Spiritual",
  "Major Spiritual",
  "Minor Mental",
  "Major Mental",
  "Wizard",
  "Bard",
  "Cleric",
  "Empath",
  "Ranger",
  "Paladin",
  "Sorcerer",
  "Monk",
];

const spellCircles = new Set([
  "Minor Elemental",
  "Major Elemental",
  "Minor Spiritual",
  "Major Spiritual",
  "Minor Mental",
  "Major Mental",
  "Wizard",
  "Bard",
  "Cleric",
  "Empath",
  "Ranger",
  "Paladin",
  "Sorcerer",
  "Monk",
]);

const professionSpellCircleMap = {
  Bard: new Set(["Bard", "Minor Elemental"]),
  Cleric: new Set(["Cleric", "Major Spiritual", "Minor Spiritual"]),
  Empath: new Set(["Empath", "Major Spiritual", "Minor Spiritual"]),
  Monk: new Set(["Minor Mental", "Minor Spiritual"]),
  Paladin: new Set(["Paladin", "Minor Spiritual"]),
  Ranger: new Set(["Ranger", "Minor Spiritual"]),
  Rogue: new Set(["Minor Elemental", "Minor Spiritual"]),
  Sorcerer: new Set(["Sorcerer", "Minor Elemental", "Minor Spiritual"]),
  Warrior: new Set(["Minor Elemental", "Minor Spiritual"]),
  Wizard: new Set(["Wizard", "Major Elemental", "Minor Elemental"]),
};

const skillCategoryByName = {
  "Armor Use": "Armor and Shield",
  "Shield Use": "Armor and Shield",
  "Edged Weapons": "Weapon Skills",
  "Blunt Weapons": "Weapon Skills",
  "Two-Handed Weapons": "Weapon Skills",
  "Ranged Weapons": "Weapon Skills",
  "Thrown Weapons": "Weapon Skills",
  "Polearm Weapons": "Weapon Skills",
  Brawling: "Weapon Skills",
  "Two Weapon Combat": "Weapon Skills",
  "Combat Maneuvers": "Combat Skills",
  Ambush: "Combat Skills",
  "Multi Opponent Combat": "Combat Skills",
  "Physical Fitness": "Combat Skills",
  Dodging: "Combat Skills",
  "Arcane Symbols": "Magic Skills",
  "Magic Item Use": "Magic Skills",
  "Spell Aiming": "Magic Skills",
  "Harness Power": "Magic Skills",
  "Elemental Mana Control": "Magic Skills",
  "Mental Mana Control": "Magic Skills",
  "Spirit Mana Control": "Magic Skills",
  "Elemental Lore - Air": "Lores",
  "Elemental Lore - Earth": "Lores",
  "Elemental Lore - Fire": "Lores",
  "Elemental Lore - Water": "Lores",
  "Spiritual Lore - Blessings": "Lores",
  "Spiritual Lore - Religion": "Lores",
  "Spiritual Lore - Summoning": "Lores",
  "Sorcerous Lore - Demonology": "Lores",
  "Sorcerous Lore - Necromancy": "Lores",
  "Mental Lore - Divination": "Lores",
  "Mental Lore - Manipulation": "Lores",
  "Mental Lore - Telepathy": "Lores",
  "Mental Lore - Transference": "Lores",
  "Mental Lore - Transformation": "Lores",
  "Stalking and Hiding": "Subterfuge",
  "Disarming Traps": "Subterfuge",
  "Picking Locks": "Subterfuge",
  "Picking Pockets": "Subterfuge",
  Perception: "Survival and Utility",
  Climbing: "Survival and Utility",
  Swimming: "Survival and Utility",
  "First Aid": "Survival and Utility",
  Survival: "Survival and Utility",
  Trading: "Survival and Utility",
  "Minor Elemental": "Spell Circles",
  "Major Elemental": "Spell Circles",
  "Minor Spiritual": "Spell Circles",
  "Major Spiritual": "Spell Circles",
  "Minor Mental": "Spell Circles",
  "Major Mental": "Spell Circles",
  Wizard: "Spell Circles",
  Bard: "Spell Circles",
  Cleric: "Spell Circles",
  Empath: "Spell Circles",
  Ranger: "Spell Circles",
  Paladin: "Spell Circles",
  Sorcerer: "Spell Circles",
  Monk: "Spell Circles",
};

const skillCategoryOrder = [
  "Armor and Shield",
  "Weapon Skills",
  "Combat Skills",
  "Magic Skills",
  "Lores",
  "Subterfuge",
  "Survival and Utility",
  "Spell Circles",
  "Other",
];

const skillAliasMap = {
  pickpocketing: "Picking Pockets",
  "picking pockets": "Picking Pockets",
  "elemental lore, air": "Elemental Lore - Air",
  "elemental lore, earth": "Elemental Lore - Earth",
  "elemental lore, fire": "Elemental Lore - Fire",
  "elemental lore, water": "Elemental Lore - Water",
  "spiritual lore, blessings": "Spiritual Lore - Blessings",
  "spiritual lore, religion": "Spiritual Lore - Religion",
  "spiritual lore, summoning": "Spiritual Lore - Summoning",
  "sorcerous lore, demonology": "Sorcerous Lore - Demonology",
  "sorcerous lore, necromancy": "Sorcerous Lore - Necromancy",
  "mental lore, divination": "Mental Lore - Divination",
  "mental lore, manipulation": "Mental Lore - Manipulation",
  "mental lore, telepathy": "Mental Lore - Telepathy",
  "mental lore, transference": "Mental Lore - Transference",
  "mental lore, transformation": "Mental Lore - Transformation",
};

const ascMnemonicMap = {
  agility: "Agility",
  aura: "Aura",
  constitution: "Constitution",
  dexterity: "Dexterity",
  discipline: "Discipline",
  influence: "Influence",
  intuition: "Intuition",
  logic: "Logic",
  strength: "Strength",
  wisdom: "Wisdom",
  ambush: "Ambush",
  arcanesymbols: "Arcane Symbols",
  armoruse: "Armor Use",
  bluntweapons: "Blunt Weapons",
  brawling: "Brawling",
  climbing: "Climbing",
  combatmaneuvers: "Combat Maneuvers",
  disarmingtraps: "Disarming Traps",
  dodging: "Dodging",
  edgedweapons: "Edged Weapons",
  elair: "Elemental Lore - Air",
  elearth: "Elemental Lore - Earth",
  elfire: "Elemental Lore - Fire",
  elwater: "Elemental Lore - Water",
  elementalmc: "Elemental Mana Control",
  firstaid: "First Aid",
  harnesspower: "Harness Power",
  magicitemuse: "Magic Item Use",
  mldivination: "Mental Lore - Divination",
  mlmanipulation: "Mental Lore - Manipulation",
  mltelepathy: "Mental Lore - Telepathy",
  mltransference: "Mental Lore - Transference",
  mltransform: "Mental Lore - Transformation",
  mentalmc: "Mental Mana Control",
  multiopponent: "Multi Opponent Combat",
  perception: "Perception",
  physicalfitness: "Physical Fitness",
  pickinglocks: "Picking Locks",
  pickingpockets: "Picking Pockets",
  polearmsweapons: "Polearm Weapons",
  rangedweapons: "Ranged Weapons",
  shielduse: "Shield Use",
  soldemonology: "Sorcerous Lore - Demonology",
  solnecromancy: "Sorcerous Lore - Necromancy",
  spellaiming: "Spell Aiming",
  spiritmc: "Spirit Mana Control",
  slblessings: "Spiritual Lore - Blessings",
  slreligion: "Spiritual Lore - Religion",
  slsummoning: "Spiritual Lore - Summoning",
  stalking: "Stalking and Hiding",
  survival: "Survival",
  swimming: "Swimming",
  thrownweapons: "Thrown Weapons",
  trading: "Trading",
  twoweaponcombat: "Two Weapon Combat",
  twohandedweapon: "Two-Handed Weapons",
};

let currentSkills = skillCatalog.map((name) => ({ name, ranks: 0 }));
let currentLevel0Stats = null;
let currentBaseStats = {};
let ascensionState = { stats: {}, skills: {} };
let enhanciveState = { stats: {}, skills: {} };
let applyingProfile = false;
let skillsImportUnmatchedKeys = new Set();
let skillsImportOffProfessionKeys = new Set();

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

const raceStatBonusModifiers = {
  Aelotoi: { str: -5, con: 0, dex: 5, agi: 10, dis: 5, aur: 0, log: 5, int: 5, wis: 0, inf: -5 },
  "Burghal Gnome": { str: -15, con: 10, dex: 10, agi: 10, dis: -5, aur: 5, log: 10, int: 5, wis: 0, inf: -5 },
  "Dark Elf": { str: 0, con: -5, dex: 10, agi: 5, dis: -10, aur: 10, log: 0, int: 5, wis: 5, inf: -5 },
  Dwarf: { str: 10, con: 15, dex: 0, agi: -5, dis: 10, aur: -10, log: 5, int: 0, wis: 0, inf: -10 },
  Elf: { str: 0, con: 0, dex: 5, agi: 15, dis: -15, aur: 5, log: 0, int: 0, wis: 0, inf: 10 },
  Erithian: { str: -5, con: 10, dex: 0, agi: 0, dis: 5, aur: 0, log: 5, int: 0, wis: 0, inf: 10 },
  "Forest Gnome": { str: -10, con: 10, dex: 5, agi: 10, dis: 5, aur: 0, log: 5, int: 0, wis: 5, inf: -5 },
  Giantman: { str: 15, con: 10, dex: -5, agi: -5, dis: 0, aur: -5, log: -5, int: 0, wis: 0, inf: 5 },
  "Half-Elf": { str: 0, con: 0, dex: 5, agi: 10, dis: -5, aur: 0, log: 0, int: 0, wis: 0, inf: 5 },
  "Half-Krolvin": { str: 10, con: 10, dex: 0, agi: 5, dis: 0, aur: 0, log: -10, int: 0, wis: -5, inf: -5 },
  Halfling: { str: -15, con: 10, dex: 15, agi: 10, dis: -5, aur: -5, log: 5, int: 10, wis: 0, inf: -5 },
  Human: { str: 5, con: 0, dex: 0, agi: 0, dis: 0, aur: 0, log: 5, int: 5, wis: 0, inf: 0 },
  Sylvankind: { str: 0, con: 0, dex: 10, agi: 5, dis: -5, aur: 5, log: 0, int: 0, wis: 0, inf: 0 },
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

function normalizeRaceForModifierLookup(raw) {
  if (!raw) return "";
  const cleaned = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (cleaned === "aelotoi") return "Aelotoi";
  if (cleaned === "burghalgnome" || cleaned === "bgnome") return "Burghal Gnome";
  if (cleaned === "darkelf") return "Dark Elf";
  if (cleaned === "dwarf") return "Dwarf";
  if (cleaned === "elf") return "Elf";
  if (cleaned === "erithian") return "Erithian";
  if (cleaned === "forestgnome" || cleaned === "fgnome") return "Forest Gnome";
  if (cleaned === "giantman") return "Giantman";
  if (cleaned === "halfelf") return "Half-Elf";
  if (cleaned === "halfkrolvin") return "Half-Krolvin";
  if (cleaned === "halfling") return "Halfling";
  if (cleaned === "human") return "Human";
  if (cleaned === "sylvan" || cleaned === "sylvankind") return "Sylvankind";
  return raw;
}

function statToBonus(statValue) {
  return Math.floor((Number(statValue) - 50) / 2);
}

function formatBonus(bonus) {
  if (!Number.isFinite(bonus)) return "0";
  return bonus > 0 ? `+${bonus}` : String(bonus);
}

function getSelectedRaceName() {
  return races.find((race) => race.key === profileRace.value)?.name || "Human";
}

function getRaceBonusModifier(raceName, statKey) {
  const normalizedRace = normalizeRaceForModifierLookup(raceName);
  return raceStatBonusModifiers[normalizedRace]?.[statKey] ?? 0;
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
        `${stat.label}\\\\s*\\\\(${stat.abbr}\\\\):\\\\s*(\\\\d+)\\\\s*\\\\(([-+]?\\\\d+)\\\\)\\\\s*(?:\\\\.\\\\.\\\\.|…)\\\\s*(\\\\d+)\\\\s*\\\\(([-+]?\\\\d+)\\\\)`,
        "i"
      )
    );
    if (statMatch) {
      result.stats[stat.key] = {
        base: Number(statMatch[1]),
        baseBonus: Number(statMatch[2]),
        enhanced: Number(statMatch[3]),
        enhancedBonus: Number(statMatch[4]),
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
  const headerMatch = headerLine ? headerLine.match(/Level\s+0\s+Stats\s+for\s+([^,]+),\s+(.+)/i) : null;

  let name = "";
  let race = "";
  let profession = "";
  if (headerMatch) {
    name = headerMatch[1].trim();
    const tail = headerMatch[2].trim().replace(/^[^A-Za-z]*/, "");
    const parts = tail.split(/\s+/);
    if (parts.length >= 2) {
      profession = parts.pop();
      race = normalizeRaceName(parts.join(" "));
    }
  }

  const level0Stats = {};
  let statLineCount = 0;
  let looksLikeInfoBlock = false;
  lines.forEach((line) => {
    if (/\.\.\.|[)]\s*\.\.\.\s*\d+\s*\(/.test(line) || /\(\s*[-+]?\d+\s*\)\s*(?:\.{3}|…)/.test(line)) {
      looksLikeInfoBlock = true;
    }
    const match = line.match(/^([A-Za-z ]+)\s*\(([A-Z]{3})\):\s*(\d+)/i);
    if (!match) return;
    statLineCount += 1;
    const abbr = match[2].toUpperCase();
    const stat = stats.find((s) => s.abbr === abbr);
    if (stat) level0Stats[stat.key] = Number(match[3]);
  });

  const required = stats.map((s) => s.key);
  const missing = required.filter((key) => level0Stats[key] == null);
  if (looksLikeInfoBlock) return { error: "wrong_block_info" };
  if (missing.length) {
    if (statLineCount > 0) return { error: "partial_level0", missing };
    return { error: "no_level0_stats" };
  }

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

function parseAscListBlock(text) {
  const lines = text.split(/\r?\n/);
  const results = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (/^Skill\s+Mnemonic/i.test(trimmed)) return;
    if (/^[-]{5,}/.test(trimmed)) return;
    const match = trimmed.match(/^(.*?)\s+([a-z][a-z0-9-]*)\s+(\d+)\s*\/\s*(40|50|10)\s+(.*)$/i);
    if (!match) return;
    const name = match[1].trim().replace(/\s{2,}/g, " ");
    const right = match[5].trim();
    const typeParts = right.split(/\s{2,}|\t+/).filter(Boolean);
    const subcategory = (typeParts[typeParts.length - 1] || "").toLowerCase();

    if (!name) return;
    results.push({
      name,
      mnemonic: match[2].toLowerCase(),
      ranks: Number(match[3]),
      cap: Number(match[4]),
      subcategory,
    });
  });

  return results;
}

function defaultStatMap(value = 0) {
  const payload = {};
  stats.forEach((stat) => {
    payload[stat.key] = value;
  });
  return payload;
}

function skillKey(name) {
  return String(name || "").trim().toLowerCase();
}

function canonicalSkillName(rawName) {
  const cleaned = String(rawName || "").trim();
  if (!cleaned) return "";
  const normalized = skillKey(cleaned.replace(/\s+/g, " "));
  if (skillAliasMap[normalized]) return skillAliasMap[normalized];

  const exact = skillCatalog.find((name) => skillKey(name) === normalized);
  if (exact) return exact;

  const fuzzy = skillCatalog.find((name) => {
    const key = skillKey(name);
    return key.startsWith(normalized) || normalized.startsWith(key);
  });
  return fuzzy || cleaned;
}

function isAscensionSkillName(name) {
  return !spellCircles.has(name);
}

function mergeSkillsWithCatalog(skills = []) {
  const byKey = new Map();
  skills.forEach((skill) => {
    const canonical = canonicalSkillName(skill?.name || "");
    if (!canonical) return;
    byKey.set(skillKey(canonical), {
      name: canonical,
      ranks: Math.max(0, Math.trunc(Number(skill?.ranks) || 0)),
    });
  });

  const merged = skillCatalog.map((name) => {
    const existing = byKey.get(skillKey(name));
    return existing ? existing : { name, ranks: 0 };
  });

  byKey.forEach((value, key) => {
    if (!merged.some((entry) => skillKey(entry.name) === key)) {
      merged.push(value);
    }
  });
  return merged;
}

function initAdjustmentState() {
  ascensionState = { stats: {}, skills: {} };
  enhanciveState = { stats: {}, skills: {} };
  stats.forEach((stat) => {
    ascensionState.stats[stat.key] = { stat: 0, bonus: 0 };
    enhanciveState.stats[stat.key] = { stat: 0, bonus: 0 };
  });
  currentSkills.forEach((skill) => {
    const key = skillKey(skill.name);
    if (!key) return;
    ascensionState.skills[key] = { bonus: 0 };
    enhanciveState.skills[key] = { rank: 0, bonus: 0 };
  });
}

function syncSkillAdjustmentState() {
  const nextAsc = {};
  const nextEnh = {};
  currentSkills.forEach((skill) => {
    const key = skillKey(skill.name);
    if (!key) return;
    nextAsc[key] = { bonus: Math.max(0, Math.trunc(Number(ascensionState.skills?.[key]?.bonus) || 0)) };
    nextEnh[key] = {
      rank: Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.rank) || 0)),
      bonus: Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.bonus) || 0)),
    };
  });
  ascensionState.skills = nextAsc;
  enhanciveState.skills = nextEnh;
}

function getStatAdjustment(statKey) {
  return {
    ascStat: Math.max(0, Math.trunc(Number(ascensionState.stats?.[statKey]?.stat) || 0)),
    ascBonus: Math.max(0, Math.trunc(Number(ascensionState.stats?.[statKey]?.bonus) || 0)),
    enhStat: Math.max(0, Math.trunc(Number(enhanciveState.stats?.[statKey]?.stat) || 0)),
    enhBonus: Math.max(0, Math.trunc(Number(enhanciveState.stats?.[statKey]?.bonus) || 0)),
  };
}

function getDerivedStatRows() {
  const raceName = getSelectedRaceName();
  const rows = {};

  stats.forEach((stat) => {
    const adj = getStatAdjustment(stat.key);
    const baseStat = clamp(Number(currentBaseStats[stat.key] ?? 50), 1, 200);
    const racial = getRaceBonusModifier(raceName, stat.key);
    const baseBonus = statToBonus(baseStat) + racial;
    const finalStat = clamp(baseStat + adj.ascStat + adj.enhStat, 1, 200);
    const finalBonus = statToBonus(finalStat) + racial + adj.ascBonus + adj.enhBonus;
    const enhEffective = Math.floor(adj.enhStat / 2) + adj.enhBonus;
    const enhValid = adj.enhStat <= 40 && adj.enhBonus <= 20 && enhEffective <= 20;
    rows[stat.key] = {
      baseStat,
      baseBonus,
      ascStat: adj.ascStat,
      ascBonus: adj.ascBonus,
      enhStat: adj.enhStat,
      enhBonus: adj.enhBonus,
      enhEffective,
      enhValid,
      finalStat,
      finalBonus,
    };
  });

  return rows;
}

function buildStatInputs() {
  statGrid.innerHTML = "";
  const headers = ["Stat", "Level 0", "Base", "Bonus", "Final Stat", "Final Bonus"];
  headers.forEach((title) => {
    const header = document.createElement("div");
    header.className = "stat-header";
    header.textContent = title;
    statGrid.appendChild(header);
  });

  stats.forEach((stat) => {
    const wrapper = document.createElement("div");
    wrapper.className = "stat-row";
    wrapper.innerHTML = `
      <div class=\"stat-label\">${stat.abbr}</div>
      <input type=\"number\" min=\"1\" max=\"100\" step=\"1\" class=\"stat-edit\" data-stat=\"${stat.key}\" data-field=\"level0\" value=\"50\" />
      <div class=\"stat-output\" data-stat=\"${stat.key}\" data-field=\"base-stat\">50</div>
      <div class=\"stat-output\" data-stat=\"${stat.key}\" data-field=\"base-bonus\">0</div>
      <div class=\"stat-output\" data-stat=\"${stat.key}\" data-field=\"final-stat\">50</div>
      <div class=\"stat-output\" data-stat=\"${stat.key}\" data-field=\"final-bonus\">0</div>
    `;
    statGrid.appendChild(wrapper);
  });

  statGrid.querySelectorAll('input[data-field="level0"]').forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.stat;
      const value = clamp(Number(input.value), 1, 100);
      if (!currentLevel0Stats) {
        currentLevel0Stats = {};
        stats.forEach((stat) => {
          currentLevel0Stats[stat.key] = clamp(Number(currentBaseStats[stat.key] ?? 50), 1, 100);
        });
      }
      currentLevel0Stats[key] = value;
      recalcFromLevel0();
    });
  });
}

function renderAscensionTables() {
  if (!ascStatTable || !ascSkillTable) return;
  ascStatTable.innerHTML = "";
  stats.forEach((stat) => {
    const row = document.createElement("tr");
    const values = getStatAdjustment(stat.key);
    row.innerHTML = `
      <td>${stat.abbr}</td>
      <td><input type="number" min="0" max="40" step="1" data-asc-stat="${stat.key}" data-kind="stat" value="${values.ascStat}" /></td>
      <td><input type="number" min="0" max="40" step="1" data-asc-stat="${stat.key}" data-kind="bonus" value="${values.ascBonus}" /></td>
    `;
    ascStatTable.appendChild(row);
  });
  ascSkillTable.innerHTML = "";
  currentSkills.filter((skill) => isAscensionSkillName(skill.name)).forEach((skill) => {
    const key = skillKey(skill.name);
    const bonus = Math.max(0, Math.trunc(Number(ascensionState.skills?.[key]?.bonus) || 0));
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${skill.name}</td>
      <td><input type="number" min="0" max="40" step="1" data-asc-skill="${key}" value="${bonus}" /></td>
    `;
    ascSkillTable.appendChild(row);
  });

  ascStatTable.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      const statKey = input.dataset.ascStat;
      if (!ascensionState.stats[statKey]) ascensionState.stats[statKey] = { stat: 0, bonus: 0 };
      const value = Math.max(0, Math.trunc(Number(input.value) || 0));
      if (input.dataset.kind === "stat") ascensionState.stats[statKey].stat = value;
      else ascensionState.stats[statKey].bonus = value;
      updateDerivedDisplays({ skipAscRender: true, skipEnhRender: true });
    });
  });

  ascSkillTable.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.ascSkill;
      if (!ascensionState.skills[key]) ascensionState.skills[key] = { bonus: 0 };
      ascensionState.skills[key].bonus = Math.max(0, Math.trunc(Number(input.value) || 0));
      updateDerivedDisplays({ skipAscRender: true, skipEnhRender: true });
    });
  });
}

function updateAscensionStatus() {
  if (!ascStatus || !ascStatTable || !ascSkillTable) return;
  let hasInvalid = false;

  ascStatTable.querySelectorAll("tr").forEach((row) => {
    const statCell = row.firstElementChild;
    if (!statCell) return;
    const stat = stats.find((entry) => entry.abbr === statCell.textContent?.trim());
    if (!stat) return;
    const statAdj = Math.max(0, Math.trunc(Number(ascensionState.stats?.[stat.key]?.stat) || 0));
    const bonusAdj = Math.max(0, Math.trunc(Number(ascensionState.stats?.[stat.key]?.bonus) || 0));
    const valid = statAdj <= 40 && bonusAdj <= 40;
    row.style.color = valid ? "#1f4e42" : "#b42318";
    if (!valid) hasInvalid = true;
  });

  ascSkillTable.querySelectorAll("tr").forEach((row) => {
    const skillCell = row.firstElementChild;
    if (!skillCell) return;
    const key = skillKey(skillCell.textContent);
    const bonusAdj = Math.max(0, Math.trunc(Number(ascensionState.skills?.[key]?.bonus) || 0));
    const valid = bonusAdj <= 40;
    row.style.color = valid ? "#1f4e42" : "#b42318";
    if (!valid) hasInvalid = true;
  });

  if (hasInvalid) {
    ascStatus.textContent = "Invalid ascension rows: stat + and bonus + max 40; skill bonus + max 40.";
    ascStatus.style.color = "#b42318";
  } else {
    ascStatus.textContent = "Ascension limits are enforced per row.";
    ascStatus.style.color = "";
  }
}

function renderEnhanciveTables() {
  if (!enhStatTable || !enhSkillTable) return;
  enhStatTable.innerHTML = "";
  const rows = getDerivedStatRows();
  stats.forEach((stat) => {
    const statRow = rows[stat.key];
    const row = document.createElement("tr");
    row.style.color = statRow.enhValid ? "#1f4e42" : "#b42318";
    row.innerHTML = `
      <td>${stat.abbr}</td>
      <td><input type="number" min="0" max="40" step="1" data-enh-stat="${stat.key}" data-kind="stat" value="${statRow.enhStat}" /></td>
      <td><input type="number" min="0" max="20" step="1" data-enh-stat="${stat.key}" data-kind="bonus" value="${statRow.enhBonus}" /></td>
      <td>${statRow.enhEffective}/20</td>
    `;
    enhStatTable.appendChild(row);
  });

  enhSkillTable.innerHTML = "";
  currentSkills.forEach((skill) => {
    const key = skillKey(skill.name);
    const baseRanks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
    const enhRank = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.rank) || 0));
    const enhBonus = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.bonus) || 0));
    const rankBonusGain = skillBonusFromRanks(baseRanks + enhRank) - skillBonusFromRanks(baseRanks);
    const effective = rankBonusGain + enhBonus;
    const valid = enhRank <= 50 && enhBonus <= 50 && effective <= 50;
    const row = document.createElement("tr");
    row.style.color = valid ? "#1f4e42" : "#b42318";
    row.innerHTML = `
      <td>${skill.name}</td>
      <td><input type="number" min="0" max="50" step="1" data-enh-skill="${key}" data-kind="rank" value="${enhRank}" /></td>
      <td><input type="number" min="0" max="50" step="1" data-enh-skill="${key}" data-kind="bonus" value="${enhBonus}" /></td>
      <td>${effective}/50</td>
    `;
    enhSkillTable.appendChild(row);
  });

  enhStatTable.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      const statKey = input.dataset.enhStat;
      if (!enhanciveState.stats[statKey]) enhanciveState.stats[statKey] = { stat: 0, bonus: 0 };
      const value = Math.max(0, Math.trunc(Number(input.value) || 0));
      if (input.dataset.kind === "stat") enhanciveState.stats[statKey].stat = value;
      else enhanciveState.stats[statKey].bonus = value;
      updateDerivedDisplays({ skipEnhRender: true, skipAscRender: true });
    });
  });

  enhSkillTable.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.enhSkill;
      if (!enhanciveState.skills[key]) enhanciveState.skills[key] = { rank: 0, bonus: 0 };
      const value = Math.max(0, Math.trunc(Number(input.value) || 0));
      if (input.dataset.kind === "rank") enhanciveState.skills[key].rank = value;
      else enhanciveState.skills[key].bonus = value;
      updateDerivedDisplays({ skipEnhRender: true, skipAscRender: true });
    });
  });
}

function updateStatDerivedDisplay() {
  const rows = getDerivedStatRows();
  stats.forEach((stat) => {
    const row = rows[stat.key];
    const level0Input = statGrid.querySelector(`input[data-stat="${stat.key}"][data-field="level0"]`);
    const level0Value = clamp(Number(currentLevel0Stats?.[stat.key] ?? currentBaseStats[stat.key] ?? 50), 1, 100);
    if (level0Input && document.activeElement !== level0Input) level0Input.value = String(level0Value);
    const fields = {
      "base-stat": row.baseStat,
      "base-bonus": formatBonus(row.baseBonus),
      "final-stat": row.finalStat,
      "final-bonus": formatBonus(row.finalBonus),
    };
    Object.entries(fields).forEach(([field, value]) => {
      const output = statGrid.querySelector(`[data-stat="${stat.key}"][data-field="${field}"]`);
      if (output) output.textContent = String(value);
    });
  });
}

function updateEnhanciveDisplay() {
  if (!enhStatTable || !enhSkillTable) return;
  const statRows = getDerivedStatRows();
  enhStatTable.querySelectorAll("tr").forEach((row) => {
    const statCell = row.firstElementChild;
    if (!statCell) return;
    const stat = stats.find((entry) => entry.abbr === statCell.textContent?.trim());
    if (!stat) return;
    const values = statRows[stat.key];
    if (!values) return;
    row.style.color = values.enhValid ? "#1f4e42" : "#b42318";
    const effCell = row.lastElementChild;
    if (effCell) effCell.textContent = `${values.enhEffective}/20`;
  });

  enhSkillTable.querySelectorAll("tr").forEach((row) => {
    const skillCell = row.firstElementChild;
    if (!skillCell) return;
    const key = skillKey(skillCell.textContent);
    const skill = currentSkills.find((entry) => skillKey(entry.name) === key);
    if (!skill) return;
    const baseRanks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
    const enhRank = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.rank) || 0));
    const enhBonus = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.bonus) || 0));
    const rankBonusGain = skillBonusFromRanks(baseRanks + enhRank) - skillBonusFromRanks(baseRanks);
    const effective = rankBonusGain + enhBonus;
    const valid = enhRank <= 50 && enhBonus <= 50 && effective <= 50;
    row.style.color = valid ? "#1f4e42" : "#b42318";
    const effCell = row.lastElementChild;
    if (effCell) effCell.textContent = `${effective}/50`;
  });
}

function updateDerivedDisplays(options = {}) {
  const { skipStatsRender = false, skipSkillsRender = false, skipAscRender = false, skipEnhRender = false } = options;
  syncSkillAdjustmentState();
  if (!skipStatsRender) updateStatDerivedDisplay();
  if (!skipSkillsRender) renderSkillsTable(currentSkills);
  if (skipSkillsRender) updateSkillsDerivedDisplay();
  if (!skipAscRender) renderAscensionTables();
  if (!skipEnhRender) renderEnhanciveTables();
  updateAscensionStatus();
  if (skipEnhRender) updateEnhanciveDisplay();
  updateEnhStatus();
  if (!applyingProfile) updateProfileActionState();
}

function updateEnhStatus() {
  if (!enhStatus) return;
  const statRows = getDerivedStatRows();
  const statInvalid = Object.values(statRows).some((row) => !row.enhValid);
  const skillInvalid = currentSkills.some((skill) => {
    const key = skillKey(skill.name);
    const baseRanks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
    const enhRank = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.rank) || 0));
    const enhBonus = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.bonus) || 0));
    const rankBonusGain = skillBonusFromRanks(baseRanks + enhRank) - skillBonusFromRanks(baseRanks);
    return enhRank > 50 || enhBonus > 50 || rankBonusGain + enhBonus > 50;
  });
  if (statInvalid || skillInvalid) {
    enhStatus.textContent = "Invalid enhancive rows: stat limit is 40 stat / 20 bonus with 20 effective; skill limit is 50 effective.";
    enhStatus.style.color = "#b42318";
  } else {
    enhStatus.textContent = "Enhancive limits are enforced per row.";
    enhStatus.style.color = "";
  }
}

function recalcFromLevel0() {
  if (!currentLevel0Stats) {
    const parsedStart = parseInfoStartBlock(infoImport.value);
    if (parsedStart && !parsedStart.error) {
      currentLevel0Stats = parsedStart.level0Stats;
      const raceOption = parsedStart.race
        ? races.find((race) => race.name.toLowerCase() === parsedStart.race.toLowerCase())
        : null;
      if (raceOption) profileRace.value = raceOption.key;
      const professionOption = parsedStart.profession
        ? professions.find((prof) => prof.toLowerCase() === parsedStart.profession.toLowerCase())
        : null;
      if (professionOption) profileProfession.value = professionOption;
      if (!profileName.value.trim() && parsedStart.name) profileName.value = parsedStart.name;
    } else {
      importStatus.textContent = "No level 0 stats found. Run INFO START and paste full output.";
      importStatus.style.color = "#b42318";
      return;
    }
  }
  const level = clamp(Number(profileLevel.value), 0, 100);
  const raceName = races.find((race) => race.key === profileRace.value)?.name || "Human";
  const profession = profileProfession.value;
  if (!baseGrowthRates[profession]) {
    importStatus.textContent = "Select a profession to calculate stats from level 0.";
    importStatus.style.color = "#b42318";
    return;
  }
  const computed = computeStatsFromLevel0(currentLevel0Stats, level, raceName, profession);
  currentBaseStats = {};
  stats.forEach((stat) => {
    currentBaseStats[stat.key] = computed?.[stat.key]?.base ?? 50;
  });
  updateDerivedDisplays();
}

function handleInfoStartParse() {
  const parsedStart = parseInfoStartBlock(infoImport.value);
  if (!parsedStart || parsedStart.error) {
    if (parsedStart?.error === "wrong_block_info") {
      importStatus.textContent = "This looks like INFO output (with bonuses/...). Paste INFO START or plain level-0 stat lines only.";
      importStatus.style.color = "#b42318";
      return;
    }
    if (parsedStart?.error === "partial_level0") {
      const missing = (parsedStart.missing || []).map((key) => stats.find((s) => s.key === key)?.abbr).filter(Boolean);
      importStatus.textContent = `Level 0 stats are incomplete. Missing: ${missing.join(", ")}. Paste all 10 base stat lines.`;
      importStatus.style.color = "#b42318";
      return;
    }
    const preview = infoImport.value.trim().split(/\r?\n/).slice(0, 3).join(" / ");
    importStatus.textContent = `Could not parse INFO START / level-0 stats. First lines: ${preview || "empty"}`;
    importStatus.style.color = "#b42318";
    return;
  }
  const who = parsedStart.name && parsedStart.race && parsedStart.profession
    ? `${parsedStart.name} (${parsedStart.race} ${parsedStart.profession})`
    : "level-0 stat block";
  importStatus.textContent = `Parsed ${who}. Stats recalculated from level 0.`;
  importStatus.style.color = "";
  if (parsedStart.name) profileName.value = parsedStart.name;
  const raceOption = parsedStart.race
    ? races.find((race) => race.name.toLowerCase() === parsedStart.race.toLowerCase())
    : null;
  if (raceOption) profileRace.value = raceOption.key;
  const professionOption = parsedStart.profession
    ? professions.find((prof) => prof.toLowerCase() === parsedStart.profession.toLowerCase())
    : null;
  if (professionOption) profileProfession.value = professionOption;
  currentLevel0Stats = parsedStart.level0Stats;
  initAdjustmentState();
  recalcFromLevel0();
  updateDerivedDisplays();
}

function applyProfile(profile) {
  applyingProfile = true;
  profileName.value = profile.name;
  const raceOption = races.find((race) => race.name.toLowerCase() === profile.race.toLowerCase());
  if (raceOption) profileRace.value = raceOption.key;
  if (profile.profession) profileProfession.value = profile.profession;
  if (profile.level != null) profileLevel.value = profile.level;

  currentLevel0Stats = profile.level0Stats || null;
  if (currentLevel0Stats) {
    recalcFromLevel0();
  } else if (profile.stats) {
    currentBaseStats = {};
    stats.forEach((stat) => {
      currentBaseStats[stat.key] = clamp(Number(profile.stats?.[stat.key]?.base ?? 50), 1, 200);
    });
    updateStatDerivedDisplay();
  }

  initAdjustmentState();
  stats.forEach((stat) => {
    const key = stat.key;
    const legacyStat = Math.max(0, Math.trunc(Number(profile.statAdjust?.[key]) || 0));
    const legacyBonus = Math.max(0, Math.trunc(Number(profile.bonusAdjust?.[key]) || 0));
    enhanciveState.stats[key] = { stat: legacyStat, bonus: legacyBonus };
    const ascStat = Math.max(0, Math.trunc(Number(profile.ascension?.stats?.[key]?.stat) || 0));
    const ascBonus = Math.max(0, Math.trunc(Number(profile.ascension?.stats?.[key]?.bonus) || 0));
    const enhStat = Math.max(0, Math.trunc(Number(profile.enhancive?.stats?.[key]?.stat) || legacyStat));
    const enhBonus = Math.max(0, Math.trunc(Number(profile.enhancive?.stats?.[key]?.bonus) || legacyBonus));
    ascensionState.stats[key] = { stat: ascStat, bonus: ascBonus };
    enhanciveState.stats[key] = { stat: enhStat, bonus: enhBonus };
  });

  if (profile.defaults) {
    armorAsgSelect.value = profile.defaults.armorAsg || "none";
    armorWeightInput.value = String(profile.defaults.armorWeight ?? 0);
    accessoryWeightInput.value = String(profile.defaults.accessoryWeight ?? 0);
    gearWeightInput.value = String(profile.defaults.gearWeight ?? 0);
    silversInput.value = String(profile.defaults.silvers ?? 0);
  }

  if (profile.skills) {
    currentSkills = mergeSkillsWithCatalog(profile.skills.map((skill) => normalizeSkillEntry(skill)));
    syncSkillAdjustmentState();
    currentSkills.forEach((skill) => {
      const key = skillKey(skill.name);
      const legacyRank = Math.max(0, Math.trunc(Number(skill.rankAdjust) || 0));
      const legacyBonus = Math.max(0, Math.trunc(Number(skill.bonusAdjust) || 0));
      const ascBonus = Math.max(0, Math.trunc(Number(profile.ascension?.skills?.[key]?.bonus) || 0));
      const enhRank = Math.max(0, Math.trunc(Number(profile.enhancive?.skills?.[key]?.rank) || legacyRank));
      const enhBonus = Math.max(0, Math.trunc(Number(profile.enhancive?.skills?.[key]?.bonus) || legacyBonus));
      ascensionState.skills[key] = { bonus: ascBonus };
      enhanciveState.skills[key] = { rank: enhRank, bonus: enhBonus };
    });
  } else {
    currentSkills = mergeSkillsWithCatalog([]);
    syncSkillAdjustmentState();
  }
  skillsImportUnmatchedKeys = new Set();
  updateSkillsImportFlags();
  updateSkillsStatusMessage();
  updateDerivedDisplays();
  applyingProfile = false;
  updateProfileActionState();
}

function updateArmorWeight() {
  const selected = armorAsg.find((item) => item.key === armorAsgSelect.value);
  if (!selected) return;
  armorWeightInput.value = String(selected.standardWeight);
}

function renderSkillsTable(skills) {
  skillsTable.innerHTML = "";
  const visibleSkills = getVisibleSkills(skills);
  if (!visibleSkills.length) {
    const row = document.createElement("tr");
    row.innerHTML = "<td colspan=\"5\">No skills loaded yet.</td>";
    skillsTable.appendChild(row);
    return;
  }
  const grouped = new Map();
  skillCategoryOrder.forEach((category) => grouped.set(category, []));
  visibleSkills.forEach((skill) => {
    const category = skillCategoryByName[skill.name] || "Other";
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(skill);
  });

  skillCategoryOrder.forEach((category) => {
    const items = grouped.get(category) || [];
    if (!items.length) return;

    const groupRow = document.createElement("tr");
    groupRow.className = "skills-group-row";
    groupRow.innerHTML = `<td colspan="5">${category}</td>`;
    skillsTable.appendChild(groupRow);

    items.forEach((skill) => {
    const key = skillKey(skill.name);
    const isCircle = spellCircles.has(skill.name);
    const baseRanks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
    const ascBonus = Math.max(0, Math.trunc(Number(ascensionState.skills?.[key]?.bonus) || 0));
    const enhRank = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.rank) || 0));
    const enhBonus = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.bonus) || 0));
    const baseBonus = skillBonusFromRanks(baseRanks);
    const finalRanks = Math.max(0, baseRanks + enhRank);
    const finalBonus = skillBonusFromRanks(finalRanks) + ascBonus + enhBonus;
    const baseBonusDisplay = isCircle ? "—" : String(baseBonus);
    const finalBonusDisplay = isCircle ? "—" : String(finalBonus);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${skill.name}</td>
      <td><input type="number" min="0" max="500" step="1" data-skill-rank="${key}" value="${baseRanks}" /></td>
      <td data-skill-field="base-bonus">${baseBonusDisplay}</td>
      <td data-skill-field="final-ranks">${finalRanks}</td>
      <td data-skill-field="final-bonus">${finalBonusDisplay}</td>
    `;
    row.dataset.skillKey = key;
    row.dataset.isCircle = isCircle ? "1" : "0";
    if (skillsImportUnmatchedKeys.has(key) || skillsImportOffProfessionKeys.has(key)) {
      row.style.color = "#b42318";
    }
    skillsTable.appendChild(row);
    });
  });

  skillsTable.querySelectorAll('input[data-skill-rank]').forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.skillRank;
      const skill = currentSkills.find((entry) => skillKey(entry.name) === key);
      if (!skill) return;
      skill.ranks = Math.max(0, Math.trunc(Number(input.value) || 0));
      updateSkillsImportFlags();
      updateSkillsStatusMessage();
      updateDerivedDisplays({ skipSkillsRender: true, skipStatsRender: true, skipAscRender: true, skipEnhRender: true });
    });
  });
}

function getVisibleSkills(skills) {
  const showTrainedOnly = Boolean(skillsShowTrainedOnly?.checked);
  const allowedCircles = professionSpellCircleMap[profileProfession.value] || new Set();

  return skills.filter((skill) => {
    const key = skillKey(skill.name);
    const ranks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
    const hasAsc = Math.max(0, Math.trunc(Number(ascensionState.skills?.[key]?.bonus) || 0)) > 0;
    const hasEnhRank = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.rank) || 0)) > 0;
    const hasEnhBonus = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.bonus) || 0)) > 0;
    const active = ranks > 0 || hasAsc || hasEnhRank || hasEnhBonus;
    const isCircle = spellCircles.has(skill.name);
    const circleAllowed = allowedCircles.has(skill.name);

    if (showTrainedOnly && !active) return false;
    if (isCircle && !circleAllowed && !active) return false;
    return true;
  });
}

function updateSkillsImportFlags() {
  const allowedCircles = professionSpellCircleMap[profileProfession.value] || new Set();
  const offProfession = new Set();
  currentSkills.forEach((skill) => {
    if (!spellCircles.has(skill.name)) return;
    const ranks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
    if (ranks <= 0) return;
    if (!allowedCircles.has(skill.name)) offProfession.add(skillKey(skill.name));
  });
  skillsImportOffProfessionKeys = offProfession;
}

function updateSkillsStatusMessage(prefix = "") {
  const unmatchedNames = currentSkills
    .filter((skill) => skillsImportUnmatchedKeys.has(skillKey(skill.name)))
    .map((skill) => skill.name);
  const offProfessionNames = currentSkills
    .filter((skill) => skillsImportOffProfessionKeys.has(skillKey(skill.name)))
    .map((skill) => skill.name);

  const parts = [];
  if (prefix) parts.push(prefix);
  if (unmatchedNames.length) parts.push(`Unmatched from paste: ${unmatchedNames.join(", ")}.`);
  if (offProfessionNames.length) parts.push(`Off-profession circles for ${profileProfession.value}: ${offProfessionNames.join(", ")}.`);

  if (!parts.length) {
    skillsStatus.textContent = "Paste SKILLS output to load ranks.";
    skillsStatus.style.color = "";
    return;
  }

  skillsStatus.textContent = parts.join(" ");
  skillsStatus.style.color = unmatchedNames.length || offProfessionNames.length ? "#b42318" : "";
}

function runProfileSelfTests() {
  const tests = [
    {
      name: "T1 INFO START header block parses",
      run: () => parseInfoStartBlock(`Level 0 Stats for Vadulose, Halfling Wizard\nStrength (STR): 94\nConstitution (CON): 58\nDexterity (DEX): 80\nAgility (AGI): 73\nDiscipline (DIS): 46\nAura (AUR): 80\nLogic (LOG): 68\nIntuition (INT): 65\nWisdom (WIS): 73\nInfluence (INF): 23`),
      check: (got) => !got.error && got.name === "Vadulose" && got.profession === "Wizard" && got.level0Stats.str === 94,
    },
    {
      name: "T2 plain 10-line level-0 stats parse",
      run: () => parseInfoStartBlock(`Strength (STR): 94\nConstitution (CON): 58\nDexterity (DEX): 80\nAgility (AGI): 73\nDiscipline (DIS): 46\nAura (AUR): 80\nLogic (LOG): 68\nIntuition (INT): 65\nWisdom (WIS): 73\nInfluence (INF): 23`),
      check: (got) => !got.error && got.level0Stats.inf === 23,
    },
    {
      name: "T3 INFO block is rejected",
      run: () => parseInfoStartBlock(`Strength (STR):    98 (9)     ...   98 (9)\nConstitution (CON):    69 (19)    ...   69 (19)`),
      check: (got) => got.error === "wrong_block_info",
    },
    {
      name: "T4 partial level-0 block flagged",
      run: () => parseInfoStartBlock(`Strength (STR): 94\nConstitution (CON): 58`),
      check: (got) => got.error === "partial_level0" && Array.isArray(got.missing) && got.missing.length > 0,
    },
    {
      name: "T5 skill alias mapping",
      run: () => canonicalSkillName("mental lore, manipulation"),
      check: (got) => got === "Mental Lore - Manipulation",
    },
    {
      name: "T6 profession circle warning (Wizard on Sorcerer)",
      run: () => {
        const allowed = professionSpellCircleMap.Sorcerer;
        return !allowed.has("Wizard") && allowed.has("Sorcerer");
      },
      check: (got) => got === true,
    },
  ];

  let pass = 0;
  const lines = [];
  tests.forEach((test) => {
    const got = test.run();
    const ok = Boolean(test.check(got));
    if (ok) pass += 1;
    lines.push(`${ok ? "PASS" : "FAIL"} ${test.name}`);
    if (!ok) lines.push(` got: ${JSON.stringify(got)}`);
  });
  lines.push("");
  lines.push(`Summary: ${pass}/${tests.length} passing`);

  if (profileTestOutputEl) {
    profileTestOutputEl.textContent = lines.join("\n");
    profileTestOutputEl.style.color = pass === tests.length ? "#1f4e42" : "#b42318";
  }
}

function updateSkillsDerivedDisplay() {
  if (!skillsTable) return;
  skillsTable.querySelectorAll("tr[data-skill-key]").forEach((row) => {
    const key = row.dataset.skillKey;
    const isCircle = row.dataset.isCircle === "1";
    const skill = currentSkills.find((entry) => skillKey(entry.name) === key);
    if (!skill) return;
    const baseRanks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
    const ascBonus = Math.max(0, Math.trunc(Number(ascensionState.skills?.[key]?.bonus) || 0));
    const enhRank = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.rank) || 0));
    const enhBonus = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.bonus) || 0));
    const baseBonus = skillBonusFromRanks(baseRanks);
    const finalRanks = Math.max(0, baseRanks + enhRank);
    const finalBonus = skillBonusFromRanks(finalRanks) + ascBonus + enhBonus;

    const rankInput = row.querySelector('input[data-skill-rank]');
    if (rankInput && document.activeElement !== rankInput) rankInput.value = String(baseRanks);
    const baseBonusCell = row.querySelector('[data-skill-field="base-bonus"]');
    const finalRanksCell = row.querySelector('[data-skill-field="final-ranks"]');
    const finalBonusCell = row.querySelector('[data-skill-field="final-bonus"]');
    if (baseBonusCell) baseBonusCell.textContent = isCircle ? "—" : String(baseBonus);
    if (finalRanksCell) finalRanksCell.textContent = String(finalRanks);
    if (finalBonusCell) finalBonusCell.textContent = isCircle ? "—" : String(finalBonus);
    if (skillsImportUnmatchedKeys.has(key) || skillsImportOffProfessionKeys.has(key)) {
      row.style.color = "#b42318";
    } else {
      row.style.color = "";
    }
  });
}

function skillBonusFromRanks(ranks) {
  const value = Math.max(0, Math.trunc(Number(ranks) || 0));
  if (value <= 10) return value * 5;
  if (value <= 20) return 50 + (value - 10) * 4;
  if (value <= 30) return 90 + (value - 20) * 3;
  if (value <= 40) return 120 + (value - 30) * 2;
  return 100 + value;
}

function normalizeSkillEntry(skill) {
  const baseRanks = Math.max(0, Math.trunc(Number(skill?.ranks) || 0));
  const canonical = canonicalSkillName(skill?.name || "Unknown Skill");
  return {
    name: canonical || "Unknown Skill",
    ranks: baseRanks,
  };
}

function applyAscList(text, options = {}) {
  const { showError = true } = options;
  const parsed = parseAscListBlock(text);
  if (!parsed.length) {
    if (showError) {
      ascImportStatus.textContent = "Could not parse ASC LIST output.";
      ascImportStatus.style.color = "#b42318";
    } else {
      ascImportStatus.textContent = "Paste ASC LIST to load current ascension ranks.";
      ascImportStatus.style.color = "";
    }
    return;
  }

  let statCount = 0;
  let skillCount = 0;
  const statByName = {};
  stats.forEach((stat) => {
    statByName[stat.label.toLowerCase()] = stat.key;
  });

  parsed.forEach((entry) => {
    const mnemonicMapped = ascMnemonicMap[entry.mnemonic] || "";
    const cleanedName = entry.name.toLowerCase().trim();
    const statKey = statByName[cleanedName] || statByName[String(mnemonicMapped).toLowerCase()];
    if (entry.cap === 40 && (entry.subcategory === "stat" || statKey)) {
      if (statKey && ascensionState.stats[statKey]) {
        ascensionState.stats[statKey].stat = Math.max(0, Math.min(40, entry.ranks));
        statCount += 1;
      }
      return;
    }

    if (entry.cap === 50 && entry.subcategory === "skill") {
      const canonical = canonicalSkillName(mnemonicMapped || entry.name);
      const key = skillKey(canonical);
      if (!ascensionState.skills[key]) ascensionState.skills[key] = { bonus: 0 };
      ascensionState.skills[key].bonus = Math.max(0, Math.min(40, entry.ranks));
      skillCount += 1;
    }
  });

  updateDerivedDisplays();
  ascImportStatus.textContent = `ASC LIST loaded: ${statCount} stat row(s), ${skillCount} skill row(s).`;
  ascImportStatus.style.color = "";
}

function collectSkills() {
  return currentSkills.map((skill) => {
    const key = skillKey(skill.name);
    const ascBonus = Math.max(0, Math.trunc(Number(ascensionState.skills?.[key]?.bonus) || 0));
    const enhRank = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.rank) || 0));
    const enhBonus = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.bonus) || 0));
    const finalRanks = Math.max(0, skill.ranks + enhRank);
    const finalBonus = skillBonusFromRanks(finalRanks) + ascBonus + enhBonus;
    return {
      name: skill.name,
      ranks: skill.ranks,
      finalRanks,
      bonus: finalBonus,
    };
  });
}

function normalizeLevel0Stats(level0Stats) {
  if (!level0Stats || typeof level0Stats !== "object") return null;
  const normalized = {};
  stats.forEach((stat) => {
    const value = level0Stats[stat.key];
    if (value != null) normalized[stat.key] = clamp(Number(value), 1, 100);
  });
  return Object.keys(normalized).length ? normalized : null;
}

function normalizeSkillForCompare(skill) {
  const normalized = normalizeSkillEntry(skill);
  const finalRanks = Math.max(0, Math.trunc(Number(skill?.finalRanks) || normalized.ranks));
  const finalBonus = Math.trunc(Number(skill?.bonus) || skillBonusFromRanks(finalRanks));
  return {
    name: normalized.name,
    ranks: normalized.ranks,
    finalRanks,
    bonus: finalBonus,
  };
}

function comparableProfile(record) {
  const mergedSkills = mergeSkillsWithCatalog(Array.isArray(record?.skills) ? record.skills : []);

  const statsPayload = {};
  stats.forEach((stat) => {
    statsPayload[stat.key] = {
      base: clamp(Number(record?.stats?.[stat.key]?.base ?? 50), 1, 200),
      enhanced: clamp(Number(record?.stats?.[stat.key]?.enhanced ?? record?.stats?.[stat.key]?.base ?? 50), 1, 200),
    };
  });

  const ascStats = {};
  const enhStats = {};
  stats.forEach((stat) => {
    ascStats[stat.key] = {
      stat: Math.max(0, Math.trunc(Number(record?.ascension?.stats?.[stat.key]?.stat) || 0)),
      bonus: Math.max(0, Math.trunc(Number(record?.ascension?.stats?.[stat.key]?.bonus) || 0)),
    };
    enhStats[stat.key] = {
      stat: Math.max(0, Math.trunc(Number(record?.enhancive?.stats?.[stat.key]?.stat) || 0)),
      bonus: Math.max(0, Math.trunc(Number(record?.enhancive?.stats?.[stat.key]?.bonus) || 0)),
    };
  });

  const ascSkills = {};
  const enhSkills = {};
  mergedSkills.forEach((skill) => {
    const key = skillKey(skill.name);
    ascSkills[key] = { bonus: Math.max(0, Math.trunc(Number(record?.ascension?.skills?.[key]?.bonus) || 0)) };
    enhSkills[key] = {
      rank: Math.max(0, Math.trunc(Number(record?.enhancive?.skills?.[key]?.rank) || 0)),
      bonus: Math.max(0, Math.trunc(Number(record?.enhancive?.skills?.[key]?.bonus) || 0)),
    };
  });

  const defaults = {
    armorAsg: record?.defaults?.armorAsg || "none",
    armorWeight: Math.max(0, Number(record?.defaults?.armorWeight) || 0),
    accessoryWeight: Math.max(0, Number(record?.defaults?.accessoryWeight) || 0),
    gearWeight: Math.max(0, Number(record?.defaults?.gearWeight) || 0),
    silvers: Math.max(0, Number(record?.defaults?.silvers) || 0),
  };

  return {
    name: String(record?.name || "").trim(),
    race: String(record?.race || "Human"),
    profession: String(record?.profession || ""),
    level: clamp(Number(record?.level), 0, 100),
    level0Stats: normalizeLevel0Stats(record?.level0Stats),
    stats: statsPayload,
    ascension: { stats: ascStats, skills: ascSkills },
    enhancive: { stats: enhStats, skills: enhSkills },
    skills: mergedSkills.map((skill) => normalizeSkillForCompare(skill)),
    defaults,
  };
}

function profilesEqual(a, b) {
  return JSON.stringify(comparableProfile(a)) === JSON.stringify(comparableProfile(b));
}

function clearProfileDiffHighlights() {
  document.querySelectorAll(".changed-from-profile").forEach((element) => {
    element.classList.remove("changed-from-profile");
  });
}

function toggleDiffHighlight(element, changed) {
  if (!element) return;
  element.classList.toggle("changed-from-profile", Boolean(changed));
}

function mapSkillsByKey(skills = []) {
  const map = new Map();
  skills.forEach((skill) => {
    map.set(skillKey(skill.name), skill);
  });
  return map;
}

function updateProfileDiffHighlights(currentProfile, selectedProfile) {
  clearProfileDiffHighlights();
  if (!selectedProfile) return;

  toggleDiffHighlight(profileName, currentProfile.name !== selectedProfile.name);
  toggleDiffHighlight(profileRace, currentProfile.race !== selectedProfile.race);
  toggleDiffHighlight(profileProfession, currentProfile.profession !== selectedProfile.profession);
  toggleDiffHighlight(profileLevel, currentProfile.level !== selectedProfile.level);

  toggleDiffHighlight(armorAsgSelect, currentProfile.defaults.armorAsg !== selectedProfile.defaults.armorAsg);
  toggleDiffHighlight(armorWeightInput, currentProfile.defaults.armorWeight !== selectedProfile.defaults.armorWeight);
  toggleDiffHighlight(accessoryWeightInput, currentProfile.defaults.accessoryWeight !== selectedProfile.defaults.accessoryWeight);
  toggleDiffHighlight(gearWeightInput, currentProfile.defaults.gearWeight !== selectedProfile.defaults.gearWeight);
  toggleDiffHighlight(silversInput, currentProfile.defaults.silvers !== selectedProfile.defaults.silvers);

  stats.forEach((stat) => {
    const level0Input = statGrid.querySelector(`input[data-stat="${stat.key}"][data-field="level0"]`);
    const currentLevel0 = currentProfile.level0Stats?.[stat.key] ?? null;
    const selectedLevel0 = selectedProfile.level0Stats?.[stat.key] ?? null;
    toggleDiffHighlight(level0Input, currentLevel0 !== selectedLevel0);

    const ascStatInputs = ascStatTable.querySelectorAll(`input[data-asc-stat="${stat.key}"]`);
    ascStatInputs.forEach((input) => {
      const kind = input.dataset.kind;
      const currentValue = currentProfile.ascension.stats?.[stat.key]?.[kind] ?? 0;
      const selectedValue = selectedProfile.ascension.stats?.[stat.key]?.[kind] ?? 0;
      toggleDiffHighlight(input, currentValue !== selectedValue);
    });

    const enhStatInputs = enhStatTable.querySelectorAll(`input[data-enh-stat="${stat.key}"]`);
    enhStatInputs.forEach((input) => {
      const kind = input.dataset.kind;
      const currentValue = currentProfile.enhancive.stats?.[stat.key]?.[kind] ?? 0;
      const selectedValue = selectedProfile.enhancive.stats?.[stat.key]?.[kind] ?? 0;
      toggleDiffHighlight(input, currentValue !== selectedValue);
    });
  });

  const currentSkillsMap = mapSkillsByKey(currentProfile.skills);
  const selectedSkillsMap = mapSkillsByKey(selectedProfile.skills);

  skillsTable.querySelectorAll('input[data-skill-rank]').forEach((input) => {
    const key = input.dataset.skillRank;
    const currentRanks = currentSkillsMap.get(key)?.ranks ?? 0;
    const selectedRanks = selectedSkillsMap.get(key)?.ranks ?? 0;
    toggleDiffHighlight(input, currentRanks !== selectedRanks);
  });

  ascSkillTable.querySelectorAll('input[data-asc-skill]').forEach((input) => {
    const key = input.dataset.ascSkill;
    const currentValue = currentProfile.ascension.skills?.[key]?.bonus ?? 0;
    const selectedValue = selectedProfile.ascension.skills?.[key]?.bonus ?? 0;
    toggleDiffHighlight(input, currentValue !== selectedValue);
  });

  enhSkillTable.querySelectorAll('input[data-enh-skill]').forEach((input) => {
    const key = input.dataset.enhSkill;
    const kind = input.dataset.kind;
    const currentValue = currentProfile.enhancive.skills?.[key]?.[kind] ?? 0;
    const selectedValue = selectedProfile.enhancive.skills?.[key]?.[kind] ?? 0;
    toggleDiffHighlight(input, currentValue !== selectedValue);
  });
}

function buildCurrentProfileRecord(nameOverride = null) {
  const statRows = getDerivedStatRows();
  const statsPayload = {};
  stats.forEach((stat) => {
    const row = statRows[stat.key];
    statsPayload[stat.key] = { base: row.baseStat, enhanced: row.finalStat };
  });

  const ascStats = {};
  const enhStats = {};
  stats.forEach((stat) => {
    const key = stat.key;
    ascStats[key] = {
      stat: Math.max(0, Math.trunc(Number(ascensionState.stats?.[key]?.stat) || 0)),
      bonus: Math.max(0, Math.trunc(Number(ascensionState.stats?.[key]?.bonus) || 0)),
    };
    enhStats[key] = {
      stat: Math.max(0, Math.trunc(Number(enhanciveState.stats?.[key]?.stat) || 0)),
      bonus: Math.max(0, Math.trunc(Number(enhanciveState.stats?.[key]?.bonus) || 0)),
    };
  });

  const ascSkills = {};
  const enhSkills = {};
  currentSkills.forEach((skill) => {
    const key = skillKey(skill.name);
    ascSkills[key] = { bonus: Math.max(0, Math.trunc(Number(ascensionState.skills?.[key]?.bonus) || 0)) };
    enhSkills[key] = {
      rank: Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.rank) || 0)),
      bonus: Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.bonus) || 0)),
    };
  });

  return {
    name: (nameOverride == null ? profileName.value : nameOverride).trim(),
    race: races.find((race) => race.key === profileRace.value)?.name || "Human",
    profession: profileProfession.value,
    level: clamp(Number(profileLevel.value), 0, 100),
    level0Stats: currentLevel0Stats,
    stats: statsPayload,
    ascension: { stats: ascStats, skills: ascSkills },
    enhancive: { stats: enhStats, skills: enhSkills },
    skills: collectSkills(),
    defaults: {
      armorAsg: armorAsgSelect.value,
      armorWeight: Math.max(0, Number(armorWeightInput.value) || 0),
      accessoryWeight: Math.max(0, Number(accessoryWeightInput.value) || 0),
      gearWeight: Math.max(0, Number(gearWeightInput.value) || 0),
      silvers: Math.max(0, Number(silversInput.value) || 0),
    },
  };
}

function updateProfileActionState() {
  const selected = profileSelect.value ? findProfile(profiles, profileSelect.value) : null;
  const current = buildCurrentProfileRecord();
  const currentComparable = comparableProfile(current);
  const selectedComparable = selected ? comparableProfile(selected) : null;
  const hasName = currentComparable.name.length > 0;

  profileApply.disabled = !selected;
  profileApply.classList.remove("attention", "success-attention");
  reloadProfileButtons.forEach((button) => {
    button.disabled = !selected;
    button.classList.remove("attention");
  });
  saveProfileButtons.forEach((button) => {
    button.disabled = !hasName;
    button.classList.remove("success-attention");
  });

  if (selected) {
    const hasChanges = !profilesEqual(currentComparable, selectedComparable);
    updateProfileDiffHighlights(currentComparable, selectedComparable);
    if (hasChanges) {
      profileApply.classList.add("attention");
      reloadProfileButtons.forEach((button) => button.classList.add("attention"));
      if (hasName) saveProfileButtons.forEach((button) => button.classList.add("success-attention"));
    }
    return;
  }

  clearProfileDiffHighlights();
  if (hasName) saveProfileButtons.forEach((button) => button.classList.add("success-attention"));
}

function applySectionDefaultVisibility() {
  if (quickStartSection) quickStartSection.open = !Boolean(profileSelect.value);
  if (adjustmentsSection) adjustmentsSection.open = false;
}

function reloadSelectedProfile(showStatus = false) {
  const selected = profileSelect.value;
  if (!selected) return false;
  profiles = loadProfiles();
  refreshProfileSelect(profiles);
  profileSelect.value = selected;
  const profile = findProfile(profiles, selected);
  if (!profile) {
    if (showStatus && importStatus) {
      importStatus.textContent = "Reload failed: selected profile was not found.";
      importStatus.style.color = "#b42318";
    }
    updateProfileActionState();
    return false;
  }
  applyProfile(profile);
  applySectionDefaultVisibility();
  if (showStatus && importStatus) {
    importStatus.textContent = `Reloaded from profile: ${profile.name}`;
    importStatus.style.color = "#1f4e42";
  }
  return true;
}

function resetEditorForNewProfile() {
  applyingProfile = true;
  profileName.value = "";
  profileRace.value = races.find((race) => race.name === "Human")?.key || races[0].key;
  profileProfession.value = "Wizard";
  profileLevel.value = "0";

  infoImport.value = "";
  skillsImport.value = "";
  ascImport.value = "";
  importStatus.textContent = "Run INFO START. Paste full output.";
  importStatus.style.color = "";
  skillsImportUnmatchedKeys = new Set();
  skillsImportOffProfessionKeys = new Set();
  updateSkillsStatusMessage();
  ascImportStatus.textContent = "Paste ASC LIST to load current ascension ranks.";
  ascImportStatus.style.color = "";

  armorAsgSelect.value = "none";
  updateArmorWeight();
  accessoryWeightInput.value = "0";
  gearWeightInput.value = "0";
  silversInput.value = "0";

  currentSkills = mergeSkillsWithCatalog([]);
  currentLevel0Stats = defaultStatMap(50);
  currentBaseStats = defaultStatMap(50);
  initAdjustmentState();
  updateDerivedDisplays();
  applyingProfile = false;
  updateProfileActionState();
}

buildStatInputs();
fillSelect(profileRace, races);
fillSelect(profileProfession, professions.map((name) => ({ key: name, name })));
fillSelect(armorAsgSelect, armorAsg);
updateArmorWeight();

let profiles = loadProfiles();
refreshProfileSelect(profiles);
renderSkillsTable(currentSkills);
currentBaseStats = defaultStatMap(50);
initAdjustmentState();
updateDerivedDisplays();
updateProfileActionState();
applySectionDefaultVisibility();

profileApply.addEventListener("click", () => {
  reloadSelectedProfile(true);
});

reloadProfileButtons.forEach((button) => {
  button.addEventListener("click", () => {
    reloadSelectedProfile(true);
  });
});

profileSelect.addEventListener("change", () => {
  const selected = profileSelect.value;
  if (!selected) {
    resetEditorForNewProfile();
    applySectionDefaultVisibility();
    updateProfileActionState();
    return;
  }
  const profile = findProfile(profiles, selected);
  if (profile) {
    applyProfile(profile);
    applySectionDefaultVisibility();
  }
});

profileDelete.addEventListener("click", () => {
  const selected = profileSelect.value;
  if (!selected) return;
  profiles = profiles.filter((profile) => profile.id !== selected);
  saveProfiles(profiles);
  refreshProfileSelect(profiles);
  profileSelect.value = "";
  resetEditorForNewProfile();
  applySectionDefaultVisibility();
  updateProfileActionState();
});

function handleProfileSave() {
  const parsedInfoStart = parseInfoStartBlock(infoImport.value);
  const parsedInfo = parsedInfoStart && !parsedInfoStart.error ? parsedInfoStart : parseInfoBlock(infoImport.value);
  const name = profileName.value.trim() || (parsedInfo ? parsedInfo.name : "");

  if (!name) {
    importStatus.textContent = "Paste INFO output or enter a profile name.";
    return;
  }

  const currentRecord = buildCurrentProfileRecord(name);
  const racePayload = parsedInfo ? parsedInfo.race : races.find((race) => race.key === profileRace.value)?.name || "Human";
  const professionPayload = parsedInfoStart?.profession || profileProfession.value;
  const levelPayload = clamp(Number(profileLevel.value), 0, 100);

  const record = {
    id: "",
    ...currentRecord,
    race: racePayload,
    profession: professionPayload,
    level: levelPayload,
    level0Stats: parsedInfoStart?.level0Stats || currentLevel0Stats,
  };

  const selectedId = profileSelect.value || "";
  const existingById = selectedId ? profiles.find((entry) => entry.id === selectedId) : null;
  const existingByName = profiles.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
  const id = existingById?.id || existingByName?.id || `profile-${Date.now()}`;
  record.id = id;

  profiles = profiles.filter((entry) => entry.id !== id).concat(record);
  saveProfiles(profiles);
  refreshProfileSelect(profiles);
  profileSelect.value = id;
  importStatus.textContent = `Saved profile: ${record.name}`;
  applyProfile(record);
  applySectionDefaultVisibility();
}

saveProfileButtons.forEach((button) => {
  button.addEventListener("click", handleProfileSave);
});

infoImport.addEventListener("input", () => {
  const parsedStart = parseInfoStartBlock(infoImport.value);
  if (parsedStart) {
    handleInfoStartParse();
    return;
  }

  const parsed = parseInfoBlock(infoImport.value);
  if (!parsed) {
    importStatus.textContent = "Run INFO START. Paste full output.";
    importStatus.style.color = "";
    return;
  }

  importStatus.textContent = `Parsed ${parsed.name} (${parsed.race}). Click Update Profile to store.`;
  importStatus.style.color = "";
  profileName.value = parsed.name;
  const raceOption = races.find((race) => race.name.toLowerCase() === parsed.race.toLowerCase());
  if (raceOption) profileRace.value = raceOption.key;
  currentLevel0Stats = null;
  currentBaseStats = {};
  initAdjustmentState();
  stats.forEach((stat) => {
    const row = parsed.stats[stat.key];
    const baseStat = clamp(Number(row?.base ?? 50), 1, 200);
    currentBaseStats[stat.key] = baseStat;
  });
  updateDerivedDisplays();
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
    skillsImportUnmatchedKeys = new Set();
    skillsImportOffProfessionKeys = new Set();
    updateSkillsStatusMessage();
    return;
  }
  const unmatched = new Set();
  currentSkills = parsed.map((skill) => {
    const canonical = canonicalSkillName(skill.name);
    const canonicalKey = skillKey(canonical || skill.name);
    const matched = skillCatalog.some((entry) => skillKey(entry) === canonicalKey);
    if (!matched) unmatched.add(canonicalKey);
    return {
      name: canonical || skill.name,
      ranks: Math.max(0, Math.trunc(Number(skill.ranks) || 0)),
    };
  });
  skillsImportUnmatchedKeys = unmatched;
  currentSkills = mergeSkillsWithCatalog(currentSkills);
  updateSkillsImportFlags();
  updateSkillsStatusMessage(`Parsed ${parsed.length} skills.`);
  syncSkillAdjustmentState();
  updateDerivedDisplays();

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
  updateSkillsImportFlags();
  updateSkillsStatusMessage();
  renderSkillsTable(currentSkills);
});

profileRace.addEventListener("change", () => {
  updateDerivedDisplays();
  if (currentLevel0Stats) recalcFromLevel0();
});

ascImport.addEventListener("input", () => {
  if (!ascImport.value.trim()) {
    ascImportStatus.textContent = "Paste ASC LIST to load current ascension ranks.";
    ascImportStatus.style.color = "";
    return;
  }
  applyAscList(ascImport.value, { showError: false });
});

document.querySelector("main.calculator").addEventListener("input", () => {
  if (!applyingProfile) updateProfileActionState();
});

document.querySelector("main.calculator").addEventListener("change", () => {
  if (!applyingProfile) updateProfileActionState();
});

skillsShowTrainedOnly?.addEventListener("change", () => {
  renderSkillsTable(currentSkills);
});

runProfileTestsBtn?.addEventListener("click", runProfileSelfTests);
