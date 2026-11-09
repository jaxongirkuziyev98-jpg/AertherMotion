import * as THREE from 'three';
import { ParticleColorTheme } from '../../types/tracking';

/**
 * Procedural Grid Floor Texture (Zero 404s)
 */
export function createGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';
  ctx.lineWidth = 1.5;

  const step = 32;
  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates a circular glowing micro-bead sprite texture
 */
export function createGlowingBeadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.3, 'rgba(103, 232, 249, 0.95)');
  grad.addColorStop(0.65, 'rgba(168, 85, 247, 0.55)');
  grad.addColorStop(0.9, 'rgba(6, 182, 212, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Quantum Micro-Orb Particle Swarm (ONE Single Unified Sphere)
 * Requirements:
 * 1. ONLY ONE single sphere in the scene ("ikta sharikcha emas bitta bo'lsin").
 * 2. Controllable either with ONE hand OR with TWO hands.
 * 3. Hand curled / brought close together ("bir biriga yaqinlashtirsam") -> particles condense tightly into a dense glowing core ("zichlashib ketadi").
 * 4. Hand open / spread wide ("kotta yoysam") -> particles disperse and expand widely outward ("yoyilib ketadi").
 * 5. Hand rotation (Pitch, Yaw, Roll) rotates the sphere.
 * 6. NO HEART GESTURE ("yurakcha kerak emas, faqat zichlashish va yoyilish").
 */
export class QuantumOrbSwarm {
  public group: THREE.Group;
  private particleCount: number = 3000;
  private particles: THREE.Points;
  private positions: Float32Array;
  private currentPositions: Float32Array;
  private colors: Float32Array;
  private geo: THREE.BufferGeometry;

  // Pre-calculated Fibonacci sphere offsets for the single sphere
  private unifiedOffsets: Float32Array;
  // Pre-calculated radial dispersal scatter vectors (for "yoyilib ketish")
  private disperseOffsets: Float32Array;

  // Color theme
  private currentTheme: ParticleColorTheme = 'quantum-cyan';

  // Kinetic Shockwave Ring
  private shockwaveRing: THREE.Mesh;
  private shockwaveProgress: number = 1.0;

  // Accretion Vortex Disk
  private vortexMesh: THREE.LineSegments;

  // Smooth state
  private currentCenter = new THREE.Vector3(0, 0, 0);
  private currentRadius: number = 0.35;
  private currentDisperse: number = 0.0;
  private rotMatrix = new THREE.Matrix4();
  private tempVec = new THREE.Vector3();

  constructor() {
    this.group = new THREE.Group();
    const count = this.particleCount;

    this.positions = new Float32Array(count * 3);
    this.currentPositions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.unifiedOffsets = new Float32Array(count * 3);
    this.disperseOffsets = new Float32Array(count * 3);

    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    // Single unified sphere distribution (Fibonacci)
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      this.unifiedOffsets[idx] = Math.cos(theta) * radiusAtY;
      this.unifiedOffsets[idx + 1] = y;
      this.unifiedOffsets[idx + 2] = Math.sin(theta) * radiusAtY;

      // Random 3D dispersal direction for outward scattering when spread wide ("yoyilib ketish")
      const u1 = Math.random();
      const u2 = Math.random();
      const sTheta = u1 * Math.PI * 2;
      const sPhi = Math.acos(2 * u2 - 1);
      const scatterDistance = 0.4 + Math.random() * 1.1;

      this.disperseOffsets[idx] = Math.sin(sPhi) * Math.cos(sTheta) * scatterDistance;
      this.disperseOffsets[idx + 1] = Math.sin(sPhi) * Math.sin(sTheta) * scatterDistance;
      this.disperseOffsets[idx + 2] = Math.cos(sPhi) * scatterDistance;
    }

    // Generate colors based on initial theme
    this.applyThemeColors('quantum-cyan');

    // Initialize positions
    for (let i = 0; i < count * 3; i++) {
      this.currentPositions[i] = this.unifiedOffsets[i] * 0.35;
      this.positions[i] = this.currentPositions[i];
    }

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const beadTex = createGlowingBeadTexture();
    const mat = new THREE.PointsMaterial({
      size: 0.065,
      map: beadTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(this.geo, mat);
    this.group.add(this.particles);

    // Shockwave Energy Blast Ring
    const ringGeo = new THREE.RingGeometry(0.8, 1.05, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.shockwaveRing = new THREE.Mesh(ringGeo, ringMat);
    this.shockwaveRing.rotation.x = Math.PI / 2;
    this.group.add(this.shockwaveRing);

    // Accretion Vortex Disk
    const vPos: number[] = [];
    for (let v = 0; v < 80; v++) {
      const angle = (v / 80) * Math.PI * 2;
      const rInner = 0.25 + Math.random() * 0.15;
      const rOuter = 0.55 + Math.random() * 0.35;
      vPos.push(Math.cos(angle) * rInner, (Math.random() - 0.5) * 0.06, Math.sin(angle) * rInner);
      vPos.push(Math.cos(angle + 0.4) * rOuter, (Math.random() - 0.5) * 0.06, Math.sin(angle + 0.4) * rOuter);
    }
    const vGeo = new THREE.BufferGeometry();
    vGeo.setAttribute('position', new THREE.Float32BufferAttribute(vPos, 3));
    const vMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    this.vortexMesh = new THREE.LineSegments(vGeo, vMat);
    this.group.add(this.vortexMesh);
  }

  public setTheme(theme: ParticleColorTheme) {
    this.currentTheme = theme;
    this.applyThemeColors(theme);
    const colorAttr = this.geo.getAttribute('color') as THREE.BufferAttribute;
    colorAttr.needsUpdate = true;

    // Update shockwave & vortex color to match
    let hex = 0x38bdf8;
    if (theme === 'solar-gold') hex = 0xf59e0b;
    else if (theme === 'matrix-emerald') hex = 0x10b981;
    else if (theme === 'cosmic-amethyst') hex = 0xc084fc;
    else if (theme === 'prismatic-aurora') hex = 0xf43f5e;

    (this.shockwaveRing.material as THREE.MeshBasicMaterial).color.setHex(hex);
    (this.vortexMesh.material as THREE.LineBasicMaterial).color.setHex(hex);
  }

  public triggerShockwave() {
    this.shockwaveProgress = 0.0;
  }

  private applyThemeColors(theme: ParticleColorTheme) {
    const count = this.particleCount;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const y = this.unifiedOffsets[idx + 1];
      const normY = (y + 1) / 2; // 0 to 1

      if (theme === 'solar-gold') {
        // Solar flare / supernova
        if (normY > 0.6) {
          this.colors[idx] = 1.0;
          this.colors[idx + 1] = 0.82 + Math.random() * 0.18;
          this.colors[idx + 2] = 0.15;
        } else if (normY > 0.3) {
          this.colors[idx] = 0.98;
          this.colors[idx + 1] = 0.42 + Math.random() * 0.2;
          this.colors[idx + 2] = 0.05;
        } else {
          this.colors[idx] = 0.92;
          this.colors[idx + 1] = 0.15 + Math.random() * 0.15;
          this.colors[idx + 2] = 0.15;
        }
      } else if (theme === 'matrix-emerald') {
        // Bio-Matrix
        if (normY > 0.6) {
          this.colors[idx] = 0.2;
          this.colors[idx + 1] = 0.98;
          this.colors[idx + 2] = 0.55;
        } else if (normY > 0.3) {
          this.colors[idx] = 0.06;
          this.colors[idx + 1] = 0.85;
          this.colors[idx + 2] = 0.45;
        } else {
          this.colors[idx] = 0.55;
          this.colors[idx + 1] = 0.98;
          this.colors[idx + 2] = 0.15;
        }
      } else if (theme === 'cosmic-amethyst') {
        // Nebula Purple & Fuchsia
        if (normY > 0.6) {
          this.colors[idx] = 0.85;
          this.colors[idx + 1] = 0.25;
          this.colors[idx + 2] = 0.98;
        } else if (normY > 0.3) {
          this.colors[idx] = 0.65;
          this.colors[idx + 1] = 0.12;
          this.colors[idx + 2] = 0.95;
        } else {
          this.colors[idx] = 0.95;
          this.colors[idx + 1] = 0.35;
          this.colors[idx + 2] = 0.75;
        }
      } else if (theme === 'prismatic-aurora') {
        // Rainbow spectrum
        const hue = (normY + (i / count) * 0.5) % 1.0;
        const color = new THREE.Color().setHSL(hue, 0.95, 0.62);
        this.colors[idx] = color.r;
        this.colors[idx + 1] = color.g;
        this.colors[idx + 2] = color.b;
      } else {
        // quantum-cyan default
        if (normY > 0.65) {
          this.colors[idx] = 0.05 + Math.random() * 0.15;
          this.colors[idx + 1] = 0.78 + Math.random() * 0.22;
          this.colors[idx + 2] = 0.98;
        } else if (normY > 0.35) {
          this.colors[idx] = 0.75 + Math.random() * 0.25;
          this.colors[idx + 1] = 0.22 + Math.random() * 0.25;
          this.colors[idx + 2] = 0.98;
        } else {
          this.colors[idx] = 0.06 + Math.random() * 0.15;
          this.colors[idx + 1] = 0.85 + Math.random() * 0.15;
          this.colors[idx + 2] = 0.65 + Math.random() * 0.3;
        }
      }

      // 10% sparkling diamond sparks
      if (i % 8 === 0) {
        this.colors[idx] = 1.0;
        this.colors[idx + 1] = 1.0;
        this.colors[idx + 2] = 1.0;
      }
    }
  }

  /**
   * Single Unified Sphere update:
   * - targetPos: 3D point (1-hand position or 2-hand midpoint)
   * - handRot: Pitch, Yaw, Roll to rotate the sphere
   * - expansionRatio: 0.0 (curled / hands close = dense ball) to 1.0 (spread wide = particles disperse)
   */
  public update(
    targetPos: THREE.Vector3,
    handRot: { pitch: number; yaw: number; roll: number },
    expansionRatio: number,
    _unusedHeartGesture: boolean,
    time: number,
    delta: number
  ) {
    const count = this.particleCount;
    const pos = this.positions;
    const cur = this.currentPositions;
    const uni = this.unifiedOffsets;
    const disp = this.disperseOffsets;

    // Smoothly follow hand / dual-hand center position
    this.currentCenter.x = THREE.MathUtils.damp(this.currentCenter.x, targetPos.x, 22, delta);
    this.currentCenter.y = THREE.MathUtils.damp(this.currentCenter.y, targetPos.y, 22, delta);
    this.currentCenter.z = THREE.MathUtils.damp(this.currentCenter.z, targetPos.z, 22, delta);

    // Dynamic radius with wide dynamic range:
    // When hands are close / curled: minRadius = 0.08m (super tight, dense glowing nucleus)
    // When hands spread wide ("kotta yoysam"): maxRadius = 1.75m + radial dispersal
    const minRadius = 0.08;
    const maxRadius = 1.75;
    const clampedRatio = Math.max(0, Math.min(1, expansionRatio));

    const targetRadius = minRadius + (maxRadius - minRadius) * clampedRatio;
    this.currentRadius = THREE.MathUtils.damp(this.currentRadius, targetRadius, 14, delta);

    // Dynamic dispersal factor: when clampedRatio > 0.3, particles scatter outward widely ("yoyilib ketadi")
    const targetDisperse = Math.pow(clampedRatio, 1.4) * 1.5;
    this.currentDisperse = THREE.MathUtils.damp(this.currentDisperse, targetDisperse, 14, delta);

    // Dynamic particle point size: dense when small, luminous aura when dispersed
    const mat = this.particles.material as THREE.PointsMaterial;
    mat.size = 0.05 + clampedRatio * 0.025;

    // Rotation from user's wrist gyro
    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(handRot.pitch),
      THREE.MathUtils.degToRad(handRot.yaw),
      THREE.MathUtils.degToRad(handRot.roll),
      'XYZ'
    );
    this.rotMatrix.makeRotationFromEuler(euler);

    // Continuous celestial spin
    const sphereSpin = time * 0.75;
    const cosSpin = Math.cos(sphereSpin);
    const sinSpin = Math.sin(sphereSpin);

    const lerpSpeed = Math.min(1.0, delta * 16.0);
    const r = this.currentRadius;
    const dFactor = this.currentDisperse;
    const c = this.currentCenter;
    const _v = this.tempVec;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      const ux = uni[idx];
      const uy = uni[idx + 1];
      const uz = uni[idx + 2];

      _v.set(ux * cosSpin - uz * sinSpin, uy, ux * sinSpin + uz * cosSpin);
      _v.applyMatrix4(this.rotMatrix);

      // Outward particle scatter when spreading wide ("yoyilib ketish"):
      const scatterX = disp[idx] * dFactor;
      const scatterY = disp[idx + 1] * dFactor;
      const scatterZ = disp[idx + 2] * dFactor;

      const targetX = c.x + _v.x * r + scatterX;
      const targetY = c.y + _v.y * r + scatterY;
      const targetZ = c.z + _v.z * r + scatterZ;

      cur[idx] += (targetX - cur[idx]) * lerpSpeed;
      cur[idx + 1] += (targetY - cur[idx + 1]) * lerpSpeed;
      cur[idx + 2] += (targetZ - cur[idx + 2]) * lerpSpeed;

      pos[idx] = cur[idx];
      pos[idx + 1] = cur[idx + 1];
      pos[idx + 2] = cur[idx + 2];
    }

    const posAttr = this.geo.getAttribute('position') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;

    // UPDATE KINETIC SHOCKWAVE BLAST RING
    if (this.shockwaveProgress < 1.0) {
      this.shockwaveProgress += delta * 2.5;
      const p = Math.min(1.0, this.shockwaveProgress);
      const ringScale = 0.3 + p * 3.8;
      this.shockwaveRing.scale.set(ringScale, ringScale, ringScale);
      this.shockwaveRing.position.copy(c);
      const ringMat = this.shockwaveRing.material as THREE.MeshBasicMaterial;
      ringMat.opacity = (1 - p) * 0.85;
      this.shockwaveRing.visible = true;
    } else {
      this.shockwaveRing.visible = false;
    }

    // UPDATE ACCRETION VORTEX DISK
    this.vortexMesh.position.copy(c);
    this.vortexMesh.rotation.y = time * 3.2;
    // Flared when dense / contracted (clampedRatio < 0.35)
    const vMat = this.vortexMesh.material as THREE.LineBasicMaterial;
    const vortexOpacity = Math.max(0.05, (1 - clampedRatio) * 0.7);
    vMat.opacity = vortexOpacity;
    const vortexScale = 0.4 + (1 - clampedRatio) * 0.8;
    this.vortexMesh.scale.set(vortexScale, vortexScale, vortexScale);
  }
}

