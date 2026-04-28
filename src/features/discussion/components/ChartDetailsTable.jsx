import { Paper, Stack, Group, Title, Text, Badge, ScrollArea, Table, SimpleGrid, Divider } from '@mantine/core';
import IconWorld from '@tabler/icons-react/dist/esm/icons/IconWorld.mjs';
import { DIFFICULTY_COLORS, normalizeDifficulty } from '../../../config/maimai-constants';

/**
 * Component for displaying the detailed stats and difficulty breakdown of a song.
 * Includes region availability and internal values.
 * @param {Object} props - Component props.
 * @param {Array<Object>} props.currentSheets - List of chart versions/sheets for the song.
 * @param {boolean} props.isMobile - Whether the viewer is on a mobile device.
 * @returns {JSX.Element|null} The rendered chart details table or null if no sheets available.
 */
export function ChartDetailsTable({ currentSheets, isMobile, song }) {
  if (!currentSheets || currentSheets.length === 0) return null;

  const regionBadges = (() => {
    const firstSheet = currentSheets[0];
    if (!firstSheet || !firstSheet.regions) {
      return <Text size="sm" c="dimmed">Unknown</Text>;
    }

    return Object.entries(firstSheet.regions).map(([region, isAvailable]) => (
      <Badge
        key={region}
        size="sm"
        variant={isAvailable ? 'light' : 'outline'}
        color={isAvailable ? 'blue' : 'gray'}
        leftSection={<IconWorld size={10} />}
        opacity={isAvailable ? 1 : 0.45}
      >
        {region.toUpperCase()}
      </Badge>
    ));
  })();

  return (
    <Paper p={{ base: 'md', md: 'xl' }} radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="flex-end">
          <Title order={3}>Chart Details</Title>
        </Group>

        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <Text size="sm" fw={700}>Regions:</Text>
            <Group gap="xs">{regionBadges}</Group>
          </Group>
        </Group>

        {isMobile ? (
          <Stack gap="sm">
            {song?.title && (
              <Text size="sm" c="dimmed">
                Swipe-free chart cards for each difficulty.
              </Text>
            )}

            {currentSheets.map((displaySheet, idx) => {
              const diffName = normalizeDifficulty(displaySheet.difficulty);
              const color = DIFFICULTY_COLORS[diffName] || 'gray';
              const counts = [
                ['Tap', displaySheet.noteCounts?.tap ?? '-'],
                ['Hold', displaySheet.noteCounts?.hold ?? '-'],
                ['Slide', displaySheet.noteCounts?.slide ?? '-'],
                ['Touch', displaySheet.noteCounts?.touch ?? '-'],
                ['Break', displaySheet.noteCounts?.break ?? '-'],
                ['Total', displaySheet.noteCounts?.total ?? '-'],
              ];

              return (
                <Paper
                  key={`${displaySheet.type}-${displaySheet.difficulty}-${idx}`}
                  p="md"
                  radius="md"
                  withBorder
                  bg="var(--mantine-color-default-hover)"
                >
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <div>
                        <Badge color={color} variant="filled" size="lg" mb={8}>
                          {diffName}
                        </Badge>
                        <Text fw={700} size="lg">Level {displaySheet.level}</Text>
                        <Text size="sm" c="dimmed">
                          Internal {displaySheet.internalLevel || displaySheet.internalLevelValue || '-'}
                        </Text>
                      </div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                        {displaySheet.type?.toUpperCase() || 'Chart'}
                      </Text>
                    </Group>

                    <Divider />

                    <SimpleGrid cols={2} spacing="sm" verticalSpacing="sm">
                      {counts.map(([label, value]) => (
                        <Paper key={label} p="xs" radius="sm" withBorder bg="var(--mantine-color-body)">
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={2}>
                            {label}
                          </Text>
                          <Text fw={700}>{value}</Text>
                        </Paper>
                      ))}
                    </SimpleGrid>

                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>
                        Designer
                      </Text>
                      <Text size="sm">{displaySheet.noteDesigner || '-'}</Text>
                    </div>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        ) : (
          <ScrollArea>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th className="sticky-col">Difficulty</Table.Th>
                  <Table.Th>Level</Table.Th>
                  <Table.Th>Internal Level</Table.Th>
                  <Table.Th>Designer</Table.Th>
                  <Table.Th>Tap</Table.Th>
                  <Table.Th>Hold</Table.Th>
                  <Table.Th>Slide</Table.Th>
                  <Table.Th>Touch</Table.Th>
                  <Table.Th>Break</Table.Th>
                  <Table.Th>Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {currentSheets.map((displaySheet, idx) => {
                  const diffName = normalizeDifficulty(displaySheet.difficulty);
                  const color = DIFFICULTY_COLORS[diffName] || 'gray';

                  return (
                    <Table.Tr key={`${displaySheet.type}-${displaySheet.difficulty}-${idx}`}>
                      <Table.Td className="sticky-col">
                        <Badge color={color} variant="filled" w="100%" size="sm">
                          {diffName}
                        </Badge>
                      </Table.Td>
                      <Table.Td fw={700}>{displaySheet.level}</Table.Td>
                      <Table.Td>{displaySheet.internalLevel || displaySheet.internalLevelValue || '-'}</Table.Td>
                      <Table.Td>
                        <Text size="sm" truncate maw={150} title={displaySheet.noteDesigner}>
                          {displaySheet.noteDesigner}
                        </Text>
                      </Table.Td>
                      <Table.Td>{displaySheet.noteCounts?.tap ?? '-'}</Table.Td>
                      <Table.Td>{displaySheet.noteCounts?.hold ?? '-'}</Table.Td>
                      <Table.Td>{displaySheet.noteCounts?.slide ?? '-'}</Table.Td>
                      <Table.Td>{displaySheet.noteCounts?.touch ?? '-'}</Table.Td>
                      <Table.Td>{displaySheet.noteCounts?.break ?? '-'}</Table.Td>
                      <Table.Td fw={700}>{displaySheet.noteCounts?.total ?? '-'}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Stack>
    </Paper>
  );
}
