import * as THREE from 'three';
import { MaterialLibrary } from './materials';
import { ComponentSpec } from '../types';

/**
 * 3-12 Part Composite Procedural Industrial Electrical Models
 * Modeled to industrial engineering specifications with realistic PBR properties.
 */

// Shared Geometries to optimize draw calls and memory
const _boxGeo = new THREE.BoxGeometry(1, 1, 1);
const _cylGeo = new THREE.CylinderGeometry(1, 1, 1, 24);

/**
 * Fuseco NH00 / NH3 High-Rupturing-Capacity Blade Fuse with Base
 * 8-part composite assembly
 */
export function createNHBladeFuse(
  materials: MaterialLibrary,
  sizeScale = 1.0,
  rating = '160A 500V',
  fuseType = 'NH00'
): THREE.Group {
  const group = new THREE.Group();
  group.name = `NHFuse_${fuseType}_${rating}`;

  // 1. Ceramic body (Primary silhouette)
  const bodyWidth = 1.8 * sizeScale;
  const bodyHeight = 3.2 * sizeScale;
  const bodyDepth = 2.4 * sizeScale;
  const bodyGeo = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth);
  const bodyMesh = new THREE.Mesh(bodyGeo, materials.industrialCeramic);
  bodyMesh.position.y = bodyHeight * 0.5 + 0.8 * sizeScale;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Ceramic cooling ribs on sides (Accent)
  const ribGeo = new THREE.BoxGeometry(bodyWidth * 1.06, 0.2 * sizeScale, bodyDepth * 0.9);
  for (let r = -1; r <= 1; r++) {
    const ribMesh = new THREE.Mesh(ribGeo, materials.industrialCeramic);
    ribMesh.position.set(0, bodyMesh.position.y + r * 0.8 * sizeScale, 0);
    group.add(ribMesh);
  }

  // 3 & 4. Top & Bottom Heavy Copper Knife Contacts (Secondary)
  const bladeThickness = 0.22 * sizeScale;
  const bladeWidth = 0.9 * sizeScale;
  const bladeHeight = 1.6 * sizeScale;
  const bladeGeo = new THREE.BoxGeometry(bladeWidth, bladeHeight, bladeThickness);

  const topBlade = new THREE.Mesh(bladeGeo, materials.copperBrushed);
  topBlade.position.set(0, bodyMesh.position.y + bodyHeight * 0.5 + bladeHeight * 0.4, 0);
  topBlade.castShadow = true;
  group.add(topBlade);

  const bottomBlade = new THREE.Mesh(bladeGeo, materials.copperBrushed);
  bottomBlade.position.set(0, bodyMesh.position.y - bodyHeight * 0.5 - bladeHeight * 0.4, 0);
  bottomBlade.castShadow = true;
  group.add(bottomBlade);

  // 5. Machined Brass End Flange Plates (Secondary)
  const flangeGeo = new THREE.BoxGeometry(bodyWidth * 1.08, 0.25 * sizeScale, bodyDepth * 1.08);
  const topFlange = new THREE.Mesh(flangeGeo, materials.brassContacts);
  topFlange.position.set(0, bodyMesh.position.y + bodyHeight * 0.5 + 0.12 * sizeScale, 0);
  group.add(topFlange);

  const bottomFlange = new THREE.Mesh(flangeGeo, materials.brassContacts);
  bottomFlange.position.set(0, bodyMesh.position.y - bodyHeight * 0.5 - 0.12 * sizeScale, 0);
  group.add(bottomFlange);

  // 6. Fuseco Orange Spring Trip Indicator (Accent detail)
  const tripGeo = new THREE.BoxGeometry(0.35 * sizeScale, 0.4 * sizeScale, 0.35 * sizeScale);
  const tripMesh = new THREE.Mesh(tripGeo, materials.fusecoOrange);
  tripMesh.position.set(0, topFlange.position.y + 0.25 * sizeScale, 0.6 * sizeScale);
  group.add(tripMesh);

  // 7. Fuseco Technical Label Plate
  const labelGeo = new THREE.PlaneGeometry(bodyWidth * 0.9, bodyHeight * 0.75);
  const labelMesh = new THREE.Mesh(labelGeo, materials.fuseLabelMaterial);
  labelMesh.position.set(0, bodyMesh.position.y, bodyDepth * 0.5 + 0.01);
  group.add(labelMesh);

  const labelBack = labelMesh.clone();
  labelBack.rotation.y = Math.PI;
  labelBack.position.set(0, bodyMesh.position.y, -bodyDepth * 0.5 - 0.01);
  group.add(labelBack);

  // 8. Industrial Base Mount & Spring Gripping Clamps
  const baseWidth = bodyWidth * 1.5;
  const baseLength = bodyDepth * 1.6;
  const baseHeight = 0.5 * sizeScale;
  const baseGeo = new THREE.BoxGeometry(baseWidth, baseHeight, baseLength);
  const baseMesh = new THREE.Mesh(baseGeo, materials.standoffRedInsulator);
  baseMesh.position.y = baseHeight * 0.5;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Contact Jaws
  const jawGeo = new THREE.BoxGeometry(0.6 * sizeScale, 0.8 * sizeScale, 0.35 * sizeScale);
  const jawTop = new THREE.Mesh(jawGeo, materials.solderSilver);
  jawTop.position.set(0, 0.7 * sizeScale, 0);
  group.add(jawTop);

  // Grounding Soft Contact Shadow
  const shadowGeo = new THREE.CircleGeometry(baseWidth * 1.1, 16);
  const shadowMesh = new THREE.Mesh(shadowGeo, materials.contactShadowMaterial);
  shadowMesh.rotation.x = -Math.PI * 0.5;
  shadowMesh.position.y = 0.02;
  group.add(shadowMesh);

  // Spec metadata for interactive inspector
  const spec: ComponentSpec = {
    id: `fuse-${Math.random().toString(36).substring(2, 7)}`,
    name: `Fuseco ${fuseType} HRC Industrial Fuse-Link`,
    category: 'High-Voltage Overcurrent Protection',
    partNumber: `FUS-${fuseType}-${rating.replace(' ', '-')}`,
    voltageRating: '500V AC / 250V DC',
    currentRating: rating,
    rupturingCapacity: '120kA Sym. RMS',
    standard: 'IEC 60269-2, DIN 43620, AS 60269',
    description: 'Ceramic bodied industrial blade fuse engineered for motor circuit and power distribution protection with non-deteriorating dual-element pure silver fuse element.',
    application: 'Main switchboards, transformer substations, industrial motor control centers.',
    accentColor: '#ff5500',
  };
  group.userData = { spec, isInspectable: true };

  return group;
}

