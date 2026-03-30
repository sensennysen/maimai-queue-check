import { useState, useEffect, useRef } from 'react';
import { userService } from '../../../services/supabase';
import { songsService } from '../../../services/songs';

export function useRecentPlays(userId, initialData) {
  const [plays, setPlays] = useState(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [songMap, setSongMap] = useState(new Map());
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    async function init() {
      try {
        if (isMounted.current) setLoading(true);
        // Load plays and song database in parallel
        const [playsData, songs] = await Promise.all([
          initialData ? Promise.resolve(initialData) : userService.getRecentPlays(userId),
          songsService.getFullSongDatabase()
        ]);

        if (isMounted.current) {
          if (playsData) setPlays(playsData);

          // Build map for image lookup
          const map = new Map();
          songs.forEach(s => map.set(s.title, s.imageUrl));
          setSongMap(map);
        }
      } catch (err) {
        console.error('Failed to initialize recent plays:', err);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    }
    if (userId) init();
  }, [userId, initialData]);

  return { plays, loading, songMap };
}
