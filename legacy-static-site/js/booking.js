import { db, IS_MOCK_MODE } from './firebase-config.js';
import { collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

/* ============================================
   BIKERCLINIC — BOOKING WIZARD
   5-step booking flow with WhatsApp confirmation
   ============================================ */

(function () {
  'use strict';

  /* ─── State ──────────────────────────────── */
  const booking = {
    brand: '', model: '', fuel: 'Petrol',
    service: '', package: '',
    date: '', time: '',
    serviceType: 'doorstep',
    name: '', phone: '', email: '', address: '', landmark: '', notes: '',
    promoCode: '', discountAmount: 0, finalPriceDisplay: ''
  };
  let currentStep = 1;
  const totalSteps = 5;

  /* ─── Pre-fill from URL params ───────────── */
  const params = new URLSearchParams(location.search);
  if (params.get('brand'))   booking.brand   = params.get('brand');
  if (params.get('service')) booking.service = params.get('service');
  if (params.get('package')) booking.package = params.get('package');

  /* ─── DOM refs ───────────────────────────── */
  const panels   = () => document.querySelectorAll('.wizard-panel');
  const steps    = () => document.querySelectorAll('.wizard-step');

  /* ─── Render step ────────────────────────── */
  function goTo(n) {
    if (n < 1 || n > totalSteps) return;
    currentStep = n;
    panels().forEach((p, i) => p.classList.toggle('active', i + 1 === n));
    steps().forEach((s, i) => {
      s.classList.toggle('active', i + 1 === n);
      s.classList.toggle('done',   i + 1 < n);
    });
    updateNav();
    if (n === 5) buildSummary();
    window.scrollTo({ top: document.querySelector('.booking-wizard')?.offsetTop - 100 || 0, behavior: 'smooth' });
  }

  function updateNav() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
    if (nextBtn) {
      if (currentStep === totalSteps) {
        nextBtn.textContent = '✅ Confirm Booking';
        nextBtn.id = 'confirmBtn';
        nextBtn.onclick = confirmBooking;
      } else {
        nextBtn.textContent = 'Next →';
        nextBtn.id = 'nextBtn';
        nextBtn.onclick = next;
      }
    }
  }

  /* ─── Validation per step ────────────────── */
  function validate(step) {
    const err = msg => { showToast(msg, 'error'); return false; };
    switch (step) {
      case 1:
        if (!booking.brand)  return err('Please select your bike brand.');
        if (!booking.model)  return err('Please enter your bike model.');
        return true;
      case 2:
        if (!booking.service && !booking.package) return err('Please choose a service or package.');
        return true;
      case 3:
        if (!booking.date) return err('Please select a date.');
        if (!booking.time) return err('Please select a time slot.');
        return true;
      case 4:
        if (!booking.name)  return err('Please enter your name.');
        if (!/^\d{10}$/.test(booking.phone)) return err('Enter a valid 10-digit phone number.');
        if (!booking.address) return err('Please enter your address.');
        return true;
      default: return true;
    }
  }

  function next() {
    collectStep(currentStep);
    if (validate(currentStep)) goTo(currentStep + 1);
  }
  function prev() { goTo(currentStep - 1); }

  /* ─── Collect data from DOM ──────────────── */
  function collectStep(step) {
    if (step === 1) {
      booking.brand = document.getElementById('bikeBrand')?.value || '';
      booking.model = document.getElementById('bikeModel')?.value || '';
      booking.fuel  = document.querySelector('input[name="fuel"]:checked')?.value || 'Petrol';
    }
    if (step === 3) {
      booking.date        = document.getElementById('serviceDate')?.value || '';
      booking.serviceType = document.querySelector('input[name="svcType"]:checked')?.value || 'doorstep';
    }
    if (step === 4) {
      booking.name     = document.getElementById('custName')?.value.trim() || '';
      booking.phone    = document.getElementById('custPhone')?.value.trim() || '';
      booking.email    = document.getElementById('custEmail')?.value.trim() || '';
      booking.address  = document.getElementById('custAddress')?.value.trim() || '';
      booking.landmark = document.getElementById('custLandmark')?.value.trim() || '';
      booking.notes    = document.getElementById('custNotes')?.value.trim() || '';
    }
  }

  /* ─── Option card selection ──────────────── */
  document.addEventListener('click', e => {
    // Service option cards
    if (e.target.closest('.option-card[data-service]')) {
      const card = e.target.closest('.option-card[data-service]');
      document.querySelectorAll('.option-card[data-service]').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      booking.service = card.dataset.service;
      booking.package = '';
      document.querySelectorAll('.option-card[data-pkg]').forEach(c => c.classList.remove('selected'));
    }
    // Package option cards
    if (e.target.closest('.option-card[data-pkg]')) {
      const card = e.target.closest('.option-card[data-pkg]');
      document.querySelectorAll('.option-card[data-pkg]').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      booking.package = card.dataset.pkg;
      booking.service = '';
      document.querySelectorAll('.option-card[data-service]').forEach(c => c.classList.remove('selected'));
    }
    // Time slots
    if (e.target.closest('.slot-btn')) {
      const btn = e.target.closest('.slot-btn');
      document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      booking.time = btn.dataset.time;
    }
  });

  /* ─── Pre-select from URL params ─────────── */
  function preselectFromParams() {
    if (booking.service) {
      const card = document.querySelector(`.option-card[data-service="${booking.service}"]`);
      card?.classList.add('selected');
    }
    if (booking.package) {
      const card = document.querySelector(`.option-card[data-pkg="${booking.package}"]`);
      card?.classList.add('selected');
    }
    if (booking.brand) {
      const sel = document.getElementById('bikeBrand');
      if (sel) sel.value = booking.brand;
    }
  }

  /* ─── Build summary (step 5) ─────────────── */
  function buildSummary() {
    const el = document.getElementById('bookingSummary');
    if (!el) return;
    const pkg    = booking.package || booking.service || '—';
    const priceMap = {
      'home-classic': '₹799', 'scooty-moped': '₹699', 'home-premium': '₹1,099',
      'royal-enfield': '₹1,899', 'superbike': '₹2,799',
      'Periodic Service': '₹499+', 'Engine Tuning': '₹699+', 'Brakes & Clutch': '₹399+',
      'Battery Service': '₹299+', 'Oil Change': '₹349+', 'Tyres': '₹499+',
      'Accident Repair': 'Custom', 'Roadside Assistance': '₹199+'
    };
    let price = priceMap[pkg] || '₹499+';
    let discountRow = '';
    
    // Apply Promo Discount Calculation
    if (booking.promoCode && price !== 'Custom') {
      const baseNum = parseInt(price.replace(/[^0-9]/g, ''));
      if (!isNaN(baseNum) && booking.discountAmount > 0) {
        const discounted = Math.max(0, baseNum - booking.discountAmount);
        const hasPlus = price.includes('+');
        price = `<span style="text-decoration:line-through;color:var(--text-muted);font-size:0.9rem;margin-right:8px">₹${baseNum}${hasPlus?'+':''}</span> ₹${discounted}${hasPlus?'+':''}`;
        discountRow = `<div class="summary-row" style="color:var(--success)"><span>🎫 Promo Applied (${booking.promoCode})</span><strong>- ₹${booking.discountAmount}</strong></div>`;
      }
    }
    
    booking.finalPriceDisplay = price;

    el.innerHTML = `
      <div class="summary-row"><span>🏍️ Bike</span><strong>${booking.brand} ${booking.model}</strong></div>
      <div class="summary-row"><span>⛽ Fuel</span><strong>${booking.fuel}</strong></div>
      <div class="summary-row"><span>🔧 Service</span><strong>${pkg}</strong></div>
      <div class="summary-row"><span>📅 Date & Time</span><strong>${booking.date} · ${booking.time}</strong></div>
      <div class="summary-row"><span>🏠 Service Type</span><strong style="text-transform:capitalize">${booking.serviceType}</strong></div>
      <div class="summary-row"><span>👤 Name</span><strong>${booking.name}</strong></div>
      <div class="summary-row"><span>📞 Phone</span><strong>${booking.phone}</strong></div>
      <div class="summary-row"><span>📍 Address</span><strong>${booking.address}${booking.landmark ? ' · ' + booking.landmark : ''}</strong></div>
      ${discountRow}
      <div class="summary-row summary-price"><span>💰 Estimated Price</span><strong style="color:var(--primary);font-size:1.2rem">${price}</strong></div>
    `;
  }

  /* ─── Promo Code Logic ───────────────────── */
  document.addEventListener('click', async (e) => {
    if (e.target.id === 'applyPromoBtn') {
      const input = document.getElementById('promoCodeInput').value.toUpperCase().trim();
      const msgEl = document.getElementById('promoMsg');
      const btn = e.target;
      
      if (!input) return;
      btn.textContent = '...';
      msgEl.style.display = 'none';

      let couponData = null;

      if (IS_MOCK_MODE) {
        const mockCoupons = JSON.parse(localStorage.getItem('bc_coupons') || '[]');
        couponData = mockCoupons.find(c => c.code === input && c.active);
      } else {
        try {
          const docSnap = await getDoc(doc(db, "coupons", input));
          if (docSnap.exists() && docSnap.data().active) couponData = docSnap.data();
        } catch(err) { console.error(err); }
      }

      btn.textContent = 'Apply';

      if (couponData) {
        msgEl.textContent = `Promo applied! ${couponData.type === 'percent' ? couponData.value + '% OFF' : '₹' + couponData.value + ' OFF'}`;
        msgEl.style.color = 'var(--success)';
        msgEl.style.display = 'block';
        
        booking.promoCode = input;
        
        // Compute flat discount to pass down. (If it's percentage, we calculate based on base price)
        const pkg = booking.package || booking.service || '—';
        const priceMap = {
          'home-classic': 799, 'scooty-moped': 699, 'home-premium': 1099,
          'royal-enfield': 1899, 'superbike': 2799,
          'Periodic Service': 499, 'Engine Tuning': 699, 'Brakes & Clutch': 399,
          'Battery Service': 299, 'Oil Change': 349, 'Tyres': 499, 'Roadside Assistance': 199
        };
        const basePrice = priceMap[pkg] || 499;

        if (couponData.type === 'percent') {
          booking.discountAmount = Math.round(basePrice * (couponData.value / 100));
        } else {
          booking.discountAmount = couponData.value;
        }
        
        buildSummary(); // Re-render summary
        
      } else {
        msgEl.textContent = "Invalid or expired promo code.";
        msgEl.style.color = 'var(--primary)';
        msgEl.style.display = 'block';
        booking.promoCode = '';
        booking.discountAmount = 0;
        buildSummary();
      }
    }
  });

  /* ─── Confirm → WhatsApp ─────────────────── */
  async function confirmBooking() {
    collectStep(4);
    const bookingId = 'BC' + Date.now().toString().slice(-6);

    // 1. Prepare Data
    const bookingData = {
      ...booking,
      id: bookingId,
      status: 'New', // Important for the Admin CRM
      createdAt: new Date().toISOString()
    };

    // 2. Save to Firebase (or fallback to localStorage if mock mode)
    try {
      if (!IS_MOCK_MODE) {
        await addDoc(collection(db, "bookings"), bookingData);
      } else {
        const prev = JSON.parse(localStorage.getItem('bc_bookings') || '[]');
        prev.push(bookingData);
        localStorage.setItem('bc_bookings', JSON.stringify(prev));
      }
    } catch (e) {
      console.error("Error saving booking: ", e);
      // Ensure we still fire WhatsApp even if DB fails
    }

    const msg = `🏍️ *New BikerClinic Booking*\n\n` +
      `*ID:* ${bookingId}\n` +
      `*Bike:* ${booking.brand} ${booking.model} (${booking.fuel})\n` +
      `*Service:* ${booking.package || booking.service}\n` +
      `*Date:* ${booking.date}\n` +
      `*Time:* ${booking.time}\n` +
      `*Type:* ${booking.serviceType}\n\n` +
      `*Customer:* ${booking.name}\n` +
      `*Phone:* ${booking.phone}\n` +
      `*Address:* ${booking.address}${booking.landmark ? ', ' + booking.landmark : ''}\n` +
      `*Promo:* ${booking.promoCode ? booking.promoCode + ' (-₹' + booking.discountAmount + ')' : 'None'}\n` +
      `*Notes:* ${booking.notes || 'None'}\n\n` +
      `_Sent via bikerclinic.com_`;

    const waUrl = `https://wa.me/916363681719?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    window.location.href = `confirmation.html?id=${bookingId}&name=${encodeURIComponent(booking.name)}&service=${encodeURIComponent(booking.package || booking.service)}`;
  }

  /* ─── Toast ──────────────────────────────── */
  function showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
  }

  /* ─── Wire up nav buttons ────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);
    preselectFromParams();
    goTo(1);

    // Set min date to today
    const dateInput = document.getElementById('serviceDate');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      dateInput.value = '';
    }
  });

})();
