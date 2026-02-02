#!/usr/bin/env node
// QA + Security consolidated runner (cross-platform, Node, CommonJS)
// Generates qa-report.html at repo root

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { exec } = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFile, writeFile } = require('fs/promises');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Project root
const projectDir = path.join(__dirname, 'EpiTrello', 'stack1-nextjs');
const outputPath = path.join(__dirname, 'qa-report.html');
const run = (cmd, cwd = projectDir) => new Promise(resolve => {
  const child = exec(cmd, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
    resolve({ stdout, stderr, code: error?.code ?? 0 });
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
  const trivyMount = `"${projectDir.replace(/\\/g, '/')}:/scan"`;
  const trivyFs = await run(`docker run --rm -v ${trivyMount} aquasec/trivy fs /scan --severity HIGH,CRITICAL --format json`);
  let trivyFsCount = 0;
  try {
    const data = JSON.parse(trivyFs.stdout || '{}');
    for (const r of data.Results || []) {
      trivyFsCount += (r.Vulnerabilities || []).length;
    }
  } catch (err) {
    trivyFsCount = -1;
    console.log(err);
  }
  results.trivyFs = {
    status: trivyFsCount === 0 ? 'PASS' : trivyFsCount > 0 ? 'WARN' : 'ERROR',
    output: nonEmpty(`${trivyFs.stdout || ''}${trivyFs.stderr || ''}`),
    vulnerabilities: trivyFsCount,
  };

  // 5) Trivy image
  // Check if image exists first, then scan using local docker command
  const trivyImage = await run('docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --severity HIGH,CRITICAL --format json stack1-nextjs-nextjs-app:latest');
  let trivyImgCount = 0;
  try {
    const data = JSON.parse(trivyImage.stdout || '{}');
    for (const r of data.Results || []) {
      trivyImgCount += (r.Vulnerabilities || []).length;
    }
  } catch (err) {
    trivyImgCount = -1;
    console.log(err);
  }
  results.trivyImage = {
    status: trivyImgCount === 0 ? 'PASS' : trivyImgCount > 0 ? 'WARN' : 'ERROR',
    output: nonEmpty(`${trivyImage.stdout || ''}${trivyImage.stderr || ''}`),
    vulnerabilities: trivyImgCount,
  };

  // 6) OWASP ZAP
  // Requires the app to be running on localhost:3000
  const zap = await run('docker run --rm --network host -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://localhost:3000', path.join(__dirname));
  let zapFail = 0, zapWarn = 0, zapPass = 0;
  try {
    const out = zap.stdout || '';
    zapFail = Number((out.match(/FAIL-NEW: (\d+)/) || [])[1] || 0);
    zapWarn = Number((out.match(/WARN-NEW: (\d+)/) || [])[1] || 0);
    zapPass = Number((out.match(/PASS: (\d+)/) || [])[1] || 0);
  } catch (err) {
    zapFail = -1;
    console.log(err);
  }
  results.owaspZap = {
    status: zapFail === 0 ? 'PASS' : zapFail > 0 ? 'WARN' : 'ERROR',
    output: nonEmpty(`${zap.stdout || ''}${zap.stderr || ''}`),
    failures: zapFail,
    warnings: zapWarn,
    passes: zapPass,
  };

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
      ? `<div class="metrics"><div class="metric"><span>Statements</span><strong>${results.tests.coverage.statements.pct}%</strong></div><div class="metric"><span>Branches</span><strong>${results.tests.coverage.branches.pct}%</strong></div><div class="metric"><span>Functions</span><strong>${results.tests.coverage.functions.pct}%</strong></div><div class="metric"><span>Lines</span><strong>${results.tests.coverage.lines.pct}%</strong></div></div>`
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
