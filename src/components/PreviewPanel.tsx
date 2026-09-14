import React, { useState, useRef, useEffect, useCallback } from "react";
import { AppConfig, PreviewError } from "../types";
import { ensurePermanentFooter } from "../utils/permanentFooter";
import {
  Eye,
  RotateCw,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  Wrench,
  AlertTriangle,
  Pencil,
  Check,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  CheckCircle2,
  Trash2,
  Layers,
  ShieldAlert,
  Type,
  Palette,
  Plus,
  Minus,
  Bold,
  Italic,
  Box,
  Undo2,
  Rocket,
} from "lucide-react";

const FONT_SIZES = [11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56];

const QUICK_COLORS = [
  { label: "Putih", hex: "#ffffff" },
  { label: "Hitam", hex: "#0f172a" },
  { label: "Abu-abu", hex: "#94a3b8" },
  { label: "Biru", hex: "#3b82f6" },
  { label: "Cyan", hex: "#06b6d4" },
  { label: "Hijau", hex: "#10b981" },
  { label: "Kuning", hex: "#f59e0b" },
  { label: "Merah", hex: "#f43f5e" },
  { label: "Ungu", hex: "#a855f7" },
];

const QUICK_BG_COLORS = [
  { label: "Biru", hex: "#3b82f6" },
  { label: "Indigo", hex: "#6366f1" },
  { label: "Ungu", hex: "#8b5cf6" },
  { label: "Emerald", hex: "#10b981" },
  { label: "Merah", hex: "#f43f5e" },
  { label: "Kuning", hex: "#f59e0b" },
  { label: "Slate", hex: "#1e293b" },
  { label: "Hitam", hex: "#0f172a" },
  { label: "Putih", hex: "#ffffff" },
  { label: "Transparan", hex: "transparent" },
];

