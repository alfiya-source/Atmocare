/* ATMOCARE homepage — vanilla JS, no dependencies */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- sticky header state ---------- */
  const header = $('[data-header]');
  let lastY = window.scrollY;
  // hide on scroll down, reveal on scroll up; always shown near the top
  const setHidden = hide => header.classList.toggle('is-hidden', hide);
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    if (y <= header.offsetHeight) { setHidden(false); lastY = y; return; }
    if (Math.abs(y - lastY) < 8) return; // ignore tiny jitters (trackpads, momentum)
    setHidden(y > lastY);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // expose the live header height so sticky content (product stack) can pin just below it
  const setHeaderOffset = () => document.documentElement.style.setProperty('--header-offset', header.offsetHeight + 'px');
  if ('ResizeObserver' in window) new ResizeObserver(setHeaderOffset).observe(header);
  setHeaderOffset();

  /* ---------- overlay helper (menu + search) ---------- */
  function overlay(el, openBtns, closeSel, onOpen) {
    let lastFocus = null;
    const open = () => {
      lastFocus = document.activeElement;
      el.hidden = false;
      requestAnimationFrame(() => el.classList.add('is-open'));
      openBtns.forEach(b => b.setAttribute('aria-expanded', 'true'));
      document.body.style.overflow = 'hidden';
      onOpen && onOpen();
    };
    const close = () => {
      el.classList.remove('is-open');
      openBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
      document.body.style.overflow = '';
      setTimeout(() => { el.hidden = true; }, 400);
      lastFocus && lastFocus.focus();
    };
    openBtns.forEach(b => b.addEventListener('click', open));
    el.addEventListener('click', e => { if (e.target.closest(closeSel)) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !el.hidden) close(); });
    return { open, close, isOpen: () => !el.hidden };
  }

  const nav = $('[data-mobile-nav]');
  const menu = overlay(nav, $$('[data-menu-open]'), '[data-menu-close]', () => $('a', nav).focus());
  $$('a', nav).forEach(a => a.addEventListener('click', () => menu.close()));
  window.addEventListener('resize', () => { if (window.innerWidth > 1024 && menu.isOpen()) menu.close(); });

  /* ---------- search: every shop product, opening its own product page ---------- */
  const products = [
    ['Dew – Medium Area', 'Scent Solutions', 'product-dew.html'],
    ['Mellow – Medium Area', 'Scent Solutions', 'product-mellow.html'],
    ['Aromax – Medium Area', 'Scent Solutions', 'product-aromax.html'],
    ['Mistral – Lobby', 'Scent Solutions', 'product-mistral.html'],
    ['Regal – Home & Office', 'Scent Solutions', 'product-regal.html'],
    ['Breeze – Small Area', 'Scent Solutions', 'product-breeze.html'],
    ['Glimmer – Small Area', 'Scent Solutions', 'product-glimmer.html'],
    ['Grace – Small Area', 'Scent Solutions', 'product-grace.html'],
    ['Aroma Pro – Large Area', 'Scent Solutions', 'product-aroma-pro.html'],
    ['Aura – Car & Table Top', 'Scent Solutions', 'product-aura.html'],
    ['Aromatic Candles – Eco Friendly', 'Scent Solutions', 'product-aromatic-candles.html'],
    ['Reed Diffuser – Eco Friendly', 'Scent Solutions', 'product-reed-diffuser.html'],
    ['Corporate or White Label Gifts – White Label', 'Scent Solutions', 'product-corporate-or-white-label-gifts.html'],
    ['Mist – Small to Medium Area', 'Scent Solutions', 'product-mist.html'],
    ['Armani Opulenza – Luxurious', 'Aromatic Oils', 'product-armani-opulenza.html'],
    ['Exotica – Luxurious', 'Aromatic Oils', 'product-exotica.html'],
    ['Luxury Air – Luxurious', 'Aromatic Oils', 'product-luxury-air.html'],
    ['Sensense – Luxurious', 'Aromatic Oils', 'product-sensense.html'],
    ['Toxic Killi – Luxurious', 'Aromatic Oils', 'product-toxic-killi.html'],
    ['Diamond – Signature Collection', 'Aromatic Oils', 'product-diamond.html'],
    ['Fresh Leaf – Signature Collection', 'Aromatic Oils', 'product-fresh-leaf.html'],
    ['Harmony – Signature Collection', 'Aromatic Oils', 'product-harmony.html'],
    ['Leather Touch – Signature Collection', 'Aromatic Oils', 'product-leather-touch.html'],
    ['Taj Sunset – Signature Collection', 'Aromatic Oils', 'product-taj-sunset.html'],
    ['Blue Host – Aquatic', 'Aromatic Oils', 'product-blue-host.html'],
    ['Crystal – Aquatic', 'Aromatic Oils', 'product-crystal.html'],
    ['Trendy Breeze – Aquatic', 'Aromatic Oils', 'product-trendy-breeze.html'],
    ['Ambri Fierce – Arabic', 'Aromatic Oils', 'product-ambri-fierce.html'],
    ['Kalemat Oudh – Arabic', 'Aromatic Oils', 'product-kalemat-oudh.html'],
    ['Musk – Arabic', 'Aromatic Oils', 'product-musk.html'],
    ['Stormy Desert – Arabic', 'Aromatic Oils', 'product-stormy-desert.html'],
    ['Isseymiyake – Fresh and Sweet', 'Aromatic Oils', 'product-isseymiyake.html'],
    ['Paradise – Fresh and Sweet', 'Aromatic Oils', 'product-paradise.html'],
    ['Passion – Fresh and Sweet', 'Aromatic Oils', 'product-passion.html'],
    ['Touch Me – Fresh and Sweet', 'Aromatic Oils', 'product-touch-me.html'],
    ['Eucalyptus – Citrus', 'Aromatic Oils', 'product-eucalyptus.html'],
    ['Green Tea – Citrus', 'Aromatic Oils', 'product-green-tea.html'],
    ['Lemon Grass – Citrus', 'Aromatic Oils', 'product-lemon-grass.html'],
    ['Jasmine – Floral', 'Aromatic Oils', 'product-jasmine.html'],
    ['Lavender – Floral', 'Aromatic Oils', 'product-lavender.html'],
    ['Mandarin – Fruity', 'Aromatic Oils', 'product-mandarin.html'],
    ['East Wood – Woody', 'Aromatic Oils', 'product-east-wood.html'],
    ['Sandal – Woody', 'Aromatic Oils', 'product-sandal.html'],
    ['Coffee Bean – Foody', 'Aromatic Oils', 'product-coffee-bean.html'],
    ['Coco Lush – Foody', 'Aromatic Oils', 'product-coco-lush.html'],
    ['Vanilla – Foody', 'Aromatic Oils', 'product-vanilla.html'],
    ['Fragrance Mist – Commercial', 'Aromatic Oils', 'product-fragrance-mist.html'],
    ['Corporate Scent Contracting', 'Scent Contracting', 'project-detail.html']
  ];
  const results = $('[data-search-results]');
  const label = $('[data-search-label]');
  const input = $('[data-search-input]');
  const render = q => {
    const term = q.trim().toLowerCase();
    const list = term ? products.filter(p => (p[0] + ' ' + p[1]).toLowerCase().includes(term)) : products.slice(0, 6);
    label.textContent = term ? `${list.length} result${list.length === 1 ? '' : 's'}` : 'Popular on Atmocare';
    results.innerHTML = list.map(p => `<li><a href="${p[2]}"><span>${p[0]}</span><small>${p[1]}</small></a></li>`).join('')
      || '<li class="search-panel__empty">No products found. Try “diffuser” or “oil”.</li>';
  };
  overlay($('[data-search-panel]'), $$('[data-search-open]'), '[data-search-close]', () => { render(input.value); input.focus(); });
  input.addEventListener('input', () => render(input.value));
  $('[data-search-form]').addEventListener('submit', e => { e.preventDefault(); const a = $('a', results); if (a) location.href = a.href; });

  /* ---------- toast ---------- */
  const toastEl = $('[data-toast]');
  let toastTimer;
  const toast = msg => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
  };

  /* ---------- cart: kept in this browser (localStorage) so cart.html can list it; no backend on atmocare.com ----------
     Items are read from the product card the button sits in (name, type, MOCK prices, image, link). */
  const CART_KEY = 'atmocare-cart';
  let cartMemory = [];
  const readCart = () => {
    try { const v = JSON.parse(localStorage.getItem(CART_KEY)); return Array.isArray(v) ? v : []; } catch { return cartMemory; }
  };
  const paintCart = items => {
    const n = items.reduce((sum, i) => sum + i.qty, 0);
    $$('[data-cart-count]').forEach(c => { c.hidden = n === 0; c.textContent = n; });
    $$('[data-cart-link]').forEach(l => l.setAttribute('aria-label', `Cart, ${n} item${n === 1 ? '' : 's'}`));
  };
  const writeCart = items => {
    cartMemory = items;
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* private mode: this page only */ }
    paintCart(items);
  };
  window.AtmoCart = { read: readCart, write: writeCart };
  paintCart(readCart());
  window.addEventListener('storage', e => { if (e.key === CART_KEY) paintCart(readCart()); });

  const aed = el => (el ? Number(el.textContent.replace(/[^0-9.]/g, '')) || 0 : 0);
  $$('[data-add-to-cart]').forEach(btn => btn.addEventListener('click', () => {
    // a shop card, or the product detail page (which adds its chosen colour and quantity)
    const card = btn.closest('.shop-card, [data-product-info]');
    const detail = card && card.matches('[data-product-info]');
    const img = card && $(detail ? '[data-gallery-img]' : '.shop-card__media img', card);
    const link = card && $('.shop-card__title a', card);
    const colour = detail && $('input[name="colour"]:checked', card);
    const qtyInput = detail && $('[data-qty-input]', card);
    const type = card ? ($('.shop-card__type', card)?.textContent.trim() || '') : '';
    const item = {
      name: btn.dataset.name,
      type: colour ? `${type} · ${colour.value}` : type,
      price: card ? aed($('.shop-card__now', card)) : 0,
      was: card ? aed($('.shop-card__was', card)) : 0,
      img: img ? img.getAttribute('src') : '',
      href: detail ? location.pathname.split('/').pop() : (link ? link.getAttribute('href') : ''),
      qty: qtyInput ? Math.min(99, Math.max(1, Math.round(Number(qtyInput.value)) || 1)) : 1,
    };
    const items = readCart();
    const found = items.find(i => i.name === item.name && i.type === item.type);
    if (found) found.qty = Math.min(99, found.qty + item.qty); else items.push(item);
    writeCart(items);
    btn.classList.add('is-added');
    setTimeout(() => btn.classList.remove('is-added'), 1200);
    toast(`${btn.dataset.name} added to cart`);
  }));
  /* ---------- placeholder links (missing pages) ---------- */
  $$('[data-placeholder]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    toast('This page is not available on atmocare.com yet');
  }));

  /* ---------- generic autoplay helper ---------- */
  function autoplay(root, step, delay) {
    let timer = null;
    const start = () => { if (reduceMotion) return; stop(); timer = setInterval(step, delay); };
    const stop = () => { clearInterval(timer); timer = null; };
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    return { start, stop };
  }

  /* ---------- about fade slider ---------- */
  const fade = $('[data-fade-slider]');
  if (fade) {
    const imgs = $$('.fade-slider__img', fade);
    let i = 0;
    const go = n => { i = (n + imgs.length) % imgs.length; imgs.forEach((im, k) => im.classList.toggle('is-active', k === i)); };
    const play = autoplay(fade, () => go(i + 1), 4500);
    $('[data-prev]', fade).addEventListener('click', () => { go(i - 1); play.start(); });
    $('[data-next]', fade).addEventListener('click', () => { go(i + 1); play.start(); });
    play.start();
  }

  /* ---------- star ratings: stars fill from a real data-rating; outline stars + invitation until then ---------- */
  $$('.rating').forEach(el => {
    const r = parseFloat(el.dataset.rating);
    const n = parseInt(el.dataset.count, 10);
    if (!(r >= 0 && r <= 5)) { el.setAttribute('aria-label', 'Not yet reviewed'); return; }
    el.style.setProperty('--rating', r);
    $('.rating__label', el).textContent = r.toFixed(1) + (n ? ` (${n})` : '');
    el.setAttribute('aria-label', `Rated ${r.toFixed(1)} out of 5` + (n ? `, ${n} reviews` : ''));
  });

  /* ---------- hero pointer parallax (mouse only) ---------- */
  const hero = $('.hero');
  if (hero && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      hero.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    hero.addEventListener('pointerleave', () => { hero.style.setProperty('--mx', 0); hero.style.setProperty('--my', 0); });
  }

  /* ---------- hero carousel: only activates when more than one .hero__banner is present ---------- */
  const banners = $$('.hero__banner');
  if (hero && banners.length > 1) {
    const DUR = 6000;
    const pad = n => String(n).padStart(2, '0');
    hero.classList.add('is-carousel');
    hero.style.setProperty('--hero-dur', DUR + 'ms');

    // pager: pill dots (active one fills over DUR) · "up next" card with thumbnail, label and countdown ring
    const labelOf = n => banners[n].dataset.label || `Slide ${n + 1}`;
    const pager = document.createElement('div');
    pager.className = 'container hero-pager';
    pager.innerHTML = `
      <div class="hero-pager__dots" role="group" aria-label="Choose slide"></div>
      <button class="hero-pager__next" type="button">
        <span class="hero-pager__thumb" aria-hidden="true"><img alt=""></span>
        <span class="hero-pager__meta" aria-hidden="true"><small>Up next</small><strong></strong></span>
        <span class="hero-pager__ring" aria-hidden="true">
          <svg class="ring" viewBox="0 0 48 48"><circle class="ring__track" cx="24" cy="24" r="22"/><circle class="ring__prog" cx="24" cy="24" r="22"/></svg>
          <svg class="icon icon--sm"><use href="#i-arrow"/></svg>
        </span>
      </button>`;
    const dotsEl = $('.hero-pager__dots', pager);
    const nextBtn = $('.hero-pager__next', pager);
    const thumb = $('.hero-pager__thumb img', pager);
    const meta = $('.hero-pager__meta', pager);
    const dots = banners.map((_, n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hero-pager__dot';
      b.setAttribute('aria-label', `Slide ${n + 1} of ${banners.length}: ${labelOf(n)}`);
      b.innerHTML = '<span></span>';
      dotsEl.append(b);
      return b;
    });
    hero.append(pager);

    // timer that can pause mid-slide and resume with the remaining time, in step with the CSS fill
    let cur = 0, timer = null, startedAt = 0, remaining = DUR, paused = false;
    const schedule = ms => {
      clearTimeout(timer);
      if (reduceMotion) return;
      startedAt = performance.now();
      remaining = ms;
      timer = setTimeout(() => go(cur + 1), ms);
    };
    const go = n => {
      cur = (n + banners.length) % banners.length;
      const nx = (cur + 1) % banners.length;
      banners.forEach((b, k) => b.classList.toggle('is-active', k === cur));
      dots.forEach(d => d.removeAttribute('aria-current'));
      hero.classList.remove('is-running');
      void hero.offsetWidth; // restart the dot fill + ring countdown
      dots[cur].setAttribute('aria-current', 'true');
      hero.classList.add('is-running');
      thumb.src = banners[nx].currentSrc || banners[nx].src;
      meta.querySelector('strong').outerHTML = `<strong>${labelOf(nx)}</strong>`;
      nextBtn.setAttribute('aria-label', `Next slide: ${labelOf(nx)}`);
      if (!paused) schedule(DUR); else remaining = DUR;
    };
    const pause = () => {
      if (paused) return;
      paused = true;
      hero.classList.add('is-paused');
      clearTimeout(timer);
      remaining = Math.max(remaining - (performance.now() - startedAt), 0);
    };
    const resume = () => {
      if (!paused) return;
      paused = false;
      hero.classList.remove('is-paused');
      schedule(remaining);
    };
    hero.addEventListener('mouseenter', pause);
    hero.addEventListener('mouseleave', resume);
    hero.addEventListener('focusin', pause);
    hero.addEventListener('focusout', e => { if (!hero.contains(e.relatedTarget)) resume(); });
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));
    dots.forEach((d, n) => d.addEventListener('click', () => go(n)));
    nextBtn.addEventListener('click', () => go(cur + 1));
    // touch: horizontal swipe changes slide
    let x0 = null, y0 = null;
    hero.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    hero.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
      x0 = y0 = null;
    }, { passive: true });
    go(0);
  }

  /* ---------- scroll-snap tracks (best sellers, testimonials) ---------- */
  $$('[data-snap]').forEach(root => {
    const track = $('[data-snap-track]', root);
    const by = dir => {
      const card = track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    $('[data-snap-prev]', root).addEventListener('click', () => by(-1));
    $('[data-snap-next]', root).addEventListener('click', () => by(1));
  });

  /* ---------- testimonials reel: endless slow drift, pauses on hover/focus/off-screen; arrows step one tile ---------- */
  const reel = $('[data-testi]');
  if (reel) {
    const track = $('[data-testi-track]', reel);
    const originals = [...track.children];
    // one cloned set so the drift can wrap seamlessly
    originals.forEach(n => {
      const c = n.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('button').forEach(b => b.tabIndex = -1);
      track.appendChild(c);
    });
    const loopW = () => track.children[originals.length].offsetLeft - track.children[0].offsetLeft;
    const step = () => originals[1].offsetLeft - originals[0].offsetLeft;
    const SPEED = 1; // px per frame at 60fps
    let pos = 0, hover = false, inView = false, held = 0, last = 0;
    const wrap = () => { const w = loopW(); if (pos >= w) pos -= w; else if (pos < 0) pos += w; };
    const tick = t => {
      const dt = last ? Math.min(t - last, 50) : 16; last = t;
      if (!reduceMotion && inView && !hover && t > held) {
        pos += SPEED * dt / 16.67; wrap();
        track.scrollLeft = pos;
      }
      requestAnimationFrame(tick);
    };
    // manual scrolling (swipe, wheel, arrow keys) takes over; the drift resumes from wherever it is left
    track.addEventListener('scroll', () => { if (Math.abs(track.scrollLeft - pos) > 2) { pos = track.scrollLeft; wrap(); if (pos !== track.scrollLeft) track.scrollLeft = pos; } }, { passive: true });
    track.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
    track.addEventListener('pointerleave', () => { hover = false; });
    track.addEventListener('pointerdown', () => { held = performance.now() + 2500; });
    reel.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) hover = true; });
    reel.addEventListener('focusout', () => { hover = false; });
    const by = dir => {
      held = performance.now() + 900;
      if (dir < 0 && pos < step()) { pos += loopW(); track.scrollLeft = pos; }
      track.scrollBy({ left: dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    $('[data-testi-prev]', reel).addEventListener('click', () => by(-1));
    $('[data-testi-next]', reel).addEventListener('click', () => by(1));

    // muted clips play only while the reel is on screen
    const vids = () => $$('video', track);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        inView = e.isIntersecting;
        vids().forEach(v => { if (inView && !reduceMotion) v.play().catch(() => {}); else v.pause(); });
      }, { threshold: .15 }).observe(reel);
    } else inView = true;
    requestAnimationFrame(tick);

    // expand: open the clip in a dialog with sound and controls (the clients page reel has quotes only, no player)
    const player = $('[data-testi-player]', reel.parentElement);
    if (player) {
      const pv = $('video', player);
      track.addEventListener('click', e => {
        const b = e.target.closest('[data-testi-video]');
        if (!b || !player.showModal) return;
        pv.src = b.dataset.testiVideo; pv.muted = false;
        player.showModal(); pv.play().catch(() => {});
      });
      $('[data-testi-close]', player).addEventListener('click', () => player.close());
      player.addEventListener('click', e => { if (e.target === player) player.close(); });
      player.addEventListener('close', () => { pv.pause(); pv.removeAttribute('src'); pv.load(); });
    }
  }

  /* ---------- clients coverflow ---------- */
  const cf = $('[data-coverflow]');
  if (cf) {
    const items = $$('.coverflow__item', cf);
    let cur = 0;
    const layout = () => {
      const w = items[0].offsetWidth;
      // neighbours shown each side; wide screens get a third, faintest pair to fill the row
      const visible = window.innerWidth < 640 ? 1 : window.innerWidth < 1100 ? 2 : 3;
      items.forEach((item, n) => {
        let off = n - cur;
        const half = items.length / 2;
        if (off > half) off -= items.length;
        if (off < -half) off += items.length;
        const abs = Math.abs(off);
        const hidden = abs > visible;
        // park hidden cards just past the visible stack so they never sweep across the row
        const pos = Math.max(-(visible + 1), Math.min(visible + 1, off));
        const x = pos * w * (window.innerWidth < 640 ? 0.78 : visible === 3 ? 0.8 : 0.72);
        const scale = [1, 0.84, 0.7, 0.58][Math.min(abs, 3)];
        item.style.transform = `translate(-50%, -50%) translateX(${x}px) scale(${scale})`;
        item.style.opacity = hidden ? 0 : [1, 0.7, 0.35, 0.15][abs];
        item.style.zIndex = 20 - abs;
        item.style.filter = abs === 0 ? 'none' : 'grayscale(1)';
        item.style.pointerEvents = hidden ? 'none' : '';
        item.setAttribute('aria-hidden', String(abs !== 0));
      });
    };
    const go = n => { cur = (n + items.length) % items.length; layout(); };
    const play = autoplay(cf, () => go(cur + 1), 3000);
    $('[data-coverflow-prev]', cf).addEventListener('click', () => { go(cur - 1); play.start(); });
    $('[data-coverflow-next]', cf).addEventListener('click', () => { go(cur + 1); play.start(); });
    items.forEach((item, n) => item.addEventListener('click', () => { go(n); play.start(); }));
    cf.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') go(cur - 1);
      if (e.key === 'ArrowRight') go(cur + 1);
    });
    // swipe
    let x0 = null;
    cf.addEventListener('pointerdown', e => { x0 = e.clientX; });
    cf.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); play.start(); }
    });
    window.addEventListener('resize', layout);
    layout();
    play.start();
  }

  /* ---------- in-place film: poster + play button; plays with sound and controls, back to the poster when it ends ---------- */
  $$('[data-film]').forEach(film => {
    const v = $('video', film), btn = $('[data-film-play]', film);
    btn.addEventListener('click', () => {
      film.classList.add('is-playing');
      v.controls = true; v.muted = false;
      v.play().catch(() => {});
      v.focus();
    });
    v.addEventListener('ended', () => {
      film.classList.remove('is-playing');
      v.controls = false; v.load();
      btn.focus();
    });
  });

  /* ---------- count-up figures ---------- */
  // [data-countup] holds the final number (also the element's text, so it reads right without JS); [data-pad] zero-pads it ("03").
  // .is-pending until it starts, .is-counted when it lands (CSS hangs the pop on that); siblings in one list start 180ms apart.
  const counters = $$('[data-countup]');
  if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
    const fmt = (el, n) => String(n).padStart(+el.dataset.pad || 0, '0');
    counters.forEach(el => { el.textContent = fmt(el, 0); el.classList.add('is-pending'); });
    const countIO = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target, end = +el.dataset.countup, dur = 1400;
      const group = el.closest('dl, ul, ol');
      const delay = group ? $$('[data-countup]', group).indexOf(el) * 180 : 0;
      countIO.unobserve(el);
      setTimeout(() => {
        let start;
        el.classList.remove('is-pending');
        el.classList.add('is-counting');
        const tick = now => {
          start ??= now; // time from the first frame's own clock, so progress never goes negative
          const t = Math.min((now - start) / dur, 1);
          el.textContent = fmt(el, Math.round(end * (1 - Math.pow(1 - t, 3))));
          if (t < 1) return requestAnimationFrame(tick);
          el.classList.replace('is-counting', 'is-counted');
        };
        requestAnimationFrame(tick);
      }, delay);
    }), { threshold: 0.6 });
    counters.forEach(el => countIO.observe(el));
  }

  /* ---------- scroll reveal ---------- */
  const reveals = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // small stagger for siblings in the same grid
        const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
        el.style.transitionDelay = Math.min(sibs.indexOf(el), 5) * 80 + 'ms';
        el.classList.add('is-visible');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  }
})();
