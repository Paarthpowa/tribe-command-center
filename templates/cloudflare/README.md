# Cloudflare Pages + Workers Template

This folder contains example configuration files for deploying a project with Cloudflare Pages and Workers.

## Quick Start

1. **Copy template files** to your project root or frontend directory:
   ```bash
   cp templates/cloudflare/wrangler.example.jsonc my-app/wrangler.jsonc
   cp templates/cloudflare/env.example my-app/.env.example
   ```

2. **Replace placeholders** in `wrangler.jsonc`:
   - `{{PROJECT_NAME}}` → your Cloudflare Pages project name
   - `{{KV_NAMESPACE_ID}}` → your KV namespace ID (from `wrangler kv namespace create`)
   - `{{COMPATIBILITY_DATE}}` → today's date (e.g., `2026-02-14`)
   - Remove any binding sections you don't need (R2, Durable Objects, etc.)

3. **Set secrets** (never commit these):
   ```bash
   wrangler pages secret put API_TOKEN --project-name my-project
   ```

4. **Deploy**:
   ```bash
   # Preview deploy (feature branches)
   npm run build
   wrangler pages deploy dist --project-name my-project --branch feature/my-branch

   # Production deploy (main branch only)
   npm run build
   wrangler pages deploy dist --project-name my-project --branch main
   ```

## Key Concepts

### Pages vs Workers
- **Cloudflare Pages**: Static site hosting with automatic builds (or manual CLI deploys)
- **Workers**: Serverless functions for API routes, middleware, etc.
- **Pages Functions / _worker.js**: Combine static hosting with Worker logic

### Preview Deployments
- Feature branches create isolated preview URLs (e.g., `https://abc123.my-project.pages.dev`)
- Preview URLs get fresh cache entries — always test on these, not alias URLs
- Alias URLs (e.g., `https://feature-branch.my-project.pages.dev`) may have stale Fetch API cache

### Manual vs Automated Deploys
- Projects created via CLI (`wrangler pages project create`) do NOT auto-deploy on `git push`
- Projects linked to GitHub auto-deploy on push to configured branches
- When using CLI-created projects: **you must run `wrangler pages deploy` manually after each push**

### KV Namespaces
```bash
# Create a namespace
wrangler kv namespace create MY_NAMESPACE

# List keys
wrangler kv key list --namespace-id <id>

# Read/write
wrangler kv key get <key> --namespace-id <id>
wrangler kv key put <key> <value> --namespace-id <id>
```

### Secrets Management
```bash
# Set secret for all environments
wrangler pages secret put SECRET_NAME --project-name my-project

# Set secret for specific branch (preview env)
wrangler pages secret put SECRET_NAME --project-name my-project --branch feature/xyz
```

## Common Wrangler Commands

```bash
# Authentication
wrangler login
wrangler whoami

# Deployments
wrangler pages deployment list --project-name my-project
wrangler pages deploy dist --project-name my-project --branch <branch>

# KV inspection
wrangler kv namespace list
wrangler kv key list --namespace-id <id>
wrangler kv key get <key> --namespace-id <id>

# Version check
wrangler --version
```

## Related Files
- `wrangler.example.jsonc` — Annotated Wrangler configuration template
- `env.example` — Environment variable placeholders
- See project `AGENTS.md` and `.github/copilot-instructions.md` for deployment protocols