/**
 * Cylindrical Industrial Cartridge Fuse (e.g. 14x51mm or 22x58mm)
 * 6-part assembly
 */
export function createCylindricalCartridgeFuse(
  materials: MaterialLibrary,
  radius = 0.6,
  length = 3.6
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'CylindricalCartridgeFuse';

  // 1. Ceramic cylinder body
  const bodyLen = length * 0.65;
  const bodyGeo = new THREE.CylinderGeometry(radius, radius, bodyLen, 24);
  const bodyMesh = new THREE.Mesh(bodyGeo, materials.industrialCeramic);
  bodyMesh.position.y = length * 0.5;
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // 2 & 3. Brass End Caps (Ferrules)
  const capLen = length * 0.2;
  const capGeo = new THREE.CylinderGeometry(radius * 1.04, radius * 1.04, capLen, 24);

  const topCap = new THREE.Mesh(capGeo, materials.brassContacts);
  topCap.position.y = length * 0.5 + bodyLen * 0.5 + capLen * 0.5;
  topCap.castShadow = true;
  group.add(topCap);

  const botCap = new THREE.Mesh(capGeo, materials.brassContacts);
  botCap.position.y = length * 0.5 - bodyLen * 0.5 - capLen * 0.5;
  botCap.castShadow = true;
  group.add(botCap);

  // 4. Red Striker Indicator Pin
  const strikerGeo = new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, 0.4, 12);
  const striker = new THREE.Mesh(strikerGeo, materials.fusecoOrange);
  striker.position.y = topCap.position.y + capLen * 0.5 + 0.15;
  group.add(striker);

  // 5. Rating Specification Metallic Band
  const bandGeo = new THREE.CylinderGeometry(radius * 1.01, radius * 1.01, bodyLen * 0.35, 24);
  const band = new THREE.Mesh(bandGeo, materials.cartridgeBandMaterial);
  band.position.y = bodyMesh.position.y;
  group.add(band);

  // 6. Base Fuse Holder Clip
  const clipGeo = new THREE.BoxGeometry(radius * 2.8, 0.4, radius * 3.2);
  const clipMesh = new THREE.Mesh(clipGeo, materials.chipEpoxy);
  clipMesh.position.y = 0.2;
  group.add(clipMesh);

  const spec: ComponentSpec = {
    id: `cyl-${Math.random().toString(36).substring(2, 7)}`,
    name: 'Fuseco 14x51mm Cylindrical Industrial Fuse',
    category: 'Supplementary Equipment Protection',
    partNumber: 'FUS-CYL-1451-50A',
    voltageRating: '690V AC',
    currentRating: '50A gG',
    rupturingCapacity: '80kA at 690V',
    standard: 'IEC 60269-1, NFC 63210',
    description: 'High-temperature cylindrical fuse-link featuring quartz sand arc-quenching matrix and silver-plated contact end-caps for high vibration environments.',
    application: 'Industrial control panels, surge arrestors, solar combiner boxes.',
    accentColor: '#d97438',
  };
  group.userData = { spec, isInspectable: true };

  return group;
}

