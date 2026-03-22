import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Plus, Users, Trophy, Globe } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

export function Navbar() {
  const location = useLocation();
  const { isConnected, walletAddress, tribe } = useAppStore();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/intel', label: 'Intel', icon: Globe },
    { path: '/create', label: 'New Goal', icon: Plus },
    { path: '/members', label: 'Members', icon: Users },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  const abbreviated = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'var(--bg-overlay)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo / brand */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <Shield size={22} color="var(--accent-indigo)" />
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {tribe?.name ?? 'Tribe Command Center'}
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4 }}>
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
                color: active ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                background: active ? 'rgba(99,102,241,0.08)' : 'transparent',
                transition: 'color 0.15s, background 0.15s',
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Wallet */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isConnected ? (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-xl)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--accent-emerald)',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            {abbreviated}
          </span>
        ) : (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-xl)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            Not connected
          </span>
        )}
      </div>
    </nav>
  );
}
