import React, { useState } from 'react';
import { 
  Bot, 
  Atom, 
  Globe, 
  Box, 
  Glasses, 
  Sliders, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  Palette,
  Zap,
  Camera,
  Maximize2,
  Sun,
  Orbit,
  Disc3,
  Radio,
  Telescope
} from 'lucide-react';
import { SceneEnvironment, SpatialObjectType, ParticleColorTheme } from '../types/tracking';

interface ControlDockProps {
  selectedObject: SpatialObjectType;
  onSelectObject: (obj: SpatialObjectType) => void;
  environment: SceneEnvironment;
  onSelectEnvironment: (env: SceneEnvironment) => void;
  particleTheme: ParticleColorTheme;
  onSelectParticleTheme: (theme: ParticleColorTheme) => void;
  onTriggerShockwave: () => void;
  onTakeSnapshot: () => void;
  isVRMode: boolean;
  onToggleVRMode: () => void;
  sensitivity: number;
  onChangeSensitivity: (val: number) => void;
  smoothing: number;
  onChangeSmoothing: (val: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenHelp: () => void;
  onOpenCosmicAtlas: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  selectedObject,
  onSelectObject,
  environment,
  onSelectEnvironment,
  particleTheme,
  onSelectParticleTheme,
  onTriggerShockwave,
  onTakeSnapshot,
  isVRMode,
  onToggleVRMode,
  sensitivity,
  onChangeSensitivity,
  smoothing,
  onChangeSmoothing,
  isMuted,
  onToggleMute,
  onOpenHelp,
  onOpenCosmicAtlas,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'objects' | 'themes' | 'env' | 'settings'>('objects');

  const objects: { id: SpatialObjectType; name: string; icon: React.ReactNode; desc: string; isCosmic?: boolean }[] = [
    { id: 'dual-hands', name: 'Kvant Zarracha Shari', icon: <Bot size={15} />, desc: 'Yaqinlashtirishda zich, yoyishda fazoga tarqaladi' },
    { id: 'black-hole', name: 'Gargantua Qora Tuynuk', icon: <Disc3 size={15} />, desc: 'Gravitatsion lenza va aylanuvchi plazma diski', isCosmic: true },
    { id: 'solar-system-orbit', name: 'Quyosh Tizimi', icon: <Sun size={15} />, desc: 'Quyosh va real vaqtda aylanuvchi sayyoralar orbitasi', isCosmic: true },
    { id: 'saturn-ringed', name: 'Saturn Giganti', icon: <Orbit size={15} />, desc: 'Yulduz changi va muz kristalli ulkan halqa', isCosmic: true },
    { id: 'supernova-star', name: 'Supernova Pulsar', icon: <Radio size={15} />, desc: 'Kuchli magnit maydonli neytron yulduzi', isCosmic: true },
    { id: 'quantum-core', name: 'Kvant Yadrosi', icon: <Atom size={15} />, desc: 'Aylanuvchi reaktor halqalari' },
    { id: 'cyber-globe', name: 'Kiber Globus', icon: <Globe size={15} />, desc: 'Orbital sun‘iy yo‘ldoshlar' },
    { id: 'hypercube', name: 'Giperkub 4D', icon: <Box size={15} />, desc: 'Tesserakt kristall matritsasi' },
  ];

  const themes: { id: ParticleColorTheme; name: string; gradient: string; dot: string; desc: string }[] = [
    { id: 'quantum-cyan', name: 'Kvant Neon', gradient: 'from-cyan-500 to-sky-400', dot: 'bg-cyan-400', desc: 'Sian va osmon rangli fotonlar' },
    { id: 'solar-gold', name: 'Supernova Olov', gradient: 'from-amber-400 to-rose-500', dot: 'bg-amber-400', desc: 'Yulduz portlashi plazmasi' },
    { id: 'matrix-emerald', name: 'Kiber Matritsa', gradient: 'from-emerald-400 to-teal-300', dot: 'bg-emerald-400', desc: 'Bioluminessent kod zarrachalari' },
    { id: 'cosmic-amethyst', name: 'Ametist Bo‘shliq', gradient: 'from-purple-500 to-fuchsia-400', dot: 'bg-purple-400', desc: 'Kvazar va gravitatsiya nurlari' },
    { id: 'prismatic-aurora', name: 'Spektr Aurora', gradient: 'from-rose-400 via-amber-300 to-cyan-400', dot: 'bg-gradient-to-r from-pink-400 to-cyan-400', desc: 'Kamalak rangli ko‘p fazoviy nur' },
  ];

  const envs: { id: SceneEnvironment; name: string; color: string; desc: string }[] = [
    { id: 'deep-cosmos', name: 'Cheksiz Koinot', color: 'bg-indigo-600', desc: 'Chuqur fazo, 1200 ta porloq yulduzlar' },
    { id: 'solar-system', name: 'Geliotsentrik Fazo', color: 'bg-amber-500', desc: 'Quyosh radiatsiyasi va sayyoralar nuri' },
    { id: 'nebula-void', name: 'Kosmik Tumanlik', color: 'bg-purple-600', desc: 'Ametist va moviy tumanlik changlari' },
    { id: 'cyber-space', name: 'Kiber Kosmos', color: 'bg-cyan-500', desc: 'Optik gologramma to‘ri' },
    { id: 'matrix-grid', name: 'Neon Matritsa', color: 'bg-emerald-500', desc: 'Kiberpunk yashil matritsa' },
    { id: 'holo-lab', name: 'Golo-Laboratoriya', color: 'bg-purple-500', desc: 'Ilmiy VR laboratoriya' },
    { id: 'minimal-studio', name: 'Minimal Studiya', color: 'bg-slate-400', desc: 'Neytral tekshiruv muhiti' },
  ];

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 max-w-[min(980px,96vw)] w-full select-none ${
        isCollapsed ? 'translate-y-[calc(100%-38px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Toggle Button centered on top edge */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-4 py-1 rounded-t-lg bg-slate-900/90 border-t border-x border-cyan-500/40 text-[11px] font-cyber tracking-wider text-cyan-300 hover:text-white backdrop-blur-md shadow-lg shadow-cyan-950/40 transition-colors"
        >
          {isCollapsed ? (
            <>
              <ChevronUp size={14} className="text-cyan-400" />
              <span>Boshqaruv Panelini Ochish</span>
            </>
          ) : (
            <>
              <ChevronDown size={14} className="text-cyan-400" />
              <span>Kinematik Rejim (Panellarni Yashirish)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Dock */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3 backdrop-blur-xl shadow-2xl shadow-cyan-950/60 text-slate-200">
        {/* Top Dock Navigation Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800 text-xs">
          {/* Section Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('objects')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-cyber transition-all ${
                activeTab === 'objects'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={13} />
              <span>3D Obyektlar</span>
            </button>

            <button
              onClick={() => setActiveTab('themes')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-cyber transition-all ${
                activeTab === 'themes'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap size={13} />
              <span>Zarracha Rangi</span>
            </button>

            <button
              onClick={() => setActiveTab('env')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-cyber transition-all ${
                activeTab === 'env'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette size={13} />
              <span>Atrof-muhit</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-cyber transition-all ${
                activeTab === 'settings'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders size={13} />
              <span>Sozlamalar</span>
            </button>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2">
            {/* Shockwave Burst Button */}
            <button
              onClick={onTriggerShockwave}
              title="Kinetik energiya to‘lqini portlatish"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-cyber font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            >
              <Zap size={13} className="text-amber-400 animate-pulse" />
              <span>PORTLASH</span>
            </button>

            {/* Snapshot Button */}
            <button
              onClick={onTakeSnapshot}
              title="3D olamdan yuqori aniqlikdagi fotosurat olish"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-cyan-500/30 bg-slate-950/80 hover:bg-cyan-950/40 text-cyan-300 text-xs font-cyber transition-all"
            >
              <Camera size={13} />
              <span className="hidden sm:inline">Foto</span>
            </button>

            {/* VR Stereo Mode Toggle */}
            <button
              onClick={onToggleVRMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-cyber font-bold tracking-wider transition-all ${
                isVRMode
                  ? 'bg-purple-600/30 text-purple-300 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Glasses size={14} className={isVRMode ? 'text-purple-400' : 'text-slate-400'} />
              <span>{isVRMode ? 'VR REJIM' : 'VR STEREO'}</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Ovozni yoqish' : 'Ovozni o‘chirish'}
              className="p-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Cosmic Atlas Button ("Koinot Atlasi") */}
            <button
              onClick={onOpenCosmicAtlas}
              title="Koinot va fazo jismlari atlasi"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-900/40 to-cyan-900/40 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 text-xs font-cyber font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer"
            >
              <Telescope size={14} className="text-cyan-400" />
              <span>KOINOT</span>
            </button>

            {/* Gesture Guide Help Button */}
            <button
              onClick={onOpenHelp}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/30 text-xs font-cyber transition-all"
            >
              <HelpCircle size={14} />
              <span className="hidden sm:inline">Qo‘llanma</span>
            </button>
          </div>
        </div>

        {/* Tab 1: 3D Objects Switcher (Kosmik va Futuristik Obyektlar) */}
        {activeTab === 'objects' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
            {objects.map((obj) => {
              const isSelected = selectedObject === obj.id;
              return (
                <button
                  key={obj.id}
                  onClick={() => onSelectObject(obj.id)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-950/70 to-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  {obj.isCosmic && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-1 rounded">
                      FAZO
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={isSelected ? 'text-cyan-400' : 'text-slate-400'}>
                      {obj.icon}
                    </span>
                    <span className={`text-xs font-cyber font-bold ${isSelected ? 'text-cyan-200' : 'text-slate-300'}`}>
                      {obj.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {obj.desc}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Particle Color Themes */}
        {activeTab === 'themes' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {themes.map((th) => {
              const isSelected = particleTheme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => onSelectParticleTheme(th.id)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3 h-3 rounded-full ${th.dot} shadow-sm`} />
                    <span className={`text-xs font-cyber font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {th.name}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 leading-tight">
                    {th.desc}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 3: Environment Switcher (Kosmik va Kiber Fazolar) */}
        {activeTab === 'env' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
            {envs.map((e) => {
              const isSelected = environment === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => onSelectEnvironment(e.id)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border text-xs font-cyber transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${e.color} shadow-sm shrink-0`} />
                    <span className="font-semibold text-xs">{e.name}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-sans leading-tight">
                    {e.desc}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 3: Sliders & Sensor Tuning */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Sensitivity */}
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-300 font-cyber">Harakat Sezgirligi (Sensitivity):</span>
                <span className="text-cyan-400 font-bold">{sensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={sensitivity}
                onChange={(e) => onChangeSensitivity(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>0.5x (Aniq)</span>
                <span>1.0x (Standart)</span>
                <span>2.0x (Tezkor)</span>
              </div>
            </div>

            {/* Smoothing */}
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-300 font-cyber">Silliqlash Filtri (Smoothing):</span>
                <span className="text-emerald-400 font-bold">{Math.round(smoothing * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={smoothing}
                onChange={(e) => onChangeSmoothing(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>10% (Tez javob)</span>
                <span>40% (Optimal)</span>
                <span>80% (O‘ta silliq)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
