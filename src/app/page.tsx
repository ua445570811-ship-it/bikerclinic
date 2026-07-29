"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const HeroSequence = dynamic(
  () => import("./components/hero/HeroSequence"),
  { ssr: false }
);

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={s.page}>
      {/* FIXED NAV */}
      <nav style={{ ...s.nav, ...(scrolled ? s.navScrolled : {}) }}>
        <div style={s.navInner}>
          <div style={s.logo}>
            🏍️ Biker<span style={{ color: "#FF1E27" }}>Clinic</span>
          </div>
          <button
            className="mobile-nav-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
          <div
            className={mobileOpen ? "responsive-nav-active" : "responsive-nav"}
            onClick={() => setMobileOpen(false)}
          >
            <Link href="/" style={s.navLink}>
              Home
            </Link>
            <Link href="/booking" style={s.navLink}>
              Services
            </Link>
            <Link href="#how-it-works" style={s.navLink}>
              How It Works
            </Link>
            <Link href="#reviews" style={s.navLink}>
              Reviews
            </Link>
            <Link href="#contact" style={s.navLink}>
              Contact
            </Link>
            <Link href="/track" style={s.navLink}>
              Track Order
            </Link>
            <Link href="/user/dashboard" style={s.navLinkGhost}>
              👤 My Garage
            </Link>
            <Link href="/booking" style={s.bookBtn}>
              Book Now
            </Link>
          </div>
        </div>
      </nav>

      {/* PURE 3D SCROLL SEQUENCE (208 Frames across 6 Storyboard Sections, 600vh) */}
      <HeroSequence />

      {/* FOOTER */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerLogo}>
            🏍️ Biker<span style={{ color: "#FF1E27" }}>Clinic</span>
          </div>
          <p
            style={{
              color: "#6B6B88",
              fontSize: "0.85rem",
              textAlign: "center" as const,
              maxWidth: 500,
              lineHeight: 1.6,
            }}
          >
            📍 4th Main, 1st Phase, Nanjundeshwara Layout, Nyanappahalli,
            Bengaluru, Karnataka 560076
            <br />
            📞 Helpline:{" "}
            <a
              href="tel:+919008076398"
              style={{ color: "#FF1E27", fontWeight: 600 }}
            >
              +91 90080 76398
            </a>{" "}
            | ✉️ support@bikerclinic.com
          </p>
          <div style={s.footerLinks}>
            <Link href="/admin/login" style={s.footerLink}>
              Admin Portal
            </Link>
            <Link href="/mechanic/login" style={s.footerLink}>
              Mechanic Portal
            </Link>
            <Link href="/user/login" style={s.footerLink}>
              Customer Login
            </Link>
            <Link href="/track" style={s.footerLink}>
              Track Order
            </Link>
          </div>
          <p style={s.footerCopy}>
            © 2026 BikerClinic. All rights reserved. Bangalore, India.
          </p>
        </div>
      </footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { background: "#000000", minHeight: "100vh", color: "#fff" },
  nav: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: "20px 0",
    transition: "all 0.3s",
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  navScrolled: {
    background: "rgba(0,0,0,0.95)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,30,39,0.3)",
    padding: "14px 0",
  },
  navInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { fontSize: "1.3rem", fontWeight: 800 },
  navLink: {
    color: "#B0B0C8",
    fontSize: "0.9rem",
    fontWeight: 500,
    textDecoration: "none",
    transition: "color 0.2s",
  },
  navLinkGhost: {
    color: "#B0B0C8",
    fontSize: "0.9rem",
    fontWeight: 500,
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.15)",
    padding: "8px 16px",
    borderRadius: 8,
  },
  bookBtn: {
    background: "#FF1E27",
    color: "#fff",
    padding: "10px 22px",
    borderRadius: 8,
    fontWeight: 800,
    fontSize: "0.9rem",
    textDecoration: "none",
    boxShadow: "0 0 20px rgba(255,30,39,0.4)",
  },
  topBar: {
    background: "#030305",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    padding: "10px 0",
    fontSize: "0.78rem",
    color: "#8E8EB3",
    position: "relative",
    zIndex: 101,
  },
  topBarInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: 10,
  },
  topBarLink: {
    color: "#FF1E27",
    fontWeight: 700,
    textDecoration: "none",
    transition: "color 0.2s",
  },
  footer: {
    background: "#000000",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    padding: "60px 0 40px",
    position: "relative",
    zIndex: 10,
  },
  footerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 24,
  },
  footerLogo: { fontSize: "1.3rem", fontWeight: 800 },
  footerLinks: {
    display: "flex",
    gap: 24,
    flexWrap: "wrap" as const,
    justifyContent: "center",
  },
  footerLink: {
    color: "#6B6B88",
    fontSize: "0.85rem",
    textDecoration: "none",
  },
  footerCopy: { color: "#3A3A52", fontSize: "0.8rem" },
};
