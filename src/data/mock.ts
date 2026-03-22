import type { Goal, Tribe, TribeMember, TimelineEvent } from '../types';

export const MOCK_TRIBE: Tribe = {
  id: 'tribe-alpha',
  name: 'Tribe Alpha',
  description: 'Pioneer exploration and gated network builders',
  leaderAddress: '0xalpha_leader_address',
  memberCount: 12,
  createdAt: '2026-03-15T00:00:00Z',
};

export const MOCK_MEMBERS: TribeMember[] = [
  {
    id: 'm1', address: '0xalpha_leader_address', name: 'Commander Zara', role: 'leader', joinedAt: '2026-03-15T00:00:00Z',
    reputation: { totalPledges: 8, deliveredOnTime: 7, deliveredLate: 1, failedPledges: 0, score: 94 },
  },
  {
    id: 'm2', address: '0xplayer_a', name: 'Navigator Rex', role: 'officer', joinedAt: '2026-03-16T00:00:00Z',
    reputation: { totalPledges: 12, deliveredOnTime: 11, deliveredLate: 1, failedPledges: 0, score: 96 },
  },
  {
    id: 'm3', address: '0xplayer_b', name: 'Engineer Kael', role: 'member', joinedAt: '2026-03-17T00:00:00Z',
    reputation: { totalPledges: 6, deliveredOnTime: 3, deliveredLate: 2, failedPledges: 1, score: 58 },
  },
  {
    id: 'm4', address: '0xplayer_c', name: 'Scout Lyra', role: 'member', joinedAt: '2026-03-18T00:00:00Z',
    reputation: { totalPledges: 4, deliveredOnTime: 4, deliveredLate: 0, failedPledges: 0, score: 100 },
  },
];

const goal1Timeline: TimelineEvent[] = [
  { id: 'te1', type: 'goal_created', description: 'Goal created by Commander Zara', memberName: 'Commander Zara', timestamp: '2026-03-18T08:00:00Z' },
  { id: 'te2', type: 'pledge_made', description: 'Navigator Rex pledged 20 Foam for Gate SOL-001', memberName: 'Navigator Rex', timestamp: '2026-03-19T10:00:00Z' },
  { id: 'te3', type: 'pledge_made', description: 'Engineer Kael pledged 26 Foam for Gate SOL-001', memberName: 'Engineer Kael', timestamp: '2026-03-19T14:00:00Z' },
  { id: 'te4', type: 'delivery_confirmed', description: 'Navigator Rex delivered 20 Foam ✓', memberName: 'Navigator Rex', timestamp: '2026-03-20T09:00:00Z' },
  { id: 'te5', type: 'delivery_confirmed', description: 'Engineer Kael delivered 10/26 Foam (partial)', memberName: 'Engineer Kael', timestamp: '2026-03-21T16:00:00Z' },
  { id: 'te6', type: 'task_added', description: 'Access Rules task assigned to Scout Lyra', memberName: 'Scout Lyra', timestamp: '2026-03-20T11:00:00Z' },
];

