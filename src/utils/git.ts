import simpleGit from 'simple-git';
import * as fs from 'fs/promises';

export async function isGitRepository(dir: string): Promise<boolean> {
  try {
    const git = simpleGit(dir);
    return await git.checkIsRepo();
  } catch (error) {
    return false;
  }
}

export async function getCommitCount30Days(dir: string): Promise<number> {
  try {
    const git = simpleGit(dir);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // Format date in YYYY-MM-DD format as expected by git's --since flag
    const sinceDate = thirtyDaysAgo.toISOString().split('T')[0];
    const logs = await git.log([`--since=${sinceDate}`]);
    return logs.all.length;
  } catch (error) {
    return 0;
  }
}

export async function cloneRepository(url: string, targetDir: string): Promise<void> {
  await fs.mkdir(targetDir, { recursive: true });
  const git = simpleGit();
  await git.clone(url, targetDir, ['--depth', '1']); // Shallow clone for performance
}

export async function cleanupDirectory(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    // Ignore error
  }
}
