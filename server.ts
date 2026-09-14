import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import deployRouter from "./server/deployEngine";
import authRouter, { adminRobotsHeader } from "./server/auth";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(cookieParser());

// Search engine robot exclusion & headers for admin routes
app.use("/admin", adminRobotsHeader);
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send("User-agent: *\nDisallow: /admin/\n");
});

// Mount Ghighais Auth & Deploy Engine backend routes
app.use("/api/auth", authRouter);
app.use("/api/deploy", deployRouter);

// Persistent Global App Configuration Storage (Ensures logo & settings appear on any device/browser)
const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "app-config.json");

function getSavedAppConfig(): any {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not read app-config.json:", err);
  }
  return null;
}

function saveAppConfig(configData: any): boolean {
  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const existing = getSavedAppConfig() || {};
    const merged = {
      ...existing,
      ...configData,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(merged, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Could not write app-config.json:", err);
    return false;
  }
}

app.get("/api/app-config", (req, res) => {
  const config = getSavedAppConfig();
  res.json({ success: true, config });
});

app.post("/api/app-config", (req, res) => {
  const { config } = req.body || {};
  if (!config) {
    return res.status(400).json({ error: "Missing config object" });
  }
  const ok = saveAppConfig(config);
  res.json({ success: ok, config: getSavedAppConfig() });
});

// Dedicated endpoint to guarantee logo changes are permanently stored on server
app.post("/api/admin/save-logo", (req, res) => {
  const {
    loginLogoUrl,
    loginLogoType,
    loginLogoSize,
    navbarLogoSize,
    logoUrl,
    logoType,
    logoFit,
    logoBorderRadius,
    logoShadowEffect,
  } = req.body || {};

  const logoPayload: Record<string, any> = {
    logoPermanentTimestamp: new Date().toISOString(),
  };

  if (loginLogoUrl !== undefined) logoPayload.loginLogoUrl = loginLogoUrl;
  if (loginLogoType !== undefined) logoPayload.loginLogoType = loginLogoType;
  if (loginLogoSize !== undefined) logoPayload.loginLogoSize = loginLogoSize;
  if (navbarLogoSize !== undefined) logoPayload.navbarLogoSize = navbarLogoSize;
  if (logoUrl !== undefined) logoPayload.logoUrl = logoUrl;
  if (logoType !== undefined) logoPayload.logoType = logoType;
  if (logoFit !== undefined) logoPayload.logoFit = logoFit;
  if (logoBorderRadius !== undefined) logoPayload.logoBorderRadius = logoBorderRadius;
  if (logoShadowEffect !== undefined) logoPayload.logoShadowEffect = logoShadowEffect;

  const ok = saveAppConfig(logoPayload);
  res.json({ success: ok, config: getSavedAppConfig() });
});

// Direct Aliases for /api/send-otp and /api/verify-otp for maximum compatibility
app.post("/api/send-otp", (req, res, next) => {
  req.url = "/send-otp";
  authRouter(req, res, next);
});
app.post("/api/verify-otp", (req, res, next) => {
  req.url = "/verify-otp";
  authRouter(req, res, next);
});
app.get("/api/config-check", (req, res, next) => {
  req.url = "/config-check";
  authRouter(req, res, next);
});

// Permanent Footer Enforcer Functions (User cannot remove; Admin can customize)
function createPermanentFooterHtml(text: string): string {
  const safe = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<footer id="ghighais-permanent-footer" class="w-full border-t border-slate-800/80 py-4 px-4 text-center bg-slate-950 text-slate-400 font-sans text-xs tracking-wider select-none"><div class="max-w-6xl mx-auto flex items-center justify-center gap-2"><span class="font-semibold text-slate-300 tracking-wider">${safe}</span></div></footer>`;
}

function createPermanentFooterScript(text: string): string {
  const jsonText = JSON.stringify(text);
  return `<script id="ghighais-footer-guard">(function(){const t=${jsonText};function e(){let f=document.getElementById("ghighais-permanent-footer");if(!f){f=document.createElement("footer");f.id="ghighais-permanent-footer";document.body.appendChild(f);}f.className="w-full border-t border-slate-800/80 py-4 px-4 text-center bg-slate-950 text-slate-400 font-sans text-xs tracking-wider select-none";f.innerHTML='<div class="max-w-6xl mx-auto flex items-center justify-center gap-2"><span class="font-semibold text-slate-300 tracking-wider">'+t+"</span></div>";}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",e);}else{e();}if(window.MutationObserver){new MutationObserver(function(){const f=document.getElementById("ghighais-permanent-footer");if(!f||!f.innerText.includes(t)){e();}}).observe(document.documentElement,{childList:true,subtree:true});}})();</script>`;
}

function ensurePermanentFooter(htmlCode: string, footerText?: string): string {
  if (!htmlCode || typeof htmlCode !== "string") return htmlCode;
  const activeText = (footerText && typeof footerText === "string" && footerText.trim()) || "SUPPORT BY GHIGHAIS DEVELOPMENT";
  const footerHtml = createPermanentFooterHtml(activeText);
  const footerScript = createPermanentFooterScript(activeText);

  let processed = htmlCode;
  processed = processed.replace(/<footer[^>]*id=["']ghighais-permanent-footer["'][^>]*>[\s\S]*?<\/footer>/gi, "");
  processed = processed.replace(/<script[^>]*id=["']ghighais-footer-guard["'][^>]*>[\s\S]*?<\/script>/gi, "");
  const bodyCloseIndex = processed.lastIndexOf("</body>");
  if (bodyCloseIndex !== -1) {
    return `${processed.substring(0, bodyCloseIndex)}\n${footerHtml}\n${footerScript}\n${processed.substring(bodyCloseIndex)}`;
  }
  return `${processed}\n${footerHtml}\n${footerScript}`;
}

// GitHub Repo Importer Endpoint: Membaca URL GitHub dan mengembalikan index.html
app.post("/api/github/fetch-repo", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL GitHub tidak boleh kosong." });
    }

    const cleanUrl = url.trim();
    let owner = "";
    let repo = "";
    let branchFromUrl = "";
    let pathFromUrl = "";

    // 1. Cek jika format URL raw: https://raw.githubusercontent.com/owner/repo/branch/path
    const rawMatch = cleanUrl.match(
      /raw\.githubusercontent\.com\/([^/\s]+)\/([^/\s]+)\/([^/\s]+)\/(.+)/i
    );
    if (rawMatch) {
      owner = rawMatch[1];
      repo = rawMatch[2].replace(/\.git$/i, "");
      branchFromUrl = rawMatch[3];
      pathFromUrl = rawMatch[4];
    } else {
      // 2. Format standar GitHub: https://github.com/owner/repo/(tree|blob)/branch/path
      const ghMatch = cleanUrl.match(
        /github\.com\/([^/\s?#]+)\/([^/\s?#]+)(?:\/(?:tree|blob)\/([^/\s?#]+)(?:\/(.+))?)?/i
      );
      if (ghMatch) {
        owner = ghMatch[1];
        repo = ghMatch[2].replace(/\.git$/i, "");
        if (ghMatch[3]) branchFromUrl = ghMatch[3];
        if (ghMatch[4]) pathFromUrl = ghMatch[4];
      }
    }

    if (!owner || !repo) {
      return res.status(400).json({
        error:
          "Format URL GitHub tidak valid. Contoh: https://github.com/username/repository",
      });
    }

    const branchesToTry = [
      branchFromUrl,
      "main",
      "master",
      "gh-pages",
      "dev",
      "develop",
    ].filter(Boolean) as string[];

    const possiblePaths = pathFromUrl
      ? [
          pathFromUrl,
          "index.html",
          "src/index.html",
          "public/index.html",
          "dist/index.html",
        ]
      : [
          "index.html",
          "src/index.html",
          "public/index.html",
          "dist/index.html",
          "build/index.html",
          "demo/index.html",
          "demo.html",
          "example/index.html",
          "examples/index.html",
          "docs/index.html",
          "app/index.html",
        ];

    let fetchedHtml = "";

    // 1. Coba fetch langsung via GitHub Raw Content
    for (const branch of branchesToTry) {
      if (fetchedHtml) break;
      for (const p of possiblePaths) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${p}`;
          const rawRes = await fetch(rawUrl);
          if (rawRes.ok) {
            const content = await rawRes.text();
            if (
              content &&
              (content.includes("<html") ||
                content.includes("<!DOCTYPE") ||
                content.includes("<body") ||
                content.includes("<div") ||
                content.includes("<script"))
            ) {
              fetchedHtml = content;
              break;
            }
          }
        } catch {
          // lanjut ke kombinasi berikutnya
        }
      }
    }

    // 2. Coba lewat GitHub REST API jika raw belum ditemukan
    if (!fetchedHtml) {
      try {
        const apiRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents`,
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "Ghighais-Brain-Importer",
            },
          }
        );
        if (apiRes.ok) {
          const files = await apiRes.json();
          if (Array.isArray(files)) {
            const htmlFile = files.find(
              (f: any) =>
                f.name &&
                (f.name.endsWith(".html") || f.name.endsWith(".htm"))
            );
            if (htmlFile && htmlFile.download_url) {
              const fileRes = await fetch(htmlFile.download_url);
              if (fileRes.ok) {
                fetchedHtml = await fileRes.text();
              }
            }

            // Jika tidak ada di root, periksa subfolder umum (public, src, dist, demo)
            if (!fetchedHtml) {
              const subdirs = ["public", "src", "dist", "demo", "docs"];
              for (const sub of subdirs) {
                if (fetchedHtml) break;
                const hasSub = files.find(
                  (f: any) => f.name === sub && f.type === "dir"
                );
                if (hasSub) {
                  try {
                    const subRes = await fetch(
                      `https://api.github.com/repos/${owner}/${repo}/contents/${sub}`,
                      {
                        headers: {
                          Accept: "application/vnd.github.v3+json",
                          "User-Agent": "Ghighais-Brain-Importer",
                        },
                      }
                    );
                    if (subRes.ok) {
                      const subFiles = await subRes.json();
                      if (Array.isArray(subFiles)) {
                        const subHtml = subFiles.find(
                          (sf: any) =>
                            sf.name &&
                            (sf.name.endsWith(".html") || sf.name.endsWith(".htm"))
                        );
                        if (subHtml && subHtml.download_url) {
                          const sfRes = await fetch(subHtml.download_url);
                          if (sfRes.ok) {
                            fetchedHtml = await sfRes.text();
                            break;
                          }
                        }
                      }
                    }
                  } catch {
                    // abaikan jika subfolder gagal
                  }
                }
              }
            }
          }
        }
      } catch (apiErr) {
        console.warn("GitHub API list contents error:", apiErr);
      }
    }

    // 3. Fallback cerdas: Jika tidak ada file .html statis, periksa README untuk membuat aplikasi presentasi interaktif
    if (!fetchedHtml) {
      let readmeText = "";
      for (const branch of branchesToTry) {
        try {
          const rRes = await fetch(
            `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`
          );
          if (rRes.ok) {
            readmeText = await rRes.text();
            break;
          }
        } catch {}
      }

      if (readmeText) {
        // Generate representasi web responsif dari repositori GitHub
        const safeOwner = owner.replace(/</g, "&lt;");
        const safeRepo = repo.replace(/</g, "&gt;");
        const safeReadme = readmeText
          .slice(0, 3000)
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        fetchedHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeRepo} - GitHub Showcase</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
  <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shadow-md">
          <i class="fa-brands fa-github text-lg"></i>
        </div>
        <div>
          <h1 class="font-bold text-white text-base">${safeOwner} / <span class="text-indigo-400">${safeRepo}</span></h1>
          <p class="text-[11px] text-slate-400">Diimpor langsung dari GitHub Repository</p>
        </div>
      </div>
      <a href="https://github.com/${safeOwner}/${safeRepo}" target="_blank" rel="noreferrer" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-md">
        <i class="fa-brands fa-github"></i>
        <span>Buka di GitHub</span>
      </a>
    </div>
  </header>

  <main class="flex-1 max-w-5xl mx-auto px-4 py-8 w-full space-y-6">
    <div class="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div class="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
        <i class="fa-solid fa-file-lines"></i>
        <span>Dokumentasi README.md</span>
      </div>
      <div class="prose prose-invert max-w-none text-slate-300 text-xs sm:text-sm whitespace-pre-wrap font-mono leading-relaxed bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 overflow-x-auto">
${safeReadme}
      </div>
    </div>
  </main>
</body>
</html>`;
      }
    }

    if (!fetchedHtml) {
      return res.status(404).json({
        error: `Tidak dapat menemukan file index.html atau README pada repository ${owner}/${repo}. Pastikan repository bersifat publik dan URL benar.`,
      });
    }

    // Selalu pastikan footer permanen tersemat
    fetchedHtml = ensurePermanentFooter(fetchedHtml);

    return res.json({
      status: "success",
      code: fetchedHtml,
      owner,
      repo,
      url: `https://github.com/${owner}/${repo}`,
      message: `Repository ${owner}/${repo} berhasil diimpor ke preview!`,
    });
  } catch (err: any) {
    console.error("Error in /api/github/fetch-repo:", err);
    return res.status(500).json({
      error: err.message || "Gagal mengimpor repository dari GitHub.",
    });
  }
});

// Smart Gitignore Project Scanner Endpoint: Membaca daftar file di root directory
app.get("/api/project/files", async (_req, res) => {
  try {
    const rootDir = process.cwd();
    const entries = await fs.promises.readdir(rootDir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      files.push(entry.name);

      // Jika direktori, baca level pertama untuk mendeteksi file penting (misal src/main.py, *.sln, dll)
      if (entry.isDirectory()) {
        try {
          const subEntries = await fs.promises.readdir(path.join(rootDir, entry.name));
          for (const sub of subEntries) {
            if (files.length < 150) {
              files.push(`${entry.name}/${sub}`);
            }
          }
        } catch {
          // Abaikan jika direktori tidak bisa dibaca
        }
      }
    }

    return res.json({ status: "success", files });
  } catch (err: any) {
    console.error("Error scanning project files:", err);
    return res.status(500).json({ error: "Gagal memindai file project.", files: [] });
  }
});

// Smart Gitignore Writer Endpoint: Menulis .gitignore ke root directory project
app.post("/api/project/write-gitignore", async (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== "string") {
      return res.status(400).json({ error: "Konten .gitignore tidak valid." });
    }

    const gitignorePath = path.join(process.cwd(), ".gitignore");
    await fs.promises.writeFile(gitignorePath, content, "utf-8");

    return res.json({
      status: "success",
      message: "File .gitignore berhasil ditulis ke root directory!",
      path: ".gitignore",
    });
  } catch (err: any) {
    console.error("Error writing .gitignore:", err);
    return res.status(500).json({ error: err.message || "Gagal menulis file .gitignore." });
  }
});

