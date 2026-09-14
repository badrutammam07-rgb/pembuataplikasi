/**
 * Smart Gitignore Generator for Ghighais Brain
 * Pure client-side detection of project technologies and generator of secure, comprehensive .gitignore files.
 */

export interface DetectedTechnology {
  id: string;
  name: string;
  matchedFiles: string[];
  description: string;
  rules: string[];
}

export interface GitignoreScanResult {
  detectedTechs: DetectedTechnology[];
  generatedContent: string;
}

// Aturan bawaan untuk masing-masing teknologi
const TECH_RULES: Record<
  string,
  {
    name: string;
    filePatterns: (string | RegExp)[];
    description: string;
    rules: string[];
  }
> = {
  nodejs: {
    name: "Node.js / React / Vue / Vite",
    filePatterns: [
      "package.json",
      "package-lock.json",
      "bun.lock",
      "yarn.lock",
      "pnpm-lock.yaml",
      "vite.config.ts",
      "vite.config.js",
    ],
    description: "Mengecualikan dependensi node_modules, build output dist/, serta file cache package manager.",
    rules: [
      "# === Node.js / React / Vue / Vite ===",
      "node_modules/",
      "dist/",
      "dist-ssr/",
      "build/",
      ".next/",
      ".nuxt/",
      ".vuepress/dist",
      ".serverless/",
      ".cache/",
      ".parcel-cache/",
      "npm-debug.log*",
      "yarn-debug.log*",
      "yarn-error.log*",
      "pnpm-debug.log*",
      "bun.lockb",
    ],
  },
  python: {
    name: "Python (Django / Flask / FastAPI)",
    filePatterns: [
      "requirements.txt",
      "setup.py",
      "pyproject.toml",
      "Pipfile",
      "Pipfile.lock",
      /\.py$/,
    ],
    description: "Mengecualikan bytecode __pycache__, virtual environment venv/, serta package build artifacts.",
    rules: [
      "# === Python ===",
      "__pycache__/",
      "*.py[cod]",
      "*$py.class",
      "*.so",
      ".Python",
      "build/",
      "develop-eggs/",
      "dist/",
      "downloads/",
      "eggs/",
      ".eggs/",
      "lib/",
      "lib64/",
      "parts/",
      "sdist/",
      "var/",
      "wheels/",
      "*.egg-info/",
      ".installed.cfg",
      "*.egg",
      "venv/",
      "env/",
      ".venv/",
      "ENV/",
      "env.bak/",
      "venv.bak/",
      ".pytest_cache/",
      ".coverage",
      "htmlcov/",
    ],
  },
  golang: {
    name: "Go (Golang)",
    filePatterns: ["go.mod", "go.sum", /\.go$/],
    description: "Mengecualikan binary compiled output, executable, direktori vendor/, serta package test artifacts.",
    rules: [
      "# === Go (Golang) ===",
      "bin/",
      "pkg/",
      "*.exe",
      "*.exe~",
      "*.dll",
      "*.so",
      "*.dylib",
      "*.test",
      "*.out",
      "vendor/",
      "go.work",
    ],
  },
  dotnet: {
    name: "C# / .NET / Visual Studio",
    filePatterns: [/\.sln$/, /\.csproj$/, /\.fsproj$/, /\.vbproj$/],
    description: "Mengecualikan compiler artifacts bin/, obj/, user settings, dan temporary test results.",
    rules: [
      "# === C# / .NET ===",
      "bin/",
      "obj/",
      "*.user",
      "*.suo",
      "*.userosscache",
      "*.sln.docstates",
      "[Dd]ebug/",
      "[Rr]elease/",
      "packages/",
      "TestResults/",
      ".vs/",
    ],
  },
};

// Aturan keamanan universal yang SELALU ditambahkan
export const UNIVERSAL_SECURITY_RULES = [
  "# === Universal Security & Environment (Mandatori) ===",
  ".env",
  ".env.local",
  ".env.*.local",
  "*.env",
  "*.env.*",
  "!*.env.example",
  "*.pem",
  "*.key",
  "*.cert",
  "*.crt",
  "secrets.json",
  "credentials.json",
  "",
  "# === Universal OS & Editor Artifacts ===",
  ".DS_Store",
  ".DS_Store?",
  "._*",
  ".Spotlight-V100",
  ".Trashes",
  "ehthumbs.db",
  "Thumbs.db",
  "Desktop.ini",
  "*.log",
  "*.bak",
  "*.tmp",
  "*.swp",
  "*~",
  ".idea/",
  ".vscode/*",
  "!.vscode/settings.json",
  "!.vscode/tasks.json",
  "!.vscode/launch.json",
  "!.vscode/extensions.json",
];

/**
 * Pindai daftar file project di sisi browser (Client-side JavaScript)
 * dan bangun konten .gitignore yang presisi.
 */
export function detectTechnologiesAndGenerateGitignore(
  fileList: string[],
  customRules: string = ""
): GitignoreScanResult {
  const detectedTechs: DetectedTechnology[] = [];
  const rulesList: string[] = [
    "# .gitignore dibuat secara otomatis oleh Ghighais Brain - Smart Gitignore Generator",
    `# Dibuat pada: ${new Date().toLocaleString("id-ID")}`,
    "",
  ];

  // 1. Periksa setiap teknologi yang didukung
  for (const [techId, techConfig] of Object.entries(TECH_RULES)) {
    const matchedFiles: string[] = [];

    for (const file of fileList) {
      const fileName = file.trim();
      if (!fileName) continue;

      for (const pattern of techConfig.filePatterns) {
        if (typeof pattern === "string") {
          if (fileName.toLowerCase() === pattern.toLowerCase() || fileName.endsWith("/" + pattern)) {
            matchedFiles.push(fileName);
            break;
          }
        } else if (pattern instanceof RegExp) {
          if (pattern.test(fileName)) {
            matchedFiles.push(fileName);
            break;
          }
        }
      }
    }

    if (matchedFiles.length > 0) {
      detectedTechs.push({
        id: techId,
        name: techConfig.name,
        matchedFiles: Array.from(new Set(matchedFiles)),
        description: techConfig.description,
        rules: techConfig.rules,
      });

      rulesList.push(...techConfig.rules);
      rulesList.push("");
    }
  }

  // 2. Selalu tambahkan aturan keamanan universal
  rulesList.push(...UNIVERSAL_SECURITY_RULES);

  // 3. Tambahkan aturan custom jika pengguna memasukkan pengecualian khusus
  if (customRules.trim()) {
    rulesList.push("");
    rulesList.push("# === Aturan Tambahan Kustom (User Defined) ===");
    rulesList.push(customRules.trim());
  }

  rulesList.push("");

  return {
    detectedTechs,
    generatedContent: rulesList.join("\n"),
  };
}

/**
 * Ambil daftar file dari server workspace (jika tersedia),
 * atau fallback ke file dasar jika diakses client-only.
 */
export async function fetchProjectFiles(): Promise<string[]> {
  try {
    const res = await fetch("/api/project/files");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.files) && data.files.length > 0) {
        return data.files;
      }
    }
  } catch (err) {
    console.warn("Could not fetch project files from API:", err);
  }

  // Fallback file standar web app
  return [
    "package.json",
    "index.html",
    "vite.config.ts",
    "tsconfig.json",
    ".env.example",
  ];
}

/**
 * Tulis file .gitignore ke root directory project secara otomatis sebelum push
 */
export async function writeGitignoreToRoot(content: string): Promise<boolean> {
  try {
    const res = await fetch("/api/project/write-gitignore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to write .gitignore to root directory:", err);
    return false;
  }
}
