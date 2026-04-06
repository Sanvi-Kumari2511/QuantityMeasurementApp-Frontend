const conversionData = {
  length: {
    base: "Meter",
    units: {
      Meter: 1,
      Kilometer: 1000,
      Centimeter: 0.01,
      Millimeter: 0.001,
      Mile: 1609.34,
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
      Tonne: 1000,
      Pound: 0.453592,
      Ounce: 0.0283495,
    },
  },
  volume: {
    base: "Liter",
    units: {
      Liter: 1,
      Milliliter: 0.001,
      Gallon: 3.78541,
      Quart: 0.946353,
      Pint: 0.473176,
      Cup: 0.236588,
    },
  },
  temperature: {
    base: "Celcius",
    units: ["Celsius", "Fahrenheit", "Kelvin"],
  },
};

let currentType = "length";
let currentAction = "comparison";

// DOM Elements
const typeCards = document.querySelectorAll(".type-card");
const tabs = document.querySelectorAll(".tab");
const panels = {
  comparison: document.getElementById("comparisonPanel"),
  conversion: document.getElementById("conversionPanel"),
  arithmetic: document.getElementById("arithmeticPanel"),
};

// Dropdowns
const dropdowns = {
  comparison: {
    from: document.getElementById("fromUnit"),
    to: document.getElementById("toUnit"),
  },
  conversion: {
    from: document.getElementById("convFromUnit"),
    to: document.getElementById("convToUnit"),
  },
  arithmetic: {
    a: document.getElementById("arithUnitA"),
    b: document.getElementById("arithUnitB"),
    result: document.getElementById("arithResultUnit"),
  },
};

function init() {
  populateDropdowns();
  attachEvents();
  doComparison();
}

function getUnitsForType(type) {
  if (type === "temperature") {
    return conversionData.temperature.units;
  }
  return Object.keys(conversionData[type].units);
}

function populateDropdowns() {
  const units = getUnitsForType(currentType);

  const fillSelect = (selectElem) => {
    selectElem.innerHTML = "";
    units.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit;
      option.textContent = unit;
      selectElem.appendChild(option);
    });
  };

  fillSelect(dropdowns.comparison.from);
  fillSelect(dropdowns.comparison.to);
  if (units.length > 1) dropdowns.comparison.to.selectedIndex = 1;

  fillSelect(dropdowns.conversion.from);
  fillSelect(dropdowns.conversion.to);
  if (units.length > 1) dropdowns.conversion.to.selectedIndex = 1;

  fillSelect(dropdowns.arithmetic.a);
  fillSelect(dropdowns.arithmetic.b);
  fillSelect(dropdowns.arithmetic.result);
}

function formatNumber(num) {
  if (Number.isInteger(num)) return num;
  return parseFloat(num.toFixed(6));
}

function convertValue(val, from, to, type) {
  if (from === to) return val;
  if (type === "temperature") {
    let c = val;
    if (from === "Fahrenheit") c = ((val - 32) * 5) / 9;
    else if (from === "Kelvin") c = val - 273.15;

    if (to === "Fahrenheit") return (c * 9) / 5 + 32;
    if (to === "Kelvin") return c + 273.15;
    return c;
  } else {
    const fromBaseFactor = conversionData[type].units[from];
    const toBaseFactor = conversionData[type].units[to];
    const inBase = val * fromBaseFactor;
    return inBase / toBaseFactor;
  }
}

function attachEvents() {
  // Type Cards
  typeCards.forEach((card) => {
    card.addEventListener("click", () => {
      typeCards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      currentType = card.dataset.type;

      populateDropdowns();

      if (currentAction === "comparison") doComparison();
      if (currentAction === "conversion")
        document.getElementById("convResult").textContent = "-";
      if (currentAction === "arithmetic")
        document.getElementById("arithResult").textContent = "-";
    });
  });

  // Action Tabs
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentAction = tab.dataset.action;

      Object.keys(panels).forEach((key) => panels[key].classList.add("hidden"));
      panels[currentAction].classList.remove("hidden");

      if (currentAction === "comparison") doComparison();
    });
  });

  // Comparison Panel setup
  const fromValue = document.getElementById("fromValue");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");

  [fromValue, fromUnit, toUnit].forEach((el) => {
    el.addEventListener("input", doComparison);
  });

  // Conversion Panel Setup
  document.getElementById("convertBtn").addEventListener("click", () => {
    const val = parseFloat(document.getElementById("convInput").value || 0);
    const from = document.getElementById("convFromUnit").value;
    const to = document.getElementById("convToUnit").value;
    const result = convertValue(val, from, to, currentType);
    document.getElementById("convResult").textContent =
      formatNumber(result) + " " + to;
  });

  // Arithmetic Panel Setup
  document.getElementById("arithBtn").addEventListener("click", () => {
    const valA = parseFloat(document.getElementById("arithA").value || 0);
    const valB = parseFloat(document.getElementById("arithB").value || 0);
    const fromA = document.getElementById("arithUnitA").value;
    const fromB = document.getElementById("arithUnitB").value;
    const toRes = document.getElementById("arithResultUnit").value;
    const op = document.getElementById("arithOp").value;

    let targetA = convertValue(valA, fromA, toRes, currentType);
    let targetB = convertValue(valB, fromB, toRes, currentType);
    let finalRes = 0;

    if (op === "+") finalRes = targetA + targetB;
    if (op === "-") finalRes = targetA - targetB;
    if (op === "*") finalRes = targetA * targetB;
    if (op === "/") finalRes = targetA / targetB;

    document.getElementById("arithResult").textContent =
      formatNumber(finalRes) + " " + toRes;
  });
}

function doComparison() {
  const fromVal = parseFloat(document.getElementById("fromValue").value || 0);
  const fromU = document.getElementById("fromUnit").value;
  const toU = document.getElementById("toUnit").value;
  if (!fromU || !toU) return;
  const res = convertValue(fromVal, fromU, toU, currentType);
  document.getElementById("toValue").value = formatNumber(res);
}

document.addEventListener("DOMContentLoaded", init);
