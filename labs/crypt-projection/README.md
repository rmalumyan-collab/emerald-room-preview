# Crypt Room Projection Lab — v0.3 integration scaffold

This directory is an **isolated integration of actual Test 02 camera/QA math** into the existing Emerald World Builder repository. It is not a finished projection viewer or the primary game's release.

## Available now
- `src/math.mjs`: matrix/perspective/lookAt math and Y-up camera orientation.
- `src/qa.mjs`: six **synthetic blockout** landmark positions, reprojection RMS, coverage classifier, QA camera pose generator.
- `tests/qa_math.mjs`: run `node labs/crypt-projection/tests/qa_math.mjs`. No dependencies, no network.

## Verified earlier in original Test 02 archive (not automatically re-proven by a GitHub commit)
- Six landmarks; 0 px synthetic RMS, 4.703 px after test landmark offset.
- Test blockout 8 x 12 m, 584 triangles, 292 atlas faces.
- GLB structure reload and UV flip checks passed.
- GPU/WebGL2 real browser validation and production master-render fit were NOT proven.

## Next porting steps
1. Bring over projector shader and geometry from the old standalone Test 02, keep exact coordinate conventions and avoid duplicates.
2. Connect the **real approved crypt render locally** with image landmarks; log actual reprojection error.
3. Project onto one wall and pilaster. Report visible and unknown texels.
4. Add multi-view blend, UV bake/GLB and Android QA only after first end-to-end wall works.

See [technical plan](../../docs/PROJECTION_PIPELINE.md), [shared project control](../../PROJECT_CONTROL.md) and [Issue #1](https://github.com/rmalumyan-collab/emerald-room-preview/issues/1).

**Note:** the public repository does not contain or distribute any user-private master renders.
