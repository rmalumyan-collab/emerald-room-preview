# EMERALD WORLD BUILDER — PROJECT CONTROL / SINGLE SOURCE OF TRUTH

> **Shared across all ChatGPT chats, GitHub collaborators and local builds.**
> Read this file **before changing code**. Last manual reconciliation: **2026-11-21**.
> This file records decisions; **GitHub commits, tests, and screenshots** are the evidence for implementations.
>
> Armenian summary: Միասնական աղբյուրը GitHub-ն է։ Առանձին չաթերում որոշումները նախ գրանցվում են այստեղ, հետո իրականացվում փորձնական ճյուղերում և միայն ստուգումից հետո միացվում main-ին։

## 1. Stable baseline (do not silently overwrite)

- Repository: `rmalumyan-collab/emerald-room-preview` (currently **PUBLIC**).
- Protected by process, not by confirmed GitHub branch protection: `main`.
- Last observed stable snapshot: `8a1bd7f01b6acb619df3ec68e390fbfa65ec2899`; draft **v4.1**, 12-segment low-poly stone vault, touch controls, basic collisions, view shortcuts and on-screen FPS.
- The latest reported **59 FPS / 1,404 triangles** observation belongs to an earlier phone preview; **v4.1 has not had that same result confirmed**.
- Do not rewrite the homepage or publish experimental textures to `main` while the other chat is iterating.

## 2. Architecture decision: ONE product, two isolated lanes

```
main/index.html                     # Existing mobile WebGL2 game, preserved
PROJECT_CONTROL.md                  # This shared coordination contract
project-state.json                  # Machine-readable status; manually reconciled
docs/PROJECTION_PIPELINE.md         # Image -> geometry -> projection -> QA -> export
labs/crypt-projection/              # Experimental integration area, NO impact on main
tests/                              # Pure-math sanity checks, no paid services
```

- **Game lane:** navigation, touch controls, collisions, geometry, FPS, scene editing.
- **Projection lane:** calibrated source cameras, masks and occlusion, texture projection onto locked geometry, multi-view UV atlas, GLB export.
- Both lanes share **metres / Y-up / forward=-Z** as an explicit proposed convention; imports from other systems must convert axes.
- The existing Test 01/02 standalone prototype is **not in this repository yet**; it includes synthetic landmark math, UV/GLB export, 0°/15°/30° QA tooling, but real GPU bake on phone and real master-render validation remain unverified.

## 3. Non-negotiable implementation rules

1. **Geometry first:** locked, editable dimensions and collisions; generated images must never silently change architectural geometry.
2. **Reference is evidence, not truth of hidden geometry:** label material patches as `source`, `secondary-source`, `fallback`, `ai-inferred` or `uncovered`.
3. **Camera match:** save x/y/z, yaw, pitch, FOV, source resolution, landmarks and reprojection RMS (pixels); distinguish synthetic self-check from match to actual master render.
4. **Projection:** use depth tests / occlusion masks; reject back-facing/unseen surfaces and keep missing coverage visible in QA.
5. **Texture separation:** albedo ≠ lightmap. Do not bake hard sunlight or lamps into base color for day/night worlds.
6. **No paid external AI/services without explicit user approval.** Prefer local/open-source tools.
7. **PUBLIC repo warning:** do not commit private, restricted or third-party licensed master renders. Use local files until rights and repository visibility are resolved.
8. **QA honesty:** passing JavaScript syntax or mesh import does not prove a browser-rendered scene, photorealism, camera match or FPS.

## 4. Chronological ledger (confirmed vs proposed)

| UTC date | Source | Status | Evidence |
|---|---|---|---|
| 2026-11-20 | Crypt Test 01 standalone | LOCAL STATIC TESTS | Prototype blockout, projection, 584 triangles, 292 faces, UV/GLB checks; browser WebGL2 not verified |
| 2026-11-20 | Crypt Test 02 standalone | LOCAL MATH TESTS | Landmark RMS, camera JSON, 0/15/30 QA code; synthetic RMS=0, real render not calibrated |
| 2026-11-21 07:30 | GitHub commit `99c2e06` | COMMITTED | Standalone low-poly mobile draft |
| 2026-11-21 07:35 | GitHub commit `8a1bd7f` | COMMITTED | Vault replacement, v4.1 |
| 2026-11-21 | GitHub Issue #1 | OPEN | Projection 03 Build → Texture → Check/Export |
| 2026-11-21 | This integration branch | IN PROGRESS | Unification docs, validation code, no rewrite of main |

