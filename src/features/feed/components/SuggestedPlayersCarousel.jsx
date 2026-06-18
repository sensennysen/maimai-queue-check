import { Paper, Group, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { FeedPlayerCard } from '../../../components/feed/FeedPlayerCard';
import { PanelHeader } from './PanelHeader';
import { CommunityCarouselRow } from './CommunityCarouselRow';

export function SuggestedPlayersCarousel({
  players = [],
  followedIds,
  branchMap,
  loading,
  onFollow,
  onPlayerClick,
  className,
}) {
  const isDesktop = useMediaQuery('(min-width: 62em)');

  return (
    <Paper p="md" radius="md" withBorder className={`community-panel community-discovery-panel ${className || ''}`.trim()}>
      <PanelHeader
        title="Suggested Players"
        loading={loading}
      />
      {players.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          No suggestions right now.
        </Text>
      ) : (
        <CommunityCarouselRow isDesktop={isDesktop} watchKey={players.length}>
          <Group gap="sm" wrap="nowrap">
            {players.map((player) => (
              <div key={player.id} className="community-player-carousel-item">
                <FeedPlayerCard
                  player={player}
                  isFollowing={followedIds.has(player.id)}
                  onFollow={onFollow}
                  onClick={() => onPlayerClick(player)}
                  branchMap={branchMap}
                  className="community-player-row"
                />
              </div>
            ))}
          </Group>
        </CommunityCarouselRow>
      )}
    </Paper>
  );
}
