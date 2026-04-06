/**
 * dashboard.js
 * Handles unit selection, conversion, comparison, and arithmetic operations.
 * Modular structure: state, units data, UI helpers, calculators.
 */

// ── Session guard ────────────────────────────────────────────────
const SESSION_KEY = "qm_session";

(function guardSession() {
  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  if (!session) {
    window.location.href = "../index.html";
    return;
  }
  const greet = document.getElementById("userGreet");
  if (greet) greet.textContent = `Hi, ${session.name} 👋`;
})();

function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "../index.html";
}

// ── App state ────────────────────────────────────────────────────
const state = {
  type: "length",
  action: "comparison",
  op: "+",
};

// ── Units data ───────────────────────────────────────────────────
// All values are factors relative to a base unit (first in each list)
const UNITS = {
  length: {
    base: "Meter",
    units: {
      Kilometer: 1000,
      Meter: 1,
      Centimeter: 0.01,
      Millimeter: 0.001,
      Mile: 1609.344,
      Yard: 0.9144,
      Foot: 0.3048,
      Inch: 0.0254,
    },
  },
  weight: {
    base: "Kilogram",
    units: {
      Kilogram: 1,
      Gram: 0.001,
      Milligram: 0.000001,
      Pound: 0.453592,
      Ounce: 0.0283495,
      Tonne: 1000,
    },
  },
  temperature: null, // Special case — handled separately
  volume: {
    base: "Liter",
    units: {
      Liter: 1,
      Milliliter: 0.001,
      Gallon: 3.78541,
      Quart: 0.946353,
      Pint: 0.473176,
      Cup: 0.24,
      "Fluid Ounce": 0.0295735,
      Cubic_Meter: 1000,
    },
  },
};

const TEMP_UNITS = ["Celsius", "Fahrenheit", "Kelvin"];

// ── Conversion helpers ───────────────────────────────────────────
function convertToBase(value, unit, type) {
  if (type === "temperature") return toTempBase(value, unit);
  return value * UNITS[type].units[unit];
}

function convertFromBase(baseValue, unit, type) {
  if (type === "temperature") return fromTempBase(baseValue, unit);
  return baseValue / UNITS[type].units[unit];
}

function toTempBase(value, unit) {
  // Base = Celsius
  if (unit === "Celsius") return value;
  if (unit === "Fahrenheit") return ((value - 32) * 5) / 9;
  if (unit === "Kelvin") return value - 273.15;
}

function fromTempBase(celsius, unit) {
  if (unit === "Celsius") return celsius;
  if (unit === "Fahrenheit") return (celsius * 9) / 5 + 32;
  if (unit === "Kelvin") return celsius + 273.15;
}

function convertValue(value, fromUnit, toUnit, type) {
  if (fromUnit === toUnit) return value;
  const base = convertToBase(value, fromUnit, type);
  return convertFromBase(base, toUnit, type);
}

function round(n, decimals = 6) {
  return parseFloat(n.toFixed(decimals));
}

function formatNum(n) {
  if (Math.abs(n) >= 1e6 || (Math.abs(n) < 0.0001 && n !== 0)) {
    return n.toExponential(4);
  }
  return round(n, 4).toString();
}

// ── Unit select population ───────────────────────────────────────
function getUnitList(type) {
  if (type === "temperature") return TEMP_UNITS;
  return Object.keys(UNITS[type].units);
}

function populateSelect(selectEl, type, selectedValue) {
  const units = getUnitList(type);
  selectEl.innerHTML = "";
  units.forEach((unit) => {
    const opt = document.createElement("option");
    opt.value = unit;
    opt.textContent = unit.replace("_", " ");
    if (unit === selectedValue) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

function syncUnits() {
  const fromUnit = document.getElementById("fromUnit").value;
  const toSelect = document.getElementById("toUnit");
  const current = toSelect.value;
  populateSelect(toSelect, state.type, current || undefined);
}

// ── Type selection ───────────────────────────────────────────────
function selectType(card) {
  document
    .querySelectorAll(".type-card")
    .forEach((c) => c.classList.remove("active"));
  card.classList.add("active");
  state.type = card.dataset.type;
  rebuildUnits();
  calculate();
}

function rebuildUnits() {
  const units = getUnitList(state.type);
  const fromSel = document.getElementById("fromUnit");
  const toSel = document.getElementById("toUnit");
  populateSelect(fromSel, state.type, units[0]);
  populateSelect(toSel, state.type, units[1] || units[0]);
}

// ── Action selection ─────────────────────────────────────────────
function selectAction(btn) {
  document
    .querySelectorAll(".action-tab")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  state.action = btn.dataset.action;
  updateLayout();
  calculate();
}

function updateLayout() {
  const arrowDiv = document.getElementById("arrowOrOp");
  const arithDiv = document.getElementById("arithOps");
  const fromLabel = document.getElementById("fromLabel");
  const toLabel = document.getElementById("toLabel");
  const toInput = document.getElementById("toVal");

  if (state.action === "arithmetic") {
    arrowDiv.style.display = "none";
    arithDiv.style.display = "block";
    fromLabel.textContent = "VALUE A";
    toLabel.textContent = "VALUE B";
    toInput.readOnly = false;
  } else {
    arrowDiv.style.display = "flex";
    arithDiv.style.display = "none";
    fromLabel.textContent = "FROM";
    toLabel.textContent = state.action === "comparison" ? "TO" : "TO";
    toInput.readOnly = state.action === "conversion";
    if (state.action === "conversion") toInput.value = "";
  }
}

// ── Arithmetic operator dropdown ─────────────────────────────────
const OP_LABELS = {
  "+": { symbol: "+", label: "Add" },
  "-": { symbol: "−", label: "Subtract" },
  "×": { symbol: "×", label: "Multiply" },
  "÷": { symbol: "÷", label: "Divide" },
};

function buildOpDropdown() {
  const container = document.getElementById("arithOps");
  container.innerHTML = `
    <div class="op-dropdown-btn" id="opDropBtn" onclick="toggleOpMenu()">
      <span id="opDropLabel">${OP_LABELS[state.op].symbol}</span>
      <span class="op-caret" id="opCaret">▲</span>
    </div>
    <div class="op-menu" id="opMenu">
      ${Object.entries(OP_LABELS)
        .map(
          ([key, val]) => `
        <div class="op-menu-item ${key === state.op ? "selected" : ""}" onclick="selectOp('${key}')">
          <span class="op-symbol">${val.symbol}</span>
          <span>${val.label}</span>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

function toggleOpMenu() {
  const menu = document.getElementById("opMenu");
  const caret = document.getElementById("opCaret");
  const open = menu.classList.toggle("open");
  caret.classList.toggle("open", open);
}

function selectOp(op) {
  state.op = op;
  const label = document.getElementById("opDropLabel");
  if (label) label.textContent = OP_LABELS[op].symbol;

  document.querySelectorAll(".op-menu-item").forEach((item) => {
    const sym = item.querySelector(".op-symbol").textContent;
    item.classList.toggle("selected", sym === OP_LABELS[op].symbol);
  });

  // Close menu
  const menu = document.getElementById("opMenu");
  const caret = document.getElementById("opCaret");
  if (menu) menu.classList.remove("open");
  if (caret) caret.classList.remove("open");

  calculate();
}

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  const menu = document.getElementById("opMenu");
  const btn = document.getElementById("opDropBtn");
  if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
    menu.classList.remove("open");
    const caret = document.getElementById("opCaret");
    if (caret) caret.classList.remove("open");
  }
});

// ── Main calculate function ──────────────────────────────────────
function calculate() {
  const fromVal = parseFloat(document.getElementById("fromVal").value);
  const toVal = parseFloat(document.getElementById("toVal").value);
  const fromUnit = document.getElementById("fromUnit").value;
  const toUnit = document.getElementById("toUnit").value;
  const resultEl = document.getElementById("resultText");
  const resultBox = document.getElementById("resultBox");

  function setResult(text, isError = false) {
    resultEl.textContent = text;
    resultEl.className = isError ? "error" : "";
    // Re-trigger animation
    resultBox.classList.remove("result-pop");
    void resultBox.offsetWidth;
    resultBox.classList.add("result-pop");
  }

  if (state.action === "comparison") {
    if (isNaN(fromVal) || isNaN(toVal)) {
      setResult("Enter values to compare", true);
      return;
    }
    const fromBase = convertToBase(fromVal, fromUnit, state.type);
    const toBase = convertToBase(toVal, toUnit, state.type);
    let symbol = fromBase < toBase ? "<" : fromBase > toBase ? ">" : "=";
    setResult(
      `${formatNum(fromVal)} ${fromUnit} ${symbol} ${formatNum(toVal)} ${toUnit}`,
    );
  } else if (state.action === "conversion") {
    if (isNaN(fromVal)) {
      setResult("Enter a value to convert", true);
      return;
    }
    const converted = convertValue(fromVal, fromUnit, toUnit, state.type);
    document.getElementById("toVal").value = formatNum(converted);
    setResult(
      `${formatNum(fromVal)} ${fromUnit} = ${formatNum(converted)} ${toUnit}`,
    );
  } else if (state.action === "arithmetic") {
    if (isNaN(fromVal) || isNaN(toVal)) {
      setResult("Enter both values", true);
      return;
    }
    const aBase = convertToBase(fromVal, fromUnit, state.type);
    const bBase = convertToBase(toVal, toUnit, state.type);
    let result;
    switch (state.op) {
      case "+":
        result = aBase + bBase;
        break;
      case "-":
        result = aBase - bBase;
        break;
      case "×":
        result = aBase * bBase;
        break;
      case "÷":
        if (bBase === 0) {
          setResult("Cannot divide by zero", true);
          return;
        }
        result = aBase / bBase;
        break;
    }
    const resultInFrom = convertFromBase(result, fromUnit, state.type);
    const opSym = OP_LABELS[state.op].symbol;
    setResult(
      `${formatNum(fromVal)} ${fromUnit} ${opSym} ${formatNum(toVal)} ${toUnit} = ${formatNum(resultInFrom)} ${fromUnit}`,
    );
  }
}

// ── Init ─────────────────────────────────────────────────────────
(function init() {
  rebuildUnits();
  buildOpDropdown();
  updateLayout();
  calculate();
})();
