# Tribe Command Center — Hackathon Submission

> **2026 EVE Frontier Hackathon** on DeepSurge  
> Submission URL: https://deepsurge.xyz/evefrontier2026  
> Deadline: March 31, 2026

---

## BASIC INFORMATION

| Field              | Value |
|--------------------|-------|
| **Active Hackathon** | 2026 EVE Frontier Hackathon |
| **Project Logo**     | `recordings/tribe-command-center-logo-512.png` (512×512 PNG) |
| **Project Name**     | Tribe Command Center |
| **Track**            | General Track |
| **Deployment Network** | Sui (testnet) |
| **Package ID**       | *(set after Move contract deployment)* |
| **Show on Projects Page** | ✅ Yes |

### Description (Version A — Detailed / Technical)

> Use this version for the main submission or when you want to highlight depth and ambition.

In EVE Frontier, civilization doesn't just happen — it's built from the ground up by tribes who coordinate across star systems, pool resources, and defend what they've claimed. But today, most of that coordination lives in spreadsheets, pinned Discord messages, and tribal knowledge that disappears when a leader goes offline.

**Tribe Command Center** changes that.

It's a real-time strategic coordination platform purpose-built for EVE Frontier tribes. A single web application replaces the patchwork of external tools with an integrated command hub where everything a tribe needs lives in one place:

- **Interactive Intel Map** — Browse star systems, claim sovereignty zones, file rift sighting reports, and track gate network coverage. Search, filter, and drill into individual systems with resource overlays and historical intel.
- **Goals & On-Chain Pledges** — Create strategic objectives, decompose them into tasks, and let members pledge resources directly via Sui Move smart contracts. The full lifecycle — pledge → deliver → approve — is tracked transparently, giving leaders verifiable proof of who contributed what.
- **Fleet Operations** — Create fleet ops with objectives, timelines, and location tags. Members RSVP their ship class and the fleet roster updates in real time.
- **Reputation & Leaderboard** — Every approved contribution feeds into a dynamic reputation score. Members earn rank through action, not words. The leaderboard highlights top contributors across all activity types.
- **Soulbound Membership NFTs** — On-chain membership via Sui Move. Each member holds a non-transferable NFT that gates access to tribe-controlled Smart Gates in the EVE Frontier world.
- **Alliance Diplomacy** — Track inter-tribe relations (allied, neutral, hostile) and manage diplomatic status at a glance.

The app connects directly to EVE Frontier through **@evefrontier/dapp-kit**, supporting EVE Vault wallet login and Smart Assembly (SSU) embedding — meaning it can run inside the game client itself. On the blockchain side, Sui Move contracts handle membership minting, pledge records, and access control logic for Smart Gates.

Built with React 19, Vite 8, TypeScript, Zustand, and Tailwind CSS. Deployed on Cloudflare Pages. Designed to be embedded in a Smart Storage Unit on Stillness.

---

### Description (Version B — Layperson-Friendly / Short)

> Use this if the submission field is short or if you want judges to immediately "get it" without technical jargon.

Imagine you're leading a tribe of 50 people in a massive space game. You need to coordinate who's mining where, which star systems your tribe controls, what resources to stockpile, and when the next fleet operation launches — all while rival tribes threaten your borders.

Right now, most tribes manage all of that through scattered Discord channels and Google Sheets. It's messy, things get lost, and there's no way to verify who actually contributed.

**Tribe Command Center** is the solution: a single web app where a tribe can see everything at once. An interactive star map shows your territory and intel. A goal system lets members pledge resources with blockchain-backed receipts — so contributions are transparent and verifiable. Fleet ops have built-in RSVP. A reputation leaderboard rewards the people who actually show up.

It plugs directly into EVE Frontier. Members log in with their in-game wallet. The app can run inside the game client via Smart Storage Units. And every member gets a blockchain membership badge that can unlock tribe-only gates in the game world.

One app. One tribe. Everything in one place.

---

## TEAM

| Member | Role |
|--------|------|
| **Paarth** (@paarth) | POC — Full-stack developer |

---

## LINKS

| Field          | URL |
|----------------|-----|
| **Project Repo** *(required)* | https://github.com/Paarthpowa/tribe-command-center |
| **Website**    | https://tribe-command-center.pages.dev |
| **Demo Video** *(required)* | *(Upload trailer to YouTube — use `recordings/tribe-command-center-trailer-v5-oblivion-A-quiet.mp4`)* |

