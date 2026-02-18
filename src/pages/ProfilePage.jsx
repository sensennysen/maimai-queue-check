import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Paper, Group, Stack, Avatar, Text, Textarea, Button, Alert, Loader, Card, SimpleGrid, Badge, ThemeIcon, Divider, Modal, LoadingOverlay, ActionIcon, TextInput, SegmentedControl, MultiSelect, Input, Box, Switch, Tooltip, CopyButton, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import IconUser from '@tabler/icons-react/dist/esm/icons/IconUser.mjs';
import IconUpload from '@tabler/icons-react/dist/esm/icons/IconUpload.mjs';
import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconTrophy from '@tabler/icons-react/dist/esm/icons/IconTrophy.mjs';
import IconUserCircle from '@tabler/icons-react/dist/esm/icons/IconUserCircle.mjs';
import IconArrowLeft from '@tabler/icons-react/dist/esm/icons/IconArrowLeft.mjs';
import IconSun from '@tabler/icons-react/dist/esm/icons/IconSun.mjs';
import IconMoon from '@tabler/icons-react/dist/esm/icons/IconMoon.mjs';
import IconCamera from '@tabler/icons-react/dist/esm/icons/IconCamera.mjs';
import { IconMapPin, IconStar, IconSettings, IconShare, IconCopy, IconExternalLink, IconLock, IconEye, IconLink, IconClock } from '@tabler/icons-react';

import { ScoreCard } from '../components/maimai/ScoreCard';
import { BookmarkletInstructions } from '../components/BookmarkletInstructions';
import { useAuth } from '../hooks/useAuth';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { useTheme } from '../contexts/ThemeContext';
import { userService, branchService } from '../services/supabase';
import { useBranch as useBranchContext } from '../contexts/BranchContext';
import { fetchSongConstants, calculateBest50 } from '../utils/maimai-calc';
import { FavoriteSongsSection } from '../components/profile/FavoriteSongsSection';
import { PlaylistSection } from '../components/profile/PlaylistSection';

