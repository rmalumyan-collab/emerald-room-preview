# /truth · Emerald World Builder — cross-branch acceptance audit
**Date**: 2026-11-21 · **Result**: **CONDITIONAL NO-GO for main merge**, **GO for targeted proof-of-work and fixes**.

## Evidence sources and exact baselines

- Original 20-stage Master Prompt: dual entry (map/image) -> editable game-ready scene, metre scale, preserve geometry and linked references, prove walkability, image fit, phone results, iterative explicit acceptance.
- GitHub `main` commit `8a1bd7f01b6acb619df3ec68e390fbfa65ec2899` — standalone v4.1 low-poly HTML preview, unchanged in integration branch (same index.html blob).
- Integration head before this report `04e9abc246333daaff6bc487f923077166b272b5`, **20 commits ahead**, **0 behind**, **15 added files**, open **draft PR #2**.
- Earlier Crypt Room standalone Test02: 584 triangles / 292 atlas faces / 8x12m **synthetic greybox**, six landmarks RMS=0 only on self-render; perturbed RMS=4.703px, independent GLB import successful. **Not a real reference matching test**.
- Current v4.1 geometry extracted from source's actual `face()` builder: **936 triangles, 468 quads, 2808 expanded GPU vertices**. This is **not the same mesh as Test02**.
- G2 atlas uses equal UV cells: ceil(sqrt(468))=**22** per row/column. For 1024² atlas each quad receives **46.5px cell width before padding**, 2048² yields **93.1px**. With 6% padding, useful width is about **40.96px / 81.92px**. Large walls and tiny decorative faces get the same cell size.
- The G2 exporter generated a small **2-triangle** specimen GLB with embedded PNG; independent `trimesh` import read 1 mesh / 2 triangles / UVs / PBRMaterial and 2x2 texture. This validates container/attribute basics, not actual G2 GPU bake.
- GPU shader execution, real uploaded master render, multi-view seam quality, Android measured FPS/memory and continuous coast→cave→lake walkthrough: **NOT VERIFIED**.

## Original requirements versus status

| Contract requirement | Observed state | Verdict |
|---|---|---|
| No destructive edits to existing game | `main/index.html` stays byte-identical; draft PR only | PASS |
| Unified versioned record for both chats | PROJECT_CONTROL.md, AGENTS.md, project-state.json, PR #2 and Issue #1 | PASS (recording only; uncommitted chat work not automatic) |
| One editable scene model for map/image, editor and game | Current repository only root preview plus isolated labs, no unified editable manifest for route | NOT MET |
| Scale and locked geometric correspondences | Synthetic metric mesh only; actual crypt and route dimensions not verified | PARTIAL |
| Real image-to-camera calibration | UI/landmarks implemented; no approved master image tested | NOT VERIFIED |
| Occlusion-aware image-to-surface projection | WebGL2 source code implemented; live GPU output not observed | STATIC ONLY |
| UV baking and portable GLB | UV/GLB serializer unit tested; real GPU atlas not independently verified | PARTIAL |
| Multi-source coverage, seams, confidence labels | G2a still single-source; fallback source provenance incomplete | NOT MET |
| Albedo separate from dynamic lighting | Current GLB extension KHR_materials_unlit ignores dynamic lights (okay for QA, NOT production day/night) | TECHNICAL GAP |
| Mobile opens with one HTTPS link | G2 only in unmerged branch; local HTTP server required | NOT MET |
| Mobile >=30 median FPS / <=10MB before walk target | No G2 device measurement, no startup transfer benchmark | NOT VERIFIED |
| Measured multi-fold authoring acceleration | No timed A/B comparing manual pipeline to G2 | NOT VERIFIED |
| Stage-by-stage explicit approval | G1->G2 implemented without passing real-render acceptance for G1 | PROCESS DEVIATION |

## Root causes and severity

**P0 — actual acceptance evidence missing**
- The critical requirement is real approved render -> camera matching -> source projection -> UV -> exported model -> same room from 0/15/30 on Android.
- Our current V8 and Node static tests do not substitute for this.
- Do not merge this PR or claim "ready for game".

**P1 — texture quality flaw**
- Equal quad-per-cell 22x22 atlas wastes texels on tiny shapes and starves large stone walls; first 1024 atlas gives ~41 usable pixels per quad side.
- Replace with area/importance-weighted atlas packing or merge coplanar wall patches; allocate sufficient texels per world unit. Do not choose final resolution without device memory measurements.

