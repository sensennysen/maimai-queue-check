import QueueItem from './QueueItem'
import './QueueList.css'

function QueueList({ queue, nowPlaying, onEdit, onRemove, onMoveUp, onMoveDown, onStartGame }) {
  if (queue.length === 0) {
    return (
      <div className="queue-list">
        <div className="empty-queue">
          <h3>No entries in queue</h3>
          <p>Add your first queue entry using the form above!</p>
          <div className="empty-icon">🎮</div>
        </div>
      </div>
    )
  }

  return (
    <div className="queue-list">
      <div className="queue-list-header">
        <h3>Current Queue ({queue.length} entries)</h3>
        {!nowPlaying && queue.length > 0 && (
          <button 
            className="start-game-btn"
            onClick={() => onStartGame()}
            title="Start game with next players"
          >
            Start Game
          </button>
        )}
      </div>
      <div className="queue-items">
        {queue.map((item, index) => (
          <QueueItem
            key={item.id}
            item={item}
            onEdit={onEdit}
            onRemove={onRemove}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            isFirst={index === 0}
            isLast={index === queue.length - 1}
            isNextUp={index === 0 && !nowPlaying}
            gameInProgress={!!nowPlaying}
          />
        ))}
      </div>
    </div>
  )
}

export default QueueList