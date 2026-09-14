import React, { useState } from "react";
import { AlertTriangle, RotateCcw, X, Trash2 } from "lucide-react";

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options?: { clearSavedDrafts?: boolean }) => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [clearDrafts, setClearDrafts] = useState(true);

  if (!isOpen) return null;

  return (
    <div
      id="reset-confirm-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        id="reset-confirm-modal"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-left"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Konfirmasi Reset Total</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Apakah Anda tetap ingin melanjutkan reset workspace?
          </p>
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs text-rose-300 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5 text-rose-200">
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Semua Prompt & Coding Akan Dibersihkan</span>
            </p>
            <p className="text-[11px] text-rose-300/80 leading-normal">
              Seluruh riwayat obrolan prompt dan semua kode aplikasi akan dihapus dan dikosongkan. Pastikan Anda telah mengunduh ZIP atau mem-push kode jika ingin menyimpannya.
            </p>
          </div>

          {/* Hard Reset Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
            <input
              type="checkbox"
              checked={clearDrafts}
              onChange={(e) => setClearDrafts(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900"
            />
            <div className="text-[11px] leading-tight">
              <span className="font-semibold text-white block mb-0.5">
                Hard Reset (Hapus Draf Akun dari Perangkat)
              </span>
              <span className="text-rose-300/90 text-[10px]">
                Tindakan ini akan menghapus semua draft dan pengaturan lokal secara permanen.
              </span>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2.5">
          <button
            id="btn-cancel-reset"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            id="btn-confirm-reset"
            onClick={() => {
              onConfirm({ clearSavedDrafts: clearDrafts });
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold shadow-md shadow-rose-600/25 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ya, Lanjutkan Bersihkan Semua</span>
          </button>
        </div>
      </div>
    </div>
  );
};
