# Copilot Memory Usage Guidelines

> **VS Code 1.109+** introduced [Copilot Memory](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/copilot-memory) — a feature that persists learnings across chat sessions.

This workspace enables Copilot Memory at the workspace level via `.vscode/settings.json`. This document defines what **should** and **should not** be stored in memory.

## What to Store (Encouraged)

Memory is ideal for persistent context that would otherwise require repeated explanation:

| Category | Examples |
|----------|----------|
| **Repo conventions** | "This project uses TypeScript strict mode", "Always run typecheck before build" |
| **Branch naming** | "Feature branches follow `feature/<name>`, hotfix branches follow `hotfix/<name>`" |
| **Release process** | "Preview deploys for feature branches", "Production only from main" |
| **Response style** | "Always ask clarifying questions when in doubt", "Prefer concise answers" |
| **Directory map** | "Frontend code lives in `src/`", "API routes are in `api/`" |
| **Build commands** | `npm run typecheck && npm run build` |

## What NOT to Store (Prohibited)

Do **not** store any of the following in Copilot Memory:

| Category | Why |
|----------|-----|
| **Personal information** | PII leakage risk — names, emails, usernames |
| **Secrets / credentials** | API keys, tokens, passwords — use env vars or secret managers |
| **Temporary plans** | Short-lived task context belongs in Working Memory files (`docs/working_memory/`), not persistent memory |
| **Contentious opinions** | Avoid storing subjective style preferences that may conflict with other contributors |

## Managing Your Memories

View and delete memories from:
- **GitHub Web**: [Copilot settings → Memory](https://github.com/settings/copilot)
- **VS Code**: The memory tool will list stored memories when invoked

## Workspace Setting

```jsonc
// .vscode/settings.json
{
  "github.copilot.chat.copilotMemory.enabled": true
}
```

## Related Documentation

- [GitHub Copilot Memory docs](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/copilot-memory)
- [Working Memory protocol](../AGENTS.md#working-memory--context-management) (for ephemeral task context)
