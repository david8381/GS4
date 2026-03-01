const profileSelect = document.getElementById("profileSelect");
const profileApply = document.getElementById("profileApply");
const profileDelete = document.getElementById("profileDelete");
const profileSave = document.getElementById("profileSave");
const profileExportJson = document.getElementById("profileExportJson");
const profileName = document.getElementById("profileName");
const profileRace = document.getElementById("profileRace");
const profileProfession = document.getElementById("profileProfession");
const profileLevel = document.getElementById("profileLevel");
const profileExperience = document.getElementById("profileExperience");
const profileAscensionExperience = document.getElementById("profileAscensionExperience");
const profileAscensionMilestones = document.getElementById("profileAscensionMilestones");
const atpEstimateStatus = document.getElementById("atpEstimateStatus");
const infoImport = document.getElementById("infoImport");
const expImport = document.getElementById("expImport");
const expImportStatus = document.getElementById("expImportStatus");
const importStatus = document.getElementById("importStatus");
const statGrid = document.getElementById("statGrid");
const skillsImport = document.getElementById("skillsImport");
const skillsStatus = document.getElementById("skillsStatus");
const skillsShowTrainedOnly = document.getElementById("skillsShowTrainedOnly");
const ascImport = document.getElementById("ascImport");
const ascImportStatus = document.getElementById("ascImportStatus");
const skillsTable = document.getElementById("skillsTable");
const tpEstimateStatus = document.getElementById("tpEstimateStatus");
const tpSpentStatus = document.getElementById("tpSpentStatus");
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

const dataSource = globalThis.GS4_DATA;
const logic = globalThis.ProfileLogic;

if (!dataSource) throw new Error("GS4_DATA is not loaded. Ensure data/gs4-data.js is loaded before profile.js.");
if (!logic) throw new Error("ProfileLogic is not loaded. Ensure profile-logic.js is loaded before profile.js.");

const {
  races,
  armorAsg,
  stats,
  skillCatalog,
  spellCircles,
  professionSpellCircleMap,
  skillCategoryByName,
  skillCategoryOrder,
  skillAliasMap,
  ascMnemonicMap,
  professions,
  professionPrimeReqs,
  levelThresholds,
  costProfessionOrder,
  trainingCostRows,
  loreSkillNames,
  maxPerLevelRows,
  baseGrowthRates,
  raceGrowthModifiers,
  raceStatBonusModifiers,
} = dataSource;

const clamp = logic.clamp;
const normalizeRaceName = logic.normalizeRaceName;
const statToBonus = logic.statToBonus;
const skillKey = logic.skillKey;
const skillBonusFromRanks = logic.skillBonusFromRanks;

const defaultStatMap = (value = 0) => logic.defaultStatMap(stats, value);
const canonicalSkillName = (rawName) => logic.canonicalSkillName(rawName, skillAliasMap, skillCatalog);
const mergeSkillsWithCatalog = (skills = []) => logic.mergeSkillsWithCatalog(skills, skillCatalog, skillAliasMap);
const normalizeSkillEntry = (skill) => logic.normalizeSkillEntry(skill, skillCatalog, skillAliasMap);
const computeStatsFromLevel0 = (level0Stats, level, raceName, profession) => (
  logic.computeStatsFromLevel0({
    stats,
    level0Stats,
    level,
    raceName,
    profession,
    baseGrowthRates,
    raceGrowthModifiers,
  })
);
const getRaceBonusModifier = (raceName, statKey) => (
  logic.getRaceBonusModifier(raceStatBonusModifiers, raceName, statKey)
);

let currentSkills = skillCatalog.map((name) => ({ name, ranks: 0 }));
let currentLevel0Stats = null;
let currentBaseStats = {};
let currentAscensionExperience = 0;
let currentAscensionMilestones = 0;
let ascensionState = { stats: {}, skills: {} };
let enhanciveState = { stats: {}, skills: {} };
let applyingProfile = false;
let skillsImportUnmatchedKeys = new Set();
let skillsImportOffProfessionKeys = new Set();
let syncingLevelExperience = false;

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

function formatBonus(bonus) {
  if (!Number.isFinite(bonus)) return "0";
  return bonus > 0 ? `+${bonus}` : String(bonus);
}

