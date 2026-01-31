import { createTheme } from '@mantine/core';

export const getSubtitleColor = (weight) => {
  if (weight === 10) return undefined;
  if (weight > 5) return '#CD7F32'; // Bronze
  if (weight > 2) return '#C0C0C0'; // Silver
  return '#FFD700'; // Gold
};

export const theme = createTheme({
  colors: {
    primary: ['#FFE5F3', '#FFB3D9', '#FF80BF', '#FF4DA6', '#FF1F8E', '#E60073', '#B30059', '#800040', '#4D0026', '#1A000D'], // Maimai Pink range
    secondary: ['#E0F7FA', '#B3E5FC', '#81D4FA', '#4FC3F7', '#29B6F6', '#03A9F4', '#0288D1', '#0277BD', '#01579B', '#000000'], // Cyan/Blue range
    accent: ['#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17'], // Yellow/Gold range
  },
  primaryColor: 'primary',
  fontFamily: "'Poppins', system-ui, -apple-system, sans-serif",
  headings: {
    fontFamily: "'Poppins', system-ui, -apple-system, sans-serif",
    fontWeight: 600,
  },
});
