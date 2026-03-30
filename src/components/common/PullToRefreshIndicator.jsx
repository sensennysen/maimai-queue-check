import { Box, Text } from '@mantine/core';

export function PullToRefreshIndicator({ pullDistance, isRefreshing }) {
  return (
    <Box className="community-pull-indicator-wrap" style={{ height: pullDistance > 0 || isRefreshing ? 32 : 0 }}>
      <Text size="sm" c="dimmed" ta="center" className="community-pull-indicator-text">
        {isRefreshing ? 'Refreshing...' : pullDistance >= 64 ? 'Release to refresh' : 'Pull down to refresh'}
      </Text>
    </Box>
  );
}