**P1 — rendering/material flaw**
- G2 uses `KHR_materials_unlit` for baked base color. For QA this compares pixels, but it cannot respond to changing world lights.
- Keep switchable unlit QA mode; add PBR-lit runtime material and separately captured source albedo/normal/AO/optional lightmap. Do not bake hard light into stone diffuse.

**P1 — integration gap**
- Main is a playable low-poly *room*, not the original coast→cave→lake route/editor. Current independent demo geometry is not accepted original crypt geometry.
- Version comparison alone is not artistic/geometry validation; older v3.3.1 archive had 3492 triangles across 278 objects according to its own local /truth, but was also not camera/phone validated. Compare only using same source and QA.

**P2 — privacy, mobile and workflow**
- GitHub repo is public: never upload unpublished/private master renders without rights and deliberate visibility change.
- G2 branch is not published as simple one-tap HTTPS preview. Local browser must load via HTTP due ES module relative import.
- Original contract gates explicit stage acceptance; restore evidence and checkpoint before moving to G2b.

## Actual tests performed for this audit

| Verification | Result |
|---|---|
| GitHub refs, draft PR #2, commit diff, main unchanged | PASS (connector) |
| Test02 `node tests/verify.mjs` in available local snapshot | PASS: 584 triangles, 292 faces, 400 atlas cells, GLB structure, UV flip |
| Test02 `node tests/qa_math.mjs` | PASS: 6 synthetic marks, RMS=0 self-render, 4.703px perturbed |
| G2 stand-alone 2-triangle GLB independently read via `trimesh` | PASS: UV and 2x2 texture available |
| Extract v4.1 `face()` generation into restricted JS test, count triangles and atlas cells | PASS: 936 triangles / 468 quads / grid=22 |
| New G2 Shader on actual GPU / 0°/15°/30° / Android | NOT RUN, no WebGL2 in assistant environment |
| Real approved master image compared with geometry | NOT RUN, source not established in current worktree |

## Reference asset recovery discovered during this audit

The user's existing Library **does contain six candidate crypt texture images**:
`crypt-v2-panel-01.png` through `crypt-v2-panel-06.png`.
- Visual inspection of panels 01, 02, 04 and 05 shows photoreal weathered stone, vaulted ceiling, niches, pilasters, altar/stair or doorway from different directions.
- These are useful **candidate source references** for a controlled one-wall test; no user re-upload should be presumed necessary until access to the selected assets is established in the running pipeline.
- They are **not** yet proven to be synchronized views of one exact 3D geometry, and not necessarily the immutable approved master image. Do not claim camera matching or scale based on appearance.
- Crucial observed mismatch: v4.1 is a stylized low-poly room with banners/rings/approximate pillars; panel images have articulated arched niches and detailed stone ribs. Camera projection cannot repair geometric/semantic differences. Lock an approved **matching geometry revision** before projecting these assets.
- Because GitHub repository is public, **do not commit candidate image bytes** without rights and explicit authorization. Use them locally for calibration/QA.

## Corrective sequence — STOP ADDING NEW FEATURES FOR A MOMENT

**Gate A / one actual source**
- Choose a single approved source for **one wall + one pilaster** and a known geometry revision. Keep image local.
- Test G1 projected overlay and >=4 non-coplanar landmarks, record px RMS and a screenshot. Mark uncertain geometry.

**Gate B / source-first texture**
- Use G2 source projection with depth mask. Export atlas, coverage mask, GLB, and camera/manifest.
- Confirm actual source-covered fraction separately from fallback; read exported GLB independently. Fix UV alignment; no broad claims from coverage alone.

**Gate C / quality and phone**
- Fix atlas texel density and lit PBR mode before judging visual quality.
- Run actual phone preview using SAME approved source and 0/15/30 captures; log device, FPS median, initial bytes, artifacts.
- Measure authoring time manually for 1 wall manually vs pipeline (same geometry and quality threshold).

**Gate D / unified app**
- Only after A–C, integrate source/camera/material/geometry/QA dependency model in project manifest and unified editor-player route. Preserve main and existing Emerald Island geometry, review draft PR.
- Register explicit stage acceptance decision before merge. A new sample room is **not** full Emerald World Builder acceptance.

## Decision
**NO-GO for promotion of G2a to `main`**. **GO for proof-of-work one-wall camera/texture and P1 UV fixes**. No paid services, private assets, merges or external publishing without approval.

Issue #1: https://github.com/rmalumyan-collab/emerald-room-preview/issues/1
PR #2: https://github.com/rmalumyan-collab/emerald-room-preview/pull/2
