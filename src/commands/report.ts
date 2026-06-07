import * as path from 'path';
import * as fs from 'fs/promises';
import pc from 'picocolors';
import { runAnalysis } from '../utils/orchestrator.js';
import { generateHtmlReport } from '../utils/html.js';
import { scanCommand } from './scan.js';

export async function reportCommand(
  targetPathOrUrl: string,
  options: { format?: string; output?: string; token?: string }
): Promise<void> {
  const format = options.format || 'html';
  const defaultFilename = format === 'markdown' ? 'report.md' : 'report.html';
  const outputFile = options.output ? path.resolve(options.output) : path.resolve(defaultFilename);

  if (format === 'markdown') {
    await scanCommand(targetPathOrUrl, {
      format: 'markdown',
      output: outputFile,
      token: options.token
    });
    return;
  }

  console.log(pc.cyan(`\n📊 Generating detailed HTML report for: "${targetPathOrUrl}"...`));

  try {
    const report = await runAnalysis(targetPathOrUrl, options.token);
    const htmlContent = generateHtmlReport(report);
    
    await fs.writeFile(outputFile, htmlContent, 'utf-8');
    
    console.log(pc.green(`\n🏆 HTML Report successfully generated at:`));
    console.log(pc.bold(pc.yellow(`  ${outputFile}`)));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(pc.red(`\n❌ Error generating HTML report: ${msg}`));
    process.exit(1);
  }
}
