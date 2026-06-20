import { useState, useEffect, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { feedService } from '../../../services/supabase';

export function usePostComments(postId, currentUser, onCountChange, refreshKey = 0, enabled = true) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await feedService.getFeedPostComments(postId, currentUser?.id);
      setComments(data);
      onCountChange?.(data.length);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [postId, currentUser?.id, onCountChange]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load, refreshKey]);

  const addComment = async (content) => {
    const trimmed = content.trim();
    if (!trimmed || submitting || !currentUser) return;
    setSubmitting(true);
    try {
      const added = await feedService.addFeedPostComment(postId, currentUser.id, trimmed);
      setComments(prev => [...prev, added]);
      onCountChange?.(c => c + 1);
      return added;
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to post comment.', color: 'red' });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await feedService.deleteFeedPostComment(commentId, currentUser.id);
      setComments(prev => prev.filter(c => c.id !== commentId));
      onCountChange?.(cnt => Math.max(0, cnt - 1));
      return true;
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to delete comment.', color: 'red' });
      return false;
    }
  };

  const voteComment = async (commentId, type) => {
    if (!currentUser) {
      notifications.show({ title: 'Login required', message: 'Please log in to vote on comments.', color: 'blue' });
      return;
    }
    if (votingId) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const oldVote = comment.user_vote;
    const newVote = oldVote === type ? 0 : type;

    // Optimistic UI update
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const updated = { ...c, user_vote: newVote };
      if (oldVote === 1) updated.like_count--;
      if (oldVote === -1) updated.dislike_count--;
      if (newVote === 1) updated.like_count++;
      if (newVote === -1) updated.dislike_count++;
      return updated;
    }));

    setVotingId(commentId);
    try {
      await feedService.voteFeedPostComment(commentId, currentUser.id, newVote);
    } catch {
      // Rollback
      setComments(prev => prev.map(c => {
        if (c.id !== commentId) return c;
        const rolledBack = { ...c, user_vote: oldVote };
        if (oldVote === 1) rolledBack.like_count++;
        if (oldVote === -1) rolledBack.dislike_count++;
        if (newVote === 1) rolledBack.like_count--;
        if (newVote === -1) rolledBack.dislike_count--;
        return rolledBack;
      }));
      notifications.show({ title: 'Error', message: 'Failed to update vote.', color: 'red' });
    } finally {
      setVotingId(null);
    }
  };

  return {
    comments,
    setComments,
    loading,
    submitting,
    votingId,
    addComment,
    deleteComment,
    voteComment
  };
}
