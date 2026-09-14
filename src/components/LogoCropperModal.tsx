import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Check,
  RotateCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crop,
  Move,
  Maximize2,
} from "lucide-react";

interface LogoCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export const LogoCropperModal: React.FC<LogoCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  if (!isOpen) return null;

  // Zoom scale: 0.5x to 3.5x
  const [scale, setScale] = useState<number>(1);
  // Pan offsets (in pixels)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // Rotation in degrees (0, 90, 180, 270)
  const [rotation, setRotation] = useState<number>(0);
  // Crop aspect ratio
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "4:3" | "16:9" | "free">("1:1");
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const positionStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Reset state when opening with new image
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setAspectRatio("1:1");
  }, [imageSrc]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({
      width: img.naturalWidth || 300,
      height: img.naturalHeight || 300,
    });
  };

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: positionStartRef.current.x + dx,
      y: positionStartRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setScale((prev) => Math.min(3.5, Math.max(0.4, Number((prev + delta).toFixed(2)))));
  };

  // Rotate 90 deg clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset positioning & scale
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  // Execute high-quality HTML5 Canvas Crop
  const handlePerformCrop = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;

    // Crop box dimensions in the UI (fixed viewport)
    // We compute the crop box based on current aspect ratio
    const boxSize = 280; // base viewport width
    let cropWidth = boxSize;
    let cropHeight = boxSize;

    if (aspectRatio === "4:3") {
      cropHeight = Math.round((boxSize * 3) / 4);
    } else if (aspectRatio === "16:9") {
      cropHeight = Math.round((boxSize * 9) / 16);
    } else if (aspectRatio === "free") {
      cropHeight = Math.round(boxSize * 0.85);
    }

    // High resolution canvas for sharp logo
    const targetResolution = 512;
    const canvas = document.createElement("canvas");
    canvas.width = targetResolution;
    canvas.height = Math.round(targetResolution * (cropHeight / cropWidth));
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Enable best quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Ratio between output canvas and preview crop box
    const canvasScale = canvas.width / cropWidth;

    // Translate context to center of output canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply user position (scaled to canvas coordinates)
    const userPosX = position.x * canvasScale;
    const userPosY = position.y * canvasScale;

    // Compute base image rendered dimensions at scale=1
    // The image in preview has max-w and max-h matching natural aspect
    const natW = imgNaturalSize.width || 300;
    const natH = imgNaturalSize.height || 300;
    const fitScale = Math.min(cropWidth / natW, cropHeight / natH) || 1;
    const baseW = natW * fitScale * scale * canvasScale;
    const baseH = natH * fitScale * scale * canvasScale;

    // Draw image centered with offset
    ctx.drawImage(
      img,
      -baseW / 2 + userPosX,
      -baseH / 2 + userPosY,
      baseW,
      baseH
    );

    try {
      const croppedDataUrl = canvas.toDataURL("image/png");
      onCropComplete(croppedDataUrl);
      onClose();
    } catch (err) {
      console.error("Failed to export cropped image:", err);
      alert(
        "Gagal memotong gambar karena proteksi keamanan URL luar (CORS). Silakan unduh gambar terlebih dahulu lalu upload file dari komputer Anda."
      );
    }
  }, [aspectRatio, scale, position, rotation, imgNaturalSize, onCropComplete, onClose]);

  // Viewport dimensions for display
  const boxWidth = 280;
  let boxHeight = 280;
  if (aspectRatio === "4:3") boxHeight = Math.round((280 * 3) / 4);
  else if (aspectRatio === "16:9") boxHeight = Math.round((280 * 9) / 16);
  else if (aspectRatio === "free") boxHeight = Math.round(280 * 0.85);

  return (
    <div
      id="modal-logo-cropper-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="modal-logo-cropper"
        className="bg-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Crop & Posisikan Logo</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-normal">
                  Presisi Tanpa Terpotong
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Geser dan sesuaikan logo dengan bebas agar pas presisi di kotak.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Work Area */}
        <div className="p-5 flex flex-col items-center gap-4 bg-slate-950/40">
          {/* Main Visual Crop Frame Container */}
          <div
            ref={containerRef}
            onWheel={handleWheel}
            className="relative w-full max-w-[340px] h-[310px] bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden shadow-inner select-none"
          >
            {/* Dark background pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Interactive Image Element with Transform */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`absolute cursor-${isDragging ? "grabbing" : "grab"} transition-none touch-none`}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              }}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Logo to crop"
                onLoad={handleImageLoad}
                crossOrigin="anonymous"
                draggable={false}
                className="max-w-[260px] max-h-[260px] object-contain pointer-events-none select-none drop-shadow-md"
              />
            </div>

            {/* Visual Crop Box Overlay */}
            <div
              className="pointer-events-none absolute border-2 border-indigo-400 rounded-xl shadow-[0_0_0_9999px_rgba(2,6,23,0.78)] flex flex-col items-center justify-between overflow-hidden"
              style={{
                width: `${boxWidth}px`,
                height: `${boxHeight}px`,
              }}
            >
              {/* Rule-of-thirds grid lines */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-35 border border-indigo-400/40">
                <div className="border-r border-b border-indigo-300/40" />
                <div className="border-r border-b border-indigo-300/40" />
                <div className="border-b border-indigo-300/40" />
                <div className="border-r border-b border-indigo-300/40" />
                <div className="border-r border-b border-indigo-300/40" />
                <div className="border-b border-indigo-300/40" />
                <div className="border-r border-indigo-300/40" />
                <div className="border-r border-indigo-300/40" />
                <div />
              </div>

              {/* Corner accent marks */}
              <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
              <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
              <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
              <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-white" />
            </div>

            {/* Instruction badge */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-full text-[10px] text-slate-300 flex items-center gap-1.5 shadow-md pointer-events-none">
              <Move className="w-3 h-3 text-indigo-400" />
              <span>Klik & geser gambar untuk memposisikan</span>
            </div>
          </div>

          {/* Quick Toolbar: Aspect Ratio & Zoom & Rotate */}
          <div className="w-full max-w-[340px] space-y-3">
            {/* Aspect Ratio Selector */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Bentuk Potongan:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                {(
                  [
                    { id: "1:1", label: "1:1 Kotak" },
                    { id: "4:3", label: "4:3 Foto" },
                    { id: "16:9", label: "16:9 Lebar" },
                    { id: "free", label: "Bebas" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAspectRatio(opt.id)}
                    className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                      aspectRatio === opt.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="range"
                min="0.4"
                max="3.0"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="flex-1 accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-[11px] font-mono text-indigo-400 font-bold min-w-[38px] text-right">
                {Math.round(scale * 100)}%
              </span>
            </div>

            {/* Action Tools: Rotate, Reset, Center */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                  title="Putar 90 Derajat"
                >
                  <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Putar 90°</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                  title="Kembalikan ke Posisi Awal"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Offset readout */}
              <div className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                X: {position.x > 0 ? `+${position.x}` : position.x}px | Y:{" "}
                {position.y > 0 ? `+${position.y}` : position.y}px
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            id="btn-apply-logo-crop"
            onClick={handlePerformCrop}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Potong & Terapkan Logo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
