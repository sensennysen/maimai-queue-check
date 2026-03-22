import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { themes } from '../config/theme';

const ThemeContext = createContext();

// The hook and provider are co-located intentionally (standard React context pattern).
// Splitting into separate files would add indirection without benefit.
 
/**
 * Custom hook to access the global Theme context.
 * Provides current theme settings, mode, and color transformation utilities.
 * @returns {Object} The Theme context value.
 * @throws {Error} If used outside of a ThemeProvider.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};


// Theme Context provider
/**
 * Provider component for the global Theme context.
 * Manages theme mode (light/dark), color palettes, and synchronization with CSS variables.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to be wrapped by the provider.
 * @returns {JSX.Element} The rendered context provider.
 */
export const ThemeProvider = ({ children }) => {
  // Compute relative luminance from a hex color string
  const getLuminance = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 0;
    const [r, g, b] = [1, 2, 3].map((i) => {
      const c = parseInt(result[i], 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // Theme Mode: Light/Dark
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme-mode');
    if (stored !== null) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Selected Theme: Circle, Prism, etc.
  const [currentTheme, setCurrentTheme] = useState(() => {
    const stored = localStorage.getItem('app-theme');
    // Default to 'universe' or first available if not set or invalid
    return (stored && themes[stored]) ? stored : 'universe';
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

    // Calculate contrast for primary color
    const primaryLum = getLuminance(cssVars.primary);
    const contrastColor = primaryLum > 0.5 ? '#1A233B' : '#FFFFFF';
    root.style.setProperty('--theme-primary-contrast', contrastColor);

    // Set hover variations (slightly darker for light mode, lighter for dark mode)
    root.style.setProperty('--theme-primary-hover', isDark ? 
      `color-mix(in srgb, ${cssVars.primary}, white 15%)` : 
      `color-mix(in srgb, ${cssVars.primary}, black 15%)`
    );
    root.style.setProperty('--theme-secondary-hover', isDark ? 
      `color-mix(in srgb, ${cssVars.secondary}, white 15%)` : 
      `color-mix(in srgb, ${cssVars.secondary}, black 15%)`
    );

    document.body.setAttribute('data-theme', mode); // still needed for some CSS selectors
    document.body.setAttribute('data-palette', currentTheme); // helpful for debug or specific overrides
  }, [isDark, currentTheme]);

  const toggleTheme = () => setIsDark(!isDark);
  const setTheme = (themeName) => setCurrentTheme(themeName);

  // Expose resolved theme info for component consumption
  const themeColors = useMemo(() => {
    const themeConfig = themes[currentTheme] || themes.circle;
    const mode = isDark ? 'dark' : 'light';
    const css = themeConfig.css[mode];

    // Rank the three palettes by luminance so components can pick by brightness
    const palettes = [
      { name: 'primary', lum: getLuminance(css.primary) },
      { name: 'secondary', lum: getLuminance(css.secondary) },
      { name: 'accent', lum: getLuminance(css.accent) },
    ].sort((a, b) => a.lum - b.lum);

    return {
      // Mantine color palette names (registered in createTheme)
      primary: 'primary',
      secondary: 'secondary',
      accent: 'accent',
      // Brightness-ordered palette names
      lightest: palettes[2].name,
      darkest: palettes[0].name,
      // Resolved CSS values for the current mode
      css,
    };
  }, [currentTheme, isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, currentTheme, setTheme, themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};