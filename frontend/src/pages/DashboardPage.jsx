import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { bugAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { THEME } from '../theme/designSystem';

const PRIORITY_COLORS = {
  critical: THEME.colors.error,
  high: THEME.colors.warning,
  medium: '#F59E0B',
  low: THEME.colors.success,
};
const STATUS_COLORS = [THEME.colors.blue[500], THEME.colors.blue[400], THEME.colors.success, THEME.colors.gray[400]];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentBugs, setRecentBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, bugsRes] = await Promise.all([
          bugAPI.getStats(),
          bugAPI.getAll({ limit: 5, sortBy: 'createdAt', order: 'desc' }),
        ]);
        setStats(statsRes.data.data);
        setRecentBugs(bugsRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;

  const overview = stats?.overview || {};
  const statusData = [
    { name: 'Open', value: overview.open || 0 },
    { name: 'In Progress', value: overview.inProgress || 0 },
    { name: 'Resolved', value: overview.resolved || 0 },
    { name: 'Closed', value: overview.closed || 0 },
  ];
  const priorityData = [
    { name: 'Critical', value: overview.critical || 0, fill: PRIORITY_COLORS.critical },
    { name: 'High', value: overview.high || 0, fill: PRIORITY_COLORS.high },
    { name: 'Medium', value: overview.medium || 0, fill: PRIORITY_COLORS.medium },
    { name: 'Low', value: overview.low || 0, fill: PRIORITY_COLORS.low },
  ];
  const projectData = (stats?.byProject || []).slice(0, 6).map((p) => ({ name: p._id, count: p.count }));

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Dashboard</h1>
          <p style={s.sub}>Welcome back, {user?.name} 👋</p>
        </div>
        <button style={s.newBtn} onClick={() => navigate('/bugs/new')}>
          + Report Bug
        </button>
      </div>

      {/* Stat Cards */}
      <div style={s.cards}>
        {[
          { label: 'Total Bugs', value: overview.total || 0, color: THEME.colors.blue[500], icon: '🐛' },
          { label: 'Open', value: overview.open || 0, color: THEME.colors.error, icon: '🔴' },
          { label: 'In Progress', value: overview.inProgress || 0, color: THEME.colors.warning, icon: '⏳' },
          { label: 'Resolved', value: overview.resolved || 0, color: THEME.colors.success, icon: '✅' },
          { label: 'Critical', value: overview.critical || 0, color: THEME.colors.error, icon: '🚨' },
        ].map((c) => (
          <div key={c.label} style={{ ...s.card, borderLeft: `4px solid ${c.color}` }}>
            <div style={s.cardTop}>
              <span style={s.cardIcon}>{c.icon}</span>
              <span style={{ ...s.cardValue, color: c.color }}>{c.value}</span>
            </div>
            <p style={s.cardLabel}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={s.charts}>
        <div style={s.chartBox}>
          <h3 style={s.chartTitle}>Bugs by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={STATUS_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: THEME.colors.white, border: `1px solid ${THEME.colors.gray[200]}`, borderRadius: THEME.borderRadius.md }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={s.chartBox}>
          <h3 style={s.chartTitle}>Bugs by Priority</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.gray[200]} />
              <XAxis dataKey="name" tick={{ fill: THEME.colors.gray[600], fontSize: 12 }} />
              <YAxis tick={{ fill: THEME.colors.gray[600], fontSize: 12 }} />
              <Tooltip contentStyle={{ background: THEME.colors.white, border: `1px solid ${THEME.colors.gray[200]}`, borderRadius: THEME.borderRadius.md }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {projectData.length > 0 && (
          <div style={s.chartBox}>
            <h3 style={s.chartTitle}>Top Projects</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.gray[200]} />
                <XAxis type="number" tick={{ fill: THEME.colors.gray[600], fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: THEME.colors.gray[600], fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ background: THEME.colors.white, border: `1px solid ${THEME.colors.gray[200]}`, borderRadius: THEME.borderRadius.md }} />
                <Bar dataKey="count" fill={THEME.colors.blue[500]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Bugs */}
      <div style={s.tableBox}>
        <div style={s.tableHeader}>
          <h3 style={s.chartTitle}>Recent Bugs</h3>
          <button style={s.viewAll} onClick={() => navigate('/bugs')}>
            View All →
          </button>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              {['ID', 'Title', 'Project', 'Priority', 'Status', 'Reported'].map((h) => (
                <th key={h} style={s.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentBugs.map((bug) => (
              <tr key={bug._id} style={s.tr} onClick={() => navigate(`/bugs/${bug._id}`)}>
                <td style={s.td}>
                  <span style={s.bugId}>{bug.bugId}</span>
                </td>
                <td style={{ ...s.td, maxWidth: 200 }}>
                  <span style={s.bugTitle}>{bug.title}</span>
                </td>
                <td style={s.td}>
                  <span style={s.project}>{bug.project}</span>
                </td>
                <td style={s.td}>
                  <PriorityBadge p={bug.priority} />
                </td>
                <td style={s.td}>
                  <StatusBadge s={bug.status} />
                </td>
                <td style={s.td}>{new Date(bug.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {recentBugs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...s.td, textAlign: 'center', color: THEME.colors.gray[400], padding: THEME.spacing['2xl'] }}>
                  No bugs reported yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const PriorityBadge = ({ p }) => {
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

const StatusBadge = ({ s: status }) => {
  const map = {
    open: { bg: '#DBEAFE', fg: '#0C4A6E' },
    in_progress: { bg: '#BFDBFE', fg: '#0C2D57' },
    resolved: { bg: '#DCFCE7', fg: '#15803D' },
    closed: { bg: '#E5E7EB', fg: '#374151' },
    reopened: { bg: '#FEE2E2', fg: '#7C2D12' },
    rejected: { bg: '#F3E8FF', fg: '#581C87' },
  };
  const { bg, fg } = map[status] || { bg: THEME.colors.gray[100], fg: THEME.colors.gray[700] };
  return (
    <span style={{ background: bg, color: fg, padding: `${THEME.spacing.xs}px ${THEME.spacing.md}px`, borderRadius: THEME.borderRadius.full, fontSize: THEME.Typography.fontSize.xs, fontWeight: THEME.Typography.fontWeight.semibold, textTransform: 'capitalize' }}>
      {status?.replace('_', ' ')}
    </span>
  );
};

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
    <div style={{ width: 40, height: 40, border: `3px solid ${THEME.colors.gray[300]}`, borderTopColor: THEME.colors.blue[500], borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: THEME.spacing.lg, marginBottom: THEME.spacing.xl },
  card: { background: THEME.colors.white, borderRadius: THEME.borderRadius.lg, padding: THEME.spacing.lg, border: `1px solid ${THEME.colors.gray[200]}`, boxShadow: THEME.shadows.sm },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.md },
  cardIcon: { fontSize: 24 },
  cardValue: { fontSize: THEME.Typography.fontSize['2xl'], fontWeight: THEME.Typography.fontWeight.bold },
  cardLabel: { margin: 0, color: THEME.colors.gray[600], fontSize: THEME.Typography.fontSize.sm, fontWeight: THEME.Typography.fontWeight.medium },
  charts: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: THEME.spacing.lg, marginBottom: THEME.spacing.xl },
  chartBox: { background: THEME.colors.white, borderRadius: THEME.borderRadius.lg, padding: THEME.spacing.lg, border: `1px solid ${THEME.colors.gray[200]}`, boxShadow: THEME.shadows.sm },
  chartTitle: { margin: `0 0 ${THEME.spacing.lg}px`, fontSize: THEME.Typography.fontSize.base, fontWeight: THEME.Typography.fontWeight.semibold, color: THEME.colors.gray[900] },
  tableBox: { background: THEME.colors.white, borderRadius: THEME.borderRadius.lg, border: `1px solid ${THEME.colors.gray[200]}`, overflow: 'hidden', boxShadow: THEME.shadows.sm },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${THEME.spacing.lg}px`, borderBottom: `1px solid ${THEME.colors.gray[200]}` },
  viewAll: { background: 'none', border: 'none', color: THEME.colors.blue[600], cursor: 'pointer', fontWeight: THEME.Typography.fontWeight.semibold, fontSize: THEME.Typography.fontSize.sm },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: `${THEME.spacing.md}px ${THEME.spacing.lg}px`, textAlign: 'left', fontSize: THEME.Typography.fontSize.xs, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[600], textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${THEME.colors.gray[200]}` },
  tr: { cursor: 'pointer', transition: `background ${THEME.transitions.fast}` },
  td: { padding: `${THEME.spacing.md}px ${THEME.spacing.lg}px`, fontSize: THEME.Typography.fontSize.sm, color: THEME.colors.gray[700], borderBottom: `1px solid ${THEME.colors.gray[100]}` },
  bugId: { color: THEME.colors.blue[600], fontWeight: THEME.Typography.fontWeight.semibold, fontSize: THEME.Typography.fontSize.xs },
  bugTitle: { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 },
  project: { color: THEME.colors.gray[600] },
};
