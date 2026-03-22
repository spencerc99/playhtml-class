// ABOUTME: Collaborative 3D chair viewer using Three.js and playhtml.
// ABOUTME: Syncs camera orbit state so all users see the same view.

import { withSharedState } from '@playhtml/react';
import { Center, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CameraState {
  azimuthalAngle: number;
  polarAngle: number;
}

function Chair() {
  const { scene } = useGLTF('/models/scene.gltf');
  return (
    <Center>
      <primitive object={scene} scale={0.01} />
    </Center>
  );
}

function Scene({
  data,
  onOrbitEnd,
}: {
  data: CameraState;
  onOrbitEnd: (state: CameraState) => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isLocalDrag = useRef(false);
  const { camera } = useThree();

  // Apply remote state to the camera
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || isLocalDrag.current) return;

    const distance = camera.position.length();
    const x = distance * Math.sin(data.polarAngle) * Math.sin(data.azimuthalAngle);
    const y = distance * Math.cos(data.polarAngle);
    const z = distance * Math.sin(data.polarAngle) * Math.cos(data.azimuthalAngle);

    camera.position.set(x, y, z);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    controls.update();
  }, [data.azimuthalAngle, data.polarAngle, camera]);

  const handleStart = useCallback(() => {
    isLocalDrag.current = true;
  }, []);

  const handleEnd = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    onOrbitEnd({
      azimuthalAngle: controls.getAzimuthalAngle(),
      polarAngle: controls.getPolarAngle(),
    });
    isLocalDrag.current = false;
  }, [onOrbitEnd]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1} />
      <directionalLight position={[-5, 3, -3]} intensity={0.5} />
      <Environment preset="studio" environmentIntensity={0.3} />
      <Suspense fallback={null}>
        <Chair />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        onStart={handleStart}
        onChange={handleEnd}
        onEnd={handleEnd}
        enableDamping
        enableZoom={false}
        enablePan={false}
      />
    </>
  );
}

export const ChairViewer = withSharedState(
  {
    defaultData: {
      azimuthalAngle: 0,
      polarAngle: Math.PI / 4,
    } as CameraState,
    id: 'chair-viewer',
  },
  ({ data, setData }) => {
    const handleOrbitEnd = useCallback(
      (state: CameraState) => setData(state),
      [setData],
    );

    return (
      <div id="chair-viewer">
        <Canvas
          camera={{ position: [0, 1.5, 3], fov: 40 }}
          style={{ width: '150px', height: 'auto', display: 'block' }}
        >
          <Scene data={data} onOrbitEnd={handleOrbitEnd} />
        </Canvas>
      </div>
    );
  },
);
