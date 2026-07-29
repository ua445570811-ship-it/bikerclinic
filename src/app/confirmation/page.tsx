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
        <Link href="/" style={s.logo}>🏍️ Biker<span style={{ color: "var(--primary)" }}>Clinic</span></Link>
      </nav>
      
      <div style={s.container}>
        <div style={s.card}>
          {syncFailed && (
            <div style={{
              background: "rgba(245, 158, 11, 0.05)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              color: "#F59E0B",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: "0.82rem",
              lineHeight: 1.45,
              textAlign: "left",
              marginBottom: 24,
              fontWeight: 500
            }}>
              <strong>⚠️ Cloud Sync Warning:</strong> Your booking is saved locally on this device, but could not be uploaded to our servers. Technicians will not see this booking until database connectivity is restored.
            </div>
          )}

          <div style={s.successCircle}>
            <span style={{ fontSize: "2.4rem", color: "var(--primary)" }}>✓</span>
          </div>
          
          <h1 style={s.title}>Booking Confirmed</h1>
          <p style={s.subtitle}>Thanks, {name}. Your ride is queued for service.</p>
          
          <div style={s.idBox}>
            <div style={s.idLabel}>BOOKING ID</div>
            <div style={s.idValue} className="mono-text">{id}</div>
          </div>
          
          <p style={s.desc}>We have logged your diagnostic request. You will receive an SMS notification as soon as a technician is dispatched.</p>
          
          <div style={s.actions}>
            <Link href={`/track?id=${id}`} style={s.trackBtn}>
              TRACK LIVE STATUS
              <span style={{ fontSize: "1.1rem" }}>📍</span>
            </Link>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 4 }}>
              <Link href="/" style={s.homeBtn}>🏠 Home</Link>
              <Link href="/booking" style={s.homeBtn}>🔧 Book Service</Link>
              <Link href="/user/dashboard" style={s.homeBtn}>👤 My Garage</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div style={s.page}>Loading confirmation details...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", color: "var(--text-primary)" },
  nav: { padding: "20px 32px", borderBottom: "1px solid var(--border)", background: "rgba(17, 19, 22, 0.95)" },
  logo: { fontSize: "1.2rem", fontWeight: 900, textDecoration: "none", color: "var(--text-primary)", letterSpacing: "-0.02em" },
  container: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 40, width: "100%", maxWidth: 480, textAlign: "center", boxShadow: "var(--shadow-lg)" },
  successCircle: { width: 72, height: 72, borderRadius: "50%", background: "var(--primary-glow)", border: "1px solid rgba(0, 102, 255, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 0 16px var(--primary-glow)" },
  title: { fontSize: "1.6rem", fontWeight: 900, marginBottom: 8, letterSpacing: "-0.02em" },
  subtitle: { color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: 32 },
  idBox: { background: "var(--bg)", border: "1px dashed var(--border)", borderRadius: 10, padding: "16px", marginBottom: 24 },
  idLabel: { color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 },
  idValue: { color: "var(--primary)", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "0.05em" },
  desc: { color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.55, marginBottom: 32 },
  actions: { display: "flex", flexDirection: "column", gap: 12 },
  trackBtn: { width: "100%", padding: 16, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "var(--transition)", boxShadow: "0 4px 14px var(--primary-glow)" },
  homeBtn: { flex: 1, minWidth: 120, padding: 12, background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 8, fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", textDecoration: "none", transition: "var(--transition)", textAlign: "center" },
};
