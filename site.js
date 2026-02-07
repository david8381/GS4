function renderHeader() {
  const headerSlot = document.querySelector("[data-header]");
  if (!headerSlot) return;

  const page = document.body.dataset.page || "";
  headerSlot.innerHTML = `
    <header class="site-header">
      <div class="brand">GemStone IV Tools</div>
      <nav class="nav">
        <a class="nav-link" href="index.html" ${page === "home" ? "aria-current=\"page\"" : ""}>Home</a>
        <a class="nav-link" href="calculator.html" ${page === "calculator" ? "aria-current=\"page\"" : ""}>
          Lumnis + Tutelage
        </a>
      </nav>
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

const goatcounter = document.createElement("script");
goatcounter.async = true;
goatcounter.dataset.goatcounter = "https://aspoonfulofbias.goatcounter.com/count";
goatcounter.src = "//gc.zgo.at/count.js";
document.head.appendChild(goatcounter);
