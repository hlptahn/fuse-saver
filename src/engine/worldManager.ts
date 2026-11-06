import * as THREE from 'three';
import { MaterialLibrary } from './materials';
import {
  createNHBladeFuse,
  createCylindricalCartridgeFuse,
  createIndustrialBusbarAssembly,
  createMicrochipQFP,
  createToroidalTransformer,
  createCapacitorBank,
  createTerminalBlockStrip,
} from './proceduralModels';
import { CircuitTraceSystem } from './circuitTraces';
import { SparkSystem } from './sparkSystem';
import {
  CHUNK_LENGTH,
  ACTIVE_CHUNKS_AHEAD,
  ACTIVE_CHUNKS_BEHIND,
  getChunkBounds,
  getRequiredChunkIndices,
  generateChunkWaypoints,
  SplineWaypoint,
  SectorType,
  smoothstep,
} from './rules';
import { CameraMode, ComponentSpec } from '../types';

interface ProceduralChunk {
  index: number;
  zStart: number;
  zEnd: number;
  sectorType: SectorType;
  group: THREE.Group;
  traceSystem: CircuitTraceSystem;
  inspectableObjects: THREE.Object3D[];
  sparkOrigins: THREE.Vector3[];
}

export class WorldManager {
  public scene: THREE.Scene;
  public materials: MaterialLibrary;
  public sparkSystem: SparkSystem;
  private chunks: Map<number, ProceduralChunk> = new Map();
  private waypoints: SplineWaypoint[] = [];
  private flightSpline: THREE.CatmullRomCurve3 | null = null;
  private corridorWidth = 32.0;

  // Camera flight parameters
  public travelDistance = 0;
  private baseSpeed = 16.0; // units per second
  private currentBankAngle = 0;
  private targetBankAngle = 0;
  private exitInspectTimer = 0;
  private readonly exitInspectDuration = 0.6;
  private exitInspectStartPos = new THREE.Vector3();
  private exitInspectStartQuat = new THREE.Quaternion();
  private targetCameraHelper = new THREE.PerspectiveCamera();

  // Manual camera state
  public manualPos = new THREE.Vector3(0, 5, 0);
  public manualRot = new THREE.Euler(0, 0, 0, 'YXZ');
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private moveUp = false;
  private moveDown = false;

  // Inspect state
  public inspectedTarget: THREE.Object3D | null = null;
  private inspectAngle = 0;
  private inspectDistance = 8.0;

  public syncCameraToManual(camera: THREE.PerspectiveCamera) {
    this.manualPos.copy(camera.position);
    this.manualRot.setFromQuaternion(camera.quaternion, 'YXZ');
  }

  public syncManualToScreensaver(camera: THREE.PerspectiveCamera) {
    this.travelDistance = camera.position.z;
  }

  public startExitInspectTransition(camera: THREE.PerspectiveCamera) {
    this.exitInspectTimer = this.exitInspectDuration;
    this.exitInspectStartPos.copy(camera.position);
    this.exitInspectStartQuat.copy(camera.quaternion);
    this.inspectedTarget = null;
  }

  public resetExitInspectTransition() {
    this.exitInspectTimer = 0;
  }

