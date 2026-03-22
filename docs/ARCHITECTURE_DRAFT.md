# Tribe Command Center — Architecture Draft

> **Status: DRAFT** — This is the initial architecture proposal. Subject to change.

## Stack Summary

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | React 19 + TypeScript + Vite | Matches builder-scaffold dApp template; fast dev |
| **UI Library** | Radix UI + Tailwind CSS | Dark theme (EVE aesthetic), rapid component building |
| **Wallet Auth** | `@evefrontier/dapp-kit` + `@mysten/dapp-kit-react` | Official EVE SDK, handles EVE Vault + Sui wallets |
| **State** | TanStack Query + Zustand | Query for server state, Zustand for UI state |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) | Instant backend, free tier, real-time subscriptions |
| **Chain Data** | Sui GraphQL (via dapp-kit) | Read character/tribe data from chain |
| **Deploy** | Vercel or Cloudflare Pages | Free, fast, simple |

## Folder Structure

```
tribe-command-center/
├── .github/                    # Copilot instructions, prompts, skills
├── .vscode/                    # VS Code settings
├── docs/                       # PRD, architecture, decisions
├── src/
│   ├── app/                    # App shell, routing, providers
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── providers.tsx       # EveFrontierProvider + QueryClient + Supabase
│   ├── features/
│   │   ├── auth/               # Wallet connection, character resolution
│   │   │   ├── useAuth.ts
│   │   │   └── WalletConnect.tsx
│   │   ├── dashboard/          # Tribe overview
│   │   │   ├── Dashboard.tsx
│   │   │   └── TribeStats.tsx
│   │   ├── goals/              # Goal CRUD + list
│   │   │   ├── GoalList.tsx
│   │   │   ├── GoalDetail.tsx
│   │   │   ├── CreateGoal.tsx
│   │   │   └── useGoals.ts
│   │   ├── tasks/              # Task board + detail
│   │   │   ├── TaskBoard.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskDetail.tsx
│   │   │   └── useTasks.ts
│   │   └── contributions/      # Pledge + tracking
│   │       ├── PledgeForm.tsx
│   │       ├── ContributionList.tsx
│   │       └── useContributions.ts
│   ├── components/             # Shared UI (buttons, cards, modals, progress bars)
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   ├── sui.ts              # Sui/EVE chain helpers
│   │   └── types.ts            # Shared TypeScript types
│   └── styles/
│       └── globals.css         # Tailwind + EVE theme
├── supabase/
│   └── migrations/             # Database schema
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Data Model (Supabase/PostgreSQL)

```sql
-- Tribes (synced from chain or manually created)
tribes (
  id            uuid PRIMARY KEY,
  tribe_id      integer UNIQUE,          -- on-chain tribe_id (u32)
  name          text NOT NULL,
  description   text,
  created_at    timestamptz DEFAULT now()
)

-- Members (linked to wallet)
members (
  id            uuid PRIMARY KEY,
  wallet_address text UNIQUE NOT NULL,
  character_name text,
  tribe_id      uuid REFERENCES tribes(id),
  role          text DEFAULT 'member',   -- 'leader', 'officer', 'member'
  joined_at     timestamptz DEFAULT now()
)

-- Goals
goals (
  id            uuid PRIMARY KEY,
  tribe_id      uuid REFERENCES tribes(id),
  created_by    uuid REFERENCES members(id),
  title         text NOT NULL,
  description   text,
  priority      text DEFAULT 'medium',   -- 'low', 'medium', 'high', 'critical'
  status        text DEFAULT 'draft',    -- 'draft', 'active', 'completed', 'archived'
  deadline      timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
)

-- Tasks
tasks (
  id            uuid PRIMARY KEY,
  goal_id       uuid REFERENCES goals(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  task_type     text,                    -- 'build_gate', 'gather_resources', 'scout', 'defend', etc.
  location      text,                    -- system name/id (e.g., 'SOL-001')
  status        text DEFAULT 'open',     -- 'open', 'in_progress', 'completed'
  required_resources jsonb,              -- e.g., {"foam": 46, "fuel": 100}
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
)

-- Contributions (pledges)
contributions (
  id            uuid PRIMARY KEY,
  task_id       uuid REFERENCES tasks(id) ON DELETE CASCADE,
  member_id     uuid REFERENCES members(id),
  resource_type text NOT NULL,           -- e.g., 'foam'
  pledged_amount integer NOT NULL,
  delivered_amount integer DEFAULT 0,
  status        text DEFAULT 'pledged',  -- 'pledged', 'delivered', 'verified'
  pledged_at    timestamptz DEFAULT now(),
  delivered_at  timestamptz
)
```

## Key Architectural Decisions

### 1. Off-chain first (Supabase), not Sui smart contracts
**Why:** Speed of development for hackathon. Full on-chain governance would take weeks. Wallet auth proves identity; data lives in PostgreSQL for fast queries and real-time updates.
**Future:** Migrate critical state (goal completion, contribution verification) on-chain.

### 2. Wallet-based identity, not traditional auth
**Why:** Connects to EVE Frontier ecosystem. Character data (name, tribe) readable from chain via `@evefrontier/dapp-kit`.

### 3. Feature-based folder structure
**Why:** Each feature is self-contained (component + hook + types). Easy to navigate, easy to extend.

## Open Questions
- [ ] Can we read tribe membership lists from chain, or only individual character tribe IDs?
- [ ] Is there a World API endpoint for solar system names/coordinates?
- [ ] How to handle verification of resource delivery? (Manual for MVP)
- [ ] Supabase Row Level Security policies — scope by tribe_id
