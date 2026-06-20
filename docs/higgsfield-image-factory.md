# Higgsfield Image Factory

This project can use Higgsfield CLI for future archetype image generation.

## Local CLI Status

- CLI package: `@higgsfield/cli`
- Commands: `higgsfield`, `higgs`, `hf`
- Auth: completed locally through `higgsfield auth login`
- Account: Plus plan with available credits

Do not commit tokens or auth output. The CLI stores auth outside this project.

## Useful Commands

```powershell
& "$env:APPDATA\npm\higgsfield.cmd" account status
& "$env:APPDATA\npm\higgsfield.cmd" model list --image
& "$env:APPDATA\npm\higgsfield.cmd" generate create <model> --prompt "<prompt>"
& "$env:APPDATA\npm\higgsfield.cmd" generate wait <job_id>
```

## Candidate Models

Use model choice by task:

- `gpt_image_2`: high-quality prompt following, good first pass for brand systems.
- `recraft_v4_1`: likely useful for clean vector-like emblem / logo directions.
- `flux_2`: useful for strong stylized illustration variants.
- `seedream_v4_5` / `seedream_v5_lite`: useful for alternative image-model comparison.
- `image_auto`: useful when model selection should be delegated to Higgsfield.

## Current Approved Asset Set

Locked v1 reference:

- `assets/references/techno-spiritual-crests-LOCKED-v1.png`

Status:

- Locked by explicit user approval.
- Logo-level linework. Lines, silhouettes, proportions, and composition must not change.
- Do not replace active frontend assets unless the user explicitly asks for a new version.
- Future Higgsfield work should be limited to material, color, lighting, background, and presentation treatments.
- Do not use image generation to reinterpret or redraw the crest shapes.

Active frontend assets:

- `assets/archetypes/explorer.png`
- `assets/archetypes/craftsman.png`
- `assets/archetypes/guardian.png`
- `assets/archetypes/navigator.png`
- `assets/archetypes/strategist.png`
- `assets/archetypes/inventor.png`
- `assets/archetypes/trader.png`
- `assets/archetypes/mentor.png`
- `assets/archetypes/builder.png`

Machine-readable registry:

- `assets/archetypes/manifest.json`

## Generation Direction

Prompt core for future non-destructive material / presentation variants:

```text
Preserve the exact provided logo linework, silhouette, proportions, and composition.
Do not redraw, reinterpret, simplify, or alter any lines.
Only change material, color, lighting, background, and presentation.
Logo-level techno-spiritual kamon crest, premium material rendering,
foil / metal / glass / holographic treatment, no text, no watermark.
```

Nine archetypes:

- AI探險家 / 隼
- AI工匠 / 獾
- AI守護者 / 鯨
- AI領航員 / 海豚
- AI策士 / 狐
- AI發明家 / 蜂鳥
- AI交易員 / 獵豹
- AI導師 / 貓頭鷹
- AI建造者 / 象

## Recommended Next Workflow

1. Use `assets/references/techno-spiritual-animal-crests-approved-v1.png` as the visual reference.
2. Generate a 3x3 sheet first to preserve consistency.
3. If the sheet is approved, crop it into the nine active `assets/archetypes/{key}.png` files.
4. Preserve the previous version in a timestamped backup folder.
5. Update `assets/archetypes/manifest.json` version when replacing the active set.

## Test Log

### 2026-06-19 GPT Image 2 3x3 Crest Test

- Model requested: `gpt_image_2`
- Cost estimate before generation:
  - `recraft_v4_1`, 1k/vector: 2.5 credits
  - `gpt_image_2`, 1k/medium with reference: 2 credits
- Job id: `0b32e1bb-d1d6-4887-9595-c60fcc1cfefa`
- Output: `assets/higgsfield-tests/gpt-image-2-crests-3x3-test-20260619.png`
- Result URL: `https://d8j0ntlcm91z4.cloudfront.net/user_3DM9P1CH25zXSEdMgvNuyFXPROi/hf_20260619_021022_0b32e1bb-d1d6-4887-9595-c60fcc1cfefa.png`
- Actual observed account delta: about 7 credits
- Note: Higgsfield result metadata showed `resolution: 2k` and `quality: high`, even though the request attempted `1k` and `medium`. Future tests should run `generate cost` with the exact metadata defaults, or inspect whether the model ignores those flags.

Assessment:

- Good: strong black/gold/teal crest language, high animal readability.
- Issue: animal order drifted from the requested nine archetypes, and several animals became too literal / tattoo-like.
- Decision: keep as test output only; do not replace approved frontend assets.

### 2026-06-19 Recraft V4.1 3x3 Crest Tests

First attempt:

- Model: `recraft_v4_1`
- Output: `assets/higgsfield-tests/recraft-v4-1-crests-3x3-test-20260619.png`
- Issue: prompt was effectively truncated to the first line in returned metadata, generated labels/text, wrong concepts, and unusable order.
- Decision: keep as failed test output only.

Second attempt:

- Model: `recraft_v4_1`
- Params: `resolution=1k`, `model_type=vector`, `batch_size=1`
- Cost estimate: 2.5 credits
- Job id: `8b6f5e79-e0b8-4ce8-be26-45417523a2d0`
- SVG output: `assets/higgsfield-tests/recraft-v4-1-vector-crests-3x3-test-20260619.svg`
- PNG preview: `assets/higgsfield-tests/recraft-v4-1-vector-crests-3x3-test-20260619.png`
- Result URL: `https://d8j0ntlcm91z4.cloudfront.net/user_3DM9P1CH25zXSEdMgvNuyFXPROi/hf_20260619_022352_8b6f5e79-e0b8-4ce8-be26-45417523a2d0.svg`

Assessment:

- Good: correct animal order, no labels, clean vector-like marks, strong readability, closer to the desired kamon / logo system direction.
- Issue: AI technology feeling is lighter than the approved reference set; future prompt should ask for slightly more teal circuit nodes and one consistent AI core per emblem.
- Decision: best Higgsfield candidate so far; keep as strong test candidate, but do not replace approved frontend assets without one more refinement pass.

Observed credits:

- After GPT test: 1088.58 credits
- After Recraft attempts: 1084.83 credits
- Approximate Recraft delta: 3.75 credits across the two Recraft generations.
