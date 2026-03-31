# Tribe Command Center — Dev Log

> **Hackathon:** EVE Frontier × Sui Hackathon 2026  
> **Deadline:** March 31, 2026 (submission) → April 1–8 (live deploy to Stillness)  
> **Live URL:** Cloudflare Pages (auto-deploy from `master` branch)  
> **Repo:** github.com/Paarthpowa/tribe-command-center

---

## Session 1 — MVP Foundation

### What was done
- Scaffolded React 19 + Vite 8 + TypeScript project
- Added Radix UI theme (dark, purple accent) + Tailwind CSS v4
- Implemented core pages: Dashboard, Goal Detail, Create Goal, Members, Leaderboard
- Created Zustand store with `persist` middleware (localStorage)
- Built mock data: tribe, 5 members, 3 goals with tasks/contributions/timelines
- Goal/task system: create goals, pledge resources, track deliveries
- Member management: approve/reject pending members, clearance levels
- Login flow: mock wallet connect, member status gating
- Deployed to Cloudflare Pages with SPA `_redirects` rule
- Integrated `@evefrontier/dapp-kit`, `@mysten/dapp-kit-react`, `@mysten/sui` as dependencies (not yet wired up)

### Technical decisions
- **Zustand over Redux** — simpler API, built-in persist, good enough for MVP
- **Radix UI + Tailwind** — accessible primitives + utility classes
- **Mock wallet** — `setWallet('0xalpha_leader_address')` triggers login; real connect later
- **Classification system** — goals can be `normal | classified | top-secret`, visible based on member clearance

---

## Session 2 — Territory Intel & Star Map

### What was done
- Created **Intel Page** with territory management (claim/unclaim solar systems)
- Built **SystemPicker** — searchable dropdown over 4,800+ real world systems
- Pre-fetched world systems via `scripts/fetch-systems.ts` → saved as `systems-bundle.json` (static, no API call at runtime)
- Built custom **StarMap** component — HTML5 Canvas renderer with:
  - Zoom/pan (mouse wheel + drag)
  - Real system positions (normalized 0–1000 coordinate space)
  - Color-coded by category (core/frontline/contested/expansion/resource/hostile)
  - Click-to-select with hover tooltips
  - HQ marker, claimed system highlighting
- Created **SystemDetailPanel** — slide-in right panel (~700 lines) with:
  - System header: name, ID, category picker, threat level slider
  - Quick actions: Set HQ, Add Base, Scout Report, Unclaim
  - Lagrange Points section (L1–L5 grid with status picker)
  - Bases list (friendly + enemy)
  - Scouting Logs with add form
  - Resources & Dangers
  - Notes editor (per-system free text)

### Technical decisions
- **Canvas over SVG/DOM** — required for 4800+ systems without lag; SVG choked at ~500
- **Static JSON bundle** — world systems don't change often; avoids API dependency at runtime
- **L-points as grid** — L1–L5 displayed as clickable cards; each gets status: unknown/empty/friendly/enemy/contested/resource

---

## Session 3 — Game Research & Data Accuracy

### What was done
- Deep research into EVE Frontier game files:
  - Explored `E:\EVE Frontier` game installation (Stillness server)
  - Analyzed `mapObjects.db` (SQLite) — 324,883 celestial objects across 24,026 solar systems
  - Extracted code from `code.ccp` (111MB ZIP of 10,454 `.pyc` files)
  - Found Smart Assembly types: Network Node, Smart Gate, Smart Storage Unit, Smart Turret
  - Extracted fuel/energy constants, type IDs, group IDs
- **Resource taxonomy overhaul** — replaced placeholder resources with real EVE Frontier resources from wiki:
  - Ores: Veldspar, Scordite, Pyroxeres, Kernite, Omber, Jaspet, Hemorphite, Dark Ochre, Arkonor, Bistot, Crokite, Mercoxit, Spodumain, Gneiss
  - Minerals: Tritanium, Pyerite, Mexallon, Isogen, Nocxium, Zydrine, Megacyte, Morphite
  - Components (fuel, assemblies, ammo, etc.)
- Analyzed `world-contracts` GitHub repo — documented package IDs, 3-layer architecture, tribe info

