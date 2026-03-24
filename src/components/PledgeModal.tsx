import { useState } from 'react';
import { GlassCard } from './ui';
import { X } from 'lucide-react';
import type { Task, Contribution } from '../types';
import { useAppStore } from '../stores/appStore';

interface PledgeModalProps {
  task: Task;
  onClose: () => void;
  onSubmit: (contribution: Contribution) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

export function PledgeModal({ task, onClose, onSubmit }: PledgeModalProps) {
  const { walletAddress, members } = useAppStore();
  const currentMember = members.find((m) => m.address === walletAddress);
  const memberName = currentMember?.name ?? 'Unknown';

  const [selectedResource, setSelectedResource] = useState<string>(
    task.requirements[0]?.resource ?? '',
  );
  const [amount, setAmount] = useState<number>(0);
  const [deadline, setDeadline] = useState('');

  const req = task.requirements.find((r) => r.resource === selectedResource);
  const alreadyPledged = task.contributions
    .filter((c) => c.resource === selectedResource)
    .reduce((s, c) => s + c.pledged, 0);
  const remaining = req ? req.amount - alreadyPledged : 0;

  const handleSubmit = () => {
    if (!selectedResource || amount <= 0) return;

    const contribution: Contribution = {
      id: `c-${Date.now()}`,
      taskId: task.id,
      memberAddress: walletAddress ?? '',
      memberName,
      resource: selectedResource,
      pledged: Math.min(amount, remaining),
      delivered: 0,
      status: 'pledged',
      createdAt: new Date().toISOString(),
      deadline: deadline || undefined,
    };
    onSubmit(contribution);
  };

  const canSubmit = selectedResource && amount > 0 && remaining > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-overlay)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <GlassCard
        style={{
          width: 440,
          maxWidth: '90vw',
          padding: 28,
          border: '1px solid var(--border-accent)',
          boxShadow: 'var(--shadow-glow)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            Pledge Resources
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
          Pledge resources for: <strong style={{ color: 'var(--text-primary)' }}>{task.title}</strong>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Pledging as */}
          <div>
            <label style={labelStyle}>Pledging As</label>
            <div style={{ ...inputStyle, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'default' }}>
              {memberName}
            </div>
          </div>

          {/* Resource */}
          <div>
            <label style={labelStyle}>Resource</label>
            <select
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
            >
              {task.requirements.map((r) => (
                <option key={r.resource} value={r.resource}>
                  {r.resource}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label style={labelStyle}>
              Amount * <span style={{ fontWeight: 400, textTransform: 'none' }}>(remaining: {remaining})</span>
            </label>
            <input
              type="number"
              style={inputStyle}
              value={amount || ''}
              onChange={(e) => setAmount(Math.min(Number(e.target.value), remaining))}
              min={1}
              max={remaining}
              placeholder={`Max ${remaining}`}
            />
          </div>

          {/* Delivery deadline */}
          <div>
            <label style={labelStyle}>Delivery Deadline</label>
            <input
              type="date"
              style={inputStyle}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
              Choose when you commit to delivering. Missing deadlines affects your reputation score.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: canSubmit ? 'var(--accent-indigo)' : 'var(--bg-secondary)',
              color: canSubmit ? '#fff' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            Pledge {amount > 0 ? `${amount} ${selectedResource}` : ''}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
