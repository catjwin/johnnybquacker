// Recipe quantities and temperatures. build.mjs imports the formatters so the page is
// correct before any script runs; in the browser this also wires up the scale and °F/°C controls.

const FRACTIONS = [[1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾']];
const SINGULAR = { sprigs: 'sprig', cloves: 'clove', cups: 'cup', pinches: 'pinch', slices: 'slice', cans: 'can', handfuls: 'handful' };
const PLURAL = Object.fromEntries(Object.entries(SINGULAR).map(([plural, single]) => [single, plural]));

export function formatNumber(n) {
  const whole = Math.floor(n + 1e-9);
  const rest = n - whole;
  if (rest < 0.04) return String(whole);
  if (rest > 0.96) return String(whole + 1);
  for (const [value, glyph] of FRACTIONS) {
    if (Math.abs(rest - value) < 0.04) return whole ? `${whole}${glyph}` : glyph;
  }
  return String(Math.round(n * 100) / 100);
}

export function formatAmount(amount, unit = '', amountMax) {
  let text = formatNumber(amount);
  if (amountMax != null) text += `–${formatNumber(amountMax)}`;
  if (!unit) return text;
  const word = (amountMax ?? amount) <= 1 ? SINGULAR[unit] : PLURAL[unit];
  return `${text} ${word ?? unit}`;
}

// Oven temperatures round the way recipes print them (220°C, 350°F); food temperatures stay exact.
export function convertTemp(value, from, to) {
  if (from === to) return value;
  if (to === 'C') {
    const c = (value - 32) * 5 / 9;
    return value >= 250 ? Math.round(c / 10) * 10 : Math.round(c);
  }
  const f = value * 9 / 5 + 32;
  return value >= 120 ? Math.round(f / 25) * 25 : Math.round(f);
}

export function formatTemp(value, unit) {
  return `${value}°${unit}`;
}

const page = typeof document !== 'undefined' && document.querySelector('[data-recipe]');

if (page) {
  const controls = page.querySelector('.recipe-controls');
  const note = page.querySelector('[data-scale-note]');
  let factor = 1;
  let tempUnit = 'F';
  try {
    if (localStorage.getItem('jbq-temp-unit') === 'C') tempUnit = 'C';
  } catch {}

  const update = () => {
    page.querySelectorAll('[data-amount]').forEach((el) => {
      const max = el.dataset.amountMax ? Number(el.dataset.amountMax) * factor : undefined;
      el.textContent = formatAmount(Number(el.dataset.amount) * factor, el.dataset.unit, max);
    });
    page.querySelectorAll('[data-temp]').forEach((el) => {
      el.textContent = formatTemp(convertTemp(Number(el.dataset.temp), el.dataset.tempUnit, tempUnit), tempUnit);
    });
    controls.querySelectorAll('[data-scale]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.scale) === factor)));
    controls.querySelectorAll('[data-temp-choice]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tempChoice === tempUnit)));
    note.hidden = factor === 1;
  };

  controls.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.scale) factor = Number(button.dataset.scale);
    if (button.dataset.tempChoice) {
      tempUnit = button.dataset.tempChoice;
      try { localStorage.setItem('jbq-temp-unit', tempUnit); } catch {}
    }
    update();
  });

  controls.hidden = false;
  update();
}
