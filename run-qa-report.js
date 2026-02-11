#!/usr/bin/env node
// QA + Security consolidated runner (cross-platform, Node, CommonJS)
// Generates qa-report.html at repo root

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { exec } = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFile, writeFile } = require('fs/promises');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const os = require('os');

// Platform detection
const isWindows = os.platform() === 'win32';

// Project root
const projectDir = path.join(__dirname, 'EpiTrello', 'stack1-nextjs');
const outputPath = path.join(__dirname, 'qa-report.html');


// Convert a Windows path to a Docker-compatible mount path.
function toDockerPath(p) {
  if (!isWindows) return p;
  const resolved = path.resolve(p);
  return '/' + resolved.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, letter) => letter.toLowerCase());
}

// Check if Docker daemon is running and accessible.
async function isDockerAvailable() {
  try {
    const result = await run('docker ps', __dirname);
    return result.code === 0;
  } catch {
    return false;
  }
}

const run = (cmd, cwd = projectDir, timeoutMs = 0) => new Promise(resolve => {
  const opts = { cwd, maxBuffer: 20 * 1024 * 1024 };
  if (timeoutMs > 0) opts.timeout = timeoutMs;
  const child = exec(cmd, opts, (error, stdout, stderr) => {
    const killed = error?.killed || false;
    const code = killed ? 'TIMEOUT' : (error?.code ?? 0);
    resolve({ stdout, stderr, code, killed });
  });
  child.stdin?.end();
});

const escapeHtml = (str = '') => str
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const badge = status => ({
  PASS: { cls: 'pass', label: 'PASS' },
  FAIL: { cls: 'fail', label: 'FAIL' },
  WARN: { cls: 'warn', label: 'WARN' },
  SKIP: { cls: 'skip', label: 'SKIP' },
  ERROR: { cls: 'fail', label: 'ERROR' },
}[status] || { cls: 'skip', label: status || 'N/A' });

const nonEmpty = s => {
  const v = s || '';
  return v.trim().length ? v : '(no output captured)';
};

