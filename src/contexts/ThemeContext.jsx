import { createContext, useContext, useState, useEffect } from 'react';
import { themes } from '../config/theme';

const ThemeContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};


// Theme Context provider
export const ThemeProvider = ({ children }) => {
  // Theme Mode: Light/Dark
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme-mode');
    if (stored !== null) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Selected Theme: Circle, Prism, etc.
  const [currentTheme, setCurrentTheme] = useState(() => {
    const stored = localStorage.getItem('app-theme');
    // Default to 'circle' if not set or invalid
    return (stored && themes[stored]) ? stored : 'circle';
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
    localStorage.setItem('app-theme', currentTheme);

    const root = document.documentElement;
    const themeConfig = themes[currentTheme] || themes.circle;
    const mode = isDark ? 'dark' : 'light';
    const cssVars = themeConfig.css[mode];

    // Apply CSS variables
    root.style.setProperty('--theme-background', cssVars.background);
    root.style.setProperty('--theme-surface', cssVars.surface);
    root.style.setProperty('--theme-primary', cssVars.primary);
    root.style.setProperty('--theme-secondary', cssVars.secondary);
    root.style.setProperty('--theme-accent', cssVars.accent);
    root.style.setProperty('--theme-text-primary', cssVars.textPrimary);
    root.style.setProperty('--theme-text-muted', cssVars.textMuted);
    root.style.setProperty('--theme-border', cssVars.border);
    root.style.setProperty('--theme-tab-highlight', cssVars.tabHighlight || cssVars.primary);

    // Derived colors could be calculated or added to theme config
    // For now, let's just set some basic derivatives based on primary/secondary
    // Or we could have added them to the theme config.
    // Let's assume standard derivatives for now or keep existing hardcoded ones if they match?
    // The previous implementation had hardcoded derivatives in useEffect.
    // It's better to update theme config to include these or calculate them.
    // To save time and complexity, I will set them to the main colors or slight variations if I can't calculate them easily.
    // Actually, let's look at what was there.
    // --theme-primary-hover, etc.
    // I will set them to the main color for now to ensure consistency, 
    // or maybe I can skip them if the CSS uses standard buttons which might handle hovering mostly via filter?
    // The existing index.css uses --theme-primary-hover.
    // I will set hover to main color for now to avoid broken vars, 
    // effectively disabling distinct hover colors for Prism unless I add them to config.
    // Implementation Plan didn't specify derivatives.

    root.style.setProperty('--theme-primary-hover', cssVars.primary);
    root.style.setProperty('--theme-secondary-hover', cssVars.secondary);
    root.style.setProperty('--theme-accent-hover', cssVars.accent);
    root.style.setProperty('--theme-surface-hover', cssVars.surface); // maybe slightly different?

    // Status colors - stick to defaults or theme specific?
    // Circle theme had specific ones. Prism doesn't specify.
    // I'll leave error/success/warning as default hardcoded for now or use the theme's if available.
    // The previous code had them hardcoded per mode.
    // Let's set some reasonable defaults.
    root.style.setProperty('--theme-error', isDark ? '#FF6B6B' : '#D63352');
    root.style.setProperty('--theme-success', isDark ? '#88FF00' : '#2DA74F'); // Lime Digital / Green
    root.style.setProperty('--theme-warning', '#FFD200');

    // Player specific
    root.style.setProperty('--theme-player1', cssVars.primary);
    root.style.setProperty('--theme-player2', cssVars.secondary);

    document.body.setAttribute('data-theme', mode); // still needed for some CSS selectors
    document.body.setAttribute('data-palette', currentTheme); // helpful for debug or specific overrides
  }, [isDark, currentTheme]);

  const toggleTheme = () => setIsDark(!isDark);
  const setTheme = (themeName) => setCurrentTheme(themeName);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};