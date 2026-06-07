export const SECURITY_TEMPLATE = `# Security Policy

## Supported Versions

The following versions of this project are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| >= 1.0  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of this project seriously. If you find a security vulnerability, please do NOT create a public issue. Instead, report it privately.

Please report security issues by emailing: **security@example.com**

Once reported, we will acknowledge your report within 48 hours and work with you to analyze and patch the issue before making a public disclosure.
`;

export const CONTRIBUTING_TEMPLATE = `# Contributing to this Project

Thank you for your interest in contributing! We appreciate your help in making this project better.

## Code of Conduct

Please be respectful and welcoming to other contributors.

## How Can I Contribute?

### Reporting Bugs

- Search the issue tracker to ensure the bug hasn't been reported yet.
- Create a new issue using the **Bug Report** template.
- Provide a clear description and steps to reproduce.

### Suggesting Enhancements

- Search the issue tracker for similar suggestions.
- Open an issue using the **Feature Request** template.

### Pull Requests

1. Fork the repository.
2. Create a new branch for your edits (\`git checkout -b feature/amazing-feature\`).
3. Make your changes, ensuring code style matches the rest of the project.
4. Add tests if applicable.
5. Commit your changes (\`git commit -m 'Add amazing feature'\`).
6. Push to your branch (\`git push origin feature/amazing-feature\`).
7. Open a Pull Request.

## Development Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
2. Run tests:
   \`\`\`bash
   npm test
   \`\`\`
`;

export const BUG_REPORT_TEMPLATE = `---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. macOS, Windows]
 - Node Version: [e.g. 18.0.0]
 - Version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
`;

export const FEATURE_REQUEST_TEMPLATE = `---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
`;

export const PR_TEMPLATE = `## Description

Please include a summary of the change and which issue is fixed. Please also include relevant motivation and context.

Fixes # (issue number)

## Type of Change

Please delete options that are not relevant.

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules
`;
