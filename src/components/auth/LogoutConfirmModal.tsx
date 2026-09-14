import React, { useState } from "react";
import { LogOut, BookmarkCheck, Trash2, AlertTriangle, X, ShieldCheck } from "lucide-react";
import { UserProfile } from "../../types";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onSmartLogout: () => void;
  onHardResetLogout: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  user,
  onClose,
  onSmartLogout,
  onHardResetLogout,
}) => {
  const [selectedMode, setSelectedMode] = useState<"smart" | "hard">("smart");

  if (!isOpen || !user) return null;

  return (
    <div
      id="logout-confirm-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        id="logout-confirm-modal"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-left"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Konfirmasi Keluar (Logout)</h3>
              <p className="text-[11px] text-slate-400">Pilih mode keluar untuk sesi Anda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Badge Info */}
        <div className="px-6 pt-4">
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border border-indigo-400/40 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-medium shrink-0 border border-indigo-500/30">
              Email Verifikasi
            </span>
          </div>
        </div>

        {/* Options Selection */}
        <div className="p-6 space-y-3">
          {/* Option 1: Smart Logout (Default) */}
          <button
            type="button"
            onClick={() => setSelectedMode("smart")}
            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
              selectedMode === "smart"
                ? "bg-indigo-950/40 border-indigo-500/70 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500/50"
                : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                selectedMode === "smart"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-white">
                  Smart Logout (Keluar & Simpan Data)
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Rekomendasi
                </span>
              </div>
              <p className="text-[11px] text-slate-300/85 leading-relaxed">
                Hanya mengakhiri sesi autentikasi. Seluruh kode project, draft, dan chat prompt
                terakhir tetap tersimpan aman di perangkat ini dengan key unik{" "}
                <code className="text-indigo-300 text-[10px]">[email]_drafts</code>. Saat masuk
                lagi dengan email yang sama, data akan otomatis dipulihkan (Quick Resume).
              </p>
            </div>
          </button>

          {/* Option 2: Hard Reset */}
          <button
            type="button"
            onClick={() => setSelectedMode("hard")}
            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
              selectedMode === "hard"
                ? "bg-rose-950/40 border-rose-500/70 shadow-lg shadow-rose-950/50 ring-1 ring-rose-500/50"
                : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                selectedMode === "hard" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-rose-200">
                  Reset Semua Data (Hard Reset & Keluar)
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                  Permanen
                </span>
              </div>
              <p className="text-[11px] text-rose-300/80 leading-relaxed">
                Menghapus semua data draft dan pengaturan lokal terkait akun Anda sebelum keluar.
              </p>
              {selectedMode === "hard" && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-2 text-rose-200 text-[10px] leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                  <span>
                    <strong>Peringatan Tegas:</strong> Tindakan ini akan menghapus semua draft dan
                    pengaturan lokal secara permanen.
                  </span>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sesi aman Google Auth</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              Batal
            </button>
            {selectedMode === "smart" ? (
              <button
                type="button"
                id="btn-confirm-smart-logout"
                onClick={() => {
                  onSmartLogout();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Keluar & Simpan Draft</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-confirm-hard-reset-logout"
                onClick={() => {
                  onHardResetLogout();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Semua Data & Keluar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
