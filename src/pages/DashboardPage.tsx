import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { GoalTile } from '../components/GoalTile';
import { GlassCard } from '../components/ui';
import { ProgressRing } from '../components/ProgressRing';
import { Target, CheckCircle, Clock, Users, Globe, Gem, Activity, AlertTriangle, BarChart3 } from 'lucide-react';
import { getPriorityColor } from '../lib/helpers';


export function DashboardPage() {
  const { tribe, members, visibleGoals, systems, activities } = useAppStore();
  const navigate = useNavigate();
  const goals = visibleGoals();
  const [showTimeline, setShowTimeline] = useState(false);

  const totalGoals = goals.length;
  const activeGoals = goals.filter((g) => g.status === 'active').length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const allTasks = goals.flatMap((g) => g.tasks);
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((t) => t.status === 'completed').length;
  const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const stats = [
    { label: 'Total Goals', value: totalGoals, icon: Target, color: 'var(--accent-indigo)' },
    { label: 'Active', value: activeGoals, icon: Clock, color: 'var(--accent-amber)' },
    { label: 'Completed', value: completedGoals, icon: CheckCircle, color: 'var(--accent-emerald)' },
    { label: 'Members', value: members.length, icon: Users, color: 'var(--accent-cyan)' },
    { label: 'Systems', value: systems.length, icon: Globe, color: '#6366f1' },
  ];

  // Resource coverage analysis across all systems
  const resourceCoverage = useMemo(() => {
    const INNER = ['Char', 'Slag', 'Ingot']; // heavier elements closer to star
    const OUTER = ['Comet'];                  // lighter elements further out

    let allResources = 0;
    let innerOnly = 0;
    let outerOnly = 0;
    let crudeSystems = 0;
    let noResources = 0;
    const counts = new Map<string, number>();

    systems.forEach(s => {
      const res = s.resources ?? [];
      res.forEach(r => counts.set(r, (counts.get(r) ?? 0) + 1));
      const hasInner = INNER.some(i => res.includes(i));
      const hasOuter = OUTER.some(o => res.includes(o));
      const hasCrude = res.some(r => r.includes('Crude'));
      if (hasCrude) crudeSystems++;
      if (hasInner && hasOuter) allResources++;
      else if (hasInner) innerOnly++;
      else if (hasOuter) outerOnly++;
      else if (!hasCrude) noResources++;
    });

    return { allResources, innerOnly, outerOnly, crudeSystems, noResources, counts: [...counts.entries()].sort((a, b) => b[1] - a[1]) };
  }, [systems]);

  // Recent activities (last 10)
  const recentActivities = activities.slice(0, 10);

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
            {tribe?.name} — coordinate, build, dominate.
          </p>
        </div>
        <ProgressRing percent={overallProgress} size={80} stroke={6}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {overallProgress}%
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              overall
            </div>
          </div>
        </ProgressRing>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {stats.map(({ label, value, icon: Icon, color }) => (
          <GlassCard key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `color-mix(in srgb, ${color} 10%, transparent)`,
              }}
            >
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Resource Aggregation & Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
        {/* Resources */}
        <GlassCard style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Gem size={16} color="#a855f7" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Resource Coverage
            </h3>
          </div>
          {/* Coverage summary boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Full Coverage', value: resourceCoverage.allResources, color: '#22c55e', desc: 'Inner + Outer' },
              { label: 'Inner Only', value: resourceCoverage.innerOnly, color: '#f59e0b', desc: 'Char · Slag · Ingot' },
              { label: 'Outer Only', value: resourceCoverage.outerOnly, color: '#6366f1', desc: 'Comet' },
              { label: 'Crude Matter', value: resourceCoverage.crudeSystems, color: '#ef4444', desc: 'Rift fuel' },
            ].map(({ label, value, color, desc }) => (
              <div key={label} style={{
                padding: '8px 10px', borderRadius: 'var(--radius-md)',
                background: `color-mix(in srgb, ${color} 8%, transparent)`,
                border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            ))}
          </div>
          {/* Per-resource bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {resourceCoverage.counts.map(([resource, count]) => (
              <div
                key={resource}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '2px 0', borderRadius: 4 }}
                onClick={() => navigate(`/intel?resource=${encodeURIComponent(resource)}`)}
                title={`Filter Intel by ${resource}`}
              >
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{resource}</span>
                <div style={{ width: 80, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{
                    width: `${Math.min(100, (count / systems.length) * 100)}%`,
                    height: '100%', borderRadius: 3,
                    background: '#a855f7',
                  }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#a855f7', minWidth: 20, textAlign: 'right' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Activity Feed */}
        <GlassCard style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Activity size={16} color="#22d3ee" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Recent Activity
            </h3>
          </div>
          {recentActivities.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>No activity yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentActivities.map(act => (
                <div key={act.id} style={{ display: 'flex', gap: 8, fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, minWidth: 45, flexShrink: 0 }}>
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{act.description}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Goal tiles grid — sorted by priority then deadline */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Goals
        </h2>
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 'var(--radius-md)',
            border: showTimeline ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border-subtle)',
            background: showTimeline ? 'rgba(99,102,241,0.12)' : 'transparent',
            color: showTimeline ? 'var(--accent-indigo)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <BarChart3 size={14} />
          Timeline
        </button>
      </div>

      {/* Project Timeline — Gantt */}
      {showTimeline && (() => {
        const goalsWithDates = goals.filter(g => g.deadline || g.createdAt);
        if (goalsWithDates.length === 0) return null;
        const now = Date.now();
        const allDates = goalsWithDates.flatMap(g => {
          const dates = [new Date(g.createdAt).getTime()];
          if (g.deadline) dates.push(new Date(g.deadline).getTime());
          return dates;
        });
        const minDate = Math.min(...allDates, now);
        const maxDate = Math.max(...allDates, now) + 86400000 * 7; // pad 7 days
        const range = maxDate - minDate || 1;
        const nowPct = ((now - minDate) / range) * 100;

        // Generate month labels
        const monthLabels: { label: string; pct: number }[] = [];
        const start = new Date(minDate);
        start.setDate(1);
        const labelDate = new Date(start);
        while (labelDate.getTime() <= maxDate) {
          const pct = ((labelDate.getTime() - minDate) / range) * 100;
          if (pct >= 0 && pct <= 100) {
            monthLabels.push({ label: labelDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), pct });
          }
          labelDate.setDate(labelDate.getDate() + 7);
        }

        return (
          <GlassCard style={{ padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ position: 'relative' }}>
              {/* Month labels */}
              <div style={{ display: 'flex', position: 'relative', height: 20, marginBottom: 8, marginLeft: 140 }}>
                {monthLabels.map((m, i) => (
                  <span key={i} style={{
                    position: 'absolute', left: `${m.pct}%`, transform: 'translateX(-50%)',
                    fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap',
                  }}>
                    {m.label}
                  </span>
                ))}
              </div>

              {/* Goal bars */}
              {goalsWithDates.map(g => {
                const startPct = ((new Date(g.createdAt).getTime() - minDate) / range) * 100;
                const endPct = g.deadline
                  ? ((new Date(g.deadline).getTime() - minDate) / range) * 100
                  : startPct + 8;
                const barColor = getPriorityColor(g.priority);
                const doneTasks = g.tasks.filter(t => t.status === 'completed').length;
                const progress = g.tasks.length > 0 ? (doneTasks / g.tasks.length) * 100 : 0;

                return (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, height: 28 }}>
                    {/* Label */}
                    <div style={{
                      width: 140, flexShrink: 0, fontSize: 11, fontWeight: 600,
                      color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      paddingRight: 8,
                    }} title={g.title}>
                      {g.title}
                    </div>
                    {/* Bar area */}
                    <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                      {/* Background bar */}
                      <div style={{
                        position: 'absolute',
                        left: `${startPct}%`,
                        width: `${Math.max(endPct - startPct, 2)}%`,
                        height: 20, top: 4,
                        borderRadius: 4,
                        background: `color-mix(in srgb, ${barColor} 20%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${barColor} 40%, transparent)`,
                      }}>
                        {/* Progress fill */}
                        <div style={{
                          width: `${progress}%`, height: '100%', borderRadius: 3,
                          background: barColor, opacity: 0.6,
                        }} />
                        {/* Status label */}
                        <span style={{
                          position: 'absolute', left: 6, top: 2,
                          fontSize: 9, fontWeight: 700, color: '#fff',
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        }}>
                          {g.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Now line */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `calc(140px + ${(nowPct / 100) * (100)}% * calc(1 - 140 / var(--timeline-width, 1000)))`,
                width: 0,
              }}>
                {/* Use a simpler approach */}
              </div>
            </div>
          </GlassCard>
        );
      })()}
      {(() => {
        const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
        const sorted = [...goals].sort((a, b) => {
          // Active goals first
          const aActive = a.status === 'active' ? 0 : a.status === 'planning' ? 1 : 2;
          const bActive = b.status === 'active' ? 0 : b.status === 'planning' ? 1 : 2;
          if (aActive !== bActive) return aActive - bActive;
          // Priority
          const priDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          if (priDiff !== 0) return priDiff;
          // Deadline (soonest first, no-deadline last)
          const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return aDeadline - bDeadline;
        });
        const topGoal = sorted.find(g => g.status === 'active' && (g.priority === 'critical' || g.priority === 'high'));

        return (
          <>
            {/* Priority goal highlight */}
            {topGoal && (
              <GlassCard style={{
                padding: '12px 16px', marginBottom: 16,
                border: '1px solid rgba(239,68,68,0.35)',
                background: 'rgba(239,68,68,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <AlertTriangle size={14} color="#ef4444" />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ef4444' }}>
                    Priority Goal
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{topGoal.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {topGoal.deadline ? `Deadline: ${new Date(topGoal.deadline).toLocaleDateString()}` : 'No deadline set'}
                  {' · '}{topGoal.tasks.filter(t => t.status === 'completed').length}/{topGoal.tasks.length} tasks done
                </div>
              </GlassCard>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {sorted.map((goal) => (
                <GoalTile key={goal.id} goal={goal} />
              ))}
            </div>
          </>
        );
      })()}
    </div>
  );
}
