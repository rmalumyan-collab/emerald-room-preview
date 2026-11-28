# Emerald World Builder — Scene/Projection Contract v1

**Implementation**: `labs/crypt-projection/src/scene-contract.mjs`.  
**Coverage**: the single Crypt Room lab, NOT yet the full coast → cave → lake editor/player.

## Why this exists
The same data must survive ChatGPT conversation handoffs and editor/playback exports. The manifest is the shared *evidence* describing geometry revision, source image, camera settings, UV bake settings and acceptance. It is **not a replacement for original source images**, and it must never guess unobserved room dimensions.

## Contract v1 fields
- `schemaVersion:1`, `sceneId`, and fixed coordinates `metre / +Y / -Z`.
- `geometry`: stable ID, source commit SHA, triangles/quads, draft versus approved flags.
- `sources[]`: ID, original file **name**, dimensions, provenance/rights and `storage:local-only`. **No image bytes, server URL, or private absolute path** may be committed to this public repo.
- `cameras[]`: source ID, metre position, yaw/pitch radians, FOV degrees, optional marked 2D landmarks, reprojection RMS and calibration flag.
- `bakes[]`: camera/source references, atlas size, area-weighted UV, 2px gutter, material mode (`unlit` reference comparison vs `pbr` lighting experiment), source coverage distinct from fallback.
- `acceptance`: all false/not-verified until real source fit, exported atlas GLB reload and Android evidence exist.

The exported browser manifest is generated in `v41-uv-glb-preview.html` after GLB creation. Validation rejects invalid units, disallowed source storage, mismatched geometry counts, source/camera mismatches, impossible coverage values and premature `userApproved: true`.

## Important limits
- This v1 manifest only stores one source/camera/bake. It does **not yet** provide the editable island route, save/reopen UI, source mask versioning, automatic dirty dependency graph, full material categories or multi-view stitching.
- `KHR_materials_unlit` compares baked pixels without changing them. `pbr` can respond to external lighting, **but an original image with visible shadows is not automatically a neutral albedo**. This is not physically validated PBR.
- Weighted UV packing gives larger geometry larger cells, **not better source image sharpness where there are no pixels to project**.
- An RMS value from synthetic self-render does not prove camera match against a real approved master.
- Do not claim performance improvements until measured on the target phone.
- Do not merge `integration/unified-builder-v1` to `main` without explicit stage acceptance and real device QA.

## Gated path from here
1. Approve one candidate source **locally** (previously recovered six `crypt-v2-panel-XX.png` files); compare against v4.1 geometry and correct actual shape first.
2. Record real landmark RMS with one wall / one pilaster; save proof manifest and a screenshot.
3. Test 1024/2048 weighted atlas + mask; open exported GLB independently and inspect seams/lighting.
4. Benchmark Android 0°, 15°, 30° source coverage, device FPS and time-to-first-frame.
5. Only then implement multi-view stitching, editor serialization, and merge decisions.
