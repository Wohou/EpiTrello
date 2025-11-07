'use client'

import { useState } from 'react'
import './CreateListButton.css'

interface CreateListButtonProps {
  onCreate: (title: string) => void
}

export default function CreateListButton({ onCreate }: CreateListButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')

  const handleCreate = () => {
    if (title.trim()) {
      onCreate(title)
      setTitle('')
      setIsAdding(false)
    }
  }

  if (isAdding) {
    return (
      <div className="create-list-form">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter list title..."
          autoFocus
          onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
        />
        <div className="form-actions">
          <button className="add-button" onClick={handleCreate}>
            Add List
          </button>
          <button className="cancel-button" onClick={() => setIsAdding(false)}>
            ×
          </button>
        </div>
      </div>
    )
  }

  return (
    <button className="create-list-button" onClick={() => setIsAdding(true)}>
      + Add another list
    </button>
  )
}
