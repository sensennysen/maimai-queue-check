import { useState, useEffect, useRef, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { playlistService } from '../../../services/supabase';

export function usePlaylistEditor({ userId, initialPlaylist, opened, onDraftChange, onSave }) {
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [showDraftAlert, setShowDraftAlert] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  
  const draftIdRef = useRef(null);
  const autosaveTimer = useRef(null);
  const isNewPlaylist = !initialPlaylist;

  const buildSongsPayload = useCallback((songs) =>
    songs.map(s => {
      const id = s.cardId || s.songId || s.id;
      return { id, level: s.level || null };
    }),
    []
  );

  const scheduleDraftSave = useCallback((nextTitle, nextComment, nextIsPublic, nextSongs) => {
    if (!isNewPlaylist || !userId) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      try {
        setIsDraftSaving(true);
        const saved = await playlistService.saveDraft(userId, draftIdRef.current, {
          title: nextTitle,
          comment: nextComment,
          is_public: nextIsPublic,
          songs: buildSongsPayload(nextSongs),
        });
        if (saved?.id) draftIdRef.current = saved.id;
        if (onDraftChange) onDraftChange(true);
      } catch (err) {
        console.error('Draft autosave failed:', err);
      } finally {
        setIsDraftSaving(false);
      }
    }, 1000);
  }, [isNewPlaylist, userId, buildSongsPayload, onDraftChange]);

  useEffect(() => {
    if (!opened) return;

    if (initialPlaylist) {
      setTitle(initialPlaylist.title || '');
      setComment(initialPlaylist.comment || '');
      setIsPublic(initialPlaylist.is_public || false);
      setSelectedSongs(initialPlaylist.fullSongs || []);
      draftIdRef.current = null;
      setShowDraftAlert(false);
      setPendingDraft(null);
    } else {
      setTitle('');
      setComment('');
      setIsPublic(false);
      setSelectedSongs([]);
      draftIdRef.current = null;
      setShowDraftAlert(false);
      setPendingDraft(null);

      if (userId) {
        playlistService.getDraft(userId).then((draft) => {
          if (draft && (draft.title || (draft.songs && draft.songs.length > 0) || draft.comment)) {
            setPendingDraft(draft);
            setShowDraftAlert(true);
          }
        }).catch(console.error);
      }
    }
  }, [opened, initialPlaylist, userId]);

  useEffect(() => {
    if (!opened) {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    }
  }, [opened]);

  const handleContinueDraft = (songMapById) => {
    if (!pendingDraft) return;
    setTitle(pendingDraft.title || '');
    setComment(pendingDraft.comment || '');
    setIsPublic(pendingDraft.is_public || false);

    if (pendingDraft.songs && songMapById) {
      const resolved = pendingDraft.songs.map(entry => {
        const full = songMapById.get(entry.song_id);
        return full ? { ...full, level: entry.level } : null;
      }).filter(Boolean);
      setSelectedSongs(resolved);
    } else {
      setSelectedSongs([]);
    }

    draftIdRef.current = pendingDraft.id;
    setShowDraftAlert(false);
    setPendingDraft(null);
  };

  const handleDiscardDraft = async () => {
    if (pendingDraft?.id) {
      try {
        await playlistService.discardDraft(pendingDraft.id);
        if (onDraftChange) onDraftChange(false);
      } catch (err) {
        console.error('Failed to discard draft:', err);
      }
    }
    setShowDraftAlert(false);
    setPendingDraft(null);
  };

  const handleAddSong = (songOrSongs) => {
    const newSelection = Array.isArray(songOrSongs) ? songOrSongs : [songOrSongs];
    setSelectedSongs(newSelection);
    scheduleDraftSave(title, comment, isPublic, newSelection);
  };

  const handleRemoveSong = (index) => {
    const newSongs = [...selectedSongs];
    newSongs.splice(index, 1);
    setSelectedSongs(newSongs);
    scheduleDraftSave(title, comment, isPublic, newSongs);
  };

  const moveSong = (index, direction) => {
    const newSongs = [...selectedSongs];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newSongs.length) return;
    const temp = newSongs[index];
    newSongs[index] = newSongs[newIndex];
    newSongs[newIndex] = temp;
    setSelectedSongs(newSongs);
    scheduleDraftSave(title, comment, isPublic, newSongs);
  };

  const updateTitle = (val) => {
    setTitle(val);
    scheduleDraftSave(val, comment, isPublic, selectedSongs);
  };

  const updateComment = (val) => {
    setComment(val);
    scheduleDraftSave(title, val, isPublic, selectedSongs);
  };

  const updatePublic = (newValue) => {
    setIsPublic(newValue);
    scheduleDraftSave(title, comment, newValue, selectedSongs);
  };

  const clearDraft = async () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    if (draftIdRef.current) {
      try {
        await playlistService.discardDraft(draftIdRef.current);
        if (onDraftChange) onDraftChange(false);
      } catch (err) {
        console.error('Failed to clear draft:', err);
      }
      draftIdRef.current = null;
    }
  };

  const savePlaylist = async () => {
    if (!title.trim()) {
      notifications.show({ title: 'Title Required', message: 'Please give your playlist a title', color: 'red' });
      return;
    }

    setIsSaving(true);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    try {
      const songs = selectedSongs.map(s => ({ id: s.cardId || s.songId || s.id, level: s.level || null }));
      const updatedPlaylist = await playlistService.upsertPlaylist(userId, draftIdRef.current || initialPlaylist?.id, {
        title: title.trim(),
        comment: comment.trim(),
        is_public: isPublic,
        is_draft: false,
        songs
      });

      if (onDraftChange) onDraftChange(false);

      notifications.show({
        title: 'Success',
        message: 'Playlist saved successfully',
        color: 'green'
      });

      if (onSave) onSave(updatedPlaylist);
      draftIdRef.current = null;
      return true;
    } catch (error) {
      console.error('Error saving playlist:', error);
      notifications.show({ title: 'Error', message: 'Failed to save playlist', color: 'red' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const privatizePlaylist = async () => {
    setIsSaving(true);
    try {
      const songsForService = selectedSongs.map(s => ({ id: s.cardId || s.songId || s.id, level: s.level }));
      const updatedPlaylist = await playlistService.upsertPlaylist(userId, initialPlaylist?.id, {
        title: title.trim(),
        comment: comment.trim(),
        is_public: false,
        songs: songsForService
      });

      await playlistService.softDeletePostsByPlaylist(initialPlaylist.id);

      notifications.show({
        title: 'Playlist Private',
        message: 'Playlist is now private and its shared posts have been removed.',
        color: 'indigo'
      });

      if (onSave) onSave(updatedPlaylist);
      return true;
    } catch (error) {
      console.error('Error privatizing playlist:', error);
      notifications.show({ title: 'Error', message: 'Failed to privatize playlist', color: 'red' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    title,
    comment,
    selectedSongs,
    setSelectedSongs,
    isSaving,
    isPublic,
    showDraftAlert,
    isDraftSaving,
    handleContinueDraft,
    handleDiscardDraft,
    handleAddSong,
    handleRemoveSong,
    moveSong,
    updateTitle,
    updateComment,
    updatePublic,
    clearDraft,
    savePlaylist,
    privatizePlaylist
  };
}