export const MOCK_GOALS: Goal[] = [
  {
    id: 'goal-1',
    tribeId: 'tribe-alpha',
    title: 'Gated Network for Tribe Alpha',
    description: 'Build a network of Smart Gates connecting our core systems, with tribe-only access control.',
    status: 'active',
    priority: 'high',
    createdBy: '0xalpha_leader_address',
    createdAt: '2026-03-18T00:00:00Z',
    deadline: '2026-04-05T00:00:00Z',
    systemIds: ['SOL-001', 'ARC-005', 'NEB-012'],
    mapShareUrl: 'https://ef-map.com/s/780497ab76',
    timeline: goal1Timeline,
    tasks: [
      {
        id: 'task-1',
        goalId: 'goal-1',
        title: 'Deploy Gate in SOL-001',
        description: 'Build and deploy a Smart Gate in the SOL-001 system as the first node in our network.',
        status: 'in_progress',
        assignedTo: '0xplayer_a',
        assemblyType: 'Smart Gate',
        systemId: 'SOL-001',
        systemName: 'Sol Alpha',
        subIndex: 1,
        subTotal: 3,
        requirements: [{ resource: 'Foam', amount: 46 }],
        contributions: [
          { id: 'c1', taskId: 'task-1', memberAddress: '0xplayer_a', memberName: 'Navigator Rex', resource: 'Foam', pledged: 20, delivered: 20, status: 'delivered', createdAt: '2026-03-19T00:00:00Z', deadline: '2026-03-22T00:00:00Z', onTime: true },
          { id: 'c2', taskId: 'task-1', memberAddress: '0xplayer_b', memberName: 'Engineer Kael', resource: 'Foam', pledged: 26, delivered: 10, status: 'partial', createdAt: '2026-03-19T12:00:00Z', deadline: '2026-03-25T00:00:00Z' },
        ],
      },
      {
        id: 'task-2',
        goalId: 'goal-1',
        title: 'Deploy Gate in ARC-005',
        description: 'Second gate node in ARC-005 to establish the route.',
        status: 'open',
        assemblyType: 'Smart Gate',
        systemId: 'ARC-005',
        systemName: 'Arcadia Five',
        subIndex: 2,
        subTotal: 3,
        requirements: [{ resource: 'Foam', amount: 46 }],
        contributions: [],
      },
      {
        id: 'task-3',
        goalId: 'goal-1',
        title: 'Configure Access Rules',
        description: 'Set up tribe_permit access control on all gates so only Tribe Alpha members can use them.',
        status: 'in_progress',
        assignedTo: '0xplayer_c',
        assemblyType: 'Smart Gate',
        subIndex: 3,
        subTotal: 3,
        requirements: [],
        contributions: [],
      },
    ],
  },
  {
    id: 'goal-2',
    tribeId: 'tribe-alpha',
    title: 'Resource Depot at NEB-012',
    description: 'Establish a shared Smart Storage Unit as a community resource depot.',
    status: 'planning',
    priority: 'medium',
    createdBy: '0xalpha_leader_address',
    createdAt: '2026-03-20T00:00:00Z',
    systemIds: ['NEB-012'],
    tasks: [
      {
        id: 'task-4',
        goalId: 'goal-2',
        title: 'Deploy Storage Unit',
        description: 'Deploy a Smart Storage Unit in NEB-012.',
        status: 'open',
        assemblyType: 'Smart Storage Unit',
        systemId: 'NEB-012',
        systemName: 'Nebula Core',
        requirements: [
          { resource: 'Foam', amount: 30 },
          { resource: 'Alloy', amount: 15 },
        ],
        contributions: [],
      },
    ],
  },
  {
    id: 'goal-3',
    tribeId: 'tribe-alpha',
    title: 'Perimeter Defense Grid',
    description: 'Deploy Smart Turrets around our core territory for defense against hostile tribes.',
    status: 'completed',
    priority: 'critical',
    createdBy: '0xplayer_a',
    createdAt: '2026-03-16T00:00:00Z',
    tasks: [
      {
        id: 'task-5',
        goalId: 'goal-3',
        title: 'Deploy Turret Alpha',
        description: 'Smart Turret deployed and configured.',
        status: 'completed',
        assignedTo: '0xplayer_b',
        assemblyType: 'Smart Turret',
        systemId: 'SOL-001',
        systemName: 'Sol Alpha',
        requirements: [{ resource: 'Alloy', amount: 20 }],
        contributions: [
          { id: 'c3', taskId: 'task-5', memberAddress: '0xplayer_b', memberName: 'Engineer Kael', resource: 'Alloy', pledged: 20, delivered: 20, status: 'delivered', createdAt: '2026-03-17T00:00:00Z', deadline: '2026-03-20T00:00:00Z', onTime: true },
        ],
      },
    ],
  },
];

