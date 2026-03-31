import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { userService } from '../services/supabase';

const DEFAULT_MIN_CHARS = 2;
const DEFAULT_PROFILE_LIMIT = 5;
const DEFAULT_SONG_LIMIT = 5;

export function useSearchSuggestions(query, songs, options = {}) {
  const {
    minChars = DEFAULT_MIN_CHARS,
    profileLimit = DEFAULT_PROFILE_LIMIT,
    songLimit = DEFAULT_SONG_LIMIT,
    includeProfiles = true,
  } = options;

  const trimmedQuery = query.trim();
  const [debouncedQuery] = useDebouncedValue(trimmedQuery, 200);
  const [profileSuggestions, setProfileSuggestions] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!includeProfiles || debouncedQuery.length < minChars) {
      setProfileSuggestions([]);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setProfileLoading(true);
        const results = await userService.searchPublicProfiles(debouncedQuery, profileLimit);
        if (!cancelled) {
          setProfileSuggestions(results);
        }
      } catch {
        if (!cancelled) {
          setProfileSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, includeProfiles, minChars, profileLimit]);

  const songSuggestions = useMemo(() => {
    if (debouncedQuery.length < minChars) return [];

    const normalizedQuery = debouncedQuery.toLowerCase();
    const seen = new Set();
    const matches = [];

    for (const song of songs || []) {
      if (!song?.title || !song.songId) continue;

      const haystack = `${song.title} ${song.artist || ''}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) continue;
      if (seen.has(song.songId)) continue;

      seen.add(song.songId);
      matches.push(song);

      if (matches.length >= songLimit) break;
    }

    return matches;
  }, [debouncedQuery, minChars, songLimit, songs]);

  return {
    debouncedSuggestionQuery: debouncedQuery,
    profileSuggestions,
    profileLoading,
    songSuggestions,
    hasSuggestions: profileLoading || profileSuggestions.length > 0 || songSuggestions.length > 0,
    canSuggest: debouncedQuery.length >= minChars,
  };
}
