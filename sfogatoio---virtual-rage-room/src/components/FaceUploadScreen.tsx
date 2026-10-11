import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, Sparkles, Flame, X, Target, Sun, Sliders, ZoomIn, MoveVertical, Wand2, Check, Scissors } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface FaceUploadScreenProps {
  onConfirmFace: (faceDataUrl: string, faceName: string) => void;
  onCancel: () => void;
}

interface LightingSettings {
  brightness: number; // 0.65 to 1.45 (default 0.98 = natural true-to-photo brightness without glare)
  contrast: number;   // 1.0 to 1.5 (default 1.20 = rich facial definition)
  saturation: number; // 0.9 to 1.3 (default 1.04)
  zoom: number;       // 0.8 to 2.2 (default 1.05)
  offsetY: number;    // -0.25 to 0.25 (default -0.01)
  removeBackground: boolean; // default true (removes background, leaving only the face!)
  maskRadius: number; // 0.75 to 1.25 (default 1.0 = anatomical face oval)
}

const DEFAULT_LIGHTING: LightingSettings = {
  brightness: 0.98, // "togli ancora luminosita": fedele alla foto, niente sovraesposizione o sbiancamento
  contrast: 1.20,
  saturation: 1.04,
  zoom: 1.05,
  offsetY: -0.01,
  removeBackground: true, // "togli lo sfondo dal volto": sagoma anatomica attiva di default
  maskRadius: 1.0,
};

// Built-in SVG avatar presets
const PRESETS = [
  {
    id: 'boss',
    name: 'Capo Stressante',
    label: '👔 Capo',
    color: '#3b82f6',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs><linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs>
      <circle cx="100" cy="100" r="100" fill="url(#bg1)"/>
      <circle cx="100" cy="85" r="45" fill="#fbcfe8"/>
      <path d="M55 75 Q100 35 145 75 Q100 55 55 75" fill="#1e293b"/>
      <circle cx="82" cy="82" r="6" fill="#0f172a"/><circle cx="118" cy="82" r="6" fill="#0f172a"/>
      <path d="M75 70 L92 76" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
      <path d="M125 70 L108 76" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
      <path d="M85 110 Q100 95 115 110" stroke="#ef4444" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M60 180 L140 180 L130 140 L70 140 Z" fill="#3b82f6"/>
      <polygon points="100,140 92,175 100,195 108,175" fill="#ef4444"/>
    </svg>`,
  },
  {
    id: 'ex',
    name: 'Ex Tossico/a',
    label: '💔 Ex',
    color: '#ec4899',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs><linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#312e81"/><stop offset="100%" stop-color="#1e1b4b"/></linearGradient></defs>
      <circle cx="100" cy="100" r="100" fill="url(#bg2)"/>
      <circle cx="100" cy="85" r="44" fill="#fed7aa"/>
      <path d="M52 85 Q100 20 148 85 Q150 120 140 135 Q100 50 60 135 Z" fill="#9333ea"/>
      <circle cx="85" cy="85" r="5" fill="#18181b"/><circle cx="115" cy="85" r="5" fill="#18181b"/>
      <path d="M86 112 Q100 102 114 112" stroke="#be185d" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M50 170 Q100 130 150 170 L140 200 L60 200 Z" fill="#ec4899"/>
      <path d="M100 35 L108 50 L100 65 L92 50 Z" fill="#f43f5e"/>
    </svg>`,
  },
  {
    id: 'vigile',
    name: 'Vigile della Multa',
    label: '👮 Vigile',
    color: '#eab308',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs><linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1c1917"/><stop offset="100%" stop-color="#0c0a09"/></linearGradient></defs>
      <circle cx="100" cy="100" r="100" fill="url(#bg3)"/>
      <circle cx="100" cy="95" r="42" fill="#fed7aa"/>
      <path d="M50 65 L150 65 L140 45 L60 45 Z" fill="#0284c7"/>
      <rect x="42" y="60" width="116" height="12" rx="4" fill="#0f172a"/>
      <circle cx="100" cy="52" r="7" fill="#fbbf24"/>
      <circle cx="84" cy="92" r="5" fill="#18181b"/><circle cx="116" cy="92" r="5" fill="#18181b"/>
      <rect x="74" y="104" width="52" height="10" rx="3" fill="#78350f"/>
      <line x1="85" y1="120" x2="115" y2="120" stroke="#ef4444" stroke-width="5" stroke-linecap="round"/>
      <path d="M55 170 L145 170 L135 130 L65 130 Z" fill="#0284c7"/>
    </svg>`,
  },
  {
    id: 'hater',
    name: 'Hater / Leone da Tastiera',
    label: '😈 Hater',
    color: '#ef4444',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs><linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#450a0a"/><stop offset="100%" stop-color="#18181b"/></linearGradient></defs>
      <circle cx="100" cy="100" r="100" fill="url(#bg4)"/>
      <circle cx="100" cy="90" r="45" fill="#f87171"/>
      <polygon points="75,45 85,70 65,65" fill="#991b1b"/>
      <polygon points="125,45 135,65 115,70" fill="#991b1b"/>
      <circle cx="82" cy="85" r="7" fill="#fef08a"/><circle cx="118" cy="85" r="7" fill="#fef08a"/>
      <circle cx="82" cy="85" r="3" fill="#000"/><circle cx="118" cy="85" r="3" fill="#000"/>
      <path d="M72 75 L92 82" stroke="#450a0a" stroke-width="4" stroke-linecap="round"/>
      <path d="M128 75 L108 82" stroke="#450a0a" stroke-width="4" stroke-linecap="round"/>
      <path d="M78 115 Q100 135 122 115" stroke="#450a0a" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M60 170 L140 170 L130 135 L70 135 Z" fill="#18181b"/>
    </svg>`,
  },
];

