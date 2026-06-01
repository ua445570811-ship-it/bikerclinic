"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db, IS_MOCK_MODE } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";


// ── Types ──────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5;
type ServiceType = "doorstep" | "workshop";

const SERVICES = ["General Service", "Full Service", "Tyre Replacement", "Battery Service", "Brake Service", "Electrical Repair", "Suspension Repair", "Engine Overhaul"];
const PACKAGES = [
  { name: "Basic Care", price: 799, desc: "Oil change, filter, 15-point checkup" },
  { name: "Standard Service", price: 1299, desc: "All Basic + brake check, chain lube, electrical" },
  { name: "Full Workshop", price: 1999, desc: "Complete overhaul, genuine parts, 1-year warranty" },
];
const BRANDS = ["Hero", "Honda", "TVS", "Bajaj", "Royal Enfield", "Yamaha", "Suzuki", "KTM", "Kawasaki", "Other"];
const TIMES = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"];

function generateId() {
  return "BC" + Math.floor(100000 + Math.random() * 900000);
}
function tomorrow() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    serviceType: "doorstep" as ServiceType,
    service: "", package: "", brand: "", model: "", year: "",
    name: "", phone: "", email: "", address: "", landmark: "", notes: "",
    date: tomorrow(), time: "10:00 AM",
    promoCode: "", discount: 0, promoMsg: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("bc_user_name") || "";
    const savedEmail = localStorage.getItem("bc_user_email") || "";
    const savedPhone = localStorage.getItem("bc_user_phone") || "";
    const savedAddress = localStorage.getItem("bc_user_address") || "";
    const savedBrand = localStorage.getItem("bc_user_bike_brand") || "";
    const savedModel = localStorage.getItem("bc_user_bike_model") || "";
    if (savedName || savedEmail || savedPhone || savedAddress || savedBrand || savedModel) {
      setForm(f => ({
        ...f,
        name: f.name || savedName,
        email: f.email || savedEmail,
        phone: f.phone || savedPhone,
        address: f.address || savedAddress,
        brand: f.brand || savedBrand,
        model: f.model || savedModel,
      }));
    }
  }, []);

  const selectedPkg = PACKAGES.find(p => p.name === form.package);
  const basePrice = selectedPkg?.price || 0;
  const finalPrice = Math.max(0, basePrice - form.discount);

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const applyPromo = () => {
    const coupons = JSON.parse(localStorage.getItem("bc_coupons") || "[]");
    const code = coupons.find((c: { code: string; active: boolean; type: string; value: number }) => c.code === form.promoCode.toUpperCase() && c.active);
    if (!code) { set("promoMsg", "❌ Invalid or expired code"); set("discount", 0); return; }
    const disc = code.type === "flat" ? code.value : Math.floor(basePrice * code.value / 100);
    set("discount", disc);
    set("promoMsg", `✅ Saved ₹${disc}!`);
  };

  const submitBooking = async () => {
    setSubmitting(true);
    try {
      const id = generateId();
      const booking = {
        id, ...form, promoDiscount: form.discount, discountAmount: form.discount,
        status: "New", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };

      if (!IS_MOCK_MODE) {
        addDoc(collection(db, "bookings"), booking).catch((error) => {
          console.error("Firestore background addDoc failed:", error);
        });
      } else {
        const prev = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
        localStorage.setItem("bc_bookings", JSON.stringify([...prev, booking]));
      }

      // Keep local copy so the current device can always access it easily
      const devicePrev = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
      localStorage.setItem("bc_bookings", JSON.stringify([...devicePrev, booking]));

      router.push(`/confirmation?id=${id}&name=${encodeURIComponent(form.name)}`);
    } catch (error) {
      console.error("Error submitting booking: ", error);
      // Even if database fails, save to localStorage so the booking is not lost
      const id = generateId();
      const booking = {
        id, ...form, promoDiscount: form.discount, discountAmount: form.discount,
        status: "New", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      const prev = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
      localStorage.setItem("bc_bookings", JSON.stringify([...prev, booking]));
      router.push(`/confirmation?id=${id}&name=${encodeURIComponent(form.name)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const canNext: Record<number, boolean> = {
    1: !!form.serviceType,
    2: !!form.service && !!form.package,
    3: !!form.brand && !!form.model,
    4: !!form.name && !!form.phone && !!form.email && (form.serviceType === "workshop" || !!form.address) && !!form.date && !!form.time,
    5: true,
  };

  const steps = ["Service Type", "Service & Package", "Vehicle Info", "Schedule & Details", "Confirm"];

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <Link href="/" style={s.logo}>🏍️ Biker<span style={{ color: "#FF3D00" }}>Clinic</span></Link>
        <Link href="/user/login" style={s.navLogin}>👤 My Garage</Link>
      </nav>

      <div style={s.wrapper}>
        {/* Step indicator */}
        <div style={s.stepBar}>
          {steps.map((label, i) => {
            const sn = (i + 1) as Step;
            const done = sn < step;
            const active = sn === step;
            return (
              <div key={label} style={s.stepItem}>
                <div style={{ ...s.stepCircle, ...(active ? s.stepActive : done ? s.stepDone : {}) }}>
                  {done ? "✓" : i + 1}
                </div>
                <div className="step-label" style={{ ...s.stepLabel, color: active ? "#FF3D00" : done ? "#00E676" : "#6B6B88" }}>{label}</div>
                {i < steps.length - 1 && <div style={{ ...s.stepLine, background: done ? "#FF3D00" : "#1E1E2E" }} />}
              </div>
            );
          })}
        </div>

        <div className="booking-card" style={s.card}>
          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <StepHeader title="How should we serve you?" sub="Choose where you'd like the service done." />
              <div className="responsive-grid-2">
                {[
                  { val: "doorstep", icon: "🏠", title: "Doorstep Service", desc: "Mechanic comes to your home or office. Most convenient." },
                  { val: "workshop", icon: "🏭", title: "Workshop Drop-off", desc: "Drop your bike at our service center. Best for major work." },
                ].map(opt => (
                  <div key={opt.val} onClick={() => set("serviceType", opt.val)} style={{ ...s.option, ...(form.serviceType === opt.val ? s.optionSelected : {}) }}>
                    <div style={s.optionIcon}>{opt.icon}</div>
                    <div style={s.optionTitle}>{opt.title}</div>
                    <div style={s.optionDesc}>{opt.desc}</div>
                    {form.serviceType === opt.val && <div style={s.optionCheck}>✓</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <StepHeader title="What do you need?" sub="Select a service and the right package for your bike." />
              <FormGroup label="Service Type">
                <div style={s.chipGrid}>
                  {SERVICES.map(sv => (
                    <button key={sv} onClick={() => set("service", sv)} style={{ ...s.chip, ...(form.service === sv ? s.chipSelected : {}) }}>{sv}</button>
                  ))}
                </div>
              </FormGroup>
              <FormGroup label="Package">
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
                  {PACKAGES.map(pkg => (
                    <div key={pkg.name} onClick={() => set("package", pkg.name)} style={{ ...s.pkgCard, ...(form.package === pkg.name ? s.pkgCardSelected : {}) }}>
                      <div style={s.pkgName}>{pkg.name}</div>
                      <div style={s.pkgPrice}>₹{pkg.price}</div>
                      <div style={s.pkgDesc}>{pkg.desc}</div>
                    </div>
                  ))}
                </div>
              </FormGroup>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <StepHeader title="Tell us about your bike" sub="We'll assign the right mechanic for your vehicle." />
              <div className="form-row">
                <FormGroup label="Brand">
                  <select style={s.input} value={form.brand} onChange={e => set("brand", e.target.value)}>
                    <option value="">Select brand</option>
                    {BRANDS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </FormGroup>
                <FormGroup label="Model">
                  <input style={s.input} placeholder="e.g. Splendor Plus, Activa 6G" value={form.model} onChange={e => set("model", e.target.value)} />
                </FormGroup>
              </div>
              <FormGroup label="Year (optional)">
                <input style={s.input} placeholder="e.g. 2021" value={form.year} onChange={e => set("year", e.target.value)} />
              </FormGroup>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <StepHeader title="Schedule & Contact" sub="When should we come, and how do we reach you?" />
              <div className="form-row">
                <FormGroup label="Full Name">
                  <input style={s.input} placeholder="Your full name" value={form.name} onChange={e => set("name", e.target.value)} />
                </FormGroup>
                <FormGroup label="Phone Number">
                  <input style={s.input} placeholder="10-digit mobile" value={form.phone} onChange={e => set("phone", e.target.value)} maxLength={10} />
                </FormGroup>
              </div>
              <FormGroup label="Email Address">
                <input style={s.input} placeholder="your.email@example.com" value={form.email} onChange={e => set("email", e.target.value)} type="email" />
              </FormGroup>
              {form.serviceType === "doorstep" && (
                <FormGroup label="Service Address">
                  <input style={s.input} placeholder="Full address where mechanic should come" value={form.address} onChange={e => set("address", e.target.value)} />
                </FormGroup>
              )}
              <div className="form-row">
                <FormGroup label="Preferred Date">
                  <input style={s.input} type="date" value={form.date} min={tomorrow()} onChange={e => set("date", e.target.value)} />
                </FormGroup>
                <FormGroup label="Preferred Time">
                  <select style={s.input} value={form.time} onChange={e => set("time", e.target.value)}>
                    {TIMES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </FormGroup>
              </div>
              <FormGroup label="Special Instructions (optional)">
                <textarea style={{ ...s.input, minHeight: 80, resize: "vertical" as const }} placeholder="e.g. specific issues, gate code..." value={form.notes} onChange={e => set("notes", e.target.value)} />
              </FormGroup>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div>
              <StepHeader title="Confirm Your Booking" sub="Review everything before we confirm your appointment." />
              <div style={s.summaryCard}>
                {[
                  ["Service Type", form.serviceType === "doorstep" ? "🏠 Doorstep" : "🏭 Workshop"],
                  ["Service", form.service],
                  ["Package", form.package],
                  ["Vehicle", `${form.brand} ${form.model}${form.year ? ` (${form.year})` : ""}`],
                  ["Customer", form.name],
                  ["Phone", form.phone],
                  ...( form.serviceType === "doorstep" ? [["Address", form.address]] : [] ),
                  ["Appointment", `${form.date} at ${form.time}`],
                ].map(([k, v]) => (
                  <div key={k} style={s.summaryRow}>
                    <span style={s.summaryKey}>{k}</span>
                    <span style={s.summaryVal}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={s.promoRow}>
                <input style={{ ...s.input, flex: 1 }} placeholder="Promo code" value={form.promoCode} onChange={e => set("promoCode", e.target.value.toUpperCase())} />
                <button onClick={applyPromo} style={s.applyBtn}>Apply</button>
              </div>
              {form.promoMsg && <div style={{ color: form.discount > 0 ? "#00E676" : "#EF4444", fontSize: "0.85rem", marginBottom: 12 }}>{form.promoMsg}</div>}

              <div style={s.priceBox}>
                <div style={s.priceRow}>
                  <span>Base Price</span><span>₹{basePrice}</span>
                </div>
                {form.discount > 0 && (
                  <div style={{ ...s.priceRow, color: "#00E676" }}>
                    <span>Discount ({form.promoCode})</span><span>-₹{form.discount}</span>
                  </div>
                )}
                <div style={{ ...s.priceRow, fontWeight: 800, fontSize: "1.15rem", borderTop: "1px solid #2A2A3E", paddingTop: 12, marginTop: 8 }}>
                  <span>Total Payable</span><span style={{ color: "#FF3D00" }}>₹{finalPrice}</span>
                </div>
              </div>

              <button onClick={submitBooking} disabled={submitting} style={{ ...s.submitBtn, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Confirming..." : "✅ Confirm Booking"}
              </button>
            </div>
          )}

          {/* Actions */}
          <div style={s.actions}>
            {step > 1 && (
              <button onClick={() => setStep(s => (s - 1) as Step)} style={s.backBtn}>← Back</button>
            )}
            {step < 5 && (
              <button onClick={() => setStep(s => (s + 1) as Step)} disabled={!canNext[step]} style={{ ...s.nextBtn, opacity: canNext[step] ? 1 : 0.4 }}>
                Continue →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 6 }}>{title}</h2>
      <p style={{ color: "#6B6B88", fontSize: "0.95rem" }}>{sub}</p>
    </div>
  );
}

function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20, flex: 1 }}>
      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#9E9EB5", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { background: "#0E0E18", minHeight: "100vh" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", borderBottom: "1px solid #1E1E2E", background: "#0A0A14", position: "sticky", top: 0, zIndex: 10 },
  logo: { fontSize: "1.2rem", fontWeight: 800, textDecoration: "none", color: "#F0F0F8" },
  navLogin: { color: "#9E9EB5", fontSize: "0.9rem", textDecoration: "none", border: "1px solid #2A2A3E", padding: "8px 14px", borderRadius: 8 },
  wrapper: { maxWidth: 760, margin: "40px auto", padding: "0 24px 60px" },
  stepBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36, position: "relative" as const },
  stepItem: { display: "flex", flexDirection: "column" as const, alignItems: "center", flex: 1, position: "relative" as const },
  stepCircle: { width: 36, height: 36, borderRadius: "50%", background: "#1E1E2E", border: "2px solid #2A2A3E", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.9rem", color: "#6B6B88", zIndex: 1 },
  stepActive: { background: "rgba(255,61,0,0.15)", borderColor: "#FF3D00", color: "#FF3D00" },
  stepDone: { background: "rgba(0,230,118,0.1)", borderColor: "#00E676", color: "#00E676" },
  stepLabel: { fontSize: "0.72rem", fontWeight: 600, marginTop: 8, textAlign: "center" as const, maxWidth: 80 },
  stepLine: { position: "absolute" as const, top: 18, left: "50%", width: "100%", height: 2, zIndex: 0 },
  card: { background: "#161622", border: "1px solid #1E1E2E", borderRadius: 20, padding: "36px" },
  optionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  option: { background: "#0E0E18", border: "1px solid #2A2A3E", borderRadius: 14, padding: 24, cursor: "pointer", position: "relative" as const, transition: "all 0.2s" },
  optionSelected: { borderColor: "#FF3D00", background: "rgba(255,61,0,0.05)", boxShadow: "0 0 24px rgba(255,61,0,0.1)" },
  optionIcon: { fontSize: "2rem", marginBottom: 12 },
  optionTitle: { fontWeight: 700, fontSize: "1.05rem", marginBottom: 6 },
  optionDesc: { color: "#6B6B88", fontSize: "0.88rem", lineHeight: 1.5 },
  optionCheck: { position: "absolute" as const, top: 14, right: 14, width: 24, height: 24, borderRadius: "50%", background: "#FF3D00", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.75rem" },
  chipGrid: { display: "flex", flexWrap: "wrap" as const, gap: 10 },
  chip: { background: "#0E0E18", border: "1px solid #2A2A3E", color: "#9E9EB5", padding: "8px 16px", borderRadius: 99, fontSize: "0.88rem", fontWeight: 500, cursor: "pointer", transition: "all 0.15s" },
  chipSelected: { background: "rgba(255,61,0,0.1)", borderColor: "#FF3D00", color: "#FF3D00", fontWeight: 700 },
  pkgCard: { background: "#0E0E18", border: "1px solid #2A2A3E", borderRadius: 12, padding: 20, flex: 1, cursor: "pointer", minWidth: 160, transition: "all 0.2s" },
  pkgCardSelected: { borderColor: "#FF3D00", background: "rgba(255,61,0,0.05)" },
  pkgName: { fontWeight: 700, fontSize: "0.95rem", marginBottom: 4 },
  pkgPrice: { color: "#FF3D00", fontWeight: 800, fontSize: "1.2rem", marginBottom: 6 },
  pkgDesc: { color: "#6B6B88", fontSize: "0.8rem", lineHeight: 1.5 },
  formRow: { display: "flex", gap: 20 },
  input: { width: "100%", background: "#0E0E18", border: "1px solid #2A2A3E", borderRadius: 10, padding: "13px 14px", color: "#F0F0F8", fontSize: "0.95rem", outline: "none", fontFamily: "inherit" },
  summaryCard: { background: "#0E0E18", border: "1px solid #1E1E2E", borderRadius: 12, padding: 20, marginBottom: 20 },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #1A1A28" },
  summaryKey: { color: "#6B6B88", fontSize: "0.85rem" },
  summaryVal: { fontWeight: 600, fontSize: "0.9rem", textAlign: "right" as const, maxWidth: "60%" },
  promoRow: { display: "flex", gap: 12, marginBottom: 8 },
  applyBtn: { background: "rgba(255,61,0,0.1)", color: "#FF3D00", border: "1px solid rgba(255,61,0,0.3)", borderRadius: 10, padding: "0 20px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const },
  priceBox: { background: "#0E0E18", border: "1px solid #1E1E2E", borderRadius: 12, padding: 20, marginBottom: 24 },
  priceRow: { display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.95rem" },
  submitBtn: { width: "100%", padding: 18, background: "linear-gradient(135deg, #FF3D00, #cc3000)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "1.05rem", cursor: "pointer", boxShadow: "0 4px 24px rgba(255,61,0,0.3)" },
  actions: { display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: "1px solid #1E1E2E" },
  backBtn: { background: "transparent", border: "1px solid #2A2A3E", color: "#9E9EB5", padding: "12px 24px", borderRadius: 10, fontSize: "0.95rem", cursor: "pointer", fontWeight: 600 },
  nextBtn: { background: "linear-gradient(135deg, #FF3D00, #cc3000)", color: "#fff", border: "none", padding: "12px 32px", borderRadius: 10, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 16px rgba(255,61,0,0.25)" },
};
