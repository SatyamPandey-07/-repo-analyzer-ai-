import * as path from 'path';
import * as fs from 'fs/promises';
import pc from 'picocolors';
import { runAnalysis } from '../utils/orchestrator.js';
import { getGradeAndColor } from '../utils/svg.js';
import { AnalysisReport } from '../types.js';

export async function scanCommand(
  targetPathOrUrl: string,
  options: { format?: string; output?: string; token?: string }
): Promise<void> {
  const format = options.format || 'text';
  
  if (format === 'text') {
    console.log(pc.cyan(`\n🔍 Analyzing repository: "${targetPathOrUrl}"...`));
  }

  try {
    const report = await runAnalysis(targetPathOrUrl, options.token);

    let outputContent = '';

    if (format === 'json') {
      outputContent = JSON.stringify(report, null, 2);
    } else if (format === 'markdown') {
      outputContent = generateMarkdownReport(report);
    } else {
      outputContent = formatTextReport(report);
    }

    if (options.output) {
      const outputPath = path.resolve(options.output);
      await fs.writeFile(outputPath, outputContent, 'utf-8');
      console.log(pc.green(`\n💾 Scan report written to ${outputPath}`));
    } else {
      console.log(outputContent);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(pc.red(`\n❌ Error during analysis: ${msg}`));
    process.exit(1);
  }
}

function formatTextReport(report: AnalysisReport): string {
  const securityInfo = getGradeAndColor(report.security.score);
  const docInfo = getGradeAndColor(report.documentation.score);
  const maintainabilityInfo = getGradeAndColor(report.maintainability.score);
  
  const scoreColor = report.overallScore >= 80 ? pc.green : report.overallScore >= 50 ? pc.yellow : pc.red;
  
  let out = '\n';
  out += pc.bold(pc.underline(pc.magenta(`REPOSITORY SCAN REPORT: ${report.projectName}\n`)));
  out += `${pc.gray('Path/URL:')} ${report.repoPathOrUrl}\n`;
  out += `${pc.gray('Scanned At:')} ${new Date(report.scannedAt).toLocaleString()}\n`;
  out += pc.gray('='.repeat(50)) + '\n\n';
  
  out += `${pc.bold('OVERALL SCORE:')} ${scoreColor(`${report.overallScore}/100`)}\n\n`;
  
  out += `${pc.bold(pc.cyan('Category Scores:'))}\n`;
  out += `  - Health:          ${getScoreColored(report.health.score, false)}/100\n`;
  out += `  - Security:        ${getScoreColored(report.security.score, false)}/100 (${securityInfo.grade})\n`;
  out += `  - Documentation:   ${getScoreColored(report.documentation.score, false)}/100 (${docInfo.grade})\n`;
  out += `  - Maintainability: ${getScoreColored(report.maintainability.score, false)}/100 (${maintainabilityInfo.grade})\n\n`;

  out += `${pc.bold(pc.cyan('Health Checklist:'))}\n`;
  out += formatCheck('README.md Present', report.health.hasReadme);
  out += formatCheck('LICENSE Present', report.health.hasLicense);
  out += formatCheck('CONTRIBUTING.md Present', report.health.hasContributing);
  out += formatCheck('SECURITY.md Present', report.health.hasSecurity);
  out += formatCheck('Git Repository Active', report.health.isGitRepo);
  out += formatCheck('.gitignore Present', report.health.hasGitignore);
  out += formatCheck('GitHub Actions / CI Configured', report.health.hasGithubActions);
  out += formatCheck('Issue Templates Set', report.health.hasIssueTemplates);
  out += formatCheck('PR Template Set', report.health.hasPrTemplate);
  out += '\n';

  if (report.security.detectedSecrets.length > 0) {
    out += `${pc.bold(pc.red('Potential Secret Leaks:'))}\n`;
    report.security.detectedSecrets.forEach(s => {
      out += `  ${pc.red('✗')} [${s.type}] ${pc.yellow(`${s.file}:${s.line}`)}: ${pc.gray(s.snippet)}\n`;
    });
    out += '\n';
  } else {
    out += `${pc.bold(pc.green('✓ No secret leaks detected.'))}\n\n`;
  }

  if (report.performance.suggestions.length > 0) {
    out += `${pc.bold(pc.yellow('Performance Suggestions:'))}\n`;
    report.performance.suggestions.forEach(s => {
      const bullet = s.type === 'warning' ? pc.yellow('⚠') : pc.blue('ℹ');
      const fileContext = s.file ? ` (${s.file})` : '';
      out += `  ${bullet} ${s.message}${fileContext}\n`;
    });
    out += '\n';
  }

  return out;
}

function getScoreColored(score: number, bold = false): string {
  const colorFn = score >= 80 ? pc.green : score >= 50 ? pc.yellow : pc.red;
  return bold ? pc.bold(colorFn(score.toString())) : colorFn(score.toString());
}

function formatCheck(label: string, passed: boolean): string {
  return passed ? `  ${pc.green('✓')} ${label}\n` : `  ${pc.red('✗')} ${label}\n`;
}

function generateMarkdownReport(report: AnalysisReport): string {
  const securityInfo = getGradeAndColor(report.security.score);
  const docInfo = getGradeAndColor(report.documentation.score);
  const maintainabilityInfo = getGradeAndColor(report.maintainability.score);

  let md = `# Repository Health Report - ${report.projectName}\n\n`;
  md += `- **Repository Path/URL:** \`${report.repoPathOrUrl}\`\n`;
  md += `- **Scanned At:** ${new Date(report.scannedAt).toLocaleString()}\n`;
  md += `- **Overall Score:** **${report.overallScore}/100**\n\n`;

  md += `## Category Scores\n\n`;
  md += `| Category | Score | Grade |\n`;
  md += `| --- | --- | --- |\n`;
  md += `| Health | ${report.health.score}/100 | - |\n`;
  md += `| Security | ${report.security.score}/100 | ${securityInfo.grade} |\n`;
  md += `| Documentation | ${report.documentation.score}/100 | ${docInfo.grade} |\n`;
  md += `| Maintainability | ${report.maintainability.score}/100 | ${maintainabilityInfo.grade} |\n\n`;

  md += `## Health Checklist\n\n`;
  const addMdCheck = (lbl: string, val: boolean) => val ? `- [x] ${lbl}\n` : `- [ ] **Missing:** ${lbl}\n`;
  md += addMdCheck('README.md present', report.health.hasReadme);
  md += addMdCheck('LICENSE file present', report.health.hasLicense);
  md += addMdCheck('CONTRIBUTING.md file present', report.health.hasContributing);
  md += addMdCheck('SECURITY.md file present', report.health.hasSecurity);
  md += addMdCheck('Git repository', report.health.isGitRepo);
  md += addMdCheck('.gitignore file present', report.health.hasGitignore);
  md += addMdCheck('GitHub Actions / CI workflows present', report.health.hasGithubActions);
  md += addMdCheck('Issue templates configured', report.health.hasIssueTemplates);
  md += addMdCheck('PR template configured', report.health.hasPrTemplate);
  md += '\n';

  if (report.security.detectedSecrets.length > 0) {
    md += `## Potential Secret Leaks\n\n`;
    md += `| File | Line | Type | Snippet |\n`;
    md += `| --- | --- | --- | --- |\n`;
    report.security.detectedSecrets.forEach(s => {
      md += `| \`${s.file}\` | ${s.line} | **${s.type}** | \`${s.snippet}\` |\n`;
    });
    md += '\n';
  } else {
    md += `## Security Policy\n\n✓ No potential credentials or secrets found.\n\n`;
  }

  if (report.performance.suggestions.length > 0) {
    md += `## Performance Suggestions\n\n`;
    report.performance.suggestions.forEach(s => {
      const typeStr = s.type === 'warning' ? '⚠️ **WARNING**' : 'ℹ️ **INFO**';
      md += `- ${typeStr}: ${s.message}${s.file ? ` (\`${s.file}\`)` : ''}\n`;
    });
  }

  return md;
}
