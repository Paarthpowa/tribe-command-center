# Copilot Project Instructions ({{PROJECT_NAME}})

Purpose: Authoritative source of truth for AI agent guardrails, interaction patterns, and workflow conventions in this VS Code project. GitHub Copilot loads this file automatically. Follow the patterns below when adding or modifying code. Optimized for a "vibe coding" workflow: the human provides intent (non‑coder friendly) and the AI agent converts intent into safe, minimal, verifiable changes.

## Beginner Defaulting
If the user doesn't know an answer yet, propose a sensible default and proceed. Do not block progress.

## Operator Quick Start (Non‑Coder)
1. Describe goal in plain language (what you want changed / added / fixed).
2. Assistant replies with: checklist, assumptions (≤2), risk class, plan.
3. You approve or adjust scope (optionally grant token if High risk).
4. Assistant patches code, runs typecheck/build, reports gates & follow-ups.
5. Non-trivial decisions appended to `docs/decision-log.md` (≤10 lines each).

If stuck: ask for "safer alternative" or "explain tradeoffs". Avoid giving line-by-line code; just describe desired outcome.

## Instruction Strategy & Scope
- Repo-wide mandates live here. `AGENTS.md` summarizes them; path- or persona-specific instructions belong in `.github/instructions/*.instructions.md`.
- Commands belong near the top of each relevant section. Provide exact flags so agents can run them verbatim.
- Use bullet lists over prose and include concrete "good vs bad" examples when reinforcing style or architecture conventions.
- When a rule applies only to a subset of the project, isolate it with a clear heading so other workflows scan past it quickly.

## Model Workflow Expectations
- Start every reply with a brief acknowledgement plus a high-level plan.
- Manage work through a todo list with exactly one item `in-progress`; update statuses as tasks start or finish.
- Report status as deltas — highlight what changed since the last message instead of repeating full plans.
- Run fast verification steps yourself when feasible and note any gates you couldn't execute.

## Operational Guardrails (Authoritative)
These rules have the highest precedence. `AGENTS.md` mirrors them in shortened form; if wording differs, this section wins.

1. **Execute commands yourself.** Run CLI/git/HTTP commands directly unless a secret prompt is needed, then launch the command and let the operator paste the secret locally. Summarize results instead of listing commands for the user to run.
2. **Deploy protocol.** Feature branches must deploy as previews and report the preview URL (never deploy to production from a feature branch). Production deploys only come from `main` after merge. **Deploy commands MUST be run from `{{FRONTEND_DIR}}/`** to pick up project bindings.
3. **Working memory discipline.** Consider a Working Memory file when: (a) a task spans multiple real-world sessions, (b) VS Code shows "summarizing conversation" or ≥70% context, or (c) operator explicitly asks. For most single-session work, proceed directly — Working Memory is optional, not blocking.
4. **Decision logging.** Any non-trivial behavior change, data migration, or platform action must be reflected in `docs/decision-log.md`.
5. **No regressions.** All persistence changes must target the project's current platform abstraction — do not reintroduce deprecated providers.

## Architecture Overview
<!-- Customize per project. Keep this section updated with high-level data flow. -->
- Frontend: `{{FRONTEND_DIR}}/` — {{FRONTEND_STACK}}
- Backend / API: {{BACKEND_DESCRIPTION}}
- Data flow: {{DATA_FLOW_DESCRIPTION}}
- Key entry points: {{KEY_ENTRY_POINTS}}

## Quick Command Reference

```bash
# Frontend
cd {{FRONTEND_DIR}}
npm install              # First-time setup
npm run dev              # Development server
npm run build            # Production build
npm run typecheck        # TypeScript validation

# Deploy (preview — feature branches)
{{DEPLOY_COMMAND}} --branch <branch-name>

# Deploy (production — main branch only, after merge)
{{DEPLOY_COMMAND}} --branch main

# Platform CLI inspection
{{PLATFORM_CLI_INSPECT}}

# Verification gates (run after ANY code change)
npm run typecheck        # Must pass
npm run build            # Must succeed
# Manual smoke: {{SMOKE_CHECKLIST}}
```

## Key Folders / Files
<!-- Customize per project -->
- `{{FRONTEND_DIR}}/src/`: Application source
- `{{API_DIR}}/`: API / serverless functions
- `docs/decision-log.md`: Operational decisions (newest first)
- `docs/working_memory/`: Ephemeral agent task tracking (gitignored)

