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
  /** System where player's main base is located (numeric World API ID) */
  baseSystem?: number;
  /** Base size / energy invested (approximate) */
  baseEnergy?: number;
  /** L-point identifier where the base sits */
  baseLPoint?: string;
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

/* ── World Systems (from API bundle) ── */

/** Raw system data from the World API bundle — immutable reference data */
export interface WorldSystem {
  id: number;
  name: string;
  constellationId: number;
  regionId: number;
  /** Normalized 2D coordinate (0-1000 range) */
  x: number;
  /** Normalized 2D coordinate (0-1000 range) */
  y: number;
}

/* ── Territory & Intel ── */

export type SystemCategory = 'core' | 'frontline' | 'contested' | 'expansion' | 'resource' | 'hostile' | 'unknown';

/** Tribe's overlay data for a claimed system — references a WorldSystem by ID */
export interface TribeSystem {
  /** World API system ID (numeric) */
  id: number;
  /** System name (from WorldSystem) */
  name: string;
  category: SystemCategory;
  /** 2D map coordinates (from WorldSystem bundle) */
  coordinates: { x: number; y: number };
  /** Who controls/claimed this system */
  controlledBy?: string;
  /** Connected system IDs (gate links) */
  connections?: number[];
  /** Known resources available */
  resources?: string[];
  /** Threat level 0-10 */
  threatLevel?: number;
  /** Notes from scouts */
  notes?: string;
  /** Member bases in this system */
  bases?: TribeBase[];
  /** Known dangers or enemies */
  dangers?: string[];
  /** Rift activity log */
  riftSightings?: RiftSighting[];
  /** Scouting log entries */
  scoutingLogs?: ScoutingLog[];
  /** Last scouted timestamp */
  lastScouted?: string;
  /** Is this the tribe's HQ system? */
  isHQ?: boolean;
  /** Number of planets in this system (determines L-point count) */
  planetCount?: number;
  /** Known Lagrange points with scouting status */
  lagrangePoints?: LagrangePoint[];
  /** Orbital zones discovered in this system (content areas: mining, combat, loot) */
  orbitalZones?: OrbitalZone[];
}

/** Lagrange point identifier — e.g. "P1-L1" (Planet 1, Lagrange point 1) or legacy "L1" */
export type LPointId = string;

/** Lagrange point status — each L-point can host a base (Network Node + Smart Assemblies) */
export interface LagrangePoint {
  lPoint: LPointId;
  /** What's known about this Lagrange point */
  status: 'unknown' | 'empty' | 'friendly' | 'enemy' | 'contested' | 'resource';
  /** Who has a base (Network Node) here */
  occupiedBy?: string;
  /** Resources or items found here */
  resources?: string[];
  /** Notes from scouts */
  notes?: string;
  /** Last time this L-point was scouted */
  lastScouted?: string;
}

export interface TribeBase {
  memberId?: string;
  memberName: string;
  /** Energy from Network Node (GJ) */
  energy?: number;
  /** Lagrange point where the Network Node is anchored */
  lPoint?: LPointId;
  /** Is this an enemy base? */
  isEnemy?: boolean;
}

/* ── Orbital Zones ── */
/** Region prefix that categorizes the zone's orbital position */
export type OrbitalRegion = 'Inner' | 'Trojan' | 'Outer' | 'Fringe';

export type OrbitalZoneStatus = 'unknown' | 'scouted' | 'active' | 'depleted' | 'hostile';

/** An orbital zone — content area (mining, combat, exploration, loot) within a system */
export interface OrbitalZone {
  /** Display name, e.g. "Inner Ancient Cluster" */
  name: string;
  /** Orbital region prefix */
  region: OrbitalRegion;
  /** Current status */
  status: OrbitalZoneStatus;
  /** What type of content/activity is available */
  zoneType?: 'mining' | 'combat' | 'exploration' | 'loot' | 'unknown';
  /** Resources found here */
  resources?: string[];
  /** Dangers or enemies present */
  dangers?: string[];
  /** Notes from scouts */
  notes?: string;
  /** Last scouted timestamp */
  lastScouted?: string;
}

export interface ScoutingLog {
  id: string;
  systemId: number;
  reportedBy: string;
  timestamp: string;
  /** Specific L-point scouted */
  lPoint?: LPointId;
  notes?: string;
  /** Was an enemy base found? */
  foundEnemy?: boolean;
}

export interface RiftSighting {
  id: string;
  systemId: number;
  reportedBy: string;
  timestamp: string;
  type?: string;
  notes?: string;
}

/* ── Goals & Tasks ── */

export type GoalStatus = 'planning' | 'active' | 'completed' | 'archived';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskType = 'deployment' | 'scouting' | 'resource' | 'defense' | 'logistics' | 'programming' | 'diplomacy' | 'other';

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
  /** Solar system IDs related to this goal */
  systemIds?: number[];
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
  /** Task category */
  taskType?: TaskType;
  assignedTo?: string;
  /** e.g. "Smart Gate", "Smart Storage Unit" */
  assemblyType?: string;
  /** Solar system where this task takes place */
  systemId?: number;
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

/* ── Activity Feed ── */
export type ActivityType = 'system_claimed' | 'system_unclaimed' | 'base_added' | 'scout_report' | 'goal_created' | 'pledge_made' | 'member_joined' | 'hq_set' | 'threat_alert' | 'lpoint_updated';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  description: string;
  memberName?: string;
  systemName?: string;
  timestamp: string;
}
