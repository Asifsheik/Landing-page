// ==========================================================
// Contact form -> Google Sheet (via Google Apps Script)
// ==========================================================

// 1) Deploy google-apps-script/Code.gs as a Web App (see SETUP.md)
// 2) Paste the Web App URL (ends with /exec) between the quotes below
var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxqdNPXquOHnse1nvwRteCtbgRYwAJksvdEFDXR2eC3qVBwc-DZEpnLAJ7o-DMvOzVG/exec';

(function () {
  var form = document.getElementById('contactForm');
  var submitBtn = document.getElementById('submitBtn');
  var statusEl = document.getElementById('formStatus');
  var counter = document.getElementById('charCounter');
  var message = document.getElementById('messageBody');
  var toast = document.getElementById('toast');
  var toastTimer = null;
  var MIN_SECONDS = 3; // forms submitted faster than this are treated as bots
  var loadedAt = Date.now();

  // ---------- Character counter ----------
  message.addEventListener('input', function () {
    counter.textContent = message.value.length + ' / 800';
  });

  // ---------- Validation ----------
  var rules = {
    fullName: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your full name.'; },
    emailAddress: function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.';
    },
    messageBody: function (v) { return v.trim().length >= 10 ? '' : 'Please write at least 10 characters.'; }
  };

  function validateField(name) {
    var input = form.elements[name];
    var error = rules[name](input.value);
    var errEl = document.getElementById('err-' + name);
    errEl.textContent = error;
    input.closest('.input-wrap').classList.toggle('is-invalid', !!error);
    input.setAttribute('aria-invalid', error ? 'true' : 'false');
    return !error;
  }

  Object.keys(rules).forEach(function (name) {
    var input = form.elements[name];
    input.addEventListener('blur', function () { validateField(name); });
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') validateField(name);
    });
  });

  // ---------- UI helpers ----------
  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.classList.toggle('is-loading', loading);
    submitBtn.querySelector('.btn__label').textContent = loading ? 'Sending…' : 'Send message';
    submitBtn.querySelector('.btn__icon').textContent = loading ? 'progress_activity' : 'send';
  }

  function showToast(ok, title, text) {
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastText').textContent = text;
    document.getElementById('toastIcon').textContent = ok ? 'check_circle' : 'error';
    toast.classList.toggle('toast--error', !ok);
    toast.hidden = false;
    // next frame so the transition runs
    requestAnimationFrame(function () { toast.classList.add('is-visible'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () { toast.hidden = true; }, 400);
    }, 5000);
  }

  // ---------- Submit ----------
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.textContent = '';

    var allValid = Object.keys(rules).map(validateField).every(Boolean);
    if (!allValid) {
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    // Spam protection: honeypot filled, or submitted too quickly
    if (form.elements.website.value || (Date.now() - loadedAt) / 1000 < MIN_SECONDS) {
      showToast(true, 'Message received', 'Asif will reply within 24 hours.');
      form.reset();
      return;
    }

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.indexOf('PASTE_YOUR') === 0) {
      statusEl.textContent = 'The form is not connected yet. Add your Google Apps Script URL in contact.js.';
      statusEl.className = 'form-status is-error';
      return;
    }

    var data = new URLSearchParams(new FormData(form));
    data.delete('website');
    data.append('page', window.location.href);

    setLoading(true);

    // no-cors: Apps Script does not send CORS headers, so the response is opaque.
    // The request still reaches the script and the row is added to the sheet.
    fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: data })
      .then(function () {
        form.reset();
        counter.textContent = '0 / 800';
        form.querySelectorAll('.is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });
        statusEl.className = 'form-status is-success';
        statusEl.textContent = 'Thanks! Your message was sent.';
        showToast(true, 'Message received', 'Asif will reply within 24 hours.');
      })
      .catch(function () {
        statusEl.className = 'form-status is-error';
        statusEl.textContent = 'Something went wrong. Please try again, or email asifshaikemail@gmail.com.';
        showToast(false, 'Could not send', 'Check your connection and try again.');
      })
      .then(function () { setLoading(false); });
  });
})();