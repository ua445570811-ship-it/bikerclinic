"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db, IS_MOCK_MODE } from "@/lib/firebase";
import { collection, query, limit, onSnapshot } from "firebase/firestore";

const services = [
  { icon: "🔧", name: "General Service", desc: "Complete 20-point checkup, oil change & filters", price: "₹799", popular: false },
  { icon: "⚙️", name: "Full Service", desc: "Comprehensive service with parts replacement", price: "₹1,499", popular: true },
  { icon: "🛞", name: "Tyre Replacement", desc: "Premium tyre brands, balancing included", price: "₹999", popular: false },
  { icon: "🔋", name: "Battery Service", desc: "Test, clean & replace with warranty", price: "₹499", popular: false },
  { icon: "🛠️", name: "Brake Service", desc: "Pad, disc & cable inspection + replacement", price: "₹599", popular: false },
  { icon: "💡", name: "Electrical Repair", desc: "Wiring, lights, starter & sensor diagnosis", price: "₹699", popular: false },
];

const steps = [
  { num: "01", title: "Book in 2 mins", desc: "Choose your service and pick a convenient slot. No calls needed.", icon: "📱" },
  { num: "02", title: "Mechanic Assigned", desc: "A certified technician is assigned and you get their profile.", icon: "👨‍🔧" },
  { num: "03", title: "Live Tracking", desc: "Track your bike's service status in real-time like a food order.", icon: "📍" },
  { num: "04", title: "Done & Delivered", desc: "Bike serviced at your doorstep. Pay only after you're satisfied.", icon: "✅" },
];

const brands = ["Hero", "Honda", "TVS", "Bajaj", "Royal Enfield", "Yamaha", "Suzuki", "KTM"];

type Review = {
  name: string;
  email?: string;
  rating: number;
  comment: string;
  bike: string;
  createdAt?: string;
};

