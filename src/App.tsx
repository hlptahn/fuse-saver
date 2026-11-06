/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CanvasViewport } from './components/CanvasViewport';
import { BrandHeader } from './components/BrandHeader';
import { ControlDock } from './components/ControlDock';
import { ComponentInspectorModal } from './components/ComponentInspectorModal';
import { WorldManager } from './engine/worldManager';
import { proceduralAudio } from './audio/proceduralAudio';
import { computeTelemetry, getChunkBounds, getChunkIndexFromZ } from './engine/rules';
import { AppSettings, ComponentSpec, TelemetryState } from './types';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      speed: prefersReducedMotion ? 0.5 : 1.0,
      currentIntensity: 1.2,
      sparksEnabled: !prefersReducedMotion,
      audioMuted: true,
      audioVolume: 0.6,
      cameraMode: 'screensaver',
      zenMode: false,
      activeSector: 'micro_pcb',
    };
  });

  const [selectedComponent, setSelectedComponent] = useState<ComponentSpec | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryState>(() => computeTelemetry(0, 1.2));

  const worldManagerRef = useRef<WorldManager | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Sync Audio Engine with Settings
  useEffect(() => {
    proceduralAudio.setMuted(settings.audioMuted, settings.audioVolume);
  }, [settings.audioMuted, settings.audioVolume]);

  // Telemetry simulation loop (10Hz updates for gentle DOM changes)
  useEffect(() => {
    const timer = setInterval(() => {
      const nowSec = performance.now() * 0.001;
      const tele = computeTelemetry(nowSec, settings.currentIntensity);
      setTelemetry(tele);

      // Also detect current active sector from camera Z
      if (cameraRef.current) {
        const camZ = cameraRef.current.position.z;
        const chunkIdx = getChunkIndexFromZ(camZ);
        const bounds = getChunkBounds(chunkIdx);
        if (bounds.sectorType !== settings.activeSector) {
          setSettings((prev) => ({ ...prev, activeSector: bounds.sectorType }));
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [settings.currentIntensity, settings.activeSector]);

  const handleUpdateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleJumpSector = (sector: AppSettings['activeSector']) => {
    if (settings.cameraMode === 'inspect') {
      handleCloseInspector();
    }
    if (worldManagerRef.current) {
      worldManagerRef.current.jumpToSector(sector, cameraRef.current?.position.z);
      setSettings((prev) => ({
        ...prev,
        activeSector: sector,
        cameraMode: 'screensaver',
      }));
      setSelectedComponent(null);
    }
  };

  const handleTriggerSpark = () => {
    if (worldManagerRef.current && cameraRef.current) {
      worldManagerRef.current.triggerSparkAtCameraTarget(cameraRef.current);
    }
  };

  const handleInspectClosest = () => {
    if (!worldManagerRef.current || !cameraRef.current) return;
    const inspectables = worldManagerRef.current.getInspectableObjects();
    if (inspectables.length === 0) return;

    const camPos = cameraRef.current.position;
    let closestObj: THREE.Object3D | null = null;
    let closestDist = Infinity;

    for (const obj of inspectables) {
      const worldPos = new THREE.Vector3();
      obj.getWorldPosition(worldPos);
      const dist = camPos.distanceTo(worldPos);
      if (dist < closestDist) {
        closestDist = dist;
        closestObj = obj;
      }
    }

    if (closestObj && closestObj.userData && closestObj.userData.spec) {
      worldManagerRef.current.inspectedTarget = closestObj;
      setSelectedComponent(closestObj.userData.spec as ComponentSpec);
      setSettings((prev) => ({ ...prev, cameraMode: 'inspect' }));
      handleTriggerSpark();
    }
  };

  const handleCloseInspector = () => {
    if (settings.cameraMode !== 'inspect') return;
    setSelectedComponent(null);
    if (worldManagerRef.current && cameraRef.current) {
      worldManagerRef.current.inspectedTarget = null;
      worldManagerRef.current.startExitInspectTransition(cameraRef.current);
    }
    setSettings((prev) => ({ ...prev, cameraMode: 'screensaver' }));
  };

  return (
    <main
      className="relative w-full h-dvh overflow-hidden bg-[#0a0d10] text-slate-100 font-sans select-none"
      data-state={settings.cameraMode}
    >
      {/* 3D WebGL Canvas Layer */}
      <CanvasViewport
        settings={settings}
        onSelectComponent={setSelectedComponent}
        onCloseInspector={handleCloseInspector}
        onUpdateSettings={handleUpdateSettings}
        worldManagerRef={worldManagerRef}
        cameraRef={cameraRef}
      />

      {/* Top Brand & Industrial Telemetry HUD */}
      <BrandHeader
        telemetry={telemetry}
        activeSector={settings.activeSector}
        zenMode={settings.zenMode}
      />

      {/* Floating Collapsible Bottom Control Dock */}
      <ControlDock
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onJumpSector={handleJumpSector}
        onTriggerSpark={handleTriggerSpark}
        onInspectClosest={handleInspectClosest}
      />

      {/* Electrical Component Technical Datasheet Modal */}
      <ComponentInspectorModal
        spec={selectedComponent}
        onClose={handleCloseInspector}
        onTriggerSpark={handleTriggerSpark}
      />
    </main>
  );
}
