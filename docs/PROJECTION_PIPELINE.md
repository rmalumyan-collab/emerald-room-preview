# Projection 03 — Technical implementation spec

This is a **lab inside the existing GitHub repository**, not a second game or replacement for the mobile v4.1 home page.

## Purpose
Turn approved crypt render(s) into textured, metrically editable, navigable WebGL2 geometry through:

`approved image(s) -> locked geometry -> calibrated camera(s) -> depth-aware projection -> UV bake -> GLB -> mobile QA`.

## Already moved into this repository
- `src/math.mjs`: perspective, view matrix, transforms, camera forward (ported from Test 02).
- `src/qa.mjs`: six demo landmarks, image projection, RMS measurement in pixel units, sentinel coverage classification, 0/15/30 QA camera generation (ported from Test 02).
- `tests/qa_math.mjs`: deterministic synthetic self-test, run with `node labs/crypt-projection/tests/qa_math.mjs`.

**Important:** these landmarks describe the prior **8 x 12 m test mesh**, not the current v4.1 vault or final crypt. Do not apply these landmark coordinates to v4.1 without remapping.

## What is *not* integrated yet
- Test 02's WebGL2 projector shader, geometry builder and UI
- Real approved master render + independent source camera
- Multi-camera blending / seam correction / texture confidence map
- GPU UV atlas baking; GLB export integration into current mobile draft
- Verified Android screenshots and FPS for the combined pipeline

## Minimal data model for next implementation
```json
{
  "sceneId": "crypt-room-01",
  "geometryRevision": "draft-v4.1-or-locked-mesh-revision",
  "coordinateSystem": {"units": "metres", "up": "+Y", "forward": "-Z"},
  "sources": [
    {"id": "master-01", "kind": "approved-render", "url": "LOCAL_ONLY", "width": 0, "height": 0}
  ],
  "cameras": [
    {"id": "cam-master-01", "sourceId": "master-01", "x": 0, "y": 1.7, "z": 4.7, "yaw": 0, "pitch": 6, "fov": 65, "landmarks": {}}
  ],
  "surfaces": [
    {"id": "left-wall-01", "geometryRevision": "same-as-scene", "locked": true, "textureSource": null, "coverage": "uncovered"}
  ]
}
```
Never include actual private image bytes in the public repository.

## G1: real camera matching
1. Start with one source image and one **locked wall + pilaster** from approved geometry.
2. Place 6 landmarks with varying depth; log pixel RMS, missing landmarks, image dimensions, real/master data origin.
3. Do not report 0 px from synthetic test as real camera match.
4. Save camera JSON and a blend overlay screenshot.
5. Failure => adjust calibration or geometry explicitly; do not warp locked geometry to force a beautiful screenshot.

## G2: projection plus second source
- For each texel/surface sample, check its world position, normal, camera clip, depth occlusion and source pixel confidence.
- Prefer primary source if visible and facing it; only use secondary on missing pixels.
- Mark `source` / `secondary-source` / `fallback` / `ai-inferred` / `uncovered` in a separate mask.
- Detect seams and try dilation/feathering only where correspondences are trustworthy.
- Report projected fraction on 0°, 15°, 30° QA views; distinguish measured pixels from approximate wall area.

## G3: UV / GLB / phone
- Bake source-projected color into atlas with independent coverage mask. Albedo must not include new lighting.
- Use offline glTF validation or independent import (Blender/Trimesh); verify texture UV orientation on export.
- Measure actual Android phone: FPS, frame time if available, texture allocations and GLB size.
- Compression (KTX2, meshopt) comes **after** a baseline export and validated semantics.

## Merge gate
No replacement of `main/index.html` until:
- verified browser open on phone, screenshot attached,
- baseline unaffected,
- active Issue #1 updated with real test results,
- explicit review of draft PR.

## Proposed small checks (not accomplished unless recorded)
- Real landmark RMS goal: define against actual render after collecting marks.
- 30° original-source coverage aspirational target >=80%, **separate from fallback coverage**.
- Mobile smoothness preliminary target >=30 FPS on weaker test device; measure, never assume.
