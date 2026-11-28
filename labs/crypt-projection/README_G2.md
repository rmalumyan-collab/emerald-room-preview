# Crypt Projection G2a — UV Bake & GLB Export / 2026-11-21

**Status: EXPERIMENTAL; code committed and pure export logic tested, full WebGL2 GPU bake/phone rendering NOT YET VERIFIED.**

## Where to find it
- Preview: `labs/crypt-projection/v41-uv-glb-preview.html`
- UV/GLB code: `labs/crypt-projection/src/atlas-export.mjs`
- Node/unit test: `labs/crypt-projection/tests/g2_atlas_glb.mjs`
- Shared branch: `integration/unified-builder-v1`. Stable production `main/index.html` remains unchanged.

## What G2a actually implements
- Derives from the G1 viewer on *the exact same v4.1 blockout geometry* (not the original crypt).
- Uses one **local approved JPG/PNG/WebP** via existing G1 upload input; no source image uploaded to GitHub or external service.
- Maps every independent quad (6 vertex triangles) into a unique padded UV atlas cell (top-left origin).
- Builds offscreen GPU atlas from **the same calibrated source camera**, depth-occluded projection (source) or fallback face color. Target remains **left wall bay + pilaster** only; remaining geometry preserves v4.1 draft color.
- Renders an independent source-coverage mask, reports covered versus missing target texels.
- Exports PNG atlas, PNG coverage mask, GLB with embedded baked atlas, and JSON bake provenance manifest. GLB is unlit to separate material appearance from dynamic lighting.

## Local run
Start a static web server in the repo root:

```sh
python -m http.server 8765
```

Open:
`http://127.0.0.1:8765/labs/crypt-projection/v41-uv-glb-preview.html`

On same trusted Wi-Fi, open the same path using your computer's local IP instead of 127.0.0.1. Repository **main GitHub Pages root** does not expose experimental branch content. Avoid opening the HTML as `file://` because the local ES module import requires HTTP.

### Steps
1. Verify WebGL2 room renders. Open **G2a · Camera Projection + UV/GLB**.
2. Select the actual approved master render from local phone/computer storage. Do not commit it to this public repo.
3. Match the projector camera and compare with image overlay; mark landmarks and record RMS.
4. Check Projection/Coverage in the room before baking.
5. Choose **1024² mobile**, then **Bake atlas**.
6. Save UV PNG, mask PNG, GLB, and manifest. The exported GLB is a self-contained geometry+texture asset.
7. Independently open GLB in Blender or another glTF viewer and inspect 0°, 15°, 30°; compare with source render and verify uv direction. Check Android FPS and memory.

## What is still missing
- The approved source render itself and verified camera calibration.
- GPU runtime test: shader compile, atlas orientation and correct depth/occlusion on Android.
- Secondary-view projection, seam feathering/dilation and real multi-source coverage; **G2a is one-source only**.
- Independent end-to-end glTF reimport for the **actual GPU-produced** PNG/GLB, and phone FPS.
- Selection of actual surface semantic objects: G2a uses simple world-coordinate mask for one bay, not a production semantic segmentation.
- UV cells are padded but *not texture-bleed dilated*; edge seams may appear with bilinear sampling.
- The bake keeps approximate face colors where source projection is unavailable; coverage fallback does **not** prove photographic detail.
- glTF unlit material uses PNG for appearance; final interactive lighting/PBR pipeline still pending.

## Tests
`node labs/crypt-projection/tests/g2_atlas_glb.mjs` tests UV packing, GLB structure, embedded PNG bytes, UV orientation, incorrect-input rejection, and static JS syntax. A passing **Node test is not a WebGL2 GPU check**.

## Merge gate
Do **not** merge draft PR #2 until source calibration, actual UV atlas GPU bake, independent glTF reload, and mobile QA are performed, with results logged in Issue #1.
