import { useState, useEffect } from 'react'
import { Paper, Title, TextInput, Group, Button, Stack, Alert } from '@mantine/core'
import { IconPlus, IconEdit, IconX, IconPlayerPlay } from '@tabler/icons-react'
import './QueueForm.css'

function QueueForm({ onSubmit, editingId, editingData, onCancel }) {
  const [player1, setPlayer1] = useState('')
  const [player2, setPlayer2] = useState('')
  const [errors, setErrors] = useState({})

  // Update form when editing - only depend on editingId to avoid overwriting user input during polling
  useEffect(() => {
    if (editingId && editingData) {
      // Ensure null/undefined values are converted to empty strings
      setPlayer1(editingData.player1 ? String(editingData.player1).trim() : '')
      setPlayer2(editingData.player2 ? String(editingData.player2).trim() : '')
    } else if (!editingId) {
      setPlayer1('')
      setPlayer2('')
    }
    setErrors({})
  }, [editingId])

  const validateForm = () => {
    const newErrors = {}
    
    // At least one player is required
    if (!player1.trim() && !player2.trim()) {
      newErrors.general = 'At least one player is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (editingId) {
      onSubmit(editingId, player1, player2)
    } else {
      onSubmit(player1, player2)
    }
    
    // Clear form after successful submission (only if not editing)
    if (!editingId) {
      setPlayer1('')
      setPlayer2('')
    }
    setErrors({})
  }

  const handleCancel = () => {
    setPlayer1('')
    setPlayer2('')
    setErrors({})
    onCancel()
  }

  return (
    <Paper p="md" withBorder>
      <Title order={3} mb="md">
        {editingId ? 'Edit Queue' : 'Add Queue'}
      </Title>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {errors.general && (
            <Alert color="red" variant="light">
              {errors.general}
            </Alert>
          )}
          
          <Group grow>
            <TextInput
              label="Player 1 Side"
              placeholder="Enter Player 1 name"
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              error={errors.player1}
              maxLength={50}
            />

            <TextInput
              label="Player 2 Side"
              placeholder="Enter Player 2 name"
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              error={errors.player2}
              maxLength={50}
            />
          </Group>

          <Group justify="flex-end">
            <Button 
              type="submit" 
              leftSection={editingId ? <IconEdit size={16} /> : <IconPlus size={16} />}
              variant="filled"
            >
              {editingId ? 'Update Entry' : 'Add to Queue'}
            </Button>
            {editingId && (
              <Button 
                variant="outline"
                color="gray"
                leftSection={<IconX size={16} />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            )}
          </Group>
        </Stack>
      </form>
    </Paper>
  )
}

export default QueueForm