import { useState } from 'react';
import { GlassCard } from '../components/ui';
import { Shield, Clock, XCircle, Users, UserPlus, Plus } from 'lucide-react';
import { isContractDeployed } from '../lib/sui';

const DEMO_ROLES = [
  { key: 'leader', label: 'Commander Zara', desc: 'Leader — full access', color: '#fbbf24' },
  { key: 'officer', label: 'Navigator Rex', desc: 'Officer — manage ops', color: '#6366f1' },
  { key: 'member', label: 'Engineer Kael', desc: 'Member — standard', color: '#22c55e' },
  { key: 'scout', label: 'Scout Lyra', desc: 'Scout — frontline', color: '#22d3ee' },
];

interface LoginPageProps {
  onConnect: () => void;
  /** Whether the EVE Vault browser extension is detected */
  hasEveVault?: boolean;
  /** If set, the user connected but their membership is pending/rejected/new */
  memberStatus?: 'pending' | 'rejected' | 'new' | null;
  /** Demo login bypass */
  onDemoLogin?: (role: string) => void;
  /** Disconnect / go back */
  onDisconnect?: () => void;
  /** Join tribe with a display name */
  onJoinTribe?: (name: string) => void;
  /** Create a new tribe */
  onCreateTribe?: (tribeName: string, description: string, pilotName: string) => void;
}

