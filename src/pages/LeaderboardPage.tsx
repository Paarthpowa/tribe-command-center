import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { GlassCard } from '../components/ui';
import { Trophy, Star, CheckCircle, AlertTriangle, XCircle, TrendingUp, ChevronDown, ChevronRight, Package, Rocket } from 'lucide-react';
import type { TribeMember } from '../types';

function getScoreColor(score: number): string {
  if (score >= 90) return 'var(--accent-emerald)';
  if (score >= 70) return 'var(--accent-cyan)';
  if (score >= 50) return '#f59e0b';
  return 'var(--accent-rose)';
}

function getRankLabel(index: number): string {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `#${index + 1}`;
}

interface ContributionEntry {
  type: 'material' | 'fleet';
  description: string;
  detail: string;
  date: string;
  status?: string;
  statusColor?: string;
}

export function LeaderboardPage() {
  const members = useAppStore((s) => s.members);
  const goals = useAppStore((s) => s.goals);
  const fleets = useAppStore((s) => s.fleets);

  // Sort members by reputation score (descending), fallback to name
  const ranked = [...members]
    .filter((m) => m.reputation)
    .sort((a, b) => (b.reputation?.score ?? 0) - (a.reputation?.score ?? 0));

  // Compute aggregate stats
  const totalContributions = goals.reduce(
    (sum, g) => sum + g.tasks.reduce((tSum, t) => tSum + t.contributions.length, 0),
    0,
  );
  const activeTasks = goals.reduce((sum, g) => sum + g.tasks.length, 0);

  // Build per-member contribution history
  const getMemberHistory = (member: TribeMember): ContributionEntry[] => {
    const entries: ContributionEntry[] = [];

    // Material contributions from goals/tasks
    for (const goal of goals) {
      for (const task of goal.tasks) {
        for (const c of task.contributions) {
          if (c.memberName === member.name || c.memberAddress === member.address) {
            const statusLabel = c.status === 'delivered' ? 'Delivered' : c.status === 'pending_approval' ? 'Pending Approval' : c.status === 'partial' ? 'Partial' : 'Pledged';
            const statusColor = c.status === 'delivered' ? 'var(--accent-emerald)' : c.status === 'pending_approval' ? '#f59e0b' : c.status === 'partial' ? '#f59e0b' : 'var(--accent-cyan)';
            entries.push({
              type: 'material',
              description: `${c.resource} → ${task.title}`,
              detail: `${c.delivered}/${c.pledged} units${c.onTime === true ? ' · On Time' : c.onTime === false ? ' · Late' : ''}`,
              date: c.createdAt,
              status: statusLabel,
              statusColor,
            });
          }
        }
      }
    }

    // Fleet participation
    for (const fleet of fleets) {
      const rsvp = fleet.rsvps.find(r => r.memberName === member.name || r.memberAddress === member.address);
      if (rsvp && rsvp.status === 'coming') {
        entries.push({
          type: 'fleet',
          description: fleet.title,
          detail: fleet.systemName ? `@ ${fleet.systemName}` : fleet.goal,
          date: fleet.date,
          status: 'Participated',
          statusColor: '#6366f1',
        });
      }
    }

    // Sort by date descending
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return entries;
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Trophy size={24} color="var(--accent-amber)" />
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
          Leaderboard
        </h1>
      </div>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-muted)' }}>
        Member rankings based on contribution reputation scores
      </p>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Members Ranked', value: ranked.length, icon: Star },
          { label: 'Total Contributions', value: totalContributions, icon: TrendingUp },
          { label: 'Active Tasks', value: activeTasks, icon: CheckCircle },
        ].map(({ label, value, icon: Icon }) => (
          <GlassCard key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
            <Icon size={20} color="var(--accent-indigo)" />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Leaderboard table */}
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '50px 2fr 1fr 1fr 1fr 1fr 100px',
            gap: 8,
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <span>Rank</span>
          <span>Member</span>
          <span style={{ textAlign: 'center' }}>Score</span>
          <span style={{ textAlign: 'center' }}>On Time</span>
          <span style={{ textAlign: 'center' }}>Late</span>
          <span style={{ textAlign: 'center' }}>Failed</span>
          <span style={{ textAlign: 'center' }}>Total</span>
        </div>

        {/* Rows */}
        {ranked.map((member, i) => (
          <MemberRow key={member.id} member={member} rank={i} history={getMemberHistory(member)} />
        ))}

        {ranked.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No reputation data available yet.
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function MemberRow({ member, rank, history }: { member: TribeMember; rank: number; history: ContributionEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const rep = member.reputation!;
  const scoreColor = getScoreColor(rep.score);

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'grid',
          gridTemplateColumns: '50px 2fr 1fr 1fr 1fr 1fr 100px',
          gap: 8,
          padding: '14px 20px',
          alignItems: 'center',
          background: rank === 0 ? 'rgba(245,158,11,0.04)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, textAlign: 'center' }}>
          {getRankLabel(rank)}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `linear-gradient(135deg, ${scoreColor}, var(--bg-tertiary))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
            }}
          >
            {member.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{member.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{member.role}</div>
          </div>
          {expanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
        </div>

        {/* Score with bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor }}>{rep.score}</span>
          <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--bg-tertiary)' }}>
            <div style={{ width: `${rep.score}%`, height: '100%', borderRadius: 2, background: scoreColor, transition: 'width 0.5s' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <CheckCircle size={13} color="var(--accent-emerald)" />
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{rep.deliveredOnTime}</span>
        </div>

        <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <AlertTriangle size={13} color="#f59e0b" />
          <span style={{ fontSize: 13, color: rep.deliveredLate > 0 ? '#f59e0b' : 'var(--text-muted)' }}>{rep.deliveredLate}</span>
        </div>

        <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <XCircle size={13} color="var(--accent-rose)" />
          <span style={{ fontSize: 13, color: rep.failedPledges > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>{rep.failedPledges}</span>
        </div>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
          {rep.totalPledges}
        </div>
      </div>

      {/* Expanded contribution history */}
      {expanded && (
        <div style={{ padding: '0 20px 16px 80px', background: 'rgba(255,255,255,0.015)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            Contribution History
          </div>
          {history.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>No contributions recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.map((entry, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, fontSize: 12,
                  padding: '8px 12px', borderRadius: 6,
                  borderLeft: `3px solid ${entry.type === 'fleet' ? '#6366f1' : 'var(--accent-emerald)'}`,
                  background: entry.type === 'fleet' ? 'rgba(99,102,241,0.04)' : 'rgba(34,197,94,0.04)',
                }}>
                  {entry.type === 'fleet' ? <Rocket size={13} color="#6366f1" /> : <Package size={13} color="var(--accent-emerald)" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{entry.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.detail}</div>
                  </div>
                  {entry.status && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: `color-mix(in srgb, ${entry.statusColor} 12%, transparent)`, color: entry.statusColor }}>
                      {entry.status}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 70, textAlign: 'right' }}>
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
