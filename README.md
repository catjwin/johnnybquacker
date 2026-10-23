# johnnybquacker.com

Dad's site on food and health: what went wrong with the American food supply, non-toxic eating, and recipes. The design is "The Honest Quack" (Direction B of the mockups): a Victorian medicine label crossed with a farmers' almanac.

- **Preview:** https://jbq.winsorlabs.uk (hidden from search engines)
- **Live:** johnnybquacker.com, once Dad switches his DNS (see below)
- **Mockups:** https://claude.ai/artifact/BGKum4WwqMJroFHdBF464E

## How it's built

A plain static site with no framework and no dependencies, so it can move to any host.

```
content/recipes/  one JSON file per recipe; pages and cards are generated (lib/recipes.mjs)
src/pages/      one file per page; folders give clean URLs (history/x/index.html → /history/x/)
src/partials/   head, header, footer, signup; pulled into pages with <!-- @name key="value" -->
src/assets/     site.css, site.js, favicon.svg
build.mjs       src/ → dist/
deploy.sh       build, rsync to the VPS, check the served version
```

- `npm run build` builds to `dist/`.
- `npm run dev` builds and serves `dist/` at http://localhost:4321.
- `npm run deploy` (or `./deploy.sh`) ships it. Versions are `YYMMDD-a`, `-b`… per deploy that day, written to `/version.txt`.

**Adding a recipe:** add `content/recipes/<slug>.json`, copying `birria-de-bertha.json` (it uses every feature). The build generates its page at `/recipes/<slug>/` and adds it to the recipes page, and to the home page if it's among the three newest (by `date`). The format, Johnny's step ladder for cooking with breaks, is explained at the top of `lib/recipes.mjs`:

- `spoons`: an effort rating, plus notes on what changes it.
- `credit`, `intro`, `experience` ("From Experience"), `equipment`, `fixIt`, `tables`: optional sections.
- `stages[].rows[]`: each row pairs `ingredients` with `steps`. `level` sets how far right the steps sit. `rule: "stop"` draws a heavy line and `rule: "optional"` a dashed one. `pace` is `stop`, `rest` or `go`.
- `card`: the helper card, as `steps` and `keys`, sized to fit a 6 × 4 in index card.
- Ingredient amounts are numbers (`"amount": 0.5, "unit": "tsp"`) so they scale. Mark ingredients carried over from an earlier stage with `"ref": true` so they're left out of the shopping list.
- In any text: `**bold**`, `*italic*`, `[link](https://…)`, `{temp:425F}` (follows °F/°C) and `{qty:2 tbsp}` (follows the ½×–3× scale).
- Readers' settings (°F/°C, text size, easy-read font, ticked steps) are remembered in their browser. "Print or save PDF" offers the full recipe, the steps only, or the helper card, with text size, a page per stage and plain black and white.
- Placeholder recipes from the mockup sit in `content/recipes/_drafts/`. The build ignores them.

**Adding an article:** copy an existing page folder under `src/pages/`, edit it, and link it from `history/index.html` and, if it should be featured, from the home page.

## Hosting

The site is served by Caddy on the winsorlabs VPS (`winsorlabs-deploy`):

- Files: `/opt/winsorlabs/caddy/site/johnnybquacker/` (`/srv/site/johnnybquacker` inside the Caddy container)
- Config: the `jbq.winsorlabs.uk` block in `/opt/winsorlabs/caddy/Caddyfile`

## Going live on johnnybquacker.com

1. Dad follows `docs/261023 Instructions dotEarth DNS Switch.md`. It changes the `@` and `www` A records to 82.165.200.216 and leaves email (MX/TXT) and nameservers alone.
2. Wait until `dig +short johnnybquacker.com` and `dig +short www.johnnybquacker.com` both return 82.165.200.216. Only then add the block below. If Caddy tries for a certificate before DNS points here, it fails and can run into Let's Encrypt rate limits.
3. Back up the Caddyfile and append this (use `cat >>`; the file is bind-mounted, so replacing it with a new file breaks the mount):

   ```
   johnnybquacker.com {
   	root * /srv/site/johnnybquacker
   	encode gzip
   	file_server
   	handle_errors {
   		rewrite * /404.html
   		file_server
   	}
   }

   www.johnnybquacker.com {
   	redir https://johnnybquacker.com{uri} permanent
   }
   ```

4. `docker exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile`, then `… caddy reload …`.
5. Run `SITE_URL=https://johnnybquacker.com ./deploy.sh` and check that https works on both names.
6. Tell Dad it's live. Only then should he cancel the dotEarth website builder, after checking with dotEarth that the domain, DNS and email survive the cancellation.

## Moving to Dad's own server later

Everything in `dist/` is static. On any host (another VPS, Netlify, Cloudflare Pages) serve `dist/` as the web root, with `404.html` for missing pages, then change his two A records to the new host. Point `deploy.sh` at the new host, or replace it with that host's deploy step.
