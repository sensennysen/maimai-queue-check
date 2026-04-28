import { Tooltip, Badge, Group } from '@mantine/core';
import IconCode from '@tabler/icons-react/dist/esm/icons/IconCode.mjs';
import IconGitPullRequest from '@tabler/icons-react/dist/esm/icons/IconGitPullRequest.mjs';
import IconBug from '@tabler/icons-react/dist/esm/icons/IconBug.mjs';
import { ATTRIBUTIONS, ATTRIBUTION_ORDER } from '../../constants/attributions';

const ICON_MAP = {
  IconCode: IconCode,
  IconGitPullRequest: IconGitPullRequest,
  IconBug: IconBug,
};

/**
 * Renders attribution badges (Developer, Contributor, Tester) for a user.
 *
 * @param {object} props
 * @param {string[]} [props.attributions]  - e.g. `profile.user_attributions?.attributions`
 * @param {'sm'|'xs'} [props.size]         - Badge size. Defaults to 'sm'.
 * @param {boolean} [props.compact]        - When true, renders icon-only badges (no label text).
 * @param {number} [props.gap]             - Gap between badges. Defaults to 6.
 */
export function UserAttributionBadges({ attributions, size = 'sm', compact = false, gap = 6 }) {
  if (!attributions?.length) return null;

  const active = ATTRIBUTION_ORDER.filter((key) => attributions.includes(key));
  if (!active.length) return null;

  return (
    <Group gap={gap} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
      {active.map((key) => {
        const cfg = ATTRIBUTIONS[key];
        const IconComponent = ICON_MAP[cfg.iconName];
        return (
          <Tooltip key={key} label={cfg.label} withArrow position="top">
            <Badge
              variant="light"
              color={cfg.color}
              size={size}
              leftSection={<IconComponent size={compact ? 12 : 14} />}
              style={{ cursor: 'default' }}
            >
              {!compact && cfg.label}
            </Badge>
          </Tooltip>
        );
      })}
    </Group>
  );
}
