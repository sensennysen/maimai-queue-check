import { useState } from 'react';
import { Text, Group, Stack } from '@mantine/core';
import { useLocation } from 'react-router-dom';
import IconShieldLock from '@tabler/icons-react/dist/esm/icons/IconShieldLock.mjs';
import IconHeart from '@tabler/icons-react/dist/esm/icons/IconHeart.mjs';
import PrivacyModal from '../modals/PrivacyModal';
import './Footer.css';

function Footer() {
  const location = useLocation();
  const [privacyOpened, setPrivacyOpened] = useState(false);

  if (location.pathname === '/view') return null;

  return (
    <footer className="footer">
      <Stack gap="md" align="center">
        <Group gap="lg" justify="center" wrap="wrap">
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
        </Group>

        <Text size="sm" c="secondary" className="footer-copyright">
          © {new Date().getFullYear()} Made with <IconHeart size={12} fill="var(--theme-primary)" color="var(--theme-primary)" style={{ verticalAlign: 'middle', marginBottom: 2 }} /> by Senny
        </Text>
      </Stack>

      <PrivacyModal
        opened={privacyOpened}
        onClose={() => setPrivacyOpened(false)}
      />
    </footer>
  );
}

export default Footer;