/**
 * Sleek Holographic Luminous Cyber Hand (Left & Right)
 */
export class HolographicCyberHand {
  public group: THREE.Group;
  public isLeftHand: boolean;
  private fingerJoints: THREE.Group[][] = [];
  public laserEmitter: THREE.Mesh | null = null;
  public palmOrb!: THREE.Mesh;

  constructor(isLeftHand: boolean) {
    this.isLeftHand = isLeftHand;
    this.group = new THREE.Group();
    this.group.scale.set(0.48, 0.48, 0.48);
    this.buildHand();
  }

  private buildHand() {
    const primaryHex = this.isLeftHand ? 0x06b6d4 : 0xa855f7;

    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      emissive: primaryHex,
      emissiveIntensity: 0.25,
      metalness: 0.9,
      roughness: 0.2,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.88,
    });

    const luminousMat = new THREE.MeshBasicMaterial({ color: primaryHex });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });

    const wristGeo = new THREE.CylinderGeometry(0.28, 0.35, 0.42, 18);
    const wrist = new THREE.Mesh(wristGeo, crystalMat);
    wrist.position.y = -0.75;
    this.group.add(wrist);

    const ringGeo = new THREE.TorusGeometry(0.36, 0.02, 12, 32);
    const wristRing = new THREE.Mesh(ringGeo, luminousMat);
    wristRing.rotation.x = Math.PI / 2;
    wristRing.position.y = -0.75;
    this.group.add(wristRing);

    const palmShape = new THREE.Shape();
    palmShape.moveTo(-0.38, -0.38);
    palmShape.lineTo(0.38, -0.38);
    palmShape.lineTo(0.42, 0.26);
    palmShape.lineTo(-0.42, 0.26);
    palmShape.closePath();

    const palmGeo = new THREE.ExtrudeGeometry(palmShape, {
      depth: 0.15,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.035,
      bevelThickness: 0.035,
    });
    palmGeo.center();
    const palm = new THREE.Mesh(palmGeo, crystalMat);
    palm.position.y = -0.26;
    this.group.add(palm);

    const coreGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.18, 18);
    this.palmOrb = new THREE.Mesh(coreGeo, luminousMat);
    this.palmOrb.rotation.x = Math.PI / 2;
    this.palmOrb.position.set(0, -0.26, 0.03);
    this.group.add(this.palmOrb);

    const m = this.isLeftHand ? -1 : 1;
    const configs = [
      { x: -0.42 * m, y: -0.28, angle: 0.45 * m, scale: 0.7, isIndex: false },
      { x: -0.26 * m, y: 0.13, angle: 0.05 * m, scale: 0.88, isIndex: true },
      { x: -0.08 * m, y: 0.17, angle: 0.0, scale: 0.94, isIndex: false },
      { x: 0.09 * m, y: 0.14, angle: -0.04 * m, scale: 0.88, isIndex: false },
      { x: 0.28 * m, y: 0.07, angle: -0.12 * m, scale: 0.7, isIndex: false },
    ];

    configs.forEach((cfg) => {
      const joints: THREE.Group[] = [];

      const baseJoint = new THREE.Group();
      baseJoint.position.set(cfg.x, cfg.y, 0);
      baseJoint.rotation.z = cfg.angle;
      this.group.add(baseJoint);

      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.065 * cfg.scale, 12, 12), chromeMat);
      baseJoint.add(knuckle);

      const p1Len = 0.36 * cfg.scale;
      const phalanx1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05 * cfg.scale, 0.06 * cfg.scale, p1Len, 10),
        crystalMat
      );
      phalanx1.position.y = p1Len / 2;
      baseJoint.add(phalanx1);
      joints.push(baseJoint);

      const midJoint = new THREE.Group();
      midJoint.position.y = p1Len;
      baseJoint.add(midJoint);

      const midKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.055 * cfg.scale, 10, 10), luminousMat);
      midJoint.add(midKnuckle);

      const p2Len = 0.28 * cfg.scale;
      const phalanx2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04 * cfg.scale, 0.05 * cfg.scale, p2Len, 10),
        crystalMat
      );
      phalanx2.position.y = p2Len / 2;
      midJoint.add(phalanx2);
      joints.push(midJoint);

      const tipJoint = new THREE.Group();
      tipJoint.position.y = p2Len;
      midJoint.add(tipJoint);

      const tipKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.045 * cfg.scale, 10, 10), luminousMat);
      tipJoint.add(tipKnuckle);

      const p3Len = 0.2 * cfg.scale;
      const phalanx3 = new THREE.Mesh(new THREE.ConeGeometry(0.04 * cfg.scale, p3Len, 10), crystalMat);
      phalanx3.position.y = p3Len / 2;
      tipJoint.add(phalanx3);
      joints.push(tipJoint);

      if (cfg.isIndex) {
        this.laserEmitter = tipKnuckle;
      }

      this.fingerJoints.push(joints);
    });
  }

  public updateFingers(bends: [number, number, number, number, number]) {
    for (let f = 0; f < 5; f++) {
      const bend = bends[f] || 0;
      const joints = this.fingerJoints[f];
      if (!joints) continue;

      const angle = bend * 1.35;
      joints[0].rotation.x = angle * 0.45;
      joints[1].rotation.x = angle * 0.55;
      joints[2].rotation.x = angle * 0.4;
    }
  }
}

