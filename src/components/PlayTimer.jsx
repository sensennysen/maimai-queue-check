import { useState, useEffect } from 'react'
import './PlayTimer.css'

function PlayTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startTime) return

    // Calculate initial elapsed time
    const calculateElapsed = () => {
      const start = new Date(startTime).getTime()
      const now = Date.now()
      const diff = Math.floor((now - start) / 1000) // Convert to seconds
      return diff
    }

    // Set initial value
    setElapsed(calculateElapsed())

    // Update every second
    const interval = setInterval(() => {
      setElapsed(calculateElapsed())
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="play-timer">
      <div className="timer-label">Playing for</div>
      <div className="timer-display">{formatTime(elapsed)}</div>
    </div>
  )
}

export default PlayTimer
