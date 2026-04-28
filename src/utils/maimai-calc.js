// Import local DB and centralized constants
import otogeDb from '../assets/otoge-db.json';
import { RATING_RATES, GRADE_THRESHOLDS, NEW_VERSIONS } from '../config/maimai-constants';

/**
 * Determines the rating multiplier (rate) based on the achievement percentage.
 * @param {number} achievement - The achievement percentage (0-101).
 * @returns {number} The corresponding rating multiplier.
 */
const getRate = (achievement) => {
  for (const { min, rate } of RATING_RATES) {
    if (achievement >= min) return rate;
  }
  return 0;
};

// Helper: Normalize name for matching
/**
 * Normalizes a string by trimming leading and trailing whitespace.
 * @param {string} str - The string to normalize.
 * @returns {string} The trimmed string.
 */
const normalize = (str) => str.trim();

// Map Difficulty Name to Index
// eslint-disable-next-line no-unused-vars
const DIFFICULTY_MAP = {
  'Basic': 'bas',
  'Advanced': 'adv',
  'Expert': 'exp',
  'Master': 'mas',
  'Re:Master': 'remas'
};

/**
 * Fetches the full song list from the local database.
 * @returns {Promise<Array<Object>>} A promise resolving to the array of song objects.
 */
export const fetchSongConstants = async () => {
  // Return local DB songs array directly
  return otogeDb.songs;
};

/**
 * Calculates the rating contribution for a single song performance.
 * Formula: floor(internal_level * multiplier * achievement / 100)
 * @param {number} achievement - The achievement percentage achieved.
 * @param {number} level - The internal level value of the song sheet.
 * @returns {number} The calculated rating value.
 */
export const calculateSongRating = (achievement, level) => {
  return Math.floor(level * getRate(achievement) * (Math.min(100.5, achievement) / 100)); 
};

/**
 * Determines the grade (e.g., SSS+, SS) based on the achievement percentage.
 * @param {number} achievement - The achievement percentage.
 * @returns {string} The corresponding grade string.
 */
export const getGrade = (achievement) => {
  for (const { min, grade } of GRADE_THRESHOLDS) {
    if (achievement >= min) return grade;
  }
  return 'F';
};

/**
 * Build a Map of songs keyed by normalized title for fast lookup
 */
/**
 * Constructs a Map of songs keyed by their normalized titles for O(1) lookups.
 * @param {Array<Object>} songs - The array of song objects to index.
 * @returns {Map<string, Object>} A Map mapping normalized titles to song objects.
 */
const buildSongMap = (songs) => {
  const songMap = new Map();
  songs.forEach(s => {
    songMap.set(normalize(s.title), s);
  });
  return songMap;
};

/**
 * Find the matching sheet for a score based on type and difficulty
 */
/**
 * Identifies the specific song sheet (Difficulty + Type) that matches a provided score record.
 * @param {Object} song - The song object containing sheets.
 * @param {Object} score - The score record with difficulty and type information.
 * @returns {Object|undefined} The matching sheet object, or undefined if not found.
 */
const findMatchingSheet = (song, score) => {
  const targetType = score.type === 'DX' ? 'dx' : 'std';
  const targetDiff = score.difficulty.toLowerCase().replace('re:master', 'remaster');
  
  return song.sheets.find(s => 
    s.type === targetType && 
    s.difficulty === targetDiff
  );
};

/**
 * Parse achievement percentage from score string
 */
/**
 * Sanitizes and parses an achievement percentage value from various input types.
 * @param {string|number} scoreStr - The raw score/achievement string or number.
 * @returns {number} The parsed floating-point achievement value.
 */
const parseAchievement = (scoreStr) => {
  const achievementStr = String(scoreStr);
  const achievement = parseFloat(achievementStr.replace('%', ''));
  return isNaN(achievement) ? 0 : achievement;
};

/**
 * Process a single score and return calculated score object
 */
/**
 * Processes a raw score entry into a detailed performance object with rating and grade.
 * @param {Object} score - The raw score entry to process.
 * @param {Map<string, Object>} songMap - The pre-built song dictionary for lookup.
 * @returns {Object|null} The processed score object, or null if song/sheet is missing.
 */
