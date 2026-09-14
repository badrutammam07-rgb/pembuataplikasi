import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { AppConfig } from "../../types";
import {
  ShieldCheck,
  Loader2,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface LoginPageProps {
  config: AppConfig;
}

export const LoginPage: React.FC<LoginPageProps> = ({ config }) => {
  const { loginWithRobot, loginAdmin } = useAuth();

  // Robot verification state
  const [isVerifyingCaptcha, setIsVerifyingCaptcha] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Admin secret logo-tap state (5-tap trigger)
  const [logoTapCount, setLogoTapCount] = useState(0);
  const logoTapTimerRef = useRef<any>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Active logo for login page
  const loginLogoSrc = config.loginLogoUrl || config.logoUrl || "/ghighais-logo.jpg";

  // Handle Klik "Saya bukan robot"
  const handleVerifyRobot = async () => {
    if (isVerifyingCaptcha || isCaptchaVerified || isRedirecting) return;

    setErrorMsg(null);
    setIsVerifyingCaptcha(true);

    try {
      // Human interaction delay simulation
      await new Promise((resolve) => setTimeout(resolve, 650));

      setIsVerifyingCaptcha(false);
      setIsCaptchaVerified(true);
      setIsRedirecting(true);

      // Otomatis login dan arahkan langsung ke halaman utama/studio
      const generatedToken = `token_human_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const result = await loginWithRobot({
        name: "Pengguna Studio",
        captchaToken: generatedToken,
      });

      if (!result.success) {
        setIsCaptchaVerified(false);
        setIsRedirecting(false);
        setErrorMsg(result.error || "Verifikasi gagal. Silakan coba klik kembali.");
      }
    } catch (err: any) {
      setIsCaptchaVerified(false);
      setIsRedirecting(false);
      setErrorMsg(err.message || "Gagal memverifikasi. Silakan coba lagi.");
    }
  };

  // Secret 5-Tap on Logo to open Master Admin Modal (rescue / backup admin login)
  const handleLogoTap = () => {
    if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current);
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);

    if (newCount >= 5) {
      setLogoTapCount(0);
      setShowAdminModal(true);
      setAdminError(null);
      setAdminPassword("");
    } else {
      logoTapTimerRef.current = setTimeout(() => {
        setLogoTapCount(0);
      }, 2500);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setAdminError("Masukkan Password Master.");
      return;
    }
    setIsAdminSubmitting(true);
    setAdminError(null);

    const res = await loginAdmin(adminPassword, "/dashboard");
    setIsAdminSubmitting(false);

    if (res.success) {
      setShowAdminModal(false);
    } else {
      setAdminError(res.error || "Password Master tidak valid.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-sm bg-slate-900/80 border border-slate-800/90 rounded-3xl p-8 sm:p-9 shadow-2xl backdrop-blur-xl relative z-10 flex flex-col items-center text-center">
        {/* LOGO (Klik 5x untuk Master Admin) */}
        <div
          id="brand-logo-button"
          onClick={handleLogoTap}
          title="Klik logo"
          className="relative cursor-pointer group active:scale-95 transition-transform mb-4"
        >
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-xl border border-slate-700/80 bg-slate-800/80 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors">
            <img
              src={loginLogoSrc}
              alt="Ghighais Brain Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <Sparkles className="w-10 h-10 text-indigo-400 fallback-icon" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
          {config.appTitle || "Ghighais Brain"}
        </h1>
        <p className="text-xs text-slate-400 mb-8">
          {config.appSubtitle || "AI Web Generator & Studio"}
        </p>

        {/* Error Alert if any */}
        {errorMsg && (
          <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-300 animate-in fade-in duration-200 text-left">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* VERIFIKASI BUKAN ROBOT ONLY */}
        <div className="w-full">
          <div
            id="captcha-verification-box"
            onClick={handleVerifyRobot}
            className={`w-full p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-lg ${
              isCaptchaVerified
                ? "bg-emerald-950/25 border-emerald-500/50 shadow-emerald-500/10"
                : isVerifyingCaptcha
                ? "bg-slate-950/90 border-indigo-500/50"
                : "bg-slate-950/70 border-slate-700/80 hover:border-slate-600 hover:bg-slate-950/90 active:scale-[0.99]"
            }`}
          >
            {/* Checkbox Section */}
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                aria-label="Saya bukan robot"
                className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                  isCaptchaVerified
                    ? "bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30 scale-105"
                    : isVerifyingCaptcha
                    ? "border-indigo-500 bg-indigo-500/15"
                    : "border-slate-500 bg-slate-900 hover:border-indigo-400"
                }`}
              >
                {isVerifyingCaptcha ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                ) : isCaptchaVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-white animate-in zoom-in-50 duration-200" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-sm bg-transparent" />
                )}
              </button>

              <div className="text-left">
                <span className="text-sm font-semibold text-slate-200 block">
                  Saya bukan robot
                </span>
                <span className="text-[11px] text-slate-400">
                  {isRedirecting ? (
                    <span className="text-emerald-400 font-medium animate-pulse">
                      Mengalihkan ke Studio...
                    </span>
                  ) : isVerifyingCaptcha ? (
                    "Memeriksa keamanan..."
                  ) : (
                    "Klik untuk masuk"
                  )}
                </span>
              </div>
            </div>

            {/* Anti-Bot Seal */}
            <div className="flex flex-col items-end text-right pl-3 border-l border-slate-800">
              <div className="flex items-center gap-1 text-indigo-400 mb-0.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-bold tracking-wider uppercase">Anti-Bot</span>
              </div>
              <span className="text-[9px] text-slate-500">Privasi & Keamanan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 text-center text-xs text-slate-600 select-none">
        <span>{config.permanentFooterText || "SUPPORT BY GHIGHAIS DEVELOPMENT"}</span>
      </div>

      {/* MASTER ADMIN MODAL (Triggered via 5-tap on logo) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">Login Password Master</h3>
                  <p className="text-[11px] text-slate-400">Masuk langsung ke halaman utama</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adminError && (
              <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">
                {adminError}
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Password Master
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Masukkan password master"
                    autoFocus
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showAdminPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAdminSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAdminSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Masuk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
