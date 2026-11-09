import React from 'react';
import { X, Telescope, Compass, Sparkles, Orbit, Sun, Disc3, Radio, ArrowUpRight } from 'lucide-react';
import { SpatialObjectType } from '../types/tracking';

interface CosmicAtlasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectObject: (obj: SpatialObjectType) => void;
}

export const CosmicAtlasModal: React.FC<CosmicAtlasModalProps> = ({
  isOpen,
  onClose,
  onSelectObject,
}) => {
  if (!isOpen) return null;

  const cosmicBodies = [
    {
      id: 'black-hole' as SpatialObjectType,
      name: 'Gargantua Qora Tuynuk',
      category: 'Gravitatsion Singularlik',
      distance: '100 million yorug‘lik yili',
      temp: 'Absolyut nolga yaqin (Event Horizon)',
      icon: <Disc3 className="w-5 h-5 text-amber-400" />,
      tag: 'RELATIVISTIK',
      desc: 'Kuchli gravitatsiya ta‘sirida fazo-vaqt egriligi va orqa fondagi yorug‘lik nurlarini bukib ko‘rsatuvchi gravitatsion linza hamda o‘ta yuqori haroratli aylanuvchi plazma diski.',
      gestureTip: 'Qo‘llarni yaqinlashtirib buksangiz — singulyarlik qisilishi tezlashadi, yoyganda esa nurlar fazoga sochiladi.',
    },
    {
      id: 'solar-system-orbit' as SpatialObjectType,
      name: 'Geliotsentrik Quyosh Tizimi',
      category: 'Sayyoralar Tizimi',
      distance: '0 y.y. (Ona galaktikamiz)',
      temp: '5,778 K (Quyosh sathi)',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      tag: 'ORBITAL',
      desc: 'Markaziy termoyadroviy Quyosh atrofida real vaqtda aylanuvchi Merkuriy, Yer (hamda yo‘ldoshi Oy), qizil Mars va gaz giganti Yupiterning sinxron harakati.',
      gestureTip: 'Qo‘l bilagingizni aylantirish orqali butun sayyoralarning orbital aylanish burchagini fazoda boshqaring.',
    },
    {
      id: 'saturn-ringed' as SpatialObjectType,
      name: 'Saturn va Muz Kristallari Halqasi',
      category: 'Gaz Giganti Sayyora',
      distance: '1.4 milliard km',
      temp: '-140 °C',
      icon: <Orbit className="w-5 h-5 text-cyan-400" />,
      tag: 'HALQALI',
      desc: 'Millionlab mayda muz zarralari, chang va meteorit bo‘laklaridan tarkib topgan ulkan nurli halqa tizimiga ega sayyora.',
      gestureTip: 'Qo‘lingizni uzoqlashtirish va yaqinlashtirish orqali Saturn halqasining fazoviy o‘lchamini o‘zgartiring.',
    },
    {
      id: 'supernova-star' as SpatialObjectType,
      name: 'Supernova Pulsar Neytron Yulduzi',
      category: 'Magnitologik Neytron Yulduzi',
      distance: '6,500 yorug‘lik yili (Qisqichbaqasimon tumanlik)',
      temp: '1,000,000 K',
      icon: <Radio className="w-5 h-5 text-purple-400" />,
      tag: 'RADIO PULSAR',
      desc: 'O‘ta yulduz portlashidan so‘ng vujudga keluvchi, sekundiga o‘nlab marta aylanib, qutblaridan yuqori energiyali rentgen va gamma nurlarini chiqaruvchi pulsar.',
      gestureTip: 'Mushtingizni ochganda zaryadlangan relyativistik zarrachalar kosmosga portlab tarqaladi.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl shadow-cyan-950/70 text-slate-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Telescope size={20} />
            </div>
            <div>
              <h2 className="text-base font-cyber font-bold tracking-wider text-white flex items-center gap-2">
                KOINOT VA FAZO ATLASI
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  DEEP COSMOS
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Qo‘l harakatlaringiz bilan real vaqtda boshqarishingiz mumkin bo‘lgan samoviy jismlar
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

        {/* Celestial Bodies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {cosmicBodies.map((body) => (
            <div
              key={body.id}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/60 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {body.icon}
                    <h3 className="text-xs font-cyber font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {body.name}
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-amber-400 border border-amber-500/30">
                    {body.tag}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 mb-2">
                  <span>Masofa: <b className="text-slate-300">{body.distance}</b></span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed font-sans mb-2.5">
                  {body.desc}
                </p>

                <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-[10px] text-cyan-200 flex items-start gap-1.5 mb-3">
                  <Sparkles size={12} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><b>Qo‘l boshqaruvi:</b> {body.gestureTip}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectObject(body.id);
                  onClose();
                }}
                className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600 hover:to-blue-600 text-cyan-200 hover:text-white border border-cyan-500/40 text-xs font-cyber font-semibold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Fazoda Ochish</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Compass size={13} className="text-cyan-400" />
            <span>Fazo muhitini pastdagi &quot;Atrof-muhit&quot; bo‘limidan o‘zgartiring</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-cyber transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
