const profileSelect = document.getElementById("profileSelect");
const profileApply = document.getElementById("profileApply");
const profileSave = document.getElementById("profileSave");
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
const ascMilestonesImport = document.getElementById("ascMilestonesImport");
const ascMilestonesImportStatus = document.getElementById("ascMilestonesImportStatus");
const enhanciveListImport = document.getElementById("enhanciveListImport");
const enhanciveTotalsImport = document.getElementById("enhanciveTotalsImport");
const enhanciveDetailsImport = document.getElementById("enhanciveDetailsImport");
const enhanciveListImportStatus = document.getElementById("enhanciveListImportStatus");
const enhanciveTotalsImportStatus = document.getElementById("enhanciveTotalsImportStatus");
const enhanciveDetailsImportStatus = document.getElementById("enhanciveDetailsImportStatus");
const ascShowTrainedOnly = document.getElementById("ascShowTrainedOnly");
const skillsTable = document.getElementById("skillsTable");
const tpExpPtp = document.getElementById("tpExpPtp");
const tpExpMtp = document.getElementById("tpExpMtp");
const tpSpentPtp = document.getElementById("tpSpentPtp");
const tpSpentMtp = document.getElementById("tpSpentMtp");
const tpLeftPtp = document.getElementById("tpLeftPtp");
const tpLeftMtp = document.getElementById("tpLeftMtp");
const tpConvertedPhyToMnt = document.getElementById("tpConvertedPhyToMnt");
const tpConvertedMntToPhy = document.getElementById("tpConvertedMntToPhy");
const tpShortfallRow = document.getElementById("tpShortfallRow");
const tpShortfallPtp = document.getElementById("tpShortfallPtp");
const tpShortfallMtp = document.getElementById("tpShortfallMtp");
const ascAbilityGroups = document.getElementById("ascAbilityGroups");
const ascStatus = document.getElementById("ascStatus");
const enhStatTable = document.getElementById("enhStatTable");
const enhSkillTable = document.getElementById("enhSkillTable");
const enhStatus = document.getElementById("enhStatus");
const enhImportedSummary = document.getElementById("enhImportedSummary");
const enhImportedItemsTable = document.getElementById("enhImportedItemsTable");
const enhImportedUnresolvedTable = document.getElementById("enhImportedUnresolvedTable");
const enhManualResolutionTable = document.getElementById("enhManualResolutionTable");
const addManualEnhItem = document.getElementById("addManualEnhItem");
const quickStartSection = document.getElementById("quickStartSection");
const ascensionSection = document.getElementById("ascensionSection");
const enhanciveSection = document.getElementById("enhanciveSection");
const runProfileTestsBtn = document.getElementById("runProfileTests");
const profileTestOutputEl = document.getElementById("profileTestOutput");
const saveProfileButtons = Array.from(document.querySelectorAll(".save-profile-btn"));
const reloadProfileButtons = Array.from(document.querySelectorAll(".profile-reload-btn"));

const armorAsgSelect = document.getElementById("armorAsg");
const armorWeightInput = document.getElementById("armorWeight");
const useCustomArmorBaseInput = document.getElementById("useCustomArmorBase");
const armorBaseWeightInput = document.getElementById("armorBaseWeight");
const armorBaseDetails = useCustomArmorBaseInput?.closest("details") || null;
const accessoryWeightInput = document.getElementById("accessoryWeight");
const gearWeightInput = document.getElementById("gearWeight");
const silversInput = document.getElementById("silvers");

const PROFILE_KEY = "gs4.characterProfiles";
const SELECTED_PROFILE_KEY = "gs4.selectedProfileId";

const dataSource = globalThis.GS4_DATA;
const logic = globalThis.ProfileLogic;
const enhanciveImport = globalThis.EnhanciveImport;

if (!dataSource) throw new Error("GS4_DATA is not loaded. Ensure data/gs4-data.js is loaded before profile.js.");
if (!logic) throw new Error("ProfileLogic is not loaded. Ensure profile-logic.js is loaded before profile.js.");
if (!enhanciveImport) throw new Error("EnhanciveImport is not loaded. Ensure enhancive-import.js is loaded before profile.js.");

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

const defaultAscensionAbilityCatalog = [
  ["Acid Resistance", "resistacid", 40, "Resist"],
  ["Agility", "agility", 40, "Stat"],
  ["Ambush", "ambush", 50, "Skill"],
  ["Arcane Symbols", "arcanesymbols", 50, "Skill"],
  ["Armor Use", "armoruse", 50, "Skill"],
  ["Aura", "aura", 40, "Stat"],
  ["Blunt Weapons", "bluntweapons", 50, "Skill"],
  ["Brawling", "brawling", 50, "Skill"],
  ["Climbing", "climbing", 50, "Skill"],
  ["Cold Resistance", "resistcold", 40, "Resist"],
  ["Combat Maneuvers", "combatmaneuvers", 50, "Skill"],
  ["Constitution", "constitution", 40, "Stat"],
  ["Crush Resistance", "resistcrush", 40, "Resist"],
  ["Dexterity", "dexterity", 40, "Stat"],
  ["Disarming Traps", "disarmingtraps", 50, "Skill"],
  ["Discipline", "discipline", 40, "Stat"],
  ["Disintegration Resistance", "resistdisintegr", 40, "Resist"],
  ["Disruption Resistance", "resistdisruptio", 40, "Resist"],
  ["Dodging", "dodging", 50, "Skill"],
  ["Edged Weapons", "edgedweapons", 50, "Skill"],
  ["Electric Resistance", "resistelectric", 40, "Resist"],
  ["Elemental Lore - Air", "elair", 50, "Skill"],
  ["Elemental Lore - Earth", "elearth", 50, "Skill"],
  ["Elemental Lore - Fire", "elfire", 50, "Skill"],
  ["Elemental Lore - Water", "elwater", 50, "Skill"],
  ["Elemental Mana Control", "elementalmc", 50, "Skill"],
  ["First Aid", "firstaid", 50, "Skill"],
  ["Grapple Resistance", "resistgrapple", 40, "Resist"],
  ["Harness Power", "harnesspower", 50, "Skill"],
  ["Health Regeneration", "regenhealth", 50, "Regen"],
  ["Heat Resistance", "resistheat", 40, "Resist"],
  ["Impact Resistance", "resistimpact", 40, "Resist"],
  ["Influence", "influence", 40, "Stat"],
  ["Intuition", "intuition", 40, "Stat"],
  ["Logic", "logic", 40, "Stat"],
  ["Magic Item Use", "magicitemuse", 50, "Skill"],
  ["Mana Regeneration", "regenmana", 50, "Regen"],
  ["Mental Lore - Divination", "mldivination", 50, "Skill"],
  ["Mental Lore - Manipulation", "mlmanipulation", 50, "Skill"],
  ["Mental Lore - Telepathy", "mltelepathy", 50, "Skill"],
  ["Mental Lore - Transference", "mltransference", 50, "Skill"],
  ["Mental Lore - Transformation", "mltransform", 50, "Skill"],
  ["Mental Mana Control", "mentalmc", 50, "Skill"],
  ["Multi Opponent Combat", "multiopponent", 50, "Skill"],
  ["Perception", "perception", 50, "Skill"],
  ["Physical Fitness", "physicalfitness", 50, "Skill"],
  ["Picking Locks", "pickinglocks", 50, "Skill"],
  ["Picking Pockets", "pickingpockets", 50, "Skill"],
  ["Plasma Resistance", "resistplasma", 40, "Resist"],
  ["Polearm Weapons", "polearmsweapons", 50, "Skill"],
  ["Porter", "porter", 50, "Other"],
  ["Puncture Resistance", "resistpuncture", 40, "Resist"],
  ["Ranged Weapons", "rangedweapons", 50, "Skill"],
  ["Shield Use", "shielduse", 50, "Skill"],
  ["Slash Resistance", "resistslash", 40, "Resist"],
  ["Sorcerous Lore - Demonology", "soldemonology", 50, "Skill"],
  ["Sorcerous Lore - Necromancy", "solnecromancy", 50, "Skill"],
  ["Spell Aiming", "spellaiming", 50, "Skill"],
  ["Spirit Mana Control", "spiritmc", 50, "Skill"],
  ["Spiritual Lore - Blessings", "slblessings", 50, "Skill"],
  ["Spiritual Lore - Religion", "slreligion", 50, "Skill"],
  ["Spiritual Lore - Summoning", "slsummoning", 50, "Skill"],
  ["Stalking and Hiding", "stalking", 50, "Skill"],
  ["Stamina Regeneration", "regenstamina", 50, "Regen"],
  ["Steam Resistance", "resiststeam", 40, "Resist"],
  ["Strength", "strength", 40, "Stat"],
  ["Survival", "survival", 50, "Skill"],
  ["Swimming", "swimming", 50, "Skill"],
  ["Thrown Weapons", "thrownweapons", 50, "Skill"],
  ["Trading", "trading", 50, "Skill"],
  ["Transcend Destiny", "trandest", 10, "Other"],
  ["Two Weapon Combat", "twoweaponcombat", 50, "Skill"],
  ["Two-Handed Weapons", "twohandedweapon", 50, "Skill"],
  ["Unbalance Resistance", "resistunbalance", 40, "Resist"],
  ["Vacuum Resistance", "resistvacuum", 40, "Resist"],
  ["Wisdom", "wisdom", 40, "Stat"],
].map(([name, mnemonic, cap, subcategory]) => ({
  name,
  mnemonic,
  cap,
  subcategory,
  category: mnemonic === "trandest" ? "Elite" : "Common",
}));

let currentSkills = skillCatalog.map((name) => ({ name, ranks: 0 }));
let currentLevel0Stats = null;
let currentBaseStats = {};
let currentAscensionExperience = 0;
let currentAscensionMilestones = 0;
let currentAscensionAbilities = [];
let currentBadgeDefaults = {
  lifetimeBp: 0,
  components: [0, 0, 0, 0, 0],
  boosts: [{ id: 1, value: 0 }, { id: 22, value: 0 }, { id: 87, value: 0 }],
};
let ascensionState = { stats: {}, skills: {} };
let enhanciveState = { stats: {}, skills: {} };
let currentEnhanciveEquipment = enhanciveImport.defaultEnhanciveEquipmentState();
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

