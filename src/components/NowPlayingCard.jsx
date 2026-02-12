import { IconPlayerStop } from '@tabler/icons-react';
import { Button } from '@mantine/core';
import PlayTimer from './PlayTimer';
import './QueueManager.css';

/**
 * Component displaying the currently playing game session
 * @param {Object} props
 * @param {Object} props.nowPlaying - Current playing queue entry
 * @param {string} props.nowPlaying.player1 - First player name
 * @param {string} props.nowPlaying.player2 - Second player name
 * @param {string} props.nowPlaying.started_at - ISO timestamp when game started
 * @param {boolean} props.canActuallyEdit - Whether user can edit
 * @param {boolean} props.isBusy - Whether mutation is in progress
 * @param {() => void} props.onFinishGame - Handler for finishing game
 * @param {boolean} props.isLoggedIn - Whether user is logged in
 */
function NowPlayingCard({ nowPlaying, canActuallyEdit, isBusy, onFinishGame, isLoggedIn, justUpdated = false }) {
  if (!nowPlaying) return null;

  const hasPlayer1 = nowPlaying.player1 && nowPlaying.player1.trim();
  const hasPlayer2 = nowPlaying.player2 && nowPlaying.player2.trim();
  const isSolo = (hasPlayer1 && !hasPlayer2) || (!hasPlayer1 && hasPlayer2);

  return (
    <div className={`now-playing ${justUpdated ? 'now-playing-updated' : ''}`}>
      <div className="now-playing-header">
        <h3>Now Playing</h3>
        <PlayTimer startTime={nowPlaying.started_at} />
      </div>
      <div className="current-players">
        <div className="player-display">
          {hasPlayer1 && (
            <div className={`playing-player player-1 ${isSolo ? 'player-solo' : ''}`}>
              <span className="player-side-indicator player-side-1">P1</span>
              <span className="player-name">{nowPlaying.player1}</span>
            </div>
          )}

          {hasPlayer2 && (
            <div className={`playing-player player-2 ${isSolo ? 'player-solo' : ''}`}>
              <span className="player-side-indicator player-side-2">P2</span>
              <span className="player-name">{nowPlaying.player2}</span>
            </div>
          )}
        </div>

        {isLoggedIn && canActuallyEdit && (
          <Button
            color="orange"
            onClick={onFinishGame}
            loading={isBusy}
            leftSection={<IconPlayerStop size={16} />}
          >
            Finish Game
          </Button>
        )}
      </div>
    </div>
  );
}

export default NowPlayingCard;
