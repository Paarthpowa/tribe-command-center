import { useAppStore } from '../stores/appStore';
import { GlassCard } from '../components/ui';
import { Shield, Star, User } from 'lucide-react';

const roleConfig = {
  leader: { label: 'Leader', icon: Shield, color: 'var(--accent-amber)' },
  officer: { label: 'Officer', icon: Star, color: 'var(--accent-indigo)' },
  member: { label: 'Member', icon: User, color: 'var(--text-muted)' },
} as const;

export function MembersPage() {
  const { members, tribe } = useAppStore();

  return (
    <div style={{ padding: '28px 24px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
        Members
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-muted)' }}>
        {tribe?.name} — {members.length} members
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {members.map((m) => {
          const cfg = roleConfig[m.role];
          const Icon = cfg.icon;
          return (
            <GlassCard
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${cfg.color} 25%, transparent)`,
                }}
              >
                <Icon size={18} color={cfg.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {m.address.slice(0, 10)}…{m.address.slice(-4)}
                </div>
              </div>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-xl)',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: cfg.color,
                  background: `color-mix(in srgb, ${cfg.color} 10%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${cfg.color} 20%, transparent)`,
                }}
              >
                {cfg.label}
              </span>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
