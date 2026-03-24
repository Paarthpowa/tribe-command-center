import { useAppStore } from '../stores/appStore';
import { GlassCard } from '../components/ui';
import { GoalTile } from '../components/GoalTile';
import { Users, Shield, Crown, UserPlus } from 'lucide-react';

const ROLE_CONFIG = {
  founder: { label: 'Founder', color: '#fbbf24', icon: Crown },
  council: { label: 'Council', color: '#818cf8', icon: Shield },
  member: { label: 'Member', color: '#22c55e', icon: Users },
} as const;

export function AlliancePage() {
  const { alliance, visibleGoals, tribe } = useAppStore();
  const goals = visibleGoals();
  const allianceGoals = goals.filter(g => g.allianceId === alliance?.id);

  if (!alliance) {
    return (
      <main style={{ padding: '40px 32px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Users size={28} color="var(--accent-cyan)" />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>Alliance</h1>
        </div>
        <GlassCard style={{ padding: 32, textAlign: 'center' }}>
          <UserPlus size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
            Your tribe is not part of an alliance yet.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Alliances allow multiple tribes to share goals, coordinate joint operations, and build cross-tribe infrastructure.
          </p>
        </GlassCard>
      </main>
    );
  }

  return (
    <main style={{ padding: '40px 32px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Users size={28} color="var(--accent-cyan)" />
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
          {alliance.name}
        </h1>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 4,
          background: 'rgba(34,211,238,0.12)', color: '#22d3ee',
          letterSpacing: '0.05em',
        }}>
          [{alliance.tag}]
        </span>
      </div>
      <p style={{ margin: '0 0 32px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {alliance.description}
      </p>

      {/* Member Tribes */}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
        Member Tribes ({alliance.members.length})
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 32 }}>
        {alliance.members.map(m => {
          const cfg = ROLE_CONFIG[m.role];
          const RoleIcon = cfg.icon;
          const isUs = m.tribeId === tribe?.id;
          return (
            <GlassCard key={m.tribeId} style={{
              padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
              border: isUs ? '1px solid rgba(34,211,238,0.3)' : undefined,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RoleIcon size={16} color={cfg.color} />
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                  {m.tribeName}
                </span>
                {isUs && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
                    YOU
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                  background: `${cfg.color}18`, color: cfg.color, textTransform: 'uppercase',
                }}>
                  {cfg.label}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  Joined {new Date(m.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Shared Goals */}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
        Shared Alliance Goals ({allianceGoals.length})
      </h2>
      {allianceGoals.length === 0 ? (
        <GlassCard style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            No shared alliance goals yet. Create a goal and assign it to the alliance to start cooperating.
          </p>
        </GlassCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {allianceGoals.map(g => (
            <GoalTile key={g.id} goal={g} />
          ))}
        </div>
      )}
    </main>
  );
}
