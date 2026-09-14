import React, { useState, useEffect } from "react";
import { AppConfig, DatabaseSetupPreference } from "../types";
import { LOGO_PRESETS } from "../data/defaultConfig";
import { useAuth } from "../context/AuthContext";
import {
  Download,
  Github,
  Sparkles,
  Columns3,
  Layers,
  RotateCcw,
  Database,
  LogOut,
  ShieldAlert,
  ArrowLeftRight,
  KeyRound,
  Eye,
  EyeOff,
  X,
  Loader2,
  Lock,
  Undo2,
} from "lucide-react";

interface NavbarProps {
  config: AppConfig;
  activeView: "split" | "tabs";
  onToggleView: (view: "split" | "tabs") => void;
  onOpenAdmin: () => void;
  onOpenGitHub: () => void;
  onExportZip: () => void;
  onResetAll: () => void;
  onOpenDatabase?: () => void;
  databasePreference?: DatabaseSetupPreference | null;
  onOpenDeployEngine?: () => void;
  isDeployEngineActive?: boolean;
  onOpenLogoutModal?: () => void;
  undoCount?: number;
  maxUndo?: number;
  onUndoPrompt?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  activeView,
  onToggleView,
  onOpenAdmin,
  onOpenGitHub,
  onExportZip,
  onResetAll,
  onOpenDatabase,
  databasePreference,
  onOpenDeployEngine,
  isDeployEngineActive,
  onOpenLogoutModal,
  undoCount = 0,
  maxUndo = 7,
  onUndoPrompt,
}) => {
  const { user, isAdmin, logoutUser, navigate, loginAdmin } = useAuth();
  const [tapCount, setTapCount] = useState(0);

  // Admin Password Modal state (ketuk logo 5x)
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

  // Handle 5x logo tap logic - Memunculkan form input password admin
  const handleLogoTap = () => {
    const nextCount = tapCount + 1;
    if (nextCount >= 5) {
      setTapCount(0);
      setAdminPassword("");
      setAdminError(null);
      setShowAdminPasswordModal(true);
    } else {
      setTapCount(nextCount);
    }
  };

  // Verifikasi password admin (gh1gh415)
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim() || isAdminSubmitting) return;

    setIsAdminSubmitting(true);
    setAdminError(null);

    try {
      const res = await loginAdmin(adminPassword.trim());
      if (res.success) {
        setShowAdminPasswordModal(false);
        setAdminPassword("");
        // Buka panel konfigurasi admin
        onOpenAdmin();
      } else {
        setAdminError(res.error || "Password salah. Silakan coba lagi.");
      }
    } catch {
      setAdminError("Password salah. Silakan coba lagi.");
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  // Reset tap count after 3.5 seconds of inactivity
  useEffect(() => {
    if (tapCount > 0 && tapCount < 5) {
      const timer = setTimeout(() => {
        setTapCount(0);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [tapCount]);

  // Helper for dynamic text with fallback
  const getText = (key: string, fallback: string) => {
    return config.customTexts[key] || fallback;
  };

  // Render the current logo
  const renderLogoGraphic = () => {
    const objectFitClass =
      config.logoFit === "cover"
        ? "object-cover"
        : config.logoFit === "fill"
        ? "object-fill"
        : config.logoFit === "none"
        ? "object-none"
        : "object-contain";

    const transformStyle = `translate(${config.logoOffsetX || 0}px, ${config.logoOffsetY || 0}px) scale(${config.logoScale || 1}) rotate(${config.logoRotate || 0}deg)`;

    if (config.logoType === "url" && config.logoUrl) {
      return (
        <img
          src={config.logoUrl}
          alt="App Logo"
          className={`w-full h-full ${objectFitClass} rounded-xl`}
          style={{ transform: transformStyle }}
        />
      );
    }
    if (config.logoType === "upload" && config.logoUrl) {
      return (
        <img
          src={config.logoUrl}
          alt="Uploaded Logo"
          className={`w-full h-full ${objectFitClass} rounded-xl`}
          style={{ transform: transformStyle }}
        />
      );
    }

    // Default or selected preset
    const preset =
      LOGO_PRESETS.find((p) => p.id === config.logoPreset) || LOGO_PRESETS[0];

    return (
      <div
        className="w-full h-full flex items-center justify-center p-1 transition-transform duration-200"
        style={{ transform: transformStyle }}
        dangerouslySetInnerHTML={{ __html: preset.svg }}
      />
    );
  };

  return (
    <header
      id="ghighais-main-navbar"
      className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-2.5 transition-all"
    >
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        {/* Logo & Brand Title (Hidden Admin Trigger on 5x Tap) */}
        <div className="flex items-center gap-3 relative shrink-0">
          <div
            id="ghighais-interactive-logo"
            onClick={handleLogoTap}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-900/80 via-slate-800 to-indigo-700/60 border border-indigo-500/40 flex items-center justify-center cursor-pointer select-none transition-all duration-200 hover:scale-105 active:scale-95 shadow-md shadow-indigo-950/50 hover:border-indigo-400 group relative overflow-hidden shrink-0"
          >
            {renderLogoGraphic()}
          </div>

          <div className="flex flex-col select-none">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
                <span>{config.appTitle || getText("brand_title", "Ghighais Brain")}</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-[11px] font-semibold text-indigo-300 shrink-0 whitespace-nowrap">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>{getText("brand_badge", "AI Coder Engine")}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden xs:block whitespace-nowrap">
              {config.appSubtitle || getText("brand_subtitle", "AI Web Generator & Studio")}
            </p>
          </div>
        </div>

        {/* Action Controls - Horizontally Scrollable so tools never break layout */}
        <div className="flex-1 min-w-0 flex justify-end pl-2">
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 px-1 flex-nowrap scroll-smooth max-w-full">
            {/* View Mode Toggle (Split 3-Kolom vs Tabs) */}
            <div className="shrink-0 flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                id="toggle-view-split"
                onClick={() => onToggleView("split")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  activeView === "split"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Tampilkan panel Prompt, Coding, dan Preview secara berdampingan"
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>{getText("btn_view_split", "Split 3 Kolom")}</span>
              </button>
              <button
                id="toggle-view-tabs"
                onClick={() => onToggleView("tabs")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  activeView === "tabs"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Tampilkan panel dengan navigasi tab terfokus"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{getText("btn_view_tabs", "Mode Tab")}</span>
              </button>
            </div>

            {/* Undo Prompt Button (Kembalikan aplikasi ke versi sebelum instruksi salah, max 7x) */}
            {onUndoPrompt && (
              <button
                id="btn-nav-undo-prompt"
                onClick={onUndoPrompt}
                disabled={undoCount === 0}
                className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm active:scale-95 ${
                  undoCount > 0
                    ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 hover:border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.15)] cursor-pointer"
                    : "bg-slate-900/50 text-slate-600 border-slate-800/80 cursor-not-allowed opacity-50"
                }`}
                title={
                  undoCount > 0
                    ? `Undo Prompt: Kembalikan aplikasi ke editan sebelum instruksi salah (Tersisa ${undoCount}/${maxUndo} undo)`
                    : `Batas undo 7x (Belum ada prompt untuk di-undo)`
                }
              >
                <Undo2 className={`w-3.5 h-3.5 ${undoCount > 0 ? "text-amber-400" : "text-slate-600"}`} />
                <span>
                  Undo Prompt {undoCount > 0 ? `(${undoCount}/${maxUndo})` : `(0/${maxUndo})`}
                </span>
              </button>
            )}

            {/* Reset All / Start from scratch button */}
            <button
              id="btn-nav-reset-project"
              onClick={onResetAll}
              className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-all shadow-sm active:scale-95 hover:border-rose-500/50 cursor-pointer"
              title="Reset semua dari awal: kembalikan kode, obrolan, dan status awal"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>{getText("btn_reset_all_project", "Reset Awal")}</span>
            </button>

            {/* Database Setup Button */}
            {onOpenDatabase && (
              <button
                id="btn-nav-database-setup"
                onClick={onOpenDatabase}
                className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer ${
                  databasePreference?.isConnected
                    ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/40 hover:border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
                    : "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 hover:border-amber-500/40"
                }`}
                title="Konfigurasi dan kelola database backend (Supabase, Firebase, Appwrite, Neon, PocketBase, SQLite)"
              >
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {databasePreference?.provider
                    ? `${databasePreference.provider.toUpperCase()} (${databasePreference.isConnected ? "Online" : "Ready"})`
                    : "Database"}
                </span>
              </button>
            )}

            {/* Export ZIP Button */}
            <button
              id="btn-nav-export-zip"
              onClick={onExportZip}
              className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Download seluruh kode dan file sebagai ZIP"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>{getText("btn_export_zip", "Download ZIP")}</span>
            </button>

            {/* Push to GitHub Button */}
            <button
              id="btn-nav-push-github"
              onClick={onOpenGitHub}
              className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Push kode aplikasi ke repository GitHub Anda atau impor dari URL GitHub"
            >
              <Github className="w-3.5 h-3.5" />
              <span>{getText("btn_push_github", "GitHub")}</span>
            </button>

            {/* Admin Mode Badge (if in admin session) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate("/admin/dashboard")}
                className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-red-900/30 border border-amber-400/40 cursor-pointer animate-pulse"
                title="Akses Admin Dashboard"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                <span>ADMIN</span>
              </button>
            )}

            {/* User Profile & Logout Button (Email Auth Session) */}
            {user && (
              <div className="shrink-0 flex items-center gap-2 pl-1 border-l border-slate-800">
                <div
                  className="shrink-0 whitespace-nowrap flex items-center gap-1.5 py-1 px-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                  title={`Masuk sebagai: ${user.name} (${user.email})`}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-5 h-5 rounded-full object-cover border border-indigo-400/30 shrink-0"
                  />
                  <span className="text-slate-300 font-medium max-w-[120px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                </div>

                <button
                  id="btn-navbar-switch-account"
                  type="button"
                  onClick={() => {
                    if (onOpenLogoutModal) {
                      onOpenLogoutModal();
                    } else {
                      logoutUser();
                    }
                  }}
                  className="shrink-0 whitespace-nowrap flex items-center gap-1 p-1.5 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-medium cursor-pointer"
                  title="Ganti Email / Akun"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px]">Ganti Akun</span>
                </button>

                <button
                  id="btn-user-logout"
                  type="button"
                  onClick={() => {
                    if (onOpenLogoutModal) {
                      onOpenLogoutModal();
                    } else {
                      logoutUser();
                    }
                  }}
                  className="shrink-0 flex items-center gap-1.5 p-1.5 px-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 hover:border-rose-500/30 border border-transparent text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
                  title="Keluar (Smart Logout / Hard Reset)"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[11px] font-medium text-slate-300 hover:text-rose-200">Keluar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL PASSWORD ADMIN (Terbuka ketika logo diketuk 5x) */}
      {showAdminPasswordModal && (
        <div
          id="modal-admin-password-backdrop"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 selection:bg-amber-500 selection:text-black"
        >
          <div
            id="modal-admin-password-card"
            className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Masuk Halaman Admin</h3>
                  <p className="text-[11px] text-slate-400">Ketuk logo 5x terdeteksi</p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-admin-password-modal"
                onClick={() => setShowAdminPasswordModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adminError && (
              <div
                id="admin-password-error"
                className="mb-4 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Masukkan Password Admin
                </label>
                <div className="relative">
                  <input
                    id="input-navbar-admin-password"
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (adminError) setAdminError(null);
                    }}
                    placeholder="Masukkan password admin..."
                    autoFocus
                    autoComplete="off"
                    disabled={isAdminSubmitting}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  >
                    {showAdminPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminPasswordModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    id="btn-submit-navbar-admin-password"
                    disabled={isAdminSubmitting || !adminPassword.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 active:to-amber-700 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-amber-950/40"
                  >
                    {isAdminSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memverifikasi...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Masuk Admin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={async () => {
                    if (adminPassword.trim()) {
                      const res = await loginAdmin(adminPassword.trim());
                      if (res.success) {
                        setShowAdminPasswordModal(false);
                        navigate("/admin/dashboard");
                        return;
                      } else {
                        setAdminError(res.error || "Password salah. Silakan coba lagi.");
                        return;
                      }
                    }
                    setShowAdminPasswordModal(false);
                    navigate("/admin/access");
                  }}
                  className="text-[11px] text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Buka Dashboard Kontrol (/admin/dashboard)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
