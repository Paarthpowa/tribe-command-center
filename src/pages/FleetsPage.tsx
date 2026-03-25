import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { GlassCard, StatusBadge } from '../components/ui';
import {
  Rocket, Plus, Calendar, Clock, MapPin,
  CheckCircle, HelpCircle, XCircle, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { FleetOperation, FleetRSVPStatus } from '../types';

/* ── RSVP status config ── */
const RSVP_CONFIG: Record<FleetRSVPStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  coming:     { label: 'Coming',     color: '#22c55e', icon: CheckCircle },
  maybe:      { label: 'Maybe',      color: '#eab308', icon: HelpCircle },
  not_coming: { label: 'Not Coming', color: '#ef4444', icon: XCircle },
};

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function FleetCard({ fleet }: { fleet: FleetOperation }) {
  const { walletAddress, currentMember, rsvpFleet } = useAppStore();
  const member = currentMember();
  const [expanded, setExpanded] = useState(false);

  const myRsvp = fleet.rsvps.find((r) => r.memberAddress === walletAddress);
  const coming = fleet.rsvps.filter((r) => r.status === 'coming').length;
  const maybe = fleet.rsvps.filter((r) => r.status === 'maybe').length;
  const notComing = fleet.rsvps.filter((r) => r.status === 'not_coming').length;

  const dateObj = new Date(fleet.date + 'T' + fleet.startTime);
  const isPast = dateObj.getTime() < Date.now();
  const isToday = new Date().toDateString() === dateObj.toDateString();

  const handleRsvp = (status: FleetRSVPStatus) => {
    if (!walletAddress || !member) return;
    rsvpFleet(fleet.id, walletAddress, member.name, status);
  };

  return (
    <GlassCard style={{
      padding: 0,
      overflow: 'hidden',
      opacity: isPast ? 0.6 : 1,
      borderColor: isToday ? 'rgba(249,115,22,0.4)' : undefined,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        cursor: 'pointer',
      }} onClick={() => setExpanded(!expanded)}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Rocket size={16} color="#f97316" />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {fleet.title}
            </span>
            {isToday && <StatusBadge label="Today" color="#f97316" />}
            {isPast && <StatusBadge label="Ended" color="#6b7280" />}
          </div>

          {/* Date / time / duration row */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} />
              {dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              {fleet.startTime} &middot; ~{formatDuration(fleet.durationMinutes)}
            </span>
            {fleet.systemName && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} />
                {fleet.systemName}
              </span>
            )}
          </div>

          {/* Goal snippet */}
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
            {fleet.goal}
          </div>
        </div>

        {/* RSVP summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, fontSize: 12, fontWeight: 600 }}>
            <span style={{ color: '#22c55e' }}>{coming} in</span>
            <span style={{ color: '#eab308' }}>{maybe} ?</span>
            <span style={{ color: '#ef4444' }}>{notComing} out</span>
          </div>
          {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Expanded: RSVP buttons + list */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 20px' }}>
          {/* My RSVP */}
          {!isPast && member && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Your Response
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(Object.entries(RSVP_CONFIG) as [FleetRSVPStatus, typeof RSVP_CONFIG['coming']][]).map(([status, cfg]) => {
                  const Icon = cfg.icon;
                  const isActive = myRsvp?.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => handleRsvp(status)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: isActive ? `2px solid ${cfg.color}` : '1px solid var(--border-subtle)',
                        background: isActive ? `color-mix(in srgb, ${cfg.color} 12%, var(--bg-card))` : 'var(--bg-secondary)',
                        color: isActive ? cfg.color : 'var(--text-secondary)',
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      <Icon size={14} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          {fleet.description && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              {fleet.description}
            </div>
          )}

          {/* RSVP list */}
          {fleet.rsvps.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Responses ({fleet.rsvps.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {fleet.rsvps.map((r) => {
                  const cfg = RSVP_CONFIG[r.status];
                  return (
                    <span key={r.memberAddress} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-xl)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: cfg.color,
                      background: `color-mix(in srgb, ${cfg.color} 10%, var(--bg-card))`,
                      border: `1px solid color-mix(in srgb, ${cfg.color} 20%, transparent)`,
                    }}>
                      {r.memberName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
            Created by {fleet.createdByName}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

/* ── Create Fleet Modal ── */
function CreateFleetModal({ onClose }: { onClose: () => void }) {
  const { walletAddress, currentMember, addFleet, systems, tribe } = useAppStore();
  const member = currentMember();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('19:00');
  const [duration, setDuration] = useState(60);
  const [goal, setGoal] = useState('');
  const [systemId, setSystemId] = useState<number | undefined>();

  const handleSubmit = () => {
    if (!title.trim() || !goal.trim() || !walletAddress || !member) return;
    const sys = systems.find((s) => s.id === systemId);
    const fleet: FleetOperation = {
      id: `fleet-${Date.now()}`,
      tribeId: tribe?.id ?? '',
      title: title.trim(),
      description: description.trim(),
      date,
      startTime,
      durationMinutes: duration,
      goal: goal.trim(),
      systemId,
      systemName: sys?.name,
      createdBy: walletAddress,
      createdByName: member.name,
      createdAt: new Date().toISOString(),
      rsvps: [{ memberAddress: walletAddress, memberName: member.name, status: 'coming', timestamp: new Date().toISOString() }],
    };
    addFleet(fleet);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(6px)',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <GlassCard style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Rocket size={18} color="#f97316" />
            Create Fleet Operation
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Gate Deployment Fleet" style={inputStyle} />
          </div>

          {/* Date + Time + Duration row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Start Time *</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Duration (min)</label>
              <input type="number" value={duration} min={15} step={15} onChange={(e) => setDuration(Number(e.target.value))} style={inputStyle} />
            </div>
          </div>

          {/* System (optional) */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>System (Optional)</label>
            <select
              value={systemId ?? ''}
              onChange={(e) => setSystemId(e.target.value ? Number(e.target.value) : undefined)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">-- No specific system --</option>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Goal */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Goal / Objective *</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What's the plan? What should people bring?"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Additional Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Extra context, comms channel, etc."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !goal.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: !title.trim() || !goal.trim() ? 'var(--bg-secondary)' : 'var(--accent-indigo)',
              color: !title.trim() || !goal.trim() ? 'var(--text-muted)' : '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: !title.trim() || !goal.trim() ? 'not-allowed' : 'pointer',
              marginTop: 4,
            }}
          >
            Create Fleet Op
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

/* ── Main page ── */
export function FleetsPage() {
  const { fleets, currentMember } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const member = currentMember();

  const now = Date.now();
  const upcoming = fleets
    .filter((f) => new Date(f.date + 'T' + f.startTime).getTime() + f.durationMinutes * 60000 >= now)
    .sort((a, b) => new Date(a.date + 'T' + a.startTime).getTime() - new Date(b.date + 'T' + b.startTime).getTime());

  const past = fleets
    .filter((f) => new Date(f.date + 'T' + f.startTime).getTime() + f.durationMinutes * 60000 < now)
    .sort((a, b) => new Date(b.date + 'T' + b.startTime).getTime() - new Date(a.date + 'T' + a.startTime).getTime());

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Rocket size={22} color="#f97316" />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            Fleet Operations
          </h1>
        </div>
        {member && (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--accent-indigo)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            New Fleet Op
          </button>
        )}
      </div>

      {/* Upcoming */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={14} />
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <GlassCard style={{ textAlign: 'center', padding: 32 }}>
            <Rocket size={28} color="var(--text-muted)" style={{ marginBottom: 8 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              No fleet ops scheduled. Create one to rally the tribe!
            </p>
          </GlassCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map((f) => <FleetCard key={f.id} fleet={f} />)}
          </div>
        )}
      </div>

      {/* Past ops */}
      {past.length > 0 && (
        <div>
          <button
            onClick={() => setShowPast(!showPast)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 12,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Past Operations ({past.length})
            {showPast ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showPast && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {past.map((f) => <FleetCard key={f.id} fleet={f} />)}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showCreate && <CreateFleetModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
