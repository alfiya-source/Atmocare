/* Guest checkout: shows the cart (main.js → window.AtmoCart) in the order summary with coupon, shipping and VAT,
   validates the billing / shipping fields and the terms checkbox and, on Place Order, posts every field (payment method,
   coupon and totals included) plus the cart (JSON) to the form's data-endpoint.
   No endpoint / payment provider configured = it says so after validating; it never fakes an order. */
(() => {
  const root = document.querySelector('[data-checkout]');
  if (!root || !window.AtmoCart) return;
  const $ = (s, c = root) => c.querySelector(s);
  const form = $('[data-checkout-form]');
  const status = $('[data-form-status]');
  const submit = $('[type="submit"][form="co-form"]');
  const fields = [...form.querySelectorAll('.field__input[required]')];
  const VAT_RATE = 0.05; // UAE VAT, added on top of the item prices (after any coupon)
  const SHIPPING = null; // AED amount once rates are known (0 = Free); null shows "To be confirmed"
  // COUPONS: none exist yet. Add codes here as CODE: { percent: 10 } or CODE: { amount: 50 } (AED off), or check them on the server.
  const COUPONS = {};
  let coupon = null;
  const terms = $('[data-terms]');
  const fmt = n => 'AED ' + n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });

  /* ---------- order summary ---------- */
  const tpl = document.getElementById('co-item');
  const render = () => {
    const items = window.AtmoCart.read();
    $('[data-co-empty]').hidden = items.length > 0;
    $('[data-co-filled]').hidden = items.length === 0;
    $('[data-co-items]').replaceChildren(...items.map(item => {
      const li = tpl.content.firstElementChild.cloneNode(true);
      const img = $('[data-item-img]', li);
      if (item.img) img.src = item.img; else img.remove();
      $('[data-item-qty]', li).textContent = `Quantity: ${item.qty}`;
      $('[data-item-name]', li).textContent = item.name;
      $('[data-item-type]', li).textContent = item.type;
      $('[data-item-each]', li).textContent = `${fmt(item.price)} each`;
      $('[data-item-total]', li).textContent = fmt(item.price * item.qty);
      return li;
    }));
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const round = n => Math.round(n * 100) / 100;
    const rule = coupon && COUPONS[coupon];
    const discount = rule ? round(Math.min(total, rule.percent ? total * rule.percent / 100 : rule.amount || 0)) : 0;
    const shipping = SHIPPING ?? 0;
    const vat = round((total - discount + shipping) * VAT_RATE);
    const grand = round(total - discount + shipping + vat);
    $('[data-sum-subtotal]').textContent = fmt(total);
    $('[data-sum-discount-row]').hidden = !discount;
    $('[data-sum-coupon]').textContent = coupon ? `(${coupon})` : '';
    $('[data-sum-discount]').textContent = '− ' + fmt(discount);
    $('[data-sum-shipping]').textContent = SHIPPING === null ? 'To be confirmed' : SHIPPING === 0 ? 'Free' : fmt(SHIPPING);
    $('[data-sum-vat]').textContent = fmt(vat);
    $('[data-sum-total]').textContent = fmt(grand);
    $('[data-co-coupon]').value = coupon || '';
    $('[data-co-discount]').value = discount.toFixed(2);
    $('[data-co-vat]').value = vat.toFixed(2);
    $('[data-co-total]').value = grand.toFixed(2);
    $('[data-co-cart]').value = JSON.stringify(items.map(({ name, type, price, qty }) => ({ name, type, price, qty })));
  };
  render();
  window.addEventListener('storage', render);

  /* ---------- coupon code (optional) ---------- */
  const couponInput = $('[data-coupon-input]');
  const couponBtn = $('[data-coupon-apply]');
  const couponMsg = $('[data-coupon-msg]');
  const couponSay = (msg, tone) => { couponMsg.textContent = msg; couponMsg.dataset.tone = tone; couponMsg.hidden = !msg; };
  const applyCoupon = () => {
    if (coupon) { // button reads Remove while a code is applied
      coupon = null;
      couponInput.value = '';
      couponInput.disabled = false;
      couponBtn.textContent = 'Apply';
      couponSay('', '');
      render();
      couponInput.focus();
      return;
    }
    const code = couponInput.value.trim().toUpperCase();
    if (!code) { couponInput.focus(); return; }
    if (!COUPONS[code]) { couponSay('This coupon code isn’t valid.', 'error'); return; }
    coupon = code;
    couponInput.value = code;
    couponInput.disabled = true;
    couponBtn.textContent = 'Remove';
    couponSay(`Coupon ${code} applied.`, 'success');
    render();
  };
  couponBtn.addEventListener('click', applyCoupon);
  couponInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } });
  couponInput.addEventListener('input', () => { if (couponMsg.dataset.tone === 'error') couponSay('', ''); });

  /* ---------- validation (same behaviour as the contact form) ---------- */
  const say = (msg, tone) => { status.textContent = msg; status.dataset.tone = tone; status.hidden = false; };
  const check = input => {
    const ok = input.checkValidity() && input.value.trim() !== '';
    const err = document.getElementById(input.id + '-err');
    input.setAttribute('aria-invalid', String(!ok));
    if (err) {
      err.hidden = ok;
      if (ok) input.removeAttribute('aria-describedby'); else input.setAttribute('aria-describedby', err.id);
    }
    return ok;
  };
  fields.forEach(input => {
    input.addEventListener('blur', () => { if (input.value && !input.matches(':disabled')) check(input); });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') check(input); });
    input.addEventListener('change', () => { if (input.getAttribute('aria-invalid') === 'true') check(input); });
  });
  // phones: digits, spaces and + only
  form.querySelectorAll('input[type="tel"]').forEach(tel => tel.addEventListener('input', () => { tel.value = tel.value.replace(/[^0-9+ ]/g, ''); }));

  /* ---------- shipping: "Ship to billing address" / "Ship to a different address" tick boxes (one at a time);
     the shipping fields show only for a different address (disabled = not validated or sent) ---------- */
  const shipFields = $('[data-ship-fields]');
  root.querySelectorAll('[data-ship-option]').forEach(opt => opt.addEventListener('change', () => {
    const on = opt.value === 'different';
    shipFields.hidden = !on;
    shipFields.disabled = !on;
    if (on) shipFields.querySelector('.field__input').focus();
    else shipFields.querySelectorAll('[aria-invalid]').forEach(i => { i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); const err = document.getElementById(i.id + '-err'); if (err) err.hidden = true; });
  }));

  /* ---------- terms checkbox ---------- */
  const checkTerms = () => {
    $('#co-terms-err').hidden = terms.checked;
    terms.setAttribute('aria-invalid', String(!terms.checked));
    return terms.checked;
  };
  terms.addEventListener('change', () => { if (terms.getAttribute('aria-invalid') === 'true') checkTerms(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const bad = fields.filter(input => !input.matches(':disabled')).filter(input => !check(input));
    if (!checkTerms()) bad.push(terms);
    if (bad.length) {
      bad[0].focus();
      say('Please check the highlighted fields.', 'error');
      return;
    }
    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      say('Online checkout isn’t connected yet. Please call +971 4 256 52 44 or email info@atmocare.com to place your order.', 'error');
      return;
    }
    submit.disabled = true;
    say('Placing your order…', 'info');
    try {
      const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.status);
      // CARD: once a payment provider is set up, hand over to it here (payment_method === 'card'), then to a confirmation page.
      window.AtmoCart.write([]);
      say('Thank you. Your order has been placed and a confirmation is on its way to your email.', 'success');
      showPaySuccess();
    } catch {
      if (new FormData(form).get('payment_method') === 'card') location.href = 'payment-failed.html';
      else say('Sorry, your order couldn’t be placed. Please try again, or call +971 4 256 52 44.', 'error');
    } finally {
      submit.disabled = false;
    }
  });

  /* ---------- payment success pop-up ---------- */
  const pop = document.querySelector('[data-pay-success]');
  const showPaySuccess = () => pop.showModal();
  pop.querySelector('[data-pay-close]').addEventListener('click', () => pop.close());
  pop.addEventListener('click', e => { if (e.target === pop) pop.close(); }); // click on the backdrop
  if (location.hash === '#payment-success') showPaySuccess(); // preview
})();
