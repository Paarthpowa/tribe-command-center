import type { Task } from '../types';
import { StatusBadge, GlassCard } from './ui';
import { getStatusColor, getStatusLabel } from '../lib/helpers';
import { ChevronDown, ChevronUp, Package, Clock } from 'lucide-react';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  onPledge?: (taskId: string) => void;
}

export function TaskCard({ task, onPledge }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  const totalNeeded = task.requirements.reduce((s, r) => s + r.amount, 0);
  const totalDelivered = task.contributions.reduce((s, c) => s + c.delivered, 0);
  const totalPledged = task.contributions.reduce((s, c) => s + c.pledged, 0);
  const pctDelivered = totalNeeded > 0 ? Math.round((totalDelivered / totalNeeded) * 100) : 100;
  const pctPledged = totalNeeded > 0 ? Math.round((totalPledged / totalNeeded) * 100) : 100;
  const fullyPledged = totalPledged >= totalNeeded;
  const fullyDelivered = totalDelivered >= totalNeeded;

  // Card border glow: green if fully delivered, cyan if fully pledged, default otherwise
  const cardBorder = fullyDelivered
    ? '1px solid rgba(16, 185, 129, 0.4)'
    : fullyPledged
      ? '1px solid rgba(34, 211, 238, 0.4)'
      : '1px solid var(--border-subtle)';
  const cardShadow = fullyDelivered
    ? '0 0 12px rgba(16, 185, 129, 0.15)'
    : fullyPledged
      ? '0 0 12px rgba(34, 211, 238, 0.1)'
      : 'var(--shadow-card)';

  return (
    <GlassCard style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, border: cardBorder, boxShadow: cardShadow }}>
      {/* Header */}
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded((p) => !p)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Package size={16} color="var(--text-muted)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {task.title}
          </span>
          {task.subIndex != null && task.subTotal != null && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              ({task.subIndex}/{task.subTotal})
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusBadge label={getStatusLabel(task.status)} color={getStatusColor(task.status)} />
          {expanded ? (
            <ChevronUp size={16} color="var(--text-muted)" />
          ) : (
            <ChevronDown size={16} color="var(--text-muted)" />
          )}
        </div>
      </div>

      {/* Dual resource bars: pledged (top) + delivered (bottom) */}
      {totalNeeded > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Pledged bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
              <span style={{ color: fullyPledged ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                Pledged: {totalPledged}/{totalNeeded}
                {fullyPledged && ' ✓ FULL'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{pctPledged}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(pctPledged, 100)}%`,
                  background: fullyPledged
                    ? 'var(--accent-cyan)'
                    : 'linear-gradient(90deg, rgba(34,211,238,0.4), rgba(34,211,238,0.7))',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
          {/* Delivered bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
              <span style={{ color: fullyDelivered ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                Delivered: {totalDelivered}/{totalNeeded}
                {fullyDelivered && ' ✓ DONE'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{pctDelivered}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pctDelivered}%`,
                  background: fullyDelivered
                    ? 'var(--accent-emerald)'
                    : 'linear-gradient(90deg, var(--accent-indigo), var(--accent-cyan))',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {task.description}
          </p>

          {task.systemName && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              📍 System: <strong style={{ color: 'var(--accent-cyan)' }}>{task.systemName}</strong>
              {task.assemblyType && <> &middot; {task.assemblyType}</>}
            </div>
          )}

          {/* Requirements */}
          {task.requirements.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Requirements
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {task.requirements.map((r) => {
                  const pledgedForRes = task.contributions
                    .filter((c) => c.resource === r.resource)
                    .reduce((s, c) => s + c.pledged, 0);
                  const deliveredForRes = task.contributions
                    .filter((c) => c.resource === r.resource)
                    .reduce((s, c) => s + c.delivered, 0);
                  return (
                    <span
                      key={r.resource}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12,
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: deliveredForRes >= r.amount
                          ? '1px solid rgba(16,185,129,0.4)'
                          : pledgedForRes >= r.amount
                            ? '1px solid rgba(34,211,238,0.3)'
                            : '1px solid var(--border-subtle)',
                      }}
                    >
                      {r.resource}: {deliveredForRes}/{r.amount}
                      {pledgedForRes > deliveredForRes && (
                        <span style={{ color: 'var(--accent-cyan)', marginLeft: 4 }}>
                          ({pledgedForRes} pledged)
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contributions */}
          {task.contributions.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Contributions
              </div>
              {task.contributions.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    marginBottom: 4,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>{c.memberName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {c.resource}: {c.delivered}/{c.pledged}
                    </span>
                    {c.deadline && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)', fontSize: 11 }}>
                        <Clock size={10} />
                        {new Date(c.deadline).toLocaleDateString()}
                      </span>
                    )}
                    <StatusBadge
                      label={c.status}
                      color={getStatusColor(
                        c.status === 'delivered' ? 'completed' : c.status === 'partial' ? 'in_progress' : 'open',
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pledge button */}
          {task.status !== 'completed' && task.requirements.length > 0 && !fullyPledged && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPledge?.(task.id);
              }}
              style={{
                alignSelf: 'flex-start',
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-accent)',
                background: 'transparent',
                color: 'var(--accent-indigo)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              + Pledge Resources
            </button>
          )}
        </div>
      )}
    </GlassCard>
  );
}