/**
 * Heavy 3-Phase Industrial Busbar Assembly with Insulator Standoffs
 * 7-part composite installation
 */
export function createIndustrialBusbarAssembly(
  materials: MaterialLibrary,
  length = 24.0,
  spacing = 2.4
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'IndustrialBusbarAssembly';

  const barHeight = 0.5;
  const barThickness = 1.4;
  const barGeo = new THREE.BoxGeometry(barThickness, barHeight, length);

  // 3-Phase Busbars: L1, L2, L3
  const xOffsets = [-spacing, 0, spacing];
  const barMaterials = [materials.copperBrushed, materials.copperPolished, materials.copperBrushed];

  for (let phase = 0; phase < 3; phase++) {
    const bar = new THREE.Mesh(barGeo, barMaterials[phase]);
    bar.position.set(xOffsets[phase], 2.2, 0);
    bar.castShadow = true;
    group.add(bar);

    // Bolted Joint Connection Plates along the bar
    for (let z = -length * 0.4; z <= length * 0.4; z += 6.0) {
      const boltGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.25, 8);
      const bolt = new THREE.Mesh(boltGeo, materials.galvanizedSteel);
      bolt.position.set(xOffsets[phase], 2.2 + barHeight * 0.5 + 0.1, z);
      group.add(bolt);

      // Current monitoring clamp sensor
      if (phase === 1 && Math.abs(z) < 2.0) {
        const sensorGeo = new THREE.BoxGeometry(0.7, 0.7, 0.5);
        const sensor = new THREE.Mesh(sensorGeo, materials.fusecoOrange);
        sensor.position.set(xOffsets[phase], 2.2, z);
        group.add(sensor);
      }
    }
  }

  // Standoff Red Phenolic Insulators (Sturdy pillars under busbars)
  for (let z = -length * 0.35; z <= length * 0.35; z += 7.0) {
    // Crossbeam beam support
    const beamGeo = new THREE.BoxGeometry(spacing * 2.8, 0.4, 0.8);
    const beam = new THREE.Mesh(beamGeo, materials.galvanizedSteel);
    beam.position.set(0, 0.6, z);
    group.add(beam);

    for (let phase = 0; phase < 3; phase++) {
      // Stepped ceramic/phenolic insulator
      const insGeo = new THREE.CylinderGeometry(0.45, 0.55, 1.3, 16);
      const ins = new THREE.Mesh(insGeo, materials.standoffRedInsulator);
      ins.position.set(xOffsets[phase], 1.4, z);
      ins.castShadow = true;
      group.add(ins);

      // Steel mounting flange
      const flangeGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.15, 16);
      const flange = new THREE.Mesh(flangeGeo, materials.galvanizedSteel);
      flange.position.set(xOffsets[phase], 0.75, z);
      group.add(flange);
    }
  }

  const spec: ComponentSpec = {
    id: `bus-${Math.random().toString(36).substring(2, 7)}`,
    name: 'Fuseco High-Current Copper Busbar Trench',
    category: 'Heavy Power Distribution Grid',
    partNumber: 'BUS-CU-1600A-3P',
    voltageRating: '1000V AC / 1500V DC',
    currentRating: '1,600A Continuous',
    rupturingCapacity: '65kA 1-Second Withstand',
    standard: 'AS/NZS 3439, IEC 61439-1',
    description: 'Electrolytic Tough Pitch (Cu-ETP 99.9% purity) solid copper busbars with flame-retardant fiberglass-reinforced polyester standoff insulators.',
    application: 'Main distribution boards, heavy industrial manufacturing, data center switchgear.',
    accentColor: '#da7438',
  };
  group.userData = { spec, isInspectable: true };

  return group;
}