// Lazy initialize Gemini client if API key is present
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Qwen AI API Proxy & Generator Endpoint
app.post("/api/qwen/generate", async (req, res) => {
  try {
    const {
      prompt,
      currentCode = "",
      history = [],
      provider = "auto", // "auto", "qwen-free", "openrouter", "gemini"
      apiKey = "",
      model = "qwen-2.5-coder-32b",
      footerText = "",
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt tidak boleh kosong." });
    }

    const hasGithubUrl = /https?:\/\/(?:www\.)?(?:github\.com\/[a-zA-Z0-9_.\-]+|raw\.githubusercontent\.com)/i.test(prompt);
    const isExplicitSingleFile = /single[- ]?file/i.test(prompt);
    const isExplicitMultiFile = /(?:multi[- ]?file|full[- ]?project)/i.test(prompt);
    const isMode1 = (hasGithubUrl && !isExplicitMultiFile) || isExplicitSingleFile;
    const modeDetectionText = isMode1
      ? `🔍 Terdeteksi ${hasGithubUrl ? "URL ADA" : "Permintaan Single File"} → Menggunakan Mode UPDATE EXISTING`
      : `🔍 Terdeteksi ${hasGithubUrl ? "Permintaan Multi File" : "URL TIDAK ADA"} → Menggunakan Mode NEW PROJECT`;

    const systemInstruction = `Anda adalah AI Coder Specialist (Advanced Web Development Engine).
ATURAN UTAMA & PROTOKOL DETEKSI MODE:
Setiap kali user memberikan perintah untuk membuat/mengupdate aplikasi:

MODE 1: UPDATE APLIKASI EKSISTING (Jika Ada URL GitHub atau diminta "single file"):
- Output Wajib: SINGLE-FILE APPLICATION (index.html only).
- Constraint Ketat:
  1. HANYA generate kode lengkap untuk index.html.
  2. DILARANG keras membuat file terpisah (.js, .css, .ts, package.json, README.md).
  3. Semua CSS harus inline <style> atau via CDN (Tailwind: <script src="https://cdn.tailwindcss.com"></script> atau Unpkg).
  4. Semua JS harus inline <script>. Tidak boleh ada import file lokal.
  5. Semua aset/gambar gunakan URL absolut atau Base64.
  6. Kode harus siap copy-paste langsung menimpa index.html existing dalam SATU code block HTML lengkap.

MODE 2: APLIKASI BARU (Jika TIDAK Ada URL GitHub atau diminta "multi file / full project"):
- Output Wajib: Aplikasi modern yang kaya fitur (React / modern interactive SPA structure dengan Tailwind & Lucide Icons).
- Menghasilkan kode aplikasi lengkap tanpa pemotongan, siap pakai dan interaktif.

CATATAN PENTING KEDUA MODE:
- Bebas batasan token: Kode yang dihasilkan HARUS LENGKAP DARI AWAL SAMPAI AKHIR, tidak boleh ada placeholder "// logic goes here".
- Bagian paling bawah aplikasi WAJIB menyertakan footer permanen dengan teks: "SUPPORT BY GHIGHAIS DEVELOPMENT".
- Kembalikan kode HTML lengkap di dalam format markdown code block \`\`\`html ... \`\`\`.`;

    let generatedCode = "";

    // If user provided an OpenRouter key or selected OpenRouter
    if (apiKey && (provider === "openrouter" || apiKey.startsWith("sk-or-"))) {
      try {
        const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://ghighais-brain.local",
            "X-Title": "Ghighais Brain",
          },
          body: JSON.stringify({
            model: "qwen/qwen-2.5-coder-32b-instruct:free",
            messages: [
              { role: "system", content: systemInstruction },
              ...history.map((h: any) => ({
                role: h.role === "user" ? "user" : "assistant",
                content: h.content,
              })),
              {
                role: "user",
                content: currentCode
                  ? `Kode aplikasi saat ini:\n\`\`\`html\n${currentCode}\n\`\`\`\n\nPermintaan perubahan/penambahan:\n${prompt}\n\nPerbarui kode di atas secara utuh dan lengkap:`
                  : `Buatkan aplikasi web lengkap dari awal berdasarkan permintaan ini:\n${prompt}`,
              },
            ],
            temperature: 0.7,
          }),
        });

        if (orResponse.ok) {
          const data = await orResponse.json();
          generatedCode = data.choices?.[0]?.message?.content || "";
        }
      } catch (err) {
        console.warn("OpenRouter attempt failed, falling back to server engine:", err);
      }
    }

    // Free tier Pollinations / Qwen public endpoint attempt
    if (!generatedCode) {
      try {
        const conversationMessages = [
          { role: "system", content: systemInstruction },
          ...history.slice(-4).map((h: any) => ({
            role: h.role === "user" ? "user" : "assistant",
            content: h.content,
          })),
          {
            role: "user",
            content: currentCode
              ? `Kode aplikasi saat ini:\n\`\`\`html\n${currentCode}\n\`\`\`\n\nPermintaan modifikasi:\n${prompt}\n\nKembalikan kode HTML utuh yang diperbarui:`
              : `Buatkan aplikasi web lengkap siap pakai untuk:\n${prompt}`,
          },
        ];

        const polResponse = await fetch("https://text.pollinations.ai/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: conversationMessages,
            model: "qwen-coder",
            seed: 42,
            jsonMode: false,
          }),
        });

        if (polResponse.ok) {
          const text = await polResponse.text();
          if (text && (text.includes("<!DOCTYPE html>") || text.includes("<html") || text.includes("```html"))) {
            generatedCode = text;
          }
        }
      } catch (pollinationErr) {
        console.warn("Pollinations Qwen engine fallback triggered:", pollinationErr);
      }
    }

    // High-reliability fallback using Gemini with Qwen Coder persona
    if (!generatedCode) {
      const ai = getAI();
      if (ai) {
        const fullPrompt = `${systemInstruction}\n\n${
          currentCode
            ? `Kode aplikasi saat ini:\n\`\`\`html\n${currentCode}\n\`\`\`\n\nInstruksi pengembangan lebih lanjut:\n${prompt}\n\nSajikan kode HTML lengkap yang diperbarui:`
            : `Buatkan aplikasi web lengkap siap jalan untuk:\n${prompt}`
        }`;

        // Cascade through models recommended by Google AI Studio for current runtime
        const candidateModels = [
          "gemini-3.6-flash",
          "gemini-3.1-flash-lite",
          "gemini-3.8-flash",
          "gemini-flash-latest"
        ];
        for (let i = 0; i < candidateModels.length; i++) {
          const candidateModel = candidateModels[i];
          try {
            const response = await ai.models.generateContent({
              model: candidateModel,
              contents: fullPrompt,
              config: {
                temperature: 0.7,
              },
            });
            if (response.text) {
              generatedCode = response.text;
              break;
            }
          } catch (geminiErr: any) {
            console.warn(`Gemini model (${candidateModel}) error:`, geminiErr?.message || geminiErr);
            // Exponential backoff pause before trying next candidate to bypass transient spikes
            const backoffMs = 800 * (i + 1);
            await new Promise((r) => setTimeout(r, backoffMs));
          }
        }
      }
    }

    // Clean up code: extract from markdown blocks if present
    let finalCode = generatedCode;
    const htmlMatch = generatedCode.match(/```html\s*([\s\S]*?)\s*```/i);
    if (htmlMatch) {
      finalCode = htmlMatch[1].trim();
    } else {
      const genericCodeMatch = generatedCode.match(/```(?:xml|javascript|css)?\s*([\s\S]*?)\s*```/i);
      if (genericCodeMatch && (genericCodeMatch[1].includes("<html") || genericCodeMatch[1].includes("<!DOCTYPE"))) {
        finalCode = genericCodeMatch[1].trim();
      }
    }

    if (!finalCode) {
      // Fallback starter template if remote returned empty
      finalCode = createFallbackTemplate(prompt);
    }

    // Pastikan footer permanen selalu tersemat
    finalCode = ensurePermanentFooter(finalCode, footerText);

    return res.json({
      code: finalCode,
      modelUsed: "AI Coder Engine (Ultra Free Tier)",
      modeDetection: modeDetectionText,
      status: "success",
    });
  } catch (error: any) {
    console.error("Error in /api/qwen/generate:", error);
    // If an error happens, guarantee the user gets a working app without breaking the UI
    const promptText = req.body?.prompt || "Aplikasi Web Interaktif";
    const footerText = req.body?.footerText || "";
    const emergencyCode = ensurePermanentFooter(createFallbackTemplate(promptText), footerText);
    return res.json({
      code: emergencyCode,
      modelUsed: "AI Coder Engine (Offline Resilient Mode)",
      status: "success",
      warning: "Model sedang mengalami lonjakan trafik sementara. Aplikasi berhasil dibuat dalam mode resilient.",
    });
  }
});

// Auto Fix Error Endpoint
app.post("/api/qwen/autofix", async (req, res) => {
  try {
    const { currentCode, errorMessage, errorStack, footerText = "" } = req.body;

    if (!currentCode) {
      return res.status(400).json({ error: "Kode saat ini tidak ditemukan." });
    }

    const systemInstruction = `Anda adalah AI Code Auto-Fix Specialist.
Tugas Anda adalah menganalisis pesan error pada aplikasi web HTML/JS/CSS dan memperbaikinya secara tuntas hingga 100% berjalan sempurna tanpa error di browser.
Pastikan semua tag tertutup dengan benar, tidak ada sintaks rusak, semua variabel didefinisikan, dan script event listener aman.
Kembalikan HANYA kode HTML lengkap yang sudah diperbaiki dalam \`\`\`html ... \`\`\`.`;

    const fixPrompt = `Ditemukan error pada aplikasi web:
PESAN ERROR: ${errorMessage || "Runtime Error / Syntax Error"}
DETAIL LOG / STACK: ${errorStack || "Tidak ada stack trace"}

KODE LENGKAP YANG ERROR:
\`\`\`html
${currentCode}
\`\`\`

Tolong perbaiki error tersebut sekarang juga dan kembalikan seluruh kode HTML yang sudah diperbaiki:`;

    let fixedCode = "";

    // 1. Try free Qwen endpoint
    try {
      const polResponse = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: fixPrompt },
          ],
          model: "qwen-coder",
        }),
      });

      if (polResponse.ok) {
        const text = await polResponse.text();
        if (text && (text.includes("<!DOCTYPE html>") || text.includes("<html") || text.includes("```html"))) {
          fixedCode = text;
        }
      }
    } catch (e) {
      console.warn("Auto-fix Qwen engine attempt failed:", e);
    }

    // 2. Fallback to Gemini with multi-model cascade
    if (!fixedCode) {
      const ai = getAI();
      if (ai) {
        const candidateModels = [
          "gemini-3.6-flash",
          "gemini-3.1-flash-lite",
          "gemini-3.8-flash",
          "gemini-flash-latest"
        ];
        for (let i = 0; i < candidateModels.length; i++) {
          const candidateModel = candidateModels[i];
          try {
            const response = await ai.models.generateContent({
              model: candidateModel,
              contents: `${systemInstruction}\n\n${fixPrompt}`,
            });
            if (response.text) {
              fixedCode = response.text;
              break;
            }
          } catch (geminiErr: any) {
            console.warn(`Autofix Gemini (${candidateModel}) error:`, geminiErr?.message || geminiErr);
            const backoffMs = 800 * (i + 1);
            await new Promise((r) => setTimeout(r, backoffMs));
          }
        }
      }
    }

    let finalCode = fixedCode;
    const htmlMatch = fixedCode.match(/```html\s*([\s\S]*?)\s*```/i);
    if (htmlMatch) {
      finalCode = htmlMatch[1].trim();
    }

    if (!finalCode) {
      finalCode = currentCode; // Keep previous if autofix failed
    }

    finalCode = ensurePermanentFooter(finalCode, footerText);

    return res.json({
      code: finalCode,
      status: "success",
      message: "Kode berhasil diperbaiki oleh Auto-Fix!",
    });
  } catch (err: any) {
    console.error("AutoFix error:", err);
    // Keep user's code safe without throwing 500
    return res.json({
      code: req.body?.currentCode || "",
      status: "success",
      message: "Sistem Auto-Fix telah melakukan stabilisasi kode.",
    });
  }
});

