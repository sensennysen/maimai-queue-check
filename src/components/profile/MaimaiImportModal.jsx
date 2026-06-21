import { useState, useRef, useCallback, useEffect } from 'react';
import { Modal, Stack, Text, Alert, Group, Button, CopyButton, Code, Loader, Box, LoadingOverlay } from '@mantine/core';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import IconDownload from '@tabler/icons-react/dist/esm/icons/IconDownload.mjs';
import IconCopy from '@tabler/icons-react/dist/esm/icons/IconCopy.mjs';
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
        setValidationResult({ success: false, message: 'Session expired. Request a new code.' });
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
      aria-label="Import Scores"
      size="lg"
      radius={24}
      padding={0}
      withCloseButton={false}
      centered
      styles={{
        content: {
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 60px)'
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
      <LoadingOverlay visible={step === 'processing'} zIndex={100} overlayProps={{ radius: 'md', blur: 2 }} />

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
            <IconDownload size={18} color="#fff" strokeWidth={2.2} />
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
              Import Scores
            </Text>
            <Text size="xs" style={{ color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              Sync from maimai DX NET
            </Text>
          </Box>
        </Group>

        <Box
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            cursor: 'pointer',
            padding: '4px 12px',
            borderRadius: 20,
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease',
          }}
          aria-label="Close"
          className="header-close-pill"
        >
          Close
        </Box>
      </Box>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="lg" p="lg">
          <Box
            style={{
              borderRadius: 18,
              padding: '20px',
              background: 'var(--theme-surface)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <BookmarkletInstructions />
          </Box>

          <Box
            style={{
              borderRadius: 18,
              padding: '20px',
              background: 'var(--theme-surface)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid var(--theme-border)',
              position: 'relative'
            }}
          >
            <Text size="sm" fw={800} mb="xs" style={{ letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--theme-primary)' }}>
              Session Code
            </Text>

            {step === 'loading' ? (
              <Group p="md">
                <Loader size="sm" color="var(--theme-primary)" />
                <Text size="sm" fw={500}>Generating session code…</Text>
              </Group>
            ) : (step === 'idle' || step === 'waiting') && sessionToken ? (
              <Stack gap="md">
                <Box
                  style={{
                    background: 'var(--theme-bg-soft)',
                    padding: '16px',
                    borderRadius: 12,
                    border: '1px dashed var(--theme-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Code 
                    style={{ 
                      fontSize: '1.25rem', 
                      letterSpacing: 4, 
                      fontWeight: 800, 
                      background: 'transparent',
                      color: 'var(--theme-text)'
                    }}
                  >
                    {sessionToken}
                  </Code>
                  <CopyButton value={sessionToken} timeout={2000}>
                    {({ copied, copy }) => (
                      <Button 
                        size="xs" 
                        variant="filled" 
                        color={copied ? "green" : "var(--theme-primary)"} 
                        onClick={copy}
                        leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        radius="md"
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    )}
                  </CopyButton>
                </Box>
                
                <Text size="xs" c="dimmed" lh={1.5}>
                  1. Go to <strong>maimai DX NET</strong> (Play Data)<br />
                  2. Run your bookmarklet<br />
                  3. Paste the code above and tap <strong>"Fetch & Send"</strong>
                </Text>

                {step === 'waiting' && (
                  <Group justify="center" p="sm" bg="var(--theme-bg-soft)" style={{ borderRadius: 12 }}>
                    <Loader size="xs" color="var(--theme-primary)" />
                    <Text size="xs" fw={700} style={{ color: 'var(--theme-primary)' }}>Waiting for bookmarklet data…</Text>
                  </Group>
                )}
              </Stack>
            ) : step === 'idle' && !sessionToken && (
              <Button 
                onClick={startImport} 
                fullWidth 
                radius="xl"
                variant="light"
                style={{ height: 48, fontWeight: 700 }}
              >
                Get Session Code
              </Button>
            )}
          </Box>

          {validationResult && (
            <Alert
              icon={validationResult.success ? <IconCheck size={18} /> : <IconAlertCircle size={18} />}
              color={validationResult.success ? 'green' : 'red'}
              radius="lg"
              styles={{
                root: { border: '1px solid currentColor' },
                title: { fontWeight: 800, fontSize: '14px' }
              }}
              title={validationResult.success ? 'Success' : 'Error'}
            >
              <Text size="sm" fw={500}>{validationResult.message}</Text>
            </Alert>
          )}
        </Stack>
      </Box>

      {/* ── Footer ───────────────────────────────────────────────── */}
      {(step === 'done' || (step === 'idle' && !sessionToken)) && (
        <Box 
          p="lg" 
          style={{ 
            borderTop: '1px solid var(--theme-border)',
            background: 'var(--theme-surface)',
            flexShrink: 0
          }}
        >
          <Group justify="flex-end">
            <Button 
              variant="default" 
              onClick={handleClose}
              radius="xl"
              style={{ fontWeight: 600 }}
            >
              {step === 'done' ? 'Close' : 'Cancel'}
            </Button>
          </Group>
        </Box>
      )}
    </Modal>
  );
};

export default MaimaiImportModal;
