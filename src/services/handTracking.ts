import { DualHandMetrics, SingleHandData, GestureType, Landmark3D } from '../types/tracking';

declare global {
  interface Window {
    Hands?: any;
    Camera?: any;
  }
}

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
}

export class HandTrackingManager {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;

  // MediaPipe engine
  private mediaPipeHands: any = null;
  private isMediaPipeReady: boolean = false;
  private isProcessingFrame: boolean = false; // Prevents queue buildup & eliminates freeze!

  // Runtime state
  private isRunning: boolean = false;
  private isCameraActive: boolean = false;
  private activeStream: MediaStream | null = null;
  private smoothingFactor: number = 0.35;
  private onMetricsUpdate: ((metrics: DualHandMetrics) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  // Smoothing buffers for Left Hand
  private leftPos = { x: -0.8, y: 0, z: 0 };
  private leftRot = { pitch: 0, yaw: 0, roll: 0 };
  private leftPinch = 0.5;
  private leftBends: [number, number, number, number, number] = [0, 0, 0, 0, 0];

  // Smoothing buffers for Right Hand
  private rightPos = { x: 0.8, y: 0, z: 0 };
  private rightRot = { pitch: 0, yaw: 0, roll: 0 };
  private rightPinch = 0.5;
  private rightBends: [number, number, number, number, number] = [0, 0, 0, 0, 0];

  private lastTimestamp = performance.now();
  private frameCount = 0;
  private currentFps = 60;
  private lastFpsUpdate = performance.now();
  private lastMediaPipeDetection = 0;

  // Simulation mode
  private isSimulationMode: boolean = false;
  private simTime: number = 0;
  private animFrameId: number = 0;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 160;
    this.offscreenCanvas.height = 120;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  public setSmoothing(factor: number) {
    this.smoothingFactor = Math.max(0.05, Math.min(0.9, factor));
  }

  public setOnMetricsUpdate(callback: (metrics: DualHandMetrics) => void) {
    this.onMetricsUpdate = callback;
  }

  public setOnError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  public async getAvailableCameras(): Promise<CameraDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Kamera ${i + 1}`,
        }));
    } catch {
      return [];
    }
  }

  public async startCamera(
    video: HTMLVideoElement,
    overlayCanvas: HTMLCanvasElement,
    preferredDeviceId?: string
  ): Promise<{ success: boolean; error?: string }> {
    this.videoElement = video;
    this.canvasElement = overlayCanvas;
    this.stopSimulation();
    this.stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = "Brauzeringizda kamera qo'llab-quvvatlanmaydi.";
      this.reportError(err);
      return { success: false, error: err };
    }

    let stream: MediaStream | null = null;
    let lastErr: any = null;

    const constraintTiers: MediaStreamConstraints[] = [
      preferredDeviceId
        ? { video: { deviceId: { exact: preferredDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } } }
        : { video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } },
      { video: { facingMode: 'user' } },
      { video: true },
    ];

    for (const constraints of constraintTiers) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err: any) {
        lastErr = err;
      }
    }

    if (!stream) {
      let friendlyError = 'Kameraga ulanib bo‘lmadi.';
      if (lastErr) {
        if (lastErr.name === 'NotAllowedError' || lastErr.name === 'PermissionDeniedError') {
          friendlyError = 'Kameraga ruxsat berilmadi. Iltimos, brauzer manzil satridagi qulf (🔒) belgisini bosib ruxsat bering.';
        } else if (lastErr.name === 'NotFoundError') {
          friendlyError = 'Qurilmangizda kamera topilmadi.';
        } else if (lastErr.name === 'NotReadableError') {
          friendlyError = 'Kamera boshqa dastur tomonidan band qilingan.';
        }
      }
      this.reportError(friendlyError);
      return { success: false, error: friendlyError };
    }

    this.activeStream = stream;
    this.videoElement.srcObject = stream;

    try {
      await new Promise<void>((resolve) => {
        if (!this.videoElement) return resolve();
        this.videoElement.onloadedmetadata = () => {
          this.videoElement?.play().then(resolve).catch(resolve);
        };
        setTimeout(resolve, 1500);
      });
    } catch {
      // pass
    }

    this.isCameraActive = true;
    this.isRunning = true;

    // Initialize 2-Hand MediaPipe & processing loop
    this.initMediaPipeAsync();
    this.startDetectionLoop();

    return { success: true };
  }

  private reportError(msg: string) {
    if (this.onErrorCallback) {
      this.onErrorCallback(msg);
    }
  }

  private async initMediaPipeAsync() {
    let retries = 0;
    while (!window.Hands && retries < 15) {
      await new Promise((r) => setTimeout(r, 200));
      retries++;
    }

    if (window.Hands && this.videoElement) {
      try {
        const hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        // CRITICAL: maxNumHands: 2 to track BOTH hands simultaneously!
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 0, // Lite model: ultra fast, zero stuttering or CPU freezing!
          minDetectionConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });

        hands.onResults((results: any) => {
          this.isProcessingFrame = false; // Unlock next frame
          this.handleMediaPipeResults(results);
        });

        this.mediaPipeHands = hands;
        this.isMediaPipeReady = true;
      } catch (e) {
        console.warn('MediaPipe load warning:', e);
      }
    }
  }

  /**
   * High performance throttle loop: guarantees zero freezing by awaiting previous frame completion!
   */
  private startDetectionLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

    const frameLoop = () => {
      if (!this.isRunning || !this.videoElement) return;

      const video = this.videoElement;
      if (video.readyState >= 2 && !video.paused) {
        // Only send if MediaPipe is not currently busy processing the previous frame!
        if (this.isMediaPipeReady && this.mediaPipeHands && !this.isProcessingFrame) {
          this.isProcessingFrame = true;
          try {
            this.mediaPipeHands.send({ image: video }).catch(() => {
              this.isProcessingFrame = false;
            });
          } catch {
            this.isProcessingFrame = false;
          }
        }

        // Fast fallback if MediaPipe has been idle
        const now = performance.now();
        if (now - this.lastMediaPipeDetection > 100) {
          this.processDualOpticalCV(video);
        }
      }

      this.animFrameId = requestAnimationFrame(frameLoop);
    };

    this.animFrameId = requestAnimationFrame(frameLoop);
  }

  /**
   * Dual Hand MediaPipe Result Processor
   */
  private handleMediaPipeResults(results: any) {
    const now = performance.now();
    this.lastMediaPipeDetection = now;
    const latency = Math.round(now - this.lastTimestamp);
    this.lastTimestamp = now;

    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    const rawHands = results.multiHandLandmarks || [];
    const handednessList = results.multiHandedness || [];

    // Clear and draw dual skeletons on video overlay
    this.drawDualSkeletons(rawHands);

    let leftHandData: SingleHandData | null = null;
    let rightHandData: SingleHandData | null = null;

    for (let i = 0; i < rawHands.length; i++) {
      const lms = rawHands[i];
      // MediaPipe selfie mode handedness is mirrored:
      // label 'Left' in selfie view is physically the user's Right hand, and vice versa!
      const rawLabel = handednessList[i]?.label || (lms[0].x > 0.5 ? 'Left' : 'Right');
      const isRightHand = rawLabel === 'Left'; // Mirrored selfie camera correction
      const handedness: 'Left' | 'Right' = isRightHand ? 'Right' : 'Left';

      const processed = this.processSingleHand(lms, handedness);

      if (handedness === 'Left') {
        leftHandData = processed;
      } else {
        rightHandData = processed;
      }
    }

    // Two-hand synergy metrics
    let handDistance = 2.0;
    let isFused = false;
    let isHeartGesture = false;

    if (leftHandData && rightHandData) {
      // 3D Distance between left hand palm and right hand palm
      handDistance = Math.hypot(
        leftHandData.position.x - rightHandData.position.x,
        leftHandData.position.y - rightHandData.position.y,
        leftHandData.position.z - rightHandData.position.z
      );

      // Fused / Zichlashgan when hands are brought close together!
      isFused = handDistance < 0.40;
      isHeartGesture = false; // Heart gesture disabled per user request
    }

    if (this.onMetricsUpdate) {
      this.onMetricsUpdate({
        isDetected: rawHands.length > 0,
        handCount: rawHands.length,
        leftHand: leftHandData,
        rightHand: rightHandData,
        handDistance: Number(handDistance.toFixed(3)),
        isFused,
        isHeartGesture,
        fps: this.currentFps,
        latencyMs: latency,
      });
    }
  }

  private processSingleHand(landmarks: { x: number; y: number; z: number }[], handedness: 'Left' | 'Right'): SingleHandData {
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    const indexMcp = landmarks[5];
    const pinkyMcp = landmarks[17];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    // Invert X because camera is mirrored
    const rawX = (1 - (wrist.x + middleMcp.x) / 2 - 0.5) * 2;
    const rawY = -((wrist.y + middleMcp.y) / 2 - 0.5) * 2;

    // Depth estimation: hand scale in camera
    const palmScale = Math.hypot(pinkyMcp.x - indexMcp.x, pinkyMcp.y - indexMcp.y);
    // When user pulls hand further away: palmScale shrinks -> Z decreases (goes deeper into screen)
    // When user brings hand closer: palmScale increases -> Z increases (comes forward)
    const rawZ = Math.min(1.8, Math.max(-1.8, (palmScale - 0.16) * 7.5));

    const prevPos = handedness === 'Left' ? this.leftPos : this.rightPos;
    const prevRot = handedness === 'Left' ? this.leftRot : this.rightRot;
    const sf = this.smoothingFactor;

    const posX = prevPos.x + (rawX - prevPos.x) * sf;
    const posY = prevPos.y + (rawY - prevPos.y) * sf;
    const posZ = prevPos.z + (rawZ - prevPos.z) * sf;

    const distMoved = Math.hypot(posX - prevPos.x, posY - prevPos.y, posZ - prevPos.z);
    const velocity = Math.min(5.0, Number((distMoved * 20).toFixed(2)));

    if (handedness === 'Left') {
      this.leftPos = { x: posX, y: posY, z: posZ };
    } else {
      this.rightPos = { x: posX, y: posY, z: posZ };
    }

    // Orientation
    const dx = -(middleMcp.x - wrist.x);
    const dy = -(middleMcp.y - wrist.y);
    const roll = (Math.atan2(dx, dy) * 180) / Math.PI;
    const pitch = Math.min(60, Math.max(-60, (middleMcp.z - wrist.z) * 180));
    const yaw = Math.min(60, Math.max(-60, (pinkyMcp.z - indexMcp.z) * 180));

    const smoothRot = {
      pitch: Number((prevRot.pitch + (pitch - prevRot.pitch) * sf).toFixed(1)),
      yaw: Number((prevRot.yaw + (yaw - prevRot.yaw) * sf).toFixed(1)),
      roll: Number((prevRot.roll + (roll - prevRot.roll) * sf).toFixed(1)),
    };

    if (handedness === 'Left') this.leftRot = smoothRot;
    else this.rightRot = smoothRot;

    // Pinch calculation
    const rawPinch = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y) / (palmScale * 1.2);
    const prevPinch = handedness === 'Left' ? this.leftPinch : this.rightPinch;
    const pinchDistance = prevPinch + (rawPinch - prevPinch) * 0.45;
    if (handedness === 'Left') this.leftPinch = pinchDistance;
    else this.rightPinch = pinchDistance;

    const isPinching = pinchDistance < 0.28;
    const pinchStrength = Math.min(1, Math.max(0, (0.35 - pinchDistance) / 0.35));

    // Finger curl calculation
    const computeCurl = (mcp: any, tip: any) => {
      const dTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
      const dMcp = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
      const ratio = dTip / (dMcp * 1.8);
      return Math.min(1, Math.max(0, (1.1 - ratio) / 0.5));
    };

    const prevBends = handedness === 'Left' ? this.leftBends : this.rightBends;
    const fingerBends: [number, number, number, number, number] = [
      prevBends[0] + (computeCurl(landmarks[2], thumbTip) - prevBends[0]) * 0.35,
      prevBends[1] + (computeCurl(indexMcp, indexTip) - prevBends[1]) * 0.35,
      prevBends[2] + (computeCurl(middleMcp, middleTip) - prevBends[2]) * 0.35,
      prevBends[3] + (computeCurl(landmarks[14], ringTip) - prevBends[3]) * 0.35,
      prevBends[4] + (computeCurl(pinkyMcp, pinkyTip) - prevBends[4]) * 0.35,
    ];
    if (handedness === 'Left') this.leftBends = fingerBends;
    else this.rightBends = fingerBends;

    let gesture: GestureType = 'NONE';
    if (isPinching) gesture = 'PINCH';
    else if (fingerBends[1] > 0.65 && fingerBends[2] > 0.65 && fingerBends[3] > 0.65 && fingerBends[4] > 0.65) gesture = 'FIST';
    else if (fingerBends[1] < 0.3 && fingerBends[2] > 0.6 && fingerBends[3] > 0.6) gesture = 'POINTING';
    else if (fingerBends[1] < 0.3 && fingerBends[2] < 0.3 && fingerBends[3] < 0.3 && fingerBends[4] < 0.3) gesture = 'OPEN_PALM';

    const landmarks3D: Landmark3D[] = landmarks.map((lm) => ({
      x: (1 - lm.x - 0.5) * 2,
      y: -(lm.y - 0.5) * 2,
      z: -lm.z * 2,
    }));

    return {
      id: handedness,
      handedness,
      isDetected: true,
      landmarks: landmarks3D,
      position: { x: Number(posX.toFixed(3)), y: Number(posY.toFixed(3)), z: Number(posZ.toFixed(3)) },
      rotation: smoothRot,
      pinchDistance: Number(pinchDistance.toFixed(3)),
      pinchStrength: Number(pinchStrength.toFixed(3)),
      isPinching,
      gesture,
      fingerBends,
      velocity,
    };
  }

  private drawDualSkeletons(rawHands: any[]) {
    if (!this.canvasElement) return;
    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!rawHands || rawHands.length === 0) return;

    const w = canvas.width;
    const h = canvas.height;

    const CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];

    rawHands.forEach((landmarks, handIdx) => {
      // Color left hand cyan, right hand purple
      const neonColor = handIdx === 0 ? '#06b6d4' : '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = neonColor;
      ctx.shadowColor = neonColor;
      ctx.shadowBlur = 8;

      for (const [start, end] of CONNECTIONS) {
        const p1 = landmarks[start];
        const p2 = landmarks[end];
        if (!p1 || !p2) continue;

        ctx.beginPath();
        ctx.moveTo((1 - p1.x) * w, p1.y * h);
        ctx.lineTo((1 - p2.x) * w, p2.y * h);
        ctx.stroke();
      }

      for (let i = 0; i < landmarks.length; i++) {
        const p = landmarks[i];
        const isTip = [4, 8, 12, 16, 20].includes(i);
        ctx.beginPath();
        ctx.arc((1 - p.x) * w, p.y * h, isTip ? 5 : 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = isTip ? '#10b981' : '#ffffff';
        ctx.fill();
      }
    });
  }

  /**
   * Fast Dual Optical CV Fallback if MediaPipe is not ready
   */
  private processDualOpticalCV(video: HTMLVideoElement) {
    if (!this.offscreenCtx) return;
    const ctx = this.offscreenCtx;
    const w = this.offscreenCanvas.width;
    const h = this.offscreenCanvas.height;

    ctx.drawImage(video, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let leftCount = 0, rightCount = 0;
    let leftSumX = 0, leftSumY = 0;
    let rightSumX = 0, rightSumY = 0;

    // Split screen in half to track left & right hands separately!
    for (let y = 0; y < h; y += 3) {
      for (let x = 0; x < w; x += 3) {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const isSkin = (r > 60 && g > 25 && b > 15 && r > g && r > b && (r - g) > 8);
        if (isSkin) {
          if (x < w / 2) {
            rightCount++; // Mirrored selfie: screen left is user right
            rightSumX += x;
            rightSumY += y;
          } else {
            leftCount++;
            leftSumX += x;
            leftSumY += y;
          }
        }
      }
    }

    const minPx = (w * h) * 0.003;
    let leftHandData: SingleHandData | null = null;
    let rightHandData: SingleHandData | null = null;

    if (leftCount > minPx) {
      const cx = leftSumX / leftCount;
      const cy = leftSumY / leftCount;
      const normX = (1 - cx / w - 0.5) * 2;
      const normY = -(cy / h - 0.5) * 2;
      this.leftPos = { x: normX, y: normY, z: 0 };

      leftHandData = {
        id: 'Left',
        handedness: 'Left',
        isDetected: true,
        landmarks: [],
        position: this.leftPos,
        rotation: { pitch: 0, yaw: 0, roll: 0 },
        pinchDistance: 0.5,
        pinchStrength: 0,
        isPinching: false,
        gesture: 'OPEN_PALM',
        fingerBends: [0.1, 0.1, 0.1, 0.1, 0.1],
        velocity: 0.5,
      };
    }

    if (rightCount > minPx) {
      const cx = rightSumX / rightCount;
      const cy = rightSumY / rightCount;
      const normX = (1 - cx / w - 0.5) * 2;
      const normY = -(cy / h - 0.5) * 2;
      this.rightPos = { x: normX, y: normY, z: 0 };

      rightHandData = {
        id: 'Right',
        handedness: 'Right',
        isDetected: true,
        landmarks: [],
        position: this.rightPos,
        rotation: { pitch: 0, yaw: 0, roll: 0 },
        pinchDistance: 0.5,
        pinchStrength: 0,
        isPinching: false,
        gesture: 'OPEN_PALM',
        fingerBends: [0.1, 0.1, 0.1, 0.1, 0.1],
        velocity: 0.5,
      };
    }

    const handDistance = (leftHandData && rightHandData)
      ? Math.hypot(this.leftPos.x - this.rightPos.x, this.leftPos.y - this.rightPos.y)
      : 2.0;

    if (this.onMetricsUpdate) {
      this.onMetricsUpdate({
        isDetected: leftCount > minPx || rightCount > minPx,
        handCount: (leftCount > minPx ? 1 : 0) + (rightCount > minPx ? 1 : 0),
        leftHand: leftHandData,
        rightHand: rightHandData,
        handDistance: Number(handDistance.toFixed(3)),
        isFused: handDistance < 0.45,
        isHeartGesture: handDistance < 0.35,
        fps: 60,
        latencyMs: 10,
      });
    }
  }

  public startSimulation() {
    this.isSimulationMode = true;
    this.stopCamera();

    const loop = () => {
      if (!this.isSimulationMode) return;
      this.simTime += 0.03;
      const t = this.simTime;

      // Realistic dual-hand dance: coming together (zichlashish), spreading apart (yoyilish)!
      const distCycle = (Math.sin(t * 0.6) + 1) / 2; // 0 (close) to 1 (far)

      const leftX = -0.25 - distCycle * 0.85;
      const rightX = 0.25 + distCycle * 0.85;
      const y = Math.cos(t * 0.5) * 0.3;
      const z = Math.sin(t * 0.4) * 0.3;

      const handDist = Math.hypot(leftX - rightX, 0);

      const curlCycle = (Math.sin(t * 0.9) + 1) / 2; // 0 (spread) to 1 (curled/fist)
      const bends: [number, number, number, number, number] = [
        curlCycle * 0.85, curlCycle * 0.85, curlCycle * 0.85, curlCycle * 0.85, curlCycle * 0.85
      ];

      const leftData: SingleHandData = {
        id: 'Left',
        handedness: 'Left',
        isDetected: true,
        landmarks: [],
        position: { x: Number(leftX.toFixed(3)), y: Number(y.toFixed(3)), z: Number(z.toFixed(3)) },
        rotation: { pitch: Math.sin(t) * 15, yaw: Math.cos(t) * 15, roll: Math.sin(t * 0.7) * 20 },
        pinchDistance: 0.5,
        pinchStrength: 0,
        isPinching: curlCycle > 0.8,
        gesture: curlCycle > 0.6 ? 'FIST' : 'OPEN_PALM',
        fingerBends: bends,
        velocity: 0.8,
      };

      const rightData: SingleHandData = {
        id: 'Right',
        handedness: 'Right',
        isDetected: true,
        landmarks: [],
        position: { x: Number(rightX.toFixed(3)), y: Number(y.toFixed(3)), z: Number(z.toFixed(3)) },
        rotation: { pitch: Math.sin(t) * 15, yaw: -Math.cos(t) * 15, roll: -Math.sin(t * 0.7) * 20 },
        pinchDistance: 0.5,
        pinchStrength: 0,
        isPinching: curlCycle > 0.8,
        gesture: curlCycle > 0.6 ? 'FIST' : 'OPEN_PALM',
        fingerBends: bends,
        velocity: 0.8,
      };

      if (this.onMetricsUpdate) {
        this.onMetricsUpdate({
          isDetected: true,
          handCount: 2,
          leftHand: leftData,
          rightHand: rightData,
          handDistance: Number(handDist.toFixed(3)),
          isFused: handDist < 0.40,
          isHeartGesture: false,
          fps: 60,
          latencyMs: 10,
        });
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stopSimulation() {
    this.isSimulationMode = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  public stopCamera() {
    this.isRunning = false;
    this.isCameraActive = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
    if (this.activeStream) {
      this.activeStream.getTracks().forEach((track) => track.stop());
      this.activeStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  public destroy() {
    this.stopCamera();
    this.stopSimulation();
  }
}
