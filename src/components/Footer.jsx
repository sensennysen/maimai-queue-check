import { useState } from 'react';
import { Text, Group, Anchor, Stack } from '@mantine/core';
import { IconMail, IconHistory } from '@tabler/icons-react';
import ChangelogModal from './ChangelogModal';
import './Footer.css';

function Footer() {
  const [changelogOpened, setChangelogOpened] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <div style={{ marginTop: '2rem' }}>
      <Group justify="space-between" align="center">
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            © {currentYear} Made with ❤️ by Senny
          </Text>
          <Group
            gap="xs"
            style={{ cursor: 'pointer' }}
            onClick={() => setChangelogOpened(true)}
            className="changelog-trigger"
          >
            <IconHistory size={14} color="gray" />
            <Text size="xs" c="dimmed" style={{ borderBottom: '1px dashed var(--mantine-color-dimmed)' }}>
              Changelog
            </Text>
          </Group>
        </Stack>
        <Anchor
          href="mailto:dev.bille.lagarde@gmail.com"
          size="sm"
          c="dimmed"
        >
          <Group gap="xs">
            <IconMail size={16} />
            <span>dev.bille.lagarde@gmail.com</span>
          </Group>
        </Anchor>
      </Group>

      <ChangelogModal
        opened={changelogOpened}
        onClose={() => setChangelogOpened(false)}
      />
    </div>
  );
}

export default Footer;