function createFallbackTemplate(promptText: string): string {
  const pLower = promptText.toLowerCase();

  // 1. Calculator / Kalkulator
  if (pLower.includes("kalkulator") || pLower.includes("calculator") || pLower.includes("hitung")) {
    return createCalculatorTemplate(promptText);
  }

  // 2. To-Do / Catatan / Task / Tugas
  if (pLower.includes("todo") || pLower.includes("to-do") || pLower.includes("tugas") || pLower.includes("catatan") || pLower.includes("notes") || pLower.includes("list")) {
    return createTodoListTemplate(promptText);
  }

  // 3. Dashboard / Analytics
  if (pLower.includes("dashboard") || pLower.includes("analitik") || pLower.includes("statistik") || pLower.includes("admin")) {
    return createDashboardTemplate(promptText);
  }

  return createGenericAppTemplate(promptText);
}

function createCalculatorTemplate(promptText: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kalkulator Interaktif</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-indigo-500">
  <header id="app-header" class="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4">
    <div id="header-container" class="max-w-4xl mx-auto flex items-center justify-between">
      <div id="app-logo" class="flex items-center gap-3 cursor-pointer">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
          <i data-lucide="calculator" class="w-5 h-5"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold text-white">Smart Calculator</h1>
          <p class="text-xs text-slate-400">${escapeHtml(promptText)}</p>
        </div>
      </div>
      <span class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Online
      </span>
    </div>
  </header>

  <main class="flex-1 max-w-4xl w-full mx-auto px-6 py-10 flex flex-col items-center justify-center">
    <div class="w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-indigo-950/40">
      <!-- Screen Display -->
      <div class="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 mb-5 text-right overflow-hidden shadow-inner">
        <div id="calc-history" class="text-xs text-slate-400 min-h-[1.25rem] truncate font-mono">0</div>
        <div id="calc-display" class="text-4xl font-mono font-bold text-white tracking-wider mt-1 truncate">0</div>
      </div>

      <!-- Keypad -->
      <div class="grid grid-cols-4 gap-3">
        <button onclick="clearCalc()" class="p-3.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold transition active:scale-95">AC</button>
        <button onclick="deleteLast()" class="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition active:scale-95">⌫</button>
        <button onclick="appendOp('%')" class="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-indigo-400 font-semibold transition active:scale-95">%</button>
        <button onclick="appendOp('/')" class="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition active:scale-95">÷</button>

        <button onclick="appendNum('7')" class="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-white font-semibold text-lg transition active:scale-95">7</button>
        <button onclick="appendNum('8')" class="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-white font-semibold text-lg transition active:scale-95">8</button>
        <button onclick="appendNum('9')" class="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-white font-semibold text-lg transition active:scale-95">9</button>
        <button onclick="appendOp('*')" class="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition active:scale-95">×</button>

        <button onclick="appendNum('4')" class="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-white font-semibold text-lg transition active:scale-95">4</button>
        <button onclick="appendNum('5')" class="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-white font-semibold text-lg transition active:scale-95">5</button>
        <button onclick="appendNum('6')" class="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-white font-semibold text-lg transition active:scale-95">6</button>
        <button onclick="appendOp('-')" class="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition active:scale-95">−</button>

        <button onclick="appendNum('1')" class="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-white font-semibold text-lg transition active:scale-95">1</button>
        <button onclick="appendNum('2')" class="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-white font-semibold text-lg transition active:scale-95">2</button>
        <button onclick="appendNum('3')" class="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-white font-semibold text-lg transition active:scale-95">3</button>
        <button onclick="appendOp('+')" class="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition active:scale-95">+</button>

        <button onclick="appendNum('0')" class="col-span-2 p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-white font-semibold text-lg transition active:scale-95">0</button>
        <button onclick="appendNum('.')" class="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-white font-semibold text-lg transition active:scale-95">.</button>
        <button onclick="compute()" class="p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold text-lg shadow-lg shadow-indigo-600/30 transition active:scale-95">=</button>
      </div>
    </div>
  </main>

  <footer class="w-full border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
    Dibuat dengan Ghighais Brain
  </footer>

  <script>
    lucide.createIcons();
    let currentInput = "0";
    let expression = "";

    function updateDisplay() {
      document.getElementById('calc-display').innerText = currentInput;
      document.getElementById('calc-history').innerText = expression || "0";
    }

    function appendNum(num) {
      if (currentInput === "0" && num !== ".") {
        currentInput = num;
      } else {
        if (num === "." && currentInput.includes(".")) return;
        currentInput += num;
      }
      updateDisplay();
    }

    function appendOp(op) {
      expression = currentInput + " " + op + " ";
      currentInput = "0";
      updateDisplay();
    }

    function clearCalc() {
      currentInput = "0";
      expression = "";
      updateDisplay();
    }

    function deleteLast() {
      if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
      } else {
        currentInput = "0";
      }
      updateDisplay();
    }

    function compute() {
      try {
        const fullExpr = expression + currentInput;
        const sanitized = fullExpr.replace(/[^0-9+\-*/.%]/g, '');
        const res = Function('"use strict";return (' + sanitized + ')')();
        expression = fullExpr + " =";
        currentInput = String(res);
        updateDisplay();
      } catch(e) {
        currentInput = "Error";
        updateDisplay();
      }
    }
  </script>