const rgbToHex = (color: string): string => {
  if (!color) return "#ffffff";
  if (color.startsWith("#")) {
    return color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color.slice(0, 7);
  }
  const match = color.match(/\d+/g);
  if (match && match.length >= 3) {
    const r = parseInt(match[0], 10).toString(16).padStart(2, "0");
    const g = parseInt(match[1], 10).toString(16).padStart(2, "0");
    const b = parseInt(match[2], 10).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return "#ffffff";
};

interface PreviewPanelProps {
  code: string;
  config: AppConfig;
  previewError: PreviewError;
  onAutoFix: () => void;
  onClearError: () => void;
  isFixing: boolean;
  onApplyCode: (updatedCode: string) => void;
  onOpenDeployEngine?: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  code,
  config,
  previewError,
  onAutoFix,
  onClearError,
  isFixing,
  onApplyCode,
  onOpenDeployEngine,
}) => {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [keyReload, setKeyReload] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElementTag, setSelectedElementTag] = useState<string | null>(null);
  const [selectedElementTextSnippet, setSelectedElementTextSnippet] = useState<string | null>(null);
  const [isProtectedFooterSelected, setIsProtectedFooterSelected] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [applySuccessToast, setApplySuccessToast] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [undoToast, setUndoToast] = useState<string | null>(null);
  const [currentTextColor, setCurrentTextColor] = useState<string>("#ffffff");
  const [currentTextSize, setCurrentTextSize] = useState<number>(16);
  const [currentBgColor, setCurrentBgColor] = useState<string>("#3b82f6");
  const [currentPadding, setCurrentPadding] = useState<number>(10);
  const [currentBorderRadius, setCurrentBorderRadius] = useState<string>("8px");
  const [currentScale, setCurrentScale] = useState<number>(1);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const activeSelectedElementRef = useRef<HTMLElement | null>(null);
  const capturedClickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const capturedSubmitHandlerRef = useRef<((e: Event) => void) | null>(null);

  const getText = (key: string, fallback: string) => {
    return config.customTexts[key] || fallback;
  };

  const handleReload = () => {
    setIsEditMode(false);
    setHasUnsavedChanges(false);
    setSelectedElementTag(null);
    setSelectedElementTextSnippet(null);
    setIsProtectedFooterSelected(false);
    setDeleteNotice(null);
    setKeyReload((prev) => prev + 1);
  };

  // Pilih elemen target dan sinkronkan informasinya (tag, teks, warna, ukuran font, padding, background)
  const selectTargetElement = (target: HTMLElement) => {
    if (!target) return;
    if (target.closest("#ghighais-permanent-footer")) {
      setIsProtectedFooterSelected(true);
      return;
    }
    setIsProtectedFooterSelected(false);

    const doc = iframeRef.current?.contentDocument;
    if (doc) {
      doc.querySelectorAll(".ghighais-selected-element").forEach((item) => {
        item.classList.remove("ghighais-selected-element");
      });
    }

    target.classList.add("ghighais-selected-element");
    activeSelectedElementRef.current = target;

    const tagName = target.tagName.toLowerCase();
    const idStr = target.id ? `#${target.id}` : "";
    const cleanClasses = Array.from(target.classList as Iterable<string>).filter(
      (c: string) => typeof c === "string" && !c.startsWith("ghighais-")
    );
    const classStr = cleanClasses.length > 0 ? `.${cleanClasses[0]}` : "";
    setSelectedElementTag(`${tagName}${idStr}${classStr}`);

    const text = target.textContent?.trim().replace(/\s+/g, " ") || "";
    setSelectedElementTextSnippet(text ? (text.length > 25 ? text.slice(0, 25) + "..." : text) : null);

    // Baca font size, color, bg color, padding, & border-radius saat ini dari elemen
    const win = iframeRef.current?.contentWindow || window;
    try {
      const comp = win.getComputedStyle(target);
      const parsedSize = Math.round(parseFloat(target.style.fontSize) || parseFloat(comp.fontSize) || 16);
      setCurrentTextSize(parsedSize);

      const compColor = target.style.color || comp.color || "#ffffff";
      setCurrentTextColor(rgbToHex(compColor));

      const compBg = target.style.backgroundColor || comp.backgroundColor;
      if (compBg && compBg !== "rgba(0, 0, 0, 0)" && compBg !== "transparent") {
        setCurrentBgColor(rgbToHex(compBg));
      } else {
        setCurrentBgColor("transparent");
      }

      const padTop = parseInt(target.style.paddingTop || comp.paddingTop || "10", 10);
      setCurrentPadding(isNaN(padTop) ? 10 : padTop);

      const bRad = target.style.borderRadius || comp.borderRadius || "8px";
      setCurrentBorderRadius(bRad);
    } catch (err) {
      console.warn("Could not read computed style:", err);
    }
  };

  // Bersihkan atribut editor sementara dari DOM iframe
  const sanitizeIframeDocument = (doc: Document) => {
    // 0. Lepaskan capturing click and submit handlers
    if (capturedClickHandlerRef.current) {
      doc.removeEventListener("click", capturedClickHandlerRef.current, true);
      capturedClickHandlerRef.current = null;
    }
    if (capturedSubmitHandlerRef.current) {
      doc.removeEventListener("submit", capturedSubmitHandlerRef.current, true);
      capturedSubmitHandlerRef.current = null;
    }

    // 1. Hapus contenteditable
    const editables = doc.querySelectorAll("[contenteditable]");
    editables.forEach((el) => {
      el.removeAttribute("contenteditable");
      el.removeAttribute("spellcheck");
      (el as HTMLElement).style.outline = "";
      (el as HTMLElement).style.outlineOffset = "";
    });

    // 2. Hapus class penanda edit & seleksi pada semua elemen
    const highlighted = doc.querySelectorAll(
      ".ghighais-selected-element, .ghighais-logo-target, .ghighais-logo-selected, [data-ghighais-editing]"
    );
    highlighted.forEach((el) => {
      el.classList.remove(
        "ghighais-selected-element",
        "ghighais-logo-target",
        "ghighais-logo-selected"
      );
      el.removeAttribute("data-ghighais-editing");
      (el as HTMLElement).style.outline = "";
    });

    // 3. Hapus editor styles tag jika ada
    const styleTag = doc.getElementById("ghighais-preview-editor-styles");
    if (styleTag) styleTag.remove();
  };

  // Simpan snapshot HTML untuk fitur Undo sebelum perubahan dilakukan
  const takeUndoSnapshot = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !doc.body) return;

    try {
      const clone = doc.body.cloneNode(true) as HTMLElement;
      clone.querySelectorAll(".ghighais-selected-element, .ghighais-logo-selected").forEach((el) => {
        el.classList.remove("ghighais-selected-element", "ghighais-logo-selected");
      });
      clone.querySelectorAll("[contenteditable]").forEach((el) => {
        el.removeAttribute("contenteditable");
        el.removeAttribute("spellcheck");
      });
      const snapshot = clone.innerHTML;
      setUndoStack((prev) => [...prev.slice(-30), snapshot]);
    } catch (e) {
      console.warn("Gagal menyimpan snapshot undo:", e);
    }
  };

  // Batalkan perubahan terakhir (Undo)
  const handleUndo = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !doc.body || undoStack.length === 0) return;

    const previousHtml = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    doc.body.innerHTML = previousHtml;

    // Pasang kembali event listeners editor ke DOM yang dipulihkan
    bindIframeEditor(doc);

    // Reset seleksi aktif
    activeSelectedElementRef.current = null;
    setSelectedElementTag(null);
    setSelectedElementTextSnippet(null);
    setIsProtectedFooterSelected(false);
    setDeleteNotice(null);

    setUndoToast("Perubahan berhasil di-undo!");
    setTimeout(() => setUndoToast(null), 2500);
  };

  // Pasang semua listener dan atribut edit ke iframe DOM
  const bindIframeEditor = (doc: Document) => {
    // Inject style penanda edit & hapus yang jelas
    let styleTag = doc.getElementById("ghighais-preview-editor-styles");
    if (!styleTag) {
      styleTag = doc.createElement("style");
      styleTag.id = "ghighais-preview-editor-styles";
      styleTag.textContent = `
        [contenteditable="true"]:hover {
          outline: 2px dashed #6366f1 !important;
          outline-offset: 2px !important;
          cursor: text !important;
        }
        [contenteditable="true"]:focus {
          outline: 2px solid #8b5cf6 !important;
          outline-offset: 2px !important;
          background-color: rgba(139, 92, 246, 0.08) !important;
        }
        .ghighais-selected-element {
          outline: 3px solid #f43f5e !important;
          outline-offset: 3px !important;
          background-color: rgba(244, 63, 94, 0.08) !important;
          box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.25) !important;
        }
        .ghighais-logo-target {
          outline: 2px dashed #10b981 !important;
          outline-offset: 3px !important;
          cursor: pointer !important;
        }
        #ghighais-permanent-footer, #ghighais-permanent-footer * {
          contenteditable: false !important;
          user-select: none !important;
          pointer-events: none !important;
          cursor: not-allowed !important;
        }
      `;
      doc.head.appendChild(styleTag);
    }

    // 1. Teks yang bisa diedit in-place
    const textElements = doc.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, p, span, a, button, label, li, td, th, b, strong, i, em, blockquote"
    );
    textElements.forEach((el) => {
      if (el.closest("#ghighais-permanent-footer")) return;
      el.setAttribute("contenteditable", "true");
      el.setAttribute("spellcheck", "false");
      el.addEventListener("input", () => {
        setHasUnsavedChanges(true);
      });
      el.addEventListener("focus", () => {
        selectTargetElement(el as HTMLElement);
      });
    });

    // 2. Logo candidates
    const logoCandidates = doc.querySelectorAll(
      "#app-logo, [id*='logo'], [class*='logo'], header img, nav img, header svg, nav svg, img"
    );
    logoCandidates.forEach((el) => {
      if (el.closest("#ghighais-permanent-footer")) return;
      el.classList.add("ghighais-logo-target");
    });

    // 3. Capturing click & submit listeners
    const handleCapturedClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      e.stopPropagation();
      e.stopImmediatePropagation();

      const isActionTrigger = target.closest(
        "a, button, input[type='button'], input[type='submit'], [role='button'], form"
      );
      if (isActionTrigger) {
        e.preventDefault();
      }

      const editableEl = target.closest("[contenteditable='true']") as HTMLElement | null;
      if (editableEl) {
        editableEl.focus();
      }

      selectTargetElement(target);
    };

    const handleCapturedSubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    capturedClickHandlerRef.current = handleCapturedClick;
    capturedSubmitHandlerRef.current = handleCapturedSubmit;

    doc.addEventListener("click", handleCapturedClick, true);
    doc.addEventListener("submit", handleCapturedSubmit, true);

    // 4. Keyboard listener (Delete untuk hapus & Ctrl+Z / Cmd+Z untuk Undo)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (e.key === "Delete") {
        const activeEl = doc.activeElement;
        const isInput =
          activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
        if (!isInput && activeSelectedElementRef.current) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
    };
    doc.addEventListener("keydown", handleKeyDown);
  };

  // Hapus elemen yang saat ini sedang dipilih
  const handleDeleteSelected = () => {
    const el = activeSelectedElementRef.current;
    if (!el) return;

    // Lindungi footer permanen
    if (el.closest("#ghighais-permanent-footer")) {
      setIsProtectedFooterSelected(true);
      return;
    }

    // Simpan snapshot untuk Undo
    takeUndoSnapshot();

    const tagName = selectedElementTag || el.tagName.toLowerCase();
    el.remove();
    activeSelectedElementRef.current = null;
    setSelectedElementTag(null);
    setSelectedElementTextSnippet(null);
    setHasUnsavedChanges(true);

    setDeleteNotice(`Bagian <${tagName}> berhasil dihapus! Klik "Terapkan ke Codingan" untuk menyimpan.`);
    setTimeout(() => setDeleteNotice(null), 5000);
  };

  // Pilih elemen pembungkus / induk (Parent)
  const handleSelectParent = () => {
    const current = activeSelectedElementRef.current;
    if (!current) return;
    const parent = current.parentElement;
    if (
      !parent ||
      parent.tagName === "BODY" ||
      parent.tagName === "HTML" ||
      parent.closest("#ghighais-permanent-footer")
    ) {
      return;
    }

    selectTargetElement(parent);
  };

  // Batalkan pilihan elemen
  const handleDeselect = () => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) {
      doc.querySelectorAll(".ghighais-selected-element").forEach((item) => {
        item.classList.remove("ghighais-selected-element");
      });
    }
    activeSelectedElementRef.current = null;
    setSelectedElementTag(null);
    setSelectedElementTextSnippet(null);
    setIsProtectedFooterSelected(false);
  };

  // Aktifkan atau nonaktifkan mode edit in-place di iframe
  const toggleEditMode = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    if (!isEditMode) {
      // Masuk ke Mode Edit & Hapus
      setIsEditMode(true);
      setHasUnsavedChanges(true);

      // Ambil snapshot awal agar user bisa selalu undo ke keadaan mula-mula
      takeUndoSnapshot();

      // Pasang semua binding editor
      bindIframeEditor(doc);
    } else {
      // Keluar dari mode edit
      cancelEdit();
    }
  };

  // Batalkan edit dan kembalikan ke kode awal
  const cancelEdit = () => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) {
      sanitizeIframeDocument(doc);
    }
    setIsEditMode(false);
    setHasUnsavedChanges(false);
    setSelectedElementTag(null);
    setSelectedElementTextSnippet(null);
    setIsProtectedFooterSelected(false);
    setDeleteNotice(null);
    setUndoStack([]);
    activeSelectedElementRef.current = null;
    handleReload();
  };

  // Terapkan perubahan visual, teks, dan penghapusan ke codingan
  const handleApplyChanges = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    // Bersihkan penanda editor sebelum serialisasi HTML
    sanitizeIframeDocument(doc);

    // Ambil full HTML
    let fullHtml = doc.documentElement.outerHTML;
    if (!fullHtml.startsWith("<!DOCTYPE html>")) {
      fullHtml = "<!DOCTYPE html>\n" + fullHtml;
    }

    // Selalu pastikan footer permanen terlindungi
    const protectedHtml = ensurePermanentFooter(fullHtml);

    // Kosongkan riwayat undo setelah diterapkan
    setUndoStack([]);

    // Kirim update ke App.tsx
    onApplyCode(protectedHtml);

    setIsEditMode(false);
    setHasUnsavedChanges(false);
    setSelectedElementTag(null);
    setSelectedElementTextSnippet(null);
    setIsProtectedFooterSelected(false);
    setDeleteNotice(null);
    activeSelectedElementRef.current = null;

    // Toast notifikasi sukses
    setApplySuccessToast(true);
    setTimeout(() => setApplySuccessToast(false), 3000);
  };

  // Kontrol manipulasi padding kotak / tombol
  const handlePaddingChange = (delta: number) => {
    const el = activeSelectedElementRef.current;
    if (!el) return;
    takeUndoSnapshot();
    setHasUnsavedChanges(true);
    const newPad = Math.max(0, Math.min(80, (currentPadding || 8) + delta));
    setCurrentPadding(newPad);
    el.style.setProperty("padding", `${newPad}px ${Math.round(newPad * 1.6)}px`, "important");
  };

  // Kontrol preset padding
  const handlePaddingPreset = (preset: "compact" | "normal" | "spacious") => {
    const el = activeSelectedElementRef.current;
    if (!el) return;
    takeUndoSnapshot();
    setHasUnsavedChanges(true);
    const map = {
      compact: { pad: 6, str: "6px 14px" },
      normal: { pad: 10, str: "10px 20px" },
      spacious: { pad: 16, str: "16px 28px" },
    };
    const item = map[preset];
    setCurrentPadding(item.pad);
    el.style.setProperty("padding", item.str, "important");
  };

  // Kontrol lebar kotak / tombol (Auto / 100% Penuh)
  const handleWidthChange = (mode: "auto" | "full") => {
    const el = activeSelectedElementRef.current;
    if (!el) return;
    takeUndoSnapshot();
    setHasUnsavedChanges(true);
    if (mode === "auto") {
      el.style.setProperty("width", "auto", "important");
      el.style.removeProperty("max-width");
    } else {
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("max-width", "100%", "important");
      el.style.setProperty("display", "block", "important");
    }
  };

  // Kontrol sudut bulat kotak / tombol (Border Radius)
  const handleBorderRadiusChange = (radius: string) => {
    const el = activeSelectedElementRef.current;
    if (!el) return;
    takeUndoSnapshot();
    setHasUnsavedChanges(true);
    setCurrentBorderRadius(radius);
    el.style.setProperty("border-radius", radius, "important");
  };

  // Kontrol skala perbesar / perkecil elemen (Scale)
  const handleScaleChange = (delta: number) => {
    const el = activeSelectedElementRef.current;
    if (!el) return;
    takeUndoSnapshot();
    setHasUnsavedChanges(true);
    const newScale = Math.max(0.4, Math.min(2.0, parseFloat((currentScale + delta).toFixed(2))));
    setCurrentScale(newScale);
    el.style.setProperty("transform", `scale(${newScale})`, "important");
    el.style.setProperty("transform-origin", "center center", "important");
  };

  // Kontrol warna latar kotak / tombol (Background Color)
  const handleBgColorChange = (newBgColor: string) => {
    const el = activeSelectedElementRef.current;
    if (!el) return;
    takeUndoSnapshot();
    setHasUnsavedChanges(true);
    setCurrentBgColor(newBgColor);
    el.style.setProperty("background-color", newBgColor, "important");
  };

  // Kontrol manipulasi posisi elemen terpilih (Logo / Gambar)
  const handleAlignElement = (align: "left" | "center" | "right") => {
    const el = activeSelectedElementRef.current;
    if (!el) return;

    takeUndoSnapshot();
    setHasUnsavedChanges(true);
    if (align === "left") {
      el.style.marginLeft = "0";
      el.style.marginRight = "auto";
      el.style.display = "inline-block";
      if (el.parentElement) {
        el.parentElement.style.justifyContent = "flex-start";
        el.parentElement.style.textAlign = "left";
      }
    } else if (align === "center") {
      el.style.marginLeft = "auto";
      el.style.marginRight = "auto";
      el.style.display = "block";
      if (el.parentElement) {
        el.parentElement.style.justifyContent = "center";
        el.parentElement.style.textAlign = "center";
      }
    } else if (align === "right") {
      el.style.marginLeft = "auto";
      el.style.marginRight = "0";
      el.style.display = "inline-block";
      if (el.parentElement) {
        el.parentElement.style.justifyContent = "flex-end";
        el.parentElement.style.textAlign = "right";
      }
    }
  };

  // Kontrol manipulasi ukuran elemen terpilih (Logo / Gambar)
  const handleResizeElement = (delta: number) => {
    const el = activeSelectedElementRef.current;
    if (!el) return;

    takeUndoSnapshot();
    setHasUnsavedChanges(true);
    const currentWidth = el.offsetWidth || parseInt(el.style.width || "48") || 48;
    const newWidth = Math.max(20, Math.min(320, currentWidth + delta));

    el.style.width = `${newWidth}px`;
    el.style.height = "auto";
    el.style.maxWidth = "100%";
  };

  // Kontrol ubah warna teks
  const handleTextColorChange = (newColor: string) => {
    const el = activeSelectedElementRef.current;
    if (!el) return;
    takeUndoSnapshot();
    setHasUnsavedChanges(true);
    setCurrentTextColor(newColor);

    const doc = iframeRef.current?.contentDocument;
    const selection = doc?.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      try {
        const range = selection.getRangeAt(0);
        if (el.contains(range.commonAncestorContainer)) {
          const span = doc.createElement("span");
          span.style.setProperty("color", newColor, "important");
          span.appendChild(range.extractContents());
          range.insertNode(span);
          return;
        }
      } catch (e) {
        console.warn("Could not wrap selected text range with color:", e);
      }
    }

    el.style.setProperty("color", newColor, "important");
  };

  // Kontrol ubah ukuran teks (font-size)
  const handleTextSizeChange = (newSize: number) => {
    const el = activeSelectedElementRef.current;
    if (!el) return;
    takeUndoSnapshot();
    const clampedSize = Math.max(8, Math.min(120, Math.round(newSize)));
    setHasUnsavedChanges(true);
    setCurrentTextSize(clampedSize);

    const doc = iframeRef.current?.contentDocument;
    const selection = doc?.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      try {
        const range = selection.getRangeAt(0);
        if (el.contains(range.commonAncestorContainer)) {
          const span = doc.createElement("span");
          span.style.setProperty("font-size", `${clampedSize}px`, "important");
          span.appendChild(range.extractContents());
          range.insertNode(span);
          return;
        }
      } catch (e) {
        console.warn("Could not wrap selected text range with font size:", e);
      }
    }

    el.style.setProperty("font-size", `${clampedSize}px`, "important");
  };

  // Kontrol tebalkan teks (Bold)
  const handleToggleBold = () => {
    const el = activeSelectedElementRef.current;
    if (!el) return;
    takeUndoSnapshot();
    setHasUnsavedChanges(true);
    const win = iframeRef.current?.contentWindow || window;
    const comp = win.getComputedStyle(el);
    const isBold =
      el.style.fontWeight === "bold" ||
      el.style.fontWeight === "700" ||
      parseInt(comp.fontWeight, 10) >= 700;
    el.style.setProperty("font-weight", isBold ? "normal" : "bold", "important");
  };

  // Kontrol miringkan teks (Italic)
  const handleToggleItalic = () => {
    const el = activeSelectedElementRef.current;
    if (!el) return;
    takeUndoSnapshot();
    setHasUnsavedChanges(true);
    const win = iframeRef.current?.contentWindow || window;
    const comp = win.getComputedStyle(el);
    const isItalic = el.style.fontStyle === "italic" || comp.fontStyle === "italic";
    el.style.setProperty("font-style", isItalic ? "normal" : "italic", "important");
  };

  const isImageOrLogo = Boolean(
    activeSelectedElementRef.current &&
      (activeSelectedElementRef.current.tagName === "IMG" ||
        activeSelectedElementRef.current.tagName === "SVG" ||
        activeSelectedElementRef.current.classList.contains("ghighais-logo-target") ||
        activeSelectedElementRef.current.id.includes("logo"))
  );

  const isTextElement = Boolean(
    activeSelectedElementRef.current &&
      activeSelectedElementRef.current.tagName !== "IMG" &&
      activeSelectedElementRef.current.tagName !== "SVG" &&
      (activeSelectedElementRef.current.textContent?.trim().length || 0) > 0
  );

  return (
    <div
      id="panel-preview"
      className={`flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl transition-all ${
        isFullscreen
          ? "fixed inset-2 z-50 bg-slate-950/95 border-indigo-500 shadow-2xl"
          : "h-full"
      }`}
    >
      {/* Panel Header & Controls */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Eye className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-white">
              {getText("panel_preview_title", "Live Interactive Preview")}
            </h2>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Action Controls & Device Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Tombol Masuk / Keluar Mode Edit & Hapus Manual */}
          <button
            id="btn-toggle-manual-edit"
            onClick={toggleEditMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              isEditMode
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/40"
                : "bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
            }`}
            title="Klik untuk mengedit teks, menghapus bagian tak diinginkan, atau memindah logo langsung di live preview"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{isEditMode ? "Selesai Mengedit" : "Edit / Hapus Bagian"}</span>
          </button>

          {/* Device Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setDevice("desktop")}
              className={`p-1.5 rounded-md transition-all ${
                device === "desktop"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Tampilan Desktop"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice("tablet")}
              className={`p-1.5 rounded-md transition-all ${
                device === "tablet"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Tampilan Tablet"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={`p-1.5 rounded-md transition-all ${
                device === "mobile"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Tampilan Mobile"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Publish to Ghighais Button */}
          {onOpenDeployEngine && (
            <button
              id="btn-preview-publish-ghighais"
              onClick={onOpenDeployEngine}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              title="Publish aplikasi ini ke *.ghighais.com via Ghighais Deploy Engine"
            >
              <Rocket className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Publish</span>
            </button>
          )}

          {/* Reload Button */}
          <button
            onClick={handleReload}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title={getText("btn_reload_preview", "Muat Ulang Preview")}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Manual Visual In-Place Editor Toolbar */}
      {isEditMode && (
        <div
          id="ghighais-manual-editor-toolbar"
          className="bg-slate-950 border-b border-indigo-500/40 shadow-xl text-xs select-none"
        >
          {/* Baris 1: Status & Tombol Utama (Batal & Terapkan) - Selalu Fixed & Anti-Cutoff */}
          <div className="px-3.5 py-2 bg-indigo-950/90 border-b border-indigo-900/60 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600/40 border border-indigo-400/40 text-indigo-100 font-mono text-[11px] font-bold flex items-center gap-1.5 shrink-0 shadow-sm">
                <Pencil className="w-3.5 h-3.5 text-indigo-300" />
                <span>Mode Edit Visual</span>
              </span>
              <span className="text-[11px] text-indigo-200/90 truncate hidden sm:inline">
                🛡️ Tombol dinonaktifkan sementara agar bebas diedit. Klik tombol apa pun di bawah lalu sesuaikan ukuran & warnanya!
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {/* Tombol Undo Riwayat Perubahan */}
              <button
                id="btn-undo-manual-edit"
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                  undoStack.length > 0
                    ? "bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-100 border-indigo-400/50 shadow-sm active:scale-95 cursor-pointer"
                    : "bg-slate-800/40 text-slate-500 border-slate-800/60 cursor-not-allowed opacity-50"
                }`}
                title={
                  undoStack.length > 0
                    ? `Kembalikan perubahan terakhir (${undoStack.length} riwayat tersimpan) - Shortcut: Ctrl+Z`
                    : "Belum ada riwayat perubahan untuk di-undo"
                }
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo {undoStack.length > 0 ? `(${undoStack.length})` : ""}</span>
              </button>

              <button
                onClick={cancelEdit}
                className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium transition-colors flex items-center gap-1 border border-slate-700 active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>
              <button
                id="btn-apply-manual-edits"
                onClick={handleApplyChanges}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-1.5 active:scale-95 animate-pulse shrink-0"
                title="Klik untuk menyimpan perubahan teks, tombol, kotak, ukuran, dan warna langsung ke codingan"
              >
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>Terapkan ke Codingan</span>
              </button>
            </div>
          </div>

          {/* Baris 2: Contextual Toolbox Elemen - Scroll Horizontal Bersih (Anti Terpotong!) */}
          <div className="px-3.5 py-2 bg-slate-900/95 overflow-x-auto scrollbar-thin">
            {!selectedElementTag ? (
              <div className="py-1 text-slate-300 text-xs flex items-center justify-between gap-2 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
                  <span>
                    Klik tombol, kotak/panel kartu, atau tulisan di pratinjau untuk mulai mengubah ukuran, warna, padding, atau menghapusnya.
                  </span>
                </div>
                {undoStack.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-[11px] font-semibold transition-colors shrink-0"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>Undo Perubahan Terakhir ({undoStack.length})</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 whitespace-nowrap py-0.5">
                {/* 0. Quick Undo Button di dalam toolbox */}
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors border shrink-0 ${
                    undoStack.length > 0
                      ? "bg-slate-950/80 hover:bg-slate-800 text-indigo-300 border-indigo-500/40 cursor-pointer shadow-sm"
                      : "bg-slate-950/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-50"
                  }`}
                  title="Kembalikan perubahan sebelumnya (Ctrl+Z)"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Undo</span>
                </button>
                {/* 1. Tag & Tindakan Elemen */}
                <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800 shrink-0">
                  <span className="text-[11px] font-mono text-indigo-300 font-bold">
                    &lt;{selectedElementTag}&gt;
                  </span>
                  {selectedElementTextSnippet && (
                    <span className="text-[10px] text-slate-400 max-w-[90px] truncate hidden md:inline">
                      "{selectedElementTextSnippet}"
                    </span>
                  )}
                  <button
                    onClick={handleSelectParent}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-medium transition-colors ml-1"
                    title="Pilih pembungkus / induk (misal seluruh kartu/seksi)"
                  >
                    <Layers className="w-3 h-3 text-indigo-400" />
                    <span>Induk</span>
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600/30 hover:bg-rose-600/60 text-rose-200 hover:text-white border border-rose-500/40 text-[10px] font-bold transition-all shadow-sm"
                    title="Hapus elemen ini"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Hapus</span>
                  </button>
                </div>

                {/* 2. Ukuran & Padding Kotak / Tombol */}
                <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 shrink-0">
                  <div className="flex items-center gap-1 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                    <Box className="w-3 h-3 text-amber-400" />
                    <span>Ukuran/Padding:</span>
                  </div>

                  {/* Step Padding - / + */}
                  <div className="flex items-center gap-0.5 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handlePaddingChange(-2)}
                      className="w-5 h-5 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs"
                      title="Perkecil Padding (-2px)"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-[10px] font-mono text-indigo-300 font-bold px-1 min-w-[28px] text-center">
                      {currentPadding}px
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePaddingChange(2)}
                      className="w-5 h-5 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs"
                      title="Perbesar Padding (+2px)"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Preset Padding */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePaddingPreset("compact")}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] border border-slate-800"
                      title="Padding Ringkas (Kecil)"
                    >
                      Kecil
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePaddingPreset("normal")}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] border border-slate-800"
                      title="Padding Standar (Sedang)"
                    >
                      Sedang
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePaddingPreset("spacious")}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] border border-slate-800"
                      title="Padding Luas (Besar)"
                    >
                      Besar
                    </button>
                  </div>

                  {/* Lebar Tombol / Kotak */}
                  <div className="flex items-center gap-0.5 pl-1.5 border-l border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleWidthChange("auto")}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] border border-slate-800"
                      title="Lebar Pas Isi (Auto)"
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWidthChange("full")}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] border border-slate-800"
                      title="Lebar Penuh (100%)"
                    >
                      Penuh
                    </button>
                  </div>

                  {/* Sudut Bulat (Border Radius) */}
                  <div className="flex items-center gap-1 pl-1.5 border-l border-slate-800">
                    <span className="text-[10px] text-slate-500">Sudut:</span>
                    <button
                      type="button"
                      onClick={() => handleBorderRadiusChange("0px")}
                      className={`px-1.5 py-0.5 rounded text-[10px] border ${currentBorderRadius === "0px" ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"}`}
                      title="Sudut Kotak Tajam (0px)"
                    >
                      Kotak
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBorderRadiusChange("8px")}
                      className={`px-1.5 py-0.5 rounded text-[10px] border ${currentBorderRadius === "8px" ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"}`}
                      title="Sudut Halus (8px)"
                    >
                      Halus
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBorderRadiusChange("16px")}
                      className={`px-1.5 py-0.5 rounded text-[10px] border ${currentBorderRadius === "16px" ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"}`}
                      title="Sangat Bulat (16px)"
                    >
                      Bulat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBorderRadiusChange("9999px")}
                      className={`px-1.5 py-0.5 rounded-full text-[10px] border ${currentBorderRadius === "9999px" ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"}`}
                      title="Bentuk Kapsul / Pill"
                    >
                      Pill
                    </button>
                  </div>

                  {/* Skala Keseluruhan (+ / -) */}
                  <div className="flex items-center gap-0.5 pl-1.5 border-l border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleScaleChange(-0.1)}
                      className="w-5 h-5 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-[10px]"
                      title="Perkecil Skala Elemen (-10%)"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-mono text-indigo-300 px-0.5">
                      {Math.round(currentScale * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleScaleChange(0.1)}
                      className="w-5 h-5 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-[10px]"
                      title="Perbesar Skala Elemen (+10%)"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 3. Warna Latar (Background) Kotak / Tombol */}
                <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 shrink-0">
                  <Palette className="w-3 h-3 text-teal-400 shrink-0" />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Latar:</span>

                  <label
                    className="relative w-4 h-4 rounded-md border border-white/50 cursor-pointer shadow-sm overflow-hidden flex items-center justify-center transition-transform hover:scale-110 shrink-0"
                    style={{ backgroundColor: currentBgColor }}
                    title={`Pilih Warna Latar Bebas (Saat ini: ${currentBgColor})`}
                  >
                    <input
                      type="color"
                      value={currentBgColor.startsWith("#") ? currentBgColor : "#3b82f6"}
                      onChange={(e) => handleBgColorChange(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>

                  <div className="flex items-center gap-1">
                    {QUICK_BG_COLORS.map((col) => (
                      <button
                        key={col.label}
                        type="button"
                        onClick={() => handleBgColorChange(col.hex)}
                        className={`w-3.5 h-3.5 rounded-full border transition-all hover:scale-125 shrink-0 ${
                          currentBgColor.toLowerCase() === col.hex.toLowerCase()
                            ? "ring-2 ring-teal-400 scale-110 border-white"
                            : "border-slate-700 hover:border-white/80"
                        }`}
                        style={{ backgroundColor: col.hex === "transparent" ? "#334155" : col.hex }}
                        title={`Latar ${col.label}`}
                      />
                    ))}
                  </div>
                </div>

                {/* 4. Kontrol Teks: Ukuran Font, Warna Teks, Bold & Italic */}
                <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 shrink-0">
                  {/* Ukuran Font */}
                  <div className="flex items-center gap-1">
                    <Type className="w-3 h-3 text-indigo-400 shrink-0" />
                    <button
                      type="button"
                      onClick={() => handleTextSizeChange(currentTextSize - 2)}
                      className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-[10px]"
                      title="Perkecil Ukuran Huruf (A-)"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <select
                      value={currentTextSize}
                      onChange={(e) => handleTextSizeChange(Number(e.target.value))}
                      className="bg-slate-900 text-indigo-300 font-mono text-[11px] font-bold px-1 py-0.5 rounded border border-slate-800 outline-none cursor-pointer"
                      title="Pilih Ukuran Teks"
                    >
                      {FONT_SIZES.map((size) => (
                        <option key={size} value={size} className="bg-slate-900 text-slate-200">
                          {size}px
                        </option>
                      ))}
                      {!FONT_SIZES.includes(currentTextSize) && (
                        <option value={currentTextSize} className="bg-slate-900 text-slate-200">
                          {currentTextSize}px
                        </option>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleTextSizeChange(currentTextSize + 2)}
                      className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-[10px]"
                      title="Perbesar Ukuran Huruf (A+)"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Warna Teks */}
                  <div className="flex items-center gap-1 pl-1.5 border-l border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Teks:</span>
                    <label
                      className="relative w-4 h-4 rounded-md border border-white/50 cursor-pointer shadow-sm overflow-hidden flex items-center justify-center transition-transform hover:scale-110 shrink-0"
                      style={{ backgroundColor: currentTextColor }}
                      title={`Pilih Warna Teks Bebas (${currentTextColor})`}
                    >
                      <input
                        type="color"
                        value={currentTextColor}
                        onChange={(e) => handleTextColorChange(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                    <div className="flex items-center gap-1">
                      {QUICK_COLORS.slice(0, 6).map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => handleTextColorChange(col.hex)}
                          className={`w-3.5 h-3.5 rounded-full border transition-all hover:scale-125 shrink-0 ${
                            currentTextColor.toLowerCase() === col.hex.toLowerCase()
                              ? "ring-2 ring-indigo-400 scale-110 border-white"
                              : "border-slate-700 hover:border-white/80"
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={`Teks ${col.label}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Gaya Font: Bold & Italic */}
                  <div className="flex items-center gap-0.5 pl-1.5 border-l border-slate-800">
                    <button
                      type="button"
                      onClick={handleToggleBold}
                      className="w-5 h-5 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs"
                      title="Tebalkan Teks (Bold)"
                    >
                      <Bold className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleItalic}
                      className="w-5 h-5 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center italic text-xs"
                      title="Miringkan Teks (Italic)"
                    >
                      <Italic className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 5. Jika Logo / Gambar: Tombol Penjajaran & Ukuran */}
                {isImageOrLogo && (
                  <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800 shrink-0">
                    <button
                      onClick={() => handleAlignElement("left")}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Geser Kiri"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAlignElement("center")}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Geser Tengah"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAlignElement("right")}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Geser Kanan"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleResizeElement(-8)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 ml-0.5"
                      title="Perkecil Logo"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleResizeElement(8)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Perbesar Logo"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* 6. Batalkan Pilihan */}
                <button
                  onClick={handleDeselect}
                  className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 shrink-0"
                  title="Batalkan pilihan elemen ini"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notice: Undo Berhasil */}
      {undoToast && (
        <div className="bg-indigo-950 border-b border-indigo-500/40 px-4 py-2 flex items-center justify-between gap-2 text-xs text-indigo-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Undo2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-semibold">{undoToast}</span>
          </div>
          <button
            onClick={() => setUndoToast(null)}
            className="text-indigo-400 hover:text-indigo-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Notice: Bagian Terhapus */}
      {deleteNotice && (
        <div className="bg-rose-950 border-b border-rose-500/40 px-4 py-2 flex items-center justify-between gap-2 text-xs text-rose-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{deleteNotice}</span>
          </div>
          <button
            onClick={() => setDeleteNotice(null)}
            className="text-rose-400 hover:text-rose-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Notice: Footer Terproteksi */}
      {isProtectedFooterSelected && (
        <div className="bg-amber-950 border-b border-amber-500/40 px-4 py-2 flex items-center justify-between gap-2 text-xs text-amber-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">
              Footer resmi "SUPPORT BY GHIGHAIS DEVELOPMENT" terproteksi secara permanen dan tidak dapat dihapus.
            </span>
          </div>
          <button
            onClick={() => setIsProtectedFooterSelected(false)}
            className="text-amber-400 hover:text-amber-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Success Toast Notification */}
      {applySuccessToast && (
        <div className="bg-emerald-950 border-b border-emerald-500/40 px-4 py-2 flex items-center justify-between gap-2 text-xs text-emerald-300 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">
              Perubahan tampilan manual (teks, warna, ukuran font, logo, dan penghapusan bagian) berhasil diterapkan ke codingan!
            </span>
          </div>
          <button
            onClick={() => setApplySuccessToast(false)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Auto Fix Error Banner */}
      {previewError.hasError && (
        <div
          id="ghighais-error-autofix-banner"
          className="bg-amber-950/90 border-b border-amber-500/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2"
        >
          <div className="flex items-start gap-2.5 max-w-xl">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-200 block">
                {getText("error_banner_title", "Terdeteksi Kendala pada Script Aplikasi:")}
              </span>
              <p className="text-amber-300/80 text-[11px] font-mono mt-0.5 break-all">
                {previewError.message || "Runtime Error pada skrip JavaScript"}
                {previewError.line ? ` (Baris ${previewError.line})` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClearError}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs"
            >
              {getText("btn_dismiss_error", "Abaikan")}
            </button>
            <button
              id="btn-trigger-autofix"
              onClick={onAutoFix}
              disabled={isFixing}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30 transition-all animate-pulse active:scale-95 disabled:opacity-50"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>
                {isFixing
                  ? getText("btn_auto_fix_loading", "Memperbaiki Kode...")
                  : getText("btn_auto_fix", "Perbaiki Otomatis (Auto Fix)")}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Sandboxed Interactive Iframe Container */}
      <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-2 sm:p-4 overflow-auto">
        <div
          className={`h-full transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-white ${
            device === "desktop"
              ? "w-full max-w-full"
              : device === "tablet"
              ? "w-[768px] max-w-full"
              : "w-[375px] max-w-full"
          }`}
        >
          <iframe
            key={keyReload}
            ref={iframeRef}
            srcDoc={code}
            title="Ghighais Brain Live Preview"
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            className="w-full h-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
};
