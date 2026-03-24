# Tribe Command Center

> **EVE Frontier × Sui Hackathon 2026** — A Toolkit for Civilization

Tribe Command Center is a coordination platform for EVE Frontier tribes. It helps player groups manage territory, plan operations, track resources, and coordinate across a galaxy of 24,000+ solar systems.

## Features

- **Territory Intel** — Claim solar systems, track Lagrange points (L1–L5), log scouting reports
- **Interactive Star Map** — Canvas-rendered 2D map of 4,800+ real world systems with zoom/pan
- **Goals & Tasks** — Create strategic goals, break into tasks, pledge & deliver resources
- **Member Management** — Approve/reject members, set clearance levels, reputation tracking
- **Leaderboard** — Reputation scoring based on pledge reliability
- **System Detail Panel** — Deep drill-down into each system: bases, scouts, resources, dangers, notes

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8
- **UI:** Radix UI (dark theme) + Tailwind CSS v4
- **State:** Zustand 5 with localStorage persistence
- **Blockchain:** @evefrontier/dapp-kit, @mysten/sui (Sui integration)
- **Deploy:** Cloudflare Pages (auto-deploy from `master`)

## Development

```bash
npm install
npm run dev        # Start dev server
npm run build      # TypeScript check + production build
npm run preview    # Preview production build
```

## Documentation

See [DEVLOG.md](DEVLOG.md) for detailed development log, architecture overview, session history, and roadmap.
