"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  assignedMechanic?: string;
  promoCode?: string;
  discountAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
};

type Coupon = {
  code: string;
  type: "flat" | "percent";
  value: number;
  active: boolean;
  createdAt: string;
};

type RegisteredMechanic = {
  name: string;
  specialties: string[];
};

const DEFAULT_REGISTERED_MECHANICS: RegisteredMechanic[] = [
  {
    name: "Hamniakhan@Gmail.Com",
    specialties: [
      "General Service", "Full Service", "Periodic Service", "Basic Care", "Standard Service",
      "Home Classic", "Scooty/Moped", "Oil Change", "Brake Service", "Brakes & Clutch",
      "Tyre Replacement", "Battery Service", "Tyres", "Roadside Rescue", "Electrical Repair",
      "Suspension Repair", "Engine Overhaul", "Engine Tuning", "Full Workshop", "Accident Repair",
      "Home Premium", "Royal Enfield", "SuperBike", "Wash & Detailing"
    ]
  },
  {
    name: "Kiran S.",
    specialties: [
      "General Service",
      "Full Service",
      "Periodic Service",
      "Basic Care",
      "Standard Service",
      "Home Classic",
      "Scooty/Moped",
      "Oil Change",
      "Brake Service",
      "Brakes & Clutch",
    ],
  },
  {
    name: "Raju K.",
    specialties: [
      "Tyre Replacement",
      "Battery Service",
      "Oil Change",
      "Tyres",
      "Roadside Rescue",
      "Basic Care",
      "Scooty/Moped",
    ],
  },
  {
    name: "Amit P.",
    specialties: [
      "Electrical Repair",
      "Suspension Repair",
      "Engine Overhaul",
      "Engine Tuning",
      "Full Workshop",
      "Accident Repair",
      "Home Premium",
      "Royal Enfield",
      "SuperBike",
    ],
  },
  {
    name: "Vikram R.",
    specialties: [
      "General Service",
      "Full Service",
      "Periodic Service",
      "Standard Service",
      "Full Workshop",
      "Home Classic",
      "Home Premium",
      "Royal Enfield",
      "Wash & Detailing",
    ],
  },
  {
    name: "Sanjay M.",
    specialties: [
      "General Service",
      "Periodic Service",
      "Basic Care",
      "Standard Service",
      "Home Classic",
      "Oil Change",
      "Brake Service",
      "Brakes & Clutch",
      "Wash & Detailing",
    ],
  },
];

type Tab = "bookings" | "coupons";

