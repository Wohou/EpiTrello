'use client'

import { useState, useRef, useEffect, ChangeEvent } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/lib/language-context'
import { useNotification } from '@/components/NotificationContext'
import type { Card, BoardMember, CardAssignment, CardImage, CardComment, CardActivity, BoardStatus, BoardLabel } from '@/lib/supabase'
import GitHubPowerUp from './GitHubPowerUp'
import './CardDetailModal.css'

interface CardDetailModalProps {
  card: Card
  onClose: () => void
  onUpdate: (updates: Partial<Card>) => void
  onDelete: () => void
  boardMembers?: BoardMember[]
  cardAssignments: CardAssignment[]
  onToggleAssignment: (userId: string) => Promise<void>
  togglingUser: string | null
  cardImages: CardImage[]
  onImagesChange: (images: CardImage[]) => void
  onCommentCountChange?: (count: number) => void
  boardId?: string
  onRefreshBoard?: () => Promise<void>
}

const CARD_COLORS = [
  { name: 'Aucune', value: null },
  { name: 'Rouge', value: '#eb5a46' },
  { name: 'Orange', value: '#ff9f1a' },
  { name: 'Jaune', value: '#f2d600' },
  { name: 'Vert', value: '#61bd4f' },
  { name: 'Bleu', value: '#0079bf' },
  { name: 'Violet', value: '#c377e0' },
  { name: 'Rose', value: '#ff78cb' },
  { name: 'Gris', value: '#b3bac5' },
]

// Helper functions
const getDaysRemaining = (dueDate: string): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const getDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

// const formatDateShort = (dateString: string): string => {
//   const date = new Date(dateString)
//   return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
// }

