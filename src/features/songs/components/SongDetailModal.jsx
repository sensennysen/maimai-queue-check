import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Grid,
  Group,
  Image,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconInfoCircle from '@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs';
import IconMessageCircle from '@tabler/icons-react/dist/esm/icons/IconMessageCircle.mjs';
import IconPlaylistAdd from '@tabler/icons-react/dist/esm/icons/IconPlaylistAdd.mjs';
import IconRefresh from '@tabler/icons-react/dist/esm/icons/IconRefresh.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import { AddToPlaylistModal } from '../../../components/modals/AddToPlaylistModal';
import { VoterListModal } from '../../../components/common/VoterListModal';
import {
  BASE_JACKET_URL,
  CATEGORY_TRANSLATION,
  VERSION_MAPPING,
} from '../../../config/maimai-constants';
import { useAuth } from '../../../hooks/useAuth';
import { discussionService } from '../../../services/supabase';
import { getRelativeTime } from '../../../utils/formatters';
import { CommentSection } from '../../discussion/components/CommentSection';
import { RatingSection } from '../../discussion/components/RatingSection';
import { TagSection } from '../../discussion/components/TagSection';
import { useSongDiscussion } from '../../discussion/hooks/useSongDiscussion';
import { useTagManagement } from '../../discussion/hooks/useTagManagement';
import { normalizeSongModalTab } from '../utils/songModalNavigation';
import SongOverview from './SongOverview';
import './SongDatabase.css';

