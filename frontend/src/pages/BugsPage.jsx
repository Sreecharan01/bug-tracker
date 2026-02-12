import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bugAPI } from '../services/api';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'reopened', 'rejected'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];

export default function BugsPage() {
  const navigate = useNavigate();
  const [bugs, setBugs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', project: '' });
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchBugs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const { data } = await bugAPI.getAll(params);
      setBugs(data.data || []);
      setTotal(data.meta?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchBugs(); }, [fetchBugs]);

  const handleFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Bug Tracker</h1>
          <p style={s.sub}>{total} total bugs</p>
        </div>
        <button style={s.newBtn} onClick={() => navigate('/bugs/new')}>+ Report Bug</button>
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <input style={s.search} placeholder="🔍 Search bugs..." value={filters.search}
          onChange={e => handleFilter('search', e.target.value)} />
        <input style={s.input} placeholder="Project name" value={filters.project}
          onChange={e => handleFilter('project', e.target.value)} />
        <select style={s.select} value={filters.status} onChange={e => handleFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select style={s.select} value={filters.priority} onChange={e => handleFilter('priority', e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filters.status || filters.priority || filters.search || filters.project) && (
          <button style={s.clearBtn} onClick={() => { setFilters({ status: '', priority: '', search: '', project: '' }); setPage(1); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={s.tableBox}>
        {loading ? (
          <div style={s.loader}><Spinner /></div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Bug ID', 'Title', 'Project', 'Priority', 'Severity', 'Status', 'Assigned To', 'Created'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bugs.map((bug) => (
                <tr key={bug._id} style={s.tr} onClick={() => navigate(`/bugs/${bug._id}`)}>
                  <td style={s.td}><span style={s.bugId}>{bug.bugId}</span></td>
                  <td style={{ ...s.td, maxWidth: 260 }}>
                    <span style={s.bugTitle}>{bug.title}</span>
                    {bug.tags?.length > 0 && (
                      <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {bug.tags.slice(0, 3).map(t => <span key={t} style={s.tag}>{t}</span>)}
                      </div>
                    )}
                  </td>
                  <td style={s.td}><span style={s.project}>{bug.project}</span></td>
                  <td style={s.td}><PBadge p={bug.priority} /></td>
                  <td style={s.td}><span style={s.severity}>{bug.severity}</span></td>
                  <td style={s.td}><SBadge s={bug.status} /></td>
                  <td style={s.td}>
                    {bug.assignedTo ? (
                      <div style={s.assignee}>
                        <div style={{ ...s.avatar, background: '#6366f1' }}>{bug.assignedTo.name?.[0]}</div>
                        <span>{bug.assignedTo.name}</span>
                      </div>
                    ) : <span style={{ color: '#475569' }}>Unassigned</span>}
                  </td>
                  <td style={s.td}>{new Date(bug.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {bugs.length === 0 && (
                <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', color: '#475569', padding: 48 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🐛</div>
                  No bugs found. {Object.values(filters).some(v => v) ? 'Try adjusting your filters.' : 'Report the first one!'}
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={s.pagination}>
          <button style={{ ...s.pageBtn, opacity: page <= 1 ? 0.4 : 1 }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>← Prev</button>
          <span style={s.pageInfo}>Page {page} of {totalPages} ({total} total)</span>
          <button style={{ ...s.pageBtn, opacity: page >= totalPages ? 0.4 : 1 }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next →</button>
        </div>
      )}
    </div>
  );
}

const PBadge = ({ p }) => {
  const map = { critical: ['#450a0a', '#ef4444'], high: ['#431407', '#f97316'], medium: ['#422006', '#eab308'], low: ['#052e16', '#22c55e'] };
  const [bg, fg] = map[p] || ['#1e293b', '#94a3b8'];
  return <span style={{ background: bg, color: fg, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{p}</span>;
};
const SBadge = ({ s }) => {
  const map = { open: ['#1e1b4b', '#818cf8'], in_progress: ['#172554', '#60a5fa'], resolved: ['#052e16', '#4ade80'], closed: ['#1e293b', '#64748b'], reopened: ['#450a0a', '#f87171'], rejected: ['#1c1917', '#a8a29e'] };
  const [bg, fg] = map[s] || ['#1e293b', '#94a3b8'];
  return <span style={{ background: bg, color: fg, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{s?.replace('_', ' ')}</span>;
};
const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
    <div style={{ width: 36, height: 36, border: '3px solid #334155', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const s = {
  page: { maxWidth: 1400, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: '#e2e8f0' },
  sub: { margin: '4px 0 0', color: '#64748b', fontSize: 14 },
  newBtn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  filters: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  search: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '9px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', flex: '1 1 220px', minWidth: 180 },
  input: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '9px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', width: 160 },
  select: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '9px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', cursor: 'pointer' },
  clearBtn: { background: 'none', border: '1px solid #475569', color: '#94a3b8', padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  tableBox: { background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'auto' },
  loader: { padding: 48 },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #334155', whiteSpace: 'nowrap' },
  tr: { cursor: 'pointer', transition: 'background 0.1s' },
  td: { padding: '12px 16px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid #1e293b' },
  bugId: { color: '#6366f1', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' },
  bugTitle: { fontWeight: 500, color: '#e2e8f0', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 },
  tag: { background: '#1e3a5f', color: '#7dd3fc', fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 500 },
  project: { color: '#94a3b8' },
  severity: { color: '#64748b', textTransform: 'capitalize', fontSize: 12 },
  assignee: { display: 'flex', alignItems: 'center', gap: 8 },
  avatar: { width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 },
  pageBtn: { background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  pageInfo: { color: '#64748b', fontSize: 13 },
};
