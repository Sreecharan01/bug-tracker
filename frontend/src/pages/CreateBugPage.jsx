import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bugAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CreateBugPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', project: '', priority: 'medium', severity: 'minor',
    type: 'bug', environment: 'development', stepsToReproduce: '',
    expectedBehavior: '', actualBehavior: '', tags: '', assignedTo: '',
    version: '', module: '', estimatedHours: '', dueDate: '',
  });

  useEffect(() => {
    if (isAdmin) {
      userAPI.getAll({ limit: 100 }).then(({ data }) => setUsers(data.data || [])).catch(() => {});
    }
  }, [isAdmin]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        assignedTo: form.assignedTo || undefined,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
        dueDate: form.dueDate || undefined,
        version: form.version || undefined,
        module: form.module || undefined,
      };
      const { data } = await bugAPI.create(payload);
      navigate(`/bugs/${data.data._id}`);
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs.map(e => e.message).join(', ') : err.response?.data?.message || 'Failed to create bug');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <button style={s.back} onClick={() => navigate('/bugs')}>← Back to Bugs</button>
      <h1 style={s.title}>Report New Bug</h1>

      {error && <div style={s.alert}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={s.grid}>
          {/* Left Column */}
          <div style={s.col}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Bug Information</h3>
              <Field label="Title *" name="title" value={form.title} onChange={change} placeholder="Brief, descriptive title" required />
              <Field label="Project *" name="project" value={form.project} onChange={change} placeholder="e.g. Web App, Mobile, API" required />
              <Field label="Description *" name="description" value={form.description} onChange={change}
                placeholder="Detailed description of the bug..." required multiline rows={4} />
              <Field label="Steps to Reproduce" name="stepsToReproduce" value={form.stepsToReproduce} onChange={change}
                placeholder="1. Go to...\n2. Click on...\n3. See error" multiline rows={4} />
              <div style={s.row}>
                <Field label="Expected Behavior" name="expectedBehavior" value={form.expectedBehavior} onChange={change} multiline rows={2} />
                <Field label="Actual Behavior" name="actualBehavior" value={form.actualBehavior} onChange={change} multiline rows={2} />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={s.col}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Classification</h3>
              <SelectField label="Priority *" name="priority" value={form.priority} onChange={change}>
                <option value="critical">🚨 Critical</option>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </SelectField>
              <SelectField label="Severity *" name="severity" value={form.severity} onChange={change}>
                <option value="blocker">Blocker</option>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="trivial">Trivial</option>
              </SelectField>
              <SelectField label="Type *" name="type" value={form.type} onChange={change}>
                <option value="bug">🐛 Bug</option>
                <option value="feature">✨ Feature Request</option>
                <option value="improvement">📈 Improvement</option>
                <option value="task">📋 Task</option>
                <option value="documentation">📄 Documentation</option>
              </SelectField>
              <SelectField label="Environment *" name="environment" value={form.environment} onChange={change}>
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
                <option value="qa">QA</option>
              </SelectField>
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Additional Info</h3>
              <div style={s.row}>
                <Field label="Version" name="version" value={form.version} onChange={change} placeholder="e.g. 2.1.0" />
                <Field label="Module" name="module" value={form.module} onChange={change} placeholder="e.g. Auth" />
              </div>
              <Field label="Tags (comma-separated)" name="tags" value={form.tags} onChange={change} placeholder="mobile, safari, login" />
              <div style={s.row}>
                <Field label="Est. Hours" name="estimatedHours" value={form.estimatedHours} onChange={change} placeholder="4" type="number" />
                <Field label="Due Date" name="dueDate" value={form.dueDate} onChange={change} type="date" />
              </div>
              {isAdmin && users.length > 0 && (
                <SelectField label="Assign To" name="assignedTo" value={form.assignedTo} onChange={change}>
                  <option value="">Unassigned</option>
                  {users.filter(u => u.isActive).map(u => (
                    <option key={u._id} value={u._id}>{u.name} — {u.role}</option>
                  ))}
                </SelectField>
              )}
            </div>
          </div>
        </div>

        <div style={s.actions}>
          <button type="button" style={s.cancelBtn} onClick={() => navigate('/bugs')}>Cancel</button>
          <button type="submit" style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Creating...' : '🐛 Report Bug'}
          </button>
        </div>
      </form>
    </div>
  );
}

const Field = ({ label, name, value, onChange, multiline, rows = 3, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16, flex: 1 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{label}</label>
    {multiline
      ? <textarea name={name} value={value} onChange={onChange} rows={rows} style={s.input} {...rest} />
      : <input name={name} value={value} onChange={onChange} style={s.input} {...rest} />}
  </div>
);
const SelectField = ({ label, name, value, onChange, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{label}</label>
    <select name={name} value={value} onChange={onChange} style={s.input}>{children}</select>
  </div>
);

const s = {
  page: { maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' },
  back: { background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 20, padding: 0 },
  title: { margin: '0 0 24px', fontSize: 26, fontWeight: 700, color: '#e2e8f0' },
  alert: { background: '#450a0a', border: '1px solid #dc2626', color: '#fca5a5', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 },
  col: { display: 'flex', flexDirection: 'column', gap: 20 },
  card: { background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' },
  cardTitle: { margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#e2e8f0' },
  row: { display: 'flex', gap: 16 },
  input: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  cancelBtn: { background: 'none', border: '1px solid #475569', color: '#94a3b8', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  submitBtn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', padding: '10px 28px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
};
