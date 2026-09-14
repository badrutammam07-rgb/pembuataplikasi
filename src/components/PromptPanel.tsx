import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, GenerationProgress, AppConfig, DatabaseSetupPreference } from "../types";
import {
  Send,
  Sparkles,
  Bot,
  User,
  PlusCircle,
  Lightbulb,
  CheckCircle2,
  Clock,
  Code2,
  RotateCcw,
  Database,
  Github,
  Link2,
  Clipboard,
  AlertCircle,
  Undo2,
} from "lucide-react";

interface PromptPanelProps {
  messages: ChatMessage[];
  onSendPrompt: (prompt: string) => void;
  onResetChat: () => void;
  onResetAll?: () => void;
  onOpenDatabase?: () => void;
  databasePreference?: DatabaseSetupPreference | null;
  progress: GenerationProgress;
  config: AppConfig;
  undoCount?: number;
  maxUndo?: number;
  onUndoPrompt?: () => void;
  lastUndonePrompt?: string | null;
}

const PROMPT_SUGGESTIONS = [
  "Landing page kedai kopi modern dengan menu interaktif, filter produk & keranjang belanja",
  "Dashboard keuangan pribadi dengan grafik pengeluaran, kalkulator budget & dark mode",
  "Aplikasi catatan Kanban board drag-and-drop dengan filter kategori & penyimpanan lokal",
  "Kalkulator ilmiah modern neumorphism dengan riwayat perhitungan & konversi satuan",
  "Game arkade interaktif Space Shooter di HTML5 Canvas dengan sistem skor & power-up",
];