/**
 * Quantum Core / Holographic Reactor ("Kvant Yadrosi")
 */
export class QuantumCore {
  public group: THREE.Group;
  private ring1: THREE.Mesh;
  private ring2: THREE.Mesh;
  private ring3: THREE.Mesh;
  private coreSphere: THREE.Mesh;
  private particles: THREE.Points;

  constructor() {
    this.group = new THREE.Group();

    const coreGeo = new THREE.SphereGeometry(0.65, 32, 32);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
      transmission: 0.3,
      transparent: true,
      opacity: 0.88,
    });
    this.coreSphere = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.coreSphere);

    const ringMat1 = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.15 });
    const ringMat2 = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.9, roughness: 0.15 });
    const ringMat3 = new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.9, roughness: 0.15 });

    this.ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.045, 16, 64), ringMat1);
    this.ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.04, 16, 64), ringMat2);
    this.ring3 = new THREE.Mesh(new THREE.TorusGeometry(1.68, 0.035, 16, 64), ringMat3);

    this.group.add(this.ring1);
    this.group.add(this.ring2);
    this.group.add(this.ring3);

    const pGeo = new THREE.BufferGeometry();
    const pCount = 350;
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i += 3) {
      const r = 0.9 + Math.random() * 1.3;
      const theta = Math.random() * Math.PI * 2;
      const phiAngle = Math.acos(Math.random() * 2 - 1);
      positions[i] = r * Math.sin(phiAngle) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phiAngle) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phiAngle);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    });
    this.particles = new THREE.Points(pGeo, pMat);
    this.group.add(this.particles);
  }

  public update(time: number, speedMultiplier: number = 1) {
    const s = speedMultiplier;
    this.ring1.rotation.x = time * 0.8 * s;
    this.ring1.rotation.y = time * 0.5 * s;
    this.ring2.rotation.y = time * 0.6 * s;
    this.ring2.rotation.z = time * 0.9 * s;
    this.ring3.rotation.x = time * 0.4 * s;
    this.ring3.rotation.z = time * 0.7 * s;

    const pulse = 1 + Math.sin(time * 3 * s) * 0.06;
    this.coreSphere.scale.set(pulse, pulse, pulse);
    this.particles.rotation.y = time * 0.2 * s;
  }
}

