# Tribe Command Center

> **EVE Frontier × Sui Hackathon 2026** — A Toolkit for Civilization

Tribe Command Center is a private coordination platform for EVE Frontier tribes. It gives player groups a secure command & control center to manage territory, plan military operations, track resources, organize fleet ops, and coordinate across a galaxy of 24,000+ solar systems — all while keeping strategic intelligence hidden from rival tribes.

## Why Private Coordination?

In EVE Frontier, Smart Assemblies (Gates, Storage Units, Turrets) are visible on the blockchain. Broadcasting your tribe's infrastructure means broadcasting it to your enemies. Tribe Command Center takes an **OPSEC-first** approach: coordination happens off-chain in a private tribal tool. Only membership proofs and pledge commitments go on-chain via Sui — everything else stays hidden.

## Features

### Territory Intelligence
- **Star Map** — Canvas-rendered 2D map of 24,502 real EVE Frontier systems with zoom, pan, search, and claimed/unclaimed visualization
- **System Claims** — 13 pre-configured claimed systems with full metadata (connections, resources, threat levels, bases, scouting data)
- **Gated Network Claim** — BFS auto-discovery: pick any system in a gated network and all connected systems are claimed automatically via live World API
- **Lagrange Points** — 5 L-points per planet, auto-generated grid. AM1-9KK HQ has 4 planets × 5 L-points = 20 trackable positions
- **L-Point Scouting Tracker** — Mark each L-point as unknown/empty/friendly/enemy with inline status picker
- **Scouting Reports** — Submit field reports tied to specific L-points, with enemy detection flags
- **Orbital Zones** — Track mining/combat/exploration content areas across Inner/Trojan/Outer/Fringe orbital regions (15 known zone names pre-loaded)
- **Rift Sightings** — Log crude rift activity (SOF/EU crude types) for fuel source tracking
- **Role-Based Territory Control** — Only Commander/Officer can claim or unclaim systems; unclaiming requires a confirmation dialog warning about data loss
- **7 System Categories** — Core, Frontline, Contested, Expansion, Resource, Hostile, Unknown — with editable threat levels (0-10)

### Goals & Tasks
- **Goal Lifecycle** — Planning → Active → Completed → Archived, with interactive status selectors
- **Task Types** — Deployment, Scouting, Resource, Defense, Logistics, Programming, Diplomacy
- **Scouting Subtypes** — Resource scouting (⛏ mining), Crude rift scouting (🌀 fuel), Enemy base scouting (🎯 hostiles)
- **Pledge & Deliver** — Members pledge resources to tasks with deadlines, then confirm delivery
- **Delivery Tracking** — Mark individual contributions as delivered, with on-time tracking
- **Task Status Controls** — Open / In Progress / Completed / Blocked dropdown on each task card
- **Classification System** — Normal (member+) / Classified (veteran+) / Top Secret (officer+leader) — clearance-gated visibility

### Fleet Operations
- **Fleet Scheduling** — Create operations with system, date/time, duration, objective, and max fleet size
- **RSVP System** — Members respond Coming / Maybe / Not Coming with timestamps
- **Upcoming vs Past** — Automatic separation of upcoming operations from completed past ops
- **Fleet History** — Past operations remain visible as a historical log

### News & Activity Feed
- **12 Event Types** — system_claimed, base_added, scout_report, goal_created, pledge_made, member_joined, hq_set, threat_alert, lpoint_updated, fleet_created, fleet_rsvp, system_unclaimed
- **Date Grouping** — Events grouped chronologically with smart date headers
- **Category Filters** — All / Territory / Intel / Goals / Fleet

### Alliance System
- **Multi-Tribe Cooperation** — Alliance tier above individual tribes for joint operations
- **Alliance Roles** — Founder / Council / Member with visual role badges
- **Shared Goals** — Goals can be tagged as alliance-level, visible to all allied tribes
- **Alliance Page** — Dedicated UI showing member tribes and alliance goals

### Member Management
- **Approval Flow** — Pending → Approved / Rejected with confirmation dialogs
- **Clearance Levels** — Pending / Member / Veteran / Officer / Leader — 5-tier hierarchy
- **Role-Based Access** — Leader/Officer can manage territory and threat levels; members and scouts have read-only territory access
- **Reputation System** — Score (0-100) based on pledge reliability: on-time deliveries, late deliveries, and failed pledges
- **Leaderboard** — Ranked members by reputation with medal badges (🥇🥈🥉) and per-member contribution history
- **Demo Login** — 4 roles available (Leader, Officer, Member, Scout) for hackathon demo

### Feedback System
- **5 Categories** — General, Member, Goal, Suggestion, Issue
- **Anonymous Mode** — Post feedback without identity attribution
- **Voting** — Upvote / downvote system for prioritization
- **Leader Moderation** — Leader role can delete inappropriate feedback

