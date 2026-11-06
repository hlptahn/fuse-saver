/**
 * Core mathematical and algorithmic rules for the procedural electrical world.
 * Pure logic decoupled from WebGL/DOM for deterministic testing.
 */

export interface ChunkBounds {
  index: number;
  zStart: number;
  zEnd: number;
  length: number;
  sectorType: SectorType;
}

export type SectorType = 'micro_pcb' | 'industrial_fuses' | 'busbar_trench' | 'transformer_substation';

export const SECTOR_TYPES: SectorType[] = [
  'micro_pcb',
  'industrial_fuses',
  'busbar_trench',
  'transformer_substation',
];

export const CHUNK_LENGTH = 120; // Units along Z axis per procedural chunk
export const ACTIVE_CHUNKS_AHEAD = 2; // Chunks kept ahead of the camera
export const ACTIVE_CHUNKS_BEHIND = 2; // Chunks kept behind before cleanup

/**
 * Calculates which chunk index a given Z position belongs to.
 */
export function getChunkIndexFromZ(z: number, chunkLength: number = CHUNK_LENGTH): number {
  return Math.floor(z / chunkLength);
}

/**
 * Calculates start and end Z positions for a chunk index.
 */
export function getChunkBounds(chunkIndex: number, chunkLength: number = CHUNK_LENGTH): ChunkBounds {
  const zStart = chunkIndex * chunkLength;
  const zEnd = (chunkIndex + 1) * chunkLength;
  const sectorIndex = Math.abs(chunkIndex) % SECTOR_TYPES.length;
  return {
    index: chunkIndex,
    zStart,
    zEnd,
    length: chunkLength,
    sectorType: SECTOR_TYPES[sectorIndex],
  };
}

/**
 * Determines which chunks need to be spawned or retained around a given Z position.
 */
export function getRequiredChunkIndices(
  currentZ: number,
  ahead: number = ACTIVE_CHUNKS_AHEAD,
  behind: number = ACTIVE_CHUNKS_BEHIND,
  chunkLength: number = CHUNK_LENGTH
): number[] {
  const currentIndex = getChunkIndexFromZ(currentZ, chunkLength);
  const start = currentIndex - behind;
  const end = currentIndex + ahead;
  const indices: number[] = [];
  for (let i = start; i <= end; i++) {
    indices.push(i);
  }
  return indices;
}

/**
 * Generates smooth 3D flight spline anchor points through a chunk.
 * Produces cinematic weaving: undulating Y height, banking X offsets, and occasional dramatic dives.
 */
export interface SplineWaypoint {
  x: number;
  y: number;
  z: number;
  roll: number; // camera bank angle in radians
  speedMultiplier: number;
  sector: SectorType;
}

export function generateChunkWaypoints(chunkIndex: number, chunkLength: number = CHUNK_LENGTH): SplineWaypoint[] {
  const bounds = getChunkBounds(chunkIndex, chunkLength);
  const waypoints: SplineWaypoint[] = [];
  const pointsPerChunk = 4;
  const step = chunkLength / pointsPerChunk;

  // Pseudo-random deterministic hash based on chunk index
  const hash = Math.sin(chunkIndex * 127.1 + 311.7) * 43758.5453123;
  const seed = hash - Math.floor(hash);

  for (let i = 0; i < pointsPerChunk; i++) {
    const localZ = i * step;
    const globalZ = bounds.zStart + localZ;
    const t = (chunkIndex + i / pointsPerChunk);

    let x = Math.sin(t * 0.9) * 12 + Math.cos(t * 1.7) * 5;
    let y = 6 + Math.sin(t * 0.6) * 4;
    let speed = 1.0;
    let roll = -Math.cos(t * 0.9) * 0.12;

    // Sector-specific altitude and flight choreography
    if (bounds.sectorType === 'micro_pcb') {
      // Skimming gracefully above the PCB surface among tall capacitors and microchips
      y = 4.8 + Math.sin(t * 1.2) * 2.0;
      x *= 0.65; // Balanced corridor
      speed = 0.95;
    } else if (bounds.sectorType === 'industrial_fuses') {
      // Majestic climbing and diving around colossal Fuseco high-voltage fuses
      y = 8.0 + Math.sin(t * 0.8) * 6.0;
      x = Math.sin(t * 0.7) * 16.0;
      roll = -Math.cos(t * 0.7) * 0.18;
      speed = 1.1;
    } else if (bounds.sectorType === 'busbar_trench') {
      // Racing inside a high-speed copper busbar trench
      y = 4.0 + Math.cos(t * 1.4) * 1.5;
      x = Math.sin(t * 0.5) * 6.0;
      speed = 1.25;
    } else if (bounds.sectorType === 'transformer_substation') {
      // Elevated overview passing over massive toroidal coils and switchgear
      y = 11.0 + Math.sin(t * 0.4) * 4.0;
      speed = 0.95;
    }

    waypoints.push({
      x,
      y,
      z: globalZ,
      roll,
      speedMultiplier: speed,
      sector: bounds.sectorType,
    });
  }

  return waypoints;
}

/**
 * Electrical telemetry simulation for the Fuseco industrial installation.
 */
export interface TelemetryState {
  voltage: number; // Volts RMS (e.g. 415V nominal 3-phase)
  current: number; // Amperes
  frequency: number; // Hertz (50.0 Hz nominal)
  powerFactor: number; // 0.92-0.98
  temperatureC: number; // Degrees Celsius
  activeFuses: number;
  totalFuses: number;
}

export function computeTelemetry(timeSec: number, currentMultiplier: number = 1.0): TelemetryState {
  const noise1 = Math.sin(timeSec * 2.3) * 1.8 + Math.cos(timeSec * 5.1) * 0.7;
  const noise2 = Math.cos(timeSec * 1.7) * 12.0 + Math.sin(timeSec * 4.2) * 6.5;

  const baseVoltage = 415.2; // Australian standard 3-phase industrial voltage
  const voltage = baseVoltage + noise1;

  const baseCurrent = 1180.0 * currentMultiplier;
  const current = Math.max(10, baseCurrent + noise2 * currentMultiplier);

  const frequency = 50.0 + Math.sin(timeSec * 0.8) * 0.04;
  const powerFactor = Math.min(0.99, 0.94 + Math.sin(timeSec * 0.5) * 0.03);
  const temperatureC = 42.5 + (currentMultiplier - 1.0) * 8.0 + Math.sin(timeSec * 0.2) * 1.5;

  return {
    voltage: Math.round(voltage * 10) / 10,
    current: Math.round(current),
    frequency: Math.round(frequency * 100) / 100,
    powerFactor: Math.round(powerFactor * 100) / 100,
    temperatureC: Math.round(temperatureC * 10) / 10,
    activeFuses: 84,
    totalFuses: 84,
  };
}
