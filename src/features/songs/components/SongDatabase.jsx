import { Container, Group, Stack, Text, Title } from '@mantine/core';
import IconBrandGithub from '@tabler/icons-react/dist/esm/icons/IconBrandGithub.mjs';
import IconBrandTwitter from '@tabler/icons-react/dist/esm/icons/IconBrandTwitter.mjs';
import { useSongDatabase } from '../../../hooks/useSongDatabase';
import SongFilters from './SongFilters';
import SongList from './SongList';
import styles from './SongDatabase.module.css';
import './SongDatabase.css';

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
    <Container size="xl" py={0} pb="xl" className="song-database-page">
      <Stack gap="md">
        <header className={styles.songDbHeader}>
          <div>
            <Text className={styles.eyebrow}>Song library</Text>
            <Title order={1}>Songs</Title>
            <Text c="dimmed" size="sm">
              Browse {filteredSongs.length.toLocaleString()} matching charts and their difficulty data.
            </Text>
          </div>

          <Group gap="sm" className={styles.attribution}>
            <Text size="xs" c="dimmed">Data:</Text>
            <Text component="a" href="https://github.com/zetaraku" target="_blank" rel="noreferrer" size="xs">
              <IconBrandGithub size={14} /> Metadata
            </Text>
            <Text component="a" href="https://x.com/maiLv_Chihooooo" target="_blank" rel="noreferrer" size="xs">
              <IconBrandTwitter size={14} /> Internal levels
            </Text>
          </Group>
        </header>

        <SongFilters
          filters={filters}
          onFilterChange={setFilters}
          categories={categories}
          versions={versions}
          levels={levels}
          internalLevels={internalLevels}
          artists={artists}
        />

        <main className={styles.songDbContent}>
          <SongList key={JSON.stringify(filters)} songs={filteredSongs} loading={loading} error={error} />
        </main>
      </Stack>
    </Container>
  );
}

export default SongDatabase;
