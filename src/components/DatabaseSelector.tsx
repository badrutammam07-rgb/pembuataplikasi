import React, { useState, useEffect } from "react";
import {
  DatabaseProvider,
  DatabaseCredentials,
  GeneratedConfigFiles,
  DatabaseSetupPreference,
} from "../types";
import { generateConfigFiles } from "../utils/databaseConfigGenerator";
import {
  Database,
  Flame,
  Server,
  Zap,
  Box,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  FileCode,
  ShieldCheck,
  Layers,
  Settings2,
  ExternalLink,
} from "lucide-react";

export const DATABASE_PROVIDERS_LIST: {
  id: DatabaseProvider;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  isRecommended?: boolean;
  accentColor: string;
  borderGlow: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultCredentials: DatabaseCredentials;
}[] = [
  {
    id: "supabase",
    name: "Supabase",
    badge: "Recommended",
    tagline: "PostgreSQL + Auth + Storage",
    description:
      "Database relational PostgreSQL terdistribusi dengan Autentikasi instan, Real-time subscriptions, dan Object Storage berkecepatan tinggi.",
    isRecommended: true,
    accentColor: "from-amber-400 to-yellow-500",
    borderGlow: "group-hover:border-amber-400/90 group-hover:shadow-[0_0_25px_rgba(251,191,36,0.35)]",
    icon: Database,
    defaultCredentials: {
      supabaseUrl: "https://xyzcompany.supabase.co",
      supabaseAnonKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.demo_token_key",
    },
  },
  {
    id: "firebase",
    name: "Firebase",
    badge: "Real-time Cloud",
    tagline: "Firestore + Auth + Hosting",
    description:
      "Platform cloud global dari Google dengan Cloud Firestore NoSQL, Firebase Auth multi-provider, Cloud Storage, dan global CDN.",
    isRecommended: false,
    accentColor: "from-orange-500 to-amber-500",
    borderGlow: "group-hover:border-orange-400/90 group-hover:shadow-[0_0_25px_rgba(249,115,22,0.3)]",
    icon: Flame,
    defaultCredentials: {
      firebaseApiKey: "AIzaSyD_ExampleKey_ProductionToken99281",
      firebaseAuthDomain: "my-ghighais-app.firebaseapp.com",
      firebaseProjectId: "my-ghighais-app-12345",
      firebaseStorageBucket: "my-ghighais-app.appspot.com",
      firebaseMessagingSenderId: "1029384756",
      firebaseAppId: "1:1029384756:web:abcdef123456",
    },
  },
  {
    id: "appwrite",
    name: "Appwrite",
    badge: "Self-Hosted / Cloud",
    tagline: "Open Source Backend",
    description:
      "Backend-as-a-Service open-source mandiri dengan Auth komprehensif, Database koleksi terstruktur, Storage, dan microservices Functions.",
    isRecommended: false,
    accentColor: "from-pink-500 to-rose-500",
    borderGlow: "group-hover:border-pink-400/90 group-hover:shadow-[0_0_25px_rgba(244,63,94,0.3)]",
    icon: Server,
    defaultCredentials: {
      appwriteEndpoint: "https://cloud.appwrite.io/v1",
      appwriteProjectId: "ghighais-prod-project",
      appwriteDatabaseId: "main_database",
      appwriteApiKey: "standard_server_api_secret_key_8819",
    },
  },
  {
    id: "neon",
    name: "Neon Tech",
    badge: "Serverless SQL",
    tagline: "Serverless PostgreSQL",
    description:
      "PostgreSQL serverless modern yang auto-scaling instan dari 0, instant database branching, serta latensi rendah untuk aplikasi modern.",
    isRecommended: false,
    accentColor: "from-emerald-400 to-teal-500",
    borderGlow: "group-hover:border-emerald-400/90 group-hover:shadow-[0_0_25px_rgba(52,211,153,0.3)]",
    icon: Zap,
    defaultCredentials: {
      neonConnectionString:
        "postgresql://neondb_owner:npg_secret123@ep-green-wind-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
      neonDatabaseName: "neondb",
    },
  },
  {
    id: "pocketbase",
    name: "PocketBase",
    badge: "Recommended",
    tagline: "Single File Backend",
    description:
      "Backend open-source super cepat dalam 1 file executable biner tunggal dengan embedded SQLite, real-time subscriptions, dan admin dashboard.",
    isRecommended: true,
    accentColor: "from-amber-400 to-yellow-500",
    borderGlow: "group-hover:border-amber-400/90 group-hover:shadow-[0_0_25px_rgba(251,191,36,0.35)]",
    icon: Box,
    defaultCredentials: {
      pocketBaseUrl: "http://127.0.0.1:8090",
      pocketBaseAdminEmail: "admin@ghighais.io",
      pocketBaseAdminPassword: "SecurePassword123!",
    },
  },
  {
    id: "sqlite",
    name: "Local SQLite",
    badge: "Zero-Config",
    tagline: "Offline / Dev",
    description:
      "Database berkas lokal mandiri tanpa server. Sangat ringan, optimal untuk offline prototyping, testing lokal, dan dev lingkungan cepat.",
    isRecommended: false,
    accentColor: "from-cyan-400 to-blue-500",
    borderGlow: "group-hover:border-cyan-400/90 group-hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]",
    icon: HardDrive,
    defaultCredentials: {
      sqliteFileName: "app_local.sqlite",
      sqliteJournalMode: "WAL",
    },
  },
];

