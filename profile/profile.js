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
const enhResourceTable = document.getElementById("enhResourceTable");
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

const dataSource = globalThis.GS4_DATA;
const storage = globalThis.GS4Storage;
const logic = globalThis.ProfileLogic;
const profileImports = globalThis.ProfileImports;
const profileRender = globalThis.ProfileRender;
const profileEvents = globalThis.ProfileEvents;
const profileActions = globalThis.ProfileActions;
const profileGstools = globalThis.ProfileGstools;
const enhanciveImport = globalThis.EnhanciveImport;
const profileState = globalThis.ProfileState;

if (!dataSource) throw new Error("GS4_DATA is not loaded. Ensure data/gs4-data.js is loaded before profile.js.");
if (!storage) throw new Error("GS4Storage is not loaded. Ensure shared.js is loaded before profile.js.");
if (!logic) throw new Error("ProfileLogic is not loaded. Ensure profile-logic.js is loaded before profile.js.");
if (!profileImports) throw new Error("ProfileImports is not loaded. Ensure profile-imports.js is loaded before profile.js.");
if (!profileRender) throw new Error("ProfileRender is not loaded. Ensure profile-render.js is loaded before profile.js.");
if (!profileEvents) throw new Error("ProfileEvents is not loaded. Ensure profile-events.js is loaded before profile.js.");
if (!profileActions) throw new Error("ProfileActions is not loaded. Ensure profile-actions.js is loaded before profile.js.");
if (!profileGstools) throw new Error("ProfileGstools is not loaded. Ensure profile-gstools.js is loaded before profile.js.");
if (!enhanciveImport) throw new Error("EnhanciveImport is not loaded. Ensure enhancive-import.js is loaded before profile.js.");
if (!profileState) throw new Error("ProfileState is not loaded. Ensure profile-state.js is loaded before profile.js.");

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
const experienceForLevel = (level) => logic.experienceForLevel(level, levelThresholds);
const estimateTotalAscensionPoints = logic.estimateTotalAscensionPoints;
const multiplierUnitsForRanks = logic.multiplierUnitsForRanks;
const summarizeTrainingPointConversion = logic.summarizeTrainingPointConversion;
const ENHANCIVE_RESOURCE_OPTIONS = logic.ENHANCIVE_RESOURCE_OPTIONS;
const normalizeEnhanciveTargetLabel = logic.normalizeEnhanciveTargetLabel;
const normalizeEnhanciveItemLinkName = logic.normalizeEnhanciveItemLinkName;
const normalizeProfileNameForMatch = logic.normalizeProfileNameForMatch;
const normalizeBadgeDefaults = logic.normalizeBadgeDefaults;
const getAscensionDisplayGroup = logic.getAscensionDisplayGroup;
const ascensionRankCost = logic.ascensionRankCost;
const ascensionPointsForRanks = logic.ascensionPointsForRanks;
const buildDefaultAscensionAbilities = () => logic.buildDefaultAscensionAbilities(defaultAscensionAbilityCatalog);
const normalizeAscensionAbilities = (entries) => logic.normalizeAscensionAbilities(entries, defaultAscensionAbilityCatalog);
const calculateAscensionPointsUsed = (abilities = currentAscensionAbilities) => (
  logic.calculateAscensionPointsUsed(abilities, ascensionPointsForRanks)
);
const getAscensionAbilityContext = (abilities = currentAscensionAbilities) => (
  logic.getAscensionAbilityContext(abilities, ascensionPointsForRanks)
);
const getAscensionAbilityGate = (ability, abilities = currentAscensionAbilities) => (
  logic.getAscensionAbilityGate(ability, abilities, ascensionPointsForRanks)
);
const getMaxAllowedAscensionRanks = (ability, abilities = currentAscensionAbilities) => (
  logic.getMaxAllowedAscensionRanks(ability, abilities, ascensionPointsForRanks)
);
const getNextAscensionCostDisplay = (ability, abilities = currentAscensionAbilities) => (
  logic.getNextAscensionCostDisplay(ability, abilities, ascensionRankCost, ascensionPointsForRanks)
);
const trainingPointsPerLevelForStats = (statSnapshot, profession) => (
  logic.trainingPointsPerLevelForStats(statSnapshot, profession, professionPrimeReqs)
);
const estimateTotalTrainingPointsFromExperience = (experience, profession) => (
  logic.estimateTotalTrainingPointsFromExperience({
    experience,
    profession,
    levelThresholds,
    getTrainingPointStatsForLevel,
    professionPrimeReqs,
  })
);
const estimateSpentTrainingPointsFromRanks = (skills, profession, level) => (
  logic.estimateSpentTrainingPointsFromRanks({
    skills,
    profession,
    level,
    costProfessionOrder,
    trainingCostRows,
    getSkillTrainingRowName,
    getSkillPoolKey,
    multiplierUnitsForRanksFn: multiplierUnitsForRanks,
  })
);
const getTrainingPointStatsForLevel = (level) => logic.getTrainingPointStatsSnapshot({
  currentLevel0Stats,
  currentBaseStats,
  level,
  stats,
  raceName: getSelectedRaceName(),
  profession: profileProfession.value,
  computeStatsFromLevel0Fn: computeStatsFromLevel0,
  clampFn: clamp,
});
const getStatAdjustment = (statKey) => logic.getStatAdjustment({
  statKey,
  ascensionState,
  enhanciveState,
  equipmentTotals: getEquipmentEnhanciveTotals(),
});
const getDerivedStatRows = () => logic.buildDerivedStatRows({
  stats,
  currentBaseStats,
  raceName: getSelectedRaceName(),
  getRaceBonusModifierFn: getRaceBonusModifier,
  statToBonusFn: statToBonus,
  ascensionState,
  enhanciveState,
  equipmentTotals: getEquipmentEnhanciveTotals(),
  clampFn: clamp,
});
const getSkillTrainingRowName = (skillName) => logic.getSkillTrainingRowName(skillName, spellCircles, loreSkillNames);
const getSkillPoolKey = (skillName, trainingRowName) => logic.getSkillPoolKey(skillName, trainingRowName, spellCircles);
const getSkillPoolLabel = (poolKey, trainingRowName) => logic.getSkillPoolLabel(poolKey, trainingRowName);
const formatPoolHeaderText = (poolLabel, poolUsed, poolMax) => logic.formatPoolHeaderText(poolLabel, poolUsed, poolMax);
const formatTrainingCostDisplay = (ptp, mtp) => logic.formatTrainingCostDisplay(ptp, mtp);
const getDisplaySkillCategory = (skillName) => logic.getDisplaySkillCategory(skillName, skillCategoryByName);
const buildSkillRankCapContext = (skills = currentSkills) => logic.buildSkillRankCapContext({
  skills,
  profession: profileProfession.value,
  level: Number(profileLevel.value),
  costProfessionOrder,
  maxPerLevelRows,
  spellCircles,
  loreSkillNames,
  skillKeyFn: skillKey,
});
const getNextRankCostDisplay = (skill, capContext) => logic.getNextRankCostDisplay({
  skill,
  profession: profileProfession.value,
  level: Number(profileLevel.value),
  capContext,
  costProfessionOrder,
  trainingCostRows,
  spellCircles,
  loreSkillNames,
});
const collectSkills = () => logic.collectSkills({
  currentSkills,
  ascensionState,
  getEffectiveSkillEnhanciveFn: getEffectiveSkillEnhancive,
  skillBonusFromRanksFn: skillBonusFromRanks,
  skillKeyFn: skillKey,
});
const getVisibleSkills = (skills) => logic.getVisibleSkills({
  skills,
  showTrainedOnly: Boolean(skillsShowTrainedOnly?.checked),
  allowedCircles: professionSpellCircleMap[profileProfession.value] || new Set(),
  ascensionState,
  getEffectiveSkillEnhanciveFn: getEffectiveSkillEnhancive,
  spellCircles,
  skillKeyFn: skillKey,
});

