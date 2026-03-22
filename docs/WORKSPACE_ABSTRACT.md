# Workspace Abstract

> A one-page overview of what this scaffold provides and how to start using it.

## What Is This?

This repository is a **workflow scaffold** — a reusable starting point for projects that use AI coding agents (GitHub Copilot, Claude, GPT, etc.) within VS Code. It contains:

- **Agent steering files** that guide AI assistants on conventions, guardrails, and operational rules
- **Working Memory protocol** for maintaining context across long sessions
- **Risk classification system** (Low/Medium/High) with approval tokens for sensitive changes
- **Decision logging** templates for recording architectural choices
- **VS Code configuration** tuned for agent-assisted workflows
- **Security guidelines** based on OWASP Top 10
- **Optional templates** for Cloudflare Pages/Workers deployment

## What It Is NOT

- Not a web framework or starter kit — there is no application code
- Not opinionated about language, framework, or cloud provider (except optional Cloudflare templates)
- Not a replacement for CI/CD — it complements your pipeline with agent-level guardrails

## How to Use

### Starting a New Project (Recommended: Vibe Bootstrap)

1. Clone or copy this scaffold into your project directory
2. Open in **VS Code** with Copilot enabled
3. Open `.github/prompts/vibe-bootstrap.prompt.md` and run it in Copilot Chat (Agent mode)
4. Describe your idea — the prompt recommends a stack and generates foundation docs
5. Review the completion checklist and commit

### Starting a New Project (Manual Fallback)

1. Clone or copy this scaffold into your project directory
2. Search for `{{PLACEHOLDER}}` markers and replace with your project details
3. Fill in project-specific sections (architecture overview, key folders, high-risk surfaces)
4. Delete templates you don't need (e.g., `templates/cloudflare/` if not using Cloudflare)
5. Commit and begin development

### Key Placeholders to Replace

| Placeholder | Description | Example |
|---|---|---|
| `{{PROJECT_NAME}}` | Your project name | `my-saas-app` |
| `{{FRONTEND_DIR}}` | Frontend source directory | `web/`, `client/` |
| `{{FRONTEND_STACK}}` | Frontend technology | `React + TypeScript + Vite` |
| `{{BACKEND_DESCRIPTION}}` | Backend architecture | `Express API + PostgreSQL` |
| `{{DEPLOY_COMMAND}}` | Primary deploy command | `npm run deploy` |
| `{{PLATFORM_CLI}}` | Platform CLI tool | `wrangler`, `vercel`, `aws` |
| `{{SSH_ALIAS}}` | Server SSH shortcut | `ssh my-vps` |
| `{{HIGH_RISK_SURFACES}}` | Critical code areas | `src/auth/`, `migrations/` |
| `{{SMOKE_CHECKLIST}}` | Manual verification steps | `Login works, API responds` |

### File Map

```
.github/
  copilot-instructions.md   ← Authoritative agent guardrails (read by Copilot)
  security-guidelines.md    ← OWASP-based secure coding rules
  prompts/
    vibe-bootstrap.prompt.md ← Interactive setup — run this first!
    rehydrate.prompt.md      ← Context recovery after memory loss
  skills/
    deploy/SKILL.md          ← Deploy workflow skill
    docker-ops/SKILL.md      ← Container operations skill
.vscode/
  settings.json              ← Agent-related VS Code settings
  extensions.json            ← Recommended extensions
  prompts/
    plan.prompt.md           ← Planning prompt template
docs/
  COPILOT_MEMORY_GUIDELINES.md  ← What to store in Copilot Memory
  DECISIONS_TEMPLATE.md      ← Decision log entry template
  README.md                  ← Documentation index
  SCAFFOLD_NOTES.md          ← Customization guide (this detail)
templates/
  cloudflare/                ← Optional Cloudflare config templates
AGENTS.md                    ← Root agent context (auto-loaded by VS Code 1.104+)
GITHUB-COPILOT.md            ← Copilot-specific playbook
llms.txt                     ← AI-readable documentation pointer
README.md                    ← This file (project overview)
```

## Running Agents

Once placeholders are filled in, AI agents will automatically pick up:
- `AGENTS.md` — loaded by VS Code agent mode on every conversation
- `.github/copilot-instructions.md` — loaded by GitHub Copilot for repo-wide rules
- `.github/skills/` — available as invocable skills in Copilot Chat

No additional setup is needed beyond opening the project in VS Code with Copilot enabled.
