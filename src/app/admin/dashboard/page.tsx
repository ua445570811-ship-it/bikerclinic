"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  assignedMechanic?: string;
  promoCode?: string;
  discountAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
  _firestoreDocId?: string;
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

type RegisteredUser = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  bikeBrand?: string;
  bikeModel?: string;
  bikeNumber?: string;
  createdAt?: string;
};

const DEFAULT_MOCK_USERS: RegisteredUser[] = [
  {
    uid: "mock-user-1",
    name: "Demo Rider",
    email: "rider@example.com",
    phone: "9606538417",
    address: "123 Rider Street, Bangalore",
    bikeBrand: "Royal Enfield",
    bikeModel: "Classic 350",
    bikeNumber: "KA 03 EX 1234",
    createdAt: new Date().toISOString()
  },
  {
    uid: "mock-user-2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "9876543210",
    address: "456 Bike Avenue, Mumbai",
    bikeBrand: "KTM",
    bikeModel: "Duke 390",
    bikeNumber: "MH 12 AB 5678",
    createdAt: new Date().toISOString()
  }
];

type Tab = "bookings" | "coupons" | "users";

export default function AdminDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [tab, setTab] = useState<Tab>("bookings");
  const [search, setSearch] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"flat" | "percent">("flat");
  const [couponValue, setCouponValue] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [mechanics, setMechanics] = useState<RegisteredMechanic[]>([]);

  const loadLocalData = () => {
    const rawC = JSON.parse(localStorage.getItem("bc_coupons") || "[]");
    rawC.sort((a: Coupon, b: Coupon) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setCoupons(rawC);

    let mechs = localStorage.getItem("bc_registered_mechanics");
    if (!mechs) {
      localStorage.setItem("bc_registered_mechanics", JSON.stringify(DEFAULT_REGISTERED_MECHANICS));
      mechs = JSON.stringify(DEFAULT_REGISTERED_MECHANICS);
    }
    setMechanics(JSON.parse(mechs));

    const rawUsers = JSON.parse(localStorage.getItem("bc_users") || "[]");
    if (rawUsers.length === 0) {
      localStorage.setItem("bc_users", JSON.stringify(DEFAULT_MOCK_USERS));
      setUsers(DEFAULT_MOCK_USERS);
    } else {
      setUsers(rawUsers);
    }
  };

  const loadData = () => {
    const raw = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
    raw.sort((a: Booking, b: Booking) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    setBookings(raw);
    loadLocalData();
  };

  useEffect(() => {
    if (!sessionStorage.getItem("bc_admin_auth")) {
      router.push("/admin/login");
      return;
    }
    
    loadLocalData();

    if (IS_MOCK_MODE) {
      loadData();
      const interval = setInterval(loadData, 2000);
      return () => clearInterval(interval);
    } else {
      const q = collection(db, "bookings");
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({ ...data, id: data.id || docSnap.id, _firestoreDocId: docSnap.id } as Booking);
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setBookings(list);
      }, (err) => {
        console.error("Firestore onSnapshot error, falling back to local storage polling:", err);
        loadData();
      });

      const uQ = collection(db, "users");
      const unsubscribeUsers = onSnapshot(uQ, (snapshot) => {
        const uList: RegisteredUser[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          uList.push({ ...data, uid: docSnap.id } as RegisteredUser);
        });
        uList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setUsers(uList);
      }, (err) => {
        console.error("Firestore users onSnapshot error:", err);
      });

      return () => {
        unsubscribe();
        unsubscribeUsers();
      };
    }
  }, [router]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (IS_MOCK_MODE) {
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
    } else {
      try {
        const booking = bookings.find(b => b.id === id);
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
          const updates: any = {
            status: newStatus,
            updatedAt: new Date().toISOString()
          };
          if (newStatus === "New") {
            updates.assignedMechanic = "";
          }
          await updateDoc(docRef, updates);
        } else {
          console.error("Booking document ID not found for status update");
        }
      } catch (err) {
        console.error("Error updating status in Firestore:", err);
      }
    }
  };

  const assignMechanic = async (id: string, mechanicName: string) => {
    if (IS_MOCK_MODE) {
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
    } else {
      try {
        const booking = bookings.find(b => b.id === id);
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
          const currentStatus = booking?.status || "New";
          let newStatus = currentStatus;
          if (currentStatus === "New" && mechanicName) {
            newStatus = "Assigned";
          } else if (!mechanicName && currentStatus === "Assigned") {
            newStatus = "New";
          }

          await updateDoc(docRef, {
            assignedMechanic: mechanicName,
            status: newStatus,
            updatedAt: new Date().toISOString()
          });
        } else {
          console.error("Booking document ID not found for assigning mechanic");
        }
      } catch (err) {
        console.error("Error assigning mechanic in Firestore:", err);
      }
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

  const filtered = bookings.filter(b => {
    const s = search.toLowerCase();
    return b.id.toLowerCase().includes(s) || b.name.toLowerCase().includes(s) || b.phone.includes(s) || (b.assignedMechanic || "").toLowerCase().includes(s);
  });

  const filteredUsers = users.filter(u => {
    const s = search.toLowerCase();
    return (u.name || "").toLowerCase().includes(s) || (u.email || "").toLowerCase().includes(s) || (u.phone || "").includes(s);
  });

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? "active" : ""}`} style={styles.sidebar}>
        <div style={styles.sidebarBrand}>🏍️ BikerClinic</div>
        <div style={styles.sidebarMenu}>
          <button onClick={() => { setTab("bookings"); setMobileSidebarOpen(false); }} style={{ ...styles.menuItem, ...(tab === "bookings" ? styles.menuItemActive : {}) }}>
            📅 Bookings
          </button>
          <button onClick={() => { setTab("coupons"); setMobileSidebarOpen(false); }} style={{ ...styles.menuItem, ...(tab === "coupons" ? styles.menuItemActive : {}) }}>
            🎫 Promo Coupons
          </button>
          <button onClick={() => { setTab("users"); setMobileSidebarOpen(false); }} style={{ ...styles.menuItem, ...(tab === "users" ? styles.menuItemActive : {}) }}>
            👥 Registered Users
          </button>
        </div>
        <button onClick={() => { sessionStorage.removeItem("bc_admin_auth"); router.push("/admin/login"); }} style={styles.logoutBtn}>
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {/* Top Navbar */}
        <nav style={styles.topbar}>
          <button className="menu-toggle" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} style={styles.toggleBtn}>
            ☰
          </button>
          <div style={styles.topbarTitle}>Admin Dashboard</div>
          <div style={styles.profileBadge}>Administrator</div>
        </nav>

        {/* Dynamic Panel */}
        <div style={{ padding: "32px 24px" }}>
          {tab === "bookings" && (
            <div>
              {/* Header */}
              <div style={styles.panelHeader}>
                <div>
                  <h2 style={styles.panelTitle}>Appointment Bookings</h2>
                  <p style={styles.panelSub}>Manage service requests, assign mechanics, and update statuses.</p>
                </div>
                <input
                  style={styles.searchInput}
                  placeholder="🔍 Search ID, customer, mechanic..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Grid / Table */}
              <div className="table-wrapper" style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Booking ID</th>
                      <th style={styles.th}>Customer</th>
                      <th style={styles.th}>Vehicle</th>
                      <th style={styles.th}>Schedule</th>
                      <th style={styles.th}>Specialty</th>
                      <th style={styles.th}>Assign Mechanic</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={styles.tdEmpty}>No bookings found.</td>
                      </tr>
                    ) : filtered.map(b => (
                      <tr key={b.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 700, color: "var(--primary)" }}>
                          <Link href={`/track?id=${b.id}`} style={{ color: "var(--primary)", textDecoration: "none" }} className="mono-text">{b.id}</Link>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 600 }}>{b.name}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{b.phone}</div>
                        </td>
                        <td style={styles.td}>{b.brand} {b.model}</td>
                        <td style={styles.td}>
                          <div>{b.date}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{b.time}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ textTransform: "capitalize" }}>{b.serviceType}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{b.service}{b.package ? ` (${b.package})` : ""}</div>
                        </td>
                        <td style={styles.td}>
                          <select
                            style={styles.select}
                            value={b.assignedMechanic || ""}
                            onChange={e => assignMechanic(b.id, e.target.value)}
                          >
                            <option value="">Choose Mechanic</option>
                            {getQualifiedMechanics(b).map(m => (
                              <option key={m.name} value={m.name}>{m.name.split("@")[0]}</option>
                            ))}
                          </select>
                        </td>
                        <td style={styles.td}>
                          <select
                            style={{
                              ...styles.select,
                              color: b.status === "Completed" ? "var(--success)" : b.status === "In Progress" ? "var(--accent)" : b.status === "Assigned" ? "var(--mechanic-accent)" : "var(--text-primary)",
                              fontWeight: 700
                            }}
                            value={b.status}
                            onChange={e => updateStatus(b.id, e.target.value)}
                          >
                            <option value="New">New Request</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "coupons" && (
            <div>
              {/* Coupons Panel */}
              <div style={styles.panelHeader}>
                <div>
                  <h2 style={styles.panelTitle}>Promo Coupons</h2>
                  <p style={styles.panelSub}>Create, toggle, and manage discount promo codes.</p>
                </div>
              </div>

              {/* Add Coupon Form */}
              <div style={styles.card}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>Create New Code</h3>
                <form onSubmit={addCoupon} style={styles.formInline}>
                  <input style={styles.formInput} placeholder="PROMO100" value={couponCode} onChange={e => setCouponCode(e.target.value)} required />
                  <select style={styles.formSelect} value={couponType} onChange={e => setCouponType(e.target.value as any)}>
                    <option value="flat">Flat Discount (₹)</option>
                    <option value="percent">Percentage (%)</option>
                  </select>
                  <input style={styles.formInput} type="number" placeholder="Value" value={couponValue} onChange={e => setCouponValue(e.target.value)} required />
                  <button type="submit" style={styles.submitBtn}>Add Coupon</button>
                </form>
                {couponMsg && <div style={{ marginTop: 12, color: "var(--success)", fontSize: "0.9rem", fontWeight: 600 }}>{couponMsg}</div>}
              </div>

              {/* Coupons Table */}
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Code</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Value</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={styles.tdEmpty}>No promo codes created yet.</td>
                      </tr>
                    ) : coupons.map(c => (
                      <tr key={c.code} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 700, color: "var(--accent)" }} className="mono-text">{c.code}</td>
                        <td style={styles.td}>{c.type === "flat" ? "Flat Rate" : "Percentage"}</td>
                        <td style={styles.td} className="mono-text">{c.type === "flat" ? `₹${c.value}` : `${c.value}%`}</td>
                        <td style={styles.td}>
                          <span style={{ color: c.active ? "var(--success)" : "var(--error)", fontWeight: 700 }}>
                            {c.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button
                            onClick={() => toggleCoupon(c.code, c.active)}
                            style={{
                              ...styles.actionBtn,
                              background: c.active ? "rgba(239,68,68,0.05)" : "rgba(0,230,118,0.05)",
                              color: c.active ? "var(--error)" : "var(--success)",
                              border: `1px solid ${c.active ? "rgba(239,68,68,0.15)" : "rgba(0,230,118,0.15)"}`
                            }}
                          >
                            {c.active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "users" && (
            <div>
              {/* Header */}
              <div style={styles.panelHeader}>
                <div>
                  <h2 style={styles.panelTitle}>Registered Users</h2>
                  <p style={styles.panelSub}>View and manage registered customers, their contact details, and bikes.</p>
                </div>
                <input
                  style={styles.searchInput}
                  placeholder="🔍 Search name, email, phone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Grid / Table */}
              <div className="table-wrapper" style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Customer</th>
                      <th style={styles.th}>Phone</th>
                      <th style={styles.th}>Default Address</th>
                      <th style={styles.th}>Garage Vehicle</th>
                      <th style={styles.th}>Number Plate</th>
                      <th style={styles.th}>Registered On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={styles.tdEmpty}>No registered users found.</td>
                      </tr>
                    ) : filteredUsers.map(u => (
                      <tr key={u.uid} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 600 }}>{u.name || "N/A"}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{u.email}</div>
                        </td>
                        <td style={styles.td} className="mono-text">+91 {u.phone || "N/A"}</td>
                        <td style={{ ...styles.td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.address || "No address saved"}
                        </td>
                        <td style={styles.td}>
                          {u.bikeBrand || u.bikeModel ? `${u.bikeBrand || ""} ${u.bikeModel || ""}` : "No bike registered"}
                        </td>
                        <td style={{ ...styles.td, textTransform: "uppercase" }} className="mono-text">{u.bikeNumber || "N/A"}</td>
                        <td style={styles.td} className="mono-text">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                        </td>
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

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", minHeight: "100vh", background: "var(--bg)", color: "var(--text-primary)" },
  sidebar: { width: 260, background: "#0c0e11", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: 24, zIndex: 99 },
  sidebarBrand: { fontSize: "1.25rem", fontWeight: 900, marginBottom: 40, color: "var(--text-primary)", letterSpacing: "-0.02em" },
  sidebarMenu: { display: "flex", flexDirection: "column", gap: 8, flex: 1 },
  menuItem: { background: "transparent", border: "none", color: "var(--text-muted)", padding: "12px 16px", borderRadius: 8, textAlign: "left", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", transition: "var(--transition)" },
  menuItemActive: { background: "var(--primary-glow)", color: "var(--primary)" },
  logoutBtn: { background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "10px", borderRadius: 8, cursor: "pointer", transition: "var(--transition)", fontWeight: 600 },
  mainContent: { flex: 1, display: "flex", flexDirection: "column" },
  topbar: { height: 70, background: "#0c0e11", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" },
  toggleBtn: { display: "none", background: "transparent", border: "none", color: "var(--text-primary)", fontSize: "1.5rem", cursor: "pointer" },
  topbarTitle: { fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.01em" },
  profileBadge: { background: "var(--primary-glow)", color: "var(--primary)", border: "1px solid rgba(0,102,255,0.2)", borderRadius: 6, padding: "6px 12px", fontSize: "0.82rem", fontWeight: 700 },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 28 },
  panelTitle: { fontSize: "1.45rem", fontWeight: 900, marginBottom: 6, letterSpacing: "-0.02em" },
  panelSub: { color: "var(--text-muted)", fontSize: "0.9rem" },
  searchInput: { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "10px 16px", borderRadius: 8, outline: "none", fontSize: "0.9rem", width: 260, transition: "var(--transition)" },
  tableWrapper: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  thRow: { background: "#0c0e11", borderBottom: "1px solid var(--border)" },
  th: { padding: "16px 20px", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" },
  tr: { borderBottom: "1px solid var(--border)", transition: "background 0.2s" },
  td: { padding: "18px 20px", fontSize: "0.9rem", color: "var(--text-primary)" },
  tdEmpty: { padding: "40px", textAlign: "center", color: "var(--text-muted)" },
  select: { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "8px 12px", borderRadius: 8, outline: "none", cursor: "pointer", width: "100%", transition: "var(--transition)" },
  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 28 },
  formInline: { display: "flex", gap: 12, flexWrap: "wrap" },
  formInput: { flex: 1, minWidth: 150, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "12px 14px", borderRadius: 8, outline: "none", transition: "var(--transition)" },
  formSelect: { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "12px", borderRadius: 8, outline: "none", cursor: "pointer", transition: "var(--transition)" },
  submitBtn: { background: "var(--primary)", color: "#fff", border: "none", padding: "0 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer", height: 48, transition: "var(--transition)", boxShadow: "0 4px 12px var(--primary-glow)" },
  actionBtn: { padding: "6px 12px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", transition: "var(--transition)" }
};