/**
 * Interactive Holographic Cyber Globe with Lat/Long Coordinates ("Kiber Globus")
 */
export class CyberGlobe {
  public group: THREE.Group;
  private sphereWire: THREE.Mesh;
  private satellites: THREE.Group;
  private rings: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();

    const sphereGeo = new THREE.SphereGeometry(1.15, 26, 26);
    const wireMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    this.sphereWire = new THREE.Mesh(sphereGeo, wireMat);
    this.group.add(this.sphereWire);

    const innerGeo = new THREE.SphereGeometry(1.08, 30, 30);
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: 0x0c4a6e,
      emissive: 0x0369a1,
      emissiveIntensity: 0.5,
      roughness: 0.4,
      metalness: 0.8,
      transparent: true,
      opacity: 0.82,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    this.group.add(inner);

    const ringGeo = new THREE.RingGeometry(1.35, 1.7, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    });
    this.rings = new THREE.Mesh(ringGeo, ringMat);
    this.rings.rotation.x = Math.PI / 2.3;
    this.group.add(this.rings);

    this.satellites = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const sat = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.9, roughness: 0.2 })
      );
      sat.position.set(Math.cos(angle) * 1.55, Math.sin(angle) * 0.35, Math.sin(angle) * 1.55);
      this.satellites.add(sat);
    }
    this.group.add(this.satellites);
  }

  public update(time: number, speedMultiplier: number = 1) {
    const s = speedMultiplier;
    this.sphereWire.rotation.y = time * 0.35 * s;
    this.satellites.rotation.y = -time * 0.5 * s;
    this.rings.rotation.z = time * 0.15 * s;
  }
}

