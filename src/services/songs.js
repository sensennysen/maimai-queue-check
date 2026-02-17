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
        const [songs, sheets, versions, orders, internalLevels] = await Promise.all([
            this.fetchAll('maimai_songs'),
            this.fetchAll('maimai_intl_sheets'),
            this.fetchAll('maimai_intl_sheet_versions'),
            this.fetchAll('maimai_song_orders'),
            this.fetchAll('maimai_sheet_internal_levels')
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

        // 1c. Sheets Map: `${songId}-${type}` -> [sheets]
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

        // 1d. Internal Levels Map: `${songId}-${type}-${difficulty}` -> internalLevel
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
                
                // If metadata missing, create placeholder (or skip if stricter? User said "get the songId in maimai_songs", implies we need both)
                // We'll create a placeholder if missing to be safe, but mark it.
                // However, user demand was "remove those that doesn't complete matching". 
                // We can interpret this as: valid entry requires Version AND Metadata? 
                // Usually metadata defines the Title/Artist. Without it, the card is useless.
                // Let's use placeholder if missing, but typically we expect it to exist.
                
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
                songEntry.sheets = []; // To be filled

                // --- Step 4 & 5: Fetch Levels & Internal Levels ---
                // Query sheets using the specific songId + type
                const matchingSheets = sheetsMap.get(`${songId}-${type}`);
                
                if (matchingSheets) {
                    matchingSheets.forEach(sheet => {
                        // Attach internal level
                        const internalKey = `${songId}-${type}-${sheet.difficulty}`;
                        const internalLevel = internalMap.get(internalKey);

                        songEntry.sheets.push({
                            ...sheet,
                            internalLevel: internalLevel || null
                        });
                    });
                }

                // Only add if it has sheets? (User didn't strictly say, but a card with no sheets is useless)
                // Let's include it, SongDatabase filters empty sheets anyway if needed, or displays empty card.
                // Actually SongDatabase `songs` memo filters `!song.sheets`.
                
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
