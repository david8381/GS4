(() => {
const SITE_PROFILE_KEY = "gs4.characterProfiles";
const SITE_SELECTED_PROFILE_KEY = "gs4.selectedProfileId";
const SITE_VERSION = "0.1.0";

function loadProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem(SITE_PROFILE_KEY) || "[]");
    if (Array.isArray(stored)) return stored;
  } catch (error) {
    return [];
  }
  return [];
}

function getPageProfileElements() {
  const select =
    document.getElementById("profileSelect") ||
    document.getElementById("profileSelectCalc") ||
    document.getElementById("badgeProfileSelect");
  const loadButton =
    document.getElementById("profileApply") ||
    document.getElementById("profileLoad") ||
    document.getElementById("profileLoadCalc") ||
    document.getElementById("badgeProfileLoad");
  const updateButton =
    document.getElementById("profileSave") ||
    document.getElementById("profileDefaultsSave") ||
    document.getElementById("badgeProfileSave");
  return { select, loadButton, updateButton };
}

function syncPageSelect(profileId) {
  const { select } = getPageProfileElements();
  if (!select) return;
  const target = profileId || "";
  select.value = target;
  if (target === "") {
    const emptyOption = Array.from(select.options).find((option) => option.value === "");
    if (emptyOption) {
      select.selectedIndex = emptyOption.index;
    }
  } else if (select.value !== target) {
    const emptyOption = Array.from(select.options).find((option) => option.value === "");
    if (emptyOption) {
      select.selectedIndex = emptyOption.index;
    }
  }
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function mirrorButtonState(headerButton, pageButton) {
  if (!headerButton) return;
  headerButton.classList.remove("attention", "success-attention");
  if (!pageButton) return;
  if (pageButton.classList.contains("attention")) {
    headerButton.classList.add("attention");
  }
  if (pageButton.classList.contains("success-attention")) {
    headerButton.classList.add("success-attention");
  }
}

function refreshHeaderProfileControls() {
  const headerSelect = document.getElementById("headerProfileSelect");
  const headerLoad = document.getElementById("headerProfileLoad");
  const headerUpdate = document.getElementById("headerProfileUpdate");
  if (!headerSelect || !headerLoad) return;

  const profiles = loadProfiles();
  const selected = localStorage.getItem(SITE_SELECTED_PROFILE_KEY) || "";
  headerSelect.innerHTML = '<option value="">New Profile</option>';
  profiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.name;
    headerSelect.appendChild(option);
  });
  if (selected && profiles.some((profile) => profile.id === selected)) {
    headerSelect.value = selected;
  } else if (selected) {
    localStorage.removeItem(SITE_SELECTED_PROFILE_KEY);
    headerSelect.value = "";
  } else {
    headerSelect.value = "";
  }

  const { loadButton, updateButton } = getPageProfileElements();
  const hasSelection = Boolean(headerSelect.value);
  headerLoad.disabled = !hasSelection || !loadButton;
  mirrorButtonState(headerLoad, loadButton);
  if (headerUpdate) {
    headerUpdate.disabled = !hasSelection || !updateButton;
    mirrorButtonState(headerUpdate, updateButton);
  }
}

function renderHeader() {
  const headerSlot = document.querySelector("[data-header]");
  if (!headerSlot) return;

  const page = document.body.dataset.page || "";
  const homeAttrs = page === "home" ? 'aria-current="page"' : "";
  headerSlot.innerHTML = `
    <header class="site-header">
      <div class="brand">GS4 Tools</div>
      <div class="header-actions">
        <a class="home-link" href="index.html" ${homeAttrs}>Home</a>
        <a class="home-link" href="profile.html"${page === "profiles" ? ' aria-current="page"' : ""}>Manage Profiles</a>
        <select id="headerProfileSelect" class="header-profile-select" aria-label="Selected Profile">
          <option value="">New Profile</option>
        </select>
        <button class="btn" id="headerProfileLoad" type="button">Reload from Profile</button>
        ${page === "profiles" ? '<button class="btn" id="headerProfileUpdate" type="button">Update</button>' : ""}
        <span class="site-version" aria-label="Site version">v${SITE_VERSION}</span>
      </div>
    </header>
  `;

  const headerSelect = document.getElementById("headerProfileSelect");
  const headerLoad = document.getElementById("headerProfileLoad");
  const headerUpdate = document.getElementById("headerProfileUpdate");

  refreshHeaderProfileControls();

  if (headerSelect) {
    headerSelect.addEventListener("change", () => {
      const value = headerSelect.value || "";
      if (value) localStorage.setItem(SITE_SELECTED_PROFILE_KEY, value);
      else localStorage.removeItem(SITE_SELECTED_PROFILE_KEY);
      syncPageSelect(value);
      refreshHeaderProfileControls();
    });
  }

  if (headerLoad) {
    headerLoad.addEventListener("click", () => {
      const { loadButton } = getPageProfileElements();
      if (loadButton && !loadButton.disabled) {
        loadButton.click();
      } else {
        syncPageSelect(localStorage.getItem(SITE_SELECTED_PROFILE_KEY) || "");
      }
      refreshHeaderProfileControls();
    });
  }

  if (headerUpdate) {
    headerUpdate.addEventListener("click", () => {
      const { updateButton } = getPageProfileElements();
      if (updateButton && !updateButton.disabled) updateButton.click();
      refreshHeaderProfileControls();
    });
  }

  const selected = localStorage.getItem(SITE_SELECTED_PROFILE_KEY) || "";
  if (selected) syncPageSelect(selected);
}

function renderFooter() {
  const footerSlot = document.querySelector("[data-footer]");
  if (!footerSlot) return;

  footerSlot.innerHTML = `
    <footer class="site-footer">
      <span>Something so important it belongs at the bottom of every page.</span>
    </footer>
  `;
}

renderHeader();
renderFooter();

function scheduleHeaderRefreshFromEvent(event) {
  const target = event?.target;
  if (target instanceof Element) {
    if (target.closest(".header-actions")) return;
  }
  setTimeout(refreshHeaderProfileControls, 0);
}

window.addEventListener("focus", refreshHeaderProfileControls);
window.addEventListener("storage", refreshHeaderProfileControls);
document.addEventListener("input", scheduleHeaderRefreshFromEvent, true);
document.addEventListener("change", scheduleHeaderRefreshFromEvent, true);
document.addEventListener(
  "click",
  scheduleHeaderRefreshFromEvent,
  true
);

const goatcounterScript = document.createElement("script");
goatcounterScript.async = true;
goatcounterScript.dataset.goatcounter = "https://aspoonfulofbias.goatcounter.com/count";
goatcounterScript.src = "//gc.zgo.at/count.js";
document.head.appendChild(goatcounterScript);
})();
