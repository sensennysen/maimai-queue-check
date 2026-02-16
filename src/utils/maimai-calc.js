// Import local DB
import otogeDb from '../assets/otoge-db.json';

// Coefficient Table (Standard Maimai DX)
const COMPUTE_RATING_COEFF = [
  { min: 100.5000, val: 22.4 },
  { min: 100.0000, val: 21.6 },
  { min: 99.5000, val: 21.1 },
  { min: 99.0000, val: 20.8 },
  { min: 98.0000, val: 20.3 },
  { min: 97.0000, val: 20.0 },
  { min: 94.0000, val: 16.8 },
  { min: 90.0000, val: 15.2 },
  { min: 80.0000, val: 13.6 },
  { min: 0.0000, val: 0.0 }
];

const getRate = (achievement) => {
  for (const range of COMPUTE_RATING_COEFF) {
    if (achievement >= range.min) return range.val;
  }
  return 0;
};

// Helper: Normalize name for matching
const normalize = (str) => str.trim();

// Map Difficulty Name to Index
const DIFFICULTY_MAP = {
  'Basic': 'bas',
  'Advanced': 'adv',
  'Expert': 'exp',
  'Master': 'mas',
  'Re:Master': 'remas'
};

export const fetchSongConstants = async () => {
  // Return local DB songs array directly
  return otogeDb.songs;
};

export const calculateSongRating = (achievement, level) => {
  return Math.floor(level * getRate(achievement) * (Math.min(100.5, achievement) / 100)); 
};

export const calculateBest50 = async (rawScores, songs) => {
  // Map songs for fast lookup: key = "title"
  // Note: otoge-db has flat structure where one entry contains standard/dx levels?
  // Let's check structure. Based on snippet:
  // "lev_mas": "12", "dx_lev_mas": "13"
  // So one entry can hold BOTH Standard and DX constants.
  const songMap = new Map();
  
  songs.forEach(s => {
    // Key by title. If dupes exist, we overwrite (trust latest?)
    songMap.set(normalize(s.title), s);
  });

  const calculatedScores = rawScores.map(score => {
    const isDx = score.type === 'DX';
    const key = normalize(score.title);
    const song = songMap.get(key);

    if (!song) {
      console.warn(`Song not found: ${score.title} (${score.type})`);
      return null;
    }

    // Determine internal level key
    // diffKey = 'bas', 'adv', 'exp', 'mas', 'remas'
    // internalKey = isDx ? `dx_lev_${diffKey}_i` : `lev_${diffKey}_i`
    // Updated lookup for new otoge-db.json structure
    const targetType = score.type === 'DX' ? 'dx' : 'std';
    const targetDiff = score.difficulty.toLowerCase().replace('re:master', 'remaster');
    
    // Find matching sheet
    const sheet = song.sheets.find(s => 
      s.type === targetType && 
      s.difficulty === targetDiff
    );

    if (!sheet) {
       console.warn(`Sheet not found: ${score.title} [${targetType} ${score.difficulty}]`);
       return null;
    }

    // Use internalLevelValue
    const internalLevel = sheet.internalLevelValue;

    if (!internalLevel) {
       console.warn(`Level constant not found for ${score.title} [${score.type} ${score.difficulty}]`);
       return null;
    }
    
    // Parse achievement
    let achievementStr = String(score.score);
    let achievement = parseFloat(achievementStr.replace('%', ''));
    if (isNaN(achievement)) achievement = 0;

    const rating = calculateSongRating(achievement, internalLevel);

    // Determine isNew based on version string
    const newVersions = ['PRiSM PLUS', 'CiRCLE'];
    const isNew = newVersions.includes(song.version);

    return {
      title: score.title,
      type: score.type,
      difficulty: score.difficulty,
      level: internalLevel,
      achievement: achievement,
      rating: rating,
      isNew: isNew,
      // Store raw song data for score card
      // otoge-db has "imageName"
      imageName: song.imageName 
    };
  }).filter(s => s !== null && s.rating > 0);

  // Sort by Rating Desc
  calculatedScores.sort((a, b) => b.rating - a.rating);

  // Select Top 15 New
  const bestNew = calculatedScores.filter(s => s.isNew).slice(0, 15);

  // Select Top 35 Old
  const bestOld = calculatedScores.filter(s => !s.isNew).slice(0, 35);

  // Calculate Total
  const totalNew = bestNew.reduce((sum, s) => sum + s.rating, 0);
  const totalOld = bestOld.reduce((sum, s) => sum + s.rating, 0);

  return {
    new: {
      songs: bestNew,
      totalRating: totalNew
    },
    old: {
      songs: bestOld,
      totalRating: totalOld
    },
    totalRating: totalNew + totalOld
  };
};
