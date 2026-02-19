import React, { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { songsService } from '../services/songs';
import { SongDatabaseContext } from './SongDatabaseContextDef';

export function SongDatabaseProvider({ children }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
  }, []);

  const value = useMemo(() => ({
    songs,
    loading,
    error,
    refresh: () => {
      songsService.clearCache();
      // Trigger a re-fetch logic if needed, but usually not required for static DB
    }
  }), [songs, loading, error]);

  return (
    <SongDatabaseContext.Provider value={value}>
      {children}
    </SongDatabaseContext.Provider>
  );
}
