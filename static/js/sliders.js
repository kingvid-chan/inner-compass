/**
 * inner-compass sliders.js
 * Parameter binding, formula computation, and coordinate update dispatch.
 */

// Parameter IDs
const PARAM_IDS = ['S', 'L', 'Iteration', 'C', 'W', 'F', 'Delta'];

// Axis formulas
function computeCoordinates(params) {
  const S = params.S;
  const L = params.L;
  const Iteration = params.Iteration;
  const C = params.C;
  const W = params.W;
  const F = params.F;
  const Delta = params.Delta;

  return {
    x: (S * L) * Iteration,   // 认知实践轴: 1–1000
    y: C * C,                   // 连接轴: 1–100
    z: W - F * Delta,          // 心灵自由轴: −90–10
  };
}

// Callback placeholder — set by main.js
let onCoordsChange = null;

export function setOnCoordsChange(callback) {
  onCoordsChange = callback;
}

function readAllParams() {
  const params = {};
  for (const id of PARAM_IDS) {
    params[id] = parseFloat(document.getElementById(id).value);
  }
  return params;
}

function updateDisplay(id) {
  const val = document.getElementById(id).value;
  const displayEl = document.getElementById(`${id}-val`);
  if (displayEl) {
    displayEl.textContent = parseFloat(val).toFixed(1);
  }
}

function updateCoordsDisplay(coords) {
  document.getElementById('coord-x').textContent = coords.x.toFixed(1);
  document.getElementById('coord-y').textContent = coords.y.toFixed(1);
  document.getElementById('coord-z').textContent = coords.z.toFixed(1);
}

function handleSliderChange() {
  for (const id of PARAM_IDS) {
    updateDisplay(id);
  }
  const params = readAllParams();
  const coords = computeCoordinates(params);
  updateCoordsDisplay(coords);
  if (onCoordsChange) {
    onCoordsChange(coords);
  }
}

export function initSliders() {
  for (const id of PARAM_IDS) {
    const slider = document.getElementById(id);
    if (slider) {
      slider.addEventListener('input', handleSliderChange);
    }
  }
  // Initial computation with defaults
  handleSliderChange();
}
