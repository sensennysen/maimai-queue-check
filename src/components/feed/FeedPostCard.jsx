import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Group,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import IconArrowRight from '@tabler/icons-react/dist/esm/icons/IconArrowRight.mjs';
import { feedService } from '../../services/supabase';
import { getProfileImageUrl, getRelativeTime } from '../../utils/formatters';
import { ImagePreviewModal } from '../common/ImagePreviewModal';
import DeleteConfirmDialog from '../modals/DeleteConfirmDialog';
import { FeedPostDetailModal } from './FeedPostDetailModal';
import { FeedPostSurface } from './FeedPostSurface';
import '../../pages/FeedPage.css';

const MAX_CHARS = 500;

export function FeedPostCard({ post, currentUser, profileData, onDelete, onUpdate, className }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpened, setDeleteConfirmOpened] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detailOpened, setDetailOpened] = useState(false);
  const [likes, setLikes] = useState(post.like_count ?? 0);
  const [dislikes, setDislikes] = useState(post.dislike_count ?? 0);
  const [userVote, setUserVote] = useState(post.user_vote ?? 0);
  const [voting, setVoting] = useState(false);
  const [imagePreviewOpened, setImagePreviewOpened] = useState(false);
  const [imagePreviewSrc, setImagePreviewSrc] = useState(null);
  const [imagePreviewAlt, setImagePreviewAlt] = useState('Post image');
  const [latestComment, setLatestComment] = useState(null);
  const [commentCount, setCommentCount] = useState(post.comment_count ?? 0);
  const [previewVoting, setPreviewVoting] = useState(false);
  const [threadVersion, setThreadVersion] = useState(0);

  const isOwn = currentUser && post.author?.id === currentUser.id;
  const editRemaining = MAX_CHARS - editContent.length;

  const handleSaveEdit = useCallback(async () => {
    const trimmed = editContent.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const updated = await feedService.updateFeedPost(post.id, currentUser.id, trimmed);
      onUpdate?.(post.id, updated.content);
      setEditing(false);
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to update post.', color: 'red' });
    } finally {
      setSaving(false);
    }
  }, [currentUser?.id, editContent, onUpdate, post.id, saving]);

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await feedService.deleteFeedPost(post.id, currentUser.id);
      setDeleteConfirmOpened(false);
      setDetailOpened(false);
      onDelete?.(post.id);
      notifications.show({ title: 'Deleted', message: 'Post removed.', color: 'blue', autoClose: 2000 });
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to delete post.', color: 'red' });
    } finally {
      setDeleting(false);
    }
  }, [currentUser?.id, deleting, onDelete, post.id]);

  const handleVote = useCallback(async (type) => {
    if (!currentUser) {
      notifications.show({ title: 'Login required', message: 'Please log in to vote on posts.', color: 'blue' });
      return;
    }
    if (voting) return;

    const oldVote = userVote;
    const newVote = oldVote === type ? 0 : type;

    setUserVote(newVote);
    if (oldVote === 1) setLikes((value) => value - 1);
    if (oldVote === -1) setDislikes((value) => value - 1);
    if (newVote === 1) setLikes((value) => value + 1);
    if (newVote === -1) setDislikes((value) => value + 1);

    setVoting(true);
    try {
      await feedService.voteFeedPost(post.id, currentUser.id, newVote);
    } catch {
      setUserVote(oldVote);
      if (oldVote === 1) setLikes((value) => value + 1);
      if (oldVote === -1) setDislikes((value) => value + 1);
      if (newVote === 1) setLikes((value) => value - 1);
      if (newVote === -1) setDislikes((value) => value - 1);
      notifications.show({ title: 'Error', message: 'Failed to update vote.', color: 'red' });
    } finally {
      setVoting(false);
    }
  }, [currentUser, post.id, userVote, voting]);

  const openImagePreview = useCallback((src, altText) => {
    setImagePreviewSrc(src);
    setImagePreviewAlt(altText || 'Post image');
    setImagePreviewOpened(true);
  }, []);

  const handlePreviewLike = useCallback(async () => {
    if (!latestComment || previewVoting) return;
    if (!currentUser) {
      notifications.show({ title: 'Login required', message: 'Please log in to like comments.', color: 'blue' });
      return;
    }

    const oldComment = latestComment;
    const oldVote = latestComment.user_vote || 0;
    const newVote = oldVote === 1 ? 0 : 1;
    setLatestComment((comment) => ({
      ...comment,
      user_vote: newVote,
      like_count: Math.max(0, (comment.like_count || 0) + (oldVote === 1 ? -1 : 1)),
      dislike_count: Math.max(0, (comment.dislike_count || 0) - (oldVote === -1 ? 1 : 0)),
    }));

    setPreviewVoting(true);
    try {
      await feedService.voteFeedPostComment(latestComment.id, currentUser.id, newVote);
      setThreadVersion((version) => version + 1);
    } catch {
      setLatestComment(oldComment);
      notifications.show({ title: 'Error', message: 'Failed to update comment like.', color: 'red' });
    } finally {
      setPreviewVoting(false);
    }
  }, [currentUser, latestComment, previewVoting]);

  const handleCommentCountChange = useCallback((nextCount) => {
    setCommentCount((currentCount) => (
      typeof nextCount === 'function' ? nextCount(currentCount) : nextCount
    ));
  }, []);

  useEffect(() => {
    setCommentCount(post.comment_count ?? 0);
  }, [post.comment_count]);

  useEffect(() => {
    let cancelled = false;

    const fetchLatestComment = async () => {
      if (!post?.id || commentCount <= 0) {
        setLatestComment(null);
        return;
      }
      try {
        const comments = await feedService.getFeedPostComments(post.id, currentUser?.id, 1, false);
        if (!cancelled) setLatestComment(comments?.[0] || null);
      } catch {
        if (!cancelled) setLatestComment(null);
      }
    };

    fetchLatestComment();
    return () => {
      cancelled = true;
    };
  }, [commentCount, currentUser?.id, post?.id, threadVersion]);

  const postSurfaceProps = useMemo(() => ({
    post,
    isOwn,
    editing,
    editContent,
    editRemaining,
    saving,
    onEditContentChange: setEditContent,
    onStartEdit: () => {
      setEditContent(post.content || '');
      setEditing(true);
    },
    onCancelEdit: () => setEditing(false),
    onSaveEdit: handleSaveEdit,
    onDelete: () => setDeleteConfirmOpened(true),
    onOpenImage: openImagePreview,
    likes,
    dislikes,
    userVote,
    voting,
    onVote: handleVote,
    commentCount,
    onOpenComments: () => setDetailOpened(true),
  }), [
    commentCount,
    dislikes,
    editContent,
    editRemaining,
    editing,
    handleSaveEdit,
    handleVote,
    isOwn,
    likes,
    openImagePreview,
    post,
    saving,
    userVote,
    voting,
  ]);

  return (
    <>
      <FeedPostSurface {...postSurfaceProps} className={className}>
        {latestComment && (
          <Box
            component="article"
            className="community-post-comment-preview"
            aria-label={`Comment from ${latestComment.author?.display_name || 'Someone'}`}
          >
            <Avatar
              src={getProfileImageUrl(latestComment.author)}
              size={30}
              radius="md"
              color="primary"
              className="community-post-comment-avatar"
            >
              {(latestComment.author?.display_name || '?').charAt(0)}
            </Avatar>

            <Box className="community-post-comment-content">
              <Group gap={8} wrap="nowrap" className="community-post-comment-header">
                <Text size="sm" fw={650} lineClamp={1}>
                  {latestComment.author?.display_name || 'Someone'}
                </Text>
                <Text
                  component="time"
                  size="xs"
                  c="dimmed"
                  title={new Date(latestComment.created_at).toLocaleString()}
                >
                  {getRelativeTime(latestComment.created_at)}
                </Text>
              </Group>
              <Text size="sm" className="community-post-comment-body community-post-comment-body--preview">
                {latestComment.content}
              </Text>
              <Group gap="md" mt={6}>
                <UnstyledButton
                  type="button"
                  className="community-post-comment-like"
                  onClick={handlePreviewLike}
                  disabled={previewVoting}
                  aria-pressed={latestComment.user_vote === 1}
                  aria-label={`Like comment, ${latestComment.like_count || 0} likes`}
                >
                  {latestComment.user_vote === 1 ? 'Liked' : 'Like'}
                  {(latestComment.like_count || 0) > 0 ? ` · ${latestComment.like_count}` : ''}
                </UnstyledButton>
              </Group>
            </Box>
          </Box>
        )}

        {commentCount > 1 && (
          <UnstyledButton
            type="button"
            className="community-post-view-comments"
            onClick={() => setDetailOpened(true)}
            aria-haspopup="dialog"
            aria-label="View all comments on this post"
          >
            <span>View all comments</span>
            <IconArrowRight size={15} stroke={1.8} aria-hidden="true" />
          </UnstyledButton>
        )}

      </FeedPostSurface>

      <FeedPostDetailModal
        opened={detailOpened}
        onClose={() => setDetailOpened(false)}
        post={post}
        currentUser={currentUser}
        profileData={profileData}
        postSurfaceProps={postSurfaceProps}
        onCountChange={handleCommentCountChange}
        onCommentsChanged={(added) => {
          if (added) {
            setLatestComment({ ...added, like_count: 0, dislike_count: 0, user_vote: 0 });
          }
          setThreadVersion((version) => version + 1);
        }}
      />

      <DeleteConfirmDialog
        opened={deleteConfirmOpened}
        onClose={() => {
          if (!deleting) setDeleteConfirmOpened(false);
        }}
        onConfirm={handleDelete}
        title="Delete post?"
        message="This post and its comments will be permanently removed."
        loading={deleting}
        confirmLabel="Delete post"
      />

      {imagePreviewOpened && (
        <ImagePreviewModal
          opened={imagePreviewOpened}
          onClose={() => {
            setImagePreviewOpened(false);
            setImagePreviewSrc(null);
          }}
          src={imagePreviewSrc}
          alt={imagePreviewAlt}
          caption={null}
        />
      )}
    </>
  );
}
