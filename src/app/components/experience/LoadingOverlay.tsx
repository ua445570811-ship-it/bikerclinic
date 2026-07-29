"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────────────────── */
/*  LoadingOverlay — Cinematic full-screen loading experience  */
/* ─────────────────────────────────────────────────────────── */

interface LoadingOverlayProps {
  progress: number; // 0-100
  isComplete: boolean;
}

/* status text that evolves with progress */
function getStatusText(progress: number): string {
  if (progress < 20) return "Loading model...";
  if (progress < 45) return "Building scene...";
  if (progress < 70) return "Configuring lights...";
  if (progress < 90) return "Almost ready...";
  if (progress < 100) return "Finalizing...";
  return "Ready";
}

/* ── Letter-stagger variants for the title ── */
const titleContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.3,
    },
  },
};

const letterVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ── Overlay exit animation ── */
const overlayVariants = {
  visible: { opacity: 1 },
  exit: {
    opacity: 0,
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function LoadingOverlay({
  progress,
  isComplete,
}: LoadingOverlayProps) {
  const [show, setShow] = useState(true);
  const [displayProgress, setDisplayProgress] = useState(0);

  const titleText = "BIKER CLINIC";
  const letters = useMemo(() => titleText.split(""), []);
  const statusText = getStatusText(progress);

  /* smooth number counter */
  useEffect(() => {
    const step = () => {
      setDisplayProgress((prev) => {
        const diff = progress - prev;
        if (Math.abs(diff) < 0.5) return progress;
        return prev + diff * 0.12;
      });
    };
    const raf = requestAnimationFrame(function loop() {
      step();
      if (!isComplete) requestAnimationFrame(loop);
      else setDisplayProgress(100);
    });
    return () => cancelAnimationFrame(raf);
  }, [progress, isComplete]);

  /* delayed unmount after completion */
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => setShow(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loading-overlay"
          variants={overlayVariants}
          initial="visible"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: "#000000" }}
        >
          {/* ── ambient glow orbs ── */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 500,
              height: 500,
              background:
                "radial-gradient(circle, rgba(0,255,102,0.08) 0%, transparent 70%)",
              filter: "blur(80px)",
              top: "20%",
              left: "15%",
            }}
            animate={{
              x: [0, 40, -20, 0],
              y: [0, -30, 20, 0],
              scale: [1, 1.15, 0.95, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 350,
              height: 350,
              background:
                "radial-gradient(circle, rgba(0,255,102,0.05) 0%, transparent 70%)",
              filter: "blur(60px)",
              bottom: "15%",
              right: "20%",
            }}
            animate={{
              x: [0, -30, 15, 0],
              y: [0, 25, -15, 0],
              scale: [1, 0.9, 1.1, 1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* ── scan line ── */}
          <motion.div
            className="absolute left-0 w-full pointer-events-none"
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(0,255,102,0.15) 50%, transparent 100%)",
            }}
            animate={{ top: ["0%", "100%"] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* ── content container ── */}
          <div className="relative z-10 flex flex-col items-center gap-8 px-6">
            {/* ── animated title ── */}
            <motion.div
              className="flex items-center justify-center"
              variants={titleContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {letters.map((char, i) => (
                <motion.span
                  key={i}
                  variants={letterVariants}
                  className="inline-block text-4xl sm:text-5xl md:text-6xl font-black tracking-wider select-none"
                  style={{
                    color: "#00FF66",
                    textShadow:
                      "0 0 30px rgba(0,255,102,0.4), 0 0 60px rgba(0,255,102,0.15)",
                    fontFamily:
                      "var(--font-sans), -apple-system, BlinkMacSystemFont, sans-serif",
                    marginRight: char === " " ? "0.3em" : "0.02em",
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>

            {/* ── subtitle ── */}
            <motion.p
              className="text-xs sm:text-sm tracking-[0.3em] uppercase font-semibold"
              style={{ color: "rgba(255,255,255,0.35)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              Premium Motorcycle Experience
            </motion.p>

            {/* ── progress section ── */}
            <motion.div
              className="flex flex-col items-center gap-4 w-full max-w-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {/* percentage counter */}
              <div className="flex items-baseline gap-1">
                <span
                  className="text-5xl sm:text-6xl font-black tabular-nums"
                  style={{
                    color: "#00FF66",
                    fontFamily:
                      "var(--font-mono), 'JetBrains Mono', monospace",
                    textShadow: "0 0 20px rgba(0,255,102,0.3)",
                  }}
                >
                  {Math.round(displayProgress)}
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ color: "rgba(0,255,102,0.6)" }}
                >
                  %
                </span>
              </div>

              {/* progress bar track */}
              <div className="relative w-full h-[2px] rounded-full overflow-hidden bg-white/[0.06]">
                {/* fill */}
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${displayProgress}%`,
                    background:
                      "linear-gradient(90deg, #009944, #00FF66, #66FFaa)",
                    boxShadow:
                      "0 0 12px rgba(0,255,102,0.6), 0 0 30px rgba(0,255,102,0.25)",
                  }}
                  transition={{ duration: 0.1, ease: "linear" }}
                />
                {/* shimmer sweep */}
                <motion.div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: "40%",
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  }}
                  animate={{ left: ["-40%", "140%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </div>

              {/* glow dot at end of progress */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  background: "#00FF66",
                  boxShadow: "0 0 10px #00FF66, 0 0 20px rgba(0,255,102,0.4)",
                  left: `${displayProgress}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* status text */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusText}
                  className="text-xs tracking-[0.15em] uppercase font-medium"
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontFamily:
                      "var(--font-mono), 'JetBrains Mono', monospace",
                  }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  {statusText}
                </motion.p>
              </AnimatePresence>
            </motion.div>

            {/* ── decorative corner brackets ── */}
            <div className="absolute top-8 left-8 w-8 h-8 border-t border-l border-white/[0.08]" />
            <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-white/[0.08]" />
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b border-l border-white/[0.08]" />
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b border-r border-white/[0.08]" />
          </div>

          {/* ── bottom version tag ── */}
          <motion.div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            <span
              className="w-6 h-[1px] inline-block"
              style={{ background: "rgba(255,255,255,0.12)" }}
            />
            <span
              className="text-[10px] tracking-[0.25em] uppercase font-medium"
              style={{
                color: "rgba(255,255,255,0.2)",
                fontFamily:
                  "var(--font-mono), 'JetBrains Mono', monospace",
              }}
            >
              v1.0
            </span>
            <span
              className="w-6 h-[1px] inline-block"
              style={{ background: "rgba(255,255,255,0.12)" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
