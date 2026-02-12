import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { bugAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PRIORITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
const STATUS_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#64748b'];

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
    { name: 'Critical', value: overview.critical || 0, fill: '#ef4444' },
    { name: 'High', value: overview.high || 0, fill: '#f97316' },
    { name: 'Medium', value: overview.medium || 0, fill: '#eab308' },
    { name: 'Low', value: overview.low || 0, fill: '#22c55e' },
  ];
  const projectData = (stats?.byProject || []).slice(0, 6).map(p => ({ name: p._id, count: p.count }));

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Dashboard</h1>
          <p style={s.sub}>Welcome back, {user?.name} 👋</p>
        </div>
        <button style={s.newBtn} onClick={() => navigate('/bugs/new')}>+ Report Bug</button>
      </div>

      {/* Stat Cards */}
      <div style={s.cards}>
        {[
          { label: 'Total Bugs', value: overview.total || 0, color: '#6366f1', icon: '🐛' },
          { label: 'Open', value: overview.open || 0, color: '#ef4444', icon: '🔴' },
          { label: 'In Progress', value: overview.inProgress || 0, color: '#f97316', icon: '🔄' },
          { label: 'Resolved', value: overview.resolved || 0, color: '#10b981', icon: '✅' },
          { label: 'Critical', value: overview.critical || 0, color: '#dc2626', icon: '🚨' },
        ].map((c) => (
          <div key={c.label} style={{ ...s.card, borderTop: `3px solid ${c.color}` }}>
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
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={s.chartBox}>
          <h3 style={s.chartTitle}>Bugs by Priority</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {projectData.length > 0 && (
          <div style={s.chartBox}>
            <h3 style={s.chartTitle}>Top Projects</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Bugs */}
      <div style={s.tableBox}>
        <div style={s.tableHeader}>
          <h3 style={s.chartTitle}>Recent Bugs</h3>
          <button style={s.viewAll} onClick={() => navigate('/bugs')}>View All →</button>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              {['ID', 'Title', 'Project', 'Priority', 'Status', 'Reported'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentBugs.map((bug) => (
              <tr key={bug._id} style={s.tr} onClick={() => navigate(`/bugs/${bug._id}`)}>
                <td style={s.td}><span style={s.bugId}>{bug.bugId}</span></td>
                <td style={{ ...s.td, maxWidth: 200 }}><span style={s.bugTitle}>{bug.title}</span></td>
                <td style={s.td}><span style={s.project}>{bug.project}</span></td>
                <td style={s.td}><PriorityBadge p={bug.priority} /></td>
                <td style={s.td}><StatusBadge s={bug.status} /></td>
                <td style={s.td}>{new Date(bug.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {recentBugs.length === 0 && (
              <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: '#475569', padding: 32 }}>No bugs reported yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const PriorityBadge = ({ p }) => {
  const colors = { critical: '#450a0a/#ef4444', high: '#431407/#f97316', medium: '#422006/#eab308', low: '#052e16/#22c55e' };
  const [bg, fg] = (colors[p] || '#1e293b/#94a3b8').split('/');
  return <span style={{ background: bg, color: fg, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{p}</span>;
};
const StatusBadge = ({ s: status }) => {
  const map = { open: ['#1e1b4b', '#818cf8'], in_progress: ['#172554', '#60a5fa'], resolved: ['#052e16', '#4ade80'], closed: ['#1e293b', '#64748b'], reopened: ['#450a0a', '#f87171'], rejected: ['#1c1917', '#a8a29e'] };
  const [bg, fg] = map[status] || ['#1e293b', '#94a3b8'];
  return <span style={{ background: bg, color: fg, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{status?.replace('_', ' ')}</span>;
};
const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
    <div style={{ width: 40, height: 40, border: '3px solid #334155', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const s = {
  page: { maxWidth: 1400, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: '#e2e8f0' },
  sub: { margin: '4px 0 0', color: '#64748b', fontSize: 14 },
  newBtn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 },
  card: { background: '#1e293b', borderRadius: 12, padding: '16px 20px', border: '1px solid #334155' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardIcon: { fontSize: 22 },
  cardValue: { fontSize: 32, fontWeight: 700 },
  cardLabel: { margin: 0, color: '#64748b', fontSize: 13, fontWeight: 500 },
  charts: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 },
  chartBox: { background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' },
  chartTitle: { margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#e2e8f0' },
  tableBox: { background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #334155' },
  viewAll: { background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #334155' },
  tr: { cursor: 'pointer', transition: 'background 0.15s' },
  td: { padding: '12px 16px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid #1e293b' },
  bugId: { color: '#6366f1', fontWeight: 600, fontSize: 12 },
  bugTitle: { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 },
  project: { color: '#94a3b8' },
};
