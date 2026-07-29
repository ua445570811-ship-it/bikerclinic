"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/* ──────────────────────────────────────────────
   Shared animation helpers
   ────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount: 0.3 },
  transition: { duration: 0.8, ease: "easeOut" as const },
};

const fadeLeft = {
  initial: { opacity: 0, x: -60 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: false, amount: 0.3 },
  transition: { duration: 0.8, ease: "easeOut" as const },
};

const fadeRight = {
  initial: { opacity: 0, x: 60 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: false, amount: 0.3 },
  transition: { duration: 0.8, ease: "easeOut" as const },
};

const scaleFade = {
  initial: { opacity: 0, scale: 0.9 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: false, amount: 0.3 },
  transition: { duration: 0.8, ease: "easeOut" as const },
};

function stagger(index: number, base = 0.15) {
  return { delay: index * base };
}

/* ──────────────────────────────────────────────
   1. HeroSection
   ────────────────────────────────────────────── */

export function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative px-6">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8"
      >
        <span className="text-[#00FF66] text-xs uppercase tracking-[0.3em] font-semibold font-mono">
          BIKER CLINIC
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
        className="text-6xl md:text-8xl font-black tracking-tight leading-none text-center"
      >
        <span className="text-white">PERFORMANCE</span>
        <br />
        <span className="text-white">MEETS </span>
        <span className="text-[#00FF66]">PRECISION</span>
      </motion.h1>

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        className="text-lg text-white/60 max-w-lg text-center mt-6 font-sans"
      >
        Premium Motorcycle Service & Performance Engineering
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.45 }}
        className="mt-10 flex gap-4"
      >
        <Link
          href="/booking"
          className="pointer-events-auto bg-[#00FF66] text-black font-bold px-8 py-4 rounded-full hover:bg-[#00FF66]/90 transition text-sm uppercase tracking-wider"
        >
          Book Service
        </Link>
        <button className="pointer-events-auto border border-white/20 text-white px-8 py-4 rounded-full hover:border-[#00FF66] hover:text-[#00FF66] transition text-sm uppercase tracking-wider">
          Explore
        </button>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute bottom-10 flex flex-col items-center gap-2"
      >
        <span className="text-white/40 text-xs uppercase tracking-widest font-mono">
          Scroll
        </span>
        <motion.svg
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white/40"
        >
          <path d="M7 13l5 5 5-5" />
          <path d="M7 6l5 5 5-5" />
        </motion.svg>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   2. OrbitSection
   ────────────────────────────────────────────── */

const orbitStats = [
  { value: "998cc", label: "Supercharged" },
  { value: "310", label: "Horsepower" },
  { value: "326", label: "KM/H Top Speed" },
  { value: "RACE", label: "DNA Heritage" },
];

