/* Main interactive behaviors:
   - Mobile menu toggle
   - Theme toggle (persisted)
   - Smooth scroll for nav links
   - Reveal on scroll for cards
   - Gallery lightbox
   - Contact form validation with mailto fallback
*/

(() => {
  // DOM helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Elements
  const mobileBtn = $('#mobileMenuBtn');
  const mobileMenu = $('#mobileMenu');
  const themeToggle = $('#themeToggle');
  const body = document.documentElement;
  const navLinks = $$('.nav-link').concat($$('.mobile-link'));
  const galleryItems = $$('.gallery-item');
  const lightbox = $('#lightbox');
  const lightboxImg = $('.lightbox-img', lightbox);
  const lightboxCaption = $('.lightbox-caption', lightbox);
  const lightboxClose = $('.lightbox-close', lightbox);
  const contactForm = $('#contactForm');
  const formStatus = $('#formStatus');
  const yearEl = $('#year');

  // set year
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Mobile menu toggle ---
  mobileBtn?.addEventListener('click', () => {
    const expanded = mobileBtn.getAttribute('aria-expanded') === 'true';
    mobileBtn.setAttribute('aria-expanded', String(!expanded));
    if (mobileMenu.hasAttribute('hidden')) {
      mobileMenu.removeAttribute('hidden');
      mobileBtn.querySelector('i').dataset['feather'] = 'x';
    } else {
      mobileMenu.setAttribute('hidden', '');
      mobileBtn.querySelector('i').dataset['feather'] = 'menu';
    }
    if (window.feather) feather.replace();
  });

  // Close mobile menu on link click (and smooth scroll will handle navigation)
  $$('.mobile-link').forEach(a => a.addEventListener('click', () => {
    mobileMenu.setAttribute('hidden', '');
    mobileBtn.setAttribute('aria-expanded', 'false');
    mobileBtn.querySelector('i').dataset['feather'] = 'menu';
    if (window.feather) feather.replace();
  }));

  // --- Theme toggle with persistence ---
  const storageKey = 'aurora-theme';
  function applyTheme(theme) {
    if (theme === 'light') body.classList.add('light');
    else body.classList.remove('light');
    themeToggle.setAttribute('aria-pressed', theme === 'light');
    // update icon
    const iconName = theme === 'light' ? 'sun' : 'moon';
    themeToggle.querySelector('i').dataset['feather'] = iconName;
    if (window.feather) feather.replace();
  }

  // initial theme: check storage, then prefers-color-scheme
  const saved = localStorage.getItem(storageKey);
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(saved || (prefersLight ? 'light' : 'dark'));

  themeToggle?.addEventListener('click', () => {
    const isLight = body.classList.contains('light');
    const newTheme = isLight ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem(storageKey, newTheme);
  });

  // --- Smooth scroll for nav links ---
  function smoothScrollTo(hash) {
    const el = document.querySelector(hash);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // for accessibility: focus target
    setTimeout(() => el.focus({ preventScroll: true }), 600);
  }

  navLinks.forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      smoothScrollTo(href);
    });
  });

  // --- Reveal on scroll using IntersectionObserver ---
  const revealTargets = $$('article.card, .testimonial, .gallery-item, .hero-content');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('in-view');
    });
  }, { threshold: 0.12 });

  revealTargets.forEach(t => observer.observe(t));

  // --- Gallery lightbox ---
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const src = img.src;
      const caption = item.querySelector('figcaption')?.textContent || '';
      openLightbox(src, caption);
    });
  });

  function openLightbox(src, caption) {
    lightboxImg.src = src;
    lightboxImg.alt = caption;
    lightboxCaption.textContent = caption;
    lightbox.setAttribute('aria-hidden', 'false');
    // trap focus simply by focusing close button
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.getAttribute('aria-hidden') === 'false') closeLightbox();
  });

  // --- Contact form: client validation & mailto fallback ---
  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    formStatus.textContent = '';

    const name = contactForm.name.value.trim();
    const email = contactForm.email.value.trim();
    const message = contactForm.message.value.trim();

    // simple validation
    if (name.length < 2) return showStatus('Please provide your name (2+ characters).', true);
    if (!/^\S+@\S+\.\S+$/.test(email)) return showStatus('Please enter a valid email address.', true);
    if (message.length < 10) return showStatus('Message must be at least 10 characters.', true);

    // attempt to send via fetch to an endpoint (example) — since this is static, we fallback to mailto.
    // NOTE: Replace URL with your serverless endpoint if you have one.
    const payload = { name, email, message, date: new Date().toISOString() };

    // Simulate async submit with fetch to example endpoint (commented out). Use mailto fallback.
    // fetch('/api/contact', { method: 'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload)})
    //   .then(r => r.ok ? showStatus('Message sent! Thanks — I will reply shortly.') : showStatus('Failed to send. Try again later.', true))
    //   .catch(() => showStatus('Failed to send. Try again later.', true));

    // Mailto fallback:
    const subject = encodeURIComponent(`Contact from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
    const mailto = `mailto:hello@aurora.example?subject=${subject}&body=${body}`;

    // Open mail client in new window (some browsers require location.href)
    window.open(mailto, '_blank');
    showStatus('Opened your email client. Alternatively, replace mailto fallback with a server endpoint for in-page sends.');
    contactForm.reset();
  });

  function showStatus(msg, isError = false) {
    formStatus.textContent = msg;
    formStatus.style.color = isError ? '#ffb4b4' : 'var(--muted)';
  }

  // small accessibility: ensure focus outline visible when tabbing vs mouse
  function handleFirstTab(e){
    if (e.key === 'Tab') {
      document.documentElement.classList.add('user-is-tabbing');
      window.removeEventListener('keydown', handleFirstTab);
    }
  }
  window.addEventListener('keydown', handleFirstTab);
})();
