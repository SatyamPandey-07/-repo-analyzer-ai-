# 🔍 repo-analyzer-ai

> **Analyze any GitHub repository or local codebase and get actionable improvements in seconds.**

<p align="center">
  <img src="https://img.shields.io/npm/v/repo-analyzer-ai.svg?style=flat-square&color=D4AF37" alt="NPM Version" />
  <img src="https://img.shields.io/npm/l/repo-analyzer-ai.svg?style=flat-square&color=D4AF37" alt="License" />
  <img src="https://img.shields.io/node/v/repo-analyzer-ai.svg?style=flat-square&color=4A4A4A" alt="Node Version" />
  <img src="https://img.shields.io/npm/dm/repo-analyzer-ai.svg?style=flat-square&color=4A4A4A" alt="Downloads" />
</p>

---

`repo-analyzer-ai` is a zero-dependency CLI package designed for developers, maintainers, and open-source teams. It scans codebases locally or directly from GitHub, producing detailed health metrics, documentation grading, security scanning, and automated community fixes.

It also exports a **stunning, print-ready Gold & White Luxury HTML Dashboard** detailing every single aspect of your code quality.

---

## ⚡ Quick Start

No installation required! Just run it directly using `npx`:

```bash
npx repo-analyzer-ai scan https://github.com/expressjs/express
```

Or target your current directory:

```bash
npx repo-analyzer-ai scan .
```

---

## ✨ Features

- 🏥 **Health Score (0-100)**: Evaluates the presence of `README.md`, `LICENSE`, workflows, issue templates, PR checklists, and Git structure.
- 🛡️ **Credential & Security Scan**: Performs high-entropy pattern checks for exposed credentials, keys, database URLs, and analyzes dependencies, Lockfiles, and Security policies.
- 📝 **Documentation Inspection**: Measures documentation depth, installation guides, usage examples, API reference completeness, and preview assets.
- ⚙️ **Maintainability Assessment**: Evaluates unit test coverage markers, linter/formatter configurations, script organization, and project update velocity.
- ⚡ **Performance Diagnostics**: Scans for large assets, uncompressed assets, non-WebP formats, and redundant bundle files.
- 🔧 **Interactive Auto-Fixes**: Generate missing `SECURITY.md`, `CONTRIBUTING.md`, issue forms, and PR templates with a single command.
- 🎨 **Local SVG Badges**: Generates visual status badges directly to your workspace.
- 🏆 **Luxury Gold Dashboard**: Beautifully designed responsive web report suitable for sharing with clients, managers, or packaging with your repo docs.

---

## 🎨 Terminal Experience

Here is a preview of the CLI output:

```text
🔍 Analyzing repository: repo-analyzer-ai
==================================================

[+] Health Score:       92/100  (Excellent)
[+] Security Score:     88/100  (Good)
[+] Documentation:      95/100  (Excellent)
[+] Maintainability:    90/100  (Excellent)

Checklist Summary:
--------------------------------------------------
 ✓ README file exists
 ✓ License file exists
 ✗ Security Policy file (SECURITY.md) is missing!
 ✓ GitHub Actions workflows configured
 ✓ Package lockfile detected
 ✗ Issue templates not found in .github/

💡 Suggestions for Improvement:
 1. Security: Create a SECURITY.md file to help users report bugs responsibly.
 2. Health: Add bug and feature request templates in .github/ISSUE_TEMPLATE/

👉 Run "npx repo-analyzer-ai fix" to automatically generate missing community files.
```

---

## 📦 Installation

If you prefer to have the commands globally available on your terminal:

```bash
npm install -g repo-analyzer-ai
```

---

## 🛠️ Commands

### 1. `scan`
Scans a local directory or a GitHub repository.

```bash
repo-analyzer-ai scan [path-or-github-url] [options]
```

| Option | Default | Description |
| :--- | :--- | :--- |
| `--format <type>` | `text` | Output format: `text` (colored CLI), `json`, or `markdown` |
| `-o, --output <file>` | *None* | Save the scan output details to a specific local file path |
| `--token <token>` | *None* | GitHub personal access token (improves API limits & accesses private repos) |

---

### 2. `report`
Generates a highly-polished HTML dashboard displaying all metrics, charts, checklist details, and actionable recommendations.

```bash
repo-analyzer-ai report [path-or-github-url] [options]
```

| Option | Default | Description |
| :--- | :--- | :--- |
| `-o, --output <file>` | `report.html` | Destination path for the generated HTML report file |
| `--token <token>` | *None* | GitHub personal access token (for remote repository scans) |

> [!NOTE]
> The generated report features a **white and luxury-gold aesthetic**, clean custom SVGs, progress rings, and structured expandable detail sections. It is optimized to look premium on screen and layout beautifully when printed to PDF.

---

### 3. `fix`
Creates community, contribution, and security templates in your local workspace.

```bash
repo-analyzer-ai fix [path] [options]
```

| Option | Default | Description |
| :--- | :--- | :--- |
| `--all` | `true` | Generates all missing files |
| `--security` | `false` | Generates a standard `SECURITY.md` template |
| `--contributing` | `false` | Generates a professional `CONTRIBUTING.md` guide |
| `--issue-templates` | `false` | Sets up GitHub Issue templates for Bug Reports and Feature Requests |
| `--pr-template` | `false` | Generates a standard Pull Request checklist template |

---

### 4. `badge`
Creates status badges directly to your local file path.

```bash
repo-analyzer-ai badge [path-or-github-url] [options]
```

| Option | Default | Description |
| :--- | :--- | :--- |
| `-o, --output-dir <dir>` | `.` | Target directory where the SVG badges should be saved |
| `--format <type>` | `markdown` | Prints integration snippets in: `markdown` or `html` |

This will output three customized SVGs:
- `health.svg`
- `security.svg`
- `docs.svg`

---

## 🧮 Scoring Logic & Metrics

We evaluate files and repository properties using a multi-factor grading engine:

| Category | Score | Evaluated Checkpoints |
| :--- | :---: | :--- |
| **Health** | 0 - 100 | Presence of README, LICENSE, workflows, issue/PR templates, and Git files. |
| **Security** | 0 - 100 | Lockfiles, SECURITY policies, Dependabot settings, and credential leakage checks. |
| **Documentation** | 0 - 100 | Word counts, instructions (Install/Usage), API references, and inline comments. |
| **Maintainability** | 0 - 100 | Test configurations, lint settings, dependency updates, and commit frequency. |

---

## 🔑 Configuration & GitHub API Limits

To scan private repositories or prevent rate-limiting when scanning public repositories frequently, create a `.env` file in your working directory or set the environment variable:

```env
GITHUB_TOKEN=your_personal_access_token_here
```

---

## 📝 License

This project is licensed under the **MIT License**. Check out the [LICENSE](LICENSE) file for more information.
