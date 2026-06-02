"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

import { useEffect, useState } from "react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const name = searchParams.get("name") || "Rider";
  const [syncFailed, setSyncFailed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSyncFailed(localStorage.getItem("bc_last_sync_failed") === "true");
    }
  }, []);

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <Link href="/" style={s.logo}>🏍️ Biker<span style={{ color: "#FF3D00" }}>Clinic</span></Link>
      </nav>
      
      <div style={s.container}>
        <div style={s.card}>
          {syncFailed && (
            <div style={{
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              color: "#F59E0B",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: "0.85rem",
              lineHeight: 1.4,
              textAlign: "left",
              marginBottom: 24
            }}>
              <strong>⚠️ Cloud Sync Warning:</strong> Your booking is saved locally on this device, but could not be uploaded to our servers. Technicians will not see this booking until your database connectivity is restored.
            </div>
          )}

          <div style={s.successCircle}>
            <div style={s.checkmark}>✓</div>
          </div>
          
          <h1 style={s.title}>Booking Confirmed!</h1>
          <p style={s.subtitle}>Thanks, {name}. Your bike is in good hands.</p>
          
          <div style={s.idBox}>
            <div style={s.idLabel}>BOOKING ID</div>
            <div style={s.idValue}>{id}</div>
          </div>
          
          <p style={s.desc}>We've received your request. You'll get an SMS shortly when a mechanic is assigned to your job.</p>
          
          <div style={s.actions}>
            <Link href={`/track?id=${id}`} style={s.trackBtn}>📍 Track Live Status</Link>
            <Link href="/" style={s.homeBtn}>Return to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div style={s.page}>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { background: "#0E0E18", minHeight: "100vh", display: "flex", flexDirection: "column" },
  nav: { padding: "20px 32px", borderBottom: "1px solid #1E1E2E", background: "#0A0A14" },
  logo: { fontSize: "1.2rem", fontWeight: 800, textDecoration: "none", color: "#F0F0F8" },
  container: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 20, padding: 40, width: "100%", maxWidth: 480, textAlign: "center" },
  successCircle: { width: 80, height: 80, borderRadius: "50%", background: "rgba(0, 230, 118, 0.1)", border: "2px solid rgba(0, 230, 118, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" },
  checkmark: { color: "#00E676", fontSize: "3rem", fontWeight: 800 },
  title: { fontSize: "1.8rem", fontWeight: 800, marginBottom: 8 },
  subtitle: { color: "#9E9EB5", fontSize: "1.05rem", marginBottom: 32 },
  idBox: { background: "#0E0E18", border: "1px dashed #2A2A3E", borderRadius: 12, padding: "16px", marginBottom: 24 },
  idLabel: { color: "#6B6B88", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 },
  idValue: { color: "#FF3D00", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "0.05em", fontFamily: "monospace" },
  desc: { color: "#6B6B88", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 32 },
  actions: { display: "flex", flexDirection: "column", gap: 12 },
  trackBtn: { width: "100%", padding: 16, background: "linear-gradient(135deg, #FF3D00, #cc3000)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "1rem", cursor: "pointer", textDecoration: "none" },
  homeBtn: { width: "100%", padding: 16, background: "transparent", color: "#6B6B88", border: "1px solid #2A2A3E", borderRadius: 12, fontWeight: 600, fontSize: "1rem", cursor: "pointer", textDecoration: "none" },
};
