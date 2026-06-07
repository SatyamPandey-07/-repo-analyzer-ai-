export interface HealthResult {
  score: number;
  hasReadme: boolean;
  hasLicense: boolean;
  hasContributing: boolean;
  hasSecurity: boolean;
  hasGitignore: boolean;
  hasGithubActions: boolean;
  hasIssueTemplates: boolean;
  hasPrTemplate: boolean;
  isGitRepo: boolean;
}

export interface DocResult {
  score: number;
  hasReadme: boolean;
  readmeLength: number;
  hasInstallationGuide: boolean;
  hasUsageGuide: boolean;
  hasContributing: boolean;
  hasApiDocs: boolean;
  hasScreenshots: boolean;
}

export interface SecretLeak {
  file: string;
  line: number;
  type: string;
  snippet: string;
}

export interface SecurityResult {
  score: number;
  hasSecurityPolicy: boolean;
  hasDependabot: boolean;
  hasLockfile: boolean;
  detectedSecrets: SecretLeak[];
}

export interface MaintainabilityResult {
  score: number;
  hasTests: boolean;
  hasLinter: boolean;
  commitCount30Days: number;
  hasPrTemplate: boolean;
  hasIssueTemplates: boolean;
  packageScripts: string[];
}

export interface PerformanceSuggestion {
  type: 'warning' | 'info';
  message: string;
  file?: string;
}

export interface LargeFile {
  path: string;
  size: number;
}

export interface PerformanceResult {
  suggestions: PerformanceSuggestion[];
  largeFiles: LargeFile[];
  unoptimizedImages: LargeFile[];
}

export interface AnalysisReport {
  projectName: string;
  repoPathOrUrl: string;
  scannedAt: string;
  health: HealthResult;
  documentation: DocResult;
  security: SecurityResult;
  maintainability: MaintainabilityResult;
  performance: PerformanceResult;
  overallScore: number;
}
