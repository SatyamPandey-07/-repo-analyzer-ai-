import { AnalysisReport } from '../types.js';

export function generateHtmlReport(report: AnalysisReport): string {
  const securityGrade = getGrade(report.security.score);
  const docGrade      = getGrade(report.documentation.score);
  const maintGrade    = getGrade(report.maintainability.score);
  const scanDate      = new Date(report.scannedAt).toLocaleString();

  const ringOffset = 502 - (502 * Math.min(report.overallScore, 100)) / 100;
  const ringColor  = scoreRingColor(report.overallScore);

  const healthChecks = [
    { label: 'README File Present',             passed: report.health.hasReadme },
    { label: 'LICENSE File Present',            passed: report.health.hasLicense },
    { label: 'CONTRIBUTING.md Present',         passed: report.health.hasContributing },
    { label: 'SECURITY.md Present',             passed: report.health.hasSecurity },
    { label: 'Git Repository Configured',       passed: report.health.isGitRepo },
    { label: '.gitignore Configured',           passed: report.health.hasGitignore },
    { label: 'GitHub Actions / CI Configured',  passed: report.health.hasGithubActions },
    { label: 'Issue Templates Created',         passed: report.health.hasIssueTemplates },
    { label: 'Pull Request Template Created',   passed: report.health.hasPrTemplate },
  ];
  const docChecks = [
    { label: 'README File Present',             passed: report.documentation.hasReadme },
    { label: 'README Content (> 500 chars)',    passed: report.documentation.readmeLength > 500 },
    { label: 'Installation Guide Section',      passed: report.documentation.hasInstallationGuide },
    { label: 'Usage Examples Section',          passed: report.documentation.hasUsageGuide },
    { label: 'API Reference / Docs Folder',     passed: report.documentation.hasApiDocs },
    { label: 'Screenshots or Visual Media',     passed: report.documentation.hasScreenshots },
    { label: 'CONTRIBUTING.md Present',         passed: report.documentation.hasContributing },
  ];
  const securityChecks = [
    { label: 'SECURITY.md Vulnerability Policy',   passed: report.security.hasSecurityPolicy },
    { label: 'Dependabot Active Configuration',    passed: report.security.hasDependabot },
    { label: 'Package Manager Lockfile Present',   passed: report.security.hasLockfile },
    { label: 'Clean of Secret Leaks',              passed: report.security.detectedSecrets.length === 0 },
  ];
  const maintChecks = [
    { label: 'Unit / Integration Tests',            passed: report.maintainability.hasTests },
    { label: 'Linting / Formatting Configs',        passed: report.maintainability.hasLinter },
    { label: 'Recent Git Activity (30 days)',        passed: report.maintainability.commitCount30Days > 0 },
    { label: 'Package Scripts (test/lint/build)',   passed: report.maintainability.packageScripts.length > 0 },
    { label: 'Issue & PR Templates Available',      passed: report.maintainability.hasIssueTemplates && report.maintainability.hasPrTemplate },
  ];

  const checks = (list: { label: string; passed: boolean }[]) =>
    list.map(c => `
      <div class="check ${c.passed ? 'pass' : 'fail'}">
        <span class="check-dot">${c.passed ? '✓' : '✗'}</span>
        <span>${c.label}</span>
      </div>`).join('');

  const secretsHtml = report.security.detectedSecrets.length
    ? report.security.detectedSecrets.map(s => `
      <div class="vuln-card">
        <div class="vuln-top">
          <span class="pill pill-danger">${escapeHtml(s.type)}</span>
          <span class="vuln-loc">${escapeHtml(s.file)}:${s.line}</span>
        </div>
        <pre class="code-block">${escapeHtml(s.snippet)}</pre>
      </div>`).join('')
    : `<div class="empty-card">
        <div class="empty-icon">🛡️</div>
        <p>No secret leaks detected in codebase files.</p>
       </div>`;

  const perfHtml = report.performance.suggestions.length
    ? report.performance.suggestions.map(s => `
      <div class="perf-card perf-${s.type}">
        <span class="pill ${s.type === 'warning' ? 'pill-warning' : 'pill-info'}">${s.type.toUpperCase()}</span>
        ${s.file ? `<span class="perf-file">${escapeHtml(s.file)}</span>` : ''}
        <p class="perf-msg">${escapeHtml(s.message)}</p>
      </div>`).join('')
    : `<div class="empty-card">
        <div class="empty-icon">⚡</div>
        <p>No performance issues detected.</p>
       </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Repository Health Report — ${escapeHtml(report.projectName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    /* ─── Design Tokens ─────────────────────────────── */
    :root {
      --gold:          #C9993A;
      --gold-light:    #E8C97A;
      --gold-pale:     #F5E9C8;
      --gold-gradient: linear-gradient(135deg, #BF8A2E 0%, #E8C97A 45%, #BF8A2E 100%);
      --gold-sheen:    linear-gradient(135deg, #C9993A 0%, #F0D98B 50%, #C9993A 100%);

      --white:         #FFFFFF;
      --off-white:     #FAFAF7;
      --surface:       #FFFFFF;
      --surface-raised:#F7F4EE;

      --ink:           #1A1714;
      --ink-muted:     #6B6458;
      --ink-faint:     #AEA89E;

      --border:        #E8E0D0;
      --border-gold:   rgba(201, 153, 58, 0.3);

      --success:       #2D7D4F;
      --danger:        #C0392B;
      --warning:       #C67C1A;
      --info:          #1A6A8A;

      --radius-sm:     6px;
      --radius-md:     12px;
      --radius-lg:     20px;
      --radius-xl:     28px;

      --shadow-sm:     0 1px 3px rgba(26,23,20,.06), 0 1px 2px rgba(26,23,20,.04);
      --shadow-md:     0 4px 16px rgba(26,23,20,.08), 0 1px 4px rgba(26,23,20,.04);
      --shadow-lg:     0 12px 40px rgba(26,23,20,.12), 0 2px 8px rgba(26,23,20,.05);
      --shadow-gold:   0 8px 32px rgba(201,153,58,.18);

      --font-serif:    'Cormorant Garamond', Georgia, 'Times New Roman', serif;
      --font-sans:     'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-mono:     'JetBrains Mono', 'Fira Code', Consolas, monospace;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ─── Page ───────────────────────────────────────── */
    body {
      background: var(--off-white);
      background-image:
        radial-gradient(ellipse 800px 500px at 0% 0%, rgba(201,153,58,.06) 0%, transparent 70%),
        radial-gradient(ellipse 600px 400px at 100% 100%, rgba(201,153,58,.05) 0%, transparent 70%);
      color: var(--ink);
      font-family: var(--font-sans);
      font-size: 15px;
      line-height: 1.6;
      min-height: 100vh;
      padding: 0 0 6rem;
    }

    .container { max-width: 1180px; margin: 0 auto; padding: 0 2rem; }

    /* ─── Hero / Header ─────────────────────────────── */
    .hero {
      position: relative;
      padding: 3.5rem 2rem 3rem;
      max-width: 1180px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--gold);
      background: var(--gold-pale);
      border: 1px solid var(--border-gold);
      border-radius: 9999px;
      padding: 0.3rem 1rem;
      width: fit-content;
    }

    .hero-eyebrow::before {
      content: '';
      width: 6px; height: 6px;
      background: var(--gold-gradient);
      border-radius: 50%;
    }

    h1.hero-title {
      font-family: var(--font-serif);
      font-size: clamp(2rem, 5vw, 3.25rem);
      font-weight: 700;
      color: var(--ink);
      line-height: 1.15;
      letter-spacing: -0.01em;
    }

    h1.hero-title .gold-text {
      background: var(--gold-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem;
      align-items: center;
      font-size: 0.82rem;
      color: var(--ink-muted);
      margin-top: 0.25rem;
    }

    .hero-meta-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .hero-meta-item svg {
      width: 14px; height: 14px;
      color: var(--gold);
      flex-shrink: 0;
    }

    /* Gold divider */
    .gold-rule {
      width: 100%;
      height: 1px;
      background: linear-gradient(to right, transparent, var(--border-gold), var(--border));
      margin: 0 0 2.5rem;
    }

    /* ─── Overview Strip ─────────────────────────────── */
    .overview-strip {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 820px) {
      .overview-strip { grid-template-columns: 1fr; }
    }

    /* Score Ring Card */
    .score-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg), var(--shadow-gold);
      padding: 2.5rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .score-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(145deg, rgba(201,153,58,.04) 0%, transparent 60%);
      pointer-events: none;
    }

    .score-card-label {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 1.25rem;
    }

    .ring-wrap {
      position: relative;
      width: 160px;
      height: 160px;
    }

    .ring-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .ring-track {
      fill: none;
      stroke: var(--gold-pale);
      stroke-width: 9;
    }

    .ring-fill {
      fill: none;
      stroke: url(#goldGrad);
      stroke-width: 9;
      stroke-linecap: round;
      stroke-dasharray: 502;
      stroke-dashoffset: ${ringOffset};
      filter: drop-shadow(0 0 6px rgba(201,153,58,.4));
    }

    .ring-inner {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .ring-score {
      font-family: var(--font-serif);
      font-size: 3rem;
      font-weight: 700;
      color: var(--ink);
      line-height: 1;
    }

    .ring-denom {
      font-size: 0.78rem;
      color: var(--ink-muted);
      margin-top: 0.15rem;
      letter-spacing: 0.05em;
    }

    .score-status {
      margin-top: 1.25rem;
      font-family: var(--font-serif);
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--ink);
    }

    .score-status-gold {
      font-size: 0.78rem;
      color: var(--gold);
      font-family: var(--font-sans);
      font-weight: 500;
      margin-top: 0.35rem;
    }

    /* ─── Stat Tiles ─────────────────────────────────── */
    .stat-tiles {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      align-content: start;
    }

    @media (max-width: 500px) {
      .stat-tiles { grid-template-columns: 1fr; }
    }

    .tile {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      padding: 1.6rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      position: relative;
      overflow: hidden;
      transition: box-shadow 0.25s, transform 0.25s;
    }

    .tile:hover {
      box-shadow: var(--shadow-lg), var(--shadow-gold);
      transform: translateY(-2px);
    }

    .tile::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }

    .tile-health::after    { background: var(--gold-gradient); }
    .tile-security::after  { background: linear-gradient(90deg, #C0392B, #E74C3C); }
    .tile-docs::after      { background: linear-gradient(90deg, #1A6A8A, #2980B9); }
    .tile-maint::after     { background: linear-gradient(90deg, #2D7D4F, #27AE60); }

    .tile-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .tile-name {
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ink-muted);
    }

    .tile-grade {
      font-family: var(--font-serif);
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
    }

    .tile-health .tile-grade    { color: var(--gold); }
    .tile-security .tile-grade  { color: var(--danger); }
    .tile-docs .tile-grade      { color: var(--info); }
    .tile-maint .tile-grade     { color: var(--success); }

    .tile-bar-wrap {
      height: 4px;
      background: var(--surface-raised);
      border-radius: 9999px;
      overflow: hidden;
    }

    .tile-bar {
      height: 100%;
      border-radius: 9999px;
      transition: width 1s ease-out;
    }

    .tile-health .tile-bar    { background: var(--gold-gradient); }
    .tile-security .tile-bar  { background: linear-gradient(90deg, #C0392B, #E74C3C); }
    .tile-docs .tile-bar      { background: linear-gradient(90deg, #1A6A8A, #2980B9); }
    .tile-maint .tile-bar     { background: linear-gradient(90deg, #2D7D4F, #27AE60); }

    .tile-check-mini {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .tile-check-mini .mini-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.76rem;
      color: var(--ink-muted);
    }

    .mini-row .dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .dot-pass { background: var(--success); }
    .dot-fail { background: var(--danger); }

    /* ─── Section Titles ─────────────────────────────── */
    .section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 3rem 0 1.5rem;
    }

    .section-header h2 {
      font-family: var(--font-serif);
      font-size: 1.65rem;
      font-weight: 700;
      color: var(--ink);
      letter-spacing: -0.01em;
    }

    .section-header .s-icon {
      width: 36px; height: 36px;
      border-radius: var(--radius-sm);
      background: var(--gold-pale);
      border: 1px solid var(--border-gold);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }

    /* ─── Checklist Cards ─────────────────────────────── */
    .checks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(520px, 1fr));
      gap: 1.5rem;
    }

    @media (max-width: 600px) {
      .checks-grid { grid-template-columns: 1fr; }
    }

    .check-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .check-card-header {
      padding: 1.1rem 1.5rem;
      background: var(--surface-raised);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .check-card-title {
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: var(--ink-muted);
    }

    .check-card-score {
      font-family: var(--font-serif);
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--ink);
    }

    .check-card-body { padding: 0.75rem 1rem; }

    .check {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.84rem;
      transition: background 0.15s;
    }

    .check:hover { background: var(--surface-raised); }

    .check-dot {
      width: 20px; height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .check.pass { color: var(--ink); }
    .check.pass .check-dot { background: #E8F5EE; color: var(--success); }

    .check.fail { color: var(--ink-faint); }
    .check.fail .check-dot { background: #FDECEA; color: var(--danger); }

    /* ─── Vulnerability & Performance ──────────────────── */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
      gap: 2rem;
    }

    @media (max-width: 600px) {
      .details-grid { grid-template-columns: 1fr; }
    }

    .detail-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .detail-panel-header {
      padding: 1.1rem 1.5rem;
      background: var(--surface-raised);
      border-bottom: 1px solid var(--border);
    }

    .detail-panel-title {
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: var(--ink-muted);
    }

    .detail-panel-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }

    .vuln-card {
      border: 1px solid #FCDEDE;
      background: #FFF8F8;
      border-radius: var(--radius-md);
      padding: 1rem 1.1rem;
    }

    .vuln-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.65rem;
    }

    .vuln-loc {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--ink-muted);
    }

    .code-block {
      background: #1A1714;
      color: #F1A7A0;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      padding: 0.65rem 0.9rem;
      border-radius: var(--radius-sm);
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .perf-card {
      border-radius: var(--radius-md);
      padding: 1rem 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .perf-warning { background: #FFF9ED; border: 1px solid #F5E0A6; }
    .perf-info    { background: #EDF7FF; border: 1px solid #A6D4F5; }

    .perf-file {
      font-family: var(--font-mono);
      font-size: 0.73rem;
      color: var(--ink-muted);
    }

    .perf-msg {
      font-size: 0.84rem;
      color: var(--ink);
      line-height: 1.5;
    }

    /* ─── Pills / Badges ─────────────────────────────── */
    .pill {
      display: inline-flex;
      align-items: center;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
    }

    .pill-gold    { background: var(--gold-pale); color: var(--gold); border: 1px solid var(--border-gold); }
    .pill-success { background: #E8F5EE; color: var(--success); border: 1px solid #B3DFC4; }
    .pill-danger  { background: #FDECEA; color: var(--danger);  border: 1px solid #F5BABA; }
    .pill-warning { background: #FFF3DC; color: var(--warning); border: 1px solid #F5DCAA; }
    .pill-info    { background: #E3F2FF; color: var(--info);    border: 1px solid #A6CEF5; }

    /* ─── Empty States ───────────────────────────────── */
    .empty-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3.5rem 2rem;
      text-align: center;
      color: var(--ink-faint);
      gap: 0.75rem;
      background: var(--surface-raised);
      border: 1px dashed var(--border);
      border-radius: var(--radius-md);
    }

    .empty-icon { font-size: 2rem; line-height: 1; }

    .empty-card p {
      font-size: 0.88rem;
      color: var(--ink-muted);
      max-width: 340px;
    }

    /* ─── Footer ─────────────────────────────────────── */
    footer {
      margin-top: 5rem;
      padding: 2.5rem 2rem;
      text-align: center;
      color: var(--ink-faint);
      font-size: 0.8rem;
      position: relative;
    }

    footer::before {
      content: '';
      display: block;
      width: 80px;
      height: 1px;
      background: var(--gold-gradient);
      margin: 0 auto 1.5rem;
    }

    footer strong { color: var(--gold); font-weight: 600; }
  </style>
</head>
<body>

  <!-- ── Hero ─────────────────────────────────────────── -->
  <div class="hero">
    <span class="hero-eyebrow">Analysis Completed</span>
    <h1 class="hero-title">
      <span class="gold-text">${escapeHtml(report.projectName)}</span><br>
      Repository Report
    </h1>
    <div class="hero-meta">
      <div class="hero-meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 11l2 2 4-4"/>
        </svg>
        ${escapeHtml(report.repoPathOrUrl)}
      </div>
      <div class="hero-meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9"/>
          <path stroke-linecap="round" d="M12 7v5l3 3"/>
        </svg>
        Scanned ${scanDate}
      </div>
    </div>
  </div>

  <div class="gold-rule"></div>

  <div class="container">

    <!-- ── Overview ───────────────────────────────────── -->
    <div class="overview-strip">

      <!-- Score Ring -->
      <div class="score-card">
        <div class="score-card-label">Overall Health Score</div>

        <div class="ring-wrap">
          <svg class="ring-svg" viewBox="0 0 168 168">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stop-color="#BF8A2E"/>
                <stop offset="50%"  stop-color="#E8C97A"/>
                <stop offset="100%" stop-color="#BF8A2E"/>
              </linearGradient>
            </defs>
            <circle class="ring-track" cx="84" cy="84" r="80"/>
            <circle class="ring-fill"  cx="84" cy="84" r="80"/>
          </svg>
          <div class="ring-inner">
            <span class="ring-score">${report.overallScore}</span>
            <span class="ring-denom">/ 100</span>
          </div>
        </div>

        <div class="score-status">
          ${report.overallScore >= 80 ? 'Excellent Condition' : report.overallScore >= 50 ? 'Needs Attention' : 'Critical Condition'}
        </div>
        <div class="score-status-gold">
          ${report.overallScore >= 80 ? '★ Production Ready' : report.overallScore >= 50 ? '◆ Improvements Needed' : '⚠ Immediate Action Required'}
        </div>
      </div>

      <!-- Stat Tiles -->
      <div class="stat-tiles">

        <div class="tile tile-health">
          <div class="tile-header">
            <span class="tile-name">Health</span>
            <span class="tile-grade">${report.health.score}<small style="font-size:1rem;color:var(--ink-muted)">/100</small></span>
          </div>
          <div class="tile-bar-wrap"><div class="tile-bar" style="width:${report.health.score}%"></div></div>
          <div class="tile-check-mini">
            ${healthChecks.slice(0, 4).map(c => `
            <div class="mini-row">
              <span class="dot ${c.passed ? 'dot-pass' : 'dot-fail'}"></span>
              ${c.label}
            </div>`).join('')}
          </div>
        </div>

        <div class="tile tile-security">
          <div class="tile-header">
            <span class="tile-name">Security</span>
            <span class="tile-grade">${report.security.score}<small style="font-size:1rem;color:var(--ink-muted)">/100</small></span>
          </div>
          <div class="tile-bar-wrap"><div class="tile-bar" style="width:${report.security.score}%"></div></div>
          <div class="tile-check-mini">
            ${securityChecks.map(c => `
            <div class="mini-row">
              <span class="dot ${c.passed ? 'dot-pass' : 'dot-fail'}"></span>
              ${c.label}
            </div>`).join('')}
          </div>
        </div>

        <div class="tile tile-docs">
          <div class="tile-header">
            <span class="tile-name">Documentation</span>
            <span class="tile-grade">${report.documentation.score}<small style="font-size:1rem;color:var(--ink-muted)">/100</small></span>
          </div>
          <div class="tile-bar-wrap"><div class="tile-bar" style="width:${report.documentation.score}%"></div></div>
          <div class="tile-check-mini">
            ${docChecks.slice(0, 4).map(c => `
            <div class="mini-row">
              <span class="dot ${c.passed ? 'dot-pass' : 'dot-fail'}"></span>
              ${c.label}
            </div>`).join('')}
          </div>
        </div>

        <div class="tile tile-maint">
          <div class="tile-header">
            <span class="tile-name">Maintainability</span>
            <span class="tile-grade">${report.maintainability.score}<small style="font-size:1rem;color:var(--ink-muted)">/100</small></span>
          </div>
          <div class="tile-bar-wrap"><div class="tile-bar" style="width:${report.maintainability.score}%"></div></div>
          <div class="tile-check-mini">
            ${maintChecks.map(c => `
            <div class="mini-row">
              <span class="dot ${c.passed ? 'dot-pass' : 'dot-fail'}"></span>
              ${c.label}
            </div>`).join('')}
          </div>
        </div>

      </div>
    </div>

    <!-- ── Detailed Checklists ──────────────────────────── -->
    <div class="section-header">
      <div class="s-icon">📋</div>
      <h2>Detailed Checklists</h2>
    </div>

    <div class="checks-grid">
      <div class="check-card">
        <div class="check-card-header">
          <span class="check-card-title">Repository Health</span>
          <span class="check-card-score">${report.health.score}/100</span>
        </div>
        <div class="check-card-body">${checks(healthChecks)}</div>
      </div>
      <div class="check-card">
        <div class="check-card-header">
          <span class="check-card-title">Documentation Quality</span>
          <span class="check-card-score">${docGrade} &nbsp;·&nbsp; ${report.documentation.score}/100</span>
        </div>
        <div class="check-card-body">${checks(docChecks)}</div>
      </div>
      <div class="check-card">
        <div class="check-card-header">
          <span class="check-card-title">Security Status</span>
          <span class="check-card-score">${securityGrade} &nbsp;·&nbsp; ${report.security.score}/100</span>
        </div>
        <div class="check-card-body">${checks(securityChecks)}</div>
      </div>
      <div class="check-card">
        <div class="check-card-header">
          <span class="check-card-title">Maintainability</span>
          <span class="check-card-score">${maintGrade} &nbsp;·&nbsp; ${report.maintainability.score}/100</span>
        </div>
        <div class="check-card-body">${checks(maintChecks)}</div>
      </div>
    </div>

    <!-- ── Details ─────────────────────────────────────── -->
    <div class="section-header">
      <div class="s-icon">🔍</div>
      <h2>Findings & Suggestions</h2>
    </div>

    <div class="details-grid">
      <div class="detail-panel">
        <div class="detail-panel-header">
          <div class="detail-panel-title">Potential Secret Leaks</div>
        </div>
        <div class="detail-panel-body">${secretsHtml}</div>
      </div>
      <div class="detail-panel">
        <div class="detail-panel-header">
          <div class="detail-panel-title">Performance &amp; Cleanups</div>
        </div>
        <div class="detail-panel-body">${perfHtml}</div>
      </div>
    </div>

  </div>

  <footer>
    <p>Generated by <strong>repo-analyzer-ai</strong> &bull; Open Source Repository Health Scanner</p>
  </footer>

</body>
</html>`;
}

function getGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

function scoreRingColor(score: number): string {
  if (score >= 80) return '#2D7D4F';
  if (score >= 50) return '#C9993A';
  return '#C0392B';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}
