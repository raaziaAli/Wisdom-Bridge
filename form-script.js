/**
 * ═══════════════════════════════════════════════════════
 *  WisdomBridge — Form Submission (replace in index.html)
 *
 *  Find this line in your index.html:
 *    const MAKE_WEBHOOK_URL = 'PASTE_YOUR_MAKE_WEBHOOK_URL_HERE';
 *
 *  Replace that ENTIRE <script> block with this file's
 *  contents. Just swap the APPS_SCRIPT_URL value.
 * ═══════════════════════════════════════════════════════
 */

// ── PASTE YOUR DEPLOYED APPS SCRIPT URL HERE ──────────
// Looks like: https://script.google.com/macros/s/ABC.../exec
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx1GFEivaqGw-nWaNd6r7gTuJA4H1CmYPZgINl82CE8eOpneKkVh9xSmQ9wr0_y-rBD/exec';
// ───────────────────────────────────────────────────────

const SITE_URL = window.location.origin;

/* ── NAV SCROLL ── */
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 40);
});

/* ── SCROLL REVEAL ── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), e.target.dataset.delay || 0);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.step,.feature-card,.testimonial-card').forEach((el, i) => {
  el.dataset.delay = (i % 3) * 120;
  observer.observe(el);
});

/* ── TOGGLES ── */
function toggleExp(el)  { el.classList.toggle('active'); }
function toggleChip(el) { el.classList.toggle('active'); }

/* ── STATUS MESSAGES ── */
function showMsg(id) {
  document.querySelectorAll('.status-msg').forEach(m => m.style.display = 'none');
  if (id) document.getElementById(id).style.display = 'block';
}

/* ═══════════════════════════════════════════════════════
   FORM SUBMISSION
   Sends directly to Google Apps Script — no middleman
   ═══════════════════════════════════════════════════════ */
async function submitForm() {
  const fname   = document.getElementById('fname').value.trim();
  const email   = document.getElementById('email').value.trim();
  const age     = document.getElementById('age').value.trim();
  const phone   = document.getElementById('phone').value.trim();
  const country = document.getElementById('country').value;
  const role    = document.getElementById('role').value;
  const bio     = document.getElementById('bio').value.trim();

  /* Validate */
  if (!fname)  { alert('Please enter your name.');           document.getElementById('fname').focus();   return; }
  if (!email || !email.includes('@')) {
                 alert('Please enter a valid email address.'); document.getElementById('email').focus();  return; }
  if (!country){ alert('Please select your country.');                                                    return; }
  if (!role)   { alert('Please select your role.');                                                       return; }

  const expertise = [...document.querySelectorAll('.exp-btn.active')]
    .map(b => b.textContent.trim().replace(/^\S+\s/, '')).join(', ');
  const openTo = [...document.querySelectorAll('.open-chip.active')]
    .map(c => c.textContent.trim()).join(', ');

  const entry = {
    timestamp:  new Date().toISOString(),
    name:       fname,
    email:      email,
    age:        age     || '—',
    phone:      phone   || '—',
    country:    country,
    role:       role,
    expertise:  expertise || '—',
    open_to:    openTo    || '—',
    bio:        bio       || '—',
    source:     document.referrer || 'direct'
  };

  /* UI: loading */
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving…';
  showMsg('msg-saving');

  /* Always save locally as backup */
  const local = JSON.parse(localStorage.getItem('wb_waitlist') || '[]');
  local.push(entry);
  localStorage.setItem('wb_waitlist', JSON.stringify(local));

  /* Send to Google Apps Script */
  let cloudSaved = false;

  if (APPS_SCRIPT_URL && APPS_SCRIPT_URL !== 'PASTE_YOUR_APPS_SCRIPT_URL_HERE') {
    try {
      /*
       * WHY no-cors?
       * Google Apps Script doesn't send CORS headers on the response.
       * Using no-cors means we can't read the response — but the data
       * DOES arrive and gets saved. The form doesn't need to read the
       * response; it just needs to know the request was sent.
       */
      await fetch(APPS_SCRIPT_URL, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify(entry)
      });
      cloudSaved = true;
    } catch (err) {
      console.warn('Apps Script send failed — saved locally:', err);
    }
  }

  /* Reset UI */
  btn.disabled = false;
  btn.innerHTML = 'Join WisdomBridge →';
  showMsg(null);

  /* Show success — works whether cloud saved or local only */
  showSuccess(fname);
}

function showSuccess(name) {
  document.getElementById('form-view').style.display = 'none';
  document.getElementById('success-view').style.display = 'block';

  const url = encodeURIComponent(SITE_URL);
  const msg = encodeURIComponent(
    `I just joined WisdomBridge — connecting retired professionals with young people worldwide. Join me: ${SITE_URL}`
  );
  document.getElementById('share-li').href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  document.getElementById('share-wa').href = `https://wa.me/?text=${msg}`;

  document.getElementById('signup').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function copyLink() {
  navigator.clipboard.writeText(SITE_URL).then(() => {
    const btn = document.querySelector('.share-copy');
    btn.textContent = '✓ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy link', 2500);
  });
}

/* ── CHECK IF ALREADY SIGNED UP ── */
window.addEventListener('load', () => {
  const list = JSON.parse(localStorage.getItem('wb_waitlist') || '[]');
  if (list.length > 0) showSuccess(list[list.length - 1].name);
});

/* ── SERVICE WORKER ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

/* ── ANDROID INSTALL PROMPT ── */
let deferredPrompt;
const installBanner = document.getElementById('install-banner');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  setTimeout(() => {
    installBanner.style.transform = 'translateX(-50%) translateY(0)';
    installBanner.style.opacity = '1';
  }, 5000);
});

document.getElementById('install-btn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBanner.style.opacity = '0';
});

document.getElementById('dismiss-install').addEventListener('click', () => {
  installBanner.style.opacity = '0';
});

/* ── iOS INSTALL HINT ── */
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
if (isIOS && !isStandalone) {
  setTimeout(() => {
    document.getElementById('ios-hint').style.display = 'block';
  }, 8000);
}
