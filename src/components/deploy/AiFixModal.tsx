import React, { useState } from "react";
import { DeploymentRecord } from "../../types";
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Code2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface AiFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: DeploymentRecord | null;
  onApplyAndRedeploy: (fixedCode: string, deployment: DeploymentRecord) => void;
}

export const AiFixModal: React.FC<AiFixModalProps> = ({
  isOpen,
  onClose,
  deployment,
  onApplyAndRedeploy,
}) => {
  if (!isOpen || !deployment) return null;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [fixedCode, setFixedCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const logs = deployment.buildLogs.join("\n");
      const res = await fetch("/api/deploy/ai-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deploymentId: deployment.id,
          errorLog: logs,
          code: deployment.codeSnapshot || "<!-- No code snapshot -->",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menganalisis kode dengan AI.");
      }

      setDiagnosis(data.diagnosis || "Perbaikan kode otomatis berhasil disiapkan.");
      setFixedCode(data.fixedCode);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal melakukan auto fix.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Fix with Qwen AI Engine</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                  Auto Debugger
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Analisis kendala build project <strong className="text-slate-200">{deployment.projectName}</strong> secara otomatis
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

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {!diagnosis && !isAnalyzing && (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <Sparkles className="w-7 h-7 text-amber-400" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm font-bold text-white">
                  Kirim Log Error ke Model AI Qwen Coder
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Sistem akan memeriksa catatan error build, mendeteksi sumber kesalahan skrip, dan menghasilkan kode baru yang kompatibel tanpa merusak fitur utama.
                </p>
              </div>
              <button
                onClick={handleStartAnalysis}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Mulai Analisis & Perbaikan AI</span>
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-12 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <div className="font-semibold text-slate-200">
                Model AI sedang menelaah log error build dan kode aplikasi...
              </div>
              <p className="text-slate-500 text-[11px]">
                Mengurai dependensi CDN, sintaks event handler, dan sanitasi DOM.
              </p>
            </div>
          )}

          {diagnosis && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Diagnosis box */}
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Hasil Diagnosis AI:</span>
                </div>
                <p className="text-slate-200 leading-relaxed text-xs">
                  {diagnosis}
                </p>
              </div>

              {/* Status Fix */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Kode perbaikan siap diterapkan ke deployment project.</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400/80">
                  {fixedCode ? `${(fixedCode.length / 1024).toFixed(1)} KB` : ""}
                </span>
              </div>

              {/* Code preview snippet */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-400 text-[11px] flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" /> Pratinjau Kode yang Diperbaiki:
                </span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300 scrollbar-thin">
                  <pre>{fixedCode?.slice(0, 800)}...</pre>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Batal
          </button>

          {diagnosis && fixedCode && (
            <button
              onClick={() => {
                onApplyAndRedeploy(fixedCode, deployment);
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <span>Terapkan Kode & Re-deploy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
