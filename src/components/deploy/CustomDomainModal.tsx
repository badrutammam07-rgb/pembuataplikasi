import React, { useState } from "react";
import { DeploymentRecord, CustomDomainMapping } from "../../types";
import {
  Globe,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface CustomDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: DeploymentRecord | null;
  onUpdateDeployment: (updated: DeploymentRecord) => void;
}

export const CustomDomainModal: React.FC<CustomDomainModalProps> = ({
  isOpen,
  onClose,
  deployment,
  onUpdateDeployment,
}) => {
  if (!isOpen || !deployment) return null;

  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copiedText, setCopiedText] = useState("");

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const clean = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "");
    if (!clean || !clean.includes(".")) {
      setErrorMsg("Format domain tidak valid (contoh: kasmt.com atau app.organisasi.id)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/deploy/custom-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deploymentId: deployment.id,
          domain: clean,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menambahkan custom domain.");
      }

      onUpdateDeployment(data.deployment);
      setSuccessMsg(`Domain ${clean} berhasil dipetakan ke ${deployment.subdomain}`);
      setNewDomain("");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menambahkan custom domain.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Custom Domain Mapping</h2>
              <p className="text-xs text-slate-400">
                Hubungkan domain sendiri ke <span className="text-indigo-300 font-mono">{deployment.subdomain}</span>
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
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Instruksi DNS CNAME */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instruksi Pengaturan DNS (Registrar Domain Anda)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Buka dashboard DNS di provider domain Anda (Cloudflare, Niagahoster, Domainesia, GoDaddy, dll), lalu tambahkan record berikut:
            </p>

            <div className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-400 text-[11px] border-b border-slate-800">
                    <th className="p-2.5 font-semibold">Type</th>
                    <th className="p-2.5 font-semibold">Name / Host</th>
                    <th className="p-2.5 font-semibold">Target / Value (CNAME)</th>
                    <th className="p-2.5 font-semibold">TTL / SSL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  <tr>
                    <td className="p-2.5 text-amber-400 font-bold">CNAME</td>
                    <td className="p-2.5 text-slate-200">@ atau subdomain</td>
                    <td className="p-2.5 text-indigo-300 flex items-center gap-1.5">
                      <span>{deployment.subdomain}</span>
                      <button
                        onClick={() => handleCopy(deployment.subdomain)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                        title="Salin Target CNAME"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="p-2.5 text-emerald-400 font-sans">Auto / HTTPS</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {copiedText === deployment.subdomain && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Target CNAME disalin!
              </span>
            )}
          </div>

          {/* Form Tambah Domain */}
          <form onSubmit={handleAddDomain} className="space-y-3">
            <label className="font-semibold text-slate-200 block">
              Tambahkan Custom Domain Baru:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Globe className="w-4 h-4 text-indigo-400" />
                </div>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="contoh: kasmt.com atau app.lembaga.id"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !newDomain.trim()}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  loading || !newDomain.trim()
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                }`}
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Petakan Domain</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}
          </form>

          {/* Daftar Custom Domains Terhubung */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-300 block">
              Daftar Domain Aktif ({deployment.customDomains?.length || 0}):
            </span>

            {(!deployment.customDomains || deployment.customDomains.length === 0) ? (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500">
                Belum ada custom domain yang dipetakan. Tambahkan domain di atas untuk mengaktifkannya.
              </div>
            ) : (
              <div className="space-y-2">
                {deployment.customDomains.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          <span>{item.domain}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" /> SSL Active
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          CNAME → <span className="text-indigo-400 font-mono">{item.cnameTarget}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://${item.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Kunjungi</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
