"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MechanicLogin() {
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 800));
    const nameClean = name.trim();
    if (nameClean && passcode.length >= 4) {
      localStorage.setItem("bc_mechanic_name", nameClean);

      // Register this mechanic dynamically if not already present
      const raw = localStorage.getItem("bc_registered_mechanics");
      const mechs = raw ? JSON.parse(raw) : [];
      const exists = mechs.find((m: any) => m.name.toLowerCase() === nameClean.toLowerCase());
      
      if (!exists) {
        mechs.push({
          name: nameClean,
          specialties: [
            "General Service", "Full Service", "Periodic Service", "Basic Care", "Standard Service",
            "Home Classic", "Scooty/Moped", "Oil Change", "Brake Service", "Brakes & Clutch",
            "Tyre Replacement", "Battery Service", "Tyres", "Roadside Rescue", "Electrical Repair",
            "Suspension Repair", "Engine Overhaul", "Engine Tuning", "Full Workshop", "Accident Repair",
            "Home Premium", "Royal Enfield", "SuperBike", "Wash & Detailing"
          ]
        });
        localStorage.setItem("bc_registered_mechanics", JSON.stringify(mechs));
      }

      router.push("/mechanic/dashboard");
    } else {
      setError("Enter your name and a passcode of at least 4 characters.");
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.glowAmber} />
      <div style={styles.glowDark} />

      <div className="booking-card anim-fade-up" style={styles.card}>
        <div style={styles.badgeRow}>
          <div style={styles.badge}>👨‍🔧 TECHNICIAN PORTAL</div>
        </div>

        <div style={styles.iconCircle}>
          <span className="material-symbols-outlined" style={{ fontSize: "2rem", color: "var(--mechanic-accent)" }}>construction</span>
        </div>
        <h1 style={styles.heading}>Field Technician Login</h1>
        <p style={styles.subheading}>Access your assigned job queue. For BikerClinic certified mechanics only.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Your Name / Technician ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Kiran, Raju, T-104"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ textTransform: "capitalize" }}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">PIN / Passcode</label>
            <input
              type="password"
              className="form-input"
              placeholder="Min. 4 characters"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              maxLength={8}
              required
            />
          </div>

          {error && <div style={styles.errorMsg}>{error}</div>}

          <button
            type="submit"
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={styles.spinner} /> : (
              <>
                Enter Field App
                <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>input</span>
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <Link href="/" style={styles.footerLink}>← Public Site</Link>
          <Link href="/admin/login" style={styles.footerLink}>Admin Portal</Link>
          <Link href="/user/login" style={styles.footerLink}>Customer Login</Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
    background: "var(--bg)",
    color: "var(--text-primary)"
  },
  glowAmber: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
    top: -80,
    left: "50%",
    transform: "translateX(-50%)",
    pointerEvents: "none",
  },
  glowDark: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.01) 0%, transparent 70%)",
    bottom: -80,
    right: -80,
    pointerEvents: "none",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "40px",
    width: "100%",
    maxWidth: 460,
    boxShadow: "var(--shadow-lg)",
    position: "relative",
    zIndex: 1,
    textAlign: "center",
  },
  badgeRow: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 20,
  },
  badge: {
    background: "rgba(245,158,11,0.08)",
    color: "var(--mechanic-accent)",
    border: "1px solid rgba(245,158,11,0.2)",
    padding: "6px 14px",
    borderRadius: 99,
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "rgba(245,158,11,0.08)",
    border: "1px solid rgba(245,158,11,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  heading: {
    fontSize: "1.5rem",
    fontWeight: 800,
    marginBottom: 8,
    letterSpacing: "-0.02em"
  },
  subheading: {
    color: "var(--text-secondary)",
    fontSize: "0.9rem",
    marginBottom: 28,
    lineHeight: 1.5,
  },
  errorMsg: {
    background: "rgba(239,68,68,0.05)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#EF4444",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: "0.875rem",
    marginBottom: 16,
    textAlign: "left",
  },
  submitBtn: {
    width: "100%",
    padding: "16px",
    background: "var(--mechanic-accent)",
    color: "#000",
    border: "none",
    borderRadius: 8,
    fontWeight: 800,
    fontSize: "1rem",
    cursor: "pointer",
    transition: "var(--transition)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 4px 14px rgba(245,158,11,0.25)",
  },
  spinner: {
    width: 20,
    height: 20,
    border: "3px solid rgba(0,0,0,0.15)",
    borderTop: "3px solid #000",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 20,
    borderTop: "1px solid var(--border)",
  },
  footerLink: {
    color: "var(--text-muted)",
    fontSize: "0.8rem",
    transition: "var(--transition)"
  },
};
