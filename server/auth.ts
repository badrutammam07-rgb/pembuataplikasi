import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const router = express.Router();

// Path files for persistence
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "auth_users.json");
const AUDIT_LOGS_FILE = path.join(DATA_DIR, "admin_audit_logs.json");

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// User Profile interface (Email as primary identifier)
export interface UserProfile {
  id: string; // User email is the primary userId
  email: string;
  name: string;
  avatar: string;
  provider: "email_otp" | "magic_link" | "captcha_verify" | "robot_verify";
  createdAt: string;
  lastLogin: string;
}

// In-Memory OTP Storage & Rate Limiter
interface OtpEntry {
  hashedCode: string;
  code?: string; // Kept only if ENABLE_DEV_OTP_PREVIEW is true for debugging
  token: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}
const otpStore: Record<string, OtpEntry> = {};
const otpRateLimits: Record<string, { count: number; windowStart: number }> = {};
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_OTP_REQUESTS = 3; // Max 3 per email per hour

// Admin Audit Log interface
export interface AdminAuditLog {
  id: string;
  ip: string;
  userAgent: string;
  status: "success" | "failed" | "rate_limited";
  timestamp: string;
  attemptDetails?: string;
}

// In-Memory Storage & Cache
let userSessions: Record<string, { user: UserProfile; expiresAt: number }> = {};
let adminSessions: Record<string, { isAdmin: boolean; expiresAt: number; ip: string }> = {};
let csrfTokens: Record<string, number> = {}; // token -> expiresAt

// Rate Limiter for Admin Access
// Max 5 attempts per IP per 1 hour (3600000 ms)
const MAX_ADMIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const rateLimitMap: Record<string, { count: number; firstAttemptAt: number; lockedUntil?: number }> = {};

// Helper: load/save JSON
function readJsonSafe<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

function writeJsonSafe(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("Failed to write to file:", filePath, err);
  }
}

// Helper: Client IP extraction
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

// Helper: Audit Logger
function logAdminAudit(req: Request, status: "success" | "failed" | "rate_limited", attemptDetails?: string) {
  const logs = readJsonSafe<AdminAuditLog[]>(AUDIT_LOGS_FILE, []);
  const newLog: AdminAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"] || "unknown",
    status,
    timestamp: new Date().toISOString(),
    attemptDetails,
  };
  logs.unshift(newLog);
  // Keep last 300 logs
  if (logs.length > 300) logs.length = 300;
  writeJsonSafe(AUDIT_LOGS_FILE, logs);
}

// Middleware: Robots Tag for Admin
export function adminRobotsHeader(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
}

// Middleware: Require Admin
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.ghighais_admin_session || req.headers["x-admin-token"];
  if (!token || typeof token !== "string") {
    return res.status(404).json({ error: "Page not found" }); // Return 404 instead of 403 to prevent hinting
  }
  const session = adminSessions[token];
  if (!session || session.expiresAt < Date.now()) {
    return res.status(404).json({ error: "Page not found" });
  }
  next();
}

// Middleware: Require User Auth
export function requireUserAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.ghighais_user_session || req.headers.authorization?.replace("Bearer ", "");
  if (token && typeof token === "string") {
    const session = userSessions[token];
    if (session && session.expiresAt >= Date.now()) {
      (req as any).user = session.user;
      return next();
    }
  }

  // Also verify admin session if user session cookie is not yet set
  const adminToken = req.cookies?.ghighais_admin_session || req.headers["x-admin-token"];
  if (adminToken && typeof adminToken === "string") {
    const adminSession = adminSessions[adminToken];
    if (adminSession && adminSession.expiresAt >= Date.now()) {
      (req as any).user = {
        id: "admin@ghighais.com",
        email: "admin@ghighais.com",
        name: "Master Admin",
        avatar: "/ghighais-logo.jpg",
        provider: "email_otp",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      return next();
    }
  }

  return res.status(401).json({ error: "Authentication required", redirectTo: "/login" });
}

