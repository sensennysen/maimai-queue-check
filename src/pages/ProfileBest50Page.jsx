import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container, Stack, Group, Button, Title, Loader,
  Alert, Paper, ThemeIcon, Text, Badge
} from '@mantine/core';
import { IconArrowLeft, IconTrophy, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { usePublicProfile } from '../features/profile/hooks/usePublicProfile';
// import { ProfileHeaderCard } from '../features/profile/components/ProfileHeaderCard';
import { Best50Section } from '../features/profile/components/Best50Section';
import MaimaiImportModal from '../components/profile/MaimaiImportModal';
import MaimaiSongDetailModal from '../components/profile/MaimaiSongDetailModal';

/**
 * Dedicated page for viewing a user's full Best 50 scores.
 * Accessible at /p/:slug/best50
 */
const ProfileBest50Page = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { songMapByTitle } = useSongDatabaseContext();

  const {
    profile,
    // branches,
    loading,
    error,
    isRestricted,
    fetchData,
  } = usePublicProfile(slug, user);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedScore, setSelectedScore] = useState(null);

  // Loading
  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" style={{ minHeight: '60vh' }}>
          <Loader size="xl" color="var(--theme-primary)" type="bars" />
          <Text size="lg" fw={500} mt="md">Loading scores...</Text>
        </Stack>
      </Container>
    );
  }

  // Restricted
  if (isRestricted || error || !profile) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" justify="center" style={{ minHeight: '60vh' }} gap="xl">
          <Paper shadow="xl" p={40} radius="lg" withBorder style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
            <ThemeIcon size={80} radius={80} variant="light" color="red" mb="md">
              <IconAlertCircle size={40} />
            </ThemeIcon>
            <Title order={2} mb="sm" fw={800}>
              {isRestricted ? 'Profile is Private' : 'Not Found'}
            </Title>
            <Text size="lg" c="dimmed" mb="xl">
              {isRestricted ? 'This profile is only visible to logged-in users.' : error || 'Profile not found'}
            </Text>
            <Button component={Link} to="/" variant="light">Go Home</Button>
          </Paper>
        </Stack>
      </Container>
    );
  }

  const isOwner = profile?.id === user?.id;
  const privacy = profile?.privacy_settings || {
    show_best_50: true,
    show_best_50_details: true,
    show_play_count: true,
    show_maimai_name: true,
    show_dx_rating: true,
    show_main_branch: true,
    show_preferred_branches: true,
    show_circle: true,
  };

  const isMalformedBest50 = profile?.maimai_best_scores && (
    !profile.maimai_best_scores.best_new || !profile.maimai_best_scores.best_old
  );

  const scores = profile?.maimai_best_scores;
  // const getBranchName = (id, useAcronym = false) => {
  //   if (!id) return null;
  //   const branch = branches.find(b => String(b.id) === String(id));
  //   if (!branch) return 'Unknown Branch';
  //   return useAcronym ? (branch.acronym || branch.short_name) : (branch.short_name || branch.arcade_name);
  // };
  // const mainBranchName = profile.main_branch ? getBranchName(profile.main_branch) : null;
  // const preferredBranchNames = profile.preferred_branches?.map(id => getBranchName(id, true)) || [];

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Back nav */}
        <Group>
          <Button
            component={Link}
            to={`/p/${slug}`}
            variant="subtle"
            color="gray"
            leftSection={<IconArrowLeft size={16} />}
            size="sm"
          >
            Back to {profile.display_name}'s Profile
          </Button>
        </Group>

        {/* Mini header context */}
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group gap="md" wrap="nowrap" justify="space-between">
            <Group gap="md" wrap="nowrap">
              <ThemeIcon size={40} radius={40} color="yellow" variant="light">
                <IconTrophy size={20} />
              </ThemeIcon>
              <Stack gap={2}>
                <Title order={2} style={{ lineHeight: 1.1 }}>
                  {profile.display_name}'s Best 50
                </Title>
                <Text size="sm" c="dimmed">
                  Full score breakdown — Current Version &amp; Past Versions
                </Text>
              </Stack>
            </Group>
            {scores?.total_rating && (
              <Stack gap={0} align="flex-end" style={{ flexShrink: 0 }}>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: 1 }}>Rating</Text>
                <Text size="2rem" fw={900} c="primary" style={{ lineHeight: 1 }}>
                  {scores.total_rating}
                </Text>
              </Stack>
            )}
          </Group>

          {scores?.total_play_count && (privacy.show_play_count !== false || isOwner) && (
            <Group gap="xs" mt="sm">
              <Badge variant="light" color="pink" size="md">
                Current Version: {scores.current_version_play_count || 0} plays
              </Badge>
              <Badge variant="light" color="cyan" size="md">
                Total: {scores.total_play_count} plays
              </Badge>
            </Group>
          )}
        </Paper>

        {/* Full Best 50 grid */}
        {(privacy.show_best_50 || isOwner) ? (
          <Best50Section
            profile={profile}
            privacy={privacy}
            isOwner={isOwner}
            isMalformedBest50={isMalformedBest50}
            onImportClick={() => setIsImportModalOpen(true)}
            onScoreClick={(score) => {
              setSelectedSong(songMapByTitle?.get(score.title));
              setSelectedScore(score);
            }}
          />
        ) : (
          <Alert icon={<IconAlertCircle size={16} />} color="gray" variant="light">
            This user's Best 50 is set to private.
          </Alert>
        )}
      </Stack>

      {/* Modals */}
      <MaimaiImportModal
        opened={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        userId={user?.id}
        onSuccess={fetchData}
      />
      <MaimaiSongDetailModal
        opened={!!selectedSong}
        onClose={() => { setSelectedSong(null); setSelectedScore(null); }}
        song={selectedSong}
        userBestScore={selectedScore}
      />
    </Container>
  );
};

export default ProfileBest50Page;
