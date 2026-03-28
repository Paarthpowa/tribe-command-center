import { useState, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { GlassCard } from '../components/ui';
import {
  MessageSquare, Plus, ThumbsUp, ThumbsDown, User, Target, Lightbulb,
  AlertCircle, X, Eye, EyeOff, Send,
} from 'lucide-react';
import type { FeedbackCategory, FeedbackEntry } from '../types';

const CATEGORY_CONFIG: Record<FeedbackCategory, { label: string; color: string; icon: typeof MessageSquare }> = {
  general:    { label: 'General',    color: '#6366f1', icon: MessageSquare },
  member:     { label: 'Member',     color: '#22d3ee', icon: User },
  goal:       { label: 'Goal',       color: '#f97316', icon: Target },
  suggestion: { label: 'Suggestion', color: '#22c55e', icon: Lightbulb },
  issue:      { label: 'Issue',      color: '#ef4444', icon: AlertCircle },
};

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function FeedbackCard({ entry }: { entry: FeedbackEntry }) {
  const { walletAddress, upvoteFeedback, downvoteFeedback, deleteFeedback, currentMember } = useAppStore();
  const member = currentMember();
  const cat = CATEGORY_CONFIG[entry.category];
  const Icon = cat.icon;
  const hasUpvoted = walletAddress ? entry.upvotes.includes(walletAddress) : false;
  const hasDownvoted = walletAddress ? (entry.downvotes ?? []).includes(walletAddress) : false;
  const canDelete = walletAddress === entry.authorAddress || member?.role === 'leader';

  return (
    <GlassCard style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Category icon */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `color-mix(in srgb, ${cat.color} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${cat.color} 25%, transparent)`,
          flexShrink: 0,
        }}>
          <Icon size={16} color={cat.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
              padding: '1px 8px', borderRadius: 'var(--radius-xl)',
              color: cat.color, background: `color-mix(in srgb, ${cat.color} 10%, transparent)`,
            }}>
              {cat.label}
            </span>
            {entry.anonymous ? (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <EyeOff size={11} /> Anonymous
              </span>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--accent-emerald)', fontWeight: 600 }}>
                {entry.authorName}
              </span>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {relativeTime(entry.createdAt)}
            </span>
          </div>

          {/* Target badge */}
          {entry.targetMemberName && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={11} /> About: <strong>{entry.targetMemberName}</strong>
            </div>
          )}
          {entry.targetGoalTitle && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Target size={11} /> Re: <strong>{entry.targetGoalTitle}</strong>
            </div>
          )}

          {/* Message */}
          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {entry.message}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <button
              onClick={() => walletAddress && upvoteFeedback(entry.id, walletAddress)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 'var(--radius-md)',
                border: hasUpvoted ? '1px solid rgba(34,197,94,0.4)' : '1px solid var(--border-subtle)',
                background: hasUpvoted ? 'rgba(34,197,94,0.12)' : 'transparent',
                color: hasUpvoted ? '#22c55e' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <ThumbsUp size={12} />
              {entry.upvotes.length > 0 && entry.upvotes.length}
            </button>
            <button
              onClick={() => walletAddress && downvoteFeedback(entry.id, walletAddress)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 'var(--radius-md)',
                border: hasDownvoted ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border-subtle)',
                background: hasDownvoted ? 'rgba(239,68,68,0.12)' : 'transparent',
                color: hasDownvoted ? '#ef4444' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <ThumbsDown size={12} />
              {(entry.downvotes ?? []).length > 0 && (entry.downvotes ?? []).length}
            </button>
            {canDelete && (
              <button
                onClick={() => deleteFeedback(entry.id)}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11,
                  display: 'flex', alignItems: 'center', gap: 3,
                }}
              >
                <X size={12} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/* ── Create Feedback Modal ── */
function CreateFeedbackModal({ onClose }: { onClose: () => void }) {
  const { walletAddress, currentMember, addFeedback, members, goals, tribe } = useAppStore();
  const member = currentMember();

  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [targetMemberId, setTargetMemberId] = useState('');
  const [targetGoalId, setTargetGoalId] = useState('');

  const approvedMembers = members.filter((m) => m.status === 'approved');

  const handleSubmit = () => {
    if (!message.trim() || !walletAddress || !member) return;
    const targetMember = members.find((m) => m.id === targetMemberId);
    const targetGoal = goals.find((g) => g.id === targetGoalId);

    const entry: FeedbackEntry = {
      id: `fb-${Date.now()}`,
      tribeId: tribe?.id ?? '',
      category,
      message: message.trim(),
      targetMemberId: targetMember?.id,
      targetMemberName: targetMember?.name,
      targetGoalId: targetGoal?.id,
      targetGoalTitle: targetGoal?.title,
      anonymous,
      authorAddress: anonymous ? undefined : walletAddress,
      authorName: anonymous ? undefined : member.name,
      createdAt: new Date().toISOString(),
      upvotes: [],
      downvotes: [],
    };
    addFeedback(entry);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, colorScheme: 'dark', cursor: 'pointer' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <GlassCard style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={18} color="#6366f1" />
            Submit Feedback
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Category */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
              Category
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(Object.entries(CATEGORY_CONFIG) as [FeedbackCategory, typeof CATEGORY_CONFIG['general']][]).map(([key, cfg]) => {
                const CatIcon = cfg.icon;
                const active = category === key;
                return (
                  <button key={key} onClick={() => setCategory(key)} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 'var(--radius-md)',
                    border: active ? `1px solid ${cfg.color}` : '1px solid var(--border-subtle)',
                    background: active ? `color-mix(in srgb, ${cfg.color} 12%, transparent)` : 'var(--bg-secondary)',
                    color: active ? cfg.color : 'var(--text-secondary)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>
                    <CatIcon size={13} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target member (if category is member) */}
          {category === 'member' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                About Member
              </label>
              <select value={targetMemberId} onChange={(e) => setTargetMemberId(e.target.value)} style={selectStyle}>
                <option value="">-- Select member --</option>
                {approvedMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Target goal (if category is goal) */}
          {category === 'goal' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                About Goal
              </label>
              <select value={targetGoalId} onChange={(e) => setTargetGoalId(e.target.value)} style={selectStyle}>
                <option value="">-- Select goal --</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Message */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
              Your Feedback *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts, ideas, or concerns..."
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Anonymous toggle */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: anonymous ? 'var(--accent-indigo)' : 'var(--text-secondary)',
            cursor: 'pointer', userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              style={{ accentColor: 'var(--accent-indigo)' }}
            />
            {anonymous ? <EyeOff size={14} /> : <Eye size={14} />}
            Post anonymously
          </label>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!message.trim()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none',
              background: message.trim() ? 'var(--accent-indigo)' : 'var(--bg-secondary)',
              color: message.trim() ? '#fff' : 'var(--text-muted)',
              fontSize: 14, fontWeight: 700,
              cursor: message.trim() ? 'pointer' : 'not-allowed', marginTop: 4,
            }}
          >
            <Send size={14} />
            Submit Feedback
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

/* ── Main page ── */
export function FeedbackPage() {
  const { feedback, currentMember } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);
  const [filterCat, setFilterCat] = useState<FeedbackCategory | 'all'>('all');
  const member = currentMember();

  const filtered = useMemo(() => {
    if (filterCat === 'all') return feedback;
    return feedback.filter((f) => f.category === filterCat);
  }, [feedback, filterCat]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MessageSquare size={22} color="#6366f1" />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            Feedback
          </h1>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-md)' }}>
            {feedback.length}
          </span>
        </div>
        {member && (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none',
              background: 'var(--accent-indigo)', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            New Feedback
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterCat('all')}
          style={{
            padding: '6px 14px', borderRadius: 'var(--radius-xl)',
            border: filterCat === 'all' ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
            background: filterCat === 'all' ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
            color: filterCat === 'all' ? 'var(--accent-indigo)' : 'var(--text-secondary)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          All
        </button>
        {(Object.entries(CATEGORY_CONFIG) as [FeedbackCategory, typeof CATEGORY_CONFIG['general']][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterCat(key)}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-xl)',
              border: filterCat === key ? `1px solid ${cfg.color}` : '1px solid var(--border-subtle)',
              background: filterCat === key ? `color-mix(in srgb, ${cfg.color} 12%, transparent)` : 'var(--bg-card)',
              color: filterCat === key ? cfg.color : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Feedback list */}
      {filtered.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: 40 }}>
          <MessageSquare size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            No feedback yet. Share your thoughts to help the tribe improve!
          </p>
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((entry) => (
            <FeedbackCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showCreate && <CreateFeedbackModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
