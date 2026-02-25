import React, { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../services/api';
import { THEME } from '../theme/designSystem';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', department: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...(search && { search }), ...(roleFilter && { role: roleFilter }) };
      const { data } = await userAPI.getAll(params);
      setUsers(data.data || []);
      setTotal(data.meta?.pagination?.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (id) => {
    await userAPI.toggleStatus(id);
    fetchUsers();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await userAPI.create(form);
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'user', department: '' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally { setCreating(false); }
  };

  const ROLE_COLORS = { admin: '#ef4444', developer: '#3b82f6', tester: '#10b981', user: '#6366f1' };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div><h1 style={s.title}>Users</h1><p style={s.sub}>{total} total users</p></div>
        <button style={s.newBtn} onClick={() => setShowCreate(true)}>+ Add User</button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h3 style={s.modalTitle}>Create New User</h3>
            {error && <div style={s.alert}>{error}</div>}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={s.row}>
                <MField label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Full name" />
                <MField label="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Engineering" />
              </div>
              <MField label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="user@company.com" />
              <MField label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Min 8 chars" />
              <div style={s.field}>
                <label style={s.label}>Role</label>
                <select style={s.input} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {['admin', 'developer', 'tester', 'user'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" style={s.saveBtn} disabled={creating}>{creating ? '...' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={s.filters}>
        <input style={s.search} placeholder="🔍 Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select style={s.select} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          {['admin', 'developer', 'tester', 'user'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div style={s.tableBox}>
        <table style={s.table}>
          <thead>
            <tr>{['User', 'Email', 'Role', 'Department', 'Status', 'Last Login', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#475569' }}>Loading...</td></tr>
            ) : users.map((u) => (
              <tr key={u._id} style={s.tr}>
                <td style={s.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: ROLE_COLORS[u.role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>{u.name?.[0]}</div>
                    <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{u.name}</span>
                  </div>
                </td>
                <td style={s.td}>{u.email}</td>
                <td style={s.td}><span style={{ background: ROLE_COLORS[u.role] + '22', color: ROLE_COLORS[u.role], padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{u.role}</span></td>
                <td style={s.td}>{u.department || '—'}</td>
                <td style={s.td}><span style={{ background: u.isActive ? '#052e16' : '#1c1917', color: u.isActive ? '#4ade80' : '#a8a29e', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td style={s.td}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                <td style={s.td}>
                  <button style={{ ...s.actionBtn, color: u.isActive ? '#ef4444' : '#4ade80' }} onClick={() => handleToggle(u._id)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const MField = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{label}</label>
    <input style={s.input} {...props} />
  </div>
);

const s = {
  page: { maxWidth: 1200, margin: '0 auto', fontFamily: THEME.Typography.fontFamily },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.xl },
  title: { margin: 0, fontSize: THEME.Typography.fontSize['2xl'], fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900] },
  sub: { margin: `${THEME.spacing.sm}px 0 0`, color: THEME.colors.gray[500], fontSize: THEME.Typography.fontSize.base },
  newBtn: { background: THEME.colors.blue[500], color: THEME.colors.white, border: 'none', padding: `${THEME.spacing.md}px ${THEME.spacing.lg}px`, borderRadius: THEME.borderRadius.md, cursor: 'pointer', fontWeight: THEME.Typography.fontWeight.semibold },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { background: THEME.colors.white, borderRadius: THEME.borderRadius.xl, padding: THEME.spacing['2xl'], width: 500, border: `1px solid ${THEME.colors.gray[200]}`, boxShadow: THEME.shadows.xl },
  modalTitle: { margin: `0 0 ${THEME.spacing.lg}px`, fontSize: THEME.Typography.fontSize.lg, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900] },
  alert: { background: '#FEE2E2', border: `1px solid ${THEME.colors.error}`, color: '#991B1B', padding: `${THEME.spacing.md}px ${THEME.spacing.lg}px`, borderRadius: THEME.borderRadius.md, marginBottom: THEME.spacing.lg, fontSize: THEME.Typography.fontSize.sm },
  filters: { display: 'flex', gap: THEME.spacing.md, marginBottom: THEME.spacing.lg },
  search: { background: THEME.colors.white, border: `1px solid ${THEME.colors.gray[300]}`, borderRadius: THEME.borderRadius.md, padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`, color: THEME.colors.gray[900], fontSize: THEME.Typography.fontSize.sm, outline: 'none', flex: 1 },
  select: { background: THEME.colors.white, border: `1px solid ${THEME.colors.gray[300]}`, borderRadius: THEME.borderRadius.md, padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`, color: THEME.colors.gray[900], fontSize: THEME.Typography.fontSize.sm, outline: 'none', cursor: 'pointer' },
  tableBox: { background: THEME.colors.white, borderRadius: THEME.borderRadius.lg, border: `1px solid ${THEME.colors.gray[200]}`, overflow: 'auto', boxShadow: THEME.shadows.sm },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 800 },
  th: { padding: THEME.spacing.md, textAlign: 'left', fontSize: THEME.Typography.fontSize.xs, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[600], textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${THEME.colors.gray[200]}` },
  tr: { transition: `background ${THEME.transitions.fast}` },
  td: { padding: THEME.spacing.md, fontSize: THEME.Typography.fontSize.sm, color: THEME.colors.gray[700], borderBottom: `1px solid ${THEME.colors.gray[100]}` },
  row: { display: 'flex', gap: THEME.spacing.md },
  field: { display: 'flex', flexDirection: 'column', gap: THEME.spacing.sm },
  label: { fontSize: THEME.Typography.fontSize.sm, fontWeight: THEME.Typography.fontWeight.semibold, color: THEME.colors.gray[700] },
  input: { background: THEME.colors.white, border: `1px solid ${THEME.colors.gray[300]}`, borderRadius: THEME.borderRadius.md, padding: THEME.spacing.md, color: THEME.colors.gray[900], fontSize: THEME.Typography.fontSize.sm, outline: 'none', width: '100%', boxSizing: 'border-box' },
  saveBtn: { background: THEME.colors.blue[500], color: THEME.colors.white, border: 'none', padding: `${THEME.spacing.md}px ${THEME.spacing.lg}px`, borderRadius: THEME.borderRadius.md, cursor: 'pointer', fontWeight: THEME.Typography.fontWeight.semibold, fontSize: THEME.Typography.fontSize.base },
  cancelBtn: { background: 'none', border: `1px solid ${THEME.colors.gray[300]}`, color: THEME.colors.gray[700], padding: `${THEME.spacing.md}px ${THEME.spacing.lg}px`, borderRadius: THEME.borderRadius.md, cursor: 'pointer', fontSize: THEME.Typography.fontSize.base },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: THEME.Typography.fontSize.sm, fontWeight: THEME.Typography.fontWeight.semibold },
};
