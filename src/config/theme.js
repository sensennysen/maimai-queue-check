import { createTheme } from '@mantine/core';

export const getSubtitleColor = (weight) => {
  if (weight === 10) return undefined;
  if (weight > 5) return '#CD7F32'; // Bronze
  if (weight > 2) return '#C0C0C0'; // Silver
  return '#FFD700'; // Gold
};

export const theme = createTheme({
  colors: {
    primary: ['#FFE5F3', '#FFB3D9', '#FF80BF', '#FF4FB7', '#FF1FA5', '#E6008C', '#B30066', '#80004D', '#4D0033', '#1A0019'],
    secondary: ['#E8FDFE', '#A8F5F8', '#6BEFF3', '#31E0E7', '#00D4DB', '#00B8C0', '#009BA3', '#007E86', '#006169', '#00444C'],
    accent: ['#FFFCE6', '#FFFAB3', '#FFF780', '#FFE35A', '#FFD000', '#E6BB00', '#B39200', '#806900', '#4D4000', '#1A1600'],
  },
  primaryColor: 'primary',
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    fontWeight: 600,
  },
});
