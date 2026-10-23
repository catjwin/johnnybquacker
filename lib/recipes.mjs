// Turns content/recipes/*.json into recipe pages and recipe cards.
//
// Recipes follow Johnny's format, which is built for cooking with breaks (ME/CFS and
// other low-energy days). Each recipe has stages (Adobo, The Birria…). Each stage is a
// "ladder" of rows. A row pairs the ingredients that join at that point with the steps
// that use them, and `level` moves the steps to the right as the cook goes on.
// - `rule: "stop"` draws the heavy line that marks a safe place to stop.
// - `rule: "optional"` draws the dashed line before an optional part.
// - `pace` says when to rest ("rest"), that it's safe to stop ("stop"), or not to stop ("go").
// Every recipe also has a helper card (`card`): the short version, for once you know it.
//
// Any text can use **bold**, *italic*, [link](https://…), {temp:425F} (follows the °F/°C
// switch), {qty:2 tbsp} (follows the quantity scale) and new lines.

import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { formatAmount, convertTemp, formatTemp } from '../src/assets/recipe.js';

const SCALES = [[0.5, '½×'], [1, '1×'], [1.5, '1½×'], [2, '2×'], [3, '3×']];
const PACE_LABELS = { stop: 'Safe to stop', rest: 'Rest', go: 'Don’t stop here' };

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function parseAmount(text) {
  const t = text.trim();
  let m = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = t.match(/^(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  return Number(t);
}

function amountSpan(amount, unit = '', amountMax) {
  const max = amountMax != null ? ` data-amount-max="${amountMax}"` : '';
  return `<span data-amount="${amount}" data-unit="${esc(unit)}"${max}>${esc(formatAmount(amount, unit, amountMax))}</span>`;
}

function rich(text, file) {
  return esc(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\{temp:\s*(\d+(?:\.\d+)?)\s*°?\s*([CF])\s*\}/gi, (_, value, unit) => {
      const u = unit.toUpperCase();
      return `<span data-temp="${value}" data-temp-unit="${u}">${formatTemp(convertTemp(Number(value), u, 'F'), 'F')}</span>`;
    })
    .replace(/\{qty:\s*((?:\d+\s+)?\d+(?:[./]\d+)?)\s*([^}]*)\}/g, (_, amount, unit) => {
      const n = parseAmount(amount);
      if (!Number.isFinite(n)) throw new Error(`${file}: can't read the amount in {qty:${amount} ${unit}}`);
      return amountSpan(n, unit.trim());
    })
    .replace(/\n/g, '<br>');
}

const SPOON = '<svg class="spoon" viewBox="0 0 16 34" aria-hidden="true"><ellipse cx="8" cy="7.5" rx="5.2" ry="6.5"/><path d="M8 14v18"/></svg>';

function spoons(rating) {
  if (!rating) return '';
  return `<span class="spoons" role="img" aria-label="${rating} spoon${rating === 1 ? '' : 's'}">${SPOON.repeat(rating)}</span>`;
}

export async function loadRecipes(dir) {
  const recipes = [];
  for (const name of (await readdir(dir)).filter((f) => f.endsWith('.json'))) {
    const file = join(dir, name);
    let data;
    try {
      data = JSON.parse(await readFile(file, 'utf8'));
    } catch (err) {
      throw new Error(`${file}: not valid JSON (${err.message})`);
    }
    for (const field of ['title', 'summary', 'stages', 'card']) {
      if (!data[field] || (Array.isArray(data[field]) && !data[field].length)) throw new Error(`${file}: "${field}" is missing`);
    }
    data.stages.forEach((stage, i) => {
      if (!stage.rows?.length) throw new Error(`${file}: stage ${i + 1} has no rows`);
    });
    recipes.push({ ...data, slug: basename(name, '.json'), file });
  }
  return recipes.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.title.localeCompare(b.title));
}

function photo(recipe, className = 'photo') {
  if (recipe.photo) return `<img class="${className}" src="${esc(recipe.photo)}" alt="${esc(recipe.photoAlt ?? recipe.title)}" loading="lazy">`;
  return `<span class="${className}"><span>${esc(recipe.photoNote ?? 'Photo to come')}</span></span>`;
}

