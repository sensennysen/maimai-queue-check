import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem('theme-mode');
    if (stored !== null) {
      return stored === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Save preference to localStorage
    localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');

    // Update CSS custom properties
    const root = document.documentElement;

    if (isDark) {
      // Dark Theme - Maimai DX Night version
      root.style.setProperty('--theme-background', '#1A0B2E'); // Deep Violet
      root.style.setProperty('--theme-surface', '#2D1B4E'); // Lighter Violet surface
      root.style.setProperty('--theme-primary', '#FF66CC'); // Neon Pink
      root.style.setProperty('--theme-secondary', '#66FFFF'); // Cyan
      root.style.setProperty('--theme-accent', '#FFFF66'); // Bright Yellow
      root.style.setProperty('--theme-text-primary', '#FFFFFF');
      root.style.setProperty('--theme-text-muted', '#B98AD6');

      // Derived colors
      root.style.setProperty('--theme-primary-hover', '#FF99DD');
      root.style.setProperty('--theme-secondary-hover', '#99FFFF');
      root.style.setProperty('--theme-accent-hover', '#FFFFA3');
      root.style.setProperty('--theme-surface-hover', '#3D2B5E');
      root.style.setProperty('--theme-border', '#4D2A66');
      root.style.setProperty('--theme-error', '#FF6B8B');
      root.style.setProperty('--theme-success', '#66D980');
      root.style.setProperty('--theme-warning', '#FFD700');

      // Player-specific colors
      root.style.setProperty('--theme-player1', '#FF66CC');
      root.style.setProperty('--theme-player2', '#66FFFF');

      document.body.setAttribute('data-theme', 'dark');
    } else {
      // Light Theme - Maimai DX Day version
      root.style.setProperty('--theme-background', '#FFF0F5'); // Soft Pink background
      root.style.setProperty('--theme-surface', '#FFFFFF');
      root.style.setProperty('--theme-primary', '#FF3399'); // Vivid Pink
      root.style.setProperty('--theme-secondary', '#00BFFF'); // Sky Blue
      root.style.setProperty('--theme-accent', '#FFD700'); // Gold
      root.style.setProperty('--theme-text-primary', '#2B1C2A');
      root.style.setProperty('--theme-text-muted', '#7B5A78');

      // Derived colors
      root.style.setProperty('--theme-primary-hover', '#FF66B2');
      root.style.setProperty('--theme-secondary-hover', '#33CCFF');
      root.style.setProperty('--theme-accent-hover', '#FFE44D');
      root.style.setProperty('--theme-surface-hover', '#F0F8FF');
      root.style.setProperty('--theme-border', '#FFB3D9');
      root.style.setProperty('--theme-error', '#D63352');
      root.style.setProperty('--theme-success', '#2DA74F');
      root.style.setProperty('--theme-warning', '#FFC107');

      // Player-specific colors
      root.style.setProperty('--theme-player1', '#FF3399');
      root.style.setProperty('--theme-player2', '#00BFFF');

      document.body.setAttribute('data-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};