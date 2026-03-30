import { Paper, Group, Text, Avatar, Button, Stack, Badge, ActionIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import IconUserPlus from '@tabler/icons-react/dist/esm/icons/IconUserPlus.mjs';
import IconUserCheck from '@tabler/icons-react/dist/esm/icons/IconUserCheck.mjs';
import { getProfileImageUrl } from '../../utils/formatters';
import { UserAttributionBadges } from '../common/UserAttributionBadges';

export function FeedPlayerCard({ player, isFollowing, onFollow, onClick, branchMap = {}, className }) {
  const isMobile = useMediaQuery('(max-width: 48em)');
  const displayName = player.display_name || player.slug || 'Player';

  const homeBranchName = player.main_branch ? (branchMap[player.main_branch] || `Branch ${player.main_branch}`) : null;
  const preferredBranchNames = (player.preferred_branches || [])
    .map(id => branchMap[id] || `Branch ${id}`)
    .filter(name => name !== homeBranchName)
    .slice(0, 4);

  if (isMobile) {
    return (
      <Paper
        p="sm"
        radius="md"
        withBorder
        style={{ transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', minHeight: 86 }}
        className={`glass-effect-hover ${className || ''}`.trim()}
      >
        <Group gap="xs" wrap="nowrap" justify="space-between" align="center" style={{ width: '100%' }}>
          <Group
            gap="xs"
            wrap="nowrap"
            style={{ cursor: onClick ? 'pointer' : 'default', flex: 1, overflow: 'hidden' }}
            onClick={onClick}
            align="center"
          >
            <Avatar src={getProfileImageUrl(player)} radius="xl" size={36} color="blue" style={{ flexShrink: 0 }}>
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Stack gap={2} style={{ overflow: 'hidden', flex: 1, minWidth: 0 }} justify="center">
              <Text fw={600} size="sm" lineClamp={1}>
                {displayName}
              </Text>
              <UserAttributionBadges
                attributions={player.user_attributions?.attributions}
                size="xs"
                gap={3}
              />
              {(homeBranchName || preferredBranchNames.length > 0) && (
                <Group gap={4} wrap="wrap" className="community-player-tags-row">
                  {homeBranchName && (
                    <Badge size="xs" variant="light" color="blue" radius="sm" style={{ textTransform: 'none' }} className="community-player-tag">
                      {homeBranchName}
                    </Badge>
                  )}
                  {preferredBranchNames.map((name) => (
                    <Badge key={name} size="xs" variant="light" color="gray" radius="sm" style={{ textTransform: 'none' }} className="community-player-tag">
                      {name}
                    </Badge>
                  ))}
                </Group>
              )}
            </Stack>
          </Group>
          <ActionIcon
            size={34}
            radius="xl"
            variant={isFollowing ? 'light' : 'filled'}
            color={isFollowing ? 'gray' : 'primary'}
            onClick={(e) => {
              e.stopPropagation();
              onFollow(player.id);
            }}
            className="community-player-follow-mobile"
          >
            {isFollowing ? <IconUserCheck size={14} /> : <IconUserPlus size={14} style={{ color: 'white' }} />}
          </ActionIcon>
        </Group>
      </Paper>
    );
  }

  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
        style={{ transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', minHeight: 96 }}
      className={`glass-effect-hover ${className || ''}`.trim()}
    >
      <Group gap="sm" wrap="nowrap" justify="space-between" align="center" style={{ width: '100%' }}>
        <Group
          gap="sm"
          wrap="nowrap"
          style={{ cursor: onClick ? 'pointer' : 'default', flex: 1, overflow: 'hidden' }}
          onClick={onClick}
          align="center"
        >
          <Avatar
            src={getProfileImageUrl(player)}
            radius="xl"
            size={44}
            color="blue"
            style={{ flexShrink: 0 }}
          >
            {displayName.charAt(0).toUpperCase()}
          </Avatar>

          <Stack gap={4} style={{ overflow: 'hidden', flex: 1, minWidth: 0 }} justify="center">
            <Text fw={600} size="sm" lineClamp={1}>
              {displayName}
            </Text>
            <UserAttributionBadges
              attributions={player.user_attributions?.attributions}
              size="xs"
              gap={3}
            />
            {(homeBranchName || preferredBranchNames.length > 0) && (
              <Group gap={4} wrap="wrap" className="community-player-tags-row">
                {homeBranchName && (
                  <Badge size="xs" variant="light" color="blue" radius="sm" style={{ textTransform: 'none' }} className="community-player-tag">
                    {homeBranchName}
                  </Badge>
                )}
                {preferredBranchNames.map(name => (
                  <Badge key={name} size="xs" variant="light" color="gray" radius="sm" style={{ textTransform: 'none' }} className="community-player-tag">
                    {name}
                  </Badge>
                ))}
              </Group>
            )}

          </Stack>
        </Group>

        <Button
          size="xs"
          variant={isFollowing ? 'light' : 'filled'}
          color={isFollowing ? 'gray' : 'primary'}
          onClick={(e) => {
            e.stopPropagation();
            onFollow(player.id);
          }}
          style={{ flexShrink: 0 }}
          className="community-player-follow-button"
        >
          <Group gap={6} wrap="nowrap">
            {isFollowing ? <IconUserCheck size={14} /> : <IconUserPlus size={14} />}
            <span className="community-player-follow-label">{isFollowing ? 'Following' : 'Follow'}</span>
          </Group>
        </Button>
      </Group>
    </Paper>
  );
}