export function renderRecipeCards(recipes, limit) {
  const list = limit ? recipes.slice(0, Number(limit)) : recipes;
  return `<div class="cards">\n${list.map((r) => {
    const meta = [r.course, r.time].filter(Boolean).map(esc).join(' · ');
    return `  <a class="recipe-card" href="/recipes/${r.slug}/">
    ${photo(r)}
    <span class="recipe-card__body">
      <span class="recipe-card__meta">${meta}${r.spoons?.rating ? ` ${spoons(r.spoons.rating)}` : ''}</span>
      <span class="recipe-card__title">${esc(r.title)}</span>
    </span>
  </a>`;
  }).join('\n')}\n</div>`;
}

// ---------- Recipe page pieces ----------

function ingredientItem(i, f) {
  const cls = ['ing', i.optional && 'ing--optional', i.ref && 'ing--ref'].filter(Boolean).join(' ');
  const qty = i.amount != null ? `${amountSpan(i.amount, i.unit, i.amountMax)} ` : '';
  const note = i.note ? ` <span class="ing__note">${rich(i.note, f)}</span>` : '';
  return `<li class="${cls}">${qty}<span class="ing__item">${rich(i.item, f)}</span>${note}</li>`;
}

// Everything to buy, gathered from the stages (rows marked `ref` reuse earlier ones).
function shoppingList(r, f) {
  const items = r.stages.flatMap((s) => s.rows.flatMap((row) => row.ingredients ?? [])).filter((i) => !i.ref);
  return `<details class="shopping">
      <summary>Everything you’ll need <span class="muted">(${items.length} ingredients)</span></summary>
      <ul class="shopping__list">
        ${items.map((i) => ingredientItem(i, f)).join('\n        ')}
      </ul>
    </details>`;
}

function rung(row, stageIndex, rowIndex, f) {
  const id = `s${stageIndex + 1}r${rowIndex + 1}`;
  const cls = ['rung', row.rule && `rung--${row.rule}`, row.optional && 'rung--optional-part'].filter(Boolean).join(' ');
  const ingredients = row.ingredients?.length
    ? `<ul>${row.ingredients.map((i) => ingredientItem(i, f)).join('')}</ul>`
    : '';
  const aside = row.aside ? `<p class="rung__aside">${rich(row.aside, f)}</p>` : '';
  const pace = row.pace
    ? `<p class="pace pace--${row.pace.kind}"><span class="pace__label">${PACE_LABELS[row.pace.kind] ?? 'Note'}</span> ${rich(row.pace.text, f)}</p>`
    : '';
  return `<div class="${cls}" style="--level: ${row.level ?? 0}" data-step="${id}">
          <div class="rung__ing">${ingredients}${aside}</div>
          <div class="rung__do">
            <div class="rung__steps">${(row.steps ?? []).map((s) => `<p>${rich(s, f)}</p>`).join('')}${pace}</div>
            <label class="tick" hidden><input type="checkbox" data-tick="${id}"><span>Done</span></label>
          </div>
        </div>`;
}

function stage(s, i, f) {
  const meta = [s.where, s.time, s.heat && `Heat: ${s.heat}`].filter(Boolean)
    .map((m) => `<div class="stage__meta">${rich(m, f)}</div>`).join('\n        ');
  return `<section class="stage" id="stage-${i + 1}">
      <h2 class="stage__title">${rich(s.title, f)}</h2>
      <div class="stage__table">
        ${meta}
        <div class="stage__heads" aria-hidden="true"><span>Ingredients</span><span>Steps</span></div>
        ${s.rows.map((row, r) => rung(row, i, r, f)).join('\n        ')}${s.footer ? `
        <div class="stage__foot">${rich(s.footer, f)}</div>` : ''}
      </div>${s.after?.length ? `
      <div class="stage__after">${s.after.map((p) => `<p>${rich(p, f)}</p>`).join('')}</div>` : ''}
    </section>`;
}

function barTable(title, cls, rows) {
  return `<section class="bar-table ${cls}">
      <h2 class="bar-table__title">${title}</h2>
      <table>
        <tbody>
          ${rows.map(([a, b]) => `<tr><th scope="row">${a}</th><td>${b}</td></tr>`).join('\n          ')}
        </tbody>
      </table>
    </section>`;
}

function extraTable(t, f) {
  return `<section class="idea-table">
      <h2>${rich(t.title, f)}</h2>${t.intro ? `
      <p class="idea-table__intro">${rich(t.intro, f)}</p>` : ''}
      <div class="scroll-x">
        <table>
          <thead><tr>${t.columns.map((c) => `<th scope="col">${rich(c, f)}</th>`).join('')}</tr></thead>
          <tbody>
            ${t.rows.map((row) => `<tr>${row.map((c) => `<td>${rich(c, f)}</td>`).join('')}</tr>`).join('\n            ')}
          </tbody>
        </table>
      </div>
    </section>`;
}

