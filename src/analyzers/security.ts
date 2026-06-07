import * as path from 'path';
import * as fs from 'fs/promises';
import { SecurityResult, SecretLeak } from '../types.js';
import { dirExists, findAnyFile, scanDirRecursive } from '../utils/helpers.js';

const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  {
    name: 'AWS Access Key ID',
    pattern: /\bAKIA[0-9A-Z]{16}\b/
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN (?:RSA|OPENSSH|DSA|EC|PGP)? PRIVATE KEY-----/
  },
  {
    name: 'GitHub Personal Access Token',
    pattern: /\bghp_[a-zA-Z0-9]{36}\b|\bgithub_pat_[a-zA-Z0-9_]{82}\b/
  },
  {
    name: 'Slack Incoming Webhook URL',
    pattern: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8}\/B[a-zA-Z0-9_]{8}\/[a-zA-Z0-9_]{24}/
  },
  {
    name: 'Generic Database Connection String',
    pattern: /(mongodb(?:\+srv)?|postgres|postgresql|mysql):\/\/[a-zA-Z0-9_.-]+:[a-zA-Z0-9_.-]+@/
  },
  {
    // Fix #6: Anchored to assignment context only — not loose keyword mentions
    name: 'Hardcoded API Key / Secret',
    pattern: /^(?![\s]*#).*(?:api_key|apikey|secret_key|secretkey|db_password|dbpassword)\s*[:=]\s*["'][a-zA-Z0-9_\-]{20,}["']/im
  }
];

const TEXT_EXTENSIONS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.rb', '.php',
  '.json', '.yml', '.yaml', '.env', '.md', '.txt',
  '.java', '.cpp', '.c', '.h', '.cs', '.sh', '.bat', '.ps1', '.cfg', '.conf'
]);

// Fix #6: Files that should never be scanned for secrets (templates, examples)
const SKIP_FILENAMES = new Set([
  '.env.example', '.env.sample', '.env.template', '.env.test',
  'env.example', 'env.sample',
]);

function isInsideMarkdownCodeBlock(lines: string[], lineIndex: number): boolean {
  let insideBlock = false;
  for (let i = 0; i <= lineIndex; i++) {
    if (lines[i].trimStart().startsWith('```') || lines[i].trimStart().startsWith('~~~')) {
      insideBlock = !insideBlock;
    }
  }
  return insideBlock;
}

export async function analyzeSecurity(dir: string): Promise<SecurityResult> {
  // 1. SECURITY.md check
  const hasSecurityPolicy =
    (await findAnyFile(dir, ['SECURITY.md', 'SECURITY', 'SECURITY.txt'])) !== null ||
    (await dirExists(path.join(dir, '.github')) && (await findAnyFile(path.join(dir, '.github'), ['SECURITY.md', 'SECURITY'])) !== null);

  // 2. Dependabot check
  let hasDependabot = false;
  const githubDir = path.join(dir, '.github');
  if (await dirExists(githubDir)) {
    hasDependabot = (await findAnyFile(githubDir, ['dependabot.yml', 'dependabot.yaml'])) !== null;
  }

  // 3. Lockfile check
  const hasLockfile = (await findAnyFile(dir, [
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
    'cargo.lock', 'Gemfile.lock', 'poetry.lock', 'go.sum', 'composer.lock'
  ])) !== null;

  // 4. Secret scan
  const detectedSecrets: SecretLeak[] = [];

  const filesToScan = await scanDirRecursive(dir, (name, isDir) => {
    if (isDir) return true;
    const basename = path.basename(name).toLowerCase();
    // Fix #6: Skip example/template env files — they intentionally contain placeholder values
    if (SKIP_FILENAMES.has(basename)) return false;
    const ext = path.extname(name).toLowerCase();
    return TEXT_EXTENSIONS.has(ext) || basename === '.env';
  });

  for (const filePath of filesToScan) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > 1024 * 1024) continue; // Skip files larger than 1MB

      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split(/\r?\n/);
      const relativePath = path.relative(dir, filePath);
      const isMarkdown = relativePath.endsWith('.md');

      for (let i = 0; i < lines.length; i++) {
        const lineContent = lines[i];

        // Fix #6: Skip comment-only lines
        const trimmed = lineContent.trimStart();
        if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('*')) {
          continue;
        }

        // Fix #6: Skip lines inside markdown code blocks (example snippets)
        if (isMarkdown && isInsideMarkdownCodeBlock(lines, i)) {
          continue;
        }

        for (const patternObj of SECRET_PATTERNS) {
          if (patternObj.pattern.test(lineContent)) {
            const alreadyFound = detectedSecrets.some(
              s => s.file === relativePath && s.line === i + 1
            );
            if (!alreadyFound) {
              detectedSecrets.push({
                file: relativePath,
                line: i + 1,
                type: patternObj.name,
                snippet: lineContent.trim().substring(0, 100)
              });
            }
          }
        }
      }
    } catch {
      // Ignore read errors (permission denied, binary files, etc.)
    }
  }

  // Scoring
  let score = 0;
  if (hasSecurityPolicy) score += 20;
  if (hasDependabot) score += 20;
  if (hasLockfile) score += 20;

  const secretDeduction = Math.min(detectedSecrets.length * 10, 40);
  score += (40 - secretDeduction);

  return {
    score,
    hasSecurityPolicy,
    hasDependabot,
    hasLockfile,
    detectedSecrets
  };
}