### Key findings
- **Solar system hierarchy:** Star → Planets → Moons, plus Stargates
- **Character** has `tribe_id: u32` field on-chain — but no tribe management contracts exist
- **No on-chain governance/voting/quests** — our app fills that gap (good for hackathon pitch)
- FSD binary data format is proprietary (CCP's custom format, not easily readable)

---

## Session 4 — L-Point vs Orbital Zone Clarification

### What was done
- Initially confused **Lagrange Points** and **Orbital Zones** as the same concept
- Researched official docs — concluded (incorrectly) that orbital zones don't exist
- Renamed `OrbitalZone` → `LagrangePoint` throughout codebase
- **User corrected us:** Orbital Zones ARE real — they're a NEW feature from the latest game cycle

### Key clarification
| Concept | What it is | In our app |
|---------|-----------|------------|
| **Lagrange Point** | Physical anchor location (L1–L5) where Network Nodes/bases are placed | ✅ Implemented as L-point grid in SystemDetailPanel |
| **Orbital Zone** | Content area in space (mining, combat, loot) — replaced old POI system | ❌ Not yet implemented — awaiting type list from user |

### Technical changes
- `OrbitalZone` interface → renamed to `LagrangePoint`
- `orbitalZones` field → renamed to `lagrangePoints` on `TribeSystem`
- `updateOrbitalZone` store action → renamed to `updateLagrangePoint`
- Zustand persist version bumped from 3 → 4 (migration clears old data)

---

## Session 5 — Game File Deep Dive for Orbital Zones

### What was done
- Searched `code.ccp` extensively for orbital zone type definitions
- Found `frontier/crdata/common/objects/cr_orbital.pyc` — CROrbital (base class for stations/starbases, NOT orbital zones)
- Found `frontier/crdata/common/objects/cr_dungeon.pyc` — dungeons with archetypeID/signatureRadius
- Checked protobuf definitions: `combat_site_pb2`, `exploration_scanresult_pb2`, `content_pb2`
- Checked scanner/map filter modules
- **Conclusion:** Orbital zone types are **server-driven data** — not hardcoded in client code
- Awaiting user's manual list of orbital zone types

---

## Session 6 — Cloudflare Deploy & Planning

### What was done
- Verified build is clean (`tsc -b && vite build` — 0 errors)
- Committed all changes (17 files, +2224 / -363 lines)
- Pushed to GitHub → Cloudflare Pages auto-deploy triggered
- Created comprehensive project plan (see below)

---

## Current Architecture

```
src/
├── types/index.ts          (218 lines) — All TypeScript interfaces
├── stores/appStore.ts      (203 lines) — Zustand store + persist
├── components/
│   ├── StarMap.tsx          (496 lines) — Canvas 2D star map
│   ├── SystemDetailPanel.tsx(707 lines) — System drill-down panel
│   ├── SystemPicker.tsx     — World system search dropdown
│   ├── Navbar.tsx           — Top navigation
│   ├── GoalTile.tsx         — Dashboard goal cards
│   ├── TaskCard.tsx         — Expandable task + pledge bars
│   ├── PledgeModal.tsx      — Resource pledge modal
│   ├── ProgressRing.tsx     — SVG circular progress
│   ├── Timeline.tsx         — Vertical event timeline
│   ├── EFMapEmbed.tsx       — iframe for ef-map.com
│   └── ui.tsx               — StatusBadge, GlassCard primitives
├── pages/
│   ├── DashboardPage.tsx    — Stats + goal overview
│   ├── GoalDetailPage.tsx   — Goal detail + star map + tasks
│   ├── CreateGoalPage.tsx   — 2-step goal wizard
│   ├── IntelPage.tsx        (305 lines) — Territory + star map
│   ├── MembersPage.tsx      — Member list + approvals
│   ├── LeaderboardPage.tsx  — Reputation table
│   └── LoginPage.tsx        — Wallet connect screen
├── data/
│   ├── mock.ts              (238 lines) — Mock tribe/members/goals/systems
│   ├── resources.ts         (141 lines) — EVE Frontier resource catalog
│   └── systems-bundle.json  — 4800+ pre-fetched world systems
├── lib/helpers.ts           — Color/progress utility functions
└── theme/tokens.css         — CSS custom properties
```

### Data Flow
```
systems-bundle.json (static)
        ↓
  appStore.ts (Zustand)
    ├── worldSystems[] — all 4800+ systems (not persisted)
    ├── systems[] — claimed tribe systems (persisted)
    ├── members[] — tribe members (persisted)
    └── goals[] — goals + tasks + contributions (persisted)
        ↓
  Components read via useAppStore() hooks
```

### Persist Strategy
- **Persisted** (localStorage): `walletAddress`, `isConnected`, `systems`, `members`, `goals`
- **Not persisted** (reloaded from JSON): `worldSystems`, `worldSystemsLoaded`
- Version: 4 (migration < 4 clears everything)

---

## What's Done ✅

| # | Feature | Key Files |
|---|---------|-----------|
| 1 | React 19 + Vite 8 + TS + Zustand + Tailwind v4 + Radix | `package.json`, `vite.config.ts` |
| 2 | Mock wallet login + member gating | `App.tsx`, `LoginPage.tsx` |
| 3 | Dashboard with stats + goal tiles | `DashboardPage.tsx`, `GoalTile.tsx` |
| 4 | Goals: create, view, task pledges, timeline | `CreateGoalPage.tsx`, `GoalDetailPage.tsx`, `TaskCard.tsx` |
| 5 | Members: list, approve/reject, clearance | `MembersPage.tsx` |
| 6 | Leaderboard: reputation scoring | `LeaderboardPage.tsx` |
| 7 | Intel page: territory cards, claim/unclaim | `IntelPage.tsx` |
| 8 | Star Map: canvas, 4800+ systems, zoom/pan | `StarMap.tsx` |
| 9 | System Detail Panel: categories, threat, bases, scouts, notes | `SystemDetailPanel.tsx` |
| 10 | Lagrange Points: L1–L5 status grid | `SystemDetailPanel.tsx` (LPointCard) |
| 11 | Scouting logs per system | `SystemDetailPanel.tsx` (ScoutReportForm) |
| 12 | World systems API bundle | `scripts/fetch-systems.ts`, `systems-bundle.json` |
| 13 | Resource taxonomy (real EVE Frontier ores/minerals) | `resources.ts` |
| 14 | Cloudflare Pages deploy | `public/_redirects`, GitHub auto-deploy |

---

## What's Next 🔄

### Must-do (before March 31) — COMPLETED ✅
| Priority | Feature | Status | Notes |
|----------|---------|--------|-------|
| 🟢 P0 | **Orbital Zones checklist** | ✅ Done | 15 known zone names, per-system tracking in SystemDetailPanel |
| 🟢 P0 | **Real wallet connect** | ✅ Done | EVE Vault via `@evefrontier/dapp-kit` `useConnection()` hook. Demo login fallback. |
| 🟢 P0 | **Sui Move contracts** | ✅ Done | `membership` + `pledges` modules. Transaction builders in `sui.ts`. |
| 🟢 P1 | **On-chain data reads** | ✅ Done | `fetchMembershipNFTs()`, `fetchPledgeEvents()`, `fetchTribeRegistry()` |
| 🟡 P1 | **Live Stillness deploy** | Planned for April 1–8 | Requires publishing Sui Move contracts to Stillness testnet |

### Post-submission (April 1–8)
| Feature | Status | Notes |
|---------|--------|-------|
| Publish Move contracts to Stillness | Planned | `sui client publish` → set `VITE_SUI_PACKAGE_ID` + `VITE_SUI_TRIBE_REGISTRY_ID` |
| Wire `signAndExecuteTransaction` | Planned | Connect tx builders to actual wallet signing |
| Replace mock data with on-chain reads | Planned | Load tribe/member data from Sui objects at login |
| Alliance creation / join flow | Planned | Currently display-only from mock data |

### Nice-to-have (done)
| Feature | Status |
|---------|--------|
| System search & filter on Intel page | ✅ Done |
| Activity feed / News page | ✅ Done — 12 event types with date grouping & filters |
| Fleet Operations | ✅ Done — scheduling, RSVP, past ops |
| Feedback system | ✅ Done — 5 categories, anonymous, voting |
| Resource coverage analysis | ✅ Done — on Dashboard |
| Role-based unclaim protection | ✅ Done — confirmation dialog, leader/officer only |

---

## EVE Frontier Concepts Reference

| Game Concept | Description | In Our App |
|-------------|-------------|------------|
| **Solar System** | World unit with star, planets, moons, stargates | `WorldSystem` / `TribeSystem` |
| **Lagrange Point** | L1–L5 anchor locations for Network Nodes | `LagrangePoint` interface, L-point grid |
| **Network Node** | Power structure at L-point, burns fuel → energy | Tracked as `TribeBase.energy` |
| **Smart Gate** | Programmable stargate with access control | Referenced in task types |
| **Smart Storage Unit** | Item storage/dispensing | Referenced in task types |
| **Smart Turret** | Automated defense | Referenced in task types |
| **Orbital Zone** | Content area (mining/combat/loot) — NEW | ❌ Not yet implemented |
| **Character** | On-chain identity with `tribe_id: u32` | Maps to `TribeMember` |
| **Tribe** | Player group (tribe_id on Character) | `Tribe` interface |

---

## Technical Notes

- **Python path:** `C:\Users\PC-1\AppData\Local\Python\bin\python3.14.exe` (bare `python` doesn't work)
- **Game files:** `E:\EVE Frontier\stillness\code.ccp` (ZIP of 10,454 .pyc files)
- **Map data:** `mapObjects.db` SQLite — 324,883 celestials, 24,026 solar systems
- **World contracts:** github.com/evefrontier/world-contracts — Utopia (dev) / Stillness (live)
- **FSD binary:** CCP proprietary format, read via `fsdlite` module (limited access)
- **Cloudflare:** Auto-deploys on push to `master`, build command: `npm run build`, output: `dist/`
