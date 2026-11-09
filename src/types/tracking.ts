export type GestureType = 
  | 'NONE'
  | 'PINCH'
  | 'FIST'
  | 'OPEN_PALM'
  | 'POINTING'
  | 'PEACE'
  | 'THUMBS_UP'
  | 'HEART';

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
}

export interface SingleHandData {
  id: string;
  handedness: 'Left' | 'Right';
  isDetected: boolean;
  landmarks: Landmark3D[];
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
  pinchDistance: number;
  pinchStrength: number;
  isPinching: boolean;
  gesture: GestureType;
  fingerBends: [number, number, number, number, number];
  velocity: number;
}

export interface DualHandMetrics {
  isDetected: boolean;
  handCount: number;
  leftHand: SingleHandData | null;
  rightHand: SingleHandData | null;
  // Two-hand synergy metrics
  handDistance: number; // distance between left and right hand
  isFused: boolean; // hands are brought together
  isHeartGesture: boolean; // user made a heart shape with both hands 🫶
  fps: number;
  latencyMs: number;
}

export type SceneEnvironment = 
  | 'cyber-space' 
  | 'deep-cosmos' 
  | 'solar-system' 
  | 'nebula-void' 
  | 'matrix-grid' 
  | 'holo-lab' 
  | 'minimal-studio';

export type SpatialObjectType = 
  | 'dual-hands' 
  | 'black-hole' 
  | 'solar-system-orbit' 
  | 'saturn-ringed' 
  | 'supernova-star' 
  | 'quantum-core' 
  | 'cyber-globe' 
  | 'hypercube';

export type ParticleColorTheme = 
  | 'quantum-cyan' 
  | 'solar-gold' 
  | 'matrix-emerald' 
  | 'cosmic-amethyst' 
  | 'prismatic-aurora';

