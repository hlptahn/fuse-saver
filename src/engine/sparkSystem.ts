import * as THREE from 'three';
import { proceduralAudio } from '../audio/proceduralAudio';

/**
 * Electrical Spark Particle System
 * Emits dynamic physical spark arcs and glowing embers at high-voltage contacts and busbars.
 */

interface Spark {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

export class SparkSystem {
  public group: THREE.Group;
  private sparks: Spark[] = [];
  private maxSparks = 200;
  private positions: Float32Array;
  private colors: Float32Array;
  private particleGeo: THREE.BufferGeometry;
  private particleMat: THREE.PointsMaterial;
  private sparkTexture: THREE.CanvasTexture;
  private pointsMesh: THREE.Points;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SparkSystem';

    this.positions = new Float32Array(this.maxSparks * 3);
    this.colors = new Float32Array(this.maxSparks * 3);

    // Initial hidden state
    for (let i = 0; i < this.maxSparks * 3; i++) {
      this.positions[i] = 0;
      this.colors[i] = 1;
    }

    this.particleGeo = new THREE.BufferGeometry();
    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.particleGeo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.sparkTexture = this.createSparkTexture();
    this.particleMat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      map: this.sparkTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pointsMesh = new THREE.Points(this.particleGeo, this.particleMat);
    this.pointsMesh.frustumCulled = false;
    this.group.add(this.pointsMesh);
  }

  private createSparkTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#ffee88');
    grad.addColorStop(0.5, '#ff6600');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    return new THREE.CanvasTexture(canvas);
  }

  public triggerBurst(origin: THREE.Vector3, count = 25, playAudio = true) {
    if (playAudio) {
      proceduralAudio.triggerSpark();
    }

    for (let i = 0; i < count; i++) {
      if (this.sparks.length >= this.maxSparks) {
        this.sparks.shift(); // Remove oldest
      }

      const speed = 4.0 + Math.random() * 9.0;
      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * Math.PI * 0.45; // upward cone

      const vx = Math.cos(angle) * Math.cos(elevation) * speed;
      const vy = Math.sin(elevation) * speed + 1.5;
      const vz = Math.sin(angle) * Math.cos(elevation) * speed;

      this.sparks.push({
        position: origin.clone(),
        velocity: new THREE.Vector3(vx, vy, vz),
        life: 0,
        maxLife: 0.4 + Math.random() * 0.5,
        size: 0.5 + Math.random() * 0.7,
      });
    }
  }

  public update(dt: number) {
    const gravity = -14.0;
    const posAttr = this.particleGeo.attributes.position as THREE.BufferAttribute;
    const colAttr = this.particleGeo.attributes.color as THREE.BufferAttribute;

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life += dt;
      if (s.life >= s.maxLife) {
        this.sparks.splice(i, 1);
        continue;
      }

      // Physics integration
      s.velocity.y += gravity * dt;
      s.position.x += s.velocity.x * dt;
      s.position.y += s.velocity.y * dt;
      s.position.z += s.velocity.z * dt;

      // Bounce off ground plane
      if (s.position.y < 0.1) {
        s.position.y = 0.1;
        s.velocity.y = -s.velocity.y * 0.35;
        s.velocity.x *= 0.6;
        s.velocity.z *= 0.6;
      }
    }

    // Update GPU buffers
    for (let i = 0; i < this.maxSparks; i++) {
      const i3 = i * 3;
      if (i < this.sparks.length) {
        const s = this.sparks[i];
        this.positions[i3] = s.position.x;
        this.positions[i3 + 1] = s.position.y;
        this.positions[i3 + 2] = s.position.z;

        const progress = s.life / s.maxLife;
        const fade = 1.0 - progress;

        // Color shifts from white-hot to vibrant Fuseco orange
        this.colors[i3] = 1.0 * fade;
        this.colors[i3 + 1] = (0.4 + 0.6 * (1.0 - progress)) * fade;
        this.colors[i3 + 2] = 0.1 * fade;
      } else {
        // Move outside view
        this.positions[i3 + 1] = -999;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  public dispose() {
    this.particleGeo.dispose();
    this.particleMat.dispose();
    this.sparkTexture.dispose();
  }
}
