# Workflow Scaffold

A reusable, project-agnostic scaffold for AI-assisted development workflows in VS Code.

This is not a framework. It is a workflow.

## Getting Started (Vibe Mode)

1. Open this repository in **VS Code**
2. Install **GitHub Copilot** (recommended — 30-day free trial available)
3. Open **Copilot Chat** (Agent mode recommended)
4. Run `.github/prompts/vibe-bootstrap.prompt.md`
   Open that file, copy all its contents, paste into Copilot Chat, then press enter.
5. Follow the guided setup — describe your idea, get a recommended stack, and generate your project foundation

**That's it.** The bootstrap creates your PRD, architecture draft, and next steps — then you start building.

> **Advanced users:** If you prefer manual setup, see [docs/SCAFFOLD_NOTES.md](docs/SCAFFOLD_NOTES.md) for step-by-step placeholder replacement.

### VS Code Tips for Vibe Builders

- Use Copilot Chat in **Agent mode** for multi-step work
- Avoid running multiple AI extensions at once — they can conflict
- Let the agent run safe CLI commands when appropriate
- Review diffs before committing

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
