const baseInput = document.getElementById("baseExp");
const baseSlider = document.getElementById("baseSlider");
const sliderMaxLabel = document.getElementById("sliderMax");
const resultsBody = document.getElementById("results");
const legend = document.getElementById("legend");
const bestTotal = document.getElementById("bestTotal");
const bestLabel = document.getElementById("bestLabel");
const bestDelta = document.getElementById("bestDelta");
const chart = document.getElementById("chart");
const ctx = chart.getContext("2d");

const BASE_CHUNK = 7300;
const TUTELAGE_BASE_CAP = 25000;

const chartPadding = { left: 60, right: 20, top: 20, bottom: 50 };

const options = [
  {
    key: "lumnis",
    name: "Lumnis Only",
    donate: false,
    tutelage: false,
    color: getComputedStyle(document.documentElement).getPropertyValue("--line-1").trim(),
  },
  {
    key: "lumnis-tutelage",
    name: "Lumnis + Tutelage",
    donate: false,
    tutelage: true,
    color: getComputedStyle(document.documentElement).getPropertyValue("--line-2").trim(),
  },
  {
    key: "donate-tutelage",
    name: "Lumnis + Donate + Tutelage",
    donate: true,
    tutelage: true,
    color: getComputedStyle(document.documentElement).getPropertyValue("--line-3").trim(),
  },
  {
    key: "donate",
    name: "Lumnis + Donate",
    donate: true,
    tutelage: false,
    color: getComputedStyle(document.documentElement).getPropertyValue("--line-4").trim(),
  },
];

function buildPhases({ donate, tutelage }) {
  const phases = [];

  if (donate) {
    phases.push(
      { label: "Donate 5x", mult: 5, baseCap: BASE_CHUNK },
      { label: "Donate 4x", mult: 4, baseCap: BASE_CHUNK },
      { label: "Lumnis 3x", mult: 3, baseCap: BASE_CHUNK },
      { label: "Lumnis 2x", mult: 2, baseCap: BASE_CHUNK }
    );
  } else {
    phases.push(
      { label: "Lumnis 3x", mult: 3, baseCap: BASE_CHUNK },
      { label: "Lumnis 2x", mult: 2, baseCap: BASE_CHUNK }
    );
  }

  if (tutelage) {
    phases.push({ label: "Tutelage 5x", mult: 5, baseCap: TUTELAGE_BASE_CAP });
  }

  return phases;
}

function computeTotal(base, option) {
  let remaining = base;
  let total = 0;
  let bonus = 0;

  for (const phase of buildPhases(option)) {
    if (remaining <= 0) break;
    const used = Math.min(remaining, phase.baseCap);
    total += used * phase.mult;
    bonus += used * (phase.mult - 1);
    remaining -= used;
  }

  if (remaining > 0) {
    total += remaining;
  }

  const effective = base > 0 ? total / base : 1;
  return { base, total, bonus, effective };
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("en-US");
}

function updateLegend() {
  legend.innerHTML = "";
  options.forEach((opt) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.background = opt.color;
    const label = document.createElement("span");
    label.textContent = opt.name;
    item.appendChild(swatch);
    item.appendChild(label);
    legend.appendChild(item);
  });
}

function ensureSliderRange(value) {
  let max = Number(baseSlider.max);
  if (value > max * 0.98) {
    max = Math.ceil(value / 10000) * 10000;
    baseSlider.max = String(max);
    sliderMaxLabel.textContent = formatNumber(max);
  }
}

function renderTable(base) {
  resultsBody.innerHTML = "";
  const baseLine = computeTotal(base, options[0]);

  const totals = options.map((opt) => ({ opt, data: computeTotal(base, opt) }));

  totals.forEach(({ opt, data }) => {
    const row = document.createElement("tr");
    const extra = data.total - baseLine.total;

    row.innerHTML = `
      <td class="option-chip">${opt.name}</td>
      <td>${formatNumber(data.bonus)}</td>
      <td>${formatNumber(data.total)}</td>
      <td>${data.effective.toFixed(2)}x</td>
      <td>${opt.key === "lumnis" ? "—" : `${formatNumber(extra)} xp`}</td>
    `;

    resultsBody.appendChild(row);
  });

  const best = totals.reduce((acc, entry) => {
    if (entry.data.total > acc.data.total) return entry;
    if (entry.data.total < acc.data.total) return acc;
    if (!entry.opt.tutelage && acc.opt.tutelage) return entry;
    return acc;
  });
  bestTotal.textContent = `${formatNumber(best.data.total)} xp`;
  bestLabel.textContent = best.opt.name;
  bestDelta.textContent = `${formatNumber(best.data.total - baseLine.total)} xp`;
}

