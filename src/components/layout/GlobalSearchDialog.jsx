import { useEffect, useRef, useState } from 'react';
import { ListOrdered, Music2, Radio, Rows3, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';

const destinations = [
  { label: 'Community feed', path: '/feed', icon: Rows3 },
  { label: 'Queue', path: '/queue', icon: ListOrdered },
  { label: 'Song database', path: '/songs', icon: Music2 },
  { label: 'Shared playlists', path: '/shared-playlists', icon: Radio },
];

export default function GlobalSearchDialog({ opened, onOpenChange }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!opened) return undefined;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [opened]);

  const goTo = (path) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const searchQuery = query.trim();
    goTo(searchQuery ? `/search?query=${encodeURIComponent(searchQuery)}` : '/search');
  };

  return (
    <Dialog open={opened} onOpenChange={onOpenChange}>
      <DialogContent className="app-search-dialog">
        <DialogHeader>
          <DialogTitle>Search maiPaQueueCheck</DialogTitle>
          <DialogDescription>
            Find players and songs, or jump to a section.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="app-search-form">
          <Search aria-hidden="true" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search players or songs..."
            aria-label="Search players or songs"
          />
          <kbd>Enter</kbd>
        </form>

        <nav className="app-search-destinations" aria-label="Quick navigation">
          {destinations.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.path} type="button" onClick={() => goTo(item.path)}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
