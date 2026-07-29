"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 208;
const FRAME_PATH = (n: number) =>
  `/frames/frame_${String(n).padStart(3, "0")}.jpg`;

interface TextPhase {
  id: string;
  number: string;
  frameStart: number;
  frameEnd: number;
  label: string;
  heading: string;
  sub: string;
  type:
    | "hero"
    | "animation"
    | "steps"
    | "benefits"
    | "booking"
    | "reviews"
    | "about";
}

const TEXT_PHASES: TextPhase[] = [
  {
    id: "01",
    number: "01",
    frameStart: 1,
    frameEnd: 35,
    label: "🏆 Bangalore's #1 Doorstep Bike Service",
    heading: "Your Bike Deserves\nExpert Care",
    sub: "Professional bike servicing at your doorstep. Certified mechanics, transparent pricing, real-time tracking.",
    type: "hero",
  },
  {
    id: "02",
    number: "02",
    frameStart: 36,
    frameEnd: 75,
    label: "Our Services",
    heading: "Everything Your Bike Needs",
    sub: "Professional service, genuine parts, transparent pricing.",
    type: "animation",
  },
  {
    id: "03",
    number: "03",
    frameStart: 76,
    frameEnd: 115,
    label: "How It Works",
    heading: "Service in 4 Simple Steps",
    sub: "From booking to completion — we keep it fast, transparent, and stress-free.",
    type: "steps",
  },
  {
    id: "04",
    number: "04",
    frameStart: 116,
    frameEnd: 155,
    label: "Reviews",
    heading: "Rider Reviews & Trust",
    sub: "Read verified feedback from real customers about our doorstep and workshop servicing.",
    type: "reviews",
  },
  {
    id: "05",
    number: "05",
    frameStart: 156,
    frameEnd: 185,
    label: "BOOK A SERVICE",
    heading: "KEEP YOUR RIDE IN\nTOP CONDITION",
    sub: "5,000+ Happy Riders • 50+ Certified Mechanics • 4.9★ Average Rating • 30min Response Time",
    type: "booking",
  },
  {
    id: "06",
    number: "06",
    frameStart: 186,
    frameEnd: 208,
    label: "LOCATION & ABOUT US",
    heading: "BIKERCLINIC\nWORKSHOP & ABOUT",
    sub: "- Workshop location\n- About Us section",
    type: "about",
  },
];

const SERVICES_LIST = [
  {
    icon: "🔧",
    title: "General Service",
    price: "Starting ₹799",
    popular: false,
  },
  {
    icon: "⚙️",
    title: "Full Service",
    price: "Starting ₹1,499",
    popular: true,
  },
  {
    icon: "🛞",
    title: "Tyre Replacement",
    price: "Starting ₹999",
    popular: false,
  },
  {
    icon: "🔋",
    title: "Battery Service",
    price: "Starting ₹499",
    popular: false,
  },
  {
    icon: "🛠️",
    title: "Brake Service",
    price: "Starting ₹599",
    popular: false,
  },
  {
    icon: "💡",
    title: "Electrical Repair",
    price: "Starting ₹699",
    popular: false,
  },
];

const STEPS_LIST = [
  {
    step: "01",
    icon: "📱",
    title: "Book in 2 mins",
    desc: "Choose your service & slot. No calls needed.",
  },
  {
    step: "02",
    icon: "👨‍🔧",
    title: "Mechanic Assigned",
    desc: "Certified technician & profile assigned.",
  },
  {
    step: "03",
    icon: "🔍",
    title: "Live Tracking",
    desc: "Real-time status like a food order.",
  },
  {
    step: "04",
    icon: "✅",
    title: "Done & Delivered",
    desc: "Pay only after you're satisfied.",
  },
];

const BENEFITS_LIST = [
  { icon: "🛠️", title: "EXPERT TECHNICIANS" },
  { icon: "⚙️", title: "GENUINE PARTS" },
  { icon: "⏱️", title: "QUICK SERVICE" },
  { icon: "🛡️", title: "AFFORDABLE PRICING" },
  { icon: "🏍️", title: "BIKE CARE" },
];

const REVIEWS_LIST = [
  {
    author: "Rahul Sharma",
    bike: "Royal Enfield Classic 350",
    comment:
      "Absolutely brilliant! The mechanic came right to my office parking lot and finished full service in 90 mins.",
    stars: "★★★★★",
  },
  {
    author: "Priya Nair",
    bike: "Honda Activa 6G",
    comment:
      "I was skeptical about doorstep service, but BikerClinic proved me wrong. Professional & zero hassle.",
    stars: "★★★★★",
  },
  {
    author: "Amit Patel",
    bike: "KTM Duke 200",
    comment:
      "Excellent chain repair and oil swap. The live tracking is just like tracking food orders, super cool!",
    stars: "★★★★★",
  },
  {
    author: "Sneha Reddy",
    bike: "Yamaha FZ-S",
    comment:
      "Very polite technician. Explained all costs upfront. Brake pad replacement feels top-notch.",
    stars: "★★★★☆",
  },
];

