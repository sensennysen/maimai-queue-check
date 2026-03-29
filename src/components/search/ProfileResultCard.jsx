import { Paper, Group, Avatar, Stack, Text, Button } from '@mantine/core';

export function ProfileResultCard({ profile, onNavigate }) {
  return (
    <Paper withBorder radius="md" p="sm">
      <Group align="center" justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <Avatar
            src={profile.display_photo_url || profile.dx_display_photo_url || undefined}
            radius="xl"
            color="blue"
          >
            {(profile.display_name || profile.slug || '?').slice(0, 2).toUpperCase()}
          </Avatar>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text size="sm" c="md" lineClamp={1}>{profile.display_name || 'Anonymous'}</Text>
            <Text size="sm" c="dimmed" lineClamp={1}>@{profile.slug || 'no-slug'}</Text>
          </Stack>
        </Group>
        <Button
          size="sm"
          variant="light"
          onClick={() => onNavigate(profile.slug)}
          disabled={!profile.slug}
        >
          View
        </Button>
      </Group>
    </Paper>
  );
}
