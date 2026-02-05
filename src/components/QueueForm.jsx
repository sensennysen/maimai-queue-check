import { useState } from 'react';
import { TextInput, Group, Button, Stack, Alert } from '@mantine/core';
import { IconPlus, IconEdit } from '@tabler/icons-react';
import DOMPurify from 'dompurify';
import './QueueForm.css';

function QueueForm({ onSubmit, editingId, editingData, isBusy = false, locationVerified = false, locationError = null, isSuperAdmin = false }) {
  const initialPlayer1 = editingId && editingData && editingData.player1 ? String(editingData.player1).trim() : '';
  const initialPlayer2 = editingId && editingData && editingData.player2 ? String(editingData.player2).trim() : '';

  const [player1, setPlayer1] = useState(initialPlayer1);
  const [player2, setPlayer2] = useState(initialPlayer2);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBusy) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Sanitize input using DOMPurify to prevent XSS
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
    }
    setErrors({});
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
                setPlayer1(val.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 50));
              }}
              error={errors.player1}
              maxLength={50}
              disabled={isBusy || (!locationVerified && !isSuperAdmin)}
              style={{ marginTop: '1rem' }}
            />

            <TextInput
              label="Player 2 Side"
              placeholder="Enter Player 2 name"
              value={player2}
              onChange={(e) => {
                const val = e.target.value;
                setPlayer2(val.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 50));
              }}
              error={errors.player2}
              maxLength={50}
              disabled={isBusy || (!locationVerified && !isSuperAdmin)}
            />
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
    </div>
  );
}

export default QueueForm;