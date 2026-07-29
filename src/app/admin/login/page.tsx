"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Mock auth — replace with Firebase Auth
    await new Promise((r) => setTimeout(r, 800));
    if (email === "admin@bikerclinic.com" && password.length >= 4) {
      sessionStorage.setItem("bc_admin_auth", "true");
      router.push("/admin/dashboard");
    } else {
      setError("Invalid credentials. Try admin@bikerclinic.com");
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background Glow */}
      <div style={styles.glowPurple} />
      <div style={styles.glowDark} />

      <div className="booking-card anim-fade-up" style={styles.card}>
        {/* Header */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.5rem", color: "var(--admin-accent)" }}>admin_panel_settings</span>
          </div>
          <div>
            <div style={styles.logoText}>Biker<span style={{ color: "var(--primary)" }}>Clinic</span></div>
            <div style={styles.logoSub}>Executive Admin Portal</div>
          </div>
        </div>

        <div style={styles.divider} />

        <h1 style={styles.heading}>Admin Sign In</h1>
        <p style={styles.subheading}>Restricted access. Authorized personnel only.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@bikerclinic.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div style={styles.errorMsg}>{error}</div>}

          <button
            type="submit"
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" style={styles.spinner} />
            ) : (
              <>
                Access Dashboard
                <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>vpn_key</span>
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <Link href="/" style={styles.footerLink}>← Public Site</Link>
          <Link href="/mechanic/login" style={styles.footerLink}>Technician Portal</Link>
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
  glowPurple: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
    top: -100,
    right: -100,
    pointerEvents: "none",
  },
  glowDark: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.01) 0%, transparent 70%)",
    bottom: -80,
    left: -80,
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
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    background: "rgba(99, 102, 241, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(99, 102, 241, 0.2)",
  },
  logoText: { fontSize: "1.25rem", fontWeight: 900, lineHeight: 1.2, letterSpacing: "-0.02em" },
  logoSub: { fontSize: "0.75rem", color: "var(--admin-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" },
  divider: {
    height: 1,
    background: "linear-gradient(to right, var(--admin-accent), transparent)",
    marginBottom: 28,
    opacity: 0.3,
  },
  heading: { fontSize: "1.5rem", fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" },
  subheading: { color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 28, lineHeight: 1.5 },
  errorMsg: {
    background: "rgba(239,68,68,0.05)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#EF4444",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: "0.875rem",
    marginBottom: 16,
  },
  submitBtn: {
    width: "100%",
    padding: "16px",
    background: "var(--admin-accent)",
    color: "#fff",
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
    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.25)",
  },
  spinner: {
    width: 20,
    height: 20,
    border: "3px solid rgba(255,255,255,0.3)",
    borderTop: "3px solid #fff",
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
  footerLink: { color: "var(--text-muted)", fontSize: "0.8rem", transition: "var(--transition)" },
};
