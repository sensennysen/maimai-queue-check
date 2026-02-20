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
      const result = await calculateBest50(data.scores, songs, data.best_fifty);

      if (!result || (result.best_new.songs.length === 0 && result.best_old.songs.length === 0)) {
        throw new Error("No valid scores could be calculated. Please check your score data.");
      }

      // Include play counts and most played in the result object for display persistence
      result.current_version_play_count = data.profile?.current_version_play_count || "0";
      result.total_play_count = data.profile?.total_play_count || "0";

      // Enrich most_played with image names from song database
      const enrichedMostPlayed = (data.most_played || []).map(item => {
        const matchingSong = songs.find(s => s.title === item.title);
        return {
          ...item,
          imageName: matchingSong?.imageName || null
        };
      });
      result.most_played = enrichedMostPlayed;

      await userService.updateMaimaiBestScores(userId, result);
      await userService.saveUserAllScores(userId, data);

      const import_name = data.profile?.name || data.name || data.user_data?.name;
      const import_icon_url = data.profile?.icon_url || data.icon_url;

      const updates = {};
      if (import_name && typeof import_name === 'string') updates.maimai_dx_name = import_name;
      if (import_icon_url && typeof import_icon_url === 'string') updates.display_photo_url = import_icon_url;

      if (Object.keys(updates).length > 0) {
        try {
          await userService.updateMaimaiProfile(userId, updates);
        } catch (err) {
          console.error("Failed to save profile data to database:", err);
        }
      }

      setValidationResult({
        success: true,
        message: `Import Successful! Calculated Rating: ${result.total_rating}`
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
