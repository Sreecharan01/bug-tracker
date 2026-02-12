import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');

  const ROLE_COLORS = { admin: '#ef4444', developer: '#3b82f6', tester: '#10b981', user: '#6366f1' };
  const roleColor = ROLE_COLORS[user?.role] || '#6366f1';

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const { data } = await authAPI.updateMe(form);
      updateUser(data.data);
      setMsg('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setChangingPw(true);
    setPwMsg('');
    setPwError('');
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg('Password changed. You will be logged out.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Password change failed');
    } finally { setChangingPw(false); }
  };

  return (
    <div style={s.page}>
      <h1 style={s.title}>My Profile</h1>

      <div style={s.grid}>
        {/* Profile Card */}
        <div style={s.sidebar}>
          <div style={s.card}>
            <div style={{ ...s.bigAvatar, background: roleColor }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <h2 style={s.name}>{user?.name}</h2>
            <p style={s.email}>{user?.email}</p>
            <span style={{ ...s.roleBadge, background: roleColor + '22', color: roleColor }}>{user?.role}</span>
            {user?.department && <p style={s.dept}>{user.department}</p>}
            <div style={s.statsRow}>
              <div style={s.statItem}>
                <span style={s.statVal}>—</span>
                <span style={s.statLabel}>Reported</span>
              </div>
              <div style={s.statItem}>
                <span style={s.statVal}>—</span>
                <span style={s.statLabel}>Assigned</span>
              </div>
              <div style={s.statItem}>
                <span style={s.statVal}>—</span>
                <span style={s.statLabel}>Resolved</span>
              </div>
            </div>
          </div>

          <div style={s.card}>
            <h4 style={s.sectionTitle}>Account Info</h4>
            {[
              ['Member Since', new Date(user?.createdAt).toLocaleDateString()],
              ['Last Login', user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'],
              ['Email Verified', user?.isEmailVerified ? '✅ Yes' : '❌ No'],
              ['Account Status', user?.isActive ? '✅ Active' : '❌ Inactive'],
            ].map(([k, v]) => (
              <div key={k} style={s.infoRow}>
                <span style={s.infoLabel}>{k}</span>
                <span style={s.infoVal}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Forms */}
        <div style={s.main}>
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Edit Profile</h3>
            {msg && <div style={s.success}>{msg}</div>}
            {error && <div style={s.alertErr}>{error}</div>}
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" required />
              <Field label="Email Address" value={user?.email} disabled placeholder="Email (cannot be changed)" />
              <Field label="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Your department" />
              <button type="submit" style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          <div style={s.card}>
            <h3 style={s.sectionTitle}>Change Password</h3>
            {pwMsg && <div style={s.success}>{pwMsg}</div>}
            {pwError && <div style={s.alertErr}>{pwError}</div>}
            <form onSubmit={handlePwChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Current Password" type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required placeholder="Your current password" />
              <Field label="New Password" type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required placeholder="Min 8 chars, upper+lower+number" />
              <Field label="Confirm New Password" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required placeholder="Repeat new password" />
              <button type="submit" style={{ ...s.saveBtn, opacity: changingPw ? 0.7 : 1 }} disabled={changingPw}>
                {changingPw ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{label}</label>
    <input style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', opacity: props.disabled ? 0.6 : 1 }} {...props} />
  </div>
);

const s = {
  page: { maxWidth: 1000, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' },
  title: { margin: '0 0 28px', fontSize: 26, fontWeight: 700, color: '#e2e8f0' },
  grid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: 20 },
  main: { display: 'flex', flexDirection: 'column', gap: 20 },
  card: { background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' },
  bigAvatar: { width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: 'white', margin: '0 auto 16px' },
  name: { margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#e2e8f0', textAlign: 'center' },
  email: { margin: '0 0 12px', fontSize: 13, color: '#64748b', textAlign: 'center' },
  roleBadge: { display: 'block', textAlign: 'center', margin: '0 auto 12px', padding: '4px 16px', borderRadius: 20, fontWeight: 700, fontSize: 13, textTransform: 'capitalize', width: 'fit-content' },
  dept: { margin: '0 0 16px', textAlign: 'center', color: '#64748b', fontSize: 13 },
  statsRow: { display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #334155', paddingTop: 16 },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  statVal: { fontSize: 22, fontWeight: 700, color: '#6366f1' },
  statLabel: { fontSize: 11, color: '#64748b' },
  sectionTitle: { margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#e2e8f0' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f172a' },
  infoLabel: { fontSize: 12, color: '#64748b' },
  infoVal: { fontSize: 13, color: '#cbd5e1' },
  success: { background: '#052e16', border: '1px solid #16a34a', color: '#86efac', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 },
  alertErr: { background: '#450a0a', border: '1px solid #dc2626', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 },
  saveBtn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', padding: '11px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
};
