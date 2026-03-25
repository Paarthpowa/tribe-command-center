import { useState, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { GlassCard } from '../components/ui';
import {
  Globe, Shield, MapPin, AlertTriangle, Target, Package,
  Gift, Users, Navigation, Radio, Zap, Rocket, Calendar,
  ChevronDown,
} from 'lucide-react';
import type { ActivityEvent, ActivityType } from '../types';

/* ── Icon + colour per activity type ── */
const ACTIVITY_META: Record<ActivityType, { icon: typeof Globe; color: string; label: string }> = {
  system_claimed:   { icon: MapPin,        color: '#3b82f6', label: 'Territory' },
  system_unclaimed: { icon: MapPin,        color: '#6b7280', label: 'Territory' },
  base_added:       { icon: Shield,        color: '#22d3ee', label: 'Base' },
  scout_report:     { icon: Navigation,    color: '#a855f7', label: 'Intel' },
  goal_created:     { icon: Target,        color: '#6366f1', label: 'Goal' },
  pledge_made:      { icon: Gift,          color: '#eab308', label: 'Pledge' },
  member_joined:    { icon: Users,         color: '#10b981', label: 'Crew' },
  hq_set:           { icon: Zap,           color: '#fbbf24', label: 'HQ' },
  threat_alert:     { icon: AlertTriangle, color: '#ef4444', label: 'Alert' },
  lpoint_updated:   { icon: Radio,         color: '#8b5cf6', label: 'L-Point' },
  fleet_created:    { icon: Rocket,        color: '#f97316', label: 'Fleet' },
  fleet_rsvp:       { icon: Calendar,      color: '#14b8a6', label: 'Fleet' },
};

type FilterType = 'all' | 'territory' | 'intel' | 'goals' | 'fleet';
const FILTERS: { key: FilterType; label: string; types: ActivityType[] }[] = [
  { key: 'all',       label: 'All',       types: [] },
  { key: 'territory', label: 'Territory', types: ['system_claimed', 'system_unclaimed', 'base_added', 'hq_set'] },
  { key: 'intel',     label: 'Intel',     types: ['scout_report', 'lpoint_updated', 'threat_alert'] },
  { key: 'goals',     label: 'Goals',     types: ['goal_created', 'pledge_made'] },
  { key: 'fleet',     label: 'Fleet Ops', types: ['fleet_created', 'fleet_rsvp'] },
];

/* Group events by date string */
function groupByDate(events: ActivityEvent[]): [string, ActivityEvent[]][] {
  const map = new Map<string, ActivityEvent[]>();
  for (const ev of events) {
    const d = new Date(ev.timestamp);
    const key = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const list = map.get(key) ?? [];
    list.push(ev);
    map.set(key, list);
  }
  return Array.from(map.entries());
}

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NewsPage() {
  const { activities, goals, fleets } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCount, setShowCount] = useState(50);

  /* Merge goal timeline events into the activity stream for a richer timeline */
  const allEvents = useMemo(() => {
    const goalEvents: ActivityEvent[] = [];
    for (const g of goals) {
      for (const te of g.timeline ?? []) {
        goalEvents.push({
          id: te.id,
          type: te.type === 'pledge_made' ? 'pledge_made'
              : te.type === 'goal_created' ? 'goal_created'
              : te.type === 'delivery_confirmed' ? 'pledge_made'
              : 'goal_created',
          description: te.description,
          memberName: te.memberName,
          timestamp: te.timestamp,
        });
      }
    }
    /* Add fleet creation events implicitly */
    const fleetEvents: ActivityEvent[] = fleets.map((f) => ({
      id: `fleet-${f.id}`,
      type: 'fleet_created' as const,
      description: `Fleet op "${f.title}" scheduled for ${new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${f.startTime}`,
      memberName: f.createdByName,
      timestamp: f.createdAt,
    }));

    /* Deduplicate by id */
    const map = new Map<string, ActivityEvent>();
    for (const ev of [...activities, ...goalEvents, ...fleetEvents]) {
      if (!map.has(ev.id)) map.set(ev.id, ev);
    }
    const merged = Array.from(map.values());
    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return merged;
  }, [activities, goals, fleets]);

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)!;
    const list = f.types.length > 0
      ? allEvents.filter((ev) => f.types.includes(ev.type))
      : allEvents;
    return list.slice(0, showCount);
  }, [allEvents, filter, showCount]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Globe size={22} color="var(--accent-indigo)" />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            News Feed
          </h1>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-md)' }}>
            {allEvents.length} events
          </span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setShowCount(50); }}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-xl)',
              border: filter === f.key ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
              background: filter === f.key ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
              color: filter === f.key ? 'var(--accent-indigo)' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {grouped.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: 40 }}>
          <Package size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No events yet. Activity will appear here as your tribe takes action.</p>
        </GlassCard>
      ) : (
        <div style={{ position: 'relative' }}>
          {grouped.map(([dateLabel, events]) => (
            <div key={dateLabel} style={{ marginBottom: 32 }}>
              {/* Date header */}
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 12,
                paddingLeft: 44,
              }}>
                {dateLabel}
              </div>

              {/* Events for this date */}
              <div style={{ position: 'relative', paddingLeft: 44 }}>
                {/* Vertical line */}
                <div style={{
                  position: 'absolute',
                  left: 15,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: 'linear-gradient(to bottom, var(--border-subtle), transparent)',
                  borderRadius: 1,
                }} />

                {events.map((ev, i) => {
                  const meta = ACTIVITY_META[ev.type] ?? ACTIVITY_META.goal_created;
                  const Icon = meta.icon;
                  return (
                    <div key={ev.id + i} style={{
                      display: 'flex',
                      gap: 12,
                      marginBottom: 12,
                      position: 'relative',
                    }}>
                      {/* Icon dot */}
                      <div style={{
                        position: 'absolute',
                        left: -34,
                        top: 2,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `color-mix(in srgb, ${meta.color} 15%, var(--bg-primary))`,
                        border: `2px solid ${meta.color}`,
                        flexShrink: 0,
                      }}>
                        <Icon size={11} color={meta.color} />
                      </div>

                      {/* Content card */}
                      <GlassCard style={{
                        flex: 1,
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 8,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            {ev.description}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                            {ev.memberName && (
                              <span style={{ fontSize: 11, color: 'var(--accent-emerald)' }}>
                                {ev.memberName}
                              </span>
                            )}
                            {ev.systemName && (
                              <span style={{ fontSize: 11, color: 'var(--accent-cyan)' }}>
                                {ev.systemName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: 2 }}>
                          {relativeTime(ev.timestamp)}
                        </div>
                      </GlassCard>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load more */}
          {showCount < allEvents.length && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button
                onClick={() => setShowCount((c) => c + 50)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ChevronDown size={14} />
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
