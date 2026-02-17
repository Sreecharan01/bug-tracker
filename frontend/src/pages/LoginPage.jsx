import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { THEME } from '../theme/designSystem';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>
          <span style={s.brandIcon}>🐛</span>
          <h1 style={s.brandName}>BugTracker</h1>
          <p style={s.brandSub}>Sign in to your account</p>
        </div>

        {error && <div style={s.alert}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@bugtracker.com"
              style={s.input}
              required
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.inputWrap}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{ ...s.input, paddingRight: 44 }}
                required
              />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button type="submit" style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={s.demo}>
          <p style={s.demoTitle}>Demo Credentials</p>
          <div style={s.demoGrid}>
            {[
              { role: 'Admin', email: 'admin@bugtracker.com', pass: 'Admin@1234', color: THEME.colors.error },
              { role: 'Developer', email: 'dev@bugtracker.com', pass: 'Dev@12345', color: THEME.colors.blue[500] },
              { role: 'Tester', email: 'tester@bugtracker.com', pass: 'Test@1234', color: THEME.colors.success },
            ].map((d) => (
              <button key={d.role} style={s.demoBtn} onClick={() => setForm({ email: d.email, password: d.pass })}>
                <span style={{ ...s.demoBadge, background: d.color }}>{d.role}</span>
                <span style={s.demoEmail}>{d.email}</span>
              </button>
            ))}
          </div>
        </div>

        <p style={s.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={s.link}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

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
    maxWidth: 440,
    border: `1px solid ${THEME.colors.gray[200]}`,
    boxShadow: THEME.shadows.lg,
  },
  brand: { textAlign: 'center', marginBottom: THEME.spacing['2xl'] },
  brandIcon: { fontSize: 40, display: 'block', marginBottom: THEME.spacing.md },
  brandName: {
    margin: 0,
    marginBottom: THEME.spacing.sm,
    fontSize: THEME.Typography.fontSize['3xl'],
    fontWeight: THEME.Typography.fontWeight.bold,
    color: THEME.colors.gray[900],
  },
  brandSub: {
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
    gap: THEME.spacing.lg,
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
  },
  inputWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute',
    right: THEME.spacing.md,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    padding: 0,
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
    marginTop: THEME.spacing.lg,
    transition: `all ${THEME.transitions.fast}`,
  },
  demo: {
    marginTop: THEME.spacing.xl,
    padding: THEME.spacing.lg,
    background: THEME.colors.gray[50],
    borderRadius: THEME.borderRadius.lg,
    border: `1px solid ${THEME.colors.gray[200]}`,
  },
  demoTitle: {
    margin: 0,
    marginBottom: THEME.spacing.md,
    fontSize: THEME.Typography.fontSize.xs,
    color: THEME.colors.gray[600],
    fontWeight: THEME.Typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: THEME.spacing.md,
  },
  demoBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: THEME.spacing.md,
    background: THEME.colors.white,
    border: `1px solid ${THEME.colors.gray[200]}`,
    borderRadius: THEME.borderRadius.md,
    padding: `${THEME.spacing.md}px ${THEME.spacing.md}px`,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: `all ${THEME.transitions.fast}`,
  },
  demoBadge: {
    color: THEME.colors.white,
    fontSize: THEME.Typography.fontSize.xs,
    fontWeight: THEME.Typography.fontWeight.bold,
    padding: `${THEME.spacing.xs}px ${THEME.spacing.md}px`,
    borderRadius: THEME.borderRadius.full,
    minWidth: 64,
    textAlign: 'center',
  },
  demoEmail: {
    color: THEME.colors.gray[600],
    fontSize: THEME.Typography.fontSize.sm,
    flex: 1,
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
