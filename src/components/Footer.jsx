import { useState } from 'react';
import { Text, Group, Anchor, Stack } from '@mantine/core';
import { IconMail, IconHistory, IconShieldLock } from '@tabler/icons-react';
import ChangelogModal from './ChangelogModal';
import PrivacyModal from './PrivacyModal';
import './Footer.css';

function Footer() {
  const [changelogOpened, setChangelogOpened] = useState(false);
  const [privacyOpened, setPrivacyOpened] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <div style={{ marginTop: '2rem' }}>
      <Group justify="space-between" align="center">
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            © {currentYear} Made with ❤️ by Senny
          </Text>
          <Group gap="md">
            <Group
              gap="xs"
              style={{ cursor: 'pointer' }}
              onClick={() => setChangelogOpened(true)}
              className="footer-link-group"
            >
              <IconHistory size={14} color="gray" />
              <Text size="xs" c="dimmed" className="footer-link-text">
                Changelog
              </Text>
            </Group>

            <Group
              gap="xs"
              style={{ cursor: 'pointer' }}
              onClick={() => setPrivacyOpened(true)}
              className="footer-link-group"
            >
              <IconShieldLock size={14} color="gray" />
              <Text size="xs" c="dimmed" className="footer-link-text">
                Privacy
              </Text>
            </Group>
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

      <PrivacyModal
        opened={privacyOpened}
        onClose={() => setPrivacyOpened(false)}
      />
    </div>
  );
}

export default Footer;
