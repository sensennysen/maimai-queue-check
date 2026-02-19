import { useContext, useEffect } from 'react';
import { SongDatabaseContext } from '../contexts/SongDatabaseContextDef';

export function useSongDatabaseContext() {
  const context = useContext(SongDatabaseContext);
  if (!context) {
    throw new Error('useSongDatabaseContext must be used within a SongDatabaseProvider');
  }

  // Automatically request fetch when the context is accessed
  // We use useEffect to avoid side effects during render
  const { requestFetch } = context;
  useEffect(() => {
    requestFetch();
  }, [requestFetch]);

  return context;
}


