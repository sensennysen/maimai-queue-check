import { Paper, Group, Text, Avatar, Button, Stack, Badge } from '@mantine/core';
import IconUserPlus from '@tabler/icons-react/dist/esm/icons/IconUserPlus.mjs';
import IconUserCheck from '@tabler/icons-react/dist/esm/icons/IconUserCheck.mjs';
import { getProfileImageUrl } from '../../utils/formatters';


export function FeedPlayerCard({ player, isFollowing, onFollow, onClick, branchMap = {} }) {
  const displayName = player.display_name || player.user_roles?.queue_name || player.slug || 'Player';
  const queueName = player.user_roles?.queue_name;

  const homeBranchName = player.main_branch ? (branchMap[player.main_branch] || `Branch ${player.main_branch}`) : null;
  const preferredBranchNames = (player.preferred_branches || [])
    .map(id => branchMap[id] || `Branch ${id}`)
    .filter(name => name !== homeBranchName);

  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
      style={{ transition: 'all 0.15s ease' }}
      className="glass-effect-hover"
    >
      <Group gap="sm" wrap="nowrap" justify="space-between" align="flex-start">
        {/* Left: Avatar + Info (clickable) */}
        <Group
          gap="sm"
          wrap="nowrap"
          style={{ cursor: onClick ? 'pointer' : 'default', flex: 1, overflow: 'hidden' }}
          onClick={onClick}
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

          <Stack gap={1} style={{ overflow: 'hidden', flex: 1 }}>
            <Text fw={600} size="sm" lineClamp={1}>
              {displayName}
            </Text>

            {homeBranchName && (
              <Group gap={4} align="center" mt={2}>
                <Text size="xs" fw={500} c="dimmed">Home:</Text>
                <Badge size="sm" variant="light" color="blue" radius="xs" style={{ textTransform: 'none' }}>
                  {homeBranchName}
                </Badge>
              </Group>
            )}

            {preferredBranchNames.length > 0 && (
              <Stack gap={2} mt={2}>
                <Text size="xs" fw={500} c="dimmed">Preferred:</Text>
                <Group gap={4} wrap="wrap">
                  {preferredBranchNames.map(name => (
                    <Badge key={name} size="sm" variant="light" color="gray" radius="xs" style={{ textTransform: 'none' }}>
                      {name}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            )}

            {!homeBranchName && !preferredBranchNames.length && queueName && queueName !== displayName && (
              <Text size="xs" c="dimmed" lineClamp={1} mt={2}>
                Queue: {queueName}
              </Text>
            )}
          </Stack>
        </Group>

        {/* Follow button */}
        <Button
          size="xs"
          variant={isFollowing ? 'light' : 'filled'}
          color={isFollowing ? 'gray' : 'primary'}
          leftSection={isFollowing ? <IconUserCheck size={14} /> : <IconUserPlus size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            onFollow(player.id);
          }}
          style={{ flexShrink: 0, marginTop: 4 }}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      </Group>
    </Paper>
  );
}
