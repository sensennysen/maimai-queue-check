import { Group, Stack, Title, Text, ActionIcon } from '@mantine/core';
import IconRefresh from '@tabler/icons-react/dist/esm/icons/IconRefresh.mjs';

/**
 * PanelHeader shared component
 */
export function PanelHeader({ title, subtitle, onRefresh, loading, rightSection, className }) {
  return (
    <Group justify="space-between" align="flex-end" mb="sm" className={className}>
      <Stack gap={2}>
        <Title order={3} className="community-panel-title">{title}</Title>
        {subtitle && <Text size="xs" c="dimmed">{subtitle}</Text>}
      </Stack>
      <Group gap="xs">
        {rightSection}
        {onRefresh && (
          <ActionIcon variant="subtle" size="sm" onClick={onRefresh} loading={loading}>
            <IconRefresh size={16} />
          </ActionIcon>
        )}
      </Group>
    </Group>
  );
}