const ENHANCIVE_TYPE_OPTIONS = [
  { value: "stat", label: "Stat +" },
  { value: "stat_bonus", label: "Stat Bonus +" },
  { value: "skill_rank", label: "Skill Rank +" },
  { value: "skill_bonus", label: "Skill Bonus +" },
  { value: "resource", label: "Resource" },
];

function normalizeEnhanciveTargetLabel(label) {
  return String(label || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildEnhanciveTargetOptions(effectType) {
  if (effectType === "stat" || effectType === "stat_bonus") {
    return stats.map((stat) => ({ value: stat.key, label: stat.name }));
  }
  if (effectType === "skill_rank" || effectType === "skill_bonus") {
    return skillCatalog.map((name) => ({ value: skillKey(name), label: name }));
  }
  return [
    { value: "max_mana", label: "Max Mana" },
    { value: "max_stamina", label: "Max Stamina" },
    { value: "spirit", label: "Spirit" },
    { value: "health_recovery", label: "Health Recovery" },
    { value: "mana_recovery", label: "Mana Recovery" },
    { value: "stamina_recovery", label: "Stamina Recovery" },
  ];
}

function guessEnhanciveEffectType(category, label) {
  const normalizedCategory = String(category || "").trim().toLowerCase();
  const normalizedLabel = normalizeEnhanciveTargetLabel(label);
  const stat = stats.find((entry) => entry.name.toLowerCase() === normalizedLabel.toLowerCase());
  if (normalizedCategory === "stats" || stat) return "stat";
  if (normalizedCategory === "skills") return "skill_bonus";
  if (normalizedCategory === "resources") return "resource";
  return "unknown";
}

function guessEnhanciveTarget(effectType, label) {
  const normalizedLabel = normalizeEnhanciveTargetLabel(label);
  if (effectType === "stat" || effectType === "stat_bonus") {
    const stat = stats.find((entry) => (
      entry.name.toLowerCase() === normalizedLabel.toLowerCase()
      || entry.abbr.toLowerCase() === normalizedLabel.toLowerCase()
    ));
    return stat?.key || "";
  }
  if (effectType === "skill_rank" || effectType === "skill_bonus") {
    const canonical = canonicalSkillName(normalizedLabel);
    return canonical ? skillKey(canonical) : "";
  }
  if (effectType === "resource") {
    const labelKey = normalizedLabel.toLowerCase();
    if (labelKey === "max mana") return "max_mana";
    if (labelKey === "max stamina") return "max_stamina";
    if (labelKey === "spirit") return "spirit";
    if (labelKey === "health recovery") return "health_recovery";
    if (labelKey === "mana recovery") return "mana_recovery";
    if (labelKey === "stamina recovery") return "stamina_recovery";
  }
  return "";
}

function effectDisplayType(effect) {
  const type = String(effect?.type || "");
  if (type === "stat") return "Stat +";
  if (type === "stat_bonus") return "Stat Bonus +";
  if (type === "skill_rank") return "Skill Rank +";
  if (type === "skill_bonus") return "Skill Bonus +";
  if (type === "resource") return "Resource";
  return "Unknown";
}

function effectDisplayTarget(effect) {
  const type = String(effect?.type || "");
  const target = String(effect?.target || "");
  if (type === "stat" || type === "stat_bonus") {
    return stats.find((entry) => entry.key === target)?.name || effect?.label || target;
  }
  if (type === "skill_rank" || type === "skill_bonus") {
    return skillCatalog.find((name) => skillKey(name) === target) || effect?.label || target;
  }
  return effect?.label || target || "Unknown";
}

function normalizeEnhanciveEffectForUse(effect) {
  const guessedType = guessEnhanciveEffectType(effect?.category, effect?.label || effect?.target);
  const type = effect?.type && effect.type !== "unknown" ? effect.type : guessedType;
  const target = effect?.target && effect.target !== effect?.label
    ? effect.target
    : guessEnhanciveTarget(type, effect?.label || effect?.target);
  return {
    ...effect,
    type,
    target,
    label: effect?.label || effect?.target || "",
    value: Math.max(0, Math.trunc(Number(effect?.value) || 0)),
    limit: Math.max(0, Math.trunc(Number(effect?.limit) || 0)),
  };
}

function hasConfiguredBadgeData() {
  const badge = normalizeBadgeDefaults(currentBadgeDefaults);
  return (badge.lifetimeBp || 0) > 0
    || badge.components.some((value) => Number(value) > 0)
    || badge.boosts.some((boost) => Number(boost?.value) > 0);
}

function shouldSkipImportedItemForDedupe(item) {
  if (!hasConfiguredBadgeData()) return false;
  return /badge/i.test(String(item?.name || ""));
}

function getActiveEnhanciveEquipmentItems() {
  const state = enhanciveImport.normalizeEnhanciveEquipmentState(currentEnhanciveEquipment);
  const importedItems = state.enhancivesEnabled
    ? state.importedSnapshot.items.filter((item) => item.active !== false && !shouldSkipImportedItemForDedupe(item))
    : [];
  const manualItems = state.manualResolutions.items.filter((item) => item.active !== false);
  return importedItems.concat(manualItems);
}

function getEquipmentEnhanciveTotals() {
  const totals = {
    stats: defaultStatMap(0),
    skillRanks: {},
    skillBonuses: {},
    resources: {},
  };

  skillCatalog.forEach((name) => {
    const key = skillKey(name);
    totals.skillRanks[key] = 0;
    totals.skillBonuses[key] = 0;
  });

  getActiveEnhanciveEquipmentItems().forEach((item) => {
    item.effects.forEach((rawEffect) => {
      const effect = normalizeEnhanciveEffectForUse(rawEffect);
      if (!effect.type || !effect.target || effect.value <= 0) return;
      if (effect.type === "stat") {
        if (totals.stats[effect.target] != null) totals.stats[effect.target] += effect.value;
      } else if (effect.type === "skill_rank") {
        if (totals.skillRanks[effect.target] != null) totals.skillRanks[effect.target] += effect.value;
      } else if (effect.type === "skill_bonus") {
        if (totals.skillBonuses[effect.target] != null) totals.skillBonuses[effect.target] += effect.value;
      } else if (effect.type === "resource") {
        totals.resources[effect.target] = (totals.resources[effect.target] || 0) + effect.value;
      }
    });
  });

  return totals;
}

function getEffectiveSkillEnhancive(skillKeyName) {
  const equipmentTotals = getEquipmentEnhanciveTotals();
  return {
    rank: Math.max(0, Math.trunc(Number(enhanciveState.skills?.[skillKeyName]?.rank) || 0))
      + Math.max(0, Math.trunc(Number(equipmentTotals.skillRanks?.[skillKeyName]) || 0)),
    bonus: Math.max(0, Math.trunc(Number(enhanciveState.skills?.[skillKeyName]?.bonus) || 0))
      + Math.max(0, Math.trunc(Number(equipmentTotals.skillBonuses?.[skillKeyName]) || 0)),
  };
}

function updateEnhanciveImportStatusMessages() {
  if (enhanciveListImportStatus) {
    const count = currentEnhanciveEquipment.importedSnapshot?.summary?.itemCount || 0;
    enhanciveListImportStatus.textContent = enhanciveListImport.value.trim()
      ? `Loaded enhancive item list: ${count} item(s).`
      : "Paste INV ENHANCIVE LIST to load worn enhancive item names.";
    enhanciveListImportStatus.style.color = "";
  }
  if (enhanciveTotalsImportStatus) {
    enhanciveTotalsImportStatus.textContent = enhanciveTotalsImport.value.trim()
      ? "Stored INV ENHANCIVE TOTALS as raw fallback text."
      : "Optional fallback aggregate block.";
    enhanciveTotalsImportStatus.style.color = "";
  }
  if (enhanciveDetailsImportStatus) {
    const knownItems = currentEnhanciveEquipment.importedSnapshot?.items?.filter((item) => item.effects?.length).length || 0;
    const unresolved = currentEnhanciveEquipment.importedSnapshot?.unresolved?.length || 0;
    enhanciveDetailsImportStatus.textContent = enhanciveDetailsImport.value.trim()
      ? `Loaded enhancive details: ${knownItems} known item source(s), ${unresolved} unresolved effect(s).`
      : "Paste INV ENHANCIVE TOTALS DETAILS to load active enhancive contributions.";
    enhanciveDetailsImportStatus.style.color = "";
  }
}

function rebuildImportedEnhanciveState(options = {}) {
  const { preserveManual = true, importedAt = currentEnhanciveEquipment.lastImportedAt || new Date().toISOString() } = options;
  const merged = enhanciveImport.mergeImportedEnhanciveSnapshot(
    enhanciveListImport?.value || "",
    enhanciveTotalsImport?.value || "",
    enhanciveDetailsImport?.value || "",
    importedAt,
  );
  const prior = enhanciveImport.normalizeEnhanciveEquipmentState(currentEnhanciveEquipment);
  currentEnhanciveEquipment = enhanciveImport.normalizeEnhanciveEquipmentState({
    ...merged,
    manualResolutions: preserveManual ? prior.manualResolutions : merged.manualResolutions,
    enhancivesEnabled: prior.enhancivesEnabled,
  });
  updateEnhanciveImportStatusMessages();
}

function createManualEnhanciveItem(partial = {}) {
  const guessedType = partial.type && partial.type !== "unknown"
    ? partial.type
    : guessEnhanciveEffectType(partial.category, partial.label || partial.target);
  const guessedTarget = partial.target || guessEnhanciveTarget(guessedType, partial.label || partial.target);
  return {
    id: `manual-enh-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    name: String(partial.name || "Manual Enhancive").trim(),
    worn: true,
    active: partial.active !== false,
    source: "manual",
    effects: [{
      category: String(partial.category || "").trim(),
      type: guessedType,
      target: guessedTarget,
      label: String(partial.label || partial.target || guessedTarget || "Unknown").trim(),
      value: Math.max(0, Math.trunc(Number(partial.value) || 0)),
      limit: Math.max(0, Math.trunc(Number(partial.limit) || 0)),
      knownSource: true,
    }],
  };
}

function getSelectedRaceName() {
  return races.find((race) => race.key === profileRace.value)?.name || "Human";
}

function stripMarkupTags(value) {
  return String(value || "").replace(/<[^>]+>/g, "").trim();
}

function normalizeProfileNameForMatch(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parseInfoBlock(text) {
  const nameMatch = text.match(/Name:\s*([^\n]+?)\s+Race:\s*([A-Za-z -]+?)(?:\s+Profession:|$)/i);
  if (!nameMatch) return null;

  const result = {
    name: stripMarkupTags(nameMatch[1].trim().split(/\s{2,}/)[0]),
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
    name = stripMarkupTags(headerMatch[1].trim());
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
    const trimmed = stripMarkupTags(line).replace(/\s+/g, " ").trim();
    if (!trimmed) return;
    if (/^Skill\s+Mnemonic/i.test(trimmed)) return;
    if (/^[-]{5,}/.test(trimmed)) return;
    const match = trimmed.match(/^(.*?)\s+([a-z][a-z0-9-]*)\s+(\d+)\s*\/\s*(40|50|10)\s+(.*)$/i);
    if (!match) return;
    const name = match[1].trim().replace(/\s{2,}/g, " ");
    const right = match[5].trim();
    const typeParts = right.split(/\s{2,}|\t+/).filter(Boolean);
    const category = (typeParts[1] || "Common").trim();
    const subcategory = (typeParts[2] || typeParts[typeParts.length - 1] || "Skill").trim();

    if (!name) return;
    results.push({
      name,
      mnemonic: match[2].toLowerCase(),
      ranks: Number(match[3]),
      cap: Number(match[4]),
      category,
      subcategory,
    });
  });

  return results;
}

function buildDefaultAscensionAbilities() {
  return defaultAscensionAbilityCatalog.map((entry) => ({
    name: entry.name,
    mnemonic: entry.mnemonic,
    cap: entry.cap,
    category: entry.category || "Common",
    subcategory: entry.subcategory || "Skill",
    ranks: 0,
  }));
}

function normalizeAscensionAbilities(entries) {
  const byMnemonic = new Map();
  buildDefaultAscensionAbilities().forEach((entry) => {
    byMnemonic.set(entry.mnemonic, { ...entry });
  });

  (entries || []).forEach((entry) => {
    const mnemonic = String(entry?.mnemonic || "").trim().toLowerCase();
    if (!mnemonic) return;
    const existing = byMnemonic.get(mnemonic);
    const cap = Math.max(0, Math.trunc(Number(entry?.cap ?? existing?.cap ?? 50) || 50));
    const ranks = clamp(Math.trunc(Number(entry?.ranks ?? existing?.ranks ?? 0) || 0), 0, cap);
    byMnemonic.set(mnemonic, {
      name: String(entry?.name || existing?.name || mnemonic).trim() || mnemonic,
      mnemonic,
      cap,
      category: String(entry?.category || existing?.category || "Common"),
      subcategory: String(entry?.subcategory || existing?.subcategory || "Skill"),
      ranks,
    });
  });

  const groupOrder = { stat: 0, skill: 1, resist: 2, regen: 3, other: 4 };
  const groupIndex = (ability) => {
    const raw = String(ability?.subcategory || "").toLowerCase();
    if (raw.includes("stat")) return groupOrder.stat;
    if (raw.includes("skill")) return groupOrder.skill;
    if (raw.includes("resist")) return groupOrder.resist;
    if (raw.includes("regen")) return groupOrder.regen;
    return groupOrder.other;
  };

  return Array.from(byMnemonic.values()).sort((a, b) => {
    const groupDiff = groupIndex(a) - groupIndex(b);
    if (groupDiff !== 0) return groupDiff;
    return a.name.localeCompare(b.name);
  });
}

function normalizeBadgeDefaults(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const components = Array.isArray(source.components)
    ? source.components.slice(0, 5).map((value) => clamp(Math.trunc(Number(value) || 0), 0, 10))
    : [0, 0, 0, 0, 0];
  while (components.length < 5) components.push(0);

  const fallbackBoosts = [{ id: 1, value: 0 }, { id: 22, value: 0 }, { id: 87, value: 0 }];
  const boosts = Array.isArray(source.boosts)
    ? source.boosts.slice(0, 3).map((entry, index) => {
      const fallback = fallbackBoosts[index] || fallbackBoosts[0];
      return {
        id: Math.max(1, Math.trunc(Number(entry?.id) || fallback.id)),
        value: Math.max(0, Math.trunc(Number(entry?.value) || 0)),
      };
    })
    : fallbackBoosts.map((entry) => ({ ...entry }));
  while (boosts.length < 3) boosts.push({ ...fallbackBoosts[boosts.length] });

  return {
    lifetimeBp: Math.max(0, Math.trunc(Number(source.lifetimeBp) || 0)),
    components,
    boosts,
  };
}

function resolveStatKeyFromAscName(name) {
  const raw = String(name || "").trim().toLowerCase();
  if (!raw) return null;
  const direct = stats.find((stat) => stat.key === raw);
  if (direct) return direct.key;
  const byAbbr = stats.find((stat) => stat.abbr.toLowerCase() === raw);
  if (byAbbr) return byAbbr.key;
  const byLabel = stats.find((stat) => stat.label.toLowerCase() === raw);
  if (byLabel) return byLabel.key;
  return null;
}

function getAscensionDisplayGroup(ability) {
  const mnemonic = String(ability?.mnemonic || "").toLowerCase();
  if (mnemonic === "porter" || mnemonic === "trandest") return "other";
  const raw = String(ability?.subcategory || "").toLowerCase();
  if (raw.includes("stat")) return "stat";
  if (raw.includes("skill")) return "skill";
  if (raw.includes("resist")) return "resist";
  if (raw.includes("regen")) return "regen";
  return "other";
}

function ascensionRankCost(ability, rankOrdinal) {
  const ordinal = Math.max(1, Math.trunc(Number(rankOrdinal) || 1));
  if (ability?.mnemonic === "trandest") {
    return ordinal <= 5 ? ordinal * 10 : 50;
  }
  return Math.ceil(ordinal / 5);
}

function ascensionPointsForRanks(ranks, ability = null) {
  const capped = Math.max(0, Math.trunc(Number(ranks) || 0));
  let total = 0;
  for (let rank = 1; rank <= capped; rank += 1) {
    total += ascensionRankCost(ability, rank);
  }
  return total;
}

function calculateAscensionPointsUsed(abilities = currentAscensionAbilities) {
  return (abilities || []).reduce((sum, ability) => sum + ascensionPointsForRanks(ability.ranks, ability), 0);
}

function totalAscensionPointsAvailable() {
  return estimateTotalAscensionPoints(currentAscensionExperience, currentAscensionMilestones).totalAtp;
}

function getAscensionAbilityContext(abilities = currentAscensionAbilities) {
  const byMnemonic = new Map((abilities || []).map((ability) => [ability.mnemonic, ability]));
  const commonAtpSpent = (abilities || []).reduce((sum, ability) => {
    if (ability.mnemonic === "trandest") return sum;
    if (String(ability.category || "").toLowerCase() !== "common") return sum;
    return sum + ascensionPointsForRanks(ability.ranks, ability);
  }, 0);
  const strengthRanks = Math.max(0, Math.trunc(Number(byMnemonic.get("strength")?.ranks) || 0));
  const physicalFitnessRanks = Math.max(0, Math.trunc(Number(byMnemonic.get("physicalfitness")?.ranks) || 0));
  return { byMnemonic, commonAtpSpent, strengthRanks, physicalFitnessRanks };
}

function getAscensionAbilityGate(ability, abilities = currentAscensionAbilities) {
  if (!ability) return { allowed: true, reason: "" };
  const context = getAscensionAbilityContext(abilities);
  if (ability.mnemonic === "trandest" && context.commonAtpSpent < 150) {
    return { allowed: false, reason: "Requires 150 ATP spent in Common abilities." };
  }
  if (ability.mnemonic === "porter" && (context.strengthRanks + context.physicalFitnessRanks) < 10) {
    return { allowed: false, reason: "Requires 10 combined ranks in Strength + Physical Fitness." };
  }
  return { allowed: true, reason: "" };
}

function getMaxAllowedAscensionRanks(ability, abilities = currentAscensionAbilities) {
  const gate = getAscensionAbilityGate(ability, abilities);
  if (gate.allowed) return ability.cap;
  return Math.max(0, Math.trunc(Number(ability.ranks) || 0));
}

function getNextAscensionCostDisplay(ability, abilities = currentAscensionAbilities) {
  const ranks = Math.max(0, Math.trunc(Number(ability?.ranks) || 0));
  const cap = Math.max(0, Math.trunc(Number(ability?.cap) || 0));
  if (ranks >= cap) return { display: "—", gateReason: "" };
  const gate = getAscensionAbilityGate(ability, abilities);
  if (!gate.allowed) return { display: "Locked", gateReason: gate.reason };
  const nextCost = ascensionRankCost(ability, ranks + 1);
  return { display: String(nextCost), gateReason: "" };
}

function enforceAscensionPointBudget() {
  const available = totalAscensionPointsAvailable();
  let used = calculateAscensionPointsUsed();
  if (used <= available) return;
  const sorted = [...currentAscensionAbilities].sort((a, b) => b.ranks - a.ranks);
  sorted.forEach((ability) => {
    while (ability.ranks > 0 && used > available) {
      ability.ranks -= 1;
      ability.ranks = Math.min(ability.ranks, getMaxAllowedAscensionRanks(ability));
      used = calculateAscensionPointsUsed(currentAscensionAbilities);
    }
  });
}

function syncAscensionStateFromAbilities() {
  stats.forEach((stat) => {
    if (!ascensionState.stats[stat.key]) ascensionState.stats[stat.key] = { stat: 0, bonus: 0 };
    ascensionState.stats[stat.key].stat = 0;
  });
  currentSkills.forEach((skill) => {
    const key = skillKey(skill.name);
    if (!ascensionState.skills[key]) ascensionState.skills[key] = { bonus: 0 };
    ascensionState.skills[key].bonus = 0;
  });

  currentAscensionAbilities.forEach((ability) => {
    const mapped = ascMnemonicMap[ability.mnemonic] || "";
    if (!mapped) return;
    const statKey = resolveStatKeyFromAscName(mapped);
    if (statKey) {
      if (!ascensionState.stats[statKey]) ascensionState.stats[statKey] = { stat: 0, bonus: 0 };
      ascensionState.stats[statKey].stat = ability.ranks;
      return;
    }
    const canonical = canonicalSkillName(mapped);
    const key = skillKey(canonical);
    if (!key) return;
    if (!ascensionState.skills[key]) ascensionState.skills[key] = { bonus: 0 };
    ascensionState.skills[key].bonus = ability.ranks;
  });
}

function populateAbilitiesFromAscensionState() {
  const next = normalizeAscensionAbilities(currentAscensionAbilities);
  next.forEach((ability) => {
    const mapped = ascMnemonicMap[ability.mnemonic] || "";
    if (!mapped) return;
    const statKey = resolveStatKeyFromAscName(mapped);
    if (statKey) {
      ability.ranks = clamp(Math.trunc(Number(ascensionState.stats?.[statKey]?.stat) || 0), 0, ability.cap);
      return;
    }
    const canonical = canonicalSkillName(mapped);
    const key = skillKey(canonical);
    ability.ranks = clamp(Math.trunc(Number(ascensionState.skills?.[key]?.bonus) || 0), 0, ability.cap);
  });
  currentAscensionAbilities = next;
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

function parseAscMilestonesBlock(text) {
  const source = String(text || "");
  if (!/Ascension Milestones are as follows:/i.test(source)) return null;
  const lines = source.split(/\r?\n/);
  let reached = 0;
  lines.forEach((line) => {
    const m = line.match(/^\s*\d+\.\s+.*\s+(Yes|No)\s*$/i);
    if (m && m[1].toLowerCase() === "yes") reached += 1;
  });
  return clamp(reached, 0, 10);
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
  if (!tpExpPtp || !tpExpMtp || !tpSpentPtp || !tpSpentMtp || !tpLeftPtp || !tpLeftMtp) return;
  const profession = profileProfession.value;
  if (!profession) {
    tpExpPtp.textContent = "—";
    tpExpMtp.textContent = "—";
    tpSpentPtp.textContent = "—";
    tpSpentMtp.textContent = "—";
    tpLeftPtp.textContent = "—";
    tpLeftMtp.textContent = "—";
    if (tpConvertedPhyToMnt) tpConvertedPhyToMnt.textContent = "—";
    if (tpConvertedMntToPhy) tpConvertedMntToPhy.textContent = "—";
    if (tpShortfallRow) tpShortfallRow.hidden = true;
    return;
  }
  const experience = Math.max(0, Math.trunc(Number(profileExperience.value) || 0));
  const level = clamp(Number(profileLevel.value), 0, 100);
  const totalTp = estimateTotalTrainingPointsFromExperience(experience, profession);
  const spentTp = estimateSpentTrainingPointsFromRanks(currentSkills, profession, level);
  const conversion = summarizeTrainingPointConversion(totalTp, spentTp);

  tpExpPtp.textContent = String(totalTp.ptp);
  tpExpMtp.textContent = String(totalTp.mtp);
  tpSpentPtp.textContent = String(spentTp.ptp);
  tpSpentMtp.textContent = String(spentTp.mtp);
  tpLeftPtp.textContent = String(conversion.pointsLeftPtp);
  tpLeftMtp.textContent = String(conversion.pointsLeftMtp);
  if (tpConvertedPhyToMnt) tpConvertedPhyToMnt.textContent = String(conversion.phyToMnt);
  if (tpConvertedMntToPhy) tpConvertedMntToPhy.textContent = String(conversion.mntToPhy);

  const hasShortfall = conversion.remainingDeficitPtp > 0 || conversion.remainingDeficitMtp > 0;
  if (tpShortfallRow) {
    tpShortfallRow.hidden = !hasShortfall;
    tpShortfallRow.style.color = hasShortfall ? "#b42318" : "";
  }
  if (tpShortfallPtp) tpShortfallPtp.textContent = String(conversion.remainingDeficitPtp);
  if (tpShortfallMtp) tpShortfallMtp.textContent = String(conversion.remainingDeficitMtp);
  if (tpLeftPtp) tpLeftPtp.style.color = hasShortfall ? "#b42318" : "";
  if (tpLeftMtp) tpLeftMtp.style.color = hasShortfall ? "#b42318" : "";
  if (tpSpentPtp) tpSpentPtp.style.color = hasShortfall ? "#b42318" : "";
  if (tpSpentMtp) tpSpentMtp.style.color = hasShortfall ? "#b42318" : "";
  if (tpExpPtp) tpExpPtp.style.color = "";
  if (tpExpMtp) tpExpMtp.style.color = "";
  if (tpConvertedPhyToMnt) tpConvertedPhyToMnt.style.color = "";
  if (tpConvertedMntToPhy) tpConvertedMntToPhy.style.color = "";
  if (!hasShortfall) {
    if (tpLeftPtp) tpLeftPtp.style.color = "";
    if (tpLeftMtp) tpLeftMtp.style.color = "";
    if (tpSpentPtp) tpSpentPtp.style.color = "";
    if (tpSpentMtp) tpSpentMtp.style.color = "";
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
  currentAscensionAbilities = normalizeAscensionAbilities(currentAscensionAbilities);
  syncAscensionStateFromAbilities();
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
  syncAscensionStateFromAbilities();
}

function getStatAdjustment(statKey) {
  const equipmentTotals = getEquipmentEnhanciveTotals();
  return {
    ascStat: Math.max(0, Math.trunc(Number(ascensionState.stats?.[statKey]?.stat) || 0)),
    ascBonus: Math.max(0, Math.trunc(Number(ascensionState.stats?.[statKey]?.bonus) || 0)),
    enhStat: Math.max(0, Math.trunc(Number(enhanciveState.stats?.[statKey]?.stat) || 0)) + Math.max(0, Math.trunc(Number(equipmentTotals.stats?.[statKey]) || 0)),
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

function enforceStatEnhanciveRowLimits(statKey, changedKind = null) {
  if (!enhanciveState.stats[statKey]) enhanciveState.stats[statKey] = { stat: 0, bonus: 0 };
  let enhStat = Math.max(0, Math.trunc(Number(enhanciveState.stats[statKey].stat) || 0));
  let enhBonus = Math.max(0, Math.trunc(Number(enhanciveState.stats[statKey].bonus) || 0));
  enhStat = Math.min(enhStat, 40);
  enhBonus = Math.min(enhBonus, 20);

  const statCapForBonus = Math.max(0, Math.min(40, (20 - enhBonus) * 2 + 1));
  const bonusCapForStat = Math.max(0, Math.min(20, 20 - Math.floor(enhStat / 2)));

  if (changedKind === "stat") {
    enhBonus = Math.min(enhBonus, bonusCapForStat);
  } else if (changedKind === "bonus") {
    enhStat = Math.min(enhStat, statCapForBonus);
  } else {
    enhStat = Math.min(enhStat, statCapForBonus);
    enhBonus = Math.min(enhBonus, Math.max(0, Math.min(20, 20 - Math.floor(enhStat / 2))));
  }

  enhanciveState.stats[statKey].stat = enhStat;
  enhanciveState.stats[statKey].bonus = enhBonus;
}

function enforceSkillEnhanciveRowLimits(skillKeyName, baseRanks, changedKind = null) {
  if (!enhanciveState.skills[skillKeyName]) enhanciveState.skills[skillKeyName] = { rank: 0, bonus: 0 };
  let enhRank = Math.max(0, Math.trunc(Number(enhanciveState.skills[skillKeyName].rank) || 0));
  let enhBonus = Math.max(0, Math.trunc(Number(enhanciveState.skills[skillKeyName].bonus) || 0));
  enhRank = Math.min(enhRank, 50);
  enhBonus = Math.min(enhBonus, 50);

  const rankGain = (rankValue) => skillBonusFromRanks(baseRanks + rankValue) - skillBonusFromRanks(baseRanks);
  const maxBonusForRank = (rankValue) => Math.max(0, Math.min(50, 50 - rankGain(rankValue)));

  if (changedKind === "rank") {
    enhBonus = Math.min(enhBonus, maxBonusForRank(enhRank));
  } else if (changedKind === "bonus") {
    while (enhRank > 0 && rankGain(enhRank) + enhBonus > 50) enhRank -= 1;
  } else {
    while (enhRank > 0 && rankGain(enhRank) + enhBonus > 50) enhRank -= 1;
    enhBonus = Math.min(enhBonus, maxBonusForRank(enhRank));
  }

  enhanciveState.skills[skillKeyName].rank = enhRank;
  enhanciveState.skills[skillKeyName].bonus = enhBonus;
}

function buildStatInputs() {
  statGrid.innerHTML = "";
  const headers = [
    { title: "Stat", field: "stat" },
    { title: "Level 0", field: "level0" },
    { title: "At Level 0", field: "base-stat" },
    { title: "Bonus", field: "base-bonus" },
    { title: "Final Stat", field: "final-stat" },
    { title: "Final Bonus", field: "final-bonus" },
  ];
  headers.forEach((headerMeta) => {
    const header = document.createElement("div");
    header.className = "stat-header";
    header.dataset.statHeader = headerMeta.field;
    header.textContent = headerMeta.title;
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

function updateStatHeaderLabels() {
  const level = clamp(Number(profileLevel?.value), 0, 100);
  const baseHeader = statGrid?.querySelector('[data-stat-header="base-stat"]');
  if (baseHeader) baseHeader.textContent = `At Level ${level}`;
}

function renderAscensionTables() {
  if (!ascAbilityGroups) return;
  ascAbilityGroups.innerHTML = "";
  const showNonZeroOnly = Boolean(ascShowTrainedOnly?.checked);
  const visibleAbilities = showNonZeroOnly
    ? currentAscensionAbilities.filter((ability) => Math.max(0, Math.trunc(Number(ability.ranks) || 0)) > 0)
    : currentAscensionAbilities;
  const groups = [
    { key: "stat", label: "Regular Stats", open: true },
    { key: "skill", label: "Skills", open: true },
    { key: "resist", label: "Resistances", open: false },
    { key: "regen", label: "Regeneration", open: false },
    { key: "other", label: "Other", open: false },
  ];

  groups.forEach((group) => {
    const entries = visibleAbilities.filter((ability) => getAscensionDisplayGroup(ability) === group.key);
    if (!entries.length) return;

    const wrapper = document.createElement("details");
    wrapper.className = "asc-group";
    if (group.open) wrapper.open = true;
    wrapper.innerHTML = `
      <summary>${group.label}</summary>
      <div class="asc-group-body">
        <table>
          <thead>
            <tr>
              <th>Ability</th>
              <th>Ranks</th>
              <th>Cap</th>
              <th>ATP Cost</th>
              <th>Next ATP</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    `;
    const body = wrapper.querySelector("tbody");
    entries.forEach((ability) => {
      const row = document.createElement("tr");
      row.dataset.ascRow = "1";
      const cost = ascensionPointsForRanks(ability.ranks, ability);
      const nextCost = getNextAscensionCostDisplay(ability, currentAscensionAbilities);
      const maxByGate = getMaxAllowedAscensionRanks(ability, currentAscensionAbilities);
      row.innerHTML = `
        <td>${ability.name}</td>
        <td><input type="number" min="0" max="${Math.max(maxByGate, ability.ranks)}" step="1" data-asc-ability="${ability.mnemonic}" value="${ability.ranks}" /></td>
        <td>${ability.cap}</td>
        <td>${cost}</td>
        <td data-asc-field="next-cost">${nextCost.display}</td>
      `;
      if (nextCost.gateReason) row.title = nextCost.gateReason;
      body?.appendChild(row);
    });
    ascAbilityGroups.appendChild(wrapper);
  });

  if (!ascAbilityGroups.children.length) {
    const empty = document.createElement("div");
    empty.className = "helper";
    empty.textContent = "No ascension abilities to display.";
    ascAbilityGroups.appendChild(empty);
  }

  ascAbilityGroups.querySelectorAll("input[data-asc-ability]").forEach((input) => {
    input.addEventListener("input", () => {
      const mnemonic = String(input.dataset.ascAbility || "");
      const ability = currentAscensionAbilities.find((entry) => entry.mnemonic === mnemonic);
      if (!ability) return;

      const desired = clamp(Math.trunc(Number(input.value) || 0), 0, ability.cap);
      const maxByGate = getMaxAllowedAscensionRanks(ability, currentAscensionAbilities);
      const available = totalAscensionPointsAvailable();

      ability.ranks = Math.min(desired, maxByGate);
      let used = calculateAscensionPointsUsed();
      if (used > available) {
        let affordable = ability.ranks;
        while (affordable > 0) {
          affordable -= 1;
          ability.ranks = affordable;
          used = calculateAscensionPointsUsed();
          if (used <= available) break;
        }
      }
      input.value = String(ability.ranks);
      syncAscensionStateFromAbilities();
      updateDerivedDisplays({ skipSkillsRender: true, skipEnhRender: true });
    });
  });
}

function updateAscensionStatus() {
  if (!ascStatus || !ascAbilityGroups) return;
  const available = totalAscensionPointsAvailable();
  const used = calculateAscensionPointsUsed();
  const remaining = available - used;
  const porter = currentAscensionAbilities.find((ability) => ability.mnemonic === "porter");
  const transcend = currentAscensionAbilities.find((ability) => ability.mnemonic === "trandest");
  const porterGate = getAscensionAbilityGate(porter);
  const transcendGate = getAscensionAbilityGate(transcend);
  const invalid = remaining < 0;

  ascAbilityGroups.querySelectorAll("tr[data-asc-row]").forEach((row) => {
    row.style.color = invalid ? "#b42318" : "";
  });

  if (invalid) {
    ascStatus.textContent = `Ascension over budget: ${used}/${available} ATP used.`;
    ascStatus.style.color = "#b42318";
  } else {
    const notes = [];
    if (!porterGate.allowed && Math.max(0, Math.trunc(Number(porter?.ranks) || 0)) === 0) notes.push("Porter locked");
    if (!transcendGate.allowed && Math.max(0, Math.trunc(Number(transcend?.ranks) || 0)) === 0) notes.push("Transcend Destiny locked");
    const lockSuffix = notes.length ? ` | ${notes.join(", ")}` : "";
    ascStatus.textContent = `Ascension ATP: ${used}/${available} used, ${remaining} remaining.${lockSuffix}`;
    ascStatus.style.color = "";
  }
}

function renderEnhanciveTables() {
  if (!enhStatTable || !enhSkillTable) return;
  enhStatTable.innerHTML = "";
  const rows = getDerivedStatRows();
  stats.forEach((stat) => {
    const statRow = rows[stat.key];
    const manualEnhStat = Math.max(0, Math.trunc(Number(enhanciveState.stats?.[stat.key]?.stat) || 0));
    const manualEnhBonus = Math.max(0, Math.trunc(Number(enhanciveState.stats?.[stat.key]?.bonus) || 0));
    const row = document.createElement("tr");
    row.style.color = statRow.enhValid ? "#1f4e42" : "#b42318";
    row.innerHTML = `
      <td>${stat.abbr}</td>
      <td><input type="number" min="0" max="40" step="1" data-enh-stat="${stat.key}" data-kind="stat" value="${manualEnhStat}" /></td>
      <td><input type="number" min="0" max="20" step="1" data-enh-stat="${stat.key}" data-kind="bonus" value="${manualEnhBonus}" /></td>
      <td>${statRow.enhEffective}/20</td>
    `;
    enhStatTable.appendChild(row);
  });

  enhSkillTable.innerHTML = "";
  currentSkills.forEach((skill) => {
    const key = skillKey(skill.name);
    const baseRanks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
    const effectiveEnh = getEffectiveSkillEnhancive(key);
    const enhRank = effectiveEnh.rank;
    const enhBonus = effectiveEnh.bonus;
    const manualEnhRank = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.rank) || 0));
    const manualEnhBonus = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.bonus) || 0));
    const rankBonusGain = skillBonusFromRanks(baseRanks + enhRank) - skillBonusFromRanks(baseRanks);
    const effective = rankBonusGain + enhBonus;
    const valid = enhRank <= 50 && enhBonus <= 50 && effective <= 50;
    const row = document.createElement("tr");
    row.style.color = valid ? "#1f4e42" : "#b42318";
    row.innerHTML = `
      <td>${skill.name}</td>
      <td><input type="number" min="0" max="50" step="1" data-enh-skill="${key}" data-kind="rank" value="${manualEnhRank}" /></td>
      <td><input type="number" min="0" max="50" step="1" data-enh-skill="${key}" data-kind="bonus" value="${manualEnhBonus}" /></td>
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
      enforceStatEnhanciveRowLimits(statKey, input.dataset.kind);
      const rowState = enhanciveState.stats[statKey];
      const siblingStat = enhStatTable.querySelector(`input[data-enh-stat="${statKey}"][data-kind="stat"]`);
      const siblingBonus = enhStatTable.querySelector(`input[data-enh-stat="${statKey}"][data-kind="bonus"]`);
      if (siblingStat && document.activeElement !== siblingStat) siblingStat.value = String(rowState.stat);
      if (siblingBonus && document.activeElement !== siblingBonus) siblingBonus.value = String(rowState.bonus);
      updateDerivedDisplays({ skipEnhRender: true, skipAscRender: true });
    });
  });

  enhSkillTable.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.enhSkill;
      const skill = currentSkills.find((entry) => skillKey(entry.name) === key);
      const baseRanks = Math.max(0, Math.trunc(Number(skill?.ranks) || 0));
      if (!enhanciveState.skills[key]) enhanciveState.skills[key] = { rank: 0, bonus: 0 };
      const value = Math.max(0, Math.trunc(Number(input.value) || 0));
      if (input.dataset.kind === "rank") enhanciveState.skills[key].rank = value;
      else enhanciveState.skills[key].bonus = value;
      enforceSkillEnhanciveRowLimits(key, baseRanks, input.dataset.kind);
      const rowState = enhanciveState.skills[key];
      const siblingRank = enhSkillTable.querySelector(`input[data-enh-skill="${key}"][data-kind="rank"]`);
      const siblingBonus = enhSkillTable.querySelector(`input[data-enh-skill="${key}"][data-kind="bonus"]`);
      if (siblingRank && document.activeElement !== siblingRank) siblingRank.value = String(rowState.rank);
      if (siblingBonus && document.activeElement !== siblingBonus) siblingBonus.value = String(rowState.bonus);
      updateDerivedDisplays({ skipEnhRender: true, skipAscRender: true });
    });
  });

  renderImportedEnhanciveTables();
}

