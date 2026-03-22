import { useState } from 'react';
import { GlassCard } from '../components/ui';
import { StarMap } from '../components/StarMap';
import { useAppStore } from '../stores/appStore';
import type { TribeSystem, SystemCategory } from '../types';
import {
  Globe,
  Shield,
  Swords,
  Crosshair,
  Compass,
  Gem,
  Skull,
  HelpCircle,
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const CATEGORY_CONFIG: Record<SystemCategory, { label: string; color: string; icon: typeof Globe }> = {
  core: { label: 'Core', color: '#22c55e', icon: Shield },
  frontline: { label: 'Frontline', color: '#eab308', icon: Swords },
  contested: { label: 'Contested', color: '#ef4444', icon: Crosshair },
  expansion: { label: 'Expansion', color: '#3b82f6', icon: Compass },
  resource: { label: 'Resource', color: '#a855f7', icon: Gem },
  hostile: { label: 'Hostile', color: '#dc2626', icon: Skull },
  unknown: { label: 'Unknown', color: '#6b7280', icon: HelpCircle },
};

function ThreatBar({ level }: { level: number }) {
  const clamp = Math.max(0, Math.min(10, level));
  const color = clamp <= 3 ? '#22c55e' : clamp <= 6 ? '#eab308' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ width: `${clamp * 10}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600, minWidth: 16 }}>{clamp}</span>
    </div>
  );
}

function SystemCard({ system }: { system: TribeSystem }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_CONFIG[system.category];
  const Icon = cat.icon;

  return (
    <GlassCard
      style={{
        padding: '16px 20px',
        background: 'var(--bg-card)',
        border: `1px solid ${cat.color}30`,
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Icon size={18} color={cat.color} />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{system.name}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '2px 8px',
            borderRadius: 4,
            background: `${cat.color}18`,
            color: cat.color,
          }}
        >
          {cat.label}
        </span>
        {expanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
      </div>

      {/* Quick stats row */}
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)', marginBottom: expanded ? 12 : 0 }}>
        {system.threatLevel != null && (
          <div style={{ flex: 1, maxWidth: 120 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Threat</span>
            <ThreatBar level={system.threatLevel} />
          </div>
        )}
        {system.controlledBy && (
          <div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Control</span>
            <div style={{ fontWeight: 500 }}>{system.controlledBy}</div>
          </div>
        )}
        {system.resources && system.resources.length > 0 && (
          <div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Resources</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {system.resources.map((r) => (
                <span key={r} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>{r}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {system.notes && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{system.notes}</p>
          )}

          {/* Bases */}
          {system.bases && system.bases.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>BASES</div>
              {system.bases.map((b) => (
                <div key={b.memberName} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', padding: '2px 0' }}>
                  <span style={{ flex: 1 }}>{b.memberName}</span>
                  {b.energy != null && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#22d3ee' }}>
                      <Zap size={11} /> {b.energy.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Dangers */}
          {system.dangers && system.dangers.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>⚠ DANGERS</div>
              {system.dangers.map((d, i) => (
                <div key={i} style={{ fontSize: 12, color: '#fca5a5', padding: '1px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={11} /> {d}
                </div>
              ))}
            </div>
          )}

          {/* Rift sightings */}
          {system.riftSightings && system.riftSightings.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#a855f7', marginBottom: 4 }}>🌀 RIFT ACTIVITY</div>
              {system.riftSightings.map((r) => (
                <div key={r.id} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '2px 0', borderLeft: '2px solid #a855f740', paddingLeft: 8 }}>
                  <div style={{ fontWeight: 500 }}>{r.type ?? 'Unknown type'} — reported by {r.reportedBy}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(r.timestamp).toLocaleDateString()} · {r.notes}</div>
                </div>
              ))}
            </div>
          )}

          {system.lastScouted && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
              Last scouted: {new Date(system.lastScouted).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

export function IntelPage() {
  const { systems, goals } = useAppStore();
  const [filter, setFilter] = useState<SystemCategory | 'all'>('all');
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  const filtered = selectedSystem
    ? systems.filter((s) => s.id === selectedSystem)
    : filter === 'all'
      ? systems
      : systems.filter((s) => s.category === filter);

  // Summary stats
  const totalRifts = systems.reduce((acc, s) => acc + (s.riftSightings?.length ?? 0), 0);
  const highThreat = systems.filter((s) => (s.threatLevel ?? 0) >= 7).length;
  const totalBases = systems.reduce((acc, s) => acc + (s.bases?.length ?? 0), 0);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 64px' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>
        Intel & Territory
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)' }}>
        Strategic overview of known systems, threats, and rift activity.
      </p>

      {/* Star Map */}
      <div style={{ marginBottom: 24 }}>
        <StarMap
          systems={systems}
          goals={goals}
          highlightSystemIds={selectedSystem ? [selectedSystem] : undefined}
          onSystemClick={(sys) => {
            setSelectedSystem(sys.id === selectedSystem ? null : sys.id);
            setFilter('all');
          }}
          height={420}
        />
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Systems', value: systems.length, color: '#6366f1' },
          { label: 'Bases', value: totalBases, color: '#22d3ee' },
          { label: 'High Threat', value: highThreat, color: '#ef4444' },
          { label: 'Rift Sightings', value: totalRifts, color: '#a855f7' },
        ].map((s) => (
          <GlassCard key={s.label} style={{ padding: '14px 16px', textAlign: 'center', background: 'var(--bg-card)' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <FilterBtn label="All" active={filter === 'all'} color="#6366f1" onClick={() => setFilter('all')} />
        {(Object.entries(CATEGORY_CONFIG) as [SystemCategory, typeof CATEGORY_CONFIG[SystemCategory]][]).map(([key, cfg]) => (
          <FilterBtn key={key} label={cfg.label} active={filter === key} color={cfg.color} onClick={() => setFilter(key)} />
        ))}
      </div>

      {/* System cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((s) => (
          <SystemCard key={s.id} system={s} />
        ))}
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No systems in this category.</p>
        )}
      </div>
    </div>
  );
}

function FilterBtn({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 14px',
        borderRadius: 6,
        border: `1px solid ${active ? color : 'var(--border-subtle)'}`,
        background: active ? `${color}18` : 'transparent',
        color: active ? color : 'var(--text-secondary)',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}
