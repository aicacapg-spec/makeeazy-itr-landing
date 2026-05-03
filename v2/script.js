// ── MakeEazy Landing Page — Script ──

document.addEventListener('DOMContentLoaded', () => {

  // ── Navbar scroll effect ──
  const navbar = document.querySelector('.navbar');
  const handleScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });

  // ── Mobile hamburger ──
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  hamburger?.addEventListener('click', () => {
    navLinks.classList.toggle('mobile-open');
    hamburger.classList.toggle('active');
  });
  // Close mobile nav on link click
  navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('mobile-open');
      hamburger.classList.remove('active');
    });
  });

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ── Deadline countdown ──
  const daysLeftEl = document.getElementById('daysLeft');
  if (daysLeftEl) {
    const deadline = new Date(new Date().getFullYear(), 6, 31); // July 31
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    daysLeftEl.textContent = diff > 0 ? diff : 0;
    if (diff <= 15) {
      document.getElementById('deadlineCounter')?.classList.add('urgent');
    }
  }

  // ── Nav scroll-spy ──
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a');
  const spyScroll = () => {
    const scrollY = window.scrollY + 120;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navItems.forEach(a => {
          a.classList.remove('active');
          if (a.getAttribute('href') === `#${id}`) a.classList.add('active');
        });
      }
    });
  };
  window.addEventListener('scroll', spyScroll, { passive: true });

  // ── FAQ Accordion ──
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item').forEach(faq => {
        faq.classList.remove('open');
        faq.querySelector('.faq-answer').style.maxHeight = '0';
      });

      // Open clicked (if was closed)
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // ── Intersection Observer — fade-up animations ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  // ── Booking form ──
  const bookingForm = document.getElementById('bookingForm');
  const formContainer = document.getElementById('formContainer');
  const successState = document.getElementById('bookingSuccess');

  bookingForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(bookingForm);
    const data = Object.fromEntries(formData.entries());

    // Validate
    if (!data.name || !data.mobile || !data.email || !data.filingType) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(data.mobile)) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    // Simulate submission
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<span class="spinner"></span> Booking...';
    submitBtn.disabled = true;

    setTimeout(() => {
      formContainer.style.display = 'none';
      successState.classList.add('show');
      showToast('Appointment booked successfully!', 'success');

      // Scroll to success
      successState.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 1500);
  });

  // ── Toast notification ──
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span>${message}</span>
    `;
    Object.assign(toast.style, {
      position: 'fixed', top: '90px', right: '24px', zIndex: '9999',
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 24px', borderRadius: '12px',
      fontSize: '14px', fontWeight: '600', fontFamily: 'inherit',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      animation: 'slideIn 0.3s ease',
      background: type === 'success' ? '#22C55E' : type === 'error' ? '#EF4444' : '#32509F',
      color: '#FFFFFF',
    });
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Add toast animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; display: inline-block; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

  // ── Counter animations ──
  function animateCounter(el, target) {
    let current = 0;
    const increment = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current.toLocaleString('en-IN');
    }, 30);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.count);
        animateCounter(entry.target, target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

  // ── WhatsApp link — V2: links have href now, remove old click interceptors ──
  // WhatsApp links now use direct href attributes, no JS needed

  // ── Smooth scroll-to-booking ──
  document.querySelectorAll('.scroll-to-booking').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ── V2: Hero Form ──
  const heroForm = document.getElementById('heroForm');
  heroForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(heroForm);
    const data = Object.fromEntries(fd.entries());
    if (!data.heroName || !data.heroMobile || !data.heroNeed) {
      showToast('Please fill all fields', 'error'); return;
    }
    if (!/^[6-9]\d{9}$/.test(data.heroMobile)) {
      showToast('Please enter a valid 10-digit mobile number', 'error'); return;
    }
    // Pre-fill booking form below
    const bf = document.getElementById('bookingForm');
    if (bf) {
      bf.querySelector('#name').value = data.heroName;
      bf.querySelector('#mobile').value = data.heroMobile;
      bf.querySelector('#filingType').value = data.heroNeed;
    }
    showToast('Details captured! Complete your booking below.', 'success');
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  });

  // ── V2: Tax Profiler Form ──
  const profilerForm = document.getElementById('profilerForm');
  profilerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(profilerForm);
    const data = Object.fromEntries(fd.entries());
    if (!data.profilerName || !data.profilerEmail || !data.profilerPhone) {
      showToast('Please fill all fields', 'error'); return;
    }
    if (!/^[6-9]\d{9}$/.test(data.profilerPhone)) {
      showToast('Please enter a valid mobile number', 'error'); return;
    }
    // Store lead data (can be sent to backend later)
    console.log('Tax Profiler Lead:', data);
    showToast('Your Tax Profiler is ready! Opening in new tab...', 'success');
    // Redirect to taxanalyzer in new tab
    setTimeout(() => {
      window.open('https://taxanalyzer.makeeazy.in/', '_blank');
    }, 800);
    profilerForm.reset();
  });

  // ── V2: Exit Intent Popup ──
  const exitPopup = document.getElementById('exitPopup');
  const exitClose = document.getElementById('exitPopupClose');
  let exitShown = false;

  document.addEventListener('mouseleave', (e) => {
    if (e.clientY < 10 && !exitShown) {
      exitShown = true;
      exitPopup?.classList.add('show');
    }
  });

  exitClose?.addEventListener('click', () => {
    exitPopup?.classList.remove('show');
  });

  exitPopup?.addEventListener('click', (e) => {
    if (e.target === exitPopup) exitPopup.classList.remove('show');
  });

  const exitForm = document.getElementById('exitForm');
  exitForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(exitForm);
    const data = Object.fromEntries(fd.entries());
    if (!data.exitName || !data.exitEmail || !data.exitPhone || !data.exitTime) {
      showToast('Please fill all fields', 'error'); return;
    }
    console.log('Exit Lead:', data);
    showToast('Call scheduled! We\'ll reach out at your preferred time.', 'success');
    exitPopup?.classList.remove('show');
    exitForm.reset();
  });

});
