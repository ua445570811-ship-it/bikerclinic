"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db, IS_MOCK_MODE } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";


type Booking = {
  id: string;
  name: string;
  phone: string;
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

export default function UserDashboard() {
  const router = useRouter();
  const [userPhone, setUserPhone] = useState("");
  const [userName, setUserName] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"active" | "history">("active");

  const loadBookings = useCallback((phone: string) => {
    const all: Booking[] = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
    const mine = all.filter(b => b.phone === phone).reverse();
    setBookings(mine);
    if (mine.length > 0 && mine[0].name) setUserName(mine[0].name.split(" ")[0]);
  }, []);

  useEffect(() => {
    const phone = localStorage.getItem("bc_user_phone");
    if (!phone) { router.push("/user/login"); return; }
    setUserPhone(phone);

    if (IS_MOCK_MODE) {
      loadBookings(phone);
      const interval = setInterval(() => loadBookings(phone), 2000);
      return () => clearInterval(interval);
    } else {
      const q = query(
        collection(db, "bookings"),
        where("phone", "==", phone)
      );

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
        loadBookings(phone);
      });

      return () => unsubscribe();
    }
  }, [router, loadBookings]);

  const activeBookings = bookings.filter(b => b.status !== "Completed");
  const pastBookings = bookings.filter(b => b.status === "Completed");
  const displayBookings = tab === "active" ? activeBookings : pastBookings;

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.logo}>🏍️ Biker<span style={{ color: "#FF3D00" }}>Clinic</span></div>
        <button onClick={() => { localStorage.removeItem("bc_user_phone"); router.push("/user/login"); }} style={s.logoutBtn}>Sign Out</button>
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
        </div>

        {/* Booking Cards */}
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
};
