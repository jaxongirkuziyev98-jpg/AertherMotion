import React, { useState } from 'react';
import { Compass, Sparkles, Activity, Heart, Flame } from 'lucide-react';
import { DualHandMetrics } from '../types/tracking';

interface TelemetryPanelProps {
  metrics: DualHandMetrics;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ metrics }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="absolute top-14 right-4 z-20">
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3 backdrop-blur-md shadow-2xl shadow-cyan-950/40 w-72 select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-cyber uppercase tracking-wider text-slate-200 font-bold">
              Ikkita Qo‘l Telemetriyasi
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-[10px] text-slate-400 hover:text-cyan-300 font-mono px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer"
          >
            {isOpen ? 'Yig‘ish' : 'Kengaytirish'}
          </button>
        </div>

        {/* Heart Gesture Active Special Badge */}
        {metrics.isHeartGesture ? (
          <div className="mb-2.5 p-2 bg-gradient-to-r from-rose-950 to-pink-950 border border-rose-500/60 rounded-xl flex items-center justify-center gap-2 text-rose-200 text-xs font-cyber font-bold shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse">
            <Heart size={16} className="text-rose-400 fill-rose-400 animate-bounce" />
            <span>🫶 YURAKCHA ISHORASI FAOL!</span>
          </div>
        ) : metrics.isFused ? (
          <div className="mb-2.5 p-2 bg-gradient-to-r from-sky-950 to-cyan-950 border border-cyan-400/60 rounded-xl flex items-center justify-center gap-2 text-cyan-200 text-xs font-cyber font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Flame size={16} className="text-cyan-400 animate-spin" />
            <span>⚡ JAMLANGAN DUMALOQ SHAR!</span>
          </div>
        ) : metrics.handDistance > 0.8 ? (
          <div className="mb-2.5 p-2 bg-gradient-to-r from-purple-950 to-slate-950 border border-purple-500/50 rounded-xl flex items-center justify-center gap-2 text-purple-300 text-xs font-cyber font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Sparkles size={16} className="text-purple-400" />
            <span>🌌 KENGAYIB YOYILGAN SHARIKCHALAR!</span>
          </div>
        ) : (
          <div className="mb-2.5 py-1.5 px-2 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs font-cyber font-medium text-slate-400">
            {metrics.handCount === 2 ? 'IKKITA QO‘L KUZATILMOQDA' : metrics.handCount === 1 ? '1 TA QO‘L KUZATILMOQDA' : 'QO‘LLARINGIZNI KO‘RSATING'}
          </div>
        )}

        {isOpen && (
          <div className="space-y-2.5 font-mono text-[11px]">
            {/* Hand-to-Hand Distance Meter */}
            <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800">
              <div className="flex justify-between items-center text-[10px] mb-1.5">
                <span className="text-slate-400 flex items-center gap-1 font-cyber">
                  <Sparkles size={11} className="text-cyan-400" /> Qo‘llar Kengayishi (Masofa):
                </span>
                <span className="text-cyan-400 font-bold">{metrics.handDistance.toFixed(2)}m</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    metrics.isFused
                      ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                      : 'bg-gradient-to-r from-cyan-500 to-purple-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(10, (1 - metrics.handDistance / 2) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                <span>Jamlanish (Dumaloq)</span>
                <span>Kengayish (Yoyilish)</span>
              </div>
            </div>

            {/* Left Hand Coordinates */}
            <div className="bg-slate-950/70 rounded-xl p-2 border border-cyan-500/20">
              <div className="flex items-center justify-between text-[10px] mb-1 text-cyan-400 font-cyber font-bold">
                <span className="flex items-center gap-1">
                  <Compass size={11} /> CHAP QO‘L (MOVİY SHAR)
                </span>
                <span className={metrics.leftHand?.isDetected ? 'text-emerald-400' : 'text-slate-500'}>
                  {metrics.leftHand?.isDetected ? '● Jonli' : '○ Yo‘q'}
                </span>
              </div>
              {metrics.leftHand ? (
                <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                  <div className="bg-slate-900 p-1 rounded border border-slate-800">
                    <span className="text-[8px] text-slate-500 block">X</span>
                    <span className="font-bold text-cyan-300">{metrics.leftHand.position.x}</span>
                  </div>
                  <div className="bg-slate-900 p-1 rounded border border-slate-800">
                    <span className="text-[8px] text-slate-500 block">Y</span>
                    <span className="font-bold text-cyan-300">{metrics.leftHand.position.y}</span>
                  </div>
                  <div className="bg-slate-900 p-1 rounded border border-slate-800">
                    <span className="text-[8px] text-slate-500 block">Z (Uzoqlik)</span>
                    <span className="font-bold text-purple-300">{metrics.leftHand.position.z}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 text-center py-1">Chap qo‘lni ko‘rsating</div>
              )}
            </div>

            {/* Right Hand Coordinates */}
            <div className="bg-slate-950/70 rounded-xl p-2 border border-purple-500/20">
              <div className="flex items-center justify-between text-[10px] mb-1 text-purple-400 font-cyber font-bold">
                <span className="flex items-center gap-1">
                  <Compass size={11} /> O‘NG QO‘L (BINAFSHA SHAR)
                </span>
                <span className={metrics.rightHand?.isDetected ? 'text-emerald-400' : 'text-slate-500'}>
                  {metrics.rightHand?.isDetected ? '● Jonli' : '○ Yo‘q'}
                </span>
              </div>
              {metrics.rightHand ? (
                <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                  <div className="bg-slate-900 p-1 rounded border border-slate-800">
                    <span className="text-[8px] text-slate-500 block">X</span>
                    <span className="font-bold text-purple-300">{metrics.rightHand.position.x}</span>
                  </div>
                  <div className="bg-slate-900 p-1 rounded border border-slate-800">
                    <span className="text-[8px] text-slate-500 block">Y</span>
                    <span className="font-bold text-purple-300">{metrics.rightHand.position.y}</span>
                  </div>
                  <div className="bg-slate-900 p-1 rounded border border-slate-800">
                    <span className="text-[8px] text-slate-500 block">Z (Uzoqlik)</span>
                    <span className="font-bold text-cyan-300">{metrics.rightHand.position.z}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 text-center py-1">O‘ng qo‘lni ko‘rsating</div>
              )}
            </div>

            {/* Live Stats */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1">
              <span>Optik FPS: <b className="text-cyan-400">{metrics.fps}</b></span>
              <span>Kechikish: <b className="text-slate-300">{metrics.latencyMs}ms</b></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
