import { Container, Title, Box, Group, ActionIcon, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import ThemeToggle from '../../../components/layout/ThemeToggle';
import SongFilters from './SongFilters';
import SongList from './SongList';
import { useSongDatabase } from '../../../hooks/useSongDatabase';

function SongDatabase() {
  const navigate = useNavigate();
  const {
    loading,
    filters,
    setFilters,
    filteredSongs,
    categories,
    versions,
    levels,
    internalLevels,
    error
  } = useSongDatabase();

  return (
    <Container size="xl" pt="xl" pb="xl">
      <Stack gap="xl">
        <Box
          className="hologram-card animate-fade-in"
          p="xl"
          style={{
            borderRadius: '24px',
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-primary), transparent 90%), color-mix(in srgb, var(--theme-secondary), transparent 90%))',
            border: '1px solid color-mix(in srgb, var(--theme-text-primary), transparent 80%)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <Group justify="space-between" align="center">
            <Group>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xl"
                radius="xl"
                onClick={() => navigate('/')}
              >
                <IconArrowLeft size={24} />
              </ActionIcon>
              <Stack gap={0}>
                <Title order={1} style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)' }}>
                  Song Database
                </Title>
              </Stack>
            </Group>
            <ThemeToggle />
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
              <SongList key={JSON.stringify(filters)} songs={filteredSongs} loading={loading} error={error} />
            </div>
          </div>
        </div>
      </Stack>
    </Container>
  );
}

export default SongDatabase;
