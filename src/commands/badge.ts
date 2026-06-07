import * as path from 'path';
import pc from 'picocolors';
import { runAnalysis } from '../utils/orchestrator.js';
import { writeBadgeFiles, getGradeAndColor } from '../utils/svg.js';

export async function badgeCommand(
  targetPathOrUrl: string,
  options: { outputDir?: string; format?: string; token?: string }
): Promise<void> {
  const outputDir = options.outputDir ? path.resolve(options.outputDir) : process.cwd();
  const format = options.format || 'markdown';

  console.log(pc.cyan(`\n🏷️ Generating health, security, and documentation badges...`));

  try {
    const report = await runAnalysis(targetPathOrUrl, options.token);
    
    const { healthFile, securityFile, docsFile } = await writeBadgeFiles(
      outputDir,
      report.health.score,
      report.security.score,
      report.documentation.score
    );

    console.log(pc.green(`\n📂 SVG Badges generated in: ${outputDir}`));
    console.log(pc.gray(`  - ${path.basename(healthFile)}`));
    console.log(pc.gray(`  - ${path.basename(securityFile)}`));
    console.log(pc.gray(`  - ${path.basename(docsFile)}`));

    console.log(pc.cyan(`\n💬 Integration Snippet (${format.toUpperCase()}):`));

    const relHealth = path.relative(process.cwd(), healthFile).replace(/\\/g, '/');
    const relSecurity = path.relative(process.cwd(), securityFile).replace(/\\/g, '/');
    const relDocs = path.relative(process.cwd(), docsFile).replace(/\\/g, '/');

    if (format === 'html') {
      console.log(pc.yellow(`
<img src="${relHealth}" alt="Project Health: ${report.health.score}/100" />
<img src="${relSecurity}" alt="Security Grade: ${getGradeAndColor(report.security.score).grade}" />
<img src="${relDocs}" alt="Docs Grade: ${getGradeAndColor(report.documentation.score).grade}" />
      `));
    } else {
      console.log(pc.yellow(`
![Project Health](${relHealth})
![Security](${relSecurity})
![Docs](${relDocs})
      `));
    }

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(pc.red(`\n❌ Error generating badges: ${msg}`));
    process.exit(1);
  }
}
