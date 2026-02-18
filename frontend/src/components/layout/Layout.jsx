import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../theme/designSystem';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/bugs', label: 'Bugs' },
  { to: '/my-tasks', label: 'My Tasks' },
  { to: '/projects', label: 'Projects' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
  { to: '/users', label: 'Users', adminOnly: true },
  { to: '/profile', label: 'Profile' },
];

const Layout = () => {
  const { logout, isAdmin } = useAuth();
  const visibleLinks = links.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.title}>Bug Tracker</div>
        <nav style={styles.nav}>
          {visibleLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="app-hover sidebar-link"
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.logoutWrap}>
          <button type="button" className="app-hover" style={styles.logoutButton} onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    background: THEME.colors.background.primary,
  },
  sidebar: {
    background: THEME.colors.background.tertiary,
    borderRight: `1px solid ${THEME.colors.gray[200]}`,
    padding: THEME.spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: THEME.spacing.md,
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  title: {
    fontFamily: THEME.Typography.fontFamily,
    fontSize: THEME.Typography.fontSize.xl,
    fontWeight: THEME.Typography.fontWeight.bold,
    color: THEME.colors.gray[900],
    marginBottom: THEME.spacing.md,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: THEME.spacing.xs,
    flex: 1,
    minHeight: 0,
  },
  link: {
    textDecoration: 'none',
    color: THEME.colors.gray[700],
    borderRadius: THEME.borderRadius.md,
    padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`,
    fontFamily: THEME.Typography.fontFamily,
    fontSize: THEME.Typography.fontSize.base,
  },
  activeLink: {
    background: THEME.colors.blue[100],
    color: THEME.colors.blue[700],
    fontWeight: THEME.Typography.fontWeight.semibold,
  },
  logoutWrap: {
    marginTop: 'auto',
    paddingTop: THEME.spacing.md,
    borderTop: `1px solid ${THEME.colors.gray[200]}`,
  },
  logoutButton: {
    border: `1px solid ${THEME.colors.gray[300]}`,
    borderRadius: THEME.borderRadius.md,
    padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`,
    background: THEME.colors.background.tertiary,
    color: THEME.colors.gray[700],
    fontFamily: THEME.Typography.fontFamily,
    cursor: 'pointer',
  },
  main: {
    padding: THEME.spacing.xl,
    minWidth: 0,
  },
};

export default Layout;