# EpiTrello - Project Features Summary

This document lists all implemented features for the EpiTrello project, organized by category. Each feature includes a short title, description, and estimated development time.

---

## Project Timeline

| Info | Value |
|------|-------|
| **Start Date** | October 15, 2025 |
| **End Date** | February 11, 2026 |
| **Team Size** | 2 developers |
| **Working Days** | Monday, Tuesday, Wednesday |
| **Vacation** | 2 weeks (end of December 2025) |
| **Total Working Days** | 45 days |
| **Total Person-Days** | 90 person-days |

---

## 📊 Summary

| Category | Features | Person-Days |
|----------|----------|-------------|
| Authentication & Security | 8 | 11 |
| Frontend - Core UI | 12 | 18 |
| Frontend - Components | 10 | 13 |
| Backend - API Routes | 14 | 16 |
| Database & Storage | 6 | 8 |
| DevOps & CI/CD | 8 | 9 |
| Quality Assurance | 7 | 9 |
| Internationalization | 2 | 3 |
| Buffer & Documentation | - | 3 |
| **TOTAL** | **67** | **90 person-days** |

---

## 🔐 Authentication & Security

| # | Feature | Description | Days |
|---|---------|-------------|------|
| 1 | **Supabase Auth Integration** | User authentication with Supabase Auth supporting email/password, session management, and secure token handling | 2 |
| 2 | **Google OAuth** | Social login via Google OAuth 2.0 with automatic profile synchronization | 1.5 |
| 3 | **GitHub OAuth** | Social login via GitHub OAuth with repo scope for power-up integration | 1.5 |
| 4 | **Auth Middleware** | Next.js middleware protecting routes, redirecting unauthenticated users, and managing auth callbacks | 1 |
| 5 | **Security Headers** | Comprehensive HTTP security headers (CSP, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy) | 1 |
| 6 | **Row Level Security (RLS)** | PostgreSQL RLS policies ensuring users can only access their own data and shared boards | 2 |
| 7 | **Session Management** | Secure session handling with automatic token refresh and logout functionality | 1 |
| 8 | **Profile Management** | User profile with avatar upload, username editing, and account settings | 1 |

---

## 🎨 Frontend - Core UI

| # | Feature | Description | Days |
|---|---------|-------------|------|
| 1 | **Landing Page** | Responsive landing page with auth forms and branding | 1 |
| 2 | **Auth Page** | Combined login/signup page with social OAuth buttons and form validation | 1.5 |
| 3 | **Boards Dashboard** | Grid layout displaying all user boards (owned + shared) with create button | 2.5 |
| 4 | **Board Detail View** | Full board view with lists, cards, and drag-and-drop functionality | 3.5 |
| 5 | **Settings Page** | User settings with avatar upload, username editing, theme selection, and language preference | 2 |
| 6 | **Theme System** | 8 gradient themes (Blue, Purple, Sunset, Forest, Ocean, Rose, Dark, Mint) with real-time switching | 1.5 |
| 7 | **Responsive Design** | Mobile-first responsive CSS supporting all screen sizes | 2 |
| 8 | **Drag & Drop (DnD)** | Drag and drop for lists and cards using @hello-pangea/dnd library | 2 |
| 9 | **Real-time Updates** | Supabase Realtime subscriptions for live board, list, and card changes | 1 |
| 10 | **Cursor Glow Effect** | Visual cursor trail effect for enhanced UX | 0.5 |
| 11 | **CSS Styling** | Custom CSS for all components with consistent design system | 1 |
| 12 | **Error Handling** | User-friendly error messages and loading states throughout the app | 0.5 |

---

## 🧩 Frontend - Components

| # | Feature | Description | Days |
|---|---------|-------------|------|
| 1 | **BoardCard** | Board preview card with title, description, delete button, and shared indicator | 1 |
| 2 | **CreateBoardModal** | Modal form for creating new boards with title and description | 1 |
| 3 | **ListColumn** | List component with title editing, card container, and delete functionality | 1.5 |
| 4 | **CreateListButton** | Inline form button for adding new lists to a board | 0.5 |
| 5 | **CardItem** | Card component with title, description, cover colors/images, due dates, and context menu | 2.5 |
| 6 | **BoardManageMenu** | Board settings menu with member management, invitations, and board deletion | 2 |
| 7 | **InvitationsPanel** | Panel displaying pending board invitations with accept/decline actions | 1 |
| 8 | **GitHubPowerUp** | GitHub integration popup for linking issues and creating issues from cards | 2 |
| 9 | **ProfileMenu** | User dropdown menu with settings link and logout option | 0.5 |
| 10 | **SettingsPage** | Full settings page component with sections for profile, theme, and language | 1 |

