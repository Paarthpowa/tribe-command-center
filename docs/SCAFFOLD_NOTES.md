# Scaffold Notes — Customization Guide

How to adapt this workflow scaffold for your project.

## Step 1: Run the Vibe Bootstrap (Recommended)

The fastest way to configure this scaffold:

1. Open this repository in **VS Code**
2. Open **Copilot Chat** (Agent mode recommended)
3. Open `.github/prompts/vibe-bootstrap.prompt.md`
4. Click **Run** (or copy contents into Copilot Chat)
5. Describe your idea — the prompt recommends a stack and generates your project foundation

**If bootstrap completes successfully, skip to Step 4** (review skills). The prompt handles Steps 2 and 3 for you.

### Manual Fallback

If you prefer to configure manually, or if the bootstrap prompt is unavailable:

Every file uses `{{PLACEHOLDER}}` markers for project-specific values. Run this to find them all:

```bash
grep -r "{{" --include="*.md" --include="*.json" --include="*.jsonc" .
```

Replace each placeholder with your project's actual values. See `docs/WORKSPACE_ABSTRACT.md` for the full placeholder table.

## Step 2: Fill In Architecture

> **Note:** The vibe bootstrap handles this step automatically. These instructions are for manual setup only.

In `.github/copilot-instructions.md`, expand these sections with your project details:

1. **Architecture Overview** — Describe your frontend, backend, data layer, and deployment topology
2. **Key Folders / Files** — List critical source paths and their purposes
3. **Quick Command Reference** — Add your build, test, deploy, and lint commands
4. **High-Risk Surfaces** — Identify code areas that need extra caution (auth, payments, data migrations, etc.)

In `AGENTS.md`, update:
1. **Project quick facts** — Technology stack, deployment target, data sources
2. **High-risk surfaces** — Mirror what's in copilot-instructions.md
3. **Common tasks & success criteria** — Define what "done" looks like for recurring work
4. **Fast context to load** — List the files agents should read first

## Step 3: Configure Skills

Skills in `.github/skills/` are invocable workflows for Copilot. Customize:

- `deploy/SKILL.md` — Add your actual deploy commands and verification steps
- `docker-ops/SKILL.md` — Add your container names, SSH details, backup procedures
- Create new skills for project-specific workflows (e.g., `database-migration/SKILL.md`)

## Step 4: Set Up VS Code

1. Review `.vscode/settings.json` — settings are pre-configured for agent workflows
2. Review `.vscode/extensions.json` — add extensions relevant to your stack
3. Optional: Create `.vscode/mcp.json` if using MCP servers (Chrome DevTools, database tools, etc.)

## Step 5: Security Guidelines

Review `.github/security-guidelines.md` and:
1. Add project-specific patterns to the "Project-Specific Patterns" section
2. Record any security incidents in the "Incident Log" section
3. Ensure guidelines match your stack (e.g., add ORM-specific injection prevention)

## Step 6: Working Memory (Optional)

The Working Memory protocol in `AGENTS.md` is pre-configured. You only need to:
1. Create `docs/working_memory/` directory when needed (it's gitignored)
2. Create `docs/archive/working_memory/` for completed task files

## Step 7: Decision Logging

1. Create `docs/decision-log.md` using the template in `docs/DECISIONS_TEMPLATE.md`
2. Record your first decision: "Adopted workflow scaffold for project X"

## Step 8: Optional — Cloudflare Templates

If using Cloudflare:
1. Copy `templates/cloudflare/wrangler.example.jsonc` to your frontend directory
2. Copy `templates/cloudflare/env.example` to `.env.example`
3. Replace all placeholder IDs
4. Set secrets via `wrangler pages secret put`

If NOT using Cloudflare, delete the `templates/cloudflare/` directory.

## What to Delete

Remove anything you don't need:
- `templates/cloudflare/` — if not using Cloudflare
- `GITHUB-COPILOT.md` — if not using GitHub Copilot specifically
- `.github/skills/docker-ops/` — if not using Docker
- Individual placeholder sections in copilot-instructions.md

## What NOT to Delete

Keep these even if they seem redundant:
- `AGENTS.md` — VS Code auto-loads this; removing it degrades agent quality
- `.github/copilot-instructions.md` — primary guardrails source
- `.github/security-guidelines.md` — security baseline
- `.github/prompts/rehydrate.prompt.md` — context recovery
