import { useState, useEffect, useMemo } from 'react';
import { Container, Title, Text, Stack, Box, Group, LoadingOverlay, ThemeIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { songsService } from '../../../services/songs';
import SongFilters from './SongFilters';
import SongList from './SongList';
import { VERSION_ORDER, DIFFICULTY_COLORS, VERSION_MAPPING, CATEGORY_TRANSLATION } from '../../../config/maimai-constants';
import { IconMusic } from '@tabler/icons-react';

// Helper to convert level string (e.g., "13+") to number (13.7)
const parseLevel = (levelStr) => {
  if (!levelStr) return 0;
  const base = parseFloat(levelStr);
  if (levelStr.includes('+')) {
    return base + 0.7; // Standard representation for + levels
  }
  return base;
};

function SongDatabase() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    query: '',
    categories: [],
    versions: [],
    levelMin: '',
    levelMax: '',
    showInternalLevels: false
  });

  // Extract unique categories, versions, and levels for filter dropdowns
  const { categories, versions, levels, internalLevels } = useMemo(() => {
    const cats = new Set();
    const vers = new Set();
    const lvls = new Set();
    const intLvls = new Set();

    songs.forEach(song => {
      if (song.category && song.category !== 'Unknown') cats.add(song.category);
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
      internalLevels: sortedInternalLevels
    };
  }, [songs]);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const data = await songsService.getFullSongDatabase();
        setSongs(data);
      } catch (error) {
        console.error(error);
        notifications.show({
          title: 'Error',
          message: 'Failed to load song database',
          color: 'red'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  const filteredSongs = useMemo(() => {
    const hasLevelFilter = filters.levelMin !== '' || filters.levelMax !== '';

    return songs.filter(song => {
      // 0. Skip Unknown/Missing Metadata songs
      if (song.isMissingMetadata || song.category === 'Unknown') return false;

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
    }).sort((a, b) => {
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
  }, [songs, filters]);

  return (
    <Container size="xl" pt="md" pb="xl">
      <Stack gap="xl">
        {/* Hero Header */}
        <Box
          className="hologram-card animate-fade-in"
          p="xl"
          style={{
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(255, 40, 169, 0.1), rgba(0, 210, 255, 0.1))',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <Group>
            <ThemeIcon size={64} radius="xl" variant="gradient" gradient={{ from: 'pink', to: 'cyan' }}>
              <IconMusic size={32} />
            </ThemeIcon>
            <Stack gap={0}>
              <Title order={1} style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)' }}>
                Song Database
              </Title>
              <Text c="dimmed" size="lg">
                Browse {songs.length || '...'} songs available in the current version.
              </Text>
            </Stack>
          </Group>
        </Box>

        {/* Layout Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Desktop: standard grid, Mobile: Stack */}
          <style dangerouslySetInnerHTML={{
            __html: `
                    @media (min-width: 992px) {
                        .song-db-grid {
                            grid-template-columns: 300px 1fr !important;
                        }
                    }
                 `}} />

          <div className="song-db-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2rem',
            alignItems: 'start',
            width: '100%'
          }}>
            <div style={{ position: 'relative', height: '100%' }}>
              {/* This container ensures sticky works if parent has height */}
              <SongFilters
                filters={filters}
                onFilterChange={setFilters}
                categories={categories}
                versions={versions}
                levels={levels}
                internalLevels={internalLevels}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <SongList key={JSON.stringify(filters)} songs={filteredSongs} loading={loading} />
            </div>
          </div>
        </div>
      </Stack>
    </Container>
  );
}

export default SongDatabase;
