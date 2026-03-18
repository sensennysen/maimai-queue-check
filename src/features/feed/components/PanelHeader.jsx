import { Group, Stack, Title, Text, ActionIcon } from '@mantine/core';
import IconRefresh from '@tabler/icons-react/dist/esm/icons/IconRefresh.mjs';

/**
 * Shared header component for community and feed panels.
 * @param {Object} props - Component props.
 * @param {string} props.title - The main title of the panel.
 * @param {string} [props.subtitle] - Optional subtitle text.
 * @param {Function} [props.onRefresh] - Callback for mandatory refresh actions.
 * @param {boolean} [props.loading] - Whether a refresh operation is currently in progress.
 * @param {JSX.Element} [props.rightSection] - Optional elements to render on the right side of the header.
 * @param {string} [props.className] - Optional extra CSS class names.
 * @returns {JSX.Element} The rendered panel header.
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
