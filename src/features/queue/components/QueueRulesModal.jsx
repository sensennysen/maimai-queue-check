import { useState, useEffect, useCallback } from 'react';
import { Modal, Text, Box, Loader, Stack, Group, Button, UnstyledButton, TypographyStylesProvider } from '@mantine/core';
import IconFileText from '@tabler/icons-react/dist/esm/icons/IconFileText.mjs';
import IconInfoCircle from '@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs';
import { rulesService } from '../../../services/supabase';
import { sanitizeHtml } from '../../../utils/sanitizeHtml';

/**
 * Modal component for displaying the rules and guidelines for a specific branch.
 * @param {Object} props - Component props.
 * @param {boolean} props.opened - Whether the modal is visible.
 * @param {Function} props.onClose - Callback to close the modal.
 * @param {string} [props.branchId] - The ID of the branch to fetch rules for.
 * @returns {JSX.Element} The rendered rules modal.
 */
const QueueRulesModal = ({ opened, onClose, branchId }) => {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState(null);
  const [error, setError] = useState(null);

  const fetchRules = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await rulesService.getRules(branchId);
      setRules(data);
    } catch (err) {
      console.error('Error fetching rules:', err);
      setError('Failed to load queue rules.');
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    if (opened && branchId) {
      fetchRules();
    } else if (opened && !branchId) {
      setLoading(false);
      setRules(null);
    }
  }, [opened, branchId, fetchRules]);

  const sanitizedContent = rules?.rules
    ? sanitizeHtml(rules.rules, { mode: 'rich' })
    : null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      aria-label="Queue Rules"
      size="lg"
      centered
      padding={0}
      radius={24}
      withCloseButton={false}
      styles={{
        content: {
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 40px)'
        },
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden'
        },
      }}
    >
      {/* ── Fixed Header ─────────────────────────────────────────── */}
      <Box
        className="app-modal-header"
        style={{
          background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary), var(--theme-secondary) 40%))',
          padding: '24px 24px 20px',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Group gap="sm" style={{ position: 'relative', zIndex: 1 }}>
          <Box
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3)',
            }}
          >
            <IconFileText size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
          </Box>
          <Box>
            <Text
              size="lg"
              fw={800}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--theme-primary-contrast)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Queue Rules
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              Local guidelines for a better experience
            </Text>
          </Box>
        </Group>

        <UnstyledButton
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            padding: '4px 12px',
            borderRadius: 20,
            background: 'rgba(255,255,255,0.2)',
            color: 'var(--theme-primary-contrast)',
            fontSize: 12,
            fontWeight: 700,
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
          aria-label="Close"
          className="header-close-pill"
        >
          Close
        </UnstyledButton>
      </Box>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="md" p="lg">
          {loading ? (
            <Group justify="center" py="xl">
              <Loader size="sm" color="var(--theme-primary)" />
              <Text size="sm" c="dimmed">Loading rules...</Text>
            </Group>
          ) : error ? (
            <Box
              style={{
                borderRadius: 18,
                padding: '16px',
                background: 'color-mix(in srgb, var(--theme-error), transparent 93%)',
                border: '1px solid color-mix(in srgb, var(--theme-error), transparent 80%)',
                display: 'flex',
                gap: 12,
              }}
            >
              <IconInfoCircle size={18} color="var(--theme-error)" style={{ marginTop: 2 }} />
              <Text size="sm" fw={700} color="var(--theme-error)">{error}</Text>
            </Box>
          ) : sanitizedContent ? (
            <Box
              style={{
                borderRadius: 18,
                padding: '20px',
                background: 'var(--theme-surface)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                border: '1px solid var(--theme-border)',
              }}
            >
              <TypographyStylesProvider>
                <div
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                  style={{ fontSize: '0.95rem', lineHeight: 1.6 }}
                />
              </TypographyStylesProvider>
              {rules.updated_at && (
                <Text size="xs" color="dimmed" mt="xl" ta="right">
                  Last updated: {new Date(rules.updated_at).toLocaleDateString()}
                </Text>
              )}
            </Box>
          ) : (
            <Stack align="center" py="xl" gap="sm">
              <IconInfoCircle size={32} color="var(--theme-border)" />
              <Text c="dimmed" ta="center" size="sm" style={{ maxWidth: 280 }}>
                Please ask the locals in the area about the queue rules.
              </Text>
            </Stack>
          )}

          <Group justify="flex-end" pt={4}>
            <Button
              variant="filled"
              onClick={onClose}
              style={{
                background: 'var(--theme-primary)',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--theme-primary), transparent 70%)',
              }}
            >
              Understood
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  );
};

export default QueueRulesModal;
