import { GlassCard } from '../components/ui';
import { Shield, Clock, XCircle } from 'lucide-react';

interface LoginPageProps {
  onConnect: () => void;
  /** Whether the EVE Vault browser extension is detected */
  hasEveVault?: boolean;
  /** If set, the user connected but their membership is pending/rejected */
  memberStatus?: 'pending' | 'rejected' | null;
}

export function LoginPage({ onConnect, hasEveVault, memberStatus }: LoginPageProps) {
  if (memberStatus === 'pending') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <GlassCard style={{ width: 400, maxWidth: '90vw', textAlign: 'center', padding: '48px 36px', backdropFilter: 'blur(16px)', background: 'var(--bg-glass)', border: '1px solid var(--border-accent)', boxShadow: 'var(--shadow-glow)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: 'rgba(234,179,8,0.1)', border: '2px solid #eab308' }}>
            <Clock size={30} color="#eab308" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Awaiting Approval</h1>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Your membership request has been submitted. A tribe leader or officer will review it shortly.
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
            Contact your tribe leadership on Discord if this takes too long.
          </p>
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
      </GlassCard>
    </div>
  );
}
