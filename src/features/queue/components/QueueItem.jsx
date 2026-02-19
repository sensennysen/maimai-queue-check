import { memo } from 'react';
import IconEdit from '@tabler/icons-react/dist/esm/icons/IconEdit.mjs';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconChevronUp from '@tabler/icons-react/dist/esm/icons/IconChevronUp.mjs';
import IconChevronDown from '@tabler/icons-react/dist/esm/icons/IconChevronDown.mjs';
import { Skeleton, ActionIcon, Tooltip } from '@mantine/core';
import './QueueItem.css';

const QueueItem = memo(function QueueItem({ item, order, onEdit, onRemove, onMoveUp, onMoveDown, isFirst, isLast, isNextUp, canActuallyEdit, isBusy = false, loadingRoles = false, readOnly = false, isAdded = false, isMoved = false, isRemoving = false }) {
  const handleEdit = () => {
    if (readOnly) return;
    onEdit(item.id);
  };

  const handleRemove = () => {
    if (readOnly) return;
    if (window.confirm(`Remove ${item.player1} vs ${item.player2} from queue?`)) {
      onRemove(item.id);
    }
  };

  const handleMoveUp = () => {
    if (readOnly) return;
    onMoveUp(item.id);
  };

  const handleMoveDown = () => {
    if (readOnly) return;
    onMoveDown(item.id);
  };

  // Build animation class
  const animClass = isRemoving ? 'queue-item-removing' : isAdded ? 'queue-item-added' : isMoved ? 'queue-item-moved' : '';

  return (
    <div
      className={`queue-item ${isNextUp ? 'next-up' : ''} ${readOnly ? 'read-only' : ''} ${animClass}`}
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

      {!readOnly && (
        loadingRoles ? (
          <div className="item-actions">
            <Skeleton height={32} width={120} radius="md" />
          </div>
        ) : (
          <div className="item-actions">
            <div className="move-buttons">
              <Tooltip label={canActuallyEdit ? "Move up in queue" : "You need permission to move items"}>
                <ActionIcon
                  variant="default"
                  size="sm"
                  onClick={handleMoveUp}
                  disabled={!canActuallyEdit || isFirst}
                  loading={isBusy}
                >
                  <IconChevronUp size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={canActuallyEdit ? "Move down in queue" : "You need permission to move items"}>
                <ActionIcon
                  variant="default"
                  size="sm"
                  onClick={handleMoveDown}
                  disabled={!canActuallyEdit || isLast}
                  loading={isBusy}
                >
                  <IconChevronDown size={16} />
                </ActionIcon>
              </Tooltip>
            </div>
            <div className="action-buttons">
              <Tooltip label={canActuallyEdit ? "Edit this entry" : "You need permission to edit items"}>
                <ActionIcon
                  variant="filled"
                  color="blue"
                  onClick={handleEdit}
                  disabled={!canActuallyEdit}
                  loading={isBusy}
                >
                  <IconEdit size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={canActuallyEdit ? "Remove from queue" : "You need permission to remove items"}>
                <ActionIcon
                  variant="filled"
                  color="red"
                  onClick={handleRemove}
                  disabled={!canActuallyEdit}
                  loading={isBusy}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </div>
          </div>
        )
      )}
    </div>
  );
});

export default QueueItem;