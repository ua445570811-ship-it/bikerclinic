"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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
    loadJobs(name);
    const interval = setInterval(() => loadJobs(name), 1500);
    return () => clearInterval(interval);
  }, [router, loadJobs]);

  const updateStatus = (id: string, newStatus: string) => {
    const prev: Booking[] = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
    const idx = prev.findIndex(b => b.id === id);
    if (idx > -1) {
      prev[idx].status = newStatus;
      prev[idx] = { ...prev[idx], updatedAt: new Date().toISOString() } as Booking & { updatedAt: string };
      localStorage.setItem("bc_bookings", JSON.stringify(prev));
      loadJobs(mechanicName);
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

            <div className="responsive-grid-2" style={{ marginBottom: 20 }}>
              <div style={s.detailItem}>
                <div style={s.detailIcon}>👤</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{b.name}</div>
                  <a href={`tel:${b.phone}`} style={{ color: "#FF3D00", fontSize: "0.88rem" }}>{b.phone}</a>
                </div>
              </div>
              <div style={s.detailItem}>
                <div style={s.detailIcon}>📅</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{b.date}</div>
                  <div style={{ color: "#6B6B88", fontSize: "0.85rem" }}>{b.time}</div>
                </div>
              </div>
              <div style={{ ...s.detailItem, gridColumn: "1/-1" }}>
                <div style={s.detailIcon}>📍</div>
                <div style={{ color: "#B0B0C8", fontSize: "0.9rem", lineHeight: 1.5 }}>
                  {b.address}{b.landmark ? ` · ${b.landmark}` : ""}
                </div>
              </div>
              {b.notes && (
                <div style={{ ...s.detailItem, gridColumn: "1/-1" }}>
                  <div style={{ ...s.detailIcon, background: "rgba(255,61,0,0.1)" }}>📝</div>
                  <div style={{ color: "#FF3D00", fontSize: "0.88rem" }}>{b.notes}</div>
                </div>
              )}
            </div>

            {b.status === "Assigned" && (
              <button onClick={() => updateStatus(b.id, "In Progress")} style={{ ...s.actionBtn, background: "rgba(255,61,0,0.1)", color: "#FF3D00", border: "1px solid rgba(255,61,0,0.3)" }}>
                ▶ Start Job
              </button>
            )}
            {b.status === "In Progress" && (
              <button onClick={() => updateStatus(b.id, "Completed")} style={{ ...s.actionBtn, background: "rgba(0,230,118,0.1)", color: "#00E676", border: "1px solid rgba(0,230,118,0.3)" }}>
                ✅ Mark Completed
              </button>
            )}
            {b.status === "Completed" && (
              <div style={{ color: "#00E676", fontWeight: 700, fontSize: "0.9rem", marginTop: 16, textAlign: "center" }}>✅ Job Completed</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0E0E18", paddingBottom: 40 },
  header: { background: "#161622", borderBottom: "1px solid #1E1E2E", padding: "24px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, zIndex: 10 },
  headerLeft: {},
  mechBadge: { display: "inline-block", background: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)", padding: "4px 12px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 10 },
  name: { fontSize: "1.6rem", fontWeight: 800, marginBottom: 4 },
  sub: { color: "#6B6B88", fontSize: "0.9rem" },
  logoutBtn: { background: "transparent", border: "1px solid #2A2A3E", color: "#6B6B88", borderRadius: 8, padding: "8px 14px", fontSize: "0.85rem", cursor: "pointer" },
  tabBar: { display: "flex", gap: 12, padding: "16px 20px", borderBottom: "1px solid #1E1E2E" },
  tab: { background: "transparent", border: "1px solid #2A2A3E", color: "#6B6B88", padding: "8px 16px", borderRadius: 99, fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 },
  tabActive: { background: "rgba(245,158,11,0.1)", color: "#F59E0B", borderColor: "rgba(245,158,11,0.3)" },
  tabCount: { background: "rgba(245,158,11,0.2)", color: "#F59E0B", padding: "2px 8px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 800 },
  jobList: { padding: "20px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 680, margin: "0 auto" },
  empty: { textAlign: "center", padding: "60px 20px", background: "#161622", border: "1px solid #1E1E2E", borderRadius: 16, marginTop: 20 },
  card: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 16, padding: 24 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #1A1A28" },
  bookingId: { color: "#F59E0B", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.05em", marginBottom: 4 },
  bikeName: { fontSize: "1.25rem", fontWeight: 700, marginBottom: 4 },
  serviceLabel: { color: "#6B6B88", fontSize: "0.88rem" },
  inProgressBadge: { background: "rgba(255,61,0,0.1)", color: "#FF3D00", border: "1px solid rgba(255,61,0,0.3)", padding: "5px 10px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.05em" },
  detailsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 },
  detailItem: { display: "flex", gap: 12, alignItems: "flex-start" },
  detailIcon: { width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", flexShrink: 0 },
  actionBtn: { width: "100%", padding: 16, borderRadius: 12, fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" },
};
