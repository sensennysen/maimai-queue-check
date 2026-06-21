import { memo } from 'react';
import IconEdit from '@tabler/icons-react/dist/esm/icons/IconEdit.mjs';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconChevronUp from '@tabler/icons-react/dist/esm/icons/IconChevronUp.mjs';
import IconChevronDown from '@tabler/icons-react/dist/esm/icons/IconChevronDown.mjs';
import { Skeleton, ActionIcon, Tooltip } from '@mantine/core';
import './QueueItem.css';

/**
 * Component representing a single entry in the queue.
 * Provides controls for editing, removing, and reordering entries based on permissions.
 * @param {Object} props - Component props.
 * @returns {JSX.Element} The rendered queue item.
 */
const QueueItem = memo(function QueueItem({ item, order, onEdit, onRemove, onMoveUp, onMoveDown, isFirst, isLast, isNextUp, canActuallyEdit, isBusy = false, loadingRoles = false, readOnly = false, isAdded = false, isMoved = false, isRemoving = false }) {
  const player1Name = item.player1?.trim() || 'Open side';
  const player2Name = item.player2?.trim() || 'Open side';
  const matchupLabel = `${player1Name} and ${player2Name}`;

  const handleEdit = () => {
    if (readOnly) return;
    onEdit(item.id);
  };

  const handleRemove = () => {
    if (readOnly) return;
    onRemove(item.id);
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
      role="listitem"
      aria-label={`Queue position ${order}: ${matchupLabel}${isNextUp ? ', next up' : ''}`}
    >
      <div className="item-order">
        <span className="order-number">#{order}</span>
        {isNextUp && (
          <span className="next-label">Next Up!</span>
        )}
      </div>


      <div className="players-section">
        <div className={`item-player player-1 ${!item.player1?.trim() ? 'is-empty' : ''}`}>
          <span className="player-name" title={player1Name}>{player1Name}</span>
        </div>

        <div className={`item-player player-2 ${!item.player2?.trim() ? 'is-empty' : ''}`}>
          <span className="player-name" title={player2Name}>{player2Name}</span>
        </div>
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
                  disabled={!canActuallyEdit || isFirst || isBusy}
                  aria-label={`Move ${matchupLabel} up`}
                >
                  <IconChevronUp size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={canActuallyEdit ? "Move down in queue" : "You need permission to move items"}>
                <ActionIcon
                  variant="default"
                  size="sm"
                  onClick={handleMoveDown}
                  disabled={!canActuallyEdit || isLast || isBusy}
                  aria-label={`Move ${matchupLabel} down`}
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
                  disabled={!canActuallyEdit || isBusy}
                  aria-label={`Edit ${matchupLabel}`}
                >
                  <IconEdit size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={canActuallyEdit ? "Remove from queue" : "You need permission to remove items"}>
                <ActionIcon
                  variant="filled"
                  color="red"
                  onClick={handleRemove}
                  disabled={!canActuallyEdit || isBusy}
                  aria-label={`Remove ${matchupLabel} from queue`}
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
