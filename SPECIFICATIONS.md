# EpiTrello - Technical Specifications Document

## Project Overview

>**Project Name:** EpiTrello <br>
**Project Member:** Benjamin Cottone & TBD <br>
**Version:** 1.0 <br>
**Technology Stack:** Next.js 14 + Supabase (PostgreSQL) <br>
**Architecture:** Integrated Full-Stack Application <br>
**Target Platform:** Web Application

---

## Summary

EpiTrello is a collaborative project management application inspired by Trello, designed to help teams organize tasks, track progress, and collaborate effectively. The application provides a visual, card-based interface that allows users to manage projects through boards, lists, and cards, with advanced features for team collaboration and workload management.

This project will be built using a modern technology stack (Next.js + Supabase) to ensure rapid development, scalability, and real-time collaboration capabilities.

## Table of content
- [1. Boards](#1-boards)
- [2. Lists](#2-lists)
- [3. Cards](#3-cards)
- [4. Checklists](#4-checklists)
- [5. Due Dates](#5-due-dates)
- [6. Attachments](#6-attachments)
- [7. Labels](#7-labels)
- [8. Members](#8-members)
- [9. Comments](#9-comments)
- [10. Power-Ups](#10-power-ups)
- [11. Views](#11-views)
___
- [12. Team Work View (Capacity Management)](#12-team-work-view-capacity-management)
- [13. Mind Map View](#13-mind-map-view)
---

## Core Features

**FR-X-YYY** <br>
**FR** = Functional Requirement <br>
**X** = First letter of the main feature <br>
**YYY** = Sub features number

### 1. Boards

**Description:** Boards serve as the main containers for projects and workflows, displayed on a centralized dashboard.

**Functional Requirements:**
- **FR-B-001:** Users shall be able to create new boards with a title and optional description
- **FR-B-002:** Users shall be able to view all their boards in a grid layout on the main dashboard
- **FR-B-003:** Users shall be able to edit board titles and descriptions
- **FR-B-004:** Users shall be able to delete boards (with confirmation prompt)
- **FR-B-005:** Each board shall display a preview of its content (number of lists/cards)
- **FR-B-006:** Users shall be able to archive boards without permanently deleting them
- **FR-B-007:** Users shall be able to star/favorite boards for quick access

**Technical Requirements:**
- Store board data in PostgreSQL with UUID primary keys
- Implement soft delete for archived boards
- Use optimistic UI updates for instant feedback

---

### 2. Lists

**Description:** Lists organize tasks into different stages or categories within a board (e.g., To Do, In Progress, Done).

**Functional Requirements:**
- **FR-L-001:** Users shall be able to create new lists within a board
- **FR-L-002:** Users shall be able to rename lists
- **FR-L-003:** Users shall be able to delete lists (with confirmation prompt)
- **FR-L-004:** Users shall be able to reorder lists by dragging and dropping
- **FR-L-005:** Each list shall display the number of cards it contains
- **FR-L-006:** Users shall be able to archive lists
- **FR-L-007:** Users shall be able to copy lists to the same or different board
- **FR-L-008:** Lists shall maintain their position order within a board

**Technical Requirements:**
- Implement position-based ordering system
- Use foreign keys to link lists to boards with CASCADE DELETE
- Support drag-and-drop functionality with position updates

---

### 3. Cards

**Description:** Cards represent individual tasks, ideas, or items that can be moved between lists.

**Functional Requirements:**
- **FR-C-001:** Users shall be able to create new cards within a list with a title
- **FR-C-002:** Users shall be able to add detailed descriptions to cards
- **FR-C-003:** Users shall be able to move cards between lists by dragging and dropping
- **FR-C-004:** Users shall be able to reorder cards within a list
- **FR-C-005:** Users shall be able to edit card titles and descriptions
- **FR-C-006:** Users shall be able to delete cards (with confirmation prompt)
- **FR-C-007:** Users shall be able to copy cards to the same or different list
- **FR-C-008:** Users shall be able to archive cards
- **FR-C-009:** Cards shall open in a detailed view modal when clicked

**Technical Requirements:**
- Store card data with list association and position ordering
- Implement real-time updates when cards are moved
- Support rich text descriptions with markdown formatting

---

### 4. Checklists

**Description:** Break down larger tasks into smaller, manageable sub-tasks within a card.

**Functional Requirements:**
- **FR-CL-001:** Users shall be able to add multiple checklists to a card
- **FR-CL-002:** Users shall be able to name each checklist
- **FR-CL-003:** Users shall be able to add items to a checklist
- **FR-CL-004:** Users shall be able to check/uncheck checklist items
- **FR-CL-005:** Users shall be able to delete checklist items
- **FR-CL-006:** Users shall be able to reorder checklist items
- **FR-CL-007:** Cards shall display checklist progress (e.g., 3/5 completed)
- **FR-CL-008:** Users shall be able to convert checklist items into cards
- **FR-CL-009:** Users shall be able to delete entire checklists

**Technical Requirements:**
- Store checklists as separate entities linked to cards
- Calculate and display completion percentage
- Support nested JSON structure for checklist items

---

### 5. Due Dates

**Description:** Assign deadlines to cards to track schedules and time-sensitive tasks.

**Functional Requirements:**
- **FR-D-001:** Users shall be able to add a due date to any card
- **FR-D-002:** Users shall be able to add a due time (specific hour) to due dates
- **FR-D-003:** Cards shall display visual indicators for upcoming and overdue dates
- **FR-D-004:** Users shall be able to mark a card as "complete" when finished
- **FR-D-005:** Users shall be able to remove due dates from cards
- **FR-D-006:** The calendar view shall display all cards with due dates

**Technical Requirements:**
- Store due dates as TIMESTAMP WITH TIME ZONE
- Implement background job for due date notifications
- Color-code cards based on due date status (green: complete, yellow: soon, red: overdue)

---

### 6. Attachments

**Description:** Add files, images, and documents directly to cards for reference and collaboration.

**Functional Requirements:**
- **FR-A-001:** Users shall be able to upload files to cards (images, PDFs, documents)
- **FR-A-002:** Users shall be able to attach files from their computer (drag & drop or file picker)
- **FR-A-003:** Users shall be able to attach files from URLs
- **FR-A-004:** Users shall be able to preview images directly in the card
- **FR-A-005:** Users shall be able to download attachments
- **FR-A-006:** Users shall be able to delete attachments
- **FR-A-007:** Users shall be able to set an attachment as the card cover image
- **FR-A-008:** File size shall be limited to 10MB per attachment

**Technical Requirements:**
- Use Supabase Storage for file hosting
- Generate thumbnails for image attachments
- Store attachment metadata in PostgreSQL with URLs to Supabase Storage
- Implement virus scanning for uploaded files

---

### 7. Labels

**Description:** Categorize and prioritize cards using colored labels for quick visual identification.

**Functional Requirements:**
- **FR-LB-001:** Users shall be able to create custom labels with colors and names
- **FR-LB-002:** Users shall be able to assign multiple labels to a single card
- **FR-LB-003:** Users shall be able to filter cards by labels
- **FR-LB-004:** Labels shall be board-specific
- **FR-LB-005:** Users shall be able to edit label names and colors
- **FR-LB-006:** Users shall be able to delete labels
- **FR-LB-007:** Cards shall display labels as colored badges
- **FR-LB-008:** Predefined color palette shall include at least 10 colors

**Technical Requirements:**
- Store labels as separate entities linked to boards
- Implement many-to-many relationship between cards and labels
- Support color hex codes for custom colors

---

### 8. Members

**Description:** Assign tasks to team members and enable collaboration on specific cards and boards.

**Functional Requirements:**
- **FR-M-001:** Users shall be able to invite members to boards via email
- **FR-M-002:** Users shall be able to assign multiple members to a card
- **FR-M-003:** Members shall be able to join boards via invitation link
- **FR-M-004:** Users shall be able to view all board members
- **FR-M-005:** Users shall be able to remove members from boards
- **FR-M-006:** Users shall be able to filter cards by assigned member
- **FR-M-007:** Cards shall display member avatars
- **FR-M-008:** Board owners shall have admin privileges (delete board, remove members)
- **FR-M-009:** Members shall have different permission levels (Admin, Member, Observer)

**Technical Requirements:**
- Implement user authentication via Supabase Auth
- Store user profiles with avatars
- Implement role-based access control (RBAC)
- Create junction table for board-member relationships

---

### 9. Comments

**Description:** Discuss tasks, provide feedback, and communicate directly within cards.

**Functional Requirements:**
- **FR-CM-001:** Users shall be able to add comments to cards
- **FR-CM-002:** Comments shall display author name, avatar, and timestamp
- **FR-CM-003:** Users shall be able to edit their own comments
- **FR-CM-004:** Users shall be able to delete their own comments
- **FR-CM-005:** Users shall be able to mention other members using @username
- **FR-CM-006:** Users shall receive notifications when mentioned in comments
- **FR-CM-007:** Comments shall support markdown formatting
- **FR-CM-008:** Users shall be able to add emoji reactions to comments
- **FR-CM-009:** Comments shall be displayed in chronological order (newest first/last)

**Technical Requirements:**
- Store comments with card association and user association
- Implement real-time comment updates using Supabase Realtime
- Parse and highlight @mentions

---

### 10. Power-Ups

**Description:** Extend functionality by integrating with external apps and services.

**Functional Requirements:**
- **FR-P-001:** Users shall be able to enable/disable Power-Ups for boards
- **FR-P-002:** Integration with Google Drive (attach files from Drive)
- **FR-P-003:** Integration with Slack (send card updates to Slack channels)
- **FR-P-004:** Integration with GitHub (link cards to GitHub issues/PRs)
- **FR-P-005:** Integration with calendar apps (sync due dates to Google Calendar)
- **FR-P-006:** Custom webhooks for external integrations
- **FR-P-007:** Power-Ups shall be configurable per board
- **FR-P-008:** Users shall be able to browse available Power-Ups.

**Technical Requirements:**
- Implement OAuth2 flows for third-party integrations
- Use webhooks for real-time synchronization
- Store integration credentials securely using Supabase Vault
- Create plugin architecture for extensibility

---

### 11. Views

**Description:** Visualize project data in multiple formats to suit different workflows.

**Functional Requirements:**

#### 11.1 Board View (Default)
- **FR-V-001:** Display lists horizontally with cards stacked vertically
- **FR-V-002:** Support drag-and-drop for cards and lists

#### 11.2 Calendar View
- **FR-V-003:** Display cards with due dates on a monthly calendar
- **FR-V-004:** Users shall be able to drag cards to different dates
- **FR-V-005:** Cards shall be color-coded by labels or lists

#### 11.3 Timeline View (Gantt Chart)
- **FR-V-006:** Display cards as bars on a timeline based on due dates
- **FR-V-007:** Users shall be able to set start and end dates for cards
- **FR-V-008:** Display dependencies between cards

#### 11.4 Table View
- **FR-V-009:** Display all cards in a spreadsheet-like table
- **FR-V-010:** Users shall be able to sort by any column (due date, member, label)
- **FR-V-011:** Users shall be able to filter rows by criteria

#### 11.5 Dashboard View
- **FR-V-012:** Display statistics and metrics for the board
- **FR-V-013:** Show cards completion rate, overdue cards, cards per list
- **FR-V-014:** Display charts and graphs for visual insights

**Technical Requirements:**
- Implement view switching without page reload
- Store user's preferred view per board
- Use data virtualization for performance in table view
- Generate charts using charting library (Chart.js or similar)

---

## Innovative Features

### 12. Team Work View (Capacity Management)

**Description:** A dedicated dashboard showing workload distribution across team members to prevent burnout and ensure balanced task assignment.

**Functional Requirements:**
- **FR-TW-001:** Display all team members with their assigned cards count
- **FR-TW-002:** Show capacity percentage per member (0-100% based on card count)
- **FR-TW-003:** Visual indicators for overloaded members (red), balanced (green), underutilized (yellow)
- **FR-TW-004:** Display cards grouped by member with due dates
- **FR-TW-005:** Users shall be able to reassign cards from this view via drag-and-drop
- **FR-TW-006:** Filter by date range to see capacity for specific periods
- **FR-TW-007:** Display estimated time/effort per member (if cards have time estimates)
- **FR-TW-008:** Export capacity report as PDF or CSV
- **FR-TW-009:** Set capacity thresholds per member (e.g., max 10 cards)

**Business Value:**
- Prevent team member burnout
- Identify bottlenecks in workflows
- Ensure equitable task distribution
- Improve team productivity and morale

**Technical Requirements:**
- Aggregate card counts per member across all boards
- Calculate capacity metrics in real-time
- Use visual charts (bar charts, pie charts) for representation
- Implement customizable capacity calculation formulas

---

### 13. Mind Map View

**Description:** A brainstorming view that allows teams to visualize ideas in a mind map format and convert nodes into actionable lists and cards.

**Functional Requirements:**
- **FR-MM-001:** Users shall be able to create a mind map starting from a central board node
- **FR-MM-002:** Users shall be able to add child nodes (ideas) branching from parent nodes
- **FR-MM-003:** Users shall be able to add multiple levels of nested nodes
- **FR-MM-004:** Users shall be able to drag nodes to rearrange the mind map structure
- **FR-MM-005:** Users shall be able to add text labels and colors to nodes
- **FR-MM-006:** Users shall be able to convert a node into a list with one click
- **FR-MM-007:** Users shall be able to convert child nodes into cards within a list
- **FR-MM-008:** Users shall be able to switch between Mind Map view and Board view seamlessly
- **FR-MM-009:** Mind Map shall support collaborative real-time editing (multiple users)
- **FR-MM-010:** Users shall be able to export mind maps as images (PNG/SVG)
- **FR-MM-011:** Users shall be able to add icons and emojis to nodes

**Use Cases:**
- Brainstorming session → Convert to actionable project board
- Project planning → Visualize hierarchy then create workflow
- Knowledge mapping → Organize information then create task breakdown

**Business Value:**
- Bridge ideation and execution phases
- Reduce friction in converting brainstorms to tasks
- Support creative thinking with visual organization
- Enable better project planning and structure

**Technical Requirements:**
- Use a mind map library (e.g., MindElixir, Markmap) or custom SVG rendering
- Store mind map structure as JSON in board metadata
- Implement transformation logic (node → list, child nodes → cards)
- Support real-time collaboration using Supabase Realtime
- Implement zoom and pan controls for large mind maps

---

## Non-Functional Requirements

### Performance
- **NFR-P-001:** Page load time shall not exceed 2 seconds on standard broadband
- **NFR-P-002:** API response time shall not exceed 200ms for 95% of requests
- **NFR-P-003:** Real-time updates shall propagate to all users within 500ms

### Security
- **NFR-S-001:** All user passwords shall be hashed using bcrypt with salt
- **NFR-S-002:** All API endpoints shall require authentication
- **NFR-S-003:** All data transmission shall use HTTPS/TLS encryption

### Usability
- **NFR-U-001:** Application shall be responsive on devices with screen width ≥ 320px
- **NFR-U-002:** Application shall be accessible (WCAG 2.1 Level AA compliance)
- **NFR-U-003:** Application shall support keyboard navigation
- **NFR-U-004:** Application shall work on Chrome, Firefox, Safari, and Edge (latest versions)

---

## Database Schema

### Core Tables

#### boards
```sql
- id (UUID, PRIMARY KEY)
- title (VARCHAR, NOT NULL)
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- archived (BOOLEAN)
- background_color (VARCHAR)
- mind_map_data (JSONB)
```

#### lists
```sql
- id (UUID, PRIMARY KEY)
- board_id (UUID, FOREIGN KEY → boards.id)
- title (VARCHAR, NOT NULL)
- position (INTEGER, NOT NULL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- archived (BOOLEAN)
```

#### cards
```sql
- id (UUID, PRIMARY KEY)
- list_id (UUID, FOREIGN KEY → lists.id)
- title (VARCHAR, NOT NULL)
- description (TEXT)
- position (INTEGER, NOT NULL)
- due_date (TIMESTAMP)
- completed (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- archived (BOOLEAN)
- cover_attachment_id (UUID)
```

#### checklists
```sql
- id (UUID, PRIMARY KEY)
- card_id (UUID, FOREIGN KEY → cards.id)
- title (VARCHAR, NOT NULL)
- position (INTEGER)
- created_at (TIMESTAMP)
```

#### checklist_items
```sql
- id (UUID, PRIMARY KEY)
- checklist_id (UUID, FOREIGN KEY → checklists.id)
- text (VARCHAR, NOT NULL)
- completed (BOOLEAN)
- position (INTEGER)
- created_at (TIMESTAMP)
```

#### labels
```sql
- id (UUID, PRIMARY KEY)
- board_id (UUID, FOREIGN KEY → boards.id)
- name (VARCHAR, NOT NULL)
- color (VARCHAR, NOT NULL)
- created_at (TIMESTAMP)
```

#### card_labels (Junction Table)
```sql
- card_id (UUID, FOREIGN KEY → cards.id)
- label_id (UUID, FOREIGN KEY → labels.id)
- PRIMARY KEY (card_id, label_id)
```

#### members
```sql
- id (UUID, PRIMARY KEY)
- email (VARCHAR, UNIQUE, NOT NULL)
- username (VARCHAR, UNIQUE, NOT NULL)
- full_name (VARCHAR)
- avatar_url (VARCHAR)
- created_at (TIMESTAMP)
```

#### board_members (Junction Table)
```sql
- board_id (UUID, FOREIGN KEY → boards.id)
- member_id (UUID, FOREIGN KEY → members.id)
- role (ENUM: admin, member, observer)
- joined_at (TIMESTAMP)
- PRIMARY KEY (board_id, member_id)
```

#### card_members (Junction Table)
```sql
- card_id (UUID, FOREIGN KEY → cards.id)
- member_id (UUID, FOREIGN KEY → members.id)
- assigned_at (TIMESTAMP)
- PRIMARY KEY (card_id, member_id)
```

#### comments
```sql
- id (UUID, PRIMARY KEY)
- card_id (UUID, FOREIGN KEY → cards.id)
- member_id (UUID, FOREIGN KEY → members.id)
- text (TEXT, NOT NULL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### attachments
```sql
- id (UUID, PRIMARY KEY)
- card_id (UUID, FOREIGN KEY → cards.id)
- filename (VARCHAR, NOT NULL)
- file_url (VARCHAR, NOT NULL)
- file_size (INTEGER)
- mime_type (VARCHAR)
- uploaded_by (UUID, FOREIGN KEY → members.id)
- created_at (TIMESTAMP)
```

#### activities (Audit Log)
```sql
- id (UUID, PRIMARY KEY)
- board_id (UUID, FOREIGN KEY → boards.id)
- member_id (UUID, FOREIGN KEY → members.id)
- action_type (VARCHAR, NOT NULL)
- entity_type (VARCHAR)
- entity_id (UUID)
- details (JSONB)
- created_at (TIMESTAMP)
```

---

## API Endpoints

### Boards
- `GET /api/boards` - List all boards for current user
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board details with lists and cards
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Lists
- `GET /api/lists?boardId=:id` - Get lists for a board
- `POST /api/lists` - Create new list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list
- `PUT /api/lists/:id/position` - Reorder list

### Cards
- `GET /api/cards?listId=:id` - Get cards for a list
- `POST /api/cards` - Create new card
- `GET /api/cards/:id` - Get card details
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card
- `PUT /api/cards/:id/move` - Move card to different list

### Additional endpoints for all other features (checklists, labels, members, comments, attachments, etc.)

---

## Technology Stack Details

### Frontend
- **Framework:** Next.js 14 with App Router
- **UI Library:** React 18
- **Styling:** CSS Modules + Global CSS
- **Drag & Drop:** react-beautiful-dnd or @dnd-kit
- **Forms:** React Hook Form + Zod validation
- **Date Picker:** react-datepicker
- **Rich Text Editor:** TipTap or Slate
- **Charts:** Chart.js or Recharts
- **Mind Map:** MindElixir or custom SVG solution

### Backend
- **Runtime:** Node.js 18
- **Framework:** Next.js API Routes
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime (WebSocket)

### DevOps
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Hosting:** Vercel (Frontend) + Supabase Cloud (Backend)

---

## Development Phases

### Phase 1: Foundation
- Setup project structure
- Implement authentication
- Create basic board, list, card CRUD

### Phase 2: Core Features
- Drag & drop functionality
- Checklists
- Due dates
- Labels

### Phase 3: Collaboration
- Members and permissions
- Comments and mentions
- Activity log
- Notifications

### Phase 4: Advanced Features
- Attachments
- Multiple views (Calendar, Timeline, Table)
- Dashboard analytics

### Phase 5: Innovative Features
- Team Work View (capacity management)
- Mind Map View

### Phase 6: Power-Ups & Polish
- Third-party integrations
- Performance optimization
___

The project start at the end of **October 2025** and will end at the end of **January 2026**.<br>
With **12 weeks** of works and **6 phases** we can adapt this to **2 weeks for each phase**.<br>
For more information about each time frame check the **EpiTrello - Githhub Action** Roadmap or Kanban.

---

## Success Criteria

1. **Functional Completeness:** All core features implemented and working
2. **User Experience:** Intuitive interface with smooth drag-and-drop
3. **Performance:** Sub-2s page loads, real-time updates working
4. **Collaboration:** Multiple users can work simultaneously without conflicts
5. **Innovation:** Team Work View and Mind Map View fully functional
6. **Code Quality:** Clean, documented, and maintainable codebase

---

## Glossary

- **Board:** A container for organizing a project or workflow
- **List:** A column within a board representing a stage or category
- **Card:** An individual task or item within a list
- **Power-Up:** An integration or extension that adds functionality
- **Capacity:** The number of tasks assigned to a team member
- **Mind Map:** A visual diagram showing hierarchical relationships between ideas

---
