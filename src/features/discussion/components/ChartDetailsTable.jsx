import { Paper, Stack, Group, Title, Text, Badge, ScrollArea, Table } from '@mantine/core';
import { IconWorld } from '@tabler/icons-react';
import { DIFFICULTY_COLORS, normalizeDifficulty } from '../../../config/maimai-constants';

/**
 * Component for displaying the detailed stats and difficulty breakdown of a song.
 * Includes region availability and internal values.
 * @param {Object} props - Component props.
 * @param {Array<Object>} props.currentSheets - List of chart versions/sheets for the song.
 * @param {boolean} props.isMobile - Whether the viewer is on a mobile device.
 * @returns {JSX.Element|null} The rendered chart details table or null if no sheets available.
 */
export function ChartDetailsTable({ currentSheets, isMobile }) {
  if (!currentSheets || currentSheets.length === 0) return null;

  return (
    <Paper p="xl" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="flex-end">
          <Title order={3}>Chart Details</Title>
        </Group>

        <Group justify="space-between" align="center">
          {/* Region Availability */}
          <Group gap="xs" align="center">
            <Text size="sm" fw={700}>Regions:</Text>
            {(() => {
              const firstSheet = currentSheets[0];
              if (!firstSheet || !firstSheet.regions) return <Text size="sm" c="dimmed">Unknown</Text>;
              return Object.entries(firstSheet.regions)
                .map(([region, isAvailable]) => (
                  <Badge
                    key={region}
                    size="sm"
                    variant={isAvailable ? "light" : "outline"}
                    color={isAvailable ? "blue" : "gray"}
                    leftSection={<IconWorld size={10} />}
                    opacity={isAvailable ? 1 : 0.4}
                  >
                    {region.toUpperCase()}
                  </Badge>
                ));
            })()}
          </Group>
        </Group>

        {/* Difficulty Table */}
        <ScrollArea>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="sticky-col">Difficulty</Table.Th>
                <Table.Th>Level</Table.Th>
                <Table.Th>{isMobile ? 'Int. Lvl' : 'Internal Level'}</Table.Th>
                <Table.Th>{isMobile ? 'Des.' : 'Designer'}</Table.Th>
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
                      <Badge color={color} variant="filled" w="100%" size={isMobile ? "xs" : "sm"}>
                        {isMobile ? diffName.substring(0, 3).toUpperCase() : diffName}
                      </Badge>
                    </Table.Td>
                    <Table.Td fw={700}>{displaySheet.level}</Table.Td>
                    <Table.Td>{displaySheet.internalLevel || displaySheet.internalLevelValue || '-'}</Table.Td>
                    <Table.Td>
                      <Text size="xs" truncate maw={150} title={displaySheet.noteDesigner}>
                        {displaySheet.noteDesigner || '-'}
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
      </Stack>
    </Paper>
  );
}
