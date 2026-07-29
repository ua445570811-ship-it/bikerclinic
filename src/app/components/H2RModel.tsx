"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface H2RModelProps {
  groupRef?: React.RefObject<THREE.Group>;
}

export default function H2RModel({ groupRef }: H2RModelProps) {
  const internalRef = useRef<THREE.Group>(null!);
  const ref = groupRef || internalRef;
  const { scene } = useGLTF("/models/H2R.glb");

  useEffect(() => {
    if (!scene) return;

    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Enhance materials for premium look
        if (mesh.material) {
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.envMapIntensity = 1.5;
              mat.needsUpdate = true;
            }
          });
        }
      }
    });
  }, [scene]);

  // Gentle floating animation
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      // Subtle Y float
      ref.current.position.y = Math.sin(t * 0.8) * 0.04;
    }
  });

  return (
    <group ref={ref as React.RefObject<THREE.Group>}>
      <primitive
        object={scene}
        scale={1.0}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

// Preload for performance
useGLTF.preload("/models/H2R.glb");
