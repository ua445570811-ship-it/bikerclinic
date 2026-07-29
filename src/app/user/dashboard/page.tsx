"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db, IS_MOCK_MODE } from "@/lib/firebase";
import { collection, query, where, onSnapshot, or, doc, getDoc, setDoc, addDoc } from "firebase/firestore";

// ── Types ──────────────────────────────────────────────
interface Booking {
  id: string;
  name: string;
  phone: string;
  email?: string;
  brand: string;
  model: string;
  bikeNumber?: string;
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
  paymentMethod?: string;
  paymentDetail?: string;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: string;
  plateNumber: string;
}

interface UPIAccount {
  id: string;
  code: string;
  active: boolean;
  createdAt: string;
}

interface CardAccount {
  id: string;
  type: string;
  number: string;
  expiry: string;
  active: boolean;
}

interface SupportTicket {
  id: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
}

interface ChatMessage {
  sender: "user" | "mechanic";
  text: string;
  time: string;
}

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  New: { bg: "var(--primary-glow)", color: "var(--primary)", label: "Booking Received" },
  Assigned: { bg: "rgba(245,158,11,0.08)", color: "var(--mechanic-accent)", label: "Mechanic Assigned" },
  "In Progress": { bg: "rgba(255,181,157,0.08)", color: "var(--accent)", label: "Service In Progress" },
  Completed: { bg: "rgba(0,230,118,0.08)", color: "var(--success)", label: "Completed ✅" },
};

const BRANDS = ["Hero", "Honda", "TVS", "Bajaj", "Royal Enfield", "Yamaha", "Suzuki", "KTM", "Kawasaki", "Other"];

// Sample FAQs for Support
const FAQS = [
  { q: "How does Doorstep Diagnostic Service work?", a: "A certified BikerClinic technician will ride to your specified location (home or office) with a mobile diagnostic suite. They perform oil updates, filters clean, brake tuning, and computer-guided diagnostics right in your parking spot." },
  { q: "What is the difference between General Service and Full Service?", a: "General Service covers basic maintenance checks, oil refills, and spark plug cleaning. Full Service includes a complete brake bleed, chain derailleur disassembly, full body wash, electrical health scanning, and 1-year guarantee on genuine parts replacements." },
  { q: "How can I pay for my booking?", a: "We support cash on delivery, linked UPI IDs, and saved Credit/Debit Cards. Payment will only be debited from your account after the doorstep service is completed and verified by you." },
  { q: "What happens in a roadside emergency (SOS)?", a: "By clicking the SOS button, BikerClinic immediately dispatches our closest active technician to your GPS coordinates. They provide basic fuel fills, flat tyre repairs, and battery jumpstarts on the spot." }
];

