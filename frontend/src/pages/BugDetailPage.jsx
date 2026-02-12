import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bugAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BugDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [bug, setBug] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const [bugRes, usersRes] = await Promise.all([bugAPI.getById(id), userAPI.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } }))]);
        setBug(bugRes.data.data);
        setUsers(usersRes.data.data || []);
      } catch { navigate('/bugs'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id, navigate]);

  const handleUpdate = async (updates) => {
    const { data } = await bugAPI.update(id, updates);
    setBug(data.data);
    setEditing(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await bugAPI.addComment(id, { text: comment });
      const { data } = await bugAPI.getById(id);
      setBug(data.data);
      setComment('');
    } finally { setPosting(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this bug?')) return;
    await bugAPI.delete(id);
    navigate('/bugs');
  };

  if (loading) return <Loader />;
  if (!bug) return null;

  const canEdit = isAdmin || bug.reportedBy?._id === user._id || bug.assignedTo?._id === user._id;

  return (
    <div style={s.page}>
      {/* Back */}
      <button style={s.back} onClick={() => navigate('/bugs')}>← Back to Bugs</button>

      <div style={s.grid}>
        {/* Main */}
        <div style={s.main}>
          <div style={s.card}>
            {/* Header */}
            <div style={s.bugHeader}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={s.bugId}>{bug.bugId}</span>
                <SBadge s={bug.status} />
                <PBadge p={bug.priority} />
              </div>
              {canEdit && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={s.editBtn} onClick={() => { setEditing(true); setEditData({ status: bug.status, priority: bug.priority, assignedTo: bug.assignedTo?._id || '' }); }}>Edit</button>
                  {(isAdmin || bug.reportedBy?._id === user._id) && (
                    <button style={s.deleteBtn} onClick={handleDelete}>Delete</button>
                  )}
                </div>
              )}
            </div>

            <h1 style={s.title}>{bug.title}</h1>

            {/* Edit form */}
            {editing && (
              <div style={s.editForm}>
                <h4 style={s.sectionTitle}>Update Bug</h4>
                <div style={s.editGrid}>
                  <div style={s.field}>
                    <label style={s.label}>Status</label>
                    <select style={s.input} value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}>
                      {['open', 'in_progress', 'resolved', 'closed', 'reopened', 'rejected'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Priority</label>
                    <select style={s.input} value={editData.priority} onChange={e => setEditData(d => ({ ...d, priority: e.target.value }))}>
                      {['critical', 'high', 'medium', 'low'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  {isAdmin && (
                    <div style={s.field}>
                      <label style={s.label}>Assign To</label>
                      <select style={s.input} value={editData.assignedTo} onChange={e => setEditData(d => ({ ...d, assignedTo: e.target.value || null }))}>
                        <option value="">Unassigned</option>
                        {users.filter(u => u.isActive).map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button style={s.saveBtn} onClick={() => handleUpdate(editData)}>Save Changes</button>
                  <button style={s.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div style={s.divider} />
            <h4 style={s.sectionTitle}>Description</h4>
            <p style={s.desc}>{bug.description}</p>

            {bug.stepsToReproduce && <>
              <h4 style={s.sectionTitle}>Steps to Reproduce</h4>
              <pre style={s.pre}>{bug.stepsToReproduce}</pre>
            </>}

            {(bug.expectedBehavior || bug.actualBehavior) && (
              <div style={s.twoCol}>
                {bug.expectedBehavior && <div><h4 style={s.sectionTitle}>Expected</h4><p style={s.desc}>{bug.expectedBehavior}</p></div>}
                {bug.actualBehavior && <div><h4 style={s.sectionTitle}>Actual</h4><p style={{ ...s.desc, color: '#fca5a5' }}>{bug.actualBehavior}</p></div>}
              </div>
            )}

            {bug.resolution && <>
              <h4 style={s.sectionTitle}>Resolution</h4>
              <p style={{ ...s.desc, color: '#86efac' }}>{bug.resolution}</p>
            </>}

            {/* Tags */}
            {bug.tags?.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {bug.tags.map(t => <span key={t} style={s.tag}>{t}</span>)}
              </div>
            )}
          </div>

          {/* Comments */}
          <div style={s.card}>
            <h4 style={s.sectionTitle}>Comments ({bug.comments?.length || 0})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {bug.comments?.map((c) => (
                <div key={c._id} style={s.commentItem}>
                  <div style={s.commentHeader}>
                    <div style={{ ...s.avatar, background: '#6366f1' }}>{c.user?.name?.[0]}</div>
                    <span style={s.commentAuthor}>{c.user?.name}</span>
                    <span style={s.commentDate}>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={s.commentText}>{c.text}</p>
                </div>
              ))}
              {!bug.comments?.length && <p style={{ color: '#475569', fontSize: 13 }}>No comments yet.</p>}
            </div>
            <form onSubmit={handleComment} style={{ display: 'flex', gap: 10 }}>
              <textarea style={s.commentInput} placeholder="Add a comment..." value={comment}
                onChange={e => setComment(e.target.value)} rows={3} />
              <button type="submit" style={{ ...s.saveBtn, alignSelf: 'flex-end', whiteSpace: 'nowrap' }} disabled={posting}>
                {posting ? '...' : 'Post'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div style={s.sidebar}>
          <div style={s.card}>
            <h4 style={s.sectionTitle}>Details</h4>
            {[
              ['Project', bug.project],
              ['Type', bug.type],
              ['Severity', bug.severity],
              ['Environment', bug.environment],
              ['Version', bug.version || '—'],
              ['Module', bug.module || '—'],
              ['Est. Hours', bug.estimatedHours || '—'],
              ['Actual Hours', bug.actualHours || '—'],
            ].map(([k, v]) => (
              <div key={k} style={s.detailRow}>
                <span style={s.detailLabel}>{k}</span>
                <span style={s.detailVal}>{v}</span>
              </div>
            ))}
          </div>

          <div style={s.card}>
            <h4 style={s.sectionTitle}>People</h4>
            <PersonRow label="Reported by" user={bug.reportedBy} />
            <PersonRow label="Assigned to" user={bug.assignedTo} empty="Unassigned" />
            {bug.resolvedBy && <PersonRow label="Resolved by" user={bug.resolvedBy} />}
          </div>

          <div style={s.card}>
            <h4 style={s.sectionTitle}>Dates</h4>
            {[
              ['Created', bug.createdAt],
              ['Updated', bug.updatedAt],
              ['Due Date', bug.dueDate],
              ['Resolved', bug.resolvedAt],
              ['Closed', bug.closedAt],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={s.detailRow}>
                <span style={s.detailLabel}>{k}</span>
                <span style={s.detailVal}>{new Date(v).toLocaleDateString()}</span>
              </div>
            ))}
          </div>

          {/* History */}
          {bug.history?.length > 0 && (
            <div style={s.card}>
              <h4 style={s.sectionTitle}>History</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bug.history.slice(-5).reverse().map((h, i) => (
                  <div key={i} style={s.historyItem}>
                    <span style={s.historyField}>{h.field}</span>
                    <span style={s.historyChange}>
                      <span style={{ color: '#ef4444' }}>{String(h.oldValue)}</span>
                      {' → '}
                      <span style={{ color: '#22c55e' }}>{String(h.newValue)}</span>
                    </span>
                    <span style={s.historyDate}>{new Date(h.changedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const PersonRow = ({ label, user, empty = '' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
    <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
    {user ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
          {user.name?.[0]}
        </div>
        <span style={{ fontSize: 13, color: '#cbd5e1' }}>{user.name}</span>
      </div>
    ) : <span style={{ fontSize: 12, color: '#475569' }}>{empty}</span>}
  </div>
);

const SBadge = ({ s }) => {
  const map = { open: ['#1e1b4b', '#818cf8'], in_progress: ['#172554', '#60a5fa'], resolved: ['#052e16', '#4ade80'], closed: ['#1e293b', '#64748b'], reopened: ['#450a0a', '#f87171'], rejected: ['#1c1917', '#a8a29e'] };
  const [bg, fg] = map[s] || ['#1e293b', '#94a3b8'];
  return <span style={{ background: bg, color: fg, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{s?.replace('_', ' ')}</span>;
};
const PBadge = ({ p }) => {
  const map = { critical: ['#450a0a', '#ef4444'], high: ['#431407', '#f97316'], medium: ['#422006', '#eab308'], low: ['#052e16', '#22c55e'] };
  const [bg, fg] = map[p] || ['#1e293b', '#94a3b8'];
  return <span style={{ background: bg, color: fg, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{p}</span>;
};
const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
    <div style={{ width: 40, height: 40, border: '3px solid #334155', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const s = {
  page: { maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' },
  back: { background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 20, padding: 0 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' },
  main: { display: 'flex', flexDirection: 'column', gap: 20 },
  sidebar: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' },
  bugHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bugId: { color: '#6366f1', fontWeight: 700, fontSize: 14, fontFamily: 'monospace' },
  title: { margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.4 },
  editForm: { background: '#0f172a', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid #334155' },
  editGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  input: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' },
  label: { fontSize: 12, fontWeight: 600, color: '#94a3b8' },
  divider: { height: 1, background: '#334155', margin: '16px 0' },
  sectionTitle: { margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  desc: { margin: 0, color: '#cbd5e1', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  pre: { margin: 0, color: '#cbd5e1', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', background: '#0f172a', borderRadius: 8, padding: 16 },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 },
  tag: { background: '#1e3a5f', color: '#7dd3fc', fontSize: 11, padding: '2px 8px', borderRadius: 4 },
  commentItem: { background: '#0f172a', borderRadius: 8, padding: 12, border: '1px solid #334155' },
  commentHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  avatar: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' },
  commentAuthor: { fontWeight: 600, fontSize: 13, color: '#e2e8f0' },
  commentDate: { color: '#475569', fontSize: 11, marginLeft: 'auto' },
  commentText: { margin: 0, color: '#94a3b8', fontSize: 13, lineHeight: 1.6 },
  commentInput: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', flex: 1 },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #0f172a' },
  detailLabel: { fontSize: 12, color: '#64748b' },
  detailVal: { fontSize: 13, color: '#cbd5e1', textTransform: 'capitalize' },
  historyItem: { display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 0', borderBottom: '1px solid #334155' },
  historyField: { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' },
  historyChange: { fontSize: 12, color: '#cbd5e1' },
  historyDate: { fontSize: 11, color: '#475569' },
  saveBtn: { background: '#6366f1', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  cancelBtn: { background: 'none', border: '1px solid #475569', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  editBtn: { background: '#334155', color: '#e2e8f0', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  deleteBtn: { background: '#450a0a', color: '#ef4444', border: '1px solid #7f1d1d', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
};