## Assistant Interaction Protocol (Strict Sequence)
1. **Intent Echo:** Restate user goal as bullet checklist (features, constraints, data touched).
2. **Assumptions:** Call out at most 2 inferred assumptions (or ask if blocking).
3. **Risk Class:** Label change Low / Medium / High (see below) + required tokens if any.
4. **Plan:** List files to read/edit, expected diff size, verification steps.
5. **Patch:** Apply minimal diff; avoid unrelated formatting.
6. **Verify:** Typecheck + build + (describe smoke steps). If unable to run, output exact commands.
7. **Summarize:** What changed, gates status, follow-ups.

## Risk Classes & Escalation Triggers
- **Low:** Pure docs, styling (CSS), isolated panel UI, copy tweaks.
- **Medium:** New worker file, new API endpoint, minor algorithm tweak, new utility function.
- **High:** Core rendering / state management, schema / data shape changes, performance-critical loops, global state patterns, storage migration.

Escalate / request token if: touching protected anchors, >3 core files, >150 LoC delta, adds dependency, alters persisted data format, or introduces new storage layer.

## Vibe Coding (Non‑Coder Operator) Guidance
When the user (non‑coder) asks for a change:
1. Restate goal as a concise checklist (what will change, files likely touched).
2. Identify risk level: core rendering / schema / worker performance / simple UI.
3. If risky token required (e.g., `CORE CHANGE OK`, `SCHEMA CHANGE OK`) and not provided: propose safer alternative or request token.
4. Propose minimal patch; avoid refactors unless solving an explicit pain point.
5. After patch: ensure typecheck + build succeed and note any manual smoke steps.
6. Update or create docs only if behavior, metrics, or public API changed — otherwise skip doc churn.
7. Offer a brief rationale when choosing between multiple implementations so the operator can approve.

Language: prefer plain language over jargon when explaining tradeoffs; surface 1–2 alternative approaches only if materially different in complexity or performance.

## Prompt Patterns (Examples)
**Good feature prompt:** "Add a toggle in the Settings panel to switch between algorithm A and algorithm B. Persist choice to localStorage. Success: user change reflected after reload; no regression in existing behavior."

**Good performance prompt:** "Reduce lookup overhead in the data processing worker (current O(n) scan). Goal: same outputs, fewer explored items (>10% improvement on medium inputs)."

**Weak prompt → Rewrite:** "Make it faster" → "Optimize priority queue: avoid sorting whole array each insert (use binary heap). Maintain identical output results."

## Minimal Patch Contract
Each change must include: reason, scope (files), diff size estimate, success criteria, rollback (revert commit). Avoid speculative refactors.

## Task Decomposition & Subagent Execution
Subagents are the **primary mechanism** for complex work. Use them by default for:
- Multi-file changes (≥3 files) or cross-surface edits (frontend + API + data)
- Research-heavy tasks (audits, schema analysis, migration planning)
- Any step that might consume >20% of context budget

**Subagent output requirements:** (1) short summary, (2) concrete deliverables (files, diffs, commands), (3) risks/follow-ups.

**Failure handling:** Retry failing subagent once with tighter prompt/context. On second failure, fall back to manual decomposition and report failure cause.

## Safer Alternative Rule
If user asks for broad refactor, first propose smallest path to accomplish user-visible benefit; proceed only after confirmation or token granting scope.

## Quality Gates (Always)
- Typecheck passes (no new TS errors).
- Build succeeds.
- Smoke: {{SMOKE_CHECKLIST}}
- Additional (if metrics): event appears in server-side whitelist and is displayed or intentionally documented as hidden.
- Run the relevant checks yourself whenever tooling is available. If a gate cannot be executed (e.g., missing dependency, platform constraint), call it out explicitly with the command you would have run and any fallback validation performed.

## Decision Log Template
```
## YYYY-MM-DD – <Title>
- Goal:
- Files:
- Diff: (added/removed LoC)
- Risk: low/med/high
- Gates: typecheck ✅|❌ build ✅|❌ smoke ✅|❌
- Follow-ups: (optional)
```

## Conventions & Patterns
- State bridging to globals: When a feature needs instrumentation, expose a single global setter rather than sprinkling tracking calls. Extend this pattern for new mode-level timers.
- Usage metrics categories (optional — only if this project uses analytics):
  - **Counters:** increment-only events.
  - **First-in-session counters:** fire a `*_first` event to also increment a separate `*_sessions` counter.
  - **Time sums:** send `{ type:'xyz_time', ms }` at end-of-session. Client accumulates, server declares `sum/count` keys.
  - **Buckets:** client chooses bucket id, server just counts.
