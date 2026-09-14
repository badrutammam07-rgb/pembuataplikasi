import React, { useState, useEffect } from "react";
import { AppConfig, GitHubExportConfig, DatabaseConfig } from "../types";
import { ensurePermanentFooter } from "../utils/permanentFooter";
import {
  detectTechnologiesAndGenerateGitignore,
  fetchProjectFiles,
  writeGitignoreToRoot,
  DetectedTechnology,
} from "../utils/gitignoreGenerator";
import {
  Github,
  X,
  Lock,
  Globe,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Loader2,
  ShieldCheck,
  FileCode,
  Edit3,
  Check,
  RefreshCw,
  Sparkles,
  Database,
  Code2,
  Link2,
  Clipboard,
  Play,
} from "lucide-react";

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  config: AppConfig;
  databaseConfig?: DatabaseConfig | null;
  onGenerateFromGithub?: (url: string) => void;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  code,
  config,
  databaseConfig,
  onGenerateFromGithub,
}) => {
  if (!isOpen) return null;

  const getText = (key: string, fallback: string) => {
    return config.customTexts[key] || fallback;
  };

  // Bersihkan token dari storage lokal jika pernah tersimpan sebelumnya
  useEffect(() => {
    localStorage.removeItem("ghighais_github_pat");
  }, []);

  const [formData, setFormData] = useState<GitHubExportConfig>({
    token: "", // Selalu kosong, tidak boleh disimpan di storage
    repoName: "ghighais-generated-app",
    branch: "main",
    isPrivate: false,
    commitMessage: "Deploy application created with Ghighais Brain",
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusText, setStatusText] = useState("");
  const [createdRepoUrl, setCreatedRepoUrl] = useState("");

  // State untuk Tab Navigator: 'import' | 'repo' | 'gitignore'
  const [activeTab, setActiveTab] = useState<"import" | "repo" | "gitignore">("import");
  const [importUrl, setImportUrl] = useState("");
  const [importError, setImportError] = useState("");

  // State untuk Smart Gitignore Generator (Client-side JS)
  const [isScanning, setIsScanning] = useState(false);
  const [detectedTechs, setDetectedTechs] = useState<DetectedTechnology[]>([]);
  const [gitignoreContent, setGitignoreContent] = useState("");
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [scanFilesCount, setScanFilesCount] = useState(0);

  // Jalankan pemindaian otomatis di sisi browser saat modal dibuka
  useEffect(() => {
    const runClientScan = async () => {
      setIsScanning(true);
      try {
        const files = await fetchProjectFiles();
        setScanFilesCount(files.length);
        const { detectedTechs: techs, generatedContent } =
          detectTechnologiesAndGenerateGitignore(files);
        setDetectedTechs(techs);
        setGitignoreContent(generatedContent);
      } catch (e) {
        console.warn("Client scan warning:", e);
      } finally {
        setIsScanning(false);
      }
    };

    if (isOpen) {
      runClientScan();
    }
  }, [isOpen]);

  const handleRescan = async () => {
    setIsScanning(true);
    try {
      const files = await fetchProjectFiles();
      setScanFilesCount(files.length);
      const { detectedTechs: techs, generatedContent } =
        detectTechnologiesAndGenerateGitignore(files);
      setDetectedTechs(techs);
      setGitignoreContent(generatedContent);
      setIsManualEdit(false);
    } catch (e) {
      console.warn("Rescan error:", e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleTriggerImport = () => {
    const trimmed = importUrl.trim();
    if (!trimmed) return;
    if (
      !trimmed.toLowerCase().includes("github.com") &&
      !trimmed.toLowerCase().includes("githubusercontent.com")
    ) {
      setImportError(
        "Format link URL harus mengarah ke GitHub (contoh: https://github.com/username/repository)"
      );
      return;
    }
    setImportError("");
    if (onGenerateFromGithub) {
      onGenerateFromGithub(trimmed);
      onClose();
    }
  };

  const handlePush = async () => {
    if (!formData.token.trim() || !formData.repoName.trim()) {
      setStatus("error");
      setStatusText("Token GitHub dan Nama Repository wajib diisi.");
      return;
    }

    try {
      setStatus("loading");

      // 1. Tulis file .gitignore ke root directory project secara otomatis sebelum menjalankan git push
      setStatusText("Menulis file .gitignore cerdas ke root directory project...");
      await writeGitignoreToRoot(gitignoreContent);

      setStatusText("Memvalidasi Personal Access Token GitHub...");

      // Pastikan token TIDAK disimpan ke localStorage
      localStorage.removeItem("ghighais_github_pat");

      const headers = {
        Authorization: `token ${formData.token.trim()}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      };

      // 2. Dapatkan authenticated user
      const userRes = await fetch("https://api.github.com/user", { headers });
      if (!userRes.ok) {
        throw new Error(
          "Token tidak valid atau tidak memiliki izin 'repo'. Periksa kembali token Anda."
        );
      }
      const userData = await userRes.json();
      const username = userData.login;

      // 3. Periksa repository atau buat baru
      setStatusText(`Memeriksa repository ${username}/${formData.repoName}...`);
      const repoRes = await fetch(
        `https://api.github.com/repos/${username}/${formData.repoName}`,
        { headers }
      );

      let targetRepoHtmlUrl = `https://github.com/${username}/${formData.repoName}`;

      if (repoRes.status === 404) {
        // Buat repository baru
        setStatusText(`Membuat repository baru di GitHub (${formData.repoName})...`);
        const createRepoRes = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: formData.repoName,
            private: formData.isPrivate,
            description: "Production-ready Web App created with Ghighais Brain AI Web Generator",
            auto_init: true,
          }),
        });

        if (!createRepoRes.ok) {
          const errData = await createRepoRes.json();
          throw new Error(
            errData.message || "Gagal membuat repository baru di GitHub."
          );
        }
        const createdRepo = await createRepoRes.json();
        targetRepoHtmlUrl = createdRepo.html_url;

        // Berikan jeda sejenak agar GitHub menyelesaikan inisialisasi repo
        await new Promise((r) => setTimeout(r, 1200));
      } else if (!repoRes.ok) {
        throw new Error("Gagal memeriksa status repository GitHub.");
      }

      // Helper push file ke GitHub API
      const pushFile = async (filePath: string, fileContent: string) => {
        let sha: string | undefined;
        try {
          const existingRes = await fetch(
            `https://api.github.com/repos/${username}/${formData.repoName}/contents/${filePath}?ref=${formData.branch}`,
            { headers }
          );
          if (existingRes.ok) {
            const existingData = await existingRes.json();
            sha = existingData.sha;
          }
        } catch {
          // File belum ada di repository
        }

        // Base64 encode file content (UTF-8 safe)
        const utf8Bytes = new TextEncoder().encode(fileContent);
        let binary = "";
        utf8Bytes.forEach((b) => (binary += String.fromCharCode(b)));
        const base64Content = btoa(binary);

        const putRes = await fetch(
          `https://api.github.com/repos/${username}/${formData.repoName}/contents/${filePath}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({
              message: `${formData.commitMessage} (${filePath})`,
              content: base64Content,
              branch: formData.branch,
              ...(sha ? { sha } : {}),
            }),
          }
        );

        if (!putRes.ok) {
          const putErr = await putRes.json();
          throw new Error(
            putErr.message || `Gagal mengunggah file ${filePath} ke GitHub.`
          );
        }
      };

      // 4. Push file .gitignore hasil deteksi cerdas
      setStatusText("Mengunggah .gitignore cerdas ke GitHub...");
      await pushFile(".gitignore", gitignoreContent);

      // 5. Push index.html (selalu terlindungi footer permanen SUPPORT BY GHIGHAIS DEVELOPMENT)
      setStatusText("Mengunggah index.html...");
      const codeWithPermanentFooter = ensurePermanentFooter(code);
      await pushFile("index.html", codeWithPermanentFooter);

      // 6. Push .env.example jika database dikonfigurasi (menjamin aplikasi matang & siap pakai)
      if (databaseConfig?.enabled && databaseConfig.tokenOrKey) {
        setStatusText("Mengunggah .env.example (Konfigurasi Database)...");
        let envExample = `# Template Konfigurasi Lingkungan (Environment Variables)
# Dibuat otomatis oleh Ghighais Brain untuk: ${formData.repoName}
# Salin file ini menjadi '.env' di server/hosting Anda lalu isi dengan nilai rahasia Anda.

`;
        if (databaseConfig.provider === "supabase") {
          envExample += `VITE_SUPABASE_URL=${databaseConfig.urlOrHost || "https://your-project.supabase.co"}\nVITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY\n`;
        } else if (databaseConfig.provider === "firebase") {
          envExample += `VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY\nVITE_FIREBASE_AUTH_DOMAIN=${databaseConfig.urlOrHost || "your-app.firebaseapp.com"}\nVITE_FIREBASE_PROJECT_ID=${databaseConfig.projectId || "your-project-id"}\n`;
        } else if (databaseConfig.provider === "postgres") {
          envExample += `DATABASE_URL=postgresql://username:password@localhost:5432/${databaseConfig.databaseName || "app_prod"}\n`;
        } else if (databaseConfig.provider === "mongodb") {
          envExample += `MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/${databaseConfig.databaseName || "app_prod"}\n`;
        } else {
          envExample += `DATABASE_TOKEN=YOUR_DATABASE_SECRET_TOKEN\nDATABASE_URL=${databaseConfig.urlOrHost || "https://api.database.com"}\n`;
        }
        await pushFile(".env.example", envExample);
      }

      // 7. Push README.md yang komprehensif & matang
      setStatusText("Mengunggah README.md...");
      const readme = `# ${formData.repoName}

Aplikasi web modern dan responsif dibuat secara instan dengan **Ghighais Brain AI Web Generator**.

## Fitur & Arsitektur
- **Standalone Web App**: Berjalan langsung di browser atau server statis.
- **Smart Gitignore**: Dilengkapi aturan keamanan .gitignore otomatis untuk melindungi rahasia dan file dependensi.
${
  databaseConfig?.enabled
    ? `- **Penyimpanan Database Terintegrasi**: Menggunakan provider **${databaseConfig.provider.toUpperCase()}** dengan template konfigurasi \`.env.example\` siap pakai.`
    : "- **Penyimpanan Lokal**: Menggunakan Web Storage untuk persistensi data."
}

## Cara Menjalankan Proyek
1. Buka file \`index.html\` langsung di browser favorit Anda, atau jalankan menggunakan server statis lokal:
   \`\`\`bash
   npx serve .
   \`\`\`
${
  databaseConfig?.enabled
    ? `2. Untuk menghubungkan ke database produksi, sesuaikan nilai kredensial pada file \`.env\` mengacu pada template \`.env.example\`.`
    : ""
}

## Lisensi & Atribusi
Didukung penuh oleh **SUPPORT BY GHIGHAIS DEVELOPMENT**.
Dibuat pada: ${new Date().toLocaleString("id-ID")}
`;
      await pushFile("README.md", readme);

      // MANDAT KEAMANAN: Token otomatis dihapus tanpa pernah disimpan
      setFormData((prev) => ({ ...prev, token: "" }));
      localStorage.removeItem("ghighais_github_pat");

      setStatus("success");
      setStatusText(
        "Berhasil! Seluruh file (termasuk .gitignore cerdas, index.html, dan README) telah di-push ke GitHub dan token otomatis dibersihkan."
      );
      setCreatedRepoUrl(targetRepoHtmlUrl);
    } catch (err: any) {
      console.error("GitHub push error:", err);
      setStatus("error");
      setStatusText(err.message || "Terjadi kesalahan saat melakukan push ke GitHub.");
    }
  };

  return (
    <div
      id="ghighais-github-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="ghighais-github-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shadow-md">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{getText("github_modal_title", "Push Proyek ke GitHub")}</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                  Smart Gitignore
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {getText(
                  "github_modal_desc",
                  "Deploy langsung ke repository Anda dengan proteksi keamanan otomatis."
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="px-6 pt-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("import")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "import"
                ? "text-indigo-400 border-indigo-500 bg-slate-900"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Generate dari URL GitHub</span>
          </button>
          <button
            onClick={() => setActiveTab("repo")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "repo"
                ? "text-indigo-400 border-indigo-500 bg-slate-900"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>Pengaturan Push & Token</span>
          </button>
          <button
            onClick={() => setActiveTab("gitignore")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "gitignore"
                ? "text-indigo-400 border-indigo-500 bg-slate-900"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Smart Gitignore ({detectedTechs.length} Terdeteksi)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          {activeTab === "import" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                  <Github className="w-4 h-4 text-indigo-400" />
                  <span>Kolom Link URL GitHub untuk Generate Aplikasi</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Masukkan link URL repository GitHub publik. Sistem akan membaca file HTML atau kode proyek, menanamkan proteksi footer permanen, dan langsung membuka aplikasi di <strong>Live Preview</strong> serta <strong>Coding Editor</strong>.
                </p>
              </div>

              {/* Input Group */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Link URL Repository GitHub:</span>
                  {importUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setImportUrl("");
                        setImportError("");
                      }}
                      className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Bersihkan
                    </button>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Link2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <input
                    id="input-github-modal-url"
                    type="url"
                    value={importUrl}
                    onChange={(e) => {
                      setImportUrl(e.target.value);
                      if (importError) setImportError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleTriggerImport();
                      }
                    }}
                    placeholder="https://github.com/username/repository (contoh: https://github.com/tastejs/todomvc)"
                    className="w-full pl-10 pr-24 py-2.5 bg-slate-900 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (navigator.clipboard && navigator.clipboard.readText) {
                          const text = await navigator.clipboard.readText();
                          if (text) {
                            setImportUrl(text.trim());
                            setImportError("");
                          }
                        }
                      } catch {}
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Clipboard className="w-3 h-3 text-indigo-400" />
                    <span>Tempel</span>
                  </button>
                </div>

                {importError && (
                  <div className="text-xs text-rose-400 flex items-center gap-1.5 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}
              </div>

              {/* Contoh Repository Populer */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Contoh Cepat Repository Publik yang Siap Dites:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImportUrl("https://github.com/tastejs/todomvc");
                      setImportError("");
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/60 border border-slate-700/60 hover:border-indigo-500/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-white group-hover:text-indigo-300">
                      tastejs/todomvc
                    </div>
                    <div className="text-[10px] text-slate-400">TodoMVC Web App</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportUrl("https://github.com/gabrielecirulli/2048");
                      setImportError("");
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/60 border border-slate-700/60 hover:border-indigo-500/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-white group-hover:text-indigo-300">
                      gabrielecirulli/2048
                    </div>
                    <div className="text-[10px] text-slate-400">Game 2048 Puzzle</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportUrl("https://github.com/mmp/calc");
                      setImportError("");
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/60 border border-slate-700/60 hover:border-indigo-500/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-white group-hover:text-indigo-300">
                      mmp/calc
                    </div>
                    <div className="text-[10px] text-slate-400">Scientific Calculator</div>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                id="btn-generate-github-modal"
                onClick={handleTriggerImport}
                disabled={!importUrl.trim()}
                className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
                  !importUrl.trim()
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                    : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 cursor-pointer"
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Generate & Buka di Live Preview</span>
              </button>
            </div>
          ) : activeTab === "repo" ? (
            <>
              {/* Security Notice */}
              <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-xs text-indigo-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Keamanan Token Terjamin:</strong> Token GitHub tidak pernah disimpan di sistem atau browser, dan langsung otomatis dihapus setelah proses push berhasil.
                </span>
              </div>

              {/* Database Integration Notice if enabled */}
              {databaseConfig?.enabled && (
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      Database <strong>{databaseConfig.provider.toUpperCase()}</strong> siap ditanam ke aplikasi & file <strong>.env.example</strong> akan di-push otomatis!
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                    Siap Pakai
                  </span>
                </div>
              )}

              {/* Smart Gitignore Quick Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      Smart Gitignore Generator
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("gitignore")}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline flex items-center gap-1"
                  >
                    <span>Lihat & Edit Aturan</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {detectedTechs.map((tech) => (
                    <span
                      key={tech.id}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>{tech.name}</span>
                    </span>
                  ))}
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Universal Security (.env, .log, .DS_Store)</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  File <code>.gitignore</code> akan otomatis dibuat dan ditulis ke root project sebelum push dimulai.
                </p>
              </div>

              {/* PAT input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {getText("github_token_label", "Personal Access Token (PAT):")}
                </label>
                <input
                  id="input-github-token"
                  type="password"
                  value={formData.token}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, token: e.target.value }))
                  }
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Masukkan token saat push)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Token membutuhkan izin centang <code className="text-indigo-300">repo</code> di GitHub Developer Settings. Wajib dimasukkan setiap kali push.
                </p>
              </div>

              {/* Repo name & branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {getText("github_repo_label", "Nama Repository:")}
                  </label>
                  <input
                    id="input-github-repo"
                    type="text"
                    value={formData.repoName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, repoName: e.target.value }))
                    }
                    placeholder="my-ghighais-app"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {getText("github_branch_label", "Branch:")}
                  </label>
                  <input
                    id="input-github-branch"
                    type="text"
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, branch: e.target.value }))
                    }
                    placeholder="main"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Commit Message */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {getText("github_commit_label", "Pesan Commit:")}
                </label>
                <input
                  id="input-github-commit-msg"
                  type="text"
                  value={formData.commitMessage}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, commitMessage: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Private repo toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="checkbox-github-private"
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isPrivate: e.target.checked }))
                  }
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="checkbox-github-private"
                  className="text-xs text-slate-300 cursor-pointer select-none flex items-center gap-1.5"
                >
                  {formData.isPrivate ? (
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{getText("github_private_label", "Jadikan Private Repository")}</span>
                </label>
              </div>
            </>
          ) : (
            /* Tab Gitignore Preview & Manual Edit */
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>Hasil Deteksi Cerdas Struktur Proyek</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Memindai {scanFilesCount} file di browser untuk mendeteksi framework & dependensi.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRescan}
                    disabled={isScanning}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                    title="Pindai ulang file"
                  >
                    <RefreshCw className={`w-3 h-3 ${isScanning ? "animate-spin" : ""}`} />
                    <span>Pindai Ulang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsManualEdit(!isManualEdit)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      isManualEdit
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isManualEdit ? "Kunci Tampilan" : "Edit Manual"}</span>
                  </button>
                </div>
              </div>

              {/* Badges of detected technologies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {detectedTechs.map((tech) => (
                  <div
                    key={tech.id}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">{tech.name}</span>
                      <span className="text-[10px] text-slate-400">
                        File kecocokan:{" "}
                        <strong className="text-emerald-300 font-mono">
                          {tech.matchedFiles.join(", ")}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2 text-xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Aturan Keamanan Universal</span>
                    <span className="text-[10px] text-slate-400">
                      Mengecualikan <code>.env</code>, <code>.env.local</code>, <code>*.log</code>, <code>.DS_Store</code>
                    </span>
                  </div>
                </div>
              </div>

              {/* Gitignore code preview / manual edit area */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>Isi File .gitignore yang Akan Dibuat:</span>
                  {isManualEdit && (
                    <span className="text-[10px] text-amber-400 font-mono font-medium">
                      Mode Edit Manual Aktif
                    </span>
                  )}
                </label>
                {isManualEdit ? (
                  <textarea
                    rows={12}
                    value={gitignoreContent}
                    onChange={(e) => setGitignoreContent(e.target.value)}
                    className="w-full bg-slate-950 border border-indigo-500 rounded-xl p-3 text-xs text-indigo-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none shadow-inner"
                    placeholder="Tambahkan aturan pengecualian baris demi baris..."
                  />
                ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-60 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre scrollbar-thin">
                    {gitignoreContent}
                  </div>
                )}
                <p className="text-[10px] text-slate-500 mt-1">
                  File ini akan otomatis ditulis ke root directory sebelum git push berjalan.
                </p>
              </div>
            </div>
          )}

          {/* Status Alert */}
          {status !== "idle" && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                status === "loading"
                  ? "bg-indigo-950/60 border-indigo-500/30 text-indigo-300"
                  : status === "success"
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                  : "bg-red-950/60 border-red-500/40 text-red-300"
              }`}
            >
              {status === "loading" && (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0 mt-0.5" />
              )}
              {status === "success" && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              {status === "error" && (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span>{statusText}</span>
                {status === "success" && createdRepoUrl && (
                  <a
                    href={createdRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition-all"
                  >
                    <span>Buka Repository di GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
          >
            {getText("btn_github_cancel", "Batal")}
          </button>

          <div className="flex items-center gap-2">
            {activeTab === "gitignore" ? (
              <button
                type="button"
                onClick={() => setActiveTab("repo")}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Konfirmasi .gitignore & Kembali
              </button>
            ) : (
              <button
                id="btn-submit-push-github"
                onClick={handlePush}
                disabled={status === "loading"}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{getText("btn_github_submit", "Push Sekarang")}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
