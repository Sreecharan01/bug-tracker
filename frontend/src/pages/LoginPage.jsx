import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="admin@bugtracker.com" style={s.input} required />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.inputWrap}>
              <input name="password" type={showPassword ? 'text' : 'password'}
                value={form.password} onChange={handleChange}
                placeholder="••••••••" style={{ ...s.input, paddingRight: 44 }} required />
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
              { role: 'Admin', email: 'admin@bugtracker.com', pass: 'Admin@1234', color: '#ef4444' },
              { role: 'Developer', email: 'dev@bugtracker.com', pass: 'Dev@12345', color: '#3b82f6' },
              { role: 'Tester', email: 'tester@bugtracker.com', pass: 'Test@1234', color: '#10b981' },
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
          <Link to="/register" style={s.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, system-ui, sans-serif' },
  card: { background: '#1e293b', borderRadius: 16, padding: 40, width: '100%', maxWidth: 440, border: '1px solid #334155', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  brand: { textAlign: 'center', marginBottom: 32 },
  brandIcon: { fontSize: 40 },
  brandName: { margin: '8px 0 4px', fontSize: 28, fontWeight: 700, color: '#e2e8f0' },
  brandSub: { margin: 0, color: '#64748b', fontSize: 14 },
  alert: { background: '#450a0a', border: '1px solid #dc2626', color: '#fca5a5', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#94a3b8' },
  input: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '11px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' },
  inputWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 },
  btn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', padding: '13px', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  demo: { marginTop: 28, padding: 16, background: '#0f172a', borderRadius: 10, border: '1px solid #1e293b' },
  demoTitle: { margin: '0 0 12px', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 },
  demoGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  demoBtn: { display: 'flex', alignItems: 'center', gap: 10, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', textAlign: 'left', width: '100%' },
  demoBadge: { color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, minWidth: 64, textAlign: 'center' },
  demoEmail: { color: '#94a3b8', fontSize: 12 },
  footer: { textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: 14 },
  link: { color: '#6366f1', textDecoration: 'none', fontWeight: 600 },
};