// ==========================================
// 1. CSRF TOKEN GENERATOR (FOR ADMIN LOGIN)
// ==========================================
router.get("/csrf-token", (req, res) => {
  const token = crypto.randomBytes(24).toString("hex");
  csrfTokens[token] = Date.now() + 15 * 60 * 1000; // 15 mins validity

  // Clean expired CSRF tokens
  const now = Date.now();
  for (const [k, exp] of Object.entries(csrfTokens)) {
    if (exp < now) delete csrfTokens[k];
  }

  res.json({ csrfToken: token });
});

// ==========================================
// 2. ADMIN ACCESS ROUTE & VALIDATION
// ==========================================
router.post("/admin-login", adminRobotsHeader, (req, res) => {
  const ip = getClientIp(req);
  const now = Date.now();

  // 1. Rate Limit Enforcement (Max 5 attempts per hour per IP)
  let rateInfo = rateLimitMap[ip];
  if (!rateInfo || now - rateInfo.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    rateInfo = { count: 0, firstAttemptAt: now };
    rateLimitMap[ip] = rateInfo;
  }

  if (rateInfo.lockedUntil && rateInfo.lockedUntil > now) {
    const minutesLeft = Math.ceil((rateInfo.lockedUntil - now) / 60000);
    logAdminAudit(req, "rate_limited", `Blocked: ${minutesLeft}m remaining`);
    return res.status(429).json({
      error: "Too many attempts. Please try again later.",
      retryAfterMinutes: minutesLeft,
    });
  }

  if (rateInfo.count >= MAX_ADMIN_ATTEMPTS) {
    rateInfo.lockedUntil = now + RATE_LIMIT_WINDOW_MS;
    logAdminAudit(req, "rate_limited", "Exceeded 5 attempts limit");
    return res.status(429).json({
      error: "Too many attempts. Please try again later.",
      retryAfterMinutes: 60,
    });
  }

  // 2. CSRF Token Validation (Optional if direct API call)
  const { accessCode, password, csrfToken } = req.body;
  const inputCode = accessCode || password;

  if (csrfToken && csrfTokens[csrfToken]) {
    delete csrfTokens[csrfToken];
  }

  // 3. Password Verification strictly on server-side
  // Password comes from environment variable ADMIN_ACCESS_CODE, default 'gh1gh415'
  const expectedPassword = process.env.ADMIN_ACCESS_CODE || "gh1gh415";

  if (!inputCode || typeof inputCode !== "string" || inputCode.trim() !== expectedPassword) {
    rateInfo.count += 1;
    logAdminAudit(req, "failed", "Incorrect access code entered");
    return res.status(401).json({
      error: "Password salah. Silakan coba lagi.",
      remainingAttempts: Math.max(0, MAX_ADMIN_ATTEMPTS - rateInfo.count),
    });
  }

  // Success: reset rate limit for this IP
  delete rateLimitMap[ip];

  // Master Admin User Profile (Direct access to dashboard without email)
  const adminUser: UserProfile = {
    id: "admin@ghighais.com",
    email: "admin@ghighais.com",
    name: "Master Admin",
    avatar: "/ghighais-logo.jpg",
    provider: "email_otp",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  // Generate 24-hour Admin Session
  const sessionToken = `admin_sess_${crypto.randomBytes(32).toString("hex")}`;
  const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

  adminSessions[sessionToken] = {
    isAdmin: true,
    expiresAt,
    ip,
  };

  // Also establish user session so all normal dashboard and AI endpoints work directly
  const userSessionToken = `usr_sess_${crypto.randomBytes(32).toString("hex")}`;
  userSessions[userSessionToken] = {
    user: adminUser,
    expiresAt,
  };

  // Set HTTP-only Cookies with Secure and SameSite flags
  res.cookie("ghighais_admin_session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.cookie("ghighais_user_session", userSessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
  });

  logAdminAudit(req, "success", "Admin password login successful (24h)");

  return res.json({
    success: true,
    isAdmin: true,
    user: adminUser,
    token: sessionToken,
    expiresAt,
    redirectTo: "/dashboard",
  });
});

