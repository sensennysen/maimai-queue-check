import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Box,
  Modal,
  Skeleton,
  Text,
  Textarea,
  UnstyledButton,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import IconSend from '@tabler/icons-react/dist/esm/icons/IconSend.mjs';
import { feedService } from '../../services/supabase';
import { getProfileImageUrl } from '../../utils/formatters';
import { usePostComments } from '../../features/feed/hooks/usePostComments';
import { CommentRow } from './CommentRow';
import { FeedPostSurface } from './FeedPostSurface';
import { VoterListModal } from '../common/VoterListModal';

export function FeedPostDetailModal({
  opened,
  onClose,
  post,
  currentUser,
  profileData,
  postSurfaceProps,
  onCountChange,
  onCommentsChanged,
}) {
  const navigate = useNavigate();
  const fullScreen = useMediaQuery('(max-width: 48em)');
  const composerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const historyMarkerRef = useRef(null);
  const dragStartRef = useRef({ y: 0, time: 0 });
  const [newComment, setNewComment] = useState('');
  const [votersOpened, setVotersOpened] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const {
    comments,
    loading,
    submitting,
    votingId,
    addComment,
    deleteComment,
    voteComment,
  } = usePostComments(post.id, currentUser, onCountChange, 0, opened);

  const title = `${post.author?.display_name || 'Unknown'}'s post`;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!opened) return undefined;

    let marker = historyMarkerRef.current;
    if (!marker || window.history.state?.postDetailModal !== marker) {
      marker = `post-${post.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      historyMarkerRef.current = marker;
      window.history.pushState(
        { ...window.history.state, postDetailModal: marker },
        '',
        window.location.href
      );
    }

    const handlePopState = () => {
      if (historyMarkerRef.current !== marker) return;
      historyMarkerRef.current = null;
      setDragOffset(0);
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [opened, post.id]);

  useEffect(() => {
    if (opened) return;

    const marker = historyMarkerRef.current;
    if (marker && window.history.state?.postDetailModal === marker) {
      historyMarkerRef.current = null;
      window.history.back();
    }
  }, [opened]);

  const requestClose = useCallback(() => {
    const marker = historyMarkerRef.current;
    if (marker && window.history.state?.postDetailModal === marker) {
      window.history.back();
      return;
    }

    historyMarkerRef.current = null;
    setDragOffset(0);
    onCloseRef.current();
  }, []);

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
      requestClose();
      return;
    }

    setDragOffset(0);
  };

  const handleSubmit = async () => {
    const added = await addComment(newComment);
    if (!added) return;
    setNewComment('');
    onCommentsChanged?.(added);
  };

  const handleDelete = async (commentId) => {
    const deleted = await deleteComment(commentId);
    if (deleted) onCommentsChanged?.();
  };

  const handleVote = async (commentId) => {
    await voteComment(commentId, 1);
    onCommentsChanged?.();
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={requestClose}
        aria-label={title}
        size="lg"
        centered
        fullScreen={fullScreen}
        overlayProps={{ backgroundOpacity: 0.72, blur: 2 }}
        classNames={{
          root: 'post-detail-modal',
          content: 'post-detail-modal__content',
          body: 'post-detail-modal__body',
        }}
        styles={{
          content: fullScreen ? {
            transform: `translateY(${dragOffset}px)`,
            transition: dragging ? 'none' : 'transform 180ms ease',
          } : undefined,
        }}
        withCloseButton={false}
        trapFocus
        returnFocus
        closeOnEscape
        closeOnClickOutside
      >
        {fullScreen && (
          <UnstyledButton
            type="button"
            aria-label="Pull down to close post"
            className="post-detail-modal__pull-handle"
            onClick={(event) => {
              if (event.detail === 0) requestClose();
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

        <Box className="post-detail-modal__layout">
          <Box className="post-detail-modal__scroll">
            <FeedPostSurface
              {...postSurfaceProps}
              className="post-detail-modal__post"
              onOpenComments={() => composerRef.current?.focus()}
            />

            <Box className="post-detail-modal__comments">
              <Text size="sm" c="dimmed" className="post-detail-modal__comment-count">
                {comments.length === 0 && !loading
                  ? 'No comments yet'
                  : `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`}
              </Text>

              {loading ? (
                <Box aria-label="Loading comments" aria-busy="true" className="post-detail-modal__loading">
                  <Skeleton height={72} radius="md" />
                  <Skeleton height={72} radius="md" />
                </Box>
              ) : comments.length > 0 ? (
                <Box component="ul" className="post-detail-modal__comment-list">
                  {comments.map((comment) => (
                    <Box component="li" key={comment.id}>
                      <CommentRow
                        comment={comment}
                        currentUser={currentUser}
                        navigate={navigate}
                        handleVote={handleVote}
                        handleDelete={handleDelete}
                        votingId={votingId}
                        onVotersClick={(commentId) => {
                          setSelectedCommentId(commentId);
                          setVotersOpened(true);
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : null}
            </Box>
          </Box>

          <Box className="post-detail-modal__composer">
            <Avatar
              src={getProfileImageUrl(profileData || currentUser)}
              size={30}
              radius="md"
              color="primary"
            >
              {(profileData?.display_name || currentUser?.display_name || '?').charAt(0)}
            </Avatar>
            <Textarea
              ref={composerRef}
              aria-label="Write a comment"
              placeholder={currentUser ? 'Write a comment...' : 'Log in to comment'}
              value={newComment}
              onChange={(event) => setNewComment(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              minRows={1}
              autosize
              maxRows={4}
              maxLength={300}
              disabled={!currentUser || submitting}
              className="post-detail-modal__input"
            />
            <ActionIcon
              type="button"
              aria-label="Post comment"
              variant="subtle"
              color="primary"
              size="lg"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!currentUser || !newComment.trim()}
            >
              <IconSend size={17} />
            </ActionIcon>
          </Box>
        </Box>
      </Modal>

      <VoterListModal
        opened={votersOpened}
        onClose={() => setVotersOpened(false)}
        title="Comment likes"
        fetchVoters={() => feedService.getFeedPostCommentVoters(selectedCommentId)}
        initialTab="likes"
      />
    </>
  );
}
