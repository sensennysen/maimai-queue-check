import { Text, Group, Button, Box, Anchor, Switch, Stack, Transition, Container } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';

/**
 * A bottom-anchored, non-blocking banner for GDPR/PH compliance.
 * Dismisses on click and remembers preference in localStorage.
 */
export default function ConsentBanner() {
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  // Dynamic keys based on user session
  const consentKey = user ? `smf_legal_consent_v1_${user.id}` : 'smf_legal_consent_v1_guest';
  const analyticsKey = user ? `smf_analytics_opt_out_${user.id}` : 'smf_analytics_opt_out_guest';

  const [optOut, setOptOut] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Check if the current context has already consented
    const hasConsent = localStorage.getItem(consentKey);
    const savedOptOut = localStorage.getItem(analyticsKey) === 'true';

    setOptOut(savedOptOut);

    if (!hasConsent) {
      // Small delay for better UX after initial load or account switch
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [consentKey, analyticsKey, loading]);

  const handleAccept = () => {
    localStorage.setItem(consentKey, 'true');
    localStorage.setItem(analyticsKey, optOut.toString());
    setVisible(false);
  };

  const handleLinkClick = (e, path) => {
    e.preventDefault();
    navigate(path);
  };

  if (!visible) return null;

  return (
    <Transition mounted={visible} transition="slide-up" duration={400} timingFunction="ease">
      {(styles) => (
        <Box
          style={{
            ...styles,
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            padding: 'var(--mantine-spacing-md)',
            backgroundColor: 'rgba(var(--mantine-color-body-rgb), 0.95)',
            backdropFilter: 'blur(8px)',
            borderTop: '1px solid var(--mantine-color-default-border)',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Container size="xl">
            <Group justify="space-between" align="center" gap="xl" wrap="wrap">
              <Stack gap={4} style={{ flex: 1, minWidth: '300px' }}>
                <Text size="sm" fw={600}>We value your privacy</Text>
                <Text size="xs" c="dimmed">
                  By using this App, you acknowledge that you have read and agree to our{' '}
                  <Anchor href="/privacy" size="xs" fw={700} onClick={(e) => handleLinkClick(e, '/privacy')}>Privacy Policy</Anchor>
                  {' '}and{' '}
                  <Anchor href="/terms" size="xs" fw={700} onClick={(e) => handleLinkClick(e, '/terms')}>Terms of Service</Anchor>.
                  We use anonymized telemetry to improve our service globally.
                </Text>
              </Stack>

              <Group gap="lg" align="center">
                <Switch
                  size="xs"
                  label={<Text size="xs">Anonymous Analytics</Text>}
                  checked={!optOut}
                  onChange={(event) => setOptOut(!event.currentTarget.checked)}
                />
                <Button size="sm" radius="md" onClick={handleAccept}>
                  Accept & Continue
                </Button>
              </Group>
            </Group>
          </Container>
        </Box>
      )}
    </Transition>
  );
}
