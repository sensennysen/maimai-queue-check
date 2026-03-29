import { createTheme } from '@mantine/core';

// getSubtitleColor removed - defined below

// Theme definitions and helpers
// Duplicate import removed

// Base constants
export const FONT_FAMILY = "'Nunito', system-ui, -apple-system, sans-serif";
export const HEADING_FONT_FAMILY = "'Fredoka', sans-serif";

// Theme Palettes
export const themes = {
  circle: {
    name: 'Circle',
    type: 'light',
    colors: {
      primary: [
        '#FFF0F8',
        '#FFD9EE',
        '#FFC1E3',
        '#FFA7D7',
        '#FF8DCB',
        '#FF4FAF', // Circle v2 main pink
        '#E73D9D',
        '#C92F86',
        '#A7226D',
        '#7A154F'
      ],

      secondary: [
        '#ECFAFF',
        '#D2F4FF',
        '#B6EDFF',
        '#98E4FF',
        '#77DAFF',
        '#3BC9FF', // Circle v2 cyan
        '#21B5EA',
        '#0F9CCF',
        '#0C7EAA',
        '#0A617F'
      ],

      accent: [
        '#F4FFE6',
        '#E9FFD0',
        '#DBFFB5',
        '#CCFF99',
        '#BBFF79',
        '#A6F54D', // Circle v2 lime accent
        '#8ED53A',
        '#74B22B',
        '#5A8B20',
        '#3F6316'
      ],
    },

    css: {
      light: {
        background: '#FFF0F8',
        surface: '#FFF3F9',
        primary: '#FF4FAF',
        secondary: '#3BC9FF',
        accent: '#A6F54D',
        textPrimary: '#311325',
        textMuted: '#6B4D60',
        border: 'rgba(255, 79, 175, 0.24)',
        tabHighlight: '#FF4FAF',
      },

      dark: {
        background: '#130818',
        surface: '#221029',
        primary: '#FF6CBD',
        secondary: '#63D7FF',
        accent: '#B8FF6A',
        textPrimary: '#FFEAF5',
        textMuted: '#C8AFC1',
        border: 'rgba(255, 108, 189, 0.30)',
        tabHighlight: '#FF6CBD',
      }
    }
  },
  prism: {
    name: 'Prism',
    type: 'light',
    colors: {
      primary: [
        '#E0F8FF',
        '#B9EEFF',
        '#8FE3FF',
        '#66D8FF',
        '#3BCCFF',
        '#03A9F4', // primary anchor (kept)
        '#0097DB',
        '#0083C0',
        '#006FA4',
        '#005680'
      ],

      secondary: [
        '#F1E6FF',
        '#E0CFFF',
        '#CDB6FF',
        '#BA9EFF',
        '#A885FF',
        '#9570FF', // lavender outline tone
        '#8260E0',
        '#6E50BF',
        '#5A409E',
        '#46317A'
      ],

      accent: [
        '#E8FBFF',
        '#CFF5FF',
        '#B6EEFF',
        '#9DE7FF',
        '#84E0FF',
        '#6BD9FF',
        '#54C5EA',
        '#3FB0D3',
        '#2A9BBC',
        '#1686A5'
      ],
    },

    css: {
      light: {
        background: '#EEF9FF',
        surface: '#F5FBFF',
        primary: '#0086CC',
        secondary: '#7A58E8',
        accent: '#66D8FF',
        textPrimary: '#0F1E30',
        textMuted: '#526070',
        border: 'rgba(0, 134, 204, 0.25)',
        tabHighlight: '#0086CC',
      },

      dark: {
        background: '#07131F',
        surface: '#0F1E2D',
        primary: '#4FC3F7',
        secondary: '#A885FF',
        accent: '#66D8FF',
        textPrimary: '#E6F4FF',
        textMuted: '#94A3B8',
        border: 'rgba(79, 195, 247, 0.25)',
        tabHighlight: '#4FC3F7',
      }
    }
  },
  buddies: {
    name: 'Buddies',
    type: 'light',
    colors: {
      primary: [
        '#FFFDE7',
        '#FFF9C4',
        '#FFF59D',
        '#FFF176',
        '#FFEE58',
        '#FFD700', // primary anchor (kept)
        '#FBC02D',
        '#F9A825',
        '#F57F17',
        '#E65100'
      ],

      secondary: [
        '#FFF0E6',
        '#FFD9C2',
        '#FFC39D',
        '#FFAD78',
        '#FF9753',
        '#FF7A2F', // buddies orange tone
        '#E66726',
        '#CC551E',
        '#B34316',
        '#8F310F'
      ],

      accent: [
        '#FFE4EC',
        '#FFC8D9',
        '#FFABC6',
        '#FF8FB3',
        '#FF729F',
        '#FF4A8A', // pink accents found in logo sparkles
        '#E63F79',
        '#CC3568',
        '#B32A57',
        '#8F1E3E'
      ],
    },

    css: {
      light: {
        background: '#FFF5D6',
        surface: '#FFF9E8',
        primary: '#C49000',
        secondary: '#D45800',
        accent: '#D63070',
        textPrimary: '#3E2723',
        textMuted: '#7A5B50',
        border: 'rgba(196, 144, 0, 0.35)',
        tabHighlight: '#C49000',
      },

      dark: {
        background: '#1A1208',
        surface: '#2A1B10',
        primary: '#FFD700',
        secondary: '#FF9753',
        accent: '#FF729F',
        textPrimary: '#FFF8E1',
        textMuted: '#D7CCC8',
        border: 'rgba(255, 183, 0, 0.25)',
        tabHighlight: '#FFD700',
      }
    }
  },
  festival: {
    name: 'Festival',
    type: 'light',
    colors: {
      primary: [
        '#F3E5F5',
        '#E1BEE7',
        '#CE93D8',
        '#BA68C8',
        '#AB47BC',
        '#9C27B0', // primary anchor (kept)
        '#8E24AA',
        '#7B1FA2',
        '#6A1B9A',
        '#4A148C'
      ],

      secondary: [
        '#FFF3E0',
        '#FFE0B2',
        '#FFCC80',
        '#FFB74D',
        '#FFA726',
        '#FF9800', // festival lantern / fireworks orange
        '#FB8C00',
        '#F57C00',
        '#EF6C00',
        '#E65100'
      ],

      accent: [
        '#FFE9F6',
        '#FFC7E6',
        '#FFA4D6',
        '#FF82C6',
        '#FF5FB6',
        '#FF3CA6', // bright spark highlight
        '#E63296',
        '#CC2885',
        '#B31F74',
        '#8F1458'
      ],
    },

    css: {
      light: {
        background: '#F6EEFF',
        surface: '#FAF3FF',
        primary: '#7E1FA0',
        secondary: '#C96600',
        accent: '#CC1F84',
        textPrimary: '#2D0A3D',
        textMuted: '#6E4C7A',
        border: 'rgba(126, 31, 160, 0.3)',
        tabHighlight: '#7E1FA0',
      },

      dark: {
        background: '#16081E',
        surface: '#2D113D',
        primary: '#BA68C8',
        secondary: '#FFB74D',
        accent: '#FF82C6',
        textPrimary: '#F8F9FA',
        textMuted: '#ADB5BD',
        border: 'rgba(186, 104, 200, 0.35)',
        tabHighlight: '#BA68C8',
      }
    }
  },
  universe: {
    name: 'Universe',
    type: 'light',
    colors: {
      primary: [
        '#E3F2FD',
        '#BBDEFB',
        '#90CAF9',
        '#64B5F6',
        '#42A5F5',
        '#1E90FF', // primary anchor (kept)
        '#1E88E5',
        '#1976D2',
        '#1565C0',
        '#0D47A1'
      ],

      secondary: [
        '#FFE4F1',
        '#FFC6E0',
        '#FFA8CF',
        '#FF8ABE',
        '#FF6CAD',
        '#F06292', // nebula magenta tone
        '#E05282',
        '#C84371',
        '#B03460',
        '#8C234A'
      ],

      accent: [
        '#FFFDE7',
        '#FFF9C4',
        '#FFF59D',
        '#FFF176',
        '#FFEE58',
        '#FFD54F', // star highlight color
        '#FBC02D',
        '#F9A825',
        '#F57F17',
        '#E65100'
      ],
    },

    css: {
      light: {
        background: '#E8F4FF',
        surface: '#F2F9FF',
        primary: '#0E7DD8',
        secondary: '#D44B7B',
        accent: '#D4930A',
        textPrimary: '#0A192F',
        textMuted: '#3D5068',
        border: 'rgba(14, 125, 216, 0.3)',
        tabHighlight: '#0E7DD8',
      },

      dark: {
        background: '#040C18',
        surface: '#0A192F',
        primary: '#1E90FF',
        secondary: '#FF6CAD',
        accent: '#FFD54F',
        textPrimary: '#E2E8F0',
        textMuted: '#94A3B8',
        border: 'rgba(30, 144, 255, 0.25)',
        tabHighlight: '#1E90FF',
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
    fontFamily: HEADING_FONT_FAMILY,
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
