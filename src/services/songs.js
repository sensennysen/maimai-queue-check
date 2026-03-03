import { BASE_JACKET_URL } from '../config/maimai-constants';

let songDatabasePromise = null;

export const songsService = {
  // Clear cache (e.g. for admin updates or after a failed load)
  clearCache() {
    songDatabasePromise = null;
  },

  // Fetch everything needed for the DB from the bundled JSON
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
