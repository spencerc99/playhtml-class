// ABOUTME: Full-screen 3D bench page for the /3d route.
// ABOUTME: Renders two GLTF chairs with adjustable bench panels, shadows, and transparent PNG export.

import {
  Center,
  ContactShadows,
  Environment,
  OrbitControls,
  useGLTF,
} from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import {
  ACESFilmicToneMapping,
  Color,
  CanvasTexture,
  PCFSoftShadowMap,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';
import type { Material, Mesh, Object3D, Texture } from 'three';

interface SceneControls {
  ambientIntensity: number;
  chairColorVariance: number;
  chairCount: number;
  chairDistance: number;
  chairMisalignment: number;
  chairOffsetX: number;
  chairOffsetY: number;
  chairOffsetZ: number;
  chairScale: number;
  contactShadowBlur: number;
  contactShadowScale: number;
  envBlur: number;
  envIntensity: number;
  exportScale: number;
  fillLightIntensity: number;
  keyLightIntensity: number;
  keyLightX: number;
  keyLightY: number;
  keyLightZ: number;
  layoutPreset: string;
  panelColorA: string;
  panelColorB: string;
  panelCount: number;
  panelDepth: number;
  panelGap: number;
  panelHeight: number;
  panelBumpScale: number;
  panelClearcoat: number;
  panelClearcoatRoughness: number;
  panelMetalness: number;
  panelOffsetX: number;
  panelOffsetY: number;
  panelOffsetZ: number;
  panelRoughness: number;
  panelThickness: number;
  panelThicknessVariance: number;
  panelWidth: number;
  panelYVariance: number;
  renderDprMax: number;
  scatterRadius: number;
  scatterSeed: number;
  shadowBias: number;
  shadowMapSize: number;
  shadowOpacity: number;
  shadowPlaneY: number;
  shadowRadius: number;
  toneExposure: number;
}

const DEFAULT_CONTROLS: SceneControls = {
  ambientIntensity: 0.45,
  chairColorVariance: 0.03,
  chairCount: 2,
  chairDistance: 1.9,
  chairMisalignment: 0.22,
  chairOffsetX: 0,
  chairOffsetY: 0,
  chairOffsetZ: 0,
  chairScale: 1,
  contactShadowBlur: 2.5,
  contactShadowScale: 6,
  envBlur: 0.35,
  envIntensity: 0.35,
  exportScale: 1,
  fillLightIntensity: 0.35,
  keyLightIntensity: 1.25,
  keyLightX: 5,
  keyLightY: 7,
  keyLightZ: 4,
  layoutPreset: 'classic',
  panelColorA: '#bc8451',
  panelColorB: '#a76f3d',
  panelCount: 2,
  panelDepth: 0.3,
  panelGap: 0.42,
  panelHeight: 0.84,
  panelBumpScale: 0.03,
  panelClearcoat: 0.35,
  panelClearcoatRoughness: 0.42,
  panelMetalness: 0.05,
  panelOffsetX: 0,
  panelOffsetY: 0,
  panelOffsetZ: 0,
  panelRoughness: 0.6,
  panelThickness: 0.09,
  panelThicknessVariance: 0.02,
  panelWidth: 2.7,
  panelYVariance: 0.06,
  renderDprMax: 2,
  scatterRadius: 5,
  scatterSeed: 1337,
  shadowBias: -0.0001,
  shadowMapSize: 2048,
  shadowOpacity: 0.4,
  shadowPlaneY: -0.95,
  shadowRadius: 4,
  toneExposure: 1.12,
};

const LOCAL_STORAGE_KEY = 'bench-scene-controls-v1';

const LAYOUT_PRESETS = [
  { chairCount: 2, id: 'classic', label: 'Classic - 2 chairs', panelCount: 1 },
  { chairCount: 4, id: 'duo', label: 'Duo - 4 chairs', panelCount: 3 },
  { chairCount: 6, id: 'trio', label: 'Trio - 6 chairs', panelCount: 5 },
  { chairCount: 8, id: 'quad', label: 'Quad - 8 chairs', panelCount: 7 },
] as const;

const NUMBER_INPUT_STYLE = {
  background: 'rgba(255, 255, 255, 0.85)',
  border: '1px solid rgba(0, 0, 0, 0.18)',
  borderRadius: '6px',
  color: '#222',
  fontSize: '12px',
  padding: '2px 6px',
  width: '70px',
} as const;

function mergeStoredControls(raw: unknown): SceneControls {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_CONTROLS;
  }

  const stored = raw as Record<string, unknown>;
  const merged = { ...DEFAULT_CONTROLS } as Record<keyof SceneControls, number | string>;

  for (const key of Object.keys(DEFAULT_CONTROLS) as Array<keyof SceneControls>) {
    const fallback = DEFAULT_CONTROLS[key];
    const next = stored[key as string];

    if (typeof fallback === 'number' && typeof next === 'number' && Number.isFinite(next)) {
      merged[key] = next;
      continue;
    }

    if (typeof fallback === 'string' && typeof next === 'string') {
      merged[key] = next;
    }
  }

  return merged as SceneControls;
}