---

## MEDIA

Upload these images to the submission:

1. `recordings/tribe-command-center-logo-512.png` — Project logo
2. `recordings/tribe-command-center-banner.png` — Banner (1200×630)
3. Screenshots from the app (take from the recording screenshots in `recordings/screenshots/`)

---

## TECHNICAL ARCHITECTURE

### Stack
- **Frontend**: React 19.2.4, Vite 8.0.1, TypeScript 5.9.3, Zustand 5.0.12, Tailwind CSS 4
- **Smart Contracts**: Sui Move (`contracts/sources/tribe_command_center.move`)
  - `membership` module — TribeRegistry (shared), MembershipNFT (soulbound)
  - `pledges` module — PledgeRecord with delivery confirmation
- **Wallet**: @evefrontier/dapp-kit (EVE Vault browser extension)
- **Deployment**: Cloudflare Pages

### Key Features
1. **Intel Map** — Interactive star-system map with resource tracking, rift sighting reports, sovereignty claims
2. **Goals & Pledge System** — Create goals, break into tasks, pledge resources on-chain via Sui Move
3. **Fleet Operations** — Create/join fleet ops with RSVP system
4. **Reputation & Leaderboard** — Track member contributions, auto-calculate reputation scores
5. **Smart Gate Access** — MembershipNFT enables tribe-gated Smart Gate networks
6. **Alliance Management** — Multi-tribe diplomatic relations (allied/neutral/hostile)

---

## STILLNESS DEPLOYMENT (Bonus +10%)

### Steps to deploy in-game:

1. **Log into EVE Frontier** → Connect to **Stillness** server
2. **Deploy a Smart Storage Unit (SSU)** in-game
3. **Open the SSU** → Copy the **Object ID** (preferred) or **Item ID**
4. **Set the dapp URL** on the SSU to: `https://tribe-command-center.pages.dev`  
   - The dapp reads `?itemId=<id>&tenant=stillness` URL params via `@evefrontier/dapp-kit`
5. **Send to CCP**:
   - Email: `community@evefrontier.com`
   - Subject: `Bonus Deployment — Tribe Command Center`
   - Body:
     ```
     Project Name: Tribe Command Center
     DeepSurge Project Page: https://deepsurge.xyz/evefrontier2026/projects/<your-project-slug>
     Object ID: <paste-object-id>
     Item ID: <paste-item-id>
     ```

### Environment Variables (for Stillness integration):
```env
VITE_EVE_WORLD_PACKAGE_ID=0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c
VITE_OBJECT_ID=<your-ssu-object-id>
```

### Pre-configured:
- `vite.config.ts` — `base: './'` for relative paths (iframe compatibility)
- `.env.example` — Template with all required env vars
- `@evefrontier/dapp-kit` v0.1.7 — Handles SmartObject connection via URL params
- Smart Assembly types supported: SSU, SmartGate, SmartTurret

---

## TRAILER FILES

| File | Description | Size |
|------|-------------|------|
| `tribe-command-center-trailer-v5.mp4` | Base trailer (voiceover only, dynamic zoom) | ~16.6 MB |
| `tribe-command-center-trailer-v5-oblivion-A-quiet.mp4` | Oblivion music (quiet) — **recommended** | ~17.6 MB |
| `tribe-command-center-trailer-v5-tunetank-epic-A-quiet.mp4` | Epic music (quiet) | ~17.5 MB |
| `tribe-command-center-trailer-v5-corporate-suspense-A-quiet.mp4` | Corporate Suspense music (quiet) | ~17.5 MB |

All trailers: ~2:44 duration, 1920×1080, h.264 + AAC, 25fps, dynamic zoom in/out per scene

---

## QUICK CHECKLIST

- [ ] Upload project logo (512×512 PNG)
- [ ] Fill project name: **Tribe Command Center**
- [ ] Write description (copy from above)
- [ ] Select track: **General Track**
- [ ] Set deployment network: **Sui**
- [ ] Paste GitHub repo URL
- [ ] Paste website URL
- [ ] Upload demo video to YouTube → paste URL
- [ ] Upload media images
- [ ] Toggle "Show on Projects Page" ON
- [ ] Deploy SSU on Stillness (April 1+) → email Object ID to community@evefrontier.com
