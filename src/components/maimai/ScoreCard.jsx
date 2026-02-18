
import { Card, Image, Text, Group, Badge, Stack, Box, Flex } from '@mantine/core';
import dxImage from '../../assets/music_dx.png';
import standardImage from '../../assets/music_standard.png';

import { getGrade } from '../../utils/maimai-calc';
import { BASE_JACKET_URL, DIFFICULTY_COLORS } from '../../config/maimai-constants';

export function ScoreCard({ score }) {
  // Use imageName from score object (populated from otoge-db)
  const jacketUrl = score.imageName
    ? `${BASE_JACKET_URL}${score.imageName}`
    : null;

  // Use grade from score or calculate fallback (for existing data)
  const scoreGrade = score.grade || getGrade(score.achievement);

  const difficultyColor = DIFFICULTY_COLORS[score.difficulty] || 'gray';
  // Use full difficulty string, ensuring consistent capitalization if needed
  // score.difficulty is usually "Master", "Re:Master" etc from the parser
  const difficultyLabel = score.difficulty;

  const typeImage = score.type === 'DX' ? dxImage : standardImage;

  return (
    <Card shadow="sm" padding="xs" radius="md" withBorder>
      <Flex gap="sm" align="center">
        {/* Jacket Image */}
        <Box w={90} h={90} style={{ flexShrink: 0, position: 'relative' }}>
          <Image
            src={jacketUrl}
            w={90}
            h={90}
            radius="md"
            fallbackSrc="https://placehold.co/90x90?text=No+Image"
            alt={score.title}
          />
        </Box>

        {/* Info Column */}
        <Stack gap={2} style={{ flexGrow: 1, minWidth: 0 }}>
          {/* Top Row: Title + Type Image */}
          <Group wrap="nowrap" justify="space-between" align="flex-start">
            <Text size="sm" truncate="end" fw={700} title={score.title} style={{ lineHeight: 1.2 }}>
              {score.title}
            </Text>
            <Image
              src={typeImage}
              w="auto"
              h={20}
              fit="contain"
              alt={score.type}
            />
          </Group>

          {/* Difficulty + Constant */}
          <Group gap={6}>
            <Badge
              color={difficultyColor}
              variant="filled"
              size="sm"
              radius="sm"
              styles={{ root: { backgroundColor: difficultyColor, color: 'white' } }}
            >
              {difficultyLabel}
            </Badge>
            {score.level && (
              <Text size="xs" c="secondary" fw={600}>
                {score.level.toFixed(1)}
              </Text>
            )}
          </Group>

          {/* Stats Row */}
          <Group gap="xs" mt={4} align="flex-end" justify="space-between" style={{ width: '100%' }}>
            <Box>
              <Text size="lg" fw={800} style={{ lineHeight: 1 }}>
                {parseFloat(score.achievement).toFixed(4)}%
              </Text>
              <Text size="md" fw={700}>
                {scoreGrade}
              </Text>
            </Box>
            <Badge
              variant="gradient"
              gradient={{ from: 'var(--theme-primary)', to: 'var(--theme-secondary)', deg: 90 }}
              size="xl"
              radius="md"
            >
              {score.rating}
            </Badge>
          </Group>
        </Stack>
      </Flex>
    </Card>
  );
}
