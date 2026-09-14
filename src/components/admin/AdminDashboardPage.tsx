import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { AppConfig, AdminAuditLog } from "../../types";
import {
  ShieldAlert,
  LogOut,
  Sliders,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Lock,
  Image,
  Upload,
  RotateCcw,
  Check,
  Maximize2,
  Eye,
  Globe,
  Layers,
  Monitor,
  ShieldCheck,
} from "lucide-react";

interface AdminDashboardPageProps {
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
  onEnterStudio: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  config,
  onSaveConfig,
  onEnterStudio,
}) => {
  const { logoutAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "audit" | "system">("overview");
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [footerText, setFooterText] = useState(config.permanentFooterText || "SUPPORT BY GHIGHAIS DEVELOPMENT");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Login Logo state (support PNG transparan tanpa background, URL, atau file upload)
  const [loginLogoUrl, setLoginLogoUrl] = useState(config.loginLogoUrl || config.logoUrl || "/ghighais-logo.jpg");
  const [loginLogoType, setLoginLogoType] = useState<"default" | "url" | "upload">(config.loginLogoType || "default");
  const [loginLogoSize, setLoginLogoSize] = useState<number>(config.loginLogoSize || 96);
  const [navbarLogoSize, setNavbarLogoSize] = useState<number>(config.navbarLogoSize || 40);
  const [logoFit, setLogoFit] = useState<"contain" | "cover" | "fill">(config.logoFit || "contain");
  const [logoBorderRadius, setLogoBorderRadius] = useState<"none" | "md" | "xl" | "3xl" | "full">(config.logoBorderRadius || "3xl");
  const [syncGlobal, setSyncGlobal] = useState<boolean>(true);
  const [logoSaveToast, setLogoSaveToast] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"login" | "navbar" | "both" | "alpha">("login");
  const [previewInteractiveCheck, setPreviewInteractiveCheck] = useState(false);
  const [logoShadowDepth, setLogoShadowDepth] = useState<"none" | "soft" | "medium" | "glow">("medium");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if external config updates
  useEffect(() => {
    if (config.loginLogoUrl) setLoginLogoUrl(config.loginLogoUrl);
    if (config.loginLogoType) setLoginLogoType(config.loginLogoType);
    if (config.loginLogoSize) setLoginLogoSize(config.loginLogoSize);
    if (config.navbarLogoSize) setNavbarLogoSize(config.navbarLogoSize);
    if (config.logoFit) setLogoFit(config.logoFit);
    if (config.logoBorderRadius) setLogoBorderRadius(config.logoBorderRadius);
  }, [
    config.loginLogoUrl,
    config.loginLogoType,
    config.loginLogoSize,
    config.navbarLogoSize,
    config.logoFit,
    config.logoBorderRadius,
  ]);

  // Load audit trail from server
  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch("/api/auth/admin-audit-logs");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.warn("Failed to load audit logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleSaveFooter = () => {
    setIsSavingConfig(true);
    const updated = {
      ...config,
      permanentFooterText: footerText.trim() || "SUPPORT BY GHIGHAIS DEVELOPMENT",
    };
    onSaveConfig(updated);
    setIsSavingConfig(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleLoginLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);

    // Accept PNG, SVG, WebP, JPEG
    if (!file.type.startsWith("image/")) {
      setLogoError("File harus berupa gambar (disarankan PNG transparan tanpa background)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLoginLogoUrl(reader.result);
        setLoginLogoType("upload");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLoginLogo = () => {
    setLoginLogoUrl("/ghighais-logo.jpg");
    setLoginLogoType("default");
    setLoginLogoSize(96);
    setNavbarLogoSize(40);
    setLogoFit("contain");
    setLogoBorderRadius("3xl");
    setLogoError(null);
  };

  const handleSaveLoginLogo = () => {
    const finalLogoUrl = loginLogoUrl.trim() || "/ghighais-logo.jpg";
    const updated: AppConfig = {
      ...config,
      loginLogoUrl: finalLogoUrl,
      loginLogoType,
      loginLogoSize,
      navbarLogoSize,
      logoFit,
      logoBorderRadius,
      ...(syncGlobal
        ? {
            logoUrl: finalLogoUrl,
            logoType: loginLogoType === "upload" ? "upload" : loginLogoType === "url" ? "url" : "upload",
          }
        : {}),
    };
    onSaveConfig(updated);
    setLogoSaveToast(true);
    setTimeout(() => setLogoSaveToast(false), 3500);
  };

  return (
    <div
      id="page-admin-dashboard"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black"
    >
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Prominent Red/Gold ADMIN MODE Badge as specified */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-extrabold text-xs tracking-wider shadow-lg shadow-red-900/30 border border-amber-400/40 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span>ADMIN MODE</span>
            </div>

            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-slate-300">Ghighais Control Central</span>
              <span className="text-[10px] text-slate-500 font-mono">Session Expiry: 24 Jam • Server-Protected</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Switch to Studio Workspace */}
            <button
              type="button"
              onClick={onEnterStudio}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700/80 cursor-pointer"
            >
              <span>Buka Studio</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            {/* Logout Admin Button (Top Right as specified) */}
            <button
              id="btn-admin-logout"
              type="button"
              onClick={logoutAdmin}
              className="px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Keluar dari mode admin dan hapus session admin 24 jam"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Logout Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "overview"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Overview & Konfigurasi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("audit");
              fetchAuditLogs();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "audit"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail Logs ({auditLogs.length})</span>
          </button>
        </div>

        {/* Tab 1: Overview & System Settings */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Status Card */}
            <div className="lg:col-span-1 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Status Keamanan Sistem</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Parameter proteksi jalur rahasia & otentikasi hybrid.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400">Jalur Admin URL:</span>
                    <span className="font-mono text-emerald-400 font-bold">/admin/access</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400">Validasi Password:</span>
                    <span className="text-emerald-400 font-semibold">Server-side Only</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400">Rate Limit:</span>
                    <span className="text-amber-400 font-semibold">Max 5 attempt / jam</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400">Robots Indexing:</span>
                    <span className="text-rose-400 font-semibold">noindex, nofollow</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400">Fallback Tanpa Session:</span>
                    <span className="text-sky-400 font-mono">Custom 404 (Hidden)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Ghighais Security Engine</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
            </div>

            {/* Permanent Footer Customizer */}
            <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <span>Kustomisasi Teks Footer Permanen</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Teks ini dikunci di setiap kode aplikasi yang digenerate oleh user dan dilindungi MutationObserver.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Teks Footer (Support By...)
                    </label>
                    <input
                      type="text"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder="SUPPORT BY GHIGHAIS DEVELOPMENT"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-sm text-white outline-none font-mono"
                    />
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Pratinjau: <strong className="text-slate-200">{footerText || "SUPPORT BY GHIGHAIS DEVELOPMENT"}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                {saveToast ? (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Teks footer permanen berhasil disimpan!
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Perubahan langsung diterapkan ke engine.</span>
                )}

                <button
                  type="button"
                  onClick={handleSaveFooter}
                  disabled={isSavingConfig}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </div>

            {/* Customizer Logo & Ukuran Tampilan (Menyesuaikan Keinginan Admin & Selalu Muncul Dimanapun) */}
            <div className="lg:col-span-3 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 sm:p-6 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Image className="w-4 h-4 text-indigo-400" />
                    <span>Kustomisasi & Ukuran Tampilan Logo Aplikasi</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ubah gambar dan ukuran logo sesuai keinginan Anda. Logo dijamin <strong>tetap muncul dimanapun web app ini dibuka</strong> di berbagai perangkat.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-emerald-400" />
                    <span>Global Sync Active</span>
                  </span>
                </div>
              </div>

              {logoError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{logoError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Visual Live Previews (Kiri: Real-time scaling preview 1:1 tanpa batas kotak) */}
                <div className="xl:col-span-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pratinjau Hasil Nyata Saat Disimpan</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                      Bebas Kotak (Borderless)
                    </span>
                  </div>

                  {/* Tabs Selector for Preview Mode */}
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPreviewTab("login")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                        previewTab === "login"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Eye className="w-3 h-3 shrink-0" />
                      <span className="truncate">Login</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewTab("navbar")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                        previewTab === "navbar"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Layers className="w-3 h-3 shrink-0" />
                      <span className="truncate">Navbar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewTab("both")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                        previewTab === "both"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Monitor className="w-3 h-3 shrink-0" />
                      <span className="truncate">Keduanya</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewTab("alpha")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                        previewTab === "alpha"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span className="truncate">Alpha PNG</span>
                    </button>
                  </div>

                  {/* PREVIEW CONTAINER */}
                  {(previewTab === "login" || previewTab === "both") && (
                    <div className="flex flex-col items-center p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center relative overflow-hidden shadow-inner">
                      {/* Ambient light simulations */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-28 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />

                      <div className="w-full flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80 relative z-10">
                        <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                          <span>Simulasi Halaman Login</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                          {loginLogoSize} px
                        </span>
                      </div>

                      {/* Exact Simulated Login Card (Tanpa Kotak Batas Logo) */}
                      <div className="w-full max-w-xs bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 shadow-2xl backdrop-blur-xl relative z-10 flex flex-col items-center text-center my-2">
                        {/* THE LOGO: MURNI TANPA BATAS KOTAK & TANPA DIBERI KOTAK */}
                        <div className="w-full flex items-center justify-center mb-5 group cursor-pointer" title="Pratinjau Logo Tanpa Batas Kotak">
                          <img
                            src={loginLogoUrl || "/ghighais-logo.jpg"}
                            alt="Pratinjau Logo Halaman Login"
                            style={{
                              width: `${loginLogoSize}px`,
                              maxWidth: "100%",
                              height: "auto",
                              maxHeight: `${Math.max(loginLogoSize * 1.4, 320)}px`,
                              objectFit: "contain",
                              filter:
                                logoShadowDepth === "none"
                                  ? "none"
                                  : logoShadowDepth === "soft"
                                  ? "drop-shadow(0 4px 10px rgba(0,0,0,0.35))"
                                  : logoShadowDepth === "glow"
                                  ? "drop-shadow(0 0 20px rgba(99,102,241,0.65))"
                                  : "drop-shadow(0 10px 24px rgba(0,0,0,0.45))",
                            }}
                            className="transition-all duration-200 select-none pointer-events-none"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/ghighais-logo.jpg";
                            }}
                          />
                        </div>

                        {/* Interactive Captcha Verification simulation box */}
                        <div
                          onClick={() => setPreviewInteractiveCheck(!previewInteractiveCheck)}
                          className={`w-full p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-md select-none ${
                            previewInteractiveCheck
                              ? "bg-emerald-950/30 border-emerald-500/60 shadow-emerald-500/10"
                              : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                          }`}
                          title="Klik untuk tes simulasi verifikasi"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                previewInteractiveCheck
                                  ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30"
                                  : "border-slate-600 bg-slate-900"
                              }`}
                            >
                              {previewInteractiveCheck && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div className="text-left">
                              <span className="text-[11px] font-semibold text-slate-200 block leading-tight">
                                Verifikasi Anda Bukan Robot
                              </span>
                              <span className="text-[9px] text-slate-500 block leading-tight">
                                {previewInteractiveCheck ? "Terverifikasi" : "Klik untuk mencoba"}
                              </span>
                            </div>
                          </div>
                          <ShieldCheck className={`w-4 h-4 ${previewInteractiveCheck ? "text-emerald-400" : "text-slate-600"}`} />
                        </div>

                        <span className="text-[9px] text-slate-500 mt-4">
                          Ketuk logo 5x untuk Masuk Halaman Admin
                        </span>
                      </div>

                      <div className="w-full pt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Logo murni tanpa bingkai kotak</span>
                        </span>
                        <span className="font-mono text-slate-500">Skala 1:1 Asli</span>
                      </div>
                    </div>
                  )}

                  {/* PREVIEW NAVBAR */}
                  {(previewTab === "navbar" || previewTab === "both") && (
                    <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
                          <span>Simulasi Header Studio / Navbar</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold">
                          {navbarLogoSize} px
                        </span>
                      </div>

                      {/* Header Studio Navbar Simulation */}
                      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Logo Navbar Tanpa Batas Kotak */}
                          <div
                            style={{
                              width: `${navbarLogoSize}px`,
                              height: `${navbarLogoSize}px`,
                            }}
                            className="flex items-center justify-center shrink-0"
                          >
                            <img
                              src={loginLogoUrl || "/ghighais-logo.jpg"}
                              alt="Navbar Logo"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                filter:
                                  logoShadowDepth === "none"
                                    ? "none"
                                    : logoShadowDepth === "soft"
                                    ? "drop-shadow(0 2px 6px rgba(0,0,0,0.3))"
                                    : "drop-shadow(0 4px 10px rgba(0,0,0,0.45))",
                              }}
                              className="select-none"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/ghighais-logo.jpg";
                              }}
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate">{config.appTitle || "Ghighais Brain"}</span>
                            <span className="text-[10px] text-slate-400 truncate">{config.appSubtitle || "AI Web Generator & Studio"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-semibold">
                            Simpan
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 pt-1">
                        Logo menyatu secara mulus tanpa batas kotak dengan teks judul
                      </span>
                    </div>
                  )}

                  {/* PREVIEW ALPHA CHECKERBOARD */}
                  {previewTab === "alpha" && (
                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <span className="text-[11px] font-semibold text-slate-300">Papan Catur Transparansi Alpha</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">Uji Latar Bening</span>
                      </div>

                      <div
                        className="w-full h-44 rounded-xl border border-slate-700/80 p-4 shadow-md flex items-center justify-center overflow-hidden"
                        style={{
                          backgroundImage:
                            "linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)",
                          backgroundSize: "14px 14px",
                          backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0px",
                          backgroundColor: "#0f172a",
                        }}
                        title="Papan catur transparansi alpha"
                      >
                        <img
                          src={loginLogoUrl || "/ghighais-logo.jpg"}
                          alt="Alpha test"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            filter:
                              logoShadowDepth === "none"
                                ? "none"
                                : "drop-shadow(0 6px 14px rgba(0,0,0,0.5))",
                          }}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/ghighais-logo.jpg";
                          }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1">
                        Bila menggunakan file PNG atau SVG berlatar bening, pola kotak-kotak papan catur akan tembus langsung di belakang logo tanpa ada kotak putih.
                      </p>
                    </div>
                  )}
                </div>

                {/* Controls & Size Sliders (Kanan: Detail Pengaturan Ukuran Bebas Berkreasi) */}
                <div className="xl:col-span-7 flex flex-col gap-5">
                  {/* PENGATUR 1: UKURAN LOGO HALAMAN LOGIN (BEBAS BERKREASI) */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Ukuran Logo Halaman Login (Bebas Berkreasi)</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={20}
                          max={500}
                          value={loginLogoSize}
                          onChange={(e) => setLoginLogoSize(Math.max(20, Math.min(500, Number(e.target.value) || 96)))}
                          className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-slate-900 border border-slate-700 rounded-lg text-indigo-300 focus:outline-none focus:border-indigo-400"
                        />
                        <span className="text-[11px] text-slate-500 font-mono">px</span>
                      </div>
                    </div>

                    {/* Slider Control Lebar Bebas: 20px - 400px */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 font-mono">20px</span>
                      <input
                        type="range"
                        min={20}
                        max={400}
                        step={2}
                        value={loginLogoSize}
                        onChange={(e) => setLoginLogoSize(Number(e.target.value))}
                        className="flex-1 accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">400px</span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-400">Pilihan Cepat:</span>
                      {[
                        { label: "Mini (48px)", size: 48 },
                        { label: "Kompak (80px)", size: 80 },
                        { label: "Standar (110px)", size: 110 },
                        { label: "Sedang (150px)", size: 150 },
                        { label: "Besar (200px)", size: 200 },
                        { label: "Ekstra (260px)", size: 260 },
                        { label: "Jumbo (340px)", size: 340 },
                      ].map((preset) => (
                        <button
                          key={preset.size}
                          type="button"
                          onClick={() => setLoginLogoSize(preset.size)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer border ${
                            loginLogoSize === preset.size
                              ? "bg-indigo-600 text-white border-indigo-400 shadow-sm"
                              : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PENGATUR 2: UKURAN LOGO NAVBAR / HEADER STUDIO */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ukuran Logo Header / Navbar Studio</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={16}
                          max={150}
                          value={navbarLogoSize}
                          onChange={(e) => setNavbarLogoSize(Math.max(16, Math.min(150, Number(e.target.value) || 40)))}
                          className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-slate-900 border border-slate-700 rounded-lg text-amber-300 focus:outline-none focus:border-amber-400"
                        />
                        <span className="text-[11px] text-slate-500 font-mono">px</span>
                      </div>
                    </div>

                    {/* Slider Control: 16px - 120px */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 font-mono">16px</span>
                      <input
                        type="range"
                        min={16}
                        max={120}
                        step={2}
                        value={navbarLogoSize}
                        onChange={(e) => setNavbarLogoSize(Number(e.target.value))}
                        className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">120px</span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-400">Pilihan Cepat:</span>
                      {[
                        { label: "Mini (28px)", size: 28 },
                        { label: "Standar (40px)", size: 40 },
                        { label: "Sedang (52px)", size: 52 },
                        { label: "Besar (68px)", size: 68 },
                        { label: "Jumbo (84px)", size: 84 },
                      ].map((preset) => (
                        <button
                          key={preset.size}
                          type="button"
                          onClick={() => setNavbarLogoSize(preset.size)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer border ${
                            navbarLogoSize === preset.size
                              ? "bg-amber-600 text-slate-950 font-bold border-amber-400 shadow-sm"
                              : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PENGATUR 3: EFEK BAYANGAN / KEDALAMAN LOGO (MURNI TANPA KOTAK) */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        Efek Kedalaman / Bayangan Logo (Murni Tanpa Batas Kotak)
                      </label>
                      <span className="text-[10px] text-emerald-400 font-semibold">Desain Borderless</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "none", label: "Tanpa Bayangan" },
                        { id: "soft", label: "Bayangan Halus" },
                        { id: "medium", label: "Bayangan Tegas" },
                        { id: "glow", label: "Efek Glow Cahaya" },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setLogoShadowDepth(s.id as any)}
                          className={`py-2 px-2 rounded-xl text-[10px] font-semibold transition-all cursor-pointer border text-center ${
                            logoShadowDepth === s.id
                              ? "bg-indigo-600/40 border-indigo-400 text-white shadow-sm"
                              : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-400"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Bayangan diterapkan langsung pada siluet bentuk gambar logo, tanpa bingkai persegi empat.
                    </p>
                  </div>

                  {/* UPLOAD & SUMBER FILE GAMBAR */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Unggah File Logo Baru (Disimpan otomatis dalam format permanen Base64)
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/webp, image/svg+xml, image/jpeg"
                        onChange={handleLoginLogoFileUpload}
                        className="hidden"
                        id="input-file-login-logo"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-400/70 hover:bg-slate-900/60 bg-slate-950/60 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            fileInputRef.current?.click();
                          }
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-300">
                            Pilih file PNG transparan dari komputer atau seret kemari
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Mendukung PNG (transparan tanpa background), SVG, WebP, JPG
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Or Direct URL Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Atau Masukkan URL Gambar Logo
                      </label>
                      <input
                        type="url"
                        value={loginLogoUrl}
                        onChange={(e) => {
                          setLoginLogoUrl(e.target.value);
                          setLoginLogoType("url");
                        }}
                        placeholder="https://example.com/logo-transparan.png"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-400 text-xs text-white outline-none font-mono"
                      />
                    </div>

                    {/* Checkbox Global Sync */}
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncGlobal}
                        onChange={(e) => setSyncGlobal(e.target.checked)}
                        className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-semibold text-indigo-200">
                          Terapkan ke Seluruh Tampilan Aplikasi
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Logo & ukuran yang diatur akan serempak aktif di Halaman Login, Header Studio, dan Favicon browser.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Action Buttons & Confirmation Toast */}
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleResetLoginLogo}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Kembalikan logo ke ukuran dan gambar default bawaan"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reset ke Default</span>
                    </button>

                    <div className="flex items-center gap-3">
                      {logoSaveToast && (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
                          <Check className="w-4 h-4" />
                          Logo dan ukuran berhasil disimpan ke server!
                        </span>
                      )}

                      <button
                        id="btn-admin-save-login-logo"
                        type="button"
                        onClick={handleSaveLoginLogo}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Simpan Logo & Ukuran Tampilan</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Audit Trail Logs */}
        {activeTab === "audit" && (
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-0.5 flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Audit Trail Akses /admin/access</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Setiap percobaan login (berhasil, gagal, atau terkena rate limit) dicatat otomatis di server.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchAuditLogs}
                disabled={isLoadingLogs}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? "animate-spin text-amber-400" : ""}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            {/* Audit Logs Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Waktu</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">IP Address</th>
                    <th className="py-2.5 px-4">Detail</th>
                    <th className="py-2.5 px-4">User Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Belum ada log percobaan akses yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {log.status === "success" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              SUCCESS
                            </span>
                          ) : log.status === "rate_limited" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              RATE LIMITED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-bold">
                              <XCircle className="w-3 h-3" />
                              FAILED
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 font-semibold">{log.ip}</td>
                        <td className="py-2.5 px-4 text-slate-400">{log.attemptDetails || "-"}</td>
                        <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate" title={log.userAgent}>
                          {log.userAgent}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
