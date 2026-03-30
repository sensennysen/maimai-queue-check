import { useState } from 'react';
import { Group, Button, Stack, Alert, Checkbox, Modal, Text, Autocomplete, Loader, Box } from '@mantine/core';
import IconPlus from '@tabler/icons-react/dist/esm/icons/IconPlus.mjs';
import IconEdit from '@tabler/icons-react/dist/esm/icons/IconEdit.mjs';
import IconAlertTriangle from '@tabler/icons-react/dist/esm/icons/IconAlertTriangle.mjs';
import { sanitizeHtml } from '../../../utils/sanitizeHtml';
import './QueueForm.css';
import { usePlayerSuggestions } from '../../../hooks/usePlayerSuggestions';
import { useBranch } from '../../../hooks/useBranch';

/**
 * Form component for adding or editing queue entries.
 * Handles player name entry, solo preference, and proximity validation.
 * @param {Object} props - Component props.
 * @param {Function} props.onSubmit - Handler for form submission.
 * @param {string|null} [props.editingId] - ID of the entry being edited, if any.
 * @param {Object} [props.editingData] - Initial data for the entry being edited.
 * @param {boolean} [props.isBusy=false] - Whether a mutation is in progress.
 * @param {boolean} [props.locationVerified=false] - Whether the user's location is verified.
 * @param {string|null} [props.locationError=null] - Description of any location verification errors.
 * @param {boolean} [props.isSuperAdmin=false] - Whether the user has super-admin privileges.
 * @param {Array<Object>} [props.queue=[]] - The current list of waiting queue entries.
 * @param {Object|null} [props.nowPlaying=null] - The currently playing entry.
 * @returns {JSX.Element} The rendered queue form.
 */