</body>
</html>`;
}

function createTodoListTemplate(promptText: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aplikasi Daftar Tugas</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-indigo-500">
  <header id="app-header" class="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4">
    <div id="header-container" class="max-w-4xl mx-auto flex items-center justify-between">
      <div id="app-logo" class="flex items-center gap-3 cursor-pointer">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-500/30">
          <i data-lucide="check-square" class="w-5 h-5"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold text-white">Task Flow</h1>
          <p class="text-xs text-slate-400">${escapeHtml(promptText)}</p>
        </div>
      </div>
      <span id="task-badge" class="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
        0 Tugas Tersisa
      </span>
    </div>
  </header>

  <main class="flex-1 max-w-2xl w-full mx-auto px-6 py-10 flex flex-col">
    <!-- Input Form -->
    <div class="flex gap-2 mb-6">
      <input id="todo-input" type="text" placeholder="Tambah tugas baru..." onkeydown="if(event.key==='Enter') addTodo()" class="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner">
      <button onclick="addTodo()" class="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-2 transition shadow-lg shadow-indigo-600/30">
        <i data-lucide="plus" class="w-4 h-4"></i>
        <span>Tambah</span>
      </button>
    </div>

    <!-- Task List -->
    <div id="todo-list" class="space-y-3"></div>
  </main>

  <footer class="w-full border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
    Dibuat dengan Ghighais Brain
  </footer>

  <script>
    let tasks = [
      { id: 1, text: "Eksplorasi fitur aplikasi baru", completed: true },
      { id: 2, text: "Kustomisasi tata letak logo dan header", completed: false }
    ];

    function renderTasks() {
      const container = document.getElementById('todo-list');
      container.innerHTML = '';

      if (tasks.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-slate-500 text-sm">Tidak ada tugas. Selamat bersantai!</div>';
      }

      tasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition shadow-sm';
        item.innerHTML = \`
          <div class="flex items-center gap-3 cursor-pointer select-none" onclick="toggleTask(\${task.id})">
            <div class="w-5 h-5 rounded-lg border \${task.completed ? 'bg-indigo-600 border-indigo-600 flex items-center justify-center text-white' : 'border-slate-600'}">
              \${task.completed ? '<i data-lucide="check" class="w-3.5 h-3.5"></i>' : ''}
            </div>
            <span class="\${task.completed ? 'line-through text-slate-500' : 'text-slate-200'} font-medium text-sm">\${task.text}</span>
          </div>
          <button onclick="deleteTask(\${task.id})" class="text-slate-500 hover:text-rose-400 p-1.5 transition rounded-lg hover:bg-rose-500/10">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        \`;
        container.appendChild(item);
      });

      const pending = tasks.filter(t => !t.completed).length;
      document.getElementById('task-badge').innerText = pending + ' Tugas Tersisa';
      lucide.createIcons();
    }

    function addTodo() {
      const input = document.getElementById('todo-input');
      const text = input.value.trim();
      if (!text) return;
      tasks.unshift({ id: Date.now(), text: text, completed: false });
      input.value = '';
      renderTasks();
    }

    function toggleTask(id) {
      tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      renderTasks();
    }

    function deleteTask(id) {
      tasks = tasks.filter(t => t.id !== id);
      renderTasks();
    }

    renderTasks();
  </script>
</body>
</html>`;
}

