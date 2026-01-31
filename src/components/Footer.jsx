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
    <footer className="footer">
      <Stack gap="md" align="center">
        <Group gap="lg" justify="center" wrap="wrap">
          <Group
            gap="xs"
            className="footer-link-group"
            style={{ cursor: 'pointer' }}
            onClick={() => setChangelogOpened(true)}
          >
            <IconHistory size={16} />
            <Text size="sm" className="footer-link-text">
              Changelog
            </Text>
          </Group>

          <Text size="sm" c="dimmed" className="footer-divider">•</Text>

          <Group
            gap="xs"
            className="footer-link-group"
            style={{ cursor: 'pointer' }}
            onClick={() => setPrivacyOpened(true)}
          >
            <IconShieldLock size={16} />
            <Text size="sm" className="footer-link-text">
              Privacy
            </Text>
          </Group>

          <Text size="sm" c="dimmed" className="footer-divider">•</Text>

          <Anchor
            href="mailto:dev.bille.lagarde@gmail.com"
            className="footer-link-group footer-email"
          >
            <Group gap="xs">
              <IconMail size={16} />
              <Text size="sm" className="footer-link-text">Contact</Text>
            </Group>
          </Anchor>
        </Group>

        <Text size="xs" c="dimmed" className="footer-copyright">
          © {currentYear} Made with ❤️ by Senny
        </Text>
      </Stack>

      <ChangelogModal
        opened={changelogOpened}
        onClose={() => setChangelogOpened(false)}
      />

      <PrivacyModal
        opened={privacyOpened}
        onClose={() => setPrivacyOpened(false)}
      />
    </footer>
  );
}

export default Footer;
