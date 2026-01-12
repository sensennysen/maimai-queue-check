import QueueItem from './QueueItem'
import './QueueList.css'

function QueueList({ queue, onEdit, onRemove, onMoveUp, onMoveDown }) {
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
      <h3>Current Queue ({queue.length} entries)</h3>
      <div className="queue-header-row">
        <span className="col-order">Order</span>
        <span className="col-player">Player 1</span>
        <span className="col-player">Player 2</span>
        <span className="col-actions">Actions</span>
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
          />
        ))}
      </div>
    </div>
  )
}

export default QueueList