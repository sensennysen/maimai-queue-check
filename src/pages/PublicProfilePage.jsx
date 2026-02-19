import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';
import {
  Container, Paper, Stack, Group, Title, Text, Avatar,
  Badge, SimpleGrid, Loader, Button, Alert,
  Divider, ThemeIcon, Box, ActionIcon
} from '@mantine/core';
import {
  IconUser, IconTrophy, IconMapPin, IconAlertCircle,
  IconArrowLeft, IconStar, IconLock, IconLogin,
  IconSettings, IconUpload, IconCamera, IconTrash
} from '@tabler/icons-react';
import MaimaiImportModal from '../components/profile/MaimaiImportModal';
import ProfileSettingsModal from '../components/profile/ProfileSettingsModal';
import { useAuth } from '../hooks/useAuth';
import { userService, branchService } from '../services/supabase';
import { FavoriteSongsSection } from '../components/profile/FavoriteSongsSection';
import { PlaylistSection } from '../components/profile/PlaylistSection';
import { ScoreCard } from '../components/maimai/ScoreCard';
import Footer from '../components/layout/Footer';

const PublicProfilePage = () => {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRestricted, setIsRestricted] = useState(false);
  const { user, refreshUserRoles } = useAuth();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const navigate = useNavigate();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileData, branchesData] = await Promise.all([
        userService.getProfileBySlug(slug),
        branchService.getBranchesForResolution()
      ]);

      if (!profileData) {
        setError('Profile not found');
      } else if (!profileData.is_public && profileData.id !== user?.id) {
        setIsRestricted(true);
      } else {
        setProfile(profileData);
        setBranches(branchesData);
      }
    } catch (err) {
      console.error('Error fetching public profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [slug, user?.id]);

  useEffect(() => {
    if (slug) {
      // Use a ref-less check or just rely on slug for initial loading state
      if (!profile || profile.slug !== slug) {
        setLoading(true);
      }
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, fetchData]); // Removed profile dependency to prevent infinite loop

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to clear your Best 50 scores, maimai DX name, and profile photo? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await userService.clearMaimaiData(user.id);
      await fetchData();
    } catch (err) {
      console.error('Error clearing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = profile?.id === user?.id;

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Stack align="center" justify="center" style={{ minHeight: '60vh' }}>
          <Loader size="xl" color="pink" type="bars" />
          <Text size="lg" fw={500} mt="md">Loading profile...</Text>
        </Stack>
      </Container>
    );
  }

  if (isRestricted) {
    return (
      <Container size="lg" py="xl">
        <Stack align="center" justify="center" style={{ minHeight: '70vh' }} gap="xl">
          <Paper shadow="xl" p={40} radius="lg" withBorder style={{ maxWidth: 500, width: '100%', textAlign: 'center', backgroundColor: 'var(--mantine-color-body)' }}>
            <ThemeIcon size={80} radius={80} variant="light" color="blue" mb="md">
              <IconLock size={40} />
            </ThemeIcon>
            <Title order={2} mb="sm" fw={800}>Profile is Private</Title>
            <Text size="lg" c="dimmed" mb="xl" style={{ lineHeight: 1.6 }}>
              The user restricts viewing it in public so that they need to be logged in.
            </Text>

            <Stack gap="sm">
              {!user && (
                <Button
                  component={Link}
                  to="/login"
                  size="lg"
                  leftSection={<IconLogin size={20} />}
                  variant="filled"
                  color="blue"
                  radius="md"
                  fullWidth
                >
                  Log In to View
                </Button>
              )}
              <Button
                component={Link}
                to="/"
                variant="subtle"
                color="gray"
                leftSection={<IconArrowLeft size={18} />}
                fullWidth
              >
                Back to Home
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container size="lg" py="xl">
        <Stack align="center" justify="center" style={{ minHeight: '70vh' }} gap="xl">
          <Paper shadow="xl" p={40} radius="lg" withBorder style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
            <ThemeIcon size={80} radius={80} variant="light" color="red" mb="md">
              <IconAlertCircle size={40} />
            </ThemeIcon>
            <Title order={2} mb="sm" fw={800}>Oops!</Title>
            <Text size="lg" c="dimmed" mb="xl">
              {error || 'Profile not found'}
            </Text>
            <Button
              component={Link}
              to="/"
              size="lg"
              variant="outline"
              color="red"
              radius="md"
              leftSection={<IconArrowLeft size={18} />}
              fullWidth
            >
              Back to Home
            </Button>
          </Paper>
        </Stack>
      </Container>
    );
  }

  const { privacy_settings: privacy } = profile;

  const getBranchName = (id, useAcronym = false) => {
    if (!id) return null;
    const branch = branches.find(b => String(b.id) === String(id));
    if (!branch) return 'Unknown Branch';
    if (useAcronym && branch.acronym) return branch.acronym;
    return branch.short_name || branch.arcade_name;
  };

  const mainBranchName = profile.main_branch ? getBranchName(profile.main_branch) : null;
  const preferredBranchNames = profile.preferred_branches?.map(id => getBranchName(id, true)) || [];

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Back Button / Navigation */}
        <Group justify="space-between">
          <Button
            component={Link}
            to="/"
            variant="subtle"
            leftSection={<IconArrowLeft size={18} />}
            className="animate-fade-in"
          >
            Back to queue
          </Button>

          {/* No management buttons here anymore */}
        </Group>

        {/* Profile Header Card */}
        <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-100">
          <Group wrap="nowrap" justify="space-between" align="flex-start">
            <Group wrap="nowrap" style={{ flex: 1 }}>
              <Avatar
                src={profile.display_photo_url}
                size={90}
                radius={90}
                color="primary"
              >
                <IconUser size={45} />
              </Avatar>

              <Stack gap={4}>
                <Group gap="xs" align="center">
                  <Title order={1} style={{ fontSize: '1.75rem', lineHeight: 1.2 }}>
                    {profile.display_name || 'Anonymous Player'}
                  </Title>
                  {isOwner && (
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => setIsSettingsModalOpen(true)}
                      title="Profile Settings"
                      size="md"
                    >
                      <IconSettings size={20} />
                    </ActionIcon>
                  )}
                </Group>

                {(privacy.show_main_branch || isOwner) && mainBranchName && (
                  <Group gap={4} align="center">
                    <IconMapPin size={14} style={{ color: 'var(--theme-primary)' }} />
                    <Text size="sm" fw={500}>Main Branch: {mainBranchName}</Text>
                  </Group>
                )}

                {(privacy.show_preferred_branches || isOwner) && preferredBranchNames.length > 0 && (
                  <Group gap={6} align="center" wrap="wrap">
                    <IconStar size={14} style={{ color: 'var(--theme-accent)' }} />
                    <Text size="sm">Preferred:</Text>
                    {preferredBranchNames.map((name, i) => (
                      <Badge key={i} size="sm" variant="light" color="secondary">{name}</Badge>
                    ))}
                  </Group>
                )}

                {/* Mobile: DX Name + Rating inline */}
                <Stack gap={2} hiddenFrom="sm">
                  {(privacy.show_maimai_name || isOwner) && profile.maimai_dx_name && (
                    <Group gap={4} align="center">
                      <Text size="sm" fw={600}>DX Name:</Text>
                      <Text size="sm">{profile.maimai_dx_name}</Text>
                    </Group>
                  )}
                  {(privacy.show_dx_rating || isOwner) && profile.maimai_best_scores?.totalRating && (
                    <Group gap={4} align="center">
                      <Text size="sm" fw={600}>Rating:</Text>
                      <Text size="sm" fw={700} c="primary">{profile.maimai_best_scores.totalRating}</Text>
                    </Group>
                  )}
                </Stack>
              </Stack>
            </Group>

            <Stack gap={0} align="flex-end" visibleFrom="sm">
              {(privacy.show_maimai_name || isOwner) && profile.maimai_dx_name && (
                <Group gap={4}>
                  <Text size="sm" c="secondary" fw={500}>maimai DX Name:</Text>
                  <Text size="sm" fw={600}>{profile.maimai_dx_name}</Text>
                </Group>
              )}
              {(privacy.show_dx_rating || isOwner) && profile.maimai_best_scores?.totalRating && (
                <Stack gap={0} align="flex-end" mt={4}>
                  <Text size="xs" fw={700} c="secondary" tt="uppercase" lts={1}>Rating</Text>
                  <Text size="xl" fw={900} c="primary" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                    {profile.maimai_best_scores.totalRating}
                  </Text>
                </Stack>
              )}
            </Stack>
          </Group>
        </Paper>

        {/* Favorite Songs Section */}
        {(privacy.show_favorite_songs || isOwner) && (
          <div className="animate-fade-in delay-300">
            <FavoriteSongsSection userId={profile.id} isOwnProfile={isOwner} />
          </div>
        )}

        {/* Playlist Section */}
        {(privacy.show_playlists || isOwner) && (
          <div className="animate-fade-in delay-350">
            <PlaylistSection userId={profile.id} isOwnProfile={isOwner} />
          </div>
        )}

        {/* Best 50 Section */}
        {(privacy.show_best_50 || isOwner) && (
          <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-400">
            <Group justify="space-between" mb="xl">
              <Group gap="xs">
                <IconTrophy size={24} style={{ color: 'var(--mantine-color-yellow-6)' }} />
                <Title order={2}>Best 50</Title>
              </Group>
              {isOwner && (
                <Group gap="xs" wrap="nowrap">
                  <Button
                    leftSection={<IconUpload size={18} />}
                    variant="light"
                    size="sm"
                    onClick={() => setIsImportModalOpen(true)}
                  >
                    {isMobile ? 'Import' : 'Import Scores'}
                  </Button>
                  {profile.maimai_best_scores && (
                    <>
                      <Button
                        leftSection={<IconCamera size={18} />}
                        variant="light"
                        color="secondary"
                        size="sm"
                        onClick={() => window.open('/profile/export', '_blank')}
                      >
                        {isMobile ? 'Export' : 'Export Image'}
                      </Button>
                      <Button
                        leftSection={<IconTrash size={18} />}
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={handleClearData}
                      >
                        {isMobile ? 'Clear' : 'Clear Data'}
                      </Button>
                    </>
                  )}
                </Group>
              )}
            </Group>

            {profile.maimai_best_scores ? (
              <Stack gap="md">
                <div>
                  <Title order={3} mb="md">Best 15 (New)</Title>
                  {profile.maimai_best_scores.new?.songs?.length > 0 ? (
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                      {profile.maimai_best_scores.new.songs.map((score, index) => (
                        <ScoreCard key={`new-${index}`} score={score} />
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Alert icon={<IconAlertCircle size={16} />} color="gray" variant="light">
                      The user hasn't played new songs yet
                    </Alert>
                  )}
                </div>

                <div>
                  <Divider my="md" />
                  <Title order={3} mb="md">Best 35 (Old)</Title>
                  {profile.maimai_best_scores.old?.songs?.length > 0 ? (
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                      {profile.maimai_best_scores.old.songs.map((score, index) => (
                        <ScoreCard key={`old-${index}`} score={score} />
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Alert icon={<IconAlertCircle size={16} />} color="gray" variant="light">
                      The user hasn't played old songs yet
                    </Alert>
                  )}
                </div>
              </Stack>
            ) : (
              <Alert icon={<IconAlertCircle size={16} />} title="No Best 50" color="gray" variant="light">
                {isOwner
                  ? "Display your Best 50 starting by clicking on the import button"
                  : "This user hasn't imported their Best 50 yet"}
              </Alert>
            )}
          </Paper>
        )}

        <Footer />
      </Stack>

      {/* Modals for Owner */}
      {
        isOwner && (
          <>
            <MaimaiImportModal
              opened={isImportModalOpen}
              onClose={() => setIsImportModalOpen(false)}
              userId={user.id}
              onSuccess={fetchData}
            />
            <ProfileSettingsModal
              opened={isSettingsModalOpen}
              onClose={() => setIsSettingsModalOpen(false)}
              userId={user.id}
              initialData={profile}
              allBranches={branches}
              onSuccess={async (newSlug) => {
                if (newSlug && newSlug !== slug) {
                  await refreshUserRoles();
                  navigate(`/p/${newSlug}`, { replace: true });
                } else {
                  await refreshUserRoles();
                  fetchData();
                }
              }}
            />
          </>
        )
      }
    </Container >
  );
};

export default PublicProfilePage;
