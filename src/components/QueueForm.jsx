import { useState } from 'react';
import { TextInput, Group, Button, Stack, Alert, Checkbox, Modal, Text } from '@mantine/core';
import { IconPlus, IconEdit } from '@tabler/icons-react';
import DOMPurify from 'dompurify';
import './QueueForm.css';

function QueueForm({ onSubmit, editingId, editingData, isBusy = false, locationVerified = false, locationError = null, isSuperAdmin = false, queue = [], nowPlaying = null }) {
  const initialPlayer1 = editingId && editingData && editingData.player1 ? String(editingData.player1).trim() : '';
  const initialPlayer2 = editingId && editingData && editingData.player2 ? String(editingData.player2).trim() : '';

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
    const sanitize = (text) => DOMPurify.sanitize(text.trim(), { ALLOWED_TAGS: [] });
    const cleanP1 = sanitize(player1);
    const cleanP2 = sanitize(player2);

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
    <div>
      <form onSubmit={handleSubmit} onKeyDown={(e) => { if (isBusy) { e.preventDefault(); e.stopPropagation(); } }}>
        <Stack gap="md">
          {errors.general && (
            <Alert color="red" variant="light">
              {errors.general}
            </Alert>
          )}

          {locationError && !locationVerified && !isSuperAdmin && (
            <Alert color="orange" variant="light">
              {locationError}
            </Alert>
          )}

          <Stack gap="md">
            <TextInput
              label="Player 1 Side"
              placeholder="Enter Player 1 name"
              value={player1}
              onChange={(e) => {
                const val = e.target.value;
                setPlayer1(val.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 8));
              }}
              error={errors.player1}
              maxLength={8}
              disabled={isBusy || (!locationVerified && !isSuperAdmin)}
              style={{ marginTop: '1rem' }}
            />

            <Checkbox
              label="Playing Solo"
              checked={playingSolo}
              onChange={(e) => {
                setPlayingSolo(e.currentTarget.checked);
                if (e.currentTarget.checked) {
                  setPlayer2('');
                }
              }}
              disabled={isBusy || (!locationVerified && !isSuperAdmin)}
            />

            {!playingSolo && (
              <TextInput
                label="Player 2 Side"
                placeholder="Enter Player 2 name"
                value={player2}
                onChange={(e) => {
                  const val = e.target.value;
                  setPlayer2(val.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 8));
                }}
                error={errors.player2}
                maxLength={8}
                disabled={isBusy || (!locationVerified && !isSuperAdmin)}
              />
            )}
          </Stack>

          <Group justify="flex-end">
            <Button
              type="submit"
              leftSection={editingId ? <IconEdit size={16} /> : <IconPlus size={16} />}
              variant="filled"
              disabled={isBusy || (!locationVerified && !isSuperAdmin)}
            >
              {editingId ? 'Update Entry' : 'Add to Queue'}
            </Button>
          </Group>
        </Stack>
      </form>

      <Modal
        opened={showSimilarityModal}
        onClose={() => setShowSimilarityModal(false)}
        title="Similar Entry Detected"
        centered
      >
        <Stack>
          <Text size="sm" style={{ marginTop: '1rem' }} >
            One of the names in this entry seems to be similar with another entry on the queue. Are you sure you want to proceed?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setShowSimilarityModal(false)}>Cancel</Button>
            <Button color="orange" onClick={executeSubmit}>Proceed</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

export default QueueForm;