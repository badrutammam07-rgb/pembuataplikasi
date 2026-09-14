import React from "react";
import { DatabaseSelector } from "./DatabaseSelector";
import { DatabaseSetupPreference } from "../types";
import { X } from "lucide-react";

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (preference: DatabaseSetupPreference) => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="ghighais-database-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl my-auto bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Floating Close Button */}
        <button
          id="btn-close-database-modal"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer shadow-lg"
          title="Tutup Modal Setup Database"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          <DatabaseSelector
            onClose={onClose}
            onComplete={(pref) => {
              if (onSave) onSave(pref);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DatabaseModal;
