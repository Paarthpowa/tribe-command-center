import { create } from 'zustand';
import type { Goal, Tribe, TribeMember, Contribution } from '../types';
import { MOCK_GOALS, MOCK_TRIBE, MOCK_MEMBERS } from '../data/mock';

interface AppState {
  /* Auth / Wallet */
  walletAddress: string | null;
  isConnected: boolean;

  /* Tribe */
  tribe: Tribe | null;
  members: TribeMember[];

  /* Goals */
  goals: Goal[];

  /* Actions */
  setWallet: (address: string | null) => void;
  addGoal: (goal: Goal) => void;
  updateGoalStatus: (goalId: string, status: Goal['status']) => void;
  addContribution: (taskId: string, contribution: Contribution) => void;
  updateTaskStatus: (taskId: string, status: Goal['tasks'][number]['status']) => void;
}

export const useAppStore = create<AppState>((set) => ({
  walletAddress: null,
  isConnected: false,
  tribe: MOCK_TRIBE,
  members: MOCK_MEMBERS,
  goals: MOCK_GOALS,

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
}));
