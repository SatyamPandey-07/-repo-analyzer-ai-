import * as path from 'path';
import * as fs from 'fs/promises';
import { HealthResult } from '../types.js';
import { fileExists, dirExists, findAnyFile } from '../utils/helpers.js';
import { isGitRepository } from '../utils/git.js';

export async function analyzeHealth(dir: string): Promise<HealthResult> {
  const isGitRepo = await isGitRepository(dir);
  
  // 1. README
  const hasReadme = (await findAnyFile(dir, ['README.md', 'README.txt', 'README'])) !== null;
  
  // 2. LICENSE
  const hasLicense = (await findAnyFile(dir, ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE'])) !== null;
  
  // 3. CONTRIBUTING
  const hasContributing = 
    (await findAnyFile(dir, ['CONTRIBUTING.md', 'CONTRIBUTING', 'CONTRIBUTING.txt'])) !== null ||
    (await dirExists(path.join(dir, '.github')) && (await findAnyFile(path.join(dir, '.github'), ['CONTRIBUTING.md', 'CONTRIBUTING'])) !== null);
  
  // 4. SECURITY
  const hasSecurity = 
    (await findAnyFile(dir, ['SECURITY.md', 'SECURITY', 'SECURITY.txt'])) !== null ||
    (await dirExists(path.join(dir, '.github')) && (await findAnyFile(path.join(dir, '.github'), ['SECURITY.md', 'SECURITY'])) !== null);

  // 5. .gitignore
  const hasGitignore = await fileExists(path.join(dir, '.gitignore'));

  // 6. GitHub Actions workflows
  let hasGithubActions = false;
  const workflowsDir = path.join(dir, '.github', 'workflows');
  if (await dirExists(workflowsDir)) {
    try {
      const files = await fs.readdir(workflowsDir);
      hasGithubActions = files.some(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    } catch {
      hasGithubActions = false;
    }
  }

  // 7. Issue templates
  let hasIssueTemplates = false;
  const githubDir = path.join(dir, '.github');
  const issueTemplateDir = path.join(githubDir, 'ISSUE_TEMPLATE');
  if (await dirExists(issueTemplateDir)) {
    try {
      const files = await fs.readdir(issueTemplateDir);
      hasIssueTemplates = files.length > 0;
    } catch {
      hasIssueTemplates = false;
    }
  } else if (await dirExists(githubDir)) {
    hasIssueTemplates = 
      (await findAnyFile(githubDir, ['issue_template.md', 'issue_template.yaml', 'issue_template.yml'])) !== null ||
      (await findAnyFile(dir, ['issue_template.md'])) !== null;
  }

  // 8. PR template
  let hasPrTemplate = false;
  if (await dirExists(githubDir)) {
    hasPrTemplate = (await findAnyFile(githubDir, ['pull_request_template.md', 'pull_request_template.txt'])) !== null;
    if (!hasPrTemplate) {
      const prSubDir = path.join(githubDir, 'PULL_REQUEST_TEMPLATE');
      if (await dirExists(prSubDir)) {
        try {
          const files = await fs.readdir(prSubDir);
          hasPrTemplate = files.length > 0;
        } catch {
          hasPrTemplate = false;
        }
      }
    }
  }
  if (!hasPrTemplate) {
    hasPrTemplate = (await findAnyFile(dir, ['pull_request_template.md'])) !== null;
  }

  // Scoring
  let score = 0;
  if (hasReadme) score += 15;
  if (hasLicense) score += 15;
  if (hasContributing) score += 10;
  if (hasSecurity) score += 10;
  if (hasGithubActions) score += 15;
  if (hasIssueTemplates) score += 15;
  if (hasPrTemplate) score += 10;
  if (hasGitignore) score += 10;

  return {
    score,
    hasReadme,
    hasLicense,
    hasContributing,
    hasSecurity,
    hasGitignore,
    hasGithubActions,
    hasIssueTemplates,
    hasPrTemplate,
    isGitRepo
  };
}
