import { useState, useMemo } from 'react';
import { useSongDatabaseContext } from './useSongDatabaseContext';
import { VERSION_ORDER, VERSION_MAPPING, CATEGORY_TRANSLATION } from '../config/maimai-constants';

// Helper to convert level string (e.g., "13+") to number (13.7)
const parseLevel = (levelStr) => {
  if (!levelStr) return 0;
  const base = parseFloat(levelStr);
  if (levelStr.includes('+')) {
    return base + 0.7; // Standard representation for + levels
  }
  return base;
};

export function useSongDatabase() {
  const { songs, loading, error } = useSongDatabaseContext();
  const [filters, setFilters] = useState({
    query: '',
    categories: [],
    versions: [],
    levelMin: '',
    levelMax: '',
    showInternalLevels: false,
    region: 'intl',
    type: '',
    artists: []
  });

  // Determine the effective region for overrides
  // We prioritize the currently selected positive region filter, otherwise default to intl
  const effectiveRegion = useMemo(() => {
    const positiveRegions = ['jp', 'intl', 'usa', 'cn'];
    if (positiveRegions.includes(filters.region)) return filters.region;
    return 'intl'; // Default to international for metadata overrides
  }, [filters.region]);
  // Apply region overrides and visibility filtering to songs
  const overriddenSongs = useMemo(() => {
    const positiveRegions = ['jp', 'intl', 'usa', 'cn'];
    const isPositiveFilter = positiveRegions.includes(filters.region);
    const viewRegion = isPositiveFilter ? filters.region : 'intl';

    return songs.map(song => {
      // Find any sheet that has an override for the effective region
      song.sheets?.some(s => s.regionOverrides?.[effectiveRegion]);
      
      const newSheets = song.sheets.map(sheet => {
        const override = sheet.regionOverrides?.[effectiveRegion];
        if (!override || Object.keys(override).length === 0) return sheet;

        return {
          ...sheet,
          level: override.level || sheet.level,
          levelValue: override.levelValue || sheet.levelValue,
          internalLevel: override.internalLevel != null ? String(override.internalLevel) : (override.internalLevelValue != null ? String(override.internalLevelValue) : sheet.internalLevel),
          internalLevelValue: override.internalLevelValue || sheet.internalLevelValue,
          version: override.version || sheet.version
        };
      });

      // Filter sheets based on visibility in the current region
      // Only filter if it's a positive region selection or the default (intl)
      // For "Unavailable to..." filters, we show all sheets to see what's missing
      let visibleSheets = newSheets;
      if (isPositiveFilter || !filters.region || (filters.region === 'intl')) {
        visibleSheets = newSheets.filter(s => s.regions?.[viewRegion] === true);
      }

      // Also handle song-level version override if applicable
      // We derive the version from the first visible sheet if there are any
      const versionOverride = visibleSheets.length > 0
        ? (visibleSheets.find(s => s.version !== song.version)?.version || visibleSheets[0].version)
        : null;

      return {
        ...song,
        sheets: visibleSheets,
        version: versionOverride || song.version
      };
    }).filter(song => song.sheets.length > 0); // Remove songs that ended up with no sheets in this view
  }, [songs, effectiveRegion, filters.region]);


  // Extract unique categories, versions, levels, and artists for filter dropdowns
  const { categories, versions, levels, internalLevels, artists } = useMemo(() => {
    const cats = new Set();
    const vers = new Set();
    const lvls = new Set();
    const intLvls = new Set();
    const arts = new Set();

    overriddenSongs.forEach(song => {
      if (song.category && song.category !== 'Unknown') cats.add(song.category);
      if (song.artist && song.artist !== 'Unknown') arts.add(song.artist);
      if (song.version) {
        // Apply version mapping if exists
        const mappedVersion = VERSION_MAPPING[song.version] || song.version;
        vers.add(mappedVersion);
      }
      if (song.sheets) {
        song.sheets.forEach(sheet => {
          if (sheet.level) lvls.add(sheet.level);
          if (sheet.internalLevel) intLvls.add(sheet.internalLevel);
        });
      }
    });

    const sortedLevels = Array.from(lvls).sort((a, b) => parseLevel(a) - parseLevel(b));
    const sortedInternalLevels = Array.from(intLvls).sort((a, b) => parseFloat(a) - parseFloat(b));

    // Sort versions based on VERSION_ORDER
    const sortedVersions = Array.from(vers).sort((a, b) => {
      const indexA = VERSION_ORDER.indexOf(a);
      const indexB = VERSION_ORDER.indexOf(b);

      // If either version is not in VERSION_ORDER, put it at the end
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexB - indexA;
    });

    const categoriesOptions = Array.from(cats).sort().map(cat => ({
      value: cat,
      label: CATEGORY_TRANSLATION[cat] || cat
    }));

    return {
      categories: categoriesOptions,
      versions: sortedVersions,
      levels: sortedLevels,
      internalLevels: sortedInternalLevels,
      artists: Array.from(arts).sort().map(art => ({ value: art, label: art }))
    };
  }, [overriddenSongs]);

  const filteredSongs = useMemo(() => {
    const filtered = overriddenSongs.filter(song => {
      const hasLevelFilter = filters.levelMin !== '' || filters.levelMax !== '';
      // 0. Skip Unknown/Missing Metadata songs
      if (song.isMissingMetadata || song.category === 'Unknown') return false;

      // 0.5. Region availability
      if (filters.region) {
        if (filters.region === 'unav_jp') {
          const hasJp = song.sheets?.some(s => s.regions?.jp === true);
          if (hasJp) return false;
        } else if (filters.region === 'unav_intl') {
          const hasIntl = song.sheets?.some(s => s.regions?.intl === true);
          if (hasIntl) return false;
        } else if (filters.region === 'unav_usa') {
          const hasUsa = song.sheets?.some(s => s.regions?.usa === true);
          if (hasUsa) return false;
        } else if (filters.region === 'unav_cn') {
          const hasCn = song.sheets?.some(s => s.regions?.cn === true);
          if (hasCn) return false;
        }
        // Positive region checks (jp, intl, usa, cn) are already filtered in overriddenSongs
      }

      // 0.7. Chart Type (DX or Standard)
      if (filters.type) {
        if (song.cardType !== filters.type) return false;
      }

      // 1. Search Query (Title/Artist)
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const matchTitle = song.title?.toLowerCase().includes(q);
        const matchArtist = song.artist?.toLowerCase().includes(q);
        if (!matchTitle && !matchArtist) return false;
      }

      // 2. Category
      if (filters.categories.length > 0 && !filters.categories.includes(song.category)) {
        return false;
      }

      // 2.5 Artist
      if (filters.artists.length > 0 && !filters.artists.includes(song.artist)) {
        return false;
      }

      // 3. Version
      const mappedSongVersion = VERSION_MAPPING[song.version] || song.version;
      if (filters.versions.length > 0 && !filters.versions.includes(mappedSongVersion)) {
        return false;
      }

      // 4. Level Range (only if a level filter is set)
      if (hasLevelFilter) {
        if (!song.sheets || song.sheets.length === 0) return false;

        const isInternal = filters.showInternalLevels;

        // Parse min/max, treating empty as unbounded
        let min = -Infinity;
        let max = Infinity;

        if (filters.levelMin) {
          min = isInternal ? parseFloat(filters.levelMin) : parseLevel(filters.levelMin);
        }
        if (filters.levelMax) {
          max = isInternal ? parseFloat(filters.levelMax) : parseLevel(filters.levelMax);
        }

        const hasLevelInRange = song.sheets.some(sheet => {
          if (!sheet.level) return false;

          let val = 0;
          if (isInternal) {
            val = sheet.internalLevel ? parseFloat(sheet.internalLevel) : parseLevel(sheet.level);
          } else {
            val = parseLevel(sheet.level);
          }

          return val >= min && val <= max;
        });
        if (!hasLevelInRange) return false;
      }

      return true;
    });
    
    // Sort a copy to ensure immutability
    return [...filtered].sort((a, b) => {
      // 1. Sort by Version (Newest First)
      // Normalize version strings using mapping
      const versionA = VERSION_MAPPING[a.version] || a.version;
      const versionB = VERSION_MAPPING[b.version] || b.version;

      const indexA = VERSION_ORDER.indexOf(versionA);
      const indexB = VERSION_ORDER.indexOf(versionB);

      if (indexA !== indexB) {
        // Higher index means newer version
        return indexB - indexA;
      }

      // 2. Sort by Release Date (Newest First)
      // dateA/B will be 0 if releaseDate is missing
      const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
      const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;

      return dateB - dateA;
    });
  }, [overriddenSongs, filters]);

  return {
    songs,
    loading,
    error,
    filters,
    setFilters,
    filteredSongs,
    categories,
    versions,
    levels,
    internalLevels,
    artists
  };
}