/**
 * Surface-Mount Microchip IC / QFP Package
 * 6-part assembly
 */
export function createMicrochipQFP(
  materials: MaterialLibrary,
  size = 4.0,
  pinsPerSide = 12
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'MicrochipQFP';

  const bodyHeight = 0.6;
  // 1. Molded Epoxy Package
  const bodyGeo = new THREE.BoxGeometry(size, bodyHeight, size);
  const bodyMesh = new THREE.Mesh(bodyGeo, materials.chipEpoxy);
  bodyMesh.position.y = bodyHeight * 0.5 + 0.15;
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // 2. Center laser-etched spec badge / heat spreader
  const slugSize = size * 0.7;
  const slugGeo = new THREE.PlaneGeometry(slugSize, slugSize);
  const slug = new THREE.Mesh(slugGeo, materials.chipLabelMaterial);
  slug.rotation.x = -Math.PI * 0.5;
  slug.position.set(0, bodyHeight + 0.16, 0);
  group.add(slug);

  // 3. Gull-wing silver pin array around all 4 perimeter edges
  const pinWidth = (size / pinsPerSide) * 0.5;
  const pinLen = 0.5;
  const pinGeo = new THREE.BoxGeometry(pinWidth, 0.08, pinLen);

  for (let side = 0; side < 4; side++) {
    const angle = (side * Math.PI) / 2;
    for (let p = 0; p < pinsPerSide; p++) {
      const pinOffset = (p - (pinsPerSide - 1) / 2) * (size / pinsPerSide);
      const pin = new THREE.Mesh(pinGeo, materials.solderSilver);

      if (side === 0) pin.position.set(pinOffset, 0.1, size * 0.5 + pinLen * 0.4);
      if (side === 1) pin.position.set(size * 0.5 + pinLen * 0.4, 0.1, pinOffset);
      if (side === 2) pin.position.set(pinOffset, 0.1, -size * 0.5 - pinLen * 0.4);
      if (side === 3) pin.position.set(-size * 0.5 - pinLen * 0.4, 0.1, pinOffset);

      if (side % 2 !== 0) pin.rotation.y = Math.PI * 0.5;
      group.add(pin);
    }
  }

  // 4. Status Indicator LED next to chip
  const ledGeo = new THREE.BoxGeometry(0.35, 0.25, 0.35);
  const led = new THREE.Mesh(ledGeo, materials.indicatorLedOrange);
  led.position.set(size * 0.5 + 1.2, 0.15, size * 0.5 + 0.8);
  group.add(led);

  // 5. Soft Contact Shadow
  const shadowGeo = new THREE.PlaneGeometry(size * 1.5, size * 1.5);
  const shadow = new THREE.Mesh(shadowGeo, materials.contactShadowMaterial);
  shadow.rotation.x = -Math.PI * 0.5;
  shadow.position.y = 0.02;
  group.add(shadow);

  const spec: ComponentSpec = {
    id: `chip-${Math.random().toString(36).substring(2, 7)}`,
    name: 'Fuseco Power Protection Controller ASIC',
    category: 'Digital Signal & Arc Fault Monitoring',
    partNumber: 'FUS-DSP-ARM7-64QFP',
    voltageRating: '3.3V Logic / 800V Isolated',
    currentRating: '85mA Operating',
    rupturingCapacity: 'N/A (Logic Controller)',
    standard: 'AEC-Q100 Grade 1, RoHS',
    description: 'Ultra-low latency microsecond digital signal processor executing continuous fast Fourier transform (FFT) harmonic analysis to detect series and parallel arc faults.',
    application: 'Intelligent switchboards, renewable energy solar inverters, smart grid telemetry.',
    accentColor: '#ff5500',
  };
  group.userData = { spec, isInspectable: true };

  return group;
}

/**
 * Toroidal Power Inductor / Choke Transformer
 * 5-part assembly
 */
