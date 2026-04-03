(() => {
const SITE_VERSION = "0.3.33";
const storage = globalThis.GS4Storage;

if (!storage) throw new Error("GS4Storage is not loaded. Ensure shared.js is loaded before site.js.");

function getPageProfileElements() {
  const select =
    document.getElementById("profileSelect") ||
    document.getElementById("profileSelectCalc") ||
    document.getElementById("badgeProfileSelect");
  const loadButton =
    document.getElementById("profileApply") ||
    document.getElementById("profileLoad") ||
    document.getElementById("profileLoadCalc") ||
    document.getElementById("badgeProfileLoad") ||
    document.getElementById("volnProfileLoad") ||
    document.getElementById("colProfileLoad") ||
    document.getElementById("sunfistProfileLoad") ||
    document.getElementById("experienceProfileLoad");
  const updateButton =
    document.getElementById("profileSave") ||
    document.getElementById("profileDefaultsSave") ||
    document.getElementById("badgeProfileSave") ||
    document.getElementById("volnProfileSave") ||
    document.getElementById("colProfileSave") ||
    document.getElementById("sunfistProfileSave");
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

function isHeaderActionRelevant(pageButton, actionType) {
  if (!pageButton || pageButton.disabled) return false;
  if (actionType === "reload") return pageButton.classList.contains("attention");
  if (actionType === "update") return pageButton.classList.contains("success-attention");
  return false;
}

function refreshHeaderProfileControls() {
  const headerSelect = document.getElementById("headerProfileSelect");
  const headerLoad = document.getElementById("headerProfileLoad");
  const headerUpdate = document.getElementById("headerProfileUpdate");
  const headerDirtyLabel = document.getElementById("headerDirtyLabel");
  const page = document.body.dataset.page || "";
  if (!headerSelect || !headerLoad) return;

  const profiles = loadProfiles();
  const selected = localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "";
  headerSelect.innerHTML = '<option value="">Select Profile</option>';
  profiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.name;
    headerSelect.appendChild(option);
  });
  if (selected && profiles.some((profile) => profile.id === selected)) {
    headerSelect.value = selected;
  } else if (selected) {
    localStorage.removeItem(storage.SELECTED_PROFILE_KEY);
    headerSelect.value = "";
  } else {
    headerSelect.value = "";
  }

  const { select, loadButton, updateButton } = getPageProfileElements();
  const hasHeaderSelection = Boolean(headerSelect.value);
  const hasPageSelection = select
    ? Boolean(select.value && profiles.some((profile) => String(profile.id) === String(select.value)))
    : hasHeaderSelection;
  const hasSelection = hasHeaderSelection && hasPageSelection;
  const canReload = hasSelection && isHeaderActionRelevant(loadButton, "reload");
  const canUpdate = hasSelection && isHeaderActionRelevant(updateButton, "update");
  headerLoad.disabled = !canReload;
  mirrorButtonState(headerLoad, loadButton);
  if (headerUpdate) {
    if (hasSelection && updateButton && (page === "profile-create" || page === "profiles")) {
      headerUpdate.textContent = updateButton.textContent || "Update Profile";
    } else {
      headerUpdate.textContent = "Update Profile";
    }
    headerUpdate.disabled = !canUpdate;
    mirrorButtonState(headerUpdate, updateButton);
  }
  if (headerDirtyLabel) {
    const dataChanged = canReload || canUpdate;
    headerDirtyLabel.classList.toggle("is-visible", dataChanged);
    headerDirtyLabel.classList.toggle("is-hidden", !dataChanged);
  }
  const headerOpen = document.getElementById("headerProfileOpen");
  if (headerOpen) {
    headerOpen.disabled = !hasHeaderSelection;
  }
}

function renderHeader() {
  const headerSlot = document.querySelector("[data-header]");
  if (!headerSlot) return;

  const page = document.body.dataset.page || "";
  const root = document.body.dataset.root || "";
  const homeAttrs = page === "home" ? 'aria-current="page"' : "";
  const isProfileManagerPage = page === "profile-manager";
  headerSlot.innerHTML = `
    <header class="site-header">
      <a class="brand" href="${root}index.html" ${homeAttrs}>GS4 Tools</a>
      <div class="header-actions">
        <a class="home-link" href="${root}profile/manager.html"${isProfileManagerPage ? ' aria-current="page"' : ""}>Manage Profiles</a>
        <select id="headerProfileSelect" class="header-profile-select" aria-label="Selected Profile">
          <option value="">Select Profile</option>
        </select>
        <button class="btn" id="headerProfileOpen" type="button" disabled>Open</button>
        <button class="btn" id="headerProfileNew" type="button">New</button>
        <div class="header-profile-actions">
          <span class="header-profile-note is-hidden" id="headerDirtyLabel">Data Changed</span>
          <button class="btn" id="headerProfileLoad" type="button">Reload from Profile</button>
          <button class="btn" id="headerProfileUpdate" type="button">Update Profile</button>
        </div>
        <button class="btn theme-toggle" id="themeToggle" type="button" aria-label="Toggle dark mode">${document.documentElement.getAttribute("data-theme") === "dark" ? "\u263E" : "\u2600"}</button>
        <span class="site-version" aria-label="Site version">v${SITE_VERSION}</span>
      </div>
    </header>
  `;

  const headerSelect = document.getElementById("headerProfileSelect");
  const headerNew = document.getElementById("headerProfileNew");
  const headerOpen = document.getElementById("headerProfileOpen");
  const headerLoad = document.getElementById("headerProfileLoad");
  const headerUpdate = document.getElementById("headerProfileUpdate");
  const themeToggle = document.getElementById("themeToggle");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const next = isDark ? "light" : "dark";
      if (next === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      localStorage.setItem(storage.THEME_KEY, next);
      themeToggle.textContent = next === "dark" ? "\u263E" : "\u2600";
    });
  }

  refreshHeaderProfileControls();

  if (headerSelect) {
    headerSelect.addEventListener("change", () => {
      const value = headerSelect.value || "";
      if (value) localStorage.setItem(storage.SELECTED_PROFILE_KEY, value);
      else localStorage.removeItem(storage.SELECTED_PROFILE_KEY);
      window.dispatchEvent(new CustomEvent("gs4:selected-profile-changed", {
        detail: { profileId: value },
      }));
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
        syncPageSelect(localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "");
      }
      refreshHeaderProfileControls();
    });
  }

  if (headerNew) {
    headerNew.addEventListener("click", () => {
      localStorage.removeItem(storage.SELECTED_PROFILE_KEY);
      window.location.assign(`${root}profile/profile.html`);
    });
  }

  if (headerOpen) {
    headerOpen.addEventListener("click", () => {
      const profileId = localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "";
      if (profileId) {
        window.location.assign(`${root}profile/profile.html?id=${encodeURIComponent(profileId)}`);
      }
    });
  }

  if (headerUpdate) {
    headerUpdate.addEventListener("click", () => {
      const { updateButton } = getPageProfileElements();
      if (updateButton && !updateButton.disabled) updateButton.click();
      refreshHeaderProfileControls();
    });
  }

  const selected = localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "";
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

function getPageScripts() {
  const raw = document.body?.dataset?.pageScripts || "";
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function loadScriptSequentially(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const versionedSrc = src.includes("?") ? `${src}&v=${SITE_VERSION}` : `${src}?v=${SITE_VERSION}`;
    script.src = versionedSrc;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

async function loadPageScripts() {
  const scripts = getPageScripts();
  for (const src of scripts) {
    // Preserve declared order because many pages rely on globals from prior scripts.
    // eslint-disable-next-line no-await-in-loop
    await loadScriptSequentially(src);
  }
}

renderHeader();
renderFooter();

function loadProfiles() {
  return storage.loadProfiles();
}

function scheduleHeaderRefreshFromEvent(event) {
  const target = event?.target;
  if (target instanceof Element) {
    if (target.closest(".header-actions")) return;
  }
  setTimeout(refreshHeaderProfileControls, 0);
}

window.addEventListener("focus", refreshHeaderProfileControls);
window.addEventListener("storage", refreshHeaderProfileControls);
window.addEventListener("gs4:profile-saved", refreshHeaderProfileControls);
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

loadPageScripts().catch((error) => {
  console.error(error);
});
})();