export default function HeroSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameIndexRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const activePhaseRef = useRef<string>(TEXT_PHASES[0].id);

  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activePhase, setActivePhase] = useState<TextPhase>(TEXT_PHASES[0]);
  const [phaseVisible, setPhaseVisible] = useState(false);

  // Draw frame to canvas
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = width / height;

    let sx = 0,
      sy = 0,
      sw = img.naturalWidth,
      sh = img.naturalHeight;

    if (imgAspect > canvasAspect) {
      sw = img.naturalHeight * canvasAspect;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / canvasAspect;
      sy = (img.naturalHeight - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
  }, []);

  // Preload all 208 images reliably
  useEffect(() => {
    let isCancelled = false;
    let loadedCount = 0;

    const loadSingleImage = (index: number): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new window.Image();
        const finish = () => {
          if (!isCancelled) {
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
            if (index === 1) drawFrame(0);
          }
          resolve(img);
        };
        img.onload = finish;
        img.onerror = finish;
        img.src = FRAME_PATH(index);
      });
    };

    const fallbackTimer = setTimeout(() => {
      if (!isCancelled) {
        setLoadProgress(100);
        setIsLoaded(true);
      }
    }, 3800);

    Promise.all(
      Array.from({ length: TOTAL_FRAMES }, (_, i) => loadSingleImage(i + 1))
    ).then((loadedImages) => {
      if (!isCancelled) {
        clearTimeout(fallbackTimer);
        imagesRef.current = loadedImages;
        setLoadProgress(100);
        setIsLoaded(true);
        drawFrame(0);
      }
    });

    return () => {
      isCancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, [drawFrame]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(frameIndexRef.current);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [drawFrame]);

  // Init GSAP ScrollTrigger after load
  useEffect(() => {
    if (!isLoaded || !spacerRef.current || !wrapperRef.current) return;

    drawFrame(0);
    setPhaseVisible(true);

    let targetFrame = 0;
    let currentFloatFrame = 0;
    let isRunning = true;

    // Continuous smooth lerp loop for silky buttery frame interpolation
    const smoothLoop = () => {
      if (!isRunning) return;
      currentFloatFrame += (targetFrame - currentFloatFrame) * 0.08;
      const roundedFrame = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(currentFloatFrame))
      );

      if (roundedFrame !== frameIndexRef.current) {
        frameIndexRef.current = roundedFrame;
        drawFrame(roundedFrame);

        const frameNum = roundedFrame + 1;
        const phase = TEXT_PHASES.find(
          (p) => frameNum >= p.frameStart && frameNum <= p.frameEnd
        );

        if (phase && phase.id !== activePhaseRef.current) {
          activePhaseRef.current = phase.id;
          setPhaseVisible(false);
          setTimeout(() => {
            setActivePhase(phase);
            setPhaseVisible(true);
          }, 100);
        }
      }

      rafRef.current = requestAnimationFrame(smoothLoop);
    };

    rafRef.current = requestAnimationFrame(smoothLoop);

    const trigger = ScrollTrigger.create({
      trigger: spacerRef.current,
      start: "top top",
      end: "bottom bottom",
      pin: wrapperRef.current,
      scrub: 2.2,
      onUpdate(self) {
        targetFrame = self.progress * (TOTAL_FRAMES - 1);
      },
    });

    return () => {
      isRunning = false;
      trigger.kill();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, drawFrame]);

  return (
    <>
      {/* Loading Screen */}
      {!isLoaded && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "32px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.4em",
                color: "#FF1E27",
                textTransform: "uppercase",
                marginBottom: "16px",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              BIKER CLINIC · STORYBOARD
            </div>
            <div
              style={{
                fontSize: "clamp(28px, 5vw, 48px)",
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "-0.02em",
                fontFamily: "system-ui, sans-serif",
                lineHeight: 1.1,
              }}
            >
              LOADING 3D
              <br />
              <span style={{ color: "#FF1E27" }}>STORYBOARD</span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ width: "240px" }}>
            <div
              style={{
                width: "100%",
                height: "2px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${loadProgress}%`,
                  background: "#FF1E27",
                  boxShadow: "0 0 16px #FF1E27",
                  transition: "width 0.2s ease",
                  borderRadius: "2px",
                }}
              />
            </div>
            <div
              style={{
                marginTop: "12px",
                textAlign: "center",
                fontFamily: "monospace",
                fontSize: "12px",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.1em",
              }}
            >
              {loadProgress}%
            </div>
          </div>
        </div>
      )}

      {/* Scroll Spacer — gives 900vh height for 6 Storyboard Sections */}
      <div ref={spacerRef} style={{ height: "900vh", position: "relative" }}>
        {/* Pinned Canvas Wrapper */}
        <div
          ref={wrapperRef}
          style={{
            position: "sticky",
            top: 0,
            width: "100%",
            height: "100vh",
            overflow: "hidden",
            background: "#000",
          }}
        >
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Cinematic Gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 45%, transparent 75%)",
              pointerEvents: "none",
            }}
          />

          {/* Crimson accent line top */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background:
                "linear-gradient(90deg, transparent, #FF1E27, transparent)",
              opacity: isLoaded ? 1 : 0,
              transition: "opacity 0.8s ease",
            }}
          />

          {/* Storyboard Content Overlay */}
          <div
            style={{
              position: "absolute",
              top: "auto",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "0 clamp(12px, 4vw, 80px) clamp(16px, 3vh, 40px)",
              transition: "opacity 0.3s ease, transform 0.4s ease",
              opacity: phaseVisible && isLoaded ? 1 : 0,
              transform:
                phaseVisible && isLoaded ? "translateY(0)" : "translateY(16px)",
              pointerEvents: "auto",
            }}
          >
            {/* Storyboard Number & Phase label */}
            {activePhase.type === "hero" ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255, 30, 39, 0.14)",
                  border: "1px solid rgba(255, 30, 39, 0.4)",
                  padding: "8px 20px",
                  borderRadius: "99px",
                  marginBottom: "20px",
                  boxShadow: "0 0 24px rgba(255, 30, 39, 0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#FF1E27",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  {activePhase.label}
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "clamp(24px, 3.5vw, 42px)",
                    fontWeight: 900,
                    color: "#FF1E27",
                    fontFamily: "system-ui, sans-serif",
                    lineHeight: 1,
                  }}
                >
                  {activePhase.number}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.35em",
                    color: "rgba(255,255,255,0.7)",
                    textTransform: "uppercase",
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {activePhase.label}
                </span>
              </div>
            )}

            {/* Main Heading */}
            <div
              style={{
                fontSize:
                  activePhase.type === "animation" ||
                  activePhase.type === "steps" ||
                  activePhase.type === "reviews" ||
                  activePhase.type === "booking"
                    ? "clamp(20px, 4.5vw, 36px)"
                    : "clamp(26px, 6vw, 68px)",
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                fontFamily: "system-ui, sans-serif",
                whiteSpace: "pre-line",
                marginBottom:
                  activePhase.type === "animation" ||
                  activePhase.type === "steps" ||
                  activePhase.type === "reviews" ||
                  activePhase.type === "booking"
                    ? "8px"
                    : "16px",
              }}
            >
              {activePhase.heading.split("\n").map((line, idx) => (
                <span key={idx}>
                  {activePhase.type === "hero" && idx === 1 ? (
                    <span style={{ color: "#FF1E27" }}>{line}</span>
                  ) : (
                    line
                  )}
                  {idx < activePhase.heading.split("\n").length - 1 && <br />}
                </span>
              ))}
            </div>

            {/* Sub text */}
            <div
              style={{
                fontSize:
                  activePhase.type === "animation" ||
                  activePhase.type === "steps" ||
                  activePhase.type === "reviews" ||
                  activePhase.type === "booking"
                    ? "clamp(13px, 1.2vw, 15px)"
                    : "clamp(14px, 1.4vw, 17px)",
                color: "rgba(255,255,255,0.6)",
                maxWidth: "600px",
                lineHeight: 1.5,
                fontFamily: "system-ui, sans-serif",
                marginBottom:
                  activePhase.type === "animation" ||
                  activePhase.type === "steps" ||
                  activePhase.type === "reviews" ||
                  activePhase.type === "booking"
                    ? "10px"
                    : "24px",
                whiteSpace: "pre-line",
              }}
            >
              {activePhase.sub}
            </div>

            {/* 01 HERO SECTION: Two CTA Buttons matching screenshot */}
            {activePhase.type === "hero" && (
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginTop: "4px",
                }}
              >
                <Link
                  href="/booking"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background:
                      "linear-gradient(135deg, #FF1E27 0%, #D10008 100%)",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "15px",
                    padding: "14px 28px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    boxShadow: "0 4px 20px rgba(255, 30, 39, 0.4)",
                  }}
                >
                  🔧 Book a Service
                </Link>
                <Link
                  href="/track"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "15px",
                    padding: "14px 28px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  🔑 Track My Bike
                </Link>
              </div>
            )}

            {/* 02 EXPLODE VIEW / ANIMATION: Small compact icons below so bike is 100% visible */}
            {activePhase.type === "animation" && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "6px",
                  marginBottom: "6px",
                  maxWidth: "1050px",
                }}
              >
                {SERVICES_LIST.map((s) => (
                  <Link
                    href={`/booking?service=${encodeURIComponent(s.title)}`}
                    key={s.title}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(15, 15, 20, 0.85)",
                      border: "1px solid rgba(255, 30, 39, 0.45)",
                      padding: "7px 14px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#fff",
                      textDecoration: "none",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.6)",
                      backdropFilter: "blur(10px)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>{s.icon}</span>
                    <span>{s.title}</span>
                    <span
                      style={{
                        color: "#FF1E27",
                        fontWeight: 800,
                        marginLeft: "4px",
                      }}
                    >
                      {s.price}
                    </span>
                    {s.popular && (
                      <span
                        style={{
                          background: "rgba(255, 30, 39, 0.2)",
                          color: "#FF1E27",
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "99px",
                          fontWeight: 800,
                        }}
                      >
                        ★ Popular
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {/* 03 HOW IT WORKS / STEPS: Small compact step pills along bottom edge so bike is 100% visible */}
            {activePhase.type === "steps" && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "6px",
                  marginBottom: "6px",
                  maxWidth: "1050px",
                }}
              >
                {STEPS_LIST.map((s) => (
                  <div
                    key={s.step}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(15, 15, 20, 0.85)",
                      border: "1px solid rgba(255, 30, 39, 0.45)",
                      padding: "7px 14px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      color: "#fff",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.6)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <span
                      style={{
                        color: "#FF1E27",
                        fontWeight: 900,
                        fontSize: "13px",
                      }}
                    >
                      {s.step}
                    </span>
                    <span style={{ fontSize: "14px" }}>{s.icon}</span>
                    <span style={{ fontWeight: 800 }}>{s.title}</span>
                    <span
                      style={{
                        color: "rgba(255, 255, 255, 0.65)",
                        fontSize: "11px",
                      }}
                    >
                      — {s.desc}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 03 SERVICE BENEFITS: 5 Glowing Red-Bordered Benefits Cards */}
            {activePhase.type === "benefits" && (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "16px",
                }}
              >
                {BENEFITS_LIST.map((b) => (
                  <div
                    key={b.title}
                    style={{
                      background: "rgba(15,15,18,0.85)",
                      border: "1px solid rgba(255, 30, 39, 0.55)",
                      borderRadius: "12px",
                      padding: "16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "135px",
                      boxShadow: "0 4px 20px rgba(255, 30, 39, 0.15)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <span style={{ fontSize: "24px", marginBottom: "8px" }}>
                      {b.icon}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#fff",
                        textAlign: "center",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {b.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 05 MIDDLE INFO STATS BELOW (Replacing old CTA box) */}
            {activePhase.type === "booking" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  width: "100%",
                  maxWidth: "1100px",
                  background: "rgba(10, 10, 16, 0.88)",
                  border: "1px solid rgba(255, 30, 39, 0.35)",
                  borderRadius: "16px",
                  padding: "20px 24px",
                  backdropFilter: "blur(14px)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
                }}
              >
                {/* 4 Stats Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: "12px",
                    textAlign: "center",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    paddingBottom: "14px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 900, color: "#FF1E27", fontFamily: "system-ui, sans-serif" }}>
                      5,000+
                    </div>
                    <div style={{ fontSize: "clamp(10px, 2.5vw, 11px)", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.7)", marginTop: "4px", fontWeight: 600 }}>
                      Happy Riders
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 900, color: "#FF1E27", fontFamily: "system-ui, sans-serif" }}>
                      50+
                    </div>
                    <div style={{ fontSize: "clamp(10px, 2.5vw, 11px)", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.7)", marginTop: "4px", fontWeight: 600 }}>
                      Certified Mechanics
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 900, color: "#FF1E27", fontFamily: "system-ui, sans-serif" }}>
                      4.9★
                    </div>
                    <div style={{ fontSize: "clamp(10px, 2.5vw, 11px)", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.7)", marginTop: "4px", fontWeight: 600 }}>
                      Average Rating
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 900, color: "#FF1E27", fontFamily: "system-ui, sans-serif" }}>
                      30min
                    </div>
                    <div style={{ fontSize: "clamp(10px, 2.5vw, 11px)", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.7)", marginTop: "4px", fontWeight: 600 }}>
                      Response Time
                    </div>
                  </div>
                </div>

                {/* Brands Strip */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                    We service all major brands
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {["Hero", "Honda", "TVS", "Bajaj", "Royal Enfield", "Yamaha", "Suzuki", "KTM"].map((brand) => (
                      <span
                        key={brand}
                        style={{
                          background: "rgba(255, 30, 39, 0.12)",
                          border: "1px solid rgba(255, 30, 39, 0.35)",
                          color: "#fff",
                          padding: "4px 14px",
                          borderRadius: "99px",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 05 REVIEWS: Compact review pills along bottom edge so bike is 100% visible */}
            {activePhase.type === "reviews" && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "6px",
                  marginBottom: "6px",
                  maxWidth: "1100px",
                }}
              >
                {REVIEWS_LIST.map((r, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(15, 15, 20, 0.85)",
                      border: "1px solid rgba(255, 30, 39, 0.45)",
                      padding: "7px 14px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      color: "#fff",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.6)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <span style={{ color: "#FF1E27", fontWeight: 800 }}>
                      {r.stars}
                    </span>
                    <span style={{ fontWeight: 800 }}>{r.author}</span>
                    <span
                      style={{
                        background: "rgba(255, 30, 39, 0.2)",
                        color: "#FF1E27",
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "99px",
                        fontWeight: 800,
                      }}
                    >
                      {r.bike}
                    </span>
                    <span
                      style={{
                        color: "rgba(255, 255, 255, 0.65)",
                        fontSize: "11px",
                      }}
                    >
                      — &ldquo;{r.comment}&rdquo;
                    </span>
                  </div>
                ))}
                <Link
                  href="/booking"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background:
                      "linear-gradient(135deg, #FF1E27 0%, #D10008 100%)",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "12px",
                    padding: "7px 16px",
                    borderRadius: "99px",
                    textDecoration: "none",
                    boxShadow: "0 4px 16px rgba(255, 30, 39, 0.4)",
                  }}
                >
                  ✍️ Write a Review →
                </Link>
              </div>
            )}

            {/* 06 LOCATION & ABOUT US: Interactive Workshop & About Box */}
            {activePhase.type === "about" && (
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  flexWrap: "wrap",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    background: "rgba(15, 15, 20, 0.85)",
                    border: "1px solid rgba(255, 30, 39, 0.5)",
                    borderRadius: "16px",
                    padding: "22px 26px",
                    maxWidth: "340px",
                    boxShadow: "0 4px 24px rgba(255, 30, 39, 0.15)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#FF1E27",
                      marginBottom: "8px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    📍 WORKSHOP LOCATION
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.85)",
                      fontSize: "14px",
                      lineHeight: 1.6,
                    }}
                  >
                    Nanjundeshwara Layout, Bengaluru, Karnataka 560076
                  </div>
                  <a
                    href="https://maps.app.goo.gl/16BPJWzQtafEorgY8"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      color: "#FF1E27",
                      fontSize: "13px",
                      fontWeight: 700,
                      marginTop: "12px",
                      textDecoration: "none",
                    }}
                  >
                    Open Map Directions →
                  </a>
                </div>

                <div
                  style={{
                    background: "rgba(15, 15, 20, 0.85)",
                    border: "1px solid rgba(255, 30, 39, 0.5)",
                    borderRadius: "16px",
                    padding: "22px 26px",
                    maxWidth: "420px",
                    boxShadow: "0 4px 24px rgba(255, 30, 39, 0.15)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#FF1E27",
                      marginBottom: "8px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ABOUT US
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "13px",
                      lineHeight: 1.6,
                    }}
                  >
                    BikerClinic is your one-stop solution for premium bike
                    services. We are passionate about motorcycles and committed
                    to providing the best care for your ride.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scroll indicator — visible on first phase */}
          <div
            style={{
              position: "absolute",
              bottom: "clamp(24px, 4vh, 36px)",
              right: "clamp(24px, 4vw, 60px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              opacity: frameIndexRef.current < 8 && isLoaded ? 1 : 0,
              transition: "opacity 0.5s ease",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                letterSpacing: "0.3em",
                color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
                fontFamily: "system-ui, sans-serif",
                writingMode: "vertical-rl",
              }}
            >
              Scroll Storyboard
            </span>
            <div
              style={{
                width: "1px",
                height: "48px",
                background:
                  "linear-gradient(to bottom, #FF1E27, transparent)",
                animation: "scrollPulse 1.8s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 0.9; transform: scaleY(1.2); }
        }
      `}</style>
    </>
  );
}
