import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Paper, Group, Stack, Avatar, Text, Textarea, Button, Alert, Loader, Card, SimpleGrid, Badge, ThemeIcon, Divider, Modal, LoadingOverlay, ActionIcon, Box } from '@mantine/core';
import IconUser from '@tabler/icons-react/dist/esm/icons/IconUser.mjs';
import IconUpload from '@tabler/icons-react/dist/esm/icons/IconUpload.mjs';
import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconCalculator from '@tabler/icons-react/dist/esm/icons/IconCalculator.mjs';
import IconUserCircle from '@tabler/icons-react/dist/esm/icons/IconUserCircle.mjs';
import IconArrowLeft from '@tabler/icons-react/dist/esm/icons/IconArrowLeft.mjs';
import IconSun from '@tabler/icons-react/dist/esm/icons/IconSun.mjs';
import IconMoon from '@tabler/icons-react/dist/esm/icons/IconMoon.mjs';
import IconCamera from '@tabler/icons-react/dist/esm/icons/IconCamera.mjs';
import IconMapPin from '@tabler/icons-react/dist/esm/icons/IconMapPin.mjs';
import IconStar from '@tabler/icons-react/dist/esm/icons/IconStar.mjs';
import { ScoreCard } from '../components/maimai/ScoreCard';
import { BookmarkletInstructions } from '../components/BookmarkletInstructions';
import { useAuth } from '../hooks/useAuth';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { useTheme } from '../contexts/ThemeContext';
import { userService, branchService } from '../services/supabase';
import { fetchSongConstants, calculateBest50 } from '../utils/maimai-calc';

