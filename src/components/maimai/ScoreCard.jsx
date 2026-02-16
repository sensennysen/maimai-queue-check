
import { Card, Image, Text, Group, Badge, Stack, Box, Flex } from '@mantine/core';
import dxImage from '../../assets/music_dx.png';
import standardImage from '../../assets/music_standard.png';

const BASE_JACKET_URL = 'https://dp4p6x0xfi5o9.cloudfront.net/maimai/img/cover/';

// Difficulty Colors (RGB)
const DIFFICULTY_COLORS = {
  'Basic': 'rgb(34, 187, 91)',
  'Advanced': 'rgb(251, 156, 45)',
  'Expert': 'rgb(246, 72, 97)',
  'Master': 'rgb(158, 69, 226)',
  'Re:Master': 'rgb(186, 103, 248)',
};

export function ScoreCard({ score }) {
  // Use imageName from score object (populated from otoge-db)
  const jacketUrl = score.imageName
    ? `${BASE_JACKET_URL}${score.imageName}`
    : null;

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

          {/* Difficulty Label */}
          <Badge
            color={difficultyColor}
            variant="filled"
            size="sm"
            radius="sm"
            styles={{ root: { backgroundColor: difficultyColor, color: 'white' } }}
          >
            {difficultyLabel}
          </Badge>

          {/* Stats Row */}
          <Group gap="xs" mt={4} align="flex-end" justify="space-between" style={{ width: '100%' }}>
            <Text size="lg" fw={800} style={{ lineHeight: 1 }}>
              {score.achievement}%
            </Text>
            <Badge
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
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
