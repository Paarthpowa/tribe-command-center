import { useRef, useEffect, useCallback } from 'react';
import { ExternalLink } from 'lucide-react';

interface EFMapEmbedProps {
  /** Shared EF-Map route URL (e.g. https://ef-map.com/s/780497ab76) */
  shareUrl?: string;
  /** Solar system IDs to highlight (fallback if no shareUrl) */
  systems?: string[];
  /** Links between systems as "A-B:color" */
  links?: string[];
  /** Fit camera to show all highlighted systems */
  fit?: boolean;
  height?: number | string;
}

/**
 * Embeds the EF-Map (ef-map.com) in an iframe.
 * If a shareUrl is provided, uses that directly (most reliable).
 * Otherwise falls back to constructing URL from systems/links params.
 */
export function EFMapEmbed({ shareUrl, systems = [], links = [], fit = true, height = 400 }: EFMapEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const buildSrc = useCallback(() => {
    if (shareUrl) {
      // Shared URLs like https://ef-map.com/s/780497ab76 — embed directly
      return shareUrl;
    }
    const params = new URLSearchParams();
    if (systems.length > 0) params.set('systems', systems.join(','));
    if (links.length > 0) params.set('links', links.join(','));
    if (fit) params.set('fit', '1');
    return `https://ef-map.com/?${params.toString()}`;
  }, [shareUrl, systems, links, fit]);

  const openUrl = shareUrl || `https://ef-map.com`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.src = buildSrc();
  }, [buildSrc]);

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          background: '#000',
        }}
      >
        <iframe
          ref={iframeRef}
          src={buildSrc()}
          style={{
            width: '100%',
            height: typeof height === 'number' ? `${height}px` : height,
            border: 'none',
            display: 'block',
            pointerEvents: 'none',
          }}
          title="EVE Frontier Star Map"
          allow="fullscreen"
        />
      </div>
      {/* Open in EF-Map button */}
      <a
        href={openUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(10,14,23,0.85)',
          border: '1px solid var(--border-accent)',
          color: 'var(--accent-cyan)',
          fontSize: 11,
          fontWeight: 600,
          textDecoration: 'none',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          zIndex: 2,
        }}
      >
        <ExternalLink size={12} />
        Open in EF-Map
      </a>
    </div>
  );
}