function SongDetailModal({ song, opened, onClose, activeTab, onTabChange }) {
  const { user, userRoles } = useAuth();
  const isMobile = useMediaQuery('(max-width: 48em)');
  const songId = song?.songId;
  const [internalTab, setInternalTab] = useState('overview');
  const [addToPlaylistOpened, setAddToPlaylistOpened] = useState(false);
  const [glossaryOpened, setGlossaryOpened] = useState(false);
  const [votersOpened, setVotersOpened] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [initialVoterTab, setInitialVoterTab] = useState('likes');
  const dragStartRef = useRef({ y: 0, time: 0 });
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const {
    discussionData,
    setDiscussionData,
    availableTags,
    loading: discussionLoading,
    error,
    isRatingLoading,
    isSubmittingComment,
    loadDiscussion,
    handleRatingChange,
    postComment,
    deleteComment,
    voteComment,
  } = useSongDiscussion(songId, user, userRoles);

  const {
    isTaggingLoading,
    newTagValue,
    setNewTagValue,
    addTag,
    removeTag,
    createAndAddTag,
  } = useTagManagement(songId, user, userRoles, availableTags, setDiscussionData);

  const selectedTab = normalizeSongModalTab(activeTab, internalTab);
  const jacketUrl = song?.imageUrl || (song?.imageName ? `${BASE_JACKET_URL}${song.imageName}` : null);
  const typeImage = song?.cardType === 'dx'
    ? new URL('../../../assets/music_dx.png', import.meta.url).href
    : new URL('../../../assets/music_standard.png', import.meta.url).href;

  useEffect(() => {
    if (songId) setInternalTab('overview');
  }, [songId]);

  const handleTabChange = (value) => {
    const nextTab = normalizeSongModalTab(value);
    setInternalTab(nextTab);
    onTabChange?.(nextTab);
  };

  const handleCopyTitle = () => {
    if (!song?.title) return;
    navigator.clipboard.writeText(song.title).then(() => {
      notifications.show({
        title: 'Copied',
        message: `${song.title} copied to clipboard`,
        color: 'green',
        icon: <IconCheck size={16} />,
        autoClose: 2000,
        withCloseButton: false,
      });
    }).catch(() => {
      notifications.show({ title: 'Copy failed', message: 'Could not copy the song title.', color: 'red' });
    });
  };

  const getRelativeTimeCb = useCallback((dateString) => getRelativeTime(dateString), []);

  const handleShowVoters = (commentId, tab) => {
    setSelectedCommentId(commentId);
    setInitialVoterTab(tab);
    setVotersOpened(true);
  };

  const handlePullStart = (event) => {
    const touch = event.touches[0];
    dragStartRef.current = { y: touch.clientY, time: performance.now() };
    setDragging(true);
  };

  const handlePullMove = (event) => {
    const touch = event.touches[0];
    const distance = Math.max(0, touch.clientY - dragStartRef.current.y);
    setDragOffset(Math.min(distance, 240));
  };

  const handlePullEnd = () => {
    const elapsed = Math.max(1, performance.now() - dragStartRef.current.time);
    const velocity = dragOffset / elapsed;
    setDragging(false);

    if (dragOffset >= 88 || (dragOffset >= 36 && velocity >= 0.45)) {
      setDragOffset(0);
      onClose();
      return;
    }

    setDragOffset(0);
  };

  if (!song) return null;

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        aria-label={`${song.title} details`}
        size={isMobile ? 'lg' : 'min(1120px, calc(100vw - 32px))'}
        fullScreen={isMobile}
        radius={isMobile ? 0 : 'md'}
        centered
        padding={0}
        withCloseButton={false}
        transitionProps={{ transition: isMobile ? 'slide-up' : 'fade', duration: 180 }}
        overlayProps={{ backgroundOpacity: 0.62, blur: 3 }}
        classNames={{
          content: `song-detail-modal${isMobile ? ' song-detail-modal--mobile' : ''}`,
          body: 'song-detail-modal__body',
        }}
        styles={{
          content: {
            height: isMobile ? '100dvh' : 'auto',
            maxHeight: isMobile ? '100dvh' : 'calc(100dvh - 32px)',
            transform: isMobile ? `translateY(${dragOffset}px)` : undefined,
            transition: isMobile && dragging ? 'none' : 'transform 180ms ease',
          },
        }}
      >
        {isMobile && (
          <UnstyledButton
            type="button"
            aria-label="Pull down to close song details"
            className="song-detail-modal__pull-handle"
            onClick={(event) => {
              if (event.detail === 0) onClose();
            }}
            onTouchStart={handlePullStart}
            onTouchMove={handlePullMove}
            onTouchEnd={handlePullEnd}
            onTouchCancel={() => {
              setDragging(false);
              setDragOffset(0);
            }}
          >
            <span aria-hidden="true" />
          </UnstyledButton>
        )}

        <Box className="song-detail-hero">
          <Group align="center" wrap="nowrap" gap="md">
            <Image
              src={jacketUrl}
              alt=""
              radius="sm"
              w={100}
              h={100}
              fallbackSrc="https://placehold.co/160x160?text=No+Image"
              className="song-detail-hero__jacket"
            />

            <Box className="song-detail-hero__identity">
              <Tooltip label="Copy title" withArrow>
                <button type="button" className="song-detail-title-button" onClick={handleCopyTitle}>
                  <Text fw={700} className="song-detail-hero__title" lineClamp={2}>
                    {song.title}
                  </Text>
                </button>
              </Tooltip>
              <Text size="sm" c="dimmed" lineClamp={1}>{song.artist}</Text>

              <Group gap="xs" mt="xs" className="song-detail-hero__pills">
                <Badge variant="light" color="blue">{CATEGORY_TRANSLATION[song.category] || song.category}</Badge>
                <Badge variant="light" color="gray">{VERSION_MAPPING[song.version] || song.version}</Badge>
                {song.bpm && <Badge variant="light" color="gray">{song.bpm} BPM</Badge>}
                <img
                  src={typeImage}
                  alt={song.cardType === 'dx' ? 'DX chart' : 'Standard chart'}
                  className="song-detail-format-image"
                />
              </Group>
            </Box>

            <Group gap="xs" wrap="nowrap" className="song-detail-hero__actions">
              <Button
                leftSection={<IconPlaylistAdd size={18} />}
                onClick={() => setAddToPlaylistOpened(true)}
                size={isMobile ? 'compact-sm' : 'sm'}
                className="song-detail-playlist-button"
              >
                {isMobile ? 'Add' : 'Add to Playlist'}
              </Button>
              {!isMobile && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <IconX size={22} />
                </ActionIcon>
              )}
            </Group>
          </Group>
        </Box>

        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          className="song-detail-tabs"
          keepMounted={false}
        >
          <Tabs.List grow={isMobile} className="song-detail-tabs__list">
            <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={16} />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="community" leftSection={<IconMessageCircle size={16} />}>
              Community
            </Tabs.Tab>
          </Tabs.List>

          <Box className="song-detail-tabs__content">
            {error && (
              <Alert icon={<IconAlertCircle size={16} />} title="Could not load community data" color="red" mb="md">
                <Group justify="space-between">
                  <Text size="sm">Ratings, comments, and tags may be unavailable.</Text>
                  <Button
                    size="compact-sm"
                    color="red"
                    variant="light"
                    leftSection={<IconRefresh size={14} />}
                    onClick={loadDiscussion}
                  >
                    Retry
                  </Button>
                </Group>
              </Alert>
            )}

            <Tabs.Panel value="overview">
              <SongOverview song={song} />
            </Tabs.Panel>

            <Tabs.Panel value="community">
              <Grid gutter="lg" className="song-community-layout">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Stack gap="md">
                    <RatingSection
                      discussionData={discussionData}
                      loading={discussionLoading}
                      user={user}
                      isRatingLoading={isRatingLoading}
                      onRatingChange={handleRatingChange}
                    />
                    <TagSection
                      discussionData={discussionData}
                      loading={discussionLoading}
                      user={user}
                      userRoles={userRoles}
                      availableTags={availableTags}
                      isTaggingLoading={isTaggingLoading}
                      newTagValue={newTagValue}
                      setNewTagValue={setNewTagValue}
                      onAddTag={addTag}
                      onRemoveTag={removeTag}
                      onCreateAndAddTag={createAndAddTag}
                      onOpenGlossary={() => setGlossaryOpened(true)}
                      isMobile={isMobile}
                    />
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <CommentSection
                    comments={discussionData.comments}
                    loading={discussionLoading}
                    user={user}
                    userRoles={userRoles}
                    isSubmittingComment={isSubmittingComment}
                    onAddComment={postComment}
                    onDeleteComment={deleteComment}
                    onVoteComment={voteComment}
                    onShowVoters={handleShowVoters}
                    getRelativeTimeCb={getRelativeTimeCb}
                    isMobile={isMobile}
                  />
                </Grid.Col>
              </Grid>
            </Tabs.Panel>
          </Box>
        </Tabs>
      </Modal>

      <AddToPlaylistModal
        opened={addToPlaylistOpened}
        onClose={() => setAddToPlaylistOpened(false)}
        songData={song}
      />

      <Modal
        opened={glossaryOpened}
        onClose={() => setGlossaryOpened(false)}
        title="Tag Glossary"
        size="lg"
        zIndex={310}
      >
        <ScrollArea h={400}>
          <Stack gap="md">
            {availableTags.map((tag) => (
              <Paper key={tag.id} p="sm" withBorder>
                <Text fw={700}>{tag.tag_name}</Text>
                <Text size="sm" c="dimmed">{tag.description || 'No description available.'}</Text>
              </Paper>
            ))}
            {!discussionLoading && availableTags.length === 0 && (
              <Text c="dimmed" ta="center" py="xl">No tags are available yet.</Text>
            )}
            {discussionLoading && <Loader size="sm" />}
          </Stack>
        </ScrollArea>
      </Modal>

      <VoterListModal
        opened={votersOpened}
        onClose={() => setVotersOpened(false)}
        title="Comment Voters"
        fetchVoters={() => discussionService.getSongCommentVoters(selectedCommentId)}
        initialTab={initialVoterTab}
      />
    </>
  );
}

export default SongDetailModal;
