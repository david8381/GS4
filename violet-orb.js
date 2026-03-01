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
const runVioletOrbTestsBtn = document.getElementById("runVioletOrbTests");
const violetOrbTestOutput = document.getElementById("violetOrbTestOutput");

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

function runVioletOrbSelfTests() {
  const tests = [
    {
      name: "T1 chance is 100% at max runs",
      run: () => probabilityForNextN(2500, 10),
      check: (got) => got === 1,
    },
    {
      name: "T2 chance increases with more next-runs",
      run: () => ({
        short: probabilityForNextN(100, 10),
        longer: probabilityForNextN(100, 100),
      }),
      check: (got) => got.longer > got.short,
    },
    {
      name: "T3 zero current runs and one next run equals 1/2500",
      run: () => probabilityForNextN(0, 1),
      check: (got) => Math.abs(got - 1 / 2500) < 1e-9,
    },
  ];

  let pass = 0;
  const lines = [];
  tests.forEach((test) => {
    const got = test.run();
    const ok = Boolean(test.check(got));
    if (ok) pass += 1;
    lines.push(`${ok ? "PASS" : "FAIL"} ${test.name}`);
    if (!ok) lines.push(` got: ${JSON.stringify(got)}`);
  });
  lines.push("");
  lines.push(`Summary: ${pass}/${tests.length} passing`);
  if (violetOrbTestOutput) {
    violetOrbTestOutput.textContent = lines.join("\n");
    violetOrbTestOutput.style.color = pass === tests.length ? "#1f4e42" : "#b42318";
  }
}

if (runVioletOrbTestsBtn) {
  runVioletOrbTestsBtn.addEventListener("click", runVioletOrbSelfTests);
}
