import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { THEME } from '../theme/designSystem';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        role: form.role === 'admin' ? 'admin' : 'user',
      };
      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check all fields.');
      const fieldErrors = err.response?.data?.errors;
      if (fieldErrors?.length) setError(fieldErrors.map((e) => e.message).join(', '));
    } finally {
      setLoading(false);
    }
  };

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>
          <span style={s.brandIcon}>🐛</span>
          <h1 style={s.title}>Create Account</h1>
          <p style={s.sub}>Join BugTracker today (password needs upper, lower, number)</p>
        </div>

        {error && <div style={s.alert}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.row}>
            <Field label="Full Name" name="name" value={form.name} onChange={change} placeholder="John Doe" required />
            <Field label="Department" name="department" value={form.department} onChange={change} placeholder="Engineering" />
          </div>
          <Field label="Email" name="email" type="email" value={form.email} onChange={change} placeholder="john@company.com" required />
          <Field
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={change}
            placeholder="Min 8 chars, upper+lower+number"
            required
          />
          <div style={s.field}>
            <label style={s.label}>Role</label>
            <select name="role" value={form.role} onChange={change} style={s.input}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={s.footer}>
          Already have an account?{' '}
          <Link to="/login" style={s.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

const Field = ({ label, ...props }) => (
  <div style={s.fieldWrapper}>
    <label style={s.label}>{label}</label>
    <input style={s.input} {...props} />
  </div>
);

const s = {
  page: {
    minHeight: '100vh',
    background: THEME.colors.background.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.lg,
    fontFamily: THEME.Typography.fontFamily,
  },
  card: {
    background: THEME.colors.white,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing['2xl'],
    width: '100%',
    maxWidth: 480,
    border: `1px solid ${THEME.colors.gray[200]}`,
    boxShadow: THEME.shadows.lg,
  },
  brand: { textAlign: 'center', marginBottom: THEME.spacing.xl },
  brandIcon: { fontSize: 40, display: 'block', marginBottom: THEME.spacing.md },
  title: {
    margin: 0,
    marginBottom: THEME.spacing.sm,
    fontSize: THEME.Typography.fontSize['2xl'],
    fontWeight: THEME.Typography.fontWeight.bold,
    color: THEME.colors.gray[900],
  },
  sub: {
    margin: 0,
    color: THEME.colors.gray[500],
    fontSize: THEME.Typography.fontSize.base,
  },
  alert: {
    background: '#FEE2E2',
    border: `1px solid ${THEME.colors.error}`,
    color: '#991B1B',
    padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.lg,
    fontSize: THEME.Typography.fontSize.sm,
    fontWeight: THEME.Typography.fontWeight.medium,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: THEME.spacing.md,
  },
  row: {
    display: 'flex',
    gap: THEME.spacing.md,
  },
  fieldWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: THEME.spacing.sm,
    flex: 1,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: THEME.spacing.sm,
  },
  label: {
    fontSize: THEME.Typography.fontSize.sm,
    fontWeight: THEME.Typography.fontWeight.semibold,
    color: THEME.colors.gray[700],
  },
  input: {
    background: THEME.colors.white,
    border: `1px solid ${THEME.colors.gray[300]}`,
    borderRadius: THEME.borderRadius.md,
    padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`,
    color: THEME.colors.gray[900],
    fontSize: THEME.Typography.fontSize.sm,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: `border ${THEME.transitions.fast}`,
    fontFamily: THEME.Typography.fontFamily,
  },
  btn: {
    background: THEME.colors.blue[500],
    color: THEME.colors.white,
    border: 'none',
    padding: `${THEME.spacing.sm + 1}px ${THEME.spacing.lg}px`,
    borderRadius: THEME.borderRadius.md,
    fontSize: THEME.Typography.fontSize.base,
    fontWeight: THEME.Typography.fontWeight.semibold,
    cursor: 'pointer',
    marginTop: THEME.spacing.md,
    transition: `all ${THEME.transitions.fast}`,
  },
  footer: {
    textAlign: 'center',
    marginTop: THEME.spacing.xl,
    color: THEME.colors.gray[600],
    fontSize: THEME.Typography.fontSize.sm,
    margin: 0,
  },
  link: {
    color: THEME.colors.blue[600],
    textDecoration: 'none',
    fontWeight: THEME.Typography.fontWeight.semibold,
    transition: `color ${THEME.transitions.fast}`,
  },
};
