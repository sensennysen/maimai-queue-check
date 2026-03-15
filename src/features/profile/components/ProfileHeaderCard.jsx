import { Paper, Group, Box, Avatar, Stack, Title, Tooltip, Badge, Text } from '@mantine/core';
import { IconUser, IconCamera, IconCode, IconGitPullRequest, IconBug, IconMapPin, IconStar, IconListDetails } from '@tabler/icons-react';

/**
 * ProfileHeaderCard component
 */
export function ProfileHeaderCard({ 
  profile, 
  privacy, 
  isOwner, 
  mainBranchName, 
  preferredBranchNames, 
  onAvatarClick 
}) {
  if (!profile) return null;

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-100">
      <Group wrap="nowrap" justify="space-between" align="flex-start">
        <Group wrap="nowrap" style={{ flex: 1 }}>
          <div
            style={{
              position: 'relative',
              cursor: isOwner ? 'pointer' : 'default',
              transition: 'transform 0.1s ease'
            }}
            className={isOwner ? 'hover-scale' : ''}
            onClick={onAvatarClick}
          >
            <Avatar
              src={profile.display_photo_url || profile.dx_display_photo_url}
              size={90}
              radius={90}
              color="primary"
            >
              <IconUser size={45} />
            </Avatar>
            {isOwner && (
              <Box
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: 'var(--theme-primary)',
                  color: 'var(--theme-primary-contrast)',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                <IconCamera size={16} />
              </Box>
            )}
          </div>

          <Stack gap={4}>
            <Group gap="xs" align="center">
              <Title order={1} style={{ fontSize: '1.75rem', lineHeight: 1.2 }}>
                {profile.display_name || 'Anonymous Player'}
              </Title>

              {profile.user_attributions?.attributions?.length > 0 && (
                <Group gap={6} align="center" mt={4}>
                  {profile.user_attributions.attributions.includes('DEVELOPER') && (
                    <Tooltip label="Developer" withArrow position="top">
                      <Badge variant="light" color="primary" leftSection={<IconCode size={14} />}>
                        Developer
                      </Badge>
                    </Tooltip>
                  )}
                  {profile.user_attributions.attributions.includes('CONTRIBUTOR') && (
                    <Tooltip label="Contributor" withArrow position="top">
                      <Badge variant="light" color="accent" leftSection={<IconGitPullRequest size={14} />}>
                        Contributor
                      </Badge>
                    </Tooltip>
                  )}
                  {profile.user_attributions.attributions.includes('TESTER') && (
                    <Tooltip label="Tester" withArrow position="top">
                      <Badge variant="light" color="var(--theme-success)" leftSection={<IconBug size={14} />}>
                        Tester
                      </Badge>
                    </Tooltip>
                  )}
                </Group>
              )}
            </Group>

            {(privacy.show_main_branch || isOwner) && mainBranchName && (
              <Group gap={4} align="center">
                <IconMapPin size={14} style={{ color: 'var(--theme-primary)' }} />
                <Text size="sm" fw={500}>Main Branch: {mainBranchName}</Text>
              </Group>
            )}

            {(privacy.show_preferred_branches || isOwner) && preferredBranchNames.length > 0 && (
              <Group gap={6} align="center" wrap="wrap">
                <IconStar size={14} style={{ color: 'var(--theme-accent)' }} />
                <Text size="sm">Preferred:</Text>
                {preferredBranchNames.map((name, i) => (
                  <Badge key={i} size="sm" variant="light" color="secondary">{name}</Badge>
                ))}
              </Group>
            )}

            {profile.user_roles?.queue_name && (
              <Group gap={4} align="center">
                <IconListDetails size={14} style={{ color: 'var(--mantine-color-blue-5)' }} />
                <Text size="sm">Queue Name: <Text component="span" fw={600}>{profile.user_roles.queue_name}</Text></Text>
              </Group>
            )}

            {/* Mobile: DX Name + Rating inline */}
            <Stack gap={2} hiddenFrom="sm">
              {(privacy.show_maimai_name || isOwner) && profile.maimai_dx_name && (
                <Group gap={4} align="center">
                  <Text size="sm" fw={600}>DX Name:</Text>
                  <Text size="sm">{profile.maimai_dx_name}</Text>
                </Group>
              )}
              {(privacy.show_dx_rating || isOwner) && profile.maimai_best_scores?.total_rating && (
                <Group gap={4} align="center">
                  <Text size="sm" fw={600}>Rating:</Text>
                  <Text size="sm" fw={700} c="primary">{profile.maimai_best_scores.total_rating}</Text>
                </Group>
              )}
              {(privacy.show_circle !== false || isOwner) && profile.circle_name && (
                <Group gap={4} align="center">
                  <Text size="sm" fw={600}>Circle:</Text>
                  <Text size="sm">{profile.circle_name}</Text>
                </Group>
              )}
            </Stack>
          </Stack>
        </Group>

        <Stack gap={0} align="flex-end" visibleFrom="sm">
          {(privacy.show_maimai_name || isOwner) && profile.maimai_dx_name && (
            <Group gap={4}>
              <Text size="sm" c="secondary" fw={500}>maimai DX Name:</Text>
              <Text size="sm" fw={600}>{profile.maimai_dx_name}</Text>
            </Group>
          )}
          {(privacy.show_dx_rating || isOwner) && profile.maimai_best_scores?.total_rating && (
            <Stack gap={0} align="flex-end" mt={4}>
              <Text size="xs" fw={700} c="secondary" tt="uppercase" lts={1}>Rating</Text>
              <Text size="xl" fw={900} c="primary" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                {profile.maimai_best_scores.total_rating}
              </Text>
            </Stack>
          )}
          {(privacy.show_circle !== false || isOwner) && profile.circle_name && (
            <Group gap={4} mt={4}>
              <Text size="sm" c="secondary" fw={500}>Circle:</Text>
              <Text size="sm" fw={600}>{profile.circle_name}</Text>
            </Group>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}
