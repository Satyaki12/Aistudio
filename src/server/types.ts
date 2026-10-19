export interface BuildConfig {
  url: string;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  primaryColor: string;
  statusBarColor: string;
  orientation: 'portrait' | 'landscape' | 'unspecified' | 'sensorPortrait';
  isFullScreen: boolean;
  enableJavaScript: boolean;
  allowFileAccess: boolean;
  enableDownloadManager: boolean;
  enableGeolocation: boolean;
  enableCamera: boolean;
  allowCleartext: boolean;
  enablePullToRefresh: boolean;
  customUserAgentSuffix: string;
  iconBase64?: string;
  splashColor: string;
  splashText: string;
  enableDeepLinks: boolean;
}

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  normalizedUrl?: string;
  domain?: string;
  suggestedAppName?: string;
  suggestedPackageName?: string;
  faviconUrl?: string;
  appleTouchIconUrl?: string;
  themeColor?: string;
  hasSsl: boolean;
  frameRestrictions?: {
    hasXFrameOptions: boolean;
    hasCsp: boolean;
    note: string;
  };
  pwaReady?: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
  isBinary?: boolean;
  binaryData?: Buffer;
}

export interface BuildResult {
  buildId: string;
  success: boolean;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  targetSdk: number;
  minSdk: number;
  hasApk: boolean;
  apkDownloadUrl?: string;
  zipDownloadUrl: string;
  files: { path: string; size: number }[];
  filePreviews: Record<string, string>;
  logs: string[];
  githubWorkflow: string;
  hasPwaPackage: boolean;
  pwaDownloadUrl: string;
  pwaSnippet: string;
  localBuildInstructions?: string;
  timestamp: string;
}
