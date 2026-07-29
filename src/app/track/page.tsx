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

interface ChatMessage {
  sender: "user" | "mechanic";
  text: string;
  time: string;
}

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlId = searchParams.get("id") || "";

  const [searchId, setSearchId] = useState(urlId.toUpperCase());
  const [booking, setBooking] = useState<Booking | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Chat/Dossier states
  const [showTechDossier, setShowTechDossier] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

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

  // Open Chat thread helper
  const openTechChat = () => {
    if (booking?.assignedMechanic) {
      setShowTechDossier(true);
      setChatMessages([
        { 
          sender: "mechanic", 
          text: `Hello! I am your assigned technician, ${booking.assignedMechanic.split("@")[0]}. I'm prepping the equipment for your motorcycle service. How can I assist you?`, 
          time: "Just Now" 
        }
      ]);
    }
  };

  // Send Chat message helper
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      sender: "user",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");

    setTimeout(() => {
      const replies = [
        "Sounds good! I'm loaded up and heading to your destination address now.",
        "Understood. I'll make sure to inspect that specific issue first.",
        "Perfect. I should arrive within the scheduled window. I'll notify you on arrival.",
        "Alright. I've noted down your instructions."
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      
      const mechMsg: ChatMessage = {
        sender: "mechanic",
        text: randomReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, mechMsg]);
    }, 1500);
  };

  const steps = [
    { name: "New", title: "Booking Received", desc: "We have received your diagnostic request and are assigning a technician." },
    { name: "Assigned", title: "Mechanic Assigned", desc: booking?.assignedMechanic ? `Technician ${booking.assignedMechanic.split("@")[0]} has been assigned to your service.` : "A certified technician has been assigned to your ride." },
    { name: "In Progress", title: "Service In Progress", desc: "Our technician is currently tuning and servicing your vehicle." },
    { name: "Completed", title: "Completed ✅", desc: "Service completed. Your machine is ready for the road!" },
  ];

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <Link href="/" style={s.logo}>🏍️ Biker<span style={{ color: "var(--primary)" }}>Clinic</span></Link>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/" style={s.navTextLink}>Home</Link>
          <Link href="/booking" style={s.navTextLink}>Services</Link>
          <Link href="/#how-it-works" style={s.navTextLink}>How It Works</Link>
          <Link href="/#reviews" style={s.navTextLink}>Reviews</Link>
          <Link href="/#contact" style={s.navTextLink}>Contact</Link>
          <Link href="/track" style={s.navTextLink}>Track Order</Link>
          <Link href="/user/dashboard" style={s.navGarageBtn}>👤 My Garage</Link>
          <Link href="/booking" style={s.navBookBtn}>Book Now</Link>
        </div>
      </nav>

      <div style={s.container}>
        <div style={s.trackBox}>
          <h1 style={s.title}>Track Live Service</h1>
          <p style={s.subtitle}>Enter your Booking ID to connect with our garage live link and track status.</p>

          <form onSubmit={handleSubmit} style={s.form}>
            <input
              style={s.input}
              placeholder="e.g. BC123456"
              className="mono-text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
            />
            <button type="submit" disabled={loading} style={s.button}>
              {loading ? "Searching..." : "Track Status"}
            </button>
          </form>

          {errorMsg && <div style={s.error}>{errorMsg}</div>}
        </div>

        {loading && (
          <div style={s.loadingBox}>
            <div className="spinner" style={s.spinner} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Connecting to Garage Live Link...</p>
          </div>
        )}

        {booking && !loading && (
          <div style={s.resultCard} className="anim-fade-up">
            <div style={s.cardHeader}>
              <div>
                <div style={s.bookingBadge}>ACTIVE JOB</div>
                <h2 style={s.bikeName}>{booking.brand} {booking.model}</h2>
              </div>
              <div style={s.bookingId} className="mono-text">{booking.id}</div>
            </div>

            <div style={s.infoGrid}>
              <div style={s.infoCol}>
                <span style={s.infoLabel}>Service Specialty</span>
                <span style={s.infoText}>{booking.service}{booking.package ? ` (${booking.package})` : ""}</span>
              </div>
              <div style={s.infoCol}>
                <span style={s.infoLabel}>Service Type</span>
                <span style={{ ...s.infoText, textTransform: "capitalize" }}>{booking.serviceType}</span>
              </div>
              <div style={s.infoCol}>
                <span style={s.infoLabel}>Scheduled Date</span>
                <span style={s.infoText} className="mono-text">{booking.date} at {booking.time}</span>
              </div>
              <div style={s.infoCol}>
                <span style={s.infoLabel}>Assigned Mechanic</span>
                {booking.assignedMechanic ? (
                  <span 
                    onClick={openTechChat}
                    style={{ ...s.infoText, color: "var(--primary)", cursor: "pointer", textDecoration: "underline" }}
                  >
                    👨‍🔧 {booking.assignedMechanic.split("@")[0]} (Click to Chat)
                  </span>
                ) : (
                  <span style={{ ...s.infoText, color: "var(--text-muted)" }}>Dispatching...</span>
                )}
              </div>
            </div>

            <div style={s.timelineBox}>
              <h3 style={s.timelineTitle}>Live Progress Timeline</h3>

              <div style={s.timeline}>
                <div style={s.timelineLine}>
                  <div style={{ ...s.timelineLineFill, height: getProgressHeight() }} />
                </div>

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
                            color: state === "active" ? "var(--primary)" : state === "past" ? "var(--text-primary)" : "var(--text-muted)",
                          }}
                        >
                          {st.title}
                        </h4>
                        <p style={s.stepDesc}>{st.desc}</p>
                        {state === "active" && booking.updatedAt && (
                          <span style={s.updateTime} className="mono-text">Last updated at {formatTime(booking.updatedAt)}</span>
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
            <p style={{ color: "var(--text-muted)" }}>Enter a Booking ID to connect live status.</p>
          </div>
        )}
      </div>

      {/* ── Technician Dossier & Chat Modal ── */}
      {showTechDossier && booking?.assignedMechanic && (
        <div style={s.modalOverlay}>
          <div style={s.modalCard} className="booking-card anim-scale-up">
            <div style={s.modalHeader}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>👨‍🔧 Technician Profile Dossier</h3>
              <button onClick={() => setShowTechDossier(false)} style={s.closeBtn}>✕</button>
            </div>

            <div style={{ display: "flex", gap: 16, alignItems: "center", borderBottom: "1px solid var(--border)", pb: 16, mb: 16, paddingBottom: 16, marginBottom: 16 }}>
              <div style={s.avatarBox}>
                <span className="material-symbols-outlined" style={{ fontSize: "2.5rem", color: "var(--primary)" }}>engineering</span>
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: "1.15rem" }}>{booking.assignedMechanic.split("@")[0]}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>Certified Master Mechanic</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.8rem", color: "var(--warning)", marginTop: 4 }}>
                  <span>⭐ 4.9 Rating</span>
                  <span style={{ color: "var(--text-muted)" }}>· 420+ Jobs Done</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", marginBottom: 8 }}>
              Live Operations Chat
            </div>
            
            <div style={s.chatBox}>
              {chatMessages.map((msg, idx) => {
                const isUser = msg.sender === "user";
                return (
                  <div key={idx} style={{ 
                    display: "flex", 
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                    marginBottom: 10 
                  }}>
                    <div style={{ 
                      ...s.chatBubble, 
                      ...(isUser ? s.chatBubbleUser : s.chatBubbleMech) 
                    }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 2 }}>{msg.time}</span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendChat} style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <input 
                type="text" 
                placeholder="Type message for technician..." 
                style={{ ...s.input, flex: 1 }}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" style={s.applyBtn}>Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div style={s.page}>
        <div style={s.loadingBox}>
          <div className="spinner" style={s.spinner} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading tracking module...</p>
        </div>
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { background: "var(--bg)", minHeight: "100vh", color: "var(--text-primary)" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", borderBottom: "1px solid var(--border)", background: "rgba(17, 19, 22, 0.95)", position: "sticky", top: 0, zIndex: 10 },
  logo: { fontSize: "1.2rem", fontWeight: 900, textDecoration: "none", color: "var(--text-primary)", letterSpacing: "-0.02em" },
  navLink: { color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none", border: "1px solid var(--border)", padding: "8px 14px", borderRadius: 8, transition: "var(--transition)" },
  navTextLink: { color: "#94A3B8", fontSize: "0.9rem", fontWeight: 600, textDecoration: "none", transition: "color 0.2s" },
  navGarageBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: "0.88rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 },
  navBookBtn: { background: "#FF1E27", color: "#fff", padding: "8px 18px", borderRadius: 8, fontWeight: 800, fontSize: "0.88rem", textDecoration: "none", boxShadow: "0 0 16px rgba(255,30,39,0.4)" },
  container: { maxWidth: 680, margin: "40px auto", padding: "0 24px 80px" },
  trackBox: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 36, textAlign: "center", marginBottom: 28, boxShadow: "var(--shadow-md)" },
  title: { fontSize: "1.6rem", fontWeight: 900, marginBottom: 12, letterSpacing: "-0.02em" },
  subtitle: { color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: 28, lineHeight: 1.6 },
  form: { display: "flex", gap: 12 },
  input: { flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "13px 14px", color: "var(--text-primary)", fontSize: "0.95rem", outline: "none", transition: "var(--transition)" },
  button: { background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "0 24px", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", transition: "var(--transition)", boxShadow: "0 4px 14px var(--primary-glow)" },
  error: { background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", borderRadius: 8, padding: "12px 16px", marginTop: 16, fontSize: "0.88rem", textAlign: "left" },
  loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "40px 0" },
  spinner: { width: 32, height: 32, border: "3px solid var(--primary-glow)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  resultCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-lg)" },
  cardHeader: { padding: 24, background: "#1b1d21", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" },
  bookingBadge: { background: "var(--primary-glow)", color: "var(--primary)", border: "1px solid rgba(0,102,255,0.2)", borderRadius: 6, padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.05em", width: "fit-content", marginBottom: 6 },
  bikeName: { fontSize: "1.25rem", fontWeight: 900, letterSpacing: "-0.01em" },
  bookingId: { fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)" },
  infoGrid: { padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, borderBottom: "1px solid var(--border)" },
  infoCol: { display: "flex", flexDirection: "column", gap: 4 },
  infoLabel: { fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 },
  infoText: { fontSize: "0.92rem", fontWeight: 600 },
  timelineBox: { padding: 24 },
  timelineTitle: { fontSize: "1.05rem", fontWeight: 800, marginBottom: 24, letterSpacing: "-0.01em" },
  timeline: { position: "relative", paddingLeft: 32 },
  timelineLine: { position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: "var(--border)" },
  timelineLineFill: { position: "absolute", left: 0, top: 0, width: 2, background: "var(--primary)", transition: "height 0.4s ease", boxShadow: "0 0 8px var(--primary)" },
  stepRow: { display: "flex", gap: 20, marginBottom: 32, position: "relative" },
  stepDot: { position: "absolute", left: -32, width: 20, height: 20, borderRadius: "50%", background: "var(--surface)", borderWidth: 3, borderStyle: "solid", borderColor: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, color: "#fff", transition: "all 0.3s" },
  dotActive: { borderColor: "var(--primary)", background: "var(--primary-glow)", boxShadow: "0 0 12px var(--primary)" },
  dotPast: { borderColor: "var(--success)", background: "var(--success)" },
  stepContent: { display: "flex", flexDirection: "column", gap: 4, marginTop: -2 },
  stepTitleText: { fontSize: "0.95rem", fontWeight: 800, letterSpacing: "-0.01em" },
  stepDesc: { color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 },
  updateTime: { fontSize: "0.75rem", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.02em" },
  empty: { padding: 40, textAlign: "center" },

  // Modal Styles
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(10,12,14,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" },
  modalCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: 500, padding: 28, position: "relative" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  closeBtn: { background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" },
  avatarBox: { width: 54, height: 54, borderRadius: "50%", background: "var(--primary-glow)", border: "1px solid rgba(0, 102, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" },
  applyBtn: { background: "rgba(0,102,255,0.08)", color: "var(--primary)", border: "1px solid rgba(0,102,255,0.2)", borderRadius: 8, padding: "0 20px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", transition: "var(--transition)" },

  // Live Chat Styles
  chatBox: { height: 180, overflowY: "auto", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column" },
  chatBubble: { padding: "10px 14px", borderRadius: 12, fontSize: "0.82rem", maxWidth: "80%", lineHeight: 1.4 },
  chatBubbleUser: { background: "var(--primary)", color: "#fff", borderBottomRightRadius: 0 },
  chatBubbleMech: { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)", borderBottomLeftRadius: 0 }
};
