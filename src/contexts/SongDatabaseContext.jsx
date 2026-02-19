import React, { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { songsService } from '../services/songs';
import { SongDatabaseContext } from './SongDatabaseContextDef';

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

  const value = useMemo(() => ({
    songs,
    loading,
    error,
    requestFetch: () => setIsRequested(true),
    refresh: () => {
      songsService.clearCache();
      if (isRequested) {
        // Re-trigger fetch if already requested
        setIsRequested(false);
        setTimeout(() => setIsRequested(true), 0);
      }
    }
  }), [songs, loading, error, isRequested]);

  return (
    <SongDatabaseContext.Provider value={value}>
      {children}
    </SongDatabaseContext.Provider>
  );
}