async function main() {
  const now = new Date();
  const timestamp = now.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
                    now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const results = {
    eslint: {},
    tests: {},
    npmAudit: {},
    trivyFs: {},
    trivyImage: {},
    owaspZap: {},
  };

  // 1) ESLint
  const lint = await run('npm run lint', __dirname);
  results.eslint = {
    status: lint.code === 0 ? 'PASS' : 'FAIL',
    output: nonEmpty(`${lint.stdout || ''}${lint.stderr || ''}`),
    success: lint.code === 0,
  };

  // 2) Tests + coverage
  const tests = await run('npm run test:coverage');
  results.tests = {
    status: tests.code === 0 ? 'PASS' : 'FAIL',
    output: nonEmpty(`${tests.stdout || ''}${tests.stderr || ''}`),
    success: tests.code === 0,
  };
  try {
    const covPath = path.join(projectDir, 'coverage', 'coverage-summary.json');
    if (results.tests.success) {
      const coverageData = JSON.parse(await readFile(covPath, 'utf8'));
      results.tests.coverage = coverageData.total;
    } else {
      results.tests.coverage = null;
    }
  } catch (err) {
    console.error(err);
    results.tests.coverage = null;
  }

  // 3) npm audit
  const audit = await run('npm audit --json');
  let auditStatus = 'ERROR';
  let auditSummary = {};
  try {
    const data = JSON.parse(audit.stdout || '{}');
    auditSummary = data.metadata?.vulnerabilities || { critical: 0, high: 0, moderate: 0, low: 0, total: 0 };
    const total = auditSummary.total || 0;
    auditStatus = total === 0 ? 'PASS' : 'WARN';
  } catch (err) {
    console.error(err);
    auditStatus = 'ERROR';
    auditSummary = { critical: 0, high: 0, moderate: 0, low: 0, total: 0 };
  }
  results.npmAudit = {
    status: auditStatus,
    output: nonEmpty(`${audit.stdout || ''}${audit.stderr || ''}`),
    vulnerabilities: auditSummary,
  };

  // 4) Trivy filesystem
  const dockerAvailable = await isDockerAvailable();
  if (!dockerAvailable) {
    const skipMsg = 'Docker daemon is not running. Skipping Trivy and OWASP ZAP scans.\nPlease start Docker Desktop and try again.';
    results.trivyFs = { status: 'SKIP', output: skipMsg, vulnerabilities: -1 };
    results.trivyImage = { status: 'SKIP', output: skipMsg, vulnerabilities: -1 };
    results.owaspZap = { status: 'SKIP', output: skipMsg, failures: -1, warnings: 0, passes: 0 };
  } else {
    // --- Trivy Filesystem Scan ---
    // Mount only the lockfiles for a fast dependency-only scan instead of the entire project tree
    // (full tree via Docker volume on OneDrive/Windows is extremely slow).
    const dockerProjectPath = toDockerPath(projectDir);
    const trivyFsCmd = `docker run --rm -v "${dockerProjectPath}/package.json:/scan/package.json" -v "${dockerProjectPath}/package-lock.json:/scan/package-lock.json" aquasec/trivy fs /scan --severity HIGH,CRITICAL --format json`;
    console.log(`Running Trivy FS: ${trivyFsCmd}`);
    const trivyFs = await run(trivyFsCmd, __dirname, 120000); // 2 min timeout
    const trivyFsOutput = `${trivyFs.stdout || ''}${trivyFs.stderr || ''}`;
    let trivyFsCount = 0;

    if (trivyFs.killed) {
      trivyFsCount = -1;
      console.log('Trivy FS scan timed out');
    } else if (trivyFs.code !== 0 || trivyFsOutput.includes('error during connect')) {
      trivyFsCount = -1;
      console.log('Trivy FS scan failed:', trivyFsOutput.substring(0, 200));
    } else {
      try {
        const data = JSON.parse(trivyFs.stdout || '{}');
        for (const r of data.Results || []) {
          trivyFsCount += (r.Vulnerabilities || []).length;
        }
      } catch (err) {
        trivyFsCount = -1;
        console.log('Trivy FS parse error:', err.message);
      }
    }
    results.trivyFs = {
      status: trivyFsCount === 0 ? 'PASS' : trivyFsCount > 0 ? 'WARN' : 'ERROR',
      output: nonEmpty(trivyFsOutput),
      vulnerabilities: trivyFsCount,
    };

    // --- Trivy Docker Image Scan ---
    // Use the Docker socket mount appropriate for the platform
    const socketMount = isWindows
      ? '//var/run/docker.sock:/var/run/docker.sock'
      : '/var/run/docker.sock:/var/run/docker.sock';
    const trivyImageCmd = `docker run --rm -v ${socketMount} aquasec/trivy image --severity HIGH,CRITICAL --format json stack1-nextjs-nextjs-app:latest`;
    console.log(`Running Trivy Image: ${trivyImageCmd}`);
    const trivyImage = await run(trivyImageCmd, __dirname, 180000); // 3 min timeout
    const trivyImageOutput = `${trivyImage.stdout || ''}${trivyImage.stderr || ''}`;
    let trivyImgCount = 0;

    if (trivyImage.killed) {
      trivyImgCount = -1;
      console.log('Trivy Image scan timed out');
    } else if (trivyImage.code !== 0 || trivyImageOutput.includes('error during connect')) {
      trivyImgCount = -1;
      console.log('Trivy Image scan failed:', trivyImageOutput.substring(0, 200));
    } else {
      try {
        const data = JSON.parse(trivyImage.stdout || '{}');
        for (const r of data.Results || []) {
          trivyImgCount += (r.Vulnerabilities || []).length;
        }
      } catch (err) {
        trivyImgCount = -1;
        console.log('Trivy Image parse error:', err.message);
      }
    }
    results.trivyImage = {
      status: trivyImgCount === 0 ? 'PASS' : trivyImgCount > 0 ? 'WARN' : 'ERROR',
      output: nonEmpty(trivyImageOutput),
      vulnerabilities: trivyImgCount,
    };

    // --- OWASP ZAP ---
    // On Windows/macOS Docker Desktop, --network host doesn't work.
    // Use host.docker.internal to reach the host's localhost.
    // Pour la CI !
    const zapTarget = isWindows || os.platform() === 'darwin'
      ? 'http://host.docker.internal:3000'
      : 'http://localhost:3000';
    const zapCmd = `docker run --rm ${isWindows || os.platform() === 'darwin' ? '' : '--network host '}ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t ${zapTarget}`;
    console.log(`Running OWASP ZAP: ${zapCmd}`);
    const zap = await run(zapCmd, __dirname, 180000); // 3 min timeout
    const zapOutput = `${zap.stdout || ''}${zap.stderr || ''}`;
    let zapFail = 0, zapWarn = 0, zapPass = 0;

    if (zapOutput.includes('error during connect') || zapOutput.includes('Cannot connect')) {
      zapFail = -1;
      console.log('OWASP ZAP scan failed:', zapOutput.substring(0, 200));
    } else {
      try {
        const out = zap.stdout || '';
        zapFail = Number((out.match(/FAIL-NEW: (\d+)/) || [])[1] || 0);
        zapWarn = Number((out.match(/WARN-NEW: (\d+)/) || [])[1] || 0);
        zapPass = Number((out.match(/PASS: (\d+)/) || [])[1] || 0);
      } catch (err) {
        zapFail = -1;
        console.log('OWASP ZAP parse error:', err.message);
      }
    }
    results.owaspZap = {
      status: zapFail === 0 && !zapOutput.includes('error during connect') ? 'PASS' : zapFail > 0 ? 'WARN' : 'ERROR',
      output: nonEmpty(zapOutput),
      failures: zapFail,
      warnings: zapWarn,
      passes: zapPass,
    };
  }

  const sections = [
    { key: 'eslint', title: 'ESLint - Code Quality' },
    { key: 'tests', title: 'Tests & Coverage' },
    { key: 'npmAudit', title: 'npm Audit' },
    { key: 'trivyFs', title: 'Trivy Filesystem' },
    { key: 'trivyImage', title: 'Trivy Docker Image' },
    { key: 'owaspZap', title: 'OWASP ZAP' },
  ];

  const summaryCards = sections.map(({ key, title }) => {
    const { cls, label } = badge(results[key].status);
    return `<div class="card"><h3>${escapeHtml(title)}</h3><div class="value ${cls}">${label}</div></div>`;
  }).join('');

  const hasCoverage = !!results.tests.coverage;
  const hasAudit = results.npmAudit?.vulnerabilities && Object.values(results.npmAudit.vulnerabilities).some(v => Number(v) > 0);
  const hasZap = (results.owaspZap.failures ?? 0) > 0 || (results.owaspZap.warnings ?? 0) > 0 || (results.owaspZap.passes ?? 0) > 0;
  const hasTrivyFs = (results.trivyFs.vulnerabilities ?? -1) > 0;
  const hasTrivyImage = (results.trivyImage.vulnerabilities ?? -1) > 0;

  const metrics = {
    coverage: hasCoverage
      ? `<div class="metrics"><div class="metric"><span>Branches</span><strong>${results.tests.coverage.branches.pct}%</strong></div><div class="metric"><span>Functions</span><strong>${results.tests.coverage.functions.pct}%</strong></div><div class="metric"><span>Lines</span><strong>${results.tests.coverage.lines.pct}%</strong></div></div>`
      : '',
    audit: hasAudit
      ? `<div class="metrics"><div class="metric"><span>Critical</span><strong>${results.npmAudit.vulnerabilities.critical}</strong></div><div class="metric"><span>High</span><strong>${results.npmAudit.vulnerabilities.high}</strong></div><div class="metric"><span>Moderate</span><strong>${results.npmAudit.vulnerabilities.moderate}</strong></div><div class="metric"><span>Low</span><strong>${results.npmAudit.vulnerabilities.low}</strong></div></div>`
      : '',
    zap: hasZap
      ? `<div class="metrics"><div class="metric"><span>Failures</span><strong>${results.owaspZap.failures ?? 'n/a'}</strong></div><div class="metric"><span>Warnings</span><strong>${results.owaspZap.warnings ?? 'n/a'}</strong></div><div class="metric"><span>Passed</span><strong>${results.owaspZap.passes ?? 'n/a'}</strong></div></div>`
      : '',
    trivyFs: hasTrivyFs ? `<p>Vulnerabilities: ${results.trivyFs.vulnerabilities}</p>` : '',
    trivyImage: hasTrivyImage ? `<p>Vulnerabilities: ${results.trivyImage.vulnerabilities}</p>` : '',
  };

  const sectionHtml = sections.map(({ key, title }) => {
    const { cls, label } = badge(results[key].status);
    const extra = key === 'tests' ? metrics.coverage
      : key === 'npmAudit' ? metrics.audit
      : key === 'owaspZap' ? metrics.zap
      : key === 'trivyFs' ? metrics.trivyFs
      : key === 'trivyImage' ? metrics.trivyImage
      : '';
    const log = escapeHtml(results[key].output || '');
    return `
    <div class="section">
      <div class="section-header" onclick="toggle(this)"><h2>${escapeHtml(title)}</h2><div><span class="badge ${cls}">${label}</span><span class="toggle">▼</span></div></div>
      <div class="section-body">${extra}<div class="output">${log}</div></div>
    </div>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>EpiTrello QA Report - ${timestamp}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:Segoe UI,Arial,sans-serif;background:#f5f7fb;padding:24px}a{color:#4f46e5} .container{max-width:1200px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.08);overflow:hidden} .header{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:28px;text-align:center} .header h1{font-size:26px;margin-bottom:6px} .header p{opacity:0.9} .summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;padding:20px;background:#f8f9fb} .card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.03)} .card h3{font-size:12px;color:#6b7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em} .card .value{font-size:22px;font-weight:700} .pass{color:#16a34a} .fail{color:#dc2626} .warn{color:#d97706} .skip{color:#6b7280} .results{padding:24px} .section{border:1px solid #e5e7eb;border-radius:8px;margin-bottom:12px;overflow:hidden} .section-header{background:#f8fafc;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer} .section-header h2{font-size:16px;color:#111827;font-weight:600} .badge{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;border:1px solid transparent;margin-right:8px} .badge.pass{background:#ecfdf3;color:#166534;border-color:#bbf7d0} .badge.fail{background:#fef2f2;color:#991b1b;border-color:#fecdd3} .badge.warn{background:#fffbeb;color:#92400e;border-color:#fcd34d} .badge.skip{background:#f3f4f6;color:#374151;border-color:#e5e7eb} .section-body{display:none;padding:16px;background:#fff} .section-body.active{display:block} .output{background:#0b1021;color:#e5e7eb;border-radius:6px;padding:12px;white-space:pre-wrap;font-family:Consolas,monospace;font-size:12px;overflow:auto;max-height:360px} .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:12px} .metric{background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;padding:10px;text-align:center} .metric span{display:block;font-size:12px;color:#6b7280;margin-bottom:4px} .metric strong{font-size:18px;color:#111827} .footer{text-align:center;padding:16px;background:#f8fafc;color:#6b7280;font-size:12px}
.toggle{margin-left:8px;transition:transform .2s;display:inline-block}
.toggle.active{transform:rotate(180deg)}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>QA & Security Report</h1>
    <p>EpiTrello • Generated ${timestamp}</p>
  </div>
  <div class="summary">${summaryCards}</div>
  <div class="results">${sectionHtml}</div>
</div>
<script>
function toggle(el){const body=el.nextElementSibling;const icon=el.querySelector('.toggle');body.classList.toggle('active');icon.classList.toggle('active');}
</script>
</body>
</html>`;

  await writeFile(outputPath, html, 'utf8');
  console.log(`QA report written to ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