export function LoginPage({ onConnect, hasEveVault, memberStatus, onDemoLogin, onDisconnect, onJoinTribe, onCreateTribe }: LoginPageProps) {
  const [pilotName, setPilotName] = useState('');
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [tribeName, setTribeName] = useState('');
  const [tribeDesc, setTribeDesc] = useState('');

  if (memberStatus === 'new') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <GlassCard style={{ width: 480, maxWidth: '90vw', textAlign: 'center', padding: '48px 36px', backdropFilter: 'blur(16px)', background: 'var(--bg-glass)', border: '1px solid var(--border-accent)', boxShadow: 'var(--shadow-glow)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: 'rgba(99,102,241,0.1)', border: '2px solid var(--accent-indigo)' }}>
            {mode === 'join' ? <UserPlus size={30} color="var(--accent-indigo)" /> : <Plus size={30} color="#22c55e" />}
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
            {mode === 'join' ? 'Welcome, Pilot' : 'Found Your Tribe'}
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {mode === 'join'
              ? 'Join an existing tribe and start coordinating with your crew.'
              : 'Create a new tribe and become its leader. Recruit members to grow.'}
          </p>

          {/* Toggle tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setMode('join')}
              style={{
                flex: 1, padding: '10px 0', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: mode === 'join' ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: mode === 'join' ? 'var(--accent-indigo)' : 'var(--text-muted)',
                borderBottom: mode === 'join' ? '2px solid var(--accent-indigo)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              Join Tribe
            </button>
            <button
              onClick={() => setMode('create')}
              style={{
                flex: 1, padding: '10px 0', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: mode === 'create' ? 'rgba(34,197,94,0.1)' : 'transparent',
                color: mode === 'create' ? '#22c55e' : 'var(--text-muted)',
                borderBottom: mode === 'create' ? '2px solid #22c55e' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              Create Tribe
            </button>
          </div>

          {mode === 'join' ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Enter pilot name..."
                  value={pilotName}
                  onChange={e => setPilotName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && pilotName.trim() && onJoinTribe) onJoinTribe(pilotName.trim()); }}
                  style={{
                    flex: 1, padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)',
                    background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                  }}
                />
                <button
                  onClick={() => { if (pilotName.trim() && onJoinTribe) onJoinTribe(pilotName.trim()); }}
                  disabled={!pilotName.trim()}
                  style={{
                    padding: '12px 20px', borderRadius: 8, border: 'none',
                    background: pilotName.trim() ? 'linear-gradient(135deg, var(--accent-indigo), #4f46e5)' : 'rgba(99,102,241,0.2)',
                    color: '#fff', fontSize: 14, fontWeight: 600, cursor: pilotName.trim() ? 'pointer' : 'not-allowed',
                    transition: 'opacity 0.15s',
                  }}
                >
                  Join Tribe
                </button>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: 11, color: 'var(--text-muted)' }}>
                You'll join Tribe Alpha as a member with standard access.
              </p>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Your pilot name..."
                  value={pilotName}
                  onChange={e => setPilotName(e.target.value)}
                  style={{
                    padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)',
                    background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="Tribe name..."
                  value={tribeName}
                  onChange={e => setTribeName(e.target.value)}
                  style={{
                    padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)',
                    background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                  }}
                />
                <textarea
                  placeholder="Tribe description (optional)..."
                  value={tribeDesc}
                  onChange={e => setTribeDesc(e.target.value)}
                  rows={2}
                  style={{
                    padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)',
                    background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={() => { if (pilotName.trim() && tribeName.trim() && onCreateTribe) onCreateTribe(tribeName.trim(), tribeDesc.trim(), pilotName.trim()); }}
                  disabled={!pilotName.trim() || !tribeName.trim()}
                  style={{
                    padding: '12px 20px', borderRadius: 8, border: 'none',
                    background: pilotName.trim() && tribeName.trim() ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(34,197,94,0.2)',
                    color: '#fff', fontSize: 14, fontWeight: 600, cursor: pilotName.trim() && tribeName.trim() ? 'pointer' : 'not-allowed',
                    transition: 'opacity 0.15s',
                  }}
                >
                  Create & Lead Tribe
                </button>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: 11, color: 'var(--text-muted)' }}>
                You'll become the tribe leader with full access. Invite members later.
              </p>
            </>
          )}

          {onDisconnect && (
            <button
              onClick={onDisconnect}
              style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ← Disconnect & Go Back
            </button>
          )}
          {onDemoLogin && (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                <Users size={14} color="var(--text-muted)" />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Or use Demo Access
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {DEMO_ROLES.map(r => (
                  <button
                    key={r.key}
                    onClick={() => onDemoLogin(r.key)}
                    style={{
                      padding: '10px 8px', borderRadius: 8, border: `1px solid ${r.color}30`,
                      background: `${r.color}08`, cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${r.color}18`; e.currentTarget.style.borderColor = `${r.color}50`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${r.color}08`; e.currentTarget.style.borderColor = `${r.color}30`; }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: r.color, marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  if (memberStatus === 'pending') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <GlassCard style={{ width: 440, maxWidth: '90vw', textAlign: 'center', padding: '48px 36px', backdropFilter: 'blur(16px)', background: 'var(--bg-glass)', border: '1px solid var(--border-accent)', boxShadow: 'var(--shadow-glow)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: 'rgba(234,179,8,0.1)', border: '2px solid #eab308' }}>
            <Clock size={30} color="#eab308" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Awaiting Approval</h1>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Your membership request has been submitted. A tribe leader or officer will review it shortly.
          </p>
          <p style={{ margin: '0 0 20px', fontSize: 11, color: 'var(--text-muted)' }}>
            Contact your tribe leadership on Discord if this takes too long.
          </p>
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ← Disconnect & Go Back
            </button>
          )}
          {onDemoLogin && (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                <Users size={14} color="var(--text-muted)" />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Or use Demo Access
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {DEMO_ROLES.map(r => (
                  <button
                    key={r.key}
                    onClick={() => onDemoLogin(r.key)}
                    style={{
                      padding: '10px 8px', borderRadius: 8, border: `1px solid ${r.color}30`,
                      background: `${r.color}08`, cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${r.color}18`; e.currentTarget.style.borderColor = `${r.color}50`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${r.color}08`; e.currentTarget.style.borderColor = `${r.color}30`; }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: r.color, marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  if (memberStatus === 'rejected') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <GlassCard style={{ width: 400, maxWidth: '90vw', textAlign: 'center', padding: '48px 36px', backdropFilter: 'blur(16px)', background: 'var(--bg-glass)', border: '1px solid var(--border-accent)', boxShadow: 'var(--shadow-glow)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: 'rgba(239,68,68,0.1)', border: '2px solid #ef4444' }}>
            <XCircle size={30} color="#ef4444" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Access Denied</h1>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Your membership request was not approved. Reach out to tribe leadership for details.
          </p>
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ← Disconnect & Go Back
            </button>
          )}
        </GlassCard>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}
    >
      <GlassCard
        style={{
          width: 400,
          maxWidth: '90vw',
          textAlign: 'center',
          padding: '48px 36px',
          backdropFilter: 'blur(16px)',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-accent)',
          boxShadow: 'var(--shadow-glow)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            background: 'rgba(99,102,241,0.1)',
            border: '2px solid var(--accent-indigo)',
          }}
        >
          <Shield size={30} color="var(--accent-indigo)" />
        </div>

        <h1
          style={{
            margin: '0 0 6px',
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Tribe Command Center
        </h1>
        <p
          style={{
            margin: '0 0 32px',
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          Coordinate your tribe. Define goals, assign tasks, track contributions.
        </p>

        <button
          onClick={onConnect}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: hasEveVault === false
              ? 'linear-gradient(135deg, #6b7280, #4b5563)'
              : 'linear-gradient(135deg, var(--accent-indigo), #4f46e5)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {hasEveVault === false ? 'Install EVE Vault to Connect' : 'Connect EVE Vault'}
        </button>

        <p
          style={{
            margin: '16px 0 0',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          Connect your wallet to access your tribe dashboard.
        </p>

        {/* Demo Login Section */}
        {onDemoLogin && (
          <div style={{ marginTop: 28, borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
              <Users size={14} color="var(--text-muted)" />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Demo Access
              </span>
              <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 999, background: isContractDeployed() ? 'rgba(16,185,129,0.15)' : 'rgba(34,211,238,0.12)', color: isContractDeployed() ? 'var(--accent-emerald)' : 'var(--accent-cyan)', border: `1px solid ${isContractDeployed() ? 'var(--accent-emerald)' : 'var(--accent-cyan)'}30`, fontWeight: 600 }}>
                {isContractDeployed() ? 'On-Chain' : 'Demo Mode — Sui Move ready'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {DEMO_ROLES.map(r => (
                <button
                  key={r.key}
                  onClick={() => onDemoLogin(r.key)}
                  style={{
                    padding: '10px 8px', borderRadius: 8, border: `1px solid ${r.color}30`,
                    background: `${r.color}08`, cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${r.color}18`; e.currentTarget.style.borderColor = `${r.color}50`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${r.color}08`; e.currentTarget.style.borderColor = `${r.color}30`; }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: r.color, marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
