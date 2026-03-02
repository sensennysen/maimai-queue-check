import { useState } from 'react';
import { Text, Group, Stack } from '@mantine/core';
import IconMail from '@tabler/icons-react/dist/esm/icons/IconMail.mjs';
import IconHistory from '@tabler/icons-react/dist/esm/icons/IconHistory.mjs';
import IconShieldLock from '@tabler/icons-react/dist/esm/icons/IconShieldLock.mjs';
import IconHeart from '@tabler/icons-react/dist/esm/icons/IconHeart.mjs';
import ChangelogModal from '../modals/ChangelogModal';
import PrivacyModal from '../modals/PrivacyModal';
import './Footer.css';

function Footer() {
  const [changelogOpened, setChangelogOpened] = useState(false);
  const [privacyOpened, setPrivacyOpened] = useState(false);

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
              Changelogs
            </Text>
          </Group>

          <Text size="sm" c="secondary" className="footer-divider">•</Text>

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

          <Text size="sm" c="secondary" className="footer-divider">•</Text>

          <Group
            gap="xs"
            className="footer-link-group"
            style={{ cursor: 'pointer' }}
            onClick={() => window.location.href = '/contact'}
          >
            <IconMail size={16} />
            <Text size="sm" className="footer-link-text">Contact</Text>
          </Group>





        </Group>

        <Text size="xs" c="secondary" className="footer-copyright">
          © {new Date().getFullYear()} Made with <IconHeart size={12} fill="var(--theme-primary)" color="var(--theme-primary)" style={{ verticalAlign: 'middle', marginBottom: 2 }} /> by Senny
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
