/* ============================================
   BIKERCLINIC — MAIN.JS
   Global scripts: navbar, scroll reveal,
   animated counters, mobile menu, etc.
   ============================================ */

(function () {
  'use strict';

  /* ── Navbar ──────────────────────────────── */
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  const scrollTopBtn = document.getElementById('scrollTop');

  function handleScroll() {
    const y = window.scrollY;
    if (navbar) navbar.classList.toggle('scrolled', y > 40);
    if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', y > 400);
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
    });
    // Close when a link is clicked
    mobileNav.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
      })
    );
  }

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: 'smooth' })
    );
  }

  /* ── Set active nav link ─────────────────── */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ── Scroll Reveal ───────────────────────── */
  function initReveal() {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if (!els.length) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(el => observer.observe(el));
  }
  initReveal();

  /* ── Animated Counters ───────────────────── */
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const duration = 2000;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = target * eased;
      el.textContent = prefix + (Number.isInteger(target) ? Math.floor(val) : val.toFixed(1)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-target]');
    if (!counters.length) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => observer.observe(c));
  }
  initCounters();

  /* ── Testimonials Carousel ───────────────── */
  function initTestimonials() {
    const track = document.querySelector('.testimonials-track');
    const prevBtn = document.getElementById('prevTestimonial');
    const nextBtn = document.getElementById('nextTestimonial');
    if (!track) return;
    const cardW = 340 + 24; // card width + gap
    prevBtn && prevBtn.addEventListener('click', () => track.scrollBy({ left: -cardW, behavior: 'smooth' }));
    nextBtn && nextBtn.addEventListener('click', () => track.scrollBy({ left:  cardW, behavior: 'smooth' }));
  }
  initTestimonials();

  /* ── Booking Widget → redirect to booking.html ── */
  const widgetForm = document.getElementById('heroBookingForm');
  if (widgetForm) {
    widgetForm.addEventListener('submit', e => {
      e.preventDefault();
      const brand   = document.getElementById('wBrand')?.value || '';
      const service = document.getElementById('wService')?.value || '';
      const params  = new URLSearchParams({ brand, service });
      window.location.href = `booking.html?${params}`;
    });
  }

  /* ── Service cards → booking page ───────── */
  document.querySelectorAll('.service-card[data-service]').forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = `booking.html?service=${encodeURIComponent(card.dataset.service)}`;
    });
  });

  /* ── Package CTAs ────────────────────────── */
  document.querySelectorAll('.pkg-book-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = `booking.html?package=${encodeURIComponent(btn.dataset.pkg)}`;
    });
  });

  /* ── Coupon copy ─────────────────────────── */
  document.querySelectorAll('.coupon-box').forEach(box => {
    box.addEventListener('click', () => {
      const code = box.querySelector('.coupon-code')?.textContent;
      if (!code) return;
      navigator.clipboard.writeText(code).catch(() => {});
      const orig = box.querySelector('.copy-hint');
      if (orig) { orig.textContent = '✅ Copied!'; setTimeout(() => (orig.textContent = '📋 Tap to copy'), 2000); }
    });
  });

})();
