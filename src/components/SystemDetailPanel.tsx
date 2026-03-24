import { useState, useMemo } from 'react';
import { GlassCard } from './ui';
import { useAppStore } from '../stores/appStore';
import type { TribeSystem, LPointId, LagrangePoint, SystemCategory, OrbitalZone, OrbitalZoneStatus } from '../types';
import { KNOWN_ORBITAL_ZONES, REGION_COLORS, parseOrbitalRegion } from '../data/orbital-zones';
import {
  X,
  MapPin,
  Shield,
  Swords,
  Crosshair,
  Compass,
  Gem,
  Skull,
  HelpCircle,
  Zap,
  Plus,
  Star,
  Trash2,
  Eye,
  AlertTriangle,
  Send,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

/** Generate L-point IDs based on planet count: P1-L1..L5, P2-L1..L5, etc. */
function generateLPoints(planetCount: number): LPointId[] {
  const points: LPointId[] = [];
  for (let p = 1; p <= planetCount; p++) {
    for (let l = 1; l <= 5; l++) {
      points.push(`P${p}-L${l}`);
    }
  }
  return points;
}

const ZONE_STATUS_CONFIG = {
  unknown: { label: 'Unknown', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  empty: { label: 'Empty', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  friendly: { label: 'Friendly', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  enemy: { label: 'Enemy', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  contested: { label: 'Contested', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  resource: { label: 'Resource', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
} as const;

const CATEGORY_CONFIG: Record<SystemCategory, { label: string; color: string; icon: typeof Shield }> = {
  core: { label: 'Core', color: '#22c55e', icon: Shield },
  frontline: { label: 'Frontline', color: '#eab308', icon: Swords },
  contested: { label: 'Contested', color: '#ef4444', icon: Crosshair },
  expansion: { label: 'Expansion', color: '#3b82f6', icon: Compass },
  resource: { label: 'Resource', color: '#a855f7', icon: Gem },
  hostile: { label: 'Hostile', color: '#dc2626', icon: Skull },
  unknown: { label: 'Unknown', color: '#6b7280', icon: HelpCircle },
};

const CATEGORY_OPTIONS: SystemCategory[] = ['core', 'frontline', 'contested', 'expansion', 'resource', 'hostile', 'unknown'];

interface SystemDetailPanelProps {
  system: TribeSystem;
  onClose: () => void;
}

export function SystemDetailPanel({ system, onClose }: SystemDetailPanelProps) {
  const {
    setHQ, unclaimSystem, removeBase, updateSystem,
  } = useAppStore();

  const [showAddBase, setShowAddBase] = useState(false);
  const [showScoutForm, setShowScoutForm] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('zones');
  const [editPlanetCount, setEditPlanetCount] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);

  const cat = CATEGORY_CONFIG[system.category];
  const CatIcon = cat.icon;

  // Generate dynamic L-points based on planet count
  const planetCount = system.planetCount ?? 1;
  const lPoints = useMemo(() => generateLPoints(planetCount), [planetCount]);

  // Get Lagrange point data
  const getLPoint = (lp: LPointId): LagrangePoint => {
    return system.lagrangePoints?.find(z => z.lPoint === lp) ?? { lPoint: lp, status: 'unknown' };
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
      background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-accent)',
      zIndex: 100, display: 'flex', flexDirection: 'column',
      boxShadow: '-4px 0 30px rgba(0,0,0,0.5)',
      animation: 'slideInRight 0.2s ease-out',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px', borderBottom: '1px solid var(--border-subtle)',
        background: `linear-gradient(135deg, ${cat.color}08, transparent)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <CatIcon size={20} color={cat.color} />
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
            {system.name}
            {system.isHQ && <span style={{ color: '#fbbf24', marginLeft: 6 }}>{'\u2605'}</span>}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', padding: 4,
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Category & Threat */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowEditCategory(!showEditCategory)}
            style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '3px 10px', borderRadius: 4, background: `${cat.color}18`, color: cat.color,
              border: `1px solid ${cat.color}30`, cursor: 'pointer',
            }}
          >
            {cat.label} ▾
          </button>

          {system.controlledBy && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Controlled by <strong style={{ color: 'var(--text-primary)' }}>{system.controlledBy}</strong>
            </span>
          )}

          {system.threatLevel != null && (
            <span style={{
              fontSize: 11, fontWeight: 600, marginLeft: 'auto',
              color: system.threatLevel <= 3 ? '#22c55e' : system.threatLevel <= 6 ? '#eab308' : '#ef4444',
            }}>
              Threat: {system.threatLevel}/10
            </span>
          )}

          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            ID: {system.id}
          </span>
        </div>

        {/* Category picker */}
        {showEditCategory && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
            {CATEGORY_OPTIONS.map(c => (
              <button key={c} onClick={() => {
                updateSystem(system.id, { category: c });
                setShowEditCategory(false);
              }} style={{
                padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                background: c === system.category ? `${CATEGORY_CONFIG[c].color}25` : 'rgba(255,255,255,0.04)',
                color: CATEGORY_CONFIG[c].color, border: `1px solid ${CATEGORY_CONFIG[c].color}30`,
                cursor: 'pointer',
              }}>
                {CATEGORY_CONFIG[c].label}
              </button>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {!system.isHQ && (
            <button onClick={() => setHQ(system.id)} style={actionBtnStyle('#fbbf24')}>
              <Star size={12} /> Set HQ
            </button>
          )}
          <button onClick={() => setShowAddBase(!showAddBase)} style={actionBtnStyle('#22d3ee')}>
            <Plus size={12} /> Add Base
          </button>
          <button onClick={() => setShowScoutForm(!showScoutForm)} style={actionBtnStyle('#6366f1')}>
            <Eye size={12} /> Scout Report
          </button>
          <button onClick={() => { unclaimSystem(system.id); onClose(); }} style={{
            ...actionBtnStyle('#ef4444'), marginLeft: 'auto',
          }}>
            <Trash2 size={12} /> Unclaim
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {/* Add Base Form */}
        {showAddBase && (
          <AddBaseForm
            systemId={system.id}
            existingBases={system.bases ?? []}
            lPoints={lPoints}
            onAdd={() => setShowAddBase(false)}
          />
        )}

        {/* Scout Report Form */}
        {showScoutForm && (
          <ScoutReportForm
            systemId={system.id}
            lPoints={lPoints}
            onSubmit={() => setShowScoutForm(false)}
          />
        )}

        {/* Lagrange Points */}
        <SectionToggle
          title={`Lagrange Points (${planetCount} planet${planetCount !== 1 ? 's' : ''})`}
          icon={<MapPin size={14} />}
          isOpen={activeSection === 'zones'}
          onToggle={() => setActiveSection(activeSection === 'zones' ? null : 'zones')}
        >
          {/* Planet count editor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Planets:</span>
            {editPlanetCount ? (
              <>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={planetCount}
                  onChange={e => {
                    const v = Math.max(1, Math.min(15, Number(e.target.value) || 1));
                    updateSystem(system.id, { planetCount: v });
                  }}
                  style={{ ...inputStyle, width: 50, padding: '3px 6px', textAlign: 'center' }}
                />
                <button onClick={() => setEditPlanetCount(false)} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: 11 }}>Done</button>
              </>
            ) : (
              <button onClick={() => setEditPlanetCount(true)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>
                {planetCount} ✏️
              </button>
            )}
          </div>

          {/* Group by planet */}
          {Array.from({ length: planetCount }, (_, pi) => {
            const pNum = pi + 1;
            const planetLPs = lPoints.filter(lp => lp.startsWith(`P${pNum}-`));
            return (
              <div key={pNum} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                  Planet {pNum}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {planetLPs.map(lp => (
                    <LPointCard
                      key={lp}
                      lPoint={lp}
                      lpData={getLPoint(lp)}
                      systemId={system.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </SectionToggle>

        {/* Bases */}
        <SectionToggle
          title={`Bases (${system.bases?.length ?? 0})`}
          icon={<Zap size={14} />}
          isOpen={activeSection === 'bases'}
          onToggle={() => setActiveSection(activeSection === 'bases' ? null : 'bases')}
        >
          {(!system.bases || system.bases.length === 0) ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0' }}>
              No bases registered. Click "Add Base" above.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {system.bases.map(b => (
                <div key={b.memberName} style={{
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
                  padding: '8px 10px', borderRadius: 6,
                  background: b.isEnemy ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${b.isEnemy ? 'rgba(239,68,68,0.2)' : 'var(--border-subtle)'}`,
                }}>
                  {b.isEnemy && <AlertTriangle size={12} color="#ef4444" />}
                  <span style={{
                    flex: 1, color: b.isEnemy ? '#fca5a5' : 'var(--text-primary)',
                    fontWeight: 500,
                  }}>
                    {b.memberName}
                    {b.isEnemy && <span style={{ color: '#ef4444', fontSize: 10, marginLeft: 6 }}>ENEMY</span>}
                  </span>
                  {b.lPoint && (
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                      {b.lPoint}
                    </span>
                  )}
                  {b.energy != null && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#22d3ee', fontSize: 11 }}>
                      <Zap size={11} /> {b.energy.toLocaleString()}
                    </span>
                  )}
                  <button onClick={() => removeBase(system.id, b.memberName)} style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', padding: 2,
                  }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionToggle>

        {/* Scouting Logs */}
        <SectionToggle
          title={`Scouting Log (${system.scoutingLogs?.length ?? 0})`}
          icon={<Eye size={14} />}
          isOpen={activeSection === 'logs'}
          onToggle={() => setActiveSection(activeSection === 'logs' ? null : 'logs')}
        >
          {(!system.scoutingLogs || system.scoutingLogs.length === 0) ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0' }}>
              No scouting reports yet. Click "Scout Report" to add one.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...system.scoutingLogs].reverse().map(log => (
                <div key={log.id} style={{
                  fontSize: 12, padding: '8px 10px', borderRadius: 6,
                  borderLeft: `3px solid ${log.foundEnemy ? '#ef4444' : '#22c55e'}`,
                  background: log.foundEnemy ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{log.reportedBy}</strong>
                    {log.lPoint && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                        {log.lPoint}
                      </span>
                    )}
                    {log.foundEnemy && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <AlertTriangle size={10} /> ENEMY
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {log.notes && <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{log.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </SectionToggle>

        {/* Orbital Zones */}
        <SectionToggle
          title={`Orbital Zones (${system.orbitalZones?.length ?? 0})`}
          icon={<Compass size={14} />}
          isOpen={activeSection === 'orbital'}
          onToggle={() => setActiveSection(activeSection === 'orbital' ? null : 'orbital')}
        >
          <button
            onClick={() => setShowAddZone(!showAddZone)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: 'rgba(34,211,238,0.1)', color: '#22d3ee',
              border: '1px solid rgba(34,211,238,0.25)', cursor: 'pointer', marginBottom: 10,
            }}
          >
            <Plus size={12} /> Add Zone
          </button>

          {showAddZone && (
            <AddOrbitalZoneForm
              systemId={system.id}
              existing={system.orbitalZones ?? []}
              onAdd={() => setShowAddZone(false)}
            />
          )}

          {(!system.orbitalZones || system.orbitalZones.length === 0) ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0' }}>
              No orbital zones tracked. Add zones you discover in-game.
            </p>
          ) : (
            (['Inner', 'Trojan', 'Outer', 'Fringe'] as const).map(region => {
              const zones = system.orbitalZones!.filter(z => z.region === region);
              if (zones.length === 0) return null;
              return (
                <div key={region} style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: REGION_COLORS[region], marginBottom: 6,
                  }}>
                    {region}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {zones.map(zone => (
                      <OrbitalZoneCard
                        key={zone.name}
                        zone={zone}
                        systemId={system.id}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </SectionToggle>

        {/* Resources & Dangers */}
        {(system.resources?.length || system.dangers?.length) && (
          <SectionToggle
            title="Resources & Dangers"
            icon={<Gem size={14} />}
            isOpen={activeSection === 'resources'}
            onToggle={() => setActiveSection(activeSection === 'resources' ? null : 'resources')}
          >
            {system.resources && system.resources.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>RESOURCES</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {system.resources.map(r => (
                    <span key={r} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>{r}</span>
                  ))}
                </div>
              </div>
            )}
            {system.dangers && system.dangers.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>DANGERS</div>
                {system.dangers.map((d, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
                    <AlertTriangle size={11} /> {d}
                  </div>
                ))}
              </div>
            )}
          </SectionToggle>
        )}

        {/* Notes */}
        <SectionToggle
          title="Notes"
          icon={<Send size={14} />}
          isOpen={activeSection === 'notes'}
          onToggle={() => setActiveSection(activeSection === 'notes' ? null : 'notes')}
        >
          <NotesEditor systemId={system.id} currentNotes={system.notes ?? ''} />
        </SectionToggle>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function SectionToggle({
  title, icon, isOpen, onToggle, children,
}: {
  title: string; icon: React.ReactNode; isOpen: boolean;
  onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '8px 0', background: 'none', border: 'none',
        color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {icon}
        <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isOpen && <div style={{ paddingTop: 10 }}>{children}</div>}
    </div>
  );
}

function LPointCard({ lPoint, lpData, systemId }: { lPoint: LPointId; lpData: LagrangePoint; systemId: number }) {
  const { updateLagrangePoint } = useAppStore();
  const [showPicker, setShowPicker] = useState(false);
  const [occupiedBy, setOccupiedBy] = useState(lpData.occupiedBy ?? '');
  const cfg = ZONE_STATUS_CONFIG[lpData.status];

  const handleStatusChange = (newStatus: LagrangePoint['status']) => {
    const updated: LagrangePoint = {
      ...lpData,
      status: newStatus,
      lastScouted: new Date().toISOString(),
      occupiedBy: newStatus === 'enemy' ? occupiedBy || undefined : lpData.occupiedBy,
    };
    updateLagrangePoint(systemId, updated);
    if (newStatus !== 'enemy') setShowPicker(false);
  };

  return (
    <GlassCard style={{
      padding: '10px 12px', background: cfg.bg, border: `1px solid ${cfg.color}30`,
      cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>{lPoint}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color, textTransform: 'uppercase' }}>{cfg.label}</span>
        <button onClick={() => setShowPicker(!showPicker)} style={{
          marginLeft: 'auto', background: 'none', border: 'none',
          color: 'var(--text-muted)', cursor: 'pointer', fontSize: 10,
        }}>
          ✏️
        </button>
      </div>

      {lpData.occupiedBy && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
          Base by: <strong>{lpData.occupiedBy}</strong>
        </div>
      )}
      {lpData.resources && lpData.resources.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {lpData.resources.map(r => (
            <span key={r} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>{r}</span>
          ))}
        </div>
      )}
      {lpData.lastScouted && (
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
          Scouted: {new Date(lpData.lastScouted).toLocaleDateString()}
        </div>
      )}

      {/* Status picker */}
      {showPicker && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {Object.entries(ZONE_STATUS_CONFIG).map(([status, scfg]) => (
              <button key={status} onClick={() => handleStatusChange(status as LagrangePoint['status'])} style={{
                padding: '2px 8px', borderRadius: 3, fontSize: 9, fontWeight: 600,
                background: status === lpData.status ? `${scfg.color}30` : 'rgba(255,255,255,0.04)',
                color: scfg.color, border: `1px solid ${scfg.color}40`, cursor: 'pointer',
              }}>
                {scfg.label}
              </button>
            ))}
          </div>
          {/* Enemy occupier input */}
          {lpData.status === 'enemy' && (
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <input
                type="text"
                value={occupiedBy}
                onChange={e => setOccupiedBy(e.target.value)}
                placeholder="Enemy name..."
                style={inputStyle}
              />
              <button onClick={() => {
                updateLagrangePoint(systemId, { ...lpData, occupiedBy: occupiedBy || undefined });
                setShowPicker(false);
              }} style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
              }}>
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

function AddBaseForm({ systemId, existingBases, lPoints, onAdd }: {
  systemId: number; existingBases: { memberName: string }[]; lPoints: LPointId[]; onAdd: () => void;
}) {
  const { addBase } = useAppStore();
  const [name, setName] = useState('');
  const [lPoint, setLPoint] = useState<LPointId | ''>('');
  const [energy, setEnergy] = useState('');
  const [isEnemy, setIsEnemy] = useState(false);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (existingBases.some(b => b.memberName === trimmed)) return;
    addBase(systemId, {
      memberName: trimmed,
      lPoint: lPoint || undefined,
      energy: energy ? Number(energy) : undefined,
      isEnemy,
    });
    setName('');
    setLPoint('');
    setEnergy('');
    setIsEnemy(false);
    onAdd();
  };

  return (
    <GlassCard style={{
      padding: '14px 16px', marginBottom: 12,
      background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.2)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#22d3ee', marginBottom: 10 }}>
        {isEnemy ? '⚠ Mark Enemy Base' : 'Add Base'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={isEnemy ? "Enemy name / tribe..." : "Your character name..."}
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={lPoint}
            onChange={e => setLPoint(e.target.value as LPointId | '')}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="">L-Point...</option>
            {lPoints.map(lp => <option key={lp} value={lp}>{lp}</option>)}
          </select>
          <input
            type="number"
            value={energy}
            onChange={e => setEnergy(e.target.value)}
            placeholder="Energy"
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: isEnemy ? '#ef4444' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={isEnemy}
              onChange={e => setIsEnemy(e.target.checked)}
              style={{ accentColor: '#ef4444' }}
            />
            Enemy base
          </label>
          <button onClick={handleSubmit} disabled={!name.trim()} style={{
            marginLeft: 'auto', padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            background: name.trim() ? (isEnemy ? 'rgba(239,68,68,0.2)' : 'rgba(34,211,238,0.15)') : 'rgba(255,255,255,0.04)',
            color: name.trim() ? (isEnemy ? '#ef4444' : '#22d3ee') : 'var(--text-muted)',
            border: `1px solid ${name.trim() ? (isEnemy ? 'rgba(239,68,68,0.3)' : 'rgba(34,211,238,0.3)') : 'var(--border-subtle)'}`,
            cursor: name.trim() ? 'pointer' : 'default',
          }}>
            <Plus size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {isEnemy ? 'Mark Enemy' : 'Add Base'}
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

function ScoutReportForm({ systemId, lPoints, onSubmit }: { systemId: number; lPoints: LPointId[]; onSubmit: () => void }) {
  const { addScoutingLog, updateLagrangePoint } = useAppStore();
  const [reporter, setReporter] = useState('');
  const [lPoint, setLPoint] = useState<LPointId | ''>('');
  const [notes, setNotes] = useState('');
  const [foundEnemy, setFoundEnemy] = useState(false);

  const handleSubmit = () => {
    const trimmedReporter = reporter.trim();
    if (!trimmedReporter) return;

    addScoutingLog(systemId, {
      id: `scout-${Date.now()}`,
      systemId,
      reportedBy: trimmedReporter,
      timestamp: new Date().toISOString(),
      lPoint: lPoint || undefined,
      notes: notes.trim() || undefined,
      foundEnemy,
    });

    // Also update Lagrange point status if specific L-point was scouted
    if (lPoint) {
      const newStatus = foundEnemy ? 'enemy' as const : 'empty' as const;
      updateLagrangePoint(systemId, {
        lPoint,
        status: newStatus,
        lastScouted: new Date().toISOString(),
      });
    }

    setReporter('');
    setLPoint('');
    setNotes('');
    setFoundEnemy(false);
    onSubmit();
  };

  return (
    <GlassCard style={{
      padding: '14px 16px', marginBottom: 12,
      background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.2)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#818cf8', marginBottom: 10 }}>
        <Eye size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        New Scouting Report
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="text"
          value={reporter}
          onChange={e => setReporter(e.target.value)}
          placeholder="Your name..."
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={lPoint}
            onChange={e => setLPoint(e.target.value as LPointId | '')}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="">L-Point (optional)...</option>
            {lPoints.map(lp => <option key={lp} value={lp}>{lp}</option>)}
          </select>
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="What did you find? Resources, enemies, structures..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: foundEnemy ? '#ef4444' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={foundEnemy}
              onChange={e => setFoundEnemy(e.target.checked)}
              style={{ accentColor: '#ef4444' }}
            />
            <AlertTriangle size={12} /> Enemy presence found
          </label>
          <button onClick={handleSubmit} disabled={!reporter.trim()} style={{
            marginLeft: 'auto', padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            background: reporter.trim() ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
            color: reporter.trim() ? '#818cf8' : 'var(--text-muted)',
            border: `1px solid ${reporter.trim() ? 'rgba(99,102,241,0.3)' : 'var(--border-subtle)'}`,
            cursor: reporter.trim() ? 'pointer' : 'default',
          }}>
            <Send size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Submit Report
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

function NotesEditor({ systemId, currentNotes }: { systemId: number; currentNotes: string }) {
  const { updateSystem } = useAppStore();
  const [notes, setNotes] = useState(currentNotes);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSystem(systemId, { notes: notes.trim() || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <textarea
        value={notes}
        onChange={e => { setNotes(e.target.value); setSaved(false); }}
        placeholder="Add notes about this system..."
        rows={4}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} style={{
          padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
          background: saved ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.12)',
          color: saved ? '#22c55e' : '#818cf8',
          border: `1px solid ${saved ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)'}`,
          cursor: 'pointer',
        }}>
          {saved ? '✓ Saved' : 'Save Notes'}
        </button>
      </div>
    </div>
  );
}

const OZ_STATUS_CONFIG: Record<OrbitalZoneStatus, { label: string; color: string }> = {
  unknown: { label: 'Unknown', color: '#6b7280' },
  scouted: { label: 'Scouted', color: '#3b82f6' },
  active: { label: 'Active', color: '#22c55e' },
  depleted: { label: 'Depleted', color: '#94a3b8' },
  hostile: { label: 'Hostile', color: '#ef4444' },
};

function OrbitalZoneCard({ zone, systemId }: { zone: OrbitalZone; systemId: number }) {
  const { updateOrbitalZone, removeOrbitalZone } = useAppStore();
  const [showEdit, setShowEdit] = useState(false);
  const regionColor = REGION_COLORS[zone.region];
  const statusCfg = OZ_STATUS_CONFIG[zone.status];

  return (
    <GlassCard style={{
      padding: '10px 12px',
      background: `${regionColor}08`,
      border: `1px solid ${regionColor}25`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
          {zone.name}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3,
          background: `${statusCfg.color}18`, color: statusCfg.color,
          textTransform: 'uppercase',
        }}>
          {statusCfg.label}
        </span>
        <button onClick={() => setShowEdit(!showEdit)} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 10,
        }}>✏️</button>
        <button onClick={() => removeOrbitalZone(systemId, zone.name)} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2,
        }}><X size={12} /></button>
      </div>

      {zone.zoneType && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{zone.zoneType}</div>
      )}
      {zone.resources && zone.resources.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
          {zone.resources.map(r => (
            <span key={r} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>{r}</span>
          ))}
        </div>
      )}
      {zone.notes && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>{zone.notes}</div>
      )}
      {zone.lastScouted && (
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
          Scouted: {new Date(zone.lastScouted).toLocaleDateString()}
        </div>
      )}

      {showEdit && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {(Object.keys(OZ_STATUS_CONFIG) as OrbitalZoneStatus[]).map(s => (
              <button key={s} onClick={() => {
                updateOrbitalZone(systemId, zone.name, { status: s, lastScouted: new Date().toISOString() });
              }} style={{
                padding: '2px 8px', borderRadius: 3, fontSize: 9, fontWeight: 600,
                background: s === zone.status ? `${OZ_STATUS_CONFIG[s].color}30` : 'rgba(255,255,255,0.04)',
                color: OZ_STATUS_CONFIG[s].color, border: `1px solid ${OZ_STATUS_CONFIG[s].color}40`,
                cursor: 'pointer',
              }}>
                {OZ_STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
          <input
            type="text"
            defaultValue={zone.notes ?? ''}
            placeholder="Notes..."
            onBlur={e => updateOrbitalZone(systemId, zone.name, { notes: e.target.value.trim() || undefined })}
            style={inputStyle}
          />
        </div>
      )}
    </GlassCard>
  );
}

function AddOrbitalZoneForm({ systemId, existing, onAdd }: {
  systemId: number; existing: OrbitalZone[]; onAdd: () => void;
}) {
  const { addOrbitalZone } = useAppStore();
  const [selectedName, setSelectedName] = useState('');
  const [customName, setCustomName] = useState('');

  const availableZones = KNOWN_ORBITAL_ZONES.filter(
    kz => !existing.some(ez => ez.name === kz.name),
  );

  const handleAdd = () => {
    const name = selectedName === '__custom__' ? customName.trim() : selectedName;
    if (!name) return;
    if (existing.some(ez => ez.name === name)) return;
    const region = parseOrbitalRegion(name);
    addOrbitalZone(systemId, { name, region, status: 'unknown' });
    setSelectedName('');
    setCustomName('');
    onAdd();
  };

  return (
    <GlassCard style={{
      padding: '12px 14px', marginBottom: 10,
      background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.2)',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#22d3ee', marginBottom: 8 }}>
        Add Orbital Zone
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <select
          value={selectedName}
          onChange={e => setSelectedName(e.target.value)}
          style={{ ...inputStyle }}
        >
          <option value="">Select zone...</option>
          {availableZones.map(z => (
            <option key={z.name} value={z.name}>{z.name}</option>
          ))}
          <option value="__custom__">Custom zone name...</option>
        </select>
        {selectedName === '__custom__' && (
          <input
            type="text"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            placeholder="Zone name (e.g. Inner Mining Depot)"
            style={inputStyle}
          />
        )}
        <button
          onClick={handleAdd}
          disabled={!selectedName || (selectedName === '__custom__' && !customName.trim())}
          style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: selectedName ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.04)',
            color: selectedName ? '#22d3ee' : 'var(--text-muted)',
            border: `1px solid ${selectedName ? 'rgba(34,211,238,0.3)' : 'var(--border-subtle)'}`,
            cursor: selectedName ? 'pointer' : 'default', alignSelf: 'flex-end',
          }}
        >
          <Plus size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Add Zone
        </button>
      </div>
    </GlassCard>
  );
}

/* ── Shared styles ── */

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', borderRadius: 6, fontSize: 12,
  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)', outline: 'none', width: '100%',
};

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '5px 10px', borderRadius: 6,
    border: `1px solid ${color}30`,
    background: `${color}10`,
    color, cursor: 'pointer', fontSize: 11, fontWeight: 600,
  };
}
