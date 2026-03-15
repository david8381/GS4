const storage = globalThis.GS4Storage;

if (!storage) throw new Error("GS4Storage is not loaded. Ensure shared.js is loaded before manager.js.");

const bodyEl = document.getElementById("profileManagerBody");
const statusEl = document.getElementById("profileManagerStatus");
const newProfileBtn = document.getElementById("newProfileBtn");
const importJsonBtn = document.getElementById("importJsonBtn");
const importJsonFile = document.getElementById("importJsonFile");
const importJsonStatus = document.getElementById("importJsonStatus");

function loadProfiles() {
  return storage.loadProfiles();
}

function saveProfiles(profiles) {
  storage.saveProfiles(profiles);
}

function openProfileEditor(profileId) {
  if (profileId) localStorage.setItem(storage.SELECTED_PROFILE_KEY, profileId);
  else localStorage.removeItem(storage.SELECTED_PROFILE_KEY);
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
      const selectedId = localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "";
      if (selectedId === profile.id) localStorage.removeItem(storage.SELECTED_PROFILE_KEY);
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

importJsonBtn?.addEventListener("click", () => {
  if (importJsonFile) importJsonFile.click();
});

importJsonFile?.addEventListener("change", () => {
  const file = importJsonFile.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      if (!payload || typeof payload !== "object") {
        throw new Error("File does not contain a valid JSON object.");
      }
      const blocks = payload.blocks;
      if (!blocks || typeof blocks !== "object") {
        throw new Error("JSON is missing a 'blocks' object. Expected a gs4tools capture file.");
      }
      sessionStorage.setItem("gs4toolsImportPayload", JSON.stringify(payload));
      window.location.assign("./profile.html");
    } catch (error) {
      if (importJsonStatus) {
        importJsonStatus.textContent = `Import failed: ${error.message || "unknown error"}`;
        importJsonStatus.style.color = "var(--error, #b42318)";
      }
    }
  };
  reader.onerror = () => {
    if (importJsonStatus) {
      importJsonStatus.textContent = "Could not read the selected file.";
      importJsonStatus.style.color = "var(--error, #b42318)";
    }
  };
  reader.readAsText(file);
  importJsonFile.value = "";
});

window.addEventListener("focus", render);

render();
