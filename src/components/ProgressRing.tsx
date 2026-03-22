import type { ReactNode, CSSProperties } from 'react';

interface ProgressRingProps {
  /** 0-100 */
  percent: number;
  /** ring diameter in px */
  size?: number;
  /** stroke width in px */
  stroke?: number;
  /** ring colour */
  color?: string;
  children?: ReactNode;
}

export function ProgressRing({
  percent,
  size = 72,
  stroke = 5,
  color = 'var(--accent-indigo)',
  children,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const svgStyle: CSSProperties = {
    transform: 'rotate(-90deg)',
    display: 'block',
  };

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={svgStyle}>
        {/* bg track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={stroke}
        />
        {/* progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      {children && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
