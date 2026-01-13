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
      // Dark Theme
      root.style.setProperty('--theme-background', '#140018');
      root.style.setProperty('--theme-surface', '#22002A');
      root.style.setProperty('--theme-primary', '#FF4FB7');
      root.style.setProperty('--theme-secondary', '#31E0E7');
      root.style.setProperty('--theme-accent', '#FFE35A');
      root.style.setProperty('--theme-text-primary', '#FFFFFF');
      root.style.setProperty('--theme-text-muted', '#B98AD6');
      
      // Derived colors for better UX and readability
      root.style.setProperty('--theme-primary-hover', '#FF6BC4');
      root.style.setProperty('--theme-secondary-hover', '#4AE6EC');
      root.style.setProperty('--theme-accent-hover', '#FFEB70');
      root.style.setProperty('--theme-surface-hover', '#330040');
      root.style.setProperty('--theme-border', '#4D0066');
      root.style.setProperty('--theme-error', '#FF6B8B');
      root.style.setProperty('--theme-success', '#66D980');
      root.style.setProperty('--theme-warning', '#FFE35A');
      
      // Player-specific colors for dark theme (brighter for visibility)
      root.style.setProperty('--theme-player1', '#FF6BC4');
      root.style.setProperty('--theme-player2', '#4AE6EC');
      
      document.body.setAttribute('data-theme', 'dark');
    } else {
      // Light Theme
      root.style.setProperty('--theme-background', '#FFF2F8');
      root.style.setProperty('--theme-surface', '#FFFFFF');
      root.style.setProperty('--theme-primary', '#FF4FB7');
      root.style.setProperty('--theme-secondary', '#31E0E7');
      root.style.setProperty('--theme-accent', '#FFE35A');
      root.style.setProperty('--theme-text-primary', '#2B1C2A');
      root.style.setProperty('--theme-text-muted', '#7B5A78');
      
      // Derived colors for better UX and readability
      root.style.setProperty('--theme-primary-hover', '#E63FA0');
      root.style.setProperty('--theme-secondary-hover', '#1FC7CE');
      root.style.setProperty('--theme-accent-hover', '#FFEB70');
      root.style.setProperty('--theme-surface-hover', '#FFF5FB');
      root.style.setProperty('--theme-border', '#E8D8E8');
      root.style.setProperty('--theme-error', '#D63352');
      root.style.setProperty('--theme-success', '#2DA74F');
      root.style.setProperty('--theme-warning', '#CC9000');
      
      // Player-specific colors for light theme (darker for readability)
      root.style.setProperty('--theme-player1', '#D63FA0');
      root.style.setProperty('--theme-player2', '#008B93');
      
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