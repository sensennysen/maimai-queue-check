import { useState } from 'react'
import { Group, Text, Button, ActionIcon, Badge, Box, Flex } from '@mantine/core'
import { IconEdit, IconTrash, IconGripVertical } from '@tabler/icons-react'
import './QueueItem.css'

function QueueItem({ item, onEdit, onRemove, onReorder, isFirst, isLast, isNextUp, gameInProgress }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleEdit = () => {
    onEdit(item.id)
  }

  const handleRemove = () => {
    if (window.confirm(`Remove ${item.player1} vs ${item.player2} from queue?`)) {
      onRemove(item.id)
    }
  }

  const handleDragStart = (e) => {
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', item.id.toString())
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'))
    if (draggedId !== item.id) {
      onReorder(draggedId, item.id)
    }
  }

  return (
    <Box 
      p="md"
      style={(theme) => ({
        borderBottom: isLast ? 'none' : `1px solid ${theme.colors.gray[3]}`,
        backgroundColor: isNextUp ? theme.colors.yellow[0] : 'white',
        borderLeft: isNextUp ? `4px solid ${theme.colors.yellow[6]}` : 'none',
        cursor: !gameInProgress ? 'move' : 'default',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(2deg)' : 'none',
        borderTop: isDragOver ? `3px solid ${theme.colors.blue[6]}` : 'none',
        transition: 'all 0.2s ease'
      })}
      draggable={!gameInProgress}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Group justify="space-between" align="center">
        <Group gap="md" style={{ flex: 1, minWidth: 0 }}>
          <Box style={{ minWidth: 60 }}>
            <Group gap="xs" align="center">
              <Text fw={700} size="xl" c="blue.6">#{item.order}</Text>
              {!gameInProgress && (
                <IconGripVertical size={16} color="gray" />
              )}
            </Group>
            {isNextUp && (
              <Badge size="xs" color="yellow" variant="filled">
                Next Up!
              </Badge>
            )}
          </Box>
          
          <Flex gap="md" wrap="wrap" style={{ flex: 1 }}>
            {item.player1 && item.player1.trim() && (
              <Box style={{ 
                flex: 1, 
                minWidth: 0, 
                backgroundColor: 'var(--mantine-color-blue-0)', 
                padding: '8px 12px', 
                borderRadius: '8px',
                border: '1px solid var(--mantine-color-blue-3)'
              }}>
                <Group gap="xs" wrap="nowrap">
                  <Badge variant="filled" color="blue" size="sm">P1</Badge>
                  <Text fw={500} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.player1}</Text>
                </Group>
              </Box>
            )}
            
            {item.player2 && item.player2.trim() && (
              <Box style={{ 
                flex: 1, 
                minWidth: 0, 
                backgroundColor: 'var(--mantine-color-grape-0)', 
                padding: '8px 12px', 
                borderRadius: '8px',
                border: '1px solid var(--mantine-color-grape-3)'
              }}>
                <Group gap="xs" wrap="nowrap">
                  <Badge variant="filled" color="grape" size="sm">P2</Badge>
                  <Text fw={500} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.player2}</Text>
                </Group>
              </Box>
            )}
          </Flex>
        </Group>
        
        <Group gap="xs">
          <ActionIcon
            variant="light"
            color="blue"
            onClick={handleEdit}
            title="Edit this entry"
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            color="red"
            onClick={handleRemove}
            title="Remove from queue"
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  )
}

export default QueueItem