---

## ⚙️ Backend - API Routes

| # | Feature | Description | Days |
|---|---------|-------------|------|
| 1 | **GET /api/boards** | Fetch all boards (owned + shared) for authenticated user | 1 |
| 2 | **POST /api/boards** | Create new board with title and description | 0.5 |
| 3 | **GET /api/boards/[id]** | Fetch single board with all lists and cards | 1 |
| 4 | **PUT /api/boards/[id]** | Update board title and description | 0.5 |
| 5 | **DELETE /api/boards/[id]** | Delete board and cascade delete all lists/cards | 0.5 |
| 6 | **GET /api/boards/[id]/members** | Fetch all members of a board | 0.5 |
| 7 | **DELETE /api/boards/[id]/members** | Remove member from board or leave board | 0.5 |
| 8 | **POST /api/lists** | Create new list in a board | 0.5 |
| 9 | **PUT /api/lists/[id]** | Update list title and position | 0.5 |
| 10 | **DELETE /api/lists/[id]** | Delete list and all its cards | 0.5 |
| 11 | **POST /api/cards** | Create new card in a list with tracking metadata | 1 |
| 12 | **PUT /api/cards/[id]** | Update card properties (title, description, cover, dates) | 1 |
| 13 | **DELETE /api/cards/[id]** | Delete card | 0.5 |
| 14 | **POST /api/cards/reorder** | Reorder cards within/between lists | 1 |
| 15 | **POST /api/cards/upload** | Upload cover image for card to Supabase Storage | 1 |
| 16 | **GET /api/invitations** | Fetch pending invitations for user | 0.5 |
| 17 | **POST /api/invitations** | Send board invitation to another user | 1 |
| 18 | **PUT /api/invitations/[id]** | Accept or decline invitation | 1 |
| 19 | **GET /api/github/connect** | Check GitHub connection status | 0.5 |
| 20 | **POST /api/github/connect** | Initiate GitHub OAuth linking | 1 |
| 21 | **DELETE /api/github/connect** | Disconnect GitHub account | 0.5 |
| 22 | **POST /api/webhooks/github** | Receive GitHub webhook events for issue updates | 1 |

---

## 🗄️ Database & Storage

| # | Feature | Description | Days |
|---|---------|-------------|------|
| 1 | **Boards Table** | Store boards with id, title, description, owner_id, timestamps | 0.5 |
| 2 | **Lists Table** | Store lists with board association and position ordering | 0.5 |
| 3 | **Cards Table** | Store cards with list association, position, cover, dates, and audit fields | 1 |
| 4 | **Board Members Table** | Junction table for board-member relationships with roles | 1 |
| 5 | **Board Invitations Table** | Store pending/accepted/declined invitations | 1 |
| 6 | **Card GitHub Links Table** | Link cards to GitHub issues with status synchronization | 1 |
| 7 | **Profiles Table** | Extended user profiles with username | 0.5 |
| 8 | **Supabase Storage** | File storage for card cover images and user avatars | 1 |
| 9 | **RLS Policies** | Row Level Security policies for all tables | 1.5 |

---

## 🚀 DevOps & CI/CD

| # | Feature | Description | Days |
|---|---------|-------------|------|
| 1 | **Dockerfile** | Multi-stage Docker build for Next.js application with optimized image size | 1 |
| 2 | **Docker Compose** | Local development setup with app and optional ngrok for webhooks | 0.5 |
| 3 | **GitHub Actions - Quality** | ESLint code quality checks on push/PR | 1 |
| 4 | **GitHub Actions - Security** | npm audit and Trivy filesystem scan | 1.5 |
| 5 | **GitHub Actions - Docker Build** | Build and test Docker image in CI | 1.5 |
| 6 | **GitHub Actions - Pentest** | OWASP ZAP baseline security scan | 1.5 |
| 7 | **Environment Variables** | Secure env var management with .env files and GitHub secrets | 0.5 |
| 8 | **Healthcheck** | Docker healthcheck endpoint for container orchestration | 0.5 |
| 9 | **ngrok Integration** | Local webhook testing with ngrok tunnel (docker-compose profile) | 1 |

---

## ✅ Quality Assurance

