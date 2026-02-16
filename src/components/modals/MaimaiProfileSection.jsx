import React, { useState } from 'react';
import { TextInput, Text, Button, Group, Stack, Title, Paper } from '@mantine/core';

/**
 * MaimaiProfileSection
 * 
 * Renders the Maimai DX specific profile settings.
 * Allows users to update their maimai DX username.
 * Displays calculated rating and best scores summary if available.
 * 
 * @param {Object} props
 * @param {string} props.maimaiDxName - Current maimai DX username
 * @param {number} props.maimaiRating - Current calculated rating
 * @param {Function} props.onSave - Callback when saving (name) => Promise
 * @param {boolean} props.loading - Loading state
 */
const MaimaiProfileSection = ({
  maimaiDxName,
  maimaiRating,
  onSave,
  loading
}) => {
  const [name, setName] = useState(maimaiDxName || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (name.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }
    setError('');
    onSave(name);
  };

  return (
    <Paper p="md" withBorder mt="md">
      <Stack spacing="md">
        <Title order={4}>Maimai DX Profile</Title>

        <TextInput
          label="Maimai DX Name"
          placeholder="Enter your Maimai DX username"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          error={error}
          maxLength={50}
          disabled={loading}
          description="This name will be displayed on your profile card."
        />

        {maimaiRating !== null && maimaiRating !== undefined && (
          <Group>
            <Text weight={500}>Rating:</Text>
            <Text>{maimaiRating}</Text>
          </Group>
        )}

        <Group position="right" mt="xs">
          <Button
            onClick={handleSave}
            loading={loading}
            disabled={name === maimaiDxName && !error} // Disable if no changes
          >
            Save Maimai Profile
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
};

export default MaimaiProfileSection;
