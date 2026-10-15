/* Product detail: gallery thumbnails, colour swatches (jump to that colour's photos), quantity stepper, share links,
   and Buy Now. Add to Cart itself is handled by main.js, which reads the chosen colour and quantity. */
(() => {
  const root = document.querySelector('[data-product-info]');
  if (!root) return;
  const $ = (s, c = root) => c.querySelector(s);
  const $$ = (s, c = root) => [...c.querySelectorAll(s)];

  /* ---------- gallery ---------- */
  const main = $('[data-gallery-img]');
  const thumbs = $$('[data-thumb]');
  const show = thumb => {
    if (main.getAttribute('src') !== thumb.dataset.thumb) {
      main.classList.remove('is-swapping');
      void main.offsetWidth; // restart the fade
      main.classList.add('is-swapping');
      main.src = thumb.dataset.thumb;
      main.alt = thumb.dataset.alt;
    }
    thumbs.forEach(t => (t === thumb ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current')));
  };
  thumbs.forEach(t => t.addEventListener('click', () => {
    show(t);
    const radio = $(`input[name="colour"][data-colour="${t.dataset.colour}"]`);
    if (radio && !radio.checked) { radio.checked = true; paintColour(radio); }
  }));

  /* ---------- colour ---------- */
  const colourName = $('[data-colour-name]');
  const paintColour = radio => { colourName.textContent = radio.value; };
  $$('input[name="colour"]').forEach(r => r.addEventListener('change', () => {
    paintColour(r);
    const first = thumbs.find(t => t.dataset.colour === r.dataset.colour);
    if (first) show(first);
  }));

  /* ---------- quantity ---------- */
  const qty = $('[data-qty-input]');
  const dec = $('[data-qty-dec]');
  const setQty = v => {
    qty.value = Math.min(99, Math.max(1, Math.round(Number(v)) || 1));
    dec.disabled = Number(qty.value) <= 1;
  };
  dec.addEventListener('click', () => setQty(Number(qty.value) - 1));
  $('[data-qty-inc]').addEventListener('click', () => setQty(Number(qty.value) + 1));
  qty.addEventListener('change', () => setQty(qty.value));

  /* ---------- buy now: no checkout yet, so add the item and open the cart ---------- */
  $('[data-buy-now]').addEventListener('click', () => {
    $('[data-add-to-cart]').click();
    location.href = 'cart.html';
  });

  /* ---------- share: real page URL at runtime ---------- */
  const url = encodeURIComponent(location.href);
  const text = encodeURIComponent('Dew – Medium Area Scent Diffuser by Atmocare');
  const links = {
    whatsapp: `https://api.whatsapp.com/send?text=${text}%20${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
  };
  $$('[data-share]').forEach(a => { a.href = links[a.dataset.share]; });
  const copy = document.querySelector('[data-share-copy]');
  copy.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(location.href); ok = true; } catch { /* no clipboard access */ }
    const toast = document.querySelector('[data-toast]');
    if (toast) {
      toast.textContent = ok ? 'Link copied' : 'Couldn’t copy the link. Copy it from the address bar.';
      toast.classList.add('is-visible');
      setTimeout(() => toast.classList.remove('is-visible'), 2600);
    }
  });
})();