const generateGoogleCalendarUrl = (
  title: string,
  description: string | null,
  startDate: string | null,
  endDate: string
): string => {
  const formatDateForGoogle = (date: string): string =>
    new Date(date).toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 8)
  const start = startDate ? formatDateForGoogle(startDate) : formatDateForGoogle(endDate)
  const endDateObj = new Date(endDate)
  endDateObj.setDate(endDateObj.getDate() + 1)
  const end = formatDateForGoogle(endDateObj.toISOString())
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: description || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const getInitials = (name: string | undefined | null): string => {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function CardDetailModal({
  card,
  onClose,
  onUpdate,
  onDelete,
  boardMembers = [],
  cardAssignments,
  onToggleAssignment,
  togglingUser,
  cardImages,
  onImagesChange,
  onCommentCountChange,
  boardId,
  onRefreshBoard,
}: CardDetailModalProps) {
  // --- State ---
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [tempTitle, setTempTitle] = useState(card.title)
  const [tempDescription, setTempDescription] = useState(card.description || '')
  const [showDateSection, setShowDateSection] = useState(false)
  const [tempStartDate, setTempStartDate] = useState<string>(
    card.start_date ? new Date(card.start_date).toISOString().split('T')[0] : ''
  )
  const [tempDueDate, setTempDueDate] = useState<string>(
    card.due_date ? new Date(card.due_date).toISOString().split('T')[0] : ''
  )
  const [useStartDate, setUseStartDate] = useState(!!card.start_date)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showGitHubPowerUp, setShowGitHubPowerUp] = useState(false)
  const [showAssignPanel, setShowAssignPanel] = useState(false)
  const [, setTempStatus] = useState(card.status || '')
  const [showImageModal, setShowImageModal] = useState(false)

  // Board-level statuses & labels
  const [boardStatuses, setBoardStatuses] = useState<BoardStatus[]>([])
  const [boardLabels, setBoardLabels] = useState<BoardLabel[]>([])
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showLabelDropdown, setShowLabelDropdown] = useState(false)
  const [newStatusInput, setNewStatusInput] = useState('')
  const [newLabelInput, setNewLabelInput] = useState('')
  const [creatingStatus, setCreatingStatus] = useState(false)
  const [creatingLabel, setCreatingLabel] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)

  // Commentary & Activity state
  const [comments, setComments] = useState<CardComment[]>([])
  const [activities, setActivities] = useState<CardActivity[]>([])
  const [feedFilter, setFeedFilter] = useState<'all' | 'comments' | 'activity'>('all')
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [loadingFeed, setLoadingFeed] = useState(false)

  const titleInputRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useLanguage()
  const { confirm, alert } = useNotification()

  // Sync card data when prop changes
  useEffect(() => {
    setTempTitle(card.title)
    setTempDescription(card.description || '')
    setTempStatus(card.status || '')
    setTempStartDate(card.start_date ? new Date(card.start_date).toISOString().split('T')[0] : '')
    setTempDueDate(card.due_date ? new Date(card.due_date).toISOString().split('T')[0] : '')
    setUseStartDate(!!card.start_date)
  }, [card])

  // Auto-focus title input
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  useEffect(() => {
    if (editingDescription && descriptionRef.current) {
      descriptionRef.current.focus()
    }
  }, [editingDescription])

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showGitHubPowerUp || showAssignPanel || showImageModal) return
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, showGitHubPowerUp, showAssignPanel, showImageModal])

  // Fetch comments & activity on mount
  useEffect(() => {
    const fetchFeed = async () => {
      setLoadingFeed(true)
      try {
        const [commentsRes, activityRes] = await Promise.all([
          fetch(`/api/cards/${card.id}/comments`),
          fetch(`/api/cards/${card.id}/activity`),
        ])
        if (commentsRes.ok) {
          const data = await commentsRes.json()
          setComments(data.comments || [])
        }
        if (activityRes.ok) {
          const data = await activityRes.json()
          setActivities(data.activities || [])
        }
      } catch (error) {
        console.error('Error fetching feed:', error)
      } finally {
        setLoadingFeed(false)
      }
    }
    fetchFeed()
  }, [card.id])

  // Fetch board-level statuses & labels
  useEffect(() => {
    if (!boardId) return
    const fetchBoardMeta = async () => {
      try {
        const [statusRes, labelRes] = await Promise.all([
          fetch(`/api/boards/${boardId}/statuses`),
          fetch(`/api/boards/${boardId}/labels`),
        ])
        if (statusRes.ok) {
          const data = await statusRes.json()
          setBoardStatuses(data.statuses || [])
        }
        if (labelRes.ok) {
          const data = await labelRes.json()
          setBoardLabels(data.labels || [])
        }
      } catch (error) {
        console.error('Error fetching board statuses/labels:', error)
      }
    }
    fetchBoardMeta()
  }, [boardId])

  // --- Handlers ---
  const handleSaveTitle = () => {
    if (tempTitle.trim() && tempTitle !== card.title) {
      onUpdate({ title: tempTitle.trim() })
      logActivity('renamed', { old_title: card.title, new_title: tempTitle.trim() })
    } else {
      setTempTitle(card.title)
    }
    setEditingTitle(false)
  }

  const handleSaveDescription = () => {
    const newDesc = tempDescription.trim()
    if (newDesc !== (card.description || '')) {
      onUpdate({ description: newDesc || null })
      logActivity('description_changed')
    }
    setEditingDescription(false)
  }

  const handleToggleComplete = () => {
    const newState = !card.is_completed
    onUpdate({ is_completed: newState })
    logActivity(newState ? 'completed' : 'uncompleted')
    // Sync GitHub issues
    fetch(`/api/cards/${card.id}/sync-github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: card.id, isCompleted: newState }),
    }).catch(console.error)
  }

  const handleSaveDates = () => {
    const updates: Partial<Card> = {}
    updates.start_date = useStartDate && tempStartDate ? new Date(tempStartDate).toISOString() : null
    updates.due_date = tempDueDate ? new Date(tempDueDate).toISOString() : null
    onUpdate(updates)
    logActivity('due_date_changed')
    setShowDateSection(false)
  }

  const handleRemoveDates = () => {
    onUpdate({ start_date: null, due_date: null })
    setTempStartDate('')
    setTempDueDate('')
    setUseStartDate(false)
    setShowDateSection(false)
  }

  const handleAddToGoogleCalendar = () => {
    const dueDateToUse = tempDueDate || (card.due_date ? new Date(card.due_date).toISOString().split('T')[0] : '')
    const startDateToUse = useStartDate ? tempStartDate || (card.start_date ? new Date(card.start_date).toISOString().split('T')[0] : null) : null
    if (!dueDateToUse) return
    window.open(generateGoogleCalendarUrl(card.title, card.description, startDateToUse, dueDateToUse), '_blank')
  }

  const handleColorChange = (color: string | null) => {
    onUpdate({ cover_color: color })
    logActivity('cover_changed', { color })
    setShowColorPicker(false)
  }

  const handleRemoveLabel = (labelToRemove: string) => {
    const currentLabels = card.labels || []
    const updatedLabels = currentLabels.filter((label) => label !== labelToRemove)
    onUpdate({ labels: updatedLabels })
    logActivity('labels_changed', { labels: updatedLabels })
  }

  // --- Board-level status/label dropdown handlers ---
  const handleSelectStatus = (statusName: string) => {
    const current = card.status || ''
    if (statusName === current) {
      // Deselect
      onUpdate({ status: null })
      logActivity('status_changed', { status: null })
      setTempStatus('')
    } else {
      onUpdate({ status: statusName })
      logActivity('status_changed', { status: statusName })
      setTempStatus(statusName)
    }
    setShowStatusDropdown(false)
  }

  const handleCreateBoardStatus = async () => {
    const name = newStatusInput.trim()
    if (!name || !boardId || creatingStatus) return
    setCreatingStatus(true)
    try {
      const res = await fetch(`/api/boards/${boardId}/statuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.status === 409) {
        await alert({ message: t.cards.statusAlreadyExists || 'This status already exists', variant: 'error' })
        return
      }
      if (!res.ok) throw new Error('Failed to create status')
      const { status: newStatus } = await res.json()
      setBoardStatuses((prev) => [...prev, newStatus])
      setNewStatusInput('')
      // Auto-select the new status
      handleSelectStatus(newStatus.name)
    } catch (error) {
      console.error('Error creating board status:', error)
    } finally {
      setCreatingStatus(false)
    }
  }

  const handleDeleteBoardStatus = async (statusId: string, statusName: string) => {
    if (!boardId) return
    const confirmed = await confirm({
      title: t.common.delete,
      message: t.cards.deleteStatusConfirm || 'Delete this status for the entire board?',
      confirmText: t.common.delete,
      cancelText: t.common.cancel,
      variant: 'danger',
    })
    if (!confirmed) return
    try {
      const res = await fetch(`/api/boards/${boardId}/statuses`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId }),
      })
      if (!res.ok) throw new Error('Failed to delete status')
      setBoardStatuses((prev) => prev.filter((s) => s.id !== statusId))
      // Clear local temp status if it was the deleted one
      if (card.status === statusName) {
        setTempStatus('')
      }
      // Refresh the entire board — the backend cascade already cleared this
      // status from all cards in the DB, so a full refresh picks up everything
      if (onRefreshBoard) {
        await onRefreshBoard()
      } else if (card.status === statusName) {
        // Fallback: at least update current card if no refresh available
        onUpdate({ status: null })
      }
    } catch (error) {
      console.error('Error deleting board status:', error)
    }
  }

  const handleSelectLabel = (labelName: string) => {
    const currentLabels = card.labels || []
    const exists = currentLabels.includes(labelName)
    let updatedLabels: string[]
    if (exists) {
      updatedLabels = currentLabels.filter((l) => l !== labelName)
    } else {
      updatedLabels = [...currentLabels, labelName]
    }
    onUpdate({ labels: updatedLabels })
    logActivity('labels_changed', { labels: updatedLabels })
  }

  const handleCreateBoardLabel = async () => {
    const name = newLabelInput.trim()
    if (!name || !boardId || creatingLabel) return
    setCreatingLabel(true)
    try {
      const res = await fetch(`/api/boards/${boardId}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.status === 409) {
        await alert({ message: t.cards.labelAlreadyExists || 'This label already exists', variant: 'error' })
        return
      }
      if (!res.ok) throw new Error('Failed to create label')
      const { label: newLabel } = await res.json()
      setBoardLabels((prev) => [...prev, newLabel])
      setNewLabelInput('')
      // Auto-select the new label
      const currentLabels = card.labels || []
      if (!currentLabels.includes(newLabel.name)) {
        const updatedLabels = [...currentLabels, newLabel.name]
        onUpdate({ labels: updatedLabels })
        logActivity('labels_changed', { labels: updatedLabels })
      }
    } catch (error) {
      console.error('Error creating board label:', error)
    } finally {
      setCreatingLabel(false)
    }
  }

  const handleDeleteBoardLabel = async (labelId: string, labelName: string) => {
    if (!boardId) return
    const confirmed = await confirm({
      title: t.common.delete,
      message: t.cards.deleteLabelConfirm || 'Delete this label for the entire board?',
      confirmText: t.common.delete,
      cancelText: t.common.cancel,
      variant: 'danger',
    })
    if (!confirmed) return
    try {
      const res = await fetch(`/api/boards/${boardId}/labels`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelId }),
      })
      if (!res.ok) throw new Error('Failed to delete label')
      setBoardLabels((prev) => prev.filter((l) => l.id !== labelId))
      // Refresh the entire board — the backend cascade already removed this
      // label from all cards in the DB, so a full refresh picks up everything
      if (onRefreshBoard) {
        await onRefreshBoard()
      } else {
        // Fallback: at least update current card if no refresh available
        const currentLabels = card.labels || []
        if (currentLabels.includes(labelName)) {
          const updatedLabels = currentLabels.filter((l) => l !== labelName)
          onUpdate({ labels: updatedLabels })
        }
      }
    } catch (error) {
      console.error('Error deleting board label:', error)
    }
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      await alert({ message: t.settings?.selectImage || 'Please select an image', variant: 'error' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      await alert({ message: t.settings?.imageSize || 'Image must be under 5MB', variant: 'error' })
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('cardId', card.id)
      const response = await fetch('/api/cards/upload', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Upload failed')
      const { images } = await response.json()
      if (images) {
        onImagesChange(images)
        logActivity('image_added')
      }
    } catch (error) {
      console.error('Upload error:', error)
      await alert({ message: t.settings?.uploadError || 'Upload error', variant: 'error' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    const confirmed = await confirm({
      title: t.cards.removeImage,
      message: t.cards.deleteConfirm || 'Are you sure?',
      confirmText: t.common.delete,
      cancelText: t.common.cancel,
      variant: 'danger',
    })
    if (!confirmed) return
    try {
      const response = await fetch(`/api/cards/${card.id}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      })
      if (!response.ok) throw new Error('Delete failed')
      const { images } = await response.json()
      onImagesChange(images)
      logActivity('image_removed')
      // Reset carousel index if needed
      if (carouselIndex >= images.length && images.length > 0) {
        setCarouselIndex(images.length - 1)
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      await alert({ message: t.settings?.uploadError || 'Error deleting image', variant: 'error' })
    }
  }

  const openCarousel = (index: number) => {
    setCarouselIndex(index)
    setShowImageModal(true)
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t.cards.deleteCard,
      message: t.cards.deleteConfirm || 'Are you sure?',
      confirmText: t.common.delete,
      cancelText: t.common.cancel,
      variant: 'danger',
    })
    if (confirmed) {
      onDelete()
      onClose()
    }
  }

  const isUserAssigned = (userId: string) => cardAssignments.some((a) => a.user_id === userId)

  const formatDateDisplay = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getDateBadgeClass = () => {
    if (!card.due_date) return ''
    if (card.is_completed) return 'cdm-date-completed'
    const days = getDaysRemaining(card.due_date)
    if (days < 0) return 'cdm-date-overdue'
    if (days === 0) return 'cdm-date-today'
    if (days <= 2) return 'cdm-date-soon'
    return ''
  }

  const getDateStatusLabel = () => {
    if (!card.due_date) return ''
    if (card.is_completed) return '✓'
    const days = getDaysRemaining(card.due_date)
    if (days < 0) return t.cards.overdue
    if (days === 0) return t.cards.dueToday
    if (days === 1) return t.cards.dueTomorrow
    const template = days === 1 ? t.cards.daysRemaining : t.cards.daysRemainingPlural
    return (template || '{count} days remaining').replace('{count}', String(days))
  }

  // --- Commentary & Activity handlers ---
  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const getActivityText = (actionType: string): string => {
    const map: Record<string, string> = {
      created: t.cards.activityCreated,
      moved: t.cards.activityMoved,
      renamed: t.cards.activityRenamed,
      description_changed: t.cards.activityDescriptionChanged,
      cover_changed: t.cards.activityCoverChanged,
      due_date_changed: t.cards.activityDueDateChanged,
      completed: t.cards.activityCompleted,
      uncompleted: t.cards.activityUncompleted,
      status_changed: t.cards.activityStatusChanged,
      labels_changed: t.cards.activityLabelsChanged,
      assigned: t.cards.activityAssigned,
      unassigned: t.cards.activityUnassigned,
      image_added: t.cards.activityImageAdded,
      image_removed: t.cards.activityImageRemoved,
      comment_added: t.cards.activityCommentAdded,
      comment_deleted: t.cards.activityCommentDeleted,
    }
    return map[actionType] || actionType
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submittingComment) return
    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      })
      if (response.ok) {
        const { comment } = await response.json()
        setComments((prev) => {
          const updated = [comment, ...prev]
          onCommentCountChange?.(updated.length)
          return updated
        })
        setCommentText('')
        // Refresh activity to show the new "comment_added" activity
        const actRes = await fetch(`/api/cards/${card.id}/activity`)
        if (actRes.ok) {
          const data = await actRes.json()
          setActivities(data.activities || [])
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return
    try {
      const response = await fetch(`/api/cards/${card.id}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content: editingCommentText }),
      })
      if (response.ok) {
        const { comment } = await response.json()
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? comment : c))
        )
        setEditingCommentId(null)
        setEditingCommentText('')
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    const confirmed = await confirm({
      title: t.cards.deleteComment,
      message: t.cards.deleteCommentConfirm,
      confirmText: t.common.delete,
      cancelText: t.common.cancel,
      variant: 'danger',
    })
    if (!confirmed) return
    try {
      const response = await fetch(`/api/cards/${card.id}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      })
      if (response.ok) {
        setComments((prev) => {
          const updated = prev.filter((c) => c.id !== commentId)
          onCommentCountChange?.(updated.length)
          return updated
        })
        // Refresh activity
        const actRes = await fetch(`/api/cards/${card.id}/activity`)
        if (actRes.ok) {
          const data = await actRes.json()
          setActivities(data.activities || [])
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const logActivity = async (actionType: string, actionData?: Record<string, unknown>) => {
    try {
      await fetch(`/api/cards/${card.id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_type: actionType, action_data: actionData || {} }),
      })
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  }

  // Build merged feed items
  const buildFeedItems = () => {
    type FeedItem =
      | { type: 'comment'; data: CardComment; timestamp: string }
      | { type: 'activity'; data: CardActivity; timestamp: string }

    const items: FeedItem[] = []

    if (feedFilter === 'all' || feedFilter === 'comments') {
      for (const c of comments) {
        items.push({ type: 'comment', data: c, timestamp: c.created_at })
      }
    }
    if (feedFilter === 'all' || feedFilter === 'activity') {
      for (const a of activities) {
        // Skip comment_added/comment_deleted from activity if showing comments
        if (feedFilter === 'all' && (a.action_type === 'comment_added' || a.action_type === 'comment_deleted')) continue
        items.push({ type: 'activity', data: a, timestamp: a.created_at })
      }
    }

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return items
  }

  // --- Render ---
  return (
    <div className="cdm-overlay" onClick={onClose}>
      <div className="cdm-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="cdm-close-btn" onClick={onClose}>✕</button>

        {/* Cover Section — color and image are independent */}
        {(card.cover_color || cardImages.length > 0) && (
          <div className="cdm-cover-section">
            {card.cover_color && (
              <div className="cdm-cover-color" style={{ backgroundColor: card.cover_color }} />
            )}
            {cardImages.length > 0 && (
              <div className="cdm-cover-image" onClick={() => openCarousel(0)}>
                <Image
                  src={cardImages[0].url}
                  alt={card.title}
                  width={800}
                  height={200}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  unoptimized
                />
                {cardImages.length > 1 && (
                  <span className="cdm-cover-image-count">🖼️ {cardImages.length}</span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="cdm-body">
          {/* ============ MAIN CONTENT (Left) ============ */}
          <div className="cdm-main">
            {/* Title */}
            <div className="cdm-title-section">
              <button
                className={`cdm-checkbox ${card.is_completed ? 'checked' : ''}`}
                onClick={handleToggleComplete}
                title={card.is_completed ? t.cards.markIncomplete : t.cards.markComplete}
              >
                {card.is_completed && '✓'}
              </button>
              <div className="cdm-title-wrapper">
                {editingTitle ? (
                  <input
                    ref={titleInputRef}
                    className="cdm-title-input"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle()
                      if (e.key === 'Escape') {
                        setTempTitle(card.title)
                        setEditingTitle(false)
                      }
                    }}
                  />
                ) : (
                  <h2
                    className={`cdm-title ${card.is_completed ? 'completed' : ''}`}
                    onClick={() => setEditingTitle(true)}
                  >
                    {card.title}
                    <button
                      className="cdm-edit-icon-btn"
                      onClick={(e) => { e.stopPropagation(); setEditingTitle(true) }}
                      title={t.common.edit}
                    >
                      ✏️
                    </button>
                  </h2>
                )}
              </div>
            </div>

            {/* Assigned Avatars (quick view) */}
            {cardAssignments.length > 0 && (
              <div className="cdm-assigned-row">
                <span className="cdm-section-label">{t.cards.assignedMembers}</span>
                <div className="cdm-assigned-avatars">
                  {cardAssignments.map((a) => (
                    <div key={a.user_id} className="cdm-avatar-chip" title={a.username || '?'}>
                      {a.avatar_url ? (
                        <Image src={a.avatar_url} alt={a.username || '?'} width={28} height={28} className="cdm-avatar-img" />
                      ) : (
                        <span className="cdm-avatar-initials">{getInitials(a.username)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="cdm-meta-section">
              <div className="cdm-section-header">
                <span className="cdm-section-icon">🏷️</span>
                <span className="cdm-section-label">{t.cards.statusAndLabels}</span>
              </div>
              <div className="cdm-meta-content">
                <div className="cdm-meta-row">
                  <span className="cdm-meta-title">{t.cards.status}</span>
                  {card.status ? (
                    <span className="cdm-status-chip">{card.status}</span>
                  ) : (
                    <span className="cdm-meta-empty">{t.cards.noStatus}</span>
                  )}
                </div>
                <div className="cdm-meta-row">
                  <span className="cdm-meta-title">{t.cards.labels}</span>
                  {(card.labels || []).length > 0 ? (
                    <div className="cdm-labels-list">
                      {(card.labels || []).map((label) => (
                        <span key={label} className="cdm-label-chip">{label}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="cdm-meta-empty">{t.cards.noLabels}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="cdm-description-section">
              <div className="cdm-section-header">
                <span className="cdm-section-icon">📝</span>
                <span className="cdm-section-label">{t.cards.cardDescription}</span>
                {!editingDescription && (
                  <button className="cdm-edit-icon-btn" onClick={() => setEditingDescription(true)} title={t.common.edit}>
                    ✏️
                  </button>
                )}
              </div>
              {editingDescription ? (
                <div className="cdm-description-edit">
                  <textarea
                    ref={descriptionRef}
                    className="cdm-description-textarea"
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    placeholder={t.cards.descriptionPlaceholder}
                    rows={5}
                  />
                  <div className="cdm-edit-actions">
                    <button className="cdm-btn-primary" onClick={handleSaveDescription}>{t.common.save}</button>
                    <button className="cdm-btn-secondary" onClick={() => {
                      setTempDescription(card.description || '')
                      setEditingDescription(false)
                    }}>{t.common.cancel}</button>
                  </div>
                </div>
              ) : (
                <div
                  className="cdm-description-display"
                  onClick={() => setEditingDescription(true)}
                >
                  {card.description ? (
                    <p className="cdm-description-text">{card.description}</p>
                  ) : (
                    <p className="cdm-description-placeholder">{t.cards.addDescription}</p>
                  )}
                </div>
              )}
            </div>

            {/* Dates Section */}
            <div className="cdm-dates-section">
              <div className="cdm-section-header">
                <span className="cdm-section-icon">📅</span>
                <span className="cdm-section-label">{t.cards.dates}</span>
              </div>

              {(card.start_date || card.due_date) && !showDateSection ? (
                <div className="cdm-dates-display">
                  {card.start_date && (
                    <div className="cdm-date-item">
                      <span className="cdm-date-label">{t.cards.startDate}</span>
                      <span className="cdm-date-value">{formatDateDisplay(card.start_date)}</span>
                    </div>
                  )}
                  {card.due_date && (
                    <div className="cdm-date-item">
                      <span className="cdm-date-label">{t.cards.dueDate}</span>
                      <span className={`cdm-date-value ${getDateBadgeClass()}`}>
                        {formatDateDisplay(card.due_date)}
                        <span className="cdm-date-status">{getDateStatusLabel()}</span>
                      </span>
                    </div>
                  )}
                  {card.start_date && card.due_date && (
                    <div className="cdm-date-duration">
                      📊 {(() => {
                        const days = getDuration(card.start_date, card.due_date)
                        const template = days === 1 ? t.cards.duration : t.cards.durationPlural
                        return (template || '{count} days').replace('{count}', String(days))
                      })()}
                    </div>
                  )}
                  <div className="cdm-date-actions-row">
                    <button className="cdm-btn-ghost" onClick={() => setShowDateSection(true)}>
                      ✏️ {t.common.edit}
                    </button>
                    {card.due_date && (
                      <button className="cdm-btn-google" onClick={handleAddToGoogleCalendar}>
                        <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M22 5.5v13c0 1.38-1.12 2.5-2.5 2.5H4.5C3.12 21 2 19.88 2 18.5v-13C2 4.12 3.12 3 4.5 3h15C20.88 3 22 4.12 22 5.5z"/></svg>
                        {t.cards.addToGoogleCalendar}
                      </button>
                    )}
                  </div>
                </div>
              ) : showDateSection ? (
                <div className="cdm-date-editor">
                  <div className="cdm-date-field">
                    <label className="cdm-date-checkbox-row">
                      <input type="checkbox" checked={useStartDate} onChange={(e) => setUseStartDate(e.target.checked)} />
                      <span>{t.cards.startDate}</span>
                    </label>
                    {useStartDate && (
                      <input
                        type="date"
                        className="cdm-date-input"
                        value={tempStartDate}
                        onChange={(e) => setTempStartDate(e.target.value)}
                        max={tempDueDate || undefined}
                      />
                    )}
                  </div>
                  <div className="cdm-date-field">
                    <label className="cdm-date-field-label">{t.cards.dueDate}</label>
                    <input
                      type="date"
                      className="cdm-date-input"
                      value={tempDueDate}
                      onChange={(e) => setTempDueDate(e.target.value)}
                      min={useStartDate ? tempStartDate : undefined}
                    />
                  </div>
                  {tempDueDate && (
                    <div className="cdm-date-preview">
                      ⏱️ {getDaysRemaining(tempDueDate)} {getDaysRemaining(tempDueDate) === 1 ? t.cards.day : t.cards.days}
                      {useStartDate && tempStartDate && (
                        <> &nbsp;·&nbsp; 📊 {getDuration(tempStartDate, tempDueDate)} {getDuration(tempStartDate, tempDueDate) === 1 ? t.cards.day : t.cards.days}</>
                      )}
                    </div>
                  )}
                  <div className="cdm-edit-actions">
                    <button className="cdm-btn-primary" onClick={handleSaveDates} disabled={!tempDueDate}>{t.common.save}</button>
                    <button className="cdm-btn-secondary" onClick={() => setShowDateSection(false)}>{t.common.cancel}</button>
                    {(card.start_date || card.due_date) && (
                      <button className="cdm-btn-danger-ghost" onClick={handleRemoveDates}>{t.cards.removeDates}</button>
                    )}
                  </div>
                </div>
              ) : (
                <button className="cdm-btn-ghost cdm-add-date-btn" onClick={() => setShowDateSection(true)}>
                  + {t.cards.setDates}
                </button>
              )}
            </div>

            {/* ===== Commentary & Activity ===== */}
            <div className="cdm-feed-section">
              <div className="cdm-section-header">
                <span className="cdm-section-icon">💬</span>
                <span className="cdm-section-label">{t.cards.commentaryAndActivity}</span>
              </div>

              {/* Filter tabs */}
              <div className="cdm-feed-tabs">
                <button
                  className={`cdm-feed-tab ${feedFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setFeedFilter('all')}
                >
                  {t.cards.showAll}
                </button>
                <button
                  className={`cdm-feed-tab ${feedFilter === 'comments' ? 'active' : ''}`}
                  onClick={() => setFeedFilter('comments')}
                >
                  {t.cards.showComments}
                </button>
                <button
                  className={`cdm-feed-tab ${feedFilter === 'activity' ? 'active' : ''}`}
                  onClick={() => setFeedFilter('activity')}
                >
                  {t.cards.showActivity}
                </button>
              </div>

              {/* Comment input */}
              <div className="cdm-comment-input-wrapper">
                <textarea
                  className="cdm-comment-input"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t.cards.writeComment}
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmitComment()
                    }
                  }}
                />
                <button
                  className="cdm-comment-send-btn"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                >
                  {t.cards.send}
                </button>
              </div>

              {/* Feed list */}
              {loadingFeed ? (
                <div className="cdm-activity-loading">{t.common.loading}</div>
              ) : (
                <div className="cdm-feed-list">
                  {buildFeedItems().length === 0 && (
                    <div className="cdm-activity-empty">
                      {feedFilter === 'comments' ? t.cards.noComments : feedFilter === 'activity' ? t.cards.noActivity : t.cards.noActivityLog}
                    </div>
                  )}
                  {buildFeedItems().map((item) => {
                    if (item.type === 'comment') {
                      const comment = item.data as CardComment
                      const isEditing = editingCommentId === comment.id
                      const wasEdited = comment.updated_at !== comment.created_at
                      return (
                        <div key={`comment-${comment.id}`} className="cdm-feed-item cdm-feed-comment">
                          <div className="cdm-feed-avatar">
                            {comment.avatar_url ? (
                              <Image src={comment.avatar_url} alt={comment.username || '?'} width={32} height={32} className="cdm-avatar-img" unoptimized />
                            ) : (
                              <span className="cdm-avatar-initials">{getInitials(comment.username)}</span>
                            )}
                          </div>
                          <div className="cdm-feed-body">
                            <div className="cdm-feed-header">
                              <span className="cdm-feed-username">{comment.username}</span>
                              <span className="cdm-feed-time">{formatActivityDate(comment.created_at)}</span>
                              {wasEdited && <span className="cdm-feed-edited">{t.cards.commentEdited}</span>}
                            </div>
                            {isEditing ? (
                              <div className="cdm-comment-edit-wrapper">
                                <textarea
                                  className="cdm-comment-input"
                                  value={editingCommentText}
                                  onChange={(e) => setEditingCommentText(e.target.value)}
                                  rows={2}
                                  placeholder={t.cards.writeComment}
                                />
                                <div className="cdm-edit-actions">
                                  <button className="cdm-btn-primary" onClick={() => handleEditComment(comment.id)}>{t.common.save}</button>
                                  <button className="cdm-btn-secondary" onClick={() => { setEditingCommentId(null); setEditingCommentText('') }}>{t.common.cancel}</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="cdm-comment-text">{comment.content}</div>
                                <div className="cdm-comment-actions">
                                  <button
                                    className="cdm-comment-action-btn"
                                    onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.content) }}
                                  >
                                    {t.cards.editComment}
                                  </button>
                                  <button
                                    className="cdm-comment-action-btn cdm-comment-delete-btn"
                                    onClick={() => handleDeleteComment(comment.id)}
                                  >
                                    {t.cards.deleteComment}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    } else {
                      const activity = item.data as CardActivity
                      return (
                        <div key={`activity-${activity.id}`} className="cdm-feed-item cdm-feed-activity">
                          <div className="cdm-feed-avatar cdm-feed-activity-icon">
                            <span className="cdm-activity-dot-icon" />
                          </div>
                          <div className="cdm-feed-body">
                            <div className="cdm-feed-activity-text">
                              <span className="cdm-feed-username">{activity.username}</span>
                              {' '}
                              <span className="cdm-feed-action-text">{getActivityText(activity.action_type)}</span>
                              {' '}
                              <span className="cdm-feed-time">{formatActivityDate(activity.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ============ SIDEBAR (Right) ============ */}
          <div className="cdm-sidebar">
            {/* Completion */}
            <div className="cdm-sidebar-section">
              <button
                className={`cdm-sidebar-btn ${card.is_completed ? 'cdm-completed-btn' : ''}`}
                onClick={handleToggleComplete}
              >
                {card.is_completed ? '✓ ' : '○ '}
                {card.is_completed ? t.cards.markIncomplete : t.cards.markComplete}
              </button>
            </div>

            {/* Assignments */}
            <div className="cdm-sidebar-section">
              <div className="cdm-sidebar-section-title">👤 {t.cards.assignTasks}</div>
              {cardAssignments.length > 0 && (
                <div className="cdm-sidebar-assignees">
                  {cardAssignments.map((a) => (
                    <div key={a.user_id} className="cdm-sidebar-assignee">
                      <div className="cdm-sidebar-assignee-avatar">
                        {a.avatar_url ? (
                          <Image src={a.avatar_url} alt={a.username || '?'} width={24} height={24} className="cdm-avatar-img" />
                        ) : (
                          <span className="cdm-avatar-initials-sm">{getInitials(a.username)}</span>
                        )}
                      </div>
                      <span className="cdm-sidebar-assignee-name">{a.username}</span>
                    </div>
                  ))}
                </div>
              )}
              <button className="cdm-sidebar-btn" onClick={() => setShowAssignPanel(!showAssignPanel)}>
                {t.sharing.manageMembers}
              </button>

              {/* Inline Assign Panel */}
              {showAssignPanel && (
                <div className="cdm-assign-panel">
                  {boardMembers.map((member) => {
                    const assigned = isUserAssigned(member.user_id)
                    const toggling = togglingUser === member.user_id
                    return (
                      <button
                        key={member.user_id}
                        className={`cdm-assign-row ${assigned ? 'assigned' : ''}`}
                        onClick={() => onToggleAssignment(member.user_id)}
                        disabled={toggling}
                      >
                        <div className="cdm-assign-row-avatar">
                          {member.avatar_url ? (
                            <Image src={member.avatar_url} alt={member.username || ''} width={28} height={28} className="cdm-avatar-img" />
                          ) : (
                            <span className="cdm-avatar-initials">{getInitials(member.username)}</span>
                          )}
                        </div>
                        <span className="cdm-assign-row-name">{member.username || '?'}</span>
                        <div className={`cdm-assign-check ${assigned ? 'checked' : ''}`}>
                          {assigned && '✓'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Status & Labels — dropdown menus */}
            <div className="cdm-sidebar-section">
              <div className="cdm-sidebar-section-title">🏷️ {t.cards.statusAndLabels}</div>

              {/* Status dropdown */}
              <div className="cdm-dropdown-wrapper">
                <button
                  className="cdm-sidebar-btn cdm-dropdown-trigger"
                  onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowLabelDropdown(false) }}
                >
                  {card.status ? (
                    <><span className="cdm-status-chip-sm">{card.status}</span> ▾</>
                  ) : (
                    <>{t.cards.statusPlaceholder} ▾</>
                  )}
                </button>
                {showStatusDropdown && (
                  <div className="cdm-dropdown-menu">
                    {boardStatuses.length > 0 && (
                      <div className="cdm-dropdown-items">
                        {boardStatuses.map((s) => (
                          <div key={s.id} className={`cdm-dropdown-item ${card.status === s.name ? 'active' : ''}`}>
                            <button
                              className="cdm-dropdown-item-btn"
                              onClick={() => handleSelectStatus(s.name)}
                            >
                              <span className="cdm-dropdown-dot" style={{ background: s.color }} />
                              {s.name}
                              {card.status === s.name && <span className="cdm-dropdown-check">✓</span>}
                            </button>
                            <button
                              className="cdm-dropdown-delete-btn"
                              onClick={() => handleDeleteBoardStatus(s.id, s.name)}
                              title={t.common.delete}
                            >✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {boardStatuses.length === 0 && (
                      <div className="cdm-dropdown-empty">{t.cards.noStatus}</div>
                    )}
                    <div className="cdm-dropdown-create">
                      <input
                        type="text"
                        className="cdm-dropdown-input"
                        placeholder={t.cards.newStatusPlaceholder || 'New status...'}
                        value={newStatusInput}
                        onChange={(e) => setNewStatusInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            void handleCreateBoardStatus()
                          }
                        }}
                      />
                      <button
                        className="cdm-dropdown-add-btn"
                        onClick={() => void handleCreateBoardStatus()}
                        disabled={!newStatusInput.trim() || creatingStatus}
                      >
                        + {t.cards.addStatus || 'Add status'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Label dropdown */}
              <div className="cdm-dropdown-wrapper">
                <button
                  className="cdm-sidebar-btn cdm-dropdown-trigger"
                  onClick={() => { setShowLabelDropdown(!showLabelDropdown); setShowStatusDropdown(false) }}
                >
                  {(card.labels || []).length > 0 ? (
                    <><span className="cdm-labels-inline">{(card.labels || []).join(', ')}</span> ▾</>
                  ) : (
                    <>{t.cards.labelPlaceholder} ▾</>
                  )}
                </button>
                {showLabelDropdown && (
                  <div className="cdm-dropdown-menu">
                    {boardLabels.length > 0 && (
                      <div className="cdm-dropdown-items">
                        {boardLabels.map((l) => {
                          const isSelected = (card.labels || []).includes(l.name)
                          return (
                            <div key={l.id} className={`cdm-dropdown-item ${isSelected ? 'active' : ''}`}>
                              <button
                                className="cdm-dropdown-item-btn"
                                onClick={() => handleSelectLabel(l.name)}
                              >
                                <span className="cdm-dropdown-dot" style={{ background: l.color }} />
                                {l.name}
                                {isSelected && <span className="cdm-dropdown-check">✓</span>}
                              </button>
                              <button
                                className="cdm-dropdown-delete-btn"
                                onClick={() => handleDeleteBoardLabel(l.id, l.name)}
                                title={t.common.delete}
                              >✕</button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {boardLabels.length === 0 && (
                      <div className="cdm-dropdown-empty">{t.cards.noLabels}</div>
                    )}
                    <div className="cdm-dropdown-create">
                      <input
                        type="text"
                        className="cdm-dropdown-input"
                        placeholder={t.cards.newLabelPlaceholder || 'New label...'}
                        value={newLabelInput}
                        onChange={(e) => setNewLabelInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            void handleCreateBoardLabel()
                          }
                        }}
                      />
                      <button
                        className="cdm-dropdown-add-btn"
                        onClick={() => void handleCreateBoardLabel()}
                        disabled={!newLabelInput.trim() || creatingLabel}
                      >
                        + {t.cards.addLabel}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Currently applied labels */}
              {(card.labels || []).length > 0 && (
                <div className="cdm-sidebar-labels-list">
                  {(card.labels || []).map((label) => (
                    <button
                      key={label}
                      className="cdm-sidebar-label-chip"
                      onClick={() => handleRemoveLabel(label)}
                      title={t.cards.removeLabel}
                    >
                      {label} <span>✕</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dates Shortcut */}
            <div className="cdm-sidebar-section">
              <button className="cdm-sidebar-btn" onClick={() => setShowDateSection(true)}>
                📅 {t.cards.setDates}
              </button>
            </div>

            {/* Cover Color */}
            <div className="cdm-sidebar-section">
              <button className="cdm-sidebar-btn" onClick={() => setShowColorPicker(!showColorPicker)}>
                🎨 {t.cards.changeCover}
              </button>
              {showColorPicker && (
                <div className="cdm-color-picker">
                  {CARD_COLORS.map((color) => (
                    <button
                      key={color.value || 'none'}
                      className={`cdm-color-option ${card.cover_color === color.value ? 'selected' : ''}`}
                      style={{
                        backgroundColor: color.value || '#fff',
                        border: color.value ? 'none' : '2px solid #ddd',
                      }}
                      onClick={() => handleColorChange(color.value)}
                      title={color.name}
                    >
                      {card.cover_color === color.value && '✓'}
                    </button>
                  ))}
                </div>
              )}
              {card.cover_color && (
                <button className="cdm-sidebar-btn cdm-btn-remove" onClick={() => onUpdate({ cover_color: null })}>
                  ✖ {t.cards.removeCover}
                </button>
              )}
            </div>

            {/* Images / Attachments */}
            <div className="cdm-sidebar-section">
              <div className="cdm-sidebar-section-title">🖼️ {t.cards.addImage}</div>
              {cardImages.length > 0 && (
                <div className="cdm-sidebar-gallery">
                  {cardImages.map((img, idx) => (
                    <div key={img.id} className="cdm-sidebar-gallery-item">
                      <div className="cdm-sidebar-thumb" onClick={() => openCarousel(idx)}>
                        <Image src={img.url} alt={`Image ${idx + 1}`} width={200} height={100} style={{ width: '100%', height: 'auto', borderRadius: 6 }} unoptimized />
                      </div>
                      <button
                        className="cdm-gallery-delete-btn"
                        onClick={() => handleDeleteImage(img.id)}
                        title={t.cards.removeImage}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                className="cdm-sidebar-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? t.cards.uploading : `+ ${t.cards.addImage}`}
              </button>
            </div>

            {/* GitHub Power-Up */}
            <div className="cdm-sidebar-section">
              <button className="cdm-sidebar-btn" onClick={() => setShowGitHubPowerUp(true)}>
                🔗 {t.github.powerUp}
              </button>
            </div>

            {/* Delete */}
            <div className="cdm-sidebar-section cdm-sidebar-danger">
              <button className="cdm-sidebar-btn cdm-btn-danger" onClick={handleDelete}>
                🗑️ {t.cards.deleteCard}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Carousel Lightbox */}
      {showImageModal && cardImages.length > 0 && (
        <div className="cdm-image-lightbox" onClick={(e) => { e.stopPropagation(); setShowImageModal(false) }}>
          <div className="cdm-image-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="cdm-close-btn" onClick={() => setShowImageModal(false)}>✕</button>

            {/* Left Arrow */}
            {cardImages.length > 1 && (
              <button
                className="cdm-carousel-arrow cdm-carousel-left"
                onClick={() => setCarouselIndex((prev) => (prev - 1 + cardImages.length) % cardImages.length)}
              >
                ‹
              </button>
            )}

            <Image
              src={cardImages[carouselIndex]?.url || ''}
              alt={`${card.title} - ${carouselIndex + 1}`}
              width={900}
              height={600}
              style={{ width: '100%', height: 'auto' }}
              unoptimized
            />

            {/* Right Arrow */}
            {cardImages.length > 1 && (
              <button
                className="cdm-carousel-arrow cdm-carousel-right"
                onClick={() => setCarouselIndex((prev) => (prev + 1) % cardImages.length)}
              >
                ›
              </button>
            )}

            {/* Dots / Counter */}
            {cardImages.length > 1 && (
              <div className="cdm-carousel-counter">
                {carouselIndex + 1} / {cardImages.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GitHub Power-Up Modal */}
      {showGitHubPowerUp && (
        <div onClick={(e) => e.stopPropagation()}>
          <GitHubPowerUp
            cardId={card.id}
            onClose={() => setShowGitHubPowerUp(false)}
            onUpdate={() => onUpdate({})}
          />
        </div>
      )}
    </div>
  )
}
