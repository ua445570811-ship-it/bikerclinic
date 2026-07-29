"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function LiveStaticContent() {
  return (
    <div className="bg-[#0A0A12] text-white font-sans relative z-10 border-t border-white/10">
      {/* ─── Sticky Navbar ─── */}
      <nav className="sticky top-0 left-0 right-0 z-50 bg-[#0A0A12]/80 backdrop-blur-xl border-b border-white/10 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span>🏍️ BIKER</span>
            <span className="text-[#00FF66]">CLINIC</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#services" className="hover:text-[#00FF66] transition">
              Services
            </a>
            <a href="#how" className="hover:text-[#00FF66] transition">
              How It Works
            </a>
            <a href="#reviews" className="hover:text-[#00FF66] transition">
              Reviews
            </a>
            <a href="#contact" className="hover:text-[#00FF66] transition">
              Contact
            </a>
            <Link href="/track" className="hover:text-[#00FF66] transition">
              Track Order
            </Link>
            <Link
              href="/user/login"
              className="border border-white/20 px-4 py-2 rounded-full hover:border-[#00FF66] hover:text-[#00FF66] transition"
            >
              👤 My Garage
            </Link>
            <Link
              href="/booking"
              className="bg-[#00FF66] text-black font-bold px-6 py-2.5 rounded-full hover:bg-[#00FF66]/90 transition shadow-lg shadow-[#00FF66]/20"
            >
              Book Now
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Stats Bar & Brand Chips ─── */}
      <section className="py-16 px-6 border-b border-white/10 bg-gradient-to-b from-[#0F0F1A] to-[#0A0A12]">
        <div className="max-w-7xl mx-auto">
          {/* 4 Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-12">
            <motion.div {...fadeUp} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-3xl md:text-4xl font-black text-[#FF1E27] font-mono">5,000+</div>
              <div className="text-xs uppercase tracking-widest text-white/60 mt-2">Happy Riders</div>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-3xl md:text-4xl font-black text-[#FF1E27] font-mono">50+</div>
              <div className="text-xs uppercase tracking-widest text-white/60 mt-2">Certified Mechanics</div>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-3xl md:text-4xl font-black text-[#FF1E27] font-mono">4.9★</div>
              <div className="text-xs uppercase tracking-widest text-white/60 mt-2">Average Rating</div>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-3xl md:text-4xl font-black text-[#FF1E27] font-mono">30min</div>
              <div className="text-xs uppercase tracking-widest text-white/60 mt-2">Response Time</div>
            </motion.div>
          </div>

          {/* Brands */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 px-8 bg-white/5 border border-white/10 rounded-2xl">
            <span className="text-xs uppercase tracking-widest text-white/50 font-mono">We service all major brands</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {["Hero", "Honda", "TVS", "Bajaj", "Royal Enfield", "Yamaha", "Suzuki", "KTM"].map((brand) => (
                <span
                  key={brand}
                  className="bg-black/40 border border-white/10 text-white/80 px-4 py-1.5 rounded-full text-xs font-semibold"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Our Services Section ─── */}
      <section id="services" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[#00FF66] text-xs uppercase tracking-[0.3em] font-mono font-semibold bg-[#00FF66]/10 border border-[#00FF66]/20 px-4 py-1.5 rounded-full inline-block mb-4">
            Our Services
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            EVERYTHING YOUR BIKE NEEDS
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Professional service, genuine parts, transparent pricing at your doorstep.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* General Service */}
          <motion.div {...fadeUp} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col justify-between hover:border-[#00FF66]/50 transition group">
            <div>
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-bold mb-2">General Service</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Complete 20-point checkup, oil change & filters replacement.
              </p>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <span className="text-[#00FF66] font-bold text-lg">Starting ₹799</span>
              <Link
                href="/booking"
                className="bg-white/10 hover:bg-[#00FF66] hover:text-black font-bold px-4 py-2 rounded-lg text-sm transition"
              >
                Book →
              </Link>
            </div>
          </motion.div>

          {/* Full Service - Popular */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="bg-[#00FF66]/5 backdrop-blur-md border-2 border-[#00FF66]/40 rounded-2xl p-8 flex flex-col justify-between relative shadow-2xl shadow-[#00FF66]/10 group">
            <div className="absolute top-6 right-6 bg-[#00FF66] text-black font-bold text-xs uppercase px-3 py-1 rounded-full">
              ⭐ Most Popular
            </div>
            <div>
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold mb-2">Full Service</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Comprehensive service with parts replacement, engine tuning & deep diagnostics.
              </p>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <span className="text-[#00FF66] font-bold text-lg">Starting ₹1,499</span>
              <Link
                href="/booking"
                className="bg-[#00FF66] text-black font-bold px-5 py-2 rounded-lg text-sm hover:bg-[#00e05a] transition"
              >
                Book →
              </Link>
            </div>
          </motion.div>

          {/* Tyre Replacement */}
          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col justify-between hover:border-[#00FF66]/50 transition group">
            <div>
              <div className="text-4xl mb-4">🛞</div>
              <h3 className="text-xl font-bold mb-2">Tyre Replacement</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Premium tyre brands, precision wheel balancing & valve inspection included.
              </p>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <span className="text-[#00FF66] font-bold text-lg">Starting ₹999</span>
              <Link
                href="/booking"
                className="bg-white/10 hover:bg-[#00FF66] hover:text-black font-bold px-4 py-2 rounded-lg text-sm transition"
              >
                Book →
              </Link>
            </div>
          </motion.div>

          {/* Battery Service */}
          <motion.div {...fadeUp} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col justify-between hover:border-[#00FF66]/50 transition group">
            <div>
              <div className="text-4xl mb-4">🔋</div>
              <h3 className="text-xl font-bold mb-2">Battery Service</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Health test, terminal cleaning & replacement with official manufacturer warranty.
              </p>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <span className="text-[#00FF66] font-bold text-lg">Starting ₹499</span>
              <Link
                href="/booking"
                className="bg-white/10 hover:bg-[#00FF66] hover:text-black font-bold px-4 py-2 rounded-lg text-sm transition"
              >
                Book →
              </Link>
            </div>
          </motion.div>

          {/* Brake Service */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col justify-between hover:border-[#00FF66]/50 transition group">
            <div>
              <div className="text-4xl mb-4">🛠️</div>
              <h3 className="text-xl font-bold mb-2">Brake Service</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Pad, disc & cable inspection, brake fluid flush + caliper servicing.
              </p>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <span className="text-[#00FF66] font-bold text-lg">Starting ₹599</span>
              <Link
                href="/booking"
                className="bg-white/10 hover:bg-[#00FF66] hover:text-black font-bold px-4 py-2 rounded-lg text-sm transition"
              >
                Book →
              </Link>
            </div>
          </motion.div>

          {/* Electrical Repair */}
          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col justify-between hover:border-[#00FF66]/50 transition group">
            <div>
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-bold mb-2">Electrical Repair</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Wiring diagnostics, lighting systems, starter motor & sensor diagnosis.
              </p>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <span className="text-[#00FF66] font-bold text-lg">Starting ₹699</span>
              <Link
                href="/booking"
                className="bg-white/10 hover:bg-[#00FF66] hover:text-black font-bold px-4 py-2 rounded-lg text-sm transition"
              >
                Book →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works Section ─── */}
      <section id="how" className="py-24 px-6 border-t border-white/10 bg-[#070710]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#00FF66] text-xs uppercase tracking-[0.3em] font-mono font-semibold bg-[#00FF66]/10 border border-[#00FF66]/20 px-4 py-1.5 rounded-full inline-block mb-4">
              How It Works
            </span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              SERVICE IN 4 SIMPLE STEPS
            </h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              From booking to completion — we keep it fast, transparent, and stress-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "01", icon: "📱", title: "Book in 2 mins", desc: "Choose your service and pick a convenient slot. No calls needed." },
              { num: "02", icon: "👨‍🔧", title: "Mechanic Assigned", desc: "A certified technician is assigned and you get their profile instantly." },
              { num: "03", icon: "📍", title: "Live Tracking", desc: "Track your bike's service status in real-time like a food order." },
              { num: "04", icon: "✅", title: "Done & Delivered", desc: "Bike serviced at your doorstep. Pay only after you're satisfied." },
            ].map((step, idx) => (
              <motion.div
                key={step.num}
                {...fadeUp}
                transition={{ delay: idx * 0.15 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 relative"
              >
                <div className="text-sm font-black font-mono text-[#00FF66] mb-4">
                  STEP {step.num}
                </div>
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials Section ─── */}
      <section id="reviews" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[#00FF66] text-xs uppercase tracking-[0.3em] font-mono font-semibold bg-[#00FF66]/10 border border-[#00FF66]/20 px-4 py-1.5 rounded-full inline-block mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            RIDER REVIEWS & TRUST
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Read verified feedback from real customers about our doorstep and workshop servicing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              name: "Rahul Sharma",
              bike: "Royal Enfield Classic 350",
              quote: "“Absolutely brilliant! The mechanic came right to my office parking lot and finished the full service in 90 minutes. Transparent pricing and genuine parts.”",
              rating: "★★★★★",
            },
            {
              name: "Priya Nair",
              bike: "Honda Activa 6G",
              quote: "“I was skeptical about doorstep service for my scooter, but BikerClinic proved me wrong. Very professional technician, clean work, and zero hassle.”",
              rating: "★★★★★",
            },
            {
              name: "Amit Patel",
              bike: "KTM Duke 200",
              quote: "“Excellent chain repair and oil swap. The live tracking is just like tracking food orders, super cool feature! Will definitely book again.”",
              rating: "★★★★★",
            },
            {
              name: "Sneha Reddy",
              bike: "Yamaha FZ-S",
              quote: "“Very polite technician. He explained all the costs upfront before starting. The brake pad replacement feels top-notch.”",
              rating: "★★★★☆",
            },
          ].map((rev, i) => (
            <motion.div
              key={rev.name}
              {...fadeUp}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-white flex items-center gap-2">
                    {rev.name}
                    <span className="text-[#00FF66] text-xs bg-[#00FF66]/10 px-2 py-0.5 rounded-full font-mono">
                      ✓ Verified
                    </span>
                  </div>
                  <div className="text-yellow-400 text-sm tracking-widest">{rev.rating}</div>
                </div>
                <div className="text-xs text-[#00FF66] font-mono mb-4">🏍️ {rev.bike}</div>
                <p className="text-white/70 text-sm italic leading-relaxed">{rev.quote}</p>
              </div>
            </motion.div>
          ))}

          {/* Review CTA Card */}
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-[#00FF66]/10 to-transparent border border-[#00FF66]/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
          >
            <div className="text-4xl mb-4">⭐</div>
            <h4 className="text-xl font-bold mb-2">Are you a customer?</h4>
            <p className="text-white/60 text-sm mb-6">
              Share your service feedback and help the rider community!
            </p>
            <Link
              href="/user/login?redirect=/user/dashboard"
              className="bg-[#00FF66] text-black font-bold px-6 py-2.5 rounded-full text-sm hover:bg-[#00e05a] transition"
            >
              Write a Review →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Contact & Map Section ─── */}
      <section id="contact" className="py-24 px-6 border-t border-white/10 bg-[#070710]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#00FF66] text-xs uppercase tracking-[0.3em] font-mono font-semibold bg-[#00FF66]/10 border border-[#00FF66]/20 px-4 py-1.5 rounded-full inline-block mb-4">
              Contact Us
            </span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              OUR HEADQUARTERS & WORKSHOP
            </h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              Get in touch or drop by our service center for premium bike care.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Info card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-10 flex flex-col gap-8">
              <div>
                <h3 className="text-sm font-bold text-[#00FF66] uppercase tracking-widest font-mono mb-2">
                  📍 Physical Location
                </h3>
                <p className="text-white/80 text-base leading-relaxed">
                  BikerClinic Garage
                  <br />
                  4th Main, 1st Phase, Nanjundeshwara Layout, Nyanappahalli, Bengaluru, Karnataka 560076
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#00FF66] uppercase tracking-widest font-mono mb-2">
                  📞 Helpline & Support
                </h3>
                <p className="text-white/80 text-base leading-relaxed">
                  Phone:{" "}
                  <a href="tel:+919008076398" className="text-[#00FF66] font-bold hover:underline">
                    +91 90080 76398
                  </a>
                  <br />
                  Email:{" "}
                  <a href="mailto:support@bikerclinic.com" className="text-white/70 hover:text-white">
                    support@bikerclinic.com
                  </a>
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#00FF66] uppercase tracking-widest font-mono mb-2">
                  ⏰ Operating Hours
                </h3>
                <p className="text-white/80 text-base leading-relaxed">
                  Everyday: 8:00 AM — 8:00 PM
                  <br />
                  Emergency Support: 24/7 Available
                </p>
              </div>

              <a
                href="https://maps.app.goo.gl/16BPJWzQtafEorgY8"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#00FF66] text-black font-bold py-4 rounded-xl text-center hover:bg-[#00e05a] transition uppercase tracking-wider text-sm"
              >
                📍 Get Driving Directions Map
              </a>
            </div>

            {/* Google Map iframe */}
            <div className="border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-[450px]">
              <iframe
                title="BikerClinic Google Map Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.397238874461!2d77.6379278!3d12.8821591!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae159b967a574d%3A0xf20f0870c62c7f4f!2sBikerClinic!5e0!3m2!1sen!2sin!4v1718040000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0, display: "block" }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/10 bg-[#05050A] py-16 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <div className="text-2xl font-black tracking-tight">
            <span>🏍️ BIKER</span>
            <span className="text-[#00FF66]">CLINIC</span>
          </div>
          <p className="text-white/50 text-sm max-w-md leading-relaxed">
            📍 4th Main, 1st Phase, Nanjundeshwara Layout, Nyanappahalli, Bengaluru, Karnataka 560076
            <br />
            📞 Helpline:{" "}
            <a href="tel:+919008076398" className="text-[#00FF66] font-bold">
              +91 90080 76398
            </a>{" "}
            | ✉️ support@bikerclinic.com
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60 font-medium">
            <a href="/admin/login" className="hover:text-[#00FF66] transition">
              Admin Portal
            </a>
            <a href="/mechanic/login" className="hover:text-[#00FF66] transition">
              Mechanic Portal
            </a>
            <a href="/user/login" className="hover:text-[#00FF66] transition">
              Customer Login
            </a>
            <a href="/track" className="hover:text-[#00FF66] transition">
              Track Order
            </a>
          </div>
          <div className="text-xs text-white/30 font-mono mt-4">
            © 2026 BikerClinic. All rights reserved. Bangalore, India. Performance Meets Precision.
          </div>
        </div>
      </footer>
    </div>
  );
}