function helperCard(r, f) {
  const c = r.card;
  // Long cards get smaller print type so they still fit a 6 × 4 in card.
  const dense = [...c.steps, ...(c.keys ?? [])].join(' ').length > 420;
  return `<section class="helper" id="helper-card">
      <div class="helper__head">
        <h2>Helper Card</h2>
        <p class="muted">The short version, for once you know the recipe. Print it on its own and keep it by the stove.</p>
      </div>
      <article class="card-sheet${dense ? ' card-sheet--dense' : ''}" aria-label="Helper card: ${esc(r.title)}">
        <header class="card-sheet__head">
          <span class="card-sheet__title">${esc(r.title)}</span>
          ${spoons(r.spoons?.rating)}
        </header>
        <ol class="card-sheet__steps">
          ${c.steps.map((s) => `<li>${rich(s, f)}</li>`).join('\n          ')}
        </ol>${c.keys?.length ? `
        <ul class="card-sheet__keys">
          ${c.keys.map((k) => `<li>${rich(k, f)}</li>`).join('\n          ')}
        </ul>` : ''}
        <footer class="card-sheet__foot">johnnybquacker.com/recipes/${r.slug}</footer>
      </article>
    </section>`;
}

function printDialog(r) {
  return `<dialog class="print-dialog" id="print-dialog" aria-labelledby="print-title">
    <form method="dialog">
      <h2 id="print-title">Print or save as PDF</h2>
      <fieldset>
        <legend>What to print</legend>
        <label><input type="radio" name="what" value="full" checked> The full recipe <span class="muted">(helper card on the last page)</span></label>
        <label><input type="radio" name="what" value="steps"> Just the cooking steps</label>
        <label><input type="radio" name="what" value="card"> Just the helper card</label>
      </fieldset>
      <fieldset>
        <legend>Text size</legend>
        <label><input type="radio" name="size" value="regular"> Regular</label>
        <label><input type="radio" name="size" value="large"> Large</label>
        <label><input type="radio" name="size" value="xlarge"> Extra large</label>
      </fieldset>
      <fieldset>
        <legend>Layout</legend>
        <label><input type="checkbox" name="stagePages"${r.stages.length > 1 ? ' checked' : ''}> Start each stage on a new page</label>
        <label><input type="checkbox" name="plain"> Plain black and white <span class="muted">(no grey shading)</span></label>
        <label><input type="checkbox" name="easy"> Easy-read font</label>
      </fieldset>
      <p class="muted">Quantities and temperatures print as they are set on the page. To keep a PDF, choose <strong>Save as PDF</strong> in the print window.</p>
      <div class="print-dialog__buttons">
        <button class="btn" value="cancel" formnovalidate>Cancel</button>
        <button class="btn btn--accent" value="print">Print</button>
      </div>
    </form>
  </dialog>`;
}

