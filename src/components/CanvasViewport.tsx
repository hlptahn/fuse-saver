import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MaterialLibrary } from '../engine/materials';
import { WorldManager } from '../engine/worldManager';
import { proceduralAudio } from '../audio/proceduralAudio';
import { AppSettings, CameraMode, ComponentSpec } from '../types';

interface CanvasViewportProps {
  settings: AppSettings;
  onSelectComponent: (spec: ComponentSpec | null) => void;
  onCloseInspector?: () => void;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  worldManagerRef: React.MutableRefObject<WorldManager | null>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  settings,
  onSelectComponent,
  onCloseInspector,
  onUpdateSettings,
  worldManagerRef,
  cameraRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<AppSettings>(settings);
  settingsRef.current = settings;

  const prevModeRef = useRef<CameraMode>(settings.cameraMode);
  useEffect(() => {
    if (prevModeRef.current !== settings.cameraMode) {
      const oldMode = prevModeRef.current;
      const newMode = settings.cameraMode;
      prevModeRef.current = newMode;

      if (worldManagerRef.current && cameraRef.current) {
        if (newMode === 'manual') {
          worldManagerRef.current.syncCameraToManual(cameraRef.current);
        } else if (oldMode === 'manual' && newMode === 'screensaver') {
          worldManagerRef.current.syncManualToScreensaver(cameraRef.current);
        }
      }
    }
  }, [settings.cameraMode, worldManagerRef, cameraRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Three.js Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // 3. Scene, Camera & Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d10);
    scene.fog = new THREE.FogExp2(0x0a0d10, 0.014);

    const camera = new THREE.PerspectiveCamera(
      62,
      container.clientWidth / container.clientHeight,
      0.1,
      600
    );
    camera.position.set(0, 5, 0);
    cameraRef.current = camera;

    // 4. Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig
    // Warm key directional light with tight shadow frustum
    const keyLight = new THREE.DirectionalLight(0xffecd4, 1.8);
    keyLight.position.set(12, 28, 16);
    keyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      const d = 35;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 100;
    }
    scene.add(keyLight);

    // Cool sky/ground fill light
    const hemiLight = new THREE.HemisphereLight(0x28384a, 0x0f151c, 1.2);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    // Subtle orange accent rim light
    const rimLight = new THREE.PointLight(0xff5500, 2.5, 45, 1.5);
    rimLight.position.set(0, 8, 10);
    scene.add(rimLight);

    // 6. Materials & World Manager
    const materials = new MaterialLibrary();
    const worldManager = new WorldManager(scene, materials);
    worldManagerRef.current = worldManager;

    // Pre-warm shaders
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 7. Pointer interaction for manual flight and click-to-inspect
    let isPointerDown = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let pointerMovementDist = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 0) {
        isPointerDown = true;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
        pointerMovementDist = 0;
      }
    };

    const onPointerUp = () => {
      isPointerDown = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isPointerDown) {
        const deltaX = e.clientX - prevPointerX;
        const deltaY = e.clientY - prevPointerY;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
        pointerMovementDist += Math.hypot(deltaX, deltaY);

        if (settingsRef.current.cameraMode === 'manual') {
          worldManager.manualRot.y -= deltaX * 0.003;
          worldManager.manualRot.x -= deltaY * 0.003;
          worldManager.manualRot.x = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, worldManager.manualRot.x));
        }
      }
    };

    // Raycast click on inspectable electrical objects
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      // Ignore click if pointer moved more than 5px (was a drag)
      if (pointerMovementDist > 5) {
        return;
      }
      // Ignore if clicking on UI buttons
      if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, camera);
      const inspectables = worldManager.getInspectableObjects();
      const intersects = raycaster.intersectObjects(inspectables, true);

      if (intersects.length > 0) {
        // Find ancestor with userData.spec
        let curr: THREE.Object3D | null = intersects[0].object;
        let foundSpec: ComponentSpec | null = null;
        let foundTarget: THREE.Object3D | null = null;

        while (curr && curr !== scene) {
          if (curr.userData && curr.userData.spec) {
            foundSpec = curr.userData.spec as ComponentSpec;
            foundTarget = curr;
            break;
          }
          curr = curr.parent;
        }

        if (foundSpec && foundTarget) {
          worldManager.inspectedTarget = foundTarget;
          onSelectComponent(foundSpec);
          onUpdateSettings({ cameraMode: 'inspect' });
          worldManager.sparkSystem.triggerBurst(intersects[0].point, 25, true);
        }
      }
    };

    const isInputElement = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
    };

    // Keyboard bindings
    const onKeyDown = (e: KeyboardEvent) => {
      if (isInputElement(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') worldManager.setManualControl('forward', true);
      if (key === 's' || key === 'arrowdown') worldManager.setManualControl('backward', true);
      if (key === 'a' || key === 'arrowleft') worldManager.setManualControl('left', true);
      if (key === 'd' || key === 'arrowright') worldManager.setManualControl('right', true);
      if (key === 'q') worldManager.setManualControl('down', true);
      if (key === 'e') worldManager.setManualControl('up', true);

      if (key === ' ') {
        const isButtonOrInput = e.target instanceof HTMLElement && (
          e.target.tagName.toLowerCase() === 'button' ||
          e.target.tagName.toLowerCase() === 'input' ||
          e.target.closest('button')
        );
        if (!isButtonOrInput) {
          e.preventDefault();
        }
        worldManager.triggerSparkAtCameraTarget(camera);
      }
      if (key === 'h') {
        onUpdateSettings({ zenMode: !settingsRef.current.zenMode });
      }
      if (key === 'f') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
      if (key === 'escape') {
        if (onCloseInspector) {
          onCloseInspector();
        }
      }
      if (key === '1') worldManager.jumpToSector('micro_pcb', camera.position.z);
      if (key === '2') worldManager.jumpToSector('industrial_fuses', camera.position.z);
      if (key === '3') worldManager.jumpToSector('busbar_trench', camera.position.z);
      if (key === '4') worldManager.jumpToSector('transformer_substation', camera.position.z);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isInputElement(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') worldManager.setManualControl('forward', false);
      if (key === 's' || key === 'arrowdown') worldManager.setManualControl('backward', false);
      if (key === 'a' || key === 'arrowleft') worldManager.setManualControl('left', false);
      if (key === 'd' || key === 'arrowright') worldManager.setManualControl('right', false);
      if (key === 'q') worldManager.setManualControl('down', false);
      if (key === 'e') worldManager.setManualControl('up', false);
    };

    const onBlur = () => {
      worldManager.setManualControl('forward', false);
      worldManager.setManualControl('backward', false);
      worldManager.setManualControl('left', false);
      worldManager.setManualControl('right', false);
      worldManager.setManualControl('up', false);
      worldManager.setManualControl('down', false);
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // 8. Resize Listener
    const onResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // 9. Continuous Animation Loop with Performance Guard
    let frameId = 0;
    let prevTime = performance.now();
    let slowTimeAccumulator = 0;
    let performanceGuardApplied = isSoftwareGl;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const now = performance.now();
      const rawDt = (now - prevTime) * 0.001;
      prevTime = now;
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent physics/flight jumps

      // Performance guard: lower pixel ratio to 1 and disable shadows if average frame time > 30ms for 3s
      if (!performanceGuardApplied) {
        if (rawDt > 0.030) {
          slowTimeAccumulator += rawDt;
          if (slowTimeAccumulator >= 3.0) {
            performanceGuardApplied = true;
            renderer.setPixelRatio(1);
            renderer.shadowMap.enabled = false;
            keyLight.castShadow = false;
          }
        } else {
          slowTimeAccumulator = Math.max(0, slowTimeAccumulator - rawDt * 0.5);
        }
      }

      const currentSettings = settingsRef.current;

      // Update procedural world and camera
      worldManager.update(
        dt,
        camera,
        currentSettings.cameraMode,
        currentSettings.speed,
        currentSettings.currentIntensity,
        currentSettings.sparksEnabled
      );

      // Keep key light following camera along Z
      keyLight.position.set(camera.position.x + 12, camera.position.y + 24, camera.position.z + 16);
      keyLight.target.position.set(camera.position.x, camera.position.y, camera.position.z + 10);
      keyLight.target.updateMatrixWorld();

      rimLight.position.set(camera.position.x, camera.position.y + 2, camera.position.z + 4);

      // Modulate procedural audio with speed
      proceduralAudio.updateFlightSpeed(currentSettings.speed);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);

      worldManager.dispose();
      materials.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full absolute inset-0 cursor-crosshair overflow-hidden"
      data-testid="webgl-canvas-viewport"
    />
  );
};