export const PromptPanel: React.FC<PromptPanelProps> = ({
  messages,
  onSendPrompt,
  onResetChat,
  onResetAll,
  onOpenDatabase,
  databasePreference,
  progress,
  config,
  undoCount = 0,
  maxUndo = 7,
  onUndoPrompt,
  lastUndonePrompt,
}) => {
  const [inputPrompt, setInputPrompt] = useState(() => {
    try {
      return localStorage.getItem("ghighais_prompt_draft") || "";
    } catch {
      return "";
    }
  });
  const [githubUrl, setGithubUrl] = useState("");
  const [githubUrlError, setGithubUrlError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Jika user melakukan undo prompt, isi kembali teks instruksi yang dibatalkan ke kolom input
  useEffect(() => {
    if (lastUndonePrompt) {
      setInputPrompt(lastUndonePrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [lastUndonePrompt]);

  const getText = (key: string, fallback: string) => {
    return config.customTexts[key] || fallback;
  };

  const handleGenerateFromGithub = () => {
    const trimmed = githubUrl.trim();
    if (!trimmed || progress.isGenerating) return;

    if (
      !trimmed.toLowerCase().includes("github.com") &&
      !trimmed.toLowerCase().includes("githubusercontent.com")
    ) {
      setGithubUrlError(
        "Format link URL harus berasal dari GitHub (contoh: https://github.com/username/repository)"
      );
      return;
    }

    setGithubUrlError("");
    let combinedPrompt = trimmed;
    if (inputPrompt.trim()) {
      combinedPrompt = `${trimmed}\n\nInstruksi Tambahan:\n${inputPrompt.trim()}`;
    }

    onSendPrompt(combinedPrompt);
    setGithubUrl("");
    setInputPrompt("");
    try {
      localStorage.removeItem("ghighais_prompt_draft");
    } catch {}
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setGithubUrl(text.trim());
          setGithubUrlError("");
        }
      }
    } catch (e) {
      console.warn("Clipboard read was restricted by browser/iframe:", e);
    }
  };

  // Simpan draf teks secara otomatis agar tidak hilang jika keluar aplikasi
  useEffect(() => {
    try {
      if (inputPrompt) {
        localStorage.setItem("ghighais_prompt_draft", inputPrompt);
      } else {
        localStorage.removeItem("ghighais_prompt_draft");
      }
    } catch (e) {
      console.warn("Storage write error for prompt draft:", e);
    }
  }, [inputPrompt]);

  const handleSend = () => {
    if (!inputPrompt.trim() || progress.isGenerating) return;
    const toSend = inputPrompt.trim();
    onSendPrompt(toSend);
    setInputPrompt("");
    try {
      localStorage.removeItem("ghighais_prompt_draft");
    } catch {}
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, progress.isGenerating]);

  return (
    <div
      id="panel-prompt"
      className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl"
    >
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>{getText("panel_prompt_title", "Prompt & Kolom Chat AI")}</span>
            </h2>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              {getText("panel_prompt_desc", "Prompt berkelanjutan: AI akan memodifikasi kode sebelumnya.")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenDatabase && (
            <button
              id="btn-prompt-open-database"
              onClick={onOpenDatabase}
              className={`p-1.5 px-2 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer ${
                databasePreference?.isConnected
                  ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40"
                  : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
              title="Pilih & Konfigurasi Database Backend (Supabase, Firebase, dll)"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline text-[11px] font-semibold">
                {databasePreference?.provider ? databasePreference.provider.toUpperCase() : "Database"}
              </span>
            </button>
          )}

          {onUndoPrompt && (
            <button
              id="btn-undo-prompt-header"
              onClick={onUndoPrompt}
              disabled={undoCount === 0 || progress.isGenerating}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all border ${
                undoCount > 0 && !progress.isGenerating
                  ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 hover:border-amber-300 active:scale-95 shadow-sm cursor-pointer"
                  : "bg-slate-900/40 text-slate-600 border-slate-800/80 cursor-not-allowed opacity-50"
              }`}
              title={
                undoCount > 0
                  ? `Undo Prompt: Kembalikan editan aplikasi sebelum prompt salah (Tersisa ${undoCount}/${maxUndo} batas undo)`
                  : `Batas undo 7x (Belum ada riwayat prompt untuk di-undo)`
              }
            >
              <Undo2 className={`w-3.5 h-3.5 ${undoCount > 0 ? "text-amber-400" : "text-slate-600"}`} />
              <span className="hidden sm:inline font-medium">
                Undo Prompt <span className="font-mono text-[10px]">({undoCount}/{maxUndo})</span>
              </span>
              <span className="sm:hidden font-mono text-[10px]">
                Undo ({undoCount}/{maxUndo})
              </span>
            </button>
          )}

          {onResetAll && (
            <button
              id="btn-prompt-reset-all"
              onClick={onResetAll}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/20 text-xs flex items-center gap-1 transition-all"
              title="Reset seluruh aplikasi dan kode dari awal"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Reset Awal</span>
            </button>
          )}

          <button
            id="btn-new-prompt-chat"
            onClick={onResetChat}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-all"
            title="Mulai percakapan prompt baru"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">{getText("btn_new_chat", "Chat Baru")}</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Ghighais Brain bertenaga AI Studio
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
              Ketik deskripsi aplikasi web yang ingin Anda buat. Setiap instruksi langsung diproses menghasilkan aplikasi siap uji dan dapat diiterasi tanpa batas!
            </p>

            {/* Quick suggestions */}
            <div className="w-full max-w-md text-left space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-300 font-medium">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>{getText("prompt_suggestion_label", "Inspirasi Cepat:")}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendPrompt(suggestion)}
                    className="text-left text-xs p-2.5 rounded-xl bg-slate-950/60 hover:bg-indigo-950/50 border border-slate-800/90 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all duration-200 leading-snug group"
                  >
                    <span className="text-indigo-400 font-mono mr-1.5 group-hover:translate-x-0.5 inline-block">
                      →
                    </span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                {msg.role === "user" ? (
                  <>
                    <span>Anda</span>
                    <User className="w-3 h-3 text-indigo-400" />
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-emerald-400" />
                    <span className="font-semibold text-indigo-300">
                      AI Coder
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-[9px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-300">
                      Gratis
                    </span>
                  </>
                )}
                <span className="text-slate-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-sm"
                    : "bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-sm"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.codeSnippet && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-indigo-300">
                    <span className="flex items-center gap-1">
                      <Code2 className="w-3 h-3 text-indigo-400" />
                      <span>Kode HTML/CSS/JS telah disinkronkan ke editor</span>
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Real-time Percentage Progress Bar */}
      {progress.isGenerating && (
        <div
          id="ghighais-generation-progress"
          className="px-4 py-3 bg-slate-950/90 border-t border-indigo-500/30 space-y-2 animate-in fade-in"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="font-medium text-indigo-200 truncate max-w-[240px] sm:max-w-xs">
                {progress.statusMessage || "Memproses..."}
              </span>
            </div>
            <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 text-xs">
              {Math.round(progress.percentage)}%
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${Math.min(100, Math.max(5, progress.percentage))}%` }}
            >
              {/* Shimmer light effect */}
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Input Prompt Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
        {/* Kolom Link URL GitHub untuk Generate */}
        <div
          id="section-github-url-input"
          className="bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 rounded-xl p-2.5 transition-all shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5 px-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0">
                <Github className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <label
                htmlFor="input-github-url"
                className="text-xs font-semibold text-white truncate cursor-pointer"
              >
                Kolom Link URL GitHub
              </label>
              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded font-medium shrink-0">
                Generate & Live Preview
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {githubUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setGithubUrl("");
                    setGithubUrlError("");
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-300 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Bersihkan URL"
                >
                  Hapus
                </button>
              )}
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 transition-colors flex items-center gap-1 cursor-pointer"
                title="Tempel URL dari clipboard"
              >
                <Clipboard className="w-3 h-3 text-indigo-400" />
                <span className="hidden sm:inline">Tempel</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                <Link2 className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <input
                id="input-github-url"
                type="url"
                value={githubUrl}
                onChange={(e) => {
                  setGithubUrl(e.target.value);
                  if (githubUrlError) setGithubUrlError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerateFromGithub();
                  }
                }}
                disabled={progress.isGenerating}
                placeholder="https://github.com/username/repository (contoh: https://github.com/tastejs/todomvc)"
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950/90 border border-slate-700/80 focus:border-indigo-500 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>

            <button
              id="btn-generate-github-url"
              type="button"
              onClick={handleGenerateFromGithub}
              disabled={!githubUrl.trim() || progress.isGenerating}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0 ${
                !githubUrl.trim() || progress.isGenerating
                  ? "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 cursor-pointer"
              }`}
              title="Generate dan buka aplikasi langsung dari URL GitHub ini"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>Generate URL</span>
            </button>
          </div>

          {githubUrlError && (
            <div className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{githubUrlError}</span>
            </div>
          )}

          {/* Quick preset examples */}
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400 overflow-x-auto py-0.5 scrollbar-none">
            <span className="text-slate-500 shrink-0">Contoh Cepat:</span>
            <button
              type="button"
              onClick={() => {
                setGithubUrl("https://github.com/tastejs/todomvc");
                if (githubUrlError) setGithubUrlError("");
              }}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-indigo-950/70 hover:text-indigo-300 border border-slate-700/50 transition-colors shrink-0 cursor-pointer"
            >
              tastejs/todomvc
            </button>
            <button
              type="button"
              onClick={() => {
                setGithubUrl("https://github.com/gabrielecirulli/2048");
                if (githubUrlError) setGithubUrlError("");
              }}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-indigo-950/70 hover:text-indigo-300 border border-slate-700/50 transition-colors shrink-0 cursor-pointer"
            >
              gabrielecirulli/2048
            </button>
            <button
              type="button"
              onClick={() => {
                setGithubUrl("https://github.com/mmp/calc");
                if (githubUrlError) setGithubUrlError("");
              }}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-indigo-950/70 hover:text-indigo-300 border border-slate-700/50 transition-colors shrink-0 cursor-pointer"
            >
              mmp/calc
            </button>
          </div>
        </div>

        {/* Textarea Prompt */}
        <div className="relative flex flex-col bg-slate-900 border border-slate-700/80 rounded-xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all p-2">
          <textarea
            ref={textareaRef}
            id="textarea-prompt-input"
            rows={3}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={progress.isGenerating}
            placeholder={getText(
              "prompt_input_placeholder",
              "Ketik prompt aplikasi atau instruksi tambahan untuk URL GitHub di atas... (Enter untuk kirim)"
            )}
            className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none min-h-[56px] max-h-36 overflow-y-auto"
          />

          <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 min-w-0">
              {onUndoPrompt && (
                <button
                  type="button"
                  id="btn-undo-prompt-input"
                  onClick={onUndoPrompt}
                  disabled={undoCount === 0 || progress.isGenerating}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border shrink-0 ${
                    undoCount > 0 && !progress.isGenerating
                      ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 hover:border-amber-400 cursor-pointer shadow-sm active:scale-95"
                      : "bg-slate-900/50 text-slate-600 border-slate-800/60 cursor-not-allowed opacity-50"
                  }`}
                  title={
                    undoCount > 0
                      ? `Kembalikan aplikasi ke versi sebelum instruksi salah (Tersisa ${undoCount}/${maxUndo} batas undo)`
                      : `Batas undo 7x (Belum ada prompt untuk di-undo)`
                  }
                >
                  <Undo2 className={`w-3.5 h-3.5 ${undoCount > 0 ? "text-amber-400" : "text-slate-600"}`} />
                  <span>Undo Prompt ({undoCount}/{maxUndo})</span>
                </button>
              )}
              <span className="hidden xl:inline text-[10px] text-slate-500 truncate">
                {undoCount > 0 ? "Salah instruksi? Ketuk Undo untuk mengembalikan" : "Batas undo 7x"}
              </span>
            </div>

            <button
              id="btn-send-prompt"
              onClick={handleSend}
              disabled={!inputPrompt.trim() || progress.isGenerating}
              className={`ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !inputPrompt.trim() || progress.isGenerating
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/30 active:scale-95"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{getText("btn_submit_prompt", "Generate")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
