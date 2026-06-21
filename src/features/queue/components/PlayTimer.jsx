import { useState, useEffect, useCallback } from 'react';
import './PlayTimer.css';

/**
 * Component for displaying a real-time elapsed timer for active game sessions.
 * @param {Object} props - Component props.
 * @param {string} props.startTime - ISO timestamp representing when the session started.
 * @returns {JSX.Element} The rendered timer display.
 */
function PlayTimer({ startTime }) {
  // Calculate initial elapsed time
  const calculateElapsed = useCallback(() => {
    if (!startTime) return 0;
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diff = Math.floor((now - start) / 1000); // Convert to seconds
    return diff;
  }, [startTime]);

  const [elapsed, setElapsed] = useState(calculateElapsed);

  useEffect(() => {
    if (!startTime) return;

    setElapsed(calculateElapsed());

    // Update every second
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateElapsed, startTime]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedElapsed = formatTime(Math.max(0, elapsed));

  return (
    <div className="play-timer" aria-live="off" aria-label={`Playing for ${formattedElapsed}`}>
      <div className="timer-label">Playing for</div>
      <div className="timer-display" aria-hidden="true">{formattedElapsed}</div>
    </div>
  );
}

export default PlayTimer;
