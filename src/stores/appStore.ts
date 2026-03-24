import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Goal, Tribe, TribeMember, TribeSystem, WorldSystem, Contribution, MemberClearance, SystemCategory, TribeBase, ScoutingLog, LagrangePoint, ActivityEvent, OrbitalZone } from '../types';
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

  /* Activity Feed */
  activities: ActivityEvent[];

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
  addOrbitalZone: (systemId: number, zone: OrbitalZone) => void;
  updateOrbitalZone: (systemId: number, zoneName: string, updates: Partial<OrbitalZone>) => void;
  removeOrbitalZone: (systemId: number, zoneName: string) => void;
  addActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
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
      activities: [],

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

      claimSystem: (worldSystem, category = 'expansion') => {
        set((s) => {
          if (s.systems.some((sys) => sys.id === worldSystem.id)) return s;
          const newSystem: TribeSystem = {
            id: worldSystem.id,
            name: worldSystem.name,
            category,
            coordinates: { x: worldSystem.x, y: worldSystem.y },
          };
          return { systems: [...s.systems, newSystem] };
        });
        get().addActivity({ type: 'system_claimed', description: `Claimed system ${worldSystem.name}`, systemName: worldSystem.name });
      },

      unclaimSystem: (systemId) => {
        const sys = get().systems.find((s) => s.id === systemId);
        set((s) => ({
          systems: s.systems.filter((ss) => ss.id !== systemId),
        }));
        if (sys) get().addActivity({ type: 'system_unclaimed', description: `Unclaimed system ${sys.name}`, systemName: sys.name });
      },

      updateSystem: (systemId, updates) =>
        set((s) => ({
          systems: s.systems.map((sys) =>
            sys.id === systemId ? { ...sys, ...updates } : sys,
          ),
        })),

      setHQ: (systemId) => {
        set((s) => ({
          systems: s.systems.map((sys) => ({
            ...sys,
            isHQ: sys.id === systemId,
          })),
        }));
        const sys = get().systems.find((s) => s.id === systemId);
        if (sys) get().addActivity({ type: 'hq_set', description: `Set HQ to ${sys.name}`, systemName: sys.name });
      },

      addBase: (systemId, base) => {
        set((s) => ({
          systems: s.systems.map((sys) =>
            sys.id === systemId
              ? { ...sys, bases: [...(sys.bases ?? []), base] }
              : sys,
          ),
        }));
        const sys = get().systems.find((s) => s.id === systemId);
        get().addActivity({ type: 'base_added', description: `${base.memberName} added base in ${sys?.name ?? 'system'}`, memberName: base.memberName, systemName: sys?.name });
      },

      removeBase: (systemId, memberName) =>
        set((s) => ({
          systems: s.systems.map((sys) =>
            sys.id === systemId
              ? { ...sys, bases: (sys.bases ?? []).filter((b) => b.memberName !== memberName) }
              : sys,
          ),
        })),

      addScoutingLog: (systemId, log) => {
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
        }));
        const sys = get().systems.find((s) => s.id === systemId);
        get().addActivity({ type: 'scout_report', description: `${log.reportedBy} scouted ${sys?.name ?? 'system'}`, memberName: log.reportedBy, systemName: sys?.name });
      },

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

      addOrbitalZone: (systemId, zone) => {
        set((s) => ({
          systems: s.systems.map((sys) =>
            sys.id === systemId
              ? { ...sys, orbitalZones: [...(sys.orbitalZones ?? []), zone] }
              : sys,
          ),
        }));
        const sys = get().systems.find((s) => s.id === systemId);
        get().addActivity({ type: 'scout_report', description: `Orbital zone "${zone.name}" discovered in ${sys?.name ?? 'system'}`, systemName: sys?.name });
      },

      updateOrbitalZone: (systemId, zoneName, updates) =>
        set((s) => ({
          systems: s.systems.map((sys) =>
            sys.id === systemId
              ? {
                  ...sys,
                  orbitalZones: (sys.orbitalZones ?? []).map((z) =>
                    z.name === zoneName ? { ...z, ...updates } : z,
                  ),
                }
              : sys,
          ),
        })),

      removeOrbitalZone: (systemId, zoneName) =>
        set((s) => ({
          systems: s.systems.map((sys) =>
            sys.id === systemId
              ? { ...sys, orbitalZones: (sys.orbitalZones ?? []).filter((z) => z.name !== zoneName) }
              : sys,
          ),
        })),

      addActivity: (partial) =>
        set((s) => ({
          activities: [
            { ...partial, id: `act-${Date.now()}`, timestamp: new Date().toISOString() },
            ...s.activities,
          ].slice(0, 200),
        })),
    }),
    {
      name: 'tribe-command-center',
      version: 5,
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        isConnected: state.isConnected,
        systems: state.systems,
        members: state.members,
        goals: state.goals,
        activities: state.activities,
      }),
      migrate: (_persisted, version) => {
        if (version < 5) return {};
        return _persisted as Record<string, unknown>;
      },
    },
  ),
);
