import * as THREE from 'three';

/**
 * Procedural PBR Material and Texture Library
 * Designed to embody the Fuseco industrial brand identity:
 * Deep charcoal/graphite, brushed copper, electro-galvanized metals,
 * pristine industrial ceramic, and restrained Fuseco safety orange accents.
 */

// Procedural Canvas Texture Generators (Zero external files / 404s)

export function createPCBTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep graphite/charcoal base with subtle dark PCB weave
  ctx.fillStyle = '#080b0d';
  ctx.fillRect(0, 0, 512, 512);

  // Microscopic weave pattern
  ctx.strokeStyle = '#0f1418';
  ctx.lineWidth = 1;
  for (let y = 0; y < 512; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  for (let x = 0; x < 512; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  // Silk-screen industrial grid & technical component bounding outlines
  ctx.strokeStyle = '#232f35';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, 192, 192);
  ctx.strokeRect(288, 32, 192, 96);
  ctx.strokeRect(288, 160, 192, 128);
  ctx.strokeRect(32, 288, 448, 192);

  // Copper / Gold solder via ring pads
  for (let x = 48; x < 500; x += 64) {
    for (let y = 48; y < 500; y += 64) {
      // Annular copper ring
      ctx.fillStyle = '#c77839';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();

      // Gold plating center
      ctx.fillStyle = '#e8b84d';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Drill via hole
      ctx.fillStyle = '#07090b';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Industrial nomenclature silk print in muted warm gray
  ctx.fillStyle = '#4a5b64';
  ctx.font = '10px monospace';
  ctx.fillText('FUSECO-PCB REV 4.2', 40, 50);
  ctx.fillText('HIGH VOLTAGE ISOLATION ZONE', 40, 310);
  ctx.fillText('IEC 60269-1 / DIN 43620', 296, 50);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createBrushedMetalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  // Fine linear brushing noise
  for (let y = 0; y < 256; y++) {
    const val = Math.floor(115 + Math.random() * 40);
    ctx.fillStyle = `rgb(${val},${val},${val})`;
    ctx.fillRect(0, y, 256, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createFuseLabelTexture(fuseType = 'NH00', rating = '160A 500V'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Off-white / cream ceramic label area
  ctx.fillStyle = '#e9ebeb';
  ctx.fillRect(0, 0, 512, 256);

  // Fuseco signature orange accent stripe
  ctx.fillStyle = '#ff5500';
  ctx.fillRect(0, 0, 16, 256);
  ctx.fillRect(20, 20, 140, 6);

  // Fuseco Brand text
  ctx.fillStyle = '#111417';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('FUSECO', 24, 60);

  ctx.fillStyle = '#ff5500';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('INDUSTRIAL PROTECTION', 24, 82);

  // Technical Ratings
  ctx.fillStyle = '#1a1f24';
  ctx.font = 'bold 42px monospace';
  ctx.fillText(`${fuseType}  ${rating}`, 24, 145);

  ctx.fillStyle = '#444d56';
  ctx.font = '20px monospace';
  ctx.fillText('120kA  ~500V  gG / gL', 24, 185);
  ctx.fillText('IEC 60269-2  DIN 43620  CE', 24, 222);

  // QR / Barcode decorative motif
  ctx.fillStyle = '#111417';
  for (let i = 0; i < 28; i++) {
    const w = (i % 3 === 0) ? 5 : 2;
    ctx.fillRect(400 + i * 3.5, 50, w, 60);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createChipLabelTexture(chipTitle = 'FUSECO-DSP', spec = 'V92-800V'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark matte epoxy resin
  ctx.fillStyle = '#16191d';
  ctx.fillRect(0, 0, 256, 256);

  // Pin 1 circular alignment dimple
  ctx.fillStyle = '#0c0e10';
  ctx.beginPath();
  ctx.arc(28, 28, 8, 0, Math.PI * 2);
  ctx.fill();

  // Laser etched off-white text
  ctx.fillStyle = '#6e7a85';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(chipTitle, 128, 110);

  ctx.fillStyle = '#525d66';
  ctx.font = '16px monospace';
  ctx.fillText(spec, 128, 145);
  ctx.fillText('ARM CORTEX-M7', 128, 175);
  ctx.fillText('FAB 42-AU', 128, 205);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Reusable Shared Materials

export class MaterialLibrary {
  public pcbTexture: THREE.CanvasTexture;
  public metalBumpTexture: THREE.CanvasTexture;
  public fuseLabelTexture: THREE.CanvasTexture;
  public chipLabelTexture: THREE.CanvasTexture;

  public pcbSubstrate: THREE.MeshStandardMaterial;
  public copperBrushed: THREE.MeshStandardMaterial;
  public copperPolished: THREE.MeshStandardMaterial;
  public brassContacts: THREE.MeshStandardMaterial;
  public galvanizedSteel: THREE.MeshStandardMaterial;
  public industrialCeramic: THREE.MeshPhysicalMaterial;
  public fusecoOrange: THREE.MeshStandardMaterial;
  public flowingPlasma: THREE.MeshStandardMaterial;
  public indicatorLedOrange: THREE.MeshStandardMaterial;
  public indicatorLedGreen: THREE.MeshStandardMaterial;
  public standoffRedInsulator: THREE.MeshStandardMaterial;
  public chipEpoxy: THREE.MeshStandardMaterial;
  public chipLabeled: THREE.MeshStandardMaterial;
  public capacitorCanAluminum: THREE.MeshStandardMaterial;
  public capacitorSleeveBlack: THREE.MeshStandardMaterial;
  public ferriteCore: THREE.MeshStandardMaterial;
  public solderSilver: THREE.MeshStandardMaterial;
  public sparkGlow: THREE.MeshBasicMaterial;

  constructor() {
    this.pcbTexture = createPCBTexture();
    this.metalBumpTexture = createBrushedMetalTexture();
    this.fuseLabelTexture = createFuseLabelTexture();
    this.chipLabelTexture = createChipLabelTexture();

    // Dark PCB Substrate with procedural traces & vias
    this.pcbSubstrate = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: this.pcbTexture,
      roughness: 0.8,
      metalness: 0.15,
      bumpMap: this.metalBumpTexture,
      bumpScale: 0.02,
    });

    // Heavy Industrial Copper (Electrolytic Tough Pitch)
    this.copperBrushed = new THREE.MeshStandardMaterial({
      color: 0xda7438,
      metalness: 0.94,
      roughness: 0.24,
      bumpMap: this.metalBumpTexture,
      bumpScale: 0.015,
    });

    this.copperPolished = new THREE.MeshStandardMaterial({
      color: 0xeb8248,
      metalness: 0.96,
      roughness: 0.14,
    });

    // Brass / Gold Contact Terminals
    this.brassContacts = new THREE.MeshStandardMaterial({
      color: 0xd9b34a,
      metalness: 0.95,
      roughness: 0.18,
    });

    // Galvanized Industrial Steel / DIN Rails
    this.galvanizedSteel = new THREE.MeshStandardMaterial({
      color: 0x939ba2,
      metalness: 0.88,
      roughness: 0.32,
    });

    // Technical Steatite / Porcelain High-Voltage Ceramic
    this.industrialCeramic = new THREE.MeshPhysicalMaterial({
      color: 0xeff1f2,
      metalness: 0.04,
      roughness: 0.28,
      clearcoat: 0.45,
      clearcoatRoughness: 0.15,
    });

    // Fuseco Signature Industrial Orange Accent
    this.fusecoOrange = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      metalness: 0.18,
      roughness: 0.38,
      emissive: 0x441400,
    });

    // Flowing Current Plasma (High emissive glow)
    this.flowingPlasma = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff5500,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.8,
    });

    // Micro Status LEDs
    this.indicatorLedOrange = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      emissive: 0xff4400,
      emissiveIntensity: 3.5,
      roughness: 0.2,
    });

    this.indicatorLedGreen = new THREE.MeshStandardMaterial({
      color: 0x00ff66,
      emissive: 0x00cc44,
      emissiveIntensity: 3.0,
      roughness: 0.2,
    });

    // High Voltage BMC / Standoff Insulator (Class F Phenolic Red)
    this.standoffRedInsulator = new THREE.MeshStandardMaterial({
      color: 0x8a2318,
      roughness: 0.48,
      metalness: 0.12,
    });

    // Microchip Mold Compound (Epoxy Resin)
    this.chipEpoxy = new THREE.MeshStandardMaterial({
      color: 0x181a1d,
      roughness: 0.65,
      metalness: 0.25,
    });

    this.chipLabeled = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: this.chipLabelTexture,
      roughness: 0.65,
      metalness: 0.25,
    });

    // Capacitor Aluminum Cans
    this.capacitorCanAluminum = new THREE.MeshStandardMaterial({
      color: 0xb5bcc2,
      metalness: 0.92,
      roughness: 0.22,
      bumpMap: this.metalBumpTexture,
      bumpScale: 0.01,
    });

    this.capacitorSleeveBlack = new THREE.MeshStandardMaterial({
      color: 0x16181b,
      roughness: 0.75,
      metalness: 0.1,
    });

    // Ferrite Toroid Core
    this.ferriteCore = new THREE.MeshStandardMaterial({
      color: 0x1d2024,
      roughness: 0.85,
      metalness: 0.3,
    });

    // Silver Tin Solder
    this.solderSilver = new THREE.MeshStandardMaterial({
      color: 0xd8dde2,
      metalness: 0.95,
      roughness: 0.15,
    });

    // Spark Glow Material
    this.sparkGlow = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.9,
    });
  }

  public dispose() {
    this.pcbTexture.dispose();
    this.metalBumpTexture.dispose();
    this.fuseLabelTexture.dispose();
    this.chipLabelTexture.dispose();

    this.pcbSubstrate.dispose();
    this.copperBrushed.dispose();
    this.copperPolished.dispose();
    this.brassContacts.dispose();
    this.galvanizedSteel.dispose();
    this.industrialCeramic.dispose();
    this.fusecoOrange.dispose();
    this.flowingPlasma.dispose();
    this.indicatorLedOrange.dispose();
    this.indicatorLedGreen.dispose();
    this.standoffRedInsulator.dispose();
    this.chipEpoxy.dispose();
    this.chipLabeled.dispose();
    this.capacitorCanAluminum.dispose();
    this.capacitorSleeveBlack.dispose();
    this.ferriteCore.dispose();
    this.solderSilver.dispose();
    this.sparkGlow.dispose();
  }
}