### On-Chain Integration (Sui Move)
- **Tribe Membership NFT** — Soulbound NFT proving tribe membership, usable by Smart Gate access rules (`tribe_permit`)
- **Pledge Commitments** — On-chain pledge records with amounts, deadlines, and delivery confirmations
- **Reputation Verifiability** — Pledge history becomes trustlessly verifiable across tribes
- **Chain Status Card** — Visual indicator of on-chain contract deployment status
- See `contracts/sources/tribe_command_center.move` for the full contract code

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19.2, TypeScript ~5.9, Vite 8 |
| UI | Radix UI (dark theme) + Tailwind CSS v4 |
| State | Zustand 5.0 with localStorage persistence (versioned migrations) |
| Blockchain | @evefrontier/dapp-kit, @mysten/sui (wallet connect + transaction building) |
| Smart Contracts | Sui Move (membership NFT + pledge records) |
| Data | 24,502 real systems from EVE Frontier World API (bundled JSON) |
| Deploy | Cloudflare Pages |

## Architecture

```
src/
├── components/
│   ├── Navbar.tsx              # Navigation (9 tabs) + wallet display + disconnect
│   ├── GoalTile.tsx            # Goal summary card with progress ring, badges
│   ├── TaskCard.tsx            # Task card with pledge bars, delivery tracking
│   ├── PledgeModal.tsx         # Resource pledge form (off-chain + on-chain Sui tx)
│   ├── StarMap.tsx             # Canvas-rendered 2D star map (24k+ systems)
│   ├── SystemPicker.tsx        # System search & claim interface
│   ├── SystemDetailPanel.tsx   # 420px slide-in panel (L-points, bases, scouts, rifts)
│   ├── EFMapEmbed.tsx          # Embedded EF-Map iframe
│   ├── Timeline.tsx            # Goal event timeline
│   ├── ChainStatusCard.tsx     # On-chain contract deployment status
│   ├── ProgressRing.tsx        # SVG circular progress indicator
│   └── ui.tsx                  # GlassCard, StatusBadge primitives
├── pages/
│   ├── DashboardPage.tsx       # Stats overview, resource coverage, activity, goals
│   ├── IntelPage.tsx           # Star map + territory list + system detail panel
│   ├── NewsPage.tsx            # Activity feed with date grouping + category filters
│   ├── FleetsPage.tsx          # Fleet operations: create, RSVP, past ops
│   ├── AlliancePage.tsx        # Alliance member tribes + shared goals
│   ├── CreateGoalPage.tsx      # Multi-step goal creation form
│   ├── GoalDetailPage.tsx      # Goal detail: tasks, pledges, map, timeline
│   ├── MembersPage.tsx         # Member management + clearance + approval
│   ├── LeaderboardPage.tsx     # Reputation rankings + contribution history
│   ├── FeedbackPage.tsx        # Feedback board: categories, voting, moderation
│   └── LoginPage.tsx           # EVE Vault connect + 4-role demo login
├── stores/
│   └── appStore.ts             # Zustand store with persist (v16, versioned migrations)
├── types/
│   └── index.ts                # All TypeScript interfaces
├── data/
│   ├── mock.ts                 # Demo data: tribe, members, goals, 13 systems, fleets, alliance
│   ├── systems-bundle.json     # 24,502 real systems from EVE Frontier World API
│   ├── orbital-zones.ts        # 15 known orbital zone names by region
│   └── resources.ts            # EVE Frontier resource definitions
├── lib/
│   ├── helpers.ts              # Status/color/progress utilities
│   └── sui.ts                  # Sui Move transaction builders (create_tribe, add_member, make_pledge)
contracts/
├── Move.toml                   # Sui Move package manifest
└── sources/
    └── tribe_command_center.move  # Membership NFT + Pledge contracts
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
npm run deploy     # tsc + vite build + Cloudflare Pages deploy
```

## Demo

Login with one of 4 demo accounts to explore different permission levels:

| Role | Name | Territory Access | Goal Visibility |
|------|------|-----------------|-----------------|
| **Leader** | Commander Zara | Full (claim/unclaim/edit) | All classifications |
| **Officer** | Navigator Rex | Full (claim/unclaim/edit) | Normal + Classified |
| **Member** | Engineer Kael | Read-only | Normal only |
| **Scout** | Scout Lyra | Read-only | Normal only |

## Game Design Rationale

EVE Frontier is fundamentally about **strategic information asymmetry**. Who controls which Lagrange points, where crude rifts spawn, which gates are active, where enemy bases are — this is all intelligence that gives military advantage.

Tribe Command Center respects this by keeping coordination private. The on-chain layer (Sui Move contracts) only publishes what players explicitly choose to reveal: membership proofs for Smart Gate access and pledge commitments for cross-tribe reputation building. Everything else — territory maps, scouting reports, fleet schedules, goal planning — stays within the tribe's private tool.

## Documentation

See [DEVLOG.md](DEVLOG.md) for detailed development log and session history.
