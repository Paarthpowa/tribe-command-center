import { useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { GoalTile } from '../components/GoalTile';
import { GlassCard } from '../components/ui';
import { ProgressRing } from '../components/ProgressRing';
import { Target, CheckCircle, Clock, Users, Globe, Gem, Activity } from 'lucide-react';

export function DashboardPage() {
  const { tribe, members, visibleGoals, systems, activities } = useAppStore();
  const goals = visibleGoals();

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

  // Resource aggregation across all systems
  const resourceSummary = useMemo(() => {
    const counts = new Map<string, number>();
    systems.forEach(s => {
      s.resources?.forEach(r => counts.set(r, (counts.get(r) ?? 0) + 1));
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Gem size={16} color="#a855f7" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Resource Overview
            </h3>
          </div>
          {resourceSummary.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>No resources tracked yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {resourceSummary.map(([resource, count]) => (
                <div key={resource} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
          )}
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

      {/* Goal tiles grid */}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
        Goals
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 16,
        }}
      >
        {goals.map((goal) => (
          <GoalTile key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}
