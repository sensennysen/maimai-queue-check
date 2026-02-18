import { supabase } from './supabase';

export const songsService = {
  // Fetch all songs with their metadata
  async getSongs() {
    const { data, error } = await supabase
      .from('maimai_songs')
      .select('*');

    if (error) {
      console.error('Error fetching songs:', error);
      throw error;
    }
    return data;
  },

  // Fetch all sheets (difficulty data)
  async getSheets() {
    const { data, error } = await supabase
        .from('maimai_intl_sheets')
        .select('*');
    
    if (error) {
        console.error('Error fetching sheets:', error);
        throw error;
    }
    return data;
  },
  
  // Helper to fetch all rows from a table (bypassing 1000 limit)
  async fetchAll(table) {
    let allData = [];
    let from = 0;
    const limit = 1000;
    
    while (true) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .range(from, from + limit - 1);
        
        if (error) throw error;
        
        if (!data || data.length === 0) break;
        
        allData = [...allData, ...data];
        
        if (data.length < limit) break;
        from += limit;
    }
    return allData;
  },

  // Fetch everything needed for the DB
  async getFullSongDatabase() {
      try {
        // Fetch in parallel for performance, using fetchAll to handle large datasets
        const [songs, sheets, versions, orders, internalLevels, songExtras, sheetExtras] = await Promise.all([
            this.fetchAll('maimai_songs'),
            this.fetchAll('maimai_intl_sheets'),
            this.fetchAll('maimai_intl_sheet_versions'),
            this.fetchAll('maimai_song_orders'),
            this.fetchAll('maimai_sheet_internal_levels'),
            this.fetchAll('maimai_song_extras'),
            this.fetchAll('maimai_sheet_extras')
        ]);

        // --- Step 1: Index Data for O(1) Lookup ---

        // 1a. Song Metadata Map: songId -> song object
        const metaMap = new Map();
        songs.forEach(song => metaMap.set(song.songId, song));

        // 1b. Sort Orders Map: songId -> sortOrder
        const ordersMap = new Map();
        if (orders) {
            orders.forEach(order => ordersMap.set(order.songId, order.sortOrder));
        }

        // 1c. Song Extras Map: songId -> extras object (bpm, releaseDate)
        const songExtrasMap = new Map();
        if (songExtras) {
            songExtras.forEach(extra => songExtrasMap.set(extra.songId, extra));
        }

        // 1d. Sheet Extras Map: `${songId}-${type}-${difficulty}` -> extras object (noteDesigner, counts)
        const sheetExtrasMap = new Map();
        if (sheetExtras) {
            sheetExtras.forEach(extra => {
                 const type = (extra.type || 'standard').toLowerCase();
                 sheetExtrasMap.set(`${extra.songId}-${type}-${extra.difficulty}`, extra);
            });
        }

        // 1e. Sheets Map: `${songId}-${type}` -> [sheets]
        // This allows us to quickly grab all standard sheets for song X, or dx sheets for song X
        const sheetsMap = new Map();
        sheets.forEach(sheet => {
            // Normalize type to lowercase just in case
            const type = (sheet.type || 'standard').toLowerCase();
            const key = `${sheet.songId}-${type}`;
            
            if (!sheetsMap.has(key)) {
                sheetsMap.set(key, []);
            }
            sheetsMap.get(key).push(sheet);
        });

        // 1f. Internal Levels Map: `${songId}-${type}-${difficulty}` -> internalLevel
        const internalMap = new Map();
        if (internalLevels) {
            internalLevels.forEach(item => {
                const type = (item.type || 'standard').toLowerCase();
                internalMap.set(`${item.songId}-${type}-${item.difficulty}`, item.internalLevel);
            });
        }

        // --- Step 2 & 3: Use Versions to Drive Song Creation ---
        // We iterate `versions` (maimai_intl_sheet_versions). 
        // If a song is in maimai_songs but NOT here, it is skipped (unreleased/Japan-only).
        // If a song has 2 entries here (e.g. 'standard' and 'dx'), we create 2 separate song objects.

        const resultSongs = [];

        if (versions) {
            versions.forEach(v => {
                const songId = v.songId;
                const type = (v.type || 'standard').toLowerCase(); // 'dx' or 'standard'
                const versionLabel = v.version;

                // 2a. Get base metadata
                const baseMeta = metaMap.get(songId);
                const extras = songExtrasMap.get(songId);
                
                // If metadata missing, create placeholder
                const songEntry = baseMeta ? { ...baseMeta } : {
                    songId: songId,
                    title: `Unknown Song (${songId})`,
                    artist: 'Unknown Artist',
                    category: 'Unknown',
                    isMissingMetadata: true
                };

                // 2b. Override/Set specific fields for this card
                songEntry.cardType = type;     // 'dx' or 'standard'
                songEntry.version = versionLabel; // The specific version for this type
                songEntry.cardId = `${songId}-${type}`; // Unique React Key
                songEntry.sortOrder = ordersMap.get(songId) ?? 999999;
                
                // Add extras
                if (extras) {
                    if (extras.bpm) songEntry.bpm = extras.bpm;
                    if (extras.releaseDate) songEntry.releaseDate = extras.releaseDate;
                }

                songEntry.sheets = []; // To be filled

                // --- Step 4 & 5: Fetch Levels & Internal Levels ---
                // Query sheets using the specific songId + type
                const matchingSheets = sheetsMap.get(`${songId}-${type}`);
                
                if (matchingSheets) {
                    matchingSheets.forEach(sheet => {
                        // Attach internal level
                        const internalKey = `${songId}-${type}-${sheet.difficulty}`;
                        let internalLevel = internalMap.get(internalKey);

                        // Fallback logic for internal level
                        if (!internalLevel && sheet.level) {
                            const levelStr = sheet.level.toString();
                            const isPlus = levelStr.endsWith('+');
                            const baseLevel = parseFloat(levelStr); // parseFloat ignores non-numeric trailing chars like '+'
                            
                            if (!isNaN(baseLevel)) {
                                internalLevel = isPlus ? (baseLevel + 0.7).toFixed(1) : (baseLevel + 0.0).toFixed(1);
                                // User requested: 13 -> 13.0, 13+ -> 13.6
                                // Wait, usually 13+ is 13.7 start? 
                                // User said: "say, a 13 is 13.0 and 13+ is 13.6"
                                // STRICTLY FOLLOW USER REQUEST: 13+ -> 13.6
                                if (isPlus) {
                                    internalLevel = (baseLevel + 0.6).toFixed(1);
                                } else {
                                    internalLevel = (baseLevel).toFixed(1);
                                }
                            }
                        }

                        // Attach sheet extras
                        const sheetExtra = sheetExtrasMap.get(internalKey);
                        const noteDesigner = sheetExtra ? sheetExtra.noteDesigner : null;

                        songEntry.sheets.push({
                            ...sheet,
                            internalLevel: internalLevel || null,
                            noteDesigner: noteDesigner
                        });
                    });
                }
                
                resultSongs.push(songEntry);
            });
        }

        // Sort by sortOrder
        return resultSongs.sort((a, b) => a.sortOrder - b.sortOrder);

      } catch (error) {
          console.error('Failed to load song database:', error);
          throw error;
      }
  }
};