const defaultStatMap = (value = 0) => logic.defaultStatMap(stats, value);
const canonicalSkillName = (rawName) => logic.canonicalSkillName(rawName, skillAliasMap, skillCatalog);
const mergeSkillsWithCatalog = (skills = []) => logic.mergeSkillsWithCatalog(skills, skillCatalog, skillAliasMap);
const normalizeSkillEntry = (skill) => logic.normalizeSkillEntry(skill, skillCatalog, skillAliasMap);
const buildEnhanciveTargetOptions = (effectType) => logic.buildEnhanciveTargetOptions(effectType, stats, skillCatalog);
const guessEnhanciveEffectType = (category, label) => logic.guessEnhanciveEffectType(category, label, stats);
const guessEnhanciveTarget = (effectType, label) => (
  logic.guessEnhanciveTarget({ effectType, label, stats, skillCatalog, skillAliasMap })
);
const effectDisplayType = (effect) => logic.effectDisplayType(effect);
const effectDisplayTarget = (effect) => logic.effectDisplayTarget(effect, stats, skillCatalog);
const normalizeEnhanciveEffectForUse = (effect) => (
  logic.normalizeEnhanciveEffectForUse(effect, stats, skillCatalog, skillAliasMap)
);
const resolveStatKeyFromAscName = (name) => logic.resolveStatKeyFromAscName(name, stats);
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
const importParsers = profileImports.createParserSet({
  stats,
  normalizeRaceName,
  clamp,
  levelThresholds,
});
const {
  stripMarkupTags,
  parseInfoBlock,
  parseInfoStartBlock,
  parseSkillsBlock,
  parseSkillsLevel,
  parseAscListBlock,
  levelFromExperience,
  parseExpBlock,
  parseAscMilestonesBlock,
} = importParsers;

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

function getActiveEnhanciveEquipmentItems() {
  return logic.getActiveEnhanciveEquipmentItems({
    currentEnhanciveEquipment,
    normalizeEnhanciveEquipmentStateFn: enhanciveImport.normalizeEnhanciveEquipmentState,
    normalizeEnhanciveItemLinkNameFn: normalizeEnhanciveItemLinkName,
  });
}

