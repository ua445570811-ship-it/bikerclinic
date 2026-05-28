"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

    const allBookings: Booking[] = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
    const found = allBookings.find((b) => b.id === bId);

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

  return (
    <div style={s.container}>
      {/* Search Section */}
      <section style={s.hero}>
        <div style={s.glowPurple} />
        <div style={s.glowRed} />
        <div style={s.heroContent}>
          <div style={s.heroBadge}>📍 Live status</div>
          <h1 style={s.heroH1}>Track Your Service</h1>
          <p style={s.heroSub}>
            Enter your BikerClinic Booking ID to see real-time updates of your bike servicing.
          </p>

          <form onSubmit={handleSubmit} className="track-search-form" style={s.searchBox}>
            <input
              type="text"
              placeholder="e.g. BC123456"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
              style={s.searchInput}
              required
            />
            <button type="submit" style={s.searchBtn}>
              {loading ? "Searching..." : "Track Bike"}
            </button>
          </form>

          {errorMsg && <div style={s.error}>{errorMsg}</div>}
        </div>
      </section>

      {/* Tracker Card */}
      {searched && booking && (
        <section style={s.trackerSection} className="anim-fade-up">
          <div className="booking-card" style={s.trackerCard}>
            <div style={s.bikeHeader}>
              <div>
                <h3 style={s.bikeTitle}>
                  {booking.brand} {booking.model}
                </h3>
                <p style={s.bikeDetails}>
                  Customer: <strong>{booking.name}</strong> · {booking.service}{booking.package ? ` (${booking.package})` : ""}
                </p>
              </div>
              <div style={s.statusBadge}>
                STATUS: {booking.status.toUpperCase()}
              </div>
            </div>

            <div style={s.timelineContainer}>
              {/* Timeline Vertical Progress Line */}
              <div style={s.timelineLine}>
                <div style={{ ...s.timelineLineProgress, height: getProgressHeight() }} />
              </div>

              {/* Step 1: New */}
              <div style={s.timelineItem}>
                <div style={{ ...s.timelineDot, ...s[getTimelineStatus("New") + "Dot"] }} />
                <div style={{ ...s.timelineContent, opacity: getTimelineStatus("New") !== "pending" ? 1 : 0.5 }}>
                  <h4 style={{ ...s.timelineTitle, color: getTimelineStatus("New") === "active" ? "#FF3D00" : "#F0F0F8" }}>
                    Booking Confirmed
                  </h4>
                  <p style={s.timelineDesc}>
                    {booking.createdAt ? `Confirmed at ${formatTime(booking.createdAt)}` : "Waiting for assignment"}
                  </p>
                </div>
              </div>

              {/* Step 2: Assigned */}
              <div style={s.timelineItem}>
                <div style={{ ...s.timelineDot, ...s[getTimelineStatus("Assigned") + "Dot"] }} />
                <div style={{ ...s.timelineContent, opacity: getTimelineStatus("Assigned") !== "pending" ? 1 : 0.5 }}>
                  <h4 style={{ ...s.timelineTitle, color: getTimelineStatus("Assigned") === "active" ? "#FF3D00" : "#F0F0F8" }}>
                    Mechanic Assigned
                  </h4>
                  <p style={s.timelineDesc}>
                    {getTimelineStatus("Assigned") !== "pending" && booking.updatedAt
                      ? `Mechanic assigned at ${formatTime(booking.updatedAt)}`
                      : "A certified technician will be assigned shortly"}
                  </p>

                  {booking.assignedMechanic && getTimelineStatus("Assigned") !== "pending" && (
                    <div style={s.mechanicCard}>
                      <div style={s.mechanicAvatar}>👨‍🔧</div>
                      <div>
                        <div style={s.mechanicName}>{booking.assignedMechanic}</div>
                        <div style={s.mechanicLabel}>Certified BikerClinic Specialist</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: In Progress */}
              <div style={s.timelineItem}>
                <div style={{ ...s.timelineDot, ...s[getTimelineStatus("In Progress") + "Dot"] }} />
                <div style={{ ...s.timelineContent, opacity: getTimelineStatus("In Progress") !== "pending" ? 1 : 0.5 }}>
                  <h4 style={{ ...s.timelineTitle, color: getTimelineStatus("In Progress") === "active" ? "#FF3D00" : "#F0F0F8" }}>
                    Service In Progress
                  </h4>
                  <p style={s.timelineDesc}>
                    {getTimelineStatus("In Progress") !== "pending" && booking.updatedAt
                      ? `Work started at ${formatTime(booking.updatedAt)}`
                      : "We perform a comprehensive 35-point inspection and complete the servicing"}
                  </p>
                </div>
              </div>

              {/* Step 4: Completed */}
              <div style={s.timelineItem}>
                <div style={{ ...s.timelineDot, ...s[getTimelineStatus("Completed") + "Dot"] }} />
                <div style={{ ...s.timelineContent, opacity: getTimelineStatus("Completed") !== "pending" ? 1 : 0.5 }}>
                  <h4 style={{ ...s.timelineTitle, color: getTimelineStatus("Completed") === "active" ? "#FF3D00" : "#F0F0F8" }}>
                    Ready & Delivered
                  </h4>
                  <p style={s.timelineDesc}>
                    {getTimelineStatus("Completed") === "active"
                      ? `Servicing finished and bike delivered successfully!`
                      : "Your bike will be delivered and pay-after-service is finalized"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <div style={s.page}>
      {/* Navigation */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <Link href="/" style={s.logo}>
            🏍️ Biker<span style={{ color: "#FF3D00" }}>Clinic</span>
          </Link>
          <div style={s.navLinks}>
            <Link href="/booking" style={s.navLink}>
              Book Now
            </Link>
            <Link href="/user/login" style={s.navLinkGhost}>
              👤 My Garage
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Track Logic wrapped in Suspense for search params */}
      <Suspense fallback={<div style={s.loadingContainer}>Loading tracking details...</div>}>
        <TrackContent />
      </Suspense>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.logo}>
            🏍️ Biker<span style={{ color: "#FF3D00" }}>Clinic</span>
          </div>
          <p style={s.footerCopy}>© 2025 BikerClinic. Bangalore, India.</p>
        </div>
      </footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { background: "#0E0E18", minHeight: "100vh", display: "flex", flexDirection: "column" },
  nav: { position: "sticky", top: 0, zIndex: 100, padding: "20px 0", background: "rgba(10,10,20,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid #1E1E2E" },
  navInner: { maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: "1.3rem", fontWeight: 800, textDecoration: "none", color: "#F0F0F8" },
  navLinks: { display: "flex", alignItems: "center", gap: 20 },
  navLink: { color: "#B0B0C8", fontSize: "0.9rem", fontWeight: 500, textDecoration: "none" },
  navLinkGhost: { color: "#B0B0C8", fontSize: "0.9rem", fontWeight: 500, textDecoration: "none", border: "1px solid #2A2A3E", padding: "8px 16px", borderRadius: 8 },
  loadingContainer: { display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "#B0B0C8", fontSize: "1.1rem" },
  container: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 80 },
  hero: { width: "100%", padding: "100px 24px 60px", position: "relative", overflow: "hidden", display: "flex", justifyContent: "center", borderBottom: "1px solid #1E1E2E" },
  glowPurple: { position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)", top: -200, right: -100, pointerEvents: "none" },
  glowRed: { position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,61,0,0.04) 0%, transparent 70%)", bottom: -200, left: -100, pointerEvents: "none" },
  heroContent: { textAlign: "center", maxWidth: 640, position: "relative", zIndex: 1 },
  heroBadge: { display: "inline-block", background: "rgba(255,61,0,0.1)", border: "1px solid rgba(255,61,0,0.2)", color: "#FF3D00", padding: "6px 16px", borderRadius: 99, fontSize: "0.8rem", fontWeight: 700, marginBottom: 16, letterSpacing: "0.05em", textTransform: "uppercase" },
  heroH1: { fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, marginBottom: 14, letterSpacing: "-0.02em" },
  heroSub: { color: "#9E9EB5", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: 32 },
  searchBox: { display: "flex", width: "100%", maxWidth: 500, margin: "0 auto", background: "#161622", border: "1px solid #2A2A3E", borderRadius: 99, padding: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" },
  searchInput: { flex: 1, background: "transparent", border: "none", padding: "12px 20px", fontSize: "1rem", color: "#F0F0F8", outline: "none" },
  searchBtn: { background: "linear-gradient(135deg, #FF3D00, #cc3000)", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 99, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "opacity 0.2s" },
  error: { color: "#EF4444", fontSize: "0.9rem", marginTop: 16, fontWeight: 600 },
  trackerSection: { width: "100%", maxWidth: 800, padding: "60px 24px 0", boxSizing: "border-box" },
  trackerCard: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 20, padding: "40px", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" },
  bikeHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 24, borderBottom: "1px solid #2A2A3E", marginBottom: 36, flexWrap: "wrap", gap: 16 },
  bikeTitle: { fontSize: "1.4rem", fontWeight: 800, color: "#F0F0F8" },
  bikeDetails: { color: "#6B6B88", fontSize: "0.9rem", marginTop: 4 },
  statusBadge: { background: "rgba(255,61,0,0.1)", border: "1px solid rgba(255,61,0,0.2)", color: "#FF3D00", padding: "8px 16px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 800, letterSpacing: "0.05em" },
  timelineContainer: { position: "relative", paddingLeft: 36 },
  timelineLine: { position: "absolute", left: 11, top: 12, bottom: 24, width: 2, background: "#2A2A3E" },
  timelineLineProgress: { position: "absolute", top: 0, left: 0, width: "100%", background: "linear-gradient(to bottom, #00E676, #FF3D00)", transition: "height 0.6s cubic-bezier(0.4, 0, 0.2, 1)" },
  timelineItem: { position: "relative", marginBottom: 36, display: "flex", gap: 16 },
  timelineDot: { position: "absolute", left: -36, top: 4, width: 24, height: 24, borderRadius: "50%", background: "#161622", border: "4px solid #2A2A3E", boxSizing: "border-box", zIndex: 2, transition: "all 0.3s ease" },
  timelineContent: { display: "flex", flexDirection: "column", transition: "opacity 0.3s ease" },
  timelineTitle: { fontSize: "1.05rem", fontWeight: 700, marginBottom: 4 },
  timelineDesc: { color: "#6B6B88", fontSize: "0.88rem", lineHeight: 1.4 },
  // Dot States
  pendingDot: { background: "#161622", borderColor: "#2A2A3E" },
  activeDot: { background: "#FF3D00", borderColor: "rgba(255, 61, 0, 0.3)", boxShadow: "0 0 0 4px rgba(255, 61, 0, 0.1)" },
  pastDot: { background: "#00E676", borderColor: "rgba(0, 230, 118, 0.2)" },
  // Mechanic info
  mechanicCard: { display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "14px 16px", borderRadius: 12, marginTop: 14, maxWidth: 360 },
  mechanicAvatar: { width: 40, height: 40, borderRadius: "50%", background: "#FF3D00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" },
  mechanicName: { fontWeight: 700, fontSize: "0.92rem", color: "#F0F0F8" },
  mechanicLabel: { fontSize: "0.75rem", color: "#6B6B88", marginTop: 2 },
  // Footer
  footer: { background: "#070710", borderTop: "1px solid #1E1E2E", padding: "40px 0", marginTop: "auto", width: "100%" },
  footerInner: { maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 },
  footerCopy: { color: "#3A3A52", fontSize: "0.8rem" },
};
