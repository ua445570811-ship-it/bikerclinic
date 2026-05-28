"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <div style={styles.glowRed} />

      <div className="booking-card anim-fade-up" style={styles.card}>
        {/* Header */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>🏍️</div>
          <div>
            <div style={styles.logoText}>Biker<span style={{ color: "#FF3D00" }}>Clinic</span></div>
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
              <span style={styles.spinner} />
            ) : (
              "Access Dashboard →"
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <a href="/" style={styles.footerLink}>← Back to Public Site</a>
          <a href="/mechanic/login" style={styles.footerLink}>Mechanic Portal</a>
          <a href="/user/login" style={styles.footerLink}>Customer Login</a>
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
    background: "#0A0A14",
  },
  glowPurple: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
    top: -100,
    right: -100,
    pointerEvents: "none",
  },
  glowRed: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,61,0,0.08) 0%, transparent 70%)",
    bottom: -80,
    left: -80,
    pointerEvents: "none",
  },
  card: {
    background: "rgba(22, 22, 34, 0.95)",
    backdropFilter: "blur(20px)",
    border: "1px solid #2A2A3E",
    borderRadius: 20,
    padding: "40px",
    width: "100%",
    maxWidth: 460,
    boxShadow: "0 8px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)",
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
    borderRadius: 12,
    background: "rgba(255,61,0,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    border: "1px solid rgba(255,61,0,0.2)",
  },
  logoText: {
    fontSize: "1.2rem",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: "0.75rem",
    color: "#6366F1",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  divider: {
    height: 1,
    background: "linear-gradient(to right, #6366F1, transparent)",
    marginBottom: 28,
    opacity: 0.5,
  },
  heading: {
    fontSize: "1.6rem",
    fontWeight: 700,
    marginBottom: 8,
  },
  subheading: {
    color: "#6B6B88",
    fontSize: "0.9rem",
    marginBottom: 28,
    lineHeight: 1.5,
  },
  errorMsg: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#EF4444",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: "0.875rem",
    marginBottom: 16,
  },
  submitBtn: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #6366F1, #4F46E5)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
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
    borderTop: "1px solid #2A2A3E",
    gap: 12,
    flexWrap: "wrap",
  },
  footerLink: {
    color: "#6B6B88",
    fontSize: "0.8rem",
    transition: "color 0.2s",
  },
};
