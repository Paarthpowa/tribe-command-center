# Docker Operations Skill

This skill covers SSH-based or local Docker container management for the project.

## When to use this skill

- Checking container status and logs
- Restarting or rebuilding services
- Running database queries
- Managing backup and rollback procedures

## Connection

```bash
# Local Docker
docker ps

# Remote (via SSH)
ssh {{SSH_ALIAS}} "docker ps"
```

## Services

<!-- Add your project's services here -->
| Service | Directory | Purpose |
|---------|-----------|---------|
| `example-api` | `/path/to/service/` | API service |
| `database` | `/path/to/db/` | Database |

## Common Commands

### Check container status
```bash
docker ps
docker logs <container-name> --tail 100
```

### Database queries
```bash
docker exec <db-container> psql -U <user> -d <database> -c '<query>'
```

### Rebuild a service
```bash
# 1. BACKUP first (mandatory before changes)
# Run your backup procedure

# 2. Make changes to service files

# 3. Rebuild (ALWAYS use --build to pick up code changes)
cd /path/to/service && docker compose up -d --build --force-recreate

# 4. Sync to version control
git add . && git commit -m "description" && git push
```

## Backup & Rollback

### Before any change
Take a snapshot of the current working state (git commit, Docker image tag, or database dump).

### Rollback via Docker image (instant, no rebuild)
```bash
docker tag <image>:backup-tag <image>:latest
docker compose up -d
```

### Rollback via code (requires rebuild)
```bash
git checkout HEAD~1 .
docker compose up -d --build
```

## Safety rules
- Always backup before making changes
- Always use `--build` flag when rebuilding after code changes
- Sync VPS/remote edits back to local workspace for version control
- Never store credentials in Docker compose files (use .env or secrets manager)
