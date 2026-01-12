import './QueueItem.css'

function QueueItem({ item, onEdit, onRemove, onMoveUp, onMoveDown, isFirst, isLast, isNextUp, gameInProgress }) {
  const handleEdit = () => {
    onEdit(item.id)
  }

  const handleRemove = () => {
    if (window.confirm(`Remove ${item.player1} vs ${item.player2} from queue?`)) {
      onRemove(item.id)
    }
  }

  const handleMoveUp = () => {
    onMoveUp(item.id)
  }

  const handleMoveDown = () => {
    onMoveDown(item.id)
  }

  return (
    <div className={`queue-item ${isNextUp ? 'next-up' : ''}`}>
      <div className="item-order">
        <span className="order-number">#{item.order}</span>
        {isNextUp && <span className="next-label">Next Up!</span>}
      </div>
      
      <div className="players-section">
        <div className="item-player">
          <span className="player-name">{item.player1}</span>
        </div>
        
        <div className="item-player vs-divider">
          <span className="vs">vs</span>
          <span className="player-name">{item.player2}</span>
        </div>
      </div>
      
      <div className="item-actions">
        <div className="move-buttons">
          <button
            onClick={handleMoveUp}
            disabled={isFirst}
            className="move-btn up"
            title="Move up in queue"
          >
            ↑
          </button>
          <button
            onClick={handleMoveDown}
            disabled={isLast}
            className="move-btn down"
            title="Move down in queue"
          >
            ↓
          </button>
        </div>
        
        <div className="action-buttons">
          <button
            onClick={handleEdit}
            className="edit-btn"
            title="Edit this entry"
          >
            ✏️
          </button>
          <button
            onClick={handleRemove}
            className="remove-btn"
            title="Remove from queue"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

export default QueueItem