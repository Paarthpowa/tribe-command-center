/* ── Types ── */

export interface TribeMember {
  id: string;
  address: string;
  name: string;
  role: 'leader' | 'officer' | 'member';
  joinedAt: string;
  /** Reputation stats — computed from contributions */
  reputation?: MemberReputation;
}

export interface MemberReputation {
  totalPledges: number;
  deliveredOnTime: number;
  deliveredLate: number;
  failedPledges: number;
  /** 0-100 reliability score */
  score: number;
}

export type GoalStatus = 'planning' | 'active' | 'completed' | 'archived';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Goal {
  id: string;
  tribeId: string;
  title: string;
  description: string;
  status: GoalStatus;
  priority: GoalPriority;
  createdBy: string;
  createdAt: string;
  deadline?: string;
  tasks: Task[];
  /** Solar system IDs related to this goal (for EF-Map) */
  systemIds?: string[];
  /** Shared EF-Map route URL (e.g. https://ef-map.com/s/abc123) */
  mapShareUrl?: string;
  /** Timeline events */
  timeline?: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  type: 'goal_created' | 'task_added' | 'pledge_made' | 'delivery_confirmed' | 'deadline_missed' | 'goal_completed';
  description: string;
  memberName?: string;
  timestamp: string;
}

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'blocked';

export interface Task {
  id: string;
  goalId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo?: string;
  /** e.g. "Smart Gate", "Smart Storage Unit" */
  assemblyType?: string;
  /** Solar system where this task takes place */
  systemId?: string;
  systemName?: string;
  /** Sub-task index (e.g. "Gate 1 of 5") */
  subIndex?: number;
  subTotal?: number;
  requirements: ResourceRequirement[];
  contributions: Contribution[];
}

export interface ResourceRequirement {
  resource: string;
  amount: number;
}

export interface Contribution {
  id: string;
  taskId: string;
  memberAddress: string;
  memberName: string;
  resource: string;
  pledged: number;
  delivered: number;
  status: 'pledged' | 'partial' | 'delivered';
  createdAt: string;
  /** Deadline the contributor chose for delivery */
  deadline?: string;
  /** Whether delivery was on time */
  onTime?: boolean;
}

export interface Tribe {
  id: string;
  name: string;
  description: string;
  leaderAddress: string;
  memberCount: number;
  createdAt: string;
}
