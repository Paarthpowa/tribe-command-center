import { useAppStore } from '../stores/appStore';
import { GlassCard } from '../components/ui';
import { Shield, Star, User, MapPin, Clock, CheckCircle, XCircle, Crown } from 'lucide-react';
import type { MemberClearance } from '../types';
import { isContractDeployed, buildAddMemberTx } from '../lib/sui';

const roleConfig = {
  leader: { label: 'Leader', icon: Shield, color: 'var(--accent-amber)' },
  officer: { label: 'Officer', icon: Star, color: 'var(--accent-indigo)' },
  member: { label: 'Member', icon: User, color: 'var(--text-muted)' },
} as const;

const clearanceColors: Record<MemberClearance, string> = {
  pending: '#6b7280',
  member: '#22d3ee',
  veteran: '#22c55e',
  officer: '#6366f1',
  leader: '#f59e0b',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function MembersPage() {
  const { members, tribe, currentMember, approveMember, rejectMember, setMemberRole, transferLeadership, systems } = useAppStore();
  const me = currentMember();
  const canManage = me?.clearance === 'leader' || me?.clearance === 'officer';
  const isLeader = me?.role === 'leader';

  const approved = members.filter((m) => m.status === 'approved');
  const pending = members.filter((m) => m.status === 'pending');

  const getSystemName = (id?: number) => {
    if (!id) return null;
    return systems.find((s) => s.id === id)?.name ?? String(id);
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
        Members
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-muted)' }}>
        {tribe?.name} — {approved.length} active member{approved.length !== 1 ? 's' : ''}
        {pending.length > 0 && ` · ${pending.length} pending`}
      </p>

      {/* Pending approval section */}
      {canManage && pending.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#eab308', marginBottom: 10 }}>
            Pending Approval ({pending.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map((m) => (
              <GlassCard key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderColor: '#eab30830' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)' }}>
                  <User size={16} color="#eab308" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {m.profile?.notes ?? 'No info provided'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Approve ${m.name} as a tribe member?`)) {
                      // Build on-chain membership tx if contract is deployed
                      if (isContractDeployed() && m.address) {
                        try {
                          buildAddMemberTx(m.address, m.role ?? 'member');
                          // TODO: sign & execute via wallet once contract is deployed
                        } catch { /* continue with local approval */ }
                      }
                      approveMember(m.id);
                    }
                  }}
                  style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#22c55e20', color: '#22c55e', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <CheckCircle size={13} /> Approve
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Reject ${m.name}? This cannot be undone.`)) rejectMember(m.id);
                  }}
                  style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#ef444420', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <XCircle size={13} /> Reject
                </button>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Approved members */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {approved.map((m) => {
          const cfg = roleConfig[m.role];
          const Icon = cfg.icon;
          const sys = getSystemName(m.profile?.baseSystem);
          return (
            <GlassCard
              key={m.id}
              style={{ padding: 16 }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: m.profile ? 10 : 0 }}>
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
                    {m.reputation ? `Score: ${m.reputation.score}` : 'No activity yet'}
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
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: clearanceColors[m.clearance],
                    background: `${clearanceColors[m.clearance]}14`,
                  }}
                >
                  {m.clearance}
                </span>
              </div>

              {/* Profile info row */}
              {m.profile && (
                <div style={{ display: 'flex', gap: 18, fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 54 }}>
                  {sys && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} color="var(--text-muted)" /> {sys}
                    </span>
                  )}
                  {m.profile.lastActive && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color="var(--text-muted)" /> {timeAgo(m.profile.lastActive)}
                    </span>
                  )}
                </div>
              )}

              {/* Role management — leader only */}
              {isLeader && m.id !== me?.id && (
                <div style={{ display: 'flex', gap: 8, paddingLeft: 54, marginTop: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>Role:</span>
                  <select
                    value={m.role}
                    onChange={(e) => setMemberRole(m.id, e.target.value as 'leader' | 'officer' | 'member')}
                    style={{
                      padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)',
                      background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontSize: 12,
                      cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <option value="member">Member</option>
                    <option value="officer">Officer</option>
                  </select>
                  <button
                    onClick={() => {
                      if (confirm(`Transfer leadership to ${m.name}? You will become an officer.`)) {
                        transferLeadership(m.id);
                      }
                    }}
                    style={{
                      padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.3)',
                      background: 'rgba(245,158,11,0.08)', color: '#f59e0b', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.18)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.08)')}
                  >
                    <Crown size={12} /> Transfer Leadership
                  </button>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
