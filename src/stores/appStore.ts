import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Goal, Tribe, TribeMember, TribeSystem, WorldSystem, Contribution, MemberClearance, SystemCategory, TribeBase, ScoutingLog, LagrangePoint } from '../types';
import { MOCK_GOALS, MOCK_TRIBE, MOCK_MEMBERS, MOCK_SYSTEMS } from '../data/mock';
import systemsBundleData from '../data/systems-bundle.json';

/** Clearance hierarchy — higher index = more access */
const CLEARANCE_RANK: Record<MemberClearance, number> = {
  pending: 0,
  member: 1,
  officer: 2,
  leader: 3,
};

/** Minimum clearance required per classification */
const CLASSIFICATION_CLEARANCE = {
  'normal': 1,     // member+
  'classified': 2, // officer+
  'top-secret': 3, // leader only
} as const;

interface AppState {
  /* Auth / Wallet */
  walletAddress: string | null;
  isConnected: boolean;

  /* Tribe */
  tribe: Tribe | null;
  members: TribeMember[];

  /* World Systems — full atlas from API bundle */
  worldSystems: WorldSystem[];
  worldSystemsLoaded: boolean;

  /* Tribe Territory — systems claimed by this tribe */
  systems: TribeSystem[];

  /* Goals */
  goals: Goal[];

  /* Computed helpers */
  currentMember: () => TribeMember | undefined;
  visibleGoals: () => Goal[];

  /* Actions */
  setWallet: (address: string | null) => void;
  addGoal: (goal: Goal) => void;
  updateGoalStatus: (goalId: string, status: Goal['status']) => void;
  addContribution: (taskId: string, contribution: Contribution) => void;
  updateTaskStatus: (taskId: string, status: Goal['tasks'][number]['status']) => void;

  /* Access control */
  approveMember: (memberId: string) => void;
  rejectMember: (memberId: string) => void;
  setClearance: (memberId: string, clearance: MemberClearance) => void;

  /* Territory management */
  loadWorldSystems: (systems: WorldSystem[]) => void;
  claimSystem: (worldSystem: WorldSystem, category?: SystemCategory) => void;
  unclaimSystem: (systemId: number) => void;
  updateSystem: (systemId: number, updates: Partial<TribeSystem>) => void;
  setHQ: (systemId: number) => void;
  addBase: (systemId: number, base: TribeBase) => void;
  removeBase: (systemId: number, memberName: string) => void;
  addScoutingLog: (systemId: number, log: ScoutingLog) => void;
  updateLagrangePoint: (systemId: number, lp: LagrangePoint) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      walletAddress: null,
      isConnected: false,
      tribe: MOCK_TRIBE,
      members: MOCK_MEMBERS,
      worldSystems: systemsBundleData as WorldSystem[],
      worldSystemsLoaded: true,
      systems: MOCK_SYSTEMS,
      goals: MOCK_GOALS,

      currentMember: () => {
        const { walletAddress, members } = get();
        return members.find((m) => m.address === walletAddress);
      },

      visibleGoals: () => {
        const member = get().currentMember();
        if (!member) return [];
        const rank = CLEARANCE_RANK[member.clearance];
        return get().goals.filter((g) => rank >= CLASSIFICATION_CLEARANCE[g.classification]);
      },

      setWallet: (address) =>
        set({ walletAddress: address, isConnected: !!address }),

      addGoal: (goal) =>
        set((s) => ({ goals: [...s.goals, goal] })),

      updateGoalStatus: (goalId, status) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === goalId ? { ...g, status } : g)),
        })),

      addContribution: (taskId, contribution) =>
        set((s) => ({
          goals: s.goals.map((g) => ({
            ...g,
            tasks: g.tasks.map((t) =>
              t.id === taskId
                ? { ...t, contributions: [...t.contributions, contribution] }
                : t,
            ),
          })),
        })),

      updateTaskStatus: (taskId, status) =>
        set((s) => ({
          goals: s.goals.map((g) => ({
            ...g,
            tasks: g.tasks.map((t) =>
              t.id === taskId ? { ...t, status } : t,
            ),
          })),
        })),

      approveMember: (memberId) =>
        set((s) => ({
          members: s.members.map((m) =>
            m.id === memberId ? { ...m, status: 'approved' as const, clearance: 'member' as const } : m,
          ),
        })),

      rejectMember: (memberId) =>
        set((s) => ({
          members: s.members.map((m) =>
            m.id === memberId ? { ...m, status: 'rejected' as const } : m,
          ),
        })),

      setClearance: (memberId, clearance) =>
        set((s) => ({
          members: s.members.map((m) =>
            m.id === memberId ? { ...m, clearance } : m,
          ),
        })),

      /* ── Territory management ── */

      loadWorldSystems: (systems) =>
        set({ worldSystems: systems, worldSystemsLoaded: true }),

      claimSystem: (worldSystem, category = 'expansion') =>
        set((s) => {
          if (s.systems.some((sys) => sys.id === worldSystem.id)) return s;
          const newSystem: TribeSystem = {
            id: worldSystem.id,
            name: worldSystem.name,
            category,
            coordinates: { x: worldSystem.x, y: worldSystem.y },
          };
          return { systems: [...s.systems, newSystem] };
        }),

      unclaimSystem: (systemId) =>
        set((s) => ({
          systems: s.systems.filter((sys) => sys.id !== systemId),
        })),

      updateSystem: (systemId, updates) =>
        set((s) => ({
          systems: s.systems.map((sys) =>
            sys.id === systemId ? { ...sys, ...updates } : sys,
          ),
        })),

      setHQ: (systemId) =>
        set((s) => ({
          systems: s.systems.map((sys) => ({
            ...sys,
            isHQ: sys.id === systemId,
          })),
        })),

      addBase: (systemId, base) =>
        set((s) => ({
          systems: s.systems.map((sys) =>
            sys.id === systemId
              ? { ...sys, bases: [...(sys.bases ?? []), base] }
              : sys,
          ),
        })),

      removeBase: (systemId, memberName) =>
        set((s) => ({
          systems: s.systems.map((sys) =>
            sys.id === systemId
              ? { ...sys, bases: (sys.bases ?? []).filter((b) => b.memberName !== memberName) }
              : sys,
          ),
        })),

      addScoutingLog: (systemId, log) =>
        set((s) => ({
          systems: s.systems.map((sys) =>
            sys.id === systemId
              ? {
                  ...sys,
                  scoutingLogs: [...(sys.scoutingLogs ?? []), log],
                  lastScouted: log.timestamp,
                }
              : sys,
          ),
        })),

      updateLagrangePoint: (systemId, lp) =>
        set((s) => ({
          systems: s.systems.map((sys) => {
            if (sys.id !== systemId) return sys;
            const points = [...(sys.lagrangePoints ?? [])];
            const idx = points.findIndex((z) => z.lPoint === lp.lPoint);
            if (idx >= 0) points[idx] = lp;
            else points.push(lp);
            return { ...sys, lagrangePoints: points };
          }),
        })),
    }),
    {
      name: 'tribe-command-center',
      version: 4,
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        isConnected: state.isConnected,
        systems: state.systems,
        members: state.members,
        goals: state.goals,
      }),
      migrate: (_persisted, version) => {
        // v1-v3 had incompatible data — wipe and let defaults load
        if (version < 4) return {};
        return _persisted as Record<string, unknown>;
      },
    },
  ),
);