  private getTForZ(targetZ: number): number {
    if (!this.flightSpline || this.waypoints.length < 4) return 0.5;
    const minZ = this.waypoints[0].z;
    const maxZ = this.waypoints[this.waypoints.length - 1].z;
    if (targetZ <= minZ) return 0.001;
    if (targetZ >= maxZ) return 0.998;

    let low = 0.0;
    let high = 1.0;
    for (let iter = 0; iter < 14; iter++) {
      const mid = (low + high) * 0.5;
      const ptZ = this.flightSpline.getPointAt(mid).z;
      if (ptZ < targetZ) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return Math.max(0.001, Math.min(0.998, (low + high) * 0.5));
  }

  constructor(scene: THREE.Scene, materials: MaterialLibrary) {
    this.scene = scene;
    this.materials = materials;
    this.sparkSystem = new SparkSystem();
    this.scene.add(this.sparkSystem.group);

    // Initial world bootstrap
    this.updateChunks(0);
  }

  public updateChunks(currentZ: number) {
    const requiredIndices = getRequiredChunkIndices(
      currentZ,
      ACTIVE_CHUNKS_AHEAD,
      ACTIVE_CHUNKS_BEHIND,
      CHUNK_LENGTH
    );

    // Remove expired chunks that are far behind
    for (const [index, chunk] of this.chunks.entries()) {
      if (!requiredIndices.includes(index)) {
        this.disposeChunk(chunk);
        this.chunks.delete(index);
      }
    }

    // Spawn newly required chunks
    let newChunksCreated = false;
    for (const index of requiredIndices) {
      if (!this.chunks.has(index)) {
        const chunk = this.createChunk(index);
        this.chunks.set(index, chunk);
        newChunksCreated = true;
      }
    }

    // Rebuild flight spline whenever chunks change
    if (newChunksCreated || !this.flightSpline) {
      this.rebuildFlightSpline();
    }
  }

  private createChunk(index: number): ProceduralChunk {
    const bounds = getChunkBounds(index, CHUNK_LENGTH);
    const chunkGroup = new THREE.Group();
    chunkGroup.name = `Chunk_${index}_${bounds.sectorType}`;
    const inspectables: THREE.Object3D[] = [];
    const sparkOrigins: THREE.Vector3[] = [];

    // 1. Procedural PCB / Industrial Floor Slab (Deep charcoal with dark green/black solder mask)
    const floorGeo = new THREE.PlaneGeometry(this.corridorWidth, bounds.length);
    const floorMesh = new THREE.Mesh(floorGeo, this.materials.pcbSubstrate);
    floorMesh.rotation.x = -Math.PI * 0.5;
    floorMesh.position.set(0, 0, bounds.zStart + bounds.length * 0.5);
    floorMesh.receiveShadow = true;
    chunkGroup.add(floorMesh);

    // 2. High-Voltage Structural Side Wall Bus-Ducts & Dark Graphite Enclosure
    const wallGeo = new THREE.BoxGeometry(0.8, 16.0, bounds.length);
    const leftWall = new THREE.Mesh(wallGeo, this.materials.chipEpoxy);
    leftWall.position.set(-this.corridorWidth * 0.5, 8.0, bounds.zStart + bounds.length * 0.5);
    chunkGroup.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, this.materials.chipEpoxy);
    rightWall.position.set(this.corridorWidth * 0.5, 8.0, bounds.zStart + bounds.length * 0.5);
    chunkGroup.add(rightWall);

    // Dark Perforated Cable Ladder Trays and Structural Ribs
    for (let z = bounds.zStart + 10; z < bounds.zEnd; z += 20) {
      // Overhead structural I-beam in dark galvanized steel
      const beamGeo = new THREE.BoxGeometry(this.corridorWidth + 1.6, 0.6, 0.8);
      const beam = new THREE.Mesh(beamGeo, this.materials.galvanizedSteel);
      beam.position.set(0, 15.5, z);
      chunkGroup.add(beam);

      // Vertical side wall rib columns
      const colGeo = new THREE.BoxGeometry(0.5, 16.0, 0.8);
      const colL = new THREE.Mesh(colGeo, this.materials.galvanizedSteel);
      colL.position.set(-this.corridorWidth * 0.5 + 0.4, 8.0, z);
      chunkGroup.add(colL);

      const colR = new THREE.Mesh(colGeo, this.materials.galvanizedSteel);
      colR.position.set(this.corridorWidth * 0.5 - 0.4, 8.0, z);
      chunkGroup.add(colR);

      // Warning indicator LED on pillar
      const ledGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const ledL = new THREE.Mesh(ledGeo, this.materials.indicatorLedOrange);
      ledL.position.set(-this.corridorWidth * 0.5 + 0.7, 5.0, z);
      chunkGroup.add(ledL);
    }

    // Heavy Copper Conduit Pipe running along upper right wall
    const pipeGeo = new THREE.CylinderGeometry(0.35, 0.35, bounds.length, 16);
    const pipeR = new THREE.Mesh(pipeGeo, this.materials.copperBrushed);
    pipeR.rotation.x = Math.PI * 0.5;
    pipeR.position.set(this.corridorWidth * 0.5 - 0.9, 11.0, bounds.zStart + bounds.length * 0.5);
    chunkGroup.add(pipeR);

    // Heavy Copper Conduit Pipe running along upper left wall
    const pipeL = new THREE.Mesh(pipeGeo, this.materials.copperBrushed);
    pipeL.rotation.x = Math.PI * 0.5;
    pipeL.position.set(-this.corridorWidth * 0.5 + 0.9, 11.0, bounds.zStart + bounds.length * 0.5);
    chunkGroup.add(pipeL);

    // Ceiling Dark Graphite Enclosure
    const ceilingGeo = new THREE.BoxGeometry(this.corridorWidth * 0.9, 0.4, bounds.length);
    const ceiling = new THREE.Mesh(ceilingGeo, this.materials.chipEpoxy);
    ceiling.position.set(0, 16.0, bounds.zStart + bounds.length * 0.5);
    chunkGroup.add(ceiling);

    // 3. Sector-Specific Electrical Hardware Installations
    if (bounds.sectorType === 'micro_pcb') {
      // Dense array of surface mount processors, SMD resistor banks, and indicator LEDs
      for (let z = bounds.zStart + 15; z < bounds.zEnd - 10; z += 24) {
        // Microchip QFP processor
        const chip = createMicrochipQFP(this.materials, 5.0, 16);
        chip.position.set((Math.sin(z * 1.5) > 0 ? 6 : -6), 0, z);
        chunkGroup.add(chip);
        inspectables.push(chip);

        // Cylindrical capacitor bank adjacent
        const cap = createCapacitorBank(this.materials, 1.2, 4.0);
        cap.position.set(chip.position.x > 0 ? -7 : 7, 0, z + 4);
        chunkGroup.add(cap);
        inspectables.push(cap);

        // Fuseco Cylindrical Industrial Fuse on the flank
        const cylFuse = createCylindricalCartridgeFuse(this.materials, 0.65, 4.2);
        cylFuse.position.set(chip.position.x > 0 ? -11 : 11, 0, z);
        chunkGroup.add(cylFuse);
        inspectables.push(cylFuse);
      }
    } else if (bounds.sectorType === 'industrial_fuses') {
      // Monumental High-Voltage Fuseco NH00 / NH3 Blade Fuses
      for (let z = bounds.zStart + 16; z < bounds.zEnd - 12; z += 30) {
        // Hero NH3 Heavy Industrial Fuse
        const nhFuse = createNHBladeFuse(this.materials, 1.8, '630A 500V', 'NH3');
        nhFuse.position.set((Math.sin(z) > 0 ? 5.5 : -5.5), 0, z);
        chunkGroup.add(nhFuse);
        inspectables.push(nhFuse);

        // Add spark burst position at the knife contact jaw
        sparkOrigins.push(new THREE.Vector3(nhFuse.position.x, 2.8, z));

        // Companion NH00 Fuses
        const nh00A = createNHBladeFuse(this.materials, 1.0, '160A 500V', 'NH00');
        nh00A.position.set(-nhFuse.position.x * 0.8, 0, z - 4);
        chunkGroup.add(nh00A);
        inspectables.push(nh00A);

        const nh00B = createNHBladeFuse(this.materials, 1.0, '100A 500V', 'NH00');
        nh00B.position.set(-nhFuse.position.x * 0.8, 0, z + 5);
        chunkGroup.add(nh00B);
        inspectables.push(nh00B);

        // DIN-Rail Terminal strip
        const term = createTerminalBlockStrip(this.materials, 10);
        term.position.set(0, 0, z + 12);
        chunkGroup.add(term);
        inspectables.push(term);
      }
    } else if (bounds.sectorType === 'busbar_trench') {
      // Continuous 3-Phase Copper Busbar Installation
      const busbars = createIndustrialBusbarAssembly(this.materials, bounds.length * 0.9, 3.2);
      busbars.position.set(0, 0, bounds.zStart + bounds.length * 0.5);
      chunkGroup.add(busbars);
      inspectables.push(busbars);

      sparkOrigins.push(
        new THREE.Vector3(-3.2, 2.4, bounds.zStart + 20),
        new THREE.Vector3(0, 2.4, bounds.zStart + bounds.length * 0.5),
        new THREE.Vector3(3.2, 2.4, bounds.zEnd - 20)
      );

      // Flanking protection fuses along the trench
      for (let z = bounds.zStart + 18; z < bounds.zEnd - 18; z += 35) {
        const cylFuseL = createCylindricalCartridgeFuse(this.materials, 0.8, 5.0);
        cylFuseL.position.set(-10.5, 0, z);
        chunkGroup.add(cylFuseL);
        inspectables.push(cylFuseL);

        const cylFuseR = createCylindricalCartridgeFuse(this.materials, 0.8, 5.0);
        cylFuseR.position.set(10.5, 0, z + 10);
        chunkGroup.add(cylFuseR);
        inspectables.push(cylFuseR);
      }
    } else if (bounds.sectorType === 'transformer_substation') {
      // Massive Toroidal Choke Coils, Filter Banks, and Heavy Capacitors
      for (let z = bounds.zStart + 20; z < bounds.zEnd - 15; z += 32) {
        const toroid = createToroidalTransformer(this.materials, 3.2, 1.0);
        toroid.position.set((Math.cos(z) > 0 ? 6.5 : -6.5), 0, z);
        chunkGroup.add(toroid);
        inspectables.push(toroid);

        sparkOrigins.push(new THREE.Vector3(toroid.position.x, 3.0, z));

        // High-voltage capacitor bank
        const cap = createCapacitorBank(this.materials, 1.6, 5.5);
        cap.position.set(-toroid.position.x * 0.8, 0, z + 5);
        chunkGroup.add(cap);
        inspectables.push(cap);

        // NH Fuse isolator
        const nhFuse = createNHBladeFuse(this.materials, 1.4, '400A 500V', 'NH2');
        nhFuse.position.set(0, 0, z - 8);
        chunkGroup.add(nhFuse);
        inspectables.push(nhFuse);
      }
    }

    // 4. Circuit Traces & Flowing Current Particles
    const traceSystem = new CircuitTraceSystem(
      this.materials,
      bounds.zStart,
      bounds.zEnd,
      this.corridorWidth
    );
    chunkGroup.add(traceSystem.group);

    this.scene.add(chunkGroup);

    return {
      index,
      zStart: bounds.zStart,
      zEnd: bounds.zEnd,
      sectorType: bounds.sectorType,
      group: chunkGroup,
      traceSystem,
      inspectableObjects: inspectables,
      sparkOrigins,
    };
  }

  private rebuildFlightSpline() {
    // Collect sorted chunk indices
    const sortedIndices = Array.from(this.chunks.keys()).sort((a, b) => a - b);
    this.waypoints = [];

    for (const idx of sortedIndices) {
      const wps = generateChunkWaypoints(idx, CHUNK_LENGTH);
      this.waypoints.push(...wps);
    }

    if (this.waypoints.length >= 4) {
      const pts = this.waypoints.map((w) => new THREE.Vector3(w.x, w.y, w.z));
      this.flightSpline = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    }
  }

  private disposeChunk(chunk: ProceduralChunk) {
    this.scene.remove(chunk.group);
    chunk.traceSystem.dispose();

    chunk.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        // Only dispose unique geometries, shared materials are managed in MaterialLibrary
        if (obj.geometry) {
          obj.geometry.dispose();
        }
      }
    });
  }

  /**
   * Main per-frame animation and simulation update
   */
  public update(
    dt: number,
    camera: THREE.PerspectiveCamera,
    cameraMode: CameraMode,
    speedMultiplier: number,
    currentMultiplier: number,
    sparksEnabled: boolean
  ) {
    // 1. Advance Endless Screensaver Flight
    if (cameraMode === 'screensaver') {
      const currentSpeed = this.baseSpeed * speedMultiplier;
      this.travelDistance += currentSpeed * dt;

      if (this.flightSpline && this.waypoints.length >= 4) {
        const t = this.getTForZ(this.travelDistance);
        const camPos = this.flightSpline.getPointAt(t);
        const lookAheadT = this.getTForZ(this.travelDistance + 12.0);
        const lookTarget = this.flightSpline.getPointAt(lookAheadT);

        // Add subtle dynamic flight roll banking
        const tangent = this.flightSpline.getTangentAt(t);
        this.targetBankAngle = -tangent.x * 0.45;
        this.currentBankAngle += (this.targetBankAngle - this.currentBankAngle) * Math.min(1, dt * 4.0);

        this.targetCameraHelper.position.copy(camPos);
        this.targetCameraHelper.lookAt(lookTarget);
        this.targetCameraHelper.rotation.z += this.currentBankAngle;

        if (this.exitInspectTimer > 0) {
          this.exitInspectTimer = Math.max(0, this.exitInspectTimer - dt);
          const progress = 1.0 - this.exitInspectTimer / this.exitInspectDuration;
          const w = smoothstep(0, 1, progress);

          camera.position.copy(this.exitInspectStartPos).lerp(camPos, w);
          camera.quaternion.copy(this.exitInspectStartQuat).slerp(this.targetCameraHelper.quaternion, w);

          if (this.exitInspectTimer <= 0) {
            camera.position.copy(camPos);
            camera.quaternion.copy(this.targetCameraHelper.quaternion);
          }
        } else {
          camera.position.copy(camPos);
          camera.quaternion.copy(this.targetCameraHelper.quaternion);
        }

        // Keep chunks active around current camera position
        this.updateChunks(camPos.z);
      }
    } else if (cameraMode === 'manual') {
      // Free flight probe
      const moveSpeed = 24.0 * speedMultiplier * dt;
      const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.manualRot);
      const right = new THREE.Vector3(1, 0, 0).applyEuler(this.manualRot);
      const up = new THREE.Vector3(0, 1, 0);

      if (this.moveForward) this.manualPos.addScaledVector(forward, moveSpeed);
      if (this.moveBackward) this.manualPos.addScaledVector(forward, -moveSpeed);
      if (this.moveRight) this.manualPos.addScaledVector(right, moveSpeed);
      if (this.moveLeft) this.manualPos.addScaledVector(right, -moveSpeed);
      if (this.moveUp) this.manualPos.addScaledVector(up, moveSpeed);
      if (this.moveDown) this.manualPos.addScaledVector(up, -moveSpeed);

      camera.position.copy(this.manualPos);
      camera.rotation.copy(this.manualRot);

      this.updateChunks(this.manualPos.z);
    } else if (cameraMode === 'inspect' && this.inspectedTarget) {
      // Smooth orbit around inspected hero subject centered on its bounding box
      this.inspectAngle += dt * 0.45;
      const box = new THREE.Box3().setFromObject(this.inspectedTarget);
      const targetPos = new THREE.Vector3();
      box.getCenter(targetPos);
      const size = new THREE.Vector3();
      box.getSize(size);

      const maxDim = Math.max(size.x, size.y, size.z, 2.5);
      const radius = maxDim * 1.5;
      const height = size.y * 0.35;

      const camX = targetPos.x + Math.sin(this.inspectAngle) * radius;
      const camZ = targetPos.z + Math.cos(this.inspectAngle) * radius;
      const camY = targetPos.y + height;

      camera.position.lerp(new THREE.Vector3(camX, camY, camZ), Math.min(1, dt * 5.0));
      camera.lookAt(targetPos);
    }

    // 2. Update Circuit Traces and Flowing Current in active chunks
    const sparkProbability = Math.min(1.0, 0.035 * 60 * dt * currentMultiplier);

    for (const chunk of this.chunks.values()) {
      chunk.traceSystem.update(dt, chunk.zStart, chunk.zEnd, this.corridorWidth, currentMultiplier);

      const chunkCenterZ = (chunk.zStart + chunk.zEnd) * 0.5;
      const distFromCam = Math.abs(chunkCenterZ - camera.position.z);

      // Only spawn spontaneous sparks in chunks within about 120 units of the camera on Z
      if (sparksEnabled && chunk.sparkOrigins.length > 0 && distFromCam <= 120) {
        if (Math.random() < sparkProbability) {
          const randOrigin = chunk.sparkOrigins[Math.floor(Math.random() * chunk.sparkOrigins.length)];
          const playAudio = distFromCam <= 60;
          this.sparkSystem.triggerBurst(randOrigin, 18, playAudio);
        }
      }
    }

    // 3. Update Spark Physics Particle System
    this.sparkSystem.update(dt);
  }

  public getInspectableObjects(): THREE.Object3D[] {
    const all: THREE.Object3D[] = [];
    for (const chunk of this.chunks.values()) {
      all.push(...chunk.inspectableObjects);
    }
    return all;
  }

  public triggerSparkAtCameraTarget(camera: THREE.PerspectiveCamera) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(this.getInspectableObjects(), true);

    if (intersects.length > 0) {
      this.sparkSystem.triggerBurst(intersects[0].point, 35, true);
    } else {
      const defaultPt = camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(8));
      this.sparkSystem.triggerBurst(defaultPt, 25, true);
    }
  }

  public jumpToSector(sector: SectorType, currentCameraZ?: number) {
    const refZ = currentCameraZ !== undefined ? currentCameraZ : this.travelDistance;
    let targetChunk: ProceduralChunk | null = null;
    for (const chunk of this.chunks.values()) {
      if (chunk.sectorType === sector && chunk.zStart >= refZ) {
        if (!targetChunk || chunk.zStart < targetChunk.zStart) {
          targetChunk = chunk;
        }
      }
    }

    if (!targetChunk) {
      const currentIdx = Math.floor(refZ / CHUNK_LENGTH);
      for (let i = 1; i <= 8; i++) {
        const futureIdx = currentIdx + i;
        const bounds = getChunkBounds(futureIdx, CHUNK_LENGTH);
        if (bounds.sectorType === sector) {
          const destZ = bounds.zStart + 10;
          this.travelDistance = destZ;
          this.manualPos.set(0, 5, destZ);
          this.updateChunks(destZ);
          return;
        }
      }
    } else {
      const destZ = targetChunk.zStart + 10;
      this.travelDistance = destZ;
      this.manualPos.set(0, 5, destZ);
      this.updateChunks(destZ);
    }
  }

  public setManualControl(action: 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down', active: boolean) {
    if (action === 'forward') this.moveForward = active;
    if (action === 'backward') this.moveBackward = active;
    if (action === 'left') this.moveLeft = active;
    if (action === 'right') this.moveRight = active;
    if (action === 'up') this.moveUp = active;
    if (action === 'down') this.moveDown = active;
  }

  public dispose() {
    for (const chunk of this.chunks.values()) {
      this.disposeChunk(chunk);
    }
    this.chunks.clear();
    this.sparkSystem.dispose();
  }
}