export function createToroidalTransformer(
  materials: MaterialLibrary,
  outerRadius = 2.4,
  tubeRadius = 0.75
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ToroidalTransformer';

  // 1. Dark Ferrite Ring Core
  const coreGeo = new THREE.TorusGeometry(outerRadius, tubeRadius, 20, 48);
  const coreMesh = new THREE.Mesh(coreGeo, materials.ferriteCore);
  coreMesh.rotation.x = Math.PI * 0.5;
  coreMesh.position.y = tubeRadius + 0.3;
  coreMesh.castShadow = true;
  group.add(coreMesh);

  // 2. Wound Enamelled Copper Wire Turns
  const turnsCount = 28;
  const turnTubeRadius = tubeRadius * 1.08;
  for (let i = 0; i < turnsCount; i++) {
    const angle = (i / turnsCount) * Math.PI * 2;
    const wireGeo = new THREE.TorusGeometry(tubeRadius * 1.05, 0.08, 8, 16);
    const wire = new THREE.Mesh(wireGeo, materials.copperPolished);
    wire.position.set(
      Math.cos(angle) * outerRadius,
      coreMesh.position.y,
      Math.sin(angle) * outerRadius
    );
    wire.rotation.y = angle;
    group.add(wire);
  }

  // 3. Heavy Mounting Plate
  const mountGeo = new THREE.BoxGeometry(outerRadius * 2.5, 0.3, outerRadius * 2.5);
  const mount = new THREE.Mesh(mountGeo, materials.standoffRedInsulator);
  mount.position.y = 0.15;
  mount.receiveShadow = true;
  group.add(mount);

  // 4. Brass Terminal Lugs
  for (let l = -1; l <= 1; l += 2) {
    const lugGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 12);
    const lug = new THREE.Mesh(lugGeo, materials.brassContacts);
    lug.position.set(l * (outerRadius + 0.8), 0.5, 0);
    group.add(lug);
  }

  const spec: ComponentSpec = {
    id: `toroid-${Math.random().toString(36).substring(2, 7)}`,
    name: 'Fuseco 3-Phase Common Mode Toroidal Choke',
    category: 'Harmonic & EMI Suppression Filter',
    partNumber: 'FUS-TOR-450UH-150A',
    voltageRating: '690V Line-to-Line',
    currentRating: '150A Continuous',
    rupturingCapacity: '450µH Inductance per Phase',
    standard: 'EN 60938-2, UL 94 V-0',
    description: 'High-permeability nanocrystalline toroidal core wound with triple-insulated Class H magnet wire for suppressing high-frequency PWM switching harmonics in variable speed drives.',
    application: 'Variable frequency motor drives (VFD), harmonic mitigation filter banks.',
    accentColor: '#eb8248',
  };
  group.userData = { spec, isInspectable: true };

  return group;
}

/**
 * High-Voltage Industrial Capacitor Bank
 * 6-part assembly
 */
