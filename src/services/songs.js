import { BASE_JACKET_URL } from '../config/maimai-constants';

let songDatabasePromise = null;

export const songsService = {
  /**
   * Clears the cached song database promise.
   * Useful for forcing a reload when data changes or recovery after failure.
   * @returns {void}
   */
  clearCache() {
    songDatabasePromise = null;
  },

  /**
   * Retrieves the full song database from the bundled JSON asset.
   * Implements internal caching via a promise to prevent redundant loads.
   * @returns {Promise<Array<Object>>} A promise resolving to an array of mapped song cards.
   */
  getFullSongDatabase() {
    if (songDatabasePromise) return songDatabasePromise;

    songDatabasePromise = (async () => {
      try {
        const module = await import('../assets/otoge-db.json');
        const rawSongs = module.default?.songs ?? module.songs ?? [];

        const resultSongs = [];

        rawSongs.forEach((song, index) => {
          // Group sheets by type: 'std' → 'standard', 'dx' → 'dx'
          const sheetsByType = {};
          if (song.sheets) {
            song.sheets.forEach(sheet => {
              const rawType = sheet.type || 'std';
              const cardType = rawType === 'std' ? 'standard' : rawType;
              if (!sheetsByType[cardType]) sheetsByType[cardType] = [];
              sheetsByType[cardType].push(sheet);
            });
          }

          // One card per song × type
          Object.entries(sheetsByType).forEach(([cardType, sheets]) => {
            const cardId = `${song.songId}-${cardType}`;
            const imageUrl = song.imageName ? `${BASE_JACKET_URL}${song.imageName}` : null;

            const mappedSheets = sheets.map(sheet => ({
              ...sheet,
              internalLevel: sheet.internalLevel != null
                ? String(sheet.internalLevel)
                : String(sheet.internalLevelValue),
            }));

            resultSongs.push({
              songId: song.songId,
              title: song.title,
              artist: song.artist,
              category: song.category,
              bpm: song.bpm ?? null,
              imageName: song.imageName ?? null,
              imageUrl,
              version: mappedSheets.find(s => s.version)?.version ?? song.version ?? null,
              releaseDate: song.releaseDate ?? song.addDate ?? null,
              isNew: song.isNew ?? false,
              isLocked: song.isLocked ?? false,
              cardId,
              cardType,
              sortOrder: index,
              sheets: mappedSheets,
            });
          });
        });

        return resultSongs;
      } catch (error) {
        songDatabasePromise = null; // Clear so next call can retry
        console.error('Failed to load song database:', error);
        throw error;
      }
    })();

    return songDatabasePromise;
  }
};
