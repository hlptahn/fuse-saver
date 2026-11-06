import React, { useState, useEffect } from 'react';
import {
  CameraMode,
  SectorType,
  AppSettings,
} from '../types';
import {
  Play,
  Pause,
  FastForward,
  Compass,
  Eye,
  Zap,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ControlDockProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onJumpSector: (sector: SectorType) => void;
  onTriggerSpark: () => void;
  onInspectClosest: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  settings,
  onUpdateSettings,
  onJumpSector,
  onTriggerSpark,
  onInspectClosest,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (settings.zenMode) {
    return (
      <button
        onClick={() => onUpdateSettings({ zenMode: false })}
        className="fixed bottom-4 right-4 z-30 bg-[#161a1e] hover:bg-[#20272e] text-[#a0afbf] hover:text-white px-3 py-1.5 rounded border border-[#2b3642] text-xs font-mono flex items-center gap-1.5 shadow-xl transition-colors"
        aria-label="Exit cinema mode"
      >
        <Eye className="w-3.5 h-3.5 text-[#ff5500]" />
        Exit Zen Mode (H)
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-[920px] transition-transform duration-300 pointer-events-auto select-none"
      style={{
        transform: isCollapsed ? 'translate(-50%, calc(100% - 32px))' : 'translate(-50%, 0)',
      }}
      aria-label="Screensaver control dock"
    >
      {/* Collapse/Expand Drawer Tab */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-[#12161a] hover:bg-[#1a2026] text-[#8696a6] hover:text-white border border-[#27323d] border-b-0 px-4 py-1 rounded-t-md text-[11px] font-mono flex items-center gap-1.5 shadow-md transition-colors"
          aria-label={isCollapsed ? 'Expand controls dock' : 'Collapse controls dock'}
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-[#ff5500]" />
              Show Controls
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-[#ff5500]" />
              Hide Controls
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      <div className="bg-[#12161a] border border-[#27323d] rounded-xl p-3 shadow-2xl flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Flight Speed Presets */}
          <div className="flex items-center gap-1 bg-[#0b0e11] p-1 rounded-lg border border-[#1e2730]">
            <span className="text-[#657687] text-[10px] font-mono px-1.5 font-bold uppercase">
              Flight Speed
            </span>
            <button
              onClick={() => onUpdateSettings({ speed: settings.speed === 0 ? 1.0 : 0 })}
              className={`px-2 py-1 rounded font-mono text-[11px] flex items-center gap-1 transition-colors ${
                settings.speed === 0
                  ? 'bg-[#ff5500] text-black font-bold'
                  : 'text-[#9cb0c2] hover:bg-[#1c242c]'
              }`}
              aria-label="Pause or resume flight"
            >
              {settings.speed === 0 ? <Play className="w-3 h-3 fill-black" /> : <Pause className="w-3 h-3" />}
              {settings.speed === 0 ? 'Paused' : 'Pause'}
            </button>

            {[0.5, 1.0, 2.0, 3.5].map((s) => (
              <button
                key={s}
                onClick={() => onUpdateSettings({ speed: s })}
                className={`px-2 py-1 rounded font-mono text-[11px] transition-colors ${
                  settings.speed === s
                    ? 'bg-[#ff5500] text-black font-bold'
                    : 'text-[#9cb0c2] hover:bg-[#1c242c]'
                }`}
                aria-label={`Set flight speed to ${s}x`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Camera Flight Mode */}
          <div className="flex items-center gap-1 bg-[#0b0e11] p-1 rounded-lg border border-[#1e2730]">
            <span className="text-[#657687] text-[10px] font-mono px-1.5 font-bold uppercase">
              Camera Mode
            </span>
            <button
              onClick={() => onUpdateSettings({ cameraMode: 'screensaver' })}
              className={`px-2.5 py-1 rounded font-mono text-[11px] flex items-center gap-1.5 transition-colors ${
                settings.cameraMode === 'screensaver'
                  ? 'bg-[#ff5500] text-black font-bold'
                  : 'text-[#9cb0c2] hover:bg-[#1c242c]'
              }`}
              aria-label="Switch to continuous screensaver camera glide"
            >
              <Compass className="w-3 h-3" />
              Screensaver
            </button>
            <button
              onClick={() => onUpdateSettings({ cameraMode: 'manual' })}
              className={`px-2.5 py-1 rounded font-mono text-[11px] flex items-center gap-1.5 transition-colors ${
                settings.cameraMode === 'manual'
                  ? 'bg-[#ff5500] text-black font-bold'
                  : 'text-[#9cb0c2] hover:bg-[#1c242c]'
              }`}
              aria-label="Switch to manual fly-through flight"
            >
              <FastForward className="w-3 h-3" />
              Free Flight
            </button>
            <button
              onClick={onInspectClosest}
              className={`px-2.5 py-1 rounded font-mono text-[11px] flex items-center gap-1.5 transition-colors ${
                settings.cameraMode === 'inspect'
                  ? 'bg-[#ff5500] text-black font-bold'
                  : 'text-[#9cb0c2] hover:bg-[#1c242c]'
              }`}
              aria-label="Inspect closest industrial component"
            >
              <Eye className="w-3 h-3" />
              Inspect
            </button>
          </div>

          {/* Quick Actions (Spark burst, Audio, Zen) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onTriggerSpark}
              className="bg-[#241a14] hover:bg-[#382619] text-[#ff7722] hover:text-[#ffa044] border border-[#ff5500]/40 px-2.5 py-1 rounded-md font-mono text-[11px] flex items-center gap-1.5 transition-colors active:scale-95"
              aria-label="Trigger high-voltage arc spark"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ff5500]" />
              Trigger Arc (Space)
            </button>

            <button
              onClick={() => onUpdateSettings({ audioMuted: !settings.audioMuted })}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] flex items-center gap-1.5 border transition-colors ${
                !settings.audioMuted
                  ? 'bg-[#18291f] text-[#00dd66] border-[#00bb55]/40'
                  : 'bg-[#161a1e] text-[#8696a6] border-[#27323d] hover:text-white'
              }`}
              aria-label={settings.audioMuted ? 'Unmute procedural 50Hz mains audio' : 'Mute audio'}
            >
              {!settings.audioMuted ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#00dd66]" />
                  50Hz Hum On
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[#7c8d9e]" />
                  Muted
                </>
              )}
            </button>

            <button
              onClick={() => onUpdateSettings({ zenMode: true })}
              className="bg-[#161a1e] hover:bg-[#1e242c] text-[#9cb0c2] hover:text-white border border-[#27323d] p-1.5 rounded-md transition-colors"
              title="Zen Cinema Mode (Hides UI)"
              aria-label="Enter Zen cinema mode"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="bg-[#161a1e] hover:bg-[#1e242c] text-[#9cb0c2] hover:text-white border border-[#27323d] p-1.5 rounded-md transition-colors"
              title="Toggle Fullscreen (F)"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Lower Row: Sector Jump & Current Intensity Slider */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#1e2730]">
          {/* Sector Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#657687] text-[10px] font-mono uppercase font-bold">
              Jump Sector:
            </span>
            <button
              onClick={() => onJumpSector('micro_pcb')}
              className="text-[#9cb0c2] hover:text-white hover:bg-[#1c242c] px-2 py-0.5 rounded text-[10px] font-mono border border-transparent hover:border-[#2b3744] flex items-center gap-1 transition-colors"
              aria-label="Jump to Micro PCB Sector"
            >
              <Cpu className="w-3 h-3 text-[#ff7700]" />
              01 Micro PCB
            </button>
            <button
              onClick={() => onJumpSector('industrial_fuses')}
              className="text-[#9cb0c2] hover:text-white hover:bg-[#1c242c] px-2 py-0.5 rounded text-[10px] font-mono border border-transparent hover:border-[#2b3744] flex items-center gap-1 transition-colors"
              aria-label="Jump to Industrial Fuses Sector"
            >
              <Zap className="w-3 h-3 text-[#ff5500]" />
              02 NH Fuses
            </button>
            <button
              onClick={() => onJumpSector('busbar_trench')}
              className="text-[#9cb0c2] hover:text-white hover:bg-[#1c242c] px-2 py-0.5 rounded text-[10px] font-mono border border-transparent hover:border-[#2b3744] flex items-center gap-1 transition-colors"
              aria-label="Jump to Busbar Trench Sector"
            >
              <Layers className="w-3 h-3 text-[#da7438]" />
              03 Busbars
            </button>
            <button
              onClick={() => onJumpSector('transformer_substation')}
              className="text-[#9cb0c2] hover:text-white hover:bg-[#1c242c] px-2 py-0.5 rounded text-[10px] font-mono border border-transparent hover:border-[#2b3744] flex items-center gap-1 transition-colors"
              aria-label="Jump to Transformer Substation Sector"
            >
              <Sparkles className="w-3 h-3 text-[#eb8248]" />
              04 Substation
            </button>
          </div>

          {/* Current Flow Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[#657687] text-[10px] font-mono uppercase font-bold">
              Current Flow:
            </span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={settings.currentIntensity}
              onChange={(e) => onUpdateSettings({ currentIntensity: parseFloat(e.target.value) })}
              className="w-24 accent-[#ff5500] cursor-pointer"
              aria-label="Adjust electrical current pulse intensity"
            />
            <span className="text-[#ff7700] text-[11px] font-mono font-bold w-9 tabular-nums">
              {settings.currentIntensity.toFixed(1)}x
            </span>
          </div>

          {/* Control hints */}
          <div className="text-[10px] text-[#556473] font-mono hidden md:block">
            WASD Move · Space Arc · H Hide UI · F Fullscreen
          </div>
        </div>
      </div>
    </div>
  );
};