function getEquipmentEnhanciveTotals() {
  return logic.getEquipmentEnhanciveTotals({
    currentEnhanciveEquipment,
    defaultStatMapFn: defaultStatMap,
    skillCatalog,
    skillKeyFn: skillKey,
    normalizeEnhanciveEffectForUseFn: normalizeEnhanciveEffectForUse,
    normalizeEnhanciveEquipmentStateFn: enhanciveImport.normalizeEnhanciveEquipmentState,
    normalizeEnhanciveItemLinkNameFn: normalizeEnhanciveItemLinkName,
  });
}

function getEffectiveSkillEnhancive(skillKeyName) {
  return logic.getEffectiveSkillEnhancive(skillKeyName, enhanciveState, getEquipmentEnhanciveTotals());
}

function updateEnhanciveImportStatusMessages() {
  profileRender.updateEnhanciveImportStatusMessages({
    enhanciveListImport,
    enhanciveTotalsImport,
    enhanciveDetailsImport,
    enhanciveListImportStatus,
    enhanciveTotalsImportStatus,
    enhanciveDetailsImportStatus,
    currentEnhanciveEquipment,
  });
}

function rebuildImportedEnhanciveState(options = {}) {
  const { preserveManual = true, importedAt = currentEnhanciveEquipment.lastImportedAt || new Date().toISOString() } = options;
  currentEnhanciveEquipment = profileState.rebuildImportedEnhanciveState({
    currentEnhanciveEquipment,
    listText: enhanciveListImport?.value || "",
    totalsText: enhanciveTotalsImport?.value || "",
    detailsText: enhanciveDetailsImport?.value || "",
    preserveManual,
    importedAt,
    mergeImportedEnhanciveSnapshot: enhanciveImport.mergeImportedEnhanciveSnapshot,
    normalizeEnhanciveEquipmentState: enhanciveImport.normalizeEnhanciveEquipmentState,
  });
  updateEnhanciveImportStatusMessages();
}

function createManualEnhanciveItem(partial = {}) {
  return logic.createManualEnhanciveItem({
    partial,
    guessEnhanciveEffectTypeFn: guessEnhanciveEffectType,
    guessEnhanciveTargetFn: guessEnhanciveTarget,
  });
}

function getManualEffectsLinkedToImportedItem(itemName) {
  return logic.getManualEffectsLinkedToImportedItem(
    currentEnhanciveEquipment,
    itemName,
    normalizeEnhanciveItemLinkName,
  );
}

function getSelectedRaceName() {
  return races.find((race) => race.key === profileRace.value)?.name || "Human";
}

function totalAscensionPointsAvailable() {
  return estimateTotalAscensionPoints(currentAscensionExperience, currentAscensionMilestones).totalAtp;
}

function enforceAscensionPointBudget() {
  currentAscensionAbilities = logic.enforceAscensionPointBudget({
    abilities: currentAscensionAbilities,
    availablePoints: totalAscensionPointsAvailable(),
    getMaxAllowedAscensionRanksFn: getMaxAllowedAscensionRanks,
    calculateAscensionPointsUsedFn: calculateAscensionPointsUsed,
  });
}

function syncAscensionStateFromAbilities() {
  ascensionState = logic.syncAscensionStateFromAbilities({
    currentAscensionAbilities,
    stats,
    currentSkills,
    ascensionState,
    ascMnemonicMap,
    resolveStatKeyFromAscNameFn: resolveStatKeyFromAscName,
    canonicalSkillNameFn: canonicalSkillName,
    skillKeyFn: skillKey,
  });
}

function populateAbilitiesFromAscensionState() {
  currentAscensionAbilities = logic.populateAbilitiesFromAscensionState({
    currentAscensionAbilities,
    ascensionState,
    ascMnemonicMap,
    resolveStatKeyFromAscNameFn: resolveStatKeyFromAscName,
    canonicalSkillNameFn: canonicalSkillName,
    normalizeAscensionAbilitiesFn: normalizeAscensionAbilities,
    clampFn: clamp,
  });
}

function setExperienceFromLevel(level) {
  profileExperience.value = String(experienceForLevel(level));
}

function updateTrainingPointEstimateDisplay() {
  profileRender.updateTrainingPointEstimateDisplay({
    tpExpPtp,
    tpExpMtp,
    tpSpentPtp,
    tpSpentMtp,
    tpLeftPtp,
    tpLeftMtp,
    tpConvertedPhyToMnt,
    tpConvertedMntToPhy,
    tpShortfallRow,
    tpShortfallPtp,
    tpShortfallMtp,
    profession: profileProfession.value,
    experience: Math.max(0, Math.trunc(Number(profileExperience.value) || 0)),
    level: clamp(Number(profileLevel.value), 0, 100),
    currentSkills,
    estimateTotalTrainingPointsFromExperience,
    estimateSpentTrainingPointsFromRanks,
    summarizeTrainingPointConversion,
  });
}

