# yara

Static site. No build step, no dependencies.

```
index.html
styles.css
script.js
data/menu.json       ← the decoy restaurant menu
data/messages.json   ← the names, messages, photos, memories
photos/              ← drop the photos here
```

## Editing the messages

Everything she reads lives in `data/messages.json`. Each person is one object:

```json
{
  "name": "Nour",
  "role": "",
  "message": "…",
  "photo": "photos/nour.jpg",
  "memory": "…"
}
```

- `photo` and `memory` and `role` are all optional — leave them as `""` and the card
  restyles itself as a pull quote. It reads as a deliberate layout choice, not a gap.
- Blank line inside `message` = new paragraph. Single newline = line break.
- Photos: any aspect ratio works (they're cropped to 4:5). Keep them under ~500 KB
  each so the page stays fast on mobile data. Filenames: no spaces, all lowercase.
- Order in the array = order on the page.

`data/menu.json` is the decoy. Prices are placeholders — update them to match the
real ones so it holds up if she reads closely.

## Previewing locally

`fetch` is blocked on `file://`, so use a server:

```bash
cd yarabd2 && python3 -m http.server 5173
```

Then open http://localhost:5173

Two preview shortcuts while you edit:

- `?stage=menu` — stay on the decoy menu, no transition
- `?stage=reveal` — skip straight to the birthday page

## Timing of the transition

In `script.js`, inside `armTrigger`:

- `MIN` (2600 ms) — earliest it can ever fire
- `MAX` (8000 ms) — fires on its own if she never scrolls
- `DEPTH` (0.45) — fires once she scrolls 45% down the menu

## Deploying to Vercel

```bash
npx vercel --prod
```

Or push to GitHub and import the repo at vercel.com — framework preset **Other**,
no build command, output directory `.`. Rename the project in Vercel → Settings to
control the URL (e.g. `yara.vercel.app`).

Generate the QR code from the final URL, not the preview URL.

## Rehearsal

Open the site, then in the browser console run:

```
__fire()
```

That triggers the glitch immediately from wherever you are on the menu, so you can
rehearse the timing with the spotter without waiting for the scroll trigger.

## On the night

- The finale line is the cue. It sits alone on a full screen, so when it is on her
  phone it fills most of the display and is readable from across a table.
- Everything below the last note is deliberate empty space. She has to scroll through
  it, which buys the spotter a few seconds of warning before the line lands.
# yarabd2
