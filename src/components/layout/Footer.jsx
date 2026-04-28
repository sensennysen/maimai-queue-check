import { Text, Group, Stack, Anchor } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';
import IconShieldLock from '@tabler/icons-react/dist/esm/icons/IconShieldLock.mjs';
import IconFileText from '@tabler/icons-react/dist/esm/icons/IconFileText.mjs';
import IconHeart from '@tabler/icons-react/dist/esm/icons/IconHeart.mjs';
import './Footer.css';

function Footer() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/view') return null;

  return (
    <footer className="footer">
      <Stack gap="md" align="center">
        <Group gap="lg" justify="center" wrap="wrap">
          <Anchor
            component="button"
            size="sm"
            onClick={() => navigate('/privacy')}
            className="footer-link"
          >
            <IconShieldLock size={14} />
            Privacy Policy
          </Anchor>
          <Anchor
            component="button"
            size="sm"
            onClick={() => navigate('/terms')}
            className="footer-link"
          >
            <IconFileText size={14} />
            Terms of Service
          </Anchor>
        </Group>

        <Text size="sm" className="footer-copyright">
          © {new Date().getFullYear()} Made with <IconHeart size={12} fill="var(--theme-primary)" color="var(--theme-primary)" style={{ verticalAlign: 'middle', marginBottom: 2 }} /> by Senny
        </Text>
      </Stack>
    </footer>
  );
}

export default Footer;
