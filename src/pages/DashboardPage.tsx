import { useAppStore } from '../stores/appStore';
import { GoalTile } from '../components/GoalTile';
import { GlassCard } from '../components/ui';
import { ProgressRing } from '../components/ProgressRing';
import { Target, CheckCircle, Clock, Users } from 'lucide-react';

export function DashboardPage() {
  const { goals, tribe, members } = useAppStore();

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
  ];

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
