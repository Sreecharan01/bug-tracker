import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      const fieldErrors = err.response?.data?.errors;
      if (fieldErrors?.length) setError(fieldErrors.map(e => e.message).join(', '));
    } finally {
      setLoading(false);
    }
  };

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>
          <span>🐛</span>
          <h1 style={s.title}>Create Account</h1>
          <p style={s.sub}>Join BugTracker today</p>
        </div>

        {error && <div style={s.alert}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.row}>
            <Field label="Full Name" name="name" value={form.name} onChange={change} placeholder="John Doe" required />
            <Field label="Department" name="department" value={form.department} onChange={change} placeholder="Engineering" />
          </div>
          <Field label="Email" name="email" type="email" value={form.email} onChange={change} placeholder="john@company.com" required />
          <Field label="Password" name="password" type="password" value={form.password} onChange={change} placeholder="Min 8 chars, upper+lower+number" required />
          <div style={s.field}>
            <label style={s.label}>Role</label>
            <select name="role" value={form.role} onChange={change} style={s.input}>
              <option value="user">User</option>
              <option value="developer">Developer</option>
              <option value="tester">Tester</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={s.footer}>Already have an account? <Link to="/login" style={s.link}>Sign in</Link></p>
      </div>
    </div>
  );
}

const Field = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
    <label style={s.label}>{label}</label>
    <input style={s.input} {...props} />
  </div>
);

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, system-ui, sans-serif' },
  card: { background: '#1e293b', borderRadius: 16, padding: 40, width: '100%', maxWidth: 480, border: '1px solid #334155', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  brand: { textAlign: 'center', marginBottom: 28, fontSize: 32 },
  title: { margin: '8px 0 4px', fontSize: 24, fontWeight: 700, color: '#e2e8f0' },
  sub: { margin: 0, color: '#64748b', fontSize: 14 },
  alert: { background: '#450a0a', border: '1px solid #dc2626', color: '#fca5a5', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  row: { display: 'flex', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#94a3b8' },
  input: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' },
  btn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', padding: 13, borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  footer: { textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: 14 },
  link: { color: '#6366f1', textDecoration: 'none', fontWeight: 600 },
};
