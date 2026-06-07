import * as path from 'path';
import * as fs from 'fs/promises';
import { MaintainabilityResult } from '../types.js';
import { fileExists, dirExists, findAnyFile, scanDirRecursive } from '../utils/helpers.js';
import { getCommitCount30Days } from '../utils/git.js';

export async function analyzeMaintainability(dir: string): Promise<MaintainabilityResult> {
  // 1. Tests present
  let hasTests = false;
  if (
    (await dirExists(path.join(dir, 'test'))) ||
    (await dirExists(path.join(dir, 'tests'))) ||
    (await dirExists(path.join(dir, '__tests__'))) ||
    (await dirExists(path.join(dir, 'spec'))) ||
    (await dirExists(path.join(dir, 'specs')))
  ) {
    hasTests = true;
  } else {
    const testFiles = await scanDirRecursive(dir, (name, isDir) => {
      if (isDir) return true;
      const lower = name.toLowerCase();
      return (
        lower.includes('.test.') ||
        lower.includes('.spec.') ||
        lower.startsWith('test_') ||
        lower.endsWith('_test.go')
      );
    }, 4);
    
    hasTests = testFiles.length > 0;
  }

  // 2. Linter / Formatter configs
  const hasLinter = (await findAnyFile(dir, [
    '.eslintrc', '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml', 'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs',
    '.prettierrc', '.prettierrc.json', '.prettierrc.yml', '.prettierrc.yaml', '.prettierrc.js', 'prettier.config.js',
    'tsconfig.json', '.editorconfig', 'tslint.json', 'pyproject.toml', 'ruff.toml', '.golangci.yml'
  ])) !== null;

  // 3. Git commit history
  const commitCount30Days = await getCommitCount30Days(dir);

  // 4. Package scripts
  let packageScripts: string[] = [];
  const packageJsonPath = path.join(dir, 'package.json');
  if (await fileExists(packageJsonPath)) {
    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      if (pkg.scripts) {
        packageScripts = Object.keys(pkg.scripts);
      }
    } catch {
      // Ignore parse/read errors
    }
  }

  // 5. Issue and PR templates
  const githubDir = path.join(dir, '.github');
  let hasIssueTemplates = false;
  let hasPrTemplate = false;
  if (await dirExists(githubDir)) {
    const issueTemplateDir = path.join(githubDir, 'ISSUE_TEMPLATE');
    hasIssueTemplates = (await dirExists(issueTemplateDir)) ||
      (await findAnyFile(githubDir, ['issue_template.md', 'issue_template.yaml', 'issue_template.yml'])) !== null;
    
    hasPrTemplate = (await findAnyFile(githubDir, ['pull_request_template.md'])) !== null ||
      (await dirExists(path.join(githubDir, 'PULL_REQUEST_TEMPLATE')));
  }
  if (!hasIssueTemplates) {
    hasIssueTemplates = (await findAnyFile(dir, ['issue_template.md'])) !== null;
  }
  if (!hasPrTemplate) {
    hasPrTemplate = (await findAnyFile(dir, ['pull_request_template.md'])) !== null;
  }

  // Scoring
  let score = 0;
  if (hasTests) score += 30;
  if (hasLinter) score += 20;
  
  if (commitCount30Days >= 10) score += 20;
  else if (commitCount30Days >= 3) score += 15;
  else if (commitCount30Days > 0) score += 10;
  
  if (packageScripts.length > 0) {
    const qualityScripts = packageScripts.filter(s => ['test', 'lint', 'format', 'build', 'validate', 'check'].includes(s));
    if (qualityScripts.length >= 2) score += 15;
    else if (qualityScripts.length >= 1) score += 10;
    else score += 5;
  }
  
  if (hasIssueTemplates) score += 8;
  if (hasPrTemplate) score += 7;

  return {
    score,
    hasTests,
    hasLinter,
    commitCount30Days,
    hasPrTemplate,
    hasIssueTemplates,
    packageScripts
  };
}
