import { useState, useCallback, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Container, Stack, Group, Title, Text, Button, Loader, Alert, Grid, Modal, ScrollArea, Paper } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconAlertCircle, IconRefresh, IconPlaylistAdd } from '@tabler/icons-react';

import { useAuth } from '../hooks/useAuth';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { getRelativeTime } from '../utils/formatters';

// Feature Components
import { SongHeader } from '../features/discussion/components/SongHeader';
import { ChartDetailsTable } from '../features/discussion/components/ChartDetailsTable';
import { RatingSection } from '../features/discussion/components/RatingSection';
import { TagSection } from '../features/discussion/components/TagSection';
import { CommentSection } from '../features/discussion/components/CommentSection';

// Feature Hooks
import { useSongDiscussion } from '../features/discussion/hooks/useSongDiscussion';
import { useTagManagement } from '../features/discussion/hooks/useTagManagement';

// Modals
import { AddToPlaylistModal } from '../components/modals/AddToPlaylistModal';
import { VoterListModal } from '../components/common/VoterListModal';
import { discussionService } from '../services/supabase';

export default function SongDiscussionPage() {
  const { id } = useParams();
  const { songs, songMapById, loading: songsLoading } = useSongDatabaseContext();
  const { user, userRoles } = useAuth();
  const location = useLocation();
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isMobileOrTablet = useMediaQuery('(max-width: 991px)');

  // Discussion state and logic
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
    voteComment
  } = useSongDiscussion(id, user, userRoles);

  // Tagging state and logic
  const {
    isTaggingLoading,
    newTagValue,
    setNewTagValue,
    addTag,
    removeTag,
    createAndAddTag
  } = useTagManagement(id, user, userRoles, availableTags, setDiscussionData);

  // Local UI State
  const [addToPlaylistOpened, setAddToPlaylistOpened] = useState(false);
  const [glossaryOpened, setGlossaryOpened] = useState(false);
  const [votersOpened, setVotersOpened] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [initialVoterTab, setInitialVoterTab] = useState('likes');

  const baseSong = songMapById?.get(id);
  const activeCardType = location.state?.cardType || baseSong?.cardType;

  const song = useMemo(() => {
    if (!songs || !baseSong) return null;
    if (activeCardType && baseSong.cardType !== activeCardType) {
      return songs.find(s => s.songId === baseSong.songId && s.cardType === activeCardType) || baseSong;
    }
    return baseSong;
  }, [songs, baseSong, activeCardType]);

  const getRelativeTimeCb = useCallback((dateString) => getRelativeTime(dateString), []);

  const handleShowVoters = (commentId, tab) => {
    setSelectedCommentId(commentId);
    setInitialVoterTab(tab);
    setVotersOpened(true);
  };

  if (songsLoading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" style={{ minHeight: '60vh' }}>
          <Loader size="xl" color="pink" type="bars" />
          <Text c="dimmed">Loading song details...</Text>
        </Stack>
      </Container>
    );
  }

  if (!song) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" gap="md">
          <Title order={2}>Song Not Found</Title>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl" className="animate-fade-in">
      <Stack gap="xl">
        <Group justify="space-between">
          <Button
            variant="light"
            color="teal"
            leftSection={<IconPlaylistAdd size={16} />}
            onClick={() => setAddToPlaylistOpened(true)}
          >
            Add to Playlist
          </Button>
        </Group>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            <Group justify="space-between" align="center">
              <Text size="sm">Failed to load discussion data. Please try again.</Text>
              <Button size="sm" color="red" variant="light" leftSection={<IconRefresh size={14} />} onClick={loadDiscussion}>
                Retry
              </Button>
            </Group>
          </Alert>
        )}

        <SongHeader 
          song={song} 
          activeCardType={activeCardType} 
          isMobileOrTablet={isMobileOrTablet} 
        />

        <ChartDetailsTable 
          currentSheets={song.sheets} 
          isMobile={isMobile} 
        />

        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="lg">
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
            />
          </Grid.Col>
        </Grid>
      </Stack>

      {/* Shared Modals */}
      <AddToPlaylistModal 
        opened={addToPlaylistOpened} 
        onClose={() => setAddToPlaylistOpened(false)} 
        songId={id} 
      />

      <Modal opened={glossaryOpened} onClose={() => setGlossaryOpened(false)} title="Tag Glossary" size="lg">
        <ScrollArea h={400}>
          <Stack gap="md">
            {availableTags.map(tag => (
              <Paper key={tag.id} p="sm" withBorder>
                <Text fw={700}>{tag.tag_name}</Text>
                <Text size="sm" c="dimmed">{tag.description || 'No description available.'}</Text>
              </Paper>
            ))}
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
    </Container>
  );
}
