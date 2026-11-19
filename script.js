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
// Each order goes two places:
//   1. an email to the bakery inbox (Web3Forms; the key is in index.html)
//   2. a new row in the orders Google Sheet (paste the Apps Script web app URL below)
// google-sheets-setup.md explains how to get that URL.
const SHEETS_URL = '';

const form = document.querySelector('.order-form');
if (form) {
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');
  const success = document.querySelector('.form-success');
  const dateInput = form.querySelector('#f-date');
  const loafList = form.querySelector('.loaf-list');
  const rowTemplate = document.getElementById('loaf-row');
  const addLoafBtn = form.querySelector('.add-loaf');
  const totalLine = form.querySelector('.loaf-total');

  // Keep the form out of sight until its Web3Forms access key is filled in
  if (form.access_key.value === 'YOUR_ACCESS_KEY') {
    document.getElementById('order-form').hidden = true;
  }

  // Earliest pickup is 2 days from today (every loaf is made to order)
  const earliest = new Date();
  earliest.setDate(earliest.getDate() + 2);
  const pad = (n) => String(n).padStart(2, '0');
  dateInput.min = `${earliest.getFullYear()}-${pad(earliest.getMonth() + 1)}-${pad(earliest.getDate())}`;

  // ----- loaf rows -----
  let rowCount = 0;

  function addLoafRow(focus) {
    rowCount += 1;
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.querySelectorAll('label').forEach((label) => {
      const control = label.nextElementSibling;
      control.id = `${control.name}-${rowCount}`;
      label.htmlFor = control.id;
    });
    loafList.appendChild(row);
    refreshRows();
    if (focus) row.querySelector('select').focus();
  }

  function refreshRows() {
    const rows = [...loafList.children];
    rows.forEach((row, i) => {
      row.querySelector('label').textContent = rows.length > 1 ? `loaf ${i + 1}` : 'which loaf?';
      row.querySelector('.remove-loaf').hidden = rows.length === 1;
    });
    updateTotal();
  }

  function readLoaves() {
    return [...loafList.children].map((row) => {
      const option = row.querySelector('select').selectedOptions[0];
      return {
        loaf: option ? option.value : '',
        price: option && option.dataset.price ? Number(option.dataset.price) : null,
        qty: Math.max(1, parseInt(row.querySelector('input').value, 10) || 1),
      };
    }).filter((l) => l.loaf);
  }

  function totalText(loaves) {
    if (!loaves.length) return '';
    const fixed = loaves.filter((l) => l.price !== null).reduce((sum, l) => sum + l.price * l.qty, 0);
    const hasCustom = loaves.some((l) => l.price === null);
    if (!fixed) return hasCustom ? 'custom pricing' : '';
    return `$${fixed}${hasCustom ? ' + custom loaf pricing' : ''}`;
  }

  function updateTotal() {
    const text = totalText(readLoaves());
    totalLine.textContent = text ? `estimated total: ${text}` : '';
  }

  addLoafBtn.addEventListener('click', () => addLoafRow(true));
  loafList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.remove-loaf');
    if (!removeBtn) return;
    loafList.removeChild(removeBtn.closest('.loaf-row'));
    refreshRows();
    loafList.querySelector('select').focus();
  });
  loafList.addEventListener('input', updateTotal);
  loafList.addEventListener('change', updateTotal);
  addLoafRow(false);

  // ----- sending -----
  form.addEventListener('input', (e) => e.target.classList.remove('is-invalid'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    if (form.botcheck.checked) return; // only spam bots tick the hidden box

    // Friendly validation
    let firstBad = null;
    form.querySelectorAll('input:not([type=hidden]):not(.hp), select, textarea').forEach((el) => {
      const bad = !el.checkValidity();
      el.classList.toggle('is-invalid', bad);
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      status.textContent = firstBad === dateInput && dateInput.value
        ? 'please pick a date at least 2 days from now, since every loaf is made fresh.'
        : 'please fill in the highlighted fields.';
      firstBad.focus();
      return;
    }

    const loaves = readLoaves();
    const order = {
      name: form.elements.name.value.trim(),
      contact: form.contact.value.trim(),
      loaves: loaves.map((l) => `${l.qty} × ${l.loaf}`).join('\n'),
      estimated_total: totalText(loaves),
      pickup_date: dateInput.value,
      notes: form.notes.value.trim(),
    };
    // how many of each flavor, so the sheet shows what to bake
    const count = (name) => loaves.filter((l) => l.loaf === name).reduce((n, l) => n + l.qty, 0);

    button.disabled = true;
    button.textContent = 'sending...';

    // Google Sheet: Google doesn't let the page read its reply, so this is fire-and-forget
    if (SHEETS_URL) {
      fetch(SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          ...order,
          classic: count('classic sourdough'),
          cinnamon_raisin: count('cinnamon raisin'),
          jalapeno_cheddar: count('jalapeño cheddar'),
          custom: count('custom specialty loaf'),
        }),
      }).catch(() => {});
    }

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: form.access_key.value,
          subject: form.subject.value,
          from_name: form.from_name.value,
          ...order,
        }),
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
