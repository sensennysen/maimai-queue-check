import { useState } from 'react';
import {
  Avatar,
  Button,
  Group,
  Modal,
  Paper,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import IconArrowRight from '@tabler/icons-react/dist/esm/icons/IconArrowRight.mjs';
import {
  FeedPlayerCard,
  getPlayerSecondaryDetail,
} from '../../../components/feed/FeedPlayerCard';
import { getProfileImageUrl } from '../../../utils/formatters';
import { PanelHeader } from './PanelHeader';
import { CommunityCarouselRow } from './CommunityCarouselRow';

export function SuggestedPlayersCarousel({
  players = [],
  followedIds,
  branchMap,
  loading,
  onFollow,
  onPlayerClick,
  onLoadMore,
  className,
}) {
  const isDesktop = useMediaQuery('(min-width: 62em)');
  const [previewPlayer, setPreviewPlayer] = useState(null);

  const previewSecondaryDetail = previewPlayer
    ? getPlayerSecondaryDetail(previewPlayer, branchMap)
    : null;
  const loadingContent = (
    <Stack gap="xs" aria-label="Loading suggested players">
      {Array.from({ length: 2 }, (_, index) => (
        <Skeleton key={index} height={isDesktop ? 76 : 156} radius="sm" />
      ))}
    </Stack>
  );

  return (
    <>
      <Paper
        p={isDesktop ? 'md' : 'lg'}
        radius="md"
        withBorder
        className={`community-panel community-discovery-panel community-suggested-panel ${className || ''}`.trim()}
      >
        <PanelHeader
          title='Players to discover'
        />

        {loading ? loadingContent : players.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No suggestions right now.
          </Text>
        ) : (
          <CommunityCarouselRow
            rowClassName={isDesktop ? 'community-suggested-sidebar-scroll' : undefined}
            watchKey={players.length}
            itemCount={players.length}
            showIndicators
            centerItems
            draggable
            onEndReached={onLoadMore}
            preserveScrollOnWatchChange
            ariaLabel="Suggested players"
          >
            <Group gap="sm" wrap="nowrap" className="community-suggested-player-row">
              {players.map((player) => (
                <div key={player.id} className="community-player-carousel-item">
                  <FeedPlayerCard
                    player={player}
                    isFollowing={followedIds.has(player.id)}
                    onFollow={onFollow}
                    onPreview={() => setPreviewPlayer(player)}
                    branchMap={branchMap}
                    layout={isDesktop ? 'sidebar' : 'carousel'}
                    className="community-player-row"
                  />
                </div>
              ))}
            </Group>
          </CommunityCarouselRow>
        )}
      </Paper>

      <Modal
        opened={Boolean(previewPlayer)}
        onClose={() => setPreviewPlayer(null)}
        title="Player preview"
        centered
        size="sm"
        classNames={{ content: 'community-player-preview-modal' }}
      >
        {previewPlayer && (
          <Stack gap="md">
            <Group align="center" wrap="nowrap">
              <Avatar
                src={getProfileImageUrl(previewPlayer)}
                size={72}
                radius="xl"
                color="primary"
              >
                {(previewPlayer.display_name || previewPlayer.slug || '?').charAt(0).toUpperCase()}
              </Avatar>
              <Stack gap={3} className="community-player-preview-copy">
                <Text fw={750} size="lg">
                  {previewPlayer.display_name || previewPlayer.slug || 'Player'}
                </Text>
                {previewSecondaryDetail && (
                  <Text size="sm" c="dimmed">
                    {previewSecondaryDetail}
                  </Text>
                )}
              </Stack>
            </Group>

            <Group grow>
              <Button
                variant={followedIds.has(previewPlayer.id) ? 'light' : 'filled'}
                onClick={() => onFollow(previewPlayer.id)}
              >
                {followedIds.has(previewPlayer.id) ? 'Following' : 'Follow player'}
              </Button>
              <Button
                variant="default"
                rightSection={<IconArrowRight size={15} />}
                onClick={() => {
                  setPreviewPlayer(null);
                  onPlayerClick(previewPlayer);
                }}
              >
                View profile
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
