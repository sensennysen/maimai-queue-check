import { Skeleton, Stack } from '@mantine/core';

/**
 * SectionSkeleton shared component
 */
export function SectionSkeleton({ rows = 3, height = 72 }) {
  return (
    <Stack gap="sm">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={height} radius="md" />
      ))}
    </Stack>
  );
}
