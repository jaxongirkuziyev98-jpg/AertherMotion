import React from 'react';
import { X, Sparkles, Video, CheckCircle2 } from 'lucide-react';

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const gestures = [
    {
      icon: <span className="text-2xl">⚡</span>,
      title: 'Qo‘llarni Yaqinlashtirish — Zichlashish',
      action: 'Super-zich yorqin kvant yadrosi',
      desc: 'Ikkala qo‘lingizni bir-biriga yaqinlashtirganingizda yoki bitta qo‘lingizni musht qilib buklaganingizda barcha zarrachalar markazga tortilib, o‘ta zich va kichik sharga aylanadi.',
      badge: 'Zichlashish ⚡',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    },
    {
      icon: <span className="text-2xl">🌌</span>,
      title: 'Katta Yoyish — Fazoviy Tarqalish',
      action: 'Zarrachalarning Butun Fazoga Yoyilishi',
      desc: 'Qo‘lingizni keng ochib kaftingizni yoysangiz yoki ikkala qo‘lingizni bir-biridan uzoqlashtirsangiz, barcha zarrachalar butun fazoga yoyilib, ulkan nurli kosmik bulut hosil qiladi.',
      badge: 'Yoyilish 🌌',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      icon: <span className="text-2xl">📏</span>,
      title: 'Uzoqlashtirish va Kichraytirish (Chuqurlik)',
      action: 'Qo‘l Masofasiga Qarab Z-O‘qi Bo‘ylab Boshqarish',
      desc: 'Qo‘lingizni kameradan uzoqlashtirsangiz, ekrandagi 3D kiber qo‘l ham chuqurlikka ketib kichrayadi; kameraga yaqinlashtirsangiz oldinga chiqib kattalashadi.',
      badge: 'Z Chuqurlik',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      icon: <span className="text-2xl">🤏</span>,
      title: 'Chimdish (Pinch) - Barmoqlar Bilan Ushlash',
      action: 'Kvant Energiyasini Barmoqlar Bilan Siqish',
      desc: 'Bosh va ko‘rsatkich barmoqlarini birlashtiring — sharlar kuchli magnit maydon bilan quvvatlanadi va qulflanadi.',
      badge: 'Chimdish',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      icon: <span className="text-2xl">🤖</span>,
      title: 'Yangi Kristal Kiber Qo‘llar',
      action: 'Silliq 60 FPS, qotishlarsiz nozik dizayn',
      desc: 'Yangi shaffof kristall titan materialli qo‘llar ekranni to‘sib qo‘ymaydi va qotib qolmasdan sekundiga 60 kadr tezlikda harakatlanadi.',
      badge: 'Kristall Qo‘llar',
      badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    },
    {
      icon: <span className="text-2xl">👓</span>,
      title: 'VR Stereoskopik Ko‘zlik Rejimi',
      action: 'VR Box va Cardboard uchun ikkita ko‘zga bo‘lish',
      desc: 'Pastki paneldagi VR Stereo tugmasini bosing — ekran chap va o‘ng ko‘z uchun 3D stereoskopik ajratiladi.',
      badge: 'VR Dual-Eye',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/80 p-6 overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-cyber font-bold tracking-wide text-white">
                Fazoviy Obyektlarni Qo‘l Bilan Boshqarish
              </h2>
              <p className="text-xs text-slate-400">
                Sichqonchasiz: To‘g‘ridan-to‘g‘ri kamera va sun&apos;iy intellekt orqali
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4 max-h-[60vh] overflow-y-auto pr-1">
          {gestures.map((g, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {g.icon}
                    <h3 className="text-xs font-cyber font-bold text-slate-200">{g.title}</h3>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono font-bold ${g.badgeColor}`}>
                    {g.badge}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-cyan-300 mb-1">{g.action}</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Video size={14} className="text-cyan-400 shrink-0" />
            <span>Kamera oldida 50-80 sm masofada qo‘lingizni erkin harakatlantiring.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-cyber font-bold rounded-xl shadow-lg shadow-cyan-600/30 transition-all"
          >
            Boshlash
          </button>
        </div>
      </div>
    </div>
  );
};
