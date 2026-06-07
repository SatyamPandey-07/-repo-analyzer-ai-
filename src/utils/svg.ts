import * as path from 'path';
import * as fs from 'fs/promises';

export function getHealthColor(score: number): string {
  if (score >= 80) return '#4c1';
  if (score >= 50) return '#dfb317';
  return '#e05d44';
}

export function getGradeAndColor(score: number): { grade: string; color: string } {
  if (score >= 95) return { grade: 'A+', color: '#4c1' };
  if (score >= 85) return { grade: 'A', color: '#97ca00' };
  if (score >= 75) return { grade: 'B+', color: '#a4a61d' };
  if (score >= 60) return { grade: 'B', color: '#dfb317' };
  if (score >= 45) return { grade: 'C', color: '#fe7d37' };
  if (score >= 30) return { grade: 'D', color: '#e05d44' };
  return { grade: 'F', color: '#9b1c1c' };
}

export function generateBadgeSvg(label: string, value: string, color: string): string {
  const charWidth = 7;
  const leftPadding = 12;
  const rightPadding = 12;
  
  const leftWidth = Math.ceil(label.length * charWidth + leftPadding);
  const rightWidth = Math.ceil(value.length * charWidth + rightPadding);
  const totalWidth = leftWidth + rightWidth;
  
  const labelX = Math.ceil((leftWidth / 2) * 10);
  const valueX = Math.ceil((leftWidth + rightWidth / 2) * 10);
  
  const labelLength = label.length * 70;
  const valueLength = value.length * 70;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#555"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${labelX}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${labelLength}">${label}</text>
    <text x="${labelX}" y="140" transform="scale(.1)" fill="#fff" textLength="${labelLength}">${label}</text>
    <text aria-hidden="true" x="${valueX}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${valueLength}">${value}</text>
    <text x="${valueX}" y="140" transform="scale(.1)" fill="#fff" textLength="${valueLength}">${value}</text>
  </g>
</svg>`;
}

export async function writeBadgeFiles(
  outputDir: string,
  healthScore: number,
  securityScore: number,
  docScore: number
): Promise<{ healthFile: string; securityFile: string; docsFile: string }> {
  await fs.mkdir(outputDir, { recursive: true });
  
  const healthSvg = generateBadgeSvg('Project Health', `${healthScore}/100`, getHealthColor(healthScore));
  const securityInfo = getGradeAndColor(securityScore);
  const securitySvg = generateBadgeSvg('Security', securityInfo.grade, securityInfo.color);
  const docInfo = getGradeAndColor(docScore);
  const docsSvg = generateBadgeSvg('Docs', docInfo.grade, docInfo.color);
  
  const healthFile = path.join(outputDir, 'health.svg');
  const securityFile = path.join(outputDir, 'security.svg');
  const docsFile = path.join(outputDir, 'docs.svg');
  
  await fs.writeFile(healthFile, healthSvg, 'utf-8');
  await fs.writeFile(securityFile, securitySvg, 'utf-8');
  await fs.writeFile(docsFile, docsSvg, 'utf-8');
  
  return { healthFile, securityFile, docsFile };
}