/**
 * 4D Tesseract Kinetic Hypercube ("Giperkub 4D")
 */
export class Hypercube {
  public group: THREE.Group;
  private outerCube: THREE.Mesh;
  private innerCube: THREE.Mesh;
  private connectors: THREE.LineSegments;

  constructor() {
    this.group = new THREE.Group();

    const outerGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const outerMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.8,
      transparent: true,
      opacity: 0.65,
      clearcoat: 1.0,
    });
    this.outerCube = new THREE.Mesh(outerGeo, outerMat);
    this.group.add(this.outerCube);

    const innerGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.15,
    });
    this.innerCube = new THREE.Mesh(innerGeo, innerMat);
    this.group.add(this.innerCube);

    const linePositions: number[] = [];
    const corners = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];
    corners.forEach(([x, y, z]) => {
      linePositions.push(x * 0.7, y * 0.7, z * 0.7);
      linePositions.push(x * 0.35, y * 0.35, z * 0.35);
    });

    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const linesMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.7,
    });
    this.connectors = new THREE.LineSegments(linesGeo, linesMat);
    this.group.add(this.connectors);
  }

  public update(time: number, speedMultiplier: number = 1) {
    const s = speedMultiplier;
    this.outerCube.rotation.x = time * 0.4 * s;
    this.outerCube.rotation.y = time * 0.5 * s;
    this.innerCube.rotation.x = -time * 0.6 * s;
    this.innerCube.rotation.y = -time * 0.8 * s;
    this.connectors.rotation.x = time * 0.4 * s;
    this.connectors.rotation.y = time * 0.5 * s;
  }
}

