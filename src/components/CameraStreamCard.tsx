import React, { useState } from 'react';
import { Camera, Eye, EyeOff, VideoOff, Activity, Sparkles, RefreshCw, AlertTriangle, Settings2 } from 'lucide-react';
import { DualHandMetrics } from '../types/tracking';
import { CameraDeviceInfo } from '../services/handTracking';

interface CameraStreamCardProps {
  metrics: DualHandMetrics;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  isSimulation: boolean;
  errorMessage: string | null;
  availableCameras: CameraDeviceInfo[];
  selectedCameraId: string;
  onSelectCamera: (deviceId: string) => void;
  onToggleCamera: () => void;
  onToggleSimulation: () => void;
  onClearError: () => void;
}

export const CameraStreamCard: React.FC<CameraStreamCardProps> = ({
  metrics,
  videoRef,
  canvasRef,
  isCameraActive,
  isSimulation,
  errorMessage,
  availableCameras,
  selectedCameraId,
  onSelectCamera,
  onToggleCamera,
  onToggleSimulation,
  onClearError,
}) => {
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);

  return (
    <div className="absolute top-14 left-4 z-20 transition-all duration-300">
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-2.5 backdrop-blur-md shadow-2xl shadow-cyan-950/40 w-72">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                metrics.isDetected
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                  : isCameraActive
                  ? 'bg-cyan-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-cyber">
              {isSimulation ? 'Simulyator Rejimi' : isCameraActive ? 'Jonli Optik Kamera' : 'Kamera O‘chiq'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {availableCameras.length > 1 && (
              <button
                onClick={() => setShowDeviceSelector(!showDeviceSelector)}
                title="Kamerani tanlash"
                className={`p-1 rounded text-slate-300 transition-colors ${
                  showDeviceSelector ? 'bg-cyan-600 text-white' : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                <Settings2 size={13} />
              </button>
            )}
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              title={showSkeleton ? 'Skeletni yashirish' : 'Skeletni ko‘rsatish'}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {showSkeleton ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px]"
            >
              {isMinimized ? '▴' : '▾'}
            </button>
          </div>
        </div>

        {/* Camera device switcher dropdown */}
        {showDeviceSelector && availableCameras.length > 0 && !isMinimized && (
          <div className="mb-2 p-1.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
            <span className="text-slate-400 text-[10px] block mb-1">Kamerani tanlang:</span>
            <select
              value={selectedCameraId}
              onChange={(e) => {
                onSelectCamera(e.target.value);
                setShowDeviceSelector(false);
              }}
              className="w-full bg-slate-900 border border-cyan-500/30 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
            >
              {availableCameras.map((cam) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error message alert banner */}
        {errorMessage && !isMinimized && (
          <div className="mb-2 p-2 bg-rose-950/70 border border-rose-500/50 rounded-lg text-rose-200 text-[11px] leading-tight flex flex-col gap-1.5">
            <div className="flex items-start gap-1.5">
              <AlertTriangle size={14} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-rose-900/60">
              <button
                onClick={onToggleCamera}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-semibold transition-colors"
              >
                Qayta urinish
              </button>
              <button
                onClick={onToggleSimulation}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] transition-colors"
              >
                Simulyatorga o‘tish
              </button>
            </div>
          </div>
        )}

        {/* Video & Skeleton Viewport */}
        {!isMinimized && (
          <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
            {/* Real Webcam Video element (mirrored) */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${
                !isCameraActive || isSimulation ? 'hidden' : 'block'
              }`}
            />

            {/* Canvas overlay for drawing hand skeleton */}
            <canvas
              ref={canvasRef}
              width={320}
              height={240}
              className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${
                showSkeleton && isCameraActive && !isSimulation ? 'block' : 'hidden'
              }`}
            />

            {/* Simulation animation graphic if in simulation mode */}
            {isSimulation && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-cyan-950/40 to-slate-950/80">
                <Sparkles className="w-8 h-8 text-cyan-400 mb-2 animate-bounce" />
                <p className="text-[11px] text-cyan-200 font-medium">Virtual Sensor Simulyatori</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Kameraga ruxsat berish uchun quyidagi tugmani bosing
                </p>
                <button
                  onClick={onToggleCamera}
                  className="mt-2.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                >
                  <Camera size={13} />
                  Kamerani yoqish
                </button>
              </div>
            )}

            {/* Offline state */}
            {!isCameraActive && !isSimulation && (
              <div className="flex flex-col items-center text-center p-3">
                <VideoOff className="w-7 h-7 text-slate-600 mb-1" />
                <p className="text-[11px] text-slate-300 font-medium">Kamera faol emas</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Qo‘lingiz bilan boshqarish uchun kamerani ulang</p>
                <button
                  onClick={onToggleCamera}
                  className="mt-2.5 px-3 py-1 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                >
                  <Camera size={13} />
                  Kamerani yoqish
                </button>
              </div>
            )}

            {/* Live tracking reticle watermark */}
            {isCameraActive && (
              <div className="absolute bottom-1.5 left-1.5 z-20 flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-black/75 px-1.5 py-0.5 rounded border border-emerald-500/30">
                <Activity size={10} className="text-emerald-400" />
                <span>
                  {metrics.isHeartGesture
                    ? '🫶 YURAKCHA ISHORASI'
                    : metrics.isFused
                    ? '⚡ SHARIKCHALAR BIRLASHDI'
                    : metrics.handCount === 2
                    ? 'IKKITA QO‘L KUZATILMOQDA'
                    : metrics.isDetected
                    ? '1 TA QO‘L ANIQLANDI'
                    : 'QO‘LLARINGIZNI KO‘RSATING'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Quick controls underneath */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-1">
            <span>FPS:</span>
            <span className="text-cyan-400 font-bold">{metrics.fps}</span>
            <span className="text-slate-600 ml-1">|</span>
            <span className="ml-1">LAT:</span>
            <span className="text-slate-300">{metrics.latencyMs}ms</span>
          </div>

          <button
            onClick={onToggleSimulation}
            className="hover:text-cyan-400 underline flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw size={10} />
            {isSimulation ? 'Haqiqiy kameraga o‘tish' : 'Demo Simulyator'}
          </button>
        </div>
      </div>
    </div>
  );
};
