import { GlassCard } from '../components/ui';
import { Shield, Clock, XCircle, Users } from 'lucide-react';
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
  /** If set, the user connected but their membership is pending/rejected */
  memberStatus?: 'pending' | 'rejected' | null;
  /** Demo login bypass */
  onDemoLogin?: (role: string) => void;
  /** Disconnect / go back */
  onDisconnect?: () => void;
}

export function LoginPage({ onConnect, hasEveVault, memberStatus, onDemoLogin, onDisconnect }: LoginPageProps) {
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
