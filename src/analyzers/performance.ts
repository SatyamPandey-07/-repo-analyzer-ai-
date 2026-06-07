import * as path from 'path';
import * as fs from 'fs/promises';
import { PerformanceResult, LargeFile, PerformanceSuggestion } from '../types.js';
import { scanDirRecursive } from '../utils/helpers.js';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.tiff']);
const CODE_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php']);

export async function analyzePerformance(dir: string): Promise<PerformanceResult> {
  const suggestions: PerformanceSuggestion[] = [];
  const largeFiles: LargeFile[] = [];
  const unoptimizedImages: LargeFile[] = [];
  
  const allFiles = await scanDirRecursive(dir, (name, isDir) => {
    return true;
  });
  
  let hasBundler = false;
  let packageJsonFound = false;

  for (const filePath of allFiles) {
    try {
      const stats = await fs.stat(filePath);
      const relativePath = path.relative(dir, filePath);
      const ext = path.extname(filePath).toLowerCase();
      const filename = path.basename(filePath).toLowerCase();
      
      if (filename === 'package.json') {
        packageJsonFound = true;
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const pkg = JSON.parse(content);
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          hasBundler = ['webpack', 'esbuild', 'rollup', 'vite', 'tsup', 'parcel', 'next'].some(b => b in deps);
        } catch {
          // Ignore parse error
        }
      }

      // 1. Unoptimized images (> 1MB)
      if (IMAGE_EXTENSIONS.has(ext)) {
        if (stats.size > 1024 * 1024) {
          unoptimizedImages.push({
            path: relativePath,
            size: stats.size
          });
          suggestions.push({
            type: 'warning',
            message: `Large image found: "${relativePath}" (${(stats.size / 1024 / 1024).toFixed(2)} MB). Consider compressing it or converting it to a modern format like WebP or AVIF.`,
            file: relativePath
          });
        } else if (ext !== '.svg') {
          suggestions.push({
            type: 'info',
            message: `Consider converting "${relativePath}" to WebP format for better web performance.`,
            file: relativePath
          });
        }
      }

      // 2. Large source code files (> 1MB)
      if (CODE_EXTENSIONS.has(ext) && stats.size > 1024 * 1024) {
        largeFiles.push({
          path: relativePath,
          size: stats.size
        });
        suggestions.push({
          type: 'warning',
          message: `Oversized source file detected: "${relativePath}" (${(stats.size / 1024 / 1024).toFixed(2)} MB). Consider splitting this module into smaller files or lazy-loading its components.`,
          file: relativePath
        });
      }
    } catch {
      // Ignore errors (e.g. permission or file removed)
    }
  }

  // 3. Production bundling recommendations
  if (packageJsonFound && !hasBundler) {
    suggestions.push({
      type: 'warning',
      message: 'No bundler (like esbuild, vite, or webpack) detected in package.json. For production performance, it is recommended to bundle, tree-shake, and minify your code.'
    });
  }

  return {
    suggestions,
    largeFiles,
    unoptimizedImages
  };
}
