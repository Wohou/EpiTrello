'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '@/lib/language-context'
import { useNotification } from '@/components/NotificationContext'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { CardGitHubLink, GitHubRepo, GitHubIssue } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import './GitHubPowerUp.css'

interface GitHubPowerUpProps {
  cardId: string
  onClose: () => void
  onUpdate?: () => void
}

export default function GitHubPowerUp({ cardId, onClose, onUpdate }: GitHubPowerUpProps) {
  const { t } = useLanguage()
  const { alert, confirm } = useNotification()
  const [connected, setConnected] = useState(false)
  const [, setHasRepoScope] = useState(false)
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'main' | 'link' | 'create'>('main')

  // Link existing issue
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null)
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [loadingIssues, setLoadingIssues] = useState(false)

  // Create new issue
  const [issueTitle, setIssueTitle] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [creating, setCreating] = useState(false)

  // Linked issues
  const [linkedIssues, setLinkedIssues] = useState<CardGitHubLink[]>([])
  const [loadingLinks, setLoadingLinks] = useState(false)

  // Realtime subscription
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchLinkedIssues = useCallback(async () => {
    setLoadingLinks(true)
    try {
      const response = await fetch(`/api/cards/${cardId}/github`)
      if (response.ok) {
        const data = await response.json()
        setLinkedIssues(data)
      }
    } catch (error) {
      console.error('Error fetching linked issues:', error)
    } finally {
      setLoadingLinks(false)
    }
  }, [cardId])

  useEffect(() => {
    checkGitHubConnection()
    if (connected) {
      fetchLinkedIssues()
    }

    const channel = supabaseBrowser
      .channel(`card-github-${cardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_github_links',
          filter: `card_id=eq.${cardId}`
        },
        () => {
          console.log('🔔 GitHub links changed - refreshing popup')
          fetchLinkedIssues()
        }
      )
      .subscribe((status) => {
        console.log('Popup Realtime status:', status)
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabaseBrowser.removeChannel(channelRef.current)
      }
    }
  }, [connected, cardId, fetchLinkedIssues])

  const checkGitHubConnection = async () => {
    try {
      const response = await fetch('/api/github/connect')
      if (response.ok) {
        const data = await response.json()
        setConnected(data.connected)
        setHasRepoScope(data.hasRepoScope)
        setGithubUsername(data.github_username)
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectGitHub = async () => {
    try {
      const { data: sessionData } = await supabaseBrowser.auth.getSession()
      if (!sessionData?.session) {
        await alert({ message: t.github.connectionError, variant: 'error' })
        return
      }

      const checkResponse = await fetch('/api/github/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!checkResponse.ok) {
        if (checkResponse.status === 401) {
          await alert({ message: t.github.connectionError, variant: 'error' })
        } else {
          await alert({ message: t.github.connectionError, variant: 'error' })
        }
        return
      }

      const data = await checkResponse.json()

      if (data.needsLinking || data.needsReauth) {
        const { error } = await supabaseBrowser.auth.linkIdentity({
          provider: 'github',
          options: {
            scopes: 'user:email repo',
            redirectTo: `${window.location.href}`,
          },
        })

        if (error) {
          console.error('Error linking GitHub:', error)
          await alert({ message: t.github.connectionError, variant: 'error' })
        }
      } else if (data.success) {
        setConnected(true)
        setGithubUsername(data.github_username)
        fetchLinkedIssues()
      }
    } catch (error) {
      console.error('Error connecting GitHub:', error)
      await alert({ message: t.github.connectionError, variant: 'error' })
    }
  }

  const disconnectGitHub = async () => {
    try {
      const response = await fetch('/api/github/connect', { method: 'DELETE' })
      if (response.ok) {
        setConnected(false)
        setGithubUsername(null)
        setLinkedIssues([])
      }
    } catch (error) {
      console.error('Error disconnecting GitHub:', error)
      await alert({ message: t.github.connectionError, variant: 'error' })
    }
  }

  const fetchRepositories = async () => {
    setLoadingRepos(true)
    try {
      const tokenResponse = await fetch('/api/github/token')
      if (!tokenResponse.ok) {
        if (tokenResponse.status === 403) {
          await alert({ message: t.github.connectionError, variant: 'error' })
          return
        }
        throw new Error('GitHub not connected')
      }

      const { token } = await tokenResponse.json()

      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRepos(data)
      }
    } catch (error) {
      console.error('Error fetching repositories:', error)
      await alert({ message: t.github.error, variant: 'error' })
    } finally {
      setLoadingRepos(false)
    }
  }

  const fetchIssues = async (repoFullName: string) => {
    const [owner, repo] = repoFullName.split('/')
    setLoadingIssues(true)
    try {
      const tokenResponse = await fetch('/api/github/token')
      if (!tokenResponse.ok) {
        if (tokenResponse.status === 403) {
          await alert({ message: t.github.connectionError, variant: 'error' })
          return
        }
        throw new Error('GitHub not connected')
      }

      const { token } = await tokenResponse.json()

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        const filteredIssues = data.filter((issue: { pull_request?: unknown }) => !issue.pull_request)
        setIssues(filteredIssues)
      }
    } catch (error) {
      console.error('Error fetching issues:', error)
      await alert({ message: t.github.error, variant: 'error' })
    } finally {
      setLoadingIssues(false)
    }
  }

  const handleRepoChange = (repoFullName: string) => {
    setSelectedRepo(repoFullName)
    setSelectedIssue(null)
    if (repoFullName) {
      fetchIssues(repoFullName)
    } else {
      setIssues([])
    }
  }

  const handleLinkExisting = async () => {
    if (!selectedRepo || selectedIssue === null) return

    const [owner, repo] = selectedRepo.split('/')
    const issue = issues.find((i: GitHubIssue) => i.number === selectedIssue)
    if (!issue) return

    try {
      const response = await fetch(`/api/cards/${cardId}/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_type: 'issue',
          github_repo_owner: owner,
          github_repo_name: repo,
          github_number: issue.number,
          github_url: issue.html_url,
          github_title: issue.title,
          github_state: issue.state,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        await fetchLinkedIssues()

        if (result.webhook) {
          if (result.webhook.created) {
            console.log('✅ Webhook créé automatiquement pour la synchronisation bidirectionnelle')
          } else if (result.webhook.reason === 'already_exists') {
            console.log('ℹ️ Webhook déjà configuré - synchronisation bidirectionnelle active')
          } else if (result.webhook.reason === 'no_admin_permission') {
            console.log('⚠️ Pas de droits admin - synchronisation manuelle uniquement')
          }
        }

        setView('main')
        setSelectedRepo('')
        setSelectedIssue(null)
      } else {
        const error = await response.json()
        await alert({ message: error.error || t.github.linkError, variant: 'error' })
      }
    } catch (error) {
      console.error('Error linking issue:', error)
      await alert({ message: t.github.linkError, variant: 'error' })
    }
  }

  const handleCreateIssue = async () => {
    if (!selectedRepo || !issueTitle.trim()) return

    const [owner, repo] = selectedRepo.split('/')
    setCreating(true)

    try {
      const tokenResponse = await fetch('/api/github/token')
      if (!tokenResponse.ok) {
        if (tokenResponse.status === 403) {
          await alert({ message: t.github.connectionError, variant: 'error' })
          return
        }
        throw new Error('GitHub not connected')
      }

      const { token } = await tokenResponse.json()

      const createResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: issueTitle,
            body: issueDescription || undefined,
            labels: [],
          }),
        }
      )

      if (!createResponse.ok) {
        throw new Error('Failed to create issue on GitHub')
      }

      const issue = await createResponse.json()

      const linkResponse = await fetch(`/api/cards/${cardId}/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_type: 'issue',
          github_repo_owner: owner,
          github_repo_name: repo,
          github_number: issue.number,
          github_url: issue.html_url,
          github_title: issue.title,
          github_state: issue.state,
        }),
      })

      if (linkResponse.ok) {
        const result = await linkResponse.json()
        await fetchLinkedIssues()

        if (result.webhook) {
          if (result.webhook.created) {
            console.log('✅ Webhook créé automatiquement pour la synchronisation bidirectionnelle')
          } else if (result.webhook.reason === 'already_exists') {
            console.log('ℹ️ Webhook déjà configuré - synchronisation bidirectionnelle active')
          }
        }

        setView('main')
        setSelectedRepo('')
        setIssueTitle('')
        setIssueDescription('')
      } else {
        const error = await linkResponse.json()
        await alert({ message: error.error || t.github.createError, variant: 'error' })
      }
    } catch (error) {
      console.error('Error creating issue:', error)
      await alert({ message: t.github.createError, variant: 'error' })
    } finally {
      setCreating(false)
    }
  }

  const handleUnlink = async (linkId: string) => {
    const confirmed = await confirm({
      title: 'GitHub',
      message: t.github.unlinkConfirm,
      confirmText: t.common.delete,
      cancelText: t.common.cancel,
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      const response = await fetch(`/api/cards/${cardId}/github?linkId=${linkId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchLinkedIssues()
      }
    } catch (error) {
      console.error('Error unlinking issue:', error)
      await alert({ message: t.github.error, variant: 'error' })
    }
  }

  const handleToggleIssueState = async (link: CardGitHubLink) => {
    const newState = link.github_state === 'open' ? 'closed' : 'open'
    const action = newState === 'closed' ? t.github.closeAction : t.github.reopenAction

    const confirmed = await confirm({
      title: 'GitHub',
      message: t.github.toggleIssueConfirm.replace('{action}', action).replace('{number}', String(link.github_number)),
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: t.common.cancel,
    })
    if (!confirmed) return

    setLinkedIssues(prev =>
      prev.map(issue =>
        issue.id === link.id
          ? { ...issue, github_state: newState }
          : issue
      )
    )

    try {
      const tokenResponse = await fetch('/api/github/token')
      if (!tokenResponse.ok) {
        await fetchLinkedIssues()
        await alert({ message: t.github.connectionError, variant: 'error' })
        return
      }

      const { token } = await tokenResponse.json()

      const response = await fetch(
        `https://api.github.com/repos/${link.github_repo_owner}/${link.github_repo_name}/issues/${link.github_number}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ state: newState })
        }
      )

      if (response.ok) {
        const updatedIssue = await response.json()

        const updateResponse = await fetch(`/api/cards/${cardId}/github`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linkId: link.id,
            github_state: updatedIssue.state
          })
        })

        if (!updateResponse.ok) {
          console.error('Failed to update local state:', await updateResponse.text())
          await fetchLinkedIssues()
        }

        onUpdate?.()
      } else {
        const error = await response.json()
        await fetchLinkedIssues()
        await alert({ message: `Erreur: ${error.message || t.github.toggleError}`, variant: 'error' })
      }
    } catch (error) {
      console.error('Error toggling issue state:', error)
      await fetchLinkedIssues()
      await alert({ message: t.github.error, variant: 'error' })
    }
  }

  const renderMainView = () => (
    <>
      <div className="github-header">
        <h3>
          <svg className="github-icon" viewBox="0 0 16 16" width="20" height="20">
            <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          {t.github.powerUp}
        </h3>
      </div>

      {!connected ? (
        <div className="github-connect-section">
          <p>{t.github.notConnected}</p>
          <button className="github-connect-btn" onClick={connectGitHub}>
            {t.github.connectGitHub}
          </button>
        </div>
      ) : (
        <>
          <div className="github-status">
            <span className="github-connected-badge">
              ✓ {t.github.connected} <strong>{githubUsername}</strong>
            </span>
            <button className="github-disconnect-btn" onClick={disconnectGitHub}>
              {t.github.disconnectGitHub}
            </button>
          </div>

          <div className="github-actions">
            <button
              className="github-action-btn primary"
              onClick={() => {
                setView('link')
                fetchRepositories()
              }}
            >
              🔗 {t.github.linkIssue}
            </button>
            <button
              className="github-action-btn"
              onClick={() => {
                  setView('create')
                  fetchRepositories()
              }}
            >
              ✨ {t.github.createIssue}
            </button>
          </div>

          <div className="github-linked-section">
            <h4>{t.github.linkedIssues}</h4>
            {loadingLinks ? (
              <div className="github-loading">{t.github.loading}</div>
            ) : linkedIssues.length === 0 ? (
              <div className="github-empty">{t.github.noLinkedIssues}</div>
            ) : (
              <div className="github-linked-list">
                {linkedIssues.map((link) => (
                  <div key={link.id} className="github-issue-card">
                    <div className="issue-header">
                      <span className={`issue-badge ${link.github_state}`}>
                        {link.github_type === 'pull_request' ? '↗️' : '⚫'} #{link.github_number}
                      </span>
                      <button
                        className={`issue-state-toggle ${link.github_state}`}
                        onClick={() => handleToggleIssueState(link)}
                        title={link.github_state === 'open' ? t.github.clickToClose : t.github.clickToReopen}
                      >
                        {link.github_state === 'open'
                          ? (t.github.openIssue || 'Ouvert')
                          : (t.github.closedIssue || 'Fermé')}
                        <span className="toggle-icon">
                          {link.github_state === 'open' ? '✓' : '↻'}
                        </span>
                      </button>
                    </div>
                    <div className="issue-title">{link.github_title}</div>
                    <div className="issue-repo">{link.github_repo_owner}/{link.github_repo_name}</div>
                    <div className="issue-actions">
                      <a
                        href={link.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="issue-link-btn"
                      >
                        {t.github.viewOnGitHub} ↗
                      </a>
                      <button
                        className="issue-unlink-btn"
                        onClick={() => handleUnlink(link.id)}
                      >
                        {t.github.unlink}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )

  const renderLinkView = () => (
    <>
      <div className="github-view-header">
        <button className="github-back-btn" onClick={() => setView('main')}>
          ← {t.common?.back || 'Back'}
        </button>
        <h3>{t.github.linkExisting}</h3>
      </div>

      <div className="github-form">
        <div className="form-group">
          <label>{t.github.selectRepository}</label>
          <select
            value={selectedRepo}
            onChange={(e) => handleRepoChange(e.target.value)}
            disabled={loadingRepos}
          >
            <option value="">
              {loadingRepos
                ? t.github.loadingRepos
                : (repos.length === 0
                    ? t.github.noRepos
                    : t.github.selectRepoPlaceholder)}
            </option>
            {repos.map((repo) => (
              <option key={repo.id} value={repo.full_name}>
                {repo.full_name}
              </option>
            ))}
          </select>
        </div>

        {selectedRepo && (
          <div className="form-group">
            <label>{t.github.selectIssue}</label>
            <select
              value={selectedIssue || ''}
              onChange={(e) => setSelectedIssue(Number(e.target.value))}
              disabled={loadingIssues}
            >
              <option value="">
                {loadingIssues
                  ? t.github.loadingIssues
                  : (issues.length === 0
                      ? t.github.noIssues
                      : t.github.selectIssuePlaceholder)}
              </option>
              {issues.map((issue) => (
                <option key={issue.id} value={issue.number}>
                  #{issue.number} - {issue.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          className="github-submit-btn"
          onClick={handleLinkExisting}
          disabled={!selectedRepo || selectedIssue === null}
        >
          {t.github.linkExisting}
        </button>
      </div>
    </>
  )

  const renderCreateView = () => (
    <>
      <div className="github-view-header">
        <button className="github-back-btn" onClick={() => setView('main')}>
          ← {t.common?.back || 'Back'}
        </button>
        <h3>{t.github.createIssue}</h3>
      </div>

      <div className="github-form">
        <div className="form-group">
          <label>{t.github.selectRepository}</label>
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            disabled={loadingRepos}
          >
            <option value="">
              {loadingRepos
                ? t.github.loadingRepos
                : (repos.length === 0
                    ? t.github.noRepos
                    : t.github.selectRepoPlaceholder)}
            </option>
            {repos.map((repo) => (
              <option key={repo.id} value={repo.full_name}>
                {repo.full_name}
              </option>
            ))}
          </select>
        </div>

        {selectedRepo && (
          <>
            <div className="form-group">
              <label>{t.github.issueTitle}</label>
              <input
                type="text"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder={t.github.issueTitlePlaceholder}
              />
            </div>

            <div className="form-group">
              <label>{t.github.issueDescription}</label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder={t.github.issueDescriptionPlaceholder}
                rows={5}
              />
            </div>
          </>
        )}

        <button
          className="github-submit-btn"
          onClick={handleCreateIssue}
          disabled={!selectedRepo || !issueTitle.trim() || creating}
        >
          {creating
            ? t.github.creatingIssue
            : t.github.createAndLink}
        </button>
      </div>
    </>
  )

  if (loading) {
    return (
      <div className="github-powerup-overlay" onClick={onClose}>
        <div className="github-powerup-modal" onClick={(e) => e.stopPropagation()}>
          <button className="github-close-btn" onClick={onClose}>✕</button>
          <div className="github-loading">{t.github.loading}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="github-powerup-overlay" onClick={onClose}>
      <div className="github-powerup-modal" onClick={(e) => e.stopPropagation()}>
        <button className="github-close-btn" onClick={onClose}>✕</button>

        {view === 'main' && renderMainView()}
        {view === 'link' && renderLinkView()}
        {view === 'create' && renderCreateView()}
      </div>
    </div>
  )
}