- Adding a new metric: (1) emit in centralized tracking utility (2) add mapping server-side with counters or sum schema (3) extend stats display logic.
- Web worker performance (optional — only if this project uses Web Workers): Reuse spatial grid & neighbor caches keyed by integer parameters. When parameters change invalidating cache keys, clear caches. Preserve this to avoid memory bloat or stale data reuse.
- Large UI text generation: build condensed representation first (segments), then paginate to max length. Follow existing pagination patterns to avoid off-by-one bugs.
- Do NOT store PII; events are aggregate only. Keep new event payload fields whitelisted and non-identifying.

## Code Style Examples

### TypeScript/React Patterns
```typescript
// ✅ GOOD – Typed props, error handling, descriptive names
interface SearchQueryProps {
  query: string;
  category: string;
  maxResults: number;
}

async function runSearch({ query, category, maxResults }: SearchQueryProps): Promise<SearchResult> {
  if (!query || !category) {
    throw new Error('Query and category are required');
  }
  // ... implementation
}

// ❌ BAD – Any types, vague names, no validation
async function search(q: any, c: any, n: any) {
  return await doSearch(q, c, n);
}
```

### State Management
```typescript
// ✅ GOOD – Extract to custom hook
function useProcessingState() {
  const [result, setResult] = useState<Result | null>(null);
  const [processing, setProcessing] = useState(false);

  const process = useCallback(async (params: ProcessParams) => {
    setProcessing(true);
    try {
      const data = await runProcess(params);
      setResult(data);
    } finally {
      setProcessing(false);
    }
  }, []);

  return { result, processing, process };
}

// ❌ BAD – Inline in component body, scattered state
function DataPanel() {
  const [r, setR] = useState(null);
  const [c, setC] = useState(false);
  // ... 200 more lines of logic mixed with JSX
}
```

### Worker Communication
> _Optional — only applicable if this project uses Web Workers._

```typescript
// ✅ GOOD – Typed messages, throttled progress, error boundary
interface WorkerProgress {
  type: 'progress';
  current: number;
  total: number;
}

let lastUpdate = 0;
worker.onmessage = (e: MessageEvent<WorkerProgress>) => {
  if (e.data.type === 'progress') {
    // Throttle to ~5Hz (200ms minimum interval)
    if (Date.now() - lastUpdate > 200) {
      updateProgress(e.data.current, e.data.total);
      lastUpdate = Date.now();
    }
  }
};

// ❌ BAD – Untyped, unthrottled, no error handling
worker.onmessage = (e) => {
  updateProgress(e.data.c, e.data.t); // Floods main thread
};
```

### Usage Metrics
> _Optional — only applicable if this project uses usage tracking / analytics._

```typescript
// ✅ GOOD – Centralized in a single tracking module
import { track } from './utils/tracking';

function handleModeToggle(enabled: boolean) {
  track({ type: enabled ? 'mode_enter' : 'mode_exit' });
}

// ❌ BAD – Direct fetch calls scattered throughout components
fetch('/api/usage-event', {
  method: 'POST',
  body: JSON.stringify({ type: 'some_event' })
}); // Double counting risk + bypasses debouncing
```

## CLI Execution Policy (Generic)

### Core Mandate
The assistant MUST directly run every CLI command that does not require pasting or revealing a secret value. The operator will manually paste any secret when prompted. Do NOT ask the operator to run a command the assistant can execute. Do NOT instruct use of web UI when an equivalent CLI command exists unless:
- The CLI genuinely lacks required functionality, AND
- The limitation is stated clearly with a short justification.

### Quick Checklist
- Can I execute the command myself? → Run it and summarize the result.
- Does it require a secret? → Start the command and prompt the operator to paste the value locally.
- After 3–5 related commands, provide a concise outcome summary (IDs, URLs, counts) before moving on.
- If a failure occurs, retry once when transient and document the stderr plus next options if it persists.

