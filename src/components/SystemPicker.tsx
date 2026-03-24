import { useState, useRef, useCallback, useEffect } from 'react';
import type { WorldSystem } from '../types';
import { Search, X } from 'lucide-react';

interface SystemPickerProps {
  /** All world systems to search through */
  systems: WorldSystem[];
  /** Already-claimed system IDs to exclude or mark */
  claimedIds?: Set<number>;
  /** Called when a system is selected */
  onSelect: (system: WorldSystem) => void;
  /** Placeholder text */
  placeholder?: string;
}

export function SystemPicker({
  systems,
  claimedIds,
  onSelect,
  placeholder = 'Search systems by name…',
}: SystemPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter systems by query (case-insensitive substring match)
  const filtered = query.length >= 2
    ? systems
        .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 50)
    : [];

  const handleSelect = useCallback(
    (sys: WorldSystem) => {
      onSelect(sys);
      setQuery('');
      setOpen(false);
      setHighlightIdx(0);
    },
    [onSelect],
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[highlightIdx]) {
        e.preventDefault();
        handleSelect(filtered[highlightIdx]);
      } else if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    },
    [filtered, highlightIdx, handleSelect],
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[highlightIdx] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx]);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightIdx(0);
  }, [query]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
        }}
      >
        <Search size={14} color="var(--text-muted)" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 13,
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setOpen(false);
              inputRef.current?.focus();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
            }}
          >
            <X size={14} color="var(--text-muted)" />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            maxHeight: 240,
            overflowY: 'auto',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            zIndex: 50,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {filtered.map((sys, i) => {
            const claimed = claimedIds?.has(sys.id);
            return (
              <button
                key={sys.id}
                onClick={() => handleSelect(sys)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 12px',
                  background:
                    i === highlightIdx
                      ? 'rgba(99,102,241,0.12)'
                      : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: claimed
                    ? 'var(--text-muted)'
                    : 'var(--text-primary)',
                  fontSize: 13,
                  borderBottom:
                    i < filtered.length - 1
                      ? '1px solid var(--border-subtle)'
                      : 'none',
                }}
                onMouseEnter={() => setHighlightIdx(i)}
              >
                <span style={{ flex: 1, fontWeight: 500 }}>{sys.name}</span>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    fontFamily: 'monospace',
                  }}
                >
                  {sys.id}
                </span>
                {claimed && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '1px 6px',
                      borderRadius: 3,
                      background: 'rgba(34,197,94,0.15)',
                      color: '#22c55e',
                      fontWeight: 600,
                    }}
                  >
                    CLAIMED
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {open && query.length >= 2 && filtered.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            zIndex: 50,
            color: 'var(--text-muted)',
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          No systems found matching &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
