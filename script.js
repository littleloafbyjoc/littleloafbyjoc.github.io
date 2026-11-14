// little loaf by joc: small helpers. The site works without any of this.

// Phone menu open/close
const toggle = document.querySelector('.nav-toggle');
const links = document.getElementById('nav-links');

function closeMenu() {
  links.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open menu');
}

toggle.addEventListener('click', () => {
  const open = links.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
links.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

// Fade sections in as they scroll into view
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach((el) => revealObserver.observe(el));

  // Highlight the current section in the top bar
  const navLinks = [...document.querySelectorAll('.nav-links a:not(.btn)')];
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((a) => {
    const section = document.querySelector(a.getAttribute('href'));
    if (section) sectionObserver.observe(section);
  });
} else {
  reveals.forEach((el) => el.classList.add('is-visible'));
}

// Keep the footer year current
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- order form ----------
const form = document.querySelector('.order-form');
if (form) {
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');
  const success = document.querySelector('.form-success');
  const dateInput = form.querySelector('#f-date');

  // Keep the form out of sight until its Web3Forms access key is filled in
  if (form.access_key.value === 'YOUR_ACCESS_KEY') {
    document.getElementById('order-form').hidden = true;
  }

  // Earliest pickup is 2 days from today (every loaf is made to order)
  const earliest = new Date();
  earliest.setDate(earliest.getDate() + 2);
  const pad = (n) => String(n).padStart(2, '0');
  dateInput.min = `${earliest.getFullYear()}-${pad(earliest.getMonth() + 1)}-${pad(earliest.getDate())}`;

  form.addEventListener('input', (e) => e.target.classList.remove('is-invalid'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';

    // Friendly validation
    let firstBad = null;
    form.querySelectorAll('input, select, textarea').forEach((el) => {
      const bad = !el.checkValidity();
      el.classList.toggle('is-invalid', bad);
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      status.textContent = firstBad === dateInput && dateInput.value
        ? "please pick a date at least 2 days from now, since every loaf is made fresh."
        : 'please fill in the highlighted fields.';
      firstBad.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    if (data.access_key === 'YOUR_ACCESS_KEY') {
      status.textContent = "the order form isn't connected yet. please dm on instagram for now!";
      return;
    }

    button.disabled = true;
    button.textContent = 'sending...';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'send failed');
      form.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ block: 'center' });
    } catch (err) {
      status.textContent = "hmm, that didn't send. please try again, or dm me on instagram instead.";
      button.disabled = false;
      button.textContent = 'send my order ♡';
    }
  });
}
