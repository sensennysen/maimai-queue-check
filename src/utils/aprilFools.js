import { normalizeDifficulty } from '../config/maimai-constants';

export const APRIL_FOOLS_SONG_TITLE = '\u56db\u6708\u306e\u96e8';
export const APRIL_FOOLS_PLAYLIST_TITLE = 'April Showers';
export const APRIL_FOOLS_PREVIEW_ENABLED = false;
export const APRIL_FOOLS_TOGGLE_FORCE_VISIBLE = true;
const APRIL_FOOLS_STORAGE_KEY = 'april-fools-preview-enabled';
const APRIL_FOOLS_TOGGLE_START_PH = '2026-04-01T00:00:00+08:00';

export function isAprilFoolsActive(date = new Date()) {
  return isAprilFoolsPreviewEnabled() || (date.getMonth() === 3 && date.getDate() === 1);
}

export function isAprilFoolsPreviewEnabled() {
  if (typeof window === 'undefined') return APRIL_FOOLS_PREVIEW_ENABLED;

  const storedValue = window.localStorage.getItem(APRIL_FOOLS_STORAGE_KEY);
  if (storedValue === null) return APRIL_FOOLS_PREVIEW_ENABLED;
  return storedValue === 'true';
}

export function setAprilFoolsPreviewEnabled(enabled) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(APRIL_FOOLS_STORAGE_KEY, String(enabled));
}

export function canShowAprilFoolsToggle(date = new Date()) {
  if (APRIL_FOOLS_TOGGLE_FORCE_VISIBLE) return true;
  return date.getTime() >= new Date(APRIL_FOOLS_TOGGLE_START_PH).getTime();
}

export function getAprilFoolsSong(songMapByTitle) {
  return songMapByTitle?.get(APRIL_FOOLS_SONG_TITLE) || null;
}

function getPreferredSheet(song) {
  if (!song?.sheets?.length) return null;

  return (
    song.sheets.find((sheet) => sheet.difficulty === 'master') ||
    song.sheets.find((sheet) => sheet.difficulty === 'expert') ||
    song.sheets[0]
  );
}

export function buildAprilFoolsFavoriteEntries(song, count = 1) {
  if (!song) return [];

  return Array.from({ length: Math.max(1, count) }, (_, index) => ({
    song: {
      ...song,
      favoriteId: `april-fools-favorite-${index + 1}`,
    },
    comment: null,
  }));
}

export function buildAprilFoolsPlaylistSongs(song, count = 1) {
  if (!song) return [];

  const preferredSheet = getPreferredSheet(song);
  const level = normalizeDifficulty(preferredSheet?.difficulty) || null;

  return Array.from({ length: Math.max(1, count) }, (_, index) => ({
    ...song,
    level,
    id: `${song.cardId || song.songId}-april-fools-${index + 1}`,
  }));
}

export function buildAprilFoolsPlaylists(song, playlists = []) {
  if (!song) return playlists;

  if (playlists.length === 0) {
    return [
      {
        id: 'april-fools-playlist',
        title: APRIL_FOOLS_PLAYLIST_TITLE,
        comment: 'Only one forecast this April 1.',
        is_public: false,
        songs: [{ song_id: song.cardId || song.songId, level: null, order_index: 0 }],
      },
    ];
  }

  return playlists.map((playlist) => ({
    ...playlist,
    title: APRIL_FOOLS_PLAYLIST_TITLE,
  }));
}

export function buildAprilFoolsBestScore(song, overrides = {}) {
  const preferredSheet = getPreferredSheet(song);
  const difficulty = normalizeDifficulty(preferredSheet?.difficulty || 'master');
  const level =
    preferredSheet?.internalLevelValue ??
    Number.parseFloat(preferredSheet?.internalLevel) ??
    13.0;
  const type = song?.cardType === 'dx' ? 'DX' : 'Standard';

  return {
    ...overrides,
    title: APRIL_FOOLS_SONG_TITLE,
    type,
    difficulty,
    level,
    achievement: 100.5,
    rating: 9999,
    grade: 'SSS+',
    imageName: song?.imageName || null,
    dxScore: null,
    totalDxScore: null,
    dxStar: null,
  };
}

