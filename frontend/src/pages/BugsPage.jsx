import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bugAPI } from '../services/api';
import { THEME } from '../theme/designSystem';

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
        <button style={s.newBtn} onClick={() => navigate('/bugs/create')}>+ Report Bug</button>
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
  const map = {
    critical: { bg: '#FEE2E2', fg: '#991B1B' },
    high: { bg: '#FEF3C7', fg: '#92400E' },
    medium: { bg: '#FEF08A', fg: '#713F12' },
    low: { bg: '#DCFCE7', fg: '#15803D' },
  };
  const { bg, fg } = map[p] || { bg: THEME.colors.gray[100], fg: THEME.colors.gray[700] };
  return (
    <span style={{ background: bg, color: fg, padding: `${THEME.spacing.xs}px ${THEME.spacing.md}px`, borderRadius: THEME.borderRadius.full, fontSize: THEME.Typography.fontSize.xs, fontWeight: THEME.Typography.fontWeight.bold, textTransform: 'capitalize' }}>
      {p}
    </span>
  );
};

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
    <span style={{ background: bg, color: fg, padding: `${THEME.spacing.xs}px ${THEME.spacing.md}px`, borderRadius: THEME.borderRadius.full, fontSize: THEME.Typography.fontSize.xs, fontWeight: THEME.Typography.fontWeight.semibold, textTransform: 'capitalize' }}>
      {s?.replace('_', ' ')}
    </span>
  );
};

const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: THEME.spacing['2xl'] }}>
    <div style={{ width: 36, height: 36, border: `3px solid ${THEME.colors.gray[300]}`, borderTopColor: THEME.colors.blue[500], borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const s = {
  page: { maxWidth: 1400, margin: '0 auto', fontFamily: THEME.Typography.fontFamily },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.xl },
  title: { margin: 0, fontSize: THEME.Typography.fontSize['2xl'], fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900] },
  sub: { margin: `${THEME.spacing.sm}px 0 0`, color: THEME.colors.gray[500], fontSize: THEME.Typography.fontSize.base },
  newBtn: {
    background: THEME.colors.blue[500],
    color: THEME.colors.white,
    border: 'none',
    padding: `${THEME.spacing.sm}px ${THEME.spacing.lg}px`,
    borderRadius: THEME.borderRadius.md,
    cursor: 'pointer',
    fontWeight: THEME.Typography.fontWeight.semibold,
    transition: `all ${THEME.transitions.fast}`,
  },
  filters: { display: 'flex', gap: THEME.spacing.md, marginBottom: THEME.spacing.lg, flexWrap: 'wrap', alignItems: 'center' },
  search: {
    background: THEME.colors.white,
    border: `1px solid ${THEME.colors.gray[300]}`,
    borderRadius: THEME.borderRadius.md,
    padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`,
    color: THEME.colors.gray[900],
    fontSize: THEME.Typography.fontSize.sm,
    outline: 'none',
    flex: '1 1 220px',
    minWidth: 180,
  },
  input: {
    background: THEME.colors.white,
    border: `1px solid ${THEME.colors.gray[300]}`,
    borderRadius: THEME.borderRadius.md,
    padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`,
    color: THEME.colors.gray[900],
    fontSize: THEME.Typography.fontSize.sm,
    outline: 'none',
    width: 160,
  },
  select: {
    background: THEME.colors.white,
    border: `1px solid ${THEME.colors.gray[300]}`,
    borderRadius: THEME.borderRadius.md,
    padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`,
    color: THEME.colors.gray[900],
    fontSize: THEME.Typography.fontSize.sm,
    outline: 'none',
    cursor: 'pointer',
  },
  clearBtn: { background: 'none', border: `1px solid ${THEME.colors.gray[300]}`, color: THEME.colors.gray[600], padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`, borderRadius: THEME.borderRadius.md, cursor: 'pointer', fontSize: THEME.Typography.fontSize.sm },
  tableBox: { background: THEME.colors.white, borderRadius: THEME.borderRadius.lg, border: `1px solid ${THEME.colors.gray[200]}`, overflow: 'auto', boxShadow: THEME.shadows.sm },
  loader: { padding: THEME.spacing['2xl'] },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  th: {
    padding: THEME.spacing.md,
    textAlign: 'left',
    fontSize: THEME.Typography.fontSize.xs,
    fontWeight: THEME.Typography.fontWeight.bold,
    color: THEME.colors.gray[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: `1px solid ${THEME.colors.gray[200]}`,
    whiteSpace: 'nowrap',
  },
  tr: { cursor: 'pointer', transition: `background ${THEME.transitions.fast}` },
  td: { padding: THEME.spacing.md, fontSize: THEME.Typography.fontSize.sm, color: THEME.colors.gray[700], borderBottom: `1px solid ${THEME.colors.gray[100]}` },
  bugId: { color: THEME.colors.blue[600], fontWeight: THEME.Typography.fontWeight.bold, fontSize: THEME.Typography.fontSize.xs, fontFamily: 'monospace' },
  bugTitle: {
    fontWeight: THEME.Typography.fontWeight.medium,
    color: THEME.colors.gray[900],
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 260,
  },
  tag: {
    background: THEME.colors.blue[100],
    color: THEME.colors.blue[700],
    fontSize: THEME.Typography.fontSize.xs,
    padding: `${THEME.spacing.xs}px ${THEME.spacing.sm}px`,
    borderRadius: THEME.borderRadius.sm,
    fontWeight: THEME.Typography.fontWeight.medium,
  },
  project: { color: THEME.colors.gray[600] },
  severity: { color: THEME.colors.gray[600], textTransform: 'capitalize', fontSize: THEME.Typography.fontSize.xs },
  assignee: { display: 'flex', alignItems: 'center', gap: THEME.spacing.md },
  avatar: { width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.white, flexShrink: 0 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: THEME.spacing.lg, marginTop: THEME.spacing.xl },
  pageBtn: {
    background: THEME.colors.white,
    border: `1px solid ${THEME.colors.gray[300]}`,
    color: THEME.colors.gray[700],
    padding: `${THEME.spacing.sm}px ${THEME.spacing.lg}px`,
    borderRadius: THEME.borderRadius.md,
    cursor: 'pointer',
    fontSize: THEME.Typography.fontSize.sm,
  },
  pageInfo: { color: THEME.colors.gray[600], fontSize: THEME.Typography.fontSize.sm },
};
