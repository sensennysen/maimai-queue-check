import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { favoritesService } from '../../../services/supabase';

export function useFavorites(userId) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchFavorites = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const favsData = await favoritesService.getFavorites(userId);
        if (mounted) {
          setFavorites(favsData);
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
        notifications.show({
          title: 'Error',
          message: 'Failed to load favorite songs',
          color: 'red'
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchFavorites();
    return () => { mounted = false; };
  }, [userId]);

  const addFavorite = async (song, comment) => {
    if (!song || !userId) return;
    setIsAdding(true);
    const songKey = song.cardId || song.songId;
    
    // Optimistic update
    const newFav = {
      song_id: songKey,
      created_at: new Date().toISOString(),
      comment: comment?.trim() || null
    };

    try {
      setFavorites(prev => [newFav, ...prev]);
      await favoritesService.addFavorite(userId, songKey, comment?.trim() || null);
      
      notifications.show({
        title: 'Added',
        message: `Added ${song.title} to favorites`,
        color: 'green'
      });
      return true;
    } catch (error) {
      console.error(error);
      setFavorites(prev => prev.filter(f => f.song_id !== songKey));
      notifications.show({
        title: 'Error',
        message: 'Failed to add favorite',
        color: 'red'
      });
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const updateComment = async (songId, newComment) => {
    try {
      setFavorites(prev => prev.map(f =>
        f.song_id === songId ? { ...f, comment: newComment } : f
      ));
      await favoritesService.updateFavoriteComment(userId, songId, newComment);
      notifications.show({
        title: 'Updated',
        message: 'Comment updated successfully',
        color: 'green'
      });
      return true;
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update comment',
        color: 'red'
      });
      return false;
    }
  };

  const removeFavorite = async (song) => {
    const songId = song.favoriteId || song.cardId || song.songId;
    const songTitle = song.title;
    
    try {
      setFavorites(prev => prev.filter(f => f.song_id !== songId));
      await favoritesService.removeFavorite(userId, songId);
      notifications.show({
        title: 'Removed',
        message: `Removed ${songTitle} from favorites`,
        color: 'green'
      });
      return true;
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Error',
        message: 'Failed to remove favorite',
        color: 'red'
      });
      return false;
    }
  };

  return {
    favorites,
    setFavorites,
    loading,
    isAdding,
    addFavorite,
    removeFavorite,
    updateComment,
  };
}
