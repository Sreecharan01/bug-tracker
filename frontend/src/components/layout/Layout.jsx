import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../theme/designSystem';

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

  const ROLE_COLORS = {
    admin: THEME.colors.error,
    developer: THEME.colors.blue[500],
    tester: THEME.colors.success,
    user: THEME.colors.info,
  };
  const roleColor = ROLE_COLORS[user?.role] || THEME.colors.blue[500];

  return (
    <div style={s.wrapper}>
      {/* Sidebar */}
      <aside style={{ ...s.sidebar, width: sidebarOpen ? 260 : 64 }}>
        {/* Logo */}
        <div style={s.logo}>
          <span style={s.logoIcon}>🐛</span>
          {sidebarOpen && <span style={s.logoText}>BugTracker</span>}
        </div>

        {/* Navigation */}
        <nav style={s.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...s.navLink,
                ...(isActive ? s.navLinkActive : s.navLinkInactive),
              })}
            >
              <span style={s.navIcon}>{item.icon}</span>
              {sidebarOpen && <span style={s.navLabel}>{item.label}</span>}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div style={s.divider} />
              <p style={{ ...s.sectionLabel, opacity: sidebarOpen ? 1 : 0 }}>Admin</p>
              {ADMIN_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    ...s.navLink,
                    ...(isActive ? s.navLinkActive : s.navLinkInactive),
                  })}
                >
                  <span style={s.navIcon}>{item.icon}</span>
                  {sidebarOpen && <span style={s.navLabel}>{item.label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User card */}
        <div style={s.userCard}>
          <div style={{ ...s.avatar, background: roleColor }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          {sidebarOpen && (
            <div style={s.userInfo}>
              <p style={s.userName}>{user?.name}</p>
              <p style={{ ...s.userRole, color: roleColor }}>{user?.role}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div style={s.main}>
        {/* Topbar */}
        <header style={s.topbar}>
          <button style={s.menuBtn} onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">
            {sidebarOpen ? '‹' : '›'}
          </button>
          <div style={s.topbarRight}>
            <button style={s.newBugBtn} onClick={() => navigate('/bugs/new')}>
              + New Bug
            </button>
            <button style={s.profileBtn} onClick={() => navigate('/profile')} title="Profile">
              <div style={{ ...s.avatarSm, background: roleColor }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </button>
            <button style={s.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={s.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const s = {
  wrapper: {
    display: 'flex',
    height: '100vh',
    background: THEME.colors.background.primary,
    color: THEME.colors.gray[900],
    fontFamily: THEME.Typography.fontFamily,
    overflow: 'hidden',
  },
  sidebar: {
    background: THEME.colors.white,
    display: 'flex',
    flexDirection: 'column',
    transition: `width ${THEME.transitions.base}`,
    borderRight: `1px solid ${THEME.colors.gray[200]}`,
    flexShrink: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: THEME.spacing.md,
    padding: `${THEME.spacing.lg}px ${THEME.spacing.md}px`,
    borderBottom: `1px solid ${THEME.colors.gray[200]}`,
  },
  logoIcon: { fontSize: 24 },
  logoText: {
    fontSize: THEME.Typography.fontSize.xl,
    fontWeight: THEME.Typography.fontWeight.bold,
    color: THEME.colors.blue[600],
  },
  nav: {
    flex: 1,
    padding: `${THEME.spacing.md}px ${THEME.spacing.sm}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: THEME.spacing.xs,
    overflowY: 'auto',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: THEME.spacing.md,
    padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`,
    borderRadius: THEME.borderRadius.md,
    textDecoration: 'none',
    transition: `all ${THEME.transitions.fast}`,
    fontSize: THEME.Typography.fontSize.sm,
    fontWeight: THEME.Typography.fontWeight.medium,
  },
  navLinkActive: {
    background: THEME.colors.blue[50],
    color: THEME.colors.blue[700],
    fontWeight: THEME.Typography.fontWeight.semibold,
  },
  navLinkInactive: {
    color: THEME.colors.gray[600],
    cursor: 'pointer',
  },
  navIcon: { fontSize: 18, minWidth: 24, textAlign: 'center' },
  navLabel: { flex: 1 },
  divider: {
    height: 1,
    background: THEME.colors.gray[200],
    margin: `${THEME.spacing.md}px 0`,
  },
  sectionLabel: {
    fontSize: THEME.Typography.fontSize.xs,
    fontWeight: THEME.Typography.fontWeight.bold,
    color: THEME.colors.gray[500],
    padding: `${THEME.spacing.xs}px ${THEME.spacing.md}px`,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    margin: 0,
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: THEME.spacing.md,
    padding: THEME.spacing.md,
    borderTop: `1px solid ${THEME.colors.gray[200]}`,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: THEME.Typography.fontWeight.bold,
    color: THEME.colors.white,
    flexShrink: 0,
  },
  avatarSm: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: THEME.Typography.fontWeight.bold,
    color: THEME.colors.white,
  },
  userInfo: { overflow: 'hidden', flex: 1 },
  userName: {
    margin: 0,
    fontSize: THEME.Typography.fontSize.sm,
    fontWeight: THEME.Typography.fontWeight.semibold,
    color: THEME.colors.gray[900],
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    margin: `${THEME.spacing.xs}px 0 0 0`,
    fontSize: THEME.Typography.fontSize.xs,
    textTransform: 'capitalize',
    fontWeight: THEME.Typography.fontWeight.medium,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topbar: {
    background: THEME.colors.white,
    borderBottom: `1px solid ${THEME.colors.gray[200]}`,
    padding: `0 ${THEME.spacing.lg}px`,
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: THEME.colors.gray[600],
    cursor: 'pointer',
    fontSize: 20,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
    transition: `all ${THEME.transitions.fast}`,
  },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  newBugBtn: {
    background: THEME.colors.blue[500],
    color: THEME.colors.white,
    border: 'none',
    padding: `${THEME.spacing.sm - 1}px ${THEME.spacing.lg}px`,
    borderRadius: THEME.borderRadius.md,
    cursor: 'pointer',
    fontWeight: THEME.Typography.fontWeight.semibold,
    fontSize: THEME.Typography.fontSize.sm,
    transition: `all ${THEME.transitions.fast}`,
  },
  profileBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    borderRadius: THEME.borderRadius.full,
    transition: `all ${THEME.transitions.fast}`,
  },
  logoutBtn: {
    background: 'none',
    border: `1px solid ${THEME.colors.gray[300]}`,
    color: THEME.colors.gray[700],
    padding: `${THEME.spacing.sm - 1}px ${THEME.spacing.lg}px`,
    borderRadius: THEME.borderRadius.md,
    cursor: 'pointer',
    fontSize: THEME.Typography.fontSize.sm,
    fontWeight: THEME.Typography.fontWeight.medium,
    transition: `all ${THEME.transitions.fast}`,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: THEME.spacing.xl,
    background: THEME.colors.background.primary,
  },
};
