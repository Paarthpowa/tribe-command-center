import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GlassCard } from '../components/ui';
import { StarMap } from '../components/StarMap';
import { SystemPicker } from '../components/SystemPicker';
import { SystemDetailPanel } from '../components/SystemDetailPanel';
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
  ChevronDown,
  ChevronRight,
  Plus,
  Star,
  Trash2,
  Search,
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

function SystemCard({
  system,
  onSetHQ,
  onUnclaim,
}: {
  system: TribeSystem;
  onSetHQ?: (id: number) => void;
  onUnclaim?: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmUnclaim, setConfirmUnclaim] = useState(false);
  const cat = CATEGORY_CONFIG[system.category];
  const Icon = cat.icon;

  return (
    <GlassCard
      style={{
        padding: '16px 20px',
        background: 'var(--bg-card)',
        border: `1px solid ${system.isHQ ? '#fbbf2440' : `${cat.color}30`}`,
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Icon size={18} color={cat.color} />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
          {system.name}
          {system.isHQ && (
            <span style={{ color: '#fbbf24', marginLeft: 6, fontSize: 14 }}>{'\u2605'}</span>
          )}
        </span>
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

          {/* Scouting logs */}
          {system.scoutingLogs && system.scoutingLogs.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>SCOUTING LOG</div>
              {system.scoutingLogs.map((log) => (
                <div key={log.id} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '2px 0', borderLeft: `2px solid ${log.foundEnemy ? '#ef444440' : '#22c55e40'}`, paddingLeft: 8, marginBottom: 4 }}>
                  <div style={{ fontWeight: 500 }}>
                    {log.reportedBy}
                    {log.lPoint && <span style={{ color: 'var(--text-muted)' }}> @ {log.lPoint}</span>}
                    {log.foundEnemy && <span style={{ color: '#ef4444', marginLeft: 6 }}>ENEMY FOUND</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleDateString()} &middot; {log.notes}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {!system.isHQ && onSetHQ && (
              <button
                onClick={(e) => { e.stopPropagation(); onSetHQ(system.id); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 6,
                  border: '1px solid rgba(251,191,36,0.3)',
                  background: 'rgba(251,191,36,0.08)',
                  color: '#fbbf24', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                }}
              >
                <Star size={12} /> Set HQ
              </button>
            )}
            {onUnclaim && !confirmUnclaim && (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmUnclaim(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 6,
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.08)',
                  color: '#ef4444', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  marginLeft: 'auto',
                }}
              >
                <Trash2 size={12} /> Unclaim
              </button>
            )}
          </div>

          {/* Unclaim confirmation */}
          {confirmUnclaim && (
            <div onClick={(e) => e.stopPropagation()} style={{
              marginTop: 8, padding: '10px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <AlertTriangle size={14} color="#ef4444" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>Confirm Unclaim</span>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Remove <strong style={{ color: 'var(--text-primary)' }}>{system.name}</strong>? All data for this system will be permanently lost.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={(e) => { e.stopPropagation(); setConfirmUnclaim(false); }} style={{
                  padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}>Cancel</button>
                <button onClick={(e) => { e.stopPropagation(); onUnclaim?.(system.id); }} style={{
                  padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                  color: '#ef4444', cursor: 'pointer',
                }}>Yes, Unclaim</button>
              </div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

export function IntelPage() {
  const { systems, goals, worldSystems, claimSystem, claimGatedNetwork, unclaimSystem, setHQ } = useAppStore();
  const member = useAppStore(s => s.currentMember());
  const isLeaderOrOfficer = member?.role === 'leader' || member?.role === 'officer';
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<SystemCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [showOnlyWithBases, setShowOnlyWithBases] = useState(false);
  const [showOnlyWithRifts, setShowOnlyWithRifts] = useState(false);
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [selectedSystem, setSelectedSystem] = useState<number | null>(null);
  const [showClaim, setShowClaim] = useState(false);
  const [claimMode, setClaimMode] = useState<'single' | 'network'>('single');
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkResult, setNetworkResult] = useState<{ added: number; total: number } | null>(null);
  const [detailSystemId, setDetailSystemId] = useState<number | null>(null);

  const claimedIds = useMemo(() => new Set(systems.map((s) => s.id)), [systems]);

  const detailSystem = detailSystemId != null ? systems.find(s => s.id === detailSystemId) : null;

  // Read URL params on mount (e.g. /intel?resource=Comet)
  useEffect(() => {
    const r = searchParams.get('resource');
    if (r) { setResourceFilter(r); setSearchParams({}, { replace: true }); }
    const rifts = searchParams.get('rifts');
    if (rifts === '1') { setShowOnlyWithRifts(true); setSearchParams({}, { replace: true }); }
  }, []);

  // Collect all unique resources across systems
  const allResources = useMemo(() => {
    const set = new Set<string>();
    systems.forEach(s => s.resources?.forEach(r => set.add(r)));
    return [...set].sort();
  }, [systems]);

  const filtered = useMemo(() => {
    let result = selectedSystem
      ? systems.filter((s) => s.id === selectedSystem)
      : filter === 'all'
        ? systems
        : systems.filter((s) => s.category === filter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.notes?.toLowerCase().includes(q) ||
        s.controlledBy?.toLowerCase().includes(q)
      );
    }

    if (threatFilter !== 'all') {
      result = result.filter((s) => {
        const t = s.threatLevel ?? 0;
        if (threatFilter === 'low') return t <= 3;
        if (threatFilter === 'medium') return t > 3 && t <= 6;
        return t > 6;
      });
    }

    if (showOnlyWithBases) {
      result = result.filter((s) => (s.bases?.length ?? 0) > 0);
    }

    if (showOnlyWithRifts) {
      result = result.filter((s) => (s.riftSightings?.length ?? 0) > 0);
    }

    if (resourceFilter !== 'all') {
      result = result.filter((s) => s.resources?.includes(resourceFilter));
    }

    return result;
  }, [systems, selectedSystem, filter, searchQuery, threatFilter, showOnlyWithBases, showOnlyWithRifts, resourceFilter]);

  // Summary stats
  const totalRifts = systems.reduce((acc, s) => acc + (s.riftSightings?.length ?? 0), 0);
  const highThreat = systems.filter((s) => (s.threatLevel ?? 0) >= 7).length;
  const totalBases = systems.reduce((acc, s) => acc + (s.bases?.length ?? 0), 0);
  const hqSystem = systems.find((s) => s.isHQ);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
          Intel & Territory
        </h1>
        {isLeaderOrOfficer && (
        <button
          onClick={() => setShowClaim(!showClaim)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid rgba(99,102,241,0.3)',
            background: showClaim ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
            color: '#818cf8',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Plus size={14} /> Claim System
        </button>
        )}
      </div>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-secondary)' }}>
        Strategic overview of known systems, threats, and rift activity.
        {hqSystem && (
          <span style={{ color: '#fbbf24', marginLeft: 8 }}>
            {'\u2605'} HQ: {hqSystem.name}
          </span>
        )}
      </p>

      {/* Claim System Panel */}
      {showClaim && (
        <GlassCard style={{ padding: '16px 20px', marginBottom: 16, background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.2)' }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: 'var(--bg-surface)', borderRadius: 6, padding: 3 }}>
            {([['single', 'Single System'], ['network', 'Gated Network']] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => { setClaimMode(mode); setNetworkResult(null); }}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  background: claimMode === mode ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: claimMode === mode ? '#818cf8' : 'var(--text-muted)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {claimMode === 'single' ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                Claim a System
              </div>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                Search for a system from the world atlas to add to your territory.
              </p>
              <SystemPicker
                systems={worldSystems}
                claimedIds={claimedIds}
                onSelect={(ws) => {
                  claimSystem(ws);
                  setShowClaim(false);
                  setSelectedSystem(ws.id);
                }}
                placeholder="Search world systems by name..."
              />
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                Claim Entire Gated Network
              </div>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                Pick any system inside the network. All systems connected via NPC gates will be discovered and claimed automatically.
              </p>
              <SystemPicker
                systems={worldSystems}
                claimedIds={claimedIds}
                onSelect={async (ws) => {
                  setNetworkLoading(true);
                  setNetworkResult(null);
                  try {
                    const result = await claimGatedNetwork(ws.id);
                    setNetworkResult(result);
                    if (result.added > 0) setSelectedSystem(ws.id);
                  } finally {
                    setNetworkLoading(false);
                  }
                }}
                placeholder="Search for a system in the gated network..."
              />
              {networkLoading && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 6, background: 'rgba(99,102,241,0.08)', fontSize: 12, color: '#818cf8' }}>
                  Traversing gate connections… fetching connected systems from world API…
                </div>
              )}
              {networkResult && !networkLoading && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 6, fontSize: 12,
                  background: networkResult.added > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(250,204,21,0.08)',
                  color: networkResult.added > 0 ? '#22c55e' : '#fbbf24',
                }}>
                  {networkResult.added > 0
                    ? `Added ${networkResult.added} new system${networkResult.added > 1 ? 's' : ''} (${networkResult.total} total in gated network)`
                    : `All ${networkResult.total} systems in this network are already claimed`}
                </div>
              )}
            </>
          )}
        </GlassCard>
      )}

      {/* Star Map */}
      <div style={{ marginBottom: 24 }}>
        <StarMap
          systems={systems}
          goals={goals}
          highlightSystemIds={selectedSystem ? [selectedSystem] : undefined}
          onSystemClick={(sys) => {
            setSelectedSystem(sys.id === selectedSystem ? null : sys.id);
            setDetailSystemId(sys.id);
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
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <FilterBtn label="All" active={filter === 'all'} color="#6366f1" onClick={() => setFilter('all')} />
        {(Object.entries(CATEGORY_CONFIG) as [SystemCategory, typeof CATEGORY_CONFIG[SystemCategory]][]).map(([key, cfg]) => (
          <FilterBtn key={key} label={cfg.label} active={filter === key} color={cfg.color} onClick={() => setFilter(key)} />
        ))}
      </div>

      {/* Search & extra filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search systems by name, notes..."
            style={{
              width: '100%', padding: '8px 10px 8px 30px', borderRadius: 6, fontSize: 12,
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)', outline: 'none',
            }}
          />
        </div>
        <select
          value={threatFilter}
          onChange={e => setThreatFilter(e.target.value as typeof threatFilter)}
          style={{
            padding: '8px 10px', borderRadius: 6, fontSize: 12,
            background: '#1a1e2e', border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)', outline: 'none',
          }}
        >
          <option value="all">All Threats</option>
          <option value="low">Low (0-3)</option>
          <option value="medium">Medium (4-6)</option>
          <option value="high">High (7-10)</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showOnlyWithBases} onChange={e => setShowOnlyWithBases(e.target.checked)} style={{ accentColor: '#22d3ee' }} />
          Has bases
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showOnlyWithRifts} onChange={e => setShowOnlyWithRifts(e.target.checked)} style={{ accentColor: '#a855f7' }} />
          Has rifts
        </label>
        <select
          value={resourceFilter}
          onChange={e => setResourceFilter(e.target.value)}
          style={{
            padding: '8px 10px', borderRadius: 6, fontSize: 12,
            background: '#1a1e2e', border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)', outline: 'none',
          }}
        >
          <option value="all">All Resources</option>
          {allResources.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* System cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((s) => (
          <div key={s.id} onClick={() => setDetailSystemId(s.id)} style={{ cursor: 'pointer' }}>
            <SystemCard system={s} onSetHQ={isLeaderOrOfficer ? setHQ : undefined} onUnclaim={isLeaderOrOfficer ? unclaimSystem : undefined} />
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No systems in this category.</p>
        )}
      </div>

      {/* System Detail Panel */}
      {detailSystem && (
        <SystemDetailPanel
          system={detailSystem}
          onClose={() => setDetailSystemId(null)}
        />
      )}
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
