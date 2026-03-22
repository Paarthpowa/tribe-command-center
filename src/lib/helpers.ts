import type { GoalStatus, GoalPriority, TaskStatus } from '../types';

export function getStatusColor(status: GoalStatus | TaskStatus): string {
  switch (status) {
    case 'planning':
    case 'open':
      return 'var(--status-open)';
    case 'active':
    case 'in_progress':
      return 'var(--status-active)';
    case 'completed':
      return 'var(--status-done)';
    case 'archived':
    case 'blocked':
      return 'var(--status-blocked)';
    default:
      return 'var(--text-muted)';
  }
}

export function getStatusLabel(status: GoalStatus | TaskStatus): string {
  return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getPriorityColor(priority: GoalPriority): string {
  switch (priority) {
    case 'critical':
      return 'var(--accent-rose)';
    case 'high':
      return 'var(--accent-amber)';
    case 'medium':
      return 'var(--accent-indigo)';
    case 'low':
      return 'var(--text-muted)';
  }
}

export function getTaskProgress(tasks: { status: TaskStatus }[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === 'completed').length;
  return Math.round((done / tasks.length) * 100);
}

export function getResourceProgress(
  requirements: { amount: number }[],
  contributions: { delivered: number }[],
): number {
  const needed = requirements.reduce((s, r) => s + r.amount, 0);
  if (needed === 0) return 100;
  const delivered = contributions.reduce((s, c) => s + c.delivered, 0);
  return Math.min(100, Math.round((delivered / needed) * 100));
}
