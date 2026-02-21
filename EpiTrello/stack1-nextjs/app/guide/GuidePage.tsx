'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'
import type { Language } from '@/lib/translations'
import { translations } from '@/lib/translations'
import './GuidePage.css'

type Section = {
  id: string
  title: string
}

export default function GuidePage() {
  const { language } = useLanguage()
  const [guideLang, setGuideLang] = useState<Language>(language)
  const [activeSection, setActiveSection] = useState<string>('')

  const t = translations[guideLang].guide

  const sections: Section[] = [
    { id: 'getting-started', title: t.gettingStartedTitle },
    { id: 'boards', title: t.boardsTitle },
    { id: 'lists', title: t.listsTitle },
    { id: 'cards', title: t.cardsTitle },
    { id: 'card-features', title: t.cardFeaturesTitle },
    { id: 'sharing', title: t.sharingTitle },
    { id: 'settings', title: t.settingsTitle },
    { id: 'tips', title: t.tipsTitle },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(s => ({
        id: s.id,
        el: document.getElementById(s.id),
      }))

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i].el
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 140) {
            setActiveSection(sectionElements[i].id)
            return
          }
        }
      }
      if (sectionElements[0]?.el) {
        setActiveSection(sectionElements[0].id)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  })

  const toggleLang = () => {
    setGuideLang(prev => prev === 'fr' ? 'en' : 'fr')
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const getActionTags = (actionsText: string) => {
    const withoutPrefix = actionsText
      .replace('Actions possibles : ', '')
      .replace('Available actions: ', '')

    return withoutPrefix
      .replace(/\.$/, '')
      .split(', ')
      .filter(Boolean)
  }

  return (
    <div className="guide-page">
      {/* Header */}
      <header className="guide-header">
        <div className="guide-header-left">
          <Link href="/boards" className="guide-back-link">
            {t.backToBoards}
          </Link>
        </div>
        <div className="guide-header-center">
          <h1 className="guide-main-title">{t.title}</h1>
          <p className="guide-subtitle">{t.subtitle}</p>
        </div>
        <div className="guide-header-right">
          <button className="guide-lang-toggle" onClick={toggleLang}>
            🌐 {t.languageToggle}
          </button>
        </div>
      </header>

      <div className="guide-layout">
        {/* Sidebar - Table of Contents */}
        <nav className="guide-toc">
          <h3 className="guide-toc-title">{t.tableOfContents}</h3>
          <ul className="guide-toc-list">
            {sections.map(section => (
              <li key={section.id}>
                <button
                  className={`guide-toc-link ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => scrollToSection(section.id)}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main className="guide-content">

          {/* Getting Started */}
          <section id="getting-started" className="guide-section">
            <h2>{t.gettingStartedTitle}</h2>
            <div className="guide-card guide-intro-card">
              <div className="guide-intro-visual">
                <div className="guide-flow-diagram">
                  <div className="guide-flow-item">
                    <div className="guide-flow-icon">📋</div>
                    <span>Board</span>
                  </div>
                  <div className="guide-flow-arrow">→</div>
                  <div className="guide-flow-item">
                    <div className="guide-flow-icon">📝</div>
                    <span>{guideLang === 'fr' ? 'Liste' : 'List'}</span>
                  </div>
                  <div className="guide-flow-arrow">→</div>
                  <div className="guide-flow-item">
                    <div className="guide-flow-icon">🃏</div>
                    <span>{guideLang === 'fr' ? 'Carte' : 'Card'}</span>
                  </div>
                </div>
              </div>
              <p>{t.gettingStartedDesc}</p>
            </div>
          </section>

          {/* Boards */}
          <section id="boards" className="guide-section">
            <h2>{t.boardsTitle}</h2>
            <div className="guide-card">
              <div className="guide-feature-block">
                <h3>{guideLang === 'fr' ? 'Qu\'est-ce qu\'un board ?' : 'What is a board?'}</h3>
                <p>{t.boardsWhat}</p>
                <div className="guide-demo-box guide-demo-board">
                  <div className="guide-demo-board-header">
                    <span className="guide-demo-board-title">{guideLang === 'fr' ? 'Mon Projet' : 'My Project'}</span>
                    <span className="guide-demo-board-badge">3 {guideLang === 'fr' ? 'listes' : 'lists'}</span>
                  </div>
                  <div className="guide-demo-board-lists">
                    <div className="guide-demo-mini-list">
                      <div className="guide-demo-mini-list-title">{guideLang === 'fr' ? 'À faire' : 'To Do'}</div>
                      <div className="guide-demo-mini-card" />
                      <div className="guide-demo-mini-card" />
                      <div className="guide-demo-mini-card" />
                    </div>
                    <div className="guide-demo-mini-list">
                      <div className="guide-demo-mini-list-title">{guideLang === 'fr' ? 'En cours' : 'In Progress'}</div>
                      <div className="guide-demo-mini-card" />
                      <div className="guide-demo-mini-card" />
                    </div>
                    <div className="guide-demo-mini-list">
                      <div className="guide-demo-mini-list-title">{guideLang === 'fr' ? 'Terminé' : 'Done'}</div>
                      <div className="guide-demo-mini-card guide-demo-mini-card-done" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="guide-steps">
                <div className="guide-step">
                  <div className="guide-step-number">1</div>
                  <div className="guide-step-content">
                    <h4>{guideLang === 'fr' ? 'Créer' : 'Create'}</h4>
                    <p>{t.boardsCreate}</p>
                  </div>
                </div>
                <div className="guide-step">
                  <div className="guide-step-number">2</div>
                  <div className="guide-step-content">
                    <h4>{guideLang === 'fr' ? 'Modifier' : 'Edit'}</h4>
                    <p>{t.boardsEdit}</p>
                  </div>
                </div>
                <div className="guide-step">
                  <div className="guide-step-number">3</div>
                  <div className="guide-step-content">
                    <h4>{guideLang === 'fr' ? 'Partager' : 'Share'}</h4>
                    <p>{t.boardsShare}</p>
                  </div>
                </div>
              </div>

              <div className="guide-actions-summary">
                <span className="guide-actions-label">{guideLang === 'fr' ? 'Actions :' : 'Actions:'}</span>
                <div className="guide-action-tags">
                  {getActionTags(t.boardsActions).map((action, i) => (
                    <span key={i} className="guide-action-tag">{action}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Lists */}
          <section id="lists" className="guide-section">
            <h2>{t.listsTitle}</h2>
            <div className="guide-card">
              <div className="guide-feature-block">
                <h3>{guideLang === 'fr' ? 'Qu\'est-ce qu\'une liste ?' : 'What is a list?'}</h3>
                <p>{t.listsWhat}</p>
                <div className="guide-demo-box guide-demo-list-container">
                  <div className="guide-demo-list">
                    <div className="guide-demo-list-header">
                      <span>{guideLang === 'fr' ? 'À faire' : 'To Do'}</span>
                      <span className="guide-demo-list-menu">⋯</span>
                    </div>
                    <div className="guide-demo-card-item">
                      <div className="guide-demo-card-cover guide-demo-cover-red" />
                      <span>{guideLang === 'fr' ? 'Concevoir la maquette' : 'Design mockup'}</span>
                    </div>
                    <div className="guide-demo-card-item">
                      <span>{guideLang === 'fr' ? 'Écrire les tests' : 'Write tests'}</span>
                      <div className="guide-demo-card-badges">
                        <span className="guide-demo-badge guide-demo-badge-date">📅 Feb 20</span>
                        <span className="guide-demo-badge guide-demo-badge-comment">💬 3</span>
                      </div>
                    </div>
                    <div className="guide-demo-add-card">+ {guideLang === 'fr' ? 'Ajouter une carte' : 'Add a card'}</div>
                  </div>
                </div>
              </div>

              <div className="guide-steps">
                <div className="guide-step">
                  <div className="guide-step-number">1</div>
                  <div className="guide-step-content">
                    <h4>{guideLang === 'fr' ? 'Créer' : 'Create'}</h4>
                    <p>{t.listsCreate}</p>
                  </div>
                </div>
                <div className="guide-step">
                  <div className="guide-step-number">2</div>
                  <div className="guide-step-content">
                    <h4>{guideLang === 'fr' ? 'Modifier' : 'Edit'}</h4>
                    <p>{t.listsEdit}</p>
                  </div>
                </div>
              </div>

              <div className="guide-actions-summary">
                <span className="guide-actions-label">{guideLang === 'fr' ? 'Actions :' : 'Actions:'}</span>
                <div className="guide-action-tags">
                  {getActionTags(t.listsActions).map((action, i) => (
                    <span key={i} className="guide-action-tag">{action}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Cards */}
          <section id="cards" className="guide-section">
            <h2>{t.cardsTitle}</h2>
            <div className="guide-card">
              <div className="guide-feature-block">
                <h3>{guideLang === 'fr' ? 'Qu\'est-ce qu\'une carte ?' : 'What is a card?'}</h3>
                <p>{t.cardsWhat}</p>
                <div className="guide-demo-box guide-demo-card-detail">
                  <div className="guide-demo-card-detail-header">
                    <div className="guide-demo-card-cover-full guide-demo-cover-gradient" />
                    <h4 className="guide-demo-card-title">{guideLang === 'fr' ? 'Exemple de carte' : 'Example card'}</h4>
                  </div>
                  <div className="guide-demo-card-detail-body">
                    <div className="guide-demo-card-desc">
                      <span className="guide-demo-label">📄 Description</span>
                      <div className="guide-demo-text-placeholder" />
                    </div>
                    <div className="guide-demo-card-meta">
                      <span className="guide-demo-badge guide-demo-badge-date">📅 Jan 15 - Feb 20</span>
                      <span className="guide-demo-badge guide-demo-badge-assign">👥 2</span>
                      <span className="guide-demo-badge guide-demo-badge-comment">💬 5</span>
                      <span className="guide-demo-badge guide-demo-badge-done">✅</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="guide-steps">
                <div className="guide-step">
                  <div className="guide-step-number">1</div>
                  <div className="guide-step-content">
                    <h4>{guideLang === 'fr' ? 'Créer' : 'Create'}</h4>
                    <p>{t.cardsCreate}</p>
                  </div>
                </div>
                <div className="guide-step">
                  <div className="guide-step-number">2</div>
                  <div className="guide-step-content">
                    <h4>{guideLang === 'fr' ? 'Modifier' : 'Edit'}</h4>
                    <p>{t.cardsEdit}</p>
                  </div>
                </div>
                <div className="guide-step">
                  <div className="guide-step-number">3</div>
                  <div className="guide-step-content">
                    <h4>{guideLang === 'fr' ? 'Déplacer' : 'Move'}</h4>
                    <p>{guideLang === 'fr' ? 'Déplacez les cartes entre les listes avec le glisser-déposer.' : 'Move cards between lists using drag and drop.'}</p>
                  </div>
                </div>
              </div>

              <div className="guide-actions-summary">
                <span className="guide-actions-label">{guideLang === 'fr' ? 'Actions :' : 'Actions:'}</span>
                <div className="guide-action-tags">
                  {getActionTags(t.cardsActions).map((action, i) => (
                    <span key={i} className="guide-action-tag">{action}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Card Features */}
          <section id="card-features" className="guide-section">
            <h2>{t.cardFeaturesTitle}</h2>
            <p className="guide-section-intro">{t.cardFeaturesIntro}</p>

            <div className="guide-features-grid">
              <div className="guide-feature-card">
                <div className="guide-feature-card-icon">📄</div>
                <h3>{t.descriptionTitle}</h3>
                <p>{t.descriptionDesc}</p>
              </div>

              <div className="guide-feature-card">
                <div className="guide-feature-card-icon">🎨</div>
                <h3>{t.coverTitle}</h3>
                <p>{t.coverDesc}</p>
                <div className="guide-color-palette">
                  {['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray'].map(color => (
                    <div key={color} className={`guide-color-dot guide-color-${color}`} />
                  ))}
                </div>
              </div>

              <div className="guide-feature-card">
                <div className="guide-feature-card-icon">🖼️</div>
                <h3>{t.imagesTitle}</h3>
                <p>{t.imagesDesc}</p>
              </div>

              <div className="guide-feature-card">
                <div className="guide-feature-card-icon">📅</div>
                <h3>{t.datesTitle}</h3>
                <p>{t.datesDesc}</p>
                <div className="guide-date-badges">
                  <span className="guide-date-badge guide-date-badge-green">{guideLang === 'fr' ? '✓ À temps' : '✓ On time'}</span>
                  <span className="guide-date-badge guide-date-badge-orange">{guideLang === 'fr' ? '⏰ Bientôt' : '⏰ Soon'}</span>
                  <span className="guide-date-badge guide-date-badge-red">{guideLang === 'fr' ? '⚠ En retard' : '⚠ Overdue'}</span>
                </div>
              </div>

              <div className="guide-feature-card">
                <div className="guide-feature-card-icon">👥</div>
                <h3>{t.assignmentsTitle}</h3>
                <p>{t.assignmentsDesc}</p>
              </div>

              <div className="guide-feature-card">
                <div className="guide-feature-card-icon">✅</div>
                <h3>{t.completionTitle}</h3>
                <p>{t.completionDesc}</p>
                <div className="guide-completion-demo">
                  <div className="guide-completion-item">
                    <span className="guide-checkbox guide-checkbox-unchecked" />
                    <span>{guideLang === 'fr' ? 'Tâche en cours' : 'Task in progress'}</span>
                  </div>
                  <div className="guide-completion-item guide-completion-done">
                    <span className="guide-checkbox guide-checkbox-checked">✓</span>
                    <span>{guideLang === 'fr' ? 'Tâche terminée' : 'Task completed'}</span>
                  </div>
                </div>
              </div>

              <div className="guide-feature-card">
                <div className="guide-feature-card-icon">📌</div>
                <h3>{t.statusTitle}</h3>
                <p>{t.statusDesc}</p>
                <div className="guide-status-demo">
                  <span className="guide-status-badge guide-status-badge-blue">{guideLang === 'fr' ? 'À valider' : 'Pending Review'}</span>
                  <span className="guide-status-badge guide-status-badge-yellow">{guideLang === 'fr' ? 'En attente' : 'On Hold'}</span>
                  <span className="guide-status-badge guide-status-badge-red">{guideLang === 'fr' ? 'Bloqué' : 'Blocked'}</span>
                </div>
              </div>

              <div className="guide-feature-card">
                <div className="guide-feature-card-icon">🏷️</div>
                <h3>{t.labelTitle}</h3>
                <p>{t.labelDesc}</p>
                <div className="guide-label-demo">
                  <span className="guide-label-badge guide-label-badge-red">Bug</span>
                  <span className="guide-label-badge guide-label-badge-green">Feature</span>
                  <span className="guide-label-badge guide-label-badge-yellow">Urgent</span>
                  <span className="guide-label-badge guide-label-badge-blue">UI/UX</span>
                </div>
              </div>

              <div className="guide-feature-card">
                <div className="guide-feature-card-icon">💬</div>
                <h3>{t.commentsTitle}</h3>
                <p>{t.commentsDesc}</p>
              </div>

              <div className="guide-feature-card">
                <div className="guide-feature-card-icon">📊</div>
                <h3>{t.activityTitle}</h3>
                <p>{t.activityDesc}</p>
              </div>

              <div className="guide-feature-card guide-feature-card-wide">
                <div className="guide-feature-card-icon">🔗</div>
                <h3>{t.githubTitle}</h3>
                <p>{t.githubDesc}</p>
              </div>
            </div>
          </section>

          {/* Sharing */}
          <section id="sharing" className="guide-section">
            <h2>{t.sharingTitle}</h2>
            <div className="guide-card">
              <p>{t.sharingWhat}</p>

              <div className="guide-steps">
                <div className="guide-step">
                  <div className="guide-step-number">1</div>
                  <div className="guide-step-content">
                    <h4>{guideLang === 'fr' ? 'Inviter' : 'Invite'}</h4>
                    <p>{t.sharingInvite}</p>
                  </div>
                </div>
                <div className="guide-step">
                  <div className="guide-step-number">2</div>
                  <div className="guide-step-content">
                    <h4>{guideLang === 'fr' ? 'Rôles' : 'Roles'}</h4>
                    <p>{t.sharingRoles}</p>
                  </div>
                </div>
              </div>

              <div className="guide-roles-visual">
                <div className="guide-role-card">
                  <div className="guide-role-icon">👑</div>
                  <h4>{guideLang === 'fr' ? 'Propriétaire' : 'Owner'}</h4>
                  <ul>
                    <li>{guideLang === 'fr' ? 'Gérer les membres' : 'Manage members'}</li>
                    <li>{guideLang === 'fr' ? 'Supprimer le board' : 'Delete board'}</li>
                    <li>{guideLang === 'fr' ? 'Toutes les permissions' : 'All permissions'}</li>
                  </ul>
                </div>
                <div className="guide-role-card">
                  <div className="guide-role-icon">👤</div>
                  <h4>{guideLang === 'fr' ? 'Membre' : 'Member'}</h4>
                  <ul>
                    <li>{guideLang === 'fr' ? 'Créer des listes/cartes' : 'Create lists/cards'}</li>
                    <li>{guideLang === 'fr' ? 'Modifier et commenter' : 'Edit and comment'}</li>
                    <li>{guideLang === 'fr' ? 'Quitter le board' : 'Leave board'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Settings */}
          <section id="settings" className="guide-section">
            <h2>{t.settingsTitle}</h2>
            <div className="guide-card">
              <p>{t.settingsDesc}</p>
              <div className="guide-settings-grid">
                <div className="guide-setting-item">
                  <span className="guide-setting-icon">👤</span>
                  <div>
                    <h4>{guideLang === 'fr' ? 'Photo & Nom' : 'Photo & Name'}</h4>
                    <p>{guideLang === 'fr' ? 'Personnalisez votre profil' : 'Customize your profile'}</p>
                  </div>
                </div>
                <div className="guide-setting-item">
                  <span className="guide-setting-icon">🎨</span>
                  <div>
                    <h4>{guideLang === 'fr' ? 'Thèmes' : 'Themes'}</h4>
                    <p>{t.settingsTheme}</p>
                  </div>
                </div>
                <div className="guide-setting-item">
                  <span className="guide-setting-icon">🌐</span>
                  <div>
                    <h4>{guideLang === 'fr' ? 'Langue' : 'Language'}</h4>
                    <p>{t.settingsLanguage}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section id="tips" className="guide-section">
            <h2>{t.tipsTitle}</h2>
            <div className="guide-tips-list">
              {[t.tip1, t.tip2, t.tip3, t.tip4, t.tip5].map((tip, i) => (
                <div key={i} className="guide-tip-item">
                  <div className="guide-tip-number">{i + 1}</div>
                  <p>{tip}</p>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}
