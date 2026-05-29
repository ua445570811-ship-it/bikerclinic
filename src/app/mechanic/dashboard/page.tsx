"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { db, IS_MOCK_MODE } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, getDocs, query, where } from "firebase/firestore";

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
  landmark?: string;
  notes?: string;
  assignedMechanic?: string;
  _firestoreDocId?: string;
};

export default function MechanicDashboard() {
  const router = useRouter();
  const [mechanicName, setMechanicName] = useState("");
  const [myJobs, setMyJobs] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"active" | "done">("active");

  const loadJobs = useCallback((name: string) => {
    const all: Booking[] = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
    setMyJobs(all.filter(b => b.assignedMechanic?.toLowerCase() === name.toLowerCase()));
  }, []);

  useEffect(() => {
    const name = localStorage.getItem("bc_mechanic_name");
    if (!name) { router.push("/mechanic/login"); return; }
    setMechanicName(name);

    if (IS_MOCK_MODE) {
      loadJobs(name);
      const interval = setInterval(() => loadJobs(name), 1500);
      return () => clearInterval(interval);
    } else {
      const q = collection(db, "bookings");
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.assignedMechanic?.toLowerCase() === name.toLowerCase()) {
            list.push({ ...data, id: data.id || docSnap.id, _firestoreDocId: docSnap.id } as Booking);
          }
        });
        setMyJobs(list);
      }, (err) => {
        console.error("Firestore mechanic load error, falling back to local storage:", err);
        loadJobs(name);
      });
      return () => unsubscribe();
    }
  }, [router, loadJobs]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (IS_MOCK_MODE) {
      const prev: Booking[] = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
      const idx = prev.findIndex(b => b.id === id);
      if (idx > -1) {
        prev[idx].status = newStatus;
        prev[idx] = { ...prev[idx], updatedAt: new Date().toISOString() } as Booking & { updatedAt: string };
        localStorage.setItem("bc_bookings", JSON.stringify(prev));
        loadJobs(mechanicName);
      }
    } else {
      try {
        const booking = myJobs.find(b => b.id === id);
        let docId = booking?._firestoreDocId;

        if (!docId) {
          const q = query(collection(db, "bookings"), where("id", "==", id));
          const snap = await getDocs(q);
          if (!snap.empty) {
            docId = snap.docs[0].id;
          }
        }

        if (docId) {
          const docRef = doc(db, "bookings", docId);
          await updateDoc(docRef, {
            status: newStatus,
            updatedAt: new Date().toISOString()
          });
        } else {
          console.error("Booking document ID not found for updating status");
        }
      } catch (err) {
        console.error("Error updating status in Firestore:", err);
      }
    }
  };

  const activeJobs = myJobs.filter(b => b.status === "Assigned" || b.status === "In Progress");
  const doneJobs = myJobs.filter(b => b.status === "Completed");

  const displayJobs = tab === "active" ? activeJobs : doneJobs;

  return (
    <div style={s.page}>
      {/* Header */}
      <header className="mech-header" style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.mechBadge}>👨‍🔧 FIELD APP</div>
          <h1 style={s.name}>Hey, {mechanicName}!</h1>
          <p style={s.sub}>{activeJobs.length} active job{activeJobs.length !== 1 ? "s" : ""} assigned to you</p>
        </div>
        <button onClick={() => { localStorage.removeItem("bc_mechanic_name"); router.push("/mechanic/login"); }} style={s.logoutBtn}>Sign Out</button>
      </header>

      {/* Tabs */}
      <div style={s.tabBar}>
        <button onClick={() => setTab("active")} style={{ ...s.tab, ...(tab === "active" ? s.tabActive : {}) }}>
          Active Jobs <span style={s.tabCount}>{activeJobs.length}</span>
        </button>
        <button onClick={() => setTab("done")} style={{ ...s.tab, ...(tab === "done" ? s.tabActive : {}) }}>
          Completed <span style={{ ...s.tabCount, background: "rgba(0,230,118,0.15)", color: "#00E676" }}>{doneJobs.length}</span>
        </button>
      </div>

      {/* Jobs */}
      <div style={s.jobList}>
        {displayJobs.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>{tab === "active" ? "🍺" : "🏆"}</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>{tab === "active" ? "No active jobs right now!" : "No completed jobs yet."}</div>
            <div style={{ color: "#6B6B88", fontSize: "0.9rem" }}>{tab === "active" ? "You're all caught up. Check back soon." : "Complete a job and it'll appear here."}</div>
          </div>
        ) : displayJobs.map(b => (
          <div key={b.id} style={s.card}>
            <div style={s.cardHeader}>
              <div>
                <div style={s.bookingId}>{b.id}</div>
                <div style={s.bikeName}>{b.brand} {b.model}</div>
                <div style={s.serviceLabel}>{b.service}{b.package ? ` (${b.package})` : ""} · <span style={{ textTransform: "capitalize" }}>{b.serviceType}</span></div>
              </div>
              {b.status === "In Progress" && <div style={s.inProgressBadge}>IN PROGRESS</div>}
              {b.status === "Completed" && <div style={{ ...s.inProgressBadge, background: "rgba(0,230,118,0.1)", color: "#00E676", borderColor: "rgba(0,230,118,0.3)" }}>DONE ✅</div>}
            </div>

            <div style={s.cardBody}>
              <div style={s.infoGrid}>
                <div style={s.infoItem}>
                  <div style={s.infoLabel}>Customer</div>
                  <div style={s.infoValue}>{b.name}</div>
                  <div style={{ ...s.infoValue, fontSize: "0.85rem", color: "#6B6B88" }}>{b.phone}</div>
                </div>
                <div style={s.infoItem}>
                  <div style={s.infoLabel}>Appointment</div>
                  <div style={s.infoValue}>{b.date}</div>
                  <div style={{ ...s.infoValue, fontSize: "0.85rem", color: "#6B6B88" }}>{b.time}</div>
                </div>
                {b.serviceType === "doorstep" && (
                  <div style={{ ...s.infoItem, gridColumn: "1/-1" }}>
                    <div style={s.infoLabel}>Service Address</div>
                    <div style={s.infoValue}>{b.address}</div>
                    {b.landmark && <div style={{ ...s.infoValue, fontSize: "0.85rem", color: "#6B6B88" }}>📍 {b.landmark}</div>}
                  </div>
                )}
                {b.notes && (
                  <div style={{ ...s.infoItem, gridColumn: "1/-1" }}>
                    <div style={s.infoLabel}>Special Notes</div>
                    <div style={{ ...s.infoValue, color: "#9E9EB5", fontStyle: "italic" }}>"{b.notes}"</div>
                  </div>
                )}
              </div>

              {/* Status Actions */}
              {b.status === "Assigned" && (
                <button onClick={() => updateStatus(b.id, "In Progress")} style={s.primaryBtn}>
                  🏍️ Start Job
                </button>
              )}
              {b.status === "In Progress" && (
                <button onClick={() => updateStatus(b.id, "Completed")} style={{ ...s.primaryBtn, background: "linear-gradient(135deg, #00E676, #00b05b)", boxShadow: "0 4px 16px rgba(0,230,118,0.25)" }}>
                  ✅ Mark Completed
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0E0E18", paddingBottom: 60 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#0A0A14", padding: "28px 24px", borderBottom: "1px solid #1E1E2E" },
  headerLeft: { display: "flex", flexDirection: "column" as const, gap: 6 },
  mechBadge: { background: "rgba(255,61,0,0.1)", color: "#FF3D00", border: "1px solid rgba(255,61,0,0.2)", borderRadius: 6, padding: "4px 8px", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.06em", width: "fit-content" },
  name: { fontSize: "1.6rem", fontWeight: 800 },
  sub: { color: "#6B6B88", fontSize: "0.9rem" },
  logoutBtn: { background: "transparent", border: "1px solid #2A2A3E", color: "#6B6B88", padding: "8px 14px", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer", fontWeight: 600 },
  tabBar: { display: "flex", background: "#0A0A14", borderBottom: "1px solid #1E1E2E" },
  tab: { flex: 1, padding: "18px", background: "transparent", border: "none", color: "#6B6B88", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", borderBottom: "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  tabActive: { color: "#FF3D00", borderBottomColor: "#FF3D00" },
  tabCount: { background: "rgba(255,61,0,0.1)", color: "#FF3D00", fontSize: "0.75rem", padding: "2px 8px", borderRadius: 99 },
  jobList: { maxWidth: 680, margin: "24px auto", padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 20 },
  empty: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 16, padding: "60px 40px", textAlign: "center" as const },
  card: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 16, overflow: "hidden" },
  cardHeader: { padding: 20, background: "#1A1A2A", borderBottom: "1px solid #222235", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  bookingId: { color: "#6366F1", fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 },
  bikeName: { fontSize: "1.2rem", fontWeight: 800, marginBottom: 4 },
  serviceLabel: { color: "#9E9EB5", fontSize: "0.85rem", fontWeight: 500 },
  inProgressBadge: { background: "rgba(255,61,0,0.1)", color: "#FF3D00", border: "1px solid rgba(255,61,0,0.2)", borderRadius: 6, padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.05em" },
  cardBody: { padding: 20 },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 },
  infoItem: { display: "flex", flexDirection: "column" as const, gap: 4 },
  infoLabel: { fontSize: "0.72rem", color: "#6B6B88", textTransform: "uppercase" as const, letterSpacing: "0.05em", fontWeight: 700 },
  infoValue: { fontSize: "0.92rem", fontWeight: 600 },
  primaryBtn: { width: "100%", padding: 14, background: "linear-gradient(135deg, #FF3D00, #cc3000)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 16px rgba(255,61,0,0.25)" },
};