function QueueForm({ onSubmit, editingId, editingData, isBusy = false, locationVerified = false, locationError = null, isSuperAdmin = false, queue = [], nowPlaying = null }) {
  const initialPlayer1 = editingId && editingData && editingData.player1 ? String(editingData.player1).trim() : '';
  const initialPlayer2 = editingId && editingData && editingData.player2 ? String(editingData.player2).trim() : '';

  const { selectedBranch } = useBranch();
  // Pass the realtime queue to the hook
  const { suggestions, loading } = usePlayerSuggestions(selectedBranch?.id, queue);

  const [player1, setPlayer1] = useState(initialPlayer1);
  const [player2, setPlayer2] = useState(initialPlayer2);
  const [playingSolo, setPlayingSolo] = useState(editingId && !initialPlayer2);
  const [showSimilarityModal, setShowSimilarityModal] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Check location verification first
    if (!locationVerified && !isSuperAdmin) {
      newErrors.general = locationError || 'Location verification required';
      setErrors(newErrors);
      return false;
    }

    // At least one player is required
    if (!player1.trim() && !player2.trim()) {
      newErrors.general = 'At least one player is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkForSimilarity = (p1, p2) => {
    // Combine queue and nowPlaying for similarity check
    const activePlayers = [...queue];
    if (nowPlaying) {
      activePlayers.push(nowPlaying);
    }

    if (!activePlayers || activePlayers.length === 0) return false;

    const p1Name = p1.trim().toLowerCase();
    const p2Name = p2.trim().toLowerCase();

    return activePlayers.some(entry => {
      if (editingId && entry.id === editingId) return false; // Skip self

      const existingP1 = entry.player1 ? entry.player1.trim().toLowerCase() : '';
      const existingP2 = entry.player2 ? entry.player2.trim().toLowerCase() : '';

      // Check P1
      if (p1Name && (p1Name === existingP1 || p1Name === existingP2)) return true;
      // Check P2
      if (p2Name && (p2Name === existingP1 || p2Name === existingP2)) return true;

      return false;
    });
  };

  const executeSubmit = () => {
    // Plain-text rendering for player names to prevent HTML injection.
    const cleanP1 = sanitizeHtml(player1.trim(), { mode: 'text' });
    const cleanP2 = sanitizeHtml(player2.trim(), { mode: 'text' });

    if (editingId) {
      onSubmit(editingId, cleanP1, cleanP2);
    } else {
      onSubmit(cleanP1, cleanP2);
    }

    // Clear form after successful submission (only if not editing)
    if (!editingId) {
      setPlayer1('');
      setPlayer2('');
      setPlayingSolo(false);
    }
    setErrors({});
    setShowSimilarityModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBusy) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Check for similarity
    if (checkForSimilarity(player1, player2)) {
      setShowSimilarityModal(true);
      return;
    }

    executeSubmit();
  };



  return (
    <Box>
      <form onSubmit={handleSubmit} onKeyDown={(e) => { if (isBusy) { e.preventDefault(); e.stopPropagation(); } }}>
        <Stack gap="md">
          {errors.general && (
            <Alert color="red" variant="light" radius="md">
              {errors.general}
            </Alert>
          )}

          {locationError && !locationVerified && !isSuperAdmin && (
            <Alert color="orange" variant="light" radius="md">
              {locationError}
            </Alert>
          )}

          <Box
            style={{
              borderRadius: 18,
              padding: '16px',
              background: 'var(--theme-surface)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <Stack gap="md">
              <Autocomplete
                label={<Text size="sm" fw={700} style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>Player 1 Side</Text>}
                placeholder="Enter Player 1 name"
                data={player1.trim().length > 0 && !loading ? suggestions : []}
                value={player1}
                onChange={(val) => {
                  setPlayer1(val.replace(/[^a-zA-Z0-9 @#!\-_.,&'()]/g, '').slice(0, 10));
                }}
                error={errors.player1}
                maxLength={10}
                variant="filled"
                styles={{
                  input: { background: 'var(--theme-bg-soft)', borderRadius: 12, minHeight: 46 },
                  root: { flex: 1 }
                }}
                disabled={isBusy || (!locationVerified && !isSuperAdmin)}
                rightSection={loading ? <Loader size="sm" /> : null}
                comboboxProps={{ withinPortal: false, position: 'bottom' }}
                filter={({ options, search }) => {
                  const splittedSearch = search.toLowerCase().trim().split(' ');
                  return (
                    options.filter((option) =>
                      splittedSearch.every((searchPart) => option.label.toLowerCase().includes(searchPart))
                    )
                  );
                }}
              />

              <Checkbox
                label={<Text size="sm" fw={600}>Playing Solo</Text>}
                checked={playingSolo}
                color="var(--theme-primary)"
                onChange={(e) => {
                  setPlayingSolo(e.currentTarget.checked);
                  if (e.currentTarget.checked) {
                    setPlayer2('');
                  }
                }}
                disabled={isBusy || (!locationVerified && !isSuperAdmin)}
              />

              {!playingSolo && (
                <Autocomplete
                  label={<Text size="sm" fw={700} style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>Player 2 Side</Text>}
                  placeholder="Enter Player 2 name"
                  data={player2.trim().length > 0 && !loading ? suggestions : []}
                  value={player2}
                  onChange={(val) => {
                    setPlayer2(val.replace(/[^a-zA-Z0-9 @#!\-_.,&'()]/g, '').slice(0, 10));
                  }}
                  error={errors.player2}
                  maxLength={10}
                  variant="filled"
                  styles={{
                    input: { background: 'var(--theme-bg-soft)', borderRadius: 12, minHeight: 46 }
                  }}
                  disabled={isBusy || (!locationVerified && !isSuperAdmin)}
                  rightSection={loading ? <Loader size="sm" /> : null}
                  comboboxProps={{ withinPortal: false, position: 'bottom' }}
                  filter={({ options, search }) => {
                    const splittedSearch = search.toLowerCase().trim().split(' ');
                    return (
                      options.filter((option) =>
                        splittedSearch.every((searchPart) => option.label.toLowerCase().includes(searchPart))
                      )
                    );
                  }}
                />
              )}
            </Stack>
          </Box>

          <Group justify="flex-end" gap="sm" pt={4}>
            <Button
              type="submit"
              leftSection={editingId ? <IconEdit size={16} /> : <IconPlus size={16} />}
              variant="filled"
              size="md"
              radius="lg"
              disabled={isBusy || (!locationVerified && !isSuperAdmin)}
              style={{ flex: 1 }}
            >
              {editingId ? 'Update Entry' : 'Join Queue'}
            </Button>
          </Group>
        </Stack>
      </form>

      <Modal
        opened={showSimilarityModal}
        onClose={() => setShowSimilarityModal(false)}
        centered
        padding={0}
        radius={24}
        withCloseButton={false}
        styles={{
          content: { overflow: 'hidden' },
          body: { padding: 0 }
        }}
      >
        {/* ── Fixed Warning Header ─────────────────────────────────────────── */}
        <Box
          style={{
            background: 'linear-gradient(135deg, var(--theme-warning), color-mix(in srgb, var(--theme-warning), #fff 20%))',
            padding: '24px 24px 20px',
            position: 'relative',
            overflow: 'hidden',
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
              <IconAlertTriangle size={18} color="#fff" strokeWidth={2.2} />
            </Box>
            <Box>
              <Text
                size="lg"
                fw={800}
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: '#fff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                Similar Name
              </Text>
              <Text size="xs" style={{ color: '#fff', opacity: 0.9, marginTop: 2 }}>
                We found a matching entry
              </Text>
            </Box>
          </Group>
        </Box>

        <Stack gap="md" p="lg">
          <Box
            style={{
              borderRadius: 18,
              padding: '16px',
              background: 'var(--theme-surface)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <Text size="sm" style={{ lineHeight: 1.5 }}>
              One of the names in this entry seems to be similar with another entry on the queue. Are you sure you want to proceed?
            </Text>
          </Box>

          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={() => setShowSimilarityModal(false)} color="gray">
              Cancel
            </Button>
            <Button
              onClick={executeSubmit}
              color="orange"
              radius="md"
            >
              Proceed Anyway
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}

export default QueueForm;