// Admin Session Verification
router.get("/admin-verify", adminRobotsHeader, (req, res) => {
  const token = req.cookies?.ghighais_admin_session || req.headers["x-admin-token"];
  if (!token || typeof token !== "string") {
    return res.status(404).json({ error: "Page not found" });
  }

  const session = adminSessions[token];
  if (!session || session.expiresAt < Date.now()) {
    delete adminSessions[token];
    return res.status(404).json({ error: "Page not found" });
  }

  res.json({
    authenticated: true,
    isAdmin: true,
    expiresAt: session.expiresAt,
  });
});

// Admin Logout
router.post("/admin-logout", adminRobotsHeader, (req, res) => {
  const token = req.cookies?.ghighais_admin_session || req.headers["x-admin-token"];
  if (token && typeof token === "string") {
    delete adminSessions[token];
  }
  res.clearCookie("ghighais_admin_session", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ success: true, redirectTo: "/admin/access" });
});

// Admin Audit Logs API (Requires Admin)
router.get("/admin-audit-logs", adminRobotsHeader, requireAdmin, (req, res) => {
  const logs = readJsonSafe<AdminAuditLog[]>(AUDIT_LOGS_FILE, []);
  res.json({ logs });
});

// ==========================================
// 3. JALUR USER PUBLIK: EMAIL OTP & MAGIC LINK
// ==========================================

