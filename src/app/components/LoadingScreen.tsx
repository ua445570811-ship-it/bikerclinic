"use client";

import { useState, useEffect } from "react";

interface LoadingScreenProps {
  onFinished?: () => void;
}

export default function LoadingScreen({ onFinished }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Accelerate towards the end
        const increment = prev < 60 ? 3 : prev < 85 ? 2 : 1;
        return Math.min(prev + increment, 100);
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      // Delay to let user see 100%
      const timeout = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          onFinished?.();
        }, 800);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [progress, onFinished]);

  if (!visible) return null;

  return (
    <div
      className={`h2r-loading-screen ${fadeOut ? "h2r-loading-fade-out" : ""}`}
    >
      {/* Background glow effects */}
      <div className="h2r-loading-glow h2r-loading-glow-1" />
      <div className="h2r-loading-glow h2r-loading-glow-2" />

      <div className="h2r-loading-content">
        {/* Pulsing ring spinner */}
        <div className="h2r-loading-spinner-container">
          <div className="h2r-loading-ring h2r-loading-ring-outer" />
          <div className="h2r-loading-ring h2r-loading-ring-inner" />
          <div className="h2r-loading-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" />
              <polygon points="12 15 17 21 7 21 12 15" />
            </svg>
          </div>
        </div>

        {/* Loading text */}
        <h2 className="h2r-loading-title">
          Loading H2R Experience<span className="h2r-loading-dots" />
        </h2>
        <p className="h2r-loading-subtitle">
          Preparing premium 3D showroom
        </p>

        {/* Progress bar */}
        <div className="h2r-loading-bar-track">
          <div
            className="h2r-loading-bar-fill"
            style={{ width: `${progress}%` }}
          />
          <div className="h2r-loading-bar-shimmer" />
        </div>

        {/* Progress text */}
        <div className="h2r-loading-progress-text">
          <span className="h2r-loading-percent">{progress}%</span>
          <span className="h2r-loading-status">
            {progress < 30
              ? "Loading model assets..."
              : progress < 60
              ? "Building materials..."
              : progress < 85
              ? "Setting up environment..."
              : progress < 100
              ? "Final preparations..."
              : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
}
