import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Paper, Group, Stack, Avatar, Text, Textarea, Button, Alert, Loader, Card, SimpleGrid, Badge, ThemeIcon, Divider, Modal, LoadingOverlay, ActionIcon, Box } from '@mantine/core';
import { IconUser, IconUpload, IconAlertCircle, IconCheck, IconCalculator, IconUserCircle, IconArrowLeft, IconSun, IconMoon } from '@tabler/icons-react';
import { ScoreCard } from '../components/maimai/ScoreCard';
import { BookmarkletInstructions } from '../components/BookmarkletInstructions';
import { useAuth } from '../hooks/useAuth';
import { useFeatureFlags } from '../contexts/FeatureFlagContext';
import { useTheme } from '../contexts/ThemeContext';
import { userService } from '../services/supabase';
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

  // Fetch Maimai Data Helper
  const fetchMaimaiData = async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      // Import rolesService
      const { rolesService } = await import('../services/supabase');
      const data = await rolesService.getUserRoles(user.id);

      setProfileData(data);
    } catch (e) {
      console.error("Error fetching maimai data:", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fetch on mount or when user ID changes
  useEffect(() => {
    if (user?.id) {
      fetchMaimaiData();
    }
  }, [user?.id]);

  // Handlers
  const handleImport = async () => {
    setIsCalculating(true);
    setValidationResult(null);

    try {
      // 1. Validate JSON
      let data;
      try {
        data = JSON.parse(jsonInput);
      } catch (e) {
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
      if (importName && typeof importName === 'string') {
        try {
          await userService.updateMaimaiProfile(user.id, { maimaiDxName: importName });
        } catch (err) {
          console.error("Failed to save name to database:", err);
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
  console.log('profileData:', profileData);

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
            <Avatar src={user.user_metadata.avatar_url} size={80} radius={80} color="blue">
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
            </Stack>

            <Button
              leftSection={<IconUpload size={18} />}
              variant="light"
              ml="auto"
              onClick={() => setIsImportModalOpen(true)}
            >
              Import Scores
            </Button>
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
                  <Group mb="md">
                    <Title order={3}>Best 15 (New)</Title>
                    <Badge size="lg" variant="dot">
                      {bestScores.new.totalRating}
                    </Badge>
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
                  <Group mb="md">
                    <Title order={3}>Best 35 (Old)</Title>
                    <Badge size="lg" variant="dot" color="gray">
                      {bestScores.old.totalRating}
                    </Badge>
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