const processScore = (score, songMap) => {
  const key = normalize(score.title);
  const song = songMap.get(key);

  if (!song) {
    console.warn(`Song not found: ${score.title} (${score.type})`);
    return null;
  }

  const sheet = findMatchingSheet(song, score);
  if (!sheet) {
    console.warn(`Sheet not found: ${score.title} [${score.type} ${score.difficulty}]`);
    return null;
  }

  const internalLevel = sheet.internalLevelValue;
  if (!internalLevel) {
    console.warn(`Level constant not found for ${score.title} [${score.type} ${score.difficulty}]`);
    return null;
  }

  /* 
   * Determine version:
   * 1. Check if the specific sheet has a region override for 'intl' version
   * 2. Fallback to the song's main version
   */
  const versionOverride = sheet?.regionOverrides?.intl?.version;
  const songVersion = versionOverride || song.version;

  const achievement = parseAchievement(score.score);
  let rating = calculateSongRating(achievement, internalLevel);
  
  if (score.isAP) {
    rating += 1;
  }
  
  const grade = getGrade(achievement);
  const isNew = NEW_VERSIONS.includes(songVersion);

  return {
    title: score.title,
    type: score.type,
    difficulty: score.difficulty,
    level: internalLevel,
    achievement,
    rating,
    grade,
    isNew,
    imageName: song.imageName,
    isAP: score.isAP || false
  };
};

/**
 * Calculates the "Best 50" rating breakdown and list for a user.
 * Supports both raw bulk scores and pre-processed Best 50 summaries from the database.
 * @param {Array<Object>} rawScores - The list of all user scores.
 * @param {Array<Object>} songs - The full song database constants.
 * @param {Object} [rawBestFifty=null] - Optional pre-calculated Best 50 data from Supabase.
 * @returns {Promise<Object>} A promise resolving to the Best 50 breakdown {best_new, best_old, total_rating}.
 */
export const calculateBest50 = async (rawScores, songs, rawBestFifty = null) => {
  const songMap = buildSongMap(songs);
  
  if (rawBestFifty && (rawBestFifty.best_new?.length > 0 || rawBestFifty.best_old?.length > 0)) {
    const processBestList = (list) => {
      return list.map(item => {
        const processed = processScore({
          title: item.title,
          score: item.score,
          difficulty: item.difficulty,
          type: item.type || (item.title.includes("[DX]") ? "DX" : "Standard"),
          isAP: item.isAP
        }, songMap);

        if (processed) {
          const comboAchievementRaw = item.comboAchievement ?? item.comboAchivement ?? null;
          const syncRaw = item.syncType ?? item.syncAchievement ?? item.syncAchivement ?? null;
          const dxScore = item.dxScore ?? null;
          const totalDxScore = item.totalDxScore ?? null;
          const dxStar = item.dxStar ?? null;

          return {
            ...processed,
            last_played: item.last_played,
            play_count: item.play_count,
            // Combo achievement (bookmarklet + DB aliases)
            comboAchievement: comboAchievementRaw,
            comboAchivement: comboAchievementRaw,
            // Sync achievement / type aliases
            syncType: syncRaw,
            syncAchievement: syncRaw,
            syncAchivement: syncRaw,
            // DX score details
            dxScore,
            totalDxScore,
            dxStar
          };
        }
        return null;
      }).filter(s => s !== null);
    };

    const bestNew = processBestList(rawBestFifty.best_new || []);
    const bestOld = processBestList(rawBestFifty.best_old || []);

    const totalNew = bestNew.reduce((sum, s) => sum + s.rating, 0);
    const totalOld = bestOld.reduce((sum, s) => sum + s.rating, 0);

    return {
      best_new: {
        songs: bestNew,
        total_rating: totalNew
      },
      best_old: {
        songs: bestOld,
        total_rating: totalOld
      },
      total_rating: totalNew + totalOld
    };
  }

  const calculatedScores = rawScores
    .map(score => processScore(score, songMap))
    .filter(s => s !== null && s.rating > 0)
    .sort((a, b) => b.rating - a.rating);

  const bestNew = calculatedScores.filter(s => s.isNew).slice(0, 15);
  const bestOld = calculatedScores.filter(s => !s.isNew).slice(0, 35);

  const totalNew = bestNew.reduce((sum, s) => sum + s.rating, 0);
  const totalOld = bestOld.reduce((sum, s) => sum + s.rating, 0);

  return {
    best_new: {
      songs: bestNew,
      total_rating: totalNew
    },
    best_old: {
      songs: bestOld,
      total_rating: totalOld
    },
    total_rating: totalNew + totalOld
  };
};

