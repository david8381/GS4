function renderHeader() {
  const headerSlot = document.querySelector("[data-header]");
  if (!headerSlot) return;

  const page = document.body.dataset.page || "";
  const homeAttrs = page === "home" ? 'aria-current="page"' : "";
  headerSlot.innerHTML = `
    <header class="site-header">
      <div class="brand">GemStone IV Tools</div>
      <a class="home-link" href="index.html" ${homeAttrs}>Home</a>
    </header>
  `;
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

const goatcounterScript = document.createElement("script");
goatcounterScript.async = true;
goatcounterScript.dataset.goatcounter = "https://aspoonfulofbias.goatcounter.com/count";
goatcounterScript.src = "//gc.zgo.at/count.js";
document.head.appendChild(goatcounterScript);
