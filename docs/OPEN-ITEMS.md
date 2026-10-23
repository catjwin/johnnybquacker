# Open items

## Needs Dad
1. Switch DNS at dotEarth: `docs/261023 Instructions dotEarth DNS Switch.md`.
2. Approve the About page (put together from his texts) and the Kitchen Prescription (rebuilt from his pocket guide), and add his contact details to About.
3. Check the ten recipes as typed up from his sheets, and the Quick Reference Cards I wrote where he had none (Birria, Paella, Cornbread, Snickerdoodles). Pork Belly needs an intro and a spoons rating.
4. Recipes not up yet: reconcile the two sourdough versions (the guided steps and the card describe different methods), and write guided steps for the card-only recipes (Hummus, Vinaigrettes, Creamy Dips, Pickle Brines) and finish Peach Wine.
5. Later: set up his own server so the site can move off the winsorlabs VPS (README, *Moving to Dad's own server*).

## Build
6. Consider self-hosting the four Google Fonts so visitors aren't sent to Google.
7. **Custom editor for Dad** (decided 2026-10-23; not started). A private sign-in page on the VPS where Dad adds and edits recipes:
    - A form that matches the step-ladder format: stages, rows (ingredients + steps + level + stop/optional line + pace note), spoons, equipment, Fix It, From Experience, Quick Reference Card, and a photo upload that's resized on the server.
    - Saving writes `content/recipes/<slug>.json`, rebuilds, and publishes. He types plain numbers; the form marks temperatures and amounts as `{temp:…}` and `{qty:…}` so they scale and switch.
    - It should also commit the content to git so nothing lives only on the server.
    - Later it can grow to cover articles, the Kitchen Prescription and the About page.
    - Build it in the usual winsorlabs stack (build-an-app skill) as its own small container. Moving the site to Dad's server then means moving this container as well as `dist/`.
