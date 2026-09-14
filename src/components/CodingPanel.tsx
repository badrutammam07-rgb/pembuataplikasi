import React, { useState, useMemo, useRef } from "react";
import { AppConfig } from "../types";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import {
  Code,
  Copy,
  Check,
  Play,
  RotateCcw,
  CheckCircle2,
  Palette,
  Type,
} from "lucide-react";

interface CodingPanelProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  onManualRun: () => void;
  onResetCode: () => void;
  config: AppConfig;
  isGenerating: boolean;
}

export const CodingPanel: React.FC<CodingPanelProps> = ({
  code,
  onChangeCode,
  onManualRun,
  onResetCode,
  config,
  isGenerating,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSyntaxHighlightingOn, setIsSyntaxHighlightingOn] = useState(true);
  const [fontSize, setFontSize] = useState<"sm" | "base">("sm");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const getText = (key: string, fallback: string) => {
    return config.customTexts[key] || fallback;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate syntax-highlighted HTML from code using Prism
  const highlightedHtml = useMemo(() => {
    if (!code) return "";
    try {
      return Prism.highlight(code, Prism.languages.markup, "markup");
    } catch (err) {
      console.warn("Prism highlight error:", err);
      return code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  }, [code]);

  // Synchronize scrolling between textarea, highlighted pre, and line number gutter
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  const lines = useMemo(() => (code || "").split("\n"), [code]);
  const lineCount = lines.length;
  const charCount = (code || "").length;

  const fontClass = fontSize === "sm" ? "text-[12px] sm:text-[13px] leading-[20px]" : "text-[13px] sm:text-[14px] leading-[22px]";

  return (
    <div
      id="panel-coding"
      className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl"
    >
      {/* Prism Syntax Styling Injector */}
      <style>{`
        .code-editor-pre .token.comment,
        .code-editor-pre .token.prolog,
        .code-editor-pre .token.doctype,
        .code-editor-pre .token.cdata {
          color: #64748b !important;
          font-style: italic !important;
        }
        .code-editor-pre .token.punctuation {
          color: #94a3b8 !important;
        }
        .code-editor-pre .token.tag {
          color: #f43f5e !important;
          font-weight: 600 !important;
        }
        .code-editor-pre .token.tag .token.punctuation {
          color: #cbd5e1 !important;
          font-weight: normal !important;
        }
        .code-editor-pre .token.attr-name {
          color: #38bdf8 !important;
        }
        .code-editor-pre .token.attr-value {
          color: #34d399 !important;
        }
        .code-editor-pre .token.attr-value .token.punctuation {
          color: #6ee7b7 !important;
        }
        .code-editor-pre .token.string {
          color: #34d399 !important;
        }
        .code-editor-pre .token.keyword {
          color: #c084fc !important;
          font-weight: 600 !important;
        }
        .code-editor-pre .token.function {
          color: #60a5fa !important;
        }
        .code-editor-pre .token.boolean,
        .code-editor-pre .token.number {
          color: #fb923c !important;
        }
        .code-editor-pre .token.operator {
          color: #38bdf8 !important;
        }
        .code-editor-pre .token.selector {
          color: #f43f5e !important;
        }
        .code-editor-pre .token.property {
          color: #38bdf8 !important;
        }
        .code-editor-pre .token.important,
        .code-editor-pre .token.bold {
          font-weight: bold !important;
        }
        .code-editor-pre .token.italic {
          font-style: italic !important;
        }
        #editor-code-textarea::selection {
          background-color: rgba(99, 102, 241, 0.4) !important;
          color: transparent !important;
        }
      `}</style>

      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Code className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white">
                {getText("panel_coding_title", "Editor & Inspeksi Kode")}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                index.html
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                <Palette className="w-3 h-3 text-indigo-400" />
                <span>Syntax Color</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              {getText("panel_coding_desc", "Pewarnaan sintaks aktif seperti editor profesional (HTML/CSS/JS).")}
            </p>
          </div>
        </div>

        {/* Action Buttons & View Options */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Toggle Syntax Highlighting Color */}
          <button
            onClick={() => setIsSyntaxHighlightingOn(!isSyntaxHighlightingOn)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isSyntaxHighlightingOn
                ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300 shadow-sm"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
            title="Aktifkan atau nonaktifkan warna sintaks"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">
              {isSyntaxHighlightingOn ? "Warna Aktif" : "Monokrom"}
            </span>
          </button>

          {/* Toggle Font Size */}
          <button
            onClick={() => setFontSize(fontSize === "sm" ? "base" : "sm")}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-all text-xs"
            title="Ubah ukuran huruf"
          >
            <Type className="w-3.5 h-3.5" />
          </button>

          {/* Copy Button */}
          <button
            id="btn-copy-code"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-all"
            title="Salin seluruh kode ke clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">
                  {getText("btn_code_copied", "Tersalin!")}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>{getText("btn_copy_code", "Salin")}</span>
              </>
            )}
          </button>

          {/* Reset Template Button */}
          <button
            id="btn-reset-code"
            onClick={onResetCode}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-all"
            title="Reset ke template starter awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Run Manual Button */}
          <button
            id="btn-run-manual"
            onClick={onManualRun}
            disabled={isGenerating}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
            title="Jalankan kode manual dan sinkronkan ke preview"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{getText("btn_manual_run", "Jalankan")}</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area with Synchronized Syntax Highlighting */}
      <div className="flex-1 relative bg-slate-950 font-mono text-xs overflow-hidden flex">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          className={`w-10 sm:w-12 bg-slate-950 border-r border-slate-800/80 text-slate-600 select-none py-3 text-right pr-2 overflow-hidden ${fontClass}`}
        >
          {Array.from({ length: Math.min(lineCount, 1500) }, (_, i) => (
            <div key={i + 1} className="font-mono">
              {i + 1}
            </div>
          ))}
          {lineCount > 1500 && <div className="text-[10px] text-slate-700">...</div>}
        </div>

        {/* Code Canvas Container */}
        <div className="relative flex-1 h-full overflow-hidden">
          {/* Syntax Highlighted Background (Underneath) */}
          {isSyntaxHighlightingOn && (
            <pre
              ref={preRef}
              aria-hidden="true"
              className={`code-editor-pre absolute inset-0 m-0 p-3 pointer-events-none overflow-hidden font-mono whitespace-pre ${fontClass} tab-size-[2] text-slate-200`}
              style={{
                tabSize: 2,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
            >
              <code
                className="language-markup"
                dangerouslySetInnerHTML={{ __html: highlightedHtml + "\n" }}
              />
            </pre>
          )}

          {/* Editable Textarea (In Front) */}
          <textarea
            id="editor-code-textarea"
            ref={textareaRef}
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            onScroll={handleScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className={`relative w-full h-full p-3 bg-transparent font-mono whitespace-pre outline-none resize-none overflow-auto border-0 ${fontClass} ${
              isSyntaxHighlightingOn
                ? "text-transparent caret-indigo-400 selection:bg-indigo-600/35"
                : "text-slate-200 selection:bg-indigo-600/50 selection:text-white"
            }`}
            style={{
              tabSize: 2,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          />
        </div>
      </div>

      {/* Code stats footer */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span>{lineCount} baris</span>
          <span>•</span>
          <span>{charCount.toLocaleString()} karakter</span>
          <span>•</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Standar HTML5
          </span>
        </div>
        <span className="text-indigo-400 font-mono text-[10px] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Live Auto-Sync Active
        </span>
      </div>
    </div>
  );
};