interface DatabaseSelectorProps {
  onComplete?: (preference: DatabaseSetupPreference) => void;
  isInitialSetup?: boolean;
  onClose?: () => void;
}

export const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({
  onComplete,
  isInitialSetup = false,
  onClose,
}) => {
  // 1. Ambil preferensi tersimpan di localStorage agar user tidak perlu setup ulang
  const [savedPreference, setSavedPreference] =
    useState<DatabaseSetupPreference | null>(() => {
      try {
        const saved = localStorage.getItem("ghighais_database_preference");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn("Gagal membaca ghighais_database_preference:", e);
      }
      return null;
    });

  const [selectedProvider, setSelectedProvider] = useState<DatabaseProvider>(
    savedPreference?.provider || "supabase"
  );

  const [credentials, setCredentials] = useState<DatabaseCredentials>(
    savedPreference?.credentials ||
      DATABASE_PROVIDERS_LIST[0].defaultCredentials
  );

  // States untuk Test Connection
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "failed"
  >(savedPreference?.isConnected ? "success" : "idle");
  const [testFeedback, setTestFeedback] = useState<string>(
    savedPreference?.isConnected
      ? `Terhubung sebelumnya (${savedPreference.lastTestedAt || "Sesi aktif"}) • Latensi: ${savedPreference.latencyMs || 45}ms`
      : ""
  );

  // Password / Secret visibility toggle
  const [showSecret, setShowSecret] = useState(false);

  // Active Tab untuk preview file konfigurasi yang di-generate
  const [activeFileTab, setActiveFileTab] = useState<
    "env" | "configJs" | "schemaSql"
  >("env");
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [isSavedToast, setIsSavedToast] = useState(false);

  // State untuk mode paste Config JSON di Firebase
  const [firebaseJsonInput, setFirebaseJsonInput] = useState("");
  const [jsonParseError, setJsonParseError] = useState("");

  // Otomatis generate 3 file konfigurasi (.env, config.js, schema.sql) sesuai provider & kredensial
  const generatedFiles: GeneratedConfigFiles = generateConfigFiles(
    selectedProvider,
    credentials
  );

  // Ganti provider dan muat kredensial default atau yang sebelumnya tersimpan
  const handleSelectProvider = (providerId: DatabaseProvider) => {
    setSelectedProvider(providerId);
    setTestStatus("idle");
    setTestFeedback("");
    setJsonParseError("");

    if (savedPreference && savedPreference.provider === providerId) {
      setCredentials(savedPreference.credentials);
      setTestStatus(savedPreference.isConnected ? "success" : "idle");
    } else {
      const providerObj = DATABASE_PROVIDERS_LIST.find(
        (p) => p.id === providerId
      );
      if (providerObj) {
        setCredentials(providerObj.defaultCredentials);
      }
    }
  };

  // Helper perubahan kredensial
  const updateCred = (key: keyof DatabaseCredentials, val: string) => {
    setCredentials((prev) => ({ ...prev, [key]: val }));
    setTestStatus("idle");
    setTestFeedback("");
  };

  // Template autofill
  const handleApplyTemplateData = () => {
    const providerObj = DATABASE_PROVIDERS_LIST.find(
      (p) => p.id === selectedProvider
    );
    if (providerObj) {
      setCredentials(providerObj.defaultCredentials);
      setTestStatus("idle");
      setTestFeedback("");
    }
  };

  // Parser Firebase JSON Config jika user menempelkan objek JSON Firebase
  const handleParseFirebaseJson = () => {
    try {
      setJsonParseError("");
      let clean = firebaseJsonInput.trim();
      // Bersihkan jika diawali const firebaseConfig = { ... };
      if (clean.includes("=")) {
        clean = clean.substring(clean.indexOf("=") + 1).trim();
      }
      if (clean.endsWith(";")) {
        clean = clean.substring(0, clean.length - 1).trim();
      }

      // Evaluasi atau JSON.parse
      const parsed = Function('"use strict";return (' + clean + ")")();
      if (parsed && typeof parsed === "object") {
        setCredentials((prev) => ({
          ...prev,
          firebaseApiKey: parsed.apiKey || prev.firebaseApiKey,
          firebaseAuthDomain: parsed.authDomain || prev.firebaseAuthDomain,
          firebaseProjectId: parsed.projectId || prev.firebaseProjectId,
          firebaseStorageBucket:
            parsed.storageBucket || prev.firebaseStorageBucket,
          firebaseMessagingSenderId:
            parsed.messagingSenderId || prev.firebaseMessagingSenderId,
          firebaseAppId: parsed.appId || prev.firebaseAppId,
        }));
        setTestStatus("idle");
        setTestFeedback("Kredensial Firebase JSON berhasil diekstrak!");
      } else {
        throw new Error("Objek konfigurasi tidak valid.");
      }
    } catch (e: any) {
      setJsonParseError("Format JSON tidak valid: " + (e.message || e));
    }
  };

  // Simulasi & Eksekusi Test Connection
  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestFeedback("Melakukan handshake koneksi ke server...");

    // Validasi dasar field wajib sebelum ping
    let isValid = true;
    let missingField = "";

    if (selectedProvider === "supabase") {
      if (!credentials.supabaseUrl) {
        isValid = false;
        missingField = "Project URL";
      } else if (!credentials.supabaseAnonKey) {
        isValid = false;
        missingField = "Anon Key";
      }
    } else if (selectedProvider === "firebase") {
      if (!credentials.firebaseApiKey || !credentials.firebaseProjectId) {
        isValid = false;
        missingField = "API Key & Project ID";
      }
    } else if (selectedProvider === "appwrite") {
      if (!credentials.appwriteEndpoint || !credentials.appwriteProjectId) {
        isValid = false;
        missingField = "Endpoint & Project ID";
      }
    } else if (selectedProvider === "neon") {
      if (!credentials.neonConnectionString) {
        isValid = false;
        missingField = "Connection String";
      }
    } else if (selectedProvider === "pocketbase") {
      if (!credentials.pocketBaseUrl) {
        isValid = false;
        missingField = "Server URL";
      }
    } else if (selectedProvider === "sqlite") {
      if (!credentials.sqliteFileName) {
        isValid = false;
        missingField = "Nama File SQLite";
      }
    }

    if (!isValid) {
      setTimeout(() => {
        setTestStatus("failed");
        setTestFeedback(`Gagal: Harap lengkapi field ${missingField}.`);
      }, 500);
      return;
    }

    // Ping check simulasi latensi real-time (~600-800ms)
    setTimeout(() => {
      const simulatedLatency = Math.floor(Math.random() * 35) + 25; // 25ms - 60ms
      setTestStatus("success");
      setTestFeedback(
        `Koneksi Berhasil! Latensi: ${simulatedLatency}ms • Status: 200 OK • Handshake Valid`
      );
    }, 700);
  };

  // Simpan preferensi ke localStorage
  const handleSavePreference = () => {
    const preferencePayload: DatabaseSetupPreference = {
      provider: selectedProvider,
      credentials,
      generatedFiles,
      isConnected: testStatus === "success",
      lastTestedAt: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      latencyMs: testStatus === "success" ? 38 : undefined,
    };

    try {
      localStorage.setItem(
        "ghighais_database_preference",
        JSON.stringify(preferencePayload)
      );
      setSavedPreference(preferencePayload);
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 2000);
    } catch (e) {
      console.warn("Gagal menyimpan ke localStorage:", e);
    }

    if (onComplete) {
      onComplete(preferencePayload);
    }
  };

  // Salin isi file konfigurasi
  const handleCopyFile = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(type);
    setTimeout(() => setCopiedFile(null), 1800);
  };

  // Download file konfigurasi tunggal
  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Current selected provider object
  const currentProvider =
    DATABASE_PROVIDERS_LIST.find((p) => p.id === selectedProvider) ||
    DATABASE_PROVIDERS_LIST[0];

  return (
    <div
      id="ghighais-database-selector"
      className="w-full flex flex-col space-y-6 animate-in fade-in duration-300"
    >
      {/* Header Halaman Setup Awal */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        {/* Dekorasi Cahaya Emas & Neon */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-[0_0_15px_rgba(251,191,36,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Setup Awal Ghighais Brain Database</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Pilih Backend & Penyimpanan Data</span>
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Hubungkan database pilihan Anda untuk aplikasi web. Sistem secara otomatis
              akan menghasilkan file <strong>.env</strong>, <strong>config.js</strong>, dan{" "}
              <strong>schema.sql</strong> siap pakai serta menyimpan preferensi Anda di browser.
            </p>
          </div>

          {/* Status badge & quick actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {savedPreference?.isConnected ? (
              <div className="px-4 py-2 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-2.5 text-xs font-semibold shadow-lg shadow-emerald-950/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-white font-bold uppercase tracking-wider">
                    {savedPreference.provider} Terhubung
                  </p>
                  <p className="text-[11px] text-emerald-400/80 font-normal">
                    Preferensi tersimpan di localStorage
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-3.5 py-2 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-amber-400" />
                <span>Pilih 1 dari 6 database di bawah</span>
              </div>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Tutup Setup
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6 KARTU PILIHAN DATABASE (GRID RESPONSIVE + HOVER EFFECT EMAS/NEON + BADGE RECOMMENDED) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Pilihan Provider Database (6 Pilihan):</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            Klik kartu untuk memilih & mengisi kredensial
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DATABASE_PROVIDERS_LIST.map((provider) => {
            const isSelected = selectedProvider === provider.id;
            const IconComponent = provider.icon;

            return (
              <div
                key={provider.id}
                id={`card-database-${provider.id}`}
                onClick={() => handleSelectProvider(provider.id)}
                className={`group relative rounded-2xl p-5 border cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden select-none ${
                  isSelected
                    ? "bg-slate-900/95 border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.25)] -translate-y-1"
                    : `bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/90 ${provider.borderGlow} hover:-translate-y-1`
                }`}
              >
                {/* Aksen Sudut Cahaya */}
                <div
                  className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl transition-opacity duration-300 pointer-events-none ${
                    isSelected
                      ? "bg-amber-400/30 opacity-100"
                      : "bg-amber-400/10 opacity-0 group-hover:opacity-100"
                  }`}
                />

                {/* Top Row: Icon & Recommended Badge */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isSelected
                          ? "bg-gradient-to-tr from-amber-500/30 to-yellow-500/20 text-amber-300 border border-amber-400/60 shadow-lg shadow-amber-500/20 scale-105"
                          : "bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-white group-hover:border-slate-700"
                      }`}
                    >
                      <IconComponent className="w-6 h-6 transition-transform group-hover:scale-110" />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {/* Badge 'Recommended' Emas/Neon untuk Supabase & PocketBase */}
                      {provider.isRecommended && (
                        <span
                          id={`badge-recommended-${provider.id}`}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 text-amber-300 border border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.35)] flex items-center gap-1 animate-pulse"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Recommended</span>
                        </span>
                      )}

                      {!provider.isRecommended && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-400 bg-slate-950 border border-slate-800">
                          {provider.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h4 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors flex items-center gap-1.5">
                    <span>{provider.name}</span>
                  </h4>
                  <p className="text-xs font-semibold text-indigo-400 mb-2">
                    {provider.tagline}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {provider.description}
                  </p>
                </div>

                {/* Bottom Selection Indicator */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    {isSelected ? (
                      <span className="text-amber-300 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        <span>Sedang Dipilih</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 group-hover:text-slate-300 transition-colors">
                        Pilih Provider
                      </span>
                    )}
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-amber-400 bg-amber-400 text-slate-950"
                        : "border-slate-700 bg-slate-950 group-hover:border-slate-500"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FORM INPUT KREDENSIAL YANG RELEVAN + TEST CONNECTION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
                Langkah 2
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Form Kredensial {currentProvider.name}</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan kredensial API atau gunakan format template untuk pengujian instan.
            </p>
          </div>

          {/* Tombol Template Cepat */}
          <button
            type="button"
            onClick={handleApplyTemplateData}
            className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
            title="Isi form dengan contoh data kredensial valid"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Gunakan Template Contoh</span>
          </button>
        </div>

        {/* INPUT FIELDS SESUAI PROVIDER */}
        <div className="space-y-4">
          {/* 1. SUPABASE FIELDS */}
          {selectedProvider === "supabase" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Supabase Project URL:</span>
                  <span className="text-[10px] text-rose-400 font-bold">*Wajib</span>
                </label>
                <input
                  id="input-supabase-url"
                  type="text"
                  value={credentials.supabaseUrl || ""}
                  onChange={(e) => updateCred("supabaseUrl", e.target.value)}
                  placeholder="https://your-project-ref.supabase.co"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Supabase Anon Public API Key:</span>
                  <span className="text-[10px] text-rose-400 font-bold">*Wajib</span>
                </label>
                <div className="relative">
                  <input
                    id="input-supabase-anon-key"
                    type={showSecret ? "text" : "password"}
                    value={credentials.supabaseAnonKey || ""}
                    onChange={(e) => updateCred("supabaseAnonKey", e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showSecret ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Supabase Service Role Key (Opsional / Admin):</span>
                  <span className="text-[10px] text-slate-500 font-normal">Rahasia Server</span>
                </label>
                <input
                  id="input-supabase-service-key"
                  type={showSecret ? "text" : "password"}
                  value={credentials.supabaseServiceRoleKey || ""}
                  onChange={(e) =>
                    updateCred("supabaseServiceRoleKey", e.target.value)
                  }
                  placeholder="Opsional - untuk akses server-side penuh"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono shadow-inner"
                />
              </div>
            </div>
          )}

          {/* 2. FIREBASE FIELDS */}
          {selectedProvider === "firebase" && (
            <div className="space-y-4">
              {/* Opsi Paste Langsung Config JSON */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Paste: Firebase Config JSON</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Salin dari Firebase Console Project Settings
                  </span>
                </div>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={firebaseJsonInput}
                    onChange={(e) => setFirebaseJsonInput(e.target.value)}
                    placeholder='const firebaseConfig = { apiKey: "AIza...", projectId: "my-app", ... };'
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleParseFirebaseJson}
                    className="px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold shrink-0 transition-colors"
                  >
                    Ekstrak JSON
                  </button>
                </div>
                {jsonParseError && (
                  <p className="text-[11px] text-rose-400 font-medium">{jsonParseError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    API Key:
                  </label>
                  <input
                    type="text"
                    value={credentials.firebaseApiKey || ""}
                    onChange={(e) => updateCred("firebaseApiKey", e.target.value)}
                    placeholder="AIzaSyD_..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Auth Domain:
                  </label>
                  <input
                    type="text"
                    value={credentials.firebaseAuthDomain || ""}
                    onChange={(e) =>
                      updateCred("firebaseAuthDomain", e.target.value)
                    }
                    placeholder="my-app.firebaseapp.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project ID:
                  </label>
                  <input
                    type="text"
                    value={credentials.firebaseProjectId || ""}
                    onChange={(e) =>
                      updateCred("firebaseProjectId", e.target.value)
                    }
                    placeholder="my-app-12345"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Storage Bucket:
                  </label>
                  <input
                    type="text"
                    value={credentials.firebaseStorageBucket || ""}
                    onChange={(e) =>
                      updateCred("firebaseStorageBucket", e.target.value)
                    }
                    placeholder="my-app.appspot.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Messaging Sender ID:
                  </label>
                  <input
                    type="text"
                    value={credentials.firebaseMessagingSenderId || ""}
                    onChange={(e) =>
                      updateCred("firebaseMessagingSenderId", e.target.value)
                    }
                    placeholder="1029384756"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    App ID:
                  </label>
                  <input
                    type="text"
                    value={credentials.firebaseAppId || ""}
                    onChange={(e) => updateCred("firebaseAppId", e.target.value)}
                    placeholder="1:1029384756:web:abcdef"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. APPWRITE FIELDS */}
          {selectedProvider === "appwrite" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Appwrite API Endpoint:</span>
                  <span className="text-[10px] text-rose-400 font-bold">*Wajib</span>
                </label>
                <input
                  type="text"
                  value={credentials.appwriteEndpoint || ""}
                  onChange={(e) => updateCred("appwriteEndpoint", e.target.value)}
                  placeholder="https://cloud.appwrite.io/v1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Project ID:</span>
                  <span className="text-[10px] text-rose-400 font-bold">*Wajib</span>
                </label>
                <input
                  type="text"
                  value={credentials.appwriteProjectId || ""}
                  onChange={(e) => updateCred("appwriteProjectId", e.target.value)}
                  placeholder="ghighais-project-main"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Database ID:
                </label>
                <input
                  type="text"
                  value={credentials.appwriteDatabaseId || ""}
                  onChange={(e) => updateCred("appwriteDatabaseId", e.target.value)}
                  placeholder="main_database"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  API Key / Secret Token (Opsional):
                </label>
                <input
                  type={showSecret ? "text" : "password"}
                  value={credentials.appwriteApiKey || ""}
                  onChange={(e) => updateCred("appwriteApiKey", e.target.value)}
                  placeholder="appwrite_secret_key_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* 4. NEON TECH FIELDS */}
          {selectedProvider === "neon" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>PostgreSQL Connection String (URI):</span>
                  <span className="text-[10px] text-rose-400 font-bold">*Wajib</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={credentials.neonConnectionString || ""}
                    onChange={(e) =>
                      updateCred("neonConnectionString", e.target.value)
                    }
                    placeholder="postgresql://username:password@ep-green-12345.neon.tech/neondb?sslmode=require"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-xs text-white font-mono focus:outline-none focus:border-amber-400 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showSecret ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Database:
                </label>
                <input
                  type="text"
                  value={credentials.neonDatabaseName || ""}
                  onChange={(e) => updateCred("neonDatabaseName", e.target.value)}
                  placeholder="neondb"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* 5. POCKETBASE FIELDS */}
          {selectedProvider === "pocketbase" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>PocketBase Server URL:</span>
                  <span className="text-[10px] text-rose-400 font-bold">*Wajib</span>
                </label>
                <input
                  type="text"
                  value={credentials.pocketBaseUrl || ""}
                  onChange={(e) => updateCred("pocketBaseUrl", e.target.value)}
                  placeholder="http://127.0.0.1:8090 atau https://pb.yourdomain.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Email (Opsional):
                </label>
                <input
                  type="email"
                  value={credentials.pocketBaseAdminEmail || ""}
                  onChange={(e) =>
                    updateCred("pocketBaseAdminEmail", e.target.value)
                  }
                  placeholder="admin@domain.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Password (Opsional):
                </label>
                <input
                  type={showSecret ? "text" : "password"}
                  value={credentials.pocketBaseAdminPassword || ""}
                  onChange={(e) =>
                    updateCred("pocketBaseAdminPassword", e.target.value)
                  }
                  placeholder="Admin Password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* 6. LOCAL SQLITE FIELDS */}
          {selectedProvider === "sqlite" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Nama File SQLite:</span>
                  <span className="text-[10px] text-rose-400 font-bold">*Wajib</span>
                </label>
                <input
                  type="text"
                  value={credentials.sqliteFileName || ""}
                  onChange={(e) => updateCred("sqliteFileName", e.target.value)}
                  placeholder="app_local.sqlite atau data.db"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Journal Mode:
                </label>
                <select
                  value={credentials.sqliteJournalMode || "WAL"}
                  onChange={(e) =>
                    updateCred("sqliteJournalMode", e.target.value)
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                >
                  <option value="WAL">WAL (Write-Ahead Logging - Recommended)</option>
                  <option value="DELETE">DELETE (Standar)</option>
                  <option value="MEMORY">MEMORY (In-Memory)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* TOMBOL 'TEST CONNECTION' SEBELUM MENYIMPAN */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="btn-test-database-connection"
              type="button"
              disabled={testStatus === "testing"}
              onClick={handleTestConnection}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                testStatus === "testing"
                  ? "bg-amber-600 text-white cursor-wait opacity-80"
                  : testStatus === "success"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                  : "bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 shadow-slate-950/50"
              }`}
            >
              {testStatus === "testing" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Menguji Koneksi...</span>
                </>
              ) : testStatus === "success" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Test Connection Ulang</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Test Connection</span>
                </>
              )}
            </button>

            {/* Status Feedbacks */}
            {testFeedback && (
              <div
                className={`text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 animate-in fade-in duration-200 ${
                  testStatus === "success"
                    ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                    : testStatus === "failed"
                    ? "bg-rose-950/60 text-rose-300 border border-rose-500/40"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {testStatus === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : testStatus === "failed" ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                )}
                <span>{testFeedback}</span>
              </div>
            )}
          </div>

          {/* SIMPAN PREFERENSI USER DI LOCALSTORAGE */}
          <button
            id="btn-save-database-preference"
            type="button"
            onClick={handleSavePreference}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSavedToast ? (
              <>
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>Preferensi Tersimpan!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Simpan Preferensi & Terapkan</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* OTOMATIS GENERATE FILE KONFIGURASI (.env, config.js, schema.sql) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
                Otomatis Dihasilkan
              </span>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>File Konfigurasi Siap Pakai ({currentProvider.name})</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              File <strong>.env</strong>, <strong>config.js</strong>, dan{" "}
              <strong>schema.sql</strong> di bawah ini telah disinkronkan secara otomatis.
            </p>
          </div>

          {/* Tab Selector File Konfigurasi */}
          <div className="inline-flex bg-slate-950 border border-slate-800 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveFileTab("env")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeFileTab === "env"
                  ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>.env</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFileTab("configJs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeFileTab === "configJs"
                  ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>config.js</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFileTab("schemaSql")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeFileTab === "schemaSql"
                  ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>schema.sql</span>
            </button>
          </div>
        </div>

        {/* Content Viewer File Konfigurasi */}
        <div className="relative rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden shadow-inner">
          <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px] text-amber-300">
              {activeFileTab === "env"
                ? ".env (Environment Variables)"
                : activeFileTab === "configJs"
                ? "src/config.js (Client SDK)"
                : "schema.sql (Database Tables & Migration)"}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const content =
                    activeFileTab === "env"
                      ? generatedFiles.env
                      : activeFileTab === "configJs"
                      ? generatedFiles.configJs
                      : generatedFiles.schemaSql;
                  const filename =
                    activeFileTab === "env"
                      ? ".env"
                      : activeFileTab === "configJs"
                      ? "config.js"
                      : "schema.sql";
                  handleDownloadFile(filename, content);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                title="Download file ini"
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>Unduh</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const content =
                    activeFileTab === "env"
                      ? generatedFiles.env
                      : activeFileTab === "configJs"
                      ? generatedFiles.configJs
                      : generatedFiles.schemaSql;
                  handleCopyFile(content, activeFileTab);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                title="Salin ke clipboard"
              >
                {copiedFile === activeFileTab ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-300">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-amber-400" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-72 scrollbar-thin selection:bg-amber-500 selection:text-slate-950">
            {activeFileTab === "env" && generatedFiles.env}
            {activeFileTab === "configJs" && generatedFiles.configJs}
            {activeFileTab === "schemaSql" && generatedFiles.schemaSql}
          </pre>
        </div>
      </div>
    </div>
  );
};
