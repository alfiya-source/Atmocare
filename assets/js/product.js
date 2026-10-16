/* Product detail: gallery thumbnails, colour swatches (jump to that colour's photos where the gallery has them), quantity
   stepper, the share menu and Buy Now. Add to Cart itself is handled by main.js, which reads the chosen colour and quantity. */
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
    const radio = t.dataset.colour && $(`input[name="colour"][data-colour="${t.dataset.colour}"]`);
    if (radio && !radio.checked) { radio.checked = true; paintColour(radio); }
  }));

  /* ---------- colour ---------- */
  const colourName = $('[data-colour-name]');
  const paintColour = radio => { if (colourName) colourName.textContent = radio.value; };
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

  /* ---------- share: the icon opens the options on hover / focus (CSS); a tap toggles them (touch) ---------- */
  const menu = $('[data-share-menu]');
  const toggle = $('[data-share-toggle]');
  if (menu && toggle) {
    const setOpen = on => {
      if (on) menu.setAttribute('data-open', ''); else menu.removeAttribute('data-open');
      toggle.setAttribute('aria-expanded', String(on));
    };
    toggle.addEventListener('click', () => setOpen(!menu.hasAttribute('data-open')));
    menu.addEventListener('mouseenter', () => toggle.setAttribute('aria-expanded', 'true'));
    menu.addEventListener('mouseleave', () => { if (!menu.hasAttribute('data-open')) toggle.setAttribute('aria-expanded', 'false'); });
    document.addEventListener('click', e => { if (!menu.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.hasAttribute('data-open')) { setOpen(false); toggle.focus(); } });
  }

  // real page URL at runtime
  const url = encodeURIComponent(location.href);
  const title = root.dataset.shareText || document.title;
  const text = encodeURIComponent(title);
  const links = {
    whatsapp: `https://api.whatsapp.com/send?text=${text}%20${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    email: `mailto:?subject=${text}&body=${url}`,
  };
  $$('[data-share]').forEach(a => { a.href = links[a.dataset.share]; });
  const copy = $('[data-share-copy]');
  if (copy) copy.addEventListener('click', async () => {
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