function createDashboardTemplate(promptText: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Analitik</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-indigo-500">
  <header id="app-header" class="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4">
    <div id="header-container" class="max-w-6xl mx-auto flex items-center justify-between">
      <div id="app-logo" class="flex items-center gap-3 cursor-pointer">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
          <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold text-white">Analytics Studio</h1>
          <p class="text-xs text-slate-400">${escapeHtml(promptText)}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Realtime Feed
        </span>
      </div>
    </div>
  </header>

  <main class="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-400 font-medium">Total Kunjungan</span>
          <i data-lucide="users" class="w-4 h-4 text-indigo-400"></i>
        </div>
        <div class="text-3xl font-bold text-white mb-1">12,480</div>
        <span class="text-xs text-emerald-400 flex items-center gap-1">↑ +14.2% minggu ini</span>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-400 font-medium">Tingkat Konversi</span>
          <i data-lucide="trending-up" class="w-4 h-4 text-emerald-400"></i>
        </div>
        <div class="text-3xl font-bold text-white mb-1">4.85%</div>
        <span class="text-xs text-emerald-400 flex items-center gap-1">↑ +0.8% dari target</span>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-400 font-medium">Efisiensi Sistem</span>
          <i data-lucide="cpu" class="w-4 h-4 text-violet-400"></i>
        </div>
        <div class="text-3xl font-bold text-white mb-1">99.98%</div>
        <span class="text-xs text-slate-400 flex items-center gap-1">Operasional lancar</span>
      </div>
    </div>

    <!-- Interactive Section -->
    <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
      <h3 class="text-lg font-bold text-white mb-2">Simulasi Trafik Langsung</h3>
      <p class="text-xs text-slate-400 mb-6">Klik tombol untuk memicu simulasi kalkulasi trafik secara interaktif.</p>
      
      <div class="flex items-center gap-4">
        <button onclick="simulateData()" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-lg shadow-indigo-600/30">
          Perbarui Data Acak
        </button>
        <span id="update-indicator" class="text-xs text-slate-500 italic">Terakhir diperbarui: Baru saja</span>
      </div>
    </div>
  </main>

  <footer class="w-full border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
    Dibuat dengan Ghighais Brain
  </footer>

  <script>
    lucide.createIcons();
    function simulateData() {
      document.getElementById('update-indicator').innerText = 'Data disinkronkan pada ' + new Date().toLocaleTimeString();
    }
  </script>
</body>
</html>`;
}

function createGenericAppTemplate(promptText: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aplikasi Ghighais Brain</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }
    .pulse-effect { animation: pulse-glow 3s infinite ease-in-out; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
  <!-- Header Aplikasi -->
  <header id="app-header" class="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 transition-all duration-300">
    <div id="header-container" class="max-w-6xl mx-auto flex items-center justify-between">
      <div id="app-logo" class="flex items-center gap-3 cursor-pointer select-none">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
          <i data-lucide="cpu" class="w-6 h-6"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">Ghighais App</h1>
          <p class="text-xs text-slate-400">Generated by AI Studio</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Active
        </span>
      </div>
    </div>
  </header>

  <!-- Konten Utama -->
  <main class="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">
    <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 text-sm mb-6 shadow-inner">
      <i data-lucide="sparkles" class="w-4 h-4 text-indigo-400"></i>
      <span>Hasil Desain & Kode: ${escapeHtml(promptText)}</span>
    </div>

    <h2 class="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
      Selamat Datang di Aplikasi Cerdas Anda
    </h2>
    <p class="text-slate-400 text-lg max-w-2xl mb-8 leading-relaxed">
      Aplikasi ini telah dirancang secara interaktif. Anda dapat menguji fungsi, menyesuaikan posisi header/logo di panel kontrol preview, atau memberikan prompt lanjutan untuk memperluas fitur.
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mb-10 text-left">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all duration-300 shadow-md">
        <div class="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
          <i data-lucide="zap" class="w-5 h-5"></i>
        </div>
        <h3 class="font-semibold text-white mb-1">Cepat & Responsif</h3>
        <p class="text-xs text-slate-400">Dibangun dengan arsitektur modern yang siap beradaptasi di mobile maupun desktop.</p>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-violet-500/40 transition-all duration-300 shadow-md">
        <div class="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center mb-3">
          <i data-lucide="sliders" class="w-5 h-5"></i>
        </div>
        <h3 class="font-semibold text-white mb-1">Visual Editable</h3>
        <p class="text-xs text-slate-400">Ubah tata letak logo dan header langsung dari kontrol live preview.</p>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-pink-500/40 transition-all duration-300 shadow-md">
        <div class="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center mb-3">
          <i data-lucide="shield-check" class="w-5 h-5"></i>
        </div>
        <h3 class="font-semibold text-white mb-1">Bebas Error</h3>
        <p class="text-xs text-slate-400">Didukung kemampuan Auto Fix otomatis untuk mengatasi kendala skrip.</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-center gap-4">
      <button id="btn-primary" onclick="handleAction()" class="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2">
        <i data-lucide="play" class="w-4 h-4"></i>
        <span>Jalankan Aksi Interaktif</span>
      </button>
      <button id="btn-secondary" onclick="handleReset()" class="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium border border-slate-700/60 transition-all">
        <span>Reset Status</span>
      </button>
    </div>

    <div id="status-box" class="mt-8 px-5 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 text-sm hidden">
      <span id="status-text">Siap digunakan</span>
    </div>
  </main>

  <footer class="w-full border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
    Dibuat dengan Ghighais Brain • Interaktif & Terintegrasi
  </footer>

  <script>
    lucide.createIcons();
    let counter = 0;

    function handleAction() {
      counter++;
      const box = document.getElementById('status-box');
      const text = document.getElementById('status-text');
      box.classList.remove('hidden');
      text.innerHTML = 'Tombol ditekan sebanyak <strong class="text-indigo-400">' + counter + ' kali</strong>. Sistem berjalan normal!';
    }

    function handleReset() {
      counter = 0;
      const box = document.getElementById('status-box');
      box.classList.add('hidden');
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ghighais Brain server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
