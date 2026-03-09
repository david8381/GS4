(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ProfileActions = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function clearProfileDiffHighlights() {
    document.querySelectorAll(".changed-from-profile").forEach((element) => {
      element.classList.remove("changed-from-profile");
    });
  }

  function toggleDiffHighlight(element, changed) {
    if (!element) return;
    element.classList.toggle("changed-from-profile", Boolean(changed));
  }

  function mapSkillsByKey(skills = [], skillKey) {
    const map = new Map();
    skills.forEach((skill) => {
      map.set(skillKey(skill.name), skill);
    });
    return map;
  }

  function updateProfileDiffHighlights({ currentProfile, selectedProfile, domRefs, helpers }) {
    const {
      profileName,
      profileRace,
      profileProfession,
      profileLevel,
      profileExperience,
      profileAscensionExperience,
      profileAscensionMilestones,
      armorAsgSelect,
      armorWeightInput,
      useCustomArmorBaseInput,
      armorBaseWeightInput,
      accessoryWeightInput,
      gearWeightInput,
      silversInput,
      statGrid,
      skillsTable,
      ascAbilityGroups,
    } = domRefs;
    const { stats, skillKey } = helpers;

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
    });

    const currentSkillsMap = mapSkillsByKey(currentProfile.skills, skillKey);
    const selectedSkillsMap = mapSkillsByKey(selectedProfile.skills, skillKey);
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
  }

  function updateProfileActionState({ domRefs, services, stateAccess, helpers, updateProfileDiffHighlights }) {
    const { profileSelect, reloadProfileButtons, saveProfileButtons, profileApply } = domRefs;
    const { storage } = services;
    const { getProfiles, buildCurrentProfileRecord, comparableProfile, profilesEqual } = stateAccess;

    const profiles = getProfiles();
    const selected = profileSelect.value ? storage.findProfile(profiles, profileSelect.value) : null;
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

  function applySectionDefaultVisibility({ domRefs }) {
    const { quickStartSection, ascensionSection, enhanciveSection, profileSelect } = domRefs;
    if (quickStartSection) quickStartSection.open = !Boolean(profileSelect.value);
    if (ascensionSection) ascensionSection.open = false;
    if (enhanciveSection) enhanciveSection.open = false;
  }

  function reloadSelectedProfile({
    domRefs,
    services,
    stateMutators,
    actions,
    showStatus = false,
  }) {
    const { profileSelect, importStatus } = domRefs;
    const { storage, profileRender } = services;
    const { setProfiles } = stateMutators;
    const { applyProfile, applySectionDefaultVisibility, updateProfileActionState } = actions;
    const selected = profileSelect.value;
    if (!selected) return false;
    const profiles = storage.loadProfiles();
    setProfiles(profiles);
    profileRender.refreshProfileSelect({ profileSelect, profiles });
    profileSelect.value = selected;
    const profile = storage.findProfile(profiles, selected);
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

  function resetEditorForNewProfile({
    domRefs,
    services,
    stateMutators,
    helpers,
    updateEnhanciveImportStatusMessages,
    initAdjustmentState,
    updateDerivedDisplays,
    updateProfileActionState,
  }) {
    const {
      profileName,
      profileRace,
      profileProfession,
      profileLevel,
      profileExperience,
      profileAscensionExperience,
      profileAscensionMilestones,
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
      useCustomArmorBaseInput,
      armorBaseWeightInput,
      armorBaseDetails,
      accessoryWeightInput,
      gearWeightInput,
      silversInput,
    } = domRefs;
    const { enhanciveImport } = services;
    const {
      races,
      updateArmorWeight,
      mergeSkillsWithCatalog,
      defaultStatMap,
      buildDefaultAscensionAbilities,
      normalizeBadgeDefaults,
    } = helpers;
    const {
      setApplyingProfile,
      setCurrentAscensionMilestones,
      setSkillsImportUnmatchedKeys,
      setSkillsImportOffProfessionKeys,
      setCurrentEnhanciveEquipment,
      setCurrentSkills,
      setCurrentLevel0Stats,
      setCurrentBaseStats,
      setCurrentAscensionExperience,
      setCurrentAscensionAbilities,
      setCurrentBadgeDefaults,
    } = stateMutators;

    setApplyingProfile(true);
    profileName.value = "";
    profileRace.value = races.find((race) => race.name === "Human")?.key || races[0].key;
    profileProfession.value = "Wizard";
    profileLevel.value = "0";
    profileExperience.value = "0";
    if (profileAscensionExperience) profileAscensionExperience.value = "0";
    setCurrentAscensionMilestones(0);
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
    setSkillsImportUnmatchedKeys(new Set());
    setSkillsImportOffProfessionKeys(new Set());
    updateProfileActionState(); // keep top-bar state current while clearing fields
    ascImportStatus.textContent = "Paste ASC LIST to load current ascension ranks.";
    ascImportStatus.style.color = "";
    if (ascMilestonesImportStatus) {
      ascMilestonesImportStatus.textContent = "Paste ASC MILESTONES to load milestones reached.";
      ascMilestonesImportStatus.style.color = "";
    }
    setCurrentEnhanciveEquipment(enhanciveImport.defaultEnhanciveEquipmentState());
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

    setCurrentSkills(mergeSkillsWithCatalog([]));
    setCurrentLevel0Stats(defaultStatMap(50));
    setCurrentBaseStats(defaultStatMap(50));
    setCurrentAscensionExperience(0);
    setCurrentAscensionAbilities(buildDefaultAscensionAbilities());
    setCurrentBadgeDefaults(normalizeBadgeDefaults(null));
    initAdjustmentState();
    updateDerivedDisplays();
    setApplyingProfile(false);
    updateProfileActionState();
  }

  function applyProfile({
    profile,
    domRefs,
    services,
    stateAccess,
    stateMutators,
    helpers,
    actions,
  }) {
    const {
      profileName,
      profileRace,
      profileProfession,
      profileLevel,
      profileExperience,
      profileAscensionExperience,
      profileAscensionMilestones,
      enhanciveListImport,
      enhanciveTotalsImport,
      enhanciveDetailsImport,
      armorAsgSelect,
      armorWeightInput,
      useCustomArmorBaseInput,
      armorBaseWeightInput,
      armorBaseDetails,
      accessoryWeightInput,
      gearWeightInput,
      silversInput,
    } = domRefs;
    const { enhanciveImport } = services;
    const {
      getAscensionState,
      getEnhanciveState,
    } = stateAccess;
    const {
      setApplyingProfile,
      setCurrentAscensionExperience,
      setCurrentAscensionMilestones,
      setCurrentAscensionAbilities,
      setCurrentEnhanciveEquipment,
      setCurrentLevel0Stats,
      setCurrentBaseStats,
      setCurrentBadgeDefaults,
      setCurrentSkills,
      setSkillsImportUnmatchedKeys,
    } = stateMutators;
    const {
      races,
      experienceForLevel,
      levelFromExperience,
      clamp,
      stats,
      normalizeAscensionAbilities,
      normalizeBadgeDefaults,
      mergeSkillsWithCatalog,
      normalizeSkillEntry,
      skillKey,
    } = helpers;
    const {
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
    } = actions;

    const ascensionState = getAscensionState();
    const enhanciveState = getEnhanciveState();

    setApplyingProfile(true);
    profileName.value = profile.name;
    const profileRaceName = String(profile?.race || "").trim();
    const raceOption = profileRaceName
      ? races.find((race) => String(race.name || "").toLowerCase() === profileRaceName.toLowerCase())
      : null;
    if (raceOption) profileRace.value = raceOption.key;
    if (profile.profession) profileProfession.value = profile.profession;
    const normalizedExperience = Math.max(0, Math.trunc(Number(profile.experience) || experienceForLevel(profile.level ?? 0)));
    profileExperience.value = String(normalizedExperience);
    profileLevel.value = String(levelFromExperience(normalizedExperience));

    const nextAscExp = Math.max(0, Math.trunc(Number(profile.ascensionExperience) || 0));
    setCurrentAscensionExperience(nextAscExp);
    if (profileAscensionExperience) profileAscensionExperience.value = String(nextAscExp);

    const nextMilestones = clamp(Math.trunc(Number(profile.ascensionMilestones) || 0), 0, 10);
    setCurrentAscensionMilestones(nextMilestones);
    if (profileAscensionMilestones) profileAscensionMilestones.value = String(nextMilestones);

    setCurrentAscensionAbilities(normalizeAscensionAbilities(Array.isArray(profile.ascensionAbilities) ? profile.ascensionAbilities : []));
    const nextEnhanciveEquipment = enhanciveImport.normalizeEnhanciveEquipmentState(profile?.equipment?.enhancives);
    setCurrentEnhanciveEquipment(nextEnhanciveEquipment);
    if (enhanciveListImport) enhanciveListImport.value = nextEnhanciveEquipment.raw.list || "";
    if (enhanciveTotalsImport) enhanciveTotalsImport.value = nextEnhanciveEquipment.raw.totals || "";
    if (enhanciveDetailsImport) enhanciveDetailsImport.value = nextEnhanciveEquipment.raw.totalsDetails || "";
    updateEnhanciveImportStatusMessages();

    const nextLevel0Stats = profile.level0Stats || null;
    setCurrentLevel0Stats(nextLevel0Stats);
    if (nextLevel0Stats) {
      recalcFromLevel0();
    } else if (profile.stats) {
      const nextBaseStats = {};
      stats.forEach((stat) => {
        nextBaseStats[stat.key] = clamp(Number(profile.stats?.[stat.key]?.base ?? 50), 1, 200);
      });
      setCurrentBaseStats(nextBaseStats);
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
      setCurrentBadgeDefaults(normalizeBadgeDefaults(profile.defaults.badge));
    } else {
      armorAsgSelect.value = "none";
      armorWeightInput.value = "0";
      if (useCustomArmorBaseInput) useCustomArmorBaseInput.checked = false;
      if (armorBaseWeightInput) {
        armorBaseWeightInput.value = "0";
        armorBaseWeightInput.disabled = true;
      }
      if (armorBaseDetails) armorBaseDetails.open = false;
      accessoryWeightInput.value = "0";
      gearWeightInput.value = "0";
      silversInput.value = "0";
      setCurrentBadgeDefaults(normalizeBadgeDefaults(null));
    }

    if (profile.skills) {
      const nextSkills = mergeSkillsWithCatalog(profile.skills.map((skill) => normalizeSkillEntry(skill)));
      setCurrentSkills(nextSkills);
      syncSkillAdjustmentState();
      nextSkills.forEach((skill) => {
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
      setCurrentSkills(mergeSkillsWithCatalog([]));
      syncSkillAdjustmentState();
    }

    if (!Array.isArray(profile.ascensionAbilities) || !profile.ascensionAbilities.length) {
      populateAbilitiesFromAscensionState();
      syncAscensionStateFromAbilities();
    }

    setSkillsImportUnmatchedKeys(new Set());
    updateSkillsImportFlags();
    updateSkillsStatusMessage();
    updateDerivedDisplays();
    setApplyingProfile(false);
    updateProfileActionState();
  }

  function handleProfileSave({
    preserveUnsyncedFromExisting = false,
    domRefs,
    services,
    stateAccess,
    stateMutators,
    helpers,
    actions,
  }) {
    const {
      profileSelect,
      infoImport,
      profileName,
      importStatus,
      profileRace,
      profileProfession,
      profileLevel,
      profileExperience,
    } = domRefs;
    const {
      storage,
      profileState,
      profileRender,
      localStorageObject,
      selectedProfileKey,
      normalizeEnhanciveEquipmentState,
    } = services;
    const { getCurrentLevel0Stats, buildCurrentProfileRecord } = stateAccess;
    const { setProfiles } = stateMutators;
    const {
      parseInfoStartBlock,
      parseInfoBlock,
      races,
      clamp,
      experienceForLevel,
      normalizeProfileNameForMatch,
      normalizeBadgeDefaults,
    } = helpers;
    const { applyProfile, applySectionDefaultVisibility } = actions;

    let saveStage = "load profiles";
    try {
      let nextProfiles = storage.loadProfiles();
      setProfiles(nextProfiles);
      saveStage = "parse imported info";
      const parsedInfoStart = parseInfoStartBlock(infoImport.value);
      const parsedInfo = parsedInfoStart && !parsedInfoStart.error ? parsedInfoStart : parseInfoBlock(infoImport.value);
      const name = profileName.value.trim() || (parsedInfo ? parsedInfo.name : "");

      if (!name) {
        importStatus.textContent = "Paste INFO output or enter a profile name.";
        return null;
      }

      saveStage = "build current record";
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
        level0Stats: parsedInfoStart?.level0Stats || getCurrentLevel0Stats(),
      };

      saveStage = "match existing profile";
      const selectedId = profileSelect.value || "";
      const normalizedName = normalizeProfileNameForMatch(name);
      const existingById = selectedId ? nextProfiles.find((entry) => entry.id === selectedId) : null;
      const existingByName = nextProfiles.find((entry) => normalizeProfileNameForMatch(entry.name) === normalizedName);
      const isUpdate = Boolean(existingById || existingByName);
      const existing = existingById || existingByName || null;
      const id = existingById?.id || existingByName?.id || `profile-${Date.now()}`;
      record.id = id;

      if (preserveUnsyncedFromExisting && existing) {
        saveStage = "merge existing profile state";
        record = profileState.mergeImportedProfileState({
          existing,
          record,
          preserveUnsyncedFromExisting,
          normalizeBadgeDefaults,
          normalizeEnhanciveEquipmentState,
        });
      }

      saveStage = "persist profile";
      nextProfiles = nextProfiles.filter((entry) => entry.id !== id).concat(record);
      storage.saveProfiles(nextProfiles);
      setProfiles(nextProfiles);
      profileRender.refreshProfileSelect({ profileSelect, profiles: nextProfiles });
      profileSelect.value = id;
      localStorageObject.setItem(selectedProfileKey, id);
      importStatus.textContent = `${isUpdate ? "Updated" : "Created"} profile: ${record.name}`;

      saveStage = "apply profile";
      applyProfile(record);
      applySectionDefaultVisibility();
      return record;
    } catch (error) {
      error.message = `${saveStage}: ${error.message || "unknown error"}`;
      throw error;
    }
  }

  return {
    updateProfileDiffHighlights,
    updateProfileActionState,
    applySectionDefaultVisibility,
    reloadSelectedProfile,
    resetEditorForNewProfile,
    applyProfile,
    handleProfileSave,
  };
});