// Helper: processes photo with balanced lighting and eliminates background
function processFaceImage(dataUrl: string, settings: LightingSettings): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const size = 1024; // High definition texture
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // If background removal is disabled, fill with natural skin tone
      if (!settings.removeBackground) {
        ctx.fillStyle = '#deb887';
        ctx.fillRect(0, 0, size, size);
      } else {
        // Transparent base: canvas starts 100% transparent
        ctx.clearRect(0, 0, size, size);
      }

      ctx.save();
      // Apply balanced light exposure & contrast
      ctx.filter = `brightness(${settings.brightness}) contrast(${settings.contrast}) saturate(${settings.saturation})`;

      // Center crop portrait with user zoom & offset
      const minDim = Math.min(img.width, img.height);
      const cropDim = minDim / Math.max(0.5, settings.zoom);

      const centerX = img.width / 2;
      const centerY = (img.height / 2) + (settings.offsetY * minDim);

      const sx = Math.max(0, Math.min(img.width - cropDim, centerX - (cropDim / 2)));
      const sy = Math.max(0, Math.min(img.height - cropDim, centerY - (cropDim / 2)));
      const sWidth = Math.min(img.width - sx, cropDim);
      const sHeight = Math.min(img.height - sy, cropDim);

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);
      ctx.restore();

      // BACKGROUND REMOVAL CUTOUT MASK
      // When active, carves out the face with a soft feathered elliptical contour and removes everything else!
      if (settings.removeBackground) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-in';

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = size;
        maskCanvas.height = size;
        const maskCtx = maskCanvas.getContext('2d');
        if (maskCtx) {
          const cx = size / 2;
          const cy = size / 2;
          const rx = (size * 0.40) * settings.maskRadius;
          const ry = (size * 0.47) * settings.maskRadius;

          maskCtx.save();
          maskCtx.translate(cx, cy);
          maskCtx.scale(rx, ry);

          const grad = maskCtx.createRadialGradient(0, 0, 0.68, 0, 0, 1.0);
          grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');     // 100% visible face interior
          grad.addColorStop(0.78, 'rgba(0, 0, 0, 1.0)');  // solid face contour
          grad.addColorStop(0.96, 'rgba(0, 0, 0, 0.25)'); // smooth feathering on edges
          grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');   // 100% transparent outside (background removed!)

          maskCtx.fillStyle = grad;
          maskCtx.beginPath();
          maskCtx.arc(0, 0, 1.0, 0, Math.PI * 2);
          maskCtx.fill();
          maskCtx.restore();

          ctx.drawImage(maskCanvas, 0, 0);
        }
        ctx.restore();
      }

      // Return PNG with alpha channel so background is transparent in Three.js and preview
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export const FaceUploadScreen: React.FC<FaceUploadScreenProps> = ({ onConfirmFace, onCancel }) => {
  const [faceDataUrl, setFaceDataUrl] = useState<string>(() => svgToDataUrl(PRESETS[0].svg));
  const [rawUploadedImage, setRawUploadedImage] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string>(PRESETS[0].name);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lighting, setLighting] = useState<LightingSettings>(DEFAULT_LIGHTING);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Reprocess image when lighting or background removal settings change
  const reprocessImage = useCallback(async (rawSrc: string, settings: LightingSettings) => {
    setIsProcessing(true);
    try {
      const processed = await processFaceImage(rawSrc, settings);
      setFaceDataUrl(processed);
    } catch (err) {
      console.warn('Failed to reprocess face image:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (result) {
        setRawUploadedImage(result);
        setSelectedPresetId('custom');
        if (!targetName || targetName === PRESETS[0].name) {
          setTargetName('Il Mio Bersaglio');
        }
        await reprocessImage(result, lighting);
        soundEngine.playWeaponSwitch();
      }
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setSelectedPresetId(preset.id);
    setRawUploadedImage(null);
    setFaceDataUrl(svgToDataUrl(preset.svg));
    setTargetName(preset.name);
    soundEngine.playFootstep();
  };

  const updateLighting = (newSettings: Partial<LightingSettings>) => {
    const updated = { ...lighting, ...newSettings };
    setLighting(updated);
    if (rawUploadedImage) {
      reprocessImage(rawUploadedImage, updated);
    }
  };

  const handleToggleRemoveBackground = () => {
    soundEngine.playFootstep();
    updateLighting({ removeBackground: !lighting.removeBackground });
  };

  const handleQuickLightPreset = (level: 'dim' | 'natural' | 'bright') => {
    soundEngine.playFootstep();
    if (level === 'dim') {
      updateLighting({ brightness: 0.85, contrast: 1.18 });
    } else if (level === 'natural') {
      updateLighting({ brightness: 0.98, contrast: 1.20 });
    } else {
      updateLighting({ brightness: 1.12, contrast: 1.22 });
    }
  };

  const handleAutoEnhance = () => {
    soundEngine.playWeaponSwitch();
    updateLighting(DEFAULT_LIGHTING);
  };

  const handleConfirm = () => {
    soundEngine.playPaymentChime();
    onConfirmFace(faceDataUrl, targetName.trim() || 'Bersaglio Personalizzato');
  };

  const lightPercent = Math.round((lighting.brightness - 1.0) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/92 backdrop-blur-md overflow-y-auto text-stone-100 select-none animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl bg-stone-900 border border-purple-500/40 rounded-3xl shadow-[0_0_60px_rgba(168,85,247,0.3)] overflow-hidden p-5 sm:p-7 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 text-white shadow-lg shadow-purple-900/50">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3 h-3 text-pink-400" />
                <span>MODALITÀ ARMATA DI MANICHINI (28 BERSAGLI) · 60 SECONDI</span>
              </div>
              <h2 className="font-chakra text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                ISOLA IL VOLTO & <span className="text-amber-400">REGOLA LUCE</span>
              </h2>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 mt-5">
          {/* Left Column: Live 3D Mannequin Preview with Background Removal */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center bg-stone-950/90 rounded-2xl border border-stone-800 p-4 text-center">
            <div className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>ANTEPRIMA BERSAGLIO 3D</span>
            </div>

            {/* Realistic Mannequin Bust & Head with Uploaded Illuminated Face */}
            <div className="relative w-44 h-52 sm:w-48 sm:h-56 rounded-2xl bg-gradient-to-b from-stone-900 via-stone-950 to-black border-2 border-purple-500/50 shadow-[0_0_35px_rgba(168,85,247,0.35)] flex flex-col items-center justify-center overflow-hidden p-2">
              {/* Mannequin Shoulders & Combat Collar Silhouette */}
              <div className="absolute -bottom-6 w-40 h-22 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-700 rounded-t-3xl border-t border-slate-600/60 shadow-inner" />
              
              {/* Mannequin Muscular Neck */}
              <div className="absolute bottom-11 w-13 h-11 bg-[#deb887] rounded-sm border-x border-[#c89e6e]/40 shadow-inner" />

              {/* Realistic Mannequin Head (Anatomical cranium, hair, ears & forward illuminated face) */}
              <div className="relative z-10 w-28 h-36 rounded-[48%/52%] bg-gradient-to-b from-[#1c1917] via-[#deb887] to-[#c89e6e] p-1.5 shadow-2xl flex items-center justify-center overflow-hidden border-2 border-[#c89e6e]/70">
                {/* Hair Top / Scalp Crown */}
                <div className="absolute top-0 inset-x-0 h-7 bg-[#1c1917] rounded-t-full opacity-90" />
                
                {/* Ears */}
                <div className="absolute -left-1 top-12 w-2 h-7 bg-[#c89e6e] rounded-l-full" />
                <div className="absolute -right-1 top-12 w-2 h-7 bg-[#c89e6e] rounded-r-full" />

                {/* Uploaded Face Texture: Seamlessly layered over mannequin skin with background removed */}
                <div className="relative w-full h-full rounded-[46%/50%] overflow-hidden bg-[#deb887] flex items-center justify-center shadow-lg">
                  <img
                    src={faceDataUrl}
                    alt="Anteprima Volto Manichino"
                    className="w-full h-full object-cover object-center"
                  />
                  {/* Very subtle studio ambient rim */}
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.04)_0%,transparent_70%)]" />
                </div>

                {/* Crosshair target overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-full h-px bg-red-500/35 absolute" />
                  <div className="h-full w-px bg-red-500/35 absolute" />
                  <div className="w-16 h-20 rounded-[45%] border border-red-500/60 absolute" />
                </div>
              </div>

              {/* Status Badges */}
              <div className="absolute bottom-1 z-20 flex items-center gap-1.5">
                {lighting.removeBackground && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/90 text-stone-950 font-mono text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 border border-emerald-300 shadow">
                    <Scissors className="w-2.5 h-2.5" />
                    <span>SOLO VOLTO</span>
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/90 text-stone-950 font-mono text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 border border-amber-300 shadow">
                  <Sun className="w-2.5 h-2.5" />
                  <span>LUCE: {lightPercent >= 0 ? `+${lightPercent}%` : `${lightPercent}%`}</span>
                </span>
              </div>
            </div>

            <div className="mt-2.5 text-sm font-chakra font-black text-amber-300 uppercase tracking-wide truncate max-w-full">
              {targetName || 'Bersaglio'}
            </div>
            <div className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Visibile al 100% senza sfondo estraneo</span>
            </div>
          </div>

          {/* Right Column: Upload options, Background Removal & Balanced Light Controls */}
          <div className="sm:col-span-7 flex flex-col justify-between space-y-3.5">
            {/* Step 1: Upload Personal Photo */}
            <div>
              <label className="text-xs font-mono text-stone-300 font-bold block mb-1.5 flex items-center justify-between">
                <span>1. CARICA LA FOTO:</span>
                <span className="text-[10px] text-pink-400 font-normal">Selfie o foto frontale</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/50 hover:border-purple-400 text-purple-200 hover:text-white transition-all flex items-center justify-center gap-2 font-chakra font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
                >
                  <Upload className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Scegli Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-3 rounded-xl bg-pink-950/50 hover:bg-pink-900/60 border border-pink-500/50 hover:border-pink-400 text-pink-200 hover:text-white transition-all flex items-center justify-center gap-2 font-chakra font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
                >
                  <Camera className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>Fotocamera</span>
                </button>
              </div>

              {/* Hidden Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Step 2: BACKGROUND REMOVAL & LIGHT CONTROLS */}
            <div className="bg-stone-950/90 rounded-2xl border border-amber-500/40 p-3.5 shadow-[0_0_20px_rgba(245,158,11,0.12)]">
              {/* Header with Auto-Enhance Button */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-amber-300 font-chakra font-bold text-xs uppercase tracking-wider">
                  <Scissors className="w-4 h-4 text-emerald-400" />
                  <span>2. RIMOZIONE SFONDO & LUCE BILANCIATA</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoEnhance}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-mono uppercase cursor-pointer transition-colors"
                  title="Ripristina la combinazione ideale: luce bilanciata e sfondo rimosso"
                >
                  <Wand2 className="w-3 h-3 text-amber-400" />
                  <span>Ottimizza</span>
                </button>
              </div>

              {/* Feature A: Toggle Background Removal (User Request!) */}
              <div className="mb-3 p-2 rounded-xl bg-stone-900/90 border border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${lighting.removeBackground ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-stone-800 text-stone-500'}`}>
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-chakra font-bold uppercase tracking-wider text-stone-200 block">
                      Togli Sfondo dal Volto
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 block">
                      {lighting.removeBackground ? 'Attivo: sagoma solo il viso sulla testa' : 'Disattivato: mostra la foto intera'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleRemoveBackground}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    lighting.removeBackground
                      ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/30 font-black'
                      : 'bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700'
                  }`}
                >
                  {lighting.removeBackground ? '✓ ATTIVO' : 'DISATTIVATO'}
                </button>
              </div>

              {/* Feature B: Quick Lighting Presets (User Request: "togli ancora luminosita") */}
              <div className="mb-3">
                <div className="flex justify-between text-[11px] font-mono text-stone-300 mb-1">
                  <span>Regolazione Luce Rapida:</span>
                  <span className="text-amber-400 font-bold">
                    {lighting.brightness <= 0.90 ? 'Meno Luce / Tenue (-15%)' : lighting.brightness <= 1.05 ? 'Naturale (100% Consigliata)' : 'Schiarita (+12%)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLightPreset('dim')}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-chakra font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      lighting.brightness <= 0.90
                        ? 'bg-amber-500/30 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Sun className="w-3 h-3 text-stone-400" />
                    <span>Meno Luce (-15%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLightPreset('natural')}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-chakra font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      lighting.brightness > 0.90 && lighting.brightness <= 1.05
                        ? 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Naturale (100%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLightPreset('bright')}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-chakra font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      lighting.brightness > 1.05
                        ? 'bg-amber-500/35 border-amber-300 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-1 ring-amber-300'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Sun className="w-3 h-3 text-amber-300" />
                    <span>Schiarita (+12%)</span>
                  </button>
                </div>
              </div>

              {/* Sliders Grid */}
              <div className="space-y-2 text-[11px] font-mono">
                {/* Brightness Slider */}
                <div>
                  <div className="flex justify-between text-stone-300 mb-0.5">
                    <span className="flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-400" />
                      Luce Volto:
                    </span>
                    <span className="text-amber-400 font-bold">
                      {lightPercent >= 0 ? `+${lightPercent}%` : `${lightPercent}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.65"
                    max="1.40"
                    step="0.02"
                    value={lighting.brightness}
                    onChange={(e) => updateLighting({ brightness: parseFloat(e.target.value) })}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
                  />
                </div>

                {/* Contrast Slider */}
                <div>
                  <div className="flex justify-between text-stone-300 mb-0.5">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-pink-400" />
                      Contrasto & Dettagli:
                    </span>
                    <span className="text-pink-400 font-bold">
                      {Math.round(lighting.contrast * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="1.5"
                    step="0.04"
                    value={lighting.contrast}
                    onChange={(e) => updateLighting({ contrast: parseFloat(e.target.value) })}
                    className="w-full accent-pink-400 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
                  />
                </div>

                {/* Zoom & Mask Framing Sliders */}
                {rawUploadedImage && (
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-stone-800/80">
                    <div>
                      <div className="flex justify-between text-stone-300 mb-0.5">
                        <span className="flex items-center gap-1">
                          <ZoomIn className="w-3 h-3 text-purple-400" />
                          Zoom Volto:
                        </span>
                        <span className="text-purple-400 font-bold">{lighting.zoom.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="2.0"
                        step="0.05"
                        value={lighting.zoom}
                        onChange={(e) => updateLighting({ zoom: parseFloat(e.target.value) })}
                        className="w-full accent-purple-400 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-stone-300 mb-0.5">
                        <span className="flex items-center gap-1">
                          <MoveVertical className="w-3 h-3 text-cyan-400" />
                          Posizione Su/Giù:
                        </span>
                        <span className="text-cyan-400 font-bold">
                          {lighting.offsetY > 0 ? `+${Math.round(lighting.offsetY * 100)}` : Math.round(lighting.offsetY * 100)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-0.22"
                        max="0.22"
                        step="0.02"
                        value={lighting.offsetY}
                        onChange={(e) => updateLighting({ offsetY: parseFloat(e.target.value) })}
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Presets Selection */}
            <div>
              <label className="text-[11px] font-mono text-stone-400 block mb-1">
                OPPURE SCEGLI UN BERSAGLIO RAPIDO:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                      selectedPresetId === p.id
                        ? 'bg-purple-600/30 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)] ring-1 ring-purple-400'
                        : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-stone-700">
                      <img src={svgToDataUrl(p.svg)} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-chakra font-bold truncate max-w-full">
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Name Input */}
            <div>
              <label className="text-[11px] font-mono text-stone-300 font-bold block mb-1">
                NOME DEL BERSAGLIO:
              </label>
              <input
                type="text"
                value={targetName}
                maxLength={24}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="Es. Il Mio Capo, Il Mio Ex..."
                className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 font-mono text-xs focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-3 border-t border-stone-800 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-chakra font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer min-h-[48px]"
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-chakra font-black text-base sm:text-lg uppercase tracking-wider shadow-[0_0_35px_rgba(217,70,239,0.55)] transition-all flex items-center justify-center gap-2.5 min-h-[50px] border border-amber-300 transform hover:scale-[1.01] active:scale-[0.98] ${
              isProcessing ? 'opacity-70 cursor-wait' : 'cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <span>Elaborazione sagoma e luce...</span>
            ) : (
              <>
                <Flame className="w-5 h-5 text-amber-300 animate-pulse" />
                <span>ENTRA NELLA STANZA DEI 28 MANICHINI (60s)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
