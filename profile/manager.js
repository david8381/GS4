const PROFILE_KEY = "gs4.characterProfiles";
const SELECTED_PROFILE_KEY = "gs4.selectedProfileId";

const bodyEl = document.getElementById("profileManagerBody");
const statusEl = document.getElementById("profileManagerStatus");
const newProfileBtn = document.getElementById("newProfileBtn");

function loadProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || "[]");
    if (Array.isArray(stored)) return stored;
  } catch (_error) {
    return [];
  }
  return [];
}

function saveProfiles(profiles) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
}

function openProfileEditor(profileId) {
  if (profileId) localStorage.setItem(SELECTED_PROFILE_KEY, profileId);
  else localStorage.removeItem(SELECTED_PROFILE_KEY);
  window.location.assign("./profile.html");
}

function render() {
  const profiles = loadProfiles().slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  bodyEl.innerHTML = "";

  if (!profiles.length) {
    statusEl.textContent = "No saved profiles yet.";
    return;
  }

  statusEl.textContent = `${profiles.length} profile${profiles.length === 1 ? "" : "s"} saved.`;
  profiles.forEach((profile) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = profile.name || "Unnamed";
    row.appendChild(nameCell);

    const raceCell = document.createElement("td");
    raceCell.textContent = profile.race || "—";
    row.appendChild(raceCell);

    const profCell = document.createElement("td");
    profCell.textContent = profile.profession || "—";
    row.appendChild(profCell);

    const levelCell = document.createElement("td");
    levelCell.textContent = String(profile.level ?? "—");
    row.appendChild(levelCell);

    const actionsCell = document.createElement("td");
    const actionRow = document.createElement("div");
    actionRow.className = "inline-actions";

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "btn tiny";
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => openProfileEditor(profile.id));
    actionRow.appendChild(openBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn tiny ghost";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      const confirmed = window.confirm(`Delete profile "${profile.name || "Unnamed"}"? This cannot be undone.`);
      if (!confirmed) return;
      const next = loadProfiles().filter((entry) => entry.id !== profile.id);
      saveProfiles(next);
      const selectedId = localStorage.getItem(SELECTED_PROFILE_KEY) || "";
      if (selectedId === profile.id) localStorage.removeItem(SELECTED_PROFILE_KEY);
      render();
      window.dispatchEvent(new Event("storage"));
    });
    actionRow.appendChild(deleteBtn);

    actionsCell.appendChild(actionRow);
    row.appendChild(actionsCell);

    bodyEl.appendChild(row);
  });
}

newProfileBtn?.addEventListener("click", () => openProfileEditor(""));

window.addEventListener("focus", render);

render();
