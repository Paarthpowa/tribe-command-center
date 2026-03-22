# Decision Log Template

Use this template for recording non-trivial technical decisions. Append entries to a `docs/decision-log.md` file in your project (newest first).

---

## YYYY-MM-DD – Title of Decision

- **Goal:** What problem or objective drove this decision
- **Context:** Brief background (1-2 sentences)
- **Decision:** What was chosen and why
- **Alternatives considered:** Other options evaluated (if any)
- **Files:** List of files created/modified
- **Diff:** +X / -Y lines (approximate)
- **Risk:** Low | Medium | High
- **Gates:** typecheck ✅|❌  build ✅|❌  smoke ✅|❌
- **Follow-ups:** Any deferred work or monitoring needed

---

## Tips

- **One entry per decision** — don't batch unrelated choices
- **Keep entries short** (≤10 lines of content)
- **Newest first** — prepend, don't append
- **When to log:**
  - Any non-trivial behavior change
  - New dependencies or external integrations
  - Data schema or storage format changes
  - Platform or infrastructure decisions
  - Security-relevant changes
  - Performance-critical algorithm choices
- **When to skip:**
  - Pure formatting/style changes
  - Documentation-only updates (unless policy changes)
  - Routine dependency bumps with no breaking changes

## Example Entry

```markdown
## 2026-01-15 – Switch session storage from localStorage to IndexedDB

- **Goal:** Support storing >5MB of cached route data
- **Context:** Users with 50+ saved routes hit localStorage quota limits
- **Decision:** Migrate to IndexedDB using idb wrapper library; localStorage kept as fallback for older browsers
- **Alternatives considered:** (1) Compress localStorage data — rejected, fragile and still size-limited; (2) Server-side storage — rejected, adds latency and auth complexity
- **Files:** src/utils/storage.ts, src/utils/storage-migration.ts (new)
- **Diff:** +180 / -30
- **Risk:** Medium (touches persistence layer)
- **Gates:** typecheck ✅  build ✅  smoke ✅
- **Follow-ups:** Monitor error rates for 1 week; remove localStorage fallback in v3.0
```
