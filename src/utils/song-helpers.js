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

export function normalizeSongId(songId) {
  if (!songId) return null;
  if (songId.endsWith('-dx')) return songId.replace('-dx', '');
  if (songId.endsWith('-standard')) return songId.replace('-standard', '');
  return songId;
}