function getSelectedRaceName() {
  return races.find((race) => race.key === profileRace.value)?.name || "Human";
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

function levelFromExperience(experience) {
  const value = Math.max(0, Math.trunc(Number(experience) || 0));
  let level = 0;
  for (let index = 0; index < levelThresholds.length; index += 1) {
    if (value >= levelThresholds[index]) level = index;
    else break;
  }
  return clamp(level, 0, 100);
}

function experienceForLevel(level) {
  const safeLevel = clamp(Math.trunc(Number(level) || 0), 0, 100);
  return Math.max(0, Math.trunc(Number(levelThresholds[safeLevel]) || 0));
}

function parseExpBlock(text) {
  const source = String(text || "");
  const expMatch = source.match(/Experience:\s*([0-9,]+)/i);
  if (!expMatch) return null;
  const hintedLevelMatch = source.match(/Level:\s*(\d+)/i);
  const ascExpMatch = source.match(/Ascension Exp:\s*([0-9,]+)/i);
  const experience = Math.max(0, Number(expMatch[1].replace(/,/g, "")) || 0);
  return {
    experience,
    level: levelFromExperience(experience),
    hintedLevel: hintedLevelMatch ? clamp(Number(hintedLevelMatch[1]), 0, 100) : null,
    ascensionExperience: ascExpMatch ? Math.max(0, Number(ascExpMatch[1].replace(/,/g, "")) || 0) : 0,
  };
}

function estimateTotalAscensionPoints(ascensionExperience, ascensionMilestones) {
  const ascExp = Math.max(0, Math.trunc(Number(ascensionExperience) || 0));
  const milestones = clamp(Math.trunc(Number(ascensionMilestones) || 0), 0, 10);
  const expAtp = Math.floor(ascExp / 50000);
  return {
    totalAtp: expAtp + milestones,
    expAtp,
    milestones,
  };
}

function setExperienceFromLevel(level) {
  profileExperience.value = String(experienceForLevel(level));
}

function getTrainingPointStatsForLevel(level) {
  if (currentLevel0Stats) {
    const raceName = races.find((race) => race.key === profileRace.value)?.name || "Human";
    const profession = profileProfession.value;
    const computed = computeStatsFromLevel0(currentLevel0Stats, level, raceName, profession);
    if (computed && Object.keys(computed).length) {
      const snapshot = {};
      stats.forEach((stat) => {
        snapshot[stat.key] = clamp(Number(computed?.[stat.key]?.base ?? 50), 1, 100);
      });
      return snapshot;
    }
  }
  const fallback = {};
  stats.forEach((stat) => {
    fallback[stat.key] = clamp(Number(currentBaseStats?.[stat.key] ?? 50), 1, 100);
  });
  return fallback;
}

function trainingPointsPerLevelForStats(statSnapshot, profession) {
  const primes = new Set(professionPrimeReqs[profession] || []);
  const weighted = (key) => {
    const value = clamp(Number(statSnapshot?.[key] ?? 50), 1, 100);
    return primes.has(key) ? value * 2 : value;
  };
  const str = weighted("str");
  const con = weighted("con");
  const dex = weighted("dex");
  const agi = weighted("agi");
  const aur = weighted("aur");
  const dis = weighted("dis");
  const log = weighted("log");
  const int = weighted("int");
  const wis = weighted("wis");
  const inf = weighted("inf");
  const hybrid = (aur + dis) / 2;

  const ptpPerLevel = Math.max(0, Math.floor((str + con + dex + agi + hybrid) / 20 + 25));
  const mtpPerLevel = Math.max(0, Math.floor((log + int + wis + inf + hybrid) / 20 + 25));
  return { ptpPerLevel, mtpPerLevel };
}

function estimateTotalTrainingPointsFromExperience(experience, profession) {
  const totalExp = Math.max(0, Math.trunc(Number(experience) || 0));
  const capExp = Math.max(0, Math.trunc(Number(levelThresholds[100]) || 0));
  const expForLeveledGain = Math.min(totalExp, capExp);

  let totalPtp = 0;
  let totalMtp = 0;

  // Level 0 grant.
  const level0Stats = getTrainingPointStatsForLevel(0);
  const level0Gain = trainingPointsPerLevelForStats(level0Stats, profession);
  totalPtp += level0Gain.ptpPerLevel;
  totalMtp += level0Gain.mtpPerLevel;

  // EXP-driven gains through level 100 progression.
  for (let level = 0; level < 100; level += 1) {
    const start = levelThresholds[level];
    const end = levelThresholds[level + 1];
    if (expForLeveledGain <= start) break;
    const gained = Math.min(expForLeveledGain, end) - start;
    if (gained <= 0) continue;
    const interval = Math.max(1, end - start);
    // TP gain within each level band anticipates the next level's stat state.
    const perLevel = trainingPointsPerLevelForStats(getTrainingPointStatsForLevel(Math.min(100, level + 1)), profession);
    if (gained >= interval) {
      totalPtp += perLevel.ptpPerLevel;
      totalMtp += perLevel.mtpPerLevel;
    } else {
      totalPtp += Math.floor((gained * perLevel.ptpPerLevel) / interval);
      totalMtp += Math.floor((gained * perLevel.mtpPerLevel) / interval);
      break;
    }
  }

  // Post-cap bonus: +1 PTP and +1 MTP per 2500 experience over level 100 threshold.
  if (totalExp > capExp) {
    const postCapChunks = Math.floor((totalExp - capExp) / 2500);
    totalPtp += postCapChunks;
    totalMtp += postCapChunks;
  }

  return {
    ptp: Math.max(0, Math.trunc(totalPtp)),
    mtp: Math.max(0, Math.trunc(totalMtp)),
  };
}

function multiplierUnitsForRanks(rankCount, effectiveLevels) {
  const ranks = Math.max(0, Math.trunc(Number(rankCount) || 0));
  const oneX = Math.max(0, Math.trunc(Number(effectiveLevels) || 0));
  const baseCount = Math.min(ranks, oneX);
  const doubleCount = Math.min(Math.max(ranks - oneX, 0), oneX);
  const quadCount = Math.max(ranks - oneX * 2, 0);
  return baseCount + doubleCount * 2 + quadCount * 4;
}

function estimateSpentTrainingPointsFromRanks(skills, profession, level) {
  const professionIndex = costProfessionOrder.indexOf(profession);
  if (professionIndex < 0) return { ptp: 0, mtp: 0 };

  const effectiveLevels = Math.max(0, Math.trunc(Number(level) || 0)) + 2;
  const pools = new Map();

  (skills || []).forEach((skill) => {
    const ranks = Math.max(0, Math.trunc(Number(skill?.ranks) || 0));
    if (ranks <= 0) return;
    const trainingRowName = getSkillTrainingRowName(skill.name);
    const poolKey = getSkillPoolKey(skill.name, trainingRowName);
    if (!pools.has(poolKey)) {
      pools.set(poolKey, { trainingRowName, ranks: 0 });
    }
    pools.get(poolKey).ranks += ranks;
  });

  let spentPtp = 0;
  let spentMtp = 0;
  pools.forEach((pool) => {
    const costRow = trainingCostRows[pool.trainingRowName]?.[professionIndex];
    if (!Array.isArray(costRow) || costRow.length < 2) return;
    const basePtp = Math.max(0, Math.trunc(Number(costRow[0]) || 0));
    const baseMtp = Math.max(0, Math.trunc(Number(costRow[1]) || 0));
    const units = multiplierUnitsForRanks(pool.ranks, effectiveLevels);
    spentPtp += basePtp * units;
    spentMtp += baseMtp * units;
  });

  return {
    ptp: Math.max(0, Math.trunc(spentPtp)),
    mtp: Math.max(0, Math.trunc(spentMtp)),
  };
}

function summarizeTrainingPointConversion(totalTp, spentTp) {
  let balancePtp = Math.trunc(Number(totalTp?.ptp) || 0) - Math.trunc(Number(spentTp?.ptp) || 0);
  let balanceMtp = Math.trunc(Number(totalTp?.mtp) || 0) - Math.trunc(Number(spentTp?.mtp) || 0);
  let phyToMnt = 0;
  let mntToPhy = 0;

  // Mirror in-game conversion semantics:
  // "Phy to Mnt" and "Mnt to Phy" are source-pool points converted at 2:1.
  if (balancePtp > 0 && balanceMtp < 0) {
    const neededMtp = Math.abs(balanceMtp);
    let convertiblePtp = Math.min(balancePtp, neededMtp * 2);
    convertiblePtp = Math.floor(convertiblePtp / 2) * 2;
    phyToMnt = Math.max(0, convertiblePtp);
    balancePtp -= phyToMnt;
    balanceMtp += Math.floor(phyToMnt / 2);
  } else if (balanceMtp > 0 && balancePtp < 0) {
    const neededPtp = Math.abs(balancePtp);
    let convertibleMtp = Math.min(balanceMtp, neededPtp * 2);
    convertibleMtp = Math.floor(convertibleMtp / 2) * 2;
    mntToPhy = Math.max(0, convertibleMtp);
    balanceMtp -= mntToPhy;
    balancePtp += Math.floor(mntToPhy / 2);
  }

  return {
    phyToMnt,
    mntToPhy,
    pointsLeftPtp: Math.max(0, balancePtp),
    pointsLeftMtp: Math.max(0, balanceMtp),
    remainingDeficitPtp: Math.max(0, -balancePtp),
    remainingDeficitMtp: Math.max(0, -balanceMtp),
  };
}

function updateTrainingPointEstimateDisplay() {
  if (!tpEstimateStatus || !tpSpentStatus) return;
  const profession = profileProfession.value;
  if (!profession) {
    tpEstimateStatus.textContent = "Total TP from EXP: —";
    tpSpentStatus.textContent = "Total TP Spent: —";
    return;
  }
  const experience = Math.max(0, Math.trunc(Number(profileExperience.value) || 0));
  const level = clamp(Number(profileLevel.value), 0, 100);
  const totalTp = estimateTotalTrainingPointsFromExperience(experience, profession);
  const spentTp = estimateSpentTrainingPointsFromRanks(currentSkills, profession, level);
  const conversion = summarizeTrainingPointConversion(totalTp, spentTp);

  tpEstimateStatus.textContent = `Total TP from EXP: ${totalTp.ptp}/${totalTp.mtp} (PTP/MTP)`;
  tpSpentStatus.textContent = `Total TP Spent: ${spentTp.ptp}/${spentTp.mtp} (PTP/MTP) | Points Left: ${conversion.pointsLeftPtp}/${conversion.pointsLeftMtp} | Converted (Phy->Mnt / Mnt->Phy): ${conversion.phyToMnt}/${conversion.mntToPhy}`;
  if (conversion.remainingDeficitPtp > 0 || conversion.remainingDeficitMtp > 0) {
    tpSpentStatus.textContent += ` | Shortfall: ${conversion.remainingDeficitPtp}/${conversion.remainingDeficitMtp}`;
    tpSpentStatus.style.color = "#b42318";
  } else {
    tpSpentStatus.style.color = "";
  }
}

function updateAscensionPointEstimateDisplay() {
  if (!atpEstimateStatus) return;
  const atp = estimateTotalAscensionPoints(currentAscensionExperience, currentAscensionMilestones);
  atpEstimateStatus.textContent = `Total ATP from milestones + asc exp: ${atp.totalAtp} (${atp.milestones} milestones + ${atp.expAtp} from asc exp)`;
}

function isAscensionSkillName(name) {
  return !spellCircles.has(name);
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
  updateTrainingPointEstimateDisplay();
  updateAscensionPointEstimateDisplay();
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
  if (!Object.keys(computed || {}).length) {
    importStatus.textContent = "Could not compute stats. Check race/profession selection.";
    importStatus.style.color = "#b42318";
    return;
  }
  currentBaseStats = {};
  stats.forEach((stat) => {
    currentBaseStats[stat.key] = computed?.[stat.key]?.base ?? 50;
  });
  updateDerivedDisplays();
}

function handleInfoStartParse() {
  const parsedStart = parseInfoStartBlock(infoImport.value);
  if (!parsedStart || parsedStart.error) {
    const parsedExp = parseExpBlock(infoImport.value);
    if (parsedExp) {
      syncingLevelExperience = true;
      profileExperience.value = String(parsedExp.experience);
      profileLevel.value = String(parsedExp.level);
      syncingLevelExperience = false;
      currentAscensionExperience = parsedExp.ascensionExperience;
      if (currentLevel0Stats) recalcFromLevel0();
      else renderSkillsTable(currentSkills);
      importStatus.textContent = `Parsed EXP block. Level ${parsedExp.level}, EXP ${parsedExp.experience}, Asc EXP ${parsedExp.ascensionExperience}.`;
      importStatus.style.color = "";
      return;
    }
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
  const normalizedExperience = Math.max(0, Math.trunc(Number(profile.experience) || experienceForLevel(profile.level ?? 0)));
  profileExperience.value = String(normalizedExperience);
  profileLevel.value = String(levelFromExperience(normalizedExperience));
  currentAscensionExperience = Math.max(0, Math.trunc(Number(profile.ascensionExperience) || 0));
  if (profileAscensionExperience) profileAscensionExperience.value = String(currentAscensionExperience);
  currentAscensionMilestones = clamp(Math.trunc(Number(profile.ascensionMilestones) || 0), 0, 10);
  if (profileAscensionMilestones) profileAscensionMilestones.value = String(currentAscensionMilestones);

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

function getSkillTrainingRowName(skillName) {
  if (spellCircles.has(skillName)) return "Spell Research";
  if (loreSkillNames.has(skillName)) {
    if (skillName.startsWith("Elemental Lore -")) return "Elemental Lore";
    if (skillName.startsWith("Spiritual Lore -")) return "Spiritual Lore";
    if (skillName.startsWith("Sorcerous Lore -")) return "Sorcerous Lore";
    if (skillName.startsWith("Mental Lore -")) return "Mental Lore";
  }
  return skillName;
}

function getSkillPoolKey(skillName, trainingRowName) {
  if (spellCircles.has(skillName) || trainingRowName === "Spell Research") return "pool:spell-research";
  if (trainingRowName === "Elemental Lore") return "pool:lore-elemental";
  if (trainingRowName === "Spiritual Lore") return "pool:lore-spiritual";
  if (trainingRowName === "Sorcerous Lore") return "pool:lore-sorcerous";
  if (trainingRowName === "Mental Lore") return "pool:lore-mental";
  return `pool:skill:${skillKey(skillName)}`;
}

function getSkillPoolLabel(poolKey, trainingRowName) {
  if (poolKey === "pool:spell-research") return "Spell Research";
  if (poolKey.startsWith("pool:lore-")) return trainingRowName;
  return trainingRowName;
}

function formatPoolHeaderText(poolLabel, poolUsed, poolMax) {
  return `${poolLabel} Max Ranks: ${poolMax} (Used: ${poolUsed})`;
}

function formatTrainingCostDisplay(ptp, mtp) {
  return `${ptp}/${mtp}`;
}

function getDisplaySkillCategory(skillName) {
  const baseCategory = skillCategoryByName[skillName] || "Other";
  if (baseCategory === "Subterfuge" || baseCategory === "Survival and Utility") return "General Skills";
  return baseCategory;
}

const displaySkillCategoryOrder = [
  "Armor and Shield",
  "Weapon Skills",
  "Combat Skills",
  "Magic Skills",
  "Lores",
  "General Skills",
  "Spell Circles",
  "Other",
];

function buildSkillRankCapContext(skills = currentSkills) {
  const professionIndex = costProfessionOrder.indexOf(profileProfession.value);
  const level = Math.max(0, Math.trunc(Number(profileLevel.value) || 0));
  const effectiveLevels = level + 2;
  const poolTotals = new Map();
  const entries = [];
  const byPool = new Map();

  skills.forEach((skill) => {
    const key = skillKey(skill.name);
    const ranks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
    const trainingRowName = getSkillTrainingRowName(skill.name);
    const perLevelCap = professionIndex >= 0 ? maxPerLevelRows[trainingRowName]?.[professionIndex] : null;
    const poolKey = getSkillPoolKey(skill.name, trainingRowName);
    const maxTotal = Number.isFinite(perLevelCap) ? Math.max(0, Math.trunc(perLevelCap * effectiveLevels)) : null;
    entries.push({ key, ranks, trainingRowName, poolKey, maxTotal });
    if (maxTotal == null) return;
    poolTotals.set(poolKey, (poolTotals.get(poolKey) || 0) + ranks);
    if (!byPool.has(poolKey)) {
      byPool.set(poolKey, {
        poolKey,
        poolLabel: getSkillPoolLabel(poolKey, trainingRowName),
        poolMax: maxTotal,
        pooled: poolKey.startsWith("pool:lore-") || poolKey === "pool:spell-research",
      });
    }
  });

  const bySkill = new Map();
  byPool.forEach((pool) => {
    pool.poolUsed = poolTotals.get(pool.poolKey) || 0;
  });

  entries.forEach((entry) => {
    if (entry.maxTotal == null) {
      bySkill.set(entry.key, null);
      return;
    }
    const poolUsed = poolTotals.get(entry.poolKey) || 0;
    const maxRanks = Math.max(0, entry.maxTotal - (poolUsed - entry.ranks));
    const poolMeta = byPool.get(entry.poolKey);
    bySkill.set(entry.key, {
      trainingRowName: entry.trainingRowName,
      poolKey: entry.poolKey,
      poolLabel: poolMeta?.poolLabel || entry.trainingRowName,
      pooled: Boolean(poolMeta?.pooled),
      poolUsed: poolMeta?.poolUsed ?? poolUsed,
      maxRanks,
      poolMax: entry.maxTotal,
    });
  });

  return { bySkill, byPool };
}

function getNextRankCostDisplay(skill, capContext) {
  const professionIndex = costProfessionOrder.indexOf(profileProfession.value);
  if (professionIndex < 0) return "—";

  const key = skillKey(skill.name);
  const ranks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
  const cap = capContext.bySkill.get(key);
  if (cap && ranks >= cap.maxRanks) return "—";

  const trainingRowName = cap?.trainingRowName || getSkillTrainingRowName(skill.name);
  const costRow = trainingCostRows[trainingRowName]?.[professionIndex];
  if (!Array.isArray(costRow) || costRow.length < 2) return "—";

  const basePtp = Math.max(0, Math.trunc(Number(costRow[0]) || 0));
  const baseMtp = Math.max(0, Math.trunc(Number(costRow[1]) || 0));
  const effectiveLevels = Math.max(0, Math.trunc(Number(profileLevel.value) || 0)) + 2;
  const oneXLimit = effectiveLevels;
  const twoXLimit = effectiveLevels * 2;

  const nextOrdinal = (cap?.pooled ? cap.poolUsed : ranks) + 1;
  const multiplier = nextOrdinal <= oneXLimit ? 1 : (nextOrdinal <= twoXLimit ? 2 : 4);
  return formatTrainingCostDisplay(basePtp * multiplier, baseMtp * multiplier);
}

function renderSkillsTable(skills) {
  skillsTable.innerHTML = "";
  const visibleSkills = getVisibleSkills(skills);
  const capContext = buildSkillRankCapContext(currentSkills);
  const capsBySkill = capContext.bySkill;
  const renderedPoolHeaders = new Set();
  if (!visibleSkills.length) {
    const row = document.createElement("tr");
    row.innerHTML = "<td colspan=\"7\">No skills loaded yet.</td>";
    skillsTable.appendChild(row);
    return;
  }
  const grouped = new Map();
  displaySkillCategoryOrder.forEach((category) => grouped.set(category, []));
  visibleSkills.forEach((skill) => {
    const category = getDisplaySkillCategory(skill.name);
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(skill);
  });

  displaySkillCategoryOrder.forEach((category) => {
    const items = grouped.get(category) || [];
    if (!items.length) return;

    const groupRow = document.createElement("tr");
    groupRow.className = "skills-group-row";
    groupRow.innerHTML = `<td colspan="7">${category}</td>`;
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
    const nextCostDisplay = getNextRankCostDisplay(skill, capContext);
    const cap = capsBySkill.get(key);
    const maxRanksDisplay = cap ? (cap.pooled ? "—" : String(cap.maxRanks)) : "—";
    const rankInputMax = cap ? Math.max(cap.maxRanks, baseRanks) : 500;

    if (cap?.pooled && !renderedPoolHeaders.has(cap.poolKey)) {
      const poolRow = document.createElement("tr");
      poolRow.className = "skills-group-row";
      poolRow.dataset.poolKey = cap.poolKey;
      poolRow.dataset.poolLabel = cap.poolLabel;
      poolRow.innerHTML = `<td colspan="7">${formatPoolHeaderText(cap.poolLabel, cap.poolUsed, cap.poolMax)}</td>`;
      skillsTable.appendChild(poolRow);
      renderedPoolHeaders.add(cap.poolKey);
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${skill.name}</td>
      <td><input type="number" min="0" max="${rankInputMax}" step="1" data-skill-rank="${key}" value="${baseRanks}" /></td>
      <td data-skill-field="base-bonus">${baseBonusDisplay}</td>
      <td data-skill-field="next-cost">${nextCostDisplay}</td>
      <td data-skill-field="max-ranks">${maxRanksDisplay}</td>
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
      const requested = Math.max(0, Math.trunc(Number(input.value) || 0));
      const cap = buildSkillRankCapContext(currentSkills).bySkill.get(key);
      const capped = cap ? Math.min(requested, cap.maxRanks) : requested;
      skill.ranks = capped;
      if (String(capped) !== String(input.value)) input.value = String(capped);
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
  const capContext = buildSkillRankCapContext(currentSkills);
  const capsBySkill = capContext.bySkill;
  const capsByPool = capContext.byPool;
  skillsTable.querySelectorAll("tr[data-pool-key]").forEach((row) => {
    const poolKey = row.dataset.poolKey;
    const poolLabel = row.dataset.poolLabel || "Pool";
    const pool = capsByPool.get(poolKey);
    const cell = row.firstElementChild;
    if (pool && cell) {
      cell.textContent = formatPoolHeaderText(poolLabel, pool.poolUsed, pool.poolMax);
    }
  });
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
    const cap = capsBySkill.get(key);
    const nextCostDisplay = getNextRankCostDisplay(skill, capContext);

    const rankInput = row.querySelector('input[data-skill-rank]');
    if (rankInput) {
      if (document.activeElement !== rankInput) rankInput.value = String(baseRanks);
      rankInput.max = String(cap ? Math.max(cap.maxRanks, baseRanks) : 500);
    }
    const baseBonusCell = row.querySelector('[data-skill-field="base-bonus"]');
    const nextCostCell = row.querySelector('[data-skill-field="next-cost"]');
    const maxRanksCell = row.querySelector('[data-skill-field="max-ranks"]');
    const finalRanksCell = row.querySelector('[data-skill-field="final-ranks"]');
    const finalBonusCell = row.querySelector('[data-skill-field="final-bonus"]');
    if (baseBonusCell) baseBonusCell.textContent = isCircle ? "—" : String(baseBonus);
    if (nextCostCell) nextCostCell.textContent = nextCostDisplay;
    if (maxRanksCell) maxRanksCell.textContent = cap ? (cap.pooled ? "—" : String(cap.maxRanks)) : "—";
    if (finalRanksCell) finalRanksCell.textContent = String(finalRanks);
    if (finalBonusCell) finalBonusCell.textContent = isCircle ? "—" : String(finalBonus);
    if (skillsImportUnmatchedKeys.has(key) || skillsImportOffProfessionKeys.has(key)) {
      row.style.color = "#b42318";
    } else {
      row.style.color = "";
    }
  });
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
    experience: Math.max(0, Math.trunc(Number(record?.experience) || experienceForLevel(record?.level))),
    ascensionExperience: Math.max(0, Math.trunc(Number(record?.ascensionExperience) || 0)),
    ascensionMilestones: clamp(Math.trunc(Number(record?.ascensionMilestones) || 0), 0, 10),
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
  toggleDiffHighlight(profileExperience, currentProfile.experience !== selectedProfile.experience);
  toggleDiffHighlight(profileAscensionExperience, currentProfile.ascensionExperience !== selectedProfile.ascensionExperience);
  toggleDiffHighlight(profileAscensionMilestones, currentProfile.ascensionMilestones !== selectedProfile.ascensionMilestones);

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
    experience: Math.max(0, Math.trunc(Number(profileExperience.value) || 0)),
    ascensionExperience: Math.max(0, Math.trunc(Number(currentAscensionExperience) || 0)),
    ascensionMilestones: clamp(Math.trunc(Number(currentAscensionMilestones) || 0), 0, 10),
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
  profileExperience.value = "0";
  if (profileAscensionExperience) profileAscensionExperience.value = "0";
  currentAscensionMilestones = 0;
  if (profileAscensionMilestones) profileAscensionMilestones.value = "0";

  infoImport.value = "";
  expImport.value = "";
  skillsImport.value = "";
  ascImport.value = "";
  importStatus.textContent = "Run INFO START. Paste full output.";
  importStatus.style.color = "";
  expImportStatus.textContent = "Paste EXP to load level and experience.";
  expImportStatus.style.color = "";
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
  currentAscensionExperience = 0;
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
  const expPayload = Math.max(0, Math.trunc(Number(profileExperience.value) || experienceForLevel(levelPayload)));

  const record = {
    id: "",
    ...currentRecord,
    race: racePayload,
    profession: professionPayload,
    level: levelPayload,
    experience: expPayload,
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

function sanitizeFilenamePart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "profile";
}

function buildExportProfileRecord() {
  const parsedInfoStart = parseInfoStartBlock(infoImport.value);
  const parsedInfo = parsedInfoStart && !parsedInfoStart.error ? parsedInfoStart : parseInfoBlock(infoImport.value);
  const baseName = profileName.value.trim() || parsedInfo?.name || "Profile";
  const currentRecord = buildCurrentProfileRecord(baseName);

  const racePayload = parsedInfo ? parsedInfo.race : races.find((race) => race.key === profileRace.value)?.name || "Human";
  const professionPayload = parsedInfoStart?.profession || profileProfession.value;
  const levelPayload = clamp(Number(profileLevel.value), 0, 100);
  const expPayload = Math.max(0, Math.trunc(Number(profileExperience.value) || experienceForLevel(levelPayload)));

  const selectedId = profileSelect.value || "";
  const existingByName = profiles.find((entry) => entry.name.toLowerCase() === baseName.toLowerCase());
  const idPayload = selectedId || existingByName?.id || "";

  return {
    id: idPayload,
    ...currentRecord,
    race: racePayload,
    profession: professionPayload,
    level: levelPayload,
    experience: expPayload,
    ascensionExperience: Math.max(0, Math.trunc(Number(currentAscensionExperience) || 0)),
    ascensionMilestones: clamp(Math.trunc(Number(currentAscensionMilestones) || 0), 0, 10),
    level0Stats: parsedInfoStart?.level0Stats || currentLevel0Stats,
  };
}

function downloadProfileJson() {
  const record = buildExportProfileRecord();
  const json = JSON.stringify(record, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const namePart = sanitizeFilenamePart(record.name);
  const stamp = new Date().toISOString().slice(0, 10);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${namePart}-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  if (importStatus) {
    importStatus.textContent = `Downloaded profile JSON: ${record.name}`;
    importStatus.style.color = "#1f4e42";
  }
}

saveProfileButtons.forEach((button) => {
  button.addEventListener("click", handleProfileSave);
});

profileExportJson?.addEventListener("click", downloadProfileJson);

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

expImport.addEventListener("input", () => {
  const parsed = parseExpBlock(expImport.value);
  if (!parsed) {
    expImportStatus.textContent = "Paste EXP to load level and experience.";
    expImportStatus.style.color = "";
    return;
  }
  syncingLevelExperience = true;
  profileExperience.value = String(parsed.experience);
  profileLevel.value = String(parsed.level);
  syncingLevelExperience = false;
  currentAscensionExperience = parsed.ascensionExperience;
  if (profileAscensionExperience) profileAscensionExperience.value = String(currentAscensionExperience);
  expImportStatus.textContent = `Parsed EXP: level ${parsed.level}, experience ${parsed.experience}, asc exp ${parsed.ascensionExperience}.`;
  expImportStatus.style.color = "";
  if (currentLevel0Stats) recalcFromLevel0();
  else renderSkillsTable(currentSkills);
});

profileAscensionExperience?.addEventListener("input", () => {
  const value = Math.max(0, Math.trunc(Number(profileAscensionExperience.value) || 0));
  profileAscensionExperience.value = String(value);
  currentAscensionExperience = value;
  updateDerivedDisplays();
});

profileAscensionMilestones?.addEventListener("input", () => {
  const value = clamp(Math.trunc(Number(profileAscensionMilestones.value) || 0), 0, 10);
  profileAscensionMilestones.value = String(value);
  currentAscensionMilestones = value;
  updateDerivedDisplays();
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
    syncingLevelExperience = true;
    profileLevel.value = String(level);
    setExperienceFromLevel(level);
    syncingLevelExperience = false;
    if (currentLevel0Stats) recalcFromLevel0();
  }
});

armorAsgSelect.addEventListener("change", updateArmorWeight);

profileLevel.addEventListener("input", () => {
  const level = clamp(Number(profileLevel.value), 0, 100);
  if (!syncingLevelExperience) {
    syncingLevelExperience = true;
    profileLevel.value = String(level);
    setExperienceFromLevel(level);
    syncingLevelExperience = false;
  }
  if (currentLevel0Stats) {
    recalcFromLevel0();
    return;
  }
  renderSkillsTable(currentSkills);
});

profileExperience.addEventListener("input", () => {
  if (syncingLevelExperience) return;
  const experience = Math.max(0, Math.trunc(Number(profileExperience.value) || 0));
  const derivedLevel = levelFromExperience(experience);
  syncingLevelExperience = true;
  profileExperience.value = String(experience);
  profileLevel.value = String(derivedLevel);
  syncingLevelExperience = false;
  if (currentLevel0Stats) {
    recalcFromLevel0();
    return;
  }
  renderSkillsTable(currentSkills);
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