function renderImportedEnhanciveTables() {
  if (!enhImportedSummary || !enhImportedItemsTable || !enhImportedUnresolvedTable || !enhManualResolutionTable) return;

  currentEnhanciveEquipment = enhanciveImport.normalizeEnhanciveEquipmentState(currentEnhanciveEquipment);
  const importedItems = currentEnhanciveEquipment.importedSnapshot.items;
  const unresolvedEntries = currentEnhanciveEquipment.importedSnapshot.unresolved.filter(
    (entry) => !currentEnhanciveEquipment.manualResolutions.resolvedFromImported.includes(entry.id),
  );
  const manualItems = currentEnhanciveEquipment.manualResolutions.items;
  const activeCount = getActiveEnhanciveEquipmentItems().length;

  enhImportedSummary.textContent = `Imported snapshot: ${currentEnhanciveEquipment.importedSnapshot.summary.itemCount || importedItems.length} item(s), `
    + `${currentEnhanciveEquipment.importedSnapshot.summary.propertyCount || 0} properties, `
    + `${currentEnhanciveEquipment.importedSnapshot.summary.totalAmount || 0} total amount`
    + ` | Itemized active sources: ${activeCount}`
    + ` | Imported enhancives ${currentEnhanciveEquipment.enhancivesEnabled ? "on" : "off"}`;

  enhImportedItemsTable.innerHTML = "";
  if (!importedItems.length) {
    const row = document.createElement("tr");
    row.innerHTML = "<td colspan=\"4\">No imported enhancive items loaded.</td>";
    enhImportedItemsTable.appendChild(row);
  } else {
    importedItems.forEach((item) => {
      const effects = item.effects.length
        ? item.effects.map((effect) => {
          const normalizedEffect = normalizeEnhanciveEffectForUse(effect);
          return `${effectDisplayType(normalizedEffect)} ${effectDisplayTarget(normalizedEffect)} +${normalizedEffect.value}`;
        }).join(", ")
        : "No itemized effects yet";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.source}</td>
        <td><input type="checkbox" data-imported-enh-active="${item.id}" ${item.active !== false ? "checked" : ""} /></td>
        <td>${effects}</td>
      `;
      enhImportedItemsTable.appendChild(row);
    });
  }

  enhImportedUnresolvedTable.innerHTML = "";
  if (!unresolvedEntries.length) {
    const row = document.createElement("tr");
    row.innerHTML = "<td colspan=\"5\">No unresolved imported effects.</td>";
    enhImportedUnresolvedTable.appendChild(row);
  } else {
    unresolvedEntries.forEach((entry) => {
      const normalizedEffect = normalizeEnhanciveEffectForUse(entry);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.category || "Unknown"}</td>
        <td>${effectDisplayTarget(normalizedEffect)}</td>
        <td>${entry.value}/${entry.limit || "—"}</td>
        <td>${entry.note || "Unknown source"}</td>
        <td><button class="btn ghost" type="button" data-resolve-enh-imported="${entry.id}">Resolve</button></td>
      `;
      enhImportedUnresolvedTable.appendChild(row);
    });
  }

  enhManualResolutionTable.innerHTML = "";
  if (!manualItems.length) {
    const row = document.createElement("tr");
    row.innerHTML = "<td colspan=\"6\">No manual enhancive resolutions yet.</td>";
    enhManualResolutionTable.appendChild(row);
  } else {
    manualItems.forEach((item) => {
      const effect = normalizeEnhanciveEffectForUse(item.effects[0] || {});
      const targetOptions = buildEnhanciveTargetOptions(effect.type);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="text" data-manual-enh-name="${item.id}" value="${item.name.replace(/"/g, "&quot;")}" /></td>
        <td><input type="checkbox" data-manual-enh-active="${item.id}" ${item.active !== false ? "checked" : ""} /></td>
        <td>
          <select data-manual-enh-type="${item.id}">
            ${ENHANCIVE_TYPE_OPTIONS.map((option) => `<option value="${option.value}" ${option.value === effect.type ? "selected" : ""}>${option.label}</option>`).join("")}
          </select>
        </td>
        <td>
          <select data-manual-enh-target="${item.id}">
            ${targetOptions.map((option) => `<option value="${option.value}" ${option.value === effect.target ? "selected" : ""}>${option.label}</option>`).join("")}
          </select>
        </td>
        <td><input type="number" min="0" step="1" data-manual-enh-value="${item.id}" value="${effect.value}" /></td>
        <td><button class="btn ghost" type="button" data-delete-manual-enh="${item.id}">Delete</button></td>
      `;
      enhManualResolutionTable.appendChild(row);
    });
  }

  enhImportedItemsTable.querySelectorAll("[data-imported-enh-active]").forEach((input) => {
    input.addEventListener("change", () => {
      const item = currentEnhanciveEquipment.importedSnapshot.items.find((entry) => entry.id === input.dataset.importedEnhActive);
      if (!item) return;
      item.active = input.checked;
      updateDerivedDisplays({ skipStatsRender: true, skipSkillsRender: true, skipAscRender: true });
    });
  });

  enhImportedUnresolvedTable.querySelectorAll("[data-resolve-enh-imported]").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = currentEnhanciveEquipment.importedSnapshot.unresolved.find((item) => item.id === button.dataset.resolveEnhImported);
      if (!entry) return;
      currentEnhanciveEquipment.manualResolutions.items.push(createManualEnhanciveItem({
        name: "Resolved Enhancive",
        category: entry.category,
        type: guessEnhanciveEffectType(entry.category, entry.label),
        label: entry.label,
        value: entry.value,
        limit: entry.limit,
      }));
      currentEnhanciveEquipment.manualResolutions.resolvedFromImported.push(entry.id);
      updateDerivedDisplays({ skipStatsRender: true, skipSkillsRender: true, skipAscRender: true });
    });
  });

  enhManualResolutionTable.querySelectorAll("[data-manual-enh-name]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = currentEnhanciveEquipment.manualResolutions.items.find((entry) => entry.id === input.dataset.manualEnhName);
      if (!item) return;
      item.name = input.value.trim() || "Manual Enhancive";
      if (!applyingProfile) updateProfileActionState();
    });
  });

  enhManualResolutionTable.querySelectorAll("[data-manual-enh-active]").forEach((input) => {
    input.addEventListener("change", () => {
      const item = currentEnhanciveEquipment.manualResolutions.items.find((entry) => entry.id === input.dataset.manualEnhActive);
      if (!item) return;
      item.active = input.checked;
      updateDerivedDisplays({ skipStatsRender: true, skipSkillsRender: true, skipAscRender: true });
    });
  });

  enhManualResolutionTable.querySelectorAll("[data-manual-enh-type]").forEach((select) => {
    select.addEventListener("change", () => {
      const item = currentEnhanciveEquipment.manualResolutions.items.find((entry) => entry.id === select.dataset.manualEnhType);
      if (!item || !item.effects[0]) return;
      item.effects[0].type = select.value;
      item.effects[0].target = buildEnhanciveTargetOptions(select.value)[0]?.value || "";
      updateDerivedDisplays({ skipStatsRender: true, skipSkillsRender: true, skipAscRender: true });
    });
  });

  enhManualResolutionTable.querySelectorAll("[data-manual-enh-target]").forEach((select) => {
    select.addEventListener("change", () => {
      const item = currentEnhanciveEquipment.manualResolutions.items.find((entry) => entry.id === select.dataset.manualEnhTarget);
      if (!item || !item.effects[0]) return;
      item.effects[0].target = select.value;
      updateDerivedDisplays({ skipStatsRender: true, skipSkillsRender: true, skipAscRender: true });
    });
  });

  enhManualResolutionTable.querySelectorAll("[data-manual-enh-value]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = currentEnhanciveEquipment.manualResolutions.items.find((entry) => entry.id === input.dataset.manualEnhValue);
      if (!item || !item.effects[0]) return;
      item.effects[0].value = Math.max(0, Math.trunc(Number(input.value) || 0));
      updateDerivedDisplays({ skipStatsRender: true, skipSkillsRender: true, skipAscRender: true });
    });
  });

  enhManualResolutionTable.querySelectorAll("[data-delete-manual-enh]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.deleteManualEnh;
      currentEnhanciveEquipment.manualResolutions.items = currentEnhanciveEquipment.manualResolutions.items.filter((item) => item.id !== targetId);
      updateDerivedDisplays({ skipStatsRender: true, skipSkillsRender: true, skipAscRender: true });
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
    const effectiveEnh = getEffectiveSkillEnhancive(key);
    const enhRank = effectiveEnh.rank;
    const enhBonus = effectiveEnh.bonus;
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
  stats.forEach((stat) => enforceStatEnhanciveRowLimits(stat.key));
  currentSkills.forEach((skill) => enforceSkillEnhanciveRowLimits(skillKey(skill.name), Math.max(0, Math.trunc(Number(skill.ranks) || 0))));
  syncSkillAdjustmentState();
  enforceAscensionPointBudget();
  syncAscensionStateFromAbilities();
  if (!skipStatsRender) updateStatDerivedDisplay();
  updateStatHeaderLabels();
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
    const effectiveEnh = getEffectiveSkillEnhancive(key);
    const enhRank = effectiveEnh.rank;
    const enhBonus = effectiveEnh.bonus;
    const rankBonusGain = skillBonusFromRanks(baseRanks + enhRank) - skillBonusFromRanks(baseRanks);
    return enhRank > 50 || enhBonus > 50 || rankBonusGain + enhBonus > 50;
  });
  if (statInvalid || skillInvalid) {
    enhStatus.textContent = "Invalid enhancive rows: stat limit is 40 stat / 20 bonus with 20 effective; skill limit is 50 effective.";
    enhStatus.style.color = "#b42318";
  } else {
    enhStatus.textContent = "Effective bonus is calculated per row and is capped by the shown limit.";
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
  currentAscensionAbilities = normalizeAscensionAbilities(Array.isArray(profile.ascensionAbilities) ? profile.ascensionAbilities : []);
  currentEnhanciveEquipment = enhanciveImport.normalizeEnhanciveEquipmentState(profile?.equipment?.enhancives);
  if (enhanciveListImport) enhanciveListImport.value = currentEnhanciveEquipment.raw.list || "";
  if (enhanciveTotalsImport) enhanciveTotalsImport.value = currentEnhanciveEquipment.raw.totals || "";
  if (enhanciveDetailsImport) enhanciveDetailsImport.value = currentEnhanciveEquipment.raw.totalsDetails || "";
  updateEnhanciveImportStatusMessages();

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
    const hasCustomBase = Boolean(profile.defaults.useCustomArmorBase);
    if (useCustomArmorBaseInput) useCustomArmorBaseInput.checked = hasCustomBase;
    if (armorBaseWeightInput) {
      armorBaseWeightInput.disabled = !hasCustomBase;
      armorBaseWeightInput.value = String(profile.defaults.armorBaseWeight ?? 0);
    }
    if (armorBaseDetails) armorBaseDetails.open = hasCustomBase;
    accessoryWeightInput.value = String(profile.defaults.accessoryWeight ?? 0);
    gearWeightInput.value = String(profile.defaults.gearWeight ?? 0);
    silversInput.value = String(profile.defaults.silvers ?? 0);
    currentBadgeDefaults = normalizeBadgeDefaults(profile.defaults.badge);
  } else {
    if (useCustomArmorBaseInput) useCustomArmorBaseInput.checked = false;
    if (armorBaseWeightInput) {
      armorBaseWeightInput.value = "0";
      armorBaseWeightInput.disabled = true;
    }
    if (armorBaseDetails) armorBaseDetails.open = false;
    currentBadgeDefaults = normalizeBadgeDefaults(null);
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
  if (!Array.isArray(profile.ascensionAbilities) || !profile.ascensionAbilities.length) {
    populateAbilitiesFromAscensionState();
    syncAscensionStateFromAbilities();
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
  if (!useCustomArmorBaseInput?.checked && armorBaseWeightInput) {
    armorBaseWeightInput.value = String(selected.standardWeight);
  }
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
    const effectiveEnh = getEffectiveSkillEnhancive(key);
    const enhRank = effectiveEnh.rank;
    const enhBonus = effectiveEnh.bonus;
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
    const effectiveEnh = getEffectiveSkillEnhancive(key);
    const hasEnhRank = effectiveEnh.rank > 0;
    const hasEnhBonus = effectiveEnh.bonus > 0;
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
    const effectiveEnh = getEffectiveSkillEnhancive(key);
    const enhRank = effectiveEnh.rank;
    const enhBonus = effectiveEnh.bonus;
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

  currentAscensionAbilities = normalizeAscensionAbilities(parsed.map((entry) => ({
    name: entry.name,
    mnemonic: entry.mnemonic,
    cap: entry.cap,
    category: entry.category || (entry.mnemonic === "trandest" ? "Elite" : "Common"),
    subcategory: entry.subcategory,
    ranks: entry.ranks,
  })));
  syncAscensionStateFromAbilities();
  updateDerivedDisplays();
  ascImportStatus.textContent = `ASC LIST loaded: ${parsed.length} ability row(s).`;
  ascImportStatus.style.color = "";
}

function collectSkills() {
  return currentSkills.map((skill) => {
    const key = skillKey(skill.name);
    const ascBonus = Math.max(0, Math.trunc(Number(ascensionState.skills?.[key]?.bonus) || 0));
    const effectiveEnh = getEffectiveSkillEnhancive(key);
    const enhRank = effectiveEnh.rank;
    const enhBonus = effectiveEnh.bonus;
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
    useCustomArmorBase: Boolean(record?.defaults?.useCustomArmorBase),
    armorBaseWeight: Math.max(0, Number(record?.defaults?.armorBaseWeight) || 0),
    accessoryWeight: Math.max(0, Number(record?.defaults?.accessoryWeight) || 0),
    gearWeight: Math.max(0, Number(record?.defaults?.gearWeight) || 0),
    silvers: Math.max(0, Number(record?.defaults?.silvers) || 0),
    badge: normalizeBadgeDefaults(record?.defaults?.badge),
  };

  const ascensionAbilities = normalizeAscensionAbilities(Array.isArray(record?.ascensionAbilities) ? record.ascensionAbilities : [])
    .map((entry) => ({
      name: entry.name,
      mnemonic: entry.mnemonic,
      cap: entry.cap,
      category: entry.category,
      subcategory: entry.subcategory,
      ranks: entry.ranks,
    }));

  return {
    name: String(record?.name || "").trim(),
    race: String(record?.race || "Human"),
    profession: String(record?.profession || ""),
    level: clamp(Number(record?.level), 0, 100),
    experience: Math.max(0, Math.trunc(Number(record?.experience) || experienceForLevel(record?.level))),
    ascensionExperience: Math.max(0, Math.trunc(Number(record?.ascensionExperience) || 0)),
    ascensionMilestones: clamp(Math.trunc(Number(record?.ascensionMilestones) || 0), 0, 10),
    ascensionAbilities,
    level0Stats: normalizeLevel0Stats(record?.level0Stats),
    stats: statsPayload,
    ascension: { stats: ascStats, skills: ascSkills },
    enhancive: { stats: enhStats, skills: enhSkills },
    equipment: {
      enhancives: enhanciveImport.normalizeEnhanciveEquipmentState(record?.equipment?.enhancives),
    },
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
  toggleDiffHighlight(useCustomArmorBaseInput, currentProfile.defaults.useCustomArmorBase !== selectedProfile.defaults.useCustomArmorBase);
  toggleDiffHighlight(armorBaseWeightInput, currentProfile.defaults.armorBaseWeight !== selectedProfile.defaults.armorBaseWeight);
  toggleDiffHighlight(accessoryWeightInput, currentProfile.defaults.accessoryWeight !== selectedProfile.defaults.accessoryWeight);
  toggleDiffHighlight(gearWeightInput, currentProfile.defaults.gearWeight !== selectedProfile.defaults.gearWeight);
  toggleDiffHighlight(silversInput, currentProfile.defaults.silvers !== selectedProfile.defaults.silvers);

  stats.forEach((stat) => {
    const level0Input = statGrid.querySelector(`input[data-stat="${stat.key}"][data-field="level0"]`);
    const currentLevel0 = currentProfile.level0Stats?.[stat.key] ?? null;
    const selectedLevel0 = selectedProfile.level0Stats?.[stat.key] ?? null;
    toggleDiffHighlight(level0Input, currentLevel0 !== selectedLevel0);

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

  const currentAscByMnemonic = new Map((currentProfile.ascensionAbilities || []).map((entry) => [entry.mnemonic, entry]));
  const selectedAscByMnemonic = new Map((selectedProfile.ascensionAbilities || []).map((entry) => [entry.mnemonic, entry]));
  ascAbilityGroups?.querySelectorAll('input[data-asc-ability]').forEach((input) => {
    const mnemonic = input.dataset.ascAbility;
    const currentValue = currentAscByMnemonic.get(mnemonic)?.ranks ?? 0;
    const selectedValue = selectedAscByMnemonic.get(mnemonic)?.ranks ?? 0;
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

  const ascensionAbilities = normalizeAscensionAbilities(currentAscensionAbilities).map((entry) => ({
    name: entry.name,
    mnemonic: entry.mnemonic,
    cap: entry.cap,
    category: entry.category,
    subcategory: entry.subcategory,
    ranks: entry.ranks,
  }));

  return {
    name: (nameOverride == null ? profileName.value : nameOverride).trim(),
    race: races.find((race) => race.key === profileRace.value)?.name || "Human",
    profession: profileProfession.value,
    level: clamp(Number(profileLevel.value), 0, 100),
    experience: Math.max(0, Math.trunc(Number(profileExperience.value) || 0)),
    ascensionExperience: Math.max(0, Math.trunc(Number(currentAscensionExperience) || 0)),
    ascensionMilestones: clamp(Math.trunc(Number(currentAscensionMilestones) || 0), 0, 10),
    ascensionAbilities,
    level0Stats: currentLevel0Stats,
    stats: statsPayload,
    ascension: { stats: ascStats, skills: ascSkills },
    enhancive: { stats: enhStats, skills: enhSkills },
    equipment: {
      enhancives: enhanciveImport.normalizeEnhanciveEquipmentState(currentEnhanciveEquipment),
    },
    skills: collectSkills(),
    defaults: {
      armorAsg: armorAsgSelect.value,
      armorWeight: Math.max(0, Number(armorWeightInput.value) || 0),
      useCustomArmorBase: Boolean(useCustomArmorBaseInput?.checked),
      armorBaseWeight: Math.max(0, Number(armorBaseWeightInput?.value) || 0),
      accessoryWeight: Math.max(0, Number(accessoryWeightInput.value) || 0),
      gearWeight: Math.max(0, Number(gearWeightInput.value) || 0),
      silvers: Math.max(0, Number(silversInput.value) || 0),
      badge: normalizeBadgeDefaults(currentBadgeDefaults),
    },
  };
}

function updateProfileActionState() {
  const selected = profileSelect.value ? findProfile(profiles, profileSelect.value) : null;
  const current = buildCurrentProfileRecord();
  const currentComparable = comparableProfile(current);
  const selectedComparable = selected ? comparableProfile(selected) : null;
  const hasName = currentComparable.name.length > 0;
  const existingByName = hasName
    ? profiles.find((entry) => String(entry.name || "").trim().toLowerCase() === currentComparable.name.toLowerCase())
    : null;
  const saveLabel = selected || existingByName ? "Update Profile" : "Create Profile";

  profileApply.disabled = !selected;
  profileApply.classList.remove("attention", "success-attention");
  reloadProfileButtons.forEach((button) => {
    button.disabled = !selected;
    button.classList.remove("attention");
  });
  saveProfileButtons.forEach((button) => {
    button.disabled = !hasName;
    button.classList.remove("success-attention");
    button.textContent = saveLabel;
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
  if (ascensionSection) ascensionSection.open = false;
  if (enhanciveSection) enhanciveSection.open = false;
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
  if (ascMilestonesImport) ascMilestonesImport.value = "";
  if (enhanciveListImport) enhanciveListImport.value = "";
  if (enhanciveTotalsImport) enhanciveTotalsImport.value = "";
  if (enhanciveDetailsImport) enhanciveDetailsImport.value = "";
  importStatus.textContent = "Run INFO START. Paste full output.";
  importStatus.style.color = "";
  expImportStatus.textContent = "Paste EXP to load level and experience.";
  expImportStatus.style.color = "";
  skillsImportUnmatchedKeys = new Set();
  skillsImportOffProfessionKeys = new Set();
  updateSkillsStatusMessage();
  ascImportStatus.textContent = "Paste ASC LIST to load current ascension ranks.";
  ascImportStatus.style.color = "";
  if (ascMilestonesImportStatus) {
    ascMilestonesImportStatus.textContent = "Paste ASC MILESTONES to load milestones reached.";
    ascMilestonesImportStatus.style.color = "";
  }
  currentEnhanciveEquipment = enhanciveImport.defaultEnhanciveEquipmentState();
  updateEnhanciveImportStatusMessages();

  armorAsgSelect.value = "none";
  updateArmorWeight();
  if (useCustomArmorBaseInput) useCustomArmorBaseInput.checked = false;
  if (armorBaseWeightInput) {
    armorBaseWeightInput.value = "0";
    armorBaseWeightInput.disabled = true;
  }
  if (armorBaseDetails) armorBaseDetails.open = false;
  accessoryWeightInput.value = "0";
  gearWeightInput.value = "0";
  silversInput.value = "0";

  currentSkills = mergeSkillsWithCatalog([]);
  currentLevel0Stats = defaultStatMap(50);
  currentBaseStats = defaultStatMap(50);
  currentAscensionExperience = 0;
  currentAscensionAbilities = buildDefaultAscensionAbilities();
  currentBadgeDefaults = normalizeBadgeDefaults(null);
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
  if (selected) localStorage.setItem(SELECTED_PROFILE_KEY, selected);
  else localStorage.removeItem(SELECTED_PROFILE_KEY);
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

function handleProfileSave(options = {}) {
  const { preserveUnsyncedFromExisting = false } = options;
  profiles = loadProfiles();
  const parsedInfoStart = parseInfoStartBlock(infoImport.value);
  const parsedInfo = parsedInfoStart && !parsedInfoStart.error ? parsedInfoStart : parseInfoBlock(infoImport.value);
  const name = profileName.value.trim() || (parsedInfo ? parsedInfo.name : "");

  if (!name) {
    importStatus.textContent = "Paste INFO output or enter a profile name.";
    return null;
  }

  const currentRecord = buildCurrentProfileRecord(name);
  const racePayload = parsedInfo ? parsedInfo.race : races.find((race) => race.key === profileRace.value)?.name || "Human";
  const professionPayload = parsedInfoStart?.profession || profileProfession.value;
  const levelPayload = clamp(Number(profileLevel.value), 0, 100);
  const expPayload = Math.max(0, Math.trunc(Number(profileExperience.value) || experienceForLevel(levelPayload)));

  let record = {
    id: "",
    ...currentRecord,
    race: racePayload,
    profession: professionPayload,
    level: levelPayload,
    experience: expPayload,
    level0Stats: parsedInfoStart?.level0Stats || currentLevel0Stats,
  };

  const selectedId = profileSelect.value || "";
  const normalizedName = normalizeProfileNameForMatch(name);
  const existingById = selectedId ? profiles.find((entry) => entry.id === selectedId) : null;
  const existingByName = profiles.find((entry) => normalizeProfileNameForMatch(entry.name) === normalizedName);
  const isUpdate = Boolean(existingById || existingByName);
  const existing = existingById || existingByName || null;
  const id = existingById?.id || existingByName?.id || `profile-${Date.now()}`;
  record.id = id;

  if (preserveUnsyncedFromExisting && existing) {
    const existingDefaults = existing.defaults && typeof existing.defaults === "object" ? existing.defaults : {};
    const recordDefaults = record.defaults && typeof record.defaults === "object" ? record.defaults : {};
    const existingEnhanciveEquipment = enhanciveImport.normalizeEnhanciveEquipmentState(existing?.equipment?.enhancives);
    const currentEnhanciveEquipmentState = enhanciveImport.normalizeEnhanciveEquipmentState(record?.equipment?.enhancives);
    const hasImportedEnhanciveInput = Boolean(
      currentEnhanciveEquipmentState.raw.list
      || currentEnhanciveEquipmentState.raw.totals
      || currentEnhanciveEquipmentState.raw.totalsDetails
      || currentEnhanciveEquipmentState.importedSnapshot.items.length
      || currentEnhanciveEquipmentState.importedSnapshot.unresolved.length
    );
    record = {
      ...record,
      ascension: existing.ascension || record.ascension,
      enhancive: existing.enhancive || record.enhancive,
      equipment: {
        enhancives: hasImportedEnhanciveInput
          ? enhanciveImport.normalizeEnhanciveEquipmentState({
            ...currentEnhanciveEquipmentState,
            manualResolutions: existingEnhanciveEquipment.manualResolutions,
            enhancivesEnabled: currentEnhanciveEquipmentState.enhancivesEnabled,
          })
          : existingEnhanciveEquipment,
      },
      defaults: {
        ...recordDefaults,
        ...existingDefaults,
        badge: normalizeBadgeDefaults(existingDefaults.badge ?? recordDefaults.badge),
      },
    };
  }

  profiles = profiles.filter((entry) => entry.id !== id).concat(record);
  saveProfiles(profiles);
  refreshProfileSelect(profiles);
  profileSelect.value = id;
  localStorage.setItem(SELECTED_PROFILE_KEY, id);
  importStatus.textContent = `${isUpdate ? "Updated" : "Created"} profile: ${record.name}`;
  applyProfile(record);
  applySectionDefaultVisibility();
  return record;
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

  importStatus.textContent = `Parsed ${parsed.name} (${parsed.race}). Enter a profile name, then create or update the profile.`;
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
useCustomArmorBaseInput?.addEventListener("change", () => {
  if (armorBaseWeightInput) armorBaseWeightInput.disabled = !useCustomArmorBaseInput.checked;
  if (armorBaseDetails) armorBaseDetails.open = useCustomArmorBaseInput.checked;
  if (!useCustomArmorBaseInput.checked) {
    const selected = armorAsg.find((item) => item.key === armorAsgSelect.value);
    if (selected && armorBaseWeightInput) armorBaseWeightInput.value = String(selected.standardWeight);
  }
});

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

ascMilestonesImport?.addEventListener("input", () => {
  const text = String(ascMilestonesImport.value || "");
  if (!text.trim()) {
    if (ascMilestonesImportStatus) {
      ascMilestonesImportStatus.textContent = "Paste ASC MILESTONES to load milestones reached.";
      ascMilestonesImportStatus.style.color = "";
    }
    return;
  }

  const reached = parseAscMilestonesBlock(text);
  if (reached == null) {
    if (ascMilestonesImportStatus) {
      ascMilestonesImportStatus.textContent = "Could not parse ASC MILESTONES output.";
      ascMilestonesImportStatus.style.color = "#b42318";
    }
    return;
  }

  currentAscensionMilestones = reached;
  if (profileAscensionMilestones) profileAscensionMilestones.value = String(reached);
  updateDerivedDisplays();
  if (ascMilestonesImportStatus) {
    ascMilestonesImportStatus.textContent = `ASC MILESTONES loaded: ${reached}/10 reached.`;
    ascMilestonesImportStatus.style.color = "";
  }
});

enhanciveListImport?.addEventListener("input", () => {
  rebuildImportedEnhanciveState();
  updateDerivedDisplays({ skipStatsRender: true, skipSkillsRender: true, skipAscRender: true });
});

enhanciveTotalsImport?.addEventListener("input", () => {
  rebuildImportedEnhanciveState();
  updateDerivedDisplays({ skipStatsRender: true, skipSkillsRender: true, skipAscRender: true });
});

enhanciveDetailsImport?.addEventListener("input", () => {
  rebuildImportedEnhanciveState();
  updateDerivedDisplays({ skipStatsRender: true, skipSkillsRender: true, skipAscRender: true });
});

addManualEnhItem?.addEventListener("click", () => {
  currentEnhanciveEquipment.manualResolutions.items.push(createManualEnhanciveItem({
    name: "Manual Enhancive",
    type: "stat",
    target: "str",
    label: "Strength",
    value: 0,
  }));
  updateDerivedDisplays({ skipStatsRender: true, skipSkillsRender: true, skipAscRender: true });
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

ascShowTrainedOnly?.addEventListener("change", () => {
  renderAscensionTables();
  updateAscensionStatus();
});

runProfileTestsBtn?.addEventListener("click", runProfileSelfTests);

function decodeBase64UrlUtf8(input) {
  if (!input) return "";
  const normalized = String(input).replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}

async function importGstoolsPayloadFromHash() {
  const rawHash = String(window.location.hash || "").replace(/^#/, "");
  if (!rawHash) return;

  let encoded = "";
  let nextTarget = "";
  if (rawHash.includes("=")) {
    const hashParams = new URLSearchParams(rawHash);
    encoded = hashParams.get("gstools") || "";
    nextTarget = String(hashParams.get("next") || "").trim().toLowerCase();
  } else {
    return;
  }
  if (!encoded) return;

  try {
    const jsonText = decodeBase64UrlUtf8(encoded);
    const payload = JSON.parse(jsonText);
    const blocks = payload?.blocks || {};
    const payloadCharacterName = stripMarkupTags(payload?.character || "");

    if (typeof blocks.infoStart === "string" && blocks.infoStart.trim()) {
      infoImport.value = blocks.infoStart;
      infoImport.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (typeof blocks.skills === "string" && blocks.skills.trim()) {
      skillsImport.value = blocks.skills;
      skillsImport.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (typeof blocks.exp === "string" && blocks.exp.trim()) {
      expImport.value = blocks.exp;
      expImport.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (typeof blocks.ascList === "string" && blocks.ascList.trim()) {
      ascImport.value = blocks.ascList;
      ascImport.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (typeof blocks.ascMilestones === "string" && blocks.ascMilestones.trim() && ascMilestonesImport) {
      ascMilestonesImport.value = blocks.ascMilestones;
      ascMilestonesImport.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (typeof blocks.enhanciveList === "string" && enhanciveListImport) {
      enhanciveListImport.value = blocks.enhanciveList;
      enhanciveListImport.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (typeof blocks.enhanciveTotals === "string" && enhanciveTotalsImport) {
      enhanciveTotalsImport.value = blocks.enhanciveTotals;
      enhanciveTotalsImport.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (typeof blocks.enhanciveTotalsDetails === "string" && enhanciveDetailsImport) {
      enhanciveDetailsImport.value = blocks.enhanciveTotalsDetails;
      enhanciveDetailsImport.dispatchEvent(new Event("input", { bubbles: true }));
    }

    if (!profileName.value.trim() && payloadCharacterName) {
      profileName.value = payloadCharacterName;
    }

    // Auto-create/update + select profile after hash import.
    handleProfileSave({ preserveUnsyncedFromExisting: true });
    importStatus.textContent = "Imported quick-start blocks from gstools payload.";
    importStatus.style.color = "";
    const nextPageByKey = {
      profile: "",
      home: "../index.html",
      encumbrance: "../encumbrance.html",
      calculator: "../calculator.html",
      spells: "../spells.html",
      badge: "../badge.html",
      resources: "../profession-services/resources.html",
      "stat-optimizer": "../stat-optimizer/stat-optimizer.html",
      lumnis: "../lumnis.html",
      "violet-orb": "../violet-orb.html",
    };
    const redirectUrl = nextPageByKey[nextTarget] || "";
    if (redirectUrl) {
      window.location.assign(redirectUrl);
      return;
    }
    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", cleanUrl);
  } catch (_error) {
    importStatus.textContent = "Could not import gstools payload from URL hash.";
    importStatus.style.color = "#b42318";
  }
}

importGstoolsPayloadFromHash();
