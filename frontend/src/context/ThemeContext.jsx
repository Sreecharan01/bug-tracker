import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LIGHT_THEME, DARK_THEME, setThemeTokens } from '../theme/designSystem';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    // 1. Check local storage
    const savedTheme = localStorage.getItem('bugTrackerTheme');
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto') {
      return savedTheme;
    }
    // 2. Default to auto
    return 'auto';
  });

  // Resolve active theme object from current mode
  const getActiveTheme = useCallback(() => {
    if (theme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? DARK_THEME : LIGHT_THEME;
    }
    return theme === 'dark' ? DARK_THEME : LIGHT_THEME;
  }, [theme]);

  // Apply theme to DOM
  useEffect(() => {
    const activeTheme = getActiveTheme();
    const isDark = activeTheme === DARK_THEME;
    setThemeTokens(theme);
    
    // Update HTML attribute
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // Update CSS variables (optional, for global theme colors)
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', activeTheme.colors.blue?.[500] || '#3B82F6');
    root.style.setProperty('--theme-bg', activeTheme.colors.background?.primary || '#FFFFFF');
  }, [theme, getActiveTheme]);

  // Listen to system theme changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Trigger re-render by calling getActiveTheme
      document.documentElement.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    if (!['light', 'dark', 'auto'].includes(newTheme)) return;
    if (newTheme === theme) return;
    setThemeTokens(newTheme);
    setThemeState(newTheme);
    localStorage.setItem('bugTrackerTheme', newTheme);
    window.location.reload();
  }, [theme]);

  const value = {
    theme,
    setTheme,
    activeTheme: getActiveTheme(),
    isDark: getActiveTheme() === DARK_THEME,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
