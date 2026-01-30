import { memo } from 'react';
import { IconEdit, IconTrash, IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { Skeleton } from '@mantine/core';
import './QueueItem.css';

const QueueItem = memo(function QueueItem({ item, order, onEdit, onRemove, onMoveUp, onMoveDown, isFirst, isLast, isNextUp, canActuallyEdit, isBusy = false, loadingRoles = false }) {
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
        <span className="order-number">#{order}</span>
        {isNextUp && (
          <span className="next-label">Next Up!</span>
        )}
      </div>

      <div className="players-section">
        {item.player1 && item.player1.trim() && (
          <div className={`item-player player-1${(!item.player2 || !item.player2.trim()) ? ' player-solo' : ''}`}>
            <span className="player-side player-side-1">P1</span>
            <span className="player-name">{item.player1}</span>
          </div>
        )}

        {item.player2 && item.player2.trim() && (
          <div className={`item-player player-2${(!item.player1 || !item.player1.trim()) ? ' player-solo' : ''}`}>
            <span className="player-side player-side-2">P2</span>
            <span className="player-name">{item.player2}</span>
          </div>
        )}
      </div>

      {loadingRoles ? (
        <div className="item-actions">
          <Skeleton height={32} width={120} radius="md" />
        </div>
      ) : (
        <div className="item-actions">
          <div className="move-buttons">
            <button
              className="move-btn up"
              onClick={handleMoveUp}
              disabled={!canActuallyEdit || isFirst || isBusy}
              title={canActuallyEdit ? "Move up in queue" : "You need permission to move items"}
            >
              ▲
            </button>
            <button
              className="move-btn down"
              onClick={handleMoveDown}
              disabled={!canActuallyEdit || isLast || isBusy}
              title={canActuallyEdit ? "Move down in queue" : "You need permission to move items"}
            >
              ▼
            </button>
          </div>
          <div className="action-buttons">
            <button
              className="edit-btn"
              onClick={handleEdit}
              disabled={!canActuallyEdit || isBusy}
              title={canActuallyEdit ? "Edit this entry" : "You need permission to edit items"}
            >
              <IconEdit size={16} />
            </button>
            <button
              className="remove-btn"
              onClick={handleRemove}
              disabled={!canActuallyEdit || isBusy}
              title={canActuallyEdit ? "Remove from queue" : "You need permission to remove items"}
            >
              <IconTrash size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default QueueItem;