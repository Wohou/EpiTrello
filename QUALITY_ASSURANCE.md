# Quality Assurance Guide

This guide covers all quality assurance tools and processes for EpiTrello, including code quality checks, security testing, and penetration testing.

---

## Automated QA Report

Run all quality checks and generate a comprehensive HTML report:

Cross-platform Node runner (utilise Docker pour Trivy/ZAP) :

```bash
node run-qa-report.js

# If the Docker image is already built (recommended for Trivy image)
docker compose -f EpiTrello/stack1-nextjs/docker-compose.yml build
```

Prerequisites for run-qa-report.js:
- `npm install` executed in `EpiTrello/stack1-nextjs`
- Docker Desktop started (for Trivy and ZAP)
- The application accessible at `http://localhost:3000` for ZAP (run `npm run dev` or `docker compose up -d` in `EpiTrello/stack1-nextjs`)
- The image `stack1-nextjs-nextjs-app:latest` built for the Trivy image scan to work (via `docker compose build`)

The script generates `qa-report.html` at the root, with:
- ESLint status, tests+coverage, npm audit, Trivy FS/image, ZAP
- Full logs concatenated stdout/stderr in each section
- Metrics only when data exists (coverage, vulnerabilities, alerts)
- Date locale format FR (JJ/MM/AAAA HH:MM)

The script will:
1. Run ESLint code quality checks
2. Test commit message format
3. Execute tests with coverage
4. Perform npm audit for vulnerabilities
5. Run Trivy filesystem security scan
6. Scan Docker images with Trivy
7. Execute OWASP ZAP penetration testing (if not skipped)
8. Generate a beautiful HTML report with all results
9. Automatically open the report in your browser


## 1. Code Linting (ESLint)

### What is Tested
- JavaScript and TypeScript code quality
- React best practices and patterns
- Unused variables and imports
- Coding style consistency

### Why It's Important
Catches bugs early, ensures consistent coding style, and improves maintainability.

### Installation
Already configured in `package.json`. Install dependencies:

```bash
npm install
```

### How to Run
```bash
npm run lint
```

### Interpreting Results
- **Errors** - Must fix before committing (commit will be blocked)
- **Warnings** - Should review and consider fixing
- **No output** - All checks passed

### Automated Checks
Runs automatically before each commit via Husky pre-commit hook.

To bypass (not recommended):
```bash
git commit --no-verify -m "message"
```

## 2. Commit Message Linting (Commitlint)

### What is Tested
Commit message format compliance with project standards.

### Why It's Important
Ensures the quality and consistency of the commit message, ensure better collaboration and visibility.

### Installation
Already configured. Initialize hooks:

```bash
npm install
npm run prepare
```

### Required Format
```
[TYPE] SCOPE - Subject
```

**Valid types:**
- `[+]` - New features or additions
- `[-]` - Bug fixes or removals
- `[~]` - Refactoring or modifications

**Rules:**
- SCOPE must be UPPERCASE
- SCOPE and Subeject cannot be empty
- Maximum 150 characters

### Valid Examples
```bash
git commit -m "[+] FEATURE - Add user authentication"
git commit -m "[-] BUGFIX - Fix login redirect issue"
git commit -m "[~] REFACTOR - Improve board loading performance"
```

### Test Without Committing
```bash
echo "[+] TEST - testing commitlint" | npx commitlint
```

### Interpreting Results
- **No output** - Message is valid
- **Error output** - Message format is incorrect

---

## 3. Dependency Vulnerability Scanning (npm audit)

### What is Tested
Known security vulnerabilities in npm packages and dependencies.

### Why It's Important
Prevents using packages with known exploits that could compromise the application.

### Installation
Built into npm, no installation needed.

### How to Run
```bash
# Basic scan
npm audit

# High severity only
npm audit --audit-level=high

# JSON report
npm audit --json > audit-report.json
```

### How to Fix
```bash
# Auto-fix compatible updates
npm audit fix

# Force updates (may break compatibility)
npm audit fix --force
```

### Interpreting Results
- **Critical** - Immediate action required
- **High** - Action required soon
- **Moderate** - Review and consider fixing
- **Low** - Monitor and fix when convenient

**Exit codes:**
- `0` - No vulnerabilities found
- `1` - Vulnerabilities found

---

## 4. Filesystem Security Scanning (Trivy)

### What is Tested
Security vulnerabilities in source code, configuration files, and dependencies.

### Why It's Important
Detects security issues before they reach production, including misconfigurations and vulnerable dependencies.

### Installation
**Windows (Chocolatey):**
```bash
choco install trivy
```

### How to Run
```bash
# Scan project filesystem
trivy fs ./EpiTrello/stack1-nextjs --severity HIGH,CRITICAL

# Generate JSON report
trivy fs . --format json --output trivy-report.json
```

### Interpreting Results
- **CRITICAL** - Fix immediately
- **HIGH** - Fix as soon as possible
- **MEDIUM** - Review and plan fixes
- **LOW** - Monitor

### Handling False Positives
Create `.trivyignore` file in project root:
```
CVE-2023-12345  # False positive - library not used in production
```

---

## 5. Docker Image Security Scanning (Trivy)

### What is Tested
Vulnerabilities in Docker base images and installed packages within containers.

### Why It's Important
Container images can contain outdated or vulnerable system packages that need to be identified and patched.

### How to Run
```bash
# Build image first
docker compose build

# Scan the built image
trivy image epitrello-stack1-nextjs-app:latest --severity HIGH,CRITICAL
```

### Interpreting Results
Same severity levels as filesystem scanning (CRITICAL, HIGH, MEDIUM, LOW).

### Best Practice
Regularly update base images and rebuild containers to get security patches.

---

## 6. Web Application Penetration Testing (OWASP ZAP)

### What is Tested
Web application security vulnerabilities including:
- Cross-Site Scripting (XSS)
- SQL Injection
- Missing security headers
- Authentication issues
- Session management
- SSL/TLS configuration

### Why It's Important
Identifies runtime security vulnerabilities that static analysis cannot detect.

### Installation
Uses Docker image, no installation needed.

### How to Run
```bash
# Start application
cd EpiTrello/stack1-nextjs
docker compose up -d
Start-Sleep -Seconds 15 # (optionally) Wait for app to be ready

# Run baseline scan (Windows)
docker run --network host -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://localhost:3000

# Stop application
docker compose down
```

### Interpreting Results
**Scan Output:**
- `FAIL-NEW: X` - Critical failures requiring immediate attention
- `WARN-NEW: X` - Warnings that should be reviewed
- `PASS: X` - Security checks that passed

**Alert Severity:**
- **High** - Serious security vulnerabilities, fix immediately
- **Medium** - Potential security issues, review and fix
- **Low** - Minor security concerns, consider fixing
- **Informational** - Best practice recommendations

### Common Warnings (Acceptable)
- **Suspicious Comments** - In minified JavaScript (normal)
- **Non-Storable Content** - Cache header suggestions (not security risk)
- **Modern Web Application** - Informational detection

Edit `EpiTrello/stack1-nextjs/.zap/rules.tsv` to adjust alert thresholds.

---

## Quick Reference: Run All Tests Locally

Execute complete quality assurance suite before pushing:

```bash
# 1. Code Quality
npm run lint

# 2. Dependency Vulnerabilities
cd EpiTrello/stack1-nextjs
npm audit --audit-level=high

# 3. Filesystem Security Scan
trivy fs ./EpiTrello/stack1-nextjs --severity HIGH,CRITICAL

# 4. Docker Image Security Scan
docker compose build
trivy image epitrello-stack1-nextjs-app:latest --severity HIGH,CRITICAL

# 5. Web Application Penetration Test
docker compose up -d
Start-Sleep -Seconds 15
docker run --network host -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://localhost:3000
docker compose down
```

### You can run an [Automated QA Report](#automated-qa-report) to generate a complete report.

---

## CI/CD Pipeline

All tests run automatically on every push to `main` or `develop` and on pull requests.

**Pipeline Flow:**
```
Push → Code Quality → Security Scan → Docker Build → Pentest
   ↓         ↓              ↓              ↓            ↓
ESLint    npm audit    Docker build     Trivy       OWASP ZAP
           Trivy fs                     image
```

**Viewing Results:**
1. Go to GitHub repository
2. Click "Actions" tab
3. Select latest workflow run
4. Review logs for each job:
   - Code Quality (Lint)
   - Security & Dependency Audit
   - Docker Build & Sanity Check
   - OWASP ZAP Security Scan

---

## Pre-Production Security Checklist

Before deploying to production, verify:

- All CI/CD security scans pass
- No HIGH or CRITICAL vulnerabilities unresolved
- Linter errors fixed
- Tests pass with sufficient coverage
- Input validation implemented on all forms
- Error messages don't expose sensitive information
- `.env` files never committed to repository (of course)


## Summary

**Automated (CI/CD):**
- Code linting with ESLint
- Commit message validation
- Dependency vulnerability scanning
- Filesystem security scanning
- Docker image security scanning
- Web application penetration testing

**Manual Required:**
- Pre-commit code quality checks (automatic via Husky)
- Security configuration review before production
- Regular dependency updates and security patches
