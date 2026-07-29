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
          Completed <span style={{ ...s.tabCount, background: "rgba(0,230,118,0.08)", color: "var(--success)" }}>{doneJobs.length}</span>
        </button>
      </div>

      {/* Jobs */}
      <div style={s.jobList}>
        {displayJobs.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>{tab === "active" ? "🍻" : "🏆"}</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8, letterSpacing: "-0.01em" }}>{tab === "active" ? "No active jobs right now!" : "No completed jobs yet."}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{tab === "active" ? "You're all caught up. Check back soon." : "Complete a job and it'll appear here."}</div>
          </div>
        ) : displayJobs.map(b => (
          <div key={b.id} style={s.card}>
            <div style={s.cardHeader}>
              <div>
                <div style={s.bookingId} className="mono-text">{b.id}</div>
                <div style={s.bikeName}>{b.brand} {b.model}</div>
                <div style={s.serviceLabel}>{b.service}{b.package ? ` (${b.package})` : ""} · <span style={{ textTransform: "capitalize" }}>{b.serviceType}</span></div>
              </div>
              {b.status === "In Progress" && <div style={s.inProgressBadge}>IN PROGRESS</div>}
              {b.status === "Completed" && <div style={{ ...s.inProgressBadge, background: "rgba(0,230,118,0.08)", color: "var(--success)", borderColor: "rgba(0,230,118,0.2)" }}>DONE ✅</div>}
            </div>

            <div style={s.cardBody}>
              <div style={s.infoGrid}>
                <div style={s.infoItem}>
                  <div style={s.infoLabel}>Customer</div>
                  <div style={s.infoValue}>{b.name}</div>
                  <div style={{ ...s.infoValue, fontSize: "0.85rem", color: "var(--text-muted)" }} className="mono-text">{b.phone}</div>
                </div>
                <div style={s.infoItem}>
                  <div style={s.infoLabel}>Appointment</div>
                  <div style={s.infoValue}>{b.date}</div>
                  <div style={{ ...s.infoValue, fontSize: "0.85rem", color: "var(--text-muted)" }} className="mono-text">{b.time}</div>
                </div>
                {b.serviceType === "doorstep" && (
                  <div style={{ ...s.infoItem, gridColumn: "1/-1" }}>
                    <div style={s.infoLabel}>Service Address</div>
                    <div style={s.infoValue}>{b.address}</div>
                    {b.landmark && <div style={{ ...s.infoValue, fontSize: "0.85rem", color: "var(--text-muted)" }}>📍 {b.landmark}</div>}
                  </div>
                )}
                {b.notes && (
                  <div style={{ ...s.infoItem, gridColumn: "1/-1" }}>
                    <div style={s.infoLabel}>Special Notes</div>
                    <div style={{ ...s.infoValue, color: "var(--text-secondary)", fontStyle: "italic" }}>&ldquo;{b.notes}&rdquo;</div>
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
                <button onClick={() => updateStatus(b.id, "Completed")} style={{ ...s.primaryBtn, background: "var(--success)", color: "#000", boxShadow: "0 4px 14px rgba(0,230,118,0.2)" }}>
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
  page: { minHeight: "100vh", background: "var(--bg)", paddingBottom: 60, color: "var(--text-primary)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#0c0e11", padding: "28px 24px", borderBottom: "1px solid var(--border)" },
  headerLeft: { display: "flex", flexDirection: "column", gap: 6 },
  mechBadge: { background: "rgba(245,158,11,0.08)", color: "var(--mechanic-accent)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 6, padding: "4px 8px", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.06em", width: "fit-content" },
  name: { fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-0.01em" },
  sub: { color: "var(--text-muted)", fontSize: "0.9rem" },
  logoutBtn: { background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "8px 14px", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer", fontWeight: 600, transition: "var(--transition)" },
  tabBar: { display: "flex", background: "#0c0e11", borderBottom: "1px solid var(--border)" },
  tab: { flex: 1, padding: "18px", background: "transparent", border: "none", color: "var(--text-muted)", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", borderBottomWidth: 2, borderBottomStyle: "solid", borderBottomColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "var(--transition)" },
  tabActive: { color: "var(--mechanic-accent)", borderBottomColor: "var(--mechanic-accent)" },
  tabCount: { background: "rgba(245,158,11,0.08)", color: "var(--mechanic-accent)", fontSize: "0.75rem", padding: "2px 8px", borderRadius: 99, fontWeight: 800 },
  jobList: { maxWidth: 680, margin: "24px auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: 20 },
  empty: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "60px 40px", textAlign: "center" },
  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" },
  cardHeader: { padding: 20, background: "#1b1d21", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  bookingId: { color: "var(--primary)", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 },
  bikeName: { fontSize: "1.15rem", fontWeight: 800, marginBottom: 4, letterSpacing: "-0.01em" },
  serviceLabel: { color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 500 },
  inProgressBadge: { background: "var(--primary-glow)", color: "var(--primary)", border: "1px solid rgba(0,102,255,0.2)", borderRadius: 6, padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.05em" },
  cardBody: { padding: 20 },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 },
  infoItem: { display: "flex", flexDirection: "column", gap: 4 },
  infoLabel: { fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 },
  infoValue: { fontSize: "0.92rem", fontWeight: 600 },
  primaryBtn: { width: "100%", padding: 14, background: "var(--mechanic-accent)", color: "#000", border: "none", borderRadius: 8, fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", transition: "var(--transition)", boxShadow: "0 4px 14px rgba(245,158,11,0.25)" },
};
