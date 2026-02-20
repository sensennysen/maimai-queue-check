import { Container, Title, Box, Group, ActionIcon, Stack, Paper, Avatar, Button, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconMusic, IconBrandGithub, IconBrandTwitter } from '@tabler/icons-react';
import ThemeToggle from '../../../components/layout/ThemeToggle';
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
  } = useSongDatabase();

  return (
    <Container size="xl" pt="xl" pb="xl">
      <Stack gap="lg">
        {/* Back Button / Navigation */}
        <Group justify="space-between">
          <Button
            component={Link}
            to="/"
            variant="subtle"
            leftSection={<IconArrowLeft size={18} />}
            className="animate-fade-in"
          >
            Back to queue
          </Button>
        </Group>

        {/* redesigned Header Card */}
        <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-100">
          <Group wrap="nowrap" justify="space-between" align="center">
            <Group wrap="nowrap" style={{ flex: 1 }}>
              <Avatar
                size={70}
                radius={70}
                color="primary"
                variant="light"
              >
                <IconMusic size={35} />
              </Avatar>

              <Stack gap={4}>
                <Title order={1} style={{ fontSize: '1.75rem', lineHeight: 1.2 }}>
                  Song Database
                </Title>
                <Text size="sm" c="dimmed" fw={500}>
                  Explore and filter all available songs in the database
                </Text>
                <Group gap="xs" mt={4}>
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
              </Stack>
            </Group>
            <Box hiddenFrom="sm">
              <ThemeToggle />
            </Box>
          </Group>
        </Paper>

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
