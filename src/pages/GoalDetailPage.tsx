import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { TaskCard } from '../components/TaskCard';
import { EFMapEmbed } from '../components/EFMapEmbed';
import { StarMap } from '../components/StarMap';
import { PledgeModal } from '../components/PledgeModal';
import { Timeline } from '../components/Timeline';
import { StatusBadge } from '../components/ui';
import { ProgressRing } from '../components/ProgressRing';
import {
  getStatusColor,
  getPriorityColor,
  getTaskProgress,
} from '../lib/helpers';
import { ArrowLeft, MapPin, Calendar } from 'lucide-react';
import type { Contribution, GoalStatus } from '../types';

export function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const goals = useAppStore((s) => s.goals);
  const systems = useAppStore((s) => s.systems);
  const addContribution = useAppStore((s) => s.addContribution);
  const updateGoalStatus = useAppStore((s) => s.updateGoalStatus);

  const [pledgeTaskId, setPledgeTaskId] = useState<string | null>(null);

  const goal = goals.find((g) => g.id === goalId);
  if (!goal) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Goal not found.{' '}
        <button onClick={() => navigate('/')} style={{ color: 'var(--accent-indigo)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Go back
        </button>
      </div>
    );
  }

  const progress = getTaskProgress(goal.tasks);
  const systemIds = goal.systemIds ?? [];
  const taskSystems = goal.tasks.filter((t) => t.systemId).map((t) => t.systemId!);
  const allSystems = [...new Set([...systemIds, ...taskSystems])];
  const hasMap = goal.mapShareUrl || allSystems.length > 0;

  // Build links between consecutive systems
  const links: string[] = [];
  for (let i = 0; i < allSystems.length - 1; i++) {
    links.push(`${allSystems[i]}-${allSystems[i + 1]}:cyan`);
  }

  const pledgeTask = pledgeTaskId ? goal.tasks.find((t) => t.id === pledgeTaskId) : null;

  const handlePledgeSubmit = (contribution: Contribution) => {
    addContribution(contribution.taskId, contribution);
    setPledgeTaskId(null);
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 20,
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Goal header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: getPriorityColor(goal.priority),
              }}
            />
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
              {goal.title}
            </h1>
          </div>

          <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {goal.description}
          </p>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={goal.status}
              onChange={(e) => updateGoalStatus(goal.id, e.target.value as GoalStatus)}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                color: getStatusColor(goal.status), outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            <StatusBadge label={goal.priority} color={getPriorityColor(goal.priority)} />
            {goal.deadline && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                <Calendar size={12} />
                {new Date(goal.deadline).toLocaleDateString()}
              </span>
            )}
            {allSystems.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-cyan)' }}>
                <MapPin size={12} />
                {allSystems.map((id) => systems.find((s) => s.id === id)?.name ?? String(id)).join(', ')}
              </span>
            )}
          </div>
        </div>

        <ProgressRing percent={progress} size={90} stroke={6} color={getStatusColor(goal.status)}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{progress}%</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>done</div>
          </div>
        </ProgressRing>
      </div>

      {/* Star Map */}
      {hasMap && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
            Star Map
          </h2>
          {/* Custom interactive star map showing goal-related systems */}
          {systems.length > 0 && (
            <StarMap
              systems={systems.filter((s) => allSystems.includes(s.id) || s.category === 'core')}
              goals={[goal]}
              highlightSystemIds={allSystems}
              height={320}
            />
          )}
          {/* Fallback: EF-Map iframe for share URLs without system data */}
          {goal.mapShareUrl && systems.filter((s) => allSystems.includes(s.id)).length === 0 && (
            <EFMapEmbed
              shareUrl={goal.mapShareUrl}
              systems={allSystems}
              links={links}
              height={350}
            />
          )}
          {goal.mapShareUrl && (
            <div style={{ marginTop: 6, textAlign: 'right' }}>
              <a
                href={goal.mapShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11, color: 'var(--accent-cyan)', textDecoration: 'none' }}
              >
                Open route in EF-Map →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Two-column: Tasks + Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: goal.timeline?.length ? '1fr 340px' : '1fr', gap: 20 }}>
        {/* Tasks */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
            Tasks ({goal.tasks.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {goal.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPledge={(taskId) => setPledgeTaskId(taskId)}
              />
            ))}
          </div>
        </div>

        {/* Timeline sidebar */}
        {goal.timeline && goal.timeline.length > 0 && (
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
              Activity
            </h2>
            <Timeline events={goal.timeline} />
          </div>
        )}
      </div>

      {/* Pledge modal */}
      {pledgeTask && (
        <PledgeModal
          task={pledgeTask}
          onClose={() => setPledgeTaskId(null)}
          onSubmit={handlePledgeSubmit}
        />
      )}
    </div>
  );
}
