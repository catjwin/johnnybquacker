// Recipe quantities and temperatures. build.mjs imports the formatters so the page is
// correct before any script runs. In the browser this also runs the recipe controls:
// scale, °F/°C, text size, easy-read font, "Done" ticks and the print/PDF dialog.

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

// Reader preferences live in this browser only; every read and write tolerates storage being unavailable.
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch {} },
};

const page = typeof document !== 'undefined' && document.querySelector('[data-recipe]');

if (page) {
  const root = document.documentElement;
  const controls = page.querySelector('.recipe-controls');
  const note = page.querySelector('[data-scale-note]');
  const clearTicks = page.querySelector('[data-clear-ticks]');
  const tickKey = `jbq-ticks-${page.dataset.recipe}`;

  let factor = 1;
  let tempUnit = store.get('jbq-temp-unit') === 'C' ? 'C' : 'F';
  let size = ['large', 'xlarge'].includes(store.get('jbq-text-size')) ? store.get('jbq-text-size') : 'regular';
  let font = store.get('jbq-font') === 'easy' ? 'easy' : 'classic';
  const ticked = new Set(JSON.parse(store.get(tickKey) || '[]'));

  const pressed = (selector, isOn) => controls.querySelectorAll(selector).forEach((b) => b.setAttribute('aria-pressed', String(isOn(b))));

  const update = () => {
    page.querySelectorAll('[data-amount]').forEach((el) => {
      const max = el.dataset.amountMax ? Number(el.dataset.amountMax) * factor : undefined;
      el.textContent = formatAmount(Number(el.dataset.amount) * factor, el.dataset.unit, max);
    });
    page.querySelectorAll('[data-temp]').forEach((el) => {
      el.textContent = formatTemp(convertTemp(Number(el.dataset.temp), el.dataset.tempUnit, tempUnit), tempUnit);
    });
    pressed('[data-scale]', (b) => Number(b.dataset.scale) === factor);
    pressed('[data-temp-choice]', (b) => b.dataset.tempChoice === tempUnit);
    pressed('[data-size]', (b) => b.dataset.size === size);
    pressed('[data-font]', (b) => b.dataset.font === font);
    if (note) note.hidden = factor === 1;
    root.dataset.textSize = size;
    root.dataset.font = font;
    page.querySelectorAll('[data-tick]').forEach((box) => {
      box.checked = ticked.has(box.dataset.tick);
      box.closest('.rung').classList.toggle('is-done', box.checked);
    });
    clearTicks.hidden = ticked.size === 0;
  };

  controls.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.scale) factor = Number(button.dataset.scale);
    if (button.dataset.tempChoice) store.set('jbq-temp-unit', tempUnit = button.dataset.tempChoice);
    if (button.dataset.size) store.set('jbq-text-size', size = button.dataset.size);
    if (button.dataset.font) store.set('jbq-font', font = button.dataset.font);
    if (button.dataset.clearTicks !== undefined) {
      ticked.clear();
      store.set(tickKey, '[]');
    }
    update();
  });

  // "Done" ticks, so a cook split across rests can pick up where it left off.
  page.querySelectorAll('.tick').forEach((label) => { label.hidden = false; });
  page.addEventListener('change', (event) => {
    const box = event.target.closest('[data-tick]');
    if (!box) return;
    if (box.checked) ticked.add(box.dataset.tick); else ticked.delete(box.dataset.tick);
    store.set(tickKey, JSON.stringify([...ticked]));
    update();
  });

  // Print or save as PDF, with the reader's choice of what to include and how large.
  const dialog = page.querySelector('#print-dialog');
  const form = dialog.querySelector('form');
  const PRINT_CLASSES = ['print-full', 'print-steps', 'print-card', 'print-stage-pages', 'print-plain'];
  let restore = null;

  page.querySelector('[data-open-print]').addEventListener('click', () => {
    form.elements.size.value = size;
    form.elements.easy.checked = font === 'easy';
    dialog.returnValue = '';
    dialog.showModal();
  });

  dialog.addEventListener('close', () => {
    if (dialog.returnValue !== 'print') return;
    const choice = new FormData(form);
    const closed = [...page.querySelectorAll('details:not([open])')];
    closed.forEach((d) => { d.open = true; });
    restore = { size: root.dataset.textSize, font: root.dataset.font, closed };
    root.classList.add(`print-${choice.get('what')}`);
    root.classList.toggle('print-stage-pages', choice.has('stagePages'));
    root.classList.toggle('print-plain', choice.has('plain'));
    root.dataset.textSize = choice.get('size');
    root.dataset.font = choice.has('easy') ? 'easy' : 'classic';
    // Let the dialog finish closing before the print window opens.
    setTimeout(() => window.print(), 50);
  });

  window.addEventListener('afterprint', () => {
    if (!restore) return;
    root.classList.remove(...PRINT_CLASSES);
    root.dataset.textSize = restore.size;
    root.dataset.font = restore.font;
    restore.closed.forEach((d) => { d.open = false; });
    restore = null;
  });

  controls.hidden = false;
  update();
}
