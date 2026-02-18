import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bugAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { THEME } from '../theme/designSystem';

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

            <h4 style={s.sectionTitle}>Attachments / Screenshots</h4>
            {bug.attachments?.length ? (
              <div style={s.attachments}>
                {bug.attachments.map((file) => {
                  const isImage = file.mimetype?.startsWith('image/');
                  return (
                    <div key={file._id || file.url || file.filename} style={s.attachmentCard}>
                      {isImage && file.url ? (
                        <img src={file.url} alt={file.originalName || file.filename || 'attachment'} style={s.attachmentImage} />
                      ) : (
                        <div style={s.attachmentPlaceholder}>📎</div>
                      )}
                      <div style={s.attachmentMeta}>
                        <span style={s.attachmentName}>{file.originalName || file.filename || 'Attachment'}</span>
                        {file.url && (
                          <a href={file.url} target="_blank" rel="noreferrer" style={s.attachmentLink}>
                            Open
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={s.desc}>No attachments available.</p>
            )}

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
      <div style={{ display: 'flex', alignItems: 'center', gap: THEME.spacing.sm }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: THEME.colors.blue[500],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: THEME.Typography.fontSize.xs,
            fontWeight: THEME.Typography.fontWeight.bold,
            color: THEME.colors.white,
          }}
        >
          {user.name?.[0]}
        </div>
        <span style={{ fontSize: THEME.Typography.fontSize.sm, color: THEME.colors.gray[700] }}>{user.name}</span>
      </div>
    ) : (
      <span style={{ fontSize: THEME.Typography.fontSize.xs, color: THEME.colors.gray[400] }}>{empty}</span>
    )}
  </div>
);

const SBadge = ({ s }) => {
  const map = {
    open: { bg: '#DBEAFE', fg: '#0C4A6E' },
    in_progress: { bg: '#BFDBFE', fg: '#0C2D57' },
    resolved: { bg: '#DCFCE7', fg: '#15803D' },
    closed: { bg: '#E5E7EB', fg: '#374151' },
    reopened: { bg: '#FEE2E2', fg: '#7C2D12' },
    rejected: { bg: '#F3E8FF', fg: '#581C87' },
  };
  const { bg, fg } = map[s] || { bg: THEME.colors.gray[100], fg: THEME.colors.gray[700] };
  return (
    <span style={{ background: bg, color: fg, padding: `${THEME.spacing.xs}px ${THEME.spacing.md}px`, borderRadius: THEME.borderRadius.full, fontSize: THEME.Typography.fontSize.sm, fontWeight: THEME.Typography.fontWeight.semibold, textTransform: 'capitalize' }}>
      {s?.replace('_', ' ')}
    </span>
  );
};

const PBadge = ({ p }) => {
  const map = {
    critical: { bg: '#FEE2E2', fg: '#991B1B' },
    high: { bg: '#FEF3C7', fg: '#92400E' },
    medium: { bg: '#FEF08A', fg: '#713F12' },
    low: { bg: '#DCFCE7', fg: '#15803D' },
  };
  const { bg, fg } = map[p] || { bg: THEME.colors.gray[100], fg: THEME.colors.gray[700] };
  return (
    <span style={{ background: bg, color: fg, padding: `${THEME.spacing.xs}px ${THEME.spacing.md}px`, borderRadius: THEME.borderRadius.full, fontSize: THEME.Typography.fontSize.sm, fontWeight: THEME.Typography.fontWeight.bold, textTransform: 'capitalize' }}>
      {p}
    </span>
  );
};

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: THEME.spacing['3xl'] }}>
    <div
      style={{
        width: 40,
        height: 40,
        border: `3px solid ${THEME.colors.gray[300]}`,
        borderTopColor: THEME.colors.blue[500],
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const s = {
  page: { maxWidth: 1200, margin: '0 auto', fontFamily: THEME.Typography.fontFamily },
  back: { background: 'none', border: 'none', color: THEME.colors.blue[600], cursor: 'pointer', fontSize: THEME.Typography.fontSize.sm, fontWeight: THEME.Typography.fontWeight.semibold, marginBottom: THEME.spacing.xl, padding: 0 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: THEME.spacing.xl, alignItems: 'start' },
  main: { display: 'flex', flexDirection: 'column', gap: THEME.spacing.xl },
  sidebar: { display: 'flex', flexDirection: 'column', gap: THEME.spacing.lg },
  card: { background: THEME.colors.white, borderRadius: THEME.borderRadius.lg, padding: THEME.spacing.xl, border: `1px solid ${THEME.colors.gray[200]}`, boxShadow: THEME.shadows.sm },
  bugHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.md },
  bugId: { color: THEME.colors.blue[600], fontWeight: THEME.Typography.fontWeight.bold, fontSize: THEME.Typography.fontSize.base, fontFamily: 'monospace' },
  title: { margin: `0 0 ${THEME.spacing.lg}px`, fontSize: THEME.Typography.fontSize.xl, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900], lineHeight: 1.4 },
  editForm: { background: THEME.colors.gray[50], borderRadius: THEME.borderRadius.lg, padding: THEME.spacing.lg, marginBottom: THEME.spacing.md, border: `1px solid ${THEME.colors.gray[200]}` },
  editGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: THEME.spacing.md },
  field: { display: 'flex', flexDirection: 'column', gap: THEME.spacing.sm },
  input: { background: THEME.colors.white, border: `1px solid ${THEME.colors.gray[300]}`, borderRadius: THEME.borderRadius.md, padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`, color: THEME.colors.gray[900], fontSize: THEME.Typography.fontSize.sm, outline: 'none' },
  label: { fontSize: THEME.Typography.fontSize.xs, fontWeight: THEME.Typography.fontWeight.semibold, color: THEME.colors.gray[700] },
  divider: { height: 1, background: THEME.colors.gray[200], margin: `${THEME.spacing.lg}px 0` },
  sectionTitle: { margin: `0 0 ${THEME.spacing.md}px`, fontSize: THEME.Typography.fontSize.sm, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[600], textTransform: 'uppercase', letterSpacing: 0.5 },
  desc: { margin: 0, color: THEME.colors.gray[700], fontSize: THEME.Typography.fontSize.base, lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  pre: { margin: 0, color: THEME.colors.gray[700], fontSize: THEME.Typography.fontSize.sm, lineHeight: 1.8, whiteSpace: 'pre-wrap', background: THEME.colors.gray[50], borderRadius: THEME.borderRadius.md, padding: THEME.spacing.md },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg, marginTop: THEME.spacing.lg },
  attachments: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: THEME.spacing.md, marginBottom: THEME.spacing.md },
  attachmentCard: { border: `1px solid ${THEME.colors.gray[200]}`, borderRadius: THEME.borderRadius.md, overflow: 'hidden', background: THEME.colors.white },
  attachmentImage: { width: '100%', height: 120, objectFit: 'cover', display: 'block' },
  attachmentPlaceholder: { height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, background: THEME.colors.gray[100] },
  attachmentMeta: { padding: THEME.spacing.sm, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: THEME.spacing.sm },
  attachmentName: { fontSize: THEME.Typography.fontSize.xs, color: THEME.colors.gray[700], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  attachmentLink: { fontSize: THEME.Typography.fontSize.xs, color: THEME.colors.blue[600], textDecoration: 'none' },
  tag: { background: THEME.colors.blue[100], color: THEME.colors.blue[700], fontSize: THEME.Typography.fontSize.xs, padding: `${THEME.spacing.xs}px ${THEME.spacing.sm}px`, borderRadius: THEME.borderRadius.sm },
  commentItem: { background: THEME.colors.gray[50], borderRadius: THEME.borderRadius.md, padding: THEME.spacing.md, border: `1px solid ${THEME.colors.gray[200]}` },
  commentHeader: { display: 'flex', alignItems: 'center', gap: THEME.spacing.md, marginBottom: THEME.spacing.md },
  avatar: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: THEME.Typography.fontSize.xs, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.white, background: THEME.colors.blue[500] },
  commentAuthor: { fontWeight: THEME.Typography.fontWeight.semibold, fontSize: THEME.Typography.fontSize.sm, color: THEME.colors.gray[900] },
  commentDate: { color: THEME.colors.gray[500], fontSize: THEME.Typography.fontSize.xs, marginLeft: 'auto' },
  commentText: { margin: 0, color: THEME.colors.gray[700], fontSize: THEME.Typography.fontSize.sm, lineHeight: 1.6 },
  commentInput: { background: THEME.colors.white, border: `1px solid ${THEME.colors.gray[300]}`, borderRadius: THEME.borderRadius.md, padding: THEME.spacing.md, color: THEME.colors.gray[900], fontSize: THEME.Typography.fontSize.sm, outline: 'none', resize: 'vertical', flex: 1 },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${THEME.spacing.sm}px 0`, borderBottom: `1px solid ${THEME.colors.gray[200]}` },
  detailLabel: { fontSize: THEME.Typography.fontSize.xs, color: THEME.colors.gray[600] },
  detailVal: { fontSize: THEME.Typography.fontSize.sm, color: THEME.colors.gray[700], textTransform: 'capitalize' },
  historyItem: { display: 'flex', flexDirection: 'column', gap: THEME.spacing.xs, padding: THEME.spacing.md, borderBottom: `1px solid ${THEME.colors.gray[200]}` },
  historyField: { fontSize: THEME.Typography.fontSize.xs, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[600], textTransform: 'uppercase' },
  historyChange: { fontSize: THEME.Typography.fontSize.sm, color: THEME.colors.gray[700] },
  historyDate: { fontSize: THEME.Typography.fontSize.xs, color: THEME.colors.gray[500] },
  saveBtn: { background: THEME.colors.blue[500], color: THEME.colors.white, border: 'none', padding: `${THEME.spacing.sm}px ${THEME.spacing.lg}px`, borderRadius: THEME.borderRadius.md, cursor: 'pointer', fontWeight: THEME.Typography.fontWeight.semibold, fontSize: THEME.Typography.fontSize.sm },
  cancelBtn: { background: 'none', border: `1px solid ${THEME.colors.gray[300]}`, color: THEME.colors.gray[700], padding: `${THEME.spacing.sm}px ${THEME.spacing.lg}px`, borderRadius: THEME.borderRadius.md, cursor: 'pointer', fontSize: THEME.Typography.fontSize.sm },
  editBtn: { background: THEME.colors.gray[200], color: THEME.colors.gray[800], border: 'none', padding: `${THEME.spacing.sm - 1}px ${THEME.spacing.lg}px`, borderRadius: THEME.borderRadius.md, cursor: 'pointer', fontSize: THEME.Typography.fontSize.sm },
  deleteBtn: { background: '#FEE2E2', color: '#991B1B', border: `1px solid #FECACA`, padding: `${THEME.spacing.sm - 1}px ${THEME.spacing.lg}px`, borderRadius: THEME.borderRadius.md, cursor: 'pointer', fontSize: THEME.Typography.fontSize.sm },
};
