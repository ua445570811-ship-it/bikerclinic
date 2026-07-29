"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth, IS_MOCK_MODE } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"login" | "phone">("login");
  const [phone, setPhone] = useState("");
  const [tempUser, setTempUser] = useState<{ uid: string; email: string; name: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/user/dashboard";

  useEffect(() => {
    // If already logged in, redirect to dashboard/target
    if (localStorage.getItem("bc_user_email")) {
      router.push(redirectUrl);
    }
  }, [router, redirectUrl]);

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
        router.push(redirectUrl);
      } else {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        if (user.email) {
          // Check if user already exists in Firestore 'users' collection
          let userData: any = null;
          let userExists = false;

          // Optimization: Check local cache first before network call!
          const cachedEmail = localStorage.getItem("bc_user_email");
          const cachedPhone = localStorage.getItem("bc_user_phone");
          if (cachedEmail === user.email && cachedPhone) {
            userData = {
              name: localStorage.getItem("bc_user_name") || user.displayName || "",
              phone: cachedPhone,
              address: localStorage.getItem("bc_user_address") || "",
              bikeBrand: localStorage.getItem("bc_user_bike_brand") || "",
              bikeModel: localStorage.getItem("bc_user_bike_model") || "",
              bikeNumber: localStorage.getItem("bc_user_bike_number") || "",
            };
            userExists = true;
          }

          if (!userExists) {
            try {
              const userDocRef = doc(db, "users", user.uid);
              
              // Set up a 2-second timeout for Firestore fetch
              const timeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error("Firestore fetch timeout")), 2000)
              );
              
              const userDocSnap = await Promise.race([
                getDoc(userDocRef),
                timeoutPromise
              ]);

              if (userDocSnap.exists() && userDocSnap.data().phone) {
                userData = userDocSnap.data();
                userExists = true;
              }
            } catch (firestoreErr) {
              console.warn("Firestore getDoc failed or timed out:", firestoreErr);
            }
          }

          if (userExists && userData) {
            localStorage.setItem("bc_user_uid", user.uid);
            localStorage.setItem("bc_user_email", user.email);
            localStorage.setItem("bc_user_name", userData.name || user.displayName || "");
            localStorage.setItem("bc_user_phone", userData.phone);
            localStorage.setItem("bc_user_address", userData.address || "");
            localStorage.setItem("bc_user_bike_brand", userData.bikeBrand || "");
            localStorage.setItem("bc_user_bike_model", userData.bikeModel || "");
            localStorage.setItem("bc_user_bike_number", userData.bikeNumber || "");
            router.push(redirectUrl);
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

        // Add to local mock users list for admin dashboard
        const mockUsers = JSON.parse(localStorage.getItem("bc_users") || "[]");
        const exists = mockUsers.some((u: any) => u.email === tempUser.email);
        if (!exists) {
          mockUsers.push({
            uid: "mock-user-123",
            email: tempUser.email,
            name: tempUser.name,
            phone: phone,
            address: "",
            bikeBrand: "",
            bikeModel: "",
            bikeNumber: "",
            createdAt: new Date().toISOString()
          });
          localStorage.setItem("bc_users", JSON.stringify(mockUsers));
        }

        router.push(redirectUrl);
      } else {
        // Save user profile to Firestore in background (non-blocking)
        localStorage.removeItem("bc_last_sync_failed");
        setDoc(doc(db, "users", tempUser.uid), {
          uid: tempUser.uid,
          email: tempUser.email,
          name: tempUser.name,
          phone: phone,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }).catch((firestoreErr) => {
          console.warn("Firestore setDoc failed in background:", firestoreErr);
          localStorage.setItem("bc_last_sync_failed", "true");
        });

        localStorage.setItem("bc_user_uid", tempUser.uid);
        localStorage.setItem("bc_user_email", tempUser.email);
        localStorage.setItem("bc_user_name", tempUser.name);
        localStorage.setItem("bc_user_phone", phone);
        localStorage.setItem("bc_user_address", "");
        localStorage.setItem("bc_user_bike_brand", "");
        localStorage.setItem("bc_user_bike_model", "");
        localStorage.setItem("bc_user_bike_number", "");
        router.push(redirectUrl);
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
      <div style={styles.glowBlue} />
      <div style={styles.glowDark} />

      <div className="booking-card anim-fade-up" style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.5rem", color: "var(--primary)" }}>motorcycle</span>
          </div>
          <div>
            <div style={styles.logoText}>Biker<span style={{ color: "var(--primary)" }}>Clinic</span></div>
            <div style={styles.logoSub}>Customer Garage Portal</div>
          </div>
        </div>

        <div style={styles.divider} />

        {redirectUrl === "/booking" && (
          <div style={styles.bookingLoginBadge}>
            🔒 Authentication is required to complete your booking.
          </div>
        )}

        {stage === "login" ? (
          <>
            <h1 style={styles.heading}>Welcome Back, Rider!</h1>
            <p style={styles.subheading}>Sign in to view your bookings, track live service status, and manage your garage.</p>

            {IS_MOCK_MODE && (
              <div style={styles.otpSentBadge}>
                💡 Demo Mode Active. Accessing with Google will log you in instantly.
              </div>
            )}

            {error && <div style={styles.errorMsg}>{error}</div>}

            <button
              onClick={handleGoogleLogin}
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" style={styles.spinner} />
              ) : (
                <>
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
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Mobile Number</label>
                <div style={styles.phoneRow}>
                  <div style={styles.countryCode}>🇮🇳 +91</div>
                  <input
                    type="tel"
                    style={{
                      width: "100%",
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "13px 14px",
                      paddingLeft: 88,
                      color: "var(--text-primary)",
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
                style={{ ...styles.submitBtn, background: "var(--primary)", color: "#fff", opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? <span className="spinner" style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> : "Complete Registration →"}
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
          <a href="/" style={styles.footerLink}>← Public Site</a>
          <a href="/admin/login" style={styles.footerLink}>Admin Console</a>
          <a href="/mechanic/login" style={styles.footerLink}>Technician Portal</a>
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
  glowBlue: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)",
    top: -100,
    left: -100,
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
    background: "var(--primary-glow)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(0,102,255,0.2)",
  },
  logoText: { fontSize: "1.25rem", fontWeight: 900, lineHeight: 1.2, letterSpacing: "-0.02em" },
  logoSub: { fontSize: "0.75rem", color: "var(--success)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" },
  divider: {
    height: 1,
    background: "linear-gradient(to right, var(--primary), transparent)",
    marginBottom: 28,
    opacity: 0.3,
  },
  heading: { fontSize: "1.5rem", fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" },
  subheading: { color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 28, lineHeight: 1.5 },
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
    borderRight: "1px solid var(--border)",
    color: "var(--text-secondary)",
    borderRadius: "8px 0 0 8px",
  },
  otpSentBadge: {
    background: "var(--primary-glow)",
    border: "1px solid rgba(0,102,255,0.2)",
    color: "var(--primary)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: "0.85rem",
    fontWeight: 700,
    marginBottom: 20,
  },
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
    background: "#fff",
    color: "#0F172A",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    transition: "var(--transition)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 14px var(--primary-glow)",
  },
  backBtn: {
    width: "100%",
    marginTop: 12,
    padding: "12px",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--text-secondary)",
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "var(--transition)",
  },
  spinner: {
    width: 20,
    height: 20,
    border: "3px solid var(--primary-glow)",
    borderTop: "3px solid var(--primary)",
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
  bookingLoginBadge: {
    background: "rgba(0,102,255,0.05)",
    border: "1px solid rgba(0,102,255,0.2)",
    color: "var(--accent)",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: "0.88rem",
    fontWeight: 700,
    marginBottom: 20,
    textAlign: "center" as const,
    lineHeight: 1.4,
  },
};

export default function UserLogin() {
  return (
    <Suspense fallback={<div style={styles.page}><span className="spinner" style={styles.spinner} /></div>}>
      <LoginForm />
    </Suspense>
  );
}
