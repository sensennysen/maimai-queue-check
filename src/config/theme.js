import { createTheme } from '@mantine/core';

// getSubtitleColor removed - defined below

// Theme definitions and helpers
// Duplicate import removed

// Base constants
export const FONT_FAMILY = "'Poppins', system-ui, -apple-system, sans-serif";

// Theme Palettes
export const themes = {
  circle: {
    name: 'Circle',
    type: 'light',
    colors: {
      primary: [ // Maimai Pink - Bright and Punchy
        '#FFF0F9', '#FFD6F0', '#FFA8E1', '#FF7AD2', '#FF4CC3', 
        '#FF28A9', '#D9168B', '#B30E70', '#8D0856', '#66043D'
      ],
      secondary: [ // Electric Blue
        '#E0FBFF', '#B3F4FF', '#80ECFF', '#4DE5FF', '#1ADDFF', 
        '#00D2FF', '#00A8CC', '#007E99', '#005466', '#002A33'
      ],
      accent: [ // Star Yellow
        '#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', 
        '#FFD200', '#FBC02D', '#F9A825', '#F57F17', '#E65100'
      ],
    },
    css: {
      light: {
        // WARM PINK FOUNDATION. No longer just "off-white".
        background: '#FFF0F5', // A distinct light pink background
        surface: '#FFFFFF', // Pure white cards pop against the pink BG
        primary: '#FF28A9',
        secondary: '#00D2FF',
        accent: '#FFD200',
        textPrimary: '#4A0E2E', // Deep Plum text for warmth
        textMuted: '#9E7C92',
        border: '#FFB6C1', // Light pink border
        tabHighlight: '#FF28A9', // Primary
      },
      dark: { 
        // PURE NEON ARCADE BLACK. High contrast.
        background: '#000000', // Pure black for max neon contrast
        surface: '#121212', // Very dark grey surface
        primary: '#FF4CC3', // Brighter neon pink
        secondary: '#00D2FF',
        accent: '#88FF00', // Neon Lime
        textPrimary: '#FFFFFF',
        textMuted: '#B0B0B0',
        border: '#FF28A9', // Pink border glows against the black
        tabHighlight: '#FF4CC3', // Primary
      }
    }
  },
  prism: {
    name: 'Prism',
    type: 'light',
    colors: {
      primary: [ // Prism Purple - Softer and dreamier
        '#F3F0FF', '#E5DBFF', '#D0BFFF', '#B197FC', '#9775FA', 
        '#845EF7', '#7950F2', '#7048E8', '#6741D9', '#5F3DC4'
      ],
      secondary: [ // Mint Sky - Cool and airy
        '#E3FAFC', '#C5F6FA', '#99E9F2', '#66D9E8', '#3BC9DB', 
        '#22B8CF', '#15AABF', '#1098AD', '#0C8599', '#0B7285'
      ],
      accent: [ // Soft Gold
        '#FFFFF0', '#FFFACD', '#FFF8DC', '#FFEC8B', '#FFD700',
        '#FFC125', '#FFB90F', '#CD950C', '#8B6508', '#553D05'
      ]
    },
    css: {
      light: {
        // COOL SKY FOUNDATION. Instantly different from Circle.
        background: '#E6F7FF', // A distinct light sky-blue background
        surface: '#F0F8FF', // Alice Blue cards blend with the sky
        primary: '#5C4B99',
        secondary: '#22B8CF', // A clearer mint/cyan
        accent: '#FFD700',
        textPrimary: '#1A233B', // Deep Navy text for coolness
        textMuted: '#6E7A8F',
        border: '#BEE3F8', // Light blue border
        tabHighlight: '#22B8CF', // Secondary (Clear Mint)
      },
      dark: { 
        // DEEP MIDNIGHT INDIGO. Not black.
        background: '#0A0E29', // Rich, deep indigo background
        surface: '#1A1B41', // Slightly lighter indigo surface
        primary: '#9775FA', // Lighter glowing purple
        secondary: '#99E9F2', // Glowing mint
        accent: '#FFFACD', // Soft lemon glow
        textPrimary: '#E6E6FA', // Lavender text
        textMuted: '#A9A9E0',
        border: '#5C4B99', // Purple border
        tabHighlight: '#99E9F2', // Secondary (Glowing Mint)
      }
    }
  },
  buddies: {
    name: 'Buddies',
    type: 'light',
    colors: {
      primary: [ // Energy Orange
        '#FFF4E6', '#FFE8CC', '#FFD8A8', '#FFC078', '#FFA94D', 
        '#FF922B', '#FD7E14', '#F76707', '#E8590C', '#D9480F'
      ],
      secondary: [ // Splash Blue
        '#E7F5FF', '#D0EBFF', '#A5D8FF', '#74C0FC', '#4DABF7', 
        '#339AF0', '#228BE6', '#1C7ED6', '#1971C2', '#1864AB'
      ],
      accent: [ // Bud Green (Lime-ish)
        '#F4FCE3', '#E9FAC8', '#D8F5A2', '#C0EB75', '#A9E34B', 
        '#8CE99A', '#69DB7C', '#51CF66', '#40C057', '#37B24D'
      ]
    },
    css: {
      light: {
        // SUNNY ENERGY.
        background: '#FFF9DB', // Very light warm yellow/cream
        surface: 'rgba(255, 255, 255, 0.9)', 
        primary: '#FF922B', // Orange
        secondary: '#339AF0', // Blue
        accent: '#51CF66', // Green
        textPrimary: '#495057', // Dark Grey
        textMuted: '#868E96',
        border: '#FFD8A8', // Light orange border
        tabHighlight: '#FF922B', // Primary
      },
      dark: { 
        // NIGHT ENERGY.
        background: '#101418', // Dark grey/blue
        surface: 'rgba(33, 37, 41, 0.8)', 
        primary: '#FF922B', // Orange glows
        secondary: '#339AF0', // Blue
        accent: '#69DB7C', // Green
        textPrimary: '#F8F9FA',
        textMuted: '#ADB5BD',
        border: '#FD7E14',
        tabHighlight: '#FF922B', // Primary
      }
    }
  }
};

export const getSubtitleColor = (weight) => {
  if (weight === 10) return undefined;
  if (weight > 5) return '#CD7F32'; // Bronze
  if (weight > 2) return '#C0C0C0'; // Silver
  return '#FFD700'; // Gold
};

// Default theme (Circle) for initial load or fallback
export const theme = createTheme({
  primaryColor: 'primary',
  colors: {
    primary: themes.circle.colors.primary,
    secondary: themes.circle.colors.secondary,
    accent: themes.circle.colors.accent,
  },
  fontFamily: FONT_FAMILY,
  headings: {
    fontFamily: FONT_FAMILY,
    fontWeight: 600,
  },
  components: {
    Button: {
      defaultProps: {
        variant: 'filled',
        color: 'primary',
      },
    },
    Modal: {
      defaultProps: {
        removeScrollProps: { allowPinchZoom: true },
      },
    },
    Paper: {
     styles: () => ({
        root: {
           // handled by CSS variables/classes
        }
       })
    }
  }
});