/**
 * 1. Gargantua Black Hole with Relativistic Gravitational Lensing & Accretion Halo
 * ("Qora Tuynuk / Gravitatsion Lenza")
 */
export class BlackHoleGargantua {
  public group: THREE.Group;
  private eventHorizon: THREE.Mesh;
  private photonSphere: THREE.Mesh;
  private accretionDisk: THREE.Mesh;
  private relativisticHalo: THREE.Mesh;
  private jetParticles: THREE.Points;

  constructor() {
    this.group = new THREE.Group();

    // Event Horizon (Absolute pitch black absorber)
    const horizonGeo = new THREE.SphereGeometry(0.85, 48, 48);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    this.eventHorizon = new THREE.Mesh(horizonGeo, horizonMat);
    this.group.add(this.eventHorizon);

    // Glowing Photon Sphere boundary
    const photonGeo = new THREE.SphereGeometry(0.92, 48, 48);
    const photonMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    this.photonSphere = new THREE.Mesh(photonGeo, photonMat);
    this.group.add(this.photonSphere);

    // Dynamic Accretion Disk (Plazma disk)
    const diskGeo = new THREE.RingGeometry(1.1, 2.7, 64, 16);
    const diskMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.2,
      side: THREE.DoubleSide,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    this.accretionDisk = new THREE.Mesh(diskGeo, diskMat);
    this.accretionDisk.rotation.x = Math.PI / 2.2;
    this.group.add(this.accretionDisk);

    // Relativistic Vertical Gravitational Lensing Halo (Interstellar curved light effect)
    const haloGeo = new THREE.RingGeometry(0.96, 2.3, 64, 8);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    });
    this.relativisticHalo = new THREE.Mesh(haloGeo, haloMat);
    this.relativisticHalo.rotation.y = Math.PI / 1.8;
    this.group.add(this.relativisticHalo);

    // Relativistic Polar Plasma Jets
    const jetCount = 200;
    const jetGeo = new THREE.BufferGeometry();
    const jetPositions = new Float32Array(jetCount * 3);
    for (let i = 0; i < jetCount; i++) {
      const idx = i * 3;
      const sign = i % 2 === 0 ? 1 : -1;
      const dist = Math.random() * 2.8 + 0.6;
      jetPositions[idx] = (Math.random() - 0.5) * 0.25;
      jetPositions[idx + 1] = sign * dist;
      jetPositions[idx + 2] = (Math.random() - 0.5) * 0.25;
    }
    jetGeo.setAttribute('position', new THREE.BufferAttribute(jetPositions, 3));
    const jetMat = new THREE.PointsMaterial({
      color: 0xa855f7,
      size: 0.05,
      transparent: true,
      opacity: 0.85,
    });
    this.jetParticles = new THREE.Points(jetGeo, jetMat);
    this.group.add(this.jetParticles);
  }

  public update(time: number, speedMultiplier: number = 1) {
    const s = speedMultiplier;
    this.accretionDisk.rotation.z = time * 0.9 * s;
    this.relativisticHalo.rotation.z = -time * 0.4 * s;
    this.jetParticles.rotation.y = time * 1.5 * s;

    // Pulse event horizon glow
    const pulse = 1.0 + Math.sin(time * 2.5 * s) * 0.03;
    this.photonSphere.scale.set(pulse, pulse, pulse);
  }
}

