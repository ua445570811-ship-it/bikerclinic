"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db, IS_MOCK_MODE } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

// ── Types ──────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5;
type ServiceType = "doorstep" | "workshop";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: string;
  plateNumber: string;
}

interface PaymentMethod {
  id: string;
  type: "upi" | "card";
  label: string;
  detail: string;
}

const SERVICE_CATEGORIES = [
  {
    name: "Engine & Performance",
    icon: "engineering",
    services: [
      { name: "Engine Diagnostics & Tuning", desc: "Computerized ECU scanning and throttle body tuning.", duration: "1 hr" },
      { name: "Oil & Filter Change", desc: "Engine oil replacement and oil filter cleaning.", duration: "0.5 hrs" },
      { name: "Carburetor / FI Cleaning", desc: "Complete fuel injector cleaning and pressure balance.", duration: "1.5 hrs" },
    ]
  },
  {
    name: "Electricals & Battery",
    icon: "bolt",
    services: [
      { name: "Battery Service", desc: "Voltage diagnostics, terminal cleaning, fluid top-up & charge level checks.", duration: "0.5 hrs" },
      { name: "Electrical Repair", desc: "Short-circuit detection, wiring harness repair, indicator and horn replacement.", duration: "2 hrs" }
    ]
  },
  {
    name: "Brakes & Suspension",
    icon: "build",
    services: [
      { name: "Brake Service", desc: "Caliper lubrication, brake fluid bleeding & brake pad/shoe replacement.", duration: "1 hr" },
      { name: "Suspension Repair", desc: "Fork oil seal replacement, shock absorber tuning and alignments.", duration: "3.5 hrs" }
    ]
  },
  {
    name: "Tyres & Wheel Care",
    icon: "tire_repair",
    services: [
      { name: "Tyre Replacement", desc: "New tyre fitment, tubeless valve installation and pressure balance checks.", duration: "1 hr" }
    ]
  }
];

const PACKAGES = [
  { name: "General Checkup", price: 299, desc: "Standard multi-point check, oil inspection & spark plug cleaning" },
  { name: "Standard Service", price: 1299, desc: "All General Checkup + brake check, chain lube, complete electrical scanning" },
  { name: "Engine Overhaul", price: 1999, desc: "Complete engine block teardown, genuine parts installation, 1-year warranty coverage" },
];

const BRANDS = ["Hero", "Honda", "TVS", "Bajaj", "Royal Enfield", "Yamaha", "Suzuki", "KTM", "Kawasaki", "Other"];

