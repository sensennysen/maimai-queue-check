import { useState, memo, useCallback } from 'react';
import {
  Paper, Stack, Group, Title, Badge,
  Flex, Pagination
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconHistory } from '@tabler/icons-react';
import { RecentPlayItem } from './RecentPlayItem';
import { useRecentPlays } from '../../features/profile/hooks/useRecentPlays';

export const RecentPlaysSection = memo(({ userId, initialData }) => {
  const { plays, loading, songMap } = useRecentPlays(userId, initialData);
  const [openedIndex, setOpenedIndex] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(plays.length / itemsPerPage);
  const isMobile = useMediaQuery('(max-width: 652px)');
  const isTablet = useMediaQuery('(max-width: 992px)');

  const handleToggle = useCallback((index) => {
    setOpenedIndex(current => current === index ? null : index);
  }, []);

  if (loading) return null;
  if (plays.length === 0) return null;

  const currentPlays = plays.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Group gap="xs" mb="lg">
        <IconHistory size={24} style={{ color: 'var(--theme-secondary)' }} />
        <Title order={2}>Recent Plays</Title>
        <Badge variant="light" size="lg">{plays.length} entries</Badge>
      </Group>

      <Stack gap="xs">
        {currentPlays.map((play, index) => (
          <RecentPlayItem
            key={play.id || index}
            play={play}
            index={index}
            isOpened={openedIndex === index}
            onToggle={handleToggle}
            isMobile={isMobile}
            isTablet={isTablet}
            songMap={songMap}
          />
        ))}

        {totalPages > 1 && (
          <Flex justify="center" mt="md">
            <Pagination
              total={totalPages}
              value={activePage}
              onChange={(p) => {
                setActivePage(p);
                setOpenedIndex(null);
              }}
              color="secondary"
              radius="md"
              withEdges
            />
          </Flex>
        )}
      </Stack>
    </Paper>
  );
});

RecentPlaysSection.displayName = 'RecentPlaysSection';
