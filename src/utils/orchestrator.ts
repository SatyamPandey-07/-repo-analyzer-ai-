import * as path from 'path';
import * as os from 'os';
import { AnalysisReport } from '../types.js';
import { analyzeHealth } from '../analyzers/health.js';
import { analyzeDocumentation } from '../analyzers/documentation.js';
import { analyzeSecurity } from '../analyzers/security.js';
import { analyzeMaintainability } from '../analyzers/maintainability.js';
import { analyzePerformance } from '../analyzers/performance.js';
import { cloneRepository, cleanupDirectory } from './git.js';
import { parseGithubUrl, fetchGithubMetadata } from './github.js';
import { dirExists } from './helpers.js';

export async function runAnalysis(
  targetPathOrUrl: string,
  githubToken?: string
): Promise<AnalysisReport> {
  let scanPath = targetPathOrUrl;
  let isTemp = false;
  let tempPath = '';
  let projectName = 'Local Directory';
  let repoPathOrUrl = targetPathOrUrl;

  const gitUrlMatch = /^(https:\/\/|git@|github\.com)/i.test(targetPathOrUrl) || targetPathOrUrl.endsWith('.git');

  if (gitUrlMatch) {
    projectName = 'Cloned Repository';
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    // Fix #4: Use os.tmpdir() so we never pollute the user's working directory
    tempPath = path.join(os.tmpdir(), `.repo-analyzer-temp-${randomSuffix}`);
    isTemp = true;
    scanPath = tempPath;

    const githubInfo = parseGithubUrl(targetPathOrUrl);
    if (githubInfo) {
      projectName = `${githubInfo.owner}/${githubInfo.repo}`;
    }

    await cloneRepository(targetPathOrUrl, tempPath);
  } else {
    const resolvedPath = path.resolve(targetPathOrUrl);
    if (!(await dirExists(resolvedPath))) {
      throw new Error(`Target directory does not exist: ${resolvedPath}`);
    }
    scanPath = resolvedPath;
    projectName = path.basename(resolvedPath);
    repoPathOrUrl = resolvedPath;
  }

  try {
    // Fix #9: Run all analyzers concurrently — they are fully independent I/O operations
    const [health, documentation, security, maintainability, performance] = await Promise.all([
      analyzeHealth(scanPath),
      analyzeDocumentation(scanPath),
      analyzeSecurity(scanPath),
      analyzeMaintainability(scanPath),
      analyzePerformance(scanPath),
    ]);

    const githubInfo = parseGithubUrl(targetPathOrUrl);
    if (githubInfo) {
      const metadata = await fetchGithubMetadata(githubInfo.owner, githubInfo.repo, githubToken);
      if (metadata) {
        projectName = `${githubInfo.owner}/${githubInfo.repo} (${metadata.stars}★)`;
      }
    }

    const overallScore = Math.round(
      (health.score + security.score + documentation.score + maintainability.score) / 4
    );

    return {
      projectName,
      repoPathOrUrl,
      scannedAt: new Date().toISOString(),
      health,
      documentation,
      security,
      maintainability,
      performance,
      overallScore
    };
  } finally {
    if (isTemp && tempPath) {
      await cleanupDirectory(tempPath);
    }
  }
}