### Operational Rules
1. Default to executing (not just printing) non-secret commands: deployments, listings, key reads/writes, migrations, inspections.
2. **Secret Entry Boundary:** For commands that prompt for a secret, the assistant initiates the command; the operator pastes the secret at the prompt locally.
3. **No UI Deferral:** Avoid telling user to click in a dashboard unless CLI route is missing. Provide citation if so.
4. **Batch & Verify:** After running 3–5 related CLI actions, summarize outcomes before proceeding.
5. **Idempotence First:** For potentially destructive commands, first run a dry-run/listing variant and show planned impact.
6. **Error Handling:** On command failure, attempt one focused retry if transient. If still failing, surface exact stderr + next options.
7. **Logging Hygiene:** Never log or store secret tokens; redact if accidentally echoed.

### Prohibited Patterns (require immediate self-correction)
- "Please run …" followed by a command the assistant could execute.
- Providing only a list of commands without executing them when execution is possible.
- Asking the operator to copy/paste output that can be fetched programmatically.

### Required Patterns
- Execute commands, then summarize concise results (status, IDs, counts, URLs) — not raw verbose dumps unless troubleshooting.
- For HTTP endpoint verification: use `Invoke-WebRequest` or `curl` capturing status + first bytes.
- When a secret is required: start the command, note "Operator: paste secret now (input hidden)", then continue.

## Context & Memory Protocols

### Working Memory Documents
When working on multi-step tasks (>30 minutes or >50 messages), maintain a working memory document:

**Location:** `docs/working_memory/<YYYY-MM-DD>_<task_name>.md`

**Required structure:**
```markdown
# Task: [Brief title]
Started: YYYY-MM-DD HH:MM
Status: [In Progress / Paused / Completed]

## Objective
[1–2 sentence goal]

## Progress
- [x] Step completed – key result
- [ ] Step in progress – blockers/notes

## Key Decisions
- Decision: [What was chosen]
  Rationale: [Why]
  Files: [Affected files]

## Current State
- Last file touched: …
- Next action: …
- Open questions: …
```

### When to Create / Update
- **Create:** At task start if expected duration >30 min.
- **Update:** Every 10–15 messages OR when approaching context budget limit.
- **Critical update:** IMMEDIATELY before context compaction (if VS Code warns "summarizing conversation").

### Post-Compaction Recovery
1. Read `docs/working_memory/<current_task>.md`.
2. Verify current state (git status, running processes).
3. Resume from "Next action" in working memory.
4. Continue updating working memory as work progresses.

### Cleanup
Upon task completion, move Working Memory files to `docs/archive/working_memory/` (or delete if trivial) and note the move in the decision log when relevant.

## Response Framing
- Start with a purposeful plan; reserve redundant labels only when they aid scanning.
- Keep follow-up updates focused on what changed since the prior message (delta reporting).
- Reference filenames and symbols with backticks for clarity.
- Keep answers concise — don't over-explain completed file operations.

## Common Failure Modes & Preventers
- **Double metric counting** → centralize tracking in a single module; never call `track()` from multiple places for the same semantic event.
- **Cache stale after parameter change** → ensure cache invalidation when keys/parameters change (e.g., spatial grid sizes, lookup indices).
- **Pagination regressions** → keep segment-first pagination; follow existing patterns to avoid off-by-one bugs.
- **Worker progress spam** → throttle ≥200 ms (mirror existing pattern); exceeding batch limits triggers immediate flush.
- **Speculative refactors** → apply safer alternative rule; smallest safe change first.
- **Silent metric accumulation** → document intentionally hidden counters; prefer visible display or explicit internal note.

## Adding Features (Pattern)
> _These patterns are optional — applicable when the project uses a web frontend with workers and/or analytics._

- **New engagement mode with timing:**
  1. Manage `[mode, setMode]` + `useRef` pattern in the relevant component.
  2. Expose a global setter (e.g., `window.__setNewMode`) for instrumentation bridging.
  3. In tracking util, add internal state (active flag, accumulation start/stop) & track `mode_first`, `mode_enter`, and final `mode_time` at finalize.
  4. Update server-side event whitelist with counters & sum definition.
- **New worker algorithm:**
  - Place under `src/utils/` or `workers/`. Maintain message API: input request object, progress emits, final response. Throttle progress to ≤5 Hz.
  - Keep pure, no DOM. Use caches keyed off request parameters to avoid recomputation.

## High-Risk Surfaces
<!-- Customize per project -->
{{HIGH_RISK_SURFACES}}

## When Unsure
- Search existing patterns first (grep for similar feature names).
- Mirror existing instrumented modes for any UI mode needing session vs enter counts + time.
- Keep serverless functions < ~150 lines, no external state besides managed storage, return 4xx on validation errors early.

<!-- End – Provide feedback if additional sections should be documented. -->
