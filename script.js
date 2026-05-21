/**
 * MakeEazy Landing Page V2 — Main Script
 * Handles: tracking, forms, animations, marquees, exit intent, video carousel
 */

(function() {
  'use strict';

  // ══════════════════════════════════════
  // CONFIG
  // ══════════════════════════════════════
  const SHEET_URL = 'https://script.google.com/macros/s/AKfycby9pAIIychTw-6ZtAbZTNUMAxS9QUxFF-enwF6-AyjNCMANqU-6xphN10bBQFXBsDBi/exec';
  const WA_NUMBER = '919992819995';
  const DEADLINE = new Date('2026-07-31T23:59:59+05:30');

  // ══════════════════════════════════════
  // UTILITY
  // ══════════════════════════════════════
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name) || '';
  }

  function getSessionId() {
    let sid = sessionStorage.getItem('me_sid');
    if (!sid) {
      sid = crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('me_sid', sid);
    }
    return sid;
  }

  function getDeviceType() {
    return /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
  }

  function getBrowser() {
    const match = navigator.userAgent.match(/(Chrome|Safari|Firefox|Edge|Opera)\/[\d.]+/);
    return match ? match[0] : 'Other';
  }

  // ══════════════════════════════════════
  // TRACKING — sendBeacon to Google Sheet
  // ══════════════════════════════════════
  function sendTrack(data) {
    try {
      data.page_url = location.href;
      data.user_agent = navigator.userAgent;
      const payload = JSON.stringify(data);
      if (navigator.sendBeacon) {
        // Use Blob with text/plain to avoid CORS preflight on Google Apps Script
        var blob = new Blob([payload], { type: 'text/plain' });
        navigator.sendBeacon(SHEET_URL, blob);
      } else {
        fetch(SHEET_URL, { method: 'POST', body: payload, keepalive: true, headers: { 'Content-Type': 'text/plain' } });
      }
    } catch(e) { /* silent */ }
  }

  function trackVisit() {
    sendTrack({
      action: 'page_view',
      page: location.pathname,
      referrer: document.referrer || 'direct',
      utm_source: getParam('utm_source'),
      utm_medium: getParam('utm_medium'),
      utm_campaign: getParam('utm_campaign'),
      device: getDeviceType(),
      browser: getBrowser(),
      screen: screen.width + 'x' + screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      session_id: getSessionId()
    });
  }

  function trackClick(eventName, label) {
    sendTrack({
      action: 'interaction',
      event: eventName,
      label: label || '',
      page: location.pathname,
      session_id: getSessionId()
    });
  }

  function trackLead(source, formData) {
    sendTrack({
      action: 'lead',
      source: source,
      name: formData.name || '',
      mobile: formData.mobile || '',
      need: formData.need || '',
      message: formData.message || '',
      referrer: document.referrer || 'direct',
      utm_source: getParam('utm_source'),
      utm_medium: getParam('utm_medium'),
      utm_campaign: getParam('utm_campaign'),
      device: getDeviceType(),
      session_id: getSessionId()
    });
  }

  // ══════════════════════════════════════
  // DEADLINE COUNTDOWN
  // ══════════════════════════════════════
  function updateCountdown() {
    const now = new Date();
    const diff = DEADLINE - now;
    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    const el = document.getElementById('daysLeft');
    if (el) el.textContent = days;
  }

  // ══════════════════════════════════════
  // NAVBAR
  // ══════════════════════════════════════
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    // Scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
      const scrollY = window.scrollY;
      if (scrollY > 60) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
      lastScroll = scrollY;
    }, { passive: true });

    // Hamburger
    if (hamburger) {
      hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
      });
    }

    // Close on link click
    document.querySelectorAll('.nav-links a').forEach(function(link) {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function(a) {
      a.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const offset = navbar.offsetHeight + 16;
          window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
        }
      });
    });
  }

  // ══════════════════════════════════════
  // STICKY MOBILE CTA
  // ══════════════════════════════════════
  function initStickyCta() {
    const sticky = document.getElementById('stickyCta');
    const hero = document.getElementById('hero');
    if (!sticky || !hero) return;

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          sticky.classList.remove('visible');
        } else {
          sticky.classList.add('visible');
        }
      });
    }, { threshold: 0 });

    observer.observe(hero);
  }

  // ══════════════════════════════════════
  // FORMS
  // ══════════════════════════════════════
  function initForms() {
    // Hero callback form
    const heroForm = document.getElementById('heroCallbackForm');
    if (heroForm) {
      heroForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const fd = new FormData(heroForm);
        const data = { name: fd.get('callbackName'), mobile: fd.get('callbackMobile') };

        if (data.mobile.length !== 10 || !/^\d{10}$/.test(data.mobile)) {
          alert('Please enter a valid 10-digit mobile number');
          return;
        }

        trackLead('hero_callback', data);
        heroForm.innerHTML = '<p class="form-success">✅ We\'ll call you shortly! Check your WhatsApp.</p>';
      });
    }

    // Final CTA callback form
    const finalForm = document.getElementById('finalCallbackForm');
    if (finalForm) {
      finalForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const fd = new FormData(finalForm);
        const data = {
          name: fd.get('name'),
          mobile: fd.get('mobile'),
          need: fd.get('need'),
          message: fd.get('message') || ''
        };

        if (data.mobile.length !== 10 || !/^\d{10}$/.test(data.mobile)) {
          alert('Please enter a valid 10-digit mobile number');
          return;
        }

        trackLead('final_callback', data);
        finalForm.innerHTML = '<p class="form-success">✅ Callback request received! Our expert will reach out within 2 hours.</p>';
      });
    }
  }

  // ══════════════════════════════════════
  // CTA CLICK TRACKING
  // ══════════════════════════════════════
  function initCtaTracking() {
    const trackables = [
      { id: 'heroPrimaryCta', event: 'hero_report_click' },
      { id: 'torCta', event: 'tor_report_click' },
      { id: 'finalReportCta', event: 'final_report_click' }
    ];

    trackables.forEach(function(t) {
      const el = document.getElementById(t.id);
      if (el) {
        el.addEventListener('click', function() {
          trackClick(t.event, el.textContent.trim());
        });
      }
    });

    // WhatsApp clicks
    document.querySelectorAll('a[href*="whatsapp"]').forEach(function(a) {
      a.addEventListener('click', function() {
        trackClick('whatsapp_click', 'whatsapp');
      });
    });

    // Persona card clicks
    document.querySelectorAll('.persona-cta').forEach(function(a) {
      a.addEventListener('click', function() {
        const title = a.closest('.persona-card').querySelector('.persona-title');
        trackClick('persona_click', title ? title.textContent : '');
      });
    });
  }

  // ══════════════════════════════════════
  // FAQ ACCORDION
  // ══════════════════════════════════════
  function initFaq() {
    document.querySelectorAll('.faq-question').forEach(function(q) {
      q.addEventListener('click', function() {
        const item = q.parentElement;
        const isOpen = item.classList.contains('open');

        // Close all
        document.querySelectorAll('.faq-item.open').forEach(function(open) {
          open.classList.remove('open');
          open.querySelector('.faq-toggle').textContent = '+';
        });

        // Toggle current
        if (!isOpen) {
          item.classList.add('open');
          q.querySelector('.faq-toggle').textContent = '−';
        }
      });
    });
  }

  // ══════════════════════════════════════
  // SCROLL ANIMATIONS (Intersection Observer)
  // ══════════════════════════════════════
  function initScrollAnimations() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-up').forEach(function(el) {
      observer.observe(el);
    });
  }

  // ══════════════════════════════════════
  // TAX OPTIMIZATION REPORT — Animated Numbers
  // ══════════════════════════════════════
  function initTorAnimations() {
    const torSection = document.querySelector('.tor-section');
    if (!torSection) return;

    let animated = false;
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !animated) {
          animated = true;
          animateScoreRing();
          animateCountups();
          animateInsightBars();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(torSection);
  }

  function animateScoreRing() {
    const fill = document.querySelector('.tor-score-fill');
    if (!fill) return;
    // circumference = 2 * PI * 52 = 326.7
    const circumference = 326.7;
    const target = 77; // score out of 100
    const offset = circumference - (target / 100) * circumference;
    fill.style.transition = 'stroke-dashoffset 1.5s ease-out';
    fill.style.strokeDashoffset = offset;
  }

  function animateCountups() {
    document.querySelectorAll('.tor-countup').forEach(function(el) {
      const target = parseInt(el.getAttribute('data-target'));
      const prefix = el.getAttribute('data-prefix') || '';
      const duration = 1500;
      const start = Date.now();

      function tick() {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const value = Math.round(target * eased);
        el.textContent = prefix + value.toLocaleString('en-IN');
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });

    // Score number
    const scoreNum = document.querySelector('.tor-score-num');
    if (scoreNum) {
      const target = parseInt(scoreNum.getAttribute('data-target'));
      const duration = 1500;
      const start = Date.now();
      function tick() {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        scoreNum.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }

  function animateInsightBars() {
    document.querySelectorAll('.tor-bar-fill').forEach(function(bar, i) {
      setTimeout(function() {
        bar.classList.add('animate');
      }, 300 + i * 200);
    });
  }

  // ══════════════════════════════════════
  // VIDEO CAROUSEL — Load from Google Sheet
  // ══════════════════════════════════════
  function initVideoCarousel() {
    const track = document.getElementById('videoTrack');
    const section = document.getElementById('videos');
    if (!track || !section) return;

    // Fetch videos from Google Sheet
    fetch(SHEET_URL + '?action=get_videos')
      .then(function(r) { return r.json(); })
      .then(function(videos) {
        if (!videos || !videos.length) return; // section stays hidden
        section.style.display = ''; // show section
        renderVideos(track, videos);
      })
      .catch(function() {
        // Section stays hidden on error
      });
  }

  function renderVideos(track, videos) {
    var html = '';
    var playBtn = '<div class="video-play-btn">'
      + '<svg viewBox="0 0 64 64" width="56" height="56">'
      + '<circle cx="32" cy="32" r="30" fill="rgba(0,0,0,0.55)" stroke="#fff" stroke-width="2"/>'
      + '<polygon points="26,20 26,44 46,32" fill="#fff"/>'
      + '</svg></div>';

    // Build cards
    function buildCard(v) {
      var thumb = v.thumbnail_url || v.thumb || '';
      if (!thumb && v.video_url) {
        var m = v.video_url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (m) thumb = 'https://img.youtube.com/vi/' + m[1] + '/hqdefault.jpg';
      }
      return '<div class="video-card" data-url="' + (v.video_url || '') + '">'
        + '<div class="video-thumb">'
        + '<img src="' + thumb + '" alt="' + (v.title || '') + '" loading="lazy">'
        + playBtn
        + '</div>'
        + '<div class="video-title">' + (v.title || '') + '</div>'
        + '</div>';
    }

    // Behaviour based on count
    var marquee = document.getElementById('videoMarquee');
    if (videos.length === 1) {
      // Single video — big, centered, no scroll
      html = buildCard(videos[0]);
      track.innerHTML = html;
      track.className = 'video-track video-single';
      track.style.animation = 'none';
      if (marquee) { marquee.style.maskImage = 'none'; marquee.style.webkitMaskImage = 'none'; }
    } else if (videos.length <= 3) {
      // 2-3 videos — grid, no scroll
      videos.forEach(function(v) { html += buildCard(v); });
      track.innerHTML = html;
      track.className = 'video-track video-track-grid';
      track.style.animation = 'none';
      if (marquee) { marquee.style.maskImage = 'none'; marquee.style.webkitMaskImage = 'none'; }
    } else {
      // 4+ videos — marquee scroll with duplicate set
      for (var set = 0; set < 2; set++) {
        videos.forEach(function(v) { html += buildCard(v); });
      }
      track.innerHTML = html;
    }

    // Click handler — open video in lightbox
    track.querySelectorAll('.video-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var url = card.getAttribute('data-url');
        if (url) {
          openVideoLightbox(url);
          trackClick('video_play', url);
        }
      });
    });
  }

  function openVideoLightbox(url) {
    // Extract YouTube video ID
    var match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (!match) { window.open(url, '_blank'); return; }

    // Remove any existing lightbox
    var existing = document.querySelector('.video-lightbox');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'video-lightbox';
    overlay.innerHTML = '<div class="video-lightbox-inner">'
      + '<button class="video-lightbox-close" aria-label="Close">&times;</button>'
      + '<iframe src="https://www.youtube.com/embed/' + match[1] + '?autoplay=1&rel=0&modestbranding=1&playsinline=1" '
      + 'frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" '
      + 'allowfullscreen></iframe>'
      + '</div>';

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Show with animation (after DOM paint)
    requestAnimationFrame(function() {
      overlay.classList.add('show');
    });

    function closeLightbox() {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
      // Remove iframe to stop playback
      var iframe = overlay.querySelector('iframe');
      if (iframe) iframe.src = '';
      setTimeout(function() { overlay.remove(); }, 200);
      document.removeEventListener('keydown', handleEsc);
    }

    // Click overlay or close button to close
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay || e.target.closest('.video-lightbox-close')) {
        closeLightbox();
      }
    });

    // ESC key to close
    function handleEsc(e) {
      if (e.key === 'Escape') closeLightbox();
    }
    document.addEventListener('keydown', handleEsc);
  }

  // ══════════════════════════════════════
  // EXIT INTENT
  // ══════════════════════════════════════
  function initExitIntent() {
    const popup = document.getElementById('exitPopup');
    const closeBtn = document.getElementById('exitPopupClose');
    if (!popup) return;

    let shown = false;

    document.addEventListener('mouseout', function(e) {
      if (e.clientY < 5 && !shown && !sessionStorage.getItem('me_exit_shown')) {
        shown = true;
        sessionStorage.setItem('me_exit_shown', '1');
        popup.classList.add('visible');
        trackClick('exit_intent_shown', 'exit');
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        popup.classList.remove('visible');
      });
    }

    popup.addEventListener('click', function(e) {
      if (e.target === popup) popup.classList.remove('visible');
    });
  }

  // ══════════════════════════════════════
  // MOBILE GAME FULLSCREEN
  // ══════════════════════════════════════
  function initMobileGame() {
    var playBtn = document.getElementById('gameMobilePlay');
    var overlay = document.getElementById('gameFullscreen');
    var closeBtn = document.getElementById('gameFullscreenClose');
    var frame = document.getElementById('gameFullscreenFrame');
    if (!playBtn || !overlay || !frame) return;

    playBtn.addEventListener('click', function() {
      frame.src = '/guide/play/';
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Try to lock to landscape for best experience
      try {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(function(){});
        }
      } catch(e) {}

      trackClick('game_play_mobile', 'fullscreen');
    });

    function closeGame() {
      overlay.classList.remove('active');
      frame.src = '';
      document.body.style.overflow = '';

      // Unlock orientation
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch(e) {}
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeGame);
    }

    // ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('active')) closeGame();
    });
  }

  // ══════════════════════════════════════
  // INIT
  // ══════════════════════════════════════
  document.addEventListener('DOMContentLoaded', function() {
    updateCountdown();
    initNavbar();
    initStickyCta();
    initForms();
    initCtaTracking();
    initFaq();
    initScrollAnimations();
    initTorAnimations();
    initVideoCarousel();
    initMobileGame();
    initExitIntent();
    trackVisit();
  });

})();