**Interpretation:** Latest conversation text is **not** automatically newer than the last merged code. Check commit time, SHA, PR diff and test status on every sync.

## 5. Build → Texture → Check / Export gates

### G0 — establish reproducible baseline
- [x] Identify current GitHub repo and baseline SHA.
- [ ] Other chat confirms v4.1 mobile camera/navigation after vault edit.
- [ ] Preserve a screenshot and 30-second Android FPS measurement.
### G1 — one wall + one pilaster, real-source camera matching
- [ ] Import approved **actual master render** locally.
- [ ] Identify >=3 landmarks at different depths, prefer 6.
- [ ] Measure reprojection RMS and edge offsets against real render.
- [ ] Lock geometry; report all hypothetical areas.
### G2 — multi-view source coverage
- [ ] Project master render onto one wall and pilaster with visibility/depth mask.
- [ ] Add second camera only for missing coverage; record seam quality.
- [ ] Compare 0°, 15°, 30° in same geometry; report source vs fallback coverage separately.
### G3 — portable playable asset
- [ ] Bake UV atlas with coverage mask and albedo separated from lighting.
- [ ] Export GLB, reload independently, inspect from multiple cameras.
- [ ] Benchmark actual Android WebGL2 (FPS, texture memory, draw calls).
- [ ] Document errors and open PR; merge after review only.

## 6. Cross-chat synchronization protocol

Each work session:
1. **READ**: latest `main` SHA, current integration branch SHA, open issues/PRs, this file, `project-state.json`.
2. **COMPARE**: prior knowledge versus actual commits + measured QA, sorting timestamps explicitly. Ask the other chat only for results absent from GitHub; do not claim live access to all chats.
3. **WRITE**: new proposal in Issue #1 or a scoped issue; put actual implementation in a feature branch, never as unreviewed replacement of `main`.
4. **VERIFY**: tests + mobile screenshots when available; note `PASS`, `BLOCKED`, `NOT RUN` accurately.
5. **SYNC**: update state JSON, ledger, PR, and one short user report: latest, changed, measured, blocked, next.
6. **MERGE**: only after tests and explicit decision; keep stable reference and release tag/version.

**No autonomous claim:** ChatGPT chats do not continuously share in-flight reasoning or uncommitted files. A scheduled check may inspect GitHub and recover available chat context but cannot guarantee visibility into unsaved changes in another chat. This repository and Issue #1 carry the durable handoff.

## 7. Next executable step

Port **only the pure camera-landmark/projection math and tests** into `labs/crypt-projection/` first; keep Game lane unchanged. Follow with controlled one-wall real-source projection. Avoid another full editor rewrite.

Issue: https://github.com/rmalumyan-collab/emerald-room-preview/issues/1

## 8. G2a integration checkpoint — 2026-11-21

- Implemented `labs/crypt-projection/v41-uv-glb-preview.html`, a **G2a standalone experimental view** derived from unchanged v4.1 geometry.
- Implemented `labs/crypt-projection/src/atlas-export.mjs` (quad UV atlas, GLB serialization with embedded PNG); `tests/g2_atlas_glb.mjs` and `README_G2.md` document tests and limitations.
- G2a atlas uses **one** local source image, depth-aware sampling on the designated left wall bay / pilaster, fallback face colors elsewhere, and a coverage mask distinguishing projected versus missing target pixels.
- Evidence: module syntax and test-vector UV/GLB structure PASS in V8; preview inline JS syntax PASS; `main/index.html` SHA is unchanged. **Actual phone WebGL2 shader, real master image alignment, atlas quality, and independent import of a real generated GLB NOT VERIFIED.**
- G2a does not yet implement second camera, seam dilation, full UV bake across all source-covered walls, or mobile optimization.
- Keep Pull Request #2 **draft**, do not merge until G2a real-device QA.