function updateAscensionPointEstimateDisplay() {
  profileRender.updateAscensionPointEstimateDisplay({
    atpEstimateStatus,
    currentAscensionExperience,
    currentAscensionMilestones,
    estimateTotalAscensionPoints,
  });
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

function enforceStatEnhanciveRowLimits(statKey, changedKind = null) {
  if (!enhanciveState.stats[statKey]) enhanciveState.stats[statKey] = { stat: 0, bonus: 0 };
  enhanciveState.stats[statKey] = logic.enforceStatEnhanciveRowLimits(enhanciveState.stats[statKey], changedKind);
}

function enforceSkillEnhanciveRowLimits(skillKeyName, baseRanks, changedKind = null) {
  if (!enhanciveState.skills[skillKeyName]) enhanciveState.skills[skillKeyName] = { rank: 0, bonus: 0 };
  enhanciveState.skills[skillKeyName] = logic.enforceSkillEnhanciveRowLimits({
    entry: enhanciveState.skills[skillKeyName],
    baseRanks,
    changedKind,
    skillBonusFromRanksFn: skillBonusFromRanks,
  });
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
  const groupOpenState = new Map();
  ascAbilityGroups?.querySelectorAll("details.asc-group[data-asc-group]").forEach((group) => {
    groupOpenState.set(group.dataset.ascGroup, Boolean(group.open));
  });
  const activeAscInput = document.activeElement?.matches?.("input[data-asc-ability]")
    ? {
      mnemonic: document.activeElement.dataset.ascAbility,
      groupKey: document.activeElement.closest("details.asc-group")?.dataset.ascGroup || "",
      selectionStart: document.activeElement.selectionStart,
      selectionEnd: document.activeElement.selectionEnd,
    }
    : null;
  const previousScrollY = window.scrollY;

  profileRender.renderAscensionTables({
    ascAbilityGroups,
    ascShowTrainedOnly,
    currentAscensionAbilities,
    getAscensionDisplayGroup,
    ascensionPointsForRanks,
    getNextAscensionCostDisplay,
    getMaxAllowedAscensionRanks,
  });
  profileEvents.bindAscensionInputs({
    ascAbilityGroups,
    currentAscensionAbilities,
    clamp,
    getMaxAllowedAscensionRanks,
    totalAscensionPointsAvailable,
    calculateAscensionPointsUsed,
    syncAscensionStateFromAbilities,
    updateDerivedDisplays,
  });

  ascAbilityGroups?.querySelectorAll("details.asc-group[data-asc-group]").forEach((group) => {
    const groupKey = group.dataset.ascGroup || "";
    if (groupOpenState.has(groupKey)) {
      group.open = Boolean(groupOpenState.get(groupKey));
    }
  });

  if (activeAscInput?.mnemonic) {
    if (activeAscInput.groupKey) {
      const activeGroup = ascAbilityGroups?.querySelector(`details.asc-group[data-asc-group="${activeAscInput.groupKey}"]`);
      if (activeGroup) activeGroup.open = true;
    }
    const nextInput = ascAbilityGroups?.querySelector(`input[data-asc-ability="${activeAscInput.mnemonic}"]`);
    if (nextInput) {
      nextInput.focus({ preventScroll: true });
      if (typeof activeAscInput.selectionStart === "number" && typeof activeAscInput.selectionEnd === "number") {
        try {
          nextInput.setSelectionRange(activeAscInput.selectionStart, activeAscInput.selectionEnd);
        } catch (error) {
          // Ignore selection restoration failures on numeric inputs.
        }
      }
    }
  }
  window.scrollTo(0, previousScrollY);
}

function updateAscensionStatus() {
  profileRender.updateAscensionStatus({
    ascStatus,
    ascAbilityGroups,
    totalAscensionPointsAvailable,
    calculateAscensionPointsUsed,
    currentAscensionAbilities,
    getAscensionAbilityGate,
  });
}

function renderEnhanciveTables() {
  profileRender.renderEnhanciveTables({
    enhStatTable,
    enhSkillTable,
    enhResourceTable,
    stats,
    currentSkills,
    enhanciveState,
    getDerivedStatRows,
    getEquipmentEnhanciveTotals,
    ENHANCIVE_RESOURCE_OPTIONS,
    skillKey,
    getEffectiveSkillEnhancive,
    skillBonusFromRanks,
  });

  renderImportedEnhanciveTables();
}

function renderImportedEnhanciveTables() {
  if (!enhImportedSummary || !enhImportedItemsTable || !enhImportedUnresolvedTable || !enhManualResolutionTable) return;

  currentEnhanciveEquipment = enhanciveImport.normalizeEnhanciveEquipmentState(currentEnhanciveEquipment);
  profileRender.renderImportedEnhanciveTables({
    enhImportedSummary,
    enhImportedItemsTable,
    enhImportedUnresolvedTable,
    enhManualResolutionTable,
    currentEnhanciveEquipment,
    getActiveEnhanciveEquipmentItems,
    getManualEffectsLinkedToImportedItem,
    normalizeEnhanciveEffectForUse,
    effectDisplayType,
    effectDisplayTarget,
    buildEnhanciveTargetOptions,
    ENHANCIVE_TYPE_OPTIONS,
  });
  profileEvents.bindImportedEnhanciveInputs({
    enhImportedItemsTable,
    enhImportedUnresolvedTable,
    enhManualResolutionTable,
    currentEnhanciveEquipment,
    normalizeEnhanciveEffectForUse,
    guessEnhanciveEffectType,
    createManualEnhanciveItem,
    buildEnhanciveTargetOptions,
    updateDerivedDisplays,
    updateProfileActionState,
    getApplyingProfile: () => applyingProfile,
  });
}

function updateStatDerivedDisplay() {
  profileRender.updateStatDerivedDisplay({
    stats,
    statGrid,
    currentLevel0Stats,
    currentBaseStats,
    clamp,
    getDerivedStatRows,
    formatBonus,
  });
}

function updateEnhanciveDisplay() {
  profileRender.updateEnhanciveDisplay({
    enhStatTable,
    enhSkillTable,
    enhResourceTable,
    stats,
    currentSkills,
    enhanciveState,
    getDerivedStatRows,
    getEquipmentEnhanciveTotals,
    skillKey,
    getEffectiveSkillEnhancive,
    skillBonusFromRanks,
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
  profileRender.updateEnhStatus({
    enhStatus,
    getDerivedStatRows,
    currentSkills,
    skillKey,
    getEffectiveSkillEnhancive,
    skillBonusFromRanks,
  });
}

function recalcFromLevel0() {
  if (!currentLevel0Stats) {
    const parsedStart = parseInfoStartBlock(infoImport.value);
    if (parsedStart && !parsedStart.error) {
      currentLevel0Stats = parsedStart.level0Stats;
      const parsedStartRace = String(parsedStart.race || "").trim();
      const raceOption = parsedStartRace
        ? races.find((race) => String(race.name || "").toLowerCase() === parsedStartRace.toLowerCase())
        : null;
      if (raceOption) profileRace.value = raceOption.key;
      const parsedStartProfession = String(parsedStart.profession || "").trim();
      const professionOption = parsedStartProfession
        ? professions.find((prof) => String(prof || "").toLowerCase() === parsedStartProfession.toLowerCase())
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
  const parsedStartRace = String(parsedStart.race || "").trim();
  const raceOption = parsedStartRace
    ? races.find((race) => String(race.name || "").toLowerCase() === parsedStartRace.toLowerCase())
    : null;
  if (raceOption) profileRace.value = raceOption.key;
  const parsedStartProfession = String(parsedStart.profession || "").trim();
  const professionOption = parsedStartProfession
    ? professions.find((prof) => String(prof || "").toLowerCase() === parsedStartProfession.toLowerCase())
    : null;
  if (professionOption) profileProfession.value = professionOption;
  currentLevel0Stats = parsedStart.level0Stats;
  initAdjustmentState();
  recalcFromLevel0();
  updateDerivedDisplays();
}

function applyProfile(profile) {
  profileActions.applyProfile({
    profile,
    domRefs: profileDomRefs,
    services: profileServices,
    stateAccess: profileStateAccess,
    stateMutators: profileStateMutators,
    helpers: profileHelpers,
    actions: {
      updateEnhanciveImportStatusMessages,
      recalcFromLevel0,
      updateStatDerivedDisplay,
      initAdjustmentState,
      syncSkillAdjustmentState,
      populateAbilitiesFromAscensionState,
      syncAscensionStateFromAbilities,
      updateSkillsImportFlags,
      updateSkillsStatusMessage,
      updateDerivedDisplays,
      updateProfileActionState,
    },
  });
}

function updateArmorWeight() {
  const selected = armorAsg.find((item) => item.key === armorAsgSelect.value);
  if (!selected) return;
  armorWeightInput.value = String(selected.standardWeight);
  if (!useCustomArmorBaseInput?.checked && armorBaseWeightInput) {
    armorBaseWeightInput.value = String(selected.standardWeight);
  }
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

function renderSkillsTable(skills) {
  const visibleSkills = getVisibleSkills(skills);
  const capContext = buildSkillRankCapContext(currentSkills);
  const capsBySkill = capContext.bySkill;
  const renderedPoolHeaders = new Set();
  profileRender.renderSkillsTable({
    skillsTable,
    visibleSkills,
    displaySkillCategoryOrder,
    getDisplaySkillCategory,
    capsBySkill,
    renderedPoolHeaders,
    formatPoolHeaderText,
    getNextRankCostDisplay: (skill) => getNextRankCostDisplay(skill, capContext),
    skillKey,
    spellCircles,
    ascensionState,
    getEffectiveSkillEnhancive,
    skillBonusFromRanks,
    skillsImportUnmatchedKeys,
    skillsImportOffProfessionKeys,
  });

  profileEvents.bindSkillRankInputs({
    skillsTable,
    currentSkills,
    skillKey,
    buildSkillRankCapContext,
    updateSkillsImportFlags,
    updateSkillsStatusMessage,
    updateDerivedDisplays,
  });
}

function updateSkillsImportFlags() {
  const flagSets = logic.getSkillsImportFlagSets({
    currentSkills,
    profession: profileProfession.value,
    professionSpellCircleMap,
    spellCircles,
    skillKeyFn: skillKey,
  });
  skillsImportOffProfessionKeys = flagSets.offProfession;
}

function updateSkillsStatusMessage(prefix = "") {
  const message = logic.buildSkillsStatusMessage({
    currentSkills,
    prefix,
    skillsImportUnmatchedKeys,
    skillsImportOffProfessionKeys,
    skillKeyFn: skillKey,
    profession: profileProfession.value,
  });
  skillsStatus.textContent = message.text;
  skillsStatus.style.color = message.isError ? "#b42318" : "";
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
  profileRender.updateSkillsDerivedDisplay({
    skillsTable,
    currentSkills,
    skillKey,
    ascensionState,
    getEffectiveSkillEnhancive,
    skillBonusFromRanks,
    capsByPool,
    getCapForKey: (key) => capsBySkill.get(key),
    formatPoolHeaderText,
    getNextRankCostDisplay: (skill) => getNextRankCostDisplay(skill, capContext),
  });
  skillsTable.querySelectorAll("tr[data-skill-key]").forEach((row) => {
    const key = row.dataset.skillKey;
    const skill = currentSkills.find((entry) => skillKey(entry.name) === key);
    const cap = capsBySkill.get(key);
    const rankInput = row.querySelector('input[data-skill-rank]');
    if (rankInput && skill) {
      const baseRanks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
      if (document.activeElement !== rankInput) rankInput.value = String(baseRanks);
      rankInput.max = String(cap ? Math.max(cap.maxRanks, baseRanks) : 500);
    }
    row.style.color = skillsImportUnmatchedKeys.has(key) || skillsImportOffProfessionKeys.has(key) ? "#b42318" : "";
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

function normalizeLevel0Stats(level0Stats) {
  return profileState.normalizeLevel0Stats(level0Stats, stats, clamp);
}

function normalizeSkillForCompare(skill) {
  return profileState.normalizeSkillForCompare(skill, normalizeSkillEntry, skillBonusFromRanks);
}

function comparableProfile(record) {
  return profileState.comparableProfile({
    record,
    stats,
    mergeSkillsWithCatalog,
    skillKey,
    normalizeSkillEntry,
    skillBonusFromRanks,
    normalizeBadgeDefaults,
    normalizeEnhanciveEquipmentState: enhanciveImport.normalizeEnhanciveEquipmentState,
    normalizeAscensionAbilities,
    clamp,
    experienceForLevel,
  });
}

function profilesEqual(a, b) {
  return profileState.profilesEqual({ a: comparableProfile(a), b: comparableProfile(b) });
}

function updateProfileDiffHighlights(currentProfile, selectedProfile) {
  profileActions.updateProfileDiffHighlights({
    currentProfile,
    selectedProfile,
    domRefs: profileDomRefs,
    helpers: profileHelpers,
  });
}

function buildCurrentProfileRecord(nameOverride = null) {
  const baseRecord = logic.buildCurrentProfileRecord({
    name: nameOverride == null ? profileName.value : nameOverride,
    raceName: races.find((race) => race.key === profileRace.value)?.name || "Human",
    profession: profileProfession.value,
    level: Number(profileLevel.value),
    experience: Number(profileExperience.value),
    ascensionExperience: currentAscensionExperience,
    ascensionMilestones: currentAscensionMilestones,
    currentAscensionAbilities,
    currentLevel0Stats,
    stats,
    currentSkills,
    ascensionState,
    enhanciveState,
    currentEnhanciveEquipment,
    currentBadgeDefaults,
    normalizeAscensionAbilitiesFn: normalizeAscensionAbilities,
    normalizeBadgeDefaultsFn: normalizeBadgeDefaults,
    normalizeEnhanciveEquipmentState: enhanciveImport.normalizeEnhanciveEquipmentState,
    getDerivedStatRowsFn: getDerivedStatRows,
    collectSkillsFn: collectSkills,
    clampFn: clamp,
  });

  return {
    ...baseRecord,
    defaults: {
      ...baseRecord.defaults,
      armorAsg: armorAsgSelect.value,
      armorWeight: Math.max(0, Number(armorWeightInput.value) || 0),
      useCustomArmorBase: Boolean(useCustomArmorBaseInput?.checked),
      armorBaseWeight: Math.max(0, Number(armorBaseWeightInput?.value) || 0),
      accessoryWeight: Math.max(0, Number(accessoryWeightInput.value) || 0),
      gearWeight: Math.max(0, Number(gearWeightInput.value) || 0),
      silvers: Math.max(0, Number(silversInput.value) || 0),
    },
  };
}

const profileDomRefs = {
  profileName,
  profileRace,
  profileProfession,
  profileLevel,
  profileExperience,
  profileAscensionExperience,
  profileAscensionMilestones,
  profileSelect,
  profileApply,
  reloadProfileButtons,
  saveProfileButtons,
  quickStartSection,
  ascensionSection,
  enhanciveSection,
  infoImport,
  expImport,
  skillsImport,
  ascImport,
  ascMilestonesImport,
  enhanciveListImport,
  enhanciveTotalsImport,
  enhanciveDetailsImport,
  importStatus,
  expImportStatus,
  ascImportStatus,
  ascMilestonesImportStatus,
  armorAsgSelect,
  armorWeightInput,
  useCustomArmorBaseInput,
  armorBaseWeightInput,
  armorBaseDetails,
  accessoryWeightInput,
  gearWeightInput,
  silversInput,
  statGrid,
  skillsTable,
  ascAbilityGroups,
};

const profileServices = {
  storage,
  profileRender,
  profileState,
  enhanciveImport,
  localStorageObject: localStorage,
  selectedProfileKey: storage.SELECTED_PROFILE_KEY,
  normalizeEnhanciveEquipmentState: enhanciveImport.normalizeEnhanciveEquipmentState,
};

const profileStateAccess = {
  getProfiles: () => profiles,
  buildCurrentProfileRecord,
  comparableProfile,
  profilesEqual,
  getCurrentLevel0Stats: () => currentLevel0Stats,
  getAscensionState: () => ascensionState,
  getEnhanciveState: () => enhanciveState,
};

const profileStateMutators = {
  setProfiles: (value) => { profiles = value; },
  setApplyingProfile: (value) => { applyingProfile = value; },
  setCurrentAscensionMilestones: (value) => { currentAscensionMilestones = value; },
  setSkillsImportUnmatchedKeys: (value) => { skillsImportUnmatchedKeys = value; },
  setSkillsImportOffProfessionKeys: (value) => { skillsImportOffProfessionKeys = value; },
  setCurrentEnhanciveEquipment: (value) => { currentEnhanciveEquipment = value; },
  setCurrentSkills: (value) => { currentSkills = value; },
  setCurrentLevel0Stats: (value) => { currentLevel0Stats = value; },
  setCurrentBaseStats: (value) => { currentBaseStats = value; },
  setCurrentAscensionExperience: (value) => { currentAscensionExperience = value; },
  setCurrentAscensionAbilities: (value) => { currentAscensionAbilities = value; },
  setCurrentBadgeDefaults: (value) => { currentBadgeDefaults = value; },
};

const profileHelpers = {
  stats,
  skillKey,
  normalizeSkillEntry,
  normalizeAscensionAbilities,
  parseInfoStartBlock,
  parseInfoBlock,
  races,
  clamp,
  experienceForLevel,
  levelFromExperience,
  normalizeProfileNameForMatch,
  normalizeBadgeDefaults,
  updateArmorWeight,
  mergeSkillsWithCatalog,
  defaultStatMap,
  buildDefaultAscensionAbilities,
};

function updateProfileActionState() {
  profileActions.updateProfileActionState({
    domRefs: profileDomRefs,
    services: profileServices,
    stateAccess: profileStateAccess,
    helpers: profileHelpers,
    updateProfileDiffHighlights: (currentProfile, selectedProfile) => updateProfileDiffHighlights(currentProfile, selectedProfile),
  });
}

function applySectionDefaultVisibility() {
  profileActions.applySectionDefaultVisibility({
    domRefs: profileDomRefs,
  });
}

function reloadSelectedProfile(showStatus = false) {
  return profileActions.reloadSelectedProfile({
    domRefs: profileDomRefs,
    services: profileServices,
    stateMutators: profileStateMutators,
    actions: {
      applyProfile,
      applySectionDefaultVisibility,
      updateProfileActionState,
    },
    showStatus,
  });
}

function resetEditorForNewProfile() {
  profileActions.resetEditorForNewProfile({
    domRefs: profileDomRefs,
    services: profileServices,
    stateMutators: profileStateMutators,
    helpers: profileHelpers,
    updateEnhanciveImportStatusMessages,
    initAdjustmentState,
    updateDerivedDisplays,
    updateProfileActionState,
  });
}

function handleProfileSave(options = {}) {
  return profileActions.handleProfileSave({
    preserveUnsyncedFromExisting: options.preserveUnsyncedFromExisting,
    domRefs: profileDomRefs,
    services: profileServices,
    stateAccess: profileStateAccess,
    stateMutators: profileStateMutators,
    helpers: profileHelpers,
    actions: {
      applyProfile,
      applySectionDefaultVisibility,
    },
  });
}

try {
  buildStatInputs();
  fillSelect(profileRace, races);
  fillSelect(profileProfession, professions.map((name) => ({ key: name, name })));
  fillSelect(armorAsgSelect, armorAsg);
  updateArmorWeight();

  let profiles = storage.loadProfiles();
  profileStateAccess.getProfiles = () => profiles;
  profileStateMutators.setProfiles = (value) => { profiles = value; };
  profileRender.refreshProfileSelect({ profileSelect, profiles });
  renderSkillsTable(currentSkills);
  currentBaseStats = defaultStatMap(50);
  initAdjustmentState();
  updateDerivedDisplays();
  updateProfileActionState();
  applySectionDefaultVisibility();

  profileEvents.bindSelectionControls({
    profileApply,
    reloadProfileButtons,
    profileSelect,
    localStorageObject: localStorage,
    selectedProfileKey: storage.SELECTED_PROFILE_KEY,
    resetEditorForNewProfile,
    applySectionDefaultVisibility,
    updateProfileActionState,
    storage,
    getProfiles: () => profiles,
    applyProfile,
    reloadSelectedProfile,
  });

  profileEvents.bindSaveButtons({
    saveProfileButtons,
    handleProfileSave,
  });

  profileEvents.bindInfoImportEvents({
    infoImport,
    parseInfoStartBlock,
    handleInfoStartParse,
    parseInfoBlock,
    importStatus,
    profileName,
    races,
    profileRace,
    stats,
    clamp,
    currentBaseStats,
    setCurrentLevel0Stats: (value) => { currentLevel0Stats = value; },
    initAdjustmentState,
    updateDerivedDisplays,
  });

  profileEvents.bindExperienceEvents({
    expImport,
    parseExpBlock,
    expImportStatus,
    getSyncingLevelExperience: () => syncingLevelExperience,
    setSyncingLevelExperience: (value) => { syncingLevelExperience = value; },
    profileExperience,
    profileLevel,
    setCurrentAscensionExperience: (value) => { currentAscensionExperience = value; },
    profileAscensionExperience,
    recalcFromLevel0,
    hasCurrentLevel0Stats: () => Boolean(currentLevel0Stats),
    renderSkillsTable,
    getCurrentSkills: () => currentSkills,
    profileAscensionMilestones,
    setCurrentAscensionMilestones: (value) => { currentAscensionMilestones = value; },
    updateDerivedDisplays,
    clamp,
    getSyncingLevelExperience: () => syncingLevelExperience,
    levelFromExperience,
  });

  profileEvents.bindSkillsImportEvents({
    skillsImport,
    parseSkillsBlock,
    setSkillsImportUnmatchedKeys: (value) => { skillsImportUnmatchedKeys = value; },
    setSkillsImportOffProfessionKeys: (value) => { skillsImportOffProfessionKeys = value; },
    updateSkillsStatusMessage,
    canonicalSkillName,
    skillKey,
    skillCatalog,
    setCurrentSkills: (value) => { currentSkills = value; },
    mergeSkillsWithCatalog,
    updateSkillsImportFlags,
    syncSkillAdjustmentState,
    updateDerivedDisplays,
    parseSkillsLevel,
    setSyncingLevelExperience: (value) => { syncingLevelExperience = value; },
    profileLevel,
    setExperienceFromLevel,
    hasCurrentLevel0Stats: () => Boolean(currentLevel0Stats),
    recalcFromLevel0,
  });

  profileEvents.bindArmorAndCoreFieldEvents({
    armorAsgSelect,
    updateArmorWeight,
    useCustomArmorBaseInput,
    armorBaseWeightInput,
    armorBaseDetails,
    armorAsg,
    profileLevel,
    clamp,
    getSyncingLevelExperience: () => syncingLevelExperience,
    setSyncingLevelExperience: (value) => { syncingLevelExperience = value; },
    setExperienceFromLevel,
    hasCurrentLevel0Stats: () => Boolean(currentLevel0Stats),
    recalcFromLevel0,
    renderSkillsTable,
    getCurrentSkills: () => currentSkills,
    profileExperience,
    levelFromExperience,
    profileProfession,
    updateSkillsImportFlags,
    updateSkillsStatusMessage,
    profileRaceSelect: profileRace,
    updateDerivedDisplays,
  });

  profileEvents.bindAscensionImportEvents({
    ascImport,
    applyAscList,
    ascImportStatus,
    ascMilestonesImport,
    parseAscMilestonesBlock,
    ascMilestonesImportStatus,
    setCurrentAscensionMilestones: (value) => { currentAscensionMilestones = value; },
    profileAscensionMilestones,
    updateDerivedDisplays,
    ascShowTrainedOnly,
    renderAscensionTables,
    updateAscensionStatus,
  });

  profileEvents.bindEnhanciveImportEvents({
    enhanciveListImport,
    enhanciveTotalsImport,
    enhanciveDetailsImport,
    rebuildImportedEnhanciveState,
    updateDerivedDisplays,
    addManualEnhItem,
    getCurrentEnhanciveEquipment: () => currentEnhanciveEquipment,
    createManualEnhanciveItem,
  });

  profileEvents.bindDirtyStateEvents({
    mainCalculator: document.querySelector("main.calculator"),
    isApplyingProfile: () => applyingProfile,
    updateProfileActionState,
    skillsShowTrainedOnly,
    renderSkillsTable,
    getCurrentSkills: () => currentSkills,
    runProfileSelfTests,
    runProfileTestsBtn,
  });

  const initiallySelectedProfileId = localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "";
  if (initiallySelectedProfileId) {
    const initialProfile = storage.findProfile(profiles, initiallySelectedProfileId);
    if (initialProfile) {
      profileSelect.value = initiallySelectedProfileId;
      applyProfile(initialProfile);
      applySectionDefaultVisibility();
    } else {
      localStorage.removeItem(storage.SELECTED_PROFILE_KEY);
      profileSelect.value = "";
      updateProfileActionState();
    }
  }

  profileGstools.importGstoolsPayloadFromHash({
    windowObject: window,
    stripMarkupTags,
    infoImport,
    skillsImport,
    expImport,
    ascImport,
    ascMilestonesImport,
    enhanciveListImport,
    enhanciveTotalsImport,
    enhanciveDetailsImport,
    profileName,
    handleProfileSave,
    importStatus,
  });
} catch (error) {
  if (importStatus) {
    importStatus.textContent = `Profile page init error: ${error.message || error}`;
    importStatus.style.color = "#b42318";
  }
  throw error;
}
