import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserProfile, AuthState } from "../types";
import { saveUserDraft, deleteUserDraft } from "../services/draftStorage";
import {
  sendEmailOtp,
  verifyEmailOtp,
  loginWithRobotVerification,
  SendOtpResult,
  VerifyOtpResult,
  RobotVerifyLoginParams,
  RobotVerifyResult,
} from "../services/emailAuth";

export interface LogoutOptions {
  hardReset?: boolean;
  draftData?: {
    code?: string;
    messages?: any[];
    config?: any;
    databasePreference?: any;
  };
}

interface AuthContextType extends AuthState {
  currentPath: string;
  navigate: (path: string) => void;
  sendOtp: (email: string) => Promise<SendOtpResult>;
  verifyOtp: (email: string, otp: string) => Promise<VerifyOtpResult>;
  loginWithRobot: (params: RobotVerifyLoginParams) => Promise<RobotVerifyResult>;
  logoutUser: (options?: LogoutOptions) => Promise<void>;
  loginAdmin: (accessCode: string, targetRedirect?: string) => Promise<{
    success: boolean;
    error?: string;
    remainingAttempts?: number;
    retryAfterMinutes?: number;
  }>;
  logoutAdmin: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/dashboard";
    }
    return "/dashboard";
  });

  // Client-side Navigation helper that synchronizes with window.history
  const navigate = useCallback((path: string) => {
    if (typeof window !== "undefined") {
      if (window.location.pathname !== path) {
        window.history.pushState({}, "", path);
      }
      setCurrentPath(path);
    }
  }, []);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || "/dashboard");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Fetch initial authentication state (both User and Admin)
  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Check User Session
      const userRes = await fetch("/api/auth/session");
      const userData = await userRes.json();
      if (userRes.ok && userData.user) {
        setUser(userData.user);
      } else {
        setUser(null);
      }

      // 2. Check Admin Session
      const adminRes = await fetch("/api/auth/admin-verify");
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        setIsAdmin(!!adminData.isAdmin);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.warn("Error refreshing auth:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // Send Email OTP / Magic Link
  const handleSendOtp = async (email: string): Promise<SendOtpResult> => {
    return await sendEmailOtp(email);
  };

  // Verify Email OTP
  const handleVerifyOtp = async (email: string, otp: string): Promise<VerifyOtpResult> => {
    const result = await verifyEmailOtp(email, otp);
    if (result.success && result.user) {
      setUser(result.user);
      navigate(result.redirectTo || "/dashboard");
    }
    return result;
  };

  // Login dengan Verifikasi Bukan Robot (Anti-Bot Human Verification)
  const handleLoginWithRobot = async (
    params: RobotVerifyLoginParams
  ): Promise<RobotVerifyResult> => {
    const result = await loginWithRobotVerification(params);
    if (result.success && result.user) {
      setUser(result.user);
      navigate(result.redirectTo || "/dashboard");
    }
    return result;
  };

  // User Logout with Smart Logout & Hard Reset options
  const logoutUser = async (options?: LogoutOptions) => {
    try {
      if (user) {
        if (options?.hardReset) {
          // Hard Reset: Hapus semua draft dan data lokal terkait UID sebelum signOut()
          deleteUserDraft(user);
          try {
            sessionStorage.setItem(
              "ghighais_logout_toast",
              "Anda telah keluar dan seluruh data draft lokal telah dibersihkan secara permanen."
            );
          } catch {}
        } else {
          // Smart Logout: Simpan pekerjaan terakhir di localStorage dengan key [email]_drafts & [email]_projects
          const codeToSave =
            options?.draftData?.code ??
            (typeof window !== "undefined" ? localStorage.getItem("ghighais_app_code") || "" : "");
          let messagesToSave = options?.draftData?.messages;
          if (!messagesToSave && typeof window !== "undefined") {
            try {
              const rawMsg = localStorage.getItem("ghighais_chat_history");
              if (rawMsg) messagesToSave = JSON.parse(rawMsg);
            } catch {}
          }
          saveUserDraft(user, {
            code: codeToSave,
            messages: messagesToSave || [],
            config: options?.draftData?.config,
            databasePreference: options?.draftData?.databasePreference,
          });

          try {
            sessionStorage.setItem(
              "ghighais_logout_toast",
              "Anda telah keluar. Data pekerjaan terakhir tetap tersimpan di perangkat ini."
            );
          } catch {}
        }
      }

      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  // Admin Access Login
  const loginAdmin = async (accessCode: string, targetRedirect?: string) => {
    try {
      // 1. Fetch CSRF token first
      const csrfRes = await fetch("/api/auth/csrf-token");
      const { csrfToken } = await csrfRes.json();

      // 2. Post accessCode + csrfToken to server
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode, csrfToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Invalid credentials",
          remainingAttempts: data.remainingAttempts,
          retryAfterMinutes: data.retryAfterMinutes,
        };
      }

      setIsAdmin(true);
      // Auto-assign admin user profile so studio workspace is immediately accessible
      const adminUserProfile: UserProfile = {
        id: "admin@ghighais.com",
        email: "admin@ghighais.com",
        name: "Admin Ghighais",
        avatar: "/ghighais-logo.jpg",
        provider: "email_otp",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      setUser(adminUserProfile);

      const destination = targetRedirect || "/dashboard";
      navigate(destination);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Invalid credentials" };
    }
  };

  // Admin Logout
  const logoutAdmin = async () => {
    try {
      await fetch("/api/auth/admin-logout", { method: "POST" });
    } catch (err) {
      console.warn("Admin logout error:", err);
    } finally {
      setIsAdmin(false);
      navigate("/admin/access");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        currentPath,
        navigate,
        sendOtp: handleSendOtp,
        verifyOtp: handleVerifyOtp,
        loginWithRobot: handleLoginWithRobot,
        logoutUser,
        loginAdmin,
        logoutAdmin,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
