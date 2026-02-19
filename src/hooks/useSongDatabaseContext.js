import { useContext } from 'react';
import { SongDatabaseContext } from '../contexts/SongDatabaseContextDef';

export function useSongDatabaseContext() {
  const context = useContext(SongDatabaseContext);
  if (!context) {
    throw new Error('useSongDatabaseContext must be used within a SongDatabaseProvider');
  }
  return context;
}
