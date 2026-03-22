import { create } from 'zustand';
import type { Goal, Tribe, TribeMember, TribeSystem, Contribution, MemberClearance } from '../types';
import { MOCK_GOALS, MOCK_TRIBE, MOCK_MEMBERS, MOCK_SYSTEMS } from '../data/mock';

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
}

export const useAppStore = create<AppState>((set, get) => ({
  walletAddress: null,
  isConnected: false,
  tribe: MOCK_TRIBE,
  members: MOCK_MEMBERS,
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
}));
