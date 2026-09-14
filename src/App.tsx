import React, { useState, useEffect, useRef } from "react";
import {
  AppConfig,
  ChatMessage,
  LayoutEditorState,
  GenerationProgress,
  PreviewError,
  DatabaseSetupPreference,
  PromptUndoSnapshot,
} from "./types";
import {
  DEFAULT_APP_CONFIG,
  DEFAULT_STARTER_CODE,
  DEFAULT_LAYOUT_STATE,
} from "./data/defaultConfig";
import { updateLayoutInHtml } from "./utils/codeModifier";
import { exportProjectToZip } from "./utils/zipExporter";
import { ensurePermanentFooter } from "./utils/permanentFooter";
import { Navbar } from "./components/Navbar";
import { PromptPanel } from "./components/PromptPanel";
import { CodingPanel } from "./components/CodingPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { AdminModal } from "./components/AdminModal";
import { GitHubModal } from "./components/GitHubModal";
import { ResetConfirmModal } from "./components/ResetConfirmModal";
import { LogoutConfirmModal } from "./components/auth/LogoutConfirmModal";
import { DatabaseSelector } from "./components/DatabaseSelector";
import { DatabaseModal } from "./components/DatabaseModal";
import { DeployEngineDashboard } from "./components/deploy/DeployEngineDashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/auth/LoginPage";
import { AdminAccessPage } from "./components/auth/AdminAccessPage";
import { AdminDashboardPage } from "./components/admin/AdminDashboardPage";
import { NotFound404Page } from "./components/auth/NotFound404Page";
import {
  getUserDraft,
  saveUserDraft,
  deleteUserDraft,
  formatDraftTime,
} from "./services/draftStorage";
import {
  MessageSquare,
  Code,
  Eye,
  Sparkles,
  X,
  Database,
  Loader2,
  BookmarkCheck,
  Undo2,
} from "lucide-react";

