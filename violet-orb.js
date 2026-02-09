const arenaInput = document.getElementById("arenaRuns");
const heistInput = document.getElementById("heistRuns");
const sewerInput = document.getElementById("sewerRuns");
const nextRunsInput = document.getElementById("nextRuns");
const nextRunsSlider = document.getElementById("nextRunsSlider");

const arenaChance = document.getElementById("arenaChance");
const heistChance = document.getElementById("heistChance");
const sewerChance = document.getElementById("sewerChance");
const arenaSub = document.getElementById("arenaSub");
const heistSub = document.getElementById("heistSub");
const sewerSub = document.getElementById("sewerSub");

const MAX_RUNS = 2500;

const chartConfigs = [
  {
    key: "arena",
    input: arenaInput,
    chance: arenaChance,
    sub: arenaSub,
  },
  {
    key: "heist",
    input: heistInput,
    chance: heistChance,
    sub: heistSub,
  },
  {
    key: "sewers",
    input: sewerInput,
    chance: sewerChance,
    sub: sewerSub,
  },
];

function clampRuns(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.floor(value), 0), MAX_RUNS);
}

function clampNextRuns(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.floor(value), 1), MAX_RUNS);
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value) {
  return value.toLocaleString("en-US");
}

function probabilityForNextN(currentRuns, nextRuns) {
  const remaining = Math.max(MAX_RUNS - currentRuns, 0);
  if (remaining === 0) return 1;
  const effectiveN = Math.min(nextRuns, remaining);
  return effectiveN / remaining;
}

function updateSummary(config, currentRuns, nextRuns) {
  const chance = probabilityForNextN(currentRuns, nextRuns);
  config.chance.textContent = formatPercent(chance);
  config.sub.textContent = `N = ${formatNumber(nextRuns)}`;
}

function updateAll() {
  const nextRuns = clampNextRuns(Number(nextRunsInput.value));
  nextRunsInput.value = String(nextRuns);
  nextRunsSlider.value = String(nextRuns);

  chartConfigs.forEach((config) => {
    const runs = clampRuns(Number(config.input.value));
    config.input.value = String(runs);
    updateSummary(config, runs, nextRuns);
  });
}

chartConfigs.forEach((config) => {
  config.input.addEventListener("input", updateAll);
});

nextRunsInput.addEventListener("input", updateAll);
nextRunsSlider.addEventListener("input", () => {
  nextRunsInput.value = nextRunsSlider.value;
  updateAll();
});

updateAll();
