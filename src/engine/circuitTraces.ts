import * as THREE from 'three';
import { MaterialLibrary } from './materials';

/**
 * Procedural Circuit Traces and Flowing Electrical Current Pulses
 * Renders glowing electrical energy traveling through copper pathways in Fuseco Orange.
 */

export interface TracePath {
  points: THREE.Vector3[];
  length: number;
}

export class CircuitTraceSystem {
  public group: THREE.Group;
  private traceLinesMesh: THREE.LineSegments | null = null;
  private pulsePointsMesh: THREE.Points | null = null;
  private pulsePositions: Float32Array;
  private pulseVelocities: Float32Array;
  private pulseAges: Float32Array;
  private pulseCount = 120;
  private paths: TracePath[] = [];

  constructor(materials: MaterialLibrary, zStart: number, zEnd: number, corridorWidth = 28.0) {
    this.group = new THREE.Group();
    this.group.name = `CircuitTraces_${zStart}_${zEnd}`;

    // Generate procedural circuit trace segments along floor and side walls
    const linePositions: number[] = [];
    const zStep = 10;
    const numSteps = Math.floor((zEnd - zStart) / zStep);

    // Continuous bus traces running along Z
    const traceXPositions = [
      -corridorWidth * 0.45,
      -corridorWidth * 0.3,
      -corridorWidth * 0.15,
      0,
      corridorWidth * 0.15,
      corridorWidth * 0.3,
      corridorWidth * 0.45,
    ];

    for (const x of traceXPositions) {
      // Main straight trunk
      linePositions.push(x, 0.05, zStart, x, 0.05, zEnd);

      // Angled branch connections (45-degree circuit board traces)
      for (let s = 0; s < numSteps; s++) {
        const z = zStart + s * zStep + (Math.sin(x * 10 + s) * 2);
        const branchLen = 3.5;
        const targetX = x + (Math.sin(s * 3) > 0 ? branchLen : -branchLen);
        const targetZ = z + branchLen;

        // Diagonal trace
        linePositions.push(x, 0.05, z, targetX, 0.05, targetZ);
        // Continuation segment
        linePositions.push(targetX, 0.05, targetZ, targetX, 0.05, targetZ + 4.0);

        // Store as a path for flowing pulse particles
        this.paths.push({
          points: [
            new THREE.Vector3(x, 0.08, z),
            new THREE.Vector3(targetX, 0.08, targetZ),
            new THREE.Vector3(targetX, 0.08, targetZ + 4.0),
          ],
          length: 4.0 + branchLen * 1.414,
        });
      }
    }

    // Static Copper Trace Geometry
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xda7338,
      linewidth: 2,
    });
    this.traceLinesMesh = new THREE.LineSegments(lineGeo, lineMat);
    this.group.add(this.traceLinesMesh);

    // Dynamic Flowing Current Particles (Orange Energy Pulses)
    this.pulsePositions = new Float32Array(this.pulseCount * 3);
    this.pulseVelocities = new Float32Array(this.pulseCount);
    this.pulseAges = new Float32Array(this.pulseCount);

    for (let i = 0; i < this.pulseCount; i++) {
      this.resetPulse(i, zStart, zEnd, corridorWidth);
    }

    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(this.pulsePositions, 3));

    // Custom Canvas Texture for luminous electric pulse dot
    const pulseTexture = this.createPulseTexture();
    const pulseMat = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.65,
      map: pulseTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pulsePointsMesh = new THREE.Points(pulseGeo, pulseMat);
    this.group.add(this.pulsePointsMesh);
  }

  private createPulseTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#ff7700');
    grad.addColorStop(0.7, '#ff3300');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private resetPulse(index: number, zStart: number, zEnd: number, corridorWidth: number) {
    const i3 = index * 3;
    const randX = (Math.random() - 0.5) * corridorWidth * 0.8;
    this.pulsePositions[i3] = randX;
    this.pulsePositions[i3 + 1] = 0.22;
    this.pulsePositions[i3 + 2] = zStart + Math.random() * (zEnd - zStart);

    this.pulseVelocities[index] = 18.0 + Math.random() * 16.0; // Travel speed forward along Z
    this.pulseAges[index] = Math.random();
  }

  public update(dt: number, zStart: number, zEnd: number, corridorWidth: number, currentMultiplier = 1.0) {
    if (!this.pulsePointsMesh) return;
    const posAttr = this.pulsePointsMesh.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < this.pulseCount; i++) {
      const i3 = i * 3;
      // Advance along Z
      this.pulsePositions[i3 + 2] += this.pulseVelocities[i] * dt * currentMultiplier;

      // Wrap around within chunk boundaries
      if (this.pulsePositions[i3 + 2] > zEnd) {
        this.pulsePositions[i3 + 2] = zStart;
        this.pulsePositions[i3] = (Math.random() - 0.5) * corridorWidth * 0.8;
      }
    }

    posAttr.needsUpdate = true;
  }

  public dispose() {
    if (this.traceLinesMesh) {
      this.traceLinesMesh.geometry.dispose();
      (this.traceLinesMesh.material as THREE.Material).dispose();
    }
    if (this.pulsePointsMesh) {
      this.pulsePointsMesh.geometry.dispose();
      (this.pulsePointsMesh.material as THREE.Material).dispose();
    }
  }
}
