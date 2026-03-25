import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

interface StarMapProps {
  systems: TribeSystem[];
  goals?: Goal[];
  /** System IDs to highlight (numeric) */
  highlightSystemIds?: number[];
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

  /* Normalized display coordinates — raw coords span ~14 units but node radii
     are 13-18 → always overlap.  Normalize to ~400-unit spread, then apply
     force-directed repulsion so nearby nodes push apart. */
  const displaySystems = useMemo(() => {
    if (systems.length === 0) return systems;
    const xs = systems.map((s) => s.coordinates.x);
    const ys = systems.map((s) => s.coordinates.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const spread = Math.max(maxX - minX, maxY - minY, 1);
    const scale = 400 / spread;

    // Start with normalized positions
    const pos = systems.map((s) => ({
      x: (s.coordinates.x - cx) * scale,
      y: (s.coordinates.y - cy) * scale,
    }));

    // Force-directed repulsion: push overlapping nodes apart
    const minDist = 60; // minimum distance between any two system centres
    for (let iter = 0; iter < 50; iter++) {
      let moved = false;
      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const dx = pos[j].x - pos[i].x;
          const dy = pos[j].y - pos[i].y;
          const dist = Math.hypot(dx, dy);
          if (dist < minDist && dist > 0.01) {
            const push = (minDist - dist) / 2 + 1;
            const nx = dx / dist;
            const ny = dy / dist;
            pos[i].x -= nx * push;
            pos[i].y -= ny * push;
            pos[j].x += nx * push;
            pos[j].y += ny * push;
            moved = true;
          } else if (dist <= 0.01) {
            // Coincident — nudge apart
            pos[i].x -= 15;
            pos[j].x += 15;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }

    return systems.map((s, i) => ({
      ...s,
      coordinates: { x: pos[i].x, y: pos[i].y },
    }));
  }, [systems]);

  /* Camera: state drives rendering, ref provides fresh values in callbacks */
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  /* Drag state lives entirely in refs — eliminates stale-closure panning bugs */
  const dragRef = useRef<{
    mouseX: number;
    mouseY: number;
    camX: number;
    camY: number;
  } | null>(null);
  const dragDist = useRef(0);

  const [hovered, setHovered] = useState<TribeSystem | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [, setTick] = useState(0);

  /* World → screen coordinate transform */
  const toScreen = useCallback(
    (wx: number, wy: number, w: number) => ({
      sx: (wx + camera.x) * camera.zoom + w / 2,
      sy: (wy + camera.y) * camera.zoom + height / 2,
    }),
    [camera, height],
  );

  /* Background stars (deterministic, centered on normalized space) */
  const bgStars = useRef<{ x: number; y: number; r: number; b: number }[]>([]);
  if (bgStars.current.length === 0) {
    const rng = seededRandom(42);
    for (let i = 0; i < 400; i++) {
      bgStars.current.push({
        x: rng() * 800 - 400,
        y: rng() * 800 - 400,
        r: rng() * 1.2 + 0.3,
        b: rng() * 0.5 + 0.15,
      });
    }
  }

  /* System → goals lookup */
  const systemGoals = new Map<number, Goal[]>();
  goals.forEach((g) => {
    g.systemIds?.forEach((sid) => {
      const list = systemGoals.get(sid) ?? [];
      list.push(g);
      systemGoals.set(sid, list);
    });
  });

  const systemMap = new Map(displaySystems.map((s) => [s.id, s]));

  /* ── Animation tick (~15 fps, only when needed) ── */
  const hasAnimations = displaySystems.some(
    (s) => (s.riftSightings?.length ?? 0) > 0 || s.isHQ || (s.threatLevel ?? 0) >= 7,
  );
  useEffect(() => {
    if (!hasAnimations) return;
    const id = setInterval(() => setTick((t) => t + 1), 66);
    return () => clearInterval(id);
  }, [hasAnimations]);

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

    const realW = w / dpr;
    const realH = h / dpr;

    /* Background */
    const bgGrad = ctx.createRadialGradient(
      realW / 2, realH / 2, 0,
      realW / 2, realH / 2, Math.max(realW, realH) / 1.5,
    );
    bgGrad.addColorStop(0, '#0c0e1a');
    bgGrad.addColorStop(1, '#060810');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, realW, realH);

    /* Frustum culling bounds (world-space) with margin */
    const margin = 80 / camera.zoom;
    const vL = -camera.x - realW / (2 * camera.zoom) - margin;
    const vR = -camera.x + realW / (2 * camera.zoom) + margin;
    const vT = -camera.y - realH / (2 * camera.zoom) - margin;
    const vB = -camera.y + realH / (2 * camera.zoom) + margin;
    const vis = (wx: number, wy: number) =>
      wx >= vL && wx <= vR && wy >= vT && wy <= vB;

    /* Background stars */
    bgStars.current.forEach((star) => {
      if (!vis(star.x, star.y)) return;
      const { sx, sy } = toScreen(star.x, star.y, realW);
      ctx.beginPath();
      ctx.arc(sx, sy, star.r * camera.zoom * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,190,220,${star.b})`;
      ctx.fill();
    });

    /* Grid dots — skip at very low zoom */
    if (camera.zoom >= 0.5) {
      ctx.fillStyle = 'rgba(100,120,160,0.06)';
      const step = 50;
      const gx0 = Math.floor(vL / step) * step;
      const gy0 = Math.floor(vT / step) * step;
      for (let gx = gx0; gx <= vR; gx += step) {
        for (let gy = gy0; gy <= vB; gy += step) {
          const { sx, sy } = toScreen(gx, gy, realW);
          ctx.beginPath();
          ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    /* Connection lines */
    const drawn = new Set<string>();
    displaySystems.forEach((sys) => {
      sys.connections?.forEach((tid) => {
        const key = sys.id < tid ? `${sys.id}-${tid}` : `${tid}-${sys.id}`;
        if (drawn.has(key)) return;
        drawn.add(key);

        const target = systemMap.get(tid);
        if (!target) return;

        // Skip if both endpoints off-screen
        if (
          !vis(sys.coordinates.x, sys.coordinates.y) &&
          !vis(target.coordinates.x, target.coordinates.y)
        ) return;

        const from = toScreen(sys.coordinates.x, sys.coordinates.y, realW);
        const to = toScreen(target.coordinates.x, target.coordinates.y, realW);

        const hl =
          highlightSystemIds?.includes(sys.id) &&
          highlightSystemIds?.includes(tid);

        ctx.beginPath();
        ctx.moveTo(from.sx, from.sy);
        ctx.lineTo(to.sx, to.sy);
        ctx.strokeStyle = hl
          ? 'rgba(99,102,241,0.5)'
          : 'rgba(100,120,160,0.12)';
        ctx.lineWidth = hl ? 2 : 1;
        ctx.setLineDash(hl ? [] : [4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    });

    /* Territory fill — core systems */
    const cores = displaySystems.filter((s) => s.category === 'core');
    if (cores.length >= 2) {
      const pad = 50 * camera.zoom;
      ctx.beginPath();
      cores.forEach((s, i) => {
        const { sx, sy } = toScreen(s.coordinates.x, s.coordinates.y, realW);
        i === 0 ? ctx.moveTo(sx, sy - pad) : ctx.lineTo(sx, sy - pad);
      });
      const last = toScreen(
        cores[cores.length - 1].coordinates.x,
        cores[cores.length - 1].coordinates.y,
        realW,
      );
      const first = toScreen(cores[0].coordinates.x, cores[0].coordinates.y, realW);
      ctx.lineTo(last.sx + pad, last.sy + pad);
      ctx.lineTo(first.sx - pad, first.sy + pad);
      ctx.closePath();
      ctx.fillStyle = 'rgba(34,197,94,0.03)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(34,197,94,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* ── System nodes ── */
    displaySystems.forEach((sys) => {
      if (!vis(sys.coordinates.x, sys.coordinates.y)) return;

      const color = CATEGORY_COLORS[sys.category];
      const { sx, sy } = toScreen(sys.coordinates.x, sys.coordinates.y, realW);

      const baseR = sys.isHQ ? 14 : (sys.bases?.length ?? 0) > 0 ? 11 : 9;
      const r = baseR * camera.zoom;
      const isHov = hovered?.id === sys.id;
      const isHL = highlightSystemIds?.includes(sys.id);
      const hasEnemy = sys.bases?.some((b) => b.isEnemy);

      /* LOD: tiny dots only at very low zoom */
      if (camera.zoom < 0.3) {
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(2, r * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        return;
      }

      /* Outer glow on hover / highlight */
      if (isHov || isHL) {
        const gr = r * 3.5;
        const glow = ctx.createRadialGradient(sx, sy, r * 0.5, sx, sy, gr);
        glow.addColorStop(0, hexToRgba(color, 0.3));
        glow.addColorStop(1, hexToRgba(color, 0));
        ctx.beginPath();
        ctx.arc(sx, sy, gr, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      /* HQ: pulsing golden ring + star icon */
      if (sys.isHQ) {
        const pulse = (Math.sin(Date.now() / 800) + 1) / 2;
        ctx.beginPath();
        ctx.arc(sx, sy, r * (1.6 + pulse * 0.3), 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba('#fbbf24', 0.4 + pulse * 0.3);
        ctx.lineWidth = 2.5;
        ctx.stroke();
        if (camera.zoom >= 0.5) {
          ctx.font = `${14 * camera.zoom}px system-ui`;
          ctx.fillStyle = '#fbbf24';
          ctx.textAlign = 'center';
          ctx.fillText('\u2605', sx, sy - r - 6 * camera.zoom);
        }
      }

      /* Enemy base: red dashed ring */
      if (hasEnemy) {
        ctx.beginPath();
        ctx.arc(sx, sy, r * 1.4, 0, Math.PI * 2);
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(239,68,68,0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      /* Danger alert: pulsing red glow for high-threat systems (threat >= 7) */
      if ((sys.threatLevel ?? 0) >= 7) {
        const dp = (Math.sin(Date.now() / 600) + 1) / 2;
        const dangerR = r * (2.0 + dp * 1.0);
        const dangerGlow = ctx.createRadialGradient(sx, sy, r, sx, sy, dangerR);
        dangerGlow.addColorStop(0, `rgba(239,68,68,${0.15 + dp * 0.1})`);
        dangerGlow.addColorStop(1, 'rgba(239,68,68,0)');
        ctx.beginPath();
        ctx.arc(sx, sy, dangerR, 0, Math.PI * 2);
        ctx.fillStyle = dangerGlow;
        ctx.fill();

        /* Warning triangle icon at top */
        if (camera.zoom >= 0.5) {
          ctx.font = `${10 * camera.zoom}px system-ui`;
          ctx.fillStyle = `rgba(239,68,68,${0.7 + dp * 0.3})`;
          ctx.textAlign = 'center';
          ctx.fillText('\u26a0', sx, sy - r - 14 * camera.zoom);
        }
      }

      /* Rift sighting pulse ring */
      if (sys.riftSightings?.length) {
        const p = (Date.now() / 1500) % 1;
        ctx.beginPath();
        ctx.arc(sx, sy, r * (1.5 + p * 2), 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba('#a855f7', 0.3 * (1 - p));
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      /* Main dot with radial gradient */
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      grad.addColorStop(0, hexToRgba(color, 1));
      grad.addColorStop(0.6, hexToRgba(color, 0.8));
      grad.addColorStop(1, hexToRgba(color, 0.15));
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      /* Inner bright core */
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fill();

      /* Labels — skip at low zoom for LOD */
      if (camera.zoom >= 0.5) {
        ctx.font = `${isHov ? 'bold ' : ''}${12 * Math.min(camera.zoom, 1.5)}px system-ui, sans-serif`;
        ctx.fillStyle = isHov ? '#fff' : 'rgba(200,210,230,0.8)';
        ctx.textAlign = 'center';
        ctx.fillText(sys.name, sx, sy + r + 16 * camera.zoom);

        if (camera.zoom >= 0.7) {
          ctx.font = `${9 * Math.min(camera.zoom, 1.3)}px system-ui, sans-serif`;
          ctx.fillStyle = hexToRgba(color, 0.5);
          ctx.fillText(sys.category.toUpperCase(), sx, sy + r + 28 * camera.zoom);
        }
      }

      /* Base count badges — friendly (cyan) / enemy (red) */
      if (camera.zoom >= 0.5 && sys.bases?.length) {
        const friendly = sys.bases.filter((b) => !b.isEnemy);
        const enemies = sys.bases.filter((b) => b.isEnemy);

        if (friendly.length) {
          const bx = sx + r + 5;
          const by = sy - r - 3;
          ctx.beginPath();
          ctx.arc(bx, by, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34,211,238,0.15)';
          ctx.fill();
          ctx.font = 'bold 9px system-ui';
          ctx.fillStyle = '#22d3ee';
          ctx.textAlign = 'center';
          ctx.fillText(`${friendly.length}`, bx, by + 3);
        }

        if (enemies.length) {
          const bx = sx - r - 5;
          const by = sy - r - 3;
          ctx.beginPath();
          ctx.arc(bx, by, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239,68,68,0.2)';
          ctx.fill();
          ctx.font = 'bold 9px system-ui';
          ctx.fillStyle = '#ef4444';
          ctx.textAlign = 'center';
          ctx.fillText(`${enemies.length}`, bx, by + 3);
        }
      }

      /* Goal markers */
      const sg = systemGoals.get(sys.id);
      if (sg?.length && camera.zoom >= 0.5) {
        const gx = sx - r - (hasEnemy ? 18 : 6);
        const gy = sy - r - 3;
        ctx.beginPath();
        ctx.arc(gx, gy, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99,102,241,0.2)';
        ctx.fill();
        ctx.font = 'bold 9px system-ui';
        ctx.fillStyle = '#6366f1';
        ctx.textAlign = 'center';
        ctx.fillText(`${sg.length}`, gx, gy + 3);
      }
    });
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
    const obs = new ResizeObserver(resize);
    obs.observe(container);
    return () => obs.disconnect();
  }, [height]);

  /* ── Zoom-to-cursor via native wheel listener (non-passive) ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 0.89;

      setCamera((c) => {
        const nz = Math.max(0.15, Math.min(5, c.zoom * factor));
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        // World position under cursor before zoom
        const wx = (mx - cx) / c.zoom - c.x;
        const wy = (my - cy) / c.zoom - c.y;
        // Adjust camera so same world point stays under cursor
        return { x: (mx - cx) / nz - wx, y: (my - cy) / nz - wy, zoom: nz };
      });
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  /* ── Mouse handlers ── */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      camX: cameraRef.current.x,
      camY: cameraRef.current.y,
    };
    dragDist.current = 0;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setMousePos({ x: mx, y: my });

      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.mouseX;
        const dy = e.clientY - dragRef.current.mouseY;
        dragDist.current = Math.hypot(dx, dy);
        const z = cameraRef.current.zoom;
        setCamera({
          x: dragRef.current.camX + dx / z,
          y: dragRef.current.camY + dy / z,
          zoom: z,
        });
        canvas.style.cursor = 'grabbing';
        return;
      }

      /* Hit test for hover */
      let found: TribeSystem | null = null;
      for (const sys of displaySystems) {
        const { sx, sy } = toScreen(sys.coordinates.x, sys.coordinates.y, rect.width);
        const hitR = Math.max(20, 15 * cameraRef.current.zoom);
        if (Math.hypot(mx - sx, my - sy) < hitR) {
          found = sys;
          break;
        }
      }
      setHovered(found);
      canvas.style.cursor = found ? 'pointer' : 'grab';
    },
    [displaySystems, toScreen],
  );

  const handleMouseUp = useCallback(() => {
    const wasDrag = dragRef.current !== null;
    const dist = dragDist.current;
    dragRef.current = null;
    dragDist.current = 0;

    if ((!wasDrag || dist < 5) && hovered && onSystemClick) {
      onSystemClick(hovered);
    }
  }, [hovered, onSystemClick]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        background: '#080a14',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          dragRef.current = null;
          setHovered(null);
        }}
        style={{ display: 'block', cursor: 'grab' }}
      />

      {/* Hover tooltip */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(
              mousePos.x + 14,
              (containerRef.current?.offsetWidth ?? 400) - 220,
            ),
            top: Math.max(mousePos.y - 10, 4),
            pointerEvents: 'none',
            background: 'rgba(10,12,24,0.92)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${CATEGORY_COLORS[hovered.category]}40`,
            borderRadius: 8,
            padding: '10px 14px',
            minWidth: 180,
            maxWidth: 260,
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: CATEGORY_COLORS[hovered.category],
              }}
            />
            <span style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>
              {hovered.name}
            </span>
            {hovered.isHQ && (
              <span style={{ color: '#fbbf24', fontSize: 13 }}>{'\u2605'}</span>
            )}
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: CATEGORY_COLORS[hovered.category],
                marginLeft: 'auto',
              }}
            >
              {hovered.category}
            </span>
          </div>
          {hovered.controlledBy && (
            <div
              style={{
                fontSize: 11,
                color: 'rgba(200,210,230,0.7)',
                marginBottom: 2,
              }}
            >
              Control: {hovered.controlledBy}
            </div>
          )}
          {hovered.threatLevel != null && (
            <div
              style={{
                fontSize: 11,
                color:
                  hovered.threatLevel >= 7
                    ? '#ef4444'
                    : hovered.threatLevel >= 4
                      ? '#eab308'
                      : '#22c55e',
              }}
            >
              Threat: {hovered.threatLevel}/10
              {hovered.threatLevel >= 7 && <span style={{ marginLeft: 4 }}>{'\u26a0'}</span>}
            </div>
          )}
          {hovered.bases && hovered.bases.length > 0 && (
            <div style={{ fontSize: 11, marginTop: 2 }}>
              <span style={{ color: '#22d3ee' }}>
                {hovered.bases.filter((b) => !b.isEnemy).length} base
                {hovered.bases.filter((b) => !b.isEnemy).length !== 1
                  ? 's'
                  : ''}
              </span>
              {hovered.bases.some((b) => b.isEnemy) && (
                <span style={{ color: '#ef4444', marginLeft: 8 }}>
                  {hovered.bases.filter((b) => b.isEnemy).length} enemy
                </span>
              )}
            </div>
          )}
          {hovered.riftSightings && hovered.riftSightings.length > 0 && (
            <div style={{ fontSize: 11, color: '#a855f7', marginTop: 2 }}>
              {'\uD83C\uDF00'} {hovered.riftSightings.length} rift sighting
              {hovered.riftSightings.length > 1 ? 's' : ''}
            </div>
          )}
          {hovered.dangers && hovered.dangers.length > 0 && (
            <div style={{ fontSize: 10, color: '#fca5a5', marginTop: 3 }}>
              {hovered.dangers.slice(0, 2).map((d, i) => (
                <div key={i}>{'\u26a0'} {d}</div>
              ))}
            </div>
          )}
          {hovered.resources && hovered.resources.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 3,
                flexWrap: 'wrap',
                marginTop: 4,
              }}
            >
              {hovered.resources.map((r) => (
                <span
                  key={r}
                  style={{
                    fontSize: 9,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: 'rgba(168,85,247,0.12)',
                    color: '#a855f7',
                  }}
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {(
          ['core', 'frontline', 'contested', 'expansion', 'resource', 'unknown'] as SystemCategory[]
        ).map((cat) => (
          <span
            key={cat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 9,
              color: 'rgba(200,210,230,0.5)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: CATEGORY_COLORS[cat],
              }}
            />
            {cat}
          </span>
        ))}
      </div>

      {/* Zoom controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          display: 'flex',
          gap: 4,
        }}
      >
        <button
          onClick={() =>
            setCamera((c) => ({ ...c, zoom: Math.min(5, c.zoom * 1.3) }))
          }
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: '1px solid rgba(100,120,160,0.2)',
            background: 'rgba(10,12,24,0.7)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
        <button
          onClick={() =>
            setCamera((c) => ({ ...c, zoom: Math.max(0.15, c.zoom * 0.7) }))
          }
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: '1px solid rgba(100,120,160,0.2)',
            background: 'rgba(10,12,24,0.7)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {'\u2212'}
        </button>
        <button
          onClick={() => {
            setCamera({ x: 0, y: 0, zoom: 1 });
          }}
          style={{
            height: 28,
            paddingInline: 8,
            borderRadius: 6,
            border: '1px solid rgba(100,120,160,0.2)',
            background: 'rgba(10,12,24,0.7)',
            color: 'rgba(200,210,230,0.6)',
            cursor: 'pointer',
            fontSize: 10,
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
