# Crypt Room Projection G2b — weighted atlas + material modes + source provenance

**Branch**: `integration/unified-builder-v1` · Draft PR #2.  
**State**: CODE + AUTOMATED NODE TESTS PASS. **Actual GPU bake, camera alignment and Android QA NOT VERIFIED.**

This is a correction of the G2a UV texture-density flaw found in the 2026-11-21 /truth audit, **not a finished photorealistic room**.

## Changes actually implemented
1. `src/weighted-atlas.mjs`: deterministic UV area-weighted variable-size tiles, 90-degree tile rotation, no overlap, gutter allocation, edge-pixel dilation.
2. `v41-uv-glb-preview.html`: default UV bake uses weighted layout (1024²/2048²), dilation in exported atlas/mask, GPU buffers re-created correctly on atlas-size changes. One test region: left wall bay + pilaster. The rest uses existing low-poly fallback colors.
3. `src/atlas-export.mjs`: two **explicit** GLB material modes, `unlit` (pixel-comparison QA) and `pbr` (lit surface test). Switching to PBR does **not** remove preexisting shadows from a generated source image.
4. `src/scene-contract.mjs`: source/camera/geometry/bake provenance in a validated JSON manifest. Actual source bytes never leave the local browser or get committed to this public GitHub repository.
5. `.github/workflows/crypt-projection-checks.yml`: CI runs the original camera tests, G1/G2 static tests, G2b weighted UV and GLB tests, and manifest validation after every experiment change.

## Measured structural change
The actual v4.1 source generator contains **936 triangles / 468 quad faces**, not the older Test02 mesh (584 triangles).
- Equal-size 1024 atlas: each face gets ~46.5px cell width, ~41px usable.
- Weighted 1024 atlas: some large wall quads receive **403 × 218px cell** (~399 × 214 usable after gutter). It varies per face, according to physical dimensions and importance.
- The deterministic CPU test found zero UV rectangle overlaps and zero out-of-bounds tiles on all 468 quads. This is a *geometry/UV packing* improvement only, not a verified texture-fidelity improvement.
- Gutter dilation copies each tile's interior edge pixels outward by 2px. Real GPU seam quality has not been observed.

## How to try without paid services
Clone or download the **integration branch** on your computer (not main), and start a local HTTP server from repo root:
```sh
python -m http.server 8765
```
Open `http://127.0.0.1:8765/labs/crypt-projection/v41-uv-glb-preview.html`. On Android use computer LAN IP (same Wi-Fi).

Inside the preview:
- Load local approved `.png`, `.jpg`, or `.webp` reference; file is **not uploaded**.
- Match projector camera and reference overlay; mark control points, record actual RMS.
- Test Projection and Coverage modes, take 0°/15°/30° QA captures.
- Select **1024²** or **2048²**, **Bake atlas**, download texture, mask and GLB.
- Select **Unlit** to inspect source pixels or **PBR** to test dynamic lighting. **Do not interpret the latter as recovered physically accurate albedo.**
- GLB export additionally downloads `crypt_g2_scene_manifest.json` with geometry SHA, source filename/dimensions, calibration parameters, coverage and every acceptance flag set to unverified.

## Guardrails / gate to proceed
- The six archived `crypt-v2-panel-01...06.png` renders are **candidate references** only; they are not proven geometric matches to current v4.1 blockout. Work locally; do not push them to the public repository.
- Next real proof must use one approved reference and a semantically matching **locked wall + pilaster**, not the current approximate v4.1 proportions if they differ.
- Record real source-camera fit (image RMS plus contour overlay), 0°/15°/30° images, source versus fallback coverage, UV seam inspection, independent GLB re-import and Android FPS.
- Keep PR #2 **draft** and `main/index.html` untouched until evidence and explicit approval.

## Automated tests
```sh
node labs/crypt-projection/tests/qa_math.mjs
node labs/crypt-projection/tests/g1_static.mjs
node labs/crypt-projection/tests/g2_atlas_glb.mjs
node labs/crypt-projection/tests/g2b_weighted_atlas.mjs
node labs/crypt-projection/tests/scene_contract.mjs
```
The CI workflow validates those five tasks without paid APIs. The GitHub Actions result is the source of truth for the latest commit.
