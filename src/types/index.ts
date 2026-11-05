import { SectorType, TelemetryState } from '../engine/rules';

export type CameraMode = 'screensaver' | 'manual' | 'inspect';

export interface ComponentSpec {
  id: string;
  name: string;
  category: string;
  partNumber: string;
  voltageRating: string;
  currentRating: string;
  rupturingCapacity: string;
  standard: string;
  description: string;
  application: string;
  accentColor: string;
}

export interface AppSettings {
  speed: number; // 0.25x to 4x (1.0 default)
  currentIntensity: number; // 0.5 to 2.5
  sparksEnabled: boolean;
  audioMuted: boolean;
  audioVolume: number; // 0 to 1
  cameraMode: CameraMode;
  zenMode: boolean; // Cinema mode: hides UI
  activeSector: SectorType;
}

export type { SectorType, TelemetryState };
