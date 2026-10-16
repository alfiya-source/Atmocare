/* Contact page: validates the enquiry form (including the "Enter the Code" check) and posts every field to the form's
   data-endpoint. No endpoint configured = the form says so after validating; it never shows a fake success.
   CAPTCHA: the code below is drawn on the page so the field works now. It keeps casual spam out but is not bot
   protection; for that, swap [data-captcha] for a provider widget (reCAPTCHA / Turnstile) and verify its token server-side. */
(() => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[type="submit"]');
  const fields = [...form.querySelectorAll('.field__input[required]')];
  const codeEl = form.querySelector('[data-captcha-code]');
  const codeInput = form.querySelector('#cf-code');

  // captcha: five characters without look-alikes (no 0/O, 1/I/L)
  const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  const newCode = () => {
    code = Array.from({ length: 5 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
    codeEl.textContent = code;
    codeEl.setAttribute('aria-label', 'Security code: ' + code.split('').join(' '));
  };
  newCode();
  form.querySelector('[data-captcha-refresh]').addEventListener('click', () => {
    newCode();
    codeInput.value = '';
    codeInput.focus();
  });

  const say = (msg, tone) => {
    status.textContent = msg;
    status.dataset.tone = tone;
    status.hidden = false;
  };

  const check = input => {
    let ok = input.checkValidity() && input.value.trim() !== '';
    if (input === codeInput) ok = input.value.trim().toUpperCase() === code;
    const err = document.getElementById(input.id + '-err');
    input.setAttribute('aria-invalid', String(!ok));
    if (err) {
      err.hidden = ok;
      if (ok) input.removeAttribute('aria-describedby');
      else input.setAttribute('aria-describedby', err.id);
    }
    return ok;
  };

  // errors show once a field has been left, then update as the visitor types
  fields.forEach(input => {
    input.addEventListener('blur', () => { if (input.value) check(input); });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') check(input); });
  });
  // phone: digits, spaces and + only
  const phone = form.querySelector('#cf-phone');
  phone.addEventListener('input', () => { phone.value = phone.value.replace(/[^0-9+ ]/g, ''); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const bad = fields.filter(input => !check(input));
    if (bad.length) {
      bad[0].focus();
      say('Please check the highlighted fields.', 'error');
      return;
    }
    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      say('This form isn’t connected yet. Please email info@atmocare.com or call +971 4 591 7113.', 'error');
      return;
    }
    const data = new FormData(form);
    data.delete('captcha');
    submit.disabled = true;
    say('Sending…', 'info');
    try {
      const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      fields.forEach(input => input.removeAttribute('aria-invalid'));
      newCode();
      say('Thank you. Your enquiry has been sent and our team will be in touch shortly.', 'success');
    } catch {
      say('Sorry, your enquiry couldn’t be sent. Please try again, or email info@atmocare.com.', 'error');
    } finally {
      submit.disabled = false;
    }
  });
})();
