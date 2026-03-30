import { useState, useEffect, useMemo } from 'react';
import { userService, playlistService } from '../services/supabase';
import { buildSongMatchIds, normalizeSongId } from '../utils/song-helpers';

const PROFILE_LIMIT = 12;
const SONG_LIMIT = 24;

export function useSearch(debouncedQuery, typeFilter, songs) {
  const [profileResults, setProfileResults] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState(null);

  const [playlistGroups, setPlaylistGroups] = useState({});
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState(null);

  // ── Profile Search ──
  useEffect(() => {
    if (!debouncedQuery || typeFilter === 'song') {
      setProfileResults([]);
      setProfilesError(null);
      return;
    }

    let isCancelled = false;
    const run = async () => {
      try {
        setProfilesLoading(true);
        const results = await userService.searchPublicProfiles(debouncedQuery, PROFILE_LIMIT);
        if (!isCancelled) {
          setProfileResults(results);
          setProfilesError(null);
        }
      } catch (error) {
        if (!isCancelled) {
          setProfilesError(error);
        }
      } finally {
        if (!isCancelled) {
          setProfilesLoading(false);
        }
      }
    };

    run();
    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, typeFilter]);

  // ── Song Search (client-side) ──
  const songResults = useMemo(() => {
    if (!debouncedQuery) return [];
    const query = debouncedQuery.toLowerCase();
    const seen = new Set();
    const matches = [];

    for (const song of songs) {
      if (!song?.title || !song.songId) continue;
      if (!song.title.toLowerCase().includes(query)) continue;
      if (seen.has(song.songId)) continue;
      seen.add(song.songId);
      matches.push(song);
      if (matches.length >= SONG_LIMIT) break;
    }

    return matches;
  }, [songs, debouncedQuery]);

  // ── Playlist Search ──
  useEffect(() => {
    if (!debouncedQuery || songResults.length === 0) {
      setPlaylistGroups({});
      setPlaylistsError(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setPlaylistsLoading(true);
        const ids = Array.from(new Set(songResults.flatMap(buildSongMatchIds)));
        const playlists = await playlistService.getPublicPlaylistsBySongIds(ids, 40);

        const groups = {};
        playlists.forEach((playlist) => {
          (playlist.songs || []).forEach((songEntry) => {
            const baseId = normalizeSongId(songEntry.song_id);
            if (!baseId) return;
            if (!groups[baseId]) groups[baseId] = [];
            groups[baseId].push(playlist);
          });
        });

        if (!cancelled) {
          setPlaylistGroups(groups);
          setPlaylistsError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setPlaylistsError(error);
          setPlaylistGroups({});
        }
      } finally {
        if (!cancelled) {
          setPlaylistsLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, songResults]);

  return {
    profileResults,
    profilesLoading,
    profilesError,
    songResults,
    playlistGroups,
    playlistsLoading,
    playlistsError,
  };
}
