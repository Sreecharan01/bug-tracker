// Professional Minimal Design System - Light and Dark Modes

// Shared typography, spacing, and other design tokens (same for both themes)
const sharedTokens = {
  Typography: {
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", sans-serif',
    fontSize: {
      xs: 12,
      sm: 13,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
      '3xl': 24,
      '4xl': 32,
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.3,
      normal: 1.5,
      relaxed: 1.7,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
  },

  borderRadius: {
    none: 0,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    full: 9999,
  },

  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },

  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
};

// LIGHT THEME
export const LIGHT_THEME = {
  colors: {
    // Neutrals
    white: '#FFFFFF',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    // Primary
    blue: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
    },
    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    // Backgrounds (light mode)
    background: {
      primary: '#F9FAFB',
      secondary: '#F3F4F6',
      tertiary: '#FFFFFF',
    },
  },
  ...sharedTokens,
};

// DARK THEME
export const DARK_THEME = {
  colors: {
    // Neutrals (inverted)
    white: '#1F2937',
    gray: {
      50: '#374151',
      100: '#4B5563',
      200: '#6B7280',
      300: '#9CA3AF',
      400: '#D1D5DB',
      500: '#E5E7EB',
      600: '#F3F4F6',
      700: '#F9FAFB',
      800: '#F9FAFB',
      900: '#FFFFFF',
    },
    // Primary (adjusted for contrast)
    blue: {
      50: '#1D4ED8',
      100: '#2563EB',
      500: '#60A5FA',
      600: '#93C5FD',
      700: '#DBEAFE',
    },
    // Status colors (adjusted for dark mode)
    success: '#34D399',
    warning: '#FCD34D',
    error: '#F87171',
    info: '#60A5FA',
    // Backgrounds (dark mode)
    background: {
      primary: '#111827',
      secondary: '#1F2937',
      tertiary: '#374151',
    },
  },
  ...sharedTokens,
};

const getInitialMode = () => {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem('bugTrackerTheme');
  if (saved === 'light' || saved === 'dark') return saved;
  if (saved === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const resolveThemeByMode = (mode) => {
  if (mode === 'auto' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME;
  }
  return mode === 'dark' ? DARK_THEME : LIGHT_THEME;
};

// Mutable theme tokens used by existing pages
export let THEME = getInitialMode() === 'dark' ? DARK_THEME : LIGHT_THEME;

export const setThemeTokens = (mode) => {
  THEME = resolveThemeByMode(mode);
  return THEME;
};

// Pre-built component style objects
export const componentStyles = {
  button: {
    primary: {
      background: THEME.colors.blue[500],
      color: THEME.colors.white,
      border: 'none',
      padding: `${THEME.spacing.sm}px ${THEME.spacing.lg}px`,
      borderRadius: THEME.borderRadius.md,
      fontSize: THEME.Typography.fontSize.sm,
      fontWeight: THEME.Typography.fontWeight.semibold,
      cursor: 'pointer',
      transition: `background ${THEME.transitions.fast}`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: THEME.spacing.sm,
      '&:hover': {
        background: THEME.colors.blue[600],
      },
    },
    secondary: {
      background: THEME.colors.gray[100],
      color: THEME.colors.gray[700],
      border: `1px solid ${THEME.colors.gray[300]}`,
      padding: `${THEME.spacing.sm}px ${THEME.spacing.lg}px`,
      borderRadius: THEME.borderRadius.md,
      fontSize: THEME.Typography.fontSize.sm,
      fontWeight: THEME.Typography.fontWeight.semibold,
      cursor: 'pointer',
      transition: `all ${THEME.transitions.fast}`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: THEME.spacing.sm,
    },
    ghost: {
      background: 'transparent',
      color: THEME.colors.gray[600],
      border: 'none',
      padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`,
      borderRadius: THEME.borderRadius.md,
      fontSize: THEME.Typography.fontSize.sm,
      fontWeight: THEME.Typography.fontWeight.semibold,
      cursor: 'pointer',
      transition: `all ${THEME.transitions.fast}`,
    },
  },

  input: {
    base: {
      outline: 'none',
      border: `1px solid ${THEME.colors.gray[300]}`,
      borderRadius: THEME.borderRadius.md,
      padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`,
      fontSize: THEME.Typography.fontSize.sm,
      fontFamily: THEME.Typography.fontFamily,
      transition: `border ${THEME.transitions.fast}`,
      background: THEME.colors.white,
      color: THEME.colors.gray[900],
    },
  },

  card: {
    base: {
      background: THEME.colors.white,
      border: `1px solid ${THEME.colors.gray[200]}`,
      borderRadius: THEME.borderRadius.lg,
      boxShadow: THEME.shadows.sm,
    },
  },

  badge: {
    primary: {
      background: THEME.colors.blue[100],
      color: THEME.colors.blue[700],
      padding: `${THEME.spacing.xs}px ${THEME.spacing.sm}px`,
      borderRadius: THEME.borderRadius.sm,
      fontSize: THEME.Typography.fontSize.xs,
      fontWeight: THEME.Typography.fontWeight.semibold,
    },
    success: {
      background: '#DCFCE7',
      color: '#15803D',
      padding: `${THEME.spacing.xs}px ${THEME.spacing.sm}px`,
      borderRadius: THEME.borderRadius.sm,
      fontSize: THEME.Typography.fontSize.xs,
      fontWeight: THEME.Typography.fontWeight.semibold,
    },
    error: {
      background: '#FEE2E2',
      color: '#991B1B',
      padding: `${THEME.spacing.xs}px ${THEME.spacing.sm}px`,
      borderRadius: THEME.borderRadius.sm,
      fontSize: THEME.Typography.fontSize.xs,
      fontWeight: THEME.Typography.fontWeight.semibold,
    },
  },
};
