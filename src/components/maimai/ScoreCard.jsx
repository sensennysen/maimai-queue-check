
import React from 'react';
import { Card, Image, Text, Group, Badge, Stack, Box, Flex } from '@mantine/core';
import dxImage from '../../assets/music_dx.png';
import standardImage from '../../assets/music_standard.png';

import { getGrade } from '../../utils/maimai-calc';
import { BASE_JACKET_URL, DIFFICULTY_COLORS, normalizeDifficulty } from '../../config/maimai-constants';

const formatComboAchievement = (value) => {
  if (!value) return null;
  const v = String(value).trim();
  const lower = v.toLowerCase();
  if (lower === 'fc') return 'FC';
  if (lower === 'fcp') return 'FC+';
  if (lower === 'ap') return 'AP';
  if (lower === 'app') return 'AP+';
  if (v === 'FC' || v === 'FC+' || v === 'AP' || v === 'AP+') return v;
  return v;
};

const formatSyncType = (value) => {
  if (!value) return null;
  const v = String(value).trim();
  const lower = v.toLowerCase();
  if (lower === 'fs') return 'FS';
  if (lower === 'fsp') return 'FS+';
  if (lower === 'fdx') return 'FDX';
  if (lower === 'fdxp') return 'FDX+';
  if (v === 'FS' || v === 'FS+' || v === 'FDX' || v === 'FDX+') return v;
  return v;
};

export const ScoreCard = React.memo(function ScoreCard({ score, onClick, isExport }) {
  // Use imageName from score object (populated from otoge-db)
  const jacketUrl = score.imageName
    ? `${BASE_JACKET_URL}${score.imageName}`
    : null;

  // Use grade from score or calculate fallback (for existing data)
  const scoreGrade = score.grade || getGrade(score.achievement);

  const difficultyLabel = normalizeDifficulty(score.difficulty);
  const difficultyColor = DIFFICULTY_COLORS[difficultyLabel] || 'gray';

  const typeImage = score.type === 'DX' ? dxImage : standardImage;

  const comboTag = formatComboAchievement(score.comboAchievement ?? score.comboAchivement);
  const syncTag = formatSyncType(
    score.syncType ?? score.syncAchievement ?? score.syncAchivement
  );
  const hasTags = Boolean(comboTag || syncTag);

  return (
    <Card
      shadow="sm"
      padding="xs"
      radius="md"
      withBorder
      style={{
        cursor: onClick ? 'pointer' : undefined,
        transition: onClick ? 'transform 0.12s ease, box-shadow 0.12s ease' : undefined,
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 118px'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
      }}
      onMouseLeave={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <Flex gap="sm" align="center">
        {/* Jacket Image */}
        <Box w={isExport ? 120 : 90} h={isExport ? 120 : 90} style={{ flexShrink: 0, position: 'relative' }}>
          <Image
            src={jacketUrl}
            w={isExport ? 120 : 90}
            h={isExport ? 120 : 90}
            radius="md"
            fallbackSrc={isExport ? "https://placehold.co/120x120?text=No+Image" : "https://placehold.co/90x90?text=No+Image"}
            alt={score.title}
            loading="lazy"
          />
        </Box>

        {/* Info Column */}
        <Stack gap={2} style={{ flexGrow: 1, minWidth: 0 }}>
          {/* Top Row: Title + Type Image */}
          <Group wrap="nowrap" justify="space-between" align="flex-start">
            <Text size={isExport ? "lg" : "sm"} truncate="end" fw={isExport ? 900 : 700} title={score.title} style={{ lineHeight: 1.2 }}>
              {score.title}
            </Text>
            <Image
              src={typeImage}
              w="auto"
              h={isExport ? 28 : 20}
              fit="contain"
              alt={score.type}
              loading="lazy"
            />
          </Group>

          {/* Difficulty + Constant */}
          <Group gap={6} justify="space-between" wrap="nowrap">
            <Group gap={6} wrap="nowrap" align="center">
              <Badge
                color={difficultyColor}
                variant="filled"
                size={isExport ? "md" : "sm"}
                radius="sm"
                styles={{ root: { backgroundColor: difficultyColor, color: 'white' } }}
              >
                {difficultyLabel}
              </Badge>
              {score.level && (
                <Text size={isExport ? "md" : "xs"} c="secondary" fw={isExport ? 800 : 600}>
                  {score.level.toFixed(1)}
                </Text>
              )}
            </Group>
            {hasTags && (
              <Group gap={4} wrap="nowrap">
                {comboTag && (
                  <Badge size={isExport ? "md" : "xs"} variant="light" color="orange">
                    {comboTag}
                  </Badge>
                )}
                {syncTag && (
                  <Badge size={isExport ? "md" : "xs"} variant="light" color="cyan">
                    {syncTag}
                  </Badge>
                )}
              </Group>
            )}
          </Group>

          {/* Stats Row */}
          <Group gap="xs" align="flex-end" justify="space-between" style={{ width: '100%' }}>
            <Box>
              <Text size={isExport ? "xl" : "lg"} fw={isExport ? 900 : 800} style={{ lineHeight: 1, fontSize: isExport ? '1.8rem' : undefined }}>
                {parseFloat(score.achievement).toFixed(4)}%
              </Text>
              <Text size={isExport ? "lg" : "md"} fw={700} style={{ marginTop: isExport ? 4 : 0 }}>
                {scoreGrade}
              </Text>
            </Box>
            <Badge
              variant="gradient"
              gradient={{ from: 'var(--theme-primary)', to: 'var(--theme-secondary)', deg: 90 }}
              size={isExport ? "2.5rem" : "xl"}
              radius="md"
              styles={{
                root: isExport ? { height: '3rem', fontSize: '1.5rem', padding: '0 1rem' } : {}
              }}
            >
              {score.rating}
            </Badge>
          </Group>
        </Stack>
      </Flex>
    </Card>
  );
});
