import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Goal, Tribe, TribeMember, TribeSystem, WorldSystem, Contribution, MemberClearance, SystemCategory, TribeBase, ScoutingLog, LagrangePoint, ActivityEvent, OrbitalZone, Alliance, FleetOperation, FleetRSVPStatus } from '../types';
import { MOCK_GOALS, MOCK_TRIBE, MOCK_MEMBERS, MOCK_SYSTEMS, MOCK_ALLIANCE } from '../data/mock';
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

  /* Alliance */
  alliance: Alliance | null;

  /* Fleet Operations */
  fleets: FleetOperation[];

  /* Computed helpers */
  currentMember: () => TribeMember | undefined;
  visibleGoals: () => Goal[];

  /* Actions */
  setWallet: (address: string | null) => void;
  addGoal: (goal: Goal) => void;
  updateGoalStatus: (goalId: string, status: Goal['status']) => void;
  addContribution: (taskId: string, contribution: Contribution) => void;
  updateTaskStatus: (taskId: string, status: Goal['tasks'][number]['status']) => void;
  markDelivered: (contributionId: string, amount: number) => void;
  approveDelivery: (contributionId: string) => void;

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

  /* Fleet Operations */
  addFleet: (fleet: FleetOperation) => void;
  rsvpFleet: (fleetId: string, memberAddress: string, memberName: string, status: FleetRSVPStatus) => void;
  deleteFleet: (fleetId: string) => void;
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
      alliance: MOCK_ALLIANCE,
      fleets: [],

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
          goals: s.goals.map((g) => {
            const task = g.tasks.find((t) => t.id === taskId);
            if (!task) return g;
            const timelineEvent = {
              id: `te-${Date.now()}`,
              type: 'pledge_made' as const,
              description: `${contribution.memberName} pledged ${contribution.pledged} ${contribution.resource}`,
              memberName: contribution.memberName,
              timestamp: new Date().toISOString(),
            };
            return {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, contributions: [...t.contributions, contribution] }
                  : t,
              ),
              timeline: [...(g.timeline ?? []), timelineEvent],
            };
          }),
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

      markDelivered: (contributionId, amount) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            let contrib: typeof g.tasks[0]['contributions'][0] | undefined;
            for (const t of g.tasks) {
              contrib = t.contributions.find((c) => c.id === contributionId);
              if (contrib) break;
            }
            if (!contrib) return g;
            const timelineEvent = {
              id: `te-${Date.now()}`,
              type: 'delivery_confirmed' as const,
              description: `${contrib.memberName} delivered ${Math.min(amount, contrib.pledged)} ${contrib.resource} (awaiting approval)`,
              memberName: contrib.memberName,
              timestamp: new Date().toISOString(),
            };
            return {
              ...g,
              tasks: g.tasks.map((t) => ({
                ...t,
                contributions: t.contributions.map((c) =>
                  c.id === contributionId
                    ? { ...c, delivered: Math.min(amount, c.pledged), status: 'pending_approval' as const }
                    : c,
                ),
              })),
              timeline: [...(g.timeline ?? []), timelineEvent],
            };
          }),
        })),

      approveDelivery: (contributionId) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            let contrib: typeof g.tasks[0]['contributions'][0] | undefined;
            for (const t of g.tasks) {
              contrib = t.contributions.find((c) => c.id === contributionId);
              if (contrib) break;
            }
            if (!contrib) return g;
            const approver = get().currentMember();
            const timelineEvent = {
              id: `te-${Date.now()}`,
              type: 'delivery_confirmed' as const,
              description: `${approver?.name ?? 'Officer'} approved ${contrib.memberName}'s delivery of ${contrib.delivered} ${contrib.resource} ✓`,
              memberName: approver?.name ?? 'Officer',
              timestamp: new Date().toISOString(),
            };
            return {
              ...g,
              tasks: g.tasks.map((t) => ({
                ...t,
                contributions: t.contributions.map((c) =>
                  c.id === contributionId
                    ? { ...c, status: c.delivered >= c.pledged ? 'delivered' as const : 'partial' as const }
                    : c,
                ),
              })),
              timeline: [...(g.timeline ?? []), timelineEvent],
            };
          }),
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

      addFleet: (fleet) => {
        set((s) => ({ fleets: [...s.fleets, fleet] }));
        get().addActivity({ type: 'fleet_created', description: `Fleet op "${fleet.title}" created for ${fleet.date}`, memberName: fleet.createdByName });
      },

      rsvpFleet: (fleetId, memberAddress, memberName, status) =>
        set((s) => ({
          fleets: s.fleets.map((f) => {
            if (f.id !== fleetId) return f;
            const existing = f.rsvps.findIndex((r) => r.memberAddress === memberAddress);
            const rsvp = { memberAddress, memberName, status, timestamp: new Date().toISOString() };
            const rsvps = existing >= 0
              ? f.rsvps.map((r, i) => (i === existing ? rsvp : r))
              : [...f.rsvps, rsvp];
            return { ...f, rsvps };
          }),
        })),

      deleteFleet: (fleetId) =>
        set((s) => ({ fleets: s.fleets.filter((f) => f.id !== fleetId) })),
    }),
    {
      name: 'tribe-command-center',
      version: 10,
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        isConnected: state.isConnected,
        systems: state.systems,
        members: state.members,
        goals: state.goals,
        activities: state.activities,
        alliance: state.alliance,
        fleets: state.fleets,
      }),
      migrate: (_persisted, version) => {
        if (version < 10) return {};
        return _persisted as Record<string, unknown>;
      },
    },
  ),
);
