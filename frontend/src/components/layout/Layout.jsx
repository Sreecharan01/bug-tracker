import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/bugs', icon: '🐛', label: 'Bugs' },
  { to: '/reports', icon: '📋', label: 'Reports' },
];

const ADMIN_ITEMS = [
  { to: '/users', icon: '👥', label: 'Users' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const ROLE_COLORS = { admin: '#ef4444', developer: '#3b82f6', tester: '#10b981', user: '#6366f1' };
  const roleColor = ROLE_COLORS[user?.role] || '#6366f1';

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? 240 : 64 }}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🐛</span>
          {sidebarOpen && <span style={styles.logoText}>BugTracker</span>}
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}>
              <span style={styles.navIcon}>{item.icon}</span>
              {sidebarOpen && <span style={styles.navLabel}>{item.label}</span>}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div style={styles.divider} />
              <p style={{ ...styles.sectionLabel, opacity: sidebarOpen ? 1 : 0 }}>Admin</p>
              {ADMIN_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}>
                  <span style={styles.navIcon}>{item.icon}</span>
                  {sidebarOpen && <span style={styles.navLabel}>{item.label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User card */}
        <div style={styles.userCard}>
          <div style={{ ...styles.avatar, background: roleColor }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          {sidebarOpen && (
            <div style={styles.userInfo}>
              <p style={styles.userName}>{user?.name}</p>
              <p style={{ ...styles.userRole, color: roleColor }}>{user?.role}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div style={styles.main}>
        {/* Topbar */}
        <header style={styles.topbar}>
          <button style={styles.menuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <div style={styles.topbarRight}>
            <button style={styles.bugBtn} onClick={() => navigate('/bugs/new')}>+ New Bug</button>
            <button style={styles.profileBtn} onClick={() => navigate('/profile')} title="Profile">
              <div style={{ ...styles.avatarSm, background: roleColor }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </button>
            <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {/* Page content */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', height: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' },
  sidebar: { background: '#1e293b', display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', borderRight: '1px solid #334155', flexShrink: 0 },
  logo: { display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px', borderBottom: '1px solid #334155' },
  logoIcon: { fontSize: 24 },
  logoText: { fontSize: 18, fontWeight: 700, color: '#6366f1' },
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 },
  navLink: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, textDecoration: 'none', color: '#94a3b8', transition: 'all 0.15s', fontSize: 14 },
  navLinkActive: { background: '#312e81', color: '#a5b4fc' },
  navIcon: { fontSize: 18, minWidth: 24, textAlign: 'center' },
  navLabel: { fontWeight: 500 },
  divider: { height: 1, background: '#334155', margin: '8px 0' },
  sectionLabel: { fontSize: 11, fontWeight: 600, color: '#475569', padding: '4px 12px', textTransform: 'uppercase', letterSpacing: 1 },
  userCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '16px', borderTop: '1px solid #334155' },
  avatar: { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'white', flexShrink: 0 },
  avatarSm: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' },
  userInfo: { overflow: 'hidden' },
  userName: { margin: 0, fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { margin: 0, fontSize: 11, textTransform: 'capitalize', marginTop: 2 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar: { background: '#1e293b', borderBottom: '1px solid #334155', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  menuBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, padding: 8, borderRadius: 6 },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  bugBtn: { background: '#6366f1', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  profileBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  logoutBtn: { background: 'none', border: '1px solid #475569', color: '#94a3b8', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  content: { flex: 1, overflow: 'auto', padding: 24 },
};
