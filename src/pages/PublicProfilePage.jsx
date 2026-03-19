import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';
import {
  Container, Paper, Stack, Group, Title, Text,
  Loader, Button, Alert, ThemeIcon, Tooltip
} from '@mantine/core';
import {
  IconLock, IconLogin, IconAlertCircle, IconShare
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

// Modals
import MaimaiImportModal from '../components/profile/MaimaiImportModal';
import ProfileSettingsModal from '../components/profile/ProfileSettingsModal';
import PrivacySettingsModal from '../components/profile/PrivacySettingsModal';
import ProfilePictureUploadModal from '../components/profile/ProfilePictureUploadModal';
import MaimaiSongDetailModal from '../components/profile/MaimaiSongDetailModal';

// Components & Services
import { FavoriteSongsSection } from '../components/profile/FavoriteSongsSection';
import { PlaylistSection } from '../components/profile/PlaylistSection';
import { ProfilePostsSection } from '../components/profile/ProfilePostsSection';
import { RecentPlaysSection } from '../components/profile/RecentPlaysSection';
import { IntroductionCard } from '../components/profile/IntroductionCard';
import { useAuth } from '../hooks/useAuth';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { useMouseDragScroll } from '../hooks/useMouseDragScroll';
import { usePublicProfile } from '../features/profile/hooks/usePublicProfile';
import { ProfileHeaderCard } from '../features/profile/components/ProfileHeaderCard';
import { MostPlayedSection } from '../features/profile/components/MostPlayedSection';
import { Best50Section } from '../features/profile/components/Best50Section';

const PublicProfilePage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const [searchParams, setSearchParams] = useSearchParams();
  const { requestFetch, songMapByTitle } = useSongDatabaseContext();
  const { scrollRef, isDragging } = useMouseDragScroll();

  // Profile data and logic
  const {
    profile,
    branches,
    loading,
    error,
    isRestricted,
    isFollowing,
    followLoading,
    introduction,
    setIntroduction,
    toggleFollow,
    fetchData
  } = usePublicProfile(slug, user);

  // Modal states
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedMostPlayedSong, setSelectedMostPlayedSong] = useState(null);
  const [selectedBest50Song, setSelectedBest50Song] = useState(null);
  const [selectedBest50Score, setSelectedBest50Score] = useState(null);
  const [viewAsPublic, setViewAsPublic] = useState(false);

  useEffect(() => {
    if (profile) requestFetch();
  }, [profile, requestFetch]);

  const isRealOwner = profile?.id === user?.id;
  const isOwner = isRealOwner && !viewAsPublic;

  useEffect(() => {
    if (!isRealOwner) return;
    const settingsTarget = searchParams.get('settings');
    if (settingsTarget === 'profile') setIsSettingsModalOpen(true);
    else if (settingsTarget === 'privacy') setIsPrivacyModalOpen(true);
  }, [isRealOwner, searchParams]); // eslint-disable-line

  const clearSettingsParam = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('settings');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" style={{ minHeight: '60vh' }}>
          <Loader size="xl" color="var(--theme-primary)" type="bars" />
          <Text size="lg" fw={500} mt="md">Loading profile...</Text>
        </Stack>
      </Container>
    );
  }

  if (isRestricted) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" style={{ minHeight: '70vh' }} gap="xl">
          <Paper shadow="xl" p={40} radius="lg" withBorder style={{ maxWidth: 500, width: '100%', textAlign: 'center', backgroundColor: 'var(--mantine-color-body)' }}>
            <ThemeIcon size={80} radius={80} variant="light" color="primary" mb="md">
              <IconLock size={40} />
            </ThemeIcon>
            <Title order={2} mb="sm" fw={800}>Profile is Private</Title>
            <Text size="lg" c="dimmed" mb="xl" style={{ lineHeight: 1.6 }}>
              This profile is only visible to logged-in users.
            </Text>
            <Stack gap="sm">
              {!user && (
                <Button component={Link} to="/login" size="lg" leftSection={<IconLogin size={20} />} variant="filled" color="primary" radius="md" fullWidth>
                  Log In to View
                </Button>
              )}
              <Text size="sm" c="dimmed">Sign in with an account that has access to continue.</Text>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" style={{ minHeight: '70vh' }} gap="xl">
          <Paper shadow="xl" p={40} radius="lg" withBorder style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
            <ThemeIcon size={80} radius={80} variant="light" color="var(--theme-error)" mb="md">
              <IconAlertCircle size={40} />
            </ThemeIcon>
            <Title order={2} mb="sm" fw={800}>Oops!</Title>
            <Text size="lg" c="dimmed" mb="xl">{error || 'Profile not found'}</Text>
          </Paper>
        </Stack>
      </Container>
    );
  }

  const privacy = profile?.privacy_settings || {
    show_dx_rating: true, show_best_50: true, show_best_50_details: true,
    show_most_played: true, show_most_played_details: true, show_favorite_songs: true,
    show_playlists: true, show_main_branch: true, show_preferred_branches: true,
    show_introduction: true, show_play_count: true, show_maimai_name: true,
    show_circle: true, show_recent_plays: true, show_posts: true
  };

  const getBranchName = (id, useAcronym = false) => {
    if (!id) return null;
    const branch = branches.find(b => String(b.id) === String(id));
    if (!branch) return 'Unknown Branch';
    return useAcronym ? (branch.acronym || branch.short_name) : (branch.short_name || branch.arcade_name);
  };

  const mainBranchName = profile.main_branch ? getBranchName(profile.main_branch) : null;
  const preferredBranchNames = profile.preferred_branches?.map(id => getBranchName(id, true)) || [];

  const isMalformedBest50 = profile?.maimai_best_scores && (
    !profile.maimai_best_scores.best_new || !profile.maimai_best_scores.best_old
  );

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {viewAsPublic && isRealOwner && (
          <Alert icon={<IconLogin size={16} />} title="Viewing as Public" color="primary" variant="light" className="animate-fade-in">
            <Group justify="space-between" align="center">
              <Text size="sm">You are currently viewing your profile as a public guest.</Text>
              <Button size="xs" variant="filled" onClick={() => setViewAsPublic(false)}>Exit Preview</Button>
            </Group>
          </Alert>
        )}

        <Group justify="flex-end">
          {isRealOwner && !viewAsPublic && (
            <Group gap="xs">
              <Tooltip label="View as Public" withArrow>
                <Button 
                  variant="light" color="gray" 
                  leftSection={<IconLogin size={18} />} 
                  onClick={() => setViewAsPublic(true)}
                >
                  {isMobile ? '' : 'View as Public'}
                </Button>
              </Tooltip>
              <Button
                variant="light" color="secondary"
                leftSection={<IconShare size={18} />}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  notifications.show({ title: 'Link Copied', message: 'Profile link copied to clipboard!', color: 'blue' });
                }}
              >
                {isMobile ? '' : 'Share Profile'}
              </Button>
            </Group>
          )}

          {user && profile && profile.id !== user.id && (
            <Button
              variant={isFollowing ? 'light' : 'filled'}
              color={isFollowing ? 'gray' : 'primary'}
              loading={followLoading}
              onClick={toggleFollow}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </Group>

        <ProfileHeaderCard 
          profile={profile}
          privacy={privacy}
          isOwner={isOwner}
          mainBranchName={mainBranchName}
          preferredBranchNames={preferredBranchNames}
          onAvatarClick={() => isOwner && setIsUploadModalOpen(true)}
        />

        {(privacy.show_introduction !== false || isOwner) && (
          <IntroductionCard introduction={introduction} isOwnProfile={isOwner} userId={profile.id} onUpdate={setIntroduction} />
        )}

        {(privacy.show_posts !== false || isOwner) && (
          <ProfilePostsSection userId={profile.id} currentUser={user} isOwnProfile={isOwner} />
        )}

        {(privacy.show_favorite_songs || isOwner) && (
          <FavoriteSongsSection userId={profile.id} isOwnProfile={isOwner} />
        )}

        {(privacy.show_playlists || isOwner) && (
          <PlaylistSection userId={profile.id} isOwnProfile={isOwner} />
        )}

        {(privacy.show_most_played !== false || isOwner) && (
          <MostPlayedSection 
            profile={profile} 
            privacy={privacy} 
            isOwner={isOwner} 
            songMapByTitle={songMapByTitle} 
            scrollRef={scrollRef} 
            isDragging={isDragging} 
            onSongClick={(song, matched) => setSelectedMostPlayedSong({...matched, ...song})}
          />
        )}

        {(privacy.show_best_50 || isOwner) && (
          <Best50Section 
            profile={profile} 
            privacy={privacy} 
            isOwner={isOwner} 
            isMalformedBest50={isMalformedBest50} 
            onImportClick={() => setIsImportModalOpen(true)}
            onScoreClick={(score) => {
              setSelectedBest50Song(songMapByTitle?.get(score.title));
              setSelectedBest50Score(score);
            }}
          />
        )}

        {(privacy.show_recent_plays !== false || isOwner) && (
          <RecentPlaysSection userId={profile.id} isOwnProfile={isOwner} />
        )}
      </Stack>

      {/* Modals */}
      <ProfileSettingsModal 
        opened={isSettingsModalOpen} 
        onClose={() => { setIsSettingsModalOpen(false); clearSettingsParam(); }} 
        userId={user?.id} 
        initialData={profile} 
        allBranches={branches} 
        onSuccess={fetchData} 
      />
      <PrivacySettingsModal 
        opened={isPrivacyModalOpen} 
        onClose={() => { setIsPrivacyModalOpen(false); clearSettingsParam(); }} 
        userId={user?.id} 
        initialData={privacy} 
        onSuccess={fetchData} 
      />
      <ProfilePictureUploadModal 
        opened={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        userId={user?.id} 
        currentPhotoUrl={profile?.display_photo_url || profile?.dx_display_photo_url}
        onSuccess={fetchData} 
      />
      <MaimaiImportModal 
        opened={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        userId={user?.id} 
        onSuccess={fetchData} 
      />
      <MaimaiSongDetailModal 
        opened={!!selectedMostPlayedSong || !!selectedBest50Song} 
        onClose={() => { setSelectedMostPlayedSong(null); setSelectedBest50Song(null); setSelectedBest50Score(null); }} 
        song={selectedMostPlayedSong || selectedBest50Song} 
        userBestScore={selectedBest50Score}
      />
    </Container>
  );
};

export default PublicProfilePage;
