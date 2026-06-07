import * as path from 'path';
import * as fs from 'fs/promises';
import pc from 'picocolors';
import { fileExists, dirExists, findAnyFile } from '../utils/helpers.js';
import {
  SECURITY_TEMPLATE,
  CONTRIBUTING_TEMPLATE,
  BUG_REPORT_TEMPLATE,
  FEATURE_REQUEST_TEMPLATE,
  PR_TEMPLATE
} from '../utils/template.js';

export async function fixCommand(
  targetPath: string,
  options: {
    all?: boolean;
    security?: boolean;
    contributing?: boolean;
    issueTemplates?: boolean;
    prTemplate?: boolean;
  }
): Promise<void> {
  const resolvedPath = path.resolve(targetPath);
  
  if (!(await dirExists(resolvedPath))) {
    console.error(pc.red(`❌ Target directory does not exist: ${resolvedPath}`));
    process.exit(1);
  }

  const fixAll = options.all || (!options.security && !options.contributing && !options.issueTemplates && !options.prTemplate);
  const fixSecurity = fixAll || options.security;
  const fixContributing = fixAll || options.contributing;
  const fixIssueTemplates = fixAll || options.issueTemplates;
  const fixPrTemplate = fixAll || options.prTemplate;

  console.log(pc.cyan(`\n🔧 Applying auto-fixes to: "${resolvedPath}"...`));

  try {
    if (fixSecurity) {
      const securityFile = await findAnyFile(resolvedPath, ['SECURITY.md', 'SECURITY', 'SECURITY.txt']);
      if (!securityFile) {
        const targetFile = path.join(resolvedPath, 'SECURITY.md');
        await fs.writeFile(targetFile, SECURITY_TEMPLATE, 'utf-8');
        console.log(pc.green(`  ✓ Created SECURITY.md`));
      } else {
        console.log(pc.gray(`  - SECURITY.md already exists`));
      }
    }

    if (fixContributing) {
      const contributingFile = await findAnyFile(resolvedPath, ['CONTRIBUTING.md', 'CONTRIBUTING', 'CONTRIBUTING.txt']);
      if (!contributingFile) {
        const targetFile = path.join(resolvedPath, 'CONTRIBUTING.md');
        await fs.writeFile(targetFile, CONTRIBUTING_TEMPLATE, 'utf-8');
        console.log(pc.green(`  ✓ Created CONTRIBUTING.md`));
      } else {
        console.log(pc.gray(`  - CONTRIBUTING.md already exists`));
      }
    }

    if (fixIssueTemplates) {
      const githubDir = path.join(resolvedPath, '.github');
      const templatesDir = path.join(githubDir, 'ISSUE_TEMPLATE');
      
      await fs.mkdir(templatesDir, { recursive: true });
      
      const bugFile = path.join(templatesDir, 'bug_report.md');
      if (!(await fileExists(bugFile))) {
        await fs.writeFile(bugFile, BUG_REPORT_TEMPLATE, 'utf-8');
        console.log(pc.green(`  ✓ Created .github/ISSUE_TEMPLATE/bug_report.md`));
      } else {
        console.log(pc.gray(`  - .github/ISSUE_TEMPLATE/bug_report.md already exists`));
      }

      const featureFile = path.join(templatesDir, 'feature_request.md');
      if (!(await fileExists(featureFile))) {
        await fs.writeFile(featureFile, FEATURE_REQUEST_TEMPLATE, 'utf-8');
        console.log(pc.green(`  ✓ Created .github/ISSUE_TEMPLATE/feature_request.md`));
      } else {
        console.log(pc.gray(`  - .github/ISSUE_TEMPLATE/feature_request.md already exists`));
      }
    }

    if (fixPrTemplate) {
      const githubDir = path.join(resolvedPath, '.github');
      const prFile = path.join(githubDir, 'pull_request_template.md');
      
      await fs.mkdir(githubDir, { recursive: true });
      
      if (!(await fileExists(prFile))) {
        await fs.writeFile(prFile, PR_TEMPLATE, 'utf-8');
        console.log(pc.green(`  ✓ Created .github/pull_request_template.md`));
      } else {
        console.log(pc.gray(`  - .github/pull_request_template.md already exists`));
      }
    }

    console.log(pc.bold(pc.green(`\n🎉 Auto-fix updates applied successfully!`)));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(pc.red(`\n❌ Error applying fixes: ${msg}`));
    process.exit(1);
  }
}
