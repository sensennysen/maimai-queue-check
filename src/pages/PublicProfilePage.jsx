import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';
import {
  Container, Paper, Stack, Group, Title, Text, Avatar,
  Badge, SimpleGrid, Loader, Button, Alert,
  Divider, ThemeIcon, Box, ActionIcon, Image, Tooltip, Menu
} from '@mantine/core';
import {
  IconUser, IconTrophy, IconMapPin, IconAlertCircle,
  IconArrowLeft, IconStar, IconLock, IconLogin,
  IconSettings, IconUpload, IconCamera, IconTrash,
  IconShare, IconCode, IconBug, IconGitPullRequest, IconListDetails
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import MaimaiImportModal from '../components/profile/MaimaiImportModal';
import ProfileSettingsModal from '../components/profile/ProfileSettingsModal';
import PrivacySettingsModal from '../components/profile/PrivacySettingsModal';
import ProfilePictureUploadModal from '../components/profile/ProfilePictureUploadModal';
import MaimaiSongDetailModal from '../components/profile/MaimaiSongDetailModal';
import { useAuth } from '../hooks/useAuth';
import { userService, branchService, mostPlayedService } from '../services/supabase';
import { FavoriteSongsSection } from '../components/profile/FavoriteSongsSection';
import { PlaylistSection } from '../components/profile/PlaylistSection';
import { IntroductionCard } from '../components/profile/IntroductionCard';
import { ScoreCard } from '../components/maimai/ScoreCard';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { useMouseDragScroll } from '../hooks/useMouseDragScroll';
import { DIFFICULTY_COLORS, BASE_JACKET_URL } from '../config/maimai-constants';
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
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedMostPlayedSong, setSelectedMostPlayedSong] = useState(null);
  const [selectedBest50Song, setSelectedBest50Song] = useState(null);
  const [selectedBest50Score, setSelectedBest50Score] = useState(null);
  const [introduction, setIntroduction] = useState(null);

  const { requestFetch, songMapByTitle } = useSongDatabaseContext();
  const { scrollRef, isDragging } = useMouseDragScroll();

  useEffect(() => {
    if (profile) {
      requestFetch();
    }
  }, [profile, requestFetch]);

  const fetchData = useCallback(async () => {
    try {
      const [profileData, branchesData] = await Promise.all([
        userService.getProfileBySlug(slug),
        branchService.getBranchesForResolution()
      ]);

      if (!profileData) {
        setError('Profile not found');
      } else if (!profileData.is_public && !user) {
        setIsRestricted(true);
      } else {
        const mostPlayedData = await mostPlayedService.getMostPlayed(profileData.id);
        if (profileData.maimai_best_scores) {
          profileData.maimai_best_scores.most_played = mostPlayedData || [];
        } else if (mostPlayedData && mostPlayedData.length > 0) {
          profileData.maimai_best_scores = { most_played: mostPlayedData };
        }

        setProfile(profileData);
        setBranches(branchesData);
        setIntroduction(profileData.introduction || null);
      }
    } catch (err) {
      console.error('Error fetching public profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
    // user?.id is the correct dep — avoids re-creating fetchData on every user object re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user?.id]);

  useEffect(() => {
    if (slug) {
      // Use a ref-less check or just rely on slug for initial loading state
      if (!profile || profile.slug !== slug) {
        setLoading(true);
      }
      fetchData();
    }
    // profile is intentionally excluded: including it would cause an infinite loop
    // (fetch sets profile → profile change triggers fetch again)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, fetchData]);

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to clear your Best 50 scores, maimai DX name, and maimai profile photo? This will NOT remove your custom profile picture. This action cannot be undone.')) {
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
              The user has restricted viewing it in public. Please log in to view the profile.
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

  const isMalformedBest50 = profile?.maimai_best_scores && (
    !profile.maimai_best_scores.best_new ||
    !profile.maimai_best_scores.best_old ||
    !Array.isArray(profile.maimai_best_scores.best_new?.songs) ||
    !Array.isArray(profile.maimai_best_scores.best_old?.songs) ||
    !profile.maimai_best_scores.most_played ||
    typeof profile.maimai_best_scores.total_play_count === 'undefined'
  );

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

          {/* Action Buttons only for owner */}
          {isOwner && (
            <Group gap="xs">
              <Menu position="bottom-end" shadow="md">
                <Menu.Target>
                  <ActionIcon
                    variant="light"
                    color="gray"
                    size="lg" // To roughly match the height of the Button
                    style={{ height: 36, width: 36 }}
                    title="Settings"
                    className="animate-fade-in"
                  >
                    <IconSettings size={20} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconUser size={14} />} onClick={() => setIsSettingsModalOpen(true)}>
                    Profile Settings
                  </Menu.Item>
                  <Menu.Item leftSection={<IconLock size={14} />} onClick={() => setIsPrivacyModalOpen(true)}>
                    Privacy Settings
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              <Button
                variant="light"
                color="blue"
                leftSection={<IconShare size={18} />}
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  notifications.show({
                    title: 'Link Copied',
                    message: 'Profile link copied to clipboard!',
                    color: 'blue',
                  });
                }}
                className="animate-fade-in"
              >
                Share Profile
              </Button>
            </Group>
          )}
        </Group>

        {/* Profile Header Card */}
        <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-100">
          <Group wrap="nowrap" justify="space-between" align="flex-start">
            <Group wrap="nowrap" style={{ flex: 1 }}>
              <div
                style={{
                  position: 'relative',
                  cursor: isOwner ? 'pointer' : 'default',
                  transition: 'transform 0.1s ease'
                }}
                className={isOwner ? 'hover-scale' : ''}
                onClick={() => isOwner && setIsUploadModalOpen(true)}
              >
                <Avatar
                  src={profile.display_photo_url || profile.dx_display_photo_url}
                  size={90}
                  radius={90}
                  color="primary"
                >
                  <IconUser size={45} />
                </Avatar>
                {isOwner && (
                  <Box
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      background: 'var(--mantine-color-blue-6)',
                      color: 'white',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    <IconCamera size={16} />
                  </Box>
                )}
              </div>

              <Stack gap={4}>
                <Group gap="xs" align="center">
                  <Title order={1} style={{ fontSize: '1.75rem', lineHeight: 1.2 }}>
                    {profile.display_name || 'Anonymous Player'}
                  </Title>

                  {profile.user_attributions?.attributions?.length > 0 && (
                    <Group gap={6} align="center" mt={4}>
                      {profile.user_attributions.attributions.includes('DEVELOPER') && (
                        <Tooltip label="Developer" withArrow position="top">
                          <ThemeIcon size={24} radius="xl" variant="light" color="blue">
                            <IconCode size={14} />
                          </ThemeIcon>
                        </Tooltip>
                      )}
                      {profile.user_attributions.attributions.includes('CONTRIBUTOR') && (
                        <Tooltip label="Contributor" withArrow position="top">
                          <ThemeIcon size={24} radius="xl" variant="light" color="pink">
                            <IconGitPullRequest size={14} />
                          </ThemeIcon>
                        </Tooltip>
                      )}
                      {profile.user_attributions.attributions.includes('TESTER') && (
                        <Tooltip label="Tester" withArrow position="top">
                          <ThemeIcon size={24} radius="xl" variant="light" color="green">
                            <IconBug size={14} />
                          </ThemeIcon>
                        </Tooltip>
                      )}
                    </Group>
                  )}

                  {/* Old Settings button was here */}
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

                {profile.user_roles?.queue_name && (
                  <Group gap={4} align="center">
                    <IconListDetails size={14} style={{ color: 'var(--mantine-color-blue-5)' }} />
                    <Text size="sm">Queue Name: <Text component="span" fw={600}>{profile.user_roles.queue_name}</Text></Text>
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
                  {(privacy.show_dx_rating || isOwner) && profile.maimai_best_scores?.total_rating && (
                    <Group gap={4} align="center">
                      <Text size="sm" fw={600}>Rating:</Text>
                      <Text size="sm" fw={700} c="primary">{profile.maimai_best_scores.total_rating}</Text>
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
              {(privacy.show_dx_rating || isOwner) && profile.maimai_best_scores?.total_rating && (
                <Stack gap={0} align="flex-end" mt={4}>
                  <Text size="xs" fw={700} c="secondary" tt="uppercase" lts={1}>Rating</Text>
                  <Text size="xl" fw={900} c="primary" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                    {profile.maimai_best_scores.total_rating}
                  </Text>
                </Stack>
              )}
            </Stack>
          </Group>
        </Paper>

        {/* Introduction Card */}
        {(privacy.show_introduction !== false || isOwner) && (
          <div className="animate-fade-in delay-200">
            <IntroductionCard
              introduction={introduction}
              isOwnProfile={isOwner}
              userId={profile.id}
              onUpdate={setIntroduction}
            />
          </div>
        )}

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

        {/* Most Played Songs Section */}
        {(privacy.show_most_played !== false || isOwner) && profile.maimai_best_scores?.most_played?.length > 0 && (
          <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-350">
            <Group gap="xs" mb="md">
              <IconStar size={24} style={{ color: 'var(--mantine-color-pink-5)' }} />
              <Title order={2}>Most Played Songs</Title>
            </Group>
            <div
              className="hide-scrollbar"
              ref={scrollRef}
              style={{
                overflowX: 'auto',
                display: 'flex',
                gap: '12px',
                paddingBottom: '12px', // Increased from 2px
                paddingTop: '8px',     // Added to prevent clipping
                cursor: 'grab'
              }}
            >
              {profile.maimai_best_scores.most_played.map((song, index) => {
                const matchedSong = songMapByTitle?.get(song.title);
                return (
                  <Paper
                    key={index}
                    p={0}
                    radius="lg"
                    className="hologram-card favorite-song-card"
                    style={{
                      minWidth: 160,
                      width: 160,
                      flexShrink: 0,
                      height: 160,
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: (isOwner || privacy.show_most_played_details === true) ? 'pointer' : 'default',
                      transition: 'transform 0.1s ease, box-shadow 0.2s ease', // Added box-shadow transition
                      border: `2px solid ${DIFFICULTY_COLORS[song.difficulty] || 'transparent'}`,
                      contentVisibility: 'auto',
                      containIntrinsicSize: 'auto 160px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                    onClick={() => {
                      if (!isDragging) {
                        const canViewDetails = isOwner || privacy.show_most_played_details === true;
                        if (!canViewDetails) return;
                        if (!matchedSong) {
                          notifications.show({
                            title: 'Song not found',
                            message: 'This song could not be found in the database.',
                            color: 'red',
                          });
                          return;
                        }
                        setSelectedMostPlayedSong({
                          ...matchedSong,
                          play_count: song.play_count,
                          title: song.title,
                          difficulty: song.difficulty
                        });
                      }
                    }}
                  >
                    <Box style={{ position: 'relative', width: '100%', height: '100%' }}>
                      {/* Difficulty Badge */}
                      {song.difficulty && (
                        <Box
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            zIndex: 10,
                            background: DIFFICULTY_COLORS[song.difficulty] || 'gray',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            textShadow: 'none'
                          }}
                        >
                          {song.difficulty}
                        </Box>
                      )}

                      <Image
                        src={matchedSong?.imageUrl || (song.imageName ? `${BASE_JACKET_URL}${song.imageName}` : null)}
                        alt={song.title}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        fallbackSrc="https://placehold.co/160x160?text=No+Image"
                      />

                      {/* Dark Overlay */}
                      <Box
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)',
                          zIndex: 1
                        }}
                      />

                      {/* Content */}
                      <Box
                        p="xs"
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          zIndex: 5
                        }}
                      >
                        <Text size="xs" c="white" fw={700} lineClamp={1} mb={2} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                          {song.title}
                        </Text>
                        <Group gap={4} align="baseline">
                          <Text size="lg" fw={900} c="white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)', lineHeight: 1 }}>
                            {song.play_count}
                          </Text>
                          <Text size="xs" fw={700} c="white" style={{ opacity: 0.8, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                            plays
                          </Text>
                        </Group>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </div>
          </Paper>
        )}

        {/* Best 50 Section */}
        {(privacy.show_best_50 || isOwner) && (
          <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-400">
            {isOwner && isMalformedBest50 && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" mb="md" title="Action Required">
                Data and Bookmark is out of date. Please create a new bookmark from the Import message and reimport
              </Alert>
            )}
            <Group justify="space-between" mb="xl">
              <Stack gap={0}>
                <Group gap="xs">
                  <IconTrophy size={24} style={{ color: 'var(--mantine-color-yellow-6)' }} />
                  <Title order={2}>Best 50</Title>
                </Group>
                {profile.maimai_best_scores?.total_play_count && (privacy.show_play_count !== false || isOwner) && (
                  <Group gap="xs" mt={4}>
                    <Badge variant="subtle" color="pink" size="lg">
                      Version: {profile.maimai_best_scores.current_version_play_count || 0} plays
                    </Badge>
                    <Badge variant="subtle" color="cyan" size="lg">
                      Total: {profile.maimai_best_scores.total_play_count} plays
                    </Badge>
                  </Group>
                )}
              </Stack>
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
                  {profile.maimai_best_scores.best_new?.songs?.length > 0 ? (
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                      {profile.maimai_best_scores.best_new.songs.map((score, index) => (
                        <ScoreCard
                          key={`new-${index}`}
                          score={score}
                          onClick={(isOwner || privacy.show_best_50_details === true) ? () => {
                            const matchedSong = songMapByTitle?.get(score.title);
                            if (!matchedSong) {
                              notifications.show({
                                title: 'Song not found',
                                message: 'This song could not be found in the database.',
                                color: 'red',
                              });
                              return;
                            }
                            setSelectedBest50Song(matchedSong);
                            setSelectedBest50Score(score);
                          } : undefined}
                        />
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
                  {profile.maimai_best_scores.best_old?.songs?.length > 0 ? (
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                      {profile.maimai_best_scores.best_old.songs.map((score, index) => (
                        <ScoreCard
                          key={`old-${index}`}
                          score={score}
                          onClick={(isOwner || privacy.show_best_50_details === true) ? () => {
                            const matchedSong = songMapByTitle?.get(score.title);
                            if (!matchedSong) {
                              notifications.show({
                                title: 'Song not found',
                                message: 'This song could not be found in the database.',
                                color: 'red',
                              });
                              return;
                            }
                            setSelectedBest50Song(matchedSong);
                            setSelectedBest50Score(score);
                          } : undefined}
                        />
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
      {isOwner && (
        <>
          <MaimaiImportModal
            opened={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            userId={user.id}
            onSuccess={fetchData}
          />
          <ProfilePictureUploadModal
            opened={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            userId={user.id}
            currentPhotoUrl={profile.display_photo_url || profile.dx_display_photo_url}
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
          <PrivacySettingsModal
            opened={isPrivacyModalOpen}
            onClose={() => setIsPrivacyModalOpen(false)}
            userId={user.id}
            initialData={profile}
            onSuccess={fetchData}
          />
        </>
      )}

      {/* Song detail modals — available to visitors when owner enables details */}
      <MaimaiSongDetailModal
        song={selectedMostPlayedSong}
        opened={!!selectedMostPlayedSong}
        onClose={() => setSelectedMostPlayedSong(null)}
        playCount={selectedMostPlayedSong?.play_count}
        difficulty={selectedMostPlayedSong?.difficulty}
        title="Most Played Details"
      />
      <MaimaiSongDetailModal
        song={selectedBest50Song}
        opened={!!selectedBest50Song}
        onClose={() => {
          setSelectedBest50Song(null);
          setSelectedBest50Score(null);
        }}
        playCount={selectedBest50Score?.playCount ?? selectedBest50Score?.play_count}
        difficulty={selectedBest50Score?.difficulty}
        title="Best 50 Details"
        best50Score={selectedBest50Score}
      />
    </Container >
  );
};

export default PublicProfilePage;
