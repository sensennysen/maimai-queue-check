import { useState, useEffect, useCallback, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { playlistService } from '../../../services/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useSongDatabaseContext } from '../../../hooks/useSongDatabaseContext';

/**
 * Hook to manage shared playlists, including fetching, scrolling to specific posts, 
 * editing captions, deleting posts, and toggling comments.
 */
export function useSharedPlaylists(initialFocusPostId, initialFocusPlaylistId) {
  const { user } = useAuth();
  const { songMapById } = useSongDatabaseContext();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const scrolledToPostRef = useRef(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await playlistService.getSharedPlaylists();
      setPosts(data || []);
    } catch (err) {
      console.error('Failed to load shared playlists:', err);
      setError(err.message || 'Failed to load community playlists');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle auto-scrolling to a specific post or playlist from URL params
  useEffect(() => {
    if ((!initialFocusPostId && !initialFocusPlaylistId) || loading || posts.length === 0) return;

    let targetPostId = initialFocusPostId;
    let scrollKey = initialFocusPostId;

    if (!targetPostId && initialFocusPlaylistId) {
      const targetPost = posts.find(p => p.playlist?.id === initialFocusPlaylistId);
      if (targetPost) {
        targetPostId = targetPost.id;
        scrollKey = `pl-${initialFocusPlaylistId}`;
      }
    }

    if (!targetPostId || scrolledToPostRef.current === scrollKey) return;

    // We use a small timeout to ensure the DOM has rendered
    const timer = setTimeout(() => {
      const el = document.getElementById(`playlist-post-${targetPostId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        scrolledToPostRef.current = scrollKey;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [initialFocusPostId, initialFocusPlaylistId, loading, posts]);

  const getPlaylistSongs = useCallback((playlist) => {
    if (!playlist || !playlist.songs) return [];
    return playlist.songs
      .map(entry => {
        const fullSong = songMapById?.get(entry.song_id);
        if (!fullSong) return null;
        return { ...fullSong, level: entry.level }; // Inject level from DB
      })
      .filter(Boolean);
  }, [songMapById]);

  const handleToggleComments = useCallback(async (postId, currentStatus) => {
    try {
      await playlistService.togglePostComments(postId, !currentStatus);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_enabled: !currentStatus } : p));
      notifications.show({ title: 'Updated', message: `Comments ${!currentStatus ? 'enabled' : 'disabled'} successfully`, color: 'blue' });
    } catch (err) {
      console.error('Failed to toggle comments:', err);
      notifications.show({ title: 'Error', message: 'Failed to update comment settings', color: 'red' });
    }
  }, []);

  const handlePostDelete = useCallback(async (postId) => {
    if (!window.confirm('Are you sure you want to remove this post from the feed?')) return;
    try {
      await playlistService.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      notifications.show({ title: 'Deleted', message: 'Post removed from feed', color: 'blue' });
    } catch (err) {
      console.error('Failed to delete post:', err);
      notifications.show({ title: 'Error', message: 'Failed to remove post', color: 'red' });
    }
  }, []);

  const handleStartEdit = useCallback((post) => {
    setEditingPostId(post.id);
    setEditContent(post.content || '');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingPostId(null);
    setEditContent('');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (savingEdit || !editingPostId) return;

    try {
      setSavingEdit(true);
      await playlistService.updatePostContent(editingPostId, editContent);
      setPosts(prev => prev.map(p => p.id === editingPostId ? { ...p, content: editContent.trim() || null } : p));
      notifications.show({ title: 'Success', message: 'Caption updated', color: 'green' });
      handleCancelEdit();
    } catch (err) {
      console.error('Failed to update caption:', err);
      notifications.show({ title: 'Error', message: 'Failed to update caption', color: 'red' });
    } finally {
      setSavingEdit(false);
    }
  }, [editingPostId, editContent, savingEdit, handleCancelEdit]);

  const handlePlaylistDelete = useCallback(async (playlistId) => {
    try {
      await playlistService.deletePlaylist(playlistId);
      setPosts(prev => prev.filter(p => p.playlist?.id !== playlistId));
      notifications.show({ title: 'Deleted', message: 'Playlist removed successfully', color: 'blue' });
      return true;
    } catch (err) {
      console.error('Failed to delete playlist:', err);
      notifications.show({ title: 'Error', message: 'Failed to delete playlist', color: 'red' });
      return false;
    }
  }, []);

  return {
    posts,
    loading,
    error,
    user,
    editingPostId,
    editContent,
    setEditContent,
    savingEdit,
    fetchPosts,
    getPlaylistSongs,
    handleToggleComments,
    handlePostDelete,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handlePlaylistDelete
  };
}
