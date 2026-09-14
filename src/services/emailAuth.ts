// Service for Email Magic Link & 6-Digit OTP Authentication
// Completely replaces Google OAuth with zero-config email authentication

export interface SendOtpResult {
  success: boolean;
  message: string;
  email: string;
  expiresInSeconds?: number;
  previewOtp?: string;
  magicLink?: string;
  error?: string;
  retryAfterSeconds?: number;
  devMode?: boolean;
  diagnostics?: any;
}

export interface VerifyOtpResult {
  success: boolean;
  user?: any;
  error?: string;
  redirectTo?: string;
}

export async function sendEmailOtp(email: string): Promise<SendOtpResult> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return {
      success: false,
      message: "Format email tidak valid. Masukkan alamat email yang benar.",
      email: cleanEmail,
      error: "Format email tidak valid.",
    };
  }

  try {
    console.log(`[AUTH CLIENT] 📡 Mengirim request POST /api/auth/send-otp untuk email: ${cleanEmail}`);
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail }),
    });

    const data = await res.json();
    console.log(`[AUTH CLIENT] 📥 Respon /api/auth/send-otp (Status ${res.status}):`, data);

    if (data.devMode || data.previewOtp) {
      console.log(`%c[DEV MODE OTP] 🔑 Kode OTP Testing: ${data.previewOtp || "123456"}`, "color: #10b981; font-weight: bold; font-size: 14px;");
    }

    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || "Gagal mengirim kode masuk.",
        email: cleanEmail,
        error: data.error,
        retryAfterSeconds: data.retryAfterSeconds,
        diagnostics: data.diagnostics,
      };
    }

    return {
      success: true,
      message: data.message || `Kode verifikasi telah dikirim ke ${cleanEmail}`,
      email: cleanEmail,
      expiresInSeconds: data.expiresInSeconds || 300,
      previewOtp: data.previewOtp || (data.devMode ? "123456" : undefined),
      magicLink: data.magicLink,
      devMode: data.devMode,
      diagnostics: data.diagnostics,
    };
  } catch (err: any) {
    console.error("[AUTH CLIENT] ❌ Gagal terhubung ke endpoint /api/auth/send-otp:", err);
    return {
      success: false,
      message: "Gagal terhubung ke server autentikasi.",
      email: cleanEmail,
      error: err.message,
    };
  }
}

export async function verifyEmailOtp(email: string, otp: string): Promise<VerifyOtpResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim().replace(/\D/g, "");

  if (!cleanEmail) {
    return { success: false, error: "Email wajib diisi." };
  }
  if (!cleanOtp || cleanOtp.length !== 6) {
    return { success: false, error: "Masukkan 6 digit kode OTP yang valid." };
  }

  try {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Kode OTP tidak valid atau telah kedaluwarsa.",
      };
    }

    return {
      success: true,
      user: data.user,
      redirectTo: data.redirectTo || "/dashboard",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memverifikasi kode OTP.",
    };
  }
}

export interface RobotVerifyLoginParams {
  name: string;
  email?: string;
  captchaToken: string;
  challengeId?: string;
  challengeAnswer?: string;
}

export interface RobotVerifyResult {
  success: boolean;
  user?: any;
  error?: string;
  redirectTo?: string;
}

export async function loginWithRobotVerification(
  params: RobotVerifyLoginParams
): Promise<RobotVerifyResult> {
  try {
    const res = await fetch("/api/auth/robot-verify-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Verifikasi bukan robot gagal. Silakan coba lagi.",
      };
    }

    return {
      success: true,
      user: data.user,
      redirectTo: data.redirectTo || "/dashboard",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal terhubung ke server autentikasi.",
    };
  }
}

export async function fetchCaptchaChallenge(): Promise<{
  success: boolean;
  challengeId: string;
  question: string;
  token: string;
} | null> {
  try {
    const res = await fetch("/api/auth/captcha-challenge");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
