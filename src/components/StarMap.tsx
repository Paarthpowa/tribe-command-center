import { useRef, useEffect, useState, useCallback } from 'react';
import type { TribeSystem, SystemCategory, Goal } from '../types';

/* ── Category visuals ── */
const CATEGORY_COLORS: Record<SystemCategory, string> = {
  core: '#22c55e',
  frontline: '#eab308',
  contested: '#ef4444',
  expansion: '#3b82f6',
  resource: '#a855f7',
  hostile: '#dc2626',
  unknown: '#6b7280',
};

/* ── Helpers ── */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ── Seeded random for deterministic stars ── */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

interface StarMapProps {
  systems: TribeSystem[];
  /** Goals to show as markers on relevant systems */
  goals?: Goal[];
  /** System IDs to highlight (e.g. for a specific goal) */
  highlightSystemIds?: string[];
  /** Called when a system node is clicked */
  onSystemClick?: (system: TribeSystem) => void;
  /** Height of the canvas */
  height?: number;
}

export function StarMap({
  systems,
  goals = [],
  highlightSystemIds,
  onSystemClick,
  height = 500,
}: StarMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Camera state
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<TribeSystem | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [, setTick] = useState(0);

  // World-to-screen coordinate transform
  const toScreen = useCallback(
    (wx: number, wy: number, w: number) => {
      const cx = w / 2;
      const cy = height / 2;
      return {
        sx: (wx + camera.x) * camera.zoom + cx,
        sy: (wy + camera.y) * camera.zoom + cy,
      };
    },
    [camera, height],
  );

  // Background stars (generated once)
  const bgStars = useRef<{ x: number; y: number; r: number; b: number }[]>([]);
  if (bgStars.current.length === 0) {
    const rng = seededRandom(42);
    for (let i = 0; i < 300; i++) {
      bgStars.current.push({
        x: rng() * 1600 - 400,
        y: rng() * 1200 - 300,
        r: rng() * 1.2 + 0.3,
        b: rng() * 0.5 + 0.15,
      });
    }
  }

  // Build a map of systemId -> goals
  const systemGoals = new Map<string, Goal[]>();
  goals.forEach((g) => {
    g.systemIds?.forEach((sid) => {
      const list = systemGoals.get(sid) ?? [];
      list.push(g);
      systemGoals.set(sid, list);
    });
  });

  // Systems lookup
  const systemMap = new Map(systems.map((s) => [s.id, s]));

  /* ── Drawing ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Background
    const bgGrad = ctx.createRadialGradient(w / (2 * dpr), h / (2 * dpr), 0, w / (2 * dpr), h / (2 * dpr), Math.max(w, h) / (1.5 * dpr));
    bgGrad.addColorStop(0, '#0c0e1a');
    bgGrad.addColorStop(1, '#060810');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w / dpr, h / dpr);

    const realW = w / dpr;

    // Background stars
    bgStars.current.forEach((star) => {
      const { sx, sy } = toScreen(star.x, star.y, realW);
      if (sx < -10 || sx > realW + 10 || sy < -10 || sy > h / dpr + 10) return;
      ctx.beginPath();
      ctx.arc(sx, sy, star.r * camera.zoom * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,190,220,${star.b})`;
      ctx.fill();
    });

    // Grid dots (subtle)
    ctx.fillStyle = 'rgba(100,120,160,0.06)';
    const gridStep = 50;
    for (let gx = -400; gx < 1200; gx += gridStep) {
      for (let gy = -200; gy < 800; gy += gridStep) {
        const { sx, sy } = toScreen(gx, gy, realW);
        if (sx < 0 || sx > realW || sy < 0 || sy > h / dpr) continue;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Connection lines
    const drawnLinks = new Set<string>();
    systems.forEach((sys) => {
      sys.connections?.forEach((targetId) => {
        const linkKey = [sys.id, targetId].sort().join('-');
        if (drawnLinks.has(linkKey)) return;
        drawnLinks.add(linkKey);

        const target = systemMap.get(targetId);
        if (!target) return;

        const from = toScreen(sys.coordinates.x, sys.coordinates.y, realW);
        const to = toScreen(target.coordinates.x, target.coordinates.y, realW);

        const isHighlighted =
          highlightSystemIds &&
          highlightSystemIds.includes(sys.id) &&
          highlightSystemIds.includes(targetId);

        ctx.beginPath();
        ctx.moveTo(from.sx, from.sy);
        ctx.lineTo(to.sx, to.sy);
        ctx.strokeStyle = isHighlighted
          ? 'rgba(99,102,241,0.5)'
          : 'rgba(100,120,160,0.12)';
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.setLineDash(isHighlighted ? [] : [4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    });

    // Highlight territory fill (convex hull area for core systems)
    const coreSystems = systems.filter((s) => s.category === 'core');
    if (coreSystems.length >= 2) {
      ctx.beginPath();
      coreSystems.forEach((s, i) => {
        const { sx, sy } = toScreen(s.coordinates.x, s.coordinates.y, realW);
        const padding = 40 * camera.zoom;
        if (i === 0) ctx.moveTo(sx, sy - padding);
        else ctx.lineTo(sx, sy - padding);
      });
      // Extend territory bubble
      const last = toScreen(coreSystems[coreSystems.length - 1].coordinates.x, coreSystems[coreSystems.length - 1].coordinates.y, realW);
      const first = toScreen(coreSystems[0].coordinates.x, coreSystems[0].coordinates.y, realW);
      ctx.lineTo(last.sx + 40 * camera.zoom, last.sy + 40 * camera.zoom);
      ctx.lineTo(first.sx - 40 * camera.zoom, first.sy + 40 * camera.zoom);
      ctx.closePath();
      ctx.fillStyle = 'rgba(34,197,94,0.03)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(34,197,94,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // System nodes
    systems.forEach((sys) => {
      const color = CATEGORY_COLORS[sys.category];
      const { sx, sy } = toScreen(sys.coordinates.x, sys.coordinates.y, realW);
      const baseRadius = (sys.bases?.length ?? 0) > 0 ? 7 : 5;
      const r = baseRadius * camera.zoom;
      const isHovered = hovered?.id === sys.id;
      const isHighlightedSys = highlightSystemIds?.includes(sys.id);

      // Outer glow
      if (isHovered || isHighlightedSys) {
        const glowR = r * 4;
        const glow = ctx.createRadialGradient(sx, sy, r * 0.5, sx, sy, glowR);
        glow.addColorStop(0, hexToRgba(color, 0.25));
        glow.addColorStop(1, hexToRgba(color, 0));
        ctx.beginPath();
        ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Rift sighting pulse ring
      if (sys.riftSightings && sys.riftSightings.length > 0) {
        const pulsePhase = (Date.now() / 1500) % 1;
        const pulseR = r * (1.5 + pulsePhase * 2);
        ctx.beginPath();
        ctx.arc(sx, sy, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba('#a855f7', 0.3 * (1 - pulsePhase));
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Main dot
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      grad.addColorStop(0, hexToRgba(color, 1));
      grad.addColorStop(0.6, hexToRgba(color, 0.8));
      grad.addColorStop(1, hexToRgba(color, 0.2));
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Inner bright core
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();

      // Label
      ctx.font = `${isHovered ? 'bold ' : ''}${11 * Math.min(camera.zoom, 1.5)}px system-ui, sans-serif`;
      ctx.fillStyle = isHovered ? '#fff' : 'rgba(200,210,230,0.75)';
      ctx.textAlign = 'center';
      ctx.fillText(sys.name, sx, sy + r + 14 * camera.zoom);

      // Category tag (small)
      if (camera.zoom >= 0.7) {
        ctx.font = `${9 * Math.min(camera.zoom, 1.3)}px system-ui, sans-serif`;
        ctx.fillStyle = hexToRgba(color, 0.5);
        ctx.fillText(sys.category.toUpperCase(), sx, sy + r + 26 * camera.zoom);
      }

      // Base count badge
      if (sys.bases && sys.bases.length > 0 && camera.zoom >= 0.6) {
        const badgeX = sx + r + 4;
        const badgeY = sy - r - 2;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34,211,238,0.15)';
        ctx.fill();
        ctx.font = `bold ${8}px system-ui, sans-serif`;
        ctx.fillStyle = '#22d3ee';
        ctx.textAlign = 'center';
        ctx.fillText(`${sys.bases.length}`, badgeX, badgeY + 3);
      }

      // Goal markers
      const sysGoals = systemGoals.get(sys.id);
      if (sysGoals && sysGoals.length > 0 && camera.zoom >= 0.6) {
        const markerX = sx - r - 6;
        const markerY = sy - r - 2;
        ctx.beginPath();
        ctx.arc(markerX, markerY, 7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99,102,241,0.2)';
        ctx.fill();
        ctx.font = `bold ${8}px system-ui, sans-serif`;
        ctx.fillStyle = '#6366f1';
        ctx.textAlign = 'center';
        ctx.fillText(`${sysGoals.length}`, markerX, markerY + 3);
      }
    });

    // Slow tick for rift pulse animation (~15fps)
    const hasRifts = systems.some((s) => s.riftSightings && s.riftSightings.length > 0);
    if (hasRifts) {
      const tid = setTimeout(() => setTick((t) => t + 1), 66);
      return () => clearTimeout(tid);
    }
  });

  /* ── Canvas sizing ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [height]);

  /* ── Mouse handlers ── */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      setCamera((c) => ({
        ...c,
        zoom: Math.max(0.3, Math.min(4, c.zoom * factor)),
      }));
    },
    [],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setDragging(true);
      setDragStart({ x: e.clientX - camera.x * camera.zoom, y: e.clientY - camera.y * camera.zoom });
    },
    [camera],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setMousePos({ x: mx, y: my });

      if (dragging) {
        setCamera((c) => ({
          ...c,
          x: (e.clientX - dragStart.x) / c.zoom,
          y: (e.clientY - dragStart.y) / c.zoom,
        }));
        return;
      }

      // Hit test for hover
      const w = rect.width;
      let found: TribeSystem | null = null;
      for (const sys of systems) {
        const { sx, sy } = toScreen(sys.coordinates.x, sys.coordinates.y, w);
        const dist = Math.hypot(mx - sx, my - sy);
        if (dist < 20) {
          found = sys;
          break;
        }
      }
      setHovered(found);
      canvas.style.cursor = found ? 'pointer' : dragging ? 'grabbing' : 'grab';
    },
    [dragging, dragStart, systems, toScreen],
  );

  const handleMouseUp = useCallback(() => {
    if (dragging && hovered && onSystemClick) {
      // Only fire click if we didn't drag far
      onSystemClick(hovered);
    }
    setDragging(false);
  }, [dragging, hovered, onSystemClick]);

  const handleClick = useCallback(
    (_e: React.MouseEvent) => {
      if (!onSystemClick || !hovered) return;
      onSystemClick(hovered);
    },
    [onSystemClick, hovered],
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#080a14' }}>
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setDragging(false); setHovered(null); }}
        onClick={handleClick}
        style={{ display: 'block', cursor: 'grab' }}
      />

      {/* Hover tooltip */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(mousePos.x + 14, (containerRef.current?.offsetWidth ?? 400) - 220),
            top: Math.max(mousePos.y - 10, 4),
            pointerEvents: 'none',
            background: 'rgba(10,12,24,0.92)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${CATEGORY_COLORS[hovered.category]}40`,
            borderRadius: 8,
            padding: '10px 14px',
            minWidth: 180,
            maxWidth: 240,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[hovered.category] }} />
            <span style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{hovered.name}</span>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: CATEGORY_COLORS[hovered.category], marginLeft: 'auto' }}>
              {hovered.category}
            </span>
          </div>
          {hovered.controlledBy && (
            <div style={{ fontSize: 11, color: 'rgba(200,210,230,0.7)', marginBottom: 2 }}>
              Control: {hovered.controlledBy}
            </div>
          )}
          {hovered.threatLevel != null && (
            <div style={{ fontSize: 11, color: hovered.threatLevel >= 7 ? '#ef4444' : hovered.threatLevel >= 4 ? '#eab308' : '#22c55e' }}>
              Threat: {hovered.threatLevel}/10
            </div>
          )}
          {hovered.bases && hovered.bases.length > 0 && (
            <div style={{ fontSize: 11, color: '#22d3ee', marginTop: 2 }}>
              {hovered.bases.length} base{hovered.bases.length > 1 ? 's' : ''}
            </div>
          )}
          {hovered.riftSightings && hovered.riftSightings.length > 0 && (
            <div style={{ fontSize: 11, color: '#a855f7', marginTop: 2 }}>
              🌀 {hovered.riftSightings.length} rift sighting{hovered.riftSightings.length > 1 ? 's' : ''}
            </div>
          )}
          {hovered.resources && hovered.resources.length > 0 && (
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
              {hovered.resources.map((r) => (
                <span key={r} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>{r}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['core', 'frontline', 'contested', 'expansion', 'resource', 'unknown'] as SystemCategory[]).map((cat) => (
          <span key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'rgba(200,210,230,0.5)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: CATEGORY_COLORS[cat] }} />
            {cat}
          </span>
        ))}
      </div>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 4 }}>
        <button
          onClick={() => setCamera((c) => ({ ...c, zoom: Math.min(4, c.zoom * 1.3) }))}
          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(100,120,160,0.2)', background: 'rgba(10,12,24,0.7)', color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          +
        </button>
        <button
          onClick={() => setCamera((c) => ({ ...c, zoom: Math.max(0.3, c.zoom * 0.7) }))}
          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(100,120,160,0.2)', background: 'rgba(10,12,24,0.7)', color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          −
        </button>
        <button
          onClick={() => setCamera({ x: 0, y: 0, zoom: 1 })}
          style={{ height: 28, paddingInline: 8, borderRadius: 6, border: '1px solid rgba(100,120,160,0.2)', background: 'rgba(10,12,24,0.7)', color: 'rgba(200,210,230,0.6)', cursor: 'pointer', fontSize: 10 }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
