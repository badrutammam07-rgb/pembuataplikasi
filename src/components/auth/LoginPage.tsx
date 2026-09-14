import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { AppConfig } from "../../types";
import {
  ShieldCheck,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface LoginPageProps {
  config: AppConfig;
}

export const LoginPage: React.FC<LoginPageProps> = ({ config }) => {
  const { loginWithRobot, loginAdmin } = useAuth();

  // Verification state: unverified -> verified (ceklis) -> open
  const [isChecked, setIsChecked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Admin secret logo-tap state (5-tap trigger for emergency master admin)
  const [logoTapCount, setLogoTapCount] = useState(0);
  const logoTapTimerRef = useRef<any>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Active logo for login page with dynamic size and styling configured by admin
  const [activeConfig, setActiveConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem("ghighais_app_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...config, ...parsed };
      }
    } catch {}
    return config;
  });

  useEffect(() => {
    setActiveConfig(config);
  }, [config]);

  // Fetch /api/app-config if not yet set to guarantee latest server branding
  useEffect(() => {
    fetch("/api/app-config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.config) {
          setActiveConfig((prev) => ({ ...prev, ...data.config }));
        }
      })
      .catch(() => {});
  }, []);

  const effectiveConfig = activeConfig || config;
  const loginLogoSrc = effectiveConfig.loginLogoUrl || effectiveConfig.logoUrl || "/ghighais-logo.jpg";
  const loginLogoSize = effectiveConfig.loginLogoSize || effectiveConfig.logoSize || 96;
  const objectFit =
    effectiveConfig.logoFit === "cover"
      ? "object-cover"
      : effectiveConfig.logoFit === "fill"
      ? "object-fill"
      : "object-contain";

  const shadowFilter =
    effectiveConfig.logoShadowEffect === "none"
      ? "none"
      : effectiveConfig.logoShadowEffect === "soft"
      ? "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25))"
      : effectiveConfig.logoShadowEffect === "glow"
      ? "drop-shadow(0 0 20px rgba(99, 102, 241, 0.45))"
      : "drop-shadow(0 10px 24px rgba(0, 0, 0, 0.45))";

  const borderRadiusStyle =
    config.logoBorderRadius === "none"
      ? "0px"
      : config.logoBorderRadius === "md"
      ? "12px"
      : config.logoBorderRadius === "xl"
      ? "18px"
      : config.logoBorderRadius === "full"
      ? "9999px"
      : "24px";

  // Klik verifikasi: Langsung ceklis dan langsung buka aplikasi tanpa kode
  const handleCheck = async () => {
    if (isChecked || isProcessing) return;

    // 1. Tampilkan ceklis seketika
    setIsChecked(true);
    setIsProcessing(true);

    // 2. Langsung buka aplikasi tanpa kode apa pun
    setTimeout(async () => {
      await loginWithRobot({
        name: "Pengguna Studio",
        captchaToken: "human_verified_" + Date.now(),
      });
    }, 280);
  };

  // Ketuk logo 5x untuk memunculkan Halaman Password Admin
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
      }, 3500);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adminPassword.trim();
    if (!trimmed) {
      setAdminError("Masukkan Password Admin.");
      return;
    }
    setIsAdminSubmitting(true);
    setAdminError(null);

    const res = await loginAdmin(trimmed, "/admin");
    setIsAdminSubmitting(false);

    if (res.success) {
      setShowAdminModal(false);
    } else {
      setAdminError(res.error || "Password salah. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      {/* Subtle Ambient Background Light */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container: HANYA LOGO DAN VERIFIKASI BUKAN ROBOT */}
      <div className="w-full max-w-sm bg-slate-900/90 border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10 flex flex-col items-center text-center">
        {/* LOGO BEBAS TANPA BATAS KOTAK & TANPA DIBERI KOTAK (Ketuk 5x untuk Masuk Halaman Password Admin) */}
        <div
          id="brand-logo-button"
          onClick={handleLogoTap}
          title="Ketuk logo 5x untuk Masuk Halaman Admin"
          className="relative cursor-pointer active:scale-95 transition-transform mb-7 flex items-center justify-center group"
          style={{
            maxWidth: "100%",
          }}
        >
          <img
            src={loginLogoSrc}
            alt="Logo Aplikasi"
            className="transition-all duration-300 select-none pointer-events-auto"
            style={{
              width: `${loginLogoSize}px`,
              maxWidth: "100%",
              height: "auto",
              maxHeight: `${Math.max(loginLogoSize * 1.5, 400)}px`,
              objectFit: objectFit as any,
              filter: shadowFilter,
            }}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (!img.src.endsWith("/ghighais-logo.jpg")) {
                img.src = "/ghighais-logo.jpg";
              }
            }}
          />
        </div>

        {/* KOTAK VERIFIKASI BUKAN ROBOT: Sekali klik langsung ceklis & langsung kebuka */}
        <div className="w-full">
          <div
            id="captcha-verification-box"
            onClick={handleCheck}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCheck();
              }
            }}
            className={`w-full p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none shadow-lg ${
              isChecked
                ? "bg-emerald-950/30 border-emerald-500/60 shadow-emerald-500/10"
                : "bg-slate-950/80 border-slate-700/80 hover:border-slate-500 hover:bg-slate-950 active:scale-[0.99]"
            }`}
          >
            {/* Sisi Kiri: Kotak Ceklis & Tulisan "Saya bukan robot" */}
            <div className="flex items-center gap-3.5">
              <div
                aria-label="Saya bukan robot"
                className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                  isChecked
                    ? "bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/40 scale-105"
                    : "border-slate-500 bg-slate-900 hover:border-indigo-400"
                }`}
              >
                {isChecked ? (
                  <CheckCircle2 className="w-5 h-5 text-white animate-in zoom-in-50 duration-200" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-sm bg-transparent" />
                )}
              </div>

              <div className="text-left">
                <span className="text-sm font-semibold text-slate-200 block">
                  Saya bukan robot
                </span>
                <span className="text-[11px] text-slate-400">
                  {isChecked ? (
                    <span className="text-emerald-400 font-medium">Terverifikasi ✓ Membuka...</span>
                  ) : (
                    "Klik untuk verifikasi"
                  )}
                </span>
              </div>
            </div>

            {/* Sisi Kanan: Lambang Anti-Bot */}
            <div className="flex flex-col items-end text-right pl-3 border-l border-slate-800/90">
              <div className="flex items-center gap-1 text-indigo-400 mb-0.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-bold tracking-wider uppercase">Anti-Bot</span>
              </div>
              <span className="text-[9px] text-slate-500">Keamanan</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PASSWORD ADMIN (Muncul ketika diketuk logo 5x) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-100 text-sm">Halaman Password Admin</h3>
                  <p className="text-[11px] text-slate-400">Masukkan password untuk masuk halaman admin</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adminError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                {adminError}
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="text-left">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password Admin
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Masukkan password admin"
                    autoFocus
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
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
                  className="px-3.5 py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAdminSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-500/20"
                >
                  {isAdminSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Masuk Halaman Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
