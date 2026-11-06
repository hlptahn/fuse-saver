import React from 'react';
import { ComponentSpec } from '../types';
import { Shield, Zap, BookOpen, X, Sparkles } from 'lucide-react';

interface ComponentInspectorModalProps {
  spec: ComponentSpec | null;
  onClose: () => void;
  onTriggerSpark: () => void;
}

export const ComponentInspectorModal: React.FC<ComponentInspectorModalProps> = ({
  spec,
  onClose,
  onTriggerSpark,
}) => {
  if (!spec) return null;

  return (
    <div
      className="fixed bottom-24 right-4 z-30 w-[92vw] max-w-[420px] bg-[#12161a] border border-[#ff5500]/40 rounded-xl p-4 shadow-2xl pointer-events-auto select-none"
      role="dialog"
      aria-label={`Component datasheet for ${spec.name}`}
    >
      {/* Header with Close */}
      <div className="flex items-start justify-between gap-3 border-b border-[#252f38] pb-2.5">
        <div>
          <span className="text-[10px] font-mono text-[#ff7700] uppercase font-bold tracking-wider block">
            {spec.category}
          </span>
          <h2 className="text-sm font-bold text-white font-mono leading-snug">
            {spec.name}
          </h2>
          <span className="text-[11px] text-[#718292] font-mono">
            P/N: {spec.partNumber}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[#718292] hover:text-white p-1 rounded-md hover:bg-[#1f262f] transition-colors"
          aria-label="Close component inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Engineering Specs Grid */}
      <div className="grid grid-cols-2 gap-2 my-3">
        <div className="bg-[#0b0e11] border border-[#1e2730] p-2 rounded">
          <span className="text-[9px] font-mono text-[#5b6b7a] uppercase block">Voltage Rating</span>
          <span className="text-xs font-mono font-bold text-white">{spec.voltageRating}</span>
        </div>
        <div className="bg-[#0b0e11] border border-[#1e2730] p-2 rounded">
          <span className="text-[9px] font-mono text-[#5b6b7a] uppercase block">Current Rating</span>
          <span className="text-xs font-mono font-bold text-[#ff7700]">{spec.currentRating}</span>
        </div>
        <div className="bg-[#0b0e11] border border-[#1e2730] p-2 rounded">
          <span className="text-[9px] font-mono text-[#5b6b7a] uppercase block">Rupturing Capacity</span>
          <span className="text-xs font-mono font-bold text-[#00cc66]">{spec.rupturingCapacity}</span>
        </div>
        <div className="bg-[#0b0e11] border border-[#1e2730] p-2 rounded">
          <span className="text-[9px] font-mono text-[#5b6b7a] uppercase block">Standards</span>
          <span className="text-xs font-mono font-bold text-white truncate block">{spec.standard}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-[#8e9fae] leading-relaxed mb-2 font-sans">
        {spec.description}
      </p>

      {/* Application Note */}
      <div className="bg-[#181d22] border-l-2 border-[#ff5500] px-2.5 py-1.5 rounded-r mb-3 text-[10px] text-[#9fb0bf] font-mono">
        <strong className="text-white block">Application:</strong>
        {spec.application}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#252f38]">
        <button
          onClick={onTriggerSpark}
          className="flex-1 bg-[#241a14] hover:bg-[#382619] text-[#ff7722] hover:text-[#ffa044] border border-[#ff5500]/50 py-1.5 px-3 rounded font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
          aria-label="Test arc discharge on inspected component"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#ff5500]" />
          Test Arc Discharge
        </button>

        <button
          onClick={onClose}
          className="bg-[#181d22] hover:bg-[#222a32] text-white py-1.5 px-3 rounded font-mono text-xs transition-colors"
          aria-label="Resume screensaver flight"
        >
          Resume Flight
        </button>
      </div>

      {/* Footer Disclaimer */}
      <p className="text-[10px] text-[#5b6b7a] font-mono text-center mt-2.5">
        Illustrative values, not official Fuseco product data.
      </p>
    </div>
  );
};
