import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { THEME } from '../theme/designSystem';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const modes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto (System)' },
  ];

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Settings</h1>
          <p style={s.sub}>Choose your theme mode</p>
        </div>
      </div>

      <div style={s.section}>
        <h3 style={s.catTitle}>🎨 Appearance</h3>
        <div style={s.options}>
          {modes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setTheme(mode.value)}
              style={{
                ...s.option,
                ...(theme === mode.value ? s.optionActive : {}),
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { maxWidth: 900, margin: '0 auto', fontFamily: THEME.Typography.fontFamily },
  header: { marginBottom: THEME.spacing.xl },
  title: { margin: 0, fontSize: THEME.Typography.fontSize['2xl'], fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900] },
  sub: { margin: `${THEME.spacing.sm}px 0 0`, color: THEME.colors.gray[500], fontSize: THEME.Typography.fontSize.base },
  section: { background: THEME.colors.white, borderRadius: THEME.borderRadius.lg, border: `1px solid ${THEME.colors.gray[200]}`, marginBottom: THEME.spacing.lg, overflow: 'hidden', boxShadow: THEME.shadows.sm },
  catTitle: { margin: 0, padding: `${THEME.spacing.md}px ${THEME.spacing.xl}px`, fontSize: THEME.Typography.fontSize.base, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900], borderBottom: `1px solid ${THEME.colors.gray[200]}`, background: THEME.colors.gray[50], textTransform: 'capitalize' },
  options: { display: 'flex', gap: THEME.spacing.md, padding: THEME.spacing.xl, flexWrap: 'wrap' },
  option: {
    border: `1px solid ${THEME.colors.gray[300]}`,
    borderRadius: THEME.borderRadius.md,
    padding: `${THEME.spacing.sm}px ${THEME.spacing.lg}px`,
    background: THEME.colors.white,
    color: THEME.colors.gray[700],
    cursor: 'pointer',
    fontSize: THEME.Typography.fontSize.base,
    fontWeight: THEME.Typography.fontWeight.medium,
  },
  optionActive: {
    borderColor: THEME.colors.blue[500],
    background: THEME.colors.blue[100],
    color: THEME.colors.blue[700],
    fontWeight: THEME.Typography.fontWeight.semibold,
  },
};
