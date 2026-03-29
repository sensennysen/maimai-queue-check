import { useState, useEffect, useCallback } from 'react';
import { Modal, Text, Box, Loader, Stack, Group, ThemeIcon, ScrollArea, TypographyStylesProvider } from '@mantine/core';
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
      title={
        <Group gap="xs">
          <ThemeIcon variant="light" color="blue">
            <IconFileText size={18} />
          </ThemeIcon>
          <Text fw={600}>Queue Rules</Text>
        </Group>
      }
      size="lg"
      centered
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md" py="xs" mt="xs" p="md">
        {loading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">Loading rules...</Text>
          </Group>
        ) : error ? (
          <Group gap="xs" c="red" justify="center" py="xl">
            <IconInfoCircle size={16} />
            <Text size="sm">{error}</Text>
          </Group>
        ) : sanitizedContent ? (
          <Box className="queue-rules-content">
            <TypographyStylesProvider>
              <div
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                style={{ fontSize: '0.95rem', lineHeight: 1.6 }}
              />
            </TypographyStylesProvider>
            {rules.updated_at && (
              <Text size="sm" c="dimmed" mt="xl" ta="right">
                Last updated: {new Date(rules.updated_at).toLocaleDateString()}
              </Text>
            )}
          </Box>
        ) : (
          <Stack align="center" py="xl" gap="xs">
            <IconInfoCircle size={32} color="var(--mantine-color-dimmed)" />
            <Text c="dimmed" ta="center">
              Please ask the locals in the area about the queue rules.
            </Text>
          </Stack>
        )}
      </Stack>
    </Modal>
  );
};

export default QueueRulesModal;
