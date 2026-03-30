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

### Description

**Tribe Command Center** is a strategic coordination platform for EVE Frontier tribes. It replaces spreadsheets and Discord chaos with a unified web application where tribe leaders can:

- **Map & claim gate networks** — interactive star-system intel map with system details, resource tracking, and sovereignty claims
- **Coordinate building projects** — goal/task management with on-chain pledge system (Sui Move smart contracts)
- **Lead fleet operations** — fleet creation, RSVP tracking, and reputation leaderboards
- **Track contributions** — transparent pledge-deliver-approve workflow with soulbound Membership NFTs

Built with **React 19 + Vite 8 + TypeScript + Zustand**, integrated with **Sui Move smart contracts** for on-chain membership NFTs, pledge records, and Smart Gate access control. Uses **@evefrontier/dapp-kit** for EVE Vault wallet connection and Smart Assembly integration.

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
| **Demo Video** *(required)* | *(Upload trailer to YouTube — use `recordings/tribe-command-center-trailer-v3-oblivion-A-quiet.mp4` or `tunetank-epic-A-quiet` variant)* |

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
| `tribe-command-center-trailer-v3.mp4` | Base trailer (voiceover only) | ~15.6 MB |
| `tribe-command-center-trailer-v3-oblivion-A-quiet.mp4` | **Winner** — Oblivion music | ~16.6 MB |
| `tribe-command-center-trailer-v3-tunetank-epic-A-quiet.mp4` | **Winner** — Epic music | ~16.6 MB |

All trailers: 2:44 duration, 1920×1080, h.264 + AAC, 25fps

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
