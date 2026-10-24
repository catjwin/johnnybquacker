# johnnybquacker.com

Johnny's site on food and health. It's a static site with no framework and no dependencies: `node build.mjs` builds `src/` and `content/` into `dist/`. The README covers how it's built and how to add recipes and articles.

## Who it's for and how it sounds

- Johnny shares what worked for him, the hard way. He's sharing, not crusading. Read `docs/261023 Guide Tone of Voice.md` before writing any copy.
- Use Johnny's own words and phrases wherever possible. Don't invent taglines or slogans: earlier invented lines were cut.
- The look is a Victorian medicine label crossed with a farmers' almanac, but the **copy doesn't use a medicine theme**: no "remedy", "prescription", "Rx" or "dose". Only the look stays.
- Current wording: the header strapline is "Plain talk on food and health". The home headline is "Feel Better, Spend Less, and Live Safely". The top bar reads "Healthier · Cheaper · Safer". The line above the headline reads "Health · Money · Security".

## Rules

1. **Never publish health-confidential material.** That covers personal or family health timelines, symptoms, conditions or medications, for Johnny or anyone else. Recipes may say they suit people with limited energy (ME/CFS and similar). They never say who in the family has what.
2. **Facts get checked before they go live.** Track claims in `docs/261023 Checklist Fact Check.md`. Facts need a source on the page. Opinions are worded as Johnny's view. Don't publish claims that name companies as criminals or owners without a source.
3. **Where Johnny's files disagree, the newer file wins.** For recipes, that's the first batch of sheets (Birria, Paella, Pork Belly), which are newer than the `Project InBrief` folder.
4. **Recipes keep Johnny's step-ladder format**, built for cooking with breaks: a heavy line = safe to stop, a dashed line = optional part, pace notes (Safe to stop / Rest / Don't stop here), Standing / Can sit labels, a spoons rating (his 1–5 scale), a full guided version **and** a Quick Reference Card. The data format is explained at the top of `lib/recipes.mjs`.
5. Version strings are `YYMMDD-a`, `-b`… per deploy that day. `deploy.sh` does this.

## Where things are

- `content/recipes/*.json`: one file per recipe. `_drafts/` is ignored by the build.
- `src/pages/`: every other page, using clean URLs (folder + `index.html`).
- `docs/OPEN-ITEMS.md`: what's still to do. `docs/261023 Outline Site.md`: the site plan. `docs/261023 Inventory Dad Material.md`: where each of Johnny's source files goes.
- Johnny's source files (recipe sheets, outline, guides, research) are in his own `Project InBrief` folder. The inventory doc maps them.
