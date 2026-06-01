"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db, IS_MOCK_MODE } from "@/lib/firebase";
import { collection, query, where, onSnapshot, or, doc, getDoc, setDoc } from "firebase/firestore";


type Booking = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  brand: string;
  model: string;
  service?: string;
  package?: string;
  serviceType: string;
  date: string;
  time: string;
  status: string;
  address: string;
  assignedMechanic?: string;
  promoCode?: string;
  discountAmount?: number;
};

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  New: { bg: "rgba(99,102,241,0.1)", color: "#6366F1", label: "Booking Received" },
  Assigned: { bg: "rgba(245,158,11,0.1)", color: "#F59E0B", label: "Mechanic Assigned" },
  "In Progress": { bg: "rgba(255,61,0,0.1)", color: "#FF3D00", label: "Service In Progress" },
  Completed: { bg: "rgba(0,230,118,0.1)", color: "#00E676", label: "Completed ✅" },
};

const BRANDS = ["Hero", "Honda", "TVS", "Bajaj", "Royal Enfield", "Yamaha", "Suzuki", "KTM", "Kawasaki", "Other"];

export default function UserDashboard() {
  const router = useRouter();
  const [userPhone, setUserPhone] = useState("");
  const [userName, setUserName] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"active" | "history" | "profile">("active");
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    bikeBrand: "",
    bikeModel: "",
    bikeNumber: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadBookings = useCallback((phone: string, email: string) => {
    const all: Booking[] = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
    const mine = all.filter(b => (phone && b.phone === phone) || (email && b.email === email)).reverse();
    setBookings(mine);
    if (mine.length > 0 && mine[0].name) setUserName(mine[0].name.split(" ")[0]);
  }, []);

  useEffect(() => {
    const email = localStorage.getItem("bc_user_email") || "";
    const phone = localStorage.getItem("bc_user_phone") || "";
    if (!email && !phone) { router.push("/user/login"); return; }
    setUserPhone(phone);

    // Initial load from localStorage
    const savedName = localStorage.getItem("bc_user_name") || "";
    if (savedName) setUserName(savedName.split(" ")[0]);
    setProfile({
      name: savedName,
      phone: phone,
      email: email,
      address: localStorage.getItem("bc_user_address") || "",
      bikeBrand: localStorage.getItem("bc_user_bike_brand") || "",
      bikeModel: localStorage.getItem("bc_user_bike_model") || "",
      bikeNumber: localStorage.getItem("bc_user_bike_number") || "",
    });

    const uid = localStorage.getItem("bc_user_uid") || "";
    if (uid && !IS_MOCK_MODE) {
      const userRef = doc(db, "users", uid);
      getDoc(userRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const loadedProfile = {
            name: data.name || "",
            phone: data.phone || "",
            email: data.email || "",
            address: data.address || "",
            bikeBrand: data.bikeBrand || "",
            bikeModel: data.bikeModel || "",
            bikeNumber: data.bikeNumber || "",
          };
          setProfile(loadedProfile);
          
          localStorage.setItem("bc_user_name", loadedProfile.name);
          localStorage.setItem("bc_user_phone", loadedProfile.phone);
          localStorage.setItem("bc_user_address", loadedProfile.address);
          localStorage.setItem("bc_user_bike_brand", loadedProfile.bikeBrand);
          localStorage.setItem("bc_user_bike_model", loadedProfile.bikeModel);
          localStorage.setItem("bc_user_bike_number", loadedProfile.bikeNumber);
          if (loadedProfile.name) setUserName(loadedProfile.name.split(" ")[0]);
        }
      }).catch(err => console.error("Error loading profile from Firestore:", err));
    }

    if (IS_MOCK_MODE) {
      loadBookings(phone, email);
      const interval = setInterval(() => loadBookings(phone, email), 2000);
      return () => clearInterval(interval);
    } else {
      // Build query using or() constraint for phone/email matching
      const constraints = [];
      if (email) constraints.push(where("email", "==", email));
      if (phone) constraints.push(where("phone", "==", phone));

      let q;
      if (constraints.length > 1) {
        q = query(collection(db, "bookings"), or(where("email", "==", email), where("phone", "==", phone)));
      } else if (constraints.length === 1) {
        q = query(collection(db, "bookings"), constraints[0]);
      } else {
        q = query(collection(db, "bookings"), where("email", "==", "non-existent-placeholder"));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const mine: Booking[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Avoid duplicate push if both doc.id is same, and merge firestore metadata
          mine.push({ ...data, id: data.id || doc.id } as Booking);
        });

        // Sort by createdAt descending
        mine.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        setBookings(mine);
        if (mine.length > 0 && mine[0].name) {
          setUserName(mine[0].name.split(" ")[0]);
        }
      }, (error) => {
        console.error("Firestore onSnapshot error:", error);
        loadBookings(phone, email);
      });

      return () => unsubscribe();
    }
  }, [router, loadBookings]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.phone.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    setSaveLoading(true);
    setSaveSuccess(false);
    try {
      const uid = localStorage.getItem("bc_user_uid") || "mock-user-123";
      
      if (!IS_MOCK_MODE) {
        const userRef = doc(db, "users", uid);
        setDoc(userRef, {
          uid,
          email: profile.email,
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
          bikeBrand: profile.bikeBrand,
          bikeModel: profile.bikeModel,
          bikeNumber: profile.bikeNumber,
          updatedAt: new Date().toISOString()
        }, { merge: merge }).catch((err) => {
          console.error("Firestore background profile save failed:", err);
        });
      }

      // Update local storage values
      localStorage.setItem("bc_user_name", profile.name);
      localStorage.setItem("bc_user_phone", profile.phone);
      localStorage.setItem("bc_user_address", profile.address);
      localStorage.setItem("bc_user_bike_brand", profile.bikeBrand);
      localStorage.setItem("bc_user_bike_model", profile.bikeModel);
      localStorage.setItem("bc_user_bike_number", profile.bikeNumber);

      setUserName(profile.name.split(" ")[0]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const activeBookings = bookings.filter(b => b.status !== "Completed");
  const pastBookings = bookings.filter(b => b.status === "Completed");
  const displayBookings = tab === "active" ? activeBookings : pastBookings;

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.logo}>🏍️ Biker<span style={{ color: "#FF3D00" }}>Clinic</span></div>
        <button onClick={() => { localStorage.removeItem("bc_user_phone"); localStorage.removeItem("bc_user_email"); localStorage.removeItem("bc_user_name"); router.push("/user/login"); }} style={s.logoutBtn}>Sign Out</button>
      </nav>

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.container}>
          <p style={s.greeting}>Welcome back{userName ? `, ${userName}` : ""}! 👋</p>
          <h1 style={s.heroTitle}>My Garage</h1>
          <p style={s.heroSub}>Manage and track all your BikerClinic services in one place.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginTop: 24 }}>
            <Link href="/booking" style={s.bookBtn}>🔧 Book New Service</Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ ...s.container, paddingTop: 32, paddingBottom: 40 }}>

        {/* Stats */}
        <div className="responsive-grid-3" style={{ marginBottom: 28 }}>
          {[
            { label: "Total Services", value: bookings.length, color: "#6366F1" },
            { label: "Active Now", value: activeBookings.length, color: "#FF3D00" },
            { label: "Completed", value: pastBookings.length, color: "#00E676" },
          ].map(stat => (
            <div key={stat.label} style={{ ...s.statCard, borderTop: `3px solid ${stat.color}` }}>
              <div style={{ fontSize: "0.8rem", color: "#6B6B88", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{stat.label}</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={s.tabRow}>
          <button onClick={() => setTab("active")} style={{ ...s.tabBtn, ...(tab === "active" ? s.tabActive : {}) }}>
            Active Bookings {activeBookings.length > 0 && <span style={s.tabBadge}>{activeBookings.length}</span>}
          </button>
          <button onClick={() => setTab("history")} style={{ ...s.tabBtn, ...(tab === "history" ? s.tabActive : {}) }}>
            Service History
          </button>
          <button onClick={() => setTab("profile")} style={{ ...s.tabBtn, ...(tab === "profile" ? s.tabActive : {}) }}>
            👤 My Profile
          </button>
        </div>

        {/* Booking Cards */}
        {/* Booking Cards / Profile Form */}
        {tab === "profile" ? (
          <div style={s.profileCard} className="booking-card anim-fade-up">
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 6 }}>Edit Profile</h2>
            <p style={{ color: "#6B6B88", fontSize: "0.9rem", marginBottom: 28 }}>
              Keep your contact details and bike information updated for faster service bookings.
            </p>

            {saveSuccess && (
              <div style={{ background: "rgba(0, 230, 118, 0.1)", color: "#00E676", border: "1px solid rgba(0, 230, 118, 0.2)", borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontSize: "0.9rem", fontWeight: 600 }}>
                ✅ Profile updated successfully! Your saved details will be pre-filled during new bookings.
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#FF3D00", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20, borderBottom: "1px solid #1E1E2E", paddingBottom: 8 }}>
                👤 Personal Details
              </h3>
              
              <div style={s.formRow}>
                <div style={s.formGroup}>
                  <label style={s.label}>Full Name</label>
                  <input
                    type="text"
                    style={s.input}
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                    placeholder="e.g. John Doe"
                  />
                </div>
                
                <div style={s.formGroup}>
                  <label style={s.label}>Mobile Number</label>
                  <div style={{ position: "relative", display: "flex", width: "100%" }}>
                    <div style={s.countryCode}>🇮🇳 +91</div>
                    <input
                      type="tel"
                      style={{ ...s.input, paddingLeft: 88 }}
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, "") })}
                      maxLength={10}
                      required
                      placeholder="9876543210"
                    />
                  </div>
                </div>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Email Address (Linked Google Account)</label>
                <input
                  type="email"
                  style={{ ...s.input, opacity: 0.6, cursor: "not-allowed", background: "#0A0A14" }}
                  value={profile.email}
                  disabled
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Default Service Address</label>
                <textarea
                  style={{ ...s.input, minHeight: 80, resize: "vertical" }}
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Enter your doorstep service address"
                />
              </div>

              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#FF3D00", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 32, marginBottom: 20, borderBottom: "1px solid #1E1E2E", paddingBottom: 8 }}>
                🏍️ Garage & Bike Details
              </h3>

              <div style={s.formRow}>
                <div style={s.formGroup}>
                  <label style={s.label}>Bike Brand</label>
                  <select
                    style={s.input}
                    value={profile.bikeBrand}
                    onChange={(e) => setProfile({ ...profile, bikeBrand: e.target.value })}
                  >
                    <option value="">Select Brand</option>
                    {BRANDS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                
                <div style={s.formGroup}>
                  <label style={s.label}>Bike Model</label>
                  <input
                    type="text"
                    style={s.input}
                    value={profile.bikeModel}
                    onChange={(e) => setProfile({ ...profile, bikeModel: e.target.value })}
                    placeholder="e.g. Classic 350, Activa 6G"
                  />
                </div>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Number Plate / Registration Number</label>
                <input
                  type="text"
                  style={{ ...s.input, textTransform: "uppercase" }}
                  value={profile.bikeNumber}
                  onChange={(e) => setProfile({ ...profile, bikeNumber: e.target.value })}
                  placeholder="e.g. KA 03 EX 1234"
                />
              </div>

              <button
                type="submit"
                style={{ ...s.saveBtn, opacity: saveLoading ? 0.7 : 1 }}
                disabled={saveLoading}
              >
                {saveLoading ? "Saving Changes..." : "💾 Save Profile Changes"}
              </button>
            </form>
          </div>
        ) : (
          <div style={s.grid}>
            {displayBookings.length === 0 ? (
              <div style={s.emptyBox}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>{tab === "active" ? "🏖️" : "📋"}</div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>
                  {tab === "active" ? "No active bookings" : "No past services yet"}
                </div>
                <p style={{ color: "#6B6B88", fontSize: "0.9rem", marginBottom: 20 }}>
                  {tab === "active" ? "Your bikes are running smooth. Book a service when needed." : "Your completed service history will appear here."}
                </p>
              </div>
            ) : displayBookings.map(b => {
              const statusInfo = statusColors[b.status] || statusColors["New"];
              return (
                <div key={b.id} style={s.card}>
                  {/* Card Header */}
                  <div style={s.cardTop}>
                    <div>
                      <div style={s.cardId}>{b.id}</div>
                      <div style={s.cardBike}>{b.brand} {b.model}</div>
                    </div>
                    <div style={{ ...s.statusPill, background: statusInfo.bg, color: statusInfo.color }}>
                      {statusInfo.label}
                    </div>
                  </div>

                  {/* Details */}
                  <div style={s.cardDetails}>
                    <div style={s.detailRow}>
                      <span style={s.detailKey}>Service</span>
                      <span style={s.detailVal}>{b.service}{b.package ? ` (${b.package})` : ""}</span>
                    </div>
                    <div style={s.detailRow}>
                      <span style={s.detailKey}>Appointment</span>
                      <span style={s.detailVal}>{b.date} · {b.time}</span>
                    </div>
                    <div style={s.detailRow}>
                      <span style={s.detailKey}>Type</span>
                      <span style={{ ...s.detailVal, textTransform: "capitalize" as const }}>{b.serviceType}</span>
                    </div>
                    {b.assignedMechanic && (
                      <div style={s.detailRow}>
                        <span style={s.detailKey}>Mechanic</span>
                        <span style={{ ...s.detailVal, color: "#F59E0B" }}>👨‍🔧 {b.assignedMechanic}</span>
                      </div>
                    )}
                    {b.promoCode && (
                      <div style={s.detailRow}>
                        <span style={s.detailKey}>Discount</span>
                        <span style={{ ...s.detailVal, color: "#00E676" }}>🎫 {b.promoCode} (-₹{b.discountAmount})</span>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  {b.status !== "Completed" && (
                    <Link href={`/track?id=${b.id}`} style={s.trackBtn}>📍 Track Live Status →</Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0E0E18" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", borderBottom: "1px solid #1E1E2E", background: "#0A0A14", position: "sticky", top: 0, zIndex: 10 },
  logo: { fontSize: "1.2rem", fontWeight: 800 },
  logoutBtn: { background: "transparent", border: "1px solid #2A2A3E", color: "#6B6B88", borderRadius: 8, padding: "8px 14px", fontSize: "0.85rem", cursor: "pointer" },
  hero: { background: "linear-gradient(135deg, #161622, #0E0E18)", borderBottom: "1px solid #1E1E2E", padding: "40px 0" },
  container: { maxWidth: 900, margin: "0 auto", padding: "0 24px" },
  greeting: { color: "#6B6B88", fontSize: "1rem", marginBottom: 8 },
  heroTitle: { fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 },
  heroSub: { color: "#6B6B88", fontSize: "1rem" },
  bookBtn: { display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #FF3D00, #cc3000)", color: "#fff", padding: "12px 24px", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", textDecoration: "none", boxShadow: "0 4px 20px rgba(255,61,0,0.3)" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 },
  statCard: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 14, padding: "20px 18px" },
  tabRow: { display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid #1E1E2E", paddingBottom: 0 },
  tabBtn: { background: "transparent", border: "none", color: "#6B6B88", padding: "12px 20px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: -1, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" },
  tabActive: { color: "#FF3D00", borderBottomColor: "#FF3D00" },
  tabBadge: { background: "rgba(255,61,0,0.1)", color: "#FF3D00", padding: "2px 8px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 800 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  emptyBox: { gridColumn: "1/-1", background: "#161622", border: "1px solid #1E1E2E", borderRadius: 16, padding: "60px 40px", textAlign: "center" },
  card: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 0 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #1A1A28" },
  cardId: { color: "#6366F1", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "monospace" },
  cardBike: { fontSize: "1.2rem", fontWeight: 700 },
  statusPill: { padding: "6px 12px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" },
  cardDetails: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 },
  detailRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  detailKey: { color: "#6B6B88", fontSize: "0.85rem" },
  detailVal: { color: "#F0F0F8", fontWeight: 600, fontSize: "0.9rem", textAlign: "right" as const, maxWidth: "65%" },
  trackBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,61,0,0.08)", color: "#FF3D00", border: "1px solid rgba(255,61,0,0.2)", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none", marginTop: 4 },
  profileCard: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 16, padding: "32px", maxWidth: 680, margin: "0 auto" },
  formGroup: { display: "flex", flexDirection: "column", marginBottom: 20, flex: 1 },
  label: { display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#9E9EB5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 },
  formRow: { display: "flex", gap: 20 },
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
    borderRadius: "10px 0 0 10px",
  },
  saveBtn: { width: "100%", padding: 16, background: "linear-gradient(135deg, #FF3D00, #cc3000)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "1rem", cursor: "pointer", marginTop: 24, boxShadow: "0 4px 20px rgba(255,61,0,0.2)" },
  input: { width: "100%", background: "#0E0E18", border: "1px solid #2A2A3E", borderRadius: 10, padding: "13px 14px", color: "#F0F0F8", fontSize: "0.95rem", outline: "none", fontFamily: "inherit" },
};
