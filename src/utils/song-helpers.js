/**
 * Generates an array of potential match identifiers for a song (cardId, songId, type-specific IDs).
 * @param {Object} song - The song object to generate IDs for.
 * @returns {Array<string>} An array of unique string identifiers.
 */
export function buildSongMatchIds(song) {
  const ids = new Set();
  if (song?.cardId) ids.add(song.cardId);
  if (song?.songId) ids.add(song.songId);
  if (song?.songId) {
    ids.add(`${song.songId}-standard`);
    ids.add(`${song.songId}-dx`);
  }
  return Array.from(ids).filter(Boolean);
}

/**
 * Normalizes a song ID by removing type suffixes ('-dx', '-standard').
 * @param {string} songId - The raw song ID to normalize.
 * @returns {string|null} The normalized ID or null if input is invalid.
 */
export function normalizeSongId(songId) {
  if (!songId) return null;
  if (songId.endsWith('-dx')) return songId.replace('-dx', '');
  if (songId.endsWith('-standard')) return songId.replace('-standard', '');
  return songId;
}
