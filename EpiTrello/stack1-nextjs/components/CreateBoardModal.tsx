'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import './CreateBoardModal.css'

interface CreateBoardModalProps {
  onClose: () => void
  onCreate: (title: string, description: string) => void
}

export default function CreateBoardModal({ onClose, onCreate }: CreateBoardModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const { t } = useLanguage()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onCreate(title, description)
      setTitle('')
      setDescription('')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{t.boards.createNewBoard}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.boards.boardTitle}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.boards.boardTitlePlaceholder}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>{t.boards.boardDescription}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.boards.boardDescriptionPlaceholder}
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              {t.common.cancel}
            </button>
            <button type="submit" className="create-button" disabled={!title.trim()}>
              {t.common.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
