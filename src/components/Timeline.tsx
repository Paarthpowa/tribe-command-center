import type { TimelineEvent } from '../types';
import { GlassCard } from './ui';
import { Target, Package, Gift, CheckCircle, AlertTriangle, Trophy } from 'lucide-react';

const iconMap: Record<TimelineEvent['type'], typeof Target> = {
  goal_created: Target,
  task_added: Package,
  pledge_made: Gift,
  delivery_confirmed: CheckCircle,
  deadline_missed: AlertTriangle,
  goal_completed: Trophy,
};

const colorMap: Record<TimelineEvent['type'], string> = {
  goal_created: 'var(--accent-indigo)',
  task_added: 'var(--accent-cyan)',
  pledge_made: 'var(--accent-amber)',
  delivery_confirmed: 'var(--accent-emerald)',
  deadline_missed: 'var(--accent-rose)',
  goal_completed: 'var(--accent-emerald)',
};

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return (
    <GlassCard style={{ padding: 20 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
        Timeline
      </h3>
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        {/* Vertical line */}
        <div
          style={{
            position: 'absolute',
            left: 9,
            top: 4,
            bottom: 4,
            width: 2,
            background: 'var(--border-subtle)',
            borderRadius: 1,
          }}
        />

        {sorted.map((event, i) => {
          const Icon = iconMap[event.type];
          const color = colorMap[event.type];
          const date = new Date(event.timestamp);
          const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const hourStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={event.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: i < sorted.length - 1 ? 16 : 0,
                position: 'relative',
              }}
            >
              {/* Dot */}
              <div
                style={{
                  position: 'absolute',
                  left: -24,
                  top: 2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `color-mix(in srgb, ${color} 15%, var(--bg-card))`,
                  border: `2px solid ${color}`,
                }}
              >
                <Icon size={10} color={color} />
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {event.description}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {timeStr} at {hourStr}
                  {event.memberName && <> &middot; {event.memberName}</>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
