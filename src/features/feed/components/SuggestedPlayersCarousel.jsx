import { Paper, Group, ScrollArea, Text } from '@mantine/core';
import { FeedPlayerCard } from '../../../components/feed/FeedPlayerCard';
import { PanelHeader } from './PanelHeader';

export function SuggestedPlayersCarousel({
  players = [],
  followedIds,
  branchMap,
  loading,
  onFollow,
  onPlayerClick,
  className,
}) {
  return (
    <Paper p="md" radius="xl" withBorder className={`community-panel ${className || ''}`.trim()}>
      <PanelHeader
        title="Suggested Players"
        loading={loading}
      />
      {players.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          No suggestions right now.
        </Text>
      ) : (
        <ScrollArea type="auto" offsetScrollbars>
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
        </ScrollArea>
      )}
    </Paper>
  );
}