const ProfilePage = () => {
  const { user, userRoles } = useAuth(); // Still need userRoles for display_name if profile fetch fails or for fallback
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { flags, isLoading: flagsLoading } = useFeatureFlags();

  useEffect(() => {
    if (!flagsLoading && !flags['profile_tab']) {
      navigate('/');
    }
  }, [flags, flagsLoading, navigate]);

  // State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Local Data State (Bypassing AuthContext cache for freshness)
  const [profileData, setProfileData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [branches, setBranches] = useState([]);

  // Fetch Maimai Data Helper
  // Fetch Maimai Data Helper
  const userId = user?.id;

  const fetchMaimaiData = useCallback(async () => {
    if (!userId) return;
    setIsLoadingData(true);
    try {
      // Import rolesService
      const { rolesService } = await import('../services/supabase');
      const data = await rolesService.getUserRoles(userId);

      setProfileData(data);
    } catch (_e) {
      console.error("Error fetching maimai data:", _e);
    } finally {
      setIsLoadingData(false);
    }
  }, [userId]);

  // Fetch on mount or when user ID changes
  useEffect(() => {
    if (userId) {
      fetchMaimaiData();
    }
  }, [userId, fetchMaimaiData]);

  // Fetch branches for name resolution
  useEffect(() => {
    branchService.getBranchesForResolution().then(setBranches).catch(console.error);
  }, []);

  // Handlers
  const handleImport = async () => {
    setIsCalculating(true);
    setValidationResult(null);

    try {
      // 1. Validate JSON
      let data;
      try {
        data = JSON.parse(jsonInput);
      } catch {
        throw new Error("Invalid JSON format. Please paste the exact output from the bookmarklet.");
      }

      // 2. Validate Structure
      if (!data.scores || !Array.isArray(data.scores)) {
        throw new Error("Invalid data structure. Missing 'scores' array.");
      }

      // 2b. Validate non-empty scores
      if (data.scores.length === 0) {
        throw new Error("No scores found in the imported data. Please ensure you have played some songs.");
      }

      // 3. Fetch Constants (Local)
      const songs = await fetchSongConstants();

      // 4. Calculate
      const result = await calculateBest50(data.scores, songs);

      // 4b. Validate calculation result
      if (!result || (result.new.songs.length === 0 && result.old.songs.length === 0)) {
        throw new Error("No valid scores could be calculated. Please check your score data.");
      }

      // 5. Save to Supabase (Best Scores)
      await userService.updateMaimaiBestScores(user.id, result);

      // 5b. Save Name if present in JSON (common export format)
      const importName = data.profile?.name || data.name || data.user_data?.name;
      const importIconUrl = data.profile?.iconUrl || data.iconUrl;

      const updates = {};
      if (importName && typeof importName === 'string') updates.maimaiDxName = importName;
      if (importIconUrl && typeof importIconUrl === 'string') updates.displayPhotoUrl = importIconUrl;

      if (Object.keys(updates).length > 0) {
        try {
          await userService.updateMaimaiProfile(user.id, updates);
        } catch (err) {
          console.error("Failed to save profile data to database:", err);
        }
      }

      setValidationResult({
        success: true,
        message: `Import Successful! Calculated Rating: ${result.totalRating} (New: ${result.new.songs.length}, Old: ${result.old.songs.length})`
      });

      // Close modal and refetch data
      setTimeout(() => {
        setIsImportModalOpen(false);
        // Reset input and result
        setJsonInput('');
        setValidationResult(null);
        // Refetch
        fetchMaimaiData();
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

  if (!user) {
    return (
      <Container size="lg" py="xl">
        <Loader />
      </Container>
    );
  }

  // Use profileData for scores, fallback to null
  const bestScores = profileData?.maimai_best_scores;
  const hasScores = bestScores && (bestScores.new?.songs?.length > 0 || bestScores.old?.songs?.length > 0);

  // Names
  const appDisplayName = userRoles?.display_name || user.user_metadata.full_name || 'Guest User';
  const maimaiName = profileData?.maimai_dx_name;

  // Branch resolution
  const mainBranchName = profileData?.main_branch != null
    ? (branches.find(b => b.id === profileData.main_branch)?.short_name || branches.find(b => b.id === profileData.main_branch)?.arcade_name || null)
    : null;

  const preferredBranchNames = Array.isArray(profileData?.preferred_branches)
    ? profileData.preferred_branches
      .map(id => {
        const parsed = typeof id === 'string' ? parseInt(id, 10) : id;
        const branch = branches.find(b => b.id === parsed);
        return branch ? (branch.short_name || branch.arcade_name) : null;
      })
      .filter(Boolean)
    : [];

  return (
    <Container size="lg" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <Group>
          <ActionIcon variant="subtle" size="lg" onClick={() => navigate('/')}>
            <IconArrowLeft size={24} />
          </ActionIcon>
          <Title order={2}>mpqCheckPH profile</Title>
        </Group>
        <ActionIcon variant="outline" size="lg" onClick={() => toggleTheme()}>
          {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
        </ActionIcon>
      </Group>

      <Paper shadow="sm" p="lg" radius="md" withBorder>
        <Stack>
          <Group>
            <Avatar src={profileData?.display_photo_url} size={80} radius={80} color="blue" className="profile-avatar-large">
              <IconUser size={40} />
            </Avatar>
            <Stack gap={4}>
              <Text size="xl" fw={700}>{appDisplayName}</Text>
              {maimaiName && (
                <Text size="sm" c="dimmed" fw={500}>
                  maimai DX Name: {maimaiName}
                </Text>
              )}
              {bestScores ? (
                <Text c="dimmed">Rating: {bestScores.totalRating}</Text>
              ) : (
                <Text c="dimmed">No rating data</Text>
              )}
              {mainBranchName && (
                <Group gap={4} align="center">
                  <IconMapPin size={14} style={{ color: 'var(--mantine-color-blue-6)' }} />
                  <Text size="sm" fw={500}>Main Branch: {mainBranchName}</Text>
                </Group>
              )}
              {preferredBranchNames.length > 0 && (
                <Group gap={6} align="center" wrap="wrap">
                  <IconStar size={14} style={{ color: 'var(--mantine-color-yellow-6)' }} />
                  <Text size="sm" c="dimmed">Preferred:</Text>
                  {preferredBranchNames.map(name => (
                    <Badge key={name} size="sm" variant="light" color="teal">{name}</Badge>
                  ))}
                </Group>
              )}
            </Stack>

            <Group gap="sm" ml="auto">
              <Button
                leftSection={<IconCamera size={18} />}
                variant="light"
                color="teal"
                onClick={() => window.open('/profile/export', '_blank')}
                disabled={!hasScores}
              >
                Export Image
              </Button>
              <Button
                leftSection={<IconUpload size={18} />}
                variant="light"
                onClick={() => setIsImportModalOpen(true)}
              >
                Import Scores
              </Button>
            </Group>
          </Group>

          <Divider my="sm" />

          {/* Overview / Best 50 */}
          <Box pos="relative" mih={200}>
            <LoadingOverlay visible={isLoadingData || isCalculating} overlayProps={{ radius: "sm", blur: 2 }} />

            {!hasScores && !isLoadingData ? (
              <Alert icon={<IconAlertCircle size={16} />} title="No Data" color="blue">
                No score data found. Please import your scores using the button above.
              </Alert>
            ) : hasScores ? (
              <Stack gap="xl">
                {/* Best 15 New */}
                <div>
                  <Group mb="md" justify="space-between">
                    <Title order={3}>Best 15 (New)</Title>
                    <Group gap="md">
                      <Text size="sm" c="dimmed" fw={500}>
                        Avg: {bestScores.new.songs.length > 0 ? Math.round(bestScores.new.totalRating / bestScores.new.songs.length) : 0}
                      </Text>
                      <Text size="sm" fw={700}>
                        Total: {bestScores.new.totalRating ?? 0}
                      </Text>
                    </Group>
                  </Group>
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                    {bestScores.new.songs.map((score, index) => (
                      <ScoreCard key={`${score.title}-${score.type}-${score.difficulty}-${index}`} score={score} />
                    ))}
                  </SimpleGrid>
                </div>

                <Divider />

                {/* Best 35 Old */}
                <div>
                  <Group mb="md" justify="space-between">
                    <Title order={3}>Best 35 (Old)</Title>
                    <Group gap="md">
                      <Text size="sm" c="dimmed" fw={500}>
                        Avg: {bestScores.old.songs.length > 0 ? Math.round(bestScores.old.totalRating / bestScores.old.songs.length) : 0}
                      </Text>
                      <Text size="sm" fw={700}>
                        Total: {bestScores.old.totalRating ?? 0}
                      </Text>
                    </Group>
                  </Group>
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                    {bestScores.old.songs.map((score, index) => (
                      <ScoreCard key={`${score.title}-${score.type}-${score.difficulty}-${index}`} score={score} />
                    ))}
                  </SimpleGrid>
                </div>
              </Stack>
            ) : null}
          </Box>
        </Stack>
      </Paper>

      {/* Import Modal */}
      <Modal
        opened={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Scores"
        size="lg"
      >
        <Stack>
          <Text size="sm" style={{ marginTop: '1rem' }}>
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

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
            <Button
              leftSection={<IconCalculator size={18} />}
              onClick={handleImport}
              loading={isCalculating}
              disabled={!jsonInput.trim()}
            >
              Calculate & Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default ProfilePage;
