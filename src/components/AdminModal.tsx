import React, { useState, useRef } from "react";
import { AppConfig } from "../types";
import { LOGO_PRESETS, DEFAULT_CUSTOM_TEXTS, DEFAULT_APP_CONFIG } from "../data/defaultConfig";
import { LogoCropperModal } from "./LogoCropperModal";
import {
  X,
  ShieldCheck,
  Image,
  Type,
  Cpu,
  RotateCcw,
  Save,
  Check,
  Search,
  Upload,
  Sparkles,
  Sliders,
  Plus,
  Crop,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  CheckCircle2,
} from "lucide-react";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<"logo" | "texts" | "footer" | "ai">("logo");
  const [formData, setFormData] = useState<AppConfig>({
    ...config,
    permanentFooterText: config.permanentFooterText || "SUPPORT BY GHIGHAIS DEVELOPMENT",
    customTexts: { ...config.customTexts },
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [savedToast, setSavedToast] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [showAddKey, setShowAddKey] = useState(false);

  // States for Logo Cropper & Drag repositioning
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropImageSource, setCropImageSource] = useState("");
  const [cropToast, setCropToast] = useState(false);
  const [isDraggingLogoBox, setIsDraggingLogoBox] = useState(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startOffsetPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleSave = () => {
    try {
      if (formData.permanentFooterText) {
        localStorage.setItem("ghighais_permanent_footer_text", formData.permanentFooterText.trim());
      }
    } catch {}
    onSaveConfig(formData);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin mengembalikan semua logo dan teks ke pengaturan awal pabrik?"
      )
    ) {
      setFormData({
        ...DEFAULT_APP_CONFIG,
        customTexts: { ...DEFAULT_CUSTOM_TEXTS },
      });
    }
  };

  const handleTextChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      customTexts: {
        ...prev.customTexts,
        [key]: value,
      },
    }));
  };

  const handleAddNewText = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    const cleanKey = newKey.trim().toLowerCase().replace(/\s+/g, "_");
    setFormData((prev) => ({
      ...prev,
      customTexts: {
        ...prev.customTexts,
        [cleanKey]: newValue.trim(),
      },
    }));
    setNewKey("");
    setNewValue("");
    setShowAddKey(false);
  };

  // Dapatkan sumber gambar logo aktif untuk dicrop
  const getCurrentImageSrcForCropping = (): string => {
    if (formData.logoUrl && (formData.logoType === "url" || formData.logoType === "upload")) {
      return formData.logoUrl;
    }
    const activePreset =
      LOGO_PRESETS.find((p) => p.id === formData.logoPreset) || LOGO_PRESETS[0];
    const svgClean = activePreset.svg.replace(/class="[^"]*"/g, 'width="300" height="300"');
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgClean)}`;
  };

  const openCropper = (customSrc?: string) => {
    const src = customSrc || getCurrentImageSrcForCropping();
    setCropImageSource(src);
    setIsCropperOpen(true);
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      logoType: "upload",
      logoUrl: croppedDataUrl,
      logoOffsetX: 0,
      logoOffsetY: 0,
      logoScale: 1,
      logoFit: "contain",
    }));
    setCropToast(true);
    setTimeout(() => setCropToast(false), 3000);
  };

  // Nudge position dengan D-pad tombol arah
  const handleNudge = (dx: number, dy: number) => {
    setFormData((prev) => ({
      ...prev,
      logoOffsetX: Math.max(-80, Math.min(80, (prev.logoOffsetX || 0) + dx)),
      logoOffsetY: Math.max(-80, Math.min(80, (prev.logoOffsetY || 0) + dy)),
    }));
  };

  const handleResetPosition = () => {
    setFormData((prev) => ({
      ...prev,
      logoOffsetX: 0,
      logoOffsetY: 0,
      logoScale: 1,
      logoRotate: 0,
      logoFit: "contain",
    }));
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const dataUrl = reader.result as string;
          setFormData((prev) => ({
            ...prev,
            logoType: "upload",
            logoUrl: dataUrl,
            logoOffsetX: 0,
            logoOffsetY: 0,
            logoScale: 1,
            logoFit: "contain",
          }));
          // Buka modal crop dan geser secara langsung agar logo tidak terpotong
          openCropper(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setFormData((prev) => ({
            ...prev,
            loginLogoType: "upload",
            loginLogoUrl: reader.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter text dictionary items based on search
  const textEntries = Object.entries(formData.customTexts || {}).filter(
    ([key, value]) =>
      key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      id="ghighais-admin-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        id="ghighais-admin-modal"
        className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {formData.customTexts.admin_title || "Halaman Admin Tersembunyi"}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                  Tanpa Login • Full Access
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {formData.customTexts.admin_subtitle ||
                  "Kustomisasi logo aplikasi dan ubah semua teks tombol di seluruh antarmuka."}
              </p>
            </div>
          </div>
          <button
            id="btn-close-admin-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-2">
          <button
            id="tab-admin-logo"
            onClick={() => setActiveTab("logo")}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "logo"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Image className="w-4 h-4" />
            <span>{formData.customTexts.admin_tab_logo || "Ubah Logo & Branding"}</span>
          </button>
          <button
            id="tab-admin-texts"
            onClick={() => setActiveTab("texts")}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "texts"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Type className="w-4 h-4" />
            <span>{formData.customTexts.admin_tab_texts || "Ubah Semua Teks & Tombol"}</span>
          </button>
          <button
            id="tab-admin-footer"
            onClick={() => setActiveTab("footer")}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "footer"
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{formData.customTexts.admin_tab_footer || "Footer Permanen (Hak Cipta)"}</span>
          </button>
          <button
            id="tab-admin-ai"
            onClick={() => setActiveTab("ai")}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "ai"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{formData.customTexts.admin_tab_ai || "Engine AI Coder"}</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: LOGO & BRANDING */}
          {activeTab === "logo" && (
            <div className="space-y-6">
              {/* Brand Title and Subtitle */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>Judul & Identitas Aplikasi</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Nama Aplikasi (Brand Title):
                    </label>
                    <input
                      id="input-admin-app-title"
                      type="text"
                      value={formData.appTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, appTitle: e.target.value }))
                      }
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Ghighais Brain"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Slogan / Deskripsi Singkat:
                    </label>
                    <input
                      id="input-admin-app-subtitle"
                      type="text"
                      value={formData.appSubtitle}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, appSubtitle: e.target.value }))
                      }
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="AI Web Generator & Studio"
                    />
                  </div>
                </div>
              </div>

              {/* Logo Selection Options */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-5">
                {/* Header & Main Action Tools */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Image className="w-4 h-4 text-indigo-400" />
                      <span>Crop, Geser & Tata Letak Logo Presisi</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Potong (crop) bagian logo yang diinginkan dan geser posisinya agar tidak terpotong dan pas sesuai yang Anda mau.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Tombol Crop Logo Utama */}
                    <button
                      type="button"
                      onClick={() => openCropper()}
                      className="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all active:scale-95"
                      title="Buka alat potong/crop logo"
                    >
                      <Crop className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Potong / Crop Logo</span>
                    </button>

                    {/* Tombol Kembalikan Posisi & Ukuran */}
                    <button
                      type="button"
                      onClick={handleResetPosition}
                      className="text-[11px] px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                      title="Kembalikan posisi logo ke tengah kotak (0, 0)"
                    >
                      <RotateCcw className="w-3 h-3 text-indigo-400" />
                      <span>Pusatkan (0, 0)</span>
                    </button>
                  </div>
                </div>

                {/* Notifikasi Sukses Crop */}
                {cropToast && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Logo berhasil dipotong (cropped) dan diterapkan! Anda juga dapat mengatur posisi geser di bawah.</span>
                  </div>
                )}

                {/* Interactive Logo Container Box Live Preview with Drag & Drop Pan */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 flex flex-col lg:flex-row items-center justify-between gap-5">
                  <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-auto">
                    {/* Kotak Wadah Logo (The Box) - INTERACTIVE DRAG TO SHIFT */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center justify-between w-full text-[10px] font-mono text-indigo-300 uppercase tracking-wider">
                        <span>Kotak Bawaan (Geser Langsung)</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-700/50 text-indigo-300">
                          X:{formData.logoOffsetX || 0} Y:{formData.logoOffsetY || 0}
                        </span>
                      </div>
                      
                      {/* The Draggable Box Container */}
                      <div
                        onPointerDown={(e) => {
                          setIsDraggingLogoBox(true);
                          dragStartPosRef.current = { x: e.clientX, y: e.clientY };
                          startOffsetPosRef.current = {
                            x: formData.logoOffsetX || 0,
                            y: formData.logoOffsetY || 0,
                          };
                          try {
                            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                          } catch {}
                        }}
                        onPointerMove={(e) => {
                          if (!isDraggingLogoBox) return;
                          const dx = Math.round(e.clientX - dragStartPosRef.current.x);
                          const dy = Math.round(e.clientY - dragStartPosRef.current.y);
                          setFormData((prev) => ({
                            ...prev,
                            logoOffsetX: Math.max(-80, Math.min(80, startOffsetPosRef.current.x + dx)),
                            logoOffsetY: Math.max(-80, Math.min(80, startOffsetPosRef.current.y + dy)),
                          }));
                        }}
                        onPointerUp={(e) => {
                          setIsDraggingLogoBox(false);
                          try {
                            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                          } catch {}
                        }}
                        onPointerCancel={() => setIsDraggingLogoBox(false)}
                        className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900/60 border-2 ${
                          isDraggingLogoBox
                            ? "border-indigo-400 bg-indigo-950/80 cursor-grabbing shadow-lg shadow-indigo-500/20"
                            : "border-dashed border-indigo-400/60 hover:border-indigo-400 cursor-grab"
                        } flex items-center justify-center p-2 relative overflow-hidden select-none transition-colors group`}
                        title="Klik & tahan (drag) untuk menggeser posisi logo secara langsung"
                      >
                        {/* Crosshair Center Lines for Alignment */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-indigo-500/20 pointer-events-none" />
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-dashed border-indigo-500/20 pointer-events-none" />

                        {/* The Actual Logo rendered inside the box */}
                        {(() => {
                          const fitMode = formData.logoFit || "contain";
                          const fitClass =
                            fitMode === "cover"
                              ? "object-cover"
                              : fitMode === "fill"
                              ? "object-fill"
                              : fitMode === "none"
                              ? "object-none"
                              : "object-contain";

                          const transformStyle = `translate(${formData.logoOffsetX || 0}px, ${
                            formData.logoOffsetY || 0
                          }px) scale(${formData.logoScale || 1}) rotate(${formData.logoRotate || 0}deg)`;

                          if (
                            (formData.logoType === "url" ||
                              formData.logoType === "upload") &&
                            formData.logoUrl
                          ) {
                            return (
                              <img
                                src={formData.logoUrl}
                                alt="Preview Logo Box"
                                className={`w-full h-full ${fitClass} rounded-lg pointer-events-none transition-none`}
                                style={{
                                  transform: transformStyle,
                                  transformOrigin: "center center",
                                }}
                              />
                            );
                          }

                          const activePreset =
                            LOGO_PRESETS.find(
                              (p) => p.id === formData.logoPreset
                            ) || LOGO_PRESETS[0];

                          return (
                            <div
                              className="w-full h-full flex items-center justify-center pointer-events-none transition-none"
                              style={{
                                transform: transformStyle,
                                transformOrigin: "center center",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: activePreset.svg,
                              }}
                            />
                          );
                        })()}

                        {/* Floating Drag Hint Icon */}
                        <div className="absolute bottom-1 right-1 bg-slate-900/80 rounded p-0.5 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
                          <Move className="w-3 h-3 text-indigo-300" />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 text-center">
                        🖱️ Klik & geser logo langsung
                      </span>
                    </div>

                    {/* D-Pad Directional Controls */}
                    <div className="flex flex-col items-center gap-1 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Move className="w-3 h-3 text-indigo-400" />
                        <span>Arah Geser (D-Pad)</span>
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        <div />
                        <button
                          type="button"
                          onClick={() => handleNudge(0, -3)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white flex items-center justify-center transition-all active:scale-90"
                          title="Geser ke Atas (Y -3px)"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <div />

                        <button
                          type="button"
                          onClick={() => handleNudge(-3, 0)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white flex items-center justify-center transition-all active:scale-90"
                          title="Geser ke Kiri (X -3px)"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, logoOffsetX: 0, logoOffsetY: 0 }))}
                          className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700/50 hover:bg-indigo-900 text-[9px] font-mono text-indigo-300 flex items-center justify-center transition-all active:scale-90 font-bold"
                          title="Pusatkan posisi (0,0)"
                        >
                          •
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNudge(3, 0)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white flex items-center justify-center transition-all active:scale-90"
                          title="Geser ke Kanan (X +3px)"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <div />
                        <button
                          type="button"
                          onClick={() => handleNudge(0, 3)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white flex items-center justify-center transition-all active:scale-90"
                          title="Geser ke Bawah (Y +3px)"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <div />
                      </div>
                    </div>

                    {/* Navbar Preview Context */}
                    <div className="flex flex-col gap-1 hidden sm:flex">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        Hasil Di Navbar:
                      </span>
                      <div className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-900/80 via-slate-800 to-indigo-700/60 border border-indigo-500/40 flex items-center justify-center p-1 overflow-hidden relative">
                          {(() => {
                            const fitMode = formData.logoFit || "contain";
                            const fitClass =
                              fitMode === "cover"
                                ? "object-cover"
                                : fitMode === "fill"
                                ? "object-fill"
                                : fitMode === "none"
                                ? "object-none"
                                : "object-contain";

                            const transformStyle = `translate(${formData.logoOffsetX || 0}px, ${
                              formData.logoOffsetY || 0
                            }px) scale(${formData.logoScale || 1}) rotate(${formData.logoRotate || 0}deg)`;

                            if (
                              (formData.logoType === "url" ||
                                formData.logoType === "upload") &&
                              formData.logoUrl
                            ) {
                              return (
                                <img
                                  src={formData.logoUrl}
                                  alt="Navbar Logo Preview"
                                  className={`w-full h-full ${fitClass} rounded-lg`}
                                  style={{
                                    transform: transformStyle,
                                    transformOrigin: "center center",
                                  }}
                                />
                              );
                            }

                            const activePreset =
                              LOGO_PRESETS.find(
                                (p) => p.id === formData.logoPreset
                              ) || LOGO_PRESETS[0];

                            return (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{
                                  transform: transformStyle,
                                  transformOrigin: "center center",
                                }}
                                dangerouslySetInnerHTML={{
                                  __html: activePreset.svg,
                                }}
                              />
                            );
                          })()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">
                            {formData.appTitle || "Ghighais Brain"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formData.appSubtitle || "AI Web Generator"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sizing, Offsets & Fitting Adjusters */}
                  <div className="flex flex-col gap-3 w-full lg:w-72 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    {/* Zoom / Scale Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">
                          Ukuran Logo (Zoom):
                        </span>
                        <span className="font-mono text-indigo-400 font-bold">
                          {Math.round((formData.logoScale || 1) * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              logoScale: Math.max(
                                0.3,
                                Number(((prev.logoScale || 1) - 0.05).toFixed(2))
                              ),
                            }))
                          }
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs font-bold transition-transform active:scale-90"
                          title="Perkecil logo"
                        >
                          -
                        </button>
                        <input
                          type="range"
                          min="0.3"
                          max="2.5"
                          step="0.05"
                          value={formData.logoScale || 1}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              logoScale: parseFloat(e.target.value),
                            }))
                          }
                          className="flex-1 accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              logoScale: Math.min(
                                2.5,
                                Number(((prev.logoScale || 1) + 0.05).toFixed(2))
                              ),
                            }))
                          }
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs font-bold transition-transform active:scale-90"
                          title="Perbesar logo"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Geser Horizontal (X) Slider */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Geser Horizontal (X):</span>
                        <span className="font-mono text-indigo-400 text-xs">
                          {formData.logoOffsetX || 0}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="1"
                        value={formData.logoOffsetX || 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            logoOffsetX: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>

                    {/* Geser Vertikal (Y) Slider */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Geser Vertikal (Y):</span>
                        <span className="font-mono text-indigo-400 text-xs">
                          {formData.logoOffsetY || 0}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="1"
                        value={formData.logoOffsetY || 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            logoOffsetY: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>

                    {/* Rotasi & Mode Pas (Fit Mode) */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              logoRotate: ((prev.logoRotate || 0) + 90) % 360,
                            }))
                          }
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1"
                          title="Putar logo 90 derajat"
                        >
                          <RotateCw className="w-3 h-3 text-indigo-400" />
                          <span>Putar ({formData.logoRotate || 0}°)</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                        {(["contain", "cover", "fill"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                logoFit: mode,
                              }))
                            }
                            className={`px-2 py-0.5 rounded capitalize font-medium transition-all ${
                              (formData.logoFit || "contain") === mode
                                ? "bg-indigo-600 text-white"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {mode === "contain"
                              ? "Pas"
                              : mode === "cover"
                              ? "Penuh"
                              : "Rentang"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preset Logos */}
                <div>
                  <label className="block text-xs text-slate-400 mb-2">
                    Pilih Logo Preset Bawaan:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {LOGO_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            logoType: "preset",
                            logoPreset: preset.id,
                          }))
                        }
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                          formData.logoType === "preset" && formData.logoPreset === preset.id
                            ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                            : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div
                          className="w-9 h-9"
                          dangerouslySetInnerHTML={{ __html: preset.svg }}
                        />
                        <span className="text-xs font-medium">{preset.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Image URL */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-xs text-slate-400 mb-1">
                    Atau Masukkan URL Gambar Logo Eksternal:
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="url"
                      value={formData.logoType === "url" ? formData.logoUrl : ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          logoType: "url",
                          logoUrl: e.target.value,
                        }))
                      }
                      placeholder="https://contoh.com/logo-anda.png"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    {formData.logoType === "url" && formData.logoUrl && (
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center p-1">
                          <img
                            src={formData.logoUrl}
                            alt="Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => openCropper(formData.logoUrl)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap"
                          title="Potong/crop gambar URL ini"
                        >
                          <Crop className="w-3.5 h-3.5" />
                          <span>Crop URL Ini</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Image from Computer with Immediate Crop Feature */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-xs text-slate-400 mb-1">
                    Atau Upload File Gambar Logo Sendiri:
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white font-medium flex items-center gap-2 transition-all">
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Pilih File Logo (PNG, JPG, SVG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                    {formData.logoType === "upload" && formData.logoUrl && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-9 h-9 rounded-xl border border-emerald-500/50 bg-slate-900 flex items-center justify-center p-1">
                          <img
                            src={formData.logoUrl}
                            alt="Uploaded"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <span className="text-xs text-emerald-400">File logo terpasang!</span>
                        
                        {/* Tombol Crop Langsung untuk file yang baru diupload */}
                        <button
                          type="button"
                          onClick={() => openCropper(formData.logoUrl)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                          title="Potong/crop file gambar logo ini"
                        >
                          <Crop className="w-3.5 h-3.5" />
                          <span>Crop File Ini</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* KHUSUS: Kustomisasi Logo Halaman Login (Support PNG Transparan) */}
                <div className="pt-4 border-t border-slate-800 bg-slate-950/40 p-4 rounded-xl border border-indigo-500/20">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Logo Khusus Halaman Login (Support PNG Transparan)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Atur logo khusus yang tampil di halaman Sign In. Mendukung file <strong>PNG transparan tanpa background</strong>.
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                      PNG Alpha Support
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center mt-3">
                    {/* Live Preview Box with Checkerboard Transparency grid */}
                    <div className="sm:col-span-4 flex items-center gap-3">
                      <div
                        className="w-16 h-16 rounded-xl border border-slate-700 p-1.5 shadow-md flex items-center justify-center shrink-0"
                        style={{
                          backgroundImage:
                            "linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)",
                          backgroundSize: "12px 12px",
                          backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                          backgroundColor: "#0f172a",
                        }}
                        title="Pratinjau dengan latar kotak transparan"
                      >
                        <img
                          src={formData.loginLogoUrl || formData.logoUrl || "/ghighais-logo.jpg"}
                          alt="Login Logo Preview"
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/ghighais-logo.jpg";
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400">
                        <p className="font-semibold text-slate-300">Pratinjau Transparansi</p>
                        <p className="text-slate-500">Mencegah kotak putih di latar gelap</p>
                      </div>
                    </div>

                    {/* Inputs & Controls */}
                    <div className="sm:col-span-8 flex flex-col gap-2">
                      <div className="flex gap-2 items-center">
                        <input
                          type="url"
                          value={formData.loginLogoUrl || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              loginLogoType: "url",
                              loginLogoUrl: e.target.value,
                            }))
                          }
                          placeholder="URL logo atau upload file PNG di samping..."
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm">
                          <Upload className="w-3 h-3" />
                          <span>Upload PNG</span>
                          <input
                            type="file"
                            accept="image/png, image/webp, image/svg+xml, image/*"
                            onChange={handleLoginLogoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {formData.loginLogoUrl && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                loginLogoUrl: "/ghighais-logo.jpg",
                                loginLogoType: "default",
                                loginLogoSize: 96,
                                navbarLogoSize: 40,
                              }))
                            }
                            className="text-[10px] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            Reset ke logo default
                          </button>
                        </div>
                      )}

                      {/* Size Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                        <div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                            <span>Ukuran Logo Login (Bebas Berkreasi)</span>
                            <span className="text-indigo-400 font-mono">{formData.loginLogoSize || 96}px</span>
                          </div>
                          <input
                            type="range"
                            min={20}
                            max={400}
                            step={2}
                            value={formData.loginLogoSize || 96}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                loginLogoSize: Number(e.target.value),
                              }))
                            }
                            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                            <span>20px</span>
                            <span>400px</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                            <span>Ukuran Logo Navbar</span>
                            <span className="text-amber-400 font-mono">{formData.navbarLogoSize || 40}px</span>
                          </div>
                          <input
                            type="range"
                            min={16}
                            max={120}
                            step={2}
                            value={formData.navbarLogoSize || 40}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                navbarLogoSize: Number(e.target.value),
                              }))
                            }
                            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                            <span>16px</span>
                            <span>120px</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEXTS & BUTTON LABELS CUSTOMIZATION */}
          {activeTab === "texts" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Kamus Teks & Label Tombol Seluruh Aplikasi
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ubah teks apapun yang tampil di aplikasi, termasuk teks pada setiap tombol.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari label tombol/teks..."
                      className="bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddKey(!showAddKey)}
                    className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs flex items-center gap-1 transition-all"
                    title="Tambah teks kustom baru"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add New Custom Text Field */}
              {showAddKey && (
                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-indigo-300">
                    Tambah Kunci Teks Kustom Baru:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="ID / Nama Kunci (contoh: btn_custom_action)"
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Nilai Teks Tampilan (contoh: Klik Saya Sekarang)"
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddKey(false)}
                      className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleAddNewText}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
                    >
                      Tambahkan
                    </button>
                  </div>
                </div>
              )}

              {/* Text Fields List */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {textEntries.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Tidak ada teks yang cocok dengan pencarian "{searchQuery}".
                  </div>
                ) : (
                  textEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                    >
                      <div className="min-w-[180px] max-w-[240px]">
                        <span className="text-[11px] font-mono text-indigo-400 block truncate">
                          {key}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {key.startsWith("btn_") ? "🔘 Label Tombol" : "📝 Teks Tampilan"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleTextChange(key, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FOOTER PERMANEN (HAK CIPTA / BRAND GUARD) */}
          {activeTab === "footer" && (
            <div className="space-y-6">
              {/* Info Guard Box */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Proteksi Hak Cipta & Footer Permanen Terkunci</span>
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  Footer ini otomatis disuntikkan ke seluruh aplikasi web yang dibuat, diekspor, atau di-push ke GitHub.
                  <strong> User umum dilarang keras dan tidak bisa menghapus ataupun mengubah teks ini</strong> karena diproteksi oleh skrip sistem permanen dan MutationObserver.
                </p>
                <p className="text-xs text-emerald-300 font-medium">
                  Hanya Anda selaku <strong>Administrator</strong> yang memiliki wewenang untuk mengubah teks footer ini di bawah ini.
                </p>
              </div>

              {/* Edit Footer Form */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>{formData.customTexts.label_permanent_footer_text || "Teks Footer Permanen (Hak Cipta):"}</span>
                    <span className="text-[10px] text-emerald-400 font-normal">Hanya Admin yang dapat merubah</span>
                  </label>
                  <input
                    id="input-admin-permanent-footer"
                    type="text"
                    value={formData.permanentFooterText || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        permanentFooterText: e.target.value,
                      }))
                    }
                    placeholder="SUPPORT BY GHIGHAIS DEVELOPMENT"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-emerald-500 shadow-inner"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {formData.customTexts.desc_permanent_footer_text ||
                      "Teks ini terkunci permanen untuk semua user saat membuat aplikasi, tetapi dapat Anda sesuaikan selaku Admin."}
                  </p>
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Preset Teks Cepat untuk Admin:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "SUPPORT BY GHIGHAIS DEVELOPMENT",
                      "POWERED BY GHIGHAIS AI CODER",
                      "DEVELOPED WITH GHIGHAIS BRAIN STUDIO",
                      "SUPPORT BY GHIGHAIS ENTERPRISE",
                      "CREATED WITH GHIGHAIS WEB GENERATOR",
                    ].map((presetText) => (
                      <button
                        key={presetText}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            permanentFooterText: presetText,
                          }))
                        }
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                          formData.permanentFooterText === presetText
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        {presetText}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview of Footer */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Simulasi Tampilan Footer di Aplikasi Web
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Live Preview
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 shadow-inner flex flex-col items-center justify-center">
                  <div className="w-full text-center py-3 px-4 bg-slate-950 border-t border-slate-800/80 rounded-lg text-slate-400 text-xs font-sans select-none">
                    <span className="font-semibold text-slate-300 tracking-wider">
                      {formData.permanentFooterText || "SUPPORT BY GHIGHAIS DEVELOPMENT"}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  *Footer di atas akan selalu menempel di bagian bawah setiap aplikasi web yang dihasilkan user.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: AI CONFIGURATION */}
          {activeTab === "ai" && (
            <div className="space-y-5 bg-slate-950/70 border border-slate-800 rounded-2xl p-5">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>Integrasi Model AI Coder</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Aplikasi ini berjalan dengan model AI Coder berkecepatan tinggi dan gratis secara bawaan tanpa memerlukan konfigurasi tambahan.
                </p>
              </div>

              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-200 space-y-1">
                  <p className="font-semibold text-white">Full Fitur Gratisan & Aktif Otomatis</p>
                  <p className="text-slate-400 leading-relaxed">
                    Sistem secara otomatis mengarahkan panggilan kode ke engine AI berkecepatan tinggi dengan auto-recovery. Anda tidak perlu membayar langganan apapun untuk menggunakan generator ini.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Opsional: Custom API Key (OpenRouter / AI Provider):
                </label>
                <input
                  type="password"
                  value={formData.qwenApiKey || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, qwenApiKey: e.target.value }))
                  }
                  placeholder="Kosongkan untuk memakai engine gratis bawaan aplikasi"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Jika dikosongkan, aplikasi akan menggunakan serverless free proxy bawaan secara instan.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <button
            id="btn-admin-reset-all"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{formData.customTexts.btn_admin_reset_defaults || "Reset Default"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-admin-cancel"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
            >
              {formData.customTexts.btn_admin_close || "Tutup"}
            </button>
            <button
              id="btn-admin-save-changes"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              {savedToast ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{formData.customTexts.btn_admin_save || "Simpan Perubahan"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Logo Cropper Modal Overlay */}
      <LogoCropperModal
        isOpen={isCropperOpen}
        imageSrc={cropImageSource}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