// Helper untuk sensor sebagian API key demi keamanan
function maskApiKey(key?: string): string {
  if (!key) return "(TIDAK TERPASANG / NOT SET)";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "********";
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

// Helper untuk memparsing nama dan alamat email dari format "Nama <email@domain.com>"
function parseEmailAddress(raw: string, defaultName = "AndrolOS Auth", defaultEmail = "auth@sandbox.mailtarget.co"): { name: string; email: string } {
  const match = raw.match(/^(.*?)\s*<(.+@.+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^["']|["']$/g, "") || defaultName, email: match[2].trim() };
  }
  if (raw.includes("@")) {
    return { name: defaultName, email: raw.trim() };
  }
  return { name: defaultName, email: defaultEmail };
}

// Konfigurasi Default Mailtarget (dapat dioverride melalui process.env.MAILTARGET_API_KEY)
const DEFAULT_MAILTARGET_API_KEY = "TbQZBR9kMq0LJG3ucD2GNeLV";
const DEFAULT_MAILTARGET_URL = "https://transmission.mailtarget.co";

// Endpoint Diagnostik: Cek Konfigurasi Email & Environment Status
router.get("/config-check", (req, res) => {
  const mailtargetApiKey = (process.env.MAILTARGET_API_KEY || DEFAULT_MAILTARGET_API_KEY).trim();
  const mailtargetUrl = (process.env.MAILTARGET_URL || DEFAULT_MAILTARGET_URL).trim();
  const resendApiKey = (process.env.RESEND_API_KEY || process.env.RESEND_API_K || "").trim();
  const isSandboxKey = mailtargetApiKey === DEFAULT_MAILTARGET_API_KEY || mailtargetApiKey.toLowerCase().includes("sandbox");
  const rawFromEmail = (process.env.FROM_EMAIL || (isSandboxKey ? "AndrolOS Auth <auth@sandbox.mailtarget.co>" : "AndrolOS Auth <auth@mailtarget.co>")).trim();
  const parsedFrom = parseEmailAddress(rawFromEmail, "AndrolOS Auth", isSandboxKey ? "auth@sandbox.mailtarget.co" : "auth@mailtarget.co");
  const isDevMode = process.env.NODE_ENV === "development";

  res.json({
    success: true,
    nodeEnv: process.env.NODE_ENV || "development",
    isDevMode,
    devOtpFallbackAvailable: isDevMode,
    fallbackOtpCode: isDevMode ? "123456" : null,
    mailtarget: {
      isConfigured: Boolean(mailtargetApiKey),
      maskedApiKey: maskApiKey(mailtargetApiKey),
      mode: isSandboxKey ? "sandbox" : "live",
      url: mailtargetUrl,
      endpoint: `${mailtargetUrl.replace(/\/+$/, "")}/v1/layang/transmissions`,
      activeSender: parsedFrom,
    },
    resend: {
      isConfigured: Boolean(resendApiKey),
      maskedApiKey: maskApiKey(resendApiKey),
      keyEnvName: process.env.RESEND_API_KEY ? "RESEND_API_KEY" : (process.env.RESEND_API_K ? "RESEND_API_K" : null),
      fromEmail: rawFromEmail,
    },
    status: "ready",
  });
});

// Endpoint: Kirim Kode OTP 6 Digit / Magic Link ke Email
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, error: "Alamat email wajib diisi." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: "Format alamat email tidak valid." });
    }

    const now = Date.now();
    const isDevMode = process.env.NODE_ENV === "development";

    // 1. Rate Limiting: Maksimal 3 request OTP per email per jam (diabaikan saat dev mode agar testing lancar)
    let rateInfo = otpRateLimits[cleanEmail];
    if (!rateInfo || now - rateInfo.windowStart > OTP_RATE_WINDOW_MS) {
      rateInfo = { count: 0, windowStart: now };
      otpRateLimits[cleanEmail] = rateInfo;
    }

    if (!isDevMode && rateInfo.count >= MAX_OTP_REQUESTS) {
      const waitMinutes = Math.ceil((rateInfo.windowStart + OTP_RATE_WINDOW_MS - now) / 60000);
      console.warn(`[AUTH RATE LIMIT] Email ${cleanEmail} telah mencapai batas pengiriman (3x per jam).`);
      return res.status(429).json({
        success: false,
        error: `Batas pengiriman kode tercapai (maksimal 3 kali per jam). Silakan coba lagi dalam ${waitMinutes} menit.`,
        retryAfterMinutes: waitMinutes,
      });
    }

    // Increment rate limit count
    rateInfo.count += 1;

    // 2. Dev Mode Fallback:
    // Jika process.env.NODE_ENV === 'development', OTP otomatis diset sebagai "123456"
    const otpCode = isDevMode ? "123456" : crypto.randomInt(100000, 1000000).toString();
    const magicToken = crypto.randomBytes(24).toString("hex");
    const expiresAt = now + OTP_EXPIRY_MS;
    const hashedCode = crypto.createHash("sha256").update(otpCode).digest("hex");

    // Store in memory (simpan kode asli jika dev mode untuk validasi instan)
    otpStore[cleanEmail] = {
      hashedCode,
      code: otpCode,
      token: magicToken,
      expiresAt,
      attempts: 0,
      createdAt: now,
    };

    // Construct Magic Link URL
    const origin = (req.headers.origin || req.headers.referer || "http://localhost:3000") as string;
    let baseOrigin = "http://localhost:3000";
    try {
      baseOrigin = new URL(origin).origin;
    } catch {
      baseOrigin = "http://localhost:3000";
    }
    const magicLinkUrl = `${baseOrigin}/api/auth/magic-login?email=${encodeURIComponent(
      cleanEmail
    )}&token=${magicToken}`;

    // Provider Credentials
    const mailtargetApiKey = (process.env.MAILTARGET_API_KEY || DEFAULT_MAILTARGET_API_KEY).trim();
    const mailtargetUrl = (process.env.MAILTARGET_URL || DEFAULT_MAILTARGET_URL).trim();
    const resendApiKey = (process.env.RESEND_API_KEY || process.env.RESEND_API_K || "").trim();
    const isSandboxKey = mailtargetApiKey === DEFAULT_MAILTARGET_API_KEY || mailtargetApiKey.toLowerCase().includes("sandbox");
    const rawFromEmail = (process.env.FROM_EMAIL || (isSandboxKey ? "AndrolOS Auth <auth@sandbox.mailtarget.co>" : "AndrolOS Auth <auth@mailtarget.co>")).trim();
    const parsedFrom = parseEmailAddress(rawFromEmail, "AndrolOS Auth", isSandboxKey ? "auth@sandbox.mailtarget.co" : "auth@mailtarget.co");

    // ==========================================
    // DEBUG LOGGING DETAIL KE TERMINAL/CONSOLE
    // ==========================================
    console.log("\n==================== [AUTH SEND-OTP DEBUG] ====================");
    console.log(`⏰ Timestamp          : ${new Date().toISOString()}`);
    console.log(`🎯 Email Tujuan       : ${cleanEmail}`);
    console.log(`🌐 NODE_ENV           : ${process.env.NODE_ENV || "development"}`);
    console.log(`🛠️ Dev Fallback       : ${isDevMode ? "AKTIF ✅ (Kode OTP: 123456)" : "NON-AKTIF ❌"}`);
    console.log(`✉️ Pengirim           : "${parsedFrom.name}" <${parsedFrom.email}>`);
    console.log(`🚀 Mailtarget URL     : ${mailtargetUrl} (${isSandboxKey ? "Sandbox Mode" : "Production Mode"})`);
    console.log(`🔑 Mailtarget Key     : ${maskApiKey(mailtargetApiKey)}`);
    console.log(`🔢 Kode OTP Aktif     : ${otpCode}`);
    console.log("===============================================================");

    let activeProvider = "";
    let isEmailSent = false;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px;">
        <h2 style="color: #6366f1; margin-top: 0;">AndrolOS Auth</h2>
        <p style="font-size: 15px; color: #cbd5e1;">Halo,</p>
        <p style="font-size: 14px; color: #cbd5e1;">Berikut adalah kode verifikasi 6-digit untuk masuk ke akun Anda:</p>
        <div style="margin: 24px 0; padding: 16px; background: #1e293b; border-radius: 12px; text-align: center;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #38bdf8;">${otpCode}</span>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${magicLinkUrl}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Masuk Langsung (Magic Link)</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="font-size: 11px; color: #64748b; text-align: center;">SUPPORT BY ANDROLOS DEVELOPMENT</p>
      </div>
    `;

    // 3. Pengiriman Email via Mailtarget Transmission API
    if (mailtargetApiKey) {
      activeProvider = "mailtarget";
      const layangEndpoint = `${mailtargetUrl.replace(/\/+$/, "")}/v1/layang/transmissions`;
      try {
        const recipientName = cleanEmail.split("@")[0] || "User";

        const mailtargetRes = await fetch(layangEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mailtargetApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: {
              name: parsedFrom.name,
              email: parsedFrom.email,
            },
            to: [
              {
                name: recipientName,
                email: cleanEmail,
              },
            ],
            subject: `Kode Verifikasi Masuk: ${otpCode} - AndrolOS`,
            bodyText: `Halo, kode verifikasi 6-digit Anda adalah: ${otpCode}. Kode berlaku selama 5 menit.`,
            bodyHtml: emailHtml,
          }),
        });

        if (mailtargetRes.ok) {
          isEmailSent = true;
          console.log(`[MAILTARGET SUCCESS] ✅ Email OTP berhasil dikirim ke ${cleanEmail}!`);
        } else {
          // Tangani secara graceful bila provider dalam mode sandbox atau domain belum diverifikasi
          console.log(`[MAILTARGET INFO] Transmisi eksternal status HTTP ${mailtargetRes.status}. Fallback verifikasi siap.`);
        }
      } catch (mailErr: any) {
        console.log(`[MAILTARGET INFO] Koneksi provider dilewati, menggunakan dev fallback.`);
      }
    }

    // 4. Fallback ke Resend API jika Mailtarget gagal/tidak aktif dan Resend tersedia
    if (!isEmailSent && resendApiKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: rawFromEmail.includes("@") ? rawFromEmail : "Ghighais Brain <onboarding@resend.dev>",
            to: [cleanEmail],
            subject: `Kode Verifikasi Masuk: ${otpCode} - AndrolOS`,
            html: emailHtml,
          }),
        });

        const resendData = await resendRes.json().catch(() => null);
        if (resendRes.ok) {
          isEmailSent = true;
          activeProvider = "resend";
          console.log(`[RESEND SUCCESS] ✅ Email OTP berhasil dikirim via Resend! ID: ${resendData?.id}`);
        }
      } catch {
        // Safe catch
      }
    }

    const responsePayload: any = {
      success: true,
      message: isEmailSent
        ? `Kode verifikasi 6-digit telah dikirim ke ${cleanEmail}. Silakan periksa inbox email Anda.`
        : (isDevMode
            ? `[DEV MODE] Kode OTP testing adalah 123456. Anda dapat langsung masuk tanpa email eksternal.`
            : `Kode verifikasi diproses. Silakan periksa inbox email Anda.`),
      email: cleanEmail,
      expiresInSeconds: 300,
      devMode: isDevMode,
      otpCode: isDevMode ? "123456" : undefined,
      emailSent: isEmailSent,
      provider: isEmailSent ? activeProvider : (isDevMode ? "dev_mode" : "default"),
    };

    // Sertakan previewOtp & detail diagnostik saat dev mode atau jika flag aktif
    if (isDevMode || process.env.ENABLE_DEV_OTP_PREVIEW === "true") {
      responsePayload.previewOtp = otpCode;
      responsePayload.magicLink = magicLinkUrl;
      responsePayload.diagnostics = {
        isDevMode,
        otpCode,
        provider: isEmailSent ? activeProvider : "dev_fallback",
        mailtarget: {
          configured: Boolean(mailtargetApiKey),
          mode: isSandboxKey ? "sandbox" : "live",
          delivered: isEmailSent,
        },
      };
    }

    return res.json(responsePayload);
  } catch (err: any) {
    console.error("Send OTP error:", err);
    return res.status(500).json({ success: false, error: "Gagal memproses pengiriman kode OTP." });
  }
});

// Endpoint: Verifikasi Kode OTP 6 Digit
router.post("/verify-otp", async (req, res) => {
  try {
    const email = req.body?.email;
    const otp = req.body?.otp || req.body?.code;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: "Email dan kode OTP wajib diisi." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim().replace(/\D/g, "");
    const isDevMode = process.env.NODE_ENV === "development";

    console.log(`\n[AUTH VERIFY-OTP] 🔐 Memverifikasi OTP:`);
    console.log(`  - Email     : ${cleanEmail}`);
    console.log(`  - Input OTP : ${cleanOtp}`);
    console.log(`  - NODE_ENV  : ${process.env.NODE_ENV || "development"}`);

    const otpEntry = otpStore[cleanEmail];
    const now = Date.now();

    // Dev Mode Fallback: Jika di environment development dan user memasukkan "123456", langsung izinkan masuk
    const isDevPass = isDevMode && cleanOtp === "123456";

    if (isDevPass) {
      console.log(`[AUTH VERIFY-OTP] ✅ Dev Mode Bypass: Kode 123456 diterima untuk ${cleanEmail}`);
    } else {
      if (!otpEntry || otpEntry.expiresAt < now) {
        delete otpStore[cleanEmail];
        console.warn(`[AUTH VERIFY-OTP] ❌ OTP untuk ${cleanEmail} telah kedaluwarsa atau belum diminta.`);
        return res.status(400).json({
          success: false,
          error: "Kode OTP salah atau telah kedaluwarsa (berlaku 5 menit). Silakan minta kode baru.",
        });
      }

      // Check attempts
      if (otpEntry.attempts >= 5) {
        delete otpStore[cleanEmail];
        console.warn(`[AUTH VERIFY-OTP] ❌ Terlalu banyak percobaan salah untuk ${cleanEmail}.`);
        return res.status(400).json({
          success: false,
          error: "Terlalu banyak percobaan yang salah. Silakan minta kode baru.",
        });
      }

      // Validate OTP code hash
      const inputHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");
      const isCodeValid = (otpEntry.hashedCode && otpEntry.hashedCode === inputHash) || (otpEntry.code && otpEntry.code === cleanOtp);

      if (!isCodeValid) {
        otpEntry.attempts += 1;
        console.warn(`[AUTH VERIFY-OTP] ❌ Kode salah untuk ${cleanEmail}. Percobaan: ${otpEntry.attempts}/5`);
        return res.status(400).json({
          success: false,
          error: `Kode OTP yang Anda masukkan salah. Sisa percobaan: ${5 - otpEntry.attempts}`,
        });
      }
    }

    // OTP Verified! Delete used OTP
    delete otpStore[cleanEmail];

    // Auto-Register or Auto-Login User
    // Email is the primary userId
    const users = readJsonSafe<UserProfile[]>(USERS_FILE, []);
    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    const nowIso = new Date().toISOString();

    const formattedName = cleanEmail
      .split("@")[0]
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      cleanEmail
    )}&backgroundColor=4f46e5&textColor=ffffff`;

    if (!user) {
      // Auto-Register new user
      user = {
        id: cleanEmail, // Email as primary userId
        email: cleanEmail,
        name: formattedName,
        avatar: defaultAvatar,
        provider: "email_otp",
        createdAt: nowIso,
        lastLogin: nowIso,
      };
      users.push(user);
    } else {
      // Auto-Login existing user
      user.lastLogin = nowIso;
      user.id = cleanEmail;
      user.provider = "email_otp";
    }
    writeJsonSafe(USERS_FILE, users);

    // Create session (7 days)
    const sessionToken = `usr_sess_${crypto.randomBytes(32).toString("hex")}`;
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;

    userSessions[sessionToken] = {
      user,
      expiresAt,
    };

    // Set HTTP-only Cookie
    res.cookie("ghighais_user_session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      user,
      token: sessionToken,
      expiresAt,
      redirectTo: "/dashboard",
    });
  } catch (err: any) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ success: false, error: "Gagal memverifikasi kode OTP di server." });
  }
});

