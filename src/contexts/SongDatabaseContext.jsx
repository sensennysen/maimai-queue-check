import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { songsService } from '../services/songs';
import { SongDatabaseContext } from './SongDatabaseContextDef';

/**
 * Provider component for the global Song Database context.
 * Manages fetching, caching, and indexing of the maimai song database.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to be wrapped by the provider.
 * @returns {JSX.Element} The rendered context provider.
 */
export function SongDatabaseProvider({ children }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRequested, setIsRequested] = useState(false);

  useEffect(() => {
    if (!isRequested) return;

    const fetchSongs = async () => {
      try {
        setLoading(true);
        const data = await songsService.getFullSongDatabase();
        setSongs(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load song database:', err);
        setError(err);
        notifications.show({
          title: 'Database Error',
          message: 'Failed to load maimai song database. Some features may be limited.',
          color: 'red'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [isRequested]);

  const [songMapById, songMapByTitle] = useMemo(() => {
    const byId = new Map();
    const byTitle = new Map();
    for (const song of songs) {
      if (song.cardId) byId.set(song.cardId, song);
      // Fallback for older saves that only used songId
      if (song.songId && !byId.has(song.songId)) byId.set(song.songId, song);

      if (song.title) byTitle.set(song.title, song);
    }
    return [byId, byTitle];
  }, [songs]);

  /**
   * Sets the request flag to true, triggering the initial database fetch.
   * @returns {void}
   */
  const requestFetch = useCallback(() => setIsRequested(true), []);

  /**
   * Clears the song database cache and re-triggers a fresh fetch from the server.
   * @returns {void}
   */
  const refresh = useCallback(() => {
    songsService.clearCache();
    setIsRequested(prev => {
      if (prev) {
        // Re-trigger fetch: flip to false then back to true
        setTimeout(() => setIsRequested(true), 0);
        return false;
      }
      return prev;
    });
  }, []);

  const value = useMemo(() => ({
    songs,
    songMapById,
    songMapByTitle,
    loading,
    error,
    requestFetch,
    refresh,
  }), [songs, songMapById, songMapByTitle, loading, error, requestFetch, refresh]);

  return (
    <SongDatabaseContext.Provider value={value}>
      {children}
    </SongDatabaseContext.Provider>
  );
}
