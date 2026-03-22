# Tribe Command Center

A web-based coordination platform for EVE Frontier tribes. Define strategic goals, break them into tasks, and let tribe members pledge and track resource contributions — rebuilding civilization through organized collaboration.

Built for the **EVE Frontier × Sui Hackathon 2026** — Theme: "A Toolkit for Civilization"

## Features

- **Wallet Login** — Connect via EVE Vault / Sui wallet, identity linked to on-chain character
- **Goal Management** — Create and track tribe-wide strategic objectives
- **Task Board** — Break goals into actionable tasks with resource requirements
- **Contribution Pledging** — Members pledge resources, track delivery progress
- **Tribe Dashboard** — Overview of tribe activity, progress, and member contributions

## Tech Stack

- React 19 + TypeScript + Vite
- Radix UI + Tailwind CSS (dark EVE aesthetic)
- @evefrontier/dapp-kit (wallet connection + chain data)
- Supabase (PostgreSQL + Realtime)
- TanStack Query + Zustand

## Getting Started

```bash
npm install
npm run dev
```

See [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md) for detailed setup instructions.

---

## What's Included

- **Agent steering system** — `AGENTS.md` + `.github/copilot-instructions.md` provide guardrails, conventions, and operational rules that AI coding agents automatically pick up
- **Working Memory protocol** — maintain context across long agent sessions and survive automatic summarization
- **Risk classification** — Low/Medium/High risk classes with approval token escalation for sensitive changes
- **Three-tier permission model** — Always do / Ask first / Never do boundaries for agent actions
- **Decision logging** — templates for recording architectural choices
- **Security guidelines** — OWASP-based secure coding practices
- **VS Code config** — settings and extensions tuned for agent workflows
- **Skills** — reusable agent skills for deployment and container operations
- **Cloudflare templates** (optional) — Pages/Workers configuration starters

## Quick Start

1. Copy this scaffold into your project (or use as a template repo)
2. **Run the vibe bootstrap** — see [Getting Started](#getting-started-vibe-mode) above
3. Open in VS Code with Copilot enabled — agents automatically load the steering files
4. Start building

> **Manual alternative:** Replace `{{PLACEHOLDER}}` markers by hand — see [docs/SCAFFOLD_NOTES.md](docs/SCAFFOLD_NOTES.md)

## File Structure

```
AGENTS.md                          ← Auto-loaded agent context (VS Code 1.104+)
GITHUB-COPILOT.md                  ← Copilot playbook
llms.txt                           ← AI-readable doc pointer
.github/
  copilot-instructions.md          ← Authoritative guardrails
  security-guidelines.md           ← OWASP security rules
  prompts/
    vibe-bootstrap.prompt.md       ← Interactive setup (run this first!)
    rehydrate.prompt.md            ← Context recovery prompt
  skills/deploy/SKILL.md           ← Deploy skill
  skills/docker-ops/SKILL.md       ← Container ops skill
.vscode/
  settings.json                    ← Agent settings
  extensions.json                  ← Recommended extensions
  prompts/plan.prompt.md           ← Planning prompt
docs/
  README.md                        ← Documentation index
  WORKSPACE_ABSTRACT.md            ← Scaffold overview
  SCAFFOLD_NOTES.md                ← Customization guide
  DECISIONS_TEMPLATE.md            ← Decision log format
  COPILOT_MEMORY_GUIDELINES.md     ← Memory guidelines
templates/
  cloudflare/                      ← Optional CF config templates
```

## How It Works

VS Code 1.104+ automatically loads `AGENTS.md` into every Copilot agent conversation. GitHub Copilot also reads `.github/copilot-instructions.md` for repo-wide rules. Together, these files steer AI assistants to:

- Follow your project conventions
- Respect risk boundaries and approval workflows
- Run verification gates (typecheck, build, smoke tests)
- Log decisions and maintain context
- Execute CLI commands directly instead of asking you to run them

> **Optional:** Deployment templates are available in `templates/` when you're ready for hosting.

## Requirements

- VS Code 1.104+ (for `AGENTS.md` auto-loading)
- GitHub Copilot extension (recommended) or any VS Code-compatible AI agent
- No runtime dependencies — this scaffold contains only markdown, JSON, and configuration files

## License

See [LICENSE](LICENSE) for details.