export function OrbitSection() {
  return (
    <section className="min-h-[150vh] flex items-end pb-32 relative">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto px-6 w-full">
        {orbitStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut", ...stagger(i) }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center pointer-events-auto"
          >
            <div className="text-3xl font-black text-[#00FF66] font-mono">
              {stat.value}
            </div>
            <div className="text-sm text-white/60 mt-2 uppercase tracking-wider font-sans">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   3. AeroSection
   ────────────────────────────────────────────── */

const aeroFeatures = [
  "Carbon Fiber Body",
  "Active Winglets",
  "Optimized Air Intake",
  "Ram Air System",
];

export function AeroSection() {
  return (
    <section className="min-h-[150vh] flex items-center relative">
      <motion.div
        {...fadeLeft}
        className="max-w-md ml-8 md:ml-20"
      >
        {/* Tag */}
        <motion.span
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-[#00FF66] text-xs uppercase tracking-[0.2em] font-semibold font-mono mb-4 block"
        >
          Aerodynamics
        </motion.span>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="text-5xl font-black text-white leading-tight mb-6"
        >
          ENGINEERED
          <br />
          FOR SPEED
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="text-white/60 text-base leading-relaxed mb-8 font-sans"
        >
          Every surface has been sculpted to slice through air with minimal drag.
          Race-bred aerodynamics deliver unmatched stability at extreme velocities.
        </motion.p>

        {/* Feature list */}
        <div className="flex flex-col gap-3">
          {aeroFeatures.map((label, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <span className="w-2 h-2 rounded-full bg-[#00FF66] flex-shrink-0" />
              <span className="text-white/80 text-sm font-medium tracking-wide">
                {label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   4. EngineSection
   ────────────────────────────────────────────── */

const engineServices = [
  {
    icon: "🔧",
    title: "Engine Rebuild",
    desc: "Complete teardown and precision reassembly",
  },
  {
    icon: "⚡",
    title: "Performance Tuning",
    desc: "ECU remapping and dyno optimization",
  },
  {
    icon: "🏁",
    title: "Race Diagnostics",
    desc: "Competition-grade analysis and setup",
  },
];

export function EngineSection() {
  return (
    <section className="min-h-[150vh] flex items-center relative">
      <div className="max-w-md mr-8 md:mr-20 ml-auto">
        {/* Tag */}
        <motion.span
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-[#00FF66] text-xs uppercase tracking-[0.2em] font-semibold font-mono mb-4 block text-right"
        >
          Powertrain
        </motion.span>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="text-5xl font-black text-white leading-tight mb-8 text-right"
        >
          HEART OF
          <br />
          THE BEAST
        </motion.h2>

        {/* Service cards */}
        <div className="flex flex-col gap-4">
          {engineServices.map((svc, i) => (
            <motion.div
              key={svc.title}
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 + i * 0.15 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 pointer-events-auto"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl flex-shrink-0">{svc.icon}</span>
                <div>
                  <h3 className="text-white font-bold text-base mb-1">
                    {svc.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {svc.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   5. HotspotsSection
   ────────────────────────────────────────────── */

const hotspots = [
  { label: "Front Brake System", position: "top-[18%] left-[12%]" },
  { label: "Rear Brake", position: "top-[40%] right-[10%]" },
  { label: "Suspension", position: "top-[10%] left-[45%]" },
  { label: "Chain Drive", position: "bottom-[22%] right-[15%]" },
  { label: "ECU Module", position: "top-[50%] left-[8%]" },
  { label: "Cooling System", position: "bottom-[18%] left-[14%]" },
];

export function HotspotsSection() {
  return (
    <section className="min-h-[150vh] relative flex flex-col items-center justify-center">
      {/* Top heading */}
      <motion.div
        {...fadeUp}
        className="absolute top-20 left-1/2 -translate-x-1/2 text-center z-10"
      >
        <span className="text-[#00FF66] text-xs uppercase tracking-[0.2em] font-semibold font-mono block mb-2">
          Service Hotspots
        </span>
        <h2 className="text-3xl md:text-4xl font-black text-white">
          360° INSPECTION
        </h2>
      </motion.div>

      {/* Hotspot pills */}
      {hotspots.map((spot, i) => (
        <motion.div
          key={spot.label}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
          className={`absolute ${spot.position} z-10 pointer-events-auto`}
        >
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 hover:bg-white/10 transition cursor-default">
            {/* Pulsing dot */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF66] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00FF66]" />
            </span>
            <span className="text-white text-xs font-medium tracking-wide whitespace-nowrap">
              {spot.label}
            </span>
          </div>
        </motion.div>
      ))}

      {/* Bottom text */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
        className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white/40 text-sm text-center font-sans max-w-sm"
      >
        Comprehensive inspection at every critical point
      </motion.p>
    </section>
  );
}

/* ──────────────────────────────────────────────
   6. DiagnosticsSection
   ────────────────────────────────────────────── */

const diagnosticCards = [
  { title: "ECU Mapping", desc: "Advanced engine control unit calibration" },
  { title: "ABS Calibration", desc: "Anti-lock braking system optimization" },
  { title: "Dyno Testing", desc: "Real-time power and torque measurement" },
  { title: "Performance Analytics", desc: "Comprehensive data-driven insights" },
];

export function DiagnosticsSection() {
  return (
    <section className="min-h-[100vh] flex items-center relative">
      <div className="max-w-sm ml-8 md:ml-20">
        {/* Tag */}
        <motion.span
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-[#00FF66] text-xs uppercase tracking-[0.2em] font-semibold font-mono mb-4 block"
        >
          Digital Diagnostics
        </motion.span>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="text-5xl font-black text-white leading-tight mb-8"
        >
          PRECISION
          <br />
          ANALYTICS
        </motion.h2>

        {/* Diagnostic cards */}
        <div className="flex flex-col gap-3">
          {diagnosticCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 + i * 0.12 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 border-l-2 border-l-[#00FF66] rounded-2xl p-5 pointer-events-auto"
            >
              <h3 className="text-white font-bold text-sm mb-1">{card.title}</h3>
              <p className="text-white/50 text-xs leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Scan line overlay */}
        <div className="relative mt-6 h-px w-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#00FF66] to-transparent"
            animate={{ x: ["-100%", "400%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 bg-white/5" />
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   7. WorkshopSection
   ────────────────────────────────────────────── */

const workshopCards = [
  { icon: "🚚", title: "Pickup & Drop", desc: "Doorstep collection and delivery" },
  { icon: "⚙️", title: "OEM Parts", desc: "Genuine manufacturer components" },
  { icon: "🛢️", title: "Premium Lubricants", desc: "Top-tier oils and fluids" },
  { icon: "👨‍🔧", title: "Certified Technicians", desc: "Factory-trained experts" },
];

export function WorkshopSection() {
  return (
    <section className="min-h-[100vh] flex flex-col justify-between py-20 relative">
      {/* Header */}
      <div className="text-center px-6">
        <motion.span
          {...fadeUp}
          className="text-[#00FF66] text-xs uppercase tracking-[0.2em] font-semibold font-mono mb-4 block"
        >
          The Workshop
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="text-5xl font-black text-white leading-tight text-center"
        >
          WHERE EXCELLENCE
          <br />
          IS STANDARD
        </motion.h2>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto px-6 w-full mt-auto">
        {workshopCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut", ...stagger(i) }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center pointer-events-auto"
          >
            <span className="text-3xl block mb-3">{card.icon}</span>
            <h3 className="text-white font-bold text-sm mb-2">{card.title}</h3>
            <p className="text-white/50 text-xs leading-relaxed">{card.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   8. ComparisonSection
   ────────────────────────────────────────────── */

const comparisonStats = [
  { value: "1000+", label: "Superbikes Serviced" },
  { value: "4.9★", label: "Customer Rating" },
  { value: "24hr", label: "Turnaround Time" },
];

export function ComparisonSection() {
  return (
    <section className="min-h-[50vh] flex flex-col items-center justify-center relative px-6">
      {/* Title */}
      <motion.span
        {...fadeUp}
        className="text-[#00FF66] text-xs uppercase tracking-[0.2em] font-semibold font-mono mb-8 block"
      >
        Proven Results
      </motion.span>

      {/* Stats row */}
      <div className="flex flex-col md:flex-row gap-12 justify-center items-center">
        {comparisonStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut", ...stagger(i, 0.2) }}
            className="text-center"
          >
            <div className="text-6xl font-black text-[#00FF66] font-mono">
              {stat.value}
            </div>
            <div className="text-sm text-white/60 uppercase tracking-wider mt-3 font-sans">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   9. LaunchSection
   ────────────────────────────────────────────── */

export function LaunchSection() {
  return (
    <section className="min-h-[50vh] flex flex-col items-center justify-center relative px-6 pb-20">
      {/* Headline */}
      <motion.h2
        {...scaleFade}
        className="text-5xl md:text-7xl font-black text-center leading-tight mb-0"
      >
        <span className="text-white">READY TO UNLEASH</span>
        <br />
        <span className="text-[#00FF66]">PERFORMANCE?</span>
      </motion.h2>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 mt-10"
      >
        <Link
          href="/booking"
          className="pointer-events-auto bg-[#00FF66] text-black font-bold px-10 py-5 rounded-full text-lg text-center hover:bg-[#00FF66]/90 transition uppercase tracking-wider"
        >
          Book Service
        </Link>
        <a
          href="tel:+919008076398"
          className="pointer-events-auto border border-white/20 text-white px-10 py-5 rounded-full text-lg text-center hover:border-[#00FF66] hover:text-[#00FF66] transition uppercase tracking-wider"
        >
          Call Now
        </a>
        <a
          href="https://wa.me/919008076398"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto bg-green-600 text-white font-bold px-10 py-5 rounded-full text-lg text-center hover:bg-green-500 transition uppercase tracking-wider"
        >
          WhatsApp
        </a>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="text-white/30 text-xs mt-16 font-mono tracking-wider"
      >
        © 2026 Biker Clinic. Performance Meets Precision.
      </motion.p>
    </section>
  );
}
