import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { GlassCard } from '../components/ui';
import type { GoalPriority, ResourceRequirement, Task } from '../types';
import { Plus, Trash2, ArrowLeft, ArrowRight, Check, Copy } from 'lucide-react';

type DraftTask = {
  title: string;
  description: string;
  requirements: ResourceRequirement[];
};

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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
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

const btnPrimary: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--accent-indigo)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const btnSecondary: React.CSSProperties = {
  ...btnPrimary,
  background: 'transparent',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-secondary)',
};

export function CreateGoalPage() {
  const navigate = useNavigate();
  const addGoal = useAppStore((s) => s.addGoal);

  const [step, setStep] = useState(1);

  // Step 1: Goal basics
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [deadline, setDeadline] = useState('');
  const [mapShareUrl, setMapShareUrl] = useState('');

  // Step 2: Auto sub-task generation
  const [useAutoGen, setUseAutoGen] = useState(false);
  const [autoGenLabel, setAutoGenLabel] = useState('');
  const [autoGenCount, setAutoGenCount] = useState(1);
  const [autoGenRequirements, setAutoGenRequirements] = useState<ResourceRequirement[]>([]);

  // Step 2: Manual tasks (used if not autoGen)
  const [manualTasks, setManualTasks] = useState<DraftTask[]>([
    { title: '', description: '', requirements: [] },
  ]);

  const addManualTask = () =>
    setManualTasks((t) => [...t, { title: '', description: '', requirements: [] }]);

  const removeManualTask = (i: number) =>
    setManualTasks((t) => t.filter((_, idx) => idx !== i));

  const updateManualTask = (i: number, field: string, value: string) =>
    setManualTasks((t) => t.map((task, idx) => (idx === i ? { ...task, [field]: value } : task)));

  const addManualRequirement = (taskIdx: number) =>
    setManualTasks((t) =>
      t.map((task, idx) =>
        idx === taskIdx
          ? { ...task, requirements: [...task.requirements, { resource: '', amount: 0 }] }
          : task,
      ),
    );

  const updateManualRequirement = (taskIdx: number, reqIdx: number, field: keyof ResourceRequirement, value: string) =>
    setManualTasks((t) =>
      t.map((task, idx) =>
        idx === taskIdx
          ? {
              ...task,
              requirements: task.requirements.map((r, ri) =>
                ri === reqIdx ? { ...r, [field]: field === 'amount' ? Number(value) : value } : r,
              ),
            }
          : task,
      ),
    );

  const addAutoGenReq = () =>
    setAutoGenRequirements((r) => [...r, { resource: '', amount: 0 }]);

  const updateAutoGenReq = (i: number, field: keyof ResourceRequirement, value: string) =>
    setAutoGenRequirements((reqs) =>
      reqs.map((r, idx) =>
        idx === i ? { ...r, [field]: field === 'amount' ? Number(value) : value } : r,
      ),
    );

  const handleSubmit = () => {
    const goalId = `goal-${Date.now()}`;
    let goalTasks: Task[];

    const effectiveLabel = autoGenLabel.trim() || title;

    if (useAutoGen && autoGenCount > 0) {
      // Auto-generate sub-tasks
      goalTasks = Array.from({ length: autoGenCount }, (_, i) => ({
        id: `task-${Date.now()}-${i}`,
        goalId,
        title: autoGenCount === 1 ? effectiveLabel : `${effectiveLabel} #${i + 1}`,
        description: description || `${effectiveLabel} — sub-task ${i + 1} of ${autoGenCount}`,
        status: 'open' as const,
        subIndex: i + 1,
        subTotal: autoGenCount,
        requirements: autoGenRequirements.filter((r) => r.resource && r.amount > 0).map((r) => ({ ...r })),
        contributions: [],
      }));
    } else {
      goalTasks = manualTasks
        .filter((t) => t.title.trim())
        .map((t, i) => ({
          id: `task-${Date.now()}-${i}`,
          goalId,
          title: t.title,
          description: t.description,
          status: 'open' as const,
          requirements: t.requirements.filter((r) => r.resource && r.amount > 0),
          contributions: [],
        }));
    }

    addGoal({
      id: goalId,
      tribeId: 'tribe-alpha',
      title,
      description,
      status: 'planning',
      priority,
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      deadline: deadline || undefined,
      mapShareUrl: mapShareUrl || undefined,
      tasks: goalTasks,
    });

    navigate('/');
  };

  const canProceedStep1 = title.trim().length > 0;
  const canProceedStep2 = useAutoGen
    ? autoGenCount > 0
    : manualTasks.some((t) => t.title.trim());

  return (
    <div style={{ padding: '28px 24px', maxWidth: 720, margin: '0 auto' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 20,
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
        Create New Goal
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-muted)' }}>
        Step {step} of 2 — {step === 1 ? 'Goal Details' : 'Define Tasks'}
      </p>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[1, 2].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: s <= step ? 'var(--accent-indigo)' : 'var(--border-subtle)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Goal Title *</label>
            <input
              style={inputStyle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build 3 Cruisers (Maul) for War Effort"
            />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is the goal about?"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Priority</label>
              <select
                style={selectStyle}
                value={priority}
                onChange={(e) => setPriority(e.target.value as GoalPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Deadline</label>
              <input
                type="date"
                style={inputStyle}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>EF-Map Share URL (optional)</label>
            <input
              style={inputStyle}
              value={mapShareUrl}
              onChange={(e) => setMapShareUrl(e.target.value)}
              placeholder="e.g. https://ef-map.com/s/780497ab76"
            />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
              Paste a shared route URL from ef-map.com to display the route on the goal detail page.
            </p>
          </div>
        </GlassCard>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Auto-gen toggle */}
          <GlassCard style={{ padding: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={useAutoGen}
                onChange={(e) => setUseAutoGen(e.target.checked)}
                style={{ accentColor: 'var(--accent-indigo)', width: 16, height: 16 }}
              />
              <Copy size={16} color="var(--accent-cyan)" />
              Auto-generate identical sub-tasks
            </label>
            <p style={{ margin: '6px 0 0 26px', fontSize: 12, color: 'var(--text-muted)' }}>
              Need 5 gates? 3 cruisers? Enter a count and each becomes a separate sub-task members can claim.
            </p>
          </GlassCard>

          {useAutoGen ? (
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Sub-task Label <span style={{ fontWeight: 400, textTransform: 'none' }}>(defaults to goal title)</span></label>
                  <input
                    style={inputStyle}
                    value={autoGenLabel}
                    onChange={(e) => setAutoGenLabel(e.target.value)}
                    placeholder="e.g. Cruiser (Maul), Smart Gate, etc."
                  />
                </div>
                <div>
                  <label style={labelStyle}>Quantity *</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={autoGenCount}
                    onChange={(e) => setAutoGenCount(Math.max(1, Number(e.target.value)))}
                    min={1}
                    max={50}
                  />
                </div>
              </div>

              {/* Shared requirements per sub-task */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={labelStyle}>Resources per sub-task</span>
                  <button
                    onClick={addAutoGenReq}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, color: 'var(--accent-indigo)',
                    }}
                  >
                    <Plus size={12} /> Add Resource
                  </button>
                </div>
                {autoGenRequirements.map((req, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 6 }}>
                    <input
                      style={inputStyle}
                      placeholder="Resource (e.g. Foam)"
                      value={req.resource}
                      onChange={(e) => updateAutoGenReq(i, 'resource', e.target.value)}
                    />
                    <input
                      type="number"
                      style={inputStyle}
                      placeholder="Amount"
                      value={req.amount || ''}
                      onChange={(e) => updateAutoGenReq(i, 'amount', e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', fontSize: 12, color: 'var(--text-muted)' }}>
                Preview: Will create <strong style={{ color: 'var(--text-primary)' }}>{autoGenCount}</strong> tasks named{' '}
                <strong style={{ color: 'var(--accent-cyan)' }}>{autoGenLabel || title || '...'} #1</strong> through{' '}
                <strong style={{ color: 'var(--accent-cyan)' }}>{autoGenLabel || title || '...'} #{autoGenCount}</strong>
                {autoGenRequirements.filter((r) => r.resource && r.amount > 0).length > 0 && (
                  <>, each requiring {autoGenRequirements.filter((r) => r.resource && r.amount > 0).map((r) => `${r.amount} ${r.resource}`).join(', ')}</>
                )}
              </div>
            </GlassCard>
          ) : (
            /* Manual task creation */
            <>
              {manualTasks.map((task, i) => (
                <GlassCard key={i} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Task {i + 1}
                    </span>
                    {manualTasks.length > 1 && (
                      <button
                        onClick={() => removeManualTask(i)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-rose)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <input
                    style={inputStyle}
                    placeholder="Task title *"
                    value={task.title}
                    onChange={(e) => updateManualTask(i, 'title', e.target.value)}
                  />
                  <textarea
                    style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                    placeholder="Task description"
                    value={task.description}
                    onChange={(e) => updateManualTask(i, 'description', e.target.value)}
                  />

                  {/* Resource requirements */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Resource Requirements
                      </span>
                      <button
                        onClick={() => addManualRequirement(i)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 12, color: 'var(--accent-indigo)',
                        }}
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                    {task.requirements.map((req, ri) => (
                      <div key={ri} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 6 }}>
                        <input
                          style={inputStyle}
                          placeholder="Resource (e.g. Foam)"
                          value={req.resource}
                          onChange={(e) => updateManualRequirement(i, ri, 'resource', e.target.value)}
                        />
                        <input
                          type="number"
                          style={inputStyle}
                          placeholder="Amount"
                          value={req.amount || ''}
                          onChange={(e) => updateManualRequirement(i, ri, 'amount', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </GlassCard>
              ))}

              <button onClick={addManualTask} style={{ ...btnSecondary, alignSelf: 'flex-start' }}>
                <Plus size={14} /> Add Another Task
              </button>
            </>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} style={btnSecondary}>
            <ArrowLeft size={14} /> Previous
          </button>
        ) : (
          <div />
        )}

        {step < 2 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceedStep1}
            style={{ ...btnPrimary, opacity: canProceedStep1 ? 1 : 0.4 }}
          >
            Next <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceedStep2}
            style={{ ...btnPrimary, opacity: canProceedStep2 ? 1 : 0.4 }}
          >
            <Check size={14} /> Create Goal
          </button>
        )}
      </div>
    </div>
  );
}