| # | Feature | Description | Days |
|---|---------|-------------|------|
| 1 | **ESLint Configuration** | Custom ESLint config for TypeScript + React with strict rules | 1 |
| 2 | **Commitlint** | Conventional commit message format enforcement ([TYPE] SCOPE - Subject) | 0.5 |
| 3 | **Husky Pre-commit Hooks** | Automated linting before commits | 0.5 |
| 4 | **Jest Testing Setup** | Jest configuration with React Testing Library for component tests | 1 |
| 5 | **Unit Tests - BoardCard** | Comprehensive tests for BoardCard component (rendering, clicks, delete, shared) | 1.5 |
| 6 | **Unit Tests - CreateBoardModal** | Tests for CreateBoardModal component | 0.5 |
| 7 | **Unit Tests - CreateListButton** | Tests for CreateListButton component | 0.5 |
| 8 | **QA Report Generator** | Node.js script generating HTML report with ESLint, tests, npm audit, Trivy, ZAP results | 2 |
| 9 | **Coverage Reports** | Jest coverage reports with HTML output | 0.5 |
| 10 | **OWASP ZAP Rules** | Custom ZAP rules file (.zap/rules.tsv) for pentest configuration | 1 |

---

## 🌍 Internationalization (i18n)

| # | Feature | Description | Days |
|---|---------|-------------|------|
| 1 | **Translation System** | Complete translation infrastructure with French and English support | 1.5 |
| 2 | **Language Context** | React context for language switching across the application | 0.5 |
| 3 | **Full UI Translations** | All UI text translated (auth, boards, lists, cards, settings, sharing, github) | 1 |

---

## 📋 Card Features (Detailed)

| # | Feature | Description | Days |
|---|---------|-------------|------|
| 1 | **Card Title & Description** | Editable title and description with inline editing | 0.5 |
| 2 | **Cover Colors** | 9 predefined cover colors for visual categorization | 0.5 |
| 3 | **Cover Images** | Upload custom cover images (max 5MB) to cards | 1 |
| 4 | **Start Date** | Optional start date for task scheduling | 0.5 |
| 5 | **Due Date** | Due date with visual indicators (overdue, today, upcoming) | 1 |
| 6 | **Google Calendar Integration** | Export card dates to Google Calendar | 0.5 |
| 7 | **Activity Log** | Track card creation and last modification with user info | 1 |
| 8 | **Card Context Menu** | Dropdown menu with all card actions | 0.5 |
| 9 | **Card Completion Status** | Mark cards as completed | 0.5 |

---

## 🔗 GitHub Power-Up Features

| # | Feature | Description | Days |
|---|---------|-------------|------|
| 1 | **GitHub Account Linking** | Link GitHub account via OAuth with repo scope | 1 |
| 2 | **Repository Listing** | Fetch and display user's GitHub repositories | 0.5 |
| 3 | **Issue Listing** | Fetch and display issues from selected repository | 0.5 |
| 4 | **Link Existing Issue** | Link card to existing GitHub issue | 1 |
| 5 | **Create New Issue** | Create GitHub issue from card with title and description | 1 |
| 6 | **Issue Status Sync** | Real-time sync of issue status (open/closed) via webhooks | 1.5 |
| 7 | **Unlink Issue** | Remove GitHub issue link from card | 0.5 |
| 8 | **Visual Issue Badge** | Display linked issues on cards with status indicator | 0.5 |

---

## 👥 Collaboration Features

| # | Feature | Description | Days |
|---|---------|-------------|------|
| 1 | **Board Sharing** | Share boards with other users by user ID | 1 |
| 2 | **Invitation System** | Send, accept, and decline board invitations | 2 |
| 3 | **Member Management** | View, add, and remove board members | 1.5 |
| 4 | **Owner Permissions** | Board owner can delete board and manage members | 0.5 |
| 5 | **Member Permissions** | Members can view and edit lists/cards on shared boards | 0.5 |
| 6 | **Leave Board** | Members can leave shared boards | 0.5 |
| 7 | **Real-time Collaboration** | Live updates when multiple users edit same board | 1 |
| 8 | **Shared Board Indicator** | Visual indicator showing board is shared with owner name | 0.5 |

---

## 📝 Notes

- **Days** are person-days (2 developers × 45 working days = 90 person-days)
- Working schedule: Monday, Tuesday, Wednesday only
- 2 weeks vacation at end of December 2025 excluded
- Features may have dependencies on each other
- Some features span multiple categories
- Testing time is included in feature estimates
- Documentation time is NOT included

---

## 🏷️ Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | October 15, 2025 | Project kickoff |
| 1.1 | February 10, 2026 | Final feature list |

