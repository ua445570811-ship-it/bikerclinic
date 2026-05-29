"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db, IS_MOCK_MODE } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

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
  createdAt?: string;
  updatedAt?: string;
};

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlId = searchParams.get("id") || "";

  const [searchId, setSearchId] = useState(urlId.toUpperCase());
  const [booking, setBooking] = useState<Booking | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlId) {
      handleTrack(urlId.toUpperCase());
    }
  }, [urlId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = searchId.trim().toUpperCase();
    if (!cleanId) return;
    router.replace(`/track?id=${cleanId}`);
    handleTrack(cleanId);
  };

  const handleTrack = async (bId: string) => {
    setLoading(true);
    setErrorMsg("");
    setBooking(null);
    setSearched(true);

    // Simulate network delay for premium feel
    await new Promise((r) => setTimeout(r, 600));

    let found: Booking | null = null;

    if (!IS_MOCK_MODE) {
      try {
        const q = query(collection(db, "bookings"), where("id", "==", bId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = docSnap.data();
          found = { ...data, id: data.id || docSnap.id } as Booking;
        }
      } catch (err) {
        console.error("Error querying Firestore in track page:", err);
      }
    }

    // Fallback/Mock mode lookup
    if (!found) {
      const allBookings: Booking[] = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
      const localFound = allBookings.find((b) => b.id === bId);
      if (localFound) {
        found = localFound;
      }
    }

    setLoading(false);
    if (found) {
      setBooking(found);
    } else {
      setErrorMsg("Booking not found. Please check your ID and try again.");
    }
  };

  const formatTime = (ts?: string) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Timeline UI States
  const getTimelineStatus = (stepName: string) => {
    if (!booking) return "pending";
    const statusOrder = ["New", "Assigned", "In Progress", "Completed"];
    const currentIdx = statusOrder.indexOf(booking.status);
    const stepIdx = statusOrder.indexOf(stepName);

    if (currentIdx >= stepIdx) {
      return currentIdx === stepIdx ? "active" : "past";
    }
    return "pending";
  };

  // Line progress height percentage
  const getProgressHeight = () => {
    if (!booking) return "0%";
    switch (booking.status) {
      case "New":
        return "0%";
      case "Assigned":
        return "33%";
      case "In Progress":
        return "66%";
      case "Completed":
        return "100%";
      default:
        return "0%";
    }
  };

  const steps = [
    { name: "New", title: "Booking Received", desc: "We have received your request and are assigning a technician." },
    { name: "Assigned", title: "Mechanic Assigned", desc: booking?.assignedMechanic ? `Technician ${booking.assignedMechanic.split("@")[0]} has been assigned to your service.` : "A technician has been assigned to your service." },
    { name: "In Progress", title: "Service In Progress", desc: "Our mechanic is working on your vehicle right now." },
    { name: "Completed", title: "Completed ✅", desc: "Service completed. Hope you have a great ride!" },
  ];

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <Link href="/" style={s.logo}>🏍️ Biker<span style={{ color: "#FF3D00" }}>Clinic</span></Link>
        <Link href="/user/dashboard" style={s.navLink}>👤 My Garage</Link>
      </nav>

      <div style={s.container}>
        <div style={s.trackBox}>
          <h1 style={s.title}>Track Your Service</h1>
          <p style={s.subtitle}>Enter your Booking ID (e.g. BC123456) to check the live status of your bike service.</p>

          <form onSubmit={handleSubmit} style={s.form}>
            <input
              style={s.input}
              placeholder="e.g. BC123456"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
            />
            <button type="submit" disabled={loading} style={s.button}>
              {loading ? "Searching..." : "Track Status"}
            </button>
          </form>

          {errorMsg && <div style={s.error}>{errorMsg}</div>}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div style={s.loadingBox}>
            <div style={s.spinner} />
            <p style={{ color: "#6B6B88", fontSize: "0.9rem" }}>Connecting to Garage Live Link...</p>
          </div>
        )}

        {/* Results Card */}
        {booking && !loading && (
          <div style={s.resultCard} className="anim-fade-up">
            {/* Header */}
            <div style={s.cardHeader}>
              <div>
                <div style={s.bookingBadge}>ACTIVE BOOKING</div>
                <h2 style={s.bikeName}>{booking.brand} {booking.model}</h2>
              </div>
              <div style={s.bookingId}>{booking.id}</div>
            </div>

            {/* Info Grid */}
            <div style={s.infoGrid}>
              <div style={s.infoCol}>
                <span style={s.infoLabel}>Service Request</span>
                <span style={s.infoText}>{booking.service}{booking.package ? ` (${booking.package})` : ""}</span>
              </div>
              <div style={s.infoCol}>
                <span style={s.infoLabel}>Service Type</span>
                <span style={{ ...s.infoText, textTransform: "capitalize" }}>{booking.serviceType}</span>
              </div>
              <div style={s.infoCol}>
                <span style={s.infoLabel}>Scheduled Date</span>
                <span style={s.infoText}>{booking.date} at {booking.time}</span>
              </div>
              <div style={s.infoCol}>
                <span style={s.infoLabel}>Assigned Mechanic</span>
                <span style={{ ...s.infoText, color: booking.assignedMechanic ? "#00E676" : "#6B6B88" }}>
                  {booking.assignedMechanic ? `👨‍🔧 ${booking.assignedMechanic.split("@")[0]}` : "Assigning..."}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div style={s.timelineBox}>
              <h3 style={s.timelineTitle}>Live Progress</h3>

              <div style={s.timeline}>
                {/* Progress bar line */}
                <div style={s.timelineLine}>
                  <div style={{ ...s.timelineLineFill, height: getProgressHeight() }} />
                </div>

                {/* Steps */}
                {steps.map((st) => {
                  const state = getTimelineStatus(st.name);
                  return (
                    <div key={st.name} style={s.stepRow}>
                      <div
                        style={{
                          ...s.stepDot,
                          ...(state === "active" ? s.dotActive : state === "past" ? s.dotPast : {}),
                        }}
                      >
                        {state === "past" && "✓"}
                      </div>
                      <div style={s.stepContent}>
                        <h4
                          style={{
                            ...s.stepTitleText,
                            color: state === "active" ? "#FF3D00" : state === "past" ? "#F0F0F8" : "#6B6B88",
                          }}
                        >
                          {st.title}
                        </h4>
                        <p style={s.stepDesc}>{st.desc}</p>
                        {state === "active" && booking.updatedAt && (
                          <span style={s.updateTime}>Last updated at {formatTime(booking.updatedAt)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {searched && !booking && !loading && !errorMsg && (
          <div style={s.empty}>
            <p>Enter a Booking ID to see details</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div style={s.page}>
        <div style={s.loadingBox}>
          <div style={s.spinner} />
          <p style={{ color: "#6B6B88", fontSize: "0.9rem" }}>Loading tracking module...</p>
        </div>
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { background: "#0E0E18", minHeight: "100vh", color: "#F0F0F8" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", borderBottom: "1px solid #1E1E2E", background: "#0A0A14" },
  logo: { fontSize: "1.2rem", fontWeight: 800, textDecoration: "none", color: "#F0F0F8" },
  navLink: { color: "#9E9EB5", fontSize: "0.9rem", textDecoration: "none", border: "1px solid #2A2A3E", padding: "8px 14px", borderRadius: 8 },
  container: { maxWidth: 680, margin: "40px auto", padding: "0 24px 80px" },
  trackBox: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 20, padding: 36, textAlign: "center" as const, marginBottom: 28 },
  title: { fontSize: "1.8rem", fontWeight: 800, marginBottom: 12 },
  subtitle: { color: "#6B6B88", fontSize: "0.95rem", marginBottom: 28, lineHeight: 1.6 },
  form: { display: "flex", gap: 12 },
  input: { flex: 1, background: "#0E0E18", border: "1px solid #2A2A3E", borderRadius: 10, padding: "14px 18px", color: "#F0F0F8", fontSize: "1rem", outline: "none" },
  button: { background: "linear-gradient(135deg, #FF3D00, #cc3000)", color: "#fff", border: "none", borderRadius: 10, padding: "0 24px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 16px rgba(255,61,0,0.25)" },
  error: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", borderRadius: 10, padding: "12px 16px", marginTop: 16, fontSize: "0.9rem", textAlign: "left" as const },
  loadingBox: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 16, padding: "40px 0" },
  spinner: { width: 32, height: 32, border: "3px solid rgba(255,61,0,0.1)", borderTopColor: "#FF3D00", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  resultCard: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.4)" },
  cardHeader: { padding: 24, background: "#1A1A2A", borderBottom: "1px solid #222235", display: "flex", justifyContent: "space-between", alignItems: "center" },
  bookingBadge: { background: "rgba(0,230,118,0.1)", color: "#00E676", border: "1px solid rgba(0,230,118,0.2)", borderRadius: 6, padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.05em", width: "fit-content", marginBottom: 6 },
  bikeName: { fontSize: "1.3rem", fontWeight: 800 },
  bookingId: { fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 700, color: "#6366F1" },
  infoGrid: { padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, borderBottom: "1px solid #222235" },
  infoCol: { display: "flex", flexDirection: "column" as const, gap: 4 },
  infoLabel: { fontSize: "0.75rem", color: "#6B6B88", textTransform: "uppercase" as const, letterSpacing: "0.05em", fontWeight: 700 },
  infoText: { fontSize: "0.95rem", fontWeight: 600 },
  timelineBox: { padding: 24 },
  timelineTitle: { fontSize: "1.1rem", fontWeight: 800, marginBottom: 24 },
  timeline: { position: "relative" as const, paddingLeft: 32 },
  timelineLine: { position: "absolute" as const, left: 9, top: 8, bottom: 8, width: 2, background: "#222235" },
  timelineLineFill: { position: "absolute" as const, left: 0, top: 0, width: 2, background: "#FF3D00", transition: "height 0.4s ease" },
  stepRow: { display: "flex", gap: 20, marginBottom: 32, position: "relative" as const },
  stepDot: { position: "absolute" as const, left: -32, width: 20, height: 20, borderRadius: "50%", background: "#161622", border: "3px solid #222235", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, color: "#fff", transition: "all 0.3s" },
  dotActive: { borderColor: "#FF3D00", background: "rgba(255,61,0,0.15)", boxShadow: "0 0 12px rgba(255,61,0,0.4)" },
  dotPast: { borderColor: "#00E676", background: "#00E676" },
  stepContent: { display: "flex", flexDirection: "column" as const, gap: 4, marginTop: -2 },
  stepTitleText: { fontSize: "0.95rem", fontWeight: 700 },
  stepDesc: { color: "#6B6B88", fontSize: "0.85rem", lineHeight: 1.5 },
  updateTime: { fontSize: "0.75rem", color: "#F59E0B", fontWeight: 600 },
  empty: { padding: 40, textAlign: "center" as const },
};