function AppContent() {
  const { user, isAdmin, isLoading, currentPath, navigate, logoutUser } = useAuth();
  const [showDeployEngine, setShowDeployEngine] = useState(false);
  // 1. Persistent App Config
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem("ghighais_app_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_APP_CONFIG,
          ...parsed,
          customTexts: {
            ...DEFAULT_APP_CONFIG.customTexts,
            ...(parsed.customTexts || {}),
          },
        };
      }
    } catch (e) {
      console.warn("Failed to load saved config:", e);
    }
    return DEFAULT_APP_CONFIG;
  });

  // Unified Persistent Config Saver (Syncs to localStorage, state, and server database)
  const handleSaveAppConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem("ghighais_app_config", JSON.stringify(newConfig));
    } catch (e) {
      console.warn("Storage write error:", e);
    }
    if (newConfig.permanentFooterText) {
      setCode((prev) => ensurePermanentFooter(prev, newConfig.permanentFooterText));
    }
    // Server-side persistent storage across all visitors/devices
    try {
      await fetch("/api/app-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: newConfig }),
      });
    } catch (err) {
      console.warn("Server config save error:", err);
    }
  };

  // Fetch persistent configuration from server to guarantee logo & sizes appear on any device/browser
  useEffect(() => {
    fetch("/api/app-config")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch app config");
      })
      .then((data) => {
        if (data && data.config) {
          setConfig((prev) => {
            const merged = {
              ...DEFAULT_APP_CONFIG,
              ...prev,
              ...data.config,
              customTexts: {
                ...DEFAULT_APP_CONFIG.customTexts,
                ...(prev.customTexts || {}),
                ...(data.config.customTexts || {}),
              },
            };
            try {
              localStorage.setItem("ghighais_app_config", JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch((err) => {
        console.info("Using cached local configuration:", err.message);
      });
  }, []);

  // Update browser tab favicon dynamically if logo is configured
  useEffect(() => {
    const iconUrl = config.logoUrl || config.loginLogoUrl || "/ghighais-logo.jpg";
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.getElementsByTagName("head")[0].appendChild(link);
    }
    link.href = iconUrl;
  }, [config.logoUrl, config.loginLogoUrl]);

  // 2. Active Web Code (selalu terlindungi dengan permanent footer)
  const [code, setCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("ghighais_app_code");
      if (saved) return ensurePermanentFooter(saved);
    } catch (e) {
      console.warn("Failed to load saved code:", e);
    }
    return DEFAULT_STARTER_CODE;
  });

  // 3. Layout Editor State
  const [layout, setLayout] = useState<LayoutEditorState>(DEFAULT_LAYOUT_STATE);

  // 4. Chat Messages History for Continuous Prompts
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("ghighais_chat_history");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to load chat history:", e);
    }
    return [];
  });

  // 5. View Modes (Split 3-Kolom vs Tabs)
  const [activeView, setActiveView] = useState<"split" | "tabs">("split");
  const [activeTab, setActiveTab] = useState<"prompt" | "coding" | "preview">("preview");

  // 6. Modal & Setup View States
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isGitHubOpen, setIsGitHubOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [showSetupPage, setShowSetupPage] = useState(false);

  // Database Preference State (Loaded from localStorage)
  const [databasePreference, setDatabasePreference] =
    useState<DatabaseSetupPreference | null>(() => {
      try {
        const saved = localStorage.getItem("ghighais_database_preference");
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    });

  // Fitur Undo Prompt (Batas undo 7x)
  const MAX_UNDO_LIMIT = 7;
  const [undoHistory, setUndoHistory] = useState<PromptUndoSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem("ghighais_prompt_undo_history");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to load prompt undo history:", e);
    }
    return [];
  });
  const [undoToast, setUndoToast] = useState<{ message: string; remaining: number } | null>(null);
  const [lastUndonePrompt, setLastUndonePrompt] = useState<string | null>(null);

  // Quick Resume State (Fitur "Masuk Lagi")
  const [quickResumeNotification, setQuickResumeNotification] = useState<{
    show: boolean;
    timestamp: string;
  } | null>(null);

  const initialUserLoadedRef = useRef<string | null>(null);

  // Fitur "Masuk Lagi" (Quick Resume):
  // Saat user baru login (atau login ulang setelah logout), sistem otomatis mengecek apakah ada data draft di localStorage untuk UID tersebut.
  // Jika ada, muat data tersebut kembali ke editor/dashboard secara otomatis.
  // Jika tidak ada, tampilkan dashboard kosong/default.
  useEffect(() => {
    if (user && user.id) {
      if (initialUserLoadedRef.current !== user.id) {
        initialUserLoadedRef.current = user.id;
        const draft = getUserDraft(user);
        if (draft && draft.code) {
          setCode(ensurePermanentFooter(draft.code));
          if (Array.isArray(draft.messages) && draft.messages.length > 0) {
            setMessages(draft.messages);
          }
          if (draft.config) {
            setConfig((prev) => ({ ...prev, ...draft.config }));
          }
          if (draft.databasePreference) {
            setDatabasePreference(draft.databasePreference);
          }
          setQuickResumeNotification({
            show: true,
            timestamp: formatDraftTime(draft.updatedAt || draft.savedAt),
          });
        }
      }
    } else {
      initialUserLoadedRef.current = null;
    }
  }, [user]);

  // Simpan data pekerjaan terakhir di localStorage dengan key unik per user ID (ghighais_draft_[uid])
  useEffect(() => {
    if (user && user.id) {
      saveUserDraft(user, {
        code,
        messages,
        config,
        databasePreference,
      });
    }
  }, [user, code, messages, config, databasePreference]);

  // 7. Generation & Progress Tracker
  const [progress, setProgress] = useState<GenerationProgress>({
    isGenerating: false,
    percentage: 0,
    statusMessage: "",
    mode: "prompt",
  });

  // 8. Preview Error & Auto Fix State
  const [previewError, setPreviewError] = useState<PreviewError>({
    hasError: false,
    message: "",
  });
  const [isFixing, setIsFixing] = useState(false);

  // 9. Recovery Tracker: Deteksi jika sesi generate sebelumnya terputus karena browser keluar/refresh
  const [interruptedGeneration, setInterruptedGeneration] = useState<{
    prompt: string;
    timestamp: number;
  } | null>(() => {
    try {
      const raw = localStorage.getItem("ghighais_active_generation");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cegah hilangnya data jika tab atau browser ditutup saat generate sedang berlangsung
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (progress.isGenerating) {
        e.preventDefault();
        e.returnValue = "Aplikasi sedang memproses generate kode. Jika Anda keluar sekarang, proses dapat terhenti.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [progress.isGenerating]);

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem("ghighais_app_config", JSON.stringify(config));
    } catch (e) {
      console.warn("Storage write error:", e);
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem("ghighais_app_code", code);
    } catch (e) {
      console.warn("Storage write error:", e);
    }
  }, [code]);

  useEffect(() => {
    try {
      localStorage.setItem("ghighais_chat_history", JSON.stringify(messages));
    } catch (e) {
      console.warn("Storage write error:", e);
    }
  }, [messages]);

  // Listen for iframe runtime errors
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "APP_ERROR") {
        setPreviewError({
          hasError: true,
          message: event.data.message || "Error saat mengeksekusi skrip",
          line: event.data.line,
          col: event.data.col,
          stack: event.data.stack,
        });
      }
    };

    window.addEventListener("message", handleWindowMessage);
    return () => window.removeEventListener("message", handleWindowMessage);
  }, []);

  // Animate progress percentage smoothly
  const startProgressAnimation = (
    mode: "prompt" | "autofix" | "manual",
    customInitialMsg?: string
  ) => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    setProgress({
      isGenerating: true,
      percentage: 5,
      statusMessage: customInitialMsg || "Menganalisis instruksi arsitektur...",
      mode,
    });

    let currentPercent = 5;
    progressTimerRef.current = setInterval(() => {
      currentPercent += Math.floor(Math.random() * 8) + 4;

      let msg = "Menganalisis prompt & requirements...";
      if (currentPercent > 20 && currentPercent <= 50) {
        msg = "AI Coder sedang merancang tata letak dan struktur...";
      } else if (currentPercent > 50 && currentPercent <= 80) {
        msg = "Menulis kode HTML5, CSS Tailwind, dan script JavaScript...";
      } else if (currentPercent > 80 && currentPercent < 95) {
        msg = "Memvalidasi sintaks, script event, dan kebersihan kode...";
      } else if (currentPercent >= 95) {
        currentPercent = 95;
        msg = "Menyelesaikan sinkronisasi & verifikasi preview...";
      }

      setProgress({
        isGenerating: true,
        percentage: currentPercent,
        statusMessage: msg,
        mode,
      });
    }, 450);
  };

  const finishProgressAnimation = (finalMessage?: string) => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setProgress({
      isGenerating: true,
      percentage: 100,
      statusMessage: finalMessage || "Selesai 100%! Aplikasi siap dijalankan.",
      mode: "prompt",
    });

    setTimeout(() => {
      setProgress({
        isGenerating: false,
        percentage: 0,
        statusMessage: "",
        mode: "prompt",
      });
    }, 1000);
  };

  // Helper: Simpan snapshot ke dalam riwayat undo sebelum modifikasi (Batas undo 7x)
  const pushUndoSnapshot = (prevCode: string, prevMessages: ChatMessage[], promptUsed: string) => {
    const snapshot: PromptUndoSnapshot = {
      id: "snap-" + Date.now(),
      code: prevCode,
      messages: prevMessages,
      prompt: promptUsed,
      timestamp: Date.now(),
    };

    setUndoHistory((prev) => {
      const updated = [...prev, snapshot];
      // Batasi maksimal 7 riwayat undo
      const trimmed = updated.slice(-MAX_UNDO_LIMIT);
      try {
        localStorage.setItem("ghighais_prompt_undo_history", JSON.stringify(trimmed));
      } catch (e) {
        console.warn("Gagal menyimpan riwayat undo prompt:", e);
      }
      return trimmed;
    });
  };

  // Helper: Eksekusi Undo Prompt ketika user salah instruksi
  const handleUndoPrompt = () => {
    if (undoHistory.length === 0) {
      setUndoToast({
        message: "Belum ada riwayat prompt untuk di-undo (Batas undo 7x).",
        remaining: 0,
      });
      setTimeout(() => setUndoToast(null), 3500);
      return;
    }

    // Ambil snapshot paling baru
    const lastSnapshot = undoHistory[undoHistory.length - 1];
    const newHistory = undoHistory.slice(0, -1);

    // Kembalikan editan aplikasi yang dibuat user ke versi sebelum instruksi salah
    setCode(lastSnapshot.code);
    setMessages(lastSnapshot.messages);
    setUndoHistory(newHistory);
    setLastUndonePrompt(lastSnapshot.prompt);

    try {
      localStorage.setItem("ghighais_app_code", lastSnapshot.code);
      localStorage.setItem("ghighais_chat_history", JSON.stringify(lastSnapshot.messages));
      localStorage.setItem("ghighais_prompt_undo_history", JSON.stringify(newHistory));
      localStorage.setItem("ghighais_prompt_draft", lastSnapshot.prompt);
    } catch (e) {
      console.warn("Gagal memperbarui penyimpanan saat undo:", e);
    }

    const remaining = newHistory.length;
    const promptPreview =
      lastSnapshot.prompt.length > 40
        ? lastSnapshot.prompt.substring(0, 37) + "..."
        : lastSnapshot.prompt;

    setUndoToast({
      message: `Aplikasi berhasil dikembalikan ke editan sebelum instruksi: "${promptPreview}". Teks instruksi telah disiapkan kembali di kolom input untuk Anda perbaiki.`,
      remaining,
    });

    setTimeout(() => {
      setUndoToast(null);
    }, 6000);
  };

  // Keyboard shortcut Alt+Z atau Ctrl+Shift+Z untuk Undo Prompt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // Hanya jalankan jika tidak sedang mengetik di input field
      if (
        !isTyping &&
        ((e.altKey && (e.key === "z" || e.key === "Z")) ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "z" || e.key === "Z")))
      ) {
        e.preventDefault();
        if (undoHistory.length > 0 && !progress.isGenerating) {
          handleUndoPrompt();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undoHistory, progress.isGenerating]);

  // Continuous Prompt Execution with AI Engine & GitHub URL Auto-Import
  const handleSendPrompt = async (promptText: string) => {
    // Simpan snapshot kondisi sebelum prompt baru diproses untuk fitur Undo Prompt
    const prevCode = code;
    const prevMessages = [...messages];

    // Catat prompt ke localStorage untuk pemulihan jika tab/aplikasi tertutup saat generate
    try {
      localStorage.setItem(
        "ghighais_active_generation",
        JSON.stringify({ prompt: promptText, timestamp: Date.now() })
      );
    } catch (e) {
      console.warn("Could not save active generation:", e);
    }

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: promptText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPreviewError({ hasError: false, message: "" });

    // 1. Cek Deteksi Mode berdasarkan keberadaan URL GitHub atau instruksi spesifik
    const githubRegex = /https?:\/\/(?:www\.)?(?:github\.com\/[a-zA-Z0-9_.\-]+(?:\/[a-zA-Z0-9_.\-]+)*|raw\.githubusercontent\.com\/[^\s]+)/i;
    const githubMatch = promptText.match(githubRegex);
    const hasGithubUrl = Boolean(githubMatch);
    const isExplicitSingleFile = /single[- ]?file/i.test(promptText);
    const isExplicitMultiFile = /(?:multi[- ]?file|full[- ]?project)/i.test(promptText);

    const isMode1 = (hasGithubUrl && !isExplicitMultiFile) || isExplicitSingleFile;
    const modeConfirmation = isMode1
      ? (hasGithubUrl ? "🔍 Terdeteksi URL ADA → Menggunakan Mode UPDATE EXISTING" : "🔍 Terdeteksi Permintaan Single File → Menggunakan Mode UPDATE EXISTING")
      : (hasGithubUrl && isExplicitMultiFile ? "🔍 Terdeteksi Permintaan Multi File → Menggunakan Mode NEW PROJECT" : "🔍 Terdeteksi URL TIDAK ADA → Menggunakan Mode NEW PROJECT");

    if (githubMatch) {
      const fullGithubUrl = githubMatch[0];
      const matchDetails = fullGithubUrl.match(/(?:github\.com|raw\.githubusercontent\.com)\/([^/\s]+)\/([^/\s?#]+)/i);
      const owner = matchDetails ? matchDetails[1] : "GitHub";
      const repo = matchDetails ? matchDetails[2].replace(/\.git$/i, "") : "Repo";
      const remainingInstructions = promptText.replace(fullGithubUrl, "").trim();

      startProgressAnimation("prompt", `${modeConfirmation}\nMembaca dan mengimpor aplikasi dari URL GitHub (${owner}/${repo})...`);

      try {
        const fetchRes = await fetch("/api/github/fetch-repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: fullGithubUrl }),
        });

        if (!fetchRes.ok) {
          const errJson = await fetchRes.json();
          throw new Error(errJson.error || "Gagal membaca repositori dari GitHub.");
        }

        const data = await fetchRes.json();
        const importedCode = ensurePermanentFooter(data.code, config.permanentFooterText);

        // Buka otomatis aplikasi di preview dan coding editor
        pushUndoSnapshot(prevCode, prevMessages, promptText);
        setCode(importedCode);

        // Jika hanya link URL GitHub saja tanpa instruksi tambahan
        if (!remainingInstructions) {
          const assistantMsg: ChatMessage = {
            id: "msg-" + (Date.now() + 1),
            role: "assistant",
            content: `${modeConfirmation}\n\nAplikasi dari GitHub (${data.owner}/${data.repo}) berhasil diimpor sebagai Single-File Application (index.html) dan otomatis dibuka di Live Preview! Semua styling dan script telah siap digunakan langsung.`,
            timestamp: Date.now(),
            codeSnippet: "index.html",
            modelUsed: "GitHub Importer",
          };
          setMessages((prev) => [...prev, assistantMsg]);
          try {
            localStorage.removeItem("ghighais_active_generation");
          } catch {}
          setInterruptedGeneration(null);
          finishProgressAnimation(`Aplikasi ${data.repo} dari GitHub berhasil dibuka di Live Preview!`);
          return;
        }

        // Jika ADA instruksi tambahan (misal: "https://github.com/... tolong perbaiki warna...")
        startProgressAnimation("prompt", `${modeConfirmation}\nMenerapkan instruksi perbaikan pada aplikasi dari GitHub...`);
        const aiRes = await fetch("/api/qwen/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: remainingInstructions,
            currentCode: importedCode,
            history: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            apiKey: config.qwenApiKey || "",
          }),
        });

        if (!aiRes.ok) {
          const errData = await aiRes.json();
          throw new Error(errData.error || "Gagal memproses perbaikan kode.");
        }

        const aiData = await aiRes.json();
        const updatedCode = ensurePermanentFooter(aiData.code || importedCode);
        pushUndoSnapshot(prevCode, prevMessages, promptText);
        setCode(updatedCode);

        const assistantMsg: ChatMessage = {
          id: "msg-" + (Date.now() + 1),
          role: "assistant",
          content: `${modeConfirmation}\n\nAplikasi dari GitHub (${data.owner}/${data.repo}) berhasil diperbarui sebagai Single-File Application (index.html) sesuai instruksi: "${remainingInstructions}". Seluruh kode telah disinkronkan ke editor dan preview.`,
          timestamp: Date.now(),
          codeSnippet: "index.html",
          modelUsed: aiData.modelUsed || "AI Coder Engine Free",
        };
        setMessages((prev) => [...prev, assistantMsg]);
        try {
          localStorage.removeItem("ghighais_active_generation");
        } catch {}
        setInterruptedGeneration(null);
        finishProgressAnimation("Update aplikasi GitHub berhasil!");
        return;
      } catch (err: any) {
        console.error("GitHub URL import error:", err);
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setProgress({
          isGenerating: false,
          percentage: 0,
          statusMessage: "",
          mode: "prompt",
        });

        try {
          localStorage.removeItem("ghighais_active_generation");
        } catch {}
        setInterruptedGeneration(null);

        const errorMsg: ChatMessage = {
          id: "msg-err-" + Date.now(),
          role: "assistant",
          content: `${modeConfirmation}\n\nGagal membuka repositori GitHub (${fullGithubUrl}): ${err.message}. Pastikan repositori bersifat publik dan memiliki file index.html.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }
    }

    // Mode Standar (Jika TIDAK ada URL GitHub)
    startProgressAnimation("prompt", `${modeConfirmation}\nMenghubungi engine AI untuk membuat aplikasi...`);

    try {
      const response = await fetch("/api/qwen/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          currentCode: code,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          apiKey: config.qwenApiKey || "",
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gagal menghubungi engine AI.");
      }

      const data = await response.json();
      const generatedCode = ensurePermanentFooter(data.code || code);

      // Catat snapshot ke riwayat undo sebelum menimpa kode (Batas 7x)
      pushUndoSnapshot(prevCode, prevMessages, promptText);

      // Update code
      setCode(generatedCode);

      // Add assistant message with mode confirmation
      const assistantMsg: ChatMessage = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        content: `${modeConfirmation}\n\nAplikasi berhasil dibuat berdasarkan instruksi: "${promptText}". Tampilan preview telah disinkronkan secara otomatis.${data.warning ? ` (${data.warning})` : ""}`,
        timestamp: Date.now(),
        codeSnippet: "index.html",
        modelUsed: data.modelUsed || "AI Coder Engine Free",
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        localStorage.removeItem("ghighais_active_generation");
      } catch {}
      setInterruptedGeneration(null);

      finishProgressAnimation("Selesai 100%! Kode berhasil diperbarui.");
    } catch (err: any) {
      console.error("AI generate error:", err);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setProgress({
        isGenerating: false,
        percentage: 0,
        statusMessage: "",
        mode: "prompt",
      });

      try {
        localStorage.removeItem("ghighais_active_generation");
      } catch {}
      setInterruptedGeneration(null);

      const errorMsg: ChatMessage = {
        id: "msg-err-" + Date.now(),
        role: "assistant",
        content: `Maaf, terjadi kendala saat memproses: ${err.message}. Silakan coba ulangi prompt Anda.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  // Manual Run Trigger
  const handleManualRun = () => {
    startProgressAnimation("manual", "Mengompilasi dan menjalankan kode manual...");
    setTimeout(() => {
      finishProgressAnimation("Preview berhasil diperbarui!");
    }, 700);
  };

  // Auto Fix Action with AI Engine
  const handleAutoFix = async () => {
    if (!previewError.hasError && !previewError.message) return;

    setIsFixing(true);
    startProgressAnimation("autofix", "Menganalisis log error dengan Auto-Fix...");

    try {
      const response = await fetch("/api/qwen/autofix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentCode: code,
          errorMessage: previewError.message,
          errorStack: previewError.stack,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal melakukan Auto-Fix.");
      }

      const data = await response.json();
      if (data.code) {
        setCode(ensurePermanentFooter(data.code));
        setPreviewError({ hasError: false, message: "" });
      }

      finishProgressAnimation("Kode berhasil diperbaiki tanpa error!");
    } catch (err: any) {
      console.error("AutoFix failed:", err);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setProgress({
        isGenerating: false,
        percentage: 0,
        statusMessage: "",
        mode: "prompt",
      });
    } finally {
      setIsFixing(false);
    }
  };

  // Reset Code to default starter
  const handleResetCode = () => {
    setIsResetModalOpen(true);
  };

  // Reset Conversation
  const handleResetChat = () => {
    setIsResetModalOpen(true);
  };

  // Buka dialog konfirmasi sebelum reset total
  const handleResetAll = () => {
    setIsResetModalOpen(true);
  };

  // Eksekusi pembersihan total setelah dikonfirmasi oleh user
  const handleConfirmResetAll = (options?: { clearSavedDrafts?: boolean }) => {
    try {
      localStorage.removeItem("ghighais_app_code");
      localStorage.removeItem("ghighais_chat_history");
      localStorage.removeItem("ghighais_app_config");
      localStorage.removeItem("ghighais_prompt_undo_history");
      if (options?.clearSavedDrafts && user) {
        deleteUserDraft(user);
      }
    } catch (e) {
      console.warn("Storage clear error:", e);
    }

    setUndoHistory([]);
    setLastUndonePrompt(null);
    setUndoToast(null);

    // Buat template bersih dengan permanent footer
    const cleanStarter = ensurePermanentFooter(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aplikasi Bersih</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
  <div class="text-center max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
    <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl">
      ✨
    </div>
    <h1 class="text-xl font-bold mb-2">Workspace Bersih</h1>
    <p class="text-xs text-slate-400">
      Ketik prompt baru atau masukkan link repositori GitHub untuk mulai membuat aplikasi.
    </p>
  </div>
</body>
</html>`);

    setCode(cleanStarter);
    setMessages([]);
    setLayout(DEFAULT_LAYOUT_STATE);
    setConfig(DEFAULT_APP_CONFIG);
    setPreviewError({ hasError: false, message: "" });
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setProgress({
      isGenerating: false,
      percentage: 0,
      statusMessage: "",
      mode: "prompt",
    });
  };

  // Smart Logout: Simpan pekerjaan terakhir di localStorage dengan key unik (ghighais_draft_[uid]) dan keluar
  const handleSmartLogout = async () => {
    await logoutUser({
      hardReset: false,
      draftData: {
        code,
        messages,
        config,
        databasePreference,
      },
    });
  };

  // Hard Reset: Hapus semua draft dan konfigurasi lokal permanen lalu keluar
  const handleHardResetLogout = async () => {
    await logoutUser({
      hardReset: true,
    });
  };

  // Export ZIP
  const handleExportZip = () => {
    exportProjectToZip(
      code,
      config.appTitle.toLowerCase().replace(/\s+/g, "-") || "ghighais-brain-app"
    );
  };

  // Middleware / Protected Route Redirection Guard
  useEffect(() => {
    if (!isLoading) {
      if (!user && !currentPath.startsWith("/admin") && currentPath !== "/login") {
        // Belum login -> Tahan di halaman /login
        navigate("/login");
      } else if (user && currentPath === "/login") {
        // Sudah login -> Baru redirect ke /dashboard
        navigate("/dashboard");
      }
    }
  }, [isLoading, user, currentPath, navigate]);

  // 1. Loading State (holds while verifying session status from server)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-xs font-mono tracking-wider">Memeriksa Sesi Autentikasi...</span>
      </div>
    );
  }

  // 2. Secret Admin Access Route (No navbar, no footer, minimalist)
  if (currentPath === "/admin/access") {
    return <AdminAccessPage />;
  }

  // 3. Admin Protected Routes (/admin/*)
  if (currentPath.startsWith("/admin")) {
    if (isAdmin) {
      return (
        <AdminDashboardPage
          config={config}
          onSaveConfig={handleSaveAppConfig}
          onEnterStudio={() => navigate("/dashboard")}
        />
      );
    }
    // Unauthenticated user attempting to access /admin/* -> return custom 404 (not 403!)
    return <NotFound404Page />;
  }

  // 4. Public User Auth Gate (requireUserAuth: strictly hold on /login if unauthenticated)
  if (!user) {
    return <LoginPage config={config} />;
  }

  return (
    <div
      id="ghighais-brain-app-root"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white"
    >
      {/* Main App Navigation */}
      <Navbar
        config={config}
        activeView={activeView}
        onToggleView={(view) => setActiveView(view)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenGitHub={() => setIsGitHubOpen(true)}
        onExportZip={handleExportZip}
        onResetAll={handleResetAll}
        onOpenDatabase={() => setIsDatabaseModalOpen(true)}
        databasePreference={databasePreference}
        onOpenDeployEngine={() => setShowDeployEngine(!showDeployEngine)}
        isDeployEngineActive={showDeployEngine}
        onOpenLogoutModal={() => setIsLogoutModalOpen(true)}
        undoCount={undoHistory.length}
        maxUndo={MAX_UNDO_LIMIT}
        onUndoPrompt={handleUndoPrompt}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 p-2 sm:p-4 max-w-[1720px] w-full mx-auto flex flex-col min-h-0">
        {/* MODUL INTI: GHIGHAIS DEPLOY ENGINE (Platform Hosting & Subdomain Otomatis) */}
        {showDeployEngine ? (
          <DeployEngineDashboard
            code={code}
            config={config}
            databasePreference={databasePreference}
            onBackToStudio={() => setShowDeployEngine(false)}
            onUpdateCode={(newCode) => setCode(ensurePermanentFooter(newCode, config.permanentFooterText))}
          />
        ) : showSetupPage ? (
          <div className="flex-1 max-w-5xl w-full mx-auto p-2 sm:p-4 animate-in fade-in duration-300 flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSetupPage(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>← Kembali ke Workspace Studio</span>
              </button>
            </div>
            <DatabaseSelector
              onClose={() => setShowSetupPage(false)}
              onComplete={(pref) => {
                setDatabasePreference(pref);
                setShowSetupPage(false);
              }}
            />
          </div>
        ) : (
          <>
            {/* Notifikasi Undo Prompt Berhasil */}
            {undoToast && (
              <div
                id="undo-prompt-toast-banner"
                className="bg-amber-950/90 border border-amber-500/50 p-3 sm:px-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-100 mb-3 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                    <Undo2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      Undo Prompt Berhasil ({undoToast.remaining}/{MAX_UNDO_LIMIT} Batas Undo Tersisa)
                    </p>
                    <p className="text-[11px] text-amber-200/90 truncate">
                      {undoToast.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  <button
                    type="button"
                    onClick={() => setUndoToast(null)}
                    className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}

            {/* Quick Resume Notification Banner (Fitur "Masuk Lagi") */}
            {quickResumeNotification?.show && (
              <div
                id="quick-resume-banner"
                className="bg-emerald-950/80 border border-emerald-500/40 p-3 sm:px-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-100 mb-3 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                    <BookmarkCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      Pekerjaan Terakhir Berhasil Dimuat Kembali (Quick Resume)
                    </p>
                    <p className="text-[11px] text-emerald-300/80 truncate">
                      Draft kode project dan riwayat percakapan Anda otomatis dipulihkan ({quickResumeNotification.timestamp}).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  <button
                    type="button"
                    onClick={() => setQuickResumeNotification(null)}
                    className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Oke, Mengerti
                  </button>
                </div>
              </div>
            )}

            {/* Banner Pemulihan Sesi Generate Terputus */}
            {interruptedGeneration && !progress.isGenerating && (
              <div className="bg-indigo-950/90 border border-indigo-500/50 p-3 sm:px-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-100 mb-3 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      Sesi generate sebelumnya terputus karena aplikasi sempat keluar/tertutup
                    </p>
                    <p className="text-[11px] text-indigo-200/80 truncate">
                      Prompt Anda aman tersimpan: <strong>"{interruptedGeneration.prompt}"</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  <button
                    onClick={() => {
                      const p = interruptedGeneration.prompt;
                      setInterruptedGeneration(null);
                      try {
                        localStorage.removeItem("ghighais_active_generation");
                      } catch {}
                      handleSendPrompt(p);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lanjutkan Generate</span>
                  </button>
                  <button
                    onClick={() => {
                      setInterruptedGeneration(null);
                      try {
                        localStorage.removeItem("ghighais_active_generation");
                      } catch {}
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs transition-colors cursor-pointer"
                    title="Tutup pemberitahuan"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}

            {/* Mobile / Tablet Tab Selector (only visible in tab mode or small screens) */}
            {activeView === "tabs" && (
              <div className="flex items-center justify-center mb-3">
                <div className="inline-flex bg-slate-900 border border-slate-800 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setActiveTab("prompt")}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "prompt"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Prompt AI</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("coding")}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "coding"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Coding (Editor)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "preview"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab View Container */}
            {activeView === "tabs" ? (
              <div className="flex-1 min-h-[calc(100vh-130px)] flex flex-col">
                {activeTab === "prompt" && (
                  <PromptPanel
                    messages={messages}
                    onSendPrompt={handleSendPrompt}
                    onResetChat={handleResetChat}
                    onResetAll={handleResetAll}
                    onOpenDatabase={() => setIsDatabaseModalOpen(true)}
                    databasePreference={databasePreference}
                    progress={progress}
                    config={config}
                    undoCount={undoHistory.length}
                    maxUndo={MAX_UNDO_LIMIT}
                    onUndoPrompt={handleUndoPrompt}
                    lastUndonePrompt={lastUndonePrompt}
                  />
                )}
                {activeTab === "coding" && (
                  <CodingPanel
                    code={code}
                    onChangeCode={(newCode) => setCode(newCode)}
                    onManualRun={handleManualRun}
                    onResetCode={handleResetCode}
                    config={config}
                    isGenerating={progress.isGenerating}
                  />
                )}
                {activeTab === "preview" && (
                  <PreviewPanel
                    code={code}
                    config={config}
                    previewError={previewError}
                    onAutoFix={handleAutoFix}
                    onClearError={() =>
                      setPreviewError({ hasError: false, message: "" })
                    }
                    isFixing={isFixing}
                    onApplyCode={(updatedCode) => setCode(ensurePermanentFooter(updatedCode, config.permanentFooterText))}
                    onOpenDeployEngine={() => setShowDeployEngine(true)}
                  />
                )}
              </div>
            ) : (
              /* Split 3-Kolom View */
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 min-h-[calc(100vh-100px)]">
                {/* Kolom 1: Prompt AI (3 cols on XL, 4 cols on LG) */}
                <div className="lg:col-span-4 xl:col-span-3 h-[520px] lg:h-full flex flex-col min-h-0">
                  <PromptPanel
                    messages={messages}
                    onSendPrompt={handleSendPrompt}
                    onResetChat={handleResetChat}
                    onResetAll={handleResetAll}
                    onOpenDatabase={() => setIsDatabaseModalOpen(true)}
                    databasePreference={databasePreference}
                    progress={progress}
                    config={config}
                    undoCount={undoHistory.length}
                    maxUndo={MAX_UNDO_LIMIT}
                    onUndoPrompt={handleUndoPrompt}
                    lastUndonePrompt={lastUndonePrompt}
                  />
                </div>

                {/* Kolom 2: Coding Editor (4 cols on XL, 4 cols on LG) */}
                <div className="lg:col-span-4 xl:col-span-4 h-[520px] lg:h-full flex flex-col min-h-0">
                  <CodingPanel
                    code={code}
                    onChangeCode={(newCode) => setCode(newCode)}
                    onManualRun={handleManualRun}
                    onResetCode={handleResetCode}
                    config={config}
                    isGenerating={progress.isGenerating}
                  />
                </div>

                {/* Kolom 3: Live Interactive Preview (5 cols on XL, 4 cols on LG) */}
                <div className="lg:col-span-4 xl:col-span-5 h-[620px] lg:h-full flex flex-col min-h-0">
                  <PreviewPanel
                    code={code}
                    config={config}
                    previewError={previewError}
                    onAutoFix={handleAutoFix}
                    onClearError={() =>
                      setPreviewError({ hasError: false, message: "" })
                    }
                    isFixing={isFixing}
                    onApplyCode={(updatedCode) => setCode(ensurePermanentFooter(updatedCode, config.permanentFooterText))}
                    onOpenDeployEngine={() => setShowDeployEngine(true)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Database Selector Modal */}
      <DatabaseModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onSave={(pref) => setDatabasePreference(pref)}
      />

      {/* Hidden Admin Modal (Tapped 5x on Logo) */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        onSaveConfig={handleSaveAppConfig}
      />

      {/* GitHub Push Export & URL Generator Modal */}
      <GitHubModal
        isOpen={isGitHubOpen}
        onClose={() => setIsGitHubOpen(false)}
        code={code}
        config={config}
        databaseConfig={
          databasePreference
            ? {
                provider: databasePreference.provider,
                enabled: true,
                credentials: databasePreference.credentials,
                envConfig: databasePreference.envConfig,
              }
            : null
        }
        onGenerateFromGithub={(url) => {
          setIsGitHubOpen(false);
          handleSendPrompt(url);
        }}
      />

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmResetAll}
      />

      {/* Logout Confirmation Modal (Smart Logout vs Hard Reset) */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        user={user}
        onClose={() => setIsLogoutModalOpen(false)}
        onSmartLogout={handleSmartLogout}
        onHardResetLogout={handleHardResetLogout}
      />

      {/* Hidden Footer Link to /admin/access (Requirement: opacity 0, accessible via direct URL or hidden footer link) */}
      <footer className="py-2 text-center select-none pointer-events-auto">
        <button
          id="hidden-footer-admin-trigger"
          type="button"
          onClick={() => navigate("/admin/access")}
          className="opacity-0 hover:opacity-10 text-[8px] text-slate-800 transition-opacity cursor-default"
          tabIndex={-1}
          aria-hidden="true"
        >
          admin
        </button>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