/**
 * 2. Solar System Interactive Orbit with Sun and Orbiting Planets
 * ("Quyosh Tizimi / Sayyoralar Orbitasi")
 */
export class SolarSystemOrbit {
  public group: THREE.Group;
  private sun: THREE.Mesh;
  private sunCorona: THREE.Mesh;
  private planets: {
    orbitPivot: THREE.Group;
    mesh: THREE.Mesh;
    speed: number;
    orbitRing: THREE.Mesh;
  }[] = [];

  constructor() {
    this.group = new THREE.Group();

    // Central Sun
    const sunGeo = new THREE.SphereGeometry(0.75, 32, 32);
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff6600,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.1,
    });
    this.sun = new THREE.Mesh(sunGeo, sunMat);
    this.group.add(this.sun);

    // Sun Corona flare
    const coronaGeo = new THREE.SphereGeometry(0.85, 24, 24);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    this.sunCorona = new THREE.Mesh(coronaGeo, coronaMat);
    this.group.add(this.sunCorona);

    // Orbiting Planets (Mercury, Earth, Mars, Jupiter)
    const planetData = [
      { name: 'Merkuriy', dist: 1.15, size: 0.1, color: 0x94a3b8, speed: 1.6 },
      { name: 'Yer & Oy', dist: 1.65, size: 0.16, color: 0x38bdf8, speed: 1.0 },
      { name: 'Mars', dist: 2.15, size: 0.13, color: 0xf87171, speed: 0.8 },
      { name: 'Yupiter', dist: 2.75, size: 0.28, color: 0xfbbf24, speed: 0.45 },
    ];

    planetData.forEach((p) => {
      const pivot = new THREE.Group();
      this.group.add(pivot);

      // Orbital circle track line
      const trackGeo = new THREE.RingGeometry(p.dist - 0.015, p.dist + 0.015, 64);
      const trackMat = new THREE.MeshBasicMaterial({
        color: 0x334155,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      const orbitRing = new THREE.Mesh(trackGeo, trackMat);
      orbitRing.rotation.x = Math.PI / 2;
      this.group.add(orbitRing);

      // Planet Mesh
      const pGeo = new THREE.SphereGeometry(p.size, 20, 20);
      const pMat = new THREE.MeshStandardMaterial({
        color: p.color,
        roughness: 0.4,
        metalness: 0.3,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.x = p.dist;
      pivot.add(pMesh);

      // Moon for Earth
      if (p.name === 'Yer & Oy') {
        const moonGeo = new THREE.SphereGeometry(0.04, 12, 12);
        const moonMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.set(0.25, 0, 0);
        pMesh.add(moonMesh);
      }

      this.planets.push({
        orbitPivot: pivot,
        mesh: pMesh,
        speed: p.speed,
        orbitRing,
      });
    });
  }

  public update(time: number, speedMultiplier: number = 1) {
    const s = speedMultiplier;
    this.sun.rotation.y = time * 0.25 * s;
    this.sunCorona.rotation.y = -time * 0.4 * s;
    this.sunCorona.rotation.z = time * 0.3 * s;

    this.planets.forEach((p) => {
      p.orbitPivot.rotation.y = time * p.speed * s;
      p.mesh.rotation.y = time * 2.0 * s;
    });
  }
}

/**
 * 3. Giant Ringed Planet Saturn with Dust Halo
 * ("Saturn / Halqali Gaz Giganti")
 */
export class RingedSaturnPlanet {
  public group: THREE.Group;
  private planetBody: THREE.Mesh;
  private outerRings: THREE.Mesh;
  private innerRings: THREE.Mesh;
  private ringParticles: THREE.Points;

  constructor() {
    this.group = new THREE.Group();

    // Planet Body
    const bodyGeo = new THREE.SphereGeometry(1.05, 36, 36);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xe0af68,
      roughness: 0.6,
      metalness: 0.1,
    });
    this.planetBody = new THREE.Mesh(bodyGeo, bodyMat);
    this.group.add(this.planetBody);

    // Main Rings
    const ringGeo = new THREE.RingGeometry(1.4, 2.6, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xc89b53,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      roughness: 0.5,
    });
    this.outerRings = new THREE.Mesh(ringGeo, ringMat);
    this.outerRings.rotation.x = Math.PI / 2.3;
    this.outerRings.rotation.y = 0.25;
    this.group.add(this.outerRings);

    // Inner bright ice ring
    const innerRingGeo = new THREE.RingGeometry(1.22, 1.38, 48);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    });
    this.innerRings = new THREE.Mesh(innerRingGeo, innerRingMat);
    this.innerRings.rotation.x = Math.PI / 2.3;
    this.innerRings.rotation.y = 0.25;
    this.group.add(this.innerRings);

    // Asteroid dust ring particles
    const ringPCount = 350;
    const ringPPositions = new Float32Array(ringPCount * 3);
    for (let i = 0; i < ringPCount; i++) {
      const idx = i * 3;
      const rad = 1.45 + Math.random() * 1.15;
      const ang = Math.random() * Math.PI * 2;
      ringPPositions[idx] = Math.cos(ang) * rad;
      ringPPositions[idx + 1] = (Math.random() - 0.5) * 0.08;
      ringPPositions[idx + 2] = Math.sin(ang) * rad;
    }
    const ringPGeo = new THREE.BufferGeometry();
    ringPGeo.setAttribute('position', new THREE.BufferAttribute(ringPPositions, 3));
    this.ringParticles = new THREE.Points(
      ringPGeo,
      new THREE.PointsMaterial({ color: 0xfef08a, size: 0.04, transparent: true, opacity: 0.75 })
    );
    this.ringParticles.rotation.x = Math.PI / 2.3;
    this.ringParticles.rotation.y = 0.25;
    this.group.add(this.ringParticles);
  }

  public update(time: number, speedMultiplier: number = 1) {
    const s = speedMultiplier;
    this.planetBody.rotation.y = time * 0.3 * s;
    this.outerRings.rotation.z = time * 0.05 * s;
    this.ringParticles.rotation.z = time * 0.12 * s;
  }
}

