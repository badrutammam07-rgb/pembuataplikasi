import React, { useState, useEffect } from "react";
import {
  DeploymentRecord,
  DeploymentEngine,
  DeployStep,
  AppConfig,
  DatabaseSetupPreference,
} from "../../types";
import { CustomDomainModal } from "./CustomDomainModal";
import { BuildLogsModal } from "./BuildLogsModal";
import { AiFixModal } from "./AiFixModal";
import {
  Server,
  Globe,
  Rocket,
  Plus,
  RefreshCw,
  ExternalLink,
  Github,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  ShieldCheck,
  Sparkles,
  Settings,
  Trash2,
  Copy,
  ChevronRight,
  ArrowLeft,
  KeyRound,
  Layers,
  Crown,
  Lock,
  Eye,
  EyeOff,
  CloudLightning,
} from "lucide-react";

interface DeployEngineDashboardProps {
  code: string;
  config: AppConfig;
  databasePreference?: DatabaseSetupPreference | null;
  onBackToStudio: () => void;
  onUpdateCode: (newCode: string) => void;
}

export const DeployEngineDashboard: React.FC<DeployEngineDashboardProps> = ({
  code,
  config,
  databasePreference,
  onBackToStudio,
  onUpdateCode,
}) => {
  // Navigation tabs inside Deploy Engine
  const [activeTab, setActiveTab] = useState<"deployments" | "publish" | "settings">("deployments");

  // Deployments state
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    try {
      return localStorage.getItem("ghighais_deploy_is_premium") === "true";
    } catch {
      return false;
    }
  });

  // Engine & API Tokens
  const [engine, setEngine] = useState<DeploymentEngine>("vercel");
  const [vercelToken, setVercelToken] = useState(() => localStorage.getItem("ghighais_vercel_token") || "");
  const [cloudflareToken, setCloudflareToken] = useState(() => localStorage.getItem("ghighais_cf_token") || "");
  const [cloudflareAccountId, setCloudflareAccountId] = useState(() => localStorage.getItem("ghighais_cf_account") || "");
  const [showTokens, setShowTokens] = useState(false);

  // Publish Form States
  const [projectName, setProjectName] = useState(() => config.appTitle || "Aplikasi Kas MT");
  const [slug, setSlug] = useState(() => "kas-mt");
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
    suggestions: string[];
  }>({ checking: false, suggestions: [] });

  // GitHub Integration Form
  const [enableGithubPush, setEnableGithubPush] = useState(true);
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem("ghighais_github_token") || "");
  const [githubRepo, setGithubRepo] = useState(() => "kas-mt-alqiroah");
  const [githubBranch, setGithubBranch] = useState("main");
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);

  // Environment Variables
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string; isSecret: boolean }>>([
    { key: "APP_URL", value: "https://kas-mt.ghighais.com", isSecret: false },
    { key: "NODE_ENV", value: "production", isSecret: false },
    { key: "DB_PROVIDER", value: databasePreference?.provider || "supabase", isSecret: false },
    { key: "DATABASE_URL", value: "postgresql://postgres:••••••••@aws.pooler.supabase.com", isSecret: true },
    { key: "API_KEY", value: "ghighais_live_sec_••••••••", isSecret: true },
  ]);
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");

  // Publish Progress & Steps
  const [publishStep, setPublishStep] = useState<DeployStep>("idle");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [currentLiveUrl, setCurrentLiveUrl] = useState<string | null>(null);
  const [publishLogs, setPublishLogs] = useState<string[]>([]);

  // Modals
  const [selectedForDomain, setSelectedForDomain] = useState<DeploymentRecord | null>(null);
  const [selectedForLogs, setSelectedForLogs] = useState<DeploymentRecord | null>(null);
  const [selectedForAiFix, setSelectedForAiFix] = useState<DeploymentRecord | null>(null);

  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Sync token states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ghighais_vercel_token", vercelToken);
      localStorage.setItem("ghighais_cf_token", cloudflareToken);
      localStorage.setItem("ghighais_cf_account", cloudflareAccountId);
      localStorage.setItem("ghighais_github_token", githubToken);
      localStorage.setItem("ghighais_deploy_is_premium", isPremium ? "true" : "false");
    } catch {}
  }, [vercelToken, cloudflareToken, cloudflareAccountId, githubToken, isPremium]);

  // Load Deployments list from API
  const fetchDeployments = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch("/api/deploy/list");
      const data = await res.json();
      if (res.ok && data.deployments) {
        setDeployments(data.deployments);
        setActiveCount(data.activeCount || data.deployments.filter((d: any) => d.status === "live").length);
      }
    } catch (err) {
      console.warn("Failed to fetch deployments:", err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  // Real-time Slug Availability Checker (Debounced)
  useEffect(() => {
    if (!slug.trim()) {
      setSlugStatus({ checking: false, suggestions: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setSlugStatus((prev) => ({ ...prev, checking: true }));
      try {
        const res = await fetch("/api/deploy/check-slug", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const data = await res.json();
        setSlugStatus({
          checking: false,
          available: data.available,
          message: data.message,
          suggestions: data.suggestions || [],
        });
      } catch {
        setSlugStatus({ checking: false, suggestions: [] });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [slug]);

  // Handle Publish flow (3 sequential steps)
  const handlePublish = async () => {
    if (!projectName.trim() || !slug.trim()) {
      setPublishError("Nama project dan slug subdomain wajib diisi.");
      return;
    }

    setPublishError(null);
    setPublishLogs([]);
    setCurrentLiveUrl(null);

    // Step 1: Pushing Code to GitHub
    setPublishStep("pushing_github");

    // Format env variables object
    const envObj: Record<string, string> = {};
    envVars.forEach((v) => {
      if (v.key.trim()) envObj[v.key.trim()] = v.value;
    });

    try {
      // Simulate/Show progression steps in UI
      const ghPayload = enableGithubPush && githubToken.trim()
        ? {
            token: githubToken.trim(),
            repoName: githubRepo.trim(),
            branch: githubBranch.trim() || "main",
            isPrivate: isPrivateRepo,
            commitMessage: `Deploy ${projectName} via Ghighais Deploy Engine`,
          }
        : null;

      // Advance progress state to Step 2: Building on Engine
      const timerStep2 = setTimeout(() => {
        setPublishStep("building_engine");
      }, 1000);

      // Advance progress state to Step 3: Assigning Domain
      const timerStep3 = setTimeout(() => {
        setPublishStep("assigning_domain");
      }, 2200);

      const res = await fetch("/api/deploy/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: projectName.trim(),
          slug: slug.trim(),
          code,
          engine,
          github: ghPayload,
          vercelToken: vercelToken.trim() || undefined,
          cloudflareToken: cloudflareToken.trim() || undefined,
          cloudflareAccountId: cloudflareAccountId.trim() || undefined,
          envVariables: envObj,
          isPremium,
        }),
      });

      clearTimeout(timerStep2);
      clearTimeout(timerStep3);

      const data = await res.json();
      if (!res.ok) {
        setPublishStep("failed");
        setPublishError(data.error || "Proses publish gagal.");
        setPublishLogs(data.buildLogs || ["Terjadi kendala pada deployment engine."]);
        return;
      }

      setPublishStep("live");
      setCurrentLiveUrl(data.deployment.liveUrl);
      setPublishLogs(data.buildLogs || []);
      fetchDeployments();
    } catch (err: any) {
      setPublishStep("failed");
      setPublishError(err.message || "Gagal menghubungi server deployment engine.");
    }
  };

  // Redeploy an existing deployment
  const handleRedeploy = async (dep: DeploymentRecord) => {
    try {
      const res = await fetch("/api/deploy/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: dep.projectName,
          slug: dep.slug,
          code,
          engine: dep.engine,
          existingId: dep.id,
          isPremium,
        }),
      });
      if (res.ok) {
        fetchDeployments();
      }
    } catch (err) {
      console.warn("Redeploy error:", err);
    }
  };

  // Delete a deployment
  const handleDelete = async (depId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus deployment ini? Subdomain terkait akan dinonaktifkan.")) {
      return;
    }
    try {
      const res = await fetch("/api/deploy/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deploymentId: depId }),
      });
      if (res.ok) {
        fetchDeployments();
      }
    } catch (err) {
      console.warn("Delete error:", err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Add custom environment variable
  const handleAddEnv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvKey.trim()) return;
    setEnvVars((prev) => [
      ...prev,
      {
        key: newEnvKey.trim().toUpperCase(),
        value: newEnvValue.trim(),
        isSecret: newEnvKey.includes("KEY") || newEnvKey.includes("SECRET") || newEnvKey.includes("PASSWORD"),
      },
    ]);
    setNewEnvKey("");
    setNewEnvValue("");
  };

  return (
    <div className="flex-1 flex flex-col max-w-[1720px] w-full mx-auto p-2 sm:p-4 text-slate-100 font-sans animate-in fade-in duration-300">
      {/* Top Bar: Return to studio + Engine Title + Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToStudio}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Studio</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  Ghighais Deploy Engine
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Wildcard *.ghighais.com Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Internal Hosting Platform & Automated Subdomain Provisioning (Powered by Vercel & Cloudflare API)
              </p>
            </div>
          </div>
        </div>

        {/* Free Tier vs Premium Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPremium(!isPremium)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isPremium
                ? "bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600"
            }`}
            title="Klik untuk beralih mode Free Tier / Premium"
          >
            <Crown className={`w-3.5 h-3.5 ${isPremium ? "text-amber-400 fill-amber-400" : "text-slate-400"}`} />
            <span>{isPremium ? "Premium Tier (Unlimited)" : `Free Tier (${activeCount}/3 Active)`}</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === "settings" ? "deployments" : "settings")}
            className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
              activeTab === "settings"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-700/80"
            }`}
            title="Pengaturan Engine & API Token"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active Deployments</span>
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {activeCount} <span className="text-xs text-slate-500 font-normal">{isPremium ? "/ ∞" : "/ 3 Maks"}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Subdomain Terdaftar</span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {deployments.length} <span className="text-xs text-emerald-400 font-mono">*.ghighais.com</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Custom Domains</span>
            <ShieldCheck className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {deployments.reduce((acc, d) => acc + (d.customDomains?.length || 0), 0)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Global Edge DNS</span>
            <CloudLightning className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-4 h-4" /> 100% Operational
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 mb-6 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("deployments")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "deployments"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-slate-800"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>My Deployments ({deployments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("publish")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "publish"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30"
                : "text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30"
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-amber-300" />
            <span>Publish to Ghighais</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDeployments}
            disabled={isLoadingList}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs transition-colors cursor-pointer"
            title="Muat ulang daftar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* TAB 1: MY DEPLOYMENTS */}
      {activeTab === "deployments" && (
        <div className="space-y-4">
          {deployments.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/30 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <Rocket className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-white">Belum Ada Project yang Dipublish</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Jadikan kode yang sedang Anda buat di Studio langsung online dengan subdomain otomatis <span className="text-indigo-300 font-mono">[slug].ghighais.com</span> dan SSL gratis.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("publish")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-2 mx-auto shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Rocket className="w-4 h-4 text-amber-300" />
                <span>Publish Project Pertama Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {deployments.map((dep) => (
                <div
                  key={dep.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/40 transition-all shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Project info & Subdomain */}
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-white truncate">
                        {dep.projectName}
                      </h3>
                      {/* Status badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          dep.status === "live"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : dep.status === "failed"
                            ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                            : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            dep.status === "live"
                              ? "bg-emerald-400"
                              : dep.status === "failed"
                              ? "bg-rose-400"
                              : "bg-amber-400 animate-ping"
                          }`}
                        />
                        <span>{dep.status}</span>
                      </span>

                      {/* Engine Tag */}
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700/80">
                        {dep.engine.toUpperCase()}
                      </span>
                    </div>

                    {/* Subdomain URL display with copy & visit */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-mono text-indigo-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{dep.liveUrl}</span>
                        <button
                          onClick={() => handleCopy(dep.liveUrl)}
                          className="ml-1 text-slate-400 hover:text-white cursor-pointer"
                          title="Salin Link Subdomain"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      {copiedUrl === dep.liveUrl && (
                        <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Tersalin!
                        </span>
                      )}

                      {/* GitHub link if exists */}
                      {dep.githubRepo && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Github className="w-3 h-3 text-slate-300" />
                          <span>{dep.githubRepo}</span>
                          <span className="font-mono text-slate-500">({dep.commitSha})</span>
                        </span>
                      )}
                    </div>

                    {/* Custom Domains list snippet */}
                    {dep.customDomains && dep.customDomains.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                        <span className="text-slate-500">Custom Domain:</span>
                        {dep.customDomains.map((cd, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700 font-mono text-[10px] flex items-center gap-1"
                          >
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                            <span>{cd.domain}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                      href={dep.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => handleRedeploy(dep)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Redeploy dengan kode terbaru dari Studio"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Redeploy</span>
                    </button>

                    <button
                      onClick={() => setSelectedForDomain(dep)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Atur Custom Domain (CNAME)"
                    >
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Custom Domain</span>
                    </button>

                    <button
                      onClick={() => setSelectedForLogs(dep)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs transition-colors cursor-pointer"
                      title="Lihat Log Build"
                    >
                      <Terminal className="w-4 h-4" />
                    </button>

                    {dep.status === "failed" && (
                      <button
                        onClick={() => setSelectedForAiFix(dep)}
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/30"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Fix with AI</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(dep.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs transition-colors cursor-pointer"
                      title="Hapus Deployment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PUBLISH TO GHIGHAIS */}
      {activeTab === "publish" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Form Konfigurasi Publish */}
          <div className="lg:col-span-7 space-y-5">
            {/* Project Details & Subdomain Slug */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>1. Sistem Subdomain Otomatis (*.ghighais.com)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Nama Project:
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => {
                      setProjectName(e.target.value);
                      // Otomatis update slug jika belum diubah manual
                      const autoSlug = e.target.value
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]/g, "-")
                        .replace(/-+/g, "-");
                      setSlug(autoSlug);
                    }}
                    placeholder="misal: Aplikasi Kas MT"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Slug Subdomain:</span>
                    {slugStatus.checking && (
                      <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> memeriksa...
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="kas-mt"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-mono text-indigo-300 placeholder-slate-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 pointer-events-none">
                      .ghighais.com
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Validasi Slug Subdomain */}
              {slugStatus.available === true && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Subdomain <strong className="font-mono">https://{slug}.ghighais.com</strong> siap didaftarkan!
                  </span>
                </div>
              )}

              {slugStatus.available === false && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{slugStatus.message || "Slug subdomain tidak tersedia."}</span>
                  </div>

                  {slugStatus.suggestions.length > 0 && (
                    <div className="pt-1">
                      <span className="text-slate-400 text-[11px] block mb-1.5">
                        Pilih saran alternatif yang tersedia:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {slugStatus.suggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setSlug(sug)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-950/70 border border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-indigo-200 font-mono text-[11px] transition-all cursor-pointer"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Engine Choice */}
              <div className="pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Pilih Platform Deployment Engine:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEngine("vercel")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      engine === "vercel"
                        ? "bg-indigo-950/60 border-indigo-500 text-white shadow-md"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between mb-1">
                      <span>Vercel API Engine</span>
                      {engine === "vercel" && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Mendukung wildcard *.ghighais.com secara native & instant edge compilation.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEngine("cloudflare")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      engine === "cloudflare"
                        ? "bg-indigo-950/60 border-indigo-500 text-white shadow-md"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between mb-1">
                      <span>Cloudflare Pages API</span>
                      {engine === "cloudflare" && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Setup CNAME * ke pages.dev dengan proteksi DDoS bawaan Cloudflare.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* GitHub Push Integration */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <Github className="w-4 h-4 text-slate-200" />
                  <span>2. Alur Sinkronisasi GitHub (Step 1)</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={enableGithubPush}
                    onChange={(e) => setEnableGithubPush(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Push ke Repositori</span>
                </label>
              </div>

              {enableGithubPush && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">
                        GitHub Personal Access Token (PAT):
                      </label>
                      <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_••••••••••••••••"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">
                        Nama Repositori:
                      </label>
                      <input
                        type="text"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        placeholder="username/kas-mt"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-2">
                      <span>Branch:</span>
                      <input
                        type="text"
                        value={githubBranch}
                        onChange={(e) => setGithubBranch(e.target.value)}
                        className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono w-20 text-slate-200"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPrivateRepo}
                        onChange={(e) => setIsPrivateRepo(e.target.checked)}
                      />
                      <span>Private Repo</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Environment Variables Sync */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>3. Environment Variables Sync (Injeksi API Secrets)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Terenkripsi Aman
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Variabel di bawah diinjeksikan langsung ke runtime deployment platform engine. Nilai rahasia (DB_URL, API_KEY) terlindungi dan tidak akan bocor ke log build publik.
              </p>

              {/* Env List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {envVars.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 font-mono min-w-0">
                      <span className="font-bold text-indigo-300">{item.key}</span>
                      <span className="text-slate-500">=</span>
                      <span className="text-slate-300 truncate">
                        {item.isSecret && !showTokens ? "••••••••••••••••" : item.value}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnvVars(envVars.filter((_, i) => i !== idx))}
                      className="text-slate-500 hover:text-rose-400 cursor-pointer p-1"
                      title="Hapus variabel"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Env Input */}
              <form onSubmit={handleAddEnv} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newEnvKey}
                  onChange={(e) => setNewEnvKey(e.target.value)}
                  placeholder="NAMA_VARIABEL"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 uppercase focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={newEnvValue}
                  onChange={(e) => setNewEnvValue(e.target.value)}
                  placeholder="Nilai rahasia..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </form>
            </div>
          </div>

          {/* Kolom Kanan: Aksi Publish & Real-time Progress Bar */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-4 sticky top-20">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Rocket className="w-4 h-4 text-indigo-400" />
                <span>Peluncuran Publikasi</span>
              </h3>

              {/* Summary target */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Target Subdomain:</span>
                  <span className="font-mono text-indigo-300 font-bold">
                    https://{slug || "..."}.ghighais.com
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Engine:</span>
                  <span className="font-bold text-white uppercase">{engine}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Ukuran Bundel Kode:</span>
                  <span className="text-slate-300 font-mono">{(code.length / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>SSL Certificate:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Wildcard HTTPS
                  </span>
                </div>
              </div>

              {/* Progress Steps Realtime Indicator */}
              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-semibold text-slate-400 block">
                  Status Alur Publish (3 Langkah Berurutan):
                </span>

                {/* Step 1: Pushing Code */}
                <div
                  className={`p-3 rounded-xl border flex items-center gap-3 text-xs transition-all ${
                    publishStep === "pushing_github"
                      ? "bg-indigo-950/80 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-600/20"
                      : publishStep === "building_engine" || publishStep === "assigning_domain" || publishStep === "live"
                      ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                      : "bg-slate-950/50 border-slate-800/80 text-slate-500"
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {publishStep === "building_engine" || publishStep === "assigning_domain" || publishStep === "live" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : publishStep === "pushing_github" ? (
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    ) : (
                      "1"
                    )}
                  </div>
                  <div>
                    <div className="font-bold">Pushing Code to GitHub...</div>
                    <div className="text-[11px] opacity-80">Sinkronisasi repositori & commit file</div>
                  </div>
                </div>

                {/* Step 2: Building Engine */}
                <div
                  className={`p-3 rounded-xl border flex items-center gap-3 text-xs transition-all ${
                    publishStep === "building_engine"
                      ? "bg-indigo-950/80 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-600/20"
                      : publishStep === "assigning_domain" || publishStep === "live"
                      ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                      : "bg-slate-950/50 border-slate-800/80 text-slate-500"
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {publishStep === "assigning_domain" || publishStep === "live" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : publishStep === "building_engine" ? (
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    ) : (
                      "2"
                    )}
                  </div>
                  <div>
                    <div className="font-bold">Building on Platform Engine...</div>
                    <div className="text-[11px] opacity-80">
                      Deploy ke {engine.toUpperCase()} dengan projectName: [{slug}]
                    </div>
                  </div>
                </div>

                {/* Step 3: Assigning Domain */}
                <div
                  className={`p-3 rounded-xl border flex items-center gap-3 text-xs transition-all ${
                    publishStep === "assigning_domain"
                      ? "bg-indigo-950/80 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-600/20"
                      : publishStep === "live"
                      ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                      : "bg-slate-950/50 border-slate-800/80 text-slate-500"
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {publishStep === "live" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : publishStep === "assigning_domain" ? (
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    ) : (
                      "3"
                    )}
                  </div>
                  <div>
                    <div className="font-bold">Assigning *.ghighais.com Domain...</div>
                    <div className="text-[11px] opacity-80">Aktivasi wildcard DNS & Let's Encrypt SSL</div>
                  </div>
                </div>
              </div>

              {/* Step 4: Live Notification if Success */}
              {publishStep === "live" && currentLiveUrl && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 space-y-3 animate-in zoom-in-95">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>🟢 Live at {currentLiveUrl}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Aplikasi Anda kini resmi online di cloud. Subdomain dan sertifikat SSL aktif secara global.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={currentLiveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                    >
                      <span>Buka Aplikasi Sekarang</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleCopy(currentLiveUrl)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Salin Link
                    </button>
                  </div>
                </div>
              )}

              {/* Error banner if failed with AI Fix button */}
              {publishStep === "failed" && publishError && (
                <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Deployment Mengalami Kendala:</span>
                  </div>
                  <p className="text-xs text-rose-200 leading-relaxed font-mono bg-slate-950/80 p-2.5 rounded-xl border border-rose-500/20">
                    {publishError}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        // Open AI fix for current failed code
                        const fakeRec: DeploymentRecord = {
                          id: "temp_err",
                          projectName,
                          slug,
                          subdomain: `${slug}.ghighais.com`,
                          liveUrl: `https://${slug}.ghighais.com`,
                          status: "failed",
                          engine,
                          customDomains: [],
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          buildLogs: publishLogs,
                          envKeys: [],
                          codeSnapshot: code,
                        };
                        setSelectedForAiFix(fakeRec);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Fix with Qwen AI</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Main Publish Trigger Button */}
              <button
                type="button"
                onClick={handlePublish}
                disabled={
                  publishStep === "pushing_github" ||
                  publishStep === "building_engine" ||
                  publishStep === "assigning_domain" ||
                  slugStatus.available === false
                }
                className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl active:scale-98 cursor-pointer ${
                  publishStep === "pushing_github" ||
                  publishStep === "building_engine" ||
                  publishStep === "assigning_domain" ||
                  slugStatus.available === false
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30"
                }`}
              >
                {publishStep === "pushing_github" ||
                publishStep === "building_engine" ||
                publishStep === "assigning_domain" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Memproses Deployment...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 text-amber-300" />
                    <span>Publish to Ghighais Engine</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ENGINE SETTINGS */}
      {activeTab === "settings" && (
        <div className="max-w-3xl mx-auto w-full space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Pengaturan Kredensial Engine & Wildcard DNS</h2>
                  <p className="text-xs text-slate-400">
                    Token API disimpan secara aman di backend proxy Express dan tidak pernah terekspos ke klien.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTokens(!showTokens)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {showTokens ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showTokens ? "Sembunyikan" : "Tampilkan"}</span>
              </button>
            </div>

            {/* Vercel Setup Guide & Token */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">1. Vercel API Token (Wildcard *.ghighais.com)</span>
                <span className="text-[10px] text-indigo-400 font-mono">api.vercel.com</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Setup wildcard domain <code className="text-indigo-300">*.ghighais.com</code> di dashboard Vercel Anda, lalu masukkan API Token di bawah untuk otorisasi deployment:
              </p>
              <input
                type={showTokens ? "text" : "password"}
                value={vercelToken}
                onChange={(e) => setVercelToken(e.target.value)}
                placeholder="Masukkan Vercel API Token (contoh: vercel_tok_••••••••)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Cloudflare Pages Setup Guide & Token */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">2. Cloudflare Pages API & Account ID</span>
                <span className="text-[10px] text-amber-400 font-mono">api.cloudflare.com</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Setup CNAME record <code className="text-amber-300">*</code> yang mengarah ke <code className="text-slate-300">pages.dev</code> pada zone DNS Cloudflare ghighais.com:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type={showTokens ? "text" : "password"}
                  value={cloudflareToken}
                  onChange={(e) => setCloudflareToken(e.target.value)}
                  placeholder="Cloudflare API Token"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={cloudflareAccountId}
                  onChange={(e) => setCloudflareAccountId(e.target.value)}
                  placeholder="Cloudflare Account ID"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Free Tier Limitation info */}
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
              <Crown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">Ketentuan Kuota Penggunaan:</span>
                <p className="leading-relaxed text-[11px] text-amber-200/90">
                  Tier Gratis (Free Tier) dibatasi hingga <strong>maksimal 3 active deployments</strong> per user. Untuk kebutuhan tak terbatas (unlimited deployments, custom domain tanpa batas), aktifkan status <strong>Premium</strong> di pojok kanan atas.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("deployments")}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Simpan & Kembali ke Deployments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Custom Domain Mapping */}
      <CustomDomainModal
        isOpen={!!selectedForDomain}
        onClose={() => setSelectedForDomain(null)}
        deployment={selectedForDomain}
        onUpdateDeployment={(updated) => {
          setDeployments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          setSelectedForDomain(updated);
        }}
      />

      {/* MODAL: Build Logs */}
      <BuildLogsModal
        isOpen={!!selectedForLogs}
        onClose={() => setSelectedForLogs(null)}
        deployment={selectedForLogs}
        onAiFix={(dep) => {
          setSelectedForLogs(null);
          setSelectedForAiFix(dep);
        }}
      />

      {/* MODAL: AI Auto Fix */}
      <AiFixModal
        isOpen={!!selectedForAiFix}
        onClose={() => setSelectedForAiFix(null)}
        deployment={selectedForAiFix}
        onApplyAndRedeploy={(fixedCode, dep) => {
          onUpdateCode(fixedCode);
          handleRedeploy(dep);
        }}
      />
    </div>
  );
};