import Footer from '../components/layout/Footer';

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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Local Data State (Bypassing AuthContext cache for freshness)
  const { branches: allBranches, loading: branchesLoading } = useBranchContext();
  const [profileData, setProfileData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [branches, setBranches] = useState([]); // legacy branch list for resolution

  // Preferences state
  const [displayName, setDisplayName] = useState('');
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedMainBranch, setSelectedMainBranch] = useState(null);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Profile sharing & Privacy state
  const [slug, setSlug] = useState('');
  const [privacySettings, setPrivacySettings] = useState({
    show_dx_rating: true,
    show_best_50: true,
    show_favorite_songs: true,
    show_playlists: true,
    show_main_branch: true,
    show_preferred_branches: true
  });
  const [isSavingSlug, setIsSavingSlug] = useState(false);

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
      if (data) {
        setDisplayName(data.display_name || '');
        setSelectedBranches(data.preferred_branches?.map(String) || []);
        setSelectedMainBranch(data.main_branch ? String(data.main_branch) : null);
        setSlug(data.slug || '');
        if (data.privacy_settings) {
          setPrivacySettings(data.privacy_settings);
        }
      }
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

  // Fetch branches for name resolution (Legacy - could be consolidated)
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

  const handleSavePreferences = async () => {
    if (!displayName.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Display name cannot be empty',
        color: 'red',
      });
      return;
    }

    try {
      setIsSavingPrefs(true);

      // 2. Update DB
      await userService.updatePreferences(user.id, {
        displayName: displayName.trim(),
        branchIds: selectedBranches.map(Number),
        mainBranch: selectedMainBranch ? parseInt(selectedMainBranch, 10) : null
      });

      notifications.show({
        title: 'Success',
        message: 'Preferences updated successfully',
        color: 'green',
      });

      setIsSettingsModalOpen(false);

      // Refetch for good measure (AuthContext usually handles this via subscription, but explicit is fine)
      fetchMaimaiData();
    } catch (e) {
      notifications.show({
        title: 'Error',
        message: e.message || 'Failed to update preferences',
        color: 'red',
      });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleUpdateSlug = async () => {
    if (!userId) return;
    setIsSavingSlug(true);
    try {
      await userService.updateProfileSlug(userId, slug);
      notifications.show({
        title: 'Success',
        message: 'Profile URL updated successfully',
        color: 'green',
        icon: <IconCheck size={18} />
      });
      fetchMaimaiData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update profile URL',
        color: 'red'
      });
    } finally {
      setIsSavingSlug(false);
    }
  };

  const handleUpdatePrivacy = async (key, value) => {
    if (!userId) return;
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings); // Optimistic update

    try {
      await userService.updatePrivacySettings(userId, newSettings);
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to update privacy settings',
        color: 'red'
      });
      // Revert if failed
      setPrivacySettings(privacySettings);
    }
  };

  const publicProfileUrl = slug ? `${window.location.origin}/p/${slug}` : null;

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
        return branch ? (branch.acronym || branch.short_name || branch.arcade_name) : null;
      })
      .filter(Boolean)
    : [];

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" mb="0" className="animate-fade-in">
          <Group>
            <ActionIcon variant="subtle" size="lg" onClick={() => navigate('/')}>
              <IconArrowLeft size={24} />
            </ActionIcon>
            <Title order={2} className="profile-page-title">mpqCheckPH profile</Title>
          </Group>
          <Group gap="xs">
            <ActionIcon variant="outline" size="lg" onClick={() => setIsSettingsModalOpen(true)} title="Settings">
              <IconSettings size={20} />
            </ActionIcon>
            <ActionIcon variant="outline" size="lg" onClick={() => toggleTheme()} title="Toggle Mode">
              {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
            </ActionIcon>
          </Group>
        </Group>

        <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-100">
          <Group className="profile-card-row" wrap="nowrap" justify="space-between">
            {/* Mobile: center avatar vertically; Desktop: align top */}
            <Group
              className="profile-card-row"
              wrap="nowrap"
              style={{ flex: 1 }}
            >
              <Avatar src={profileData?.display_photo_url} size={90} radius={90} color="primary" className="profile-avatar-large">
                <IconUser size={45} />
              </Avatar>
              <Stack gap={4}>
                <Group gap="xs" align="center">
                  <Text size="xl" fw={800} style={{ fontSize: '1.75rem', lineHeight: 1.2 }}>{appDisplayName}</Text>
                  {profileData?.slug && (
                    <Tooltip label="Your profile is public! Click to copy link." position="right" withArrow>
                      <CopyButton value={publicProfileUrl}>
                        {({ copied, copy }) => (
                          <ActionIcon
                            variant="subtle"
                            color={copied ? 'teal' : 'blue'}
                            onClick={copy}
                            size="sm"
                          >
                            {copied ? <IconCheck size={16} /> : <IconLink size={16} />}
                          </ActionIcon>
                        )}
                      </CopyButton>
                    </Tooltip>
                  )}
                </Group>
                {mainBranchName && (
                  <Group gap={4} align="center">
                    <IconMapPin size={14} style={{ color: 'var(--theme-primary)' }} />
                    <Text size="sm" fw={500}>Main Branch: {mainBranchName}</Text>
                  </Group>
                )}
                {preferredBranchNames.length > 0 && (
                  <Group gap={6} align="center" wrap="wrap">
                    <IconStar size={14} style={{ color: 'var(--theme-accent)' }} />
                    <Text size="sm">Preferred:</Text>
                    {preferredBranchNames.map(name => (
                      <Badge key={name} size="sm" variant="light" color="secondary">{name}</Badge>
                    ))}
                  </Group>
                )}
                {/* Mobile: DX Name + Rating inline with branch details */}
                <Stack gap={2} hiddenFrom="sm">
                  {maimaiName && (
                    <Group gap={4} align="center">
                      <Text size="sm" fw={600}>DX Name:</Text>
                      <Text size="sm">{maimaiName}</Text>
                    </Group>
                  )}
                  {bestScores && (
                    <Group gap={4} align="center">
                      <Text size="sm" fw={600}>Rating:</Text>
                      <Text size="sm" fw={700} c="primary">{bestScores.totalRating}</Text>
                    </Group>
                  )}
                </Stack>
              </Stack>
            </Group>

            <Stack gap={0} align="flex-end" visibleFrom="sm">
              {maimaiName && (
                <Group gap={4}>
                  <Text size="sm" c="secondary" fw={500}>maimai DX Name:</Text>
                  <Text size="sm" fw={600}>{maimaiName}</Text>
                </Group>
              )}
              {bestScores ? (
                <Stack gap={0} align="flex-end" mt={4}>
                  <Text size="xs" fw={700} c="secondary" tt="uppercase" lts={1}>Rating</Text>
                  <Text size="xl" fw={900} c="primary" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                    {bestScores.totalRating}
                  </Text>
                </Stack>
              ) : (
                <Text size="sm" c="secondary" italic>No rating data</Text>
              )}
            </Stack>
          </Group>
        </Paper>


        {/* Favorite Songs Section */}
        <div className="animate-fade-in delay-200">
          <FavoriteSongsSection userId={user.id} isOwnProfile={true} />
        </div>

        {/* Playlist Section */}
        <div className="animate-fade-in delay-150">
          <PlaylistSection userId={user.id} isOwnProfile={true} />
        </div>

        {/* Overview / Best 50 */}
        <Paper shadow="sm" p="lg" radius="md" withBorder pos="relative" style={{ minHeight: 200 }} className="animate-fade-in delay-300">
          <LoadingOverlay visible={isLoadingData || isCalculating} overlayProps={{ radius: "sm", blur: 2 }} />

          <Group justify="space-between" mb="xl" align="center" wrap="nowrap">
            <Group gap="xs" style={{ minWidth: 0, overflow: 'hidden' }}>
              <IconTrophy size={24} style={{ color: 'var(--mantine-color-blue-6)' }} />
              <Title order={2} style={{ fontSize: 'clamp(1.25rem, 4vw, 2rem)' }} truncate>My Best 50</Title>
            </Group>
            <Group gap="sm" wrap="nowrap" className="best50-actions">
              <Button
                leftSection={<IconCamera size={18} />}
                variant="light"
                color="secondary"
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

          {!hasScores && !isLoadingData ? (
            <Alert icon={<IconAlertCircle size={16} />} title="No Data" color="primary">
              No score data found. Please import your scores using the button above.
            </Alert>
          ) : hasScores ? (
            <Stack gap="xl">
              {/* Best 15 New */}
              <div>
                <Group mb="md" justify="space-between">
                  <Title order={3}>Best 15 (New)</Title>
                  <Group gap="md">
                    <Text size="sm" c="secondary" fw={500}>
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
                    <Text size="sm" c="secondary" fw={500}>
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
        </Paper>

        <div className="animate-fade-in delay-400">
          <Footer />
        </div>
      </Stack>

      {/* Import Modal */}
      <Modal
        opened={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
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
            <Button variant="default" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
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

      {/* Settings Modal */}
      <Modal
        opened={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title={<Group gap="xs"><IconSettings size={18} /><Text fw={600}>Profile Settings</Text></Group>}
        size="lg"
        centered
      >
        <Stack gap="md" pt="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" align="flex-start">
            <TextInput
              label="Display Name"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(event) => {
                const val = event.currentTarget.value;
                const filtered = val.replace(/[^a-zA-Z0-9 @#!\-_.,&'()]/g, '');
                setDisplayName(filtered);
              }}
              maxLength={10}
              description="Used in queues and profile"
            />

            <Select
              label="Home Branch"
              placeholder="Select your main branch"
              data={allBranches.map(b => ({
                value: String(b.id),
                label: b.short_name || b.arcade_name
              }))}
              value={selectedMainBranch}
              onChange={setSelectedMainBranch}
              searchable
              clearable
              description="Select your home turf"
              disabled={branchesLoading}
            />

          </SimpleGrid>

          <MultiSelect
            label="Preferred Branches"
            placeholder="Select one or more branches"
            data={allBranches.map(b => ({
              value: String(b.id),
              label: b.short_name || b.arcade_name
            }))}
            value={selectedBranches}
            onChange={setSelectedBranches}
            searchable
            clearable
            disabled={branchesLoading}
          />

          <Group gap="sm">
            <Switch
              label="Publicly show home branch"
              size="xs"
              checked={privacySettings.show_main_branch}
              onChange={(e) => handleUpdatePrivacy('show_main_branch', e.currentTarget.checked)}
            />
            <Switch
              label="Publicly show preferred branches"
              size="xs"
              checked={privacySettings.show_preferred_branches}
              onChange={(e) => handleUpdatePrivacy('show_preferred_branches', e.currentTarget.checked)}
            />
          </Group>

          <Divider label="Profile Sharing" labelPosition="center" />

          <Stack gap="xs">
            <Input.Wrapper
              label="Custom Profile URL"
              description={
                profileData?.slug_updated_at
                  ? `Last updated: ${new Date(profileData.slug_updated_at).toLocaleDateString()}. You can change this once every 60 days.`
                  : "Choose a unique URL for your public profile."
              }
            >
              <Group gap="xs" align="flex-start" mt={5}>
                <TextInput
                  placeholder="my-cool-profile"
                  value={slug}
                  onChange={(e) => setSlug(e.currentTarget.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  leftSection={<IconLink size={16} />}
                  style={{ flex: 1 }}
                  error={slug.length > 0 && slug.length < 3 ? "Minimum 3 characters" : null}
                />
                <Button
                  onClick={handleUpdateSlug}
                  loading={isSavingSlug}
                  disabled={slug === (profileData?.slug || '') || slug.length < 3}
                >
                  Save URL
                </Button>
              </Group>
            </Input.Wrapper>

            <Box p="md" bg="var(--mantine-color-gray-light)" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
              <Text size="xs" fw={700} mb="sm" c="dimmed" tt="uppercase" lts={1}>Public Visibility Controls</Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <Stack gap="xs">
                  <Text size="sm" fw={600}>Score Data</Text>
                  <Switch
                    label="Show maimai DX Name"
                    checked={privacySettings.show_maimai_name}
                    onChange={(e) => handleUpdatePrivacy('show_maimai_name', e.currentTarget.checked)}
                  />
                  <Switch
                    label="Show DX Rating"
                    checked={privacySettings.show_dx_rating}
                    onChange={(e) => handleUpdatePrivacy('show_dx_rating', e.currentTarget.checked)}
                  />
                  <Switch
                    label="Show Best 50 Scores"
                    checked={privacySettings.show_best_50}
                    onChange={(e) => handleUpdatePrivacy('show_best_50', e.currentTarget.checked)}
                  />
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" fw={600}>Collections</Text>
                  <Switch
                    label="Show Favorite Songs"
                    checked={privacySettings.show_favorite_songs}
                    onChange={(e) => handleUpdatePrivacy('show_favorite_songs', e.currentTarget.checked)}
                  />
                  <Switch
                    label="Show Playlists"
                    checked={privacySettings.show_playlists}
                    onChange={(e) => handleUpdatePrivacy('show_playlists', e.currentTarget.checked)}
                  />
                </Stack>
              </SimpleGrid>
            </Box>
          </Stack>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setIsSettingsModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSavePreferences}
              loading={isSavingPrefs}
              leftSection={<IconCheck size={18} />}
            >
              Save Preferences
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default ProfilePage;
