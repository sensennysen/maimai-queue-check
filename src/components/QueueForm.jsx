import { useState, useEffect } from 'react'
import './QueueForm.css'

function QueueForm({ onSubmit, editingId, editingData, onCancel }) {
  const [player1, setPlayer1] = useState('')
  const [player2, setPlayer2] = useState('')
  const [errors, setErrors] = useState({})

  // Update form when editing
  useEffect(() => {
    if (editingData) {
      setPlayer1(editingData.player1)
      setPlayer2(editingData.player2)
    } else {
      setPlayer1('')
      setPlayer2('')
    }
    setErrors({})
  }, [editingData])

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
    <div className="queue-form">
      <h3>{editingId ? 'Edit Queue Entry' : 'Add New Queue Entry'}</h3>
      <form onSubmit={handleSubmit}>
        {errors.general && (
          <div className="general-error">
            <span className="error-message">{errors.general}</span>
          </div>
        )}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="player1">Player 1 Side (Optional)</label>
            <input
              type="text"
              id="player1"
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              placeholder="Enter Player 1 name"
              className={errors.player1 ? 'error' : ''}
              maxLength="50"
            />
            {errors.player1 && <span className="error-message">{errors.player1}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="player2">Player 2 Side (Optional)</label>
            <input
              type="text"
              id="player2"
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              placeholder="Enter Player 2 name"
              className={errors.player2 ? 'error' : ''}
              maxLength="50"
            />
            {errors.player2 && <span className="error-message">{errors.player2}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">
            {editingId ? 'Update Entry' : 'Add to Queue'}
          </button>
          {editingId && (
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default QueueForm