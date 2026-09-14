export interface AppConfig {
  logoUrl: string;
  logoType: "preset" | "url" | "upload";
  logoPreset: string;
  logoScale: number;
  logoSize?: number;
  loginLogoSize?: number;
  navbarLogoSize?: number;
  logoBorderRadius?: "none" | "md" | "xl" | "3xl" | "full";
  logoFit?: "contain" | "cover" | "fill" | "none";
  logoOffsetX?: number;
  logoOffsetY?: number;
  logoRotate?: number;
  appTitle: string;
  appSubtitle: string;
  permanentFooterText?: string;
  loginLogoUrl?: string;
  loginLogoType?: "default" | "url" | "upload";
  logoShadowEffect?: "none" | "soft" | "medium" | "glow";
  logoPermanentTimestamp?: string;
  customTexts: Record<string, string>;
  qwenModel: string;
  qwenApiKey?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  codeSnippet?: string;
  modelUsed?: string;
}

export interface PromptUndoSnapshot {
  id: string;
  code: string;
  messages: ChatMessage[];
  prompt: string;
  timestamp: number;
}

export interface LayoutEditorState {
  logoPosition: "left" | "center" | "right" | "float-left" | "float-right";
  logoSize: "sm" | "md" | "lg" | "xl";
  headerAlign: "left" | "center" | "between" | "right";
  headerStyle: "glass" | "solid" | "transparent" | "bordered" | "gradient";
  headerPadding: "compact" | "normal" | "spacious";
}

export interface GenerationProgress {
  isGenerating: boolean;
  percentage: number;
  statusMessage: string;
  mode: "prompt" | "autofix" | "manual";
}

export interface PreviewError {
  hasError: boolean;
  message: string;
  stack?: string;
  line?: number;
  col?: number;
}

export interface GitHubExportConfig {
  token: string;
  repoName: string;
  branch: string;
  isPrivate: boolean;
  commitMessage: string;
}

export type DatabaseProvider =
  | "supabase"
  | "firebase"
  | "appwrite"
  | "neon"
  | "pocketbase"
  | "sqlite"
  | "postgres"
  | "mongodb"
  | "mysql"
  | "custom";

export interface DatabaseConfig {
  provider: DatabaseProvider;
  tokenOrKey: string;
  urlOrHost?: string;
  databaseName?: string;
  projectId?: string;
  apiKey?: string;
  authDomain?: string;
  enabled: boolean;
}

export interface DatabaseCredentials {
  // Supabase
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;

  // Firebase
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
  firebaseConfigJson?: string;

  // Appwrite
  appwriteEndpoint?: string;
  appwriteProjectId?: string;
  appwriteApiKey?: string;
  appwriteDatabaseId?: string;

  // Neon Tech
  neonConnectionString?: string;
  neonDatabaseName?: string;

  // PocketBase
  pocketBaseUrl?: string;
  pocketBaseAdminEmail?: string;
  pocketBaseAdminPassword?: string;

  // Local SQLite
  sqliteFileName?: string;
  sqliteJournalMode?: string;
}

export interface GeneratedConfigFiles {
  env: string;
  configJs: string;
  schemaSql: string;
}

export interface DatabaseSetupPreference {
  provider: DatabaseProvider;
  credentials: DatabaseCredentials;
  generatedFiles: GeneratedConfigFiles;
  isConnected: boolean;
  lastTestedAt?: string;
  latencyMs?: number;
}

export type DeploymentEngine = "vercel" | "cloudflare";
export type DeploymentStatus = "building" | "live" | "failed" | "cancelled";

export interface CustomDomainMapping {
  domain: string;
  cnameTarget: string;
  status: "active" | "pending" | "error";
  sslStatus: "active" | "provisioning" | "pending";
  addedAt: string;
  verifiedAt?: string;
  dnsDetails?: {
    type: "CNAME" | "A";
    name: string;
    value: string;
    proxied?: boolean;
  };
}

export interface DeploymentRecord {
  id: string;
  projectName: string;
  slug: string;
  subdomain: string; // e.g. kas-mt.ghighais.com
  liveUrl: string; // https://kas-mt.ghighais.com
  fallbackUrl?: string; // e.g. https://kas-mt.vercel.app or pages.dev
  status: DeploymentStatus;
  engine: DeploymentEngine;
  engineDeploymentId?: string;
  githubRepo?: string;
  branch?: string;
  commitSha?: string;
  commitMessage?: string;
  customDomains: CustomDomainMapping[];
  createdAt: string;
  updatedAt: string;
  errorLog?: string;
  buildLogs: string[];
  envKeys: string[];
  codeSnapshot?: string;
}

export type DeployStep =
  | "idle"
  | "pushing_github"
  | "building_engine"
  | "assigning_domain"
  | "live"
  | "failed";

export interface DeployEngineSettings {
  isPremium: boolean;
  engine: DeploymentEngine;
  vercelToken?: string;
  cloudflareToken?: string;
  cloudflareAccountId?: string;
  subdomainBase: string; // "ghighais.com"
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: "email_otp" | "magic_link" | "captcha_verify" | "robot_verify";
  createdAt: string;
  lastLogin: string;
}

export interface AdminAuditLog {
  id: string;
  ip: string;
  userAgent: string;
  status: "success" | "failed" | "rate_limited";
  timestamp: string;
  attemptDetails?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
}
