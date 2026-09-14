import React from "react";
import { useAuth } from "../../context/AuthContext";
import { AlertCircle, ArrowLeft } from "lucide-react";

export const NotFound404Page: React.FC = () => {
  const { navigate } = useAuth();

  return (
    <div
      id="page-not-found-404"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-6">
          <AlertCircle className="w-7 h-7 text-slate-400" />
        </div>

        <span className="text-4xl font-extrabold font-mono text-slate-400 mb-2">404</span>
        <h1 className="text-xl font-bold text-white mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          URL yang Anda minta tidak ditemukan di server ini. Pastikan alamat yang diketik sudah benar.
        </p>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>
      </div>
    </div>
  );
};