export function createCapacitorBank(
  materials: MaterialLibrary,
  radius = 1.0,
  height = 3.6
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'CapacitorBank';

  // 1. Black/Blue insulated can body
  const bodyGeo = new THREE.CylinderGeometry(radius, radius, height, 24);
  const bodyMesh = new THREE.Mesh(bodyGeo, materials.capacitorSleeveBlack);
  bodyMesh.position.y = height * 0.5 + 0.3;
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // 2. Embossed Aluminum Top Header with vent
  const topGeo = new THREE.CylinderGeometry(radius * 0.98, radius * 0.98, 0.25, 24);
  const topMesh = new THREE.Mesh(topGeo, materials.capacitorCanAluminum);
  topMesh.position.y = bodyMesh.position.y + height * 0.5 + 0.1;
  group.add(topMesh);

  // 3. Stamped Safety Vent X-Pattern on top
  const ventGeo = new THREE.BoxGeometry(radius * 1.2, 0.04, 0.08);
  const vent1 = new THREE.Mesh(ventGeo, materials.galvanizedSteel);
  vent1.position.set(0, topMesh.position.y + 0.13, 0);
  const vent2 = new THREE.Mesh(ventGeo, materials.galvanizedSteel);
  vent2.position.set(0, topMesh.position.y + 0.13, 0);
  vent2.rotation.y = Math.PI * 0.5;
  group.add(vent1);
  group.add(vent2);

  // 4. Dual Screw Stud Terminals
  for (let s = -1; s <= 1; s += 2) {
    const studGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12);
    const stud = new THREE.Mesh(studGeo, materials.brassContacts);
    stud.position.set(s * radius * 0.45, topMesh.position.y + 0.3, 0);
    group.add(stud);
  }

  // 5. Polarity Negative Identification Stripe
  const stripeGeo = new THREE.PlaneGeometry(radius * 0.35, height * 0.85);
  const stripe = new THREE.Mesh(stripeGeo, materials.capacitorStripeMaterial);
  stripe.position.set(0, bodyMesh.position.y, radius + 0.01);
  group.add(stripe);

  // 6. Insulated Mounting Clamp Base
  const baseGeo = new THREE.BoxGeometry(radius * 2.8, 0.3, radius * 2.8);
  const baseMesh = new THREE.Mesh(baseGeo, materials.galvanizedSteel);
  baseMesh.position.y = 0.15;
  group.add(baseMesh);

  const spec: ComponentSpec = {
    id: `cap-${Math.random().toString(36).substring(2, 7)}`,
    name: 'Fuseco Power Factor Correction Capacitor',
    category: 'Reactive Power Compensation',
    partNumber: 'FUS-CAP-50KVAR-415V',
    voltageRating: '415V - 525V 50Hz',
    currentRating: '69.5A Nominal',
    rupturingCapacity: '50 kVAR Reactive Power',
    standard: 'IEC 60831-1/2, AS 1013',
    description: 'Metallized polypropylene self-healing power capacitor with overpressure tear-off disconnector and internal discharge resistors for industrial power factor improvement.',
    application: 'Automatic capacitor banks, heavy mining equipment, power factor correction.',
    accentColor: '#b5bcc2',
  };
  group.userData = { spec, isInspectable: true };

  return group;
}

/**
 * Terminal Block Strip with DIN Rail
 * 6-part assembly
 */
export function createTerminalBlockStrip(
  materials: MaterialLibrary,
  blockCount = 8
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'TerminalBlockStrip';

  const blockWidth = 0.5;
  const blockHeight = 1.6;
  const blockDepth = 2.0;

  // 1. DIN Rail (Galvanized Steel channel)
  const railLen = blockCount * blockWidth + 2.0;
  const railGeo = new THREE.BoxGeometry(railLen, 0.2, 1.2);
  const rail = new THREE.Mesh(railGeo, materials.galvanizedSteel);
  rail.position.y = 0.1;
  group.add(rail);

  // 2. Individual Polyamide Terminal Blocks
  const blockGeo = new THREE.BoxGeometry(blockWidth * 0.92, blockHeight, blockDepth);
  for (let i = 0; i < blockCount; i++) {
    const x = (i - (blockCount - 1) / 2) * blockWidth;
    // Alternate standard gray and Fuseco orange end/ground blocks
    const mat = (i === 0 || i === blockCount - 1) ? materials.fusecoOrange : materials.chipEpoxy;
    const block = new THREE.Mesh(blockGeo, mat);
    block.position.set(x, blockHeight * 0.5 + 0.2, 0);
    block.castShadow = true;
    group.add(block);

    // Clamp Screws on top
    const screwGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
    const screw1 = new THREE.Mesh(screwGeo, materials.brassContacts);
    screw1.position.set(x, block.position.y + blockHeight * 0.5 + 0.08, 0.4);
    const screw2 = new THREE.Mesh(screwGeo, materials.brassContacts);
    screw2.position.set(x, block.position.y + blockHeight * 0.5 + 0.08, -0.4);
    group.add(screw1);
    group.add(screw2);
  }

  // Spec metadata
  const spec: ComponentSpec = {
    id: `term-${Math.random().toString(36).substring(2, 7)}`,
    name: 'Fuseco High-Density DIN-Rail Terminal Block Strip',
    category: 'Industrial Control Interconnect',
    partNumber: 'FUS-TB-35MM-DIN',
    voltageRating: '1000V AC/DC',
    currentRating: '76A (16mm² wire)',
    rupturingCapacity: '8kV Impulse Withstand',
    standard: 'IEC 60947-7-1, UL 1059',
    description: 'Screw-clamp terminal block strip on 35mm DIN rail with flame retardant Polyamide 6.6 housing and silver-copper cross-connection jumpers.',
    application: 'Industrial control panels, relay logic interfacing, telemetry enclosures.',
    accentColor: '#ff5500',
  };
  group.userData = { spec, isInspectable: true };

  return group;
}