export function renderRecipePage(r, all) {
  const f = r.file;
  const json = JSON.stringify(r);
  const hasTemp = /\{temp:/i.test(json);
  const hasAmounts = /"amount":|\{qty:/.test(json);
  const others = all.filter((o) => o.slug !== r.slug).slice(0, 2);

  const scaleControl = hasAmounts ? `
        <div class="control">
          <span class="control__label" id="scale-label">Quantities</span>
          <div class="segmented" role="group" aria-labelledby="scale-label">
            ${SCALES.map(([value, label]) => `<button type="button" data-scale="${value}" aria-pressed="${value === 1}">${label}</button>`).join('')}
          </div>
        </div>` : '';
  const tempControl = hasTemp ? `
        <div class="control">
          <span class="control__label" id="temp-label">Temperatures</span>
          <div class="segmented" role="group" aria-labelledby="temp-label">
            <button type="button" data-temp-choice="F" aria-pressed="true">°F</button><button type="button" data-temp-choice="C" aria-pressed="false">°C</button>
          </div>
        </div>` : '';

  return `<!doctype html>
<html lang="en">
<head>
<!-- @head title="${esc(r.title)} — Johnny B. Quacker" description="${esc(r.description ?? r.summary)}" -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&amp;display=swap">
<script type="module" src="/assets/recipe.js?v={{version}}"></script>
</head>
<body>
<!-- @header nav="recipes" -->
<main id="main" class="recipe-page" data-recipe="${r.slug}">
  <section class="wrap">
    <div class="page-title">
      <span class="kicker">Remedy No. 3${r.course ? ` · ${esc(r.course)}` : ''}</span>
      <h1>${esc(r.title)}</h1>
      <p class="standfirst">${rich(r.summary, f)}</p>${r.spoons?.rating ? `
      <a class="spoon-badge" href="/recipes/#spoons">${spoons(r.spoons.rating)}<span>${r.spoons.rating} spoon${r.spoons.rating === 1 ? '' : 's'}</span></a>` : ''}
    </div>${r.photo ? `
    ${photo(r, 'photo recipe-photo')}` : ''}
  </section>

  <div class="wrap recipe-body">
    <div class="recipe-controls" hidden>
      <div class="recipe-controls__row">${scaleControl}${tempControl}
        <p class="control__note" data-scale-note hidden>Cooking times stay about the same. Use a bigger pan, or two, when making more.</p>
      </div>
      <div class="recipe-controls__row">
        <div class="control">
          <span class="control__label" id="size-label">Text size</span>
          <div class="segmented" role="group" aria-labelledby="size-label">
            <button type="button" data-size="regular" aria-pressed="true" aria-label="Regular text">A</button><button type="button" data-size="large" aria-pressed="false" aria-label="Large text" class="seg-lg">A</button><button type="button" data-size="xlarge" aria-pressed="false" aria-label="Extra large text" class="seg-xl">A</button>
          </div>
        </div>
        <div class="control">
          <span class="control__label" id="font-label">Font</span>
          <div class="segmented" role="group" aria-labelledby="font-label">
            <button type="button" data-font="classic" aria-pressed="true">Classic</button><button type="button" data-font="easy" aria-pressed="false" class="seg-easy">Easy-read</button>
          </div>
        </div>
        <button class="btn btn--sm" type="button" data-open-print>Print or save PDF</button>
        <button class="btn btn--sm" type="button" data-clear-ticks hidden>Clear ticks</button>
      </div>
    </div>

    <div class="recipe-intro">${r.credit ? `
      <p class="credit">${rich(r.credit, f)}</p>` : ''}
      ${(r.intro ?? []).map((p) => `<p>${rich(p, f)}</p>`).join('\n      ')}${r.spoons?.notes?.length ? `
      <ul class="spoon-notes">${r.spoons.notes.map((n) => `<li>${rich(n, f)}</li>`).join('')}</ul>` : ''}
    </div>

    <details class="legend">
      <summary>How to read this recipe</summary>
      <div class="legend__body">
        <p>Each step sits next to the ingredients it uses, and moves further right as the cook goes on.</p>
        <p><span class="legend__rule legend__rule--stop" aria-hidden="true"></span> A <strong>heavy line</strong> is a safe place to stop and rest.</p>
        <p><span class="legend__rule legend__rule--optional" aria-hidden="true"></span> A <strong>dashed line</strong> starts an optional part.</p>
        <p><span class="pace pace--rest"><span class="pace__label">Rest</span></span> <span class="pace pace--stop"><span class="pace__label">Safe to stop</span></span> <span class="pace pace--go"><span class="pace__label">Don’t stop here</span></span> tell you when you can take a break.</p>
        <p>Tick <strong>Done</strong> as you go. Your ticks stay on this device, so you can come back to where you left off.</p>
      </div>
    </details>

    ${shoppingList(r, f)}${r.experience?.length ? `

    <section class="experience">
      <h2>From Experience</h2>
      <ul>
        ${r.experience.map((e) => `<li>${rich(e, f)}</li>`).join('\n        ')}
      </ul>
    </section>` : ''}${r.equipment?.length ? `

    ${barTable('Equipment &amp; Tools', 'equipment', r.equipment.map((e) => [rich(e.item, f), rich(e.note ?? '', f)]))}` : ''}${r.fixIt?.length ? `

    ${barTable('Fix It', 'fixit', r.fixIt.map((x) => [rich(x.problem, f), rich(x.fix, f)]))}` : ''}

    ${r.stages.map((s, i) => stage(s, i, f)).join('\n\n    ')}${(r.tables ?? []).map((t) => `

    ${extraTable(t, f)}`).join('')}

    ${helperCard(r, f)}
  </div>${others.length ? `

  <section class="band-panel">
    <div class="wrap more">
      <h2>More from the Kitchen</h2>
      <nav aria-label="More recipes">
        ${others.map((o) => `<a href="/recipes/${o.slug}/">${esc(o.title)} →</a>`).join('\n        ')}
      </nav>
    </div>
  </section>` : ''}
  ${printDialog(r)}
</main>
<!-- @footer -->
</body>
</html>
`;
}
