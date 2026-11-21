# Instructions for collaborators and coding agents

**Read `PROJECT_CONTROL.md` and `project-state.json` before writing code.** These are the shared handoff across ChatGPT chats and human GitHub collaborators.

## Safe development
- Current product: `index.html` at repository root, mobile WebGL2 FAST Draft v4.1. Do not replace it or silently change `main`.
- Do work in a feature branch; use `labs/crypt-projection/` for camera/texture experiments. Update the shared state only after evidence, and open a PR for review.
- If working in another chat: begin by checking **fresh GitHub** commits, active branches/PRs, Issue #1, and their times. The newest chat message does not prove a code commit.
- Keep tests and provenance. Labels: `COMMITTED`, `LOCAL_TESTED`, `BROWSER_VERIFIED`, `PHONE_VERIFIED`, `PROPOSED`, `BLOCKED`.
- Never call synthetic 0 px RMS "matched to actual master"; distinguish depth-aware projected coverage from visual similarity.
- Use metres, Y up, forward -Z; all transforms must state coordinates; protect approved geometry.
- No paid external services without the user's approval. Never upload private/proprietary reference images into the PUBLIC repository.
- Keep production game and texture source separate; AI fills only masked missing regions.
- No automatic merges from another chat without explicit review.

## Ready-to-run local check
`node labs/crypt-projection/tests/qa_math.mjs`

## Integration milestones
- First: one original render + one wall + one pilaster, calibrated with landmarks.
- Second: two-view projection, depth mask, source/fallback confidence, seam QA.
- Third: UV bake / GLB reload / Android WebGL2 screenshots and FPS.
- Report what was verified vs not run. Update Issue #1 and the canonical docs.
