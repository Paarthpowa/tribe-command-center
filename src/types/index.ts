/* ── Types ── */

/* ── Access Control ── */

export type MemberClearance = 'pending' | 'member' | 'officer' | 'leader';
export type GoalClassification = 'normal' | 'classified' | 'top-secret';
export type MemberStatus = 'pending' | 'approved' | 'rejected';

export interface TribeMember {
  id: string;
  address: string;
  name: string;
  role: 'leader' | 'officer' | 'member';
  /** Approval status — pending members can't see anything */
  status: MemberStatus;
  /** Clearance level — determines which goals are visible */
  clearance: MemberClearance;
  joinedAt: string;
  /** Reputation stats — computed from contributions */
  reputation?: MemberReputation;
  /** In-game profile data */
  profile?: MemberProfile;
}

export interface MemberProfile {
  /** System where player's main base is located */
  baseSystem?: string;
  /** Base size / energy invested (approximate) */
  baseEnergy?: number;
  /** Last time the player was active in-game */
  lastActive?: string;
  /** Notes or bio */
  notes?: string;
}

export interface MemberReputation {
  totalPledges: number;
  deliveredOnTime: number;
  deliveredLate: number;
  failedPledges: number;
  /** 0-100 reliability score */
  score: number;
}

/* ── Territory & Intel ── */

export type SystemCategory = 'core' | 'frontline' | 'contested' | 'expansion' | 'resource' | 'hostile' | 'unknown';

export interface TribeSystem {
  id: string;
  name: string;
  category: SystemCategory;
  /** 2D map coordinates for custom star map */
  coordinates: { x: number; y: number };
  /** Who controls/claimed this system */
  controlledBy?: string;
  /** Connected system IDs (gate links) */
  connections?: string[];
  /** Known resources available */
  resources?: string[];
  /** Threat level 0-10 */
  threatLevel?: number;
  /** Notes from scouts */
  notes?: string;
  /** Member bases in this system */
  bases?: { memberName: string; energy?: number }[];
  /** Known dangers or enemies */
  dangers?: string[];
  /** Rift activity log */
  riftSightings?: RiftSighting[];
  /** Last scouted timestamp */
  lastScouted?: string;
}

export interface RiftSighting {
  id: string;
  systemId: string;
  reportedBy: string;
  timestamp: string;
  type?: string;
  notes?: string;
}

/* ── Goals & Tasks ── */

export type GoalStatus = 'planning' | 'active' | 'completed' | 'archived';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Goal {
  id: string;
  tribeId: string;
  title: string;
  description: string;
  status: GoalStatus;
  priority: GoalPriority;
  /** Visibility classification — who can see this goal */
  classification: GoalClassification;
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