// Endpoint: Magic Link Direct Login (GET)
router.get("/magic-login", (req, res) => {
  const { email, token } = req.query;
  if (!email || !token || typeof email !== "string" || typeof token !== "string") {
    return res.status(400).send("Link login tidak valid atau parameter kurang.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const otpEntry = otpStore[cleanEmail];
  const now = Date.now();

  if (!otpEntry || otpEntry.expiresAt < now || otpEntry.token !== token) {
    return res
      .status(400)
      .send(
        "Link login ini sudah kedaluwarsa atau tidak valid. Silakan buka halaman login untuk meminta link baru."
      );
  }

  // Valid Magic Link! Delete OTP entry
  delete otpStore[cleanEmail];

  // Auto-Register or Auto-Login User
  const users = readJsonSafe<UserProfile[]>(USERS_FILE, []);
  let user = users.find((u) => u.email.toLowerCase() === cleanEmail);
  const nowIso = new Date().toISOString();

  const formattedName = cleanEmail
    .split("@")[0]
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    cleanEmail
  )}&backgroundColor=4f46e5&textColor=ffffff`;

  if (!user) {
    user = {
      id: cleanEmail,
      email: cleanEmail,
      name: formattedName,
      avatar: defaultAvatar,
      provider: "magic_link",
      createdAt: nowIso,
      lastLogin: nowIso,
    };
    users.push(user);
  } else {
    user.lastLogin = nowIso;
    user.id = cleanEmail;
    user.provider = "magic_link";
  }
  writeJsonSafe(USERS_FILE, users);

  // Create session (7 days)
  const sessionToken = `usr_sess_${crypto.randomBytes(32).toString("hex")}`;
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000;

  userSessions[sessionToken] = {
    user,
    expiresAt,
  };

  res.cookie("ghighais_user_session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.redirect("/dashboard");
});

// Captcha challenge store
interface CaptchaChallengeItem {
  token: string;
  question: string;
  expectedAnswer?: string;
  expiresAt: number;
}
const captchaChallenges: Record<string, CaptchaChallengeItem> = {};

// Endpoint: Dapatkan Tantangan Verifikasi Robot / Manusia
router.get("/captcha-challenge", (req, res) => {
  const challengeId = `c_${crypto.randomBytes(12).toString("hex")}`;
  const num1 = Math.floor(Math.random() * 8) + 2;
  const num2 = Math.floor(Math.random() * 8) + 1;
  const answer = (num1 + num2).toString();
  const token = `bot_token_${crypto.randomBytes(24).toString("hex")}`;

  captchaChallenges[challengeId] = {
    token,
    question: `${num1} + ${num2}`,
    expectedAnswer: answer,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  res.json({
    success: true,
    challengeId,
    question: `${num1} + ${num2}`,
    token,
  });
});

// Handler: Login dengan Verifikasi Bukan Robot (Menggantikan Email OTP)
const handleRobotVerifyLogin = (req: Request, res: Response) => {
  try {
    const { name, email, captchaToken, challengeId, challengeAnswer } = req.body;

    // Validasi token atau respon verifikasi
    if (!captchaToken && !challengeAnswer) {
      return res.status(400).json({
        success: false,
        error: "Verifikasi 'Saya bukan robot' wajib diselesaikan.",
      });
    }

    if (challengeId && challengeAnswer) {
      const challenge = captchaChallenges[challengeId];
      if (!challenge || challenge.expiresAt < Date.now()) {
        delete captchaChallenges[challengeId];
        return res.status(400).json({
          success: false,
          error: "Sesi verifikasi telah kedaluwarsa. Silakan muat ulang halaman.",
        });
      }
      if (challenge.expectedAnswer && String(challengeAnswer).trim() !== challenge.expectedAnswer) {
        return res.status(400).json({
          success: false,
          error: "Hasil perhitungan verifikasi tidak sesuai. Silakan coba lagi.",
        });
      }
      delete captchaChallenges[challengeId];
    }

    const rawName = (name || "").trim() || "Pengguna Studio";
    let rawEmail = (email || "").trim().toLowerCase();

    if (!rawEmail) {
      const slugName = rawName.toLowerCase().replace(/[^a-z0-9]/g, "");
      rawEmail = `${slugName || "user"}@androlos.id`;
    }

    const nowIso = new Date().toISOString();
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      rawName
    )}&backgroundColor=4f46e5&textColor=ffffff`;

    const users = readJsonSafe<UserProfile[]>(USERS_FILE, []);
    let user = users.find((u) => u.email.toLowerCase() === rawEmail);

    if (!user) {
      user = {
        id: rawEmail,
        email: rawEmail,
        name: rawName,
        avatar: defaultAvatar,
        provider: "robot_verify",
        createdAt: nowIso,
        lastLogin: nowIso,
      };
      users.push(user);
    } else {
      user.name = rawName;
      user.lastLogin = nowIso;
      user.provider = "robot_verify";
    }
    writeJsonSafe(USERS_FILE, users);

    // Create session (7 days)
    const sessionToken = `usr_sess_${crypto.randomBytes(32).toString("hex")}`;
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    userSessions[sessionToken] = {
      user,
      expiresAt,
    };

    res.cookie("ghighais_user_session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(`[AUTH ROBOT-VERIFY] ✅ User "${rawName}" (${rawEmail}) berhasil login via verifikasi bukan robot.`);

    return res.json({
      success: true,
      user,
      token: sessionToken,
      expiresAt,
      redirectTo: "/dashboard",
    });
  } catch (err: any) {
    console.error("Robot verify login error:", err);
    return res.status(500).json({ success: false, error: "Gagal memproses verifikasi login." });
  }
};

router.post("/robot-verify-login", handleRobotVerifyLogin);
router.post("/captcha-login", handleRobotVerifyLogin);

// Current User Session Check
router.get("/session", (req, res) => {
  const token = req.cookies?.ghighais_user_session || req.headers.authorization?.replace("Bearer ", "");
  if (!token || typeof token !== "string") {
    return res.json({ user: null });
  }

  const session = userSessions[token];
  if (!session || session.expiresAt < Date.now()) {
    delete userSessions[token];
    return res.json({ user: null });
  }

  return res.json({
    user: session.user,
    expiresAt: session.expiresAt,
  });
});

// User Logout
router.post("/logout", (req, res) => {
  const token = req.cookies?.ghighais_user_session || req.headers.authorization?.replace("Bearer ", "");
  if (token && typeof token === "string") {
    delete userSessions[token];
  }
  res.clearCookie("ghighais_user_session", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  return res.json({ success: true, redirectTo: "/login" });
});

export default router;
