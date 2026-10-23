// Turns content/recipes/*.json into recipe pages and recipe cards.
//
// In method steps and substitutions, write {temp:425F} for a temperature (switches °F/°C)
// and {qty:2 tbsp} for an amount (scales with the recipe).

import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { formatAmount, convertTemp, formatTemp } from '../src/assets/recipe.js';

const SCALES = [[0.5, '½×'], [1, '1×'], [1.5, '1½×'], [2, '2×'], [3, '3×']];

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

function richText(text, file) {
  return esc(text)
    .replace(/\{temp:\s*(\d+(?:\.\d+)?)\s*°?\s*([CF])\s*\}/gi, (_, value, unit) => {
      const u = unit.toUpperCase();
      return `<span data-temp="${value}" data-temp-unit="${u}">${formatTemp(convertTemp(Number(value), u, 'F'), 'F')}</span>`;
    })
    .replace(/\{qty:\s*((?:\d+\s+)?\d+(?:[./]\d+)?)\s*([^}]*)\}/g, (_, amount, unit) => {
      const n = parseAmount(amount);
      if (!Number.isFinite(n)) throw new Error(`${file}: can't read the amount in {qty:${amount} ${unit}}`);
      return amountSpan(n, unit.trim());
    });
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
    for (const field of ['title', 'summary', 'ingredients', 'method']) {
      if (!data[field] || (Array.isArray(data[field]) && !data[field].length)) throw new Error(`${file}: "${field}" is missing`);
    }
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
    const meta = [r.course, r.time, `${r.ingredients.length} ingredients`].filter(Boolean).map(esc).join(' · ');
    return `  <a class="recipe-card" href="/recipes/${r.slug}/">
    ${photo(r)}
    <span class="recipe-card__body">
      <span class="recipe-card__meta">${meta}</span>
      <span class="recipe-card__title">${esc(r.title)}</span>
    </span>
  </a>`;
  }).join('\n')}\n</div>`;
}

export function renderRecipePage(r, all) {
  const f = r.file;
  const hasTemp = /\{temp:/i.test(JSON.stringify(r));
  const stats = [
    r.yield && `<li><span class="k">${esc(r.yield.label ?? 'Serves')}</span><span class="v">${amountSpan(r.yield.amount, r.yield.unit)}</span></li>`,
    ...(r.stats ?? []).map((s) => `<li><span class="k">${esc(s.label)}</span><span class="v">${esc(s.value)}</span></li>`),
  ].filter(Boolean).join('\n      ');

  const ingredients = r.ingredients.map((i) => {
    const qty = i.amount != null ? amountSpan(i.amount, i.unit, i.amountMax) : esc(i.note ?? '');
    return `<li><span>${esc(i.item)}</span><span class="leader" aria-hidden="true"></span><span class="qty">${qty}</span></li>`;
  }).join('\n          ');

  const others = all.filter((o) => o.slug !== r.slug).slice(0, 2);

  return `<!doctype html>
<html lang="en">
<head>
<!-- @head title="${esc(r.title)} — Johnny B. Quacker" description="${esc(r.description ?? r.summary)}" -->
<script type="module" src="/assets/recipe.js?v={{version}}"></script>
</head>
<body>
<!-- @header nav="recipes" -->
<main id="main" data-recipe>
  <section class="wrap">
    <div class="page-title">
      <span class="kicker">Remedy No. 3${r.course ? ` · ${esc(r.course)}` : ''}</span>
      <h1>${esc(r.title)}</h1>
      <p class="standfirst">${esc(r.summary)}</p>
    </div>
    ${photo(r, 'photo recipe-photo')}
    <ul class="stats">
      ${stats}
    </ul>${r.why ? `
    <div class="why">
      <span class="label">Why It’s on the List</span>
      <p>${richText(r.why, f)}</p>
    </div>` : ''}
  </section>

  <section class="wrap section">
    <div class="recipe">
      <div class="recipe-controls" hidden>
        <div class="control">
          <span class="control__label" id="scale-label">Quantities</span>
          <div class="segmented" role="group" aria-labelledby="scale-label">
            ${SCALES.map(([value, label]) => `<button type="button" data-scale="${value}" aria-pressed="${value === 1}">${label}</button>`).join('')}
          </div>
        </div>${hasTemp ? `
        <div class="control">
          <span class="control__label" id="temp-label">Temperatures</span>
          <div class="segmented" role="group" aria-labelledby="temp-label">
            <button type="button" data-temp-choice="F" aria-pressed="true">°F</button><button type="button" data-temp-choice="C" aria-pressed="false">°C</button>
          </div>
        </div>` : ''}
        <p class="control__note" data-scale-note hidden>Cooking times stay about the same. Use a bigger pan, or two, when making more.</p>
      </div>

      <div class="ingredients">
        <h2>Ingredients</h2>
        <ul>
          ${ingredients}
        </ul>${r.substitutions?.length ? `
        <div class="subs">
          <span class="label">Substitutions</span>
          <span>${r.substitutions.map((s) => richText(s, f)).join('<br>')}</span>
        </div>` : ''}
      </div>

      <div class="method">
        <div class="method__head">
          <h2>Method</h2>
          <button class="btn btn--sm" type="button" data-print>Print this recipe</button>
        </div>
        <ol>
          ${r.method.map((step) => `<li><span>${richText(step, f)}</span></li>`).join('\n          ')}
        </ol>${r.tip ? `
        <div class="grocer">
          <span class="label">${esc(r.tip.label ?? 'At the Grocer’s')}</span>
          <span>${richText(r.tip.text, f)}</span>
        </div>` : ''}
        <span class="sig">— J.B.Q.</span>
      </div>
    </div>
  </section>${others.length ? `

  <section class="band-panel">
    <div class="wrap more">
      <h2>More from the Kitchen</h2>
      <nav aria-label="More recipes">
        ${others.map((o) => `<a href="/recipes/${o.slug}/">${esc(o.title)} →</a>`).join('\n        ')}
      </nav>
    </div>
  </section>` : ''}
</main>
<!-- @footer -->
</body>
</html>
`;
}
