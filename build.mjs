// Builds dist/ from src/. No dependencies.
//
// - src/pages/**  → dist/** (same paths; .html files have partials expanded)
// - src/assets/** → dist/assets/**
// - content/recipes/<slug>.json → dist/recipes/<slug>/index.html (see lib/recipes.mjs)
// - A partial is <!-- @name key="value" ... --> and pulls in src/partials/name.html,
//   replacing {{key}} with the value. nav="history" also sets {{nav_history}} so the
//   header can mark the current section. {{version}} is available everywhere.
//   <!-- @recipe-cards limit="3" --> is generated from the recipes, newest first.

import { readdir, readFile, writeFile, mkdir, cp, rm, stat } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { loadRecipes, renderRecipePage, renderRecipeCards } from './lib/recipes.mjs';

const SRC = 'src';
const OUT = 'dist';
const version = process.env.SITE_VERSION ?? 'dev';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

const partials = {};
for (const file of await readdir(join(SRC, 'partials'))) {
  partials[file.replace(/\.html$/, '')] = await readFile(join(SRC, 'partials', file), 'utf8');
}

const recipes = await loadRecipes('content/recipes');
const generated = {
  'recipe-cards': (vars) => renderRecipeCards(recipes, vars.limit),
};

function fill(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

function render(html, file) {
  const expanded = html.replace(/<!--\s*@([\w-]+)((?:\s+\w+="[^"]*")*)\s*-->/g, (_, name, attrs) => {
    const vars = { version };
    for (const [, key, value] of attrs.matchAll(/(\w+)="([^"]*)"/g)) vars[key] = value;
    if (generated[name]) return generated[name](vars);
    const partial = partials[name];
    if (!partial) throw new Error(`${file}: unknown partial @${name}`);
    if (vars.nav) vars[`nav_${vars.nav}`] = 'aria-current="page"';
    return fill(partial, vars);
  });
  return fill(expanded, { version });
}

await rm(OUT, { recursive: true, force: true });
await cp(join(SRC, 'assets'), join(OUT, 'assets'), { recursive: true });

const pages = join(SRC, 'pages');
let count = 0;
for (const file of await walk(pages)) {
  const target = join(OUT, relative(pages, file));
  await mkdir(dirname(target), { recursive: true });
  if (file.endsWith('.html')) {
    await writeFile(target, render(await readFile(file, 'utf8'), file));
    count++;
  } else {
    await cp(file, target);
  }
}

for (const recipe of recipes) {
  const dir = join(OUT, 'recipes', recipe.slug);
  if (await stat(dir).catch(() => null)) throw new Error(`${recipe.file}: src/pages already has a page at recipes/${recipe.slug}/`);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), render(renderRecipePage(recipe, recipes), recipe.file));
  count++;
}

await writeFile(join(OUT, 'version.txt'), `${version}\n`);
console.log(`Built ${count} pages into ${OUT}/ (version ${version})`);
