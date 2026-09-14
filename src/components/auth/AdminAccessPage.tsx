import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff, Lock, ArrowRight, Loader2 } from "lucide-react";

export const AdminAccessPage: React.FC = () => {
  const { loginAdmin, isAdmin, navigate } = useAuth();
  const [accessCode, setAccessCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryMinutes, setRetryMinutes] = useState<number | null>(null);

  // If already authenticated as admin, redirect to /admin/dashboard
  useEffect(() => {
    if (isAdmin) {
      navigate("/admin/dashboard");
    }
  }, [isAdmin, navigate]);

  // Inject meta tag robots: noindex, nofollow dynamically
  useEffect(() => {
    let metaTag = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    let created = false;
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.name = "robots";
      document.head.appendChild(metaTag);
      created = true;
    }
    const previousContent = metaTag.content;
    metaTag.content = "noindex, nofollow";

    return () => {
      if (metaTag) {
        if (created) {
          metaTag.remove();
        } else {
          metaTag.content = previousContent;
        }
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setRetryMinutes(null);

    try {
      const result = await loginAdmin(accessCode.trim());
      if (!result.success) {
        // Generic error without hints as specified by requirement
        setErrorMsg(result.error || "Invalid credentials");
        if (result.retryAfterMinutes) {
          setRetryMinutes(result.retryAfterMinutes);
        }
      }
    } catch {
      setErrorMsg("Invalid credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="page-admin-access"
      className="min-h-screen bg-black text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-slate-700 selection:text-white"
    >
      {/* Minimalist Container - No Navbar, No Footer, No Suspicious Elements */}
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Minimal Subtle Logo */}
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-8 shadow-inner">
          <Lock className="w-4 h-4" />
        </div>

        {/* Single Password Input Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <input
              id="admin-access-code-input"
              type={showPassword ? "text" : "password"}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter access code..."
              autoComplete="off"
              autoFocus
              disabled={isSubmitting || !!retryMinutes}
              className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-slate-600 text-white placeholder-slate-600 text-sm outline-none transition-all font-mono"
            />

            {/* Optional Show/Hide Toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
              title={showPassword ? "Hide" : "Show"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Submit Button */}
          <button
            id="btn-admin-access-submit"
            type="submit"
            disabled={isSubmitting || !accessCode.trim() || !!retryMinutes}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/60"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
            ) : (
              <>
                <span>Authenticate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Error Notification: Generic "Invalid credentials" with rate-limit support */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-xs text-center w-full animate-in fade-in duration-200">
            {retryMinutes ? (
              <span>Too many attempts. Please try again in {retryMinutes} minutes.</span>
            ) : (
              <span>{errorMsg}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