function loadStoredControls(): SceneControls {
  if (typeof window === 'undefined') {
    return DEFAULT_CONTROLS;
  }

  try {
    const serialized = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!serialized) return DEFAULT_CONTROLS;
    const merged = mergeStoredControls(JSON.parse(serialized));

    if (!LAYOUT_PRESETS.some((preset) => preset.id === merged.layoutPreset)) {
      merged.layoutPreset = DEFAULT_CONTROLS.layoutPreset;
    }

    return merged;
  } catch {
    return DEFAULT_CONTROLS;
  }
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

interface ChairPlacement {
  rotationY: number;
  x: number;
  z: number;
}

interface PanelLink {
  from: number;
  thicknessOffset: number;
  to: number;
  yOffset: number;
}

function buildChairPlacements({
  chairCount,
  chairDistance,
  radius,
  seed,
}: {
  chairCount: number;
  chairDistance: number;
  radius: number;
  seed: number;
}) {
  if (chairCount <= 1) {
    return [{ rotationY: 0, x: 0, z: 0 }];
  }

  const random = createSeededRandom(seed || 1);
  const placements: ChairPlacement[] = [];
  const spreadRadius = Math.max(1.5, radius);
  const minDistance = Math.max(1.2, chairDistance * 0.75);
  const minDistanceSquared = minDistance * minDistance;

  for (let index = 0; index < chairCount; index += 1) {
    let x = 0;
    let z = 0;
    let foundSpot = false;

    for (let attempt = 0; attempt < 140; attempt += 1) {
      const angle = random() * Math.PI * 2;
      const radialDistance = Math.sqrt(random()) * spreadRadius;
      x = Math.cos(angle) * radialDistance;
      z = Math.sin(angle) * radialDistance;

      const overlapping = placements.some((existing) => {
        const dx = existing.x - x;
        const dz = existing.z - z;
        return dx * dx + dz * dz < minDistanceSquared;
      });

      if (!overlapping) {
        foundSpot = true;
        break;
      }
    }

    if (!foundSpot) {
      const fallbackAngle = (index / chairCount) * Math.PI * 2;
      x = Math.cos(fallbackAngle) * spreadRadius;
      z = Math.sin(fallbackAngle) * spreadRadius;
    }

    placements.push({
      // Store normalized yaw jitter so each chair can lean in the same rotational direction.
      rotationY: random(),
      x,
      z,
    });
  }

  return placements;
}