// Time slots grouped by period
const TIME_SLOTS = {
  morning: [
    { time: "08:00 AM", booked: false },
    { time: "09:00 AM", booked: true }, // mocked booked slot
    { time: "10:00 AM", booked: false },
    { time: "11:00 AM", booked: false }
  ],
  afternoon: [
    { time: "12:00 PM", booked: false },
    { time: "01:00 PM", booked: false },
    { time: "02:00 PM", booked: true }, // mocked booked slot
    { time: "03:00 PM", booked: false }
  ],
  evening: [
    { time: "04:00 PM", booked: false },
    { time: "05:00 PM", booked: false },
    { time: "06:00 PM", booked: false }
  ]
};

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
  const [loading, setLoading] = useState(true);
  
  // Custom interactive states
  const [activeCategory, setActiveCategory] = useState("All");
  const [serviceSearch, setServiceSearch] = useState("");
  const [garageBikes, setGarageBikes] = useState<Vehicle[]>([]);
  const [selectedBikeId, setSelectedBikeId] = useState<string>("custom");
  const [savedPayments, setSavedPayments] = useState<PaymentMethod[]>([]);
  
  // New vehicle form fields if "custom" is selected
  const [customBike, setCustomBike] = useState({
    brand: "",
    model: "",
    year: "",
    plateNumber: ""
  });

  const [form, setForm] = useState({
    serviceType: "doorstep" as ServiceType,
    service: "Engine Diagnostics & Tuning", package: "General Checkup", brand: "", model: "", year: "",
    bikeNumber: "",
    name: "", phone: "", email: "", address: "", landmark: "", notes: "",
    date: tomorrow(), time: "10:00 AM",
    promoCode: "", discount: 0, promoMsg: "",
    paymentMethod: "Cash on Delivery",
    paymentDetail: ""
  });
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("bc_user_email") || "";
    if (!savedEmail) {
      router.push("/user/login?redirect=/booking");
      return;
    }

    const savedName = localStorage.getItem("bc_user_name") || "";
    const savedPhone = localStorage.getItem("bc_user_phone") || "";
    const savedAddress = localStorage.getItem("bc_user_address") || "";
    
    // Fetch garage vehicles from localStorage
    const savedGarage = JSON.parse(localStorage.getItem("bc_user_garage") || "[]");
    setGarageBikes(savedGarage);

    // Fetch saved payment methods
    const defaultUPI = JSON.parse(localStorage.getItem("bc_user_upi") || "[]");
    const defaultCards = JSON.parse(localStorage.getItem("bc_user_cards") || "[]");
    const compiledPayments: PaymentMethod[] = [
      ...defaultUPI.map((u: any, i: number) => ({ id: `upi-${i}`, type: "upi" as const, label: "Linked UPI ID", detail: u.code })),
      ...defaultCards.map((c: any, i: number) => ({ id: `card-${i}`, type: "card" as const, label: `${c.type.toUpperCase()} Card`, detail: `•••• •••• •••• ${c.number.slice(-4)}` }))
    ];
    setSavedPayments(compiledPayments);

    // If garage is not empty, pre-select the first vehicle
    let initialBrand = "";
    let initialModel = "";
    let initialYear = "";
    let initialPlate = "";

    if (savedGarage.length > 0) {
      setSelectedBikeId(savedGarage[0].id);
      initialBrand = savedGarage[0].brand;
      initialModel = savedGarage[0].model;
      initialYear = savedGarage[0].year;
      initialPlate = savedGarage[0].plateNumber;
    } else {
      setSelectedBikeId("custom");
      initialBrand = localStorage.getItem("bc_user_bike_brand") || "";
      initialModel = localStorage.getItem("bc_user_bike_model") || "";
      initialYear = "";
      initialPlate = localStorage.getItem("bc_user_bike_number") || "";
    }
    
    setForm(f => ({
      ...f,
      name: f.name || savedName,
      email: f.email || savedEmail,
      phone: f.phone || savedPhone,
      address: f.address || savedAddress,
      brand: f.brand || initialBrand,
      model: f.model || initialModel,
      year: f.year || initialYear,
      bikeNumber: f.bikeNumber || initialPlate,
    }));
    
    setCustomBike({
      brand: initialBrand,
      model: initialModel,
      year: initialYear,
      plateNumber: initialPlate
    });

    setLoading(false);
  }, [router]);

  // Handle garage bike select
  const handleSelectGarageBike = (bikeId: string) => {
    setSelectedBikeId(bikeId);
    if (bikeId === "custom") {
      setForm(f => ({
        ...f,
        brand: customBike.brand,
        model: customBike.model,
        year: customBike.year,
        bikeNumber: customBike.plateNumber
      }));
    } else {
      const selected = garageBikes.find(b => b.id === bikeId);
      if (selected) {
        setForm(f => ({
          ...f,
          brand: selected.brand,
          model: selected.model,
          year: selected.year,
          bikeNumber: selected.plateNumber
        }));
      }
    }
  };

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
        localStorage.removeItem("bc_last_sync_failed");
        addDoc(collection(db, "bookings"), booking).catch((error) => {
          console.error("Firestore addDoc failed:", error);
          localStorage.setItem("bc_last_sync_failed", "true");
        });
      }

      // Sync local copy
      const devicePrev = JSON.parse(localStorage.getItem("bc_bookings") || "[]");
      localStorage.setItem("bc_bookings", JSON.stringify([...devicePrev, booking]));

      router.push(`/confirmation?id=${id}&name=${encodeURIComponent(form.name)}`);
    } catch (error) {
      console.error("Error submitting booking: ", error);
      localStorage.setItem("bc_last_sync_failed", "true");
      
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
    3: !!form.brand && !!form.model && !!form.bikeNumber,
    4: !!form.name && !!form.phone && !!form.email && (form.serviceType === "workshop" || !!form.address) && !!form.date && !!form.time,
    5: true,
  };

  const steps = ["Service Mode", "Select Service", "Vehicle Spec", "Schedule Details", "Pay & Confirm"];

  // Filter services by category & search query
  const getFilteredServices = () => {
    let result: Array<{ name: string; desc: string; duration: string; catName: string }> = [];
    SERVICE_CATEGORIES.forEach(cat => {
      if (activeCategory === "All" || cat.name === activeCategory) {
        cat.services.forEach(srv => {
          if (srv.name.toLowerCase().includes(serviceSearch.toLowerCase()) || srv.desc.toLowerCase().includes(serviceSearch.toLowerCase())) {
            result.push({ ...srv, catName: cat.name });
          }
        });
      }
    });
    return result;
  };

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
                <div className="step-label" style={{ ...s.stepLabel, color: active ? "var(--primary)" : done ? "var(--success)" : "var(--text-muted)" }}>{label}</div>
                {i < steps.length - 1 && <div style={{ ...s.stepLine, background: done ? "var(--primary)" : "var(--border)" }} />}
              </div>
            );
          })}
        </div>

        <div className="booking-card" style={s.card}>
          {/* STEP 1: Select Service Mode */}
          {step === 1 && (
            <div>
              <StepHeader title="Select Service Mode" sub="Choose where you would like your diagnostic session performed." />
              <div className="responsive-grid-2">
                {[
                  { val: "doorstep", icon: "🏠", title: "Doorstep Service", desc: "Our mobile workshop comes directly to your home or office." },
                  { val: "workshop", icon: "🏭", title: "Workshop Drop-off", desc: "Book a service bay at our flagship workshop." },
                ].map(opt => (
                  <div key={opt.val} onClick={() => set("serviceType", opt.val)} style={{ ...s.option, ...(form.serviceType === opt.val ? s.optionSelected : {}) }}>
                    <div style={s.optionIcon}>
                      <span style={{ fontSize: "2.2rem" }}>{opt.icon}</span>
                    </div>
                    <div style={s.optionTitle}>{opt.title}</div>
                    <div style={s.optionDesc}>{opt.desc}</div>
                    {form.serviceType === opt.val && <div style={s.optionCheck}>✓</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Category-based Service Catalog */}
          {step === 2 && (
            <div>
              <StepHeader title="Service Catalog & Tier Packages" sub="Browse and select our specialized mechanical procedures and package tiers." />
              
              {/* Search and Category Filters */}
              <div style={{ marginBottom: 20 }}>
                <input 
                  type="text" 
                  placeholder="🔍 Search diagnostic & mechanical services..." 
                  style={{ ...s.input, marginBottom: 16 }}
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                />
                
                <div style={{ display: "flex", gap: 8, overflowX: "auto", pb: 8, flexWrap: "wrap" }}>
                  {["All", ...SERVICE_CATEGORIES.map(c => c.name)].map(catName => (
                    <button 
                      key={catName} 
                      onClick={() => setActiveCategory(catName)}
                      style={{ 
                        ...s.filterBtn, 
                        ...(activeCategory === catName ? s.filterBtnActive : {}) 
                      }}
                    >
                      {catName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Package Tier Selection (Primary) */}
              <FormGroup label="1. Choose Package Tier">
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {PACKAGES.map(pkg => (
                    <div key={pkg.name} onClick={() => set("package", pkg.name)} style={{ ...s.pkgCard, ...(form.package === pkg.name ? s.pkgCardSelected : {}) }}>
                      <div style={s.pkgName}>{pkg.name}</div>
                      <div style={s.pkgPrice} className="mono-text">₹{pkg.price}</div>
                      <div style={s.pkgDesc}>{pkg.desc}</div>
                      {form.package === pkg.name && <div style={{ color: "var(--primary)", fontSize: "0.8rem", fontWeight: 700, marginTop: 8 }}>Active Tier ✓</div>}
                    </div>
                  ))}
                </div>
              </FormGroup>

              {/* Service Selection Grid (Optional / Add-ons) */}
              <FormGroup label="2. Select Service Module (Optional Add-on Repairs)">
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "250px", overflowY: "auto", paddingRight: "6px", marginBottom: "16px" }}>
                  {getFilteredServices().map(srv => {
                    const isSelected = form.service === srv.name;
                    return (
                      <div 
                        key={srv.name} 
                        onClick={() => set("service", srv.name)} 
                        style={{ 
                          ...s.serviceCardItem, 
                          ...(isSelected ? s.serviceCardItemActive : {}) 
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: isSelected ? "var(--primary)" : "var(--text-primary)" }}>{srv.name}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>{srv.desc}</div>
                          </div>
                          <div style={{ fontSize: "0.75rem", background: "var(--bg)", border: "1px solid var(--border)", padding: "4px 8px", borderRadius: 4, fontFamily: "var(--font-mono)", color: "var(--primary)", whiteSpace: "nowrap" }}>
                            ⏱️ {srv.duration}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {getFilteredServices().length === 0 && (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.88rem", padding: "20px 0", textAlign: "center" }}>No matching services found. Try another query.</div>
                  )}
                </div>
              </FormGroup>
            </div>
          )}

          {/* STEP 3: Vehicle Specifications & Garage */}
          {step === 3 && (
            <div>
              <StepHeader title="Select Vehicle" sub="Choose a vehicle from your Virtual Garage or specify a custom motorcycle." />
              
              {/* Garage Vehicles List */}
              {garageBikes.length > 0 && (
                <FormGroup label="Saved Motorcycles">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 24 }}>
                    {garageBikes.map(bike => {
                      const isSelected = selectedBikeId === bike.id;
                      return (
                        <div 
                          key={bike.id} 
                          onClick={() => handleSelectGarageBike(bike.id)}
                          style={{
                            ...s.bikeCard,
                            ...(isSelected ? s.bikeCardActive : {})
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "1.8rem", color: isSelected ? "var(--primary)" : "var(--text-muted)" }}>two_wheeler</span>
                          <div style={{ fontWeight: 800, fontSize: "0.95rem", marginTop: 8 }}>{bike.brand} {bike.model}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Year: {bike.year}</div>
                          <div style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)", color: "var(--primary)", marginTop: 6, fontWeight: 700 }}>{bike.plateNumber}</div>
                        </div>
                      );
                    })}
                    
                    {/* Option to add custom custom input */}
                    <div 
                      onClick={() => handleSelectGarageBike("custom")}
                      style={{
                        ...s.bikeCard,
                        borderStyle: "dashed",
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                        cursor: "pointer",
                        ...(selectedBikeId === "custom" ? s.bikeCardActive : {})
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "1.8rem" }}>add_circle_outline</span>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", marginTop: 8 }}>Use Other Bike</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Enter specifications manually</div>
                    </div>
                  </div>
                </FormGroup>
              )}

              {/* Custom Input Form (Visible if custom is selected or no garage bikes exist) */}
              {(selectedBikeId === "custom" || garageBikes.length === 0) && (
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px", marginTop: 10 }} className="anim-fade-up">
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", marginBottom: 16, textTransform: "uppercase" }}>Manual Specifications</div>
                  
                  <div className="form-row" style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={s.smallLabel}>Brand</label>
                      <select 
                        style={s.input} 
                        value={form.brand} 
                        onChange={e => {
                          set("brand", e.target.value);
                          setCustomBike(prev => ({ ...prev, brand: e.target.value }));
                        }}
                      >
                        <option value="">Select Brand</option>
                        {BRANDS.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={s.smallLabel}>Model Name</label>
                      <input 
                        style={s.input} 
                        placeholder="e.g. Classic 350" 
                        value={form.model} 
                        onChange={e => {
                          set("model", e.target.value);
                          setCustomBike(prev => ({ ...prev, model: e.target.value }));
                        }} 
                      />
                    </div>
                  </div>

                  <div className="form-row" style={{ display: "flex", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={s.smallLabel}>Manufacturing Year</label>
                      <input 
                        style={s.input} 
                        placeholder="e.g. 2022" 
                        value={form.year} 
                        onChange={e => {
                          set("year", e.target.value);
                          setCustomBike(prev => ({ ...prev, year: e.target.value }));
                        }} 
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={s.smallLabel}>License Plate Number</label>
                      <input 
                        style={{ ...s.input, textTransform: "uppercase" }} 
                        placeholder="e.g. KA 03 EX 1234" 
                        value={form.bikeNumber} 
                        onChange={e => {
                          set("bikeNumber", e.target.value);
                          setCustomBike(prev => ({ ...prev, plateNumber: e.target.value }));
                        }} 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Scheduling & Date Slots */}
          {step === 4 && (
            <div>
              <StepHeader title="Schedule & Contact Information" sub="Specify when our technicians should arrive and verify your contact address." />
              
              <div className="form-row" style={{ display: "flex", gap: 16 }}>
                <FormGroup label="Full Name">
                  <input style={s.input} placeholder="Your name" value={form.name} onChange={e => set("name", e.target.value)} />
                </FormGroup>
                <FormGroup label="Phone Number">
                  <input style={s.input} placeholder="10-digit mobile number" value={form.phone} onChange={e => set("phone", e.target.value)} maxLength={10} />
                </FormGroup>
              </div>

              <FormGroup label="Email Address">
                <input style={s.input} placeholder="email@example.com" value={form.email} onChange={e => set("email", e.target.value)} type="email" />
              </FormGroup>

              {form.serviceType === "doorstep" && (
                <FormGroup label="Doorstep Service Address">
                  <input style={s.input} placeholder="Complete doorstep service address details" value={form.address} onChange={e => set("address", e.target.value)} />
                </FormGroup>
              )}

              {/* Visual Calendar & Time Slots Picker */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
                <div style={{ flex: 1, minWidth: 250 }}>
                  <FormGroup label="Select Service Date">
                    <input style={s.input} type="date" value={form.date} min={tomorrow()} onChange={e => set("date", e.target.value)} />
                  </FormGroup>
                </div>
                
                <div style={{ flex: 2, minWidth: 300 }}>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    Preferred Time Slot
                  </label>
                  
                  {/* Time slots grouped grid */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {Object.entries(TIME_SLOTS).map(([period, slots]) => (
                      <div key={period}>
                        <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", color: "var(--primary)", letterSpacing: "0.05em", marginBottom: 6 }}>
                          {period} Slots
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {slots.map(sItem => {
                            const isSelected = form.time === sItem.time;
                            return (
                              <button
                                key={sItem.time}
                                type="button"
                                disabled={sItem.booked}
                                onClick={() => set("time", sItem.time)}
                                style={{
                                  ...s.slotChip,
                                  ...(isSelected ? s.slotChipActive : {}),
                                  ...(sItem.booked ? s.slotChipBooked : {})
                                }}
                              >
                                {sItem.time} {sItem.booked && "(Booked)"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <FormGroup label="Diagnostic Details / Special Instructions" style={{ marginTop: 20 }}>
                <textarea style={{ ...s.input, minHeight: 80, resize: "vertical" }} placeholder="Describe any noises, issues, or specific mechanics queries..." value={form.notes} onChange={e => set("notes", e.target.value)} />
              </FormGroup>
            </div>
          )}

          {/* STEP 5: Confirm & Pay */}
          {step === 5 && (
            <div>
              <StepHeader title="Confirm & Select Payment" sub="Review details and choose payment method before scheduling dispatch." />
              
              <div style={s.summaryCard}>
                {[
                  ["Service Mode", form.serviceType === "doorstep" ? "🏠 Doorstep Service" : "🏭 Workshop Center"],
                  ["Service Specialty", form.service],
                  ["Service Tier", form.package],
                  ["Motorcycle Model", `${form.brand} ${form.model}`],
                  ["Plate Number", form.bikeNumber],
                  ["Customer", form.name],
                  ["Phone Number", "+91 " + form.phone],
                  ...( form.serviceType === "doorstep" ? [["Service Address", form.address]] : [] ),
                  ["Scheduled Date & Time", `${form.date} at ${form.time}`],
                ].map(([k, v]) => (
                  <div key={k} style={s.summaryRow}>
                    <span style={s.summaryKey}>{k}</span>
                    <span style={s.summaryVal}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Payment Method Selector */}
              <FormGroup label="3. Select Payment Method">
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {/* standard COD */}
                  <div 
                    onClick={() => { set("paymentMethod", "Cash on Delivery"); set("paymentDetail", ""); }}
                    style={{
                      ...s.paymentOption,
                      ...(form.paymentMethod === "Cash on Delivery" ? s.paymentOptionActive : {})
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className="material-symbols-outlined" style={{ color: "var(--success)" }}>payments</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Pay After Doorstep Service</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Cash, UPI scanner, or Card accepted upon delivery.</div>
                      </div>
                    </div>
                  </div>

                  {/* saved payment profiles */}
                  {savedPayments.map(pay => {
                    const isSelected = form.paymentMethod === pay.label && form.paymentDetail === pay.detail;
                    return (
                      <div 
                        key={pay.id}
                        onClick={() => { set("paymentMethod", pay.label); set("paymentDetail", pay.detail); }}
                        style={{
                          ...s.paymentOption,
                          ...(isSelected ? s.paymentOptionActive : {})
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>
                            {pay.type === "upi" ? "account_balance_wallet" : "credit_card"}
                          </span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{pay.label} ({pay.detail})</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Directly bill this verified profile upon completion.</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </FormGroup>

              <div style={s.promoRow}>
                <input style={{ ...s.input, flex: 1 }} placeholder="ENTER COUPON CODE" value={form.promoCode} onChange={e => set("promoCode", e.target.value.toUpperCase())} />
                <button onClick={applyPromo} style={s.applyBtn}>Apply</button>
              </div>
              {form.promoMsg && <div style={{ color: form.discount > 0 ? "var(--success)" : "var(--error)", fontSize: "0.85rem", marginBottom: 12, fontWeight: 700 }}>{form.promoMsg}</div>}

              <div style={s.priceBox}>
                <div style={s.priceRow}>
                  <span>Base Price ({form.package})</span><span className="mono-text">₹{basePrice}</span>
                </div>
                {form.discount > 0 && (
                  <div style={{ ...s.priceRow, color: "var(--success)" }}>
                    <span>Promo Discount</span><span className="mono-text">-₹{form.discount}</span>
                  </div>
                )}
                <div style={{ ...s.priceRow, fontWeight: 800, fontSize: "1.15rem", borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 8 }}>
                  <span>Total Payable</span><span style={{ color: "var(--primary)" }} className="mono-text">₹{finalPrice}</span>
                </div>
              </div>

              <button onClick={submitBooking} disabled={submitting} style={{ ...s.submitBtn, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Processing Reservation..." : "🏍️ Confirm & Book Appointment"}
              </button>
            </div>
          )}

          {/* Action buttons */}
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
      <h2 style={{ fontSize: "1.45rem", fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>{title}</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.5 }}>{sub}</p>
    </div>
  );
}

function FormGroup({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: 20, flex: 1, ...style }}>
      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { background: "var(--bg)", minHeight: "100vh", color: "var(--text-primary)" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "var(--border)", background: "rgba(17, 19, 22, 0.95)", position: "sticky", top: 0, zIndex: 10 },
  logo: { fontSize: "1.3rem", fontWeight: 900, textDecoration: "none", color: "var(--text-primary)", letterSpacing: "-0.02em" },
  navLogin: { color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none", borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", padding: "8px 14px", borderRadius: 8, transition: "var(--transition)" },
  navTextLink: { color: "#94A3B8", fontSize: "0.9rem", fontWeight: 600, textDecoration: "none", transition: "color 0.2s" },
  navGarageBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: "0.88rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 },
  navBookBtn: { background: "#FF1E27", color: "#fff", padding: "8px 18px", borderRadius: 8, fontWeight: 800, fontSize: "0.88rem", textDecoration: "none", boxShadow: "0 0 16px rgba(255,30,39,0.4)" },
  wrapper: { maxWidth: 760, margin: "40px auto", padding: "0 24px 60px" },
  stepBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40, position: "relative" },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" },
  stepCircle: { width: 36, height: 36, borderRadius: "50%", background: "var(--bg)", borderWidth: 2, borderStyle: "solid", borderColor: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-muted)", zIndex: 1, transition: "var(--transition)" },
  stepActive: { background: "var(--primary-glow)", borderColor: "var(--primary)", color: "var(--primary)", boxShadow: "0 0 12px var(--primary-glow)" },
  stepDone: { background: "rgba(0,230,118,0.08)", borderColor: "var(--success)", color: "var(--success)" },
  stepLabel: { fontSize: "0.72rem", fontWeight: 700, marginTop: 8, textAlign: "center", maxWidth: 80, letterSpacing: "0.02em" },
  stepLine: { position: "absolute", top: 18, left: "50%", width: "100%", height: 2, zIndex: 0 },
  card: { background: "var(--surface)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 16, padding: "36px", boxShadow: "var(--shadow-md)" },
  option: { background: "var(--bg)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 12, padding: 24, cursor: "pointer", position: "relative", transition: "var(--transition)" },
  optionSelected: { borderColor: "var(--primary)", background: "var(--primary-glow)", boxShadow: "0 0 20px var(--primary-glow)" },
  optionIcon: { marginBottom: 12 },
  optionTitle: { fontWeight: 800, fontSize: "1.05rem", marginBottom: 6, letterSpacing: "-0.01em" },
  optionDesc: { color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.5 },
  optionCheck: { position: "absolute", top: 14, right: 14, width: 22, height: 22, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.7rem" },
  
  // Visual Catalog Styles
  filterBtn: { background: "var(--bg)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", color: "var(--text-secondary)", padding: "6px 14px", borderRadius: 20, fontSize: "0.82rem", cursor: "pointer", transition: "var(--transition)", outline: "none", fontWeight: 600 },
  filterBtnActive: { background: "var(--primary)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--primary)", color: "#fff" },
  serviceCardItem: { background: "var(--bg)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 8, padding: "14px 16px", cursor: "pointer", transition: "var(--transition)" },
  serviceCardItemActive: { borderColor: "var(--primary)", background: "var(--primary-glow)" },

  // Garage Bike Selection Styles
  bikeCard: { background: "var(--bg)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 10, padding: 16, cursor: "pointer", display: "flex", flexDirection: "column", transition: "var(--transition)" },
  bikeCardActive: { borderColor: "var(--primary)", background: "var(--primary-glow)" },
  smallLabel: { fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 },

  // Slot Styles
  slotChip: { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "8px 14px", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer", transition: "var(--transition)", fontWeight: 600, minWidth: "90px" },
  slotChipActive: { background: "var(--primary)", border: "1px solid var(--primary)", color: "#fff" },
  slotChipBooked: { opacity: 0.3, cursor: "not-allowed", borderStyle: "dashed" },

  // Payment Option Styles
  paymentOption: { background: "var(--bg)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 12, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "var(--transition)" },
  paymentOptionActive: { borderColor: "var(--primary)", background: "var(--primary-glow)" },

  pkgCard: { flex: 1, minWidth: 180, background: "var(--bg)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 12, padding: "16px", cursor: "pointer", transition: "var(--transition)" },
  pkgCardSelected: { borderColor: "var(--primary)", background: "var(--primary-glow)" },
  pkgName: { fontWeight: 800, fontSize: "0.95rem", marginBottom: 4 },
  pkgPrice: { color: "var(--primary)", fontWeight: 800, fontSize: "1.2rem", marginBottom: 6 },
  pkgDesc: { color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.5 },
  input: { width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "13px 14px", color: "var(--text-primary)", fontSize: "0.95rem", outline: "none", fontFamily: "inherit", transition: "var(--transition)" },
  summaryCard: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 20, marginBottom: 20 },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" },
  summaryKey: { color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 500 },
  summaryVal: { fontWeight: 600, fontSize: "0.9rem", textAlign: "right", maxWidth: "60%" },
  promoRow: { display: "flex", gap: 12, marginBottom: 8 },
  applyBtn: { background: "rgba(0,102,255,0.08)", color: "var(--primary)", border: "1px solid rgba(0,102,255,0.2)", borderRadius: 8, padding: "0 20px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", transition: "var(--transition)" },
  priceBox: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 20, marginBottom: 24 },
  priceRow: { display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.95rem" },
  submitBtn: { width: "100%", padding: 16, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, fontSize: "1.05rem", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,102,255,0.3)", transition: "var(--transition)" },
  actions: { display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" },
  backBtn: { background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "12px 24px", borderRadius: 8, fontSize: "0.95rem", cursor: "pointer", fontWeight: 600, transition: "var(--transition)" },
  nextBtn: { background: "var(--primary)", color: "#fff", border: "none", padding: "12px 32px", borderRadius: 8, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 16px var(--primary-glow)", transition: "var(--transition)" },
};
