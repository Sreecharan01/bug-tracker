import React, { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';
import { THEME } from '../theme/designSystem';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'summary', description: '' });

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await reportAPI.getAll();
      setReports(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const { data } = await reportAPI.generate(form);
      setReports([data.data, ...reports]);
      setShowNew(false);
      setSelected(data.data);
      setForm({ title: '', type: 'summary', description: '' });
    } catch (err) { console.error(err); }
    finally { setGenerating(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    await reportAPI.delete(id);
    setReports(reports.filter(r => r._id !== id));
    if (selected?._id === id) setSelected(null);
  };

  const TYPE_COLORS = { summary: '#6366f1', detailed: '#3b82f6', trend: '#10b981', assignment: '#f59e0b', project: '#8b5cf6', custom: '#64748b' };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div><h1 style={s.title}>Reports</h1><p style={s.sub}>{reports.length} reports</p></div>
        <button style={s.newBtn} onClick={() => setShowNew(true)}>+ Generate Report</button>
      </div>

      {showNew && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h3 style={s.modalTitle}>Generate New Report</h3>
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={s.field}>
                <label style={s.label}>Report Title *</label>
                <input style={s.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Q4 Bug Summary" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Report Type *</label>
                <select style={s.input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {['summary', 'detailed', 'trend', 'assignment', 'project', 'custom'].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Description</label>
                <textarea style={s.input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional description" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowNew(false)}>Cancel</button>
                <button type="submit" style={s.saveBtn} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={s.grid}>
        {/* List */}
        <div style={s.list}>
          {loading ? <p style={{ color: '#64748b', textAlign: 'center', padding: 32 }}>Loading...</p>
            : reports.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <p>No reports yet.</p>
                <button style={s.newBtn} onClick={() => setShowNew(true)}>Generate First Report</button>
              </div>
            ) : reports.map((r) => (
              <div key={r._id} style={{ ...s.reportCard, ...(selected?._id === r._id ? s.reportCardActive : {}) }}
                onClick={() => setSelected(r)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ ...s.typeBadge, background: TYPE_COLORS[r.type] + '22', color: TYPE_COLORS[r.type] }}>{r.type}</span>
                    <h4 style={s.reportTitle}>{r.title}</h4>
                    {r.description && <p style={s.reportDesc}>{r.description}</p>}
                  </div>
                  <button style={s.deleteBtn} onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }}>✕</button>
                </div>
                <div style={s.reportMeta}>
                  <span>By {r.generatedBy?.name}</span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
        </div>

        {/* Detail */}
        {selected && (
          <div style={s.detail}>
            <h3 style={s.detailTitle}>{selected.title}</h3>
            <div style={s.statsGrid}>
              {[
                ['Total Bugs', selected.data?.totalBugs || 0, '#6366f1'],
                ['Open', selected.data?.openBugs || 0, '#ef4444'],
                ['Resolved', selected.data?.resolvedBugs || 0, '#10b981'],
                ['Closed', selected.data?.closedBugs || 0, '#64748b'],
                ['Critical', selected.data?.criticalBugs || 0, '#dc2626'],
                ['High', selected.data?.highBugs || 0, '#f97316'],
                ['Medium', selected.data?.mediumBugs || 0, '#eab308'],
                ['Low', selected.data?.lowBugs || 0, '#22c55e'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ ...s.statCard, borderTop: `2px solid ${color}` }}>
                  <span style={{ ...s.statVal, color }}>{val}</span>
                  <span style={s.statLabel}>{label}</span>
                </div>
              ))}
            </div>
            {selected.data?.avgResolutionTime > 0 && (
              <div style={s.avgTime}>
                Avg Resolution Time: <strong>{Math.round(selected.data.avgResolutionTime / 3600000)} hours</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { maxWidth: 1200, margin: '0 auto', fontFamily: THEME.Typography.fontFamily },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.xl },
  title: { margin: 0, fontSize: THEME.Typography.fontSize['2xl'], fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900] },
  sub: { margin: `${THEME.spacing.sm}px 0 0`, color: THEME.colors.gray[500], fontSize: THEME.Typography.fontSize.base },
  newBtn: { background: THEME.colors.blue[500], color: THEME.colors.white, border: 'none', padding: `${THEME.spacing.md}px ${THEME.spacing.lg}px`, borderRadius: THEME.borderRadius.md, cursor: 'pointer', fontWeight: THEME.Typography.fontWeight.semibold },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { background: THEME.colors.white, borderRadius: THEME.borderRadius.xl, padding: THEME.spacing['2xl'], width: 460, border: `1px solid ${THEME.colors.gray[200]}`, boxShadow: THEME.shadows.xl },
  modalTitle: { margin: `0 0 ${THEME.spacing.lg}px`, fontSize: THEME.Typography.fontSize.lg, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900] },
  field: { display: 'flex', flexDirection: 'column', gap: THEME.spacing.sm },
  label: { fontSize: THEME.Typography.fontSize.sm, fontWeight: THEME.Typography.fontWeight.semibold, color: THEME.colors.gray[700] },
  input: { background: THEME.colors.white, border: `1px solid ${THEME.colors.gray[300]}`, borderRadius: THEME.borderRadius.md, padding: THEME.spacing.md, color: THEME.colors.gray[900], fontSize: THEME.Typography.fontSize.sm, outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  saveBtn: { background: THEME.colors.blue[500], color: THEME.colors.white, border: 'none', padding: `${THEME.spacing.md}px ${THEME.spacing.lg}px`, borderRadius: THEME.borderRadius.md, cursor: 'pointer', fontWeight: THEME.Typography.fontWeight.semibold },
  cancelBtn: { background: 'none', border: `1px solid ${THEME.colors.gray[300]}`, color: THEME.colors.gray[700], padding: `${THEME.spacing.md}px ${THEME.spacing.lg}px`, borderRadius: THEME.borderRadius.md, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '380px 1fr', gap: THEME.spacing.xl, alignItems: 'start' },
  list: { display: 'flex', flexDirection: 'column', gap: THEME.spacing.md },
  empty: { textAlign: 'center', padding: THEME.spacing['2xl'], color: THEME.colors.gray[500] },
  reportCard: { background: THEME.colors.white, borderRadius: THEME.borderRadius.lg, padding: THEME.spacing.md, border: `1px solid ${THEME.colors.gray[200]}`, cursor: 'pointer', transition: `border-color ${THEME.transitions.fast}`, boxShadow: THEME.shadows.sm },
  reportCardActive: { borderColor: THEME.colors.blue[500], boxShadow: `0 0 0 1px ${THEME.colors.blue[500]}` },
  typeBadge: { fontSize: THEME.Typography.fontSize.xs, fontWeight: THEME.Typography.fontWeight.bold, padding: `${THEME.spacing.xs}px ${THEME.spacing.sm}px`, borderRadius: THEME.borderRadius.full, textTransform: 'capitalize', background: THEME.colors.blue[100], color: THEME.colors.blue[700] },
  reportTitle: { margin: `${THEME.spacing.sm}px 0 ${THEME.spacing.xs}px`, fontSize: THEME.Typography.fontSize.base, fontWeight: THEME.Typography.fontWeight.semibold, color: THEME.colors.gray[900] },
  reportDesc: { margin: 0, fontSize: THEME.Typography.fontSize.sm, color: THEME.colors.gray[600] },
  reportMeta: { display: 'flex', gap: THEME.spacing.lg, marginTop: THEME.spacing.md, fontSize: THEME.Typography.fontSize.xs, color: THEME.colors.gray[500] },
  deleteBtn: { background: 'none', border: 'none', color: THEME.colors.gray[500], cursor: 'pointer', fontSize: THEME.Typography.fontSize.base, padding: `0 ${THEME.spacing.sm}px` },
  detail: { background: THEME.colors.white, borderRadius: THEME.borderRadius.lg, padding: THEME.spacing.xl, border: `1px solid ${THEME.colors.gray[200]}`, boxShadow: THEME.shadows.sm },
  detailTitle: { margin: `0 0 ${THEME.spacing.lg}px`, fontSize: THEME.Typography.fontSize.lg, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900] },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: THEME.spacing.md },
  statCard: { background: THEME.colors.white, borderRadius: THEME.borderRadius.lg, padding: `${THEME.spacing.md}px ${THEME.spacing.sm}px`, textAlign: 'center', border: `1px solid ${THEME.colors.gray[200]}`, boxShadow: THEME.shadows.sm },
  statVal: { display: 'block', fontSize: THEME.Typography.fontSize['3xl'], fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900] },
  statLabel: { fontSize: THEME.Typography.fontSize.xs, color: THEME.colors.gray[600], marginTop: THEME.spacing.sm },
  avgTime: { marginTop: THEME.spacing.lg, padding: THEME.spacing.md, background: THEME.colors.blue[50], borderRadius: THEME.borderRadius.lg, fontSize: THEME.Typography.fontSize.sm, color: THEME.colors.gray[700], border: `1px solid ${THEME.colors.blue[200]}` },
};
