import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DualHandMetrics, SceneEnvironment, SpatialObjectType, ParticleColorTheme } from '../types/tracking';
import { 
  HolographicCyberHand, 
  QuantumOrbSwarm, 
  QuantumCore,
  CyberGlobe,
  Hypercube,
  BlackHoleGargantua,
  SolarSystemOrbit,
  RingedSaturnPlanet,
  SupernovaPulsarStar,
  createGridTexture 
} from './models/ProceduralModels';
import { spatialAudio } from '../utils/audio';

interface SpatialSceneProps {
  metrics: DualHandMetrics;
  selectedObject: SpatialObjectType;
  environment: SceneEnvironment;
  particleTheme: ParticleColorTheme;
  isVRMode: boolean;
  sensitivity: number;
  shockwaveTriggerCount?: number;
  onCaptureScreenshot?: (dataUrl: string) => void;
}

export const SpatialScene: React.FC<SpatialSceneProps> = ({
  metrics,
  selectedObject,
  environment,
  particleTheme,
  isVRMode,
  sensitivity,
  shockwaveTriggerCount = 0,
  onCaptureScreenshot,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const leftEyeCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rightEyeCameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // 3D Dual Hand Models
  const leftHandModelRef = useRef<HolographicCyberHand | null>(null);
  const rightHandModelRef = useRef<HolographicCyberHand | null>(null);

  // Micro-Orb Swarm & 3D Interactive Models
  const orbSwarmRef = useRef<QuantumOrbSwarm | null>(null);
  const quantumCoreRef = useRef<QuantumCore | null>(null);
  const cyberGlobeRef = useRef<CyberGlobe | null>(null);
  const hypercubeRef = useRef<Hypercube | null>(null);
  const blackHoleRef = useRef<BlackHoleGargantua | null>(null);
  const solarSystemRef = useRef<SolarSystemOrbit | null>(null);
  const saturnRef = useRef<RingedSaturnPlanet | null>(null);
  const supernovaRef = useRef<SupernovaPulsarStar | null>(null);

  // Environment elements
  const gridFloorRef = useRef<THREE.Mesh | null>(null);
  const ambientStarsRef = useRef<THREE.Points | null>(null);
  const deepNebulaRef = useRef<THREE.Points | null>(null);

  // State refs
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  const selectedObjectRef = useRef(selectedObject);
  selectedObjectRef.current = selectedObject;

  const envRef = useRef(environment);
  envRef.current = environment;

  const vrModeRef = useRef(isVRMode);
  vrModeRef.current = isVRMode;

  const sensitivityRef = useRef(sensitivity);
  sensitivityRef.current = sensitivity;

  const prevExpansionRef = useRef(0.45);

  // Real-time smoothed 3D positions for Left & Right Hands
  const leftCurrentPos = useRef(new THREE.Vector3(-0.65, 0, 0));
  const leftTargetPos = useRef(new THREE.Vector3(-0.65, 0, 0));
  const rightCurrentPos = useRef(new THREE.Vector3(0.65, 0, 0));
  const rightTargetPos = useRef(new THREE.Vector3(0.65, 0, 0));
  const unifiedTargetPos = useRef(new THREE.Vector3(0, 0, 0));

  // Audio trigger memories
  const wasCondensedActive = useRef(false);
  const wasExpandedActive = useRef(false);

  // Apply particle theme
  useEffect(() => {
    if (orbSwarmRef.current) {
      orbSwarmRef.current.setTheme(particleTheme);
    }
  }, [particleTheme]);

  // Trigger manual shockwave from dock button
  const prevShockwaveCount = useRef(shockwaveTriggerCount);
  useEffect(() => {
    if (shockwaveTriggerCount > prevShockwaveCount.current) {
      if (orbSwarmRef.current) {
        orbSwarmRef.current.triggerShockwave();
      }
      spatialAudio.playShockwaveBurst();
      prevShockwaveCount.current = shockwaveTriggerCount;
    }
  }, [shockwaveTriggerCount]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software-WebGL Probe
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Scene & Lighting
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0284c7, 1.6);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 2.0);
    rimLight.position.set(-6, -3, -5);
    scene.add(rimLight);

    scene.fog = new THREE.FogExp2(0x030712, 0.035);

    // 4. Cameras
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    camera.position.set(0, 0.15, 3.8);
    cameraRef.current = camera;

    const leftEye = new THREE.PerspectiveCamera(50, aspect / 2, 0.1, 100);
    leftEye.position.set(-0.032, 0.15, 3.8);
    leftEyeCameraRef.current = leftEye;

    const rightEye = new THREE.PerspectiveCamera(50, aspect / 2, 0.1, 100);
    rightEye.position.set(0.032, 0.15, 3.8);
    rightEyeCameraRef.current = rightEye;

    // 5. Floor Grid
    const gridTexture = createGridTexture();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({
        map: gridTexture,
        roughness: 0.7,
        metalness: 0.3,
        transparent: true,
        opacity: 0.65,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.9;
    scene.add(floor);
    gridFloorRef.current = floor;

    // Ambient floating cosmic dust (Dense 1200 stars)
    const partCount = 1200;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(partCount * 3);
    const partCols = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount; i++) {
      const idx = i * 3;
      partPos[idx] = (Math.random() - 0.5) * 28;
      partPos[idx + 1] = (Math.random() - 0.5) * 20;
      partPos[idx + 2] = (Math.random() - 0.5) * 28;

      // Color variation in stars (blue-white, gold, cyan)
      const starType = Math.random();
      if (starType > 0.8) {
        partCols[idx] = 1.0; partCols[idx + 1] = 0.85; partCols[idx + 2] = 0.4;
      } else if (starType > 0.4) {
        partCols[idx] = 0.4; partCols[idx + 1] = 0.8; partCols[idx + 2] = 1.0;
      } else {
        partCols[idx] = 0.9; partCols[idx + 1] = 0.95; partCols[idx + 2] = 1.0;
      }
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    partGeo.setAttribute('color', new THREE.BufferAttribute(partCols, 3));
    const ambientStars = new THREE.Points(
      partGeo,
      new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.85 })
    );
    scene.add(ambientStars);
    ambientStarsRef.current = ambientStars;

    // Glowing Deep Space Nebula Cloud
    const nebCount = 600;
    const nebGeo = new THREE.BufferGeometry();
    const nebPos = new Float32Array(nebCount * 3);
    const nebCols = new Float32Array(nebCount * 3);
    for (let i = 0; i < nebCount; i++) {
      const idx = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * 8;
      nebPos[idx] = Math.cos(angle) * dist + (Math.random() - 0.5) * 4;
      nebPos[idx + 1] = (Math.random() - 0.5) * 6;
      nebPos[idx + 2] = Math.sin(angle) * dist + (Math.random() - 0.5) * 4;

      // Deep magenta / cyan nebula colors
      if (i % 2 === 0) {
        nebCols[idx] = 0.65; nebCols[idx + 1] = 0.15; nebCols[idx + 2] = 0.85;
      } else {
        nebCols[idx] = 0.05; nebCols[idx + 1] = 0.65; nebCols[idx + 2] = 0.95;
      }
    }
    nebGeo.setAttribute('position', new THREE.BufferAttribute(nebPos, 3));
    nebGeo.setAttribute('color', new THREE.BufferAttribute(nebCols, 3));
    const deepNebula = new THREE.Points(
      nebGeo,
      new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.45 })
    );
    scene.add(deepNebula);
    deepNebulaRef.current = deepNebula;

    // 6. Dual Holographic Cyber Hands
    const leftHand = new HolographicCyberHand(true);
    const rightHand = new HolographicCyberHand(false);
    scene.add(leftHand.group);
    scene.add(rightHand.group);
    leftHandModelRef.current = leftHand;
    rightHandModelRef.current = rightHand;

    // 7. Micro-Orb Particle Swarm ("sharikcha mayda bo'lib...")
    const orbSwarm = new QuantumOrbSwarm();
    orbSwarm.setTheme(particleTheme);
    orbSwarm.group.visible = selectedObjectRef.current === 'dual-hands';
    scene.add(orbSwarm.group);
    orbSwarmRef.current = orbSwarm;

    // Window helper for high-quality snapshot capture
    (window as unknown as { __captureSpatialSceneSnapshot?: () => string }).__captureSpatialSceneSnapshot = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return '';
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      return rendererRef.current.domElement.toDataURL('image/png');
    };

    // 8. Interactive 3D Models
    const quantumCore = new QuantumCore();
    quantumCore.group.visible = selectedObjectRef.current === 'quantum-core';
    scene.add(quantumCore.group);
    quantumCoreRef.current = quantumCore;

    const cyberGlobe = new CyberGlobe();
    cyberGlobe.group.visible = selectedObjectRef.current === 'cyber-globe';
    scene.add(cyberGlobe.group);
    cyberGlobeRef.current = cyberGlobe;

    const hypercube = new Hypercube();
    hypercube.group.visible = selectedObjectRef.current === 'hypercube';
    scene.add(hypercube.group);
    hypercubeRef.current = hypercube;

    // 9. Cosmic Space Objects
    const blackHole = new BlackHoleGargantua();
    blackHole.group.visible = selectedObjectRef.current === 'black-hole';
    scene.add(blackHole.group);
    blackHoleRef.current = blackHole;

    const solarSystem = new SolarSystemOrbit();
    solarSystem.group.visible = selectedObjectRef.current === 'solar-system-orbit';
    scene.add(solarSystem.group);
    solarSystemRef.current = solarSystem;

    const saturn = new RingedSaturnPlanet();
    saturn.group.visible = selectedObjectRef.current === 'saturn-ringed';
    scene.add(saturn.group);
    saturnRef.current = saturn;

    const supernova = new SupernovaPulsarStar();
    supernova.group.visible = selectedObjectRef.current === 'supernova-star';
    scene.add(supernova.group);
    supernovaRef.current = supernova;

    // 9. 60 FPS Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const renderTick = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const m = metricsRef.current;
      const sens = sensitivityRef.current;

      if (ambientStarsRef.current) {
        ambientStarsRef.current.rotation.y = time * 0.02;
      }

      const leftActive = Boolean(m.leftHand && m.leftHand.isDetected);
      const rightActive = Boolean(m.rightHand && m.rightHand.isDetected);

      // 1. LEFT HAND SKELETON & MODEL
      if (leftActive && m.leftHand) {
        const tx = m.leftHand.position.x * 2.4 * sens;
        const ty = m.leftHand.position.y * 1.8 * sens;
        const tz = m.leftHand.position.z * 1.5 * sens;
        leftTargetPos.current.set(tx, ty, tz);

        if (leftHandModelRef.current) {
          leftHandModelRef.current.group.visible = true;
          leftHandModelRef.current.updateFingers(m.leftHand.fingerBends);
          leftHandModelRef.current.group.rotation.set(
            THREE.MathUtils.degToRad(m.leftHand.rotation.pitch),
            THREE.MathUtils.degToRad(m.leftHand.rotation.yaw),
            THREE.MathUtils.degToRad(m.leftHand.rotation.roll)
          );

          const scale = Math.max(0.32, Math.min(0.85, 0.52 + tz * 0.2));
          leftHandModelRef.current.group.scale.set(scale, scale, scale);
        }
      } else {
        leftTargetPos.current.set(-0.65, Math.sin(time * 2) * 0.06, 0);
        if (leftHandModelRef.current) {
          // If right hand is active, hide inactive left hand so only active hand is visible!
          // If neither hand is active, keep visible in idle resting mode.
          leftHandModelRef.current.group.visible = !rightActive;
          leftHandModelRef.current.group.scale.set(0.52, 0.52, 0.52);
        }
      }

      // 2. RIGHT HAND SKELETON & MODEL
      if (rightActive && m.rightHand) {
        const tx = m.rightHand.position.x * 2.4 * sens;
        const ty = m.rightHand.position.y * 1.8 * sens;
        const tz = m.rightHand.position.z * 1.5 * sens;
        rightTargetPos.current.set(tx, ty, tz);

        if (rightHandModelRef.current) {
          rightHandModelRef.current.group.visible = true;
          rightHandModelRef.current.updateFingers(m.rightHand.fingerBends);
          rightHandModelRef.current.group.rotation.set(
            THREE.MathUtils.degToRad(m.rightHand.rotation.pitch),
            THREE.MathUtils.degToRad(m.rightHand.rotation.yaw),
            THREE.MathUtils.degToRad(m.rightHand.rotation.roll)
          );

          const scale = Math.max(0.32, Math.min(0.85, 0.52 + tz * 0.2));
          rightHandModelRef.current.group.scale.set(scale, scale, scale);
        }
      } else {
        rightTargetPos.current.set(0.65, Math.sin(time * 2 + 1) * 0.06, 0);
        if (rightHandModelRef.current) {
          // If left hand is active, hide inactive right hand so only active hand is visible!
          rightHandModelRef.current.group.visible = !leftActive;
          rightHandModelRef.current.group.scale.set(0.52, 0.52, 0.52);
        }
      }

      // Smooth position interpolation for both hands
      leftCurrentPos.current.x = THREE.MathUtils.damp(leftCurrentPos.current.x, leftTargetPos.current.x, 22, delta);
      leftCurrentPos.current.y = THREE.MathUtils.damp(leftCurrentPos.current.y, leftTargetPos.current.y, 22, delta);
      leftCurrentPos.current.z = THREE.MathUtils.damp(leftCurrentPos.current.z, leftTargetPos.current.z, 22, delta);

      rightCurrentPos.current.x = THREE.MathUtils.damp(rightCurrentPos.current.x, rightTargetPos.current.x, 22, delta);
      rightCurrentPos.current.y = THREE.MathUtils.damp(rightCurrentPos.current.y, rightTargetPos.current.y, 22, delta);
      rightCurrentPos.current.z = THREE.MathUtils.damp(rightCurrentPos.current.z, rightTargetPos.current.z, 22, delta);

      if (leftHandModelRef.current && leftHandModelRef.current.group.visible) {
        leftHandModelRef.current.group.position.copy(leftCurrentPos.current);
      }
      if (rightHandModelRef.current && rightHandModelRef.current.group.visible) {
        rightHandModelRef.current.group.position.copy(rightCurrentPos.current);
      }

      const zeroRot = { pitch: 0, yaw: 0, roll: 0 };
      const leftRot = m.leftHand?.rotation || zeroRot;
      const rightRot = m.rightHand?.rotation || zeroRot;

      // 3. COMPUTE UNIFIED SPHERE TARGET POSITION & ACTIVE ROTATION
      // ("ham bitta qo'lda ham ikta qo'l bn ham boshqarsa bo'ladigan bo'lish kerak")
      if (leftActive && rightActive) {
        // Controlled by BOTH hands: sits at the midpoint between the hands!
        unifiedTargetPos.current.set(
          (leftCurrentPos.current.x + rightCurrentPos.current.x) / 2,
          (leftCurrentPos.current.y + rightCurrentPos.current.y) / 2,
          (leftCurrentPos.current.z + rightCurrentPos.current.z) / 2
        );
      } else if (rightActive) {
        // Controlled by RIGHT HAND alone
        unifiedTargetPos.current.copy(rightCurrentPos.current);
      } else if (leftActive) {
        // Controlled by LEFT HAND alone
        unifiedTargetPos.current.copy(leftCurrentPos.current);
      } else {
        // Idle hovering in center
        unifiedTargetPos.current.set(0, Math.sin(time * 1.5) * 0.05, 0);
      }

      let activeRot = zeroRot;
      if (leftActive && rightActive) {
        activeRot = {
          pitch: (leftRot.pitch + rightRot.pitch) / 2,
          yaw: (leftRot.yaw + rightRot.yaw) / 2,
          roll: (leftRot.roll + rightRot.roll) / 2,
        };
      } else if (rightActive) {
        activeRot = rightRot;
      } else if (leftActive) {
        activeRot = leftRot;
      }

      // 4. COMPUTE EXPANSION / CONTRACTION RATIO ("bir biriga yaqinlashtirsam zichlashib ketursin, kotta yoysam yoyilib ketsin")
      const computeHandOpenness = (hand: typeof m.leftHand) => {
        if (!hand) return 0.5;
        const b = hand.fingerBends;
        // Average curl across all 5 fingers (1.0 = clenched fist, 0.0 = wide open palm)
        const avgCurl = (b[0] + b[1] + b[2] + b[3] + b[4]) / 5;
        const pinch = hand.isPinching ? 0.35 : 0;
        const curl = Math.min(1.0, Math.max(0.0, avgCurl * 0.85 + pinch));
        // Direct responsive openness: 0.0 (curled) to 1.0 (wide open spread)
        return THREE.MathUtils.clamp((1.0 - curl - 0.1) / 0.75, 0, 1);
      };

      let expansionRatio = 0.45;
      if (leftActive && rightActive) {
        const leftOpen = computeHandOpenness(m.leftHand);
        const rightOpen = computeHandOpenness(m.rightHand);
        const avgOpen = (leftOpen + rightOpen) / 2;
        // When hands approach (< 0.22m), distFactor = 0 (tightly condensed: zichlashgan).
        // When hands spread apart (> 0.65m), distFactor = 1.0 (massively dispersed: yoyilgan).
        const distFactor = THREE.MathUtils.clamp((m.handDistance - 0.20) / 0.45, 0, 1);
        // Both finger openness and distance between hands expand the swarm:
        expansionRatio = THREE.MathUtils.clamp(
          Math.max(avgOpen, distFactor) * 0.6 + (avgOpen * 0.5 + distFactor * 0.5) * 0.4,
          0,
          1
        );
      } else if (rightActive) {
        // Single right hand: curling = 0.0 (dense), spreading wide = 1.0 (disperse)
        expansionRatio = computeHandOpenness(m.rightHand);
      } else if (leftActive) {
        // Single left hand: curling = 0.0 (dense), spreading wide = 1.0 (disperse)
        expansionRatio = computeHandOpenness(m.leftHand);
      }

      // 5. AUDIO CUES & KINETIC BURST DETECTION ON COMPRESSION & EXPANSION
      // Fast explosive opening (bukilgan holdan birdan keng yoyilganda zarba to'lqini paydo bo'ladi)
      if (prevExpansionRef.current < 0.25 && expansionRatio > 0.65) {
        if (orbSwarmRef.current) {
          orbSwarmRef.current.triggerShockwave();
        }
        spatialAudio.playShockwaveBurst();
      }
      prevExpansionRef.current = THREE.MathUtils.damp(prevExpansionRef.current, expansionRatio, 15, delta);

      if (expansionRatio < 0.20 && !wasCondensedActive.current) {
        spatialAudio.playPinchGrab();
        wasCondensedActive.current = true;
      } else if (expansionRatio > 0.40) {
        wasCondensedActive.current = false;
      }

      if (expansionRatio > 0.72 && !wasExpandedActive.current) {
        spatialAudio.playRelease();
        wasExpandedActive.current = true;
      } else if (expansionRatio < 0.50) {
        wasExpandedActive.current = false;
      }

      // 6. UPDATE SINGLE UNIFIED QUANTUM ORB SWARM ("bitta sharikcha")
      if (orbSwarmRef.current && orbSwarmRef.current.group.visible) {
        orbSwarmRef.current.update(
          unifiedTargetPos.current,
          activeRot,
          expansionRatio,
          false,
          time,
          delta
        );
      }

      // 7. UPDATE QUANTUM CORE ("Kvant Yadrosi")
      if (quantumCoreRef.current && quantumCoreRef.current.group.visible) {
        const core = quantumCoreRef.current;
        core.group.position.x = THREE.MathUtils.damp(core.group.position.x, unifiedTargetPos.current.x, 18, delta);
        core.group.position.y = THREE.MathUtils.damp(core.group.position.y, unifiedTargetPos.current.y, 18, delta);
        core.group.position.z = THREE.MathUtils.damp(core.group.position.z, unifiedTargetPos.current.z, 18, delta);

        core.group.rotation.x = THREE.MathUtils.degToRad(activeRot.pitch);
        core.group.rotation.y = THREE.MathUtils.degToRad(activeRot.yaw);
        core.group.rotation.z = THREE.MathUtils.degToRad(activeRot.roll);

        // Scales with buklash/yoyish!
        const targetScale = 0.35 + expansionRatio * 1.35;
        const curScale = core.group.scale.x;
        const nextScale = THREE.MathUtils.damp(curScale, targetScale, 15, delta);
        core.group.scale.set(nextScale, nextScale, nextScale);

        const speedMultiplier = 1 + (1 - expansionRatio);
        core.update(time, speedMultiplier);
      }

      // 8. UPDATE CYBER GLOBE ("Kiber Globus")
      if (cyberGlobeRef.current && cyberGlobeRef.current.group.visible) {
        const globe = cyberGlobeRef.current;
        globe.group.position.x = THREE.MathUtils.damp(globe.group.position.x, unifiedTargetPos.current.x, 18, delta);
        globe.group.position.y = THREE.MathUtils.damp(globe.group.position.y, unifiedTargetPos.current.y, 18, delta);
        globe.group.position.z = THREE.MathUtils.damp(globe.group.position.z, unifiedTargetPos.current.z, 18, delta);

        globe.group.rotation.x = THREE.MathUtils.degToRad(activeRot.pitch);
        globe.group.rotation.y = THREE.MathUtils.degToRad(activeRot.yaw);
        globe.group.rotation.z = THREE.MathUtils.degToRad(activeRot.roll);

        const targetScale = 0.35 + expansionRatio * 1.35;
        const curScale = globe.group.scale.x;
        const nextScale = THREE.MathUtils.damp(curScale, targetScale, 15, delta);
        globe.group.scale.set(nextScale, nextScale, nextScale);

        const speedMultiplier = 1 + (1 - expansionRatio);
        globe.update(time, speedMultiplier);
      }

      // 9. UPDATE HYPERCUBE ("Giperkub 4D")
      if (hypercubeRef.current && hypercubeRef.current.group.visible) {
        const cube = hypercubeRef.current;
        cube.group.position.x = THREE.MathUtils.damp(cube.group.position.x, unifiedTargetPos.current.x, 18, delta);
        cube.group.position.y = THREE.MathUtils.damp(cube.group.position.y, unifiedTargetPos.current.y, 18, delta);
        cube.group.position.z = THREE.MathUtils.damp(cube.group.position.z, unifiedTargetPos.current.z, 18, delta);

        cube.group.rotation.x = THREE.MathUtils.degToRad(activeRot.pitch);
        cube.group.rotation.y = THREE.MathUtils.degToRad(activeRot.yaw);
        cube.group.rotation.z = THREE.MathUtils.degToRad(activeRot.roll);

        const targetScale = 0.35 + expansionRatio * 1.35;
        const curScale = cube.group.scale.x;
        const nextScale = THREE.MathUtils.damp(curScale, targetScale, 15, delta);
        cube.group.scale.set(nextScale, nextScale, nextScale);

        const speedMultiplier = 1 + (1 - expansionRatio);
        cube.update(time, speedMultiplier);
      }

      // 10. UPDATE BLACK HOLE GARGANTUA ("Qora Tuynuk")
      if (blackHoleRef.current && blackHoleRef.current.group.visible) {
        const bh = blackHoleRef.current;
        bh.group.position.x = THREE.MathUtils.damp(bh.group.position.x, unifiedTargetPos.current.x, 18, delta);
        bh.group.position.y = THREE.MathUtils.damp(bh.group.position.y, unifiedTargetPos.current.y, 18, delta);
        bh.group.position.z = THREE.MathUtils.damp(bh.group.position.z, unifiedTargetPos.current.z, 18, delta);

        bh.group.rotation.x = THREE.MathUtils.degToRad(activeRot.pitch);
        bh.group.rotation.y = THREE.MathUtils.degToRad(activeRot.yaw);
        bh.group.rotation.z = THREE.MathUtils.degToRad(activeRot.roll);

        const targetScale = 0.4 + expansionRatio * 1.4;
        const curScale = bh.group.scale.x;
        const nextScale = THREE.MathUtils.damp(curScale, targetScale, 15, delta);
        bh.group.scale.set(nextScale, nextScale, nextScale);

        const speedMultiplier = 1 + (1 - expansionRatio) * 1.5;
        bh.update(time, speedMultiplier);
      }

      // 11. UPDATE SOLAR SYSTEM ("Quyosh Tizimi Orbitasi")
      if (solarSystemRef.current && solarSystemRef.current.group.visible) {
        const sol = solarSystemRef.current;
        sol.group.position.x = THREE.MathUtils.damp(sol.group.position.x, unifiedTargetPos.current.x, 18, delta);
        sol.group.position.y = THREE.MathUtils.damp(sol.group.position.y, unifiedTargetPos.current.y, 18, delta);
        sol.group.position.z = THREE.MathUtils.damp(sol.group.position.z, unifiedTargetPos.current.z, 18, delta);

        sol.group.rotation.x = THREE.MathUtils.degToRad(activeRot.pitch);
        sol.group.rotation.y = THREE.MathUtils.degToRad(activeRot.yaw);
        sol.group.rotation.z = THREE.MathUtils.degToRad(activeRot.roll);

        const targetScale = 0.45 + expansionRatio * 1.5;
        const curScale = sol.group.scale.x;
        const nextScale = THREE.MathUtils.damp(curScale, targetScale, 15, delta);
        sol.group.scale.set(nextScale, nextScale, nextScale);

        const speedMultiplier = 1 + (1 - expansionRatio);
        sol.update(time, speedMultiplier);
      }

      // 12. UPDATE RINGED SATURN ("Halqali Saturn")
      if (saturnRef.current && saturnRef.current.group.visible) {
        const sat = saturnRef.current;
        sat.group.position.x = THREE.MathUtils.damp(sat.group.position.x, unifiedTargetPos.current.x, 18, delta);
        sat.group.position.y = THREE.MathUtils.damp(sat.group.position.y, unifiedTargetPos.current.y, 18, delta);
        sat.group.position.z = THREE.MathUtils.damp(sat.group.position.z, unifiedTargetPos.current.z, 18, delta);

        sat.group.rotation.x = THREE.MathUtils.degToRad(activeRot.pitch);
        sat.group.rotation.y = THREE.MathUtils.degToRad(activeRot.yaw);
        sat.group.rotation.z = THREE.MathUtils.degToRad(activeRot.roll);

        const targetScale = 0.35 + expansionRatio * 1.35;
        const curScale = sat.group.scale.x;
        const nextScale = THREE.MathUtils.damp(curScale, targetScale, 15, delta);
        sat.group.scale.set(nextScale, nextScale, nextScale);

        const speedMultiplier = 1 + (1 - expansionRatio);
        sat.update(time, speedMultiplier);
      }

      // 13. UPDATE SUPERNOVA PULSAR ("Supernova Neytron Yulduzi")
      if (supernovaRef.current && supernovaRef.current.group.visible) {
        const sn = supernovaRef.current;
        sn.group.position.x = THREE.MathUtils.damp(sn.group.position.x, unifiedTargetPos.current.x, 18, delta);
        sn.group.position.y = THREE.MathUtils.damp(sn.group.position.y, unifiedTargetPos.current.y, 18, delta);
        sn.group.position.z = THREE.MathUtils.damp(sn.group.position.z, unifiedTargetPos.current.z, 18, delta);

        sn.group.rotation.x = THREE.MathUtils.degToRad(activeRot.pitch);
        sn.group.rotation.y = THREE.MathUtils.degToRad(activeRot.yaw);
        sn.group.rotation.z = THREE.MathUtils.degToRad(activeRot.roll);

        const targetScale = 0.35 + expansionRatio * 1.45;
        const curScale = sn.group.scale.x;
        const nextScale = THREE.MathUtils.damp(curScale, targetScale, 15, delta);
        sn.group.scale.set(nextScale, nextScale, nextScale);

        const speedMultiplier = 1 + (1 - expansionRatio) * 1.8;
        sn.update(time, speedMultiplier);
      }

      // RENDER
      const renderer = rendererRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (vrModeRef.current && leftEyeCameraRef.current && rightEyeCameraRef.current) {
        const halfWidth = width / 2;
        renderer?.setScissorTest(true);

        renderer?.setViewport(0, 0, halfWidth, height);
        renderer?.setScissor(0, 0, halfWidth, height);
        leftEyeCameraRef.current.aspect = halfWidth / height;
        leftEyeCameraRef.current.updateProjectionMatrix();
        renderer?.render(scene, leftEyeCameraRef.current);

        renderer?.setViewport(halfWidth, 0, halfWidth, height);
        renderer?.setScissor(halfWidth, 0, halfWidth, height);
        rightEyeCameraRef.current.aspect = halfWidth / height;
        rightEyeCameraRef.current.updateProjectionMatrix();
        renderer?.render(scene, rightEyeCameraRef.current);

        renderer?.setScissorTest(false);
      } else if (cameraRef.current) {
        renderer?.setViewport(0, 0, width, height);
        renderer?.setScissorTest(false);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        renderer?.render(scene, cameraRef.current);
      }

      animationFrameId = requestAnimationFrame(renderTick);
    };

    animationFrameId = requestAnimationFrame(renderTick);

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      delete (window as unknown as { __captureSpatialSceneSnapshot?: () => string }).__captureSpatialSceneSnapshot;
      if (rendererRef.current?.domElement && container.contains(rendererRef.current.domElement)) {
        rendererRef.current.dispose();
        container.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Environment styling
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (environment === 'cyber-space') {
      scene.background = new THREE.Color(0x020617);
      scene.fog = new THREE.FogExp2(0x020617, 0.03);
      if (gridFloorRef.current) {
        gridFloorRef.current.visible = true;
        (gridFloorRef.current.material as THREE.MeshStandardMaterial).color.setHex(0x0284c7);
      }
      if (deepNebulaRef.current) deepNebulaRef.current.visible = false;
    } else if (environment === 'deep-cosmos') {
      // Endless Infinite Deep Cosmos
      scene.background = new THREE.Color(0x010208);
      scene.fog = new THREE.FogExp2(0x010208, 0.015);
      if (gridFloorRef.current) {
        gridFloorRef.current.visible = false; // Hide grid floor for true 360 space
      }
      if (deepNebulaRef.current) deepNebulaRef.current.visible = true;
    } else if (environment === 'solar-system') {
      // Warm Solar Heliocentric Space
      scene.background = new THREE.Color(0x05040a);
      scene.fog = new THREE.FogExp2(0x05040a, 0.018);
      if (gridFloorRef.current) {
        gridFloorRef.current.visible = true;
        (gridFloorRef.current.material as THREE.MeshStandardMaterial).color.setHex(0xd97706);
      }
      if (deepNebulaRef.current) deepNebulaRef.current.visible = true;
    } else if (environment === 'nebula-void') {
      // Cosmic Nebula with Rich Violet Violet Glow
      scene.background = new THREE.Color(0x0b0416);
      scene.fog = new THREE.FogExp2(0x0b0416, 0.02);
      if (gridFloorRef.current) {
        gridFloorRef.current.visible = false;
      }
      if (deepNebulaRef.current) deepNebulaRef.current.visible = true;
    } else if (environment === 'matrix-grid') {
      scene.background = new THREE.Color(0x021508);
      scene.fog = new THREE.FogExp2(0x021508, 0.04);
      if (gridFloorRef.current) {
        gridFloorRef.current.visible = true;
        (gridFloorRef.current.material as THREE.MeshStandardMaterial).color.setHex(0x10b981);
      }
      if (deepNebulaRef.current) deepNebulaRef.current.visible = false;
    } else if (environment === 'holo-lab') {
      scene.background = new THREE.Color(0x0c0a1f);
      scene.fog = new THREE.FogExp2(0x0c0a1f, 0.03);
      if (gridFloorRef.current) {
        gridFloorRef.current.visible = true;
        (gridFloorRef.current.material as THREE.MeshStandardMaterial).color.setHex(0xa855f7);
      }
      if (deepNebulaRef.current) deepNebulaRef.current.visible = false;
    } else if (environment === 'minimal-studio') {
      scene.background = new THREE.Color(0x0f172a);
      scene.fog = new THREE.FogExp2(0x0f172a, 0.025);
      if (gridFloorRef.current) {
        gridFloorRef.current.visible = true;
        (gridFloorRef.current.material as THREE.MeshStandardMaterial).color.setHex(0x64748b);
      }
      if (deepNebulaRef.current) deepNebulaRef.current.visible = false;
    }
  }, [environment]);

  // Object switcher visibility
  useEffect(() => {
    if (orbSwarmRef.current) {
      orbSwarmRef.current.group.visible = selectedObject === 'dual-hands';
    }
    if (quantumCoreRef.current) {
      quantumCoreRef.current.group.visible = selectedObject === 'quantum-core';
    }
    if (cyberGlobeRef.current) {
      cyberGlobeRef.current.group.visible = selectedObject === 'cyber-globe';
    }
    if (hypercubeRef.current) {
      hypercubeRef.current.group.visible = selectedObject === 'hypercube';
    }
    if (blackHoleRef.current) {
      blackHoleRef.current.group.visible = selectedObject === 'black-hole';
    }
    if (solarSystemRef.current) {
      solarSystemRef.current.group.visible = selectedObject === 'solar-system-orbit';
    }
    if (saturnRef.current) {
      saturnRef.current.group.visible = selectedObject === 'saturn-ringed';
    }
    if (supernovaRef.current) {
      supernovaRef.current.group.visible = selectedObject === 'supernova-star';
    }
  }, [selectedObject]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* VR Stereo Divider */}
      {isVRMode && (
        <div className="absolute inset-0 pointer-events-none flex justify-center items-center z-10">
          <div className="w-[2px] h-full bg-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
          <div className="absolute top-4 left-6 text-xs text-cyan-400 font-mono tracking-widest bg-black/60 px-2 py-1 rounded border border-cyan-500/30">
            VR LEFT EYE [CAM_L]
          </div>
          <div className="absolute top-4 right-6 text-xs text-cyan-400 font-mono tracking-widest bg-black/60 px-2 py-1 rounded border border-cyan-500/30">
            VR RIGHT EYE [CAM_R]
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-xs text-slate-400 font-mono bg-black/70 px-4 py-1.5 rounded-full border border-slate-700">
            VR Ko&apos;zlik uchun stereoskopik ko&apos;rish rejimi faol
          </div>
        </div>
      )}
    </div>
  );
};
