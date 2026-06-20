import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { discussionService } from '../../../services/supabase';

/**
 * Hook to manage song discussion data (ratings, comments, tags)
 * @param {string} songId - The ID of the song
 * @param {object} user - The current user object from useAuth
 * @param {object} userRoles - The current user's roles/profile from useAuth
 */
export function useSongDiscussion(songId, user, userRoles) {
  const [discussionData, setDiscussionData] = useState({ ratings: [], comments: [], tags: [] });
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const loadDiscussion = useCallback(async () => {
    if (!songId) return;
    try {
      setError(null);
      setLoading(true);
      const [data, tags] = await Promise.all([
        discussionService.getSongDiscussionData(songId),
        discussionService.getAvailableTags(userRoles?.is_super_admin)
      ]);
      setDiscussionData(data);
      setAvailableTags(tags);
    } catch (err) {
      console.error('Failed to load discussion data', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [songId, userRoles]);

  useEffect(() => {
    loadDiscussion();
  }, [loadDiscussion]);

  const handleRatingChange = async (val) => {
    if (!user) return;
    setIsRatingLoading(true);
    try {
      if (val === 0) {
        await discussionService.removeSongRating(songId, user.id);
        setDiscussionData(prev => ({
          ...prev,
          ratings: prev.ratings.filter(r => r.user_id !== user.id)
        }));
      } else {
        await discussionService.upsertSongRating(songId, user.id, val);
        setDiscussionData(prev => {
          const existing = prev.ratings.find(r => r.user_id === user.id);
          if (existing) {
            return {
              ...prev,
              ratings: prev.ratings.map(r => r.user_id === user.id ? { ...r, rating: val } : r)
            };
          }
          return {
            ...prev,
            ratings: [...prev.ratings, { user_id: user.id, rating: val }]
          };
        });
      }
    } catch (err) {
      console.error('Failed to update rating', err);
      notifications.show({ title: 'Error', message: 'Failed to update rating.', color: 'red' });
    } finally {
      setIsRatingLoading(false);
    }
  };

  const postComment = async (content) => {
    if (!user || !content.trim()) return;
    setIsSubmittingComment(true);
    try {
      const newComment = await discussionService.addComment(songId, user.id, content.trim());
      setDiscussionData(prev => ({
        ...prev,
        comments: [{ ...newComment, song_comment_votes: [] }, ...prev.comments]
      }));
      notifications.show({
        title: 'Comment Added', message: 'Your comment has been posted.', color: 'green'
      });
      return true;
    } catch (err) {
      console.error('Failed to post comment', err);
      notifications.show({
        title: 'Error', message: 'Failed to post comment.', color: 'red'
      });
      return false;
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!user) return;
    try {
      await discussionService.deleteComment(commentId, user.id);
      setDiscussionData(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId)
      }));
      notifications.show({ title: 'Comment Deleted', message: 'Comment has been removed.', color: 'green' });
    } catch (err) {
      console.error('Failed to delete comment', err);
      notifications.show({ title: 'Error', message: 'Failed to delete comment.', color: 'red' });
    }
  };

  const voteComment = async (commentId, nextVote) => {
    if (!user) return;
    try {
      await discussionService.voteComment(commentId, user.id, nextVote);
      setDiscussionData(prev => ({
        ...prev,
        comments: prev.comments.map(c => {
          if (c.id !== commentId) return c;
          const filteredVotes = (c.song_comment_votes || []).filter(v => v.user_id !== user.id);
          if (nextVote !== 0) {
            filteredVotes.push({ 
              user_id: user.id, 
              vote_type: nextVote, 
              user_profiles: { 
                display_name: userRoles?.display_name || 'You', 
                display_photo_url: userRoles?.display_photo_url 
              } 
            });
          }
          return { ...c, song_comment_votes: filteredVotes };
        })
      }));
    } catch (err) {
      console.error('Failed to vote', err);
      notifications.show({ title: 'Error', message: 'Failed to submit vote.', color: 'red' });
    }
  };

  return {
    discussionData,
    setDiscussionData,
    availableTags,
    loading,
    error,
    isRatingLoading,
    isSubmittingComment,
    loadDiscussion,
    handleRatingChange,
    postComment,
    deleteComment,
    voteComment
  };
}
