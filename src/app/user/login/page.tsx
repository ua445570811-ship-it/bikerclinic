"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserLogin() {
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const router = useRouter();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) { setError("Enter a valid 10-digit number."); return; }
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    
    // Generate a random 4 digit mock OTP code for demo purposes
    const mockCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(mockCode);
    setStage("otp");
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 800));
    
    if (otp === generatedOtp) {
      localStorage.setItem("bc_user_phone", phone);
      router.push("/user/dashboard");
    } else {
      setError(`Invalid OTP. Enter the mock code: ${generatedOtp}`);
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.glowRed} />
      <div style={styles.glowGreen} />

      <div className="booking-card anim-fade-up" style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>🏍️</div>
          <div>
            <div style={styles.logoText}>Biker<span style={{ color: "#FF3D00" }}>Clinic</span></div>
            <div style={styles.logoSub}>Customer Garage Portal</div>
          </div>
        </div>

        <div style={styles.divider} />

        {stage === "phone" ? (
          <>
            <h1 style={styles.heading}>Welcome Back, Rider!</h1>
            <p style={styles.subheading}>Enter your registered mobile number to view your bookings and service history.</p>
            <form onSubmit={handlePhoneSubmit}>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <div style={styles.phoneRow}>
                  <div style={styles.countryCode}>🇮🇳 +91</div>
                  <input
                    type="tel"
                    className="form-input"
                    style={{ paddingLeft: 80, borderRadius: "0 12px 12px 0", borderLeft: "none" }}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError(""); }}
                    maxLength={10}
                    required
                  />
                </div>
              </div>
              {error && <div style={styles.errorMsg}>{error}</div>}
              <button
                type="submit"
                style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? <span style={styles.spinner} /> : "Send OTP →"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={styles.otpSentBadge}>
              ✅ OTP sent to +91 {phone}. For demo, enter code: <strong style={{ color: "#fff", background: "#FF3D00", padding: "2px 8px", borderRadius: 4, marginLeft: 4 }}>{generatedOtp}</strong>
            </div>
            <h1 style={styles.heading}>Enter OTP</h1>
            <p style={styles.subheading}>A 4-digit verification code has been simulated for this demo. Please enter the code shown in the badge above.</p>
            <form onSubmit={handleOtpSubmit}>
              <div className="form-group">
                <label className="form-label">4-Digit OTP</label>
                <input
                  type="tel"
                  className="form-input"
                  style={{ fontSize: "1.5rem", textAlign: "center", letterSpacing: "0.5em", fontWeight: 700 }}
                  placeholder="• • • •"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                  maxLength={4}
                  required
                  autoFocus
                />
              </div>
              {error && <div style={styles.errorMsg}>{error}</div>}
              <button
                type="submit"
                style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? <span style={styles.spinner} /> : "Verify & Enter Garage →"}
              </button>
              <button type="button" onClick={() => { setStage("phone"); setOtp(""); }} style={styles.backBtn}>
                ← Change Number
              </button>
            </form>
          </>
        )}

        <div style={styles.footer}>
          <a href="/" style={styles.footerLink}>← Back to Site</a>
          <a href="/admin/login" style={styles.footerLink}>Admin Portal</a>
          <a href="/mechanic/login" style={styles.footerLink}>Mechanic Portal</a>
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
    background: "#0E0E18",
  },
  glowRed: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,61,0,0.1) 0%, transparent 70%)",
    top: -100,
    left: -100,
    pointerEvents: "none",
  },
  glowGreen: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,230,118,0.06) 0%, transparent 70%)",
    bottom: -80,
    right: -80,
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
    boxShadow: "0 8px 60px rgba(0,0,0,0.6)",
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
  logoText: { fontSize: "1.2rem", fontWeight: 700, lineHeight: 1.2 },
  logoSub: { fontSize: "0.75rem", color: "#00E676", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" },
  divider: {
    height: 1,
    background: "linear-gradient(to right, #FF3D00, transparent)",
    marginBottom: 28,
    opacity: 0.5,
  },
  heading: { fontSize: "1.6rem", fontWeight: 700, marginBottom: 8 },
  subheading: { color: "#6B6B88", fontSize: "0.9rem", marginBottom: 28, lineHeight: 1.5 },
  phoneRow: { position: "relative", display: "flex" },
  countryCode: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 72,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.9rem",
    zIndex: 1,
    pointerEvents: "none",
  },
  otpSentBadge: {
    background: "rgba(0,230,118,0.1)",
    border: "1px solid rgba(0,230,118,0.2)",
    color: "#00E676",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: "0.85rem",
    fontWeight: 600,
    marginBottom: 20,
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
    background: "linear-gradient(135deg, #FF3D00, #cc3000)",
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
    boxShadow: "0 4px 20px rgba(255,61,0,0.3)",
  },
  backBtn: {
    width: "100%",
    marginTop: 12,
    padding: "12px",
    background: "transparent",
    border: "1px solid #2A2A3E",
    borderRadius: 12,
    color: "#6B6B88",
    fontSize: "0.9rem",
    cursor: "pointer",
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
  },
  footerLink: { color: "#6B6B88", fontSize: "0.8rem" },
};
