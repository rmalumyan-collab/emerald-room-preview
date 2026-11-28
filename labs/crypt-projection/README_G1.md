# Crypt Projection G1 — first integrated v4.1 mobile viewer (experimental)

> **Status: CODE COMMITTED, STATIC JS SYNTAX PASS, GPU RENDER NOT VERIFIED.**  
> **Branch**: `integration/unified-builder-v1` — Draft PR #2.  
> Production `main/index.html` remains unchanged.

## What this adds

`v41-camera-preview.html` is copied from the current **FAST Draft v4.1** geometry/viewer; it does not reconstruct the original crypt from image.

It augments that same mobile WebGL2 room with:
- Import a **local master JPG/PNG/WebP in the browser**. Image bytes are never uploaded or committed.
- Projector camera x/y/z, yaw, pitch and FOV editable in the UI; 'Use current view' copies player camera.
- Depth-only projector pass (WebGL2 depth texture) then projection sampling, with occlusion rejection.
- One controlled region: **left wall bay + pilaster** at x < -3.8, -5.2 < z < -2.0. Other surfaces preserve existing draft shading.
- Master-image overlay with adjustable opacity; 4 manually marked demo 3D landmarks and RMS reporting.
- Download camera/landmark JSON, plus 0°/15°/30° QA screenshots and a metrics JSON with **covered / uncovered pixel ratios only in target region**.
- Safe no-image fallback: original v4.1 shader appearance is displayed without projection.

## Local quick start

From a clone of the integration branch, run in the repo root:

```sh
python -m http.server 8765
```

On computer: `http://127.0.0.1:8765/labs/crypt-projection/v41-camera-preview.html`.

On a phone on the **same trusted private Wi-Fi**: `http://COMPUTER_LAN_IP:8765/labs/crypt-projection/v41-camera-preview.html`. This uses the local HTTP server and may need Windows firewall private-network permission.

**Do not assume the GitHub Pages root URL serves an unmerged branch.** The existing `https://rmalumyan-collab.github.io/emerald-room-preview/` serves production main, not this experimental G1 file.

## Suggested test steps
1. Open G1 preview, verify WebGL2 status and mobile joystick/camera behavior.
2. Tap **G1 · Camera Projection** and choose the original **approved master render** on device; it's retained only in the browser tab.
3. Use **Use current view** or set projector position/angles/FOV, enable image overlay; compare wall and pillar contours.
4. Mark left pilaster and left wall on the reference to obtain RMS. Prefer more distinct, depth-varying landmarks; current 4 markers are a first draft, **not** sufficient evidence of real fit.
5. Tap Projection/Coverage and then QA 0/15/30; export JSON/PNG. Check magenta uncovered areas and gray surfaces (outside test region).
6. Record actual phone model, screenshot, camera RMS, FPS and bugs. Do not merge PR before this.

## Limits and known issues
- Actual crypt master PNG/JPG bytes were not accessible in this environment; *no reference-projection quality claim* is made.
- This **G1 integration** does **not yet** implement multi-view blending, UV atlas bake, GLB export or image-based geometry reconstruction. Those remain accessible in the earlier standalone Test 02 archive, and are subsequent integration steps.
- Node static Test02 mesh/GLB and synthetic camera math pass, but this new WebGL2 shader has **not** been visually validated on a GPU. Chromium in the current sandbox returns no WebGL2 context.
- No external paid APIs, third-party images or external JS packages are used.
- Importing a private render keeps it local. Do **not** commit it to this **public** GitHub repository.
