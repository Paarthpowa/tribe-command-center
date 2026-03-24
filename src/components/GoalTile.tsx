import { useNavigate } from 'react-router-dom';
import type { Goal, GoalClassification } from '../types';
import { ProgressRing } from './ProgressRing';
import { StatusBadge, GlassCard } from './ui';
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getTaskProgress,
} from '../lib/helpers';
import type { CSSProperties } from 'react';
import { Lock, ShieldAlert, Calendar } from 'lucide-react';

const CLASSIFICATION_STYLE: Record<GoalClassification, { label: string; color: string; icon?: typeof Lock }> = {
  normal: { label: '', color: '' },
  classified: { label: 'Classified', color: '#eab308', icon: Lock },
  'top-secret': { label: 'Top Secret', color: '#ef4444', icon: ShieldAlert },
};

interface GoalTileProps {
  goal: Goal;
}

export function GoalTile({ goal }: GoalTileProps) {
  const navigate = useNavigate();
  const progress = getTaskProgress(goal.tasks);
  const totalTasks = goal.tasks.length;
  const doneTasks = goal.tasks.filter((t) => t.status === 'completed').length;

  const priorityDot: CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: getPriorityColor(goal.priority),
    flexShrink: 0,
  };

  return (
    <GlassCard
      hoverable
      onClick={() => navigate(`/goal/${goal.id}`)}
      style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 180 }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={priorityDot} title={goal.priority} />
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}
          >
            {goal.title}
          </h3>
        </div>

        <ProgressRing percent={progress} size={56} stroke={4} color={getStatusColor(goal.status)}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {progress}%
          </span>
        </ProgressRing>
      </div>

      {/* Description */}
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {goal.description}
      </p>

      {/* Footer */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusBadge label={getStatusLabel(goal.status)} color={getStatusColor(goal.status)} />
          {goal.allianceId && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#22d3ee', padding: '2px 6px', borderRadius: 4, background: 'rgba(34,211,238,0.12)' }}>
              🤝 Alliance
            </span>
          )}
          {goal.classification !== 'normal' && (() => {
            const cls = CLASSIFICATION_STYLE[goal.classification];
            const ClsIcon = cls.icon!;
            return (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: cls.color, padding: '2px 6px', borderRadius: 4, background: `${cls.color}14` }}>
                <ClsIcon size={10} /> {cls.label}
              </span>
            );
          })()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {goal.deadline && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: new Date(goal.deadline) < new Date() ? '#ef4444' : 'var(--text-muted)' }}>
              <Calendar size={11} />
              {new Date(goal.deadline).toLocaleDateString()}
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {doneTasks}/{totalTasks} tasks
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