/**
 * 4. Supernova Pulsar Star with Cosmic Shockwave Ejection
 * ("Supernova Neytron Yulduzi")
 */
export class SupernovaPulsarStar {
  public group: THREE.Group;
  private pulsarCore: THREE.Mesh;
  private magneticFieldRings: THREE.Group;
  private shockwaveBeams: THREE.Points;

  constructor() {
    this.group = new THREE.Group();

    // Dense Pulsar Core
    const coreGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.9,
    });
    this.pulsarCore = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.pulsarCore);

    // Magnetic Field Dynamo Rings
    this.magneticFieldRings = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const ringGeo = new THREE.TorusGeometry(0.9 + i * 0.35, 0.02, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x06b6d4 : 0xa855f7,
        wireframe: true,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = (i * Math.PI) / 4;
      ring.rotation.y = (i * Math.PI) / 6;
      this.magneticFieldRings.add(ring);
    }
    this.group.add(this.magneticFieldRings);

    // Pulsar Cosmic Radiation Jets
    const pCount = 300;
    const pPositions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const idx = i * 3;
      const sign = i % 2 === 0 ? 1 : -1;
      const height = Math.random() * 3.2 + 0.4;
      const radius = (height / 3.2) * 0.35 * Math.random();
      const angle = Math.random() * Math.PI * 2;
      pPositions[idx] = Math.cos(angle) * radius;
      pPositions[idx + 1] = sign * height;
      pPositions[idx + 2] = Math.sin(angle) * radius;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    this.shockwaveBeams = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.06, transparent: true, opacity: 0.9 })
    );
    this.group.add(this.shockwaveBeams);
  }

  public update(time: number, speedMultiplier: number = 1) {
    const s = speedMultiplier;
    // Rapid neutron star spin
    this.pulsarCore.rotation.y = time * 4.0 * s;
    this.magneticFieldRings.rotation.x = time * 0.6 * s;
    this.magneticFieldRings.rotation.y = time * 0.8 * s;
    this.shockwaveBeams.rotation.y = time * 3.0 * s;

    // Extreme high-energy flashing
    const flash = 1.0 + Math.sin(time * 12 * s) * 0.12;
    this.pulsarCore.scale.set(flash, flash, flash);
  }
}