export default function UserDashboard() {
  const router = useRouter();
  const [userPhone, setUserPhone] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Tabs: active | history | garage | payments | profile | security | support | review
  const [tab, setTab] = useState<"active" | "history" | "garage" | "payments" | "profile" | "security" | "support" | "review">("active");
  
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    bikeBrand: "",
    bikeModel: "",
    bikeNumber: "",
    emergencyContact: "",
    defaultPref: "Doorstep Service"
  });
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);

  // Garage states
  const [garage, setGarage] = useState<Vehicle[]>([]);
  const [newBike, setNewBike] = useState({ brand: "", model: "", year: "", plateNumber: "" });
  const [bikeSuccess, setBikeSuccess] = useState("");

  // Payment states
  const [upiList, setUpiList] = useState<UPIAccount[]>([]);
  const [cardList, setCardList] = useState<CardAccount[]>([]);
  const [newUpi, setNewUpi] = useState("");
  const [newCard, setNewCard] = useState({ type: "visa", number: "", expiry: "" });
  const [paymentMsg, setPaymentMsg] = useState("");

  // Security preferences
  const [security, setSecurity] = useState({
    mfa: false,
    emailAlerts: true,
    smsAlerts: true,
    pushAlerts: false
  });
  const [securityMsg, setSecurityMsg] = useState("");

  // Support states
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketForm, setTicketForm] = useState({ category: "Mechanical Issue", desc: "" });
  const [supportMsg, setSupportMsg] = useState("");
  const [faqOpenIdx, setFaqOpenIdx] = useState<number | null>(null);

  // Review states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBike, setReviewBike] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Modal / Detail States
  const [selectedReport, setSelectedReport] = useState<Booking | null>(null);
  const [selectedTech, setSelectedTech] = useState<string | null>(null); // technician email/name
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      alert("Please write some comments first.");
      return;
    }
    setReviewLoading(true);
    setReviewSuccess(false);
    try {
      const email = localStorage.getItem("bc_user_email") || "rider@example.com";
      const name = localStorage.getItem("bc_user_name") || "Demo Rider";
      
      const newReview = {
        name,
        email,
        rating: reviewRating,
        comment: reviewComment,
        bike: reviewBike || `${profile.bikeBrand} ${profile.bikeModel}`.trim() || "My Bike",
        createdAt: new Date().toISOString(),
      };

      if (!IS_MOCK_MODE) {
        await addDoc(collection(db, "reviews"), newReview);
      } else {
        const prev = JSON.parse(localStorage.getItem("bc_reviews") || "[]");
        localStorage.setItem("bc_reviews", JSON.stringify([...prev, newReview]));
      }

      setReviewComment("");
      setReviewBike("");
      setReviewRating(5);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review. Please try again.");
    } finally {
      setReviewLoading(false);
    }
  };

  // Load bookings list
  const loadBookings = useCallback((phone: string, email: string) => {
    const all: Booking[] = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
    const mine = all.filter(b => (phone && b.phone === phone) || (email && b.email === email)).reverse();
    setBookings(mine);
    if (mine.length > 0 && mine[0].name) setUserName(mine[0].name.split(" ")[0]);
  }, []);

  // Load Garage, Payments, Security, and Tickets from localStorage
  const loadUserData = useCallback(() => {
    const localGarage = JSON.parse(localStorage.getItem("bc_user_garage") || "[]");
    setGarage(localGarage);

    const localUPI = JSON.parse(localStorage.getItem("bc_user_upi") || "[]");
    setUpiList(localUPI);

    const localCards = JSON.parse(localStorage.getItem("bc_user_cards") || "[]");
    setCardList(localCards);

    const localSecurity = JSON.parse(localStorage.getItem("bc_user_security") || "null");
    if (localSecurity) setSecurity(localSecurity);

    const localTickets = JSON.parse(localStorage.getItem("bc_support_tickets") || "[]");
    setTickets(localTickets);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSyncFailed(localStorage.getItem("bc_last_sync_failed") === "true");
    }
    const email = localStorage.getItem("bc_user_email") || "";
    const phone = localStorage.getItem("bc_user_phone") || "";
    if (!email && !phone) { router.push("/user/login"); return; }
    setUserPhone(phone);
    setUserEmail(email);

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
      emergencyContact: localStorage.getItem("bc_user_emergency") || "",
      defaultPref: localStorage.getItem("bc_user_default_pref") || "Doorstep Service"
    });

    loadUserData();

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
            emergencyContact: data.emergencyContact || "",
            defaultPref: data.defaultPref || "Doorstep Service"
          };
          setProfile(loadedProfile);
          
          localStorage.setItem("bc_user_name", loadedProfile.name);
          localStorage.setItem("bc_user_phone", loadedProfile.phone);
          localStorage.setItem("bc_user_address", loadedProfile.address);
          localStorage.setItem("bc_user_bike_brand", loadedProfile.bikeBrand);
          localStorage.setItem("bc_user_bike_model", loadedProfile.bikeModel);
          localStorage.setItem("bc_user_bike_number", loadedProfile.bikeNumber);
          localStorage.setItem("bc_user_emergency", loadedProfile.emergencyContact);
          localStorage.setItem("bc_user_default_pref", loadedProfile.defaultPref);
          if (loadedProfile.name) setUserName(loadedProfile.name.split(" ")[0]);
        }
      }).catch(err => console.error("Error loading profile from Firestore:", err));
    }

    if (IS_MOCK_MODE) {
      loadBookings(phone, email);
      const interval = setInterval(() => loadBookings(phone, email), 2000);
      return () => clearInterval(interval);
    } else {
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
          mine.push({ ...data, id: data.id || doc.id } as Booking);
        });

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
  }, [router, loadBookings, loadUserData]);

  // Handle Save Profile Settings
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
          emergencyContact: profile.emergencyContact,
          defaultPref: profile.defaultPref,
          updatedAt: new Date().toISOString()
        }, { merge: true }).then(() => {
          localStorage.removeItem("bc_last_sync_failed");
          setSyncFailed(false);
        }).catch((err) => {
          console.error("Firestore save profile error:", err);
          localStorage.setItem("bc_last_sync_failed", "true");
          setSyncFailed(true);
        });
      }

      // Update local storage
      localStorage.setItem("bc_user_name", profile.name);
      localStorage.setItem("bc_user_phone", profile.phone);
      localStorage.setItem("bc_user_address", profile.address);
      localStorage.setItem("bc_user_bike_brand", profile.bikeBrand);
      localStorage.setItem("bc_user_bike_model", profile.bikeModel);
      localStorage.setItem("bc_user_bike_number", profile.bikeNumber);
      localStorage.setItem("bc_user_emergency", profile.emergencyContact);
      localStorage.setItem("bc_user_default_pref", profile.defaultPref);

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

  // Virtual Garage: Add motorcycle
  const handleAddBike = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBike.brand || !newBike.model || !newBike.plateNumber) {
      setBikeSuccess("⚠️ Please fill in all required motorcycle details.");
      return;
    }
    const id = "BK" + Math.floor(1000 + Math.random() * 9000);
    const updatedGarage = [...garage, { id, ...newBike }];
    localStorage.setItem("bc_user_garage", JSON.stringify(updatedGarage));
    setGarage(updatedGarage);
    setNewBike({ brand: "", model: "", year: "", plateNumber: "" });
    setBikeSuccess("✅ Vehicle successfully registered in your virtual garage!");
    setTimeout(() => setBikeSuccess(""), 4000);
  };

  // Virtual Garage: Delete motorcycle
  const handleDeleteBike = (id: string) => {
    const updated = garage.filter(b => b.id !== id);
    localStorage.setItem("bc_user_garage", JSON.stringify(updated));
    setGarage(updated);
  };

  // Payments: Add UPI ID
  const handleAddUpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpi.trim().includes("@")) {
      setPaymentMsg("❌ Please enter a valid UPI ID (e.g., username@okaxis)");
      return;
    }
    const upi: UPIAccount = {
      id: "UPI" + Math.floor(1000 + Math.random() * 9000),
      code: newUpi.trim(),
      active: true,
      createdAt: new Date().toISOString()
    };
    const updated = [...upiList, upi];
    localStorage.setItem("bc_user_upi", JSON.stringify(updated));
    setUpiList(updated);
    setNewUpi("");
    setPaymentMsg("✅ UPI ID linked successfully!");
    setTimeout(() => setPaymentMsg(""), 3000);
  };

  // Payments: Add Card
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCard.number.length < 16 || !newCard.expiry.includes("/")) {
      setPaymentMsg("❌ Invalid card specs. Number must be 16 digits.");
      return;
    }
    const card: CardAccount = {
      id: "CRD" + Math.floor(1000 + Math.random() * 9000),
      type: newCard.type,
      number: newCard.number,
      expiry: newCard.expiry,
      active: true
    };
    const updated = [...cardList, card];
    localStorage.setItem("bc_user_cards", JSON.stringify(updated));
    setCardList(updated);
    setNewCard({ type: "visa", number: "", expiry: "" });
    setPaymentMsg("✅ Card profile linked securely!");
    setTimeout(() => setPaymentMsg(""), 3000);
  };

  // Payments: Remove payment methods
  const handleDeleteUPI = (id: string) => {
    const updated = upiList.filter(u => u.id !== id);
    localStorage.setItem("bc_user_upi", JSON.stringify(updated));
    setUpiList(updated);
  };

  const handleDeleteCard = (id: string) => {
    const updated = cardList.filter(c => c.id !== id);
    localStorage.setItem("bc_user_cards", JSON.stringify(updated));
    setCardList(updated);
  };

  // Security Settings: Save Preferences
  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("bc_user_security", JSON.stringify(security));
    setSecurityMsg("✅ Security preferences synced successfully!");
    setTimeout(() => setSecurityMsg(""), 3000);
  };

  // Support Helpdesk: Submit ticket
  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.desc.trim()) {
      setSupportMsg("⚠️ Please enter a issue description.");
      return;
    }
    const tkt: SupportTicket = {
      id: "TKT" + Math.floor(10000 + Math.random() * 90000),
      category: ticketForm.category,
      description: ticketForm.desc.trim(),
      status: "Open",
      createdAt: new Date().toLocaleDateString()
    };
    const updated = [...tickets, tkt];
    localStorage.setItem("bc_support_tickets", JSON.stringify(updated));
    setTickets(updated);
    setTicketForm({ category: "Mechanical Issue", desc: "" });
    setSupportMsg("✅ Support ticket submitted! A support technician will respond shortly.");
    setTimeout(() => setSupportMsg(""), 4000);
  };

  // Support: SOS roadside rescue trigger
  const triggerSOS = () => {
    alert("🚨 SOS EMERGENCY BROADCAST SENT!\n\nYour BikerClinic live GPS signal has been broadcasted to all technicians within 5km. A response technician is dispatching immediately to assist you with tools and jump starters.\n\nEstimated Arrival Time: 12 Minutes.\nSupport Reference: SOS-EMERGENCY");
  };

  // Chat: Send direct message to Technician
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

    // Simulate realistic technician reply after 1.5 seconds
    setTimeout(() => {
      const replies = [
        "Hi! Yes, I have picked up the performance oil filter. I'm currently refueling and heading to your location now.",
        "Got your message. I'm on my way and should arrive in about 15 minutes. See you soon!",
        "Hello! I am reviewing the service requirements. Make sure your motorcycle is parked in a spot with enough space for me to work.",
        "Understood. I will perform a complete brake pressure test once I arrive."
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

  // Trigger Chat Thread
  const openTechChat = (techName: string) => {
    setSelectedTech(techName);
    setChatMessages([
      { sender: "mechanic", text: `Hello! I am your assigned technician, ${techName.split("@")[0]}. How can I help you today?`, time: "Just Now" }
    ]);
  };

  const activeBookings = bookings.filter(b => b.status !== "Completed");
  const pastBookings = bookings.filter(b => b.status === "Completed");
  const displayBookings = tab === "active" ? activeBookings : pastBookings;

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.nav}>
        <Link href="/" style={{ ...s.logo, textDecoration: "none", color: "var(--text-primary)" }}>
          🏍️ Biker<span style={{ color: "var(--primary)" }}>Clinic</span>
        </Link>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/" style={s.navTextLink}>Home</Link>
          <Link href="/booking" style={s.navTextLink}>Services</Link>
          <Link href="/#how-it-works" style={s.navTextLink}>How It Works</Link>
          <Link href="/#reviews" style={s.navTextLink}>Reviews</Link>
          <Link href="/#contact" style={s.navTextLink}>Contact</Link>
          <Link href="/track" style={s.navTextLink}>Track Order</Link>
          <Link href="/user/dashboard" style={s.navGarageBtn}>👤 My Garage</Link>
          <Link href="/booking" style={s.navBookBtn}>Book Now</Link>
          <button onClick={() => { localStorage.removeItem("bc_user_phone"); localStorage.removeItem("bc_user_email"); localStorage.removeItem("bc_user_name"); router.push("/user/login"); }} style={s.logoutBtn}>Sign Out</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.container}>
          <p style={s.greeting}>Welcome back{userName ? `, ${userName}` : ""}! 👋</p>
          <h1 style={s.heroTitle}>Customer Control Panel</h1>
          <p style={s.heroSub}>Manage bookings, Virtual Garage, payments, and diagnostics records in one place.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            <Link href="/booking" style={{ ...s.bookBtn, background: "var(--primary)", color: "#000", fontWeight: 800, padding: "12px 24px", borderRadius: 10, boxShadow: "0 4px 18px var(--primary-glow)" }}>
              🔧 Schedule New Service
            </Link>
            <button onClick={triggerSOS} style={{ ...s.bookBtn, background: "rgba(239, 68, 68, 0.15)", border: "1px solid #EF4444", color: "#EF4444", fontWeight: 800, padding: "12px 24px", borderRadius: 10, boxShadow: "none" }}>
              🚨 Emergency SOS Assistance
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div style={{ ...s.container, paddingTop: 32, paddingBottom: 60 }}>
        {syncFailed && (
          <div style={s.syncWarning}>
            <strong>⚠️ Database Connection Warning:</strong> We saved your inputs locally on this device, but they could not sync to cloud servers. Check internet connection.
          </div>
        )}

        {/* Account Quick Stats */}
        <div className="responsive-grid-3" style={{ marginBottom: 28, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { label: "Total Bookings", value: bookings.length, color: "var(--primary)" },
            { label: "My Motorcycles", value: garage.length, color: "var(--accent)" },
            { label: "Pending Issues", value: tickets.filter(t => t.status === "Open").length, color: "var(--success)" },
          ].map(stat => (
            <div key={stat.label} style={{ ...s.statCard, borderTop: `3px solid ${stat.color}` }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>{stat.label}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: stat.color }} className="mono-text">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Dashboard Tabs Navigation */}
        <div style={s.tabRow}>
          {[
            { id: "active", label: `Active Bookings (${activeBookings.length})`, icon: "🏍️" },
            { id: "history", label: "Service History", icon: "📋" },
            { id: "garage", label: "Virtual Garage", icon: "🏁" },
            { id: "payments", label: "Payment Methods", icon: "💳" },
            { id: "profile", label: "My Profile", icon: "👤" },
            { id: "security", label: "Account Security", icon: "🔒" },
            { id: "support", label: "Help & Support", icon: "🎧" },
            { id: "review", label: "Write Review", icon: "⭐" }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setTab(t.id as any)} 
              style={{ ...s.tabBtn, ...(tab === t.id ? s.tabActive : {}) }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── PANEL 1: Active Bookings ── */}
        {tab === "active" && (
          <div style={s.grid}>
            {activeBookings.length === 0 ? (
              <div style={s.emptyBox}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>🏖️</div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>No active doorstep services</div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Your bikes are running smoothly. Click Schedule New Service to book a session.</p>
              </div>
            ) : activeBookings.map(b => {
              const statusInfo = statusColors[b.status] || statusColors["New"];
              return (
                <div key={b.id} style={s.card} className="booking-card anim-fade-up">
                  <div style={s.cardTop}>
                    <div>
                      <div style={s.cardId} className="mono-text">{b.id}</div>
                      <div style={s.cardBike}>{b.brand} {b.model}</div>
                      {b.bikeNumber && <div style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--primary)", marginTop: 4 }}>{b.bikeNumber}</div>}
                    </div>
                    <div style={{ ...s.statusPill, background: statusInfo.bg, color: statusInfo.color }}>
                      {statusInfo.label}
                    </div>
                  </div>

                  <div style={s.cardDetails}>
                    <div style={s.detailRow}><span style={s.detailKey}>Specialty</span><span style={s.detailVal}>{b.service} ({b.package})</span></div>
                    <div style={s.detailRow}><span style={s.detailKey}>Scheduled Slot</span><span style={s.detailVal} className="mono-text">{b.date} · {b.time}</span></div>
                    {b.assignedMechanic && (
                      <div style={s.detailRow}>
                        <span style={s.detailKey}>Technician</span>
                        <span 
                          onClick={() => openTechChat(b.assignedMechanic!)}
                          style={{ ...s.detailVal, color: "var(--primary)", cursor: "pointer", textDecoration: "underline" }}
                        >
                          👨‍🔧 {b.assignedMechanic.split("@")[0]} (Click to Chat)
                        </span>
                      </div>
                    )}
                    {b.paymentMethod && (
                      <div style={s.detailRow}>
                        <span style={s.detailKey}>Payment</span>
                        <span style={s.detailVal}>{b.paymentMethod} {b.paymentDetail && `(${b.paymentDetail})`}</span>
                      </div>
                    )}
                  </div>

                  <Link href={`/track?id=${b.id}`} style={s.trackBtn}>
                    TRACK APPOINTMENT STATUS
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>my_location</span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PANEL 2: Service History ── */}
        {tab === "history" && (
          <div style={s.grid}>
            {pastBookings.length === 0 ? (
              <div style={s.emptyBox}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>📋</div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>No completed service logs</div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>When your bookings are finalized, detailed diagnostics reports will be posted here.</p>
              </div>
            ) : pastBookings.map(b => (
              <div key={b.id} style={s.card} className="booking-card anim-fade-up">
                <div style={s.cardTop}>
                  <div>
                    <div style={s.cardId} className="mono-text">{b.id}</div>
                    <div style={s.cardBike}>{b.brand} {b.model}</div>
                  </div>
                  <div style={{ ...s.statusPill, background: "rgba(0, 230, 118, 0.08)", color: "var(--success)" }}>
                    Completed ✓
                  </div>
                </div>

                <div style={s.cardDetails}>
                  <div style={s.detailRow}><span style={s.detailKey}>Date</span><span style={s.detailVal} className="mono-text">{b.date}</span></div>
                  <div style={s.detailRow}><span style={s.detailKey}>Service</span><span style={s.detailVal}>{b.service}</span></div>
                  <div style={s.detailRow}>
                    <span style={s.detailKey}>Completed By</span>
                    <span style={s.detailVal}>👨‍🔧 {b.assignedMechanic ? b.assignedMechanic.split("@")[0] : "Senior Tech"}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedReport(b)} 
                  style={{ ...s.trackBtn, background: "var(--primary-glow)", color: "var(--primary)", borderColor: "rgba(0, 102, 255, 0.2)" }}
                >
                  VIEW DIAGNOSTICS REPORT
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>analytics</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── PANEL 3: Virtual Garage ── */}
        {tab === "garage" && (
          <div style={s.profileCard} className="booking-card anim-fade-up">
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 6 }}>My Virtual Garage</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 24 }}>
              Register your vehicles to enable one-click scheduling when booking doorstep diagnostics.
            </p>

            {bikeSuccess && (
              <div style={s.successAlert}>
                {bikeSuccess}
              </div>
            )}

            {/* List existing garage bikes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {garage.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "0.88rem", padding: "16px", background: "var(--bg)", borderRadius: 8, textAlign: "center" }}>
                  Garage empty. Register your first bike below.
                </div>
              ) : garage.map(bike => (
                <div key={bike.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)", border: "1px solid var(--border)", padding: "14px 16px", borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>two_wheeler</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{bike.brand} {bike.model}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Year: {bike.year} · Number: <span style={{ fontFamily: "var(--font-mono)", color: "var(--primary)", fontWeight: 700 }}>{bike.plateNumber}</span></div>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteBike(bike.id)} style={s.deleteBtn}>Delete</button>
                </div>
              ))}
            </div>

            {/* Add Motorcycle Form */}
            <form onSubmit={handleAddBike} style={{ borderTop: "1px solid var(--border)", paddingTop: 24 }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", marginBottom: 20 }}>
                ➕ Register New Vehicle
              </div>

              <div style={s.formRow}>
                <div style={s.formGroup}>
                  <label style={s.label}>Brand</label>
                  <select 
                    style={s.input}
                    value={newBike.brand}
                    onChange={(e) => setNewBike({ ...newBike, brand: e.target.value })}
                  >
                    <option value="">Select Brand</option>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Model Name</label>
                  <input 
                    type="text" 
                    placeholder="Classic 350, Pulsar NS200" 
                    style={s.input}
                    value={newBike.model}
                    onChange={(e) => setNewBike({ ...newBike, model: e.target.value })}
                  />
                </div>
              </div>

              <div style={s.formRow}>
                <div style={s.formGroup}>
                  <label style={s.label}>Model Year</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 2021" 
                    style={s.input}
                    value={newBike.year}
                    onChange={(e) => setNewBike({ ...newBike, year: e.target.value.replace(/\D/g, "") })}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Plate Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. KA-03-EX-1234" 
                    style={{ ...s.input, textTransform: "uppercase" }}
                    value={newBike.plateNumber}
                    onChange={(e) => setNewBike({ ...newBike, plateNumber: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" style={s.saveBtn}>Register Vehicle to Garage</button>
            </form>
          </div>
        )}

        {/* ── PANEL 4: Payment Methods ── */}
        {tab === "payments" && (
          <div style={s.profileCard} className="booking-card anim-fade-up">
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 6 }}>Manage Payment Profiles</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 24 }}>
              Link your card accounts and UPI handles for auto-billing after service completes.
            </p>

            {paymentMsg && <div style={s.successAlert}>{paymentMsg}</div>}

            {/* List Linked UPI accounts */}
            <div style={{ marginBottom: 30 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                Linked UPI IDs
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {upiList.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", background: "var(--bg)", p: 12, borderRadius: 6, textAlign: "center", padding: 12 }}>No saved UPI IDs.</div>
                ) : upiList.map(upi => (
                  <div key={upi.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="material-symbols-outlined" style={{ color: "var(--success)" }}>account_balance_wallet</span>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{upi.code}</span>
                    </div>
                    <button onClick={() => handleDeleteUPI(upi.id)} style={s.deleteBtn}>Remove</button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddUpi} style={{ display: "flex", gap: 12, marginTop: 14 }}>
                <input 
                  type="text" 
                  placeholder="Link UPI Handle (e.g. username@okaxis)" 
                  style={{ ...s.input, flex: 1 }}
                  value={newUpi}
                  onChange={(e) => setNewUpi(e.target.value)}
                />
                <button type="submit" style={s.applyBtn}>Link UPI ID</button>
              </form>
            </div>

            {/* List Linked Cards */}
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                Linked Card Profiles
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cardList.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", background: "var(--bg)", borderRadius: 6, textAlign: "center", padding: 12 }}>No saved Credit/Debit Cards.</div>
                ) : cardList.map(card => (
                  <div key={card.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>credit_card</span>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase" }}>{card.type} Card</span>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>•••• •••• •••• {card.number.slice(-4)} (Exp: {card.expiry})</div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteCard(card.id)} style={s.deleteBtn}>Remove</button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddCard} style={{ borderTop: "1px solid var(--border)", marginTop: 20, paddingTop: 20 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <select 
                    style={{ ...s.input, flex: 1, minWidth: 100 }}
                    value={newCard.type}
                    onChange={(e) => setNewCard({ ...newCard, type: e.target.value })}
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="rupay">Rupay</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="16-Digit Card Number" 
                    maxLength={16}
                    style={{ ...s.input, flex: 2, minWidth: 180 }}
                    value={newCard.number}
                    onChange={(e) => setNewCard({ ...newCard, number: e.target.value.replace(/\D/g, "") })}
                  />
                  <input 
                    type="text" 
                    placeholder="MM/YY" 
                    maxLength={5}
                    style={{ ...s.input, flex: 1, minWidth: 80 }}
                    value={newCard.expiry}
                    onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                  />
                  <button type="submit" style={s.saveBtn}>Link Credit/Debit Card</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── PANEL 5: My Profile ── */}
        {tab === "profile" && (
          <div style={s.profileCard} className="booking-card anim-fade-up">
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 6 }}>Edit Profile</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 28 }}>
              Keep your contact details and default preferences updated for faster doorstep bookings.
            </p>

            {saveSuccess && (
              <div style={s.successAlert}>
                ✅ Profile updated successfully! Your saved details will auto-fill on new bookings.
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div style={s.formRow}>
                <div style={s.formGroup}>
                  <label style={s.label}>Full Name</label>
                  <input type="text" style={s.input} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
                </div>
                
                <div style={s.formGroup}>
                  <label style={s.label}>Mobile Number</label>
                  <div style={{ position: "relative", display: "flex", width: "100%" }}>
                    <div style={s.countryCode}>🇮🇳 +91</div>
                    <input type="tel" style={{ ...s.input, paddingLeft: 88 }} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, "") })} maxLength={10} required />
                  </div>
                </div>
              </div>

              <div style={s.formRow}>
                <div style={s.formGroup}>
                  <label style={s.label}>Email Address (Linked Account)</label>
                  <input type="email" style={{ ...s.input, opacity: 0.6, cursor: "not-allowed", background: "var(--bg)" }} value={profile.email} disabled />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Emergency Contact Number</label>
                  <input type="tel" placeholder="e.g. 9876543210" style={s.input} value={profile.emergencyContact} onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value.replace(/\D/g, "") })} maxLength={10} />
                </div>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Default Service Address</label>
                <textarea style={{ ...s.input, minHeight: 80, resize: "vertical" }} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Enter default doorstep address" />
              </div>

              <div style={s.formRow}>
                <div style={s.formGroup}>
                  <label style={s.label}>Default Service Mode</label>
                  <select style={s.input} value={profile.defaultPref} onChange={(e) => setProfile({ ...profile, defaultPref: e.target.value })}>
                    <option value="Doorstep Service">Doorstep Service (Recommended)</option>
                    <option value="Workshop Drop-off">Workshop Drop-off</option>
                  </select>
                </div>
              </div>

              <button type="submit" style={s.saveBtn} disabled={saveLoading}>{saveLoading ? "Saving Changes..." : "💾 Save Profile Changes"}</button>
            </form>
          </div>
        )}

        {/* ── PANEL 6: Account Security ── */}
        {tab === "security" && (
          <div style={s.profileCard} className="booking-card anim-fade-up">
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 6 }}>Account Security Settings</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 28 }}>
              Configure login credentials verification, security checks, and notification triggers.
            </p>

            {securityMsg && <div style={s.successAlert}>{securityMsg}</div>}

            <form onSubmit={handleSaveSecurity}>
              {/* MFA Toggle */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)", border: "1px solid var(--border)", padding: "16px", borderRadius: 10, marginBottom: 24 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text-primary)" }}>Multi-Factor Authentication (MFA)</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>Verify logins via OTP sent to your registered phone number.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={security.mfa}
                  onChange={(e) => setSecurity({ ...security, mfa: e.target.checked })}
                  style={{ width: 20, height: 20, cursor: "pointer" }}
                />
              </div>

              {/* Notification Preferences */}
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                Notification Dispatches
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                {[
                  { id: "emailAlerts", label: "Email Updates", desc: "Receive invoice receipts & service reports." },
                  { id: "smsAlerts", label: "SMS Alerts", desc: "Receive dispatch progress status notifications." },
                  { id: "pushAlerts", label: "Push Notifications", desc: "Receive live location link alerts." }
                ].map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{item.label}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.desc}</div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={(security as any)[item.id]}
                      onChange={(e) => setSecurity({ ...security, [item.id]: e.target.checked })}
                      style={{ width: 18, height: 18, cursor: "pointer" }}
                    />
                  </div>
                ))}
              </div>

              {/* Password resetting */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, marginBottom: 20 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", marginBottom: 16 }}>
                  Update Password / Security Pin
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>New Login Password</label>
                  <input type="password" placeholder="••••••••••••" style={s.input} />
                </div>
              </div>

              <button type="submit" style={s.saveBtn}>Save Security Preferences</button>
            </form>
          </div>
        )}

        {/* ── PANEL 7: Support Helpdesk ── */}
        {tab === "support" && (
          <div style={s.profileCard} className="booking-card anim-fade-up">
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 6 }}>Technical Support Center</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 24 }}>
              Submit helpdesk logs, check diagnostic FAQs, or request roadside emergency dispatches.
            </p>

            {supportMsg && <div style={s.successAlert}>{supportMsg}</div>}

            {/* Support ticket submission */}
            <div style={{ marginBottom: 32 }}>
              <form onSubmit={handleAddTicket} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: 20, borderRadius: 10 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", marginBottom: 16 }}>
                  Submit Support Request
                </div>
                
                <div style={s.formGroup}>
                  <label style={s.label}>Category</label>
                  <select 
                    style={s.input}
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  >
                    <option value="Mechanical Issue">Mechanical Performance Issue</option>
                    <option value="Billing / Promo Inquiry">Billing / Promo Inquiry</option>
                    <option value="Service Reschedule">Booking Reschedule Request</option>
                    <option value="Other">Other Technical Inquiries</option>
                  </select>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Issue Description</label>
                  <textarea 
                    placeholder="Provide detailed description of engine sound, battery discharge, or other anomalies..." 
                    style={{ ...s.input, minHeight: 90, resize: "vertical" }}
                    value={ticketForm.desc}
                    onChange={(e) => setTicketForm({ ...ticketForm, desc: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" style={{ ...s.saveBtn, marginTop: 12 }}>Submit Support Ticket</button>
              </form>
            </div>

            {/* List Active Tickets */}
            {tickets.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", marginBottom: 12 }}>
                  Active Support Tickets
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {tickets.map(tkt => (
                    <div key={tkt.id} style={{ background: "var(--bg)", padding: 14, borderRadius: 8, border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", mb: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: "0.85rem" }} className="mono-text">{tkt.id} - {tkt.category}</span>
                        <span style={{ fontSize: "0.75rem", background: "rgba(0,102,255,0.08)", color: "var(--primary)", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>{tkt.status}</span>
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 6 }}>{tkt.description}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 8 }}>Submitted: {tkt.createdAt}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support FAQs Accordion */}
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", marginBottom: 12 }}>
                Technical FAQ Dossier
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {FAQS.map((faq, i) => {
                  const isOpen = faqOpenIdx === i;
                  return (
                    <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)" }}>
                      <div 
                        onClick={() => setFaqOpenIdx(isOpen ? null : i)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", cursor: "pointer", fontWeight: 700, fontSize: "0.88rem" }}
                      >
                        <span>{faq.q}</span>
                        <span>{isOpen ? "−" : "+"}</span>
                      </div>
                      {isOpen && (
                        <div style={{ padding: "0 16px 16px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, borderTop: "1px solid rgba(255,255,255,0.02)", paddingTop: 10 }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PANEL 8: Write Review ── */}
        {tab === "review" && (
          <div style={s.profileCard} className="booking-card anim-fade-up">
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 6 }}>Write a Customer Review</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 28 }}>
              Share your doorstep service diagnostic experience with other riders in our community.
            </p>

            {reviewSuccess && (
              <div style={s.successAlert}>
                ✅ Review submitted! It will appear on our home dashboard database shortly.
              </div>
            )}

            <form onSubmit={handleReviewSubmit}>
              <div style={s.formGroup}>
                <label style={s.label}>Rating Score</label>
                <div style={{ display: "flex", gap: 10, margin: "6px 0" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "2rem",
                        cursor: "pointer",
                        color: star <= reviewRating ? "var(--warning)" : "#333538",
                        transition: "transform 0.1s",
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Bike Reviewed</label>
                <input
                  type="text"
                  style={s.input}
                  value={reviewBike}
                  onChange={(e) => setReviewBike(e.target.value)}
                  placeholder={
                    profile.bikeBrand && profile.bikeModel
                      ? `${profile.bikeBrand} ${profile.bikeModel}`
                      : "e.g. Royal Enfield Classic 350"
                  }
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Review Feedback</label>
                <textarea
                  style={{ ...s.input, minHeight: 100, resize: "vertical" }}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                  placeholder="Review the service quality, technician competence, and timing promptness..."
                />
              </div>

              <button type="submit" style={s.saveBtn} disabled={reviewLoading}>
                {reviewLoading ? "Submitting Review..." : "⭐ Post Customer Review"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── MODAL 1: Service Detail Report (Concept 8) ── */}
      {selectedReport && (
        <div style={s.modalOverlay}>
          <div style={s.modalCard} className="booking-card anim-scale-up">
            <div style={s.modalHeader}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>📋 Diagnostics & Service Detail Report</h3>
              <button onClick={() => setSelectedReport(null)} style={s.closeBtn}>✕</button>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", pb: 12, mb: 16, paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Service ID</div>
                <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--primary)" }}>{selectedReport.id}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Completed On</div>
                <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>{selectedReport.date}</div>
              </div>
            </div>

            {/* Diagnostic metrics progress bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>System Diagnostic Checklist</div>
              
              {[
                { name: "Engine Compression Efficiency", val: 92, label: "92% (Optimal)" },
                { name: "Spark Plug Gap & Ignition Quality", val: 85, label: "85% (Excellent)" },
                { name: "Brake Pad Wear Indicator", val: 40, label: "40% (Replacement recommended at 80%)" },
                { name: "Battery Health Voltage", val: 95, label: "12.6V (Optimal Charge)" },
                { name: "Engine Oil Viscosity / Cleanliness", val: 90, label: "90% (Freshly Refilled)" }
              ].map(stat => (
                <div key={stat.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 600, marginBottom: 4 }}>
                    <span style={{ color: "var(--text-primary)" }}>{stat.name}</span>
                    <span style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}>{stat.label}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${stat.val}%`, background: "var(--primary)", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: 14, borderRadius: 8, fontSize: "0.85rem", lineHeight: 1.5, color: "var(--text-secondary)" }}>
              <div style={{ fontWeight: 800, color: "var(--primary)", marginBottom: 4 }}>🛠️ Technician Feedback Log:</div>
              {"\"Performed complete engine scan. Replaced default engine oil filter, cleaned terminals, adjusted chain slack, and top-up front brake fluid. Bike is in prime operating condition.\""}
            </div>

            <button onClick={() => setSelectedReport(null)} style={{ ...s.saveBtn, marginTop: 20 }}>Dismiss Diagnostics Report</button>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Technician Dossier & Live Chat (Concept 3) ── */}
      {selectedTech && (
        <div style={s.modalOverlay}>
          <div style={{ ...s.modalCard, maxWidth: 500 }} className="booking-card anim-scale-up">
            <div style={s.modalHeader}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>👨‍🔧 Technician Profile Dossier</h3>
              <button onClick={() => setSelectedTech(null)} style={s.closeBtn}>✕</button>
            </div>

            {/* Dossier info */}
            <div style={{ display: "flex", gap: 16, alignItems: "center", borderBottom: "1px solid var(--border)", pb: 16, mb: 16, paddingBottom: 16, marginBottom: 16 }}>
              <div style={s.avatarBox}>
                <span className="material-symbols-outlined" style={{ fontSize: "2.5rem", color: "var(--primary)" }}>engineering</span>
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: "1.15rem" }}>{selectedTech.split("@")[0]}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>Certified Master Mechanic</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.8rem", color: "var(--warning)", marginTop: 4 }}>
                  <span>⭐ 4.9 Rating</span>
                  <span style={{ color: "var(--text-muted)" }}>· 420+ Jobs Done</span>
                </div>
              </div>
            </div>

            {/* Chat Messages Frame */}
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

            {/* Send chat message */}
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

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--bg)", color: "var(--text-primary)" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", borderBottom: "1px solid var(--border)", background: "rgba(17, 19, 22, 0.95)", position: "sticky", top: 0, zIndex: 10 },
  logo: { fontSize: "1.2rem", fontWeight: 900, letterSpacing: "-0.02em" },
  navLink: { color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none", borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", padding: "8px 14px", borderRadius: 8, transition: "var(--transition)", display: "inline-flex", alignItems: "center", gap: 6 },
  navTextLink: { color: "#94A3B8", fontSize: "0.9rem", fontWeight: 600, textDecoration: "none", transition: "color 0.2s" },
  navGarageBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: "0.88rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 },
  navBookBtn: { background: "#FF1E27", color: "#fff", padding: "8px 18px", borderRadius: 8, fontWeight: 800, fontSize: "0.88rem", textDecoration: "none", boxShadow: "0 0 16px rgba(255,30,39,0.4)" },
  logoutBtn: { background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 8, padding: "8px 14px", fontSize: "0.85rem", cursor: "pointer", transition: "var(--transition)" },
  hero: { background: "linear-gradient(135deg, var(--surface), var(--bg))", borderBottom: "1px solid var(--border)", padding: "40px 0" },
  container: { maxWidth: 900, margin: "0 auto", padding: "0 24px" },
  greeting: { color: "var(--text-muted)", fontSize: "1rem", marginBottom: 8 },
  heroTitle: { fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 8 },
  heroSub: { color: "var(--text-muted)", fontSize: "0.95rem" },
  bookBtn: { display: "inline-flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "#fff", padding: "12px 24px", borderRadius: 8, fontWeight: 700, fontSize: "0.92rem", textDecoration: "none", boxShadow: "0 4px 14px var(--primary-glow)", transition: "var(--transition)", border: "none", cursor: "pointer" },
  statCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 18px" },
  
  // Tabs row styling (sleek wrapping pill bar with zero scrollbars)
  tabRow: { display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap", borderBottom: "1px solid var(--border)", paddingBottom: 18 },
  tabBtn: { background: "var(--surface)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", color: "var(--text-secondary)", padding: "10px 18px", borderRadius: 99, fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "var(--transition)", outline: "none" },
  tabActive: { background: "var(--primary-glow)", color: "var(--primary)", borderColor: "var(--primary)", boxShadow: "0 0 16px var(--primary-glow)" },
  
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  emptyBox: { gridColumn: "1/-1", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "50px 30px", textAlign: "center" },
  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 0, transition: "var(--transition)" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" },
  cardId: { color: "var(--primary)", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.05em", marginBottom: 4 },
  cardBike: { fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.01em" },
  statusPill: { padding: "6px 12px", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" },
  cardDetails: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 },
  detailRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  detailKey: { color: "var(--text-muted)", fontSize: "0.85rem" },
  detailVal: { color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem", textAlign: "right", maxWidth: "65%" },
  trackBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--primary-glow)", color: "var(--primary)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(0, 102, 255, 0.2)", borderRadius: 8, padding: "12px", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none", marginTop: 4, transition: "var(--transition)", width: "100%", cursor: "pointer" },
  
  profileCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "32px", maxWidth: 680, margin: "0 auto" },
  formGroup: { display: "flex", flexDirection: "column", marginBottom: 20, flex: 1 },
  label: { display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 },
  formRow: { display: "flex", gap: 20, flexWrap: "wrap" },
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
    borderRight: "1px solid var(--border)",
    color: "var(--text-secondary)",
    borderRadius: "8px 0 0 8px",
  },
  saveBtn: { width: "100%", padding: 16, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", marginTop: 20, boxShadow: "0 4px 14px var(--primary-glow)", transition: "var(--transition)" },
  input: { width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "13px 14px", color: "var(--text-primary)", fontSize: "0.95rem", outline: "none", fontFamily: "inherit", transition: "var(--transition)" },
  deleteBtn: { background: "transparent", border: "1px solid #EF4444", color: "#EF4444", borderRadius: 6, padding: "6px 12px", fontSize: "0.8rem", cursor: "pointer", transition: "var(--transition)" },
  applyBtn: { background: "rgba(0,102,255,0.08)", color: "var(--primary)", border: "1px solid rgba(0,102,255,0.2)", borderRadius: 8, padding: "0 20px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", transition: "var(--transition)" },
  successAlert: { background: "rgba(0, 230, 118, 0.08)", color: "var(--success)", border: "1px solid rgba(0, 230, 118, 0.2)", borderRadius: 8, padding: "14px 16px", marginBottom: 20, fontSize: "0.9rem", fontWeight: 700 },
  syncWarning: { background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.2)", color: "#F59E0B", borderRadius: 8, padding: "12px 16px", fontSize: "0.85rem", lineHeight: 1.45, marginBottom: 20, fontWeight: 500 },

  // Modal Styles
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(10,12,14,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" },
  modalCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: 550, padding: 28, position: "relative" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  closeBtn: { background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" },
  avatarBox: { width: 54, height: 54, borderRadius: "50%", background: "var(--primary-glow)", border: "1px solid rgba(0, 102, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" },
  
  // Live Chat Styles
  chatBox: { height: 180, overflowY: "auto", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column" },
  chatBubble: { padding: "10px 14px", borderRadius: 12, fontSize: "0.82rem", maxWidth: "80%", lineHeight: 1.4 },
  chatBubbleUser: { background: "var(--primary)", color: "#fff", borderBottomRightRadius: 0 },
  chatBubbleMech: { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)", borderBottomLeftRadius: 0 }
};