function buildPanelLinks({
  chairCount,
  panelCount,
  thicknessVariance,
  yVariance,
  seed,
}: {
  chairCount: number;
  panelCount: number;
  thicknessVariance: number;
  yVariance: number;
  seed: number;
}) {
  if (chairCount < 2 || panelCount < 1) {
    return [] as PanelLink[];
  }

  const random = createSeededRandom((seed ^ 0x9e3779b9) >>> 0);
  const maxEdges = (chairCount * (chairCount - 1)) / 2;
  const desiredEdges = Math.min(maxEdges, Math.max(1, Math.round(panelCount)));
  const links: PanelLink[] = [];
  const usedPairs = new Set<string>();

  while (links.length < desiredEdges) {
    const a = Math.floor(random() * chairCount);
    const b = Math.floor(random() * chairCount);
    if (a === b) continue;

    const min = Math.min(a, b);
    const max = Math.max(a, b);
    if (min === max) continue;
    const key = `${min}-${max}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);
    links.push({
      from: min,
      thicknessOffset: (random() * 2 - 1) * Math.max(0, thicknessVariance),
      to: max,
      yOffset: (random() * 2 - 1) * Math.max(0, yVariance),
    });
  }

  return links;
}

function createWoodCanvas(kind: 'albedo' | 'bump' | 'roughness') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;

  const context = canvas.getContext('2d');
  if (!context) {
    return canvas;
  }

  const random = createSeededRandom(kind === 'albedo' ? 1337 : kind === 'roughness' ? 7901 : 2024);
  const { height, width } = canvas;

  if (kind === 'albedo') {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#8c643f');
    gradient.addColorStop(0.5, '#7b5434');
    gradient.addColorStop(1, '#6d492f');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    for (let y = 0; y < height; y += 1) {
      const sine = Math.sin(y * 0.12 + random() * 0.8);
      const grain = 70 + sine * 26 + random() * 40;
      const red = Math.round(grain + 55);
      const green = Math.round(grain + 16);
      const blue = Math.round(grain - 24);
      context.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.22)`;
      context.fillRect(0, y, width, 1);
    }

    for (let i = 0; i < 36; i += 1) {
      const x = random() * width;
      const y = random() * height;
      const radiusX = 7 + random() * 19;
      const radiusY = 2 + random() * 6;
      context.fillStyle = `rgba(48, 27, 15, ${0.08 + random() * 0.14})`;
      context.beginPath();
      context.ellipse(x, y, radiusX, radiusY, random() * Math.PI, 0, Math.PI * 2);
      context.fill();
    }

    return canvas;
  }

  const baseTone = kind === 'roughness' ? 165 : 130;
  context.fillStyle = `rgb(${baseTone}, ${baseTone}, ${baseTone})`;
  context.fillRect(0, 0, width, height);

  for (let y = 0; y < height; y += 1) {
    const sine = Math.sin(y * 0.13 + random() * 0.9);
    const value = Math.max(0, Math.min(255, Math.round(baseTone + sine * 45 + random() * 35)));
    context.fillStyle = `rgb(${value}, ${value}, ${value})`;
    context.fillRect(0, y, width, 1);
  }

  for (let i = 0; i < 1400; i += 1) {
    const x = random() * width;
    const y = random() * height;
    const intensity = Math.round(baseTone + (random() - 0.5) * 100);
    const alpha = kind === 'roughness' ? 0.12 : 0.22;
    context.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, ${alpha})`;
    context.fillRect(x, y, 1 + random() * 2, 1 + random() * 2);
  }

  return canvas;
}

function useWoodTextures() {
  const textures = useMemo(() => {
    const albedo = new CanvasTexture(createWoodCanvas('albedo'));
    const roughness = new CanvasTexture(createWoodCanvas('roughness'));
    const bump = new CanvasTexture(createWoodCanvas('bump'));

    albedo.colorSpace = SRGBColorSpace;

    for (const texture of [albedo, roughness, bump]) {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.needsUpdate = true;
    }

    return { albedo, bump, roughness };
  }, []);

  useEffect(() => {
    return () => {
      textures.albedo.dispose();
      textures.roughness.dispose();
      textures.bump.dispose();
    };
  }, [textures]);

  return textures;
}

function setMeshShadows(root: Object3D) {
  root.traverse((child) => {
    if ('isMesh' in child && child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function TintedChair({
  scene,
  scale,
  tintShift,
}: {
  scene: Object3D;
  scale: number;
  tintShift: number;
}) {
  const tintedScene = useMemo(() => {
    const clonedScene = scene.clone(true);
    clonedScene.traverse((child) => {
      if (!('isMesh' in child) || !child.isMesh) return;

      const mesh = child as Mesh;
      const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const tintedMaterials = sourceMaterials.map((source) => {
        const tinted = source.clone();
        if ('color' in tinted && tinted.color instanceof Color) {
          const hsl = { h: 0, l: 0, s: 0 };
          tinted.color.getHSL(hsl);
          tinted.color.setHSL(
            hsl.h,
            clamp01(hsl.s + tintShift * 0.3),
            clamp01(hsl.l + tintShift),
          );
        }

        return tinted;
      });

      mesh.material = Array.isArray(mesh.material) ? tintedMaterials : tintedMaterials[0];
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    return clonedScene;
  }, [scene, tintShift]);

  useEffect(() => {
    return () => {
      tintedScene.traverse((child) => {
        if (!('isMesh' in child) || !child.isMesh) return;

        const mesh = child as Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => (material as Material).dispose());
      });
    };
  }, [tintedScene]);

  return (
    <Center>
      <primitive object={tintedScene} scale={scale} />
    </Center>
  );
}

function ChairPair({
  controls,
  placements,
}: {
  controls: SceneControls;
  placements: ChairPlacement[];
}) {
  const { scene } = useGLTF('/models/scene.gltf');
  const chairScale = 0.01 * controls.chairScale;

  useEffect(() => {
    setMeshShadows(scene);
  }, [scene]);

  return (
    <>
      {placements.map((placement, index) => {
        const tintShift = (placement.rotationY * 2 - 1) * controls.chairColorVariance;
        return (
          <group
            key={`chair-${index}`}
            position={[controls.chairOffsetX + placement.x, 0, controls.chairOffsetZ + placement.z]}
            rotation={[0, placement.rotationY * controls.chairMisalignment, 0]}
          >
            <group position={[0, controls.chairOffsetY, 0]}>
              <TintedChair scale={chairScale} scene={scene} tintShift={tintShift} />
            </group>
          </group>
        );
      })}
    </>
  );
}

function BenchTopPanels({
  controls,
  links,
  placements,
}: {
  controls: SceneControls;
  links: PanelLink[];
  placements: ChairPlacement[];
}) {
  const { gl } = useThree();
  const textures = useWoodTextures();
  const panelWidth = Math.max(controls.panelWidth, 1);

  useEffect(() => {
    const anisotropy = gl.capabilities.getMaxAnisotropy();
    const xRepeat = Math.max(1, panelWidth * 0.9);
    const yRepeat = Math.max(1, controls.panelDepth * 5);

    for (const texture of Object.values(textures) as Texture[]) {
      texture.anisotropy = anisotropy;
      texture.repeat.set(xRepeat, yRepeat);
      texture.needsUpdate = true;
    }
  }, [controls.panelDepth, gl, panelWidth, textures]);

  return (
    <>
      {links.map((link, panelIndex) => {
        const from = placements[link.from];
        const to = placements[link.to];
        if (!from || !to) return null;

        const dx = to.x - from.x;
        const dz = to.z - from.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < 0.001) return null;

        const panelLength = Math.max(panelWidth, distance + controls.panelGap);
        const panelThickness = Math.max(0.01, controls.panelThickness + link.thicknessOffset);
        const midX = (from.x + to.x) / 2 + controls.chairOffsetX + controls.panelOffsetX;
        const midZ = (from.z + to.z) / 2 + controls.chairOffsetZ + controls.panelOffsetZ;
        const rotationY = Math.atan2(dx, dz);
        const panelY = controls.panelHeight + controls.panelOffsetY + link.yOffset;

        return (
          <group
            key={`panel-link-${link.from}-${link.to}`}
            position={[midX, panelY, midZ]}
            rotation={[0, rotationY, 0]}
          >
            <mesh castShadow receiveShadow>
              <boxGeometry args={[controls.panelDepth, panelThickness, panelLength]} />
              <meshPhysicalMaterial
                bumpMap={textures.bump}
                bumpScale={controls.panelBumpScale}
                clearcoat={controls.panelClearcoat}
                clearcoatRoughness={controls.panelClearcoatRoughness}
                color={panelIndex % 2 === 0 ? controls.panelColorA : controls.panelColorB}
                envMapIntensity={1.1}
                map={textures.albedo}
                metalness={controls.panelMetalness}
                roughnessMap={textures.roughness}
                roughness={controls.panelRoughness}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function RendererSettings({ controls }: { controls: SceneControls }) {
  const { gl } = useThree();

  useEffect(() => {
    gl.outputColorSpace = SRGBColorSpace;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = PCFSoftShadowMap;
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = controls.toneExposure;
  }, [controls.toneExposure, gl]);

  return null;
}

function BenchScene({ controls }: { controls: SceneControls }) {
  const chairCount = Math.max(2, Math.round(controls.chairCount));
  const placements = useMemo(
    () =>
      buildChairPlacements({
        chairCount,
        chairDistance: controls.chairDistance,
        radius: controls.scatterRadius,
        seed: controls.scatterSeed,
      }),
    [
      chairCount,
      controls.chairDistance,
      controls.scatterRadius,
      controls.scatterSeed,
    ],
  );
  const panelLinks = useMemo(
    () =>
      buildPanelLinks({
        chairCount,
        panelCount: Math.max(1, Math.round(controls.panelCount)),
        thicknessVariance: controls.panelThicknessVariance,
        yVariance: controls.panelYVariance,
        seed: controls.scatterSeed,
      }),
    [
      chairCount,
      controls.panelCount,
      controls.panelThicknessVariance,
      controls.panelYVariance,
      controls.scatterSeed,
    ],
  );
  const shadowCoverage = Math.max(
    controls.contactShadowScale,
    controls.scatterRadius * 2.6 + controls.chairDistance * 2.2,
  );
  const shadowFrustumHalfSize = Math.max(
    6,
    shadowCoverage * 0.6 +
      Math.max(Math.abs(controls.chairOffsetX), Math.abs(controls.panelOffsetX)) +
      Math.max(Math.abs(controls.chairOffsetZ), Math.abs(controls.panelOffsetZ)),
  );
  const shadowCameraFar = Math.max(
    24,
    shadowFrustumHalfSize * 4 +
      Math.abs(controls.panelHeight + controls.panelOffsetY - controls.shadowPlaneY) * 2,
  );
  const shadowPlaneSize = Math.max(20, shadowCoverage * 3);

  return (
    <>
      <RendererSettings controls={controls} />
      <ambientLight intensity={controls.ambientIntensity} />
      <directionalLight
        castShadow
        intensity={controls.keyLightIntensity}
        position={[controls.keyLightX, controls.keyLightY, controls.keyLightZ]}
        shadow-bias={controls.shadowBias}
        shadow-camera-bottom={-shadowFrustumHalfSize}
        shadow-camera-far={shadowCameraFar}
        shadow-camera-left={-shadowFrustumHalfSize}
        shadow-camera-near={0.1}
        shadow-camera-right={shadowFrustumHalfSize}
        shadow-camera-top={shadowFrustumHalfSize}
        shadow-mapSize-height={controls.shadowMapSize}
        shadow-mapSize-width={controls.shadowMapSize}
        shadow-radius={controls.shadowRadius}
      />
      <directionalLight intensity={controls.fillLightIntensity} position={[-4, 3, -5]} />
      <Environment
        blur={controls.envBlur}
        environmentIntensity={controls.envIntensity}
        preset="warehouse"
      />
      <Suspense fallback={null}>
        <group position={[0, -0.2, 0]}>
          <ChairPair controls={controls} placements={placements} />
          <BenchTopPanels controls={controls} links={panelLinks} placements={placements} />
        </group>
      </Suspense>
      <ContactShadows
        blur={Math.max(0.15, controls.contactShadowBlur * 0.32)}
        far={4}
        opacity={Math.min(1, controls.shadowOpacity * 1.55 + 0.12)}
        position={[0, controls.shadowPlaneY + 0.01, 0]}
        resolution={2048}
        scale={Math.max(1.25, shadowCoverage * 0.72)}
      />
      <ContactShadows
        blur={Math.max(0.3, controls.contactShadowBlur)}
        far={8}
        opacity={Math.min(1, controls.shadowOpacity * 0.62)}
        position={[0, controls.shadowPlaneY + 0.005, 0]}
        resolution={1024}
        scale={shadowCoverage}
      />
      <mesh position={[0, controls.shadowPlaneY, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[shadowPlaneSize, shadowPlaneSize]} />
        <shadowMaterial opacity={controls.shadowOpacity * 0.5} transparent />
      </mesh>
      <OrbitControls enableDamping makeDefault maxPolarAngle={Math.PI / 2.01} />
    </>
  );
}

function FieldGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <fieldset
      style={{
        border: '1px solid rgba(0, 0, 0, 0.15)',
        borderRadius: '8px',
        margin: 0,
        padding: '8px',
      }}
    >
      <legend style={{ fontSize: '12px', fontWeight: 700, padding: '0 4px' }}>{title}</legend>
      <div style={{ display: 'grid', gap: '8px' }}>{children}</div>
    </fieldset>
  );
}

function NumberControl({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  const updateFromRange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value)),
    [onChange],
  );

  return (
    <label style={{ display: 'grid', gap: '4px' }}>
      <span style={{ fontSize: '12px', fontWeight: 600 }}>{label}</span>
      <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
        <input
          max={max}
          min={min}
          onChange={updateFromRange}
          step={step}
          style={{ flex: 1 }}
          type="range"
          value={value}
        />
        <input
          max={max}
          min={min}
          onChange={updateFromRange}
          step={step}
          style={NUMBER_INPUT_STYLE}
          type="number"
          value={value}
        />
      </div>
    </label>
  );
}

function ColorControl({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label style={{ alignItems: 'center', display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '12px', fontWeight: 600 }}>{label}</span>
      <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
        <input
          onChange={(event) => onChange(event.target.value)}
          style={{ height: '26px', width: '32px' }}
          type="color"
          value={value}
        />
        <input
          onChange={(event) => onChange(event.target.value)}
          style={NUMBER_INPUT_STYLE}
          type="text"
          value={value}
        />
      </div>
    </label>
  );
}

function SelectControl({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label style={{ display: 'grid', gap: '4px' }}>
      <span style={{ fontSize: '12px', fontWeight: 600 }}>{label}</span>
      <select
        onChange={(event) => onChange(event.target.value)}
        style={{
          ...NUMBER_INPUT_STYLE,
          width: '100%',
        }}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ThreeDBenchPage() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [controls, setControls] = useState<SceneControls>(() => loadStoredControls());

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(controls));
    } catch {
      // Ignore storage write failures (private mode, quota limits).
    }
  }, [controls]);

  const uiPanelStyle = useMemo(
    () =>
      ({
        background: 'rgba(245, 242, 235, 0.94)',
        border: '1px solid rgba(0, 0, 0, 0.2)',
        borderRadius: '10px',
        color: '#1f1b16',
        display: 'grid',
        gap: '10px',
        left: '16px',
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
        padding: '12px',
        position: 'fixed',
        top: '16px',
        width: '340px',
        zIndex: 20,
      }) as const,
    [],
  );

  const setNumericControl = useCallback(
    (key: keyof SceneControls, value: number) =>
      setControls((previous) => ({ ...previous, [key]: value })),
    [],
  );

  const setColorControl = useCallback(
    (key: 'panelColorA' | 'panelColorB', value: string) =>
      setControls((previous) => ({ ...previous, [key]: value })),
    [],
  );

  const setLayoutPreset = useCallback((presetId: string) => {
    const preset = LAYOUT_PRESETS.find((candidate) => candidate.id === presetId);
    if (!preset) return;

    setControls((previous) => ({
      ...previous,
      chairCount: preset.chairCount,
      layoutPreset: preset.id,
      panelCount: preset.panelCount,
      scatterRadius: Math.max(previous.scatterRadius, 1.8 + preset.chairCount * 0.75),
    }));
  }, []);

  const randomizeScatter = useCallback(() => {
    setControls((previous) => ({
      ...previous,
      scatterSeed: Math.floor(Math.random() * 2147483647),
    }));
  }, []);

  const resetControls = useCallback(() => {
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Ignore storage clearing failures and keep in-memory defaults.
    }
    setControls(DEFAULT_CONTROLS);
  }, []);

  const downloadTransparentPng = useCallback(() => {
    const canvas = canvasContainerRef.current?.querySelector('canvas');
    if (!canvas) return;

    const scale = Math.max(1, Math.round(controls.exportScale));
    let exportCanvas: HTMLCanvasElement = canvas;

    if (scale > 1) {
      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = canvas.width * scale;
      resizedCanvas.height = canvas.height * scale;
      const context = resizedCanvas.getContext('2d');
      if (!context) return;
      context.imageSmoothingEnabled = true;
      context.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
      exportCanvas = resizedCanvas;
    }

    const link = document.createElement('a');
    link.download = `bench-transparent-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }, [controls.exportScale]);

  return (
    <div
      style={{
        background:
          'repeating-conic-gradient(#faf7f1 0% 25%, #efe7db 0% 50%) 50% / 24px 24px',
        height: '100vh',
        position: 'relative',
        width: '100vw',
      }}
    >
      <aside style={uiPanelStyle}>
        <strong style={{ fontSize: '14px' }}>Bench Scene Controls</strong>
        <FieldGroup title="Export">
          <button
            onClick={downloadTransparentPng}
            style={{
              background: '#1f1b16',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
              padding: '10px 12px',
            }}
            type="button"
          >
            Download Transparent PNG
          </button>
          <NumberControl
            label="Export scale"
            max={4}
            min={1}
            onChange={(value) => setNumericControl('exportScale', value)}
            step={1}
            value={controls.exportScale}
          />
        </FieldGroup>
        <FieldGroup title="Layout">
          <SelectControl
            label="Bench preset"
            onChange={setLayoutPreset}
            options={LAYOUT_PRESETS.map((preset) => ({
              label: preset.label,
              value: preset.id,
            }))}
            value={controls.layoutPreset}
          />
          <NumberControl
            label="Scatter radius"
            max={14}
            min={0}
            onChange={(value) => setNumericControl('scatterRadius', value)}
            step={0.1}
            value={controls.scatterRadius}
          />
          <button
            onClick={randomizeScatter}
            style={{
              background: '#3f2e1f',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
              padding: '8px 12px',
            }}
            type="button"
          >
            Randomize Positions
          </button>
        </FieldGroup>
        <FieldGroup title="Chairs">
          <NumberControl
            label="Distance"
            max={4}
            min={0.8}
            onChange={(value) => setNumericControl('chairDistance', value)}
            step={0.01}
            value={controls.chairDistance}
          />
          <NumberControl
            label="Scale"
            max={2.2}
            min={0.5}
            onChange={(value) => setNumericControl('chairScale', value)}
            step={0.01}
            value={controls.chairScale}
          />
          <NumberControl
            label="Color variation"
            max={0.12}
            min={0}
            onChange={(value) => setNumericControl('chairColorVariance', value)}
            step={0.001}
            value={controls.chairColorVariance}
          />
          <NumberControl
            label="Yaw misalignment"
            max={0.8}
            min={0}
            onChange={(value) => setNumericControl('chairMisalignment', value)}
            step={0.01}
            value={controls.chairMisalignment}
          />
          <NumberControl
            label="Offset X"
            max={1}
            min={-1}
            onChange={(value) => setNumericControl('chairOffsetX', value)}
            step={0.01}
            value={controls.chairOffsetX}
          />
          <NumberControl
            label="Offset Y"
            max={1}
            min={-1}
            onChange={(value) => setNumericControl('chairOffsetY', value)}
            step={0.01}
            value={controls.chairOffsetY}
          />
          <NumberControl
            label="Offset Z"
            max={1}
            min={-1}
            onChange={(value) => setNumericControl('chairOffsetZ', value)}
            step={0.01}
            value={controls.chairOffsetZ}
          />
        </FieldGroup>
        <FieldGroup title="Panels">
          <NumberControl
            label="Panel links"
            max={24}
            min={1}
            onChange={(value) => setNumericControl('panelCount', Math.max(1, Math.round(value)))}
            step={1}
            value={controls.panelCount}
          />
          <NumberControl
            label="Width"
            max={4}
            min={1}
            onChange={(value) => setNumericControl('panelWidth', value)}
            step={0.01}
            value={controls.panelWidth}
          />
          <NumberControl
            label="Depth"
            max={1}
            min={0.1}
            onChange={(value) => setNumericControl('panelDepth', value)}
            step={0.01}
            value={controls.panelDepth}
          />
          <NumberControl
            label="Thickness"
            max={0.3}
            min={0.02}
            onChange={(value) => setNumericControl('panelThickness', value)}
            step={0.005}
            value={controls.panelThickness}
          />
          <NumberControl
            label="Thickness range"
            max={0.15}
            min={0}
            onChange={(value) => setNumericControl('panelThicknessVariance', value)}
            step={0.001}
            value={controls.panelThicknessVariance}
          />
          <NumberControl
            label="Height"
            max={2}
            min={-0.2}
            onChange={(value) => setNumericControl('panelHeight', value)}
            step={0.01}
            value={controls.panelHeight}
          />
          <NumberControl
            label="Offset X"
            max={1}
            min={-1}
            onChange={(value) => setNumericControl('panelOffsetX', value)}
            step={0.01}
            value={controls.panelOffsetX}
          />
          <NumberControl
            label="Offset Y"
            max={1}
            min={-1}
            onChange={(value) => setNumericControl('panelOffsetY', value)}
            step={0.01}
            value={controls.panelOffsetY}
          />
          <NumberControl
            label="Y range"
            max={0.5}
            min={0}
            onChange={(value) => setNumericControl('panelYVariance', value)}
            step={0.005}
            value={controls.panelYVariance}
          />
          <NumberControl
            label="Offset Z"
            max={1}
            min={-1}
            onChange={(value) => setNumericControl('panelOffsetZ', value)}
            step={0.01}
            value={controls.panelOffsetZ}
          />
          <NumberControl
            label="Link overlap"
            max={2}
            min={0}
            onChange={(value) => setNumericControl('panelGap', value)}
            step={0.01}
            value={controls.panelGap}
          />
          <NumberControl
            label="Roughness"
            max={1}
            min={0}
            onChange={(value) => setNumericControl('panelRoughness', value)}
            step={0.01}
            value={controls.panelRoughness}
          />
          <NumberControl
            label="Bump scale"
            max={0.2}
            min={0}
            onChange={(value) => setNumericControl('panelBumpScale', value)}
            step={0.001}
            value={controls.panelBumpScale}
          />
          <NumberControl
            label="Metalness"
            max={1}
            min={0}
            onChange={(value) => setNumericControl('panelMetalness', value)}
            step={0.01}
            value={controls.panelMetalness}
          />
          <NumberControl
            label="Clearcoat"
            max={1}
            min={0}
            onChange={(value) => setNumericControl('panelClearcoat', value)}
            step={0.01}
            value={controls.panelClearcoat}
          />
          <NumberControl
            label="Clearcoat roughness"
            max={1}
            min={0}
            onChange={(value) => setNumericControl('panelClearcoatRoughness', value)}
            step={0.01}
            value={controls.panelClearcoatRoughness}
          />
          <ColorControl
            label="Panel color A"
            onChange={(value) => setColorControl('panelColorA', value)}
            value={controls.panelColorA}
          />
          <ColorControl
            label="Panel color B"
            onChange={(value) => setColorControl('panelColorB', value)}
            value={controls.panelColorB}
          />
        </FieldGroup>
        <FieldGroup title="Render & Look">
          <NumberControl
            label="Tone exposure"
            max={2.8}
            min={0.4}
            onChange={(value) => setNumericControl('toneExposure', value)}
            step={0.01}
            value={controls.toneExposure}
          />
          <NumberControl
            label="Environment blur"
            max={1}
            min={0}
            onChange={(value) => setNumericControl('envBlur', value)}
            step={0.01}
            value={controls.envBlur}
          />
          <NumberControl
            label="GPU DPR max"
            max={3}
            min={1}
            onChange={(value) => setNumericControl('renderDprMax', value)}
            step={0.25}
            value={controls.renderDprMax}
          />
        </FieldGroup>
        <FieldGroup title="Light & Shadow">
          <NumberControl
            label="Ambient intensity"
            max={2}
            min={0}
            onChange={(value) => setNumericControl('ambientIntensity', value)}
            step={0.01}
            value={controls.ambientIntensity}
          />
          <NumberControl
            label="Key light intensity"
            max={4}
            min={0}
            onChange={(value) => setNumericControl('keyLightIntensity', value)}
            step={0.01}
            value={controls.keyLightIntensity}
          />
          <NumberControl
            label="Fill light intensity"
            max={3}
            min={0}
            onChange={(value) => setNumericControl('fillLightIntensity', value)}
            step={0.01}
            value={controls.fillLightIntensity}
          />
          <NumberControl
            label="Key light X"
            max={10}
            min={-10}
            onChange={(value) => setNumericControl('keyLightX', value)}
            step={0.05}
            value={controls.keyLightX}
          />
          <NumberControl
            label="Key light Y"
            max={12}
            min={1}
            onChange={(value) => setNumericControl('keyLightY', value)}
            step={0.05}
            value={controls.keyLightY}
          />
          <NumberControl
            label="Key light Z"
            max={10}
            min={-10}
            onChange={(value) => setNumericControl('keyLightZ', value)}
            step={0.05}
            value={controls.keyLightZ}
          />
          <NumberControl
            label="Shadow opacity"
            max={1}
            min={0}
            onChange={(value) => setNumericControl('shadowOpacity', value)}
            step={0.01}
            value={controls.shadowOpacity}
          />
          <NumberControl
            label="Shadow softness"
            max={12}
            min={0}
            onChange={(value) => setNumericControl('shadowRadius', value)}
            step={0.5}
            value={controls.shadowRadius}
          />
          <NumberControl
            label="Contact shadow blur"
            max={8}
            min={0.1}
            onChange={(value) => setNumericControl('contactShadowBlur', value)}
            step={0.1}
            value={controls.contactShadowBlur}
          />
          <NumberControl
            label="Contact shadow scale"
            max={12}
            min={2}
            onChange={(value) => setNumericControl('contactShadowScale', value)}
            step={0.1}
            value={controls.contactShadowScale}
          />
          <NumberControl
            label="Shadow bias"
            max={0.001}
            min={-0.005}
            onChange={(value) => setNumericControl('shadowBias', value)}
            step={0.0001}
            value={controls.shadowBias}
          />
          <NumberControl
            label="Shadow map size"
            max={4096}
            min={256}
            onChange={(value) => setNumericControl('shadowMapSize', Math.round(value))}
            step={256}
            value={controls.shadowMapSize}
          />
          <NumberControl
            label="Shadow floor height"
            max={1}
            min={-2}
            onChange={(value) => setNumericControl('shadowPlaneY', value)}
            step={0.01}
            value={controls.shadowPlaneY}
          />
          <NumberControl
            label="Environment intensity"
            max={2}
            min={0}
            onChange={(value) => setNumericControl('envIntensity', value)}
            step={0.01}
            value={controls.envIntensity}
          />
        </FieldGroup>
        <button
          onClick={resetControls}
          style={{
            background: 'transparent',
            border: '1px solid rgba(0, 0, 0, 0.35)',
            borderRadius: '8px',
            color: '#1f1b16',
            cursor: 'pointer',
            fontWeight: 700,
            padding: '8px 12px',
          }}
          type="button"
        >
          Reset defaults
        </button>
      </aside>
      <div ref={canvasContainerRef} style={{ height: '100%', width: '100%' }}>
        <Canvas
          camera={{ fov: 40, position: [0, 1.3, 4.4] }}
          dpr={[1, controls.renderDprMax]}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: true,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor('#000000', 0);
          }}
          shadows
        >
          <BenchScene controls={controls} />
        </Canvas>
      </div>
    </div>
  );
}

useGLTF.preload('/models/scene.gltf');
