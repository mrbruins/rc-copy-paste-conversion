# Codebase Concerns

**Analysis Date:** 2026-05-20

## Risk Relationship Map

```mermaid
flowchart TD
  A[Monolithic command file<br>src/copy-clean.tsx] --> B[Low testability]
  B --> C[No automated tests]
  C --> D[Regression risk in transforms]

  E[Clipboard loading gate<br>isLoading={!clipboardText}] --> F[Empty clipboard path]
  F --> G[Perceived loading hang]

  H[Regex-based sanitizers] --> I[Edge-case text corruption]
  I --> J[User trust and output quality risk]

  K[Per-render transform computation] --> L[Large clipboard latency]
```

## Tech Debt

**Single-file command and transform engine:**

- Issue: UI logic, clipboard IO, and all transformation functions are colocated in one file.
- Files: `src/copy-clean.tsx`
- Impact: Changes to one transformation can unintentionally affect command rendering behavior; unit-level isolation is difficult.
- Fix approach: Split into `src/transformations/` pure modules plus a thin command layer so each transform can be validated independently.

**Documentation debt in release and behavior details:**

- Issue: Release history placeholder and minimal operational docs.
- Files: `CHANGELOG.md`, `README.md`
- Impact: Hard to track behavioral changes and support regression triage across versions.
- Fix approach: Replace placeholder date and maintain behavior-focused changelog entries for each transform change.

## Known Bugs

**Empty clipboard can present as indefinite loading state:**

- Symptoms: Command can remain loading when clipboard contains empty string or cannot be read as text.
- Files: `src/copy-clean.tsx`
- Trigger: `isLoading={!clipboardText}` plus conditional state set only when `text` is truthy from `Clipboard.readText()`.
- Workaround: Copy non-empty text before opening command.

**"Remove Formatting (Plain Text)" option is functionally a no-op:**

- Symptoms: Option suggests formatting removal but returns input unchanged.
- Files: `src/copy-clean.tsx`, `package.json`
- Trigger: Transformation mapping uses `(t) => t` while command metadata promises cleaning transformations.
- Workaround: Use specific transforms like "Remove HTML Tags" manually.

## Security Considerations

**Regex sanitization can produce misleadingly "clean" output:**

- Risk: HTML tag stripping and manual entity decoding are non-comprehensive and may miss or over-strip edge cases.
- Files: `src/copy-clean.tsx`
- Current mitigation: Basic tag and entity replacements are implemented.
- Recommendations: Add corpus-based tests for malformed HTML, nested tags, uncommon entities, and mixed Unicode before claiming clean output.

**Clipboard data handling has no explicit failure path:**

- Risk: Rejected clipboard reads are not surfaced to users, masking operational failures.
- Files: `src/copy-clean.tsx`
- Current mitigation: None detected.
- Recommendations: Catch read/copy errors, show explicit failure HUD, and preserve a non-loading fallback UI.

## Performance Bottlenecks

**All transforms execute on every render for each list item:**

- Problem: Every transform recalculates immediately against current clipboard text during list rendering.
- Files: `src/copy-clean.tsx`
- Cause: Computation occurs inline inside `Object.entries(transformations).map(...)`.
- Improvement path: Memoize transformed outputs by clipboard value and defer expensive transforms until item selection when possible.

## Fragile Areas

**Regex-heavy text utilities are brittle around Unicode and markup edge cases:**

- Files: `src/copy-clean.tsx`
- Why fragile: `removeEmojis`, `toUrlSafe`, and `removeHTMLTagsAndEntities` rely on pattern assumptions that can miss combined graphemes or unusual markup.
- Safe modification: Add targeted test vectors first, then change one utility at a time with snapshot assertions.
- Test coverage: No test files detected in repository for transform correctness.

**UI labels are coupled to transformation map keys:**

- Files: `src/copy-clean.tsx`
- Why fragile: Display label and behavior registration are bound in one object; renames can alter UX surface without compatibility checks.
- Safe modification: Separate internal stable transform IDs from user-facing labels.
- Test coverage: No command rendering tests detected.

## Scaling Limits

**Clipboard-size-dependent responsiveness:**

- Current capacity: Not explicitly bounded.
- Limit: Very large clipboard payloads can degrade subtitle rendering and transform computation responsiveness.
- Scaling path: Add size thresholds, truncation previews, and lazy transformation evaluation.

## Dependencies at Risk

**Core behavior depends on Raycast runtime APIs:**

- Risk: Clipboard and HUD workflows depend on `@raycast/api` semantics and permission/runtime behavior.
- Impact: Runtime API behavior changes can affect read/write or UI feedback paths.
- Migration plan: Introduce thin wrapper utilities around clipboard/HUD calls and validate against extension updates.

## Missing Critical Features

**No automated verification layer for transformation correctness:**

- Problem: Transform regressions are likely to ship unnoticed.
- Blocks: Safe refactoring of regex and casing logic.

## Test Coverage Gaps

**Transformation engine and command-state behavior are untested:**

- What's not tested: Every transformation utility and the clipboard loading/error states.
- Files: `src/copy-clean.tsx`
- Risk: Regressions in output correctness and command UX are undetectable until runtime.
- Priority: High.

---

*Concerns audit: 2026-05-20*
