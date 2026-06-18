import IconPlayerStop from '@tabler/icons-react/dist/esm/icons/IconPlayerStop.mjs';
import { Button } from '@mantine/core';
import PlayTimer from './PlayTimer';
import './QueueManager.css';

/**
 * Component for displaying the currently playing game session.
 * @param {Object} props - Component props.
 * @param {Object} props.nowPlaying - Current playing queue entry.
 * @param {boolean} props.canActuallyEdit - Whether the user has permissions to modify the entry.
 * @param {boolean} props.isBusy - Whether a mutation is currently in progress.
 * @param {Function} props.onFinishGame - Handler for completing the current game session.
 * @param {boolean} props.isLoggedIn - Whether the user is authenticated.
 * @param {boolean} [props.justUpdated=false] - Whether the card was recently updated (triggers animation).
 * @returns {JSX.Element|null} The rendered card or null if no session is active.
 */
function NowPlayingCard({ nowPlaying, canActuallyEdit, isBusy, onFinishGame, isLoggedIn, justUpdated = false }) {
  if (!nowPlaying) return null;

  const hasPlayer1 = nowPlaying.player1 && nowPlaying.player1.trim();
  const hasPlayer2 = nowPlaying.player2 && nowPlaying.player2.trim();
  const isSolo = (hasPlayer1 && !hasPlayer2) || (!hasPlayer1 && hasPlayer2);

  return (
    <div className={`now-playing ${justUpdated ? 'now-playing-updated' : ''}`}>
      <div className="now-playing-title">
        <span className="now-playing-status-dot" aria-hidden="true" />
        <span>Now Playing</span>
      </div>

      <div className="now-playing-grid">
        <div className={`now-playing-player now-playing-player--p1 ${!hasPlayer1 ? 'is-empty' : ''}`}>
          <span className="player-side-indicator player-side-1">P1</span>
          <div>
            <small>Player 1</small>
            <strong>{hasPlayer1 ? nowPlaying.player1 : 'Open side'}</strong>
          </div>
        </div>

        <div className="now-playing-session">
          <PlayTimer startTime={nowPlaying.started_at} />
          {isLoggedIn && canActuallyEdit && (
            <Button
              className="finish-game-btn"
              variant="outline"
              onClick={onFinishGame}
              disabled={isBusy}
              leftSection={<IconPlayerStop size={16} />}
            >
              Finish Game
            </Button>
          )}
          {isSolo && <span className="now-playing-solo">Solo session</span>}
        </div>

        <div className={`now-playing-player now-playing-player--p2 ${!hasPlayer2 ? 'is-empty' : ''}`}>
          <span className="player-side-indicator player-side-2">P2</span>
          <div>
            <small>Player 2</small>
            <strong>{hasPlayer2 ? nowPlaying.player2 : 'Open side'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NowPlayingCard;
