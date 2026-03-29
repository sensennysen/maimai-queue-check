import { useState, useRef, useCallback, useEffect } from 'react';
import { Modal, Stack, Text, Divider, Alert, Group, Button, CopyButton, Code, Loader } from '@mantine/core';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { BookmarkletInstructions } from '../BookmarkletInstructions';
import { userService, mostPlayedService, createImportSession, getImportSession, deleteImportSession } from '../../services/supabase';
import { fetchSongConstants, calculateBest50 } from '../../utils/maimai-calc';
import { usePageVisibility } from '../../hooks/usePageVisibility';

const POLL_INTERVAL_MS = 2500;

const MaimaiImportModal = ({ opened, onClose, userId, onSuccess }) => {
  const [step, setStep] = useState('idle');
  const [sessionToken, setSessionToken] = useState(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const pollRef = useRef(null);
  const isVisible = usePageVisibility();

  const processPayload = useCallback(async (data) => {
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

    result.current_version_play_count = data.profile?.current_version_play_count || "0";
    result.total_play_count = data.profile?.total_play_count || "0";

    const enrichedMostPlayed = (data.most_played || [])
      .map(item => {
        const matchingSong = songs.find(s => s.title === item.title);
        return {
          ...item,
          imageName: matchingSong?.imageName || null,
          imageUrl: matchingSong?.imageUrl || null
        };
      })
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, 20);

    result.most_played = enrichedMostPlayed;

    if (enrichedMostPlayed.length > 0) {
      await mostPlayedService.upsertMostPlayed(userId, enrichedMostPlayed);
    }

    if (data.recent_plays && Array.isArray(data.recent_plays)) {
      try {
        await userService.saveRecentPlays(userId, data.recent_plays);
      } catch (err) {
        console.error("Failed to save recent plays:", err);
      }
    }

    const dbScores = { ...result };
    delete dbScores.most_played;

    await userService.updateMaimaiBestScores(userId, dbScores);
    await userService.saveUserAllScores(userId, data);

    const import_name = data.profile?.name || data.name || data.user_data?.name;
    const import_icon_url = data.profile?.icon_url || data.icon_url;
    const circle_name = data.circle?.circle_name;

    const updates = {};
    if (import_name && typeof import_name === 'string') updates.maimai_dx_name = import_name;
    if (import_icon_url && typeof import_icon_url === 'string') updates.dx_display_photo_url = import_icon_url;
    if (circle_name && typeof circle_name === 'string') updates.circle_name = circle_name;

    if (Object.keys(updates).length > 0) {
      try {
        await userService.updateMaimaiProfile(userId, updates);
      } catch (err) {
        console.error("Failed to save profile data to database:", err);
      }
    }

    return result;
  }, [userId]);

  const startImport = useCallback(async () => {
    setValidationResult(null);
    try {
      const { token, expiresAt } = await createImportSession(userId);
      setSessionToken(token);
      setSessionExpiresAt(expiresAt);
      setStep('waiting');
    } catch (e) {
      setValidationResult({ success: false, message: e.message || 'Failed to create session' });
    }
  }, [userId]);

  // Create session as soon as modal opens so the code is visible immediately
  useEffect(() => {
    if (!opened || !userId) return;
    let cancelled = false;
    // Reset state immediately so UI doesn't flash stale content while loading
     
    setValidationResult(null);
    setStep('loading');
    (async () => {
      try {
        const { token, expiresAt } = await createImportSession(userId);
        if (!cancelled) {
          setSessionToken(token);
          setSessionExpiresAt(expiresAt);
          setStep('waiting');
        }
      } catch (e) {
        if (!cancelled) {
          setValidationResult({ success: false, message: e.message || 'Failed to create session' });
          setStep('idle');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [opened, userId]);

  useEffect(() => {
    if (step !== 'waiting' || !sessionToken) return;

    const check = async () => {
      if (sessionExpiresAt && new Date(sessionExpiresAt) < new Date()) {
        if (pollRef.current) clearInterval(pollRef.current);
        deleteImportSession(sessionToken).catch(() => { });
        setValidationResult({ success: false, message: 'Session expired. Click Get new code to try again.' });
        setStep('idle');
        setSessionToken(null);
        setSessionExpiresAt(null);
        return;
      }
      const row = await getImportSession(sessionToken);
      if (row?.status === 'complete' && row?.payload) {
        if (pollRef.current) clearInterval(pollRef.current);
        setStep('processing');
        try {
          const result = await processPayload(row.payload);
          deleteImportSession(sessionToken).catch(() => { });
          setValidationResult({
            success: true,
            message: `Import successful! Calculated Rating: ${result.total_rating}`
          });
          if (onSuccess) onSuccess(result);
          setStep('done');
          setTimeout(() => {
            onClose();
            setStep('idle');
            setSessionToken(null);
            setSessionExpiresAt(null);
            setValidationResult(null);
          }, 2000);
        } catch (e) {
          setValidationResult({ success: false, message: e.message });
          setStep('idle');
          setSessionToken(null);
          setSessionExpiresAt(null);
        }
      }
    };

    if (!isVisible) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    check();
    pollRef.current = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, sessionToken, sessionExpiresAt, processPayload, onSuccess, onClose, isVisible]);

  const handleClose = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStep('idle');
    setSessionToken(null);
    setSessionExpiresAt(null);
    setValidationResult(null);
    onClose();
  }, [onClose]);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Import Scores"
      size="lg"
    >
      <Stack>
        <BookmarkletInstructions />

        <Divider label="Session" labelPosition="center" />

        {step === 'loading' && (
          <Group>
            <Loader size="sm" />
            <Text size="sm">Getting code…</Text>
          </Group>
        )}

        {(step === 'idle' || step === 'waiting') && sessionToken && (
          <Stack gap="sm">
            <Text size="sm" fw={600}>Copy this code:</Text>
            <Group gap="xs" wrap="nowrap">
              <Code block style={{ fontSize: '1.25rem', letterSpacing: 2 }}>{sessionToken}</Code>
              <CopyButton value={sessionToken} timeout={2000}>
                {({ copied, copy }) => (
                  <Button size="sm" variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
                )}
              </CopyButton>
            </Group>
            <Text size="sm" c="dimmed">
              On maimai DX NET (Play Data), run your bookmarklet, paste the code in the overlay, and tap &quot;Fetch &amp; Send to App&quot;. This page will update when the data is received.
            </Text>
            {step === 'waiting' && (
              <Group mt="md">
                <Loader size="sm" />
                <Text size="sm">Waiting for bookmarklet…</Text>
              </Group>
            )}
          </Stack>
        )}

        {step === 'idle' && !sessionToken && (
          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>Cancel</Button>
            <Button onClick={startImport}>Get new code</Button>
          </Group>
        )}

        {step === 'processing' && (
          <Group>
            <Loader size="sm" />
            <Text size="sm">Importing scores…</Text>
          </Group>
        )}

        {validationResult && (
          <Alert
            icon={validationResult.success ? <IconCheck /> : <IconAlertCircle />}
            color={validationResult.success ? 'green' : 'red'}
            title={validationResult.success ? 'Success' : 'Error'}
          >
            {validationResult.message}
          </Alert>
        )}

        {step === 'done' && (
          <Group justify="flex-end">
            <Button onClick={handleClose}>Close</Button>
          </Group>
        )}
      </Stack>
    </Modal>
  );
};

export default MaimaiImportModal;
