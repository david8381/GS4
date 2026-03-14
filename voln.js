(function () {
  const storage = globalThis.GS4Storage;
  const volnData = globalThis.GS4_VOLN_DATA;

  if (!storage) throw new Error("GS4Storage is not loaded. Ensure shared.js is loaded before voln.js.");
  if (!volnData) throw new Error("GS4_VOLN_DATA is not loaded. Ensure data/societies/voln.js is loaded before voln.js.");

  const profileSelect = document.getElementById("volnProfileSelect");
  const profileLoad = document.getElementById("volnProfileLoad");
  const status = document.getElementById("volnStatus");
  const currentStep = document.getElementById("volnCurrentStep");
  const currentFavor = document.getElementById("volnCurrentFavor");
  const sinceStep = document.getElementById("volnSinceStep");
  const nextStepCost = document.getElementById("volnNextStepCost");
  const characterName = document.getElementById("volnCharacterName");
  const lastUpdated = document.getElementById("volnLastUpdated");
  const atLastStepChange = document.getElementById("volnAtLastStepChange");
  const remainingFavor = document.getElementById("volnRemainingFavor");
  const historyTable = document.getElementById("volnHistoryTable");
  const atLastStepInput = document.getElementById("volnAtLastStepInput");
  const atLastStepSave = document.getElementById("volnAtLastStepSave");

  function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString() : "—";
  }

  function loadProfiles() {
    return storage.loadProfiles();
  }

  function refreshProfileSelect() {
    const profiles = loadProfiles();
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
    const profiles = loadProfiles();
    return storage.findProfile(profiles, profileSelect.value || localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "");
  }

  function setEditControlsEnabled(enabled) {
    if (atLastStepInput) atLastStepInput.disabled = !enabled;
    if (atLastStepSave) atLastStepSave.disabled = !enabled;
  }

  function cloneFavorState(favor) {
    if (!favor || typeof favor !== "object") {
      return {
        current: null,
        atLastStepChange: null,
        history: [],
        lastUpdated: "",
      };
    }
    return {
      current: Number.isFinite(Number(favor.current)) ? Math.max(0, Math.trunc(Number(favor.current))) : null,
      atLastStepChange: Number.isFinite(Number(favor.atLastStepChange))
        ? Math.max(0, Math.trunc(Number(favor.atLastStepChange)))
        : null,
      history: Array.isArray(favor.history) ? favor.history.map((entry) => ({ ...entry })) : [],
      lastUpdated: String(favor.lastUpdated || ""),
    };
  }

  function saveAtLastStepBaseline() {
    const profile = getSelectedProfile();
    if (!profile) {
      status.textContent = "Load a Voln profile before editing favor at the last step change.";
      status.style.color = "#b42318";
      return;
    }
    if (String(profile.society?.key || "") !== "voln") {
      status.textContent = "Only Voln profiles can store a favor changeover value.";
      status.style.color = "#b42318";
      return;
    }
    const rawValue = String(atLastStepInput?.value || "").trim();
    if (!rawValue) {
      status.textContent = "Enter a favor value to save for the last Voln step change.";
      status.style.color = "#b42318";
      return;
    }
    const baseline = Number(rawValue);
    if (!Number.isFinite(baseline) || baseline < 0) {
      status.textContent = "Favor at last step change must be a non-negative number.";
      status.style.color = "#b42318";
      return;
    }

    const profiles = loadProfiles();
    const selected = storage.findProfile(profiles, profile.id);
    if (!selected) {
      status.textContent = "Selected profile could not be found in storage.";
      status.style.color = "#b42318";
      return;
    }

    const currentFavorState = cloneFavorState(selected.society?.favor);
    const nextFavorState = {
      ...currentFavorState,
      atLastStepChange: Math.max(0, Math.trunc(baseline)),
    };
    const nextProfile = {
      ...selected,
      society: {
        ...selected.society,
        favor: nextFavorState,
      },
    };
    const nextProfiles = profiles.map((entry) => (entry.id === selected.id ? nextProfile : entry));
    storage.saveProfiles(nextProfiles);
    localStorage.setItem(storage.SELECTED_PROFILE_KEY, selected.id);
    status.textContent = "Updated favor at last step change for the selected profile.";
    status.style.color = "#1f4e42";
    renderProfile();
  }

  function calculateNextStepCost(profile, step) {
    const nextStep = Math.min(step + 1, Number(volnData.max_rank) || 26);
    if (nextStep <= step) return null;
    const nextAbility = Array.isArray(volnData.abilities)
      ? volnData.abilities.find((ability) => Number(ability.rank_required) === nextStep)
      : null;
    const advancementCost = nextAbility?.advancement_cost;
    if (!advancementCost) return null;
    const level = Math.max(0, Math.trunc(Number(profile?.level) || 0));
    const base = Number(advancementCost.base) || 0;
    const factor = Number(advancementCost.factor) || 0;
    return Math.ceil(base + ((level * level * factor) / 3));
  }

  function renderHistory(history) {
    historyTable.innerHTML = "";
    const entries = Array.isArray(history) ? history.slice().reverse() : [];
    if (!entries.length) {
      const row = document.createElement("tr");
      row.innerHTML = '<td colspan="4">No Voln history captured yet.</td>';
      historyTable.appendChild(row);
      return;
    }
    entries.forEach((entry) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${formatNumber(entry.step)}</td>
        <td>${entry.previousStep == null ? "—" : formatNumber(entry.previousStep)}</td>
        <td>${formatNumber(entry.favor)}</td>
        <td>${entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "—"}</td>
      `;
      historyTable.appendChild(row);
    });
  }

  function renderProfile() {
    const profile = getSelectedProfile();
    if (!profile) {
      currentStep.textContent = "—";
      currentFavor.textContent = "—";
      sinceStep.textContent = "—";
      nextStepCost.textContent = "—";
      characterName.textContent = "No profile loaded";
      lastUpdated.textContent = "No captured favor yet";
      atLastStepChange.textContent = "Favor at last step change: —";
      remainingFavor.textContent = "Remaining to next step: —";
      status.textContent = "Load a Voln character profile to review captured favor progress.";
      status.style.color = "";
      if (atLastStepInput) atLastStepInput.value = "";
      setEditControlsEnabled(false);
      renderHistory([]);
      return;
    }

    localStorage.setItem(storage.SELECTED_PROFILE_KEY, profile.id);
    const society = profile.society || {};
    const favor = society.favor || null;
    if (String(society.key || "") !== "voln") {
      currentStep.textContent = "—";
      currentFavor.textContent = "—";
      sinceStep.textContent = "—";
      nextStepCost.textContent = "—";
      characterName.textContent = profile.name || "Loaded profile";
      lastUpdated.textContent = "Not a Voln character";
      atLastStepChange.textContent = "Favor at last step change: —";
      remainingFavor.textContent = "Remaining to next step: —";
      status.textContent = `${profile.name || "Loaded profile"} is not currently marked as a Voln character.`;
      status.style.color = "#b42318";
      if (atLastStepInput) atLastStepInput.value = "";
      setEditControlsEnabled(false);
      renderHistory([]);
      return;
    }

    const step = Math.max(0, Math.trunc(Number(society.rank) || 0));
    const currentFavorValue = favor && Number.isFinite(Number(favor.current)) ? Math.max(0, Math.trunc(Number(favor.current))) : null;
    const atLastStepValue = favor && Number.isFinite(Number(favor.atLastStepChange)) ? Math.max(0, Math.trunc(Number(favor.atLastStepChange))) : null;
    const sinceStepValue = currentFavorValue != null && atLastStepValue != null ? Math.max(0, currentFavorValue - atLastStepValue) : null;
    const nextCost = calculateNextStepCost(profile, step);
    const remaining = nextCost != null && sinceStepValue != null ? Math.max(0, nextCost - sinceStepValue) : null;

    currentStep.textContent = String(step);
    currentFavor.textContent = formatNumber(currentFavorValue);
    sinceStep.textContent = formatNumber(sinceStepValue);
    nextStepCost.textContent = formatNumber(nextCost);
    characterName.textContent = profile.name || "Loaded profile";
    lastUpdated.textContent = favor?.lastUpdated ? `Last updated ${new Date(favor.lastUpdated).toLocaleString()}` : "No captured favor yet";
    atLastStepChange.textContent = `Favor at last step change: ${formatNumber(atLastStepValue)}`;
    remainingFavor.textContent = `Remaining to next step: ${formatNumber(remaining)}`;
    status.textContent = favor
      ? "Voln favor progress is loaded from the profile snapshot."
      : "No favor snapshot stored yet. Run ;gs4tools sync or ;gs4tools collect voln.";
    status.style.color = "";
    if (atLastStepInput) {
      atLastStepInput.value = atLastStepValue == null ? "" : String(atLastStepValue);
    }
    setEditControlsEnabled(true);
    renderHistory(favor?.history || []);
  }

  refreshProfileSelect();
  renderProfile();

  profileLoad.addEventListener("click", renderProfile);
  profileSelect.addEventListener("change", renderProfile);
  atLastStepSave?.addEventListener("click", saveAtLastStepBaseline);
  atLastStepInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") saveAtLastStepBaseline();
  });
})();
