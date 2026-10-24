# Taking over johnnybquacker.com

Everything built so far is yours to run with Claude. This page covers what you have, how to start, and how to put the site on your own hosting.

## What you have

| What | Where |
|---|---|
| The site's code and content | The GitHub repository `johnnybquacker` (we'll give you access) |
| Preview of the site as it stands | https://jbq.winsorlabs.uk (a preview server, until yours is set up) |
| Design mockups (the three styles you chose from) | A Claude canvas, shared with you separately |
| Fact-check list, with a column for your answers | A Claude doc, shared with you separately |
| Your source files | Your `Project InBrief` folder. `docs/261023 Inventory Dad Material.md` maps every file to a place on the site |

## Getting started with Claude

1. Install the Claude desktop app and open the **Code** tab, or use Claude Code in a terminal.
2. Copy the repository to your computer. In the Code tab, ask Claude to do it, or run `gh repo clone <owner>/johnnybquacker`.
3. Open that folder in Claude Code. Claude reads `CLAUDE.md` automatically. That file holds the rules and decisions so far: your voice, no health-confidential details, fact-checking, and the recipe format.
4. Ask for things in plain words. For example:
   - "Add my Hummus recipe from this file, with a Quick Reference Card."
   - "Turn my Never Ever Before slides into an article for How Food Affects You."
   - "Show me the site on my computer."
   - "Publish the changes."

## Putting it on your own hosting

The site is plain files, so almost any host works. Two good options:

**A. Free static hosting (easiest).** Use Netlify or Cloudflare Pages, connected to the GitHub repository.
- Build command: `node build.mjs`
- Folder to publish: `dist`
- Every change pushed to GitHub publishes automatically.
- The host then gives you the DNS records to point johnnybquacker.com at it.

**B. Your own server.** Serve the `dist` folder with any web server, using `404.html` for missing pages. To deploy from your computer:
`DEPLOY_HOST=<your server> DEPLOY_DIR=<folder on the server> SITE_URL=https://johnnybquacker.com ./deploy.sh`

**Either way, at dotEarth:** change only the records your new host asks for (usually `@` and `www`). Leave the MX and TXT records alone: they run your email. `docs/261023 Instructions dotEarth DNS Switch.md` walks through the dotEarth screens. Use your host's values in place of the ones in that doc.

## What's still to do

The current list is in `docs/OPEN-ITEMS.md`. The main ones for you:
- answer the fact-check doc
- approve the About page and the Simple Swaps
- check the recipes as typed up
- fill in the [bracketed] gaps
- finish the recipes that are held back (sourdough, and the card-only ones)
