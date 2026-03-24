# Tribe Command Center

> **EVE Frontier × Sui Hackathon 2026** — A Toolkit for Civilization

Tribe Command Center is a private coordination platform for EVE Frontier tribes. It helps player groups manage territory, plan operations, track resources, and coordinate across a galaxy of 24,000+ solar systems — all while keeping strategic intelligence secure from rival tribes.

## Why Private Coordination?

In EVE Frontier, Smart Assemblies (Gates, Storage Units, Turrets) are visible on the blockchain. Broadcasting your tribe's infrastructure is broadcasting it to your enemies. Tribe Command Center takes an **OPSEC-first** approach: coordination happens off-chain in a private tribal tool. Only membership proofs and pledge commitments go on-chain via Sui — everything else stays hidden.

## Features

### Territory Intelligence
- **Star Map** — Canvas-rendered 2D map of 24,500+ real EVE Frontier systems with zoom, pan, and search
- **System Claims** — 7 pre-configured claimed systems with full metadata (connections, resources, threat levels)
- **Lagrange Points** — 5 L-points per planet, auto-generated grid. ING-00K HQ has 5 planets × 5 L-points = 25 trackable positions
- **L-Point Scouting Tracker** — Mark each L-point as unknown/empty/friendly/enemy/contested/resource with inline status picker
- **Scouting Reports** — Submit field reports tied to specific L-points, with enemy detection flags
- **Orbital Zones** — Track mining/combat/exploration content areas (15 known zone names pre-loaded)
- **Rift Sightings** — Log crude rift activity for fuel source tracking

### Goals & Tasks
- **Goal Lifecycle** — Planning → Active → Completed → Archived, with interactive status selectors
- **Task Types** — Deployment, Scouting, Resource, Defense, Logistics, Programming, Diplomacy
- **Scouting Subtypes** — Resource scouting (⛏ mining), Crude rift scouting (🌀 fuel), Enemy base scouting (🎯 hostiles)
- **Pledge & Deliver** — Members pledge resources to tasks with deadlines, then confirm delivery
- **Delivery Tracking** — Mark individual contributions as delivered, with on-time tracking
- **Task Status Controls** — Open/In Progress/Completed/Blocked dropdown on each task card
- **Classification** — Normal / Classified (officer+) / Top Secret (leader only)

### Alliance System
- **Multi-Tribe Cooperation** — Alliance tier above individual tribes for joint operations
- **Alliance Roles** — Founder / Council / Member with visual role badges
- **Shared Goals** — Goals can be tagged as alliance-level, visible to all allied tribes
- **Alliance Page** — Dedicated UI showing member tribes and alliance goals

### Member Management
- **Approval Flow** — Pending → Approved / Rejected with confirmation dialogs
- **Clearance Levels** — Pending / Member / Officer / Leader — determines which goals are visible
- **Reputation System** — Score based on pledge reliability (on-time vs late vs failed deliveries)
- **Leaderboard** — Ranked members by reputation score
- **Demo Login** — 4 roles available (Leader, Officer, Member, Scout) for hackathon demo

### On-Chain Integration (Sui Move)
- **Tribe Membership NFT** — Soulbound NFT proving tribe membership, usable by Smart Gate access rules (`tribe_permit`)
- **Pledge Commitments** — On-chain pledge records with amounts, deadlines, and delivery confirmations
- **Reputation Verifiability** — Pledge history becomes trustlessly verifiable across tribes
- See `contracts/sources/tribe_command_center.move` for the full contract code

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19.2, TypeScript ~5.9, Vite 8 |
| UI | Radix UI (dark theme) + Tailwind CSS v4 |
| State | Zustand 5.0 with localStorage persistence |
| Blockchain | @evefrontier/dapp-kit, @mysten/sui (wallet connect) |
| Smart Contracts | Sui Move (membership + pledges) |
| Data | 24,502 real systems from EVE Frontier World API (bundled) |
| Deploy | Cloudflare Pages |

## Architecture

```
src/
├── components/         # UI components
│   ├── Navbar.tsx      # Navigation with member name + logout
│   ├── GoalTile.tsx    # Goal card with progress ring, badges
│   ├── TaskCard.tsx    # Task with pledge bars, delivery tracking
│   ├── PledgeModal.tsx # Resource pledge form
│   ├── StarMap.tsx     # Canvas-rendered 2D star map
│   ├── SystemPicker.tsx # System search & claim interface
│   ├── SystemDetailPanel.tsx # 420px slide-in panel (L-points, bases, scouts)
│   ├── ProgressRing.tsx # SVG progress indicator
│   └── ui.tsx          # GlassCard, StatusBadge primitives
├── pages/
│   ├── DashboardPage.tsx    # Stats, goals grid, activity feed
│   ├── IntelPage.tsx        # Star map + territory overview
│   ├── AlliancePage.tsx     # Alliance member tribes + shared goals
│   ├── CreateGoalPage.tsx   # Goal creation form
│   ├── GoalDetailPage.tsx   # Goal detail with task list
│   ├── MembersPage.tsx      # Member management
│   ├── LeaderboardPage.tsx  # Reputation rankings
│   └── LoginPage.tsx        # EVE Vault connect + demo login
├── stores/
│   └── appStore.ts     # Zustand store (persist v8)
├── types/
│   └── index.ts        # All TypeScript interfaces
├── data/
│   ├── mock.ts         # Demo tribe, members, goals, systems, alliance
│   ├── systems-bundle.json  # 24,502 real systems from API
│   └── orbital-zones.ts     # 15 known orbital zone names
├── lib/
│   └── helpers.ts      # Status/color/progress utilities
contracts/
├── Move.toml           # Sui Move package manifest
└── sources/
    └── tribe_command_center.move  # Membership + Pledge contracts
```

## Development

```bash
npm install
npm run dev        # Start dev server at http://localhost:5173
npm run build      # TypeScript check + production build
npm run preview    # Preview production build locally
```

## Deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name tribe-command-center --branch master
```

## Demo

Login with one of 4 demo accounts to explore different permission levels:

| Role | Name | What you can see |
|------|------|-----------------|
| **Leader** | Commander Zara | Everything (all classifications) |
| **Officer** | Navigator Rex | Normal + Classified goals |
| **Member** | Engineer Kael | Normal goals only |
| **Scout** | Scout Lyra | Normal goals only |

## Game Design Rationale

EVE Frontier is fundamentally about **strategic information asymmetry**. Who controls which L-points, where resources are located, which gates are active — this is all intelligence that gives military advantage.

Tribe Command Center respects this by keeping coordination private. The on-chain layer (Sui Move contracts) only publishes what players explicitly choose to reveal: membership proofs for gate access and pledge commitments for reputation building. Everything else — territory maps, scouting reports, goal planning — stays within the tribe's private tool.

## Documentation

See [DEVLOG.md](DEVLOG.md) for detailed development log and session history.
