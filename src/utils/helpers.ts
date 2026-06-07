import * as fs from 'fs/promises';
import * as path from 'path';

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function findFileCaseInsensitive(dir: string, filename: string): Promise<string | null> {
  try {
    const files = await fs.readdir(dir);
    const lowerFilename = filename.toLowerCase();
    const match = files.find(f => f.toLowerCase() === lowerFilename);
    return match ? path.join(dir, match) : null;
  } catch {
    return null;
  }
}

export async function findAnyFile(dir: string, possibleNames: string[]): Promise<string | null> {
  try {
    const files = await fs.readdir(dir);
    for (const name of possibleNames) {
      const lowerName = name.toLowerCase();
      const match = files.find(f => f.toLowerCase() === lowerName);
      if (match) return path.join(dir, match);
    }
  } catch {
    // Ignore
  }
  return null;
}

export async function scanDirRecursive(
  dir: string,
  filter: (fileName: string, isDir: boolean) => boolean,
  maxDepth = 5,
  currentDepth = 0
): Promise<string[]> {
  if (currentDepth > maxDepth) return [];
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Ignore dependencies, build artifacts, system directories and temp clone dirs
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name.startsWith('.repo-analyzer-temp') ||  // Fix #8: was exact match, missed suffixed dirs
        entry.name === '.gemini'
      ) {
        continue;
      }
      
      const isDir = entry.isDirectory();
      if (!isDir && filter(entry.name, false)) {
        results.push(fullPath);
      }
      
      if (isDir) {
        if (filter(entry.name, true)) {
          results.push(fullPath);
        }
        const subResults = await scanDirRecursive(fullPath, filter, maxDepth, currentDepth + 1);
        results.push(...subResults);
      }
    }
  } catch {
    // Ignore error
  }
  return results;
}
