# Decision Log

## 001 — Project Bootstrap
**Date:** 2026-03-22
**Status:** Accepted
**Context:** EVE Frontier × Sui Hackathon 2026. Theme: "A Toolkit for Civilization". Need a project that fits the theme and can be built in 9 days.
**Decision:** Build "Tribe Command Center" — web-based coordination platform for tribes. Off-chain first (Supabase) with wallet auth.
**Rationale:** Tribes need organization tools; no such tool exists. Off-chain approach allows rapid MVP. Wallet auth ties into EVE ecosystem.
**Consequences:** Won't be a full on-chain project. May miss "Best Technical Implementation" but strong for "Most Utility" and "Most Creative".

## 002 — Stack Selection
**Date:** 2026-03-22
**Status:** Accepted
**Context:** Need fast dev, good UX, wallet integration.
**Decision:** React 19 + Vite + Radix UI + Tailwind + Supabase + @evefrontier/dapp-kit
**Rationale:** Builder-scaffold dApp template uses same stack (minus Supabase). Known patterns, fast iteration. Supabase gives instant backend with real-time and RLS.
**Consequences:** Dependency on Supabase free tier limits. Could migrate to self-hosted later.

## 003 — Workflow Scaffold
**Date:** 2026-03-22
**Status:** Accepted
**Context:** Using AI-assisted development (Copilot) heavily for hackathon.
**Decision:** Use Diabolacal's workflow-scaffold as project foundation for agent steering.
**Rationale:** Provides structured agent workflow, risk classification, working memory. Recommended by active hackathon participant (EF-Map builder). Reduces agent drift.
**Consequences:** Some scaffold files (Cloudflare templates, deploy skills) are not needed but don't hurt.
