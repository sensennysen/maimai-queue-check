import { Container, Group, Stack, Text } from '@mantine/core';
import IconBrandGithub from '@tabler/icons-react/dist/esm/icons/IconBrandGithub.mjs';
import IconBrandTwitter from '@tabler/icons-react/dist/esm/icons/IconBrandTwitter.mjs';
import { useSongDatabase } from '../../../hooks/useSongDatabase';
import SongFilters from './SongFilters';
import SongList from './SongList';
import styles from './SongDatabase.module.css';

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
          <Text size="sm" c="dimmed">Attribution:</Text>
          <Text
            component="a"
            href="https://github.com/zetaraku"
            target="_blank"
            size="sm"
            c="dimmed"
            style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
          >
            <IconBrandGithub size={14} /> Chart Metadata
          </Text>
          <Text size="sm" c="dimmed">•</Text>
          <Text
            component="a"
            href="https://x.com/maiLv_Chihooooo"
            target="_blank"
            size="sm"
            c="dimmed"
            style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
          >
            <IconBrandTwitter size={14} /> Internal Levels
          </Text>
        </Group>
        
        {/* Layout Grid */}
        <div className={styles.songDbGrid}>
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
      </Stack>
    </Container>
  );
}

export default SongDatabase;
