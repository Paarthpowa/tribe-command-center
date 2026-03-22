import type { CSSProperties, ReactNode } from 'react';

interface StatusBadgeProps {
  label: string;
  color: string;
}

export function StatusBadge({ label, color }: StatusBadgeProps) {
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    borderRadius: 'var(--radius-xl)',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color,
    backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
    border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
  };

  return (
    <span style={style}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
      {label}
    </span>
  );
}

interface GlassCardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function GlassCard({ children, style, className, onClick, hoverable }: GlassCardProps) {
  const base: CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: 20,
    boxShadow: 'var(--shadow-card)',
    cursor: onClick ? 'pointer' : undefined,
    transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
    ...style,
  };

  return (
    <div
      className={className}
      style={base}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!hoverable) return;
        e.currentTarget.style.background = 'var(--bg-card-hover)';
        e.currentTarget.style.borderColor = 'var(--border-accent)';
        e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
      }}
      onMouseLeave={(e) => {
        if (!hoverable) return;
        e.currentTarget.style.background = 'var(--bg-card)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      {children}
    </div>
  );
}
