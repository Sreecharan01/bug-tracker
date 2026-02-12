import React, { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';

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
  page: { maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: '#e2e8f0' },
  sub: { margin: '4px 0 0', color: '#64748b', fontSize: 14 },
  newBtn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { background: '#1e293b', borderRadius: 16, padding: 32, width: 460, border: '1px solid #334155' },
  modalTitle: { margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#e2e8f0' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#94a3b8' },
  input: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  saveBtn: { background: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  cancelBtn: { background: 'none', border: '1px solid #475569', color: '#94a3b8', padding: '10px 20px', borderRadius: 8, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  empty: { textAlign: 'center', padding: 48, color: '#64748b' },
  reportCard: { background: '#1e293b', borderRadius: 10, padding: 16, border: '1px solid #334155', cursor: 'pointer', transition: 'border-color 0.15s' },
  reportCardActive: { borderColor: '#6366f1', boxShadow: '0 0 0 1px #6366f1' },
  typeBadge: { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' },
  reportTitle: { margin: '6px 0 4px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  reportDesc: { margin: 0, fontSize: 12, color: '#64748b' },
  reportMeta: { display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: '#475569' },
  deleteBtn: { background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14, padding: '0 4px' },
  detail: { background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' },
  detailTitle: { margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#e2e8f0' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  statCard: { background: '#0f172a', borderRadius: 8, padding: '14px 12px', textAlign: 'center' },
  statVal: { display: 'block', fontSize: 28, fontWeight: 700 },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  avgTime: { marginTop: 16, padding: 14, background: '#0f172a', borderRadius: 8, fontSize: 13, color: '#94a3b8' },
};
