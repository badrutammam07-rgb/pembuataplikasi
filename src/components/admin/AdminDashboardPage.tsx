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
  const [logoSaveToast, setLogoSaveToast] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if external config updates
  useEffect(() => {
    if (config.loginLogoUrl) {
      setLoginLogoUrl(config.loginLogoUrl);
    }
    if (config.loginLogoType) {
      setLoginLogoType(config.loginLogoType);
    }
  }, [config.loginLogoUrl, config.loginLogoType]);

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
    setLogoError(null);
  };

  const handleSaveLoginLogo = () => {
    const updated: AppConfig = {
      ...config,
      loginLogoUrl: loginLogoUrl.trim() || "/ghighais-logo.jpg",
      loginLogoType,
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

            {/* Customizer Logo Halaman Login (Support PNG Tanpa Background) */}
            <div className="lg:col-span-3 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 sm:p-6 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Image className="w-4 h-4 text-indigo-400" />
                    <span>Kustomisasi Logo Halaman Login</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ganti logo pada halaman login (Sign In with Google). Mendukung format <strong>PNG transparan tanpa background</strong>, WebP, SVG, atau URL eksternal.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    PNG Transparent Supported
                  </span>
                </div>
              </div>

              {logoError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{logoError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Visual Live Previews */}
                <div className="lg:col-span-5 flex flex-col gap-3">
                  <span className="text-xs font-semibold text-slate-300">Pratinjau Langsung Logo</span>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Preview 1: Simulated Dark Card (As in LoginPage) */}
                    <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-center">
                      <span className="text-[10px] font-medium text-slate-400">Mode Tampilan Login</span>
                      <div className="w-24 h-24 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-2 shadow-xl flex items-center justify-center overflow-hidden">
                        <img
                          src={loginLogoUrl || "/ghighais-logo.jpg"}
                          alt="Preview Login Logo"
                          className="w-full h-full object-contain drop-shadow-md rounded-lg"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/ghighais-logo.jpg";
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500">Latar Belakang Gelap</span>
                    </div>

                    {/* Preview 2: Checkerboard Transparency Grid (Alpha Test) */}
                    <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-center">
                      <span className="text-[10px] font-medium text-slate-400">Uji Transparansi (Alpha)</span>
                      <div
                        className="w-24 h-24 rounded-2xl border border-slate-700/80 p-2 shadow-xl flex items-center justify-center overflow-hidden"
                        style={{
                          backgroundImage:
                            "linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)",
                          backgroundSize: "16px 16px",
                          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                          backgroundColor: "#0f172a",
                        }}
                        title="Pola papan catur untuk memverifikasi logo tidak memiliki kotak putih di belakangnya"
                      >
                        <img
                          src={loginLogoUrl || "/ghighais-logo.jpg"}
                          alt="Preview Alpha Transparency"
                          className="w-full h-full object-contain drop-shadow-md rounded-lg"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/ghighais-logo.jpg";
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-emerald-400 font-medium">Bebas Kotak Putih</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    Periksa pada kotak papan catur untuk memastikan gambar logo benar-benar transparan tanpa latar putih.
                  </p>
                </div>

                {/* Upload & Settings Controls */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  {/* File Upload Input (Hidden actual input, styled drop/click area) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Upload File Logo (Disarankan format .PNG tanpa background)
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
                          Klik untuk pilih file PNG atau drag & drop di sini
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Support PNG (transparan), SVG, WebP, JPG (Maks. 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Or Direct URL Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Atau Masukkan URL Gambar Logo
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={loginLogoUrl}
                        onChange={(e) => {
                          setLoginLogoUrl(e.target.value);
                          setLoginLogoType("url");
                        }}
                        placeholder="https://example.com/logo-transparan.png"
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-400 text-xs text-white outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Action Buttons & Confirmation Toast */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetLoginLogo}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Kembalikan logo login ke logo default bawaan"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-400" />
                        <span>Reset ke Default</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {logoSaveToast && (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in duration-150">
                          <Check className="w-4 h-4" />
                          Logo login berhasil disimpan!
                        </span>
                      )}

                      <button
                        id="btn-admin-save-login-logo"
                        type="button"
                        onClick={handleSaveLoginLogo}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Simpan Logo Login</span>
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
