import { GlassCard } from '../components/ui';
import { Shield } from 'lucide-react';

interface LoginPageProps {
  onConnect: () => void;
}

export function LoginPage({ onConnect }: LoginPageProps) {
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
            background: 'linear-gradient(135deg, var(--accent-indigo), #4f46e5)',
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
          Connect EVE Vault
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
