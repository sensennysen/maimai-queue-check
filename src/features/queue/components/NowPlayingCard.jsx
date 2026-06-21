import IconPlayerStop from '@tabler/icons-react/dist/esm/icons/IconPlayerStop.mjs';
import { Button, Title } from '@mantine/core';
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
 * @returns {JSX.Element} The rendered active session or idle state.
 */
function NowPlayingCard({ nowPlaying, canActuallyEdit, isBusy, onFinishGame, isLoggedIn, justUpdated = false }) {
  const hasPlayer1 = nowPlaying?.player1?.trim();
  const hasPlayer2 = nowPlaying?.player2?.trim();

  return (
    <div className={`now-playing ${!nowPlaying ? 'is-idle' : ''} ${justUpdated ? 'now-playing-updated' : ''}`}>
      <div className="now-playing-title">
        <Title order={3}>Now Playing</Title>
      </div>

      {!nowPlaying ? (
        <div className="now-playing-idle" role="status">
          <strong>No match in progress</strong>
          <span>Start the next matchup from the waiting list when the cabinet is ready.</span>
        </div>
      ) : (
        <div className="now-playing-grid">
          <div className={`now-playing-player now-playing-player--p1 ${!hasPlayer1 ? 'is-empty' : ''}`}>
            <div>
              <small>Player 1</small>
              <strong title={hasPlayer1 || 'Open side'}>{hasPlayer1 || 'Open side'}</strong>
            </div>
          </div>

          <div className="now-playing-session">
            <PlayTimer startTime={nowPlaying.started_at} />
            {isLoggedIn && canActuallyEdit && (
              <Button
                className="finish-game-btn"
                variant="outline"
                size="xs"
                onClick={onFinishGame}
                disabled={isBusy}
                leftSection={<IconPlayerStop size={15} />}
              >
                Finish
              </Button>
            )}
          </div>

          <div className={`now-playing-player now-playing-player--p2 ${!hasPlayer2 ? 'is-empty' : ''}`}>
            <div>
              <small>Player 2</small>
              <strong title={hasPlayer2 || 'Open side'}>{hasPlayer2 || 'Open side'}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NowPlayingCard;
