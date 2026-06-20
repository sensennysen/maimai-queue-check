import { useState } from 'react';
import { Avatar, Box, Button, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import IconUserPlus from '@tabler/icons-react/dist/esm/icons/IconUserPlus.mjs';
import IconUserCheck from '@tabler/icons-react/dist/esm/icons/IconUserCheck.mjs';
import { getProfileImageUrl } from '../../utils/formatters';

function canShow(player, setting) {
  const value = player.privacy_settings?.[setting];
  return value !== false && value !== 'false';
}

export function getPlayerSecondaryDetail(player, branchMap = {}) {
  if (player.main_branch && canShow(player, 'show_main_branch')) {
    const branchName = branchMap[player.main_branch] || `Branch ${player.main_branch}`;
    return `Main Branch: ${branchName}`;
  }

  const rating = Number(player.maimai_best_scores?.total_rating);
  if (canShow(player, 'show_dx_rating') && Number.isFinite(rating) && rating > 0) {
    return `Rating: ${rating.toLocaleString()}`;
  }

  if (canShow(player, 'show_preferred_branches')) {
    const preferredBranches = (player.preferred_branches || [])
      .map((branchId) => branchMap[branchId] || `Branch ${branchId}`)
      .filter(Boolean)
      .slice(0, 2);

    if (preferredBranches.length > 0) {
      return `Preferred Branches: ${preferredBranches.join(', ')}`;
    }
  }

  return null;
}

export function FeedPlayerCard({
  player,
  isFollowing,
  onFollow,
  onPreview,
  branchMap = {},
  layout = 'carousel',
  className,
}) {
  const [followPending, setFollowPending] = useState(false);
  const displayName = player.display_name || player.slug || 'Player';
  const secondaryDetail = getPlayerSecondaryDetail(player, branchMap);

  const handleFollow = async (event) => {
    event.stopPropagation();
    if (followPending) return;
    setFollowPending(true);
    const didUpdate = await onFollow(player.id);
    if (didUpdate && !isFollowing && typeof navigator !== 'undefined') {
      navigator.vibrate?.(12);
    }
    setFollowPending(false);
  };

  return (
    <Box
      className={[
        'community-player-card',
        `community-player-card--${layout}`,
        className,
      ].filter(Boolean).join(' ')}
    >
      <Stack gap={layout === 'sidebar' ? 8 : 'sm'}>
        <Group gap="sm" wrap="nowrap" align="center">
          <UnstyledButton
            type="button"
            onClick={onPreview}
            aria-label={`Preview ${displayName}'s profile`}
            className="community-player-avatar-button"
          >
            <Avatar
              src={getProfileImageUrl(player)}
              radius="xl"
              size={layout === 'sidebar' ? 42 : 56}
              color="primary"
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
          </UnstyledButton>

          <Stack gap={3} className="community-player-copy">
            <UnstyledButton
              type="button"
              onClick={onPreview}
              className="community-player-name-button"
            >
              <Text fw={700} size={layout === 'sidebar' ? 'sm' : 'md'} lineClamp={1}>
                {displayName}
              </Text>
            </UnstyledButton>
            {secondaryDetail && (
              <Text size="xs" c="dimmed" lineClamp={1} className="community-player-main-branch">
                {secondaryDetail}
              </Text>
            )}
          </Stack>

          {layout === 'sidebar' && (
            <Button
              size="compact-sm"
              variant={isFollowing ? 'light' : 'filled'}
              color={isFollowing ? 'gray' : 'primary'}
              leftSection={isFollowing ? <IconUserCheck size={14} /> : <IconUserPlus size={14} />}
              onClick={handleFollow}
              loading={followPending}
              className="community-player-follow-button"
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </Group>

        {layout !== 'sidebar' && (
          <Button
            fullWidth
            size="sm"
            variant={isFollowing ? 'light' : 'filled'}
            color={isFollowing ? 'gray' : 'primary'}
            leftSection={isFollowing ? <IconUserCheck size={16} /> : <IconUserPlus size={16} />}
            onClick={handleFollow}
            loading={followPending}
            className="community-player-follow-button"
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