function drawChart(base) {
  const width = chart.width;
  const height = chart.height;
  ctx.clearRect(0, 0, width, height);

  const maxX = Number(baseSlider.max);
  const series = options.map((opt) => ({
    opt,
    points: buildSeries(maxX, opt),
  }));

  const maxY = Math.max(
    ...series.map((line) => line.points[line.points.length - 1].y)
  );

  const xScale = (width - chartPadding.left - chartPadding.right) / maxX;
  const yScale = (height - chartPadding.top - chartPadding.bottom) / (maxY * 1.1);

  ctx.strokeStyle = "rgba(29, 26, 33, 0.1)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 5; i += 1) {
    const y = chartPadding.top + (height - chartPadding.top - chartPadding.bottom) * (i / 5);
    ctx.beginPath();
    ctx.moveTo(chartPadding.left, y);
    ctx.lineTo(width - chartPadding.right, y);
    ctx.stroke();
  }

  for (let i = 0; i <= 5; i += 1) {
    const x = chartPadding.left + (width - chartPadding.left - chartPadding.right) * (i / 5);
    ctx.beginPath();
    ctx.moveTo(x, chartPadding.top);
    ctx.lineTo(x, height - chartPadding.bottom);
    ctx.stroke();
  }

  ctx.strokeStyle = "#1d1a21";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chartPadding.left, chartPadding.top);
  ctx.lineTo(chartPadding.left, height - chartPadding.bottom);
  ctx.lineTo(width - chartPadding.right, height - chartPadding.bottom);
  ctx.stroke();

  ctx.fillStyle = "#5d5866";
  ctx.font = "12px Space Grotesk";
  ctx.fillText("Base XP", width / 2 - 20, height - 16);
  ctx.save();
  ctx.translate(18, height / 2 + 20);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Total XP Earned", 0, 0);
  ctx.restore();

  series.forEach((line) => {
    ctx.strokeStyle = line.opt.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    line.points.forEach((point, index) => {
      const x = chartPadding.left + point.x * xScale;
      const y = height - chartPadding.bottom - point.y * yScale;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  });

  const markerX = chartPadding.left + base * xScale;
  ctx.strokeStyle = "rgba(29, 26, 33, 0.35)";
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(markerX, chartPadding.top);
  ctx.lineTo(markerX, height - chartPadding.bottom);
  ctx.stroke();
  ctx.setLineDash([]);

  series.forEach((line) => {
    const point = computeTotal(base, line.opt);
    const x = markerX;
    const y = height - chartPadding.bottom - point.total * yScale;
    ctx.fillStyle = line.opt.color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function buildSeries(maxX, option) {
  const step = Math.max(500, Math.floor(maxX / 200));
  const points = [];
  for (let x = 0; x <= maxX; x += step) {
    const result = computeTotal(x, option);
    points.push({ x, y: result.total });
  }
  if (points[points.length - 1].x !== maxX) {
    const result = computeTotal(maxX, option);
    points.push({ x: maxX, y: result.total });
  }
  return points;
}

function updateAll() {
  const base = Math.max(0, Number(baseInput.value || 0));
  ensureSliderRange(base);
  baseSlider.value = String(base);
  renderTable(base);
  drawChart(base);
}

baseInput.addEventListener("input", () => {
  updateAll();
});

baseSlider.addEventListener("input", () => {
  baseInput.value = baseSlider.value;
  updateAll();
});

let isDragging = false;

function setBaseFromChart(event) {
  const rect = chart.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const x = clientX - rect.left;
  const maxX = Number(baseSlider.max);
  const usableWidth = rect.width - chartPadding.left - chartPadding.right;
  const clampedX = Math.max(chartPadding.left, Math.min(x, rect.width - chartPadding.right));
  const ratio = usableWidth > 0 ? (clampedX - chartPadding.left) / usableWidth : 0;
  const value = Math.round(ratio * maxX);
  baseInput.value = String(value);
  updateAll();
}

chart.addEventListener("mousedown", (event) => {
  isDragging = true;
  setBaseFromChart(event);
});

chart.addEventListener("mousemove", (event) => {
  if (!isDragging) return;
  setBaseFromChart(event);
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

chart.addEventListener("touchstart", (event) => {
  isDragging = true;
  setBaseFromChart(event);
});

chart.addEventListener("touchmove", (event) => {
  if (!isDragging) return;
  setBaseFromChart(event);
});

chart.addEventListener("touchend", () => {
  isDragging = false;
});

updateLegend();
updateAll();
