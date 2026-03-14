(function () {
  const storage = globalThis.GS4Storage;
  const dataSource = globalThis.GS4_DATA;

  if (!storage) throw new Error("GS4Storage is not loaded. Ensure shared.js is loaded before experience.js.");
  if (!dataSource) throw new Error("GS4_DATA is not loaded. Ensure data/gs4-data.js is loaded before experience.js.");

  const profileSelect = document.getElementById("experienceProfileSelect");
  const profileLoad = document.getElementById("experienceProfileLoad");
  const status = document.getElementById("experienceStatus");
  const characterName = document.getElementById("experienceCharacterName");
  const levelValue = document.getElementById("experienceLevel");
  const totalValue = document.getElementById("experienceTotal");
  const nextLevelValue = document.getElementById("experienceNextLevel");
  const ascensionValue = document.getElementById("experienceAscension");
  const thresholds = Array.isArray(dataSource.levelThresholds) ? dataSource.levelThresholds : [];

  function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString() : "—";
  }

  function refreshProfileSelect() {
    const profiles = storage.loadProfiles();
    const selectedId = localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "";
    profileSelect.innerHTML = '<option value="">Select from Profile</option>';
    profiles.forEach((profile) => {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.name;
      profileSelect.appendChild(option);
    });
    if (selectedId && profiles.some((profile) => profile.id === selectedId)) {
      profileSelect.value = selectedId;
    }
  }

  function getSelectedProfile() {
    const profiles = storage.loadProfiles();
    return storage.findProfile(profiles, profileSelect.value || localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "");
  }

  function renderProfile() {
    const profile = getSelectedProfile();
    if (!profile) {
      levelValue.textContent = "—";
      totalValue.textContent = "—";
      nextLevelValue.textContent = "To next level: —";
      ascensionValue.textContent = "—";
      characterName.textContent = "No profile loaded";
      status.textContent = "Load a profile to review current level and experience data.";
      return;
    }

    localStorage.setItem(storage.SELECTED_PROFILE_KEY, profile.id);
    const level = Math.max(0, Math.trunc(Number(profile.level) || 0));
    const experience = Math.max(0, Math.trunc(Number(profile.experience) || 0));
    const ascensionExperience = Math.max(0, Math.trunc(Number(profile.ascensionExperience) || 0));
    const nextThreshold = level < thresholds.length ? thresholds[level + 1] : null;
    const toNext = Number.isFinite(Number(nextThreshold)) ? Math.max(0, Number(nextThreshold) - experience) : null;

    levelValue.textContent = String(level);
    totalValue.textContent = formatNumber(experience);
    nextLevelValue.textContent = `To next level: ${formatNumber(toNext)}`;
    ascensionValue.textContent = formatNumber(ascensionExperience);
    characterName.textContent = profile.name || "Loaded profile";
    status.textContent = "Experience values are loaded from the saved profile snapshot.";
  }

  refreshProfileSelect();
  renderProfile();

  profileLoad.addEventListener("click", renderProfile);
  profileSelect.addEventListener("change", renderProfile);
})();
