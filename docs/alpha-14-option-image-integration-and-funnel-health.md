# Alpha-14 Option Image Integration And Funnel Health

## Goal

Alpha-14 connects the quiz option-image pipeline and gives Admin a clearer pre-beta health view.

This round does not generate final artwork, connect LIFF, add payment, or rewrite the frontend. It prepares the 18 option image slots and makes the closed-beta dashboard easier to inspect.

## Product Problem

The quiz currently works, but the three choices still depend too much on text. Users should instantly feel that each answer is a different emotional reaction, not a traditional survey option.

At the same time, the team needs to know whether the closed-beta funnel is healthy before driving traffic.

## Implemented Scope

### Quiz Page

- Every choice card now has a replaceable option-image area.
- Image paths follow the Option Bible naming rule:

```text
assets/scenes/options/scene-01-a.png
assets/scenes/options/scene-01-b.png
assets/scenes/options/scene-01-c.png
...
assets/scenes/options/scene-06-c.png
```

- If an image fails to load, the card falls back to its gradient/symbol visual and does not break the quiz.
- Answer events now include:
  - `displayIndex`
  - `imagePath`
  - `dimensionEffect`

This lets Admin later distinguish whether users are choosing an answer because of meaning or because it was placed first.

### Assets

- Added 18 local placeholder PNG files.
- These are temporary placeholders only.
- Final generated images should overwrite the same filenames.
- Added `assets/scenes/options/manifest.json` as the image-slot source of truth.

Recommended final image size:

```text
512 x 512 px
```

The image is displayed as a small cropped thumbnail inside the 390px mobile quiz UI, so the main symbol or emotional scene must remain centered and readable at small size.

### Admin Dashboard

- Dashboard now shows health cards:
  - API
  - Supabase
  - Event tracking
  - 18 option images

- Question Assets now shows each option's:
  - option id
  - archetype
  - image path
  - image status

### API

- `/admin/summary` returns `health.optionAssets`.
- `/admin/question-assets` returns option-level image paths and image status.

## Current Limitations

- The 18 images are placeholders, not final art.
- The API does not inspect Cloudflare Pages static file availability. It reports configured image slots based on the shared quiz data.
- Real funnel quality still depends on enough closed-beta traffic.
- True share unlock still requires LIFF share counting.

## Next Step

Alpha-15 should focus on closed-beta funnel operations:

```text
real test run
-> Admin event verification
-> question-level drop-off
-> CTA conversion
-> share/deep-report intent quality
```

After that, final option images can be generated and overwritten into the 18 locked filenames.