export function buildAprilFoolsBest50(song, bestScores) {
  if (!song) return bestScores;

  const sourceNew = bestScores?.best_new?.songs || [];
  const sourceOld = bestScores?.best_old?.songs || [];

  const bestNew = (sourceNew.length ? sourceNew : Array.from({ length: 15 })).map((score, index) =>
    buildAprilFoolsBestScore(song, {
      ...score,
      title: APRIL_FOOLS_SONG_TITLE,
      imageName: song.imageName,
      type: song.cardType === 'dx' ? 'DX' : 'Standard',
      rating: score?.rating ?? 9999 - index,
    })
  );

  const bestOld = (sourceOld.length ? sourceOld : Array.from({ length: 35 })).map((score, index) =>
    buildAprilFoolsBestScore(song, {
      ...score,
      title: APRIL_FOOLS_SONG_TITLE,
      imageName: song.imageName,
      type: song.cardType === 'dx' ? 'DX' : 'Standard',
      rating: score?.rating ?? 9000 - index,
    })
  );

  return {
    ...(bestScores || {}),
    best_new: {
      ...(bestScores?.best_new || {}),
      songs: bestNew,
      total_rating: bestNew.reduce((sum, score) => sum + (Number(score.rating) || 0), 0),
    },
    best_old: {
      ...(bestScores?.best_old || {}),
      songs: bestOld,
      total_rating: bestOld.reduce((sum, score) => sum + (Number(score.rating) || 0), 0),
    },
    total_rating:
      bestNew.reduce((sum, score) => sum + (Number(score.rating) || 0), 0) +
      bestOld.reduce((sum, score) => sum + (Number(score.rating) || 0), 0),
    most_played: bestScores?.most_played || [],
    total_play_count: bestScores?.total_play_count || 0,
    current_version_play_count: bestScores?.current_version_play_count || 0,
  };
}

export function buildAprilFoolsRecentPlays(song, plays = []) {
  if (!song) return plays;

  const preferredSheet = getPreferredSheet(song);
  const difficulty = normalizeDifficulty(preferredSheet?.difficulty || 'master');
  const level = preferredSheet?.level || preferredSheet?.internalLevel || '13+';
  const chartType = song?.cardType === 'dx' ? 'DX' : 'Standard';
  const jacketUrl = song?.imageUrl || null;

  const sourcePlays = plays.length ? plays : Array.from({ length: 10 });

  return sourcePlays.map((play, index) => ({
    ...play,
    id: play?.id || `april-fools-recent-${index + 1}`,
    track_number: play?.track_number || index + 1,
    played_at: play?.played_at || new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
    title: APRIL_FOOLS_SONG_TITLE,
    jacket_url: jacketUrl,
    difficulty,
    chart_type: chartType,
    level,
    achievement: play?.achievement ?? 100.5,
    dx_score: play?.dx_score ?? 4242,
    dx_score_total: play?.dx_score_total ?? 4242,
    rating: play?.rating ?? 999,
    rating_delta: play?.rating_delta ?? 9,
    max_combo: play?.max_combo ?? 999,
    max_combo_total: play?.max_combo_total ?? 999,
    max_sync: play?.max_sync ?? 999,
    max_sync_total: play?.max_sync_total ?? 999,
    fast_count: play?.fast_count ?? 4,
    late_count: play?.late_count ?? 1,
    notes: play?.notes ?? {
      tap: { critical_perfect: 500, perfect: 0, great: 0, good: 0, miss: 0 },
      hold: { critical_perfect: 80, perfect: 0, great: 0, good: 0, miss: 0 },
      slide: { critical_perfect: 120, perfect: 0, great: 0, good: 0, miss: 0 },
      touch: { critical_perfect: 60, perfect: 0, great: 0, good: 0, miss: 0 },
      break: { critical_perfect: 12, perfect: 0, great: 0, good: 0, miss: 0 },
    },
  }));
}

export function buildAprilFoolsMostPlayed(song, mostPlayed = []) {
  if (!song) return mostPlayed;

  const preferredSheet = getPreferredSheet(song);
  const difficulty = normalizeDifficulty(preferredSheet?.difficulty || 'master');
  const sourceSongs = mostPlayed.length ? mostPlayed : Array.from({ length: 10 });

  return sourceSongs.map((entry, index) => ({
    ...entry,
    title: APRIL_FOOLS_SONG_TITLE,
    difficulty,
    imageName: song.imageName,
    play_count: entry?.play_count ?? Math.max(50 - index, 1),
  }));
}
