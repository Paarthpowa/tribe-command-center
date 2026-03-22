# Agents Context — {{PROJECT_NAME}}

Purpose: Provide persistent, high-signal context and guardrails for agent mode in this repository. VS Code will automatically ingest this file (1.104+). Keep it short and link out for depth.

## Workflow primer

- Start every reply with a brief acknowledgement plus a high-level plan.
- Manage work through the todo list tool with exactly one item `in-progress`; update statuses as soon as tasks start or finish.
- Report status as deltas—highlight what changed since the last message instead of repeating full plans.
- Run fast verification steps yourself when feasible and note any gates you couldn't execute.

## Project quick facts

- What: {{PROJECT_DESCRIPTION}}
- Frontend: `{{FRONTEND_DIR}}/` ({{FRONTEND_STACK}})
- Backend: {{BACKEND_DESCRIPTION}}
- Data: {{DATA_DESCRIPTION}}

Useful entry points:
- **Documentation Index**: `docs/README.md` — central map for all project documentation
- **Guardrails**: `.github/copilot-instructions.md` (source of truth for patterns)
- **Decisions**: `docs/decision-log.md` (newest first)

## Three-tier boundaries

✅ **Always do (no permission needed):**
- Read any file for context gathering
- Run build, test, lint commands
- Update working memory documents (`docs/working_memory/`)
- Write to `docs/` (decision logs, working memory, guides)
- Use documentation lookup tools (MCP servers, etc.)
- Execute automated test and verification steps

⚠️ **Ask first (coordinate before action):**
- Modifying core API contracts or protocol definitions
- Changes to high-risk runtime surfaces ({{HIGH_RISK_SURFACES}})
- Signing, certificate, or credential handling
- Creating distribution packages
- Breaking changes to cross-system payload schemas
- Adding external dependencies
- Changes spanning >3 core files or >150 LoC delta

🚫 **Never do (hard boundaries):**
- Commit secrets, certificates, private keys
- Deploy unsigned or unverified artifacts to users
- Remove failing tests to make CI pass
- Make changes outside your designated repository scope
- Skip mandatory verification scripts before distribution
- Store PII in analytics or telemetry

## Operational guardrails (summary)

Authoritative language for every mandate lives in `.github/copilot-instructions.md`. This section is a quick primer so agents see the rules even if only `AGENTS.md` is loaded.

- **Run the commands yourself.** Execute CLI / git / HTTP checks directly unless a secret prompt is required. Launch the command, ask the operator to paste secrets locally, and summarize results.
- **Preview vs production deploys.** Feature branches deploy to preview environments. Production deploys only come from `main` after merge.
- **Working memory discipline.** Consider a Working Memory file when: (a) a task spans multiple real-world sessions, (b) VS Code shows "summarizing conversation" or ≥70% context, or (c) operator explicitly asks.
- **Decision logging.** Any non-trivial behavior change, data migration, or platform action must be reflected in `docs/decision-log.md`.

Treat this list as a pointer; if wording differs, the `.github/copilot-instructions.md` version wins.

## Agent operating rules (must follow)

1. Prefer smallest safe change; don't refactor broadly without explicit approval.
2. Follow the workflow primer: purposeful preamble + plan, synchronized todo list, and delta-style progress updates.
3. CLI mandate: When possible, run CLI commands yourself and summarize results. Prompt user only for secret inputs. Never commit secrets.
4. Sensitive edits: Treat worker entry points, production config, and build pipeline files as sensitive; ask before structural changes.
5. **Manual deployment may be required**: Check whether your deployment platform auto-deploys on push. If not, YOU must execute the deploy command after pushing.
6. **Feature branch deploys**: Always use feature-branch-scoped preview deploys. Never deploy feature branches to production.

## Working Memory & Context Management

Agent Mode enforces a per-conversation context limit. When the buffer fills, VS Code silently summarizes prior turns, which is lossy. A Working Memory file helps preserve task context.

### When to use Working Memory (optional)

Recommended—not required—for:
- Tasks spanning **multiple real-world sessions** (overnight, multi-day)
- After seeing a **"summarizing conversation"** toast or ≥70% context warning
- When the **operator explicitly requests** added rigor or handoff prep

For typical single-session work, proceed directly.

### Required metadata block

```markdown
# Working Memory — <Project / initiative>
**Date:** YYYY-MM-DD HH:MMZ
**Task Name:** <What you are doing>
**Version:** <increment when meaningfully edited>
**Maintainer:** <Agent / human pairing>
```

### Template

```markdown
## Objective  ⬅ keep current
[1–2 sentence mission]

## Progress
- [x] Major milestone – note
- [ ] Upcoming step – blocker/notes

## Key Decisions
- Decision: <What>
  Rationale: <Why>
  Files: <Touched files>

## Current State  ⬅ keep these bullets current
- Last file touched: …
- Next action: …
- Open questions: …

## Checkpoint Log (self-audit)
- Agent self-check (Turn ~X / HH:MM): confirmed Objective + Next action before editing <file>.

## Context Preservation
- Active branch / services verified
- Last checkpoint: [Time / description]
- External references consulted
```

### Recovery anti-patterns
- Do **not** continue after a summarization event without re-reading context.
- Do **not** rely solely on chat history for architecture decisions.
- Do **not** invent missing details—ask the operator when information is unclear.

### Maintenance rhythm
- Update after every major milestone or multi-file edit.
- Before stepping away, ensure "Next action" reflects the very next command.
- When you see the summarization toast: (1) stop, (2) re-read the file, (3) append recap.

### Rehydration (`/rehydrate`)
When resuming after context loss: (1) read Working Memory file, (2) restate Objective/Status/Next Step, (3) ask confirmation before resuming. See `.github/prompts/rehydrate.prompt.md`.

### Cleanup
- Move completed Working Memory files to `docs/archive/working_memory/` or delete.
- Keep at most one active file per task.
- If exceeding ~200 lines, summarize into decision log and trim.

## Context Discipline & Subagent Policy

Subagents are the **primary mechanism** for complex work. Use them by default for:
- Multi-file changes (≥3 files) or cross-surface edits
- Research-heavy tasks (audits, schema analysis, migration planning)
- Any step that might consume >20% of context budget

**Subagent output requirements:** (1) short summary, (2) concrete deliverables, (3) risks/follow-ups.

**Fallback:** Break into smallest safe chunks; ask permission before proceeding with reduced scope.

## High-risk surfaces (coordinate before changing)

<!-- Replace with your project's actual high-risk areas -->
- **Core application logic** — main entry points, rendering loops, global state
- **API / Worker entrypoints** — persistence, auth, API contracts
- **Data pipelines** — run with DRY_RUN first; changes can corrupt production data
- **Telemetry** — guard against double counting; keep schemas backward compatible
- **Shared schemas** — coordinate with consumers before format changes

## Safety & boundaries

- Never commit secrets; use env vars or `.env.example` for placeholders
- Avoid large diffs (>150 LoC) or dependency adds without explicit approval
- For data migrations or bulk ops, create scripts under `tools/` with `DRY_RUN` flag
- Working memory docs in `docs/working_memory/` are gitignored — ephemeral, not permanent

Append material decisions to `docs/decision-log.md` using the template in `.github/copilot-instructions.md`.

## Fast context to load on start

- Read `.github/copilot-instructions.md` (source of truth)
- Read `AGENTS.md` (this file)
- Skim last ~40 lines of `docs/decision-log.md` for recent initiatives
- Review `docs/README.md` for documentation map

— Keep this file concise. Update when operating rules or architecture materially change.
