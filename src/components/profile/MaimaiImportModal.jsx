import { useState } from 'react';
import { Modal, Stack, Text, Textarea, Divider, Alert, Group, Button } from '@mantine/core';
import { IconCheck, IconAlertCircle, IconUpload } from '@tabler/icons-react';
import { BookmarkletInstructions } from '../BookmarkletInstructions';
import { userService } from '../../services/supabase';
import { fetchSongConstants, calculateBest50 } from '../../utils/maimai-calc';

const MaimaiImportModal = ({ opened, onClose, userId, onSuccess }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const handleImport = async () => {
    setIsCalculating(true);
    setValidationResult(null);

    try {
      let data;
      try {
        data = JSON.parse(jsonInput);
      } catch {
        throw new Error("Invalid JSON format. Please paste the exact output from the bookmarklet.");
      }

      if (!data.scores || !Array.isArray(data.scores)) {
        throw new Error("Invalid data structure. Missing 'scores' array.");
      }

      if (data.scores.length === 0) {
        throw new Error("No scores found in the imported data. Please ensure you have played some songs.");
      }

      const songs = await fetchSongConstants();
      const result = await calculateBest50(data.scores, songs);

      if (!result || (result.new.songs.length === 0 && result.old.songs.length === 0)) {
        throw new Error("No valid scores could be calculated. Please check your score data.");
      }

      await userService.updateMaimaiBestScores(userId, result);

      const importName = data.profile?.name || data.name || data.user_data?.name;
      const importIconUrl = data.profile?.iconUrl || data.iconUrl;

      const updates = {};
      if (importName && typeof importName === 'string') updates.maimaiDxName = importName;
      if (importIconUrl && typeof importIconUrl === 'string') updates.displayPhotoUrl = importIconUrl;

      if (Object.keys(updates).length > 0) {
        try {
          await userService.updateMaimaiProfile(userId, updates);
        } catch (err) {
          console.error("Failed to save profile data to database:", err);
        }
      }

      setValidationResult({
        success: true,
        message: `Import Successful! Calculated Rating: ${result.totalRating}`
      });

      if (onSuccess) onSuccess(result);

      setTimeout(() => {
        onClose();
        setJsonInput('');
        setValidationResult(null);
      }, 1500);

    } catch (e) {
      setValidationResult({
        success: false,
        message: e.message
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Import Scores"
      size="lg"
    >
      <Stack>
        <Text size="sm" mt="md">
          Paste the JSON output from the bookmarklet below.
          This will update your profile and recalculate your rating.
        </Text>

        <BookmarkletInstructions />

        <Divider label="Paste Data" labelPosition="center" />

        <Textarea
          placeholder='{"scores": [...]}'
          minRows={6}
          maxRows={10}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.currentTarget.value)}
        />

        {validationResult && (
          <Alert
            icon={validationResult.success ? <IconCheck /> : <IconAlertCircle />}
            color={validationResult.success ? 'green' : 'red'}
            title={validationResult.success ? 'Success' : 'Error'}
          >
            {validationResult.message}
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleImport}
            loading={isCalculating}
            disabled={!jsonInput.trim()}
          >
            Calculate & Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default MaimaiImportModal;
