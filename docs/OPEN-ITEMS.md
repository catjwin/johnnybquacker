# Open items

## Needs Dad
1. Switch DNS at dotEarth: `docs/261023 Instructions dotEarth DNS Switch.md`.
2. Fill the [bracketed] gaps: the article's dates, pull quote, kitchen note and conclusion; the guide intro and the aisle-by-aisle section; the About page; contact details; how often the newsletter goes out.
3. Photos for every hatched placeholder (home remedies, recipes, article, About).
4. Sign off the recipes and the Kitchen Prescription swaps, which are drafts written for the mockup.

## Build
5. Newsletter: pick a service (e.g. Buttondown, Substack, Mailchimp) and wire up the sign-up form. For now it says "Sign-ups open soon".
6. Add the johnnybquacker.com Caddy block once DNS points at the VPS (README, *Going live*).
7. Consider self-hosting the four Google Fonts so visitors aren't sent to Google.
8. Source links for the history article.
9. Later: move to Dad's own server (README, *Moving to Dad's own server*).
10. **Custom editor for Dad** (decided 2026-10-23; not started). A private sign-in page on the VPS where Dad adds and edits recipes:
    - A form for title, course, summary, yield, stats, ingredients (amount, unit, item), method steps, substitutions, tip, and a photo upload that's resized on the server.
    - Saving writes `content/recipes/<slug>.json`, rebuilds, and publishes. He types plain numbers; the form marks temperatures and amounts as `{temp:…}` and `{qty:…}` so they scale and switch.
    - It should also commit the content to git so nothing lives only on the server.
    - Later it can grow to cover articles, the Kitchen Prescription and the About page.
    - Build it in the usual winsorlabs stack (build-an-app skill) as its own small container. Moving the site to Dad's server then means moving this container as well as `dist/`.