export default function AdminDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [tab, setTab] = useState<Tab>("bookings");
  const [search, setSearch] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"flat" | "percent">("flat");
  const [couponValue, setCouponValue] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [mechanics, setMechanics] = useState<RegisteredMechanic[]>([]);

  useEffect(() => {
    if (!sessionStorage.getItem("bc_admin_auth")) {
      router.push("/admin/login");
      return;
    }
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [router]);

  const loadData = () => {
    const raw = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
    raw.sort((a: Booking, b: Booking) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    setBookings(raw);
    
    const rawC = JSON.parse(localStorage.getItem("bc_coupons") || "[]");
    rawC.sort((a: Coupon, b: Coupon) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setCoupons(rawC);

    let mechs = localStorage.getItem("bc_registered_mechanics");
    if (!mechs) {
      localStorage.setItem("bc_registered_mechanics", JSON.stringify(DEFAULT_REGISTERED_MECHANICS));
      mechs = JSON.stringify(DEFAULT_REGISTERED_MECHANICS);
    }
    setMechanics(JSON.parse(mechs));
  };

  const updateStatus = (id: string, newStatus: string) => {
    const prev = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
    const idx = prev.findIndex((b: Booking) => b.id === id);
    if (idx > -1) {
      prev[idx].status = newStatus;
      prev[idx].updatedAt = new Date().toISOString();
      
      if (newStatus === "New") {
        prev[idx].assignedMechanic = "";
      }
      
      localStorage.setItem("bc_bookings", JSON.stringify(prev));
      loadData();
    }
  };

  const assignMechanic = (id: string, mechanicName: string) => {
    const prev = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
    const idx = prev.findIndex((b: Booking) => b.id === id);
    if (idx > -1) {
      prev[idx].assignedMechanic = mechanicName;
      prev[idx].updatedAt = new Date().toISOString();
      
      if (prev[idx].status === "New" && mechanicName) {
        prev[idx].status = "Assigned";
      } else if (!mechanicName && prev[idx].status === "Assigned") {
        prev[idx].status = "New";
      }
      
      localStorage.setItem("bc_bookings", JSON.stringify(prev));
      loadData();
    }
  };

  const getQualifiedMechanics = (booking: Booking) => {
    return mechanics.length > 0 ? mechanics : DEFAULT_REGISTERED_MECHANICS;
  };

  const addCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.toUpperCase().trim();
    const prev = JSON.parse(localStorage.getItem("bc_coupons") || "[]");
    if (prev.find((c: Coupon) => c.code === code)) {
      setCouponMsg("Code already exists!");
      return;
    }
    prev.push({ code, type: couponType, value: Number(couponValue), active: true, createdAt: new Date().toISOString() });
    localStorage.setItem("bc_coupons", JSON.stringify(prev));
    setCouponCode(""); setCouponValue(""); setCouponMsg(`✅ ${code} created!`);
    loadData();
    setTimeout(() => setCouponMsg(""), 3000);
  };

  const toggleCoupon = (code: string, current: boolean) => {
    const prev = JSON.parse(localStorage.getItem("bc_coupons") || "[]");
    const idx = prev.findIndex((c: Coupon) => c.code === code);
    if (idx > -1) { prev[idx].active = !current; localStorage.setItem("bc_coupons", JSON.stringify(prev)); loadData(); }
  };

  const filtered = bookings.filter(b =>
    b.id?.toLowerCase().includes(search.toLowerCase()) ||
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.phone?.includes(search)
  );

  const metrics = {
    newCount: bookings.filter(b => b.status === "New").length,
    inProgress: bookings.filter(b => b.status === "In Progress" || b.status === "Assigned").length,
    completed: bookings.filter(b => b.status === "Completed").length,
    total: bookings.length,
  };

  const statusColors: Record<string, string> = {
    New: "#6366F1", Assigned: "#F59E0B", "In Progress": "#FF3D00", Completed: "#00E676",
  };

  return (
    <div className="admin-shell">
      {/* Sidebar Backdrop on Mobile */}
      {mobileSidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)} />
      )}
      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? "active" : ""}`} style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <span style={{ fontSize: "1.4rem" }}>🏍️</span>
          <span>Biker<span style={{ color: "#FF3D00" }}>Clinic</span></span>
        </div>
        <div style={s.sidebarBadge}>ADMIN PANEL</div>
        <nav style={s.nav}>
          <button onClick={() => { setTab("bookings"); setMobileSidebarOpen(false); }} style={{ ...s.navItem, ...(tab === "bookings" ? s.navActive : {}) }}>📊 CRM Dashboard</button>
          <button onClick={() => { setTab("coupons"); setMobileSidebarOpen(false); }} style={{ ...s.navItem, ...(tab === "coupons" ? s.navActive : {}) }}>🎫 Coupons</button>
          <a href="/mechanic/login" style={{ ...s.navItem, textDecoration: "none", display: "block" }}>👨‍🔧 Mechanic App ↗</a>
        </nav>
        <button onClick={() => { sessionStorage.removeItem("bc_admin_auth"); router.push("/admin/login"); }} style={s.logoutBtn}>🚪 Sign Out</button>
      </aside>

      {/* Main */}
      <main className="admin-main" style={s.main}>
        <header style={s.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="mobile-nav-toggle"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              style={{ display: "none", fontSize: "1.5rem", background: "transparent", color: "#F0F0F8", border: "none", cursor: "pointer", marginRight: 8 }}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <div>
              <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{tab === "bookings" ? "Live Bookings CRM" : "Coupons & Offers"}</h1>
              <p style={{ color: "#6B6B88", fontSize: "0.8rem", marginTop: 2 }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
            </div>
          </div>
          <div style={s.avatar}>A</div>
        </header>

        <div style={s.content}>
          {tab === "bookings" && (
            <>
              {/* Metrics */}
              <div className="responsive-grid-4" style={{ marginBottom: 24 }}>
                {[
                  { label: "New Bookings", value: metrics.newCount, color: "#6366F1" },
                  { label: "In Progress", value: metrics.inProgress, color: "#F59E0B" },
                  { label: "Completed", value: metrics.completed, color: "#00E676" },
                  { label: "Total Customers", value: metrics.total, color: "#FF3D00" },
                ].map(m => (
                  <div key={m.label} style={{ ...s.metricCard, borderTop: `3px solid ${m.color}` }}>
                    <div style={{ fontSize: "0.8rem", color: "#6B6B88", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div style={s.tableCard}>
                <div className="admin-table-header">
                  <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>All Bookings</h2>
                  <input
                    style={s.searchInput}
                    placeholder="Search by ID, name, phone..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={s.table}>
                    <thead>
                      <tr style={s.thead}>
                        {["Booking ID", "Customer", "Bike & Service", "Schedule", "Status", "Action"].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#6B6B88" }}>No bookings found.</td></tr>
                      ) : filtered.map(b => (
                        <tr key={b.id} style={s.tr}>
                          <td style={{ ...s.td, fontWeight: 700, color: "#6366F1", fontFamily: "monospace" }}>{b.id}</td>
                          <td style={s.td}>
                            <div style={{ fontWeight: 600 }}>{b.name}</div>
                            <div style={{ fontSize: "0.8rem", color: "#6B6B88" }}>{b.phone}</div>
                          </td>
                          <td style={s.td}>
                            <div style={{ fontWeight: 600 }}>{b.brand} {b.model}</div>
                            <div style={{ fontSize: "0.8rem", color: "#6B6B88" }}>{b.service}{b.package ? ` (${b.package})` : ""} · {b.serviceType}</div>
                            {b.assignedMechanic && <div style={{ fontSize: "0.75rem", color: "#F59E0B", marginTop: 2 }}>👨‍🔧 {b.assignedMechanic}</div>}
                            {b.notes && (
                              <div style={{ fontSize: "0.78rem", color: "#FF3D00", marginTop: 6, background: "rgba(255, 61, 0, 0.05)", padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255, 61, 0, 0.15)", display: "inline-block", maxWidth: 220, wordBreak: "break-word" }}>
                                📋 Issue: {b.notes}
                              </div>
                            )}
                          </td>
                          <td style={s.td}>
                            <div>{b.date}</div>
                            <div style={{ fontSize: "0.8rem", color: "#6B6B88" }}>{b.time}</div>
                          </td>
                          <td style={s.td}>
                            <span style={{ ...s.badge, background: `${statusColors[b.status] || "#6B6B88"}18`, color: statusColors[b.status] || "#6B6B88", border: `1px solid ${statusColors[b.status] || "#6B6B88"}40` }}>
                              {b.status}
                            </span>
                          </td>
                           <td style={s.td}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <select
                                style={s.select}
                                value={b.status}
                                onChange={e => updateStatus(b.id, e.target.value)}
                              >
                                {["New", "Assigned", "In Progress", "Completed"].map(st => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>
                              
                              {b.status !== "Completed" && (
                                <select
                                  style={{ ...s.select, fontSize: "0.8rem", padding: "4px 8px", borderColor: "#F59E0B" }}
                                  value={b.assignedMechanic || ""}
                                  onChange={e => {
                                    if (e.target.value === "__custom__") {
                                      const customName = prompt("Enter Custom Mechanic Name:");
                                      if (customName) assignMechanic(b.id, customName);
                                    } else {
                                      assignMechanic(b.id, e.target.value);
                                    }
                                  }}
                                >
                                  <option value="">-- Assign Mechanic --</option>
                                  {getQualifiedMechanics(b).map(m => (
                                    <option key={m.name} value={m.name}>{m.name}</option>
                                  ))}
                                  <option value="__custom__">✍️ Custom Name...</option>
                                </select>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === "coupons" && (
            <div className="coupons-layout-grid">
              {/* Create form */}
              <div style={s.tableCard}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 20 }}>Create Promo Code</h2>
                <form onSubmit={addCoupon}>
                  <div className="form-group">
                    <label className="form-label">Code Name</label>
                    <input className="form-input" placeholder="e.g. BIKER100" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} required />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select className="form-input" value={couponType} onChange={e => setCouponType(e.target.value as "flat" | "percent")}>
                        <option value="flat">Flat (₹)</option>
                        <option value="percent">Percent (%)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Value</label>
                      <input className="form-input" type="number" placeholder="e.g. 150" value={couponValue} onChange={e => setCouponValue(e.target.value)} required min={1} />
                    </div>
                  </div>
                  {couponMsg && <div style={{ color: couponMsg.startsWith("✅") ? "#00E676" : "#EF4444", fontSize: "0.85rem", marginBottom: 12 }}>{couponMsg}</div>}
                  <button type="submit" style={{ ...s.submitBtn, width: "100%" }}>Generate Coupon</button>
                </form>
              </div>

              {/* Coupons list */}
              <div style={s.tableCard}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 20 }}>Active Promo Codes</h2>
                <table style={s.table}>
                  <thead><tr style={s.thead}>{["Code", "Discount", "Status", "Toggle"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {coupons.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#6B6B88" }}>No coupons yet.</td></tr>
                    ) : coupons.map(c => (
                      <tr key={c.code} style={s.tr}>
                        <td style={{ ...s.td, fontWeight: 700, letterSpacing: "0.05em" }}>{c.code}</td>
                        <td style={{ ...s.td, color: "#6366F1", fontWeight: 600 }}>{c.type === "percent" ? `${c.value}% OFF` : `₹${c.value} OFF`}</td>
                        <td style={s.td}><span style={{ ...s.badge, background: c.active ? "rgba(0,230,118,0.1)" : "rgba(239,68,68,0.1)", color: c.active ? "#00E676" : "#EF4444", border: `1px solid ${c.active ? "#00E67640" : "#EF444440"}` }}>{c.active ? "Active" : "Disabled"}</span></td>
                        <td style={s.td}><button onClick={() => toggleCoupon(c.code, c.active)} style={{ ...s.ghostBtn }}>{c.active ? "Disable" : "Enable"}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  shell: { display: "flex", minHeight: "100vh" },
  sidebar: { width: 240, background: "#0A0A14", borderRight: "1px solid #1E1E2E", display: "flex", flexDirection: "column", padding: "24px 16px", flexShrink: 0 },
  sidebarLogo: { fontSize: "1.2rem", fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 },
  sidebarBadge: { background: "rgba(99,102,241,0.1)", color: "#6366F1", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", padding: "4px 10px", borderRadius: 99, border: "1px solid rgba(99,102,241,0.2)", marginBottom: 32, display: "inline-block" },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navItem: { background: "transparent", border: "none", color: "#9E9EB5", padding: "10px 14px", borderRadius: 10, textAlign: "left", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer", transition: "all 0.2s", width: "100%" },
  navActive: { background: "rgba(99,102,241,0.1)", color: "#6366F1" },
  logoutBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", borderRadius: 10, padding: "10px 14px", fontSize: "0.9rem", cursor: "pointer", marginTop: 16 },
  main: { flex: 1, display: "flex", flexDirection: "column", background: "#0E0E18", overflow: "hidden" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", borderBottom: "1px solid #1E1E2E", background: "#0A0A14" },
  avatar: { width: 40, height: 40, borderRadius: "50%", background: "#6366F1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem" },
  content: { padding: "28px 32px", overflowY: "auto", flex: 1 },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 },
  metricCard: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 14, padding: "20px 18px" },
  tableCard: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 14, padding: "24px" },
  tableHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  searchInput: { background: "#0E0E18", border: "1px solid #2A2A3E", borderRadius: 8, padding: "8px 14px", color: "#F0F0F8", fontSize: "0.9rem", outline: "none", width: 260 },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { borderBottom: "1px solid #1E1E2E" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", color: "#6B6B88", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #1A1A28" },
  td: { padding: "14px 16px", fontSize: "0.9rem", verticalAlign: "middle" },
  badge: { padding: "4px 10px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 700 },
  select: { background: "#0E0E18", border: "1px solid #2A2A3E", borderRadius: 8, padding: "6px 10px", color: "#F0F0F8", fontSize: "0.85rem", cursor: "pointer", outline: "none" },
  submitBtn: { background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "#fff", border: "none", padding: "14px 24px", borderRadius: 10, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" },
  ghostBtn: { background: "transparent", border: "1px solid #2A2A3E", color: "#9E9EB5", borderRadius: 8, padding: "6px 12px", fontSize: "0.82rem", cursor: "pointer" },
};