const SEED_REVIEWS: Review[] = [
  { name: "Rahul Sharma", rating: 5, comment: "Absolutely brilliant! The mechanic came right to my office parking lot and finished the full service in 90 minutes. Transparent pricing and genuine parts.", bike: "Royal Enfield Classic 350" },
  { name: "Priya Nair", rating: 5, comment: "I was skeptical about doorstep service for my scooter, but BikerClinic proved me wrong. Very professional technician, clean work, and zero hassle.", bike: "Honda Activa 6G" },
  { name: "Amit Patel", rating: 5, comment: "Excellent chain repair and oil swap. The live tracking is just like tracking food orders, super cool feature! Will definitely book again.", bike: "KTM Duke 200" },
  { name: "Sneha Reddy", rating: 4, comment: "Very polite technician. He explained all the costs upfront before starting. The brake pad replacement feels top-notch.", bike: "Yamaha FZ-S" }
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(SEED_REVIEWS);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);

    // Dynamic Review fetching
    let unsubscribe = () => {};
    if (IS_MOCK_MODE) {
      const local = JSON.parse(localStorage.getItem("bc_reviews") || "[]");
      if (local.length > 0) {
        setReviews([...local.reverse(), ...SEED_REVIEWS]);
      }
    } else {
      const q = query(collection(db, "reviews"), limit(10));
      unsubscribe = onSnapshot(q, (snap) => {
        const dbReviews: Review[] = [];
        snap.forEach((doc) => {
          dbReviews.push(doc.data() as Review);
        });
        if (dbReviews.length > 0) {
          dbReviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setReviews([...dbReviews, ...SEED_REVIEWS]);
        } else {
          setReviews(SEED_REVIEWS);
        }
      }, (err) => {
        console.error("Firestore reviews subscription failed, using local/seeds:", err);
        const local = JSON.parse(localStorage.getItem("bc_reviews") || "[]");
        setReviews([...local.reverse(), ...SEED_REVIEWS]);
      });
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      unsubscribe();
    };
  }, []);

  return (
    <div style={s.page}>
      {/* TOP UTILITY BAR */}
      <div style={s.topBar}>
        <div style={s.topBarInner}>
          <div>
            <span style={{ marginRight: 16 }}>📞 Helpline: <a href="tel:+919008076398" style={{ color: "#FF3D00", fontWeight: 700 }}>+91 90080 76398</a></span>
            <span style={{ marginRight: 16 }} className="top-bar-divider">|</span>
            <span>✉️ support@bikerclinic.com</span>
          </div>
          <div>
            <span style={{ marginRight: 16 }}>📍 Nanjundeshwara Layout, Bengaluru</span>
            <a href="https://maps.app.goo.gl/16BPJWzQtafEorgY8" target="_blank" rel="noopener noreferrer" style={s.topBarLink}>Open Map Directions →</a>
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav style={{ ...s.nav, ...(scrolled ? s.navScrolled : {}) }}>
        <div style={s.navInner}>
          <div style={s.logo}>🏍️ Biker<span style={{ color: "#FF3D00" }}>Clinic</span></div>
          <button className="mobile-nav-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? "✕" : "☰"}
          </button>
          <div className={mobileOpen ? "responsive-nav-active" : "responsive-nav"} onClick={() => setMobileOpen(false)}>
            <a href="#services" style={s.navLink}>Services</a>
            <a href="#how" style={s.navLink}>How It Works</a>
            <a href="#reviews" style={s.navLink}>Reviews</a>
            <a href="#contact" style={s.navLink}>Contact</a>
            <Link href="/track" style={s.navLink}>Track Order</Link>
            <Link href="/user/login" style={s.navLinkGhost}>👤 My Garage</Link>
            <Link href="/booking" style={s.bookBtn}>Book Now</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={s.heroBg1} />
        <div style={s.heroBg2} />
        <div style={s.heroContent}>
          <div style={s.heroBadge}>🏆 Bangalore&apos;s #1 Doorstep Bike Service</div>
          <h1 style={s.heroH1}>Your Bike Deserves<br /><span style={{ color: "#FF3D00" }}>Expert Care</span></h1>
          <p style={s.heroSub}>Professional bike servicing at your doorstep. Certified mechanics, transparent pricing, real-time tracking.</p>
          <div style={s.heroActions}>
            <Link href="/booking" style={s.heroCta}>🔧 Book a Service</Link>
            <Link href="/track" style={s.heroCtaSecondary}>📍 Track My Bike</Link>
          </div>
          <div style={s.heroStats}>
            {[["5,000+", "Happy Riders"], ["50+", "Certified Mechanics"], ["4.9★", "Average Rating"], ["30min", "Response Time"]].map(([val, lbl]) => (
              <div key={lbl} style={s.heroStat}>
                <div style={s.heroStatVal}>{val}</div>
                <div style={s.heroStatLbl}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section style={s.brandsBar}>
        <div style={s.brandsInner}>
          <span style={s.brandsLabel}>We service all major brands</span>
          <div style={s.brandsList}>
            {brands.map(b => <span key={b} style={s.brandChip}>{b}</span>)}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={s.section}>
        <div style={s.container}>
          <div style={s.sectionHead}>
            <div style={s.sectionBadge}>Our Services</div>
            <h2 style={s.sectionH2}>Everything Your Bike Needs</h2>
            <p style={s.sectionSub}>Professional service, genuine parts, transparent pricing.</p>
          </div>
          <div className="responsive-card-grid">
            {services.map(svc => (
              <div key={svc.name} style={{ ...s.serviceCard, ...(svc.popular ? s.serviceCardPopular : {}) }}>
                {svc.popular && <div style={s.popularBadge}>⭐ Most Popular</div>}
                <div style={s.serviceIcon}>{svc.icon}</div>
                <h3 style={s.serviceName}>{svc.name}</h3>
                <p style={s.serviceDesc}>{svc.desc}</p>
                <div style={s.serviceFooter}>
                  <span style={s.servicePrice}>Starting {svc.price}</span>
                  <Link href="/booking" style={s.serviceBtn}>Book →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ ...s.section, background: "#0A0A14" }}>
        <div style={s.container}>
          <div style={s.sectionHead}>
            <div style={{ ...s.sectionBadge, background: "rgba(99,102,241,0.1)", color: "#6366F1", borderColor: "rgba(99,102,241,0.2)" }}>How It Works</div>
            <h2 style={s.sectionH2}>Service in 4 Simple Steps</h2>
            <p style={s.sectionSub}>From booking to completion — we keep it fast, transparent, and stress-free.</p>
          </div>
          <div className="responsive-grid-4" style={{ position: "relative" }}>
            {steps.map((step, i) => (
              <div key={step.num} style={s.stepCard}>
                <div style={s.stepNum}>{step.num}</div>
                <div style={s.stepIcon}>{step.icon}</div>
                <h3 style={s.stepTitle}>{step.title}</h3>
                <p style={s.stepDesc}>{step.desc}</p>
                {i < steps.length - 1 && <div className="step-arrow" style={s.stepArrow}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" style={s.section}>
        <div style={s.container}>
          <div style={s.sectionHead}>
            <div style={s.sectionBadge}>Testimonials</div>
            <h2 style={s.sectionH2}>Rider Reviews & Trust</h2>
            <p style={s.sectionSub}>Read verified feedback from real customers about our doorstep and workshop servicing.</p>
          </div>
          <div style={s.reviewGrid}>
            {reviews.map((rev, i) => (
              <div key={i} style={s.reviewCard} className="anim-fade-up">
                <div style={s.reviewHeader}>
                  <span style={s.reviewName}>
                    {rev.name}
                    <span style={{ color: "#00E676", fontSize: "0.75rem", fontWeight: 700, marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 3 }}>
                      ✓ Verified
                    </span>
                  </span>
                  <span style={s.reviewStars}>{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</span>
                </div>
                <div style={s.reviewBike}>🏍️ {rev.bike}</div>
                <p style={s.reviewComment}>&ldquo;{rev.comment}&rdquo;</p>
              </div>
            ))}
            <div style={{ ...s.reviewCard, background: "rgba(255,61,0,0.02)", borderColor: "rgba(255,61,0,0.15)", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>⭐</div>
              <h4 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 6 }}>Are you a customer?</h4>
              <p style={{ color: "#6B6B88", fontSize: "0.78rem", lineHeight: 1.5, marginBottom: 16 }}>Share your service feedback and help the community!</p>
              <Link href="/user/login?redirect=/user/dashboard" style={{ ...s.serviceBtn, background: "rgba(255,61,0,0.1)" }}>Write a Review →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={s.ctaBanner}>
        <div style={s.ctaBg} />
        <div style={s.ctaContent}>
          <h2 style={s.ctaH2}>Ready to give your bike the best service?</h2>
          <p style={s.ctaSub}>Book in under 2 minutes. No waiting. No hassle.</p>
          <Link href="/booking" style={s.ctaBtn}>Book a Service Now →</Link>
        </div>
      </section>

      {/* CONTACT & MAP */}
      <section id="contact" style={{ ...s.section, background: "#0A0A14", borderTop: "1px solid #1E1E2E" }}>
        <div style={s.container}>
          <div style={s.sectionHead}>
            <div style={{ ...s.sectionBadge, background: "rgba(99,102,241,0.1)", color: "#6366F1", borderColor: "rgba(99,102,241,0.2)" }}>Contact Us</div>
            <h2 style={s.sectionH2}>Our Headquarters & Workshop</h2>
            <p style={s.sectionSub}>Get in touch or drop by our service center for premium bike care.</p>
          </div>
          <div style={s.contactGrid}>
            <div style={s.contactCard}>
              <div>
                <h3 style={s.contactTitle}>📍 Physical Location</h3>
                <p style={{ ...s.contactText, marginTop: 8 }}>
                  BikerClinic Garage
                  <br />
                  4th Main, 1st Phase, Nanjundeshwara Layout, Nyanappahalli, Bengaluru, Karnataka 560076
                </p>
              </div>
              
              <div>
                <h3 style={s.contactTitle}>📞 Helpline & Support</h3>
                <p style={{ ...s.contactText, marginTop: 8 }}>
                  Phone: <a href="tel:+919008076398" style={{ color: "#FF3D00", fontWeight: 700 }}>+91 90080 76398</a>
                  <br />
                  Email: <a href="mailto:support@bikerclinic.com" style={{ color: "#B0B0C8" }}>support@bikerclinic.com</a>
                </p>
              </div>

              <div>
                <h3 style={s.contactTitle}>⏰ Operating Hours</h3>
                <p style={{ ...s.contactText, marginTop: 8 }}>
                  Everyday: 8:00 AM — 8:00 PM
                  <br />
                  Emergency Support: 24/7 Available
                </p>
              </div>

              <a href="https://maps.app.goo.gl/16BPJWzQtafEorgY8" target="_blank" rel="noopener noreferrer" style={s.heroCta}>
                📍 Get Driving Directions map
              </a>
            </div>

            <div style={s.mapWrapper}>
              <iframe
                title="BikerClinic Google Map Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.397238874461!2d77.6379278!3d12.8821591!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae159b967a574d%3A0xf20f0870c62c7f4f!2sBikerClinic!5e0!3m2!1sen!2sin!4v1718040000000!5m2!1sen!2sin"
                width="100%"
                height="450"
                style={{ border: 0, display: "block" }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerLogo}>🏍️ Biker<span style={{ color: "#FF3D00" }}>Clinic</span></div>
          <p style={{ color: "#6B6B88", fontSize: "0.85rem", textAlign: "center" as const, maxWidth: 500, lineHeight: 1.6 }}>
            📍 4th Main, 1st Phase, Nanjundeshwara Layout, Nyanappahalli, Bengaluru, Karnataka 560076
            <br />
            📞 Helpline: <a href="tel:+919008076398" style={{ color: "#FF3D00", fontWeight: 600 }}>+91 90080 76398</a> | ✉️ support@bikerclinic.com
          </p>
          <div style={s.footerLinks}>
            <Link href="/admin/login" style={s.footerLink}>Admin Portal</Link>
            <Link href="/mechanic/login" style={s.footerLink}>Mechanic Portal</Link>
            <Link href="/user/login" style={s.footerLink}>Customer Login</Link>
            <Link href="/track" style={s.footerLink}>Track Order</Link>
          </div>
          <p style={s.footerCopy}>© 2025 BikerClinic. All rights reserved. Bangalore, India.</p>
        </div>
      </footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { background: "#0E0E18", minHeight: "100vh" },
  nav: { position: "sticky" as const, top: 0, left: 0, right: 0, zIndex: 100, padding: "20px 0", transition: "all 0.3s", background: "rgba(14,14,24,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(42,42,62,0.3)" },
  navScrolled: { background: "rgba(10,10,20,0.98)", backdropFilter: "blur(20px)", borderBottom: "1px solid #1E1E2E", padding: "14px 0" },
  navInner: { maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: "1.3rem", fontWeight: 800 },
  navLinks: { display: "flex", alignItems: "center", gap: 24 },
  navLink: { color: "#B0B0C8", fontSize: "0.9rem", fontWeight: 500, textDecoration: "none", transition: "color 0.2s" },
  navLinkGhost: { color: "#B0B0C8", fontSize: "0.9rem", fontWeight: 500, textDecoration: "none", border: "1px solid #2A2A3E", padding: "8px 16px", borderRadius: 8 },
  bookBtn: { background: "#FF3D00", color: "#fff", padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" },
  hero: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", paddingTop: 80 },
  heroBg1: { position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,61,0,0.12) 0%, transparent 70%)", top: -100, right: -100, pointerEvents: "none" },
  heroBg2: { position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", bottom: -80, left: -80, pointerEvents: "none" },
  heroContent: { textAlign: "center", maxWidth: 760, padding: "0 24px", position: "relative", zIndex: 1 },
  heroBadge: { display: "inline-block", background: "rgba(255,61,0,0.1)", border: "1px solid rgba(255,61,0,0.2)", color: "#FF3D00", padding: "8px 20px", borderRadius: 99, fontSize: "0.85rem", fontWeight: 700, marginBottom: 24 },
  heroH1: { fontSize: "clamp(2.4rem, 6vw, 4rem)", fontWeight: 900, lineHeight: 1.12, marginBottom: 20, letterSpacing: "-0.03em" },
  heroSub: { color: "#9E9EB5", fontSize: "1.15rem", lineHeight: 1.7, marginBottom: 36, maxWidth: 560, margin: "0 auto 36px" },
  heroActions: { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" as const, marginBottom: 56 },
  heroCta: { background: "linear-gradient(135deg, #FF3D00, #cc3000)", color: "#fff", padding: "16px 32px", borderRadius: 14, fontWeight: 700, fontSize: "1.05rem", textDecoration: "none", boxShadow: "0 4px 24px rgba(255,61,0,0.35)" },
  heroCtaSecondary: { background: "rgba(255,255,255,0.05)", border: "1px solid #2A2A3E", color: "#F0F0F8", padding: "16px 32px", borderRadius: 14, fontWeight: 600, fontSize: "1.05rem", textDecoration: "none" },
  heroStats: { display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap" as const, paddingTop: 40, borderTop: "1px solid #1E1E2E" },
  heroStat: { textAlign: "center" as const },
  heroStatVal: { fontSize: "1.6rem", fontWeight: 800, color: "#FF3D00" },
  heroStatLbl: { fontSize: "0.8rem", color: "#6B6B88", marginTop: 4 },
  brandsBar: { background: "#0A0A14", borderTop: "1px solid #1E1E2E", borderBottom: "1px solid #1E1E2E", padding: "20px 0" },
  brandsInner: { maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" as const },
  brandsLabel: { color: "#6B6B88", fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap" as const },
  brandsList: { display: "flex", gap: 10, flexWrap: "wrap" as const },
  brandChip: { background: "#161622", border: "1px solid #2A2A3E", color: "#9E9EB5", padding: "6px 14px", borderRadius: 99, fontSize: "0.82rem", fontWeight: 600 },
  section: { padding: "80px 0" },
  container: { maxWidth: 1200, margin: "0 auto", padding: "0 24px" },
  sectionHead: { textAlign: "center" as const, marginBottom: 52 },
  sectionBadge: { display: "inline-block", background: "rgba(255,61,0,0.1)", border: "1px solid rgba(255,61,0,0.2)", color: "#FF3D00", padding: "6px 16px", borderRadius: 99, fontSize: "0.8rem", fontWeight: 700, marginBottom: 16, letterSpacing: "0.05em" },
  sectionH2: { fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, marginBottom: 14, letterSpacing: "-0.02em" },
  sectionSub: { color: "#6B6B88", fontSize: "1rem", lineHeight: 1.6, maxWidth: 500, margin: "0 auto" },
  servicesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 },
  serviceCard: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 16, padding: 24, position: "relative" as const, transition: "transform 0.2s" },
  serviceCardPopular: { border: "1px solid rgba(255,61,0,0.3)", boxShadow: "0 0 32px rgba(255,61,0,0.1)" },
  popularBadge: { position: "absolute" as const, top: 16, right: 16, background: "rgba(255,61,0,0.1)", color: "#FF3D00", border: "1px solid rgba(255,61,0,0.25)", padding: "4px 10px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700 },
  serviceIcon: { fontSize: "2rem", marginBottom: 14 },
  serviceName: { fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 },
  serviceDesc: { color: "#6B6B88", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 20 },
  serviceFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  servicePrice: { color: "#00E676", fontWeight: 700, fontSize: "1rem" },
  serviceBtn: { background: "rgba(255,61,0,0.08)", color: "#FF3D00", border: "1px solid rgba(255,61,0,0.2)", padding: "8px 16px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" },
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, position: "relative" as const },
  stepCard: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 16, padding: 24, position: "relative" as const, textAlign: "center" as const },
  stepNum: { fontSize: "0.75rem", fontWeight: 800, color: "#FF3D00", letterSpacing: "0.1em", marginBottom: 12 },
  stepIcon: { fontSize: "2.2rem", marginBottom: 12 },
  stepTitle: { fontSize: "1rem", fontWeight: 700, marginBottom: 8 },
  stepDesc: { color: "#6B6B88", fontSize: "0.85rem", lineHeight: 1.6 },
  stepArrow: { position: "absolute" as const, top: "50%", right: -18, transform: "translateY(-50%)", color: "#2A2A3E", fontSize: "1.4rem", fontWeight: 700 },
  ctaBanner: { background: "#0A0A14", padding: "80px 0", position: "relative" as const, overflow: "hidden" },
  ctaBg: { position: "absolute" as const, inset: 0, background: "radial-gradient(ellipse at center, rgba(255,61,0,0.08) 0%, transparent 70%)", pointerEvents: "none" as const },
  ctaContent: { maxWidth: 680, margin: "0 auto", textAlign: "center" as const, padding: "0 24px", position: "relative" as const, zIndex: 1 },
  ctaH2: { fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, marginBottom: 14, letterSpacing: "-0.02em" },
  ctaSub: { color: "#6B6B88", fontSize: "1rem", marginBottom: 32 },
  ctaBtn: { display: "inline-block", background: "linear-gradient(135deg, #FF3D00, #cc3000)", color: "#fff", padding: "16px 40px", borderRadius: 14, fontWeight: 700, fontSize: "1.05rem", textDecoration: "none", boxShadow: "0 4px 24px rgba(255,61,0,0.3)" },
  footer: { background: "#070710", borderTop: "1px solid #1E1E2E", padding: "60px 0 40px" },
  footerInner: { maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 24 },
  footerLogo: { fontSize: "1.3rem", fontWeight: 800 },
  footerLinks: { display: "flex", gap: 24, flexWrap: "wrap" as const, justifyContent: "center" },
  footerLink: { color: "#6B6B88", fontSize: "0.85rem", textDecoration: "none" },
  footerCopy: { color: "#3A3A52", fontSize: "0.8rem" },
  topBar: { background: "#070710", borderBottom: "1px solid #1E1E2E", padding: "10px 0", fontSize: "0.78rem", color: "#8E8EB3" },
  topBarInner: { maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 10 },
  topBarLink: { color: "#FF3D00", fontWeight: 700, textDecoration: "none", transition: "color 0.2s" },
  reviewGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  reviewCard: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 16, padding: 24, position: "relative" as const, display: "flex", flexDirection: "column" as const, gap: 12 },
  reviewHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  reviewName: { fontWeight: 700, fontSize: "0.92rem", color: "#F0F0F8" },
  reviewStars: { color: "#FFD600", letterSpacing: 1, fontSize: "1.05rem" },
  reviewBike: { color: "#FF3D00", fontSize: "0.78rem", fontWeight: 700 },
  reviewComment: { color: "#B0B0C8", fontSize: "0.85rem", lineHeight: 1.6, flexGrow: 1, fontStyle: "italic" },
  contactGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "center" },
  contactCard: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 20, padding: "32px", display: "flex", flexDirection: "column" as const, gap: 24 },
  contactTitle: { fontSize: "1.05rem", fontWeight: 800, color: "#FF3D00", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  contactText: { color: "#B0B0C8", fontSize: "0.9rem", lineHeight: 1.6 },
  mapWrapper: { borderRadius: 20, overflow: "hidden", border: "1px solid #1E1E2E", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" },
};
