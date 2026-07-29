"use client";

import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, SpotLight } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import H2RModel from "./H2RModel";
import LoadingScreen from "./LoadingScreen";

gsap.registerPlugin(ScrollTrigger);

/* ─── Camera positions for each scroll section ─── */
const CAMERA_SECTIONS = [
  {
    // Section 1: Full bike reveal — center stage, slightly elevated
    camera: new THREE.Vector3(0, 1.8, 6),
    target: new THREE.Vector3(0, 0.5, 0),
  },
  {
    // Section 2: Front wheel close-up
    camera: new THREE.Vector3(2.8, 0.4, 2.0),
    target: new THREE.Vector3(1.2, 0.2, 0),
  },
  {
    // Section 3: Engine zoom
    camera: new THREE.Vector3(1.0, 0.6, 1.8),
    target: new THREE.Vector3(0, 0.3, 0),
  },
  {
    // Section 4: Rear suspension
    camera: new THREE.Vector3(-2.5, 1.0, 2.0),
    target: new THREE.Vector3(-1.0, 0.3, 0),
  },
  {
    // Section 5: Full cinematic reveal — wide, dramatic angle
    camera: new THREE.Vector3(0, 2.5, 7.5),
    target: new THREE.Vector3(0, 0.3, 0),
  },
];

/* ─── Scroll-Driven Scene Controller ─── */
function ScrollScene() {
  const bikeRef = useRef<THREE.Group>(null!);
  const { camera } = useThree();
  const scrollProgress = useRef(0);
  const targetCameraPos = useRef(new THREE.Vector3().copy(CAMERA_SECTIONS[0].camera));
  const targetLookAt = useRef(new THREE.Vector3().copy(CAMERA_SECTIONS[0].target));
  const currentLookAt = useRef(new THREE.Vector3().copy(CAMERA_SECTIONS[0].target));
  const idleRotation = useRef(0);
  const prevScrollProgress = useRef(0);

  useEffect(() => {
    // Set initial camera position
    camera.position.copy(CAMERA_SECTIONS[0].camera);
    camera.lookAt(CAMERA_SECTIONS[0].target);

    // Create a scroll proxy object for GSAP to animate
    const progressObj = { value: 0 };

    // Create ScrollTrigger that scrubs through all 5 sections
    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5,
      onUpdate: (self) => {
        progressObj.value = self.progress;
        scrollProgress.current = self.progress;
      },
    });

    return () => {
      trigger.kill();
    };
  }, [camera]);

  useFrame((state, delta) => {
    const progress = scrollProgress.current;
    const totalSections = CAMERA_SECTIONS.length;

    // Determine which section we're in and local progress
    const sectionFloat = progress * (totalSections - 1);
    const sectionIndex = Math.min(
      Math.floor(sectionFloat),
      totalSections - 2
    );
    const localProgress = sectionFloat - sectionIndex;

    // Smooth interpolation between sections using cosine easing
    const easedProgress = (1 - Math.cos(localProgress * Math.PI)) / 2;

    const from = CAMERA_SECTIONS[sectionIndex];
    const to = CAMERA_SECTIONS[sectionIndex + 1];

    // Interpolate camera position
    targetCameraPos.current.lerpVectors(from.camera, to.camera, easedProgress);

    // Interpolate lookAt target
    targetLookAt.current.lerpVectors(from.target, to.target, easedProgress);

    // Smooth damping for camera movement (buttery 60fps feel)
    camera.position.lerp(targetCameraPos.current, 0.08);
    currentLookAt.current.lerp(targetLookAt.current, 0.08);
    camera.lookAt(currentLookAt.current);

    // Slow idle rotation when not scrolling (visual candy)
    const scrollDelta = Math.abs(progress - prevScrollProgress.current);
    prevScrollProgress.current = progress;

    if (scrollDelta < 0.0001 && bikeRef.current) {
      idleRotation.current += delta * 0.15;
      bikeRef.current.rotation.y = idleRotation.current;
    } else if (bikeRef.current) {
      // During scroll, orient bike slightly based on section for drama
      const targetRotY = progress * Math.PI * 0.5;
      bikeRef.current.rotation.y = THREE.MathUtils.lerp(
        bikeRef.current.rotation.y,
        targetRotY,
        0.05
      );
      idleRotation.current = bikeRef.current.rotation.y;
    }
  });

  return (
    <>
      {/* Premium showroom lighting rig */}

      {/* Ambient base - very subtle to preserve contrast */}
      <ambientLight intensity={0.3} color="#e8ecf4" />

      {/* Key light: warm overhead spotlight from right */}
      <SpotLight
        position={[5, 8, 3]}
        angle={0.5}
        penumbra={0.8}
        intensity={80}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        distance={25}
        decay={2}
      />

      {/* Fill light: cool blue from left */}
      <directionalLight
        position={[-4, 3, -2]}
        intensity={1.0}
        color="#a8c4ff"
      />

      {/* Rim light: behind and above for edge highlights */}
      <pointLight
        position={[0, 4, -5]}
        intensity={40}
        color="#6688ff"
        decay={2}
        distance={15}
      />

      {/* Accent light: warm kick from below-right */}
      <pointLight
        position={[3, -1, 2]}
        intensity={15}
        color="#ff9944"
        decay={2}
        distance={10}
      />

      {/* Ground accent: subtle blue uplighting */}
      <pointLight
        position={[0, -2, 0]}
        intensity={8}
        color="#0066ff"
        decay={2}
        distance={8}
      />

      {/* HDR environment for realistic reflections */}
      <Environment preset="city" environmentIntensity={0.6} />

      {/* Contact shadows on ground plane */}
      <ContactShadows
        position={[0, -0.8, 0]}
        opacity={0.6}
        scale={12}
        blur={2.5}
        far={4}
        color="#000015"
      />

      {/* Transparent ground plane for subtle reflections */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.81, 0]}
        receiveShadow
      >
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          color="#080a0f"
          roughness={0.2}
          metalness={0.9}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* The motorcycle */}
      <H2RModel groupRef={bikeRef} />
    </>
  );
}

/* ─── Main BikeCanvas Component ─── */
export default function BikeCanvas() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  const handleLoadingFinished = useCallback(() => {
    setShowLoading(false);
  }, []);

  const handleCanvasCreated = useCallback(() => {
    // Give R3F a moment to render the first frame
    setTimeout(() => setIsLoaded(true), 200);
  }, []);

  return (
    <>
      {/* Loading Screen Overlay */}
      {showLoading && <LoadingScreen onFinished={handleLoadingFinished} />}

      {/* 3D Canvas */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 1,
          pointerEvents: "none",
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.8s ease-in-out",
        }}
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          camera={{
            fov: 45,
            near: 0.1,
            far: 100,
            position: [0, 1.8, 6],
          }}
          onCreated={handleCanvasCreated}
        >
          <Suspense fallback={null}>
            <ScrollScene />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}
