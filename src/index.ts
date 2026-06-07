import { Command } from 'commander';
import { scanCommand } from './commands/scan.js';
import { fixCommand } from './commands/fix.js';
import { badgeCommand } from './commands/badge.js';
import { reportCommand } from './commands/report.js';
import dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
  .name('repo-analyzer-ai')
  .description('Analyze any GitHub repository and get actionable improvements in seconds.')
  .version('0.1.0')
  // Fix #5: No root action — unknown args fall through to help automatically.
  // Commander will display help when no subcommand is provided.
  .addHelpCommand(true);

program
  .command('scan', { isDefault: true })
  .description('Scan a repository for health, docs, security, and maintainability (default command)')
  .argument('[path]', 'Local path or Git URL of target repository', '.')
  .option('--format <type>', 'Output format: text, json, markdown', 'text')
  .option('-o, --output <file>', 'Save scan output to file')
  .option('--token <token>', 'GitHub API token (or set GITHUB_TOKEN env var)')
  .option('--fix', 'After scanning, automatically apply fixes for missing files')
  .action(async (targetPath, options) => {
    if (options.fix) {
      await fixCommand(targetPath, { all: true });
    } else {
      await scanCommand(targetPath, options);
    }
  });

program
  .command('fix')
  .description('Automatically apply fixes (creates missing markdown files and templates)')
  .argument('[path]', 'Path of target repository', '.')
  .option('--all', 'Fix all missing files and templates (default behaviour)')
  .option('--security', 'Create missing SECURITY.md policy file')
  .option('--contributing', 'Create missing CONTRIBUTING.md guidelines')
  .option('--issue-templates', 'Create missing Issue Templates')
  .option('--pr-template', 'Create missing PR checklist template')
  .action(async (targetPath, options) => {
    await fixCommand(targetPath, options);
  });

program
  .command('badge')
  .description('Generate health, security, and docs SVG badges')
  .argument('[path]', 'Local path or Git URL of target repository', '.')
  .option('-o, --output-dir <dir>', 'Directory to write badges to (default: current directory)')
  .option('--format <type>', 'Integration snippet format: markdown, html', 'markdown')
  .option('--token <token>', 'GitHub API token (or set GITHUB_TOKEN env var)')
  .action(async (targetPath, options) => {
    await badgeCommand(targetPath, options);
  });

program
  .command('report')
  .description('Generate a detailed HTML or Markdown dashboard report')
  .argument('[path]', 'Local path or Git URL of target repository', '.')
  .option('-f, --format <type>', 'Output report format: html, markdown', 'html')
  .option('-o, --output <file>', 'File path to save the report to')
  .option('--token <token>', 'GitHub API token (or set GITHUB_TOKEN env var)')
  .action(async (targetPath, options) => {
    await reportCommand(targetPath, options);
  });

program.parse(process.argv);
