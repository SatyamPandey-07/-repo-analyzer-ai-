import { Octokit } from 'octokit';

export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const cleanUrl = url.trim().replace(/\.git$/, '');
    if (cleanUrl.startsWith('git@github.com:')) {
      const parts = cleanUrl.slice('git@github.com:'.length).split('/');
      if (parts.length === 2) {
        return { owner: parts[0], repo: parts[1] };
      }
    } else {
      // Handle https:// or other protocols
      const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
      if (parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') {
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          return { owner: parts[0], repo: parts[1] };
        }
      }
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

export interface GithubMetadata {
  stars: number;
  forks: number;
  openIssues: number;
  description: string;
  hasWiki: boolean;
  releasesCount: number;
}

export async function fetchGithubMetadata(
  owner: string,
  repo: string,
  token?: string
): Promise<GithubMetadata | null> {
  const finalToken = token || process.env.GITHUB_TOKEN;
  // Initialize Octokit. If no token, we can still try to do unauthenticated requests (subject to lower rate limits)
  const octokit = finalToken ? new Octokit({ auth: finalToken }) : new Octokit();
  
  try {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    
    let releasesCount = 0;
    try {
      const releases = await octokit.rest.repos.listReleases({
        owner,
        repo,
        per_page: 10,
      });
      releasesCount = releases.data.length;
    } catch {
      // Ignore releases fetch failures
    }
    
    return {
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      openIssues: data.open_issues_count ?? 0,
      description: data.description || '',
      hasWiki: data.has_wiki ?? false,
      releasesCount,
    };
  } catch (error) {
    // Return null if fails due to rate limit, network, or invalid token
    return null;
  }
}
