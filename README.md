# EpiTrello – Epitech Professional Project

## Overview

This project is part of our fifth year professional project at Epitech.
The main goal is to recreate the core functionalities of Trello while adding our own personality.

The project serves as both a technical challenge and a professional experience, demonstrating best practices in software development, documentation, CI, and containerization.

**Technology Stack:** Next.js 14 + Supabase (PostgreSQL)

---

## Project Objectives

- Rebuild Trello’s essential features, including boards, lists, cards, drag-and-drop functionality, and collaboration tools.
- Add custom features and design elements to differentiate the application from the original Trello.
- Ensure maintainability, scalability, and performance through clean architecture and the use of modern technologies.

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Node.js](https://nodejs.org/) v20+ (for local development)
- A Supabase project with the required environment variables

### Environment Setup

1. Navigate to the project directory:
   ```bash
   cd EpiTrello/stack1-nextjs
   ```

2. Copy the environment template and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

3. Configure the following environment variables in `.env`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

### Running with Docker

From the `EpiTrello/stack1-nextjs` directory:

```bash
# Build and start the application
docker compose up --build

# Or run in detached mode
docker compose up -d --build
```

The application will be available at **http://localhost:3000**

To stop the application:
```bash
docker compose down
```

### Running Locally (Development)

```bash
cd EpiTrello/stack1-nextjs
npm install
npm run dev
```

---

## Quality Assurance Report

The project includes a comprehensive QA report generator that runs multiple quality and security checks.

### What It Does

The `run-qa-report.js` script generates a detailed HTML report (`qa-report.html`) containing:

| Check | Description |
|-------|-------------|
| **ESLint** | Code quality and style verification |
| **Jest Tests** | Unit tests with coverage metrics |
| **npm Audit** | Dependency vulnerability scanning |
| **Trivy Filesystem** | Security scan of project files |
| **Trivy Docker Image** | Security scan of the built Docker image |
| **OWASP ZAP** | Web application penetration testing |

### Prerequisites

Before running the QA report:

1. Install dependencies in both directories:
   ```bash
   npm install                          # Root directory (for ESLint)
   cd EpiTrello/stack1-nextjs && npm install  # Project directory
   ```

2. Ensure Docker Desktop is running

3. Build the Docker image (required for Trivy image scan):
   ```bash
   docker compose -f EpiTrello/stack1-nextjs/docker-compose.yml build
   ```

4. Start the application (required for OWASP ZAP scan):
   ```bash
   docker compose -f EpiTrello/stack1-nextjs/docker-compose.yml up -d
   ```

### Running the QA Report

From the repository root:

```bash
node run-qa-report.js
```

The script generates `qa-report.html` at the repository root with a visual dashboard showing all check results, metrics, and detailed logs.

For more details, see the [Quality Assurance Guide](./QUALITY_ASSURANCE.md).

---

## Project Components

### 1. Technical Documentation
- [Technical Specifications](./SPECIFICATIONS.md) - Feature requirements, API endpoints, and data models
- [Architecture Documentation](./EpiTrello/stack1-nextjs/ARCHITECTURE.md) - System architecture and design decisions
- [Quality Assurance Guide](./QUALITY_ASSURANCE.md) - Testing and security procedures

### 2. Full Dockerization
The entire application is containerized using Docker with multi-stage builds for optimized production images. The setup includes health checks and easy configuration through environment variables.

### 3. CI Pipeline
A complete Continuous Integration pipeline ensures automated testing, code quality checks (ESLint, Commitlint), npm packages audit and penetration tests.

### 4. GitHub Project Management
A GitHub Project board is used to organize and track tasks, objectives, and new features, ensuring clear visibility and structured progress.

### 5. Technology Benchmark
A benchmark document summarizes the different technology stacks tested and evaluated for this project.
See the [Benchmark Document](./Benchmark.md) for detailed comparisons.
