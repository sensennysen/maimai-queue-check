import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Music2, Search, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@mantine/core';
import { BASE_JACKET_URL } from '../../config/maimai-constants';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions';
import { useSongDatabaseContext } from '../../hooks/useSongDatabaseContext';
import SongDetailModal from '../../features/songs/components/SongDetailModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';

export default function GlobalSearchDialog({ opened, onOpenChange }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const { songs, loading: songsLoading } = useSongDatabaseContext(opened);
  const {
    profileSuggestions,
    profileLoading,
    songSuggestions,
    canSuggest,
  } = useSearchSuggestions(query, songs, {
    profileLimit: 6,
    songLimit: 6,
  });
  const isLoading = profileLoading || songsLoading;
  const hasResults = profileSuggestions.length > 0 || songSuggestions.length > 0;

  useEffect(() => {
    if (!opened) {
      setQuery('');
      return undefined;
    }
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [opened]);

  const goTo = (path) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const firstProfile = profileSuggestions.find((profile) => profile.slug);
    if (firstProfile) {
      goTo(`/p/${firstProfile.slug}`);
      return;
    }

    if (songSuggestions[0]) {
      setSelectedSong(songSuggestions[0]);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={opened} onOpenChange={onOpenChange}>
        <DialogContent className="app-search-dialog">
          <DialogHeader>
            <DialogTitle>Search maiPaQueueCheck</DialogTitle>
            <DialogDescription>
              Find a player or song without leaving your current page.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="app-search-form">
            <Search aria-hidden="true" />
            <Input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search players or songs..."
              aria-label="Search players or songs"
              aria-controls="global-search-results"
            />
            {isLoading ? <LoaderCircle className="app-search-spinner" aria-label="Searching" /> : <kbd>Enter</kbd>}
          </form>

          <div id="global-search-results" className="app-search-results" aria-live="polite">
            {!canSuggest ? (
              <div className="app-search-empty" role="status">
                <Search aria-hidden="true" />
                <strong>Start typing to search</strong>
                <span>Enter at least two characters to find players and songs.</span>
              </div>
            ) : (
              <>
                <section className="app-search-result-section" aria-labelledby="player-results-heading">
                  <div className="app-search-result-heading">
                    <h3 id="player-results-heading"><UserRound aria-hidden="true" /> Players</h3>
                    <span>{profileSuggestions.length}</span>
                  </div>
                  {profileSuggestions.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      className="app-search-result"
                      disabled={!profile.slug}
                      onClick={() => goTo(`/p/${profile.slug}`)}
                    >
                      <Avatar
                        src={profile.display_photo_url || profile.dx_display_photo_url || undefined}
                        radius="xl"
                        size={36}
                      >
                        {(profile.display_name || profile.slug || '?').slice(0, 2).toUpperCase()}
                      </Avatar>
                      <span className="app-search-result-copy">
                        <strong>{profile.display_name || profile.slug || 'Unnamed player'}</strong>
                        <small>@{profile.slug || 'no-slug'}</small>
                      </span>
                      <span className="app-search-result-type">Player</span>
                    </button>
                  ))}
                </section>

                <section className="app-search-result-section" aria-labelledby="song-results-heading">
                  <div className="app-search-result-heading">
                    <h3 id="song-results-heading"><Music2 aria-hidden="true" /> Songs</h3>
                    <span>{songSuggestions.length}</span>
                  </div>
                  {songSuggestions.map((song) => (
                    <button
                      key={song.songId}
                      type="button"
                      className="app-search-result"
                      onClick={() => {
                        setSelectedSong(song);
                        onOpenChange(false);
                      }}
                    >
                      <Avatar
                        src={song.imageUrl || (song.imageName ? `${BASE_JACKET_URL}${song.imageName}` : undefined)}
                        radius="sm"
                        size={36}
                      />
                      <span className="app-search-result-copy">
                        <strong>{song.title}</strong>
                        <small>{song.artist || 'Unknown artist'}</small>
                      </span>
                      <span className="app-search-result-type">Song</span>
                    </button>
                  ))}
                </section>

                {!isLoading && !hasResults && (
                  <div className="app-search-empty" role="status">
                    <Search aria-hidden="true" />
                    <strong>No matches found</strong>
                    <span>Try a different player name, song title, or artist.</span>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SongDetailModal
        song={selectedSong}
        opened={!!selectedSong}
        onClose={() => setSelectedSong(null)}
      />
    </>
  );
}
