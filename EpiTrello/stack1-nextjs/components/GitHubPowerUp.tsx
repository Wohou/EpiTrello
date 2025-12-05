'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/language-context'
import { supabase } from '@/lib/supabase'
import type { CardGitHubLink, GitHubRepo, GitHubIssue } from '@/lib/supabase'
import './GitHubPowerUp.css'

interface GitHubPowerUpProps {
  cardId: string
  onClose: () => void
}

export default function GitHubPowerUp({ cardId, onClose }: GitHubPowerUpProps) {
  const { t } = useLanguage()
  const [connected, setConnected] = useState(false)
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

  useEffect(() => {
    checkGitHubConnection()
    if (connected) {
      fetchLinkedIssues()
    }
  }, [connected])

  const checkGitHubConnection = async () => {
    try {
      const response = await fetch('/api/github/connect')
      if (response.ok) {
        const data = await response.json()
        setConnected(data.connected)
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
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session) {
        alert(t.github?.connectionError || 'Vous devez être connecté avant de lier GitHub. Merci de vous reconnecter.')
        return
      }

      const checkResponse = await fetch('/api/github/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!checkResponse.ok) {
        if (checkResponse.status === 401) {
          alert(t.github?.connectionError || 'Session expirée. Merci de vous reconnecter.')
        } else {
          alert(t.github?.connectionError || 'Erreur lors de la vérification GitHub')
        }
        return
      }

      const data = await checkResponse.json()

      if (data.needsLinking || data.needsReauth) {
        const { error } = await supabase.auth.linkIdentity({
          provider: 'github',
          options: {
            scopes: 'user:email repo',
            redirectTo: `${window.location.origin}/boards`,
          },
        })

        if (error) {
          console.error('Error linking GitHub:', error)
          alert(t.github?.connectionError || 'Error linking GitHub')
        }
      } else if (data.success) {
        setConnected(true)
        setGithubUsername(data.github_username)
        fetchLinkedIssues()
      }
    } catch (error) {
      console.error('Error connecting GitHub:', error)
      alert(t.github?.connectionError || 'Error connecting GitHub')
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
      alert(t.github?.connectionError || 'Error disconnecting GitHub')
    }
  }

  const fetchLinkedIssues = async () => {
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
  }

  const fetchRepositories = async () => {
    setLoadingRepos(true)
    try {
      const tokenResponse = await fetch('/api/github/token')
      if (!tokenResponse.ok) {
        if (tokenResponse.status === 403) {
          alert(t.github?.connectionError || 'Session GitHub invalide. Merci de reconnecter GitHub.')
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
      alert(t.github?.error || 'Error loading repositories')
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
          alert(t.github?.connectionError || 'Session GitHub invalide. Merci de reconnecter GitHub.')
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
        const filteredIssues = data.filter((issue: any) => !issue.pull_request)
        setIssues(filteredIssues)
      }
    } catch (error) {
      console.error('Error fetching issues:', error)
      alert(t.github?.error || 'Error loading issues')
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
        await fetchLinkedIssues()
        setView('main')
        setSelectedRepo('')
        setSelectedIssue(null)
      } else {
        const error = await response.json()
        alert(error.error || t.github?.linkError || 'Error linking issue')
      }
    } catch (error) {
      console.error('Error linking issue:', error)
      alert(t.github?.linkError || 'Error linking issue')
    }
  }

  const handleCreateIssue = async () => {
    if (!selectedRepo || !issueTitle.trim()) return

    const [owner, repo] = selectedRepo.split('/')
    setCreating(true)

    try {
      // Get GitHub token from backend
      const tokenResponse = await fetch('/api/github/token')
      if (!tokenResponse.ok) {
        if (tokenResponse.status === 403) {
          alert(t.github?.connectionError || 'Session GitHub invalide. Merci de reconnecter GitHub.')
          return
        }
        throw new Error('GitHub not connected')
      }

      const { token } = await tokenResponse.json()

      // Create issue on GitHub
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

      // Link to card
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
        await fetchLinkedIssues()
        setView('main')
        setSelectedRepo('')
        setIssueTitle('')
        setIssueDescription('')
      } else {
        const error = await linkResponse.json()
        alert(error.error || t.github?.createError || 'Error linking issue')
      }
    } catch (error) {
      console.error('Error creating issue:', error)
      alert(t.github?.createError || 'Error creating issue')
    } finally {
      setCreating(false)
    }
  }

  const handleUnlink = async (linkId: string) => {
    if (!confirm(t.github?.unlinkConfirm || 'Unlink this issue?')) return

    try {
      const response = await fetch(`/api/cards/${cardId}/github?linkId=${linkId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchLinkedIssues()
      }
    } catch (error) {
      console.error('Error unlinking issue:', error)
      alert(t.github?.error || 'Error unlinking issue')
    }
  }

  const renderMainView = () => (
    <>
      <div className="github-header">
        <h3>
          <svg className="github-icon" viewBox="0 0 16 16" width="20" height="20">
            <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          {t.github?.powerUp || 'GitHub Power-Up'}
        </h3>
      </div>

      {!connected ? (
        <div className="github-connect-section">
          <p>{t.github?.notConnected || 'GitHub not connected'}</p>
          <button className="github-connect-btn" onClick={connectGitHub}>
            {t.github?.connectGitHub || 'Connect GitHub'}
          </button>
        </div>
      ) : (
        <>
          <div className="github-status">
            <span className="github-connected-badge">
              ✓ {t.github?.connected || 'Connected as'} <strong>{githubUsername}</strong>
            </span>
            <button className="github-disconnect-btn" onClick={disconnectGitHub}>
              {t.github?.disconnectGitHub || 'Disconnect'}
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
              🔗 {t.github?.linkIssue || 'Link issue'}
            </button>
            <button 
              className="github-action-btn"
              onClick={() => {
                setView('create')
                fetchRepositories()
              }}
            >
              ✨ {t.github?.createIssue || 'Create issue'}
            </button>
          </div>

          <div className="github-linked-section">
            <h4>{t.github?.linkedIssues || 'Linked issues'}</h4>
            {loadingLinks ? (
              <div className="github-loading">{t.github?.loading || 'Loading...'}</div>
            ) : linkedIssues.length === 0 ? (
              <div className="github-empty">{t.github?.noLinkedIssues || 'No linked issues'}</div>
            ) : (
              <div className="github-linked-list">
                {linkedIssues.map((link) => (
                  <div key={link.id} className="github-issue-card">
                    <div className="issue-header">
                      <span className={`issue-badge ${link.github_state}`}>
                        {link.github_type === 'pull_request' ? '↗️' : '⚫'} #{link.github_number}
                      </span>
                      <span className={`issue-state ${link.github_state}`}>
                        {link.github_state === 'open' 
                          ? (t.github?.openIssue || 'Open')
                          : (t.github?.closedIssue || 'Closed')}
                      </span>
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
                        {t.github?.viewOnGitHub || 'View on GitHub'} ↗
                      </a>
                      <button 
                        className="issue-unlink-btn"
                        onClick={() => handleUnlink(link.id)}
                      >
                        {t.github?.unlink || 'Unlink'}
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
        <h3>{t.github?.linkExisting || 'Link existing issue'}</h3>
      </div>

      <div className="github-form">
        <div className="form-group">
          <label>{t.github?.selectRepository || 'Select repository'}</label>
          <select 
            value={selectedRepo}
            onChange={(e) => handleRepoChange(e.target.value)}
            disabled={loadingRepos}
          >
            <option value="">
              {loadingRepos 
                ? (t.github?.loadingRepos || 'Loading...')
                : (repos.length === 0 
                    ? (t.github?.noRepos || 'No repositories')
                    : '-- Select a repository --')}
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
            <label>{t.github?.selectIssue || 'Select issue'}</label>
            <select 
              value={selectedIssue || ''}
              onChange={(e) => setSelectedIssue(Number(e.target.value))}
              disabled={loadingIssues}
            >
              <option value="">
                {loadingIssues 
                  ? (t.github?.loadingIssues || 'Loading...')
                  : (issues.length === 0 
                      ? (t.github?.noIssues || 'No open issues')
                      : '-- Select an issue --')}
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
          {t.github?.linkExisting || 'Link'}
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
        <h3>{t.github?.createIssue || 'Create issue'}</h3>
      </div>

      <div className="github-form">
        <div className="form-group">
          <label>{t.github?.selectRepository || 'Select repository'}</label>
          <select 
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            disabled={loadingRepos}
          >
            <option value="">
              {loadingRepos 
                ? (t.github?.loadingRepos || 'Loading...')
                : (repos.length === 0 
                    ? (t.github?.noRepos || 'No repositories')
                    : '-- Select a repository --')}
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
              <label>{t.github?.issueTitle || 'Issue title'}</label>
              <input 
                type="text"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="Enter issue title..."
              />
            </div>

            <div className="form-group">
              <label>{t.github?.issueDescription || 'Description'}</label>
              <textarea 
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Enter issue description..."
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
            ? (t.github?.creatingIssue || 'Creating...')
            : (t.github?.createAndLink || 'Create & link')}
        </button>
      </div>
    </>
  )

  if (loading) {
    return (
      <div className="github-powerup-overlay" onClick={onClose}>
        <div className="github-powerup-modal" onClick={(e) => e.stopPropagation()}>
          <button className="github-close-btn" onClick={onClose}>✕</button>
          <div className="github-loading">{t.github?.loading || 'Loading...'}</div>
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
