import React from 'react';
import { Camera, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface CameraPermissionModalProps {
  isOpen: boolean;
  errorMessage: string | null;
  onActivateCamera: () => void;
  onUseSimulation: () => void;
}

export const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({
  isOpen,
  errorMessage,
  onActivateCamera,
  onUseSimulation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/80 overflow-hidden text-center">
        {/* Glow ambient background */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Camera Icon Header */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
          <Camera size={32} />
        </div>

        <h2 className="text-xl sm:text-2xl font-cyber font-bold text-white tracking-wide mb-2">
          Qo‘lingiz bilan Boshqarish Tizimi
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          Saytni va 3D obyektlarni xuddi videodagidek qo‘lingiz bilan boshqarish uchun veb-kamerani faollashtiring.
        </p>

        {/* Error state if any */}
        {errorMessage && (
          <div className="mb-6 p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-left text-xs text-rose-200">
            <div className="flex items-center gap-2 font-bold mb-1 text-rose-300">
              <AlertCircle size={15} />
              <span>Kamera Xatoligi Aniqlondi:</span>
            </div>
            <p className="text-slate-300 leading-normal">{errorMessage}</p>
            <p className="mt-2 text-[11px] text-amber-300">
              👉 Yechim: Brauzeringizning yuqori manzil satridagi qulf (🔒) yoki kamera belgisiga bosib, <b>&quot;Ruxsat berish&quot; (Allow)</b> ni tanlang va sahifani qayta yuklang.
            </p>
          </div>
        )}

        {/* Steps / Features checklist */}
        <div className="space-y-2.5 text-left mb-6 font-mono text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>21 ta bo‘g‘in va barmoqlarning fazoviy harakati</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>Chimdish (Pinch) orqali obyektlarni 3D fazoda ushlash va ko‘chirish</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>Maxfiylik: videolaringiz serverga jo‘natilmaydi, to‘liq qurilmangizda ishlaydi</span>
          </div>
        </div>

        {/* Main Activation Button */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onActivateCamera}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-cyber font-bold text-sm tracking-wider uppercase rounded-2xl shadow-xl shadow-cyan-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
          >
            <Camera size={18} />
            <span>Kamerani Yoqish va Ruxsat Berish</span>
          </button>

          <button
            onClick={onUseSimulation}
            className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-mono transition-colors"
          >
            Hozircha Simulyator / Demo Ko‘rish
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck size={13} className="text-cyan-500" />
          <span>Xavfsiz WebRTC &amp; Optik Tizim</span>
        </div>
      </div>
    </div>
  );
};
