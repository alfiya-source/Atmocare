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

/* Product reviews: Specifications | Reviews tabs (products with specifications), the review slider with its progress bars,
   the star rating, photo slots and the Write a Review form (MOCK: no backend yet, so Submit only checks and thanks). */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- tabs: click, or arrow keys / Home / End between them ---------- */
  $$('[data-tabs]').forEach(list => {
    const tabs = $$('[role="tab"]', list);
    const select = tab => tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      // the panel may still be waiting for its scroll reveal
      if (on) panel.querySelectorAll('.reveal').forEach(r => r.classList.add('is-visible'));
    });
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', e => {
        const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        const next = tabs[(to + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });
  });

  /* ---------- review slider: arrow steps forward (back to the first after the last); bars show and pick the review ---------- */
  $$('[data-review-slider]').forEach(slider => {
    const track = $('[data-review-track]', slider);
    const cards = $$('[data-review]', track);
    const next = $('[data-review-next]', slider);
    const dots = $('[data-review-dots]', slider.parentElement);
    let cur = 0;
    const bars = cards.map((card, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pd-reviews__dot';
      b.setAttribute('aria-label', `Show review ${i + 1} of ${cards.length}`);
      b.addEventListener('click', () => go(i));
      dots.appendChild(b);
      return b;
    });
    const mark = i => {
      cur = i;
      bars.forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
      const last = i === cards.length - 1;
      next.classList.toggle('is-last', last);
      next.setAttribute('aria-label', last ? 'Back to the first review' : 'Next review');
    };
    function go(i) {
      track.scrollTo({ left: cards[i].offsetLeft - track.offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
      mark(i);
    }
    next.addEventListener('click', () => go((cur + 1) % cards.length));
    // swiping or scrolling the track moves the bars too
    let t;
    track.addEventListener('scroll', () => {
      clearTimeout(t);
      t = setTimeout(() => mark(Math.min(cards.length - 1, Math.round(track.scrollLeft / ((cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : 0) || 1)))), 80);
    }, { passive: true });
    if (cards.length < 2) { next.hidden = true; dots.hidden = true; }
    mark(0);
  });

  /* ---------- Write a Review ---------- */
  $$('[data-review-form]').forEach(form => {
    const status = $('[data-review-status]', form);
    const errors = { rating: $('[data-review-error="rating"]', form), feedback: $('[data-review-error="feedback"]', form) };
    const feedback = form.elements.feedback;

    // photo slots: a chosen picture previews in its slot, × empties it again
    const slots = $$('[data-upload-slot]', form);
    const clear = slot => {
      const input = $('[data-upload-input]', slot), img = $('[data-upload-preview]', slot);
      input.value = '';
      if (img.src) URL.revokeObjectURL(img.src);
      img.removeAttribute('src');
      img.hidden = true;
      $('[data-upload-remove]', slot).hidden = true;
      slot.classList.add('is-empty');
    };
    slots.forEach(slot => {
      const input = $('[data-upload-input]', slot), img = $('[data-upload-preview]', slot), remove = $('[data-upload-remove]', slot);
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file || !file.type.startsWith('image/')) { clear(slot); return; }
        if (img.src) URL.revokeObjectURL(img.src);
        img.src = URL.createObjectURL(file);
        img.hidden = false;
        remove.hidden = false;
        slot.classList.remove('is-empty');
      });
      // a filled slot doesn't reopen the picker; only × clears it
      slot.addEventListener('click', e => {
        if (e.target.closest('[data-upload-remove]')) { e.preventDefault(); clear(slot); input.focus(); return; }
        if (!slot.classList.contains('is-empty')) e.preventDefault();
      });
    });

    const check = () => {
      const rated = !!form.querySelector('input[name="rating"]:checked');
      const written = feedback.value.trim().length > 0;
      errors.rating.hidden = rated;
      errors.feedback.hidden = written;
      feedback.setAttribute('aria-invalid', String(!written));
      return { rated, written };
    };
    form.addEventListener('change', e => { if (e.target.name === 'rating' && !errors.rating.hidden) check(); });
    feedback.addEventListener('input', () => { if (!errors.feedback.hidden) check(); });

    form.addEventListener('submit', e => {
      e.preventDefault();
      status.textContent = '';
      const { rated, written } = check();
      if (!rated) { form.querySelector('input[name="rating"]').focus(); return; }
      if (!written) { feedback.focus(); return; }
      form.reset();
      slots.forEach(clear);
      feedback.removeAttribute('aria-invalid');
      status.textContent = 'Thank you! Your review has been received and will appear once approved.';
    });
  });
})();
