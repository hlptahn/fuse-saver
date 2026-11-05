import React from 'react';
import { TelemetryState, SectorType } from '../types';
import { Activity, Zap, ShieldCheck, Thermometer, Radio } from 'lucide-react';

interface BrandHeaderProps {
  telemetry: TelemetryState;
  activeSector: SectorType;
  zenMode: boolean;
}

const SECTOR_LABELS: Record<SectorType, string> = {
  micro_pcb: 'SECTOR 01 // MICRO-PCB SILICON MATRIX',
  industrial_fuses: 'SECTOR 02 // HIGH-VOLTAGE NH FUSE INSTALLATION',
  busbar_trench: 'SECTOR 03 // 3-PHASE COPPER BUSBAR TRENCH',
  transformer_substation: 'SECTOR 04 // TOROIDAL TRANSFORMER & FILTER BAY',
};

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  telemetry,
  activeSector,
  zenMode,
}) => {
  if (zenMode) return null;

  return (
    <header
      className="absolute top-4 left-4 z-20 pointer-events-none select-none max-w-xl transition-opacity duration-300"
      aria-label="Fuseco telemetry and brand information"
    >
      {/* Brand Title Lockup */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-[#ff5500] flex items-center justify-center shadow-lg shadow-[#ff5500]/20 pointer-events-auto">
          <Zap className="w-6 h-6 text-black fill-black" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-wider text-white font-mono uppercase">
              FUSECO
            </h1>
            <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded bg-[#1e2329] text-[#ff7700] border border-[#ff5500]/30 font-semibold">
              ELECTRO-DYNAMICS
            </span>
          </div>
          <p className="text-xs text-[#8a99a8] tracking-wider uppercase font-mono">
            {SECTOR_LABELS[activeSector]}
          </p>
        </div>
      </div>

      {/* Industrial Real-Time Electrical Telemetry Readouts */}
      <div className="mt-3.5 flex flex-wrap gap-2 pointer-events-auto">
        <div className="bg-[#12161a] border border-[#262f38] px-2.5 py-1.5 rounded flex items-center gap-2 shadow-md">
          <Activity className="w-3.5 h-3.5 text-[#ff5500]" />
          <div className="text-[11px] font-mono">
            <span className="text-[#6c7d8f] block leading-none text-[9px] uppercase">Voltage 3-Phase</span>
            <span className="text-white font-bold tabular-nums">{telemetry.voltage.toFixed(1)} V</span>
          </div>
        </div>

        <div className="bg-[#12161a] border border-[#262f38] px-2.5 py-1.5 rounded flex items-center gap-2 shadow-md">
          <Zap className="w-3.5 h-3.5 text-[#ff8800]" />
          <div className="text-[11px] font-mono">
            <span className="text-[#6c7d8f] block leading-none text-[9px] uppercase">Current Load</span>
            <span className="text-white font-bold tabular-nums">{telemetry.current.toLocaleString()} A</span>
          </div>
        </div>

        <div className="bg-[#12161a] border border-[#262f38] px-2.5 py-1.5 rounded flex items-center gap-2 shadow-md">
          <Radio className="w-3.5 h-3.5 text-[#00cc66]" />
          <div className="text-[11px] font-mono">
            <span className="text-[#6c7d8f] block leading-none text-[9px] uppercase">Frequency</span>
            <span className="text-white font-bold tabular-nums">{telemetry.frequency.toFixed(2)} Hz</span>
          </div>
        </div>

        <div className="bg-[#12161a] border border-[#262f38] px-2.5 py-1.5 rounded flex items-center gap-2 shadow-md">
          <Thermometer className="w-3.5 h-3.5 text-[#ffaa33]" />
          <div className="text-[11px] font-mono">
            <span className="text-[#6c7d8f] block leading-none text-[9px] uppercase">Thermal</span>
            <span className="text-white font-bold tabular-nums">{telemetry.temperatureC}°C</span>
          </div>
        </div>

        <div className="bg-[#12161a] border border-[#262f38] px-2.5 py-1.5 rounded flex items-center gap-2 shadow-md">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00dd77]" />
          <div className="text-[11px] font-mono">
            <span className="text-[#6c7d8f] block leading-none text-[9px] uppercase">Protection</span>
            <span className="text-[#00dd77] font-bold">120kA HRC OK</span>
          </div>
        </div>
      </div>
    </header>
  );
};
