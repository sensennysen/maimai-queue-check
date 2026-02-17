/**
 * Maimai DX Constants and Enums
 * Centralized configuration for maimai-specific values
 */

// CloudFront base URL for song jacket images
export const BASE_JACKET_URL = import.meta.env.VITE_SONG_JACKETS_URL;

// Difficulty color mappings (RGB values)
export const DIFFICULTY_COLORS = {
  'Basic': 'rgb(34, 187, 91)',
  'Advanced': 'rgb(251, 156, 45)',
  'Expert': 'rgb(246, 72, 97)',
  'Master': 'rgb(158, 69, 226)',
  'Re:Master': 'rgb(186, 103, 248)',
};

// Letter grade thresholds based on achievement percentage
export const GRADE_THRESHOLDS = [
  { min: 100.5, grade: 'SSS+' },
  { min: 100.0, grade: 'SSS' },
  { min: 99.5, grade: 'SS+' },
  { min: 99.0, grade: 'SS' },
  { min: 98.0, grade: 'S+' },
  { min: 97.0, grade: 'S' },
  { min: 94.0, grade: 'AAA' },
  { min: 90.0, grade: 'AA' },
  { min: 80.0, grade: 'A' },
  { min: 70.0, grade: 'B' },
  { min: 60.0, grade: 'C' },
  { min: 50.0, grade: 'D' },
  { min: 0, grade: 'F' },
];

// Versions considered "New" for Best 50 calculation
export const NEW_VERSIONS = ['PRiSM PLUS', 'CiRCLE'];

// Rating calculation rate thresholds
export const RATING_RATES = [
  { min: 100.5, rate: 22.4 },
  { min: 100.0, rate: 21.6 },
  { min: 99.5, rate: 21.1 },
  { min: 99.0, rate: 20.8 },
  { min: 98.0, rate: 20.3 },
  { min: 97.0, rate: 20.0 },
  { min: 94.0, rate: 16.8 },
  { min: 90.0, rate: 15.2 },
  { min: 80.0, rate: 13.6 },
  { min: 75.0, rate: 12.0 },
  { min: 70.0, rate: 11.2 },
  { min: 60.0, rate: 9.6 },
  { min: 50.0, rate: 8.0 },
  { min: 40.0, rate: 6.4 },
  { min: 30.0, rate: 4.8 },
  { min: 20.0, rate: 3.2 },
  { min: 10.0, rate: 1.6 },
  { min: 0, rate: 0 },
];
