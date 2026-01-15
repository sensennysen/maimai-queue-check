import { IconEdit, IconTrash, IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { Skeleton } from '@mantine/core';
import './QueueItem.css';

function QueueItem({ item, onEdit, onRemove, onMoveUp, onMoveDown, isFirst, isLast, isNextUp, canActuallyEdit, isBusy = false, loadingRoles = false }) {
  const handleEdit = () => {
    onEdit(item.id);
  };

  const handleRemove = () => {
    if (window.confirm(`Remove ${item.player1} vs ${item.player2} from queue?`)) {
      onRemove(item.id);
    }
  };

  const handleMoveUp = () => {
    onMoveUp(item.id);
  };

  const handleMoveDown = () => {
    onMoveDown(item.id);
  };


  return (
    <div 
      className={`queue-item ${isNextUp ? 'next-up' : ''}`}
    >
      <div className="item-order">
        <span className="order-number">#{item.order_position || item.order}</span>
        {isNextUp && (
          <span className="next-label">Next Up!</span>
        )}
      </div>
      
      <div className="players-section">
        {item.player1 && item.player1.trim() && (
          <div className={`item-player player-1 ${(!item.player2 || !item.player2.trim()) ? 'player-solo' : ''}`}>
            <span className="player-side player-side-1">P1</span>
            <span className="player-name">{item.player1}</span>
          </div>
        )}
        
        {item.player2 && item.player2.trim() && (
          <div className={`item-player player-2 ${(!item.player1 || !item.player1.trim()) ? 'player-solo' : ''}`}>
            <span className="player-side player-side-2">P2</span>
            <span className="player-name">{item.player2}</span>
          </div>
        )}
      </div>
      
      {loadingRoles ? (
        <div className="item-actions">
          <Skeleton height={32} width={120} radius="md" />
        </div>
      ) : canActuallyEdit ? (
        <div className="item-actions">
          <div className="move-buttons">
            <button
              className="move-btn up"
              onClick={handleMoveUp}
              disabled={isFirst || isBusy}
              title="Move up in queue"
            >
              ▲
            </button>
            <button
              className="move-btn down"
              onClick={handleMoveDown}
              disabled={isLast || isBusy}
              title="Move down in queue"
            >
              ▼
            </button>
          </div>
          <div className="action-buttons">
            <button
              className="edit-btn"
              onClick={handleEdit}
              disabled={isBusy}
              title="Edit this entry"
            >
              <IconEdit size={16} />
            </button>
            <button
              className="remove-btn"
              onClick={handleRemove}
              disabled={isBusy}
              title="Remove from queue"
            >
              <IconTrash size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default QueueItem;