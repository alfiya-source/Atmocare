/* Contact page: validates the enquiry form and posts every field (requirement type included) to the form's data-endpoint.
   No endpoint configured = the form says so after validating; it never shows a fake success.
   CAPTCHA: no provider is configured. Mount the provider widget in [data-captcha-slot] and append its token below. */
(() => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[type="submit"]');
  const fields = [...form.querySelectorAll('.field__input[required]')];

  const say = (msg, tone) => {
    status.textContent = msg;
    status.dataset.tone = tone;
    status.hidden = false;
  };

  const check = input => {
    const ok = input.checkValidity() && input.value.trim() !== '';
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
      say('This form isn’t connected yet. Please email info@atmocare.com or call +971 4 256 52 44.', 'error');
      return;
    }
    const data = new FormData(form);
    // CAPTCHA: data.append('captcha_token', <provider token>) once a provider is set up
    submit.disabled = true;
    say('Sending…', 'info');
    try {
      const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      fields.forEach(input => input.removeAttribute('aria-invalid'));
      say('Thank you. Your enquiry has been sent and our team will be in touch shortly.', 'success');
    } catch {
      say('Sorry, your enquiry couldn’t be sent. Please try again, or email info@atmocare.com.', 'error');
    } finally {
      submit.disabled = false;
    }
  });
})();
