import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Goal, Tribe, TribeMember, TribeSystem, WorldSystem, Contribution, MemberClearance, SystemCategory, TribeBase, ScoutingLog, LagrangePoint, ActivityEvent, OrbitalZone, Alliance, FleetOperation, FleetRSVPStatus, FeedbackEntry, RiftSighting } from '../types';
import { MOCK_GOALS, MOCK_TRIBE, MOCK_MEMBERS, MOCK_SYSTEMS, MOCK_ALLIANCE, MOCK_FLEETS, MOCK_ACTIVITIES, MOCK_FEEDBACK } from '../data/mock';
import systemsBundleData from '../data/systems-bundle.json';

/** Clearance hierarchy — higher index = more access */
const CLEARANCE_RANK: Record<MemberClearance, number> = {
  pending: 0,
  member: 1,
  veteran: 2,
  officer: 3,
  leader: 4,
};

/** Minimum clearance required per classification */
const CLASSIFICATION_CLEARANCE = {
  'normal': 1,     // member+
  'classified': 2, // veteran+
  'top-secret': 3, // officer+leader
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

  /* Feedback */
  feedback: FeedbackEntry[];

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
  addRiftSighting: (systemId: number, sighting: RiftSighting) => void;
  updateLagrangePoint: (systemId: number, lp: LagrangePoint) => void;
  addOrbitalZone: (systemId: number, zone: OrbitalZone) => void;
  updateOrbitalZone: (systemId: number, zoneName: string, updates: Partial<OrbitalZone>) => void;
  removeOrbitalZone: (systemId: number, zoneName: string) => void;
  claimGatedNetwork: (startSystemId: number) => Promise<{ added: number; total: number }>;
  addActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;

  /* Fleet Operations */
  addFleet: (fleet: FleetOperation) => void;
  rsvpFleet: (fleetId: string, memberAddress: string, memberName: string, status: FleetRSVPStatus) => void;
  deleteFleet: (fleetId: string) => void;

  /* Feedback */
  addFeedback: (entry: FeedbackEntry) => void;
  upvoteFeedback: (feedbackId: string, memberAddress: string) => void;
  downvoteFeedback: (feedbackId: string, memberAddress: string) => void;
  deleteFeedback: (feedbackId: string) => void;

  /* Self-service join */
  joinTribe: (address: string, name: string) => void;

  /* Tribe management */
  createTribe: (name: string, description: string) => void;
  setMemberRole: (memberId: string, role: 'leader' | 'officer' | 'member') => void;
  transferLeadership: (memberId: string) => void;
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
      activities: MOCK_ACTIVITIES,
      alliance: MOCK_ALLIANCE,
      fleets: MOCK_FLEETS,
      feedback: MOCK_FEEDBACK,

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

      joinTribe: (address, name) =>
        set((s) => {
          // Don't add duplicates
          if (s.members.some((m) => m.address === address)) return s;
          const newMember: TribeMember = {
            id: `m-${Date.now()}`,
            address,
            name,
            role: 'member',
            status: 'approved',
            clearance: 'member',
            joinedAt: new Date().toISOString(),
            reputation: { score: 50, totalPledges: 0, deliveredOnTime: 0, deliveredLate: 0, failedPledges: 0 },
          };
          return { members: [...s.members, newMember] };
        }),

      createTribe: (name, description) => {
        const addr = get().walletAddress;
        if (!addr) return;
        const tribeId = `tribe-${Date.now()}`;
        const tribe: Tribe = {
          id: tribeId,
          name,
          description,
          leaderAddress: addr,
          memberCount: 1,
          createdAt: new Date().toISOString(),
        };
        const leader: TribeMember = {
          id: `m-${Date.now()}`,
          address: addr,
          name: name + ' Leader',
          role: 'leader',
          status: 'approved',
          clearance: 'leader',
          joinedAt: new Date().toISOString(),
          reputation: { score: 100, totalPledges: 0, deliveredOnTime: 0, deliveredLate: 0, failedPledges: 0 },
        };
        set({
          tribe,
          members: [leader],
          systems: [],
          goals: [],
          activities: [],
          alliance: null,
          fleets: [],
          feedback: [],
        });
        get().addActivity({ type: 'member_joined', description: `Tribe "${name}" founded` });
      },

      setMemberRole: (memberId, role) => {
        const me = get().currentMember();
        if (me?.role !== 'leader') return;
        set((s) => ({
          members: s.members.map((m) =>
            m.id === memberId && m.role !== 'leader'
              ? { ...m, role, clearance: role === 'officer' ? 'officer' as const : m.clearance }
              : m,
          ),
        }));
      },

      transferLeadership: (memberId) => {
        const me = get().currentMember();
        if (me?.role !== 'leader') return;
        const target = get().members.find((m) => m.id === memberId);
        if (!target || target.status !== 'approved') return;
        set((s) => ({
          tribe: s.tribe ? { ...s.tribe, leaderAddress: target.address } : null,
          members: s.members.map((m) => {
            if (m.id === me!.id) return { ...m, role: 'officer' as const, clearance: 'officer' as const };
            if (m.id === memberId) return { ...m, role: 'leader' as const, clearance: 'leader' as const };
            return m;
          }),
        }));
        get().addActivity({ type: 'member_joined', description: `Leadership transferred to ${target.name}` });
      },

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

      claimGatedNetwork: async (startSystemId) => {
        const API = 'https://world-api-stillness.live.tech.evefrontier.com/v2/solarsystems';
        const visited = new Set<number>();
        const queue: number[] = [startSystemId];
        const networkSystems: { id: number; name: string; x: number; y: number; connections: number[] }[] = [];

        // BFS traverse gate connections
        while (queue.length > 0) {
          const batch = queue.splice(0, 3); // fetch up to 3 at a time to avoid flooding
          const results = await Promise.all(
            batch.filter((id) => !visited.has(id)).map(async (id) => {
              visited.add(id);
              try {
                const res = await fetch(`${API}/${id}`);
                if (!res.ok) return null;
                return await res.json();
              } catch { return null; }
            }),
          );
          for (const data of results) {
            if (!data?.solarSystem) continue;
            const sys = data.solarSystem;
            const gateIds: number[] = (sys.gateLinks ?? []).map((g: { destinationSolarSystemId: number }) => g.destinationSolarSystemId);
            // Look up coordinates from world systems bundle
            const worldSys = get().worldSystems.find((w) => w.id === sys.solarSystemId);
            networkSystems.push({
              id: sys.solarSystemId,
              name: sys.solarSystemName,
              x: worldSys?.x ?? 0,
              y: worldSys?.y ?? 0,
              connections: gateIds,
            });
            for (const gateId of gateIds) {
              if (!visited.has(gateId)) queue.push(gateId);
            }
          }
        }

        // Add all discovered systems that aren't already claimed
        const existing = new Set(get().systems.map((s) => s.id));
        const newSystems: TribeSystem[] = networkSystems
          .filter((ns) => !existing.has(ns.id))
          .map((ns) => ({
            id: ns.id,
            name: ns.name,
            category: (ns.id === startSystemId ? 'core' : 'expansion') as SystemCategory,
            coordinates: { x: ns.x, y: ns.y },
            connections: ns.connections,
          }));

        if (newSystems.length > 0) {
          set((s) => ({ systems: [...s.systems, ...newSystems] }));
          // Update connections on already-existing systems too
          set((s) => ({
            systems: s.systems.map((sys) => {
              const netData = networkSystems.find((ns) => ns.id === sys.id);
              if (netData && (!sys.connections || sys.connections.length === 0)) {
                return { ...sys, connections: netData.connections };
              }
              return sys;
            }),
          }));
          get().addActivity({
            type: 'system_claimed',
            description: `Claimed gated network from ${networkSystems.find((ns) => ns.id === startSystemId)?.name ?? 'unknown'} (${newSystems.length} new systems, ${networkSystems.length} total in network)`,
          });
        }
        return { added: newSystems.length, total: networkSystems.length };
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

      addRiftSighting: (systemId, sighting) => {
        set((s) => ({
          systems: s.systems.map((sys) =>
            sys.id === systemId
              ? { ...sys, riftSightings: [...(sys.riftSightings ?? []), sighting] }
              : sys,
          ),
        }));
        const sys = get().systems.find((s) => s.id === systemId);
        get().addActivity({ type: 'scout_report', description: `${sighting.reportedBy} reported rift in ${sys?.name ?? 'system'}${sighting.type ? ` (${sighting.type})` : ''}`, memberName: sighting.reportedBy, systemName: sys?.name });
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

      addFeedback: (entry) =>
        set((s) => ({ feedback: [entry, ...s.feedback] })),

      upvoteFeedback: (feedbackId, memberAddress) =>
        set((s) => ({
          feedback: s.feedback.map((f) =>
            f.id === feedbackId
              ? { ...f, upvotes: f.upvotes.includes(memberAddress) ? f.upvotes.filter((a) => a !== memberAddress) : [...f.upvotes, memberAddress], downvotes: (f.downvotes ?? []).filter((a) => a !== memberAddress) }
              : f,
          ),
        })),

      downvoteFeedback: (feedbackId, memberAddress) =>
        set((s) => ({
          feedback: s.feedback.map((f) =>
            f.id === feedbackId
              ? { ...f, downvotes: (f.downvotes ?? []).includes(memberAddress) ? (f.downvotes ?? []).filter((a) => a !== memberAddress) : [...(f.downvotes ?? []), memberAddress], upvotes: f.upvotes.filter((a) => a !== memberAddress) }
              : f,
          ),
        })),

      deleteFeedback: (feedbackId) =>
        set((s) => ({ feedback: s.feedback.filter((f) => f.id !== feedbackId) })),
    }),
    {
      name: 'tribe-command-center',
      version: 17,
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        isConnected: state.isConnected,
        tribe: state.tribe,
        systems: state.systems,
        members: state.members,
        goals: state.goals,
        activities: state.activities,
        alliance: state.alliance,
        fleets: state.fleets,
        feedback: state.feedback,
      }),
      migrate: (_persisted, version) => {
        if (version < 17) return {};
        return _persisted as Record<string, unknown>;
      },
    },
  ),
);
