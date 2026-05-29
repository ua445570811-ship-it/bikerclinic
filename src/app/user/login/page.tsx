"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth, IS_MOCK_MODE } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";


export default function UserLogin() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"login" | "phone">("login");
  const [phone, setPhone] = useState("");
  const [tempUser, setTempUser] = useState<{ uid: string; email: string; name: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (localStorage.getItem("bc_user_email")) {
      router.push("/user/dashboard");
    }
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      if (IS_MOCK_MODE) {
        // Fallback Mock Mode
        await new Promise((r) => setTimeout(r, 900));
        localStorage.setItem("bc_user_uid", "mock-user-123");
        localStorage.setItem("bc_user_email", "rider@example.com");
        localStorage.setItem("bc_user_name", "Demo Rider");
        localStorage.setItem("bc_user_phone", "9606538417");
        localStorage.setItem("bc_user_address", "123 Rider Street, Bangalore");
        localStorage.setItem("bc_user_bike_brand", "Royal Enfield");
        localStorage.setItem("bc_user_bike_model", "Classic 350");
        localStorage.setItem("bc_user_bike_number", "KA 03 EX 1234");
        router.push("/user/dashboard");
      } else {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        if (user.email) {
          // Check if user already exists in Firestore 'users' collection
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists() && userDocSnap.data().phone) {
            const userData = userDocSnap.data();
            localStorage.setItem("bc_user_uid", user.uid);
            localStorage.setItem("bc_user_email", user.email);
            localStorage.setItem("bc_user_name", userData.name || user.displayName || "");
            localStorage.setItem("bc_user_phone", userData.phone);
            localStorage.setItem("bc_user_address", userData.address || "");
            localStorage.setItem("bc_user_bike_brand", userData.bikeBrand || "");
            localStorage.setItem("bc_user_bike_model", userData.bikeModel || "");
            localStorage.setItem("bc_user_bike_number", userData.bikeNumber || "");
            router.push("/user/dashboard");
          } else {
            // Switch to phone stage
            setTempUser({
              uid: user.uid,
              email: user.email,
              name: user.displayName || ""
            });
            setStage("phone");
          }
        } else {
          throw new Error("No email associated with this Google account.");
        }
      }
    } catch (err: any) {
      console.error("Error during Google sign-in:", err);
      setError(err.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!tempUser) return;

    setLoading(true);
    setError("");
    try {
      if (IS_MOCK_MODE) {
        localStorage.setItem("bc_user_uid", "mock-user-123");
        localStorage.setItem("bc_user_email", tempUser.email);
        localStorage.setItem("bc_user_name", tempUser.name);
        localStorage.setItem("bc_user_phone", phone);
        localStorage.setItem("bc_user_address", "");
        localStorage.setItem("bc_user_bike_brand", "");
        localStorage.setItem("bc_user_bike_model", "");
        localStorage.setItem("bc_user_bike_number", "");
        router.push("/user/dashboard");
      } else {
        // Save user profile to Firestore
        await setDoc(doc(db, "users", tempUser.uid), {
          uid: tempUser.uid,
          email: tempUser.email,
          name: tempUser.name,
          phone: phone,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        localStorage.setItem("bc_user_uid", tempUser.uid);
        localStorage.setItem("bc_user_email", tempUser.email);
        localStorage.setItem("bc_user_name", tempUser.name);
        localStorage.setItem("bc_user_phone", phone);
        localStorage.setItem("bc_user_address", "");
        localStorage.setItem("bc_user_bike_brand", "");
        localStorage.setItem("bc_user_bike_model", "");
        localStorage.setItem("bc_user_bike_number", "");
        router.push("/user/dashboard");
      }
    } catch (err: any) {
      console.error("Error saving phone number:", err);
      setError(err.message || "Failed to complete registration. Please try again.");
    } finally {
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

        {stage === "login" ? (
          <>
            <h1 style={styles.heading}>Welcome Back, Rider!</h1>
            <p style={styles.subheading}>Sign in to view your bookings, track live service status, and manage your garage.</p>

            {IS_MOCK_MODE && (
              <div style={styles.otpSentBadge}>
                💡 Firebase is in Demo Mode. Clicking the Google button will log you in with a demo account instantly.
              </div>
            )}

            {error && <div style={styles.errorMsg}>{error}</div>}

            <button
              onClick={handleGoogleLogin}
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? (
                <span style={styles.spinner} />
              ) : (
                <>
                  {/* Inline SVG Google Icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
                    <path fill="#EA4335" d="M12 5.04c1.67 0 3.17.58 4.35 1.71l3.25-3.25C17.63 1.63 15.01 1 12 1 7.37 1 3.4 3.66 1.48 7.55l3.86 3C6.26 7.56 8.9 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.47-1.11 2.71-2.35 3.55l3.65 2.83c2.13-1.97 3.75-4.87 3.75-8.48z" />
                    <path fill="#FBBC05" d="M5.34 14.75c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.48 7.17C.54 9.07 0 11.19 0 13.4s.54 4.33 1.48 6.23l3.86-2.88z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.65-2.83c-1.01.68-2.31 1.08-4.31 1.08-3.1 0-5.74-2.52-6.66-5.51L1.48 16.7C3.4 20.59 7.37 23 12 23z" />
                  </svg>
                  Sign In with Google
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <h1 style={styles.heading}>One Last Step!</h1>
            <p style={styles.subheading}>Please enter your mobile number to complete your garage registration.</p>

            {error && <div style={styles.errorMsg}>{error}</div>}

            <form onSubmit={handlePhoneSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#9E9EB5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Mobile Number</label>
                <div style={styles.phoneRow}>
                  <div style={styles.countryCode}>🇮🇳 +91</div>
                  <input
                    type="tel"
                    style={{
                      width: "100%",
                      background: "#0E0E18",
                      border: "1px solid #2A2A3E",
                      borderRadius: "12px",
                      padding: "13px 14px",
                      paddingLeft: 88,
                      color: "#F0F0F8",
                      fontSize: "0.95rem",
                      outline: "none"
                    }}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError(""); }}
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{ ...styles.submitBtn, background: "linear-gradient(135deg, #FF3D00, #cc3000)", color: "#fff", border: "none", opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? <span style={{ ...styles.spinner, borderTopColor: "#fff", borderLeftColor: "#fff" }} /> : "Complete Registration →"}
              </button>
              
              <button
                type="button"
                onClick={() => { setStage("login"); setTempUser(null); setPhone(""); }}
                style={styles.backBtn}
              >
                ← Back
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
  phoneRow: { position: "relative", display: "flex", width: "100%" },
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
    zIndex: 2,
    pointerEvents: "none",
    borderRight: "1px solid #2A2A3E",
    color: "#B0B0C8",
    borderRadius: "12px 0 0 12px",
  },
  otpSentBadge: {
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    color: "#818cf8",
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
    background: "#fff",
    color: "#0F172A",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
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
    border: "3px solid rgba(15,23,42,0.3)",
    borderTop: "3px solid #0F172A",
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
