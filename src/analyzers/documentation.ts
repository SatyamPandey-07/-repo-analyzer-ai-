import * as path from 'path';
import * as fs from 'fs/promises';
import { DocResult } from '../types.js';
import { findAnyFile, dirExists } from '../utils/helpers.js';

export async function analyzeDocumentation(dir: string): Promise<DocResult> {
  const readmePath = await findAnyFile(dir, ['README.md', 'README.txt', 'README']);
  const hasReadme = readmePath !== null;
  
  let readmeLength = 0;
  let hasInstallationGuide = false;
  let hasUsageGuide = false;
  let hasScreenshots = false;
  
  if (readmePath) {
    try {
      const content = await fs.readFile(readmePath, 'utf-8');
      readmeLength = content.length;
      
      const lowerContent = content.toLowerCase();
      
      // Installation instructions check
      const installRegex = /(installation|install|setup|getting started|how to run|prerequisites)/i;
      const installCommandRegex = /(npm install|npm i|yarn add|pnpm add|cargo add|go get|pip install|gem install)/i;
      hasInstallationGuide = installRegex.test(lowerContent) || installCommandRegex.test(lowerContent);
      
      // Usage instructions check
      const usageRegex = /(usage|example|how to use|running|quick start|getting started)/i;
      hasUsageGuide = usageRegex.test(lowerContent);
      
      // Screenshots/images check: ![alt](url) or <img src="..." />
      const imgRegex = /(!\[.*?\]\(.*?\))|(<img\s+[^>]*src=["'].*?["'][^>]*>)/i;
      hasScreenshots = imgRegex.test(content);
    } catch {
      // Ignore read errors
    }
  }
  
  // API docs check
  const hasApiDocs = 
    (await findAnyFile(dir, ['API.md', 'docs.md', 'DOCUMENTATION.md'])) !== null ||
    (await dirExists(path.join(dir, 'docs'))) ||
    (await dirExists(path.join(dir, 'doc')));
    
  // CONTRIBUTING check
  const hasContributing = 
    (await findAnyFile(dir, ['CONTRIBUTING.md', 'CONTRIBUTING', 'CONTRIBUTING.txt'])) !== null ||
    (await dirExists(path.join(dir, '.github')) && (await findAnyFile(path.join(dir, '.github'), ['CONTRIBUTING.md', 'CONTRIBUTING'])) !== null);

  // Scoring
  let score = 0;
  if (hasReadme) score += 20;
  if (readmeLength > 500) score += 20;
  if (hasInstallationGuide) score += 20;
  if (hasUsageGuide) score += 20;
  if (hasApiDocs) score += 10;
  if (hasScreenshots) score += 10;

  return {
    score,
    hasReadme,
    readmeLength,
    hasInstallationGuide,
    hasUsageGuide,
    hasContributing,
    hasApiDocs,
    hasScreenshots,
  };
}
