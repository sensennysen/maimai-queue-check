import { Container, Group, Stack, Text } from '@mantine/core';
import { IconBrandGithub, IconBrandTwitter } from '@tabler/icons-react';
import SongFilters from './SongFilters';
import SongList from './SongList';
import { useSongDatabase } from '../../../hooks/useSongDatabase';

function SongDatabase() {
  const {
    loading,
    filters,
    setFilters,
    filteredSongs,
    categories,
    versions,
    levels,
    internalLevels,
    error,
    artists,
  } = useSongDatabase();

  return (
    <Container size="xl" py="lg" pb="xl">
      <Stack gap="lg">
        <Group gap="xs" justify="flex-end" w="100%">
          <Text size="xs" c="dimmed">Attribution:</Text>
          <Text
            component="a"
            href="https://github.com/zetaraku"
            target="_blank"
            size="xs"
            c="dimmed"
            style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
          >
            <IconBrandGithub size={12} /> Chart Metadata
          </Text>
          <Text size="xs" c="dimmed">•</Text>
          <Text
            component="a"
            href="https://x.com/maiLv_Chihooooo"
            target="_blank"
            size="xs"
            c="dimmed"
            style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
          >
            <IconBrandTwitter size={12} /> Internal Levels
          </Text>
        </Group>
        
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
                artists={artists}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <SongList key={JSON.stringify(filters)} songs={filteredSongs} loading={loading} error={error} />
            </div>
          </div>
        </div>
      </Stack>
    </Container>
  );
}

export default SongDatabase;
