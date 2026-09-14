import React, { useState } from "react";
import { DeploymentRecord } from "../../types";
import {
  Terminal,
  X,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface BuildLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: DeploymentRecord | null;
  onAiFix?: (deployment: DeploymentRecord) => void;
}

export const BuildLogsModal: React.FC<BuildLogsModalProps> = ({
  isOpen,
  onClose,
  deployment,
  onAiFix,
}) => {
  if (!isOpen || !deployment) return null;

  const [copied, setCopied] = useState(false);

  const logsText = deployment.buildLogs?.join("\n") || "Tidak ada log build.";

  const handleCopy = () => {
    navigator.clipboard?.writeText(logsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFailed = deployment.status === "failed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Build & Deployment Logs</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    deployment.status === "live"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : isFailed
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {deployment.status}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Project: <strong className="text-slate-200">{deployment.projectName}</strong> • Subdomain: <span className="text-indigo-400 font-mono">{deployment.subdomain}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live URL Bar if Success */}
        {deployment.status === "live" && (
          <div className="px-6 py-2.5 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between text-xs">
            <span className="text-emerald-300 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deployment Live & Siap Diakses Publik:</span>
            </span>
            <a
              href={deployment.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-300 hover:text-white font-mono underline flex items-center gap-1 font-semibold"
            >
              <span>{deployment.liveUrl}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Failure banner with AI Fix button */}
        {isFailed && (
          <div className="px-6 py-3 bg-rose-950/40 border-b border-rose-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Deployment mengalami kendala pada tahap build engine.</span>
            </div>
            {onAiFix && (
              <button
                onClick={() => onAiFix(deployment)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Fix with Qwen AI</span>
              </button>
            )}
          </div>
        )}

        {/* Log Viewer (Terminal look) */}
        <div className="p-4 bg-slate-950 flex-1 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed scrollbar-thin">
          <div className="space-y-1">
            {deployment.buildLogs?.map((line, i) => {
              const isError = line.includes("Error") || line.includes("gagal") || line.includes("🔴");
              const isSuccess = line.includes("Live") || line.includes("✅") || line.includes("sukses") || line.includes("🟢");
              const isStep = line.includes("[Step");

              return (
                <div
                  key={i}
                  className={`py-0.5 px-2 rounded ${
                    isError
                      ? "text-rose-400 bg-rose-500/10 font-bold"
                      : isSuccess
                      ? "text-emerald-300 bg-emerald-500/10"
                      : isStep
                      ? "text-indigo-300 font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  {line}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Log Disalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Salin Seluruh Log</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            {onAiFix && (
              <button
                onClick={() => onAiFix(deployment)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-500/30"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Analisis Masalah dengan AI</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
