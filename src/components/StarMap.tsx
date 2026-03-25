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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface StarMapProps {
  systems: TribeSystem[];
  goals?: Goal[];
  highlightSystemIds?: number[];
  onSystemClick?: (system: TribeSystem) => void;
  height?: number;
}

/**
 * Deterministic radial BFS layout: HQ at center, connected systems placed in
 * concentric rings by graph distance.  Angles derived from original coordinates
 * so the spatial arrangement is consistent across visits for visual memory.
 */
function computeLayout(
  systems: TribeSystem[],
): Map<number, { x: number; y: number }> {
  const positions = new Map<number, { x: number; y: number }>();
  if (systems.length === 0) return positions;

  const hq = systems.find((s) => s.isHQ) ?? systems[0];
  const systemMap = new Map(systems.map((s) => [s.id, s]));

  positions.set(hq.id, { x: 0, y: 0 });

  // BFS to determine depth from HQ
  const depth = new Map<number, number>([[hq.id, 0]]);
  const queue = [hq.id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const sys = systemMap.get(current);
    if (!sys) continue;
    for (const connId of sys.connections ?? []) {
      if (systemMap.has(connId) && !depth.has(connId)) {
        depth.set(connId, depth.get(current)! + 1);
        queue.push(connId);
      }
    }
  }

  // Group by depth, sort by ID for determinism
  const layers = new Map<number, number[]>();
  for (const [id, d] of depth) {
    if (d === 0) continue;
    if (!layers.has(d)) layers.set(d, []);
    layers.get(d)!.push(id);
  }
  for (const ids of layers.values()) ids.sort((a, b) => a - b);

  const RING_RADIUS = 180;

  for (const [d, ids] of layers) {
    const radius = d * RING_RADIUS;
    // Angles from HQ based on original coordinates → consistent spatial memory
    const items = ids.map((id) => {
      const sys = systemMap.get(id)!;
      const dx = sys.coordinates.x - hq.coordinates.x;
      const dy = sys.coordinates.y - hq.coordinates.y;
      return { id, angle: Math.atan2(dy, dx) };
    });
    items.sort((a, b) => a.angle - b.angle);

    // Enforce minimum angular separation (36°)
    const MIN_SEP = Math.PI / 5;
    for (let i = 1; i < items.length; i++) {
      if (items[i].angle - items[i - 1].angle < MIN_SEP) {
        items[i].angle = items[i - 1].angle + MIN_SEP;
      }
    }

    for (const { id, angle } of items) {
      positions.set(id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }
  }

  // Place any disconnected systems in an outer ring
  let dAngle = 0;
  for (const sys of systems) {
    if (!positions.has(sys.id)) {
      const r = ((layers.size || 0) + 1) * RING_RADIUS;
      positions.set(sys.id, { x: Math.cos(dAngle) * r, y: Math.sin(dAngle) * r });
      dAngle += Math.PI / 3;
    }
  }

  return positions;
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

  /* Deterministic positions — computed once per system set */
  const layoutPositions = useMemo(() => computeLayout(systems), [systems]);
  const displaySystems = useMemo(
    () =>
      systems.map((s) => ({
        ...s,
        coordinates: layoutPositions.get(s.id) ?? s.coordinates,
      })),
    [systems, layoutPositions],
  );

  /* Camera */
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  /* Drag state in refs to avoid stale closures */
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

  /* World → screen */
  const toScreen = useCallback(
    (wx: number, wy: number, w: number) => ({
      sx: (wx + camera.x) * camera.zoom + w / 2,
      sy: (wy + camera.y) * camera.zoom + height / 2,
    }),
    [camera, height],
  );

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

  /* Animation tick for HQ pulse, rift rings, danger glow */
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

    /* Clean dark background */
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, realW, realH);

    /* Frustum culling bounds */
    const margin = 100 / camera.zoom;
    const vL = -camera.x - realW / (2 * camera.zoom) - margin;
    const vR = -camera.x + realW / (2 * camera.zoom) + margin;
    const vT = -camera.y - realH / (2 * camera.zoom) - margin;
    const vB = -camera.y + realH / (2 * camera.zoom) + margin;
    const vis = (wx: number, wy: number) =>
      wx >= vL && wx <= vR && wy >= vT && wy <= vB;

    /* Subtle dot grid for spatial reference */
    if (camera.zoom >= 0.4) {
      ctx.fillStyle = 'rgba(100,120,160,0.08)';
      const step = 60;
      const gx0 = Math.floor(vL / step) * step;
      const gy0 = Math.floor(vT / step) * step;
      for (let gx = gx0; gx <= vR; gx += step) {
        for (let gy = gy0; gy <= vB; gy += step) {
          const { sx, sy } = toScreen(gx, gy, realW);
          ctx.beginPath();
          ctx.arc(sx, sy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    /* Concentric ring guides (depth rings) */
    const center = toScreen(0, 0, realW);
    ctx.strokeStyle = 'rgba(100,120,160,0.06)';
    ctx.lineWidth = 1;
    for (let ring = 1; ring <= 3; ring++) {
      const r = ring * 180 * camera.zoom;
      ctx.beginPath();
      ctx.arc(center.sx, center.sy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* ── Gate connection lines ── */
    const drawnEdges = new Set<string>();
    displaySystems.forEach((sys) => {
      sys.connections?.forEach((tid) => {
        const key = sys.id < tid ? `${sys.id}-${tid}` : `${tid}-${sys.id}`;
        if (drawnEdges.has(key)) return;
        drawnEdges.add(key);

        const target = systemMap.get(tid);
        if (!target) return;
        if (
          !vis(sys.coordinates.x, sys.coordinates.y) &&
          !vis(target.coordinates.x, target.coordinates.y)
        )
          return;

        const from = toScreen(sys.coordinates.x, sys.coordinates.y, realW);
        const to = toScreen(target.coordinates.x, target.coordinates.y, realW);

        const isHL =
          highlightSystemIds?.includes(sys.id) &&
          highlightSystemIds?.includes(tid);

        /* Connection line */
        ctx.beginPath();
        ctx.moveTo(from.sx, from.sy);
        ctx.lineTo(to.sx, to.sy);
        ctx.strokeStyle = isHL
          ? 'rgba(99,102,241,0.6)'
          : 'rgba(140,160,200,0.2)';
        ctx.lineWidth = isHL ? 2.5 : 1.5;
        ctx.stroke();

        /* Gate diamond at midpoint */
        if (camera.zoom >= 0.5) {
          const mx = (from.sx + to.sx) / 2;
          const my = (from.sy + to.sy) / 2;
          const ds = 4 * camera.zoom;
          ctx.beginPath();
          ctx.moveTo(mx, my - ds);
          ctx.lineTo(mx + ds, my);
          ctx.lineTo(mx, my + ds);
          ctx.lineTo(mx - ds, my);
          ctx.closePath();
          ctx.fillStyle = isHL
            ? 'rgba(99,102,241,0.5)'
            : 'rgba(140,160,200,0.25)';
          ctx.fill();
        }
      });
    });

    /* ── System nodes ── */
    displaySystems.forEach((sys) => {
      if (!vis(sys.coordinates.x, sys.coordinates.y)) return;

      const color = CATEGORY_COLORS[sys.category];
      const { sx, sy } = toScreen(sys.coordinates.x, sys.coordinates.y, realW);

      const baseR = sys.isHQ ? 18 : (sys.bases?.length ?? 0) > 0 ? 14 : 11;
      const r = baseR * camera.zoom;
      const isHov = hovered?.id === sys.id;
      const isHL = highlightSystemIds?.includes(sys.id);
      const hasEnemy = sys.bases?.some((b) => b.isEnemy);

      /* LOD: tiny dots only at very low zoom */
      if (camera.zoom < 0.25) {
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(2, r * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        return;
      }

      /* Outer glow on hover / highlight */
      if (isHov || isHL) {
        const gr = r * 3;
        const glow = ctx.createRadialGradient(sx, sy, r * 0.3, sx, sy, gr);
        glow.addColorStop(0, hexToRgba(color, 0.25));
        glow.addColorStop(1, hexToRgba(color, 0));
        ctx.beginPath();
        ctx.arc(sx, sy, gr, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      /* HQ: pulsing golden ring + star */
      if (sys.isHQ) {
        const pulse = (Math.sin(Date.now() / 800) + 1) / 2;
        ctx.beginPath();
        ctx.arc(sx, sy, r * (1.5 + pulse * 0.2), 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba('#fbbf24', 0.35 + pulse * 0.25);
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
        ctx.arc(sx, sy, r * 1.35, 0, Math.PI * 2);
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(239,68,68,0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      /* Danger glow for high-threat (>= 7) */
      if ((sys.threatLevel ?? 0) >= 7) {
        const dp = (Math.sin(Date.now() / 600) + 1) / 2;
        const dangerR = r * (1.8 + dp * 0.8);
        const dangerGlow = ctx.createRadialGradient(sx, sy, r, sx, sy, dangerR);
        dangerGlow.addColorStop(0, `rgba(239,68,68,${0.12 + dp * 0.08})`);
        dangerGlow.addColorStop(1, 'rgba(239,68,68,0)');
        ctx.beginPath();
        ctx.arc(sx, sy, dangerR, 0, Math.PI * 2);
        ctx.fillStyle = dangerGlow;
        ctx.fill();
        if (camera.zoom >= 0.5) {
          ctx.font = `${10 * camera.zoom}px system-ui`;
          ctx.fillStyle = `rgba(239,68,68,${0.7 + dp * 0.3})`;
          ctx.textAlign = 'center';
          ctx.fillText('\u26a0', sx, sy - r - 14 * camera.zoom);
        }
      }

      /* Rift sighting pulse ring (purple/gold — valuable crude fuel POI) */
      if (sys.riftSightings?.length) {
        const p = (Date.now() / 1500) % 1;
        ctx.beginPath();
        ctx.arc(sx, sy, r * (1.4 + p * 1.8), 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba('#c084fc', 0.3 * (1 - p));
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      /* Node: filled circle with colored border */
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(color, 0.15);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(color, isHov ? 1 : 0.7);
      ctx.lineWidth = isHov ? 3 : 2;
      ctx.stroke();

      /* Inner bright dot */
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(color, 0.9);
      ctx.fill();

      /* NPC Station marker — diamond shape below the node */
      if (sys.hasNPCStation && camera.zoom >= 0.45) {
        const ds = 6 * camera.zoom;
        const sy2 = sy - r - 10 * camera.zoom;
        ctx.beginPath();
        ctx.moveTo(sx, sy2 - ds);
        ctx.lineTo(sx + ds, sy2);
        ctx.lineTo(sx, sy2 + ds);
        ctx.lineTo(sx - ds, sy2);
        ctx.closePath();
        ctx.fillStyle = '#22d3ee';
        ctx.fill();
        ctx.strokeStyle = 'rgba(34,211,238,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      /* Labels */
      if (camera.zoom >= 0.45) {
        /* System name */
        ctx.font = `${isHov ? 'bold ' : ''}${13 * Math.min(camera.zoom, 1.5)}px system-ui, sans-serif`;
        ctx.fillStyle = isHov ? '#fff' : 'rgba(220,225,240,0.9)';
        ctx.textAlign = 'center';
        ctx.fillText(sys.name, sx, sy + r + 18 * camera.zoom);

        /* Category label */
        if (camera.zoom >= 0.6) {
          ctx.font = `${9 * Math.min(camera.zoom, 1.3)}px system-ui, sans-serif`;
          ctx.fillStyle = hexToRgba(color, 0.55);
          ctx.fillText(sys.category.toUpperCase(), sx, sy + r + 30 * camera.zoom);
        }
      }

      /* Base count badges */
      if (camera.zoom >= 0.5 && sys.bases?.length) {
        const friendly = sys.bases.filter((b) => !b.isEnemy);
        const enemies = sys.bases.filter((b) => b.isEnemy);

        if (friendly.length) {
          const bx = sx + r + 6;
          const by = sy - r - 4;
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
          const bx = sx - r - 6;
          const by = sy - r - 4;
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
        const gx = sx - r - (hasEnemy ? 20 : 6);
        const gy = sy - r - 4;
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

    /* "Capital" label at the very center */
    if (camera.zoom >= 0.5) {
      const hqSys = displaySystems.find((s) => s.isHQ);
      if (hqSys) {
        const hqScreen = toScreen(hqSys.coordinates.x, hqSys.coordinates.y, realW);
        ctx.font = `bold ${10 * camera.zoom}px system-ui`;
        ctx.fillStyle = 'rgba(251,191,36,0.4)';
        ctx.textAlign = 'center';
        ctx.fillText('HQ', hqScreen.sx, hqScreen.sy + 5 * camera.zoom);
      }
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
    const obs = new ResizeObserver(resize);
    obs.observe(container);
    return () => obs.disconnect();
  }, [height]);

  /* ── Zoom-to-cursor via native wheel listener ── */
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
        const wx = (mx - cx) / c.zoom - c.x;
        const wy = (my - cy) / c.zoom - c.y;
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
        background: '#0d1117',
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
            background: 'rgba(13,17,23,0.95)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${CATEGORY_COLORS[hovered.category]}50`,
            borderRadius: 8,
            padding: '10px 14px',
            minWidth: 180,
            maxWidth: 260,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
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
            <div style={{ fontSize: 11, color: 'rgba(200,210,230,0.7)', marginBottom: 2 }}>
              Control: {hovered.controlledBy}
            </div>
          )}
          {hovered.hasNPCStation && (
            <div style={{ fontSize: 11, color: '#22d3ee', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 8, display: 'inline-block', width: 8, height: 8, background: '#22d3ee', transform: 'rotate(45deg)' }} />
              NPC Station
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
                {hovered.bases.filter((b) => !b.isEnemy).length !== 1 ? 's' : ''}
              </span>
              {hovered.bases.some((b) => b.isEnemy) && (
                <span style={{ color: '#ef4444', marginLeft: 8 }}>
                  {hovered.bases.filter((b) => b.isEnemy).length} enemy
                </span>
              )}
            </div>
          )}
          {hovered.riftSightings && hovered.riftSightings.length > 0 && (
            <div style={{ fontSize: 11, color: '#c084fc', marginTop: 2 }}>
              {'\uD83C\uDF00'} {hovered.riftSightings.length} rift sighting{hovered.riftSightings.length > 1 ? 's' : ''}
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
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
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
          background: 'rgba(13,17,23,0.7)',
          borderRadius: 6,
          padding: '4px 8px',
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
              color: 'rgba(200,210,230,0.6)',
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
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'rgba(200,210,230,0.6)' }}>
          <span style={{ width: 6, height: 6, background: '#22d3ee', transform: 'rotate(45deg)', display: 'inline-block' }} />
          station
        </span>
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
            background: 'rgba(13,17,23,0.8)',
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
            background: 'rgba(13,17,23,0.8)',
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
          onClick={() => setCamera({ x: 0, y: 0, zoom: 1 })}
          style={{
            height: 28,
            paddingInline: 8,
            borderRadius: 6,
            border: '1px solid rgba(100,120,160,0.2)',
            background: 'rgba(13,17,23,0.8)',
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
