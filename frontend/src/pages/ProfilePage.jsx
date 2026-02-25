import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { THEME } from '../theme/designSystem';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
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
    setPwMsg('');
    setPwError('');

    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwForm.newPassword)) {
      setPwError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    if (pwForm.currentPassword === pwForm.newPassword) {
      setPwError('New password must be different from current password');
      return;
    }

    setChangingPw(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      await logout();
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        setPwError(backendErrors[0].message || err.response?.data?.message || 'Password change failed');
      } else {
        setPwError(err.response?.data?.message || 'Password change failed');
      }
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
  page: { maxWidth: 1000, margin: '0 auto', fontFamily: THEME.Typography.fontFamily },
  title: { margin: `0 0 ${THEME.spacing.xl}px`, fontSize: THEME.Typography.fontSize['2xl'], fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900] },
  grid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: THEME.spacing.xl, alignItems: 'start' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: THEME.spacing.xl },
  main: { display: 'flex', flexDirection: 'column', gap: THEME.spacing.xl },
  card: { background: THEME.colors.white, borderRadius: THEME.borderRadius.lg, padding: THEME.spacing.xl, border: `1px solid ${THEME.colors.gray[200]}`, boxShadow: THEME.shadows.sm },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
    fontWeight: THEME.Typography.fontWeight.bold,
    color: THEME.colors.white,
    margin: `0 auto ${THEME.spacing.lg}px`,
    background: THEME.colors.blue[500],
  },
  name: { margin: `0 0 ${THEME.spacing.sm}px`, fontSize: THEME.Typography.fontSize.lg, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900], textAlign: 'center' },
  email: { margin: `0 0 ${THEME.spacing.md}px`, fontSize: THEME.Typography.fontSize.sm, color: THEME.colors.gray[600], textAlign: 'center' },
  roleBadge: {
    display: 'block',
    textAlign: 'center',
    margin: `0 auto ${THEME.spacing.md}px`,
    padding: `${THEME.spacing.sm}px ${THEME.spacing.lg}px`,
    borderRadius: THEME.borderRadius.full,
    fontWeight: THEME.Typography.fontWeight.bold,
    fontSize: THEME.Typography.fontSize.sm,
    textTransform: 'capitalize',
    width: 'fit-content',
    background: THEME.colors.blue[100],
    color: THEME.colors.blue[700],
  },
  dept: { margin: `0 0 ${THEME.spacing.lg}px`, textAlign: 'center', color: THEME.colors.gray[600], fontSize: THEME.Typography.fontSize.sm },
  statsRow: { display: 'flex', justifyContent: 'space-around', borderTop: `1px solid ${THEME.colors.gray[200]}`, paddingTop: THEME.spacing.lg },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: THEME.spacing.sm },
  statVal: { fontSize: THEME.Typography.fontSize.xl, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.blue[600] },
  statLabel: { fontSize: THEME.Typography.fontSize.xs, color: THEME.colors.gray[600] },
  sectionTitle: { margin: `0 0 ${THEME.spacing.lg}px`, fontSize: THEME.Typography.fontSize.base, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900] },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: `${THEME.spacing.md}px 0`, borderBottom: `1px solid ${THEME.colors.gray[200]}` },
  infoLabel: { fontSize: THEME.Typography.fontSize.xs, color: THEME.colors.gray[600] },
  infoVal: { fontSize: THEME.Typography.fontSize.sm, color: THEME.colors.gray[700] },
  success: { background: '#DCFCE7', border: `1px solid ${THEME.colors.success}`, color: '#15803D', padding: `${THEME.spacing.md}px ${THEME.spacing.lg}px`, borderRadius: THEME.borderRadius.md, marginBottom: THEME.spacing.lg, fontSize: THEME.Typography.fontSize.sm },
  alertErr: { background: '#FEE2E2', border: `1px solid ${THEME.colors.error}`, color: '#991B1B', padding: `${THEME.spacing.md}px ${THEME.spacing.lg}px`, borderRadius: THEME.borderRadius.md, marginBottom: THEME.spacing.lg, fontSize: THEME.Typography.fontSize.sm },
  saveBtn: { background: THEME.colors.blue[500], color: THEME.colors.white, border: 'none', padding: THEME.spacing.md, borderRadius: THEME.borderRadius.md, cursor: 'pointer', fontWeight: THEME.Typography.fontWeight.semibold, fontSize: THEME.Typography.fontSize.base },
};
