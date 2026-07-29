"use client";

import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import HeroSequence from "./hero/HeroSequence";

import {
  HeroSection,
  OrbitSection,
  AeroSection,
  EngineSection,
  HotspotsSection,
  DiagnosticsSection,
  WorkshopSection,
  ComparisonSection,
  LaunchSection,
} from "./sections/ScrollSections";

const BikeScene = dynamic(
  () => import("./experience/BikeScene"),
  { ssr: false }
);

gsap.registerPlugin(ScrollTrigger);

export default function BikerClinicExperience() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useRef<number>(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // Setup GSAP ScrollTrigger for normal website sections after HeroSequence
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: scrollContainerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5,
      onUpdate: (self) => {
        scrollProgress.current = self.progress;
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  const handleModelLoaded = useCallback(() => {
    setIsModelLoaded(true);
  }, []);

  return (
    <div className="bg-black min-h-screen">
      {/* 1. Exploded View Scroll Sequence (50 frames) */}
      <div className="relative z-20">
        <HeroSequence />
      </div>

      {/* 2. Fixed 3D Canvas Background for normal website */}
      <div className="fixed inset-0 z-0">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
            outputColorSpace: THREE.SRGBColorSpace,
            powerPreference: "high-performance",
          }}
          camera={{
            fov: 45,
            near: 0.1,
            far: 200,
            position: [0, 1.2, 7],
          }}
        >
          <Suspense fallback={null}>
            <BikeScene
              scrollProgress={scrollProgress}
              onLoaded={handleModelLoaded}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* 3. Normal 3D Scroll Content Overlay */}
      <div
        ref={scrollContainerRef}
        className="relative z-10"
      >
        <div className="pointer-events-none">
          <HeroSection />
          <OrbitSection />
          <AeroSection />
          <EngineSection />
          <HotspotsSection />
          <DiagnosticsSection />
          <WorkshopSection />
          <ComparisonSection />
          <LaunchSection />
        </div>
      </div>
    </div>
  );
}
