/* Shop page: filter sidebar and product grid.
   Desktop: the toggle folds the sidebar away (grid 3 → 4 a row) and back. Tablet/phone: the same sidebar opens as a drawer.
   The sidebar is only ever hidden, never rebuilt, so every choice survives hiding and reopening it.
   Cards are only shown/hidden (never re-created), so main.js's Add to Cart buttons keep working.

   Filter logic:
   - Categories: Scent Solutions and Aromatic Oils are branches. A branch is "on" when any of its options is ticked;
     then only products in an "on" branch show. Inside a branch, each option group narrows (any ticked option in a group
     matches), and groups combine. Nothing ticked = everything.
   - Price Range: two handles, inclusive.
   - Sort By tick boxes (Best Sellers, Sale, New / Latest): a product shows if it matches any ticked box. */
(() => {
  const shop = document.querySelector('[data-shop]');
  if (!shop) return;
  const $ = (s, c = shop) => c.querySelector(s);
  const $$ = (s, c = shop) => [...c.querySelectorAll(s)];

  const layout = $('[data-shop-layout]');
  const panel = $('[data-shop-filters]');
  const form = $('[data-filter-form]');
  const grid = $('[data-shop-grid]');
  const cards = $$('[data-product]', grid);
  const toggle = $('[data-filter-toggle]');
  const toggleLabel = $('[data-filter-toggle-label]');
  const activeBadge = $('[data-filter-active]');
  const countEl = $('[data-shop-count]');
  const empty = $('[data-shop-empty]');
  const apply = $('[data-filter-apply]');
  const backdrop = $('[data-filter-backdrop]');
  const range = $('[data-price-range]');
  const [minIn, maxIn] = $$('input[type="range"]', range);
  const minOut = $('[data-price-min]'), maxOut = $('[data-price-max]');
  const desktop = window.matchMedia('(min-width: 64.01rem)');
  const heading = $('[data-shop-heading]');
  const CATEGORY_TITLES = { diffusers: 'Scent Solutions', oils: 'Aromatic Oils' };
  const SHOW_TITLES = { best: 'Best Sellers', sale: 'Sale', new: 'New Arrivals' };
  // client copy: each category's introduction below its products (one string a paragraph), and the one-line banner subline on its tab
  const CATEGORY_INTROS = {
    oils: ['“Aromatic Oils” also known as Essential oils or Fragrance oils can be obtained from a wide range of botanicals, including flowers, fruits, leaves, bark and more. Each oil carries its unique fragrance profile. Whether enjoyed for their fragrance, therapeutic effects, or both, aromatic oils have become integral to various aspects of daily life, offering a natural and versatile way to enhance well-being and surroundings.'],
    diffusers: [
      'As a reputable scent marketing company based in Dubai, UAE, “Atmocare” is dedicated to crafting olfactory miracles. Recognizing the profound connection between fragrance and emotions, our journey began with the creation of Remarkable Scents, Innovative Scent Diffusers, Aromatic Candles and Reed Diffusers. Our Scent Solutions offer a unique opportunity for you to curate the ideal experience for your clients and colleagues—a moment in which they remain fully engaged and connected.',
      'Scientifically proven to enhance productivity and energize employees, our Scent Solutions redefine office spaces. Beyond productivity, our scents play a pivotal role in establishing a distinctive brand identity that ensures lasting recognition and recall. With the unique power of our scent diffuser machines, we create an inviting atmosphere, making your customers feel comfortable and right at home.',
      'Crafting an enduring and captivating ambiance is no small feat. At Atmocare, we boast an extensive array of invigorating aroma equipment, offering a diverse range of Fragrances and Diffusers tailored to your specific sector, design preferences, and ambiance requirements. Our Scent Solutions in the UAE are a trusted choice to elevate the allure and atmosphere of your space. Count on us for consistently meeting your expectations in product quality and timely delivery. Let us join forces to create a beautiful and enchanting atmosphere for you!',
    ],
  };
  const CATEGORY_SUBLINES = {
    oils: 'Pure fragrance drawn from flowers, fruits, leaves and bark.',
    diffusers: 'Signature scents and diffusers that shape how every space feels.',
  };
  const intro = $('[data-shop-intro]');
  const introText = $('[data-shop-intro-text]');
  const introMore = $('[data-shop-intro-more]');

  const branches = {
    diffusers: ['coverage', 'usage'],
    oils: ['collection', 'family'],
  };
  const ticked = name => $$(`input[name="${name}"]:checked`, form).map(i => i.value);
  const has = (card, key, values) => (card.dataset[key] || '').split(' ').some(v => values.includes(v));
  const aed = n => 'AED ' + n.toLocaleString('en-US');
  const plural = n => `${n} product${n === 1 ? '' : 's'}`;

  /* ---------- price slider: handles can't cross; the fill between them follows ---------- */
  function syncRange(moved) {
    let lo = +minIn.value, hi = +maxIn.value;
    if (lo > hi) { if (moved === minIn) minIn.value = lo = hi; else maxIn.value = hi = lo; }
    const max = +minIn.max;
    range.style.setProperty('--lo', (lo / max * 100) + '%');
    range.style.setProperty('--hi', (hi / max * 100) + '%');
    minOut.textContent = aed(lo);
    maxOut.textContent = aed(hi);
    minIn.setAttribute('aria-valuetext', aed(lo));
    maxIn.setAttribute('aria-valuetext', aed(hi));
  }

  /* ---------- category introduction: folded to three lines, View More only when it runs longer ---------- */
  function fitIntro() {
    if (intro.hidden || intro.classList.contains('is-open')) return;
    introMore.hidden = introText.scrollHeight <= introText.clientHeight + 1;
  }
  function setIntro(cat) {
    const copy = CATEGORY_INTROS[cat] || [];
    intro.hidden = !copy.length;
    if (introText.dataset.cat === cat) return;
    introText.dataset.cat = cat;
    introText.replaceChildren(...copy.map(text => Object.assign(document.createElement('p'), { textContent: text })));
    intro.classList.remove('is-open');
    introMore.textContent = 'View More';
    introMore.setAttribute('aria-expanded', 'false');
    fitIntro();
  }
  introMore.addEventListener('click', () => {
    const open = intro.classList.toggle('is-open');
    introMore.textContent = open ? 'View Less' : 'View More';
    introMore.setAttribute('aria-expanded', String(open));
  });
  // re-check on any width change (window resize, or Hide Filters widening the column)
  new ResizeObserver(fitIntro).observe(intro);

  /* ---------- filtering ---------- */
  function filter() {
    const cats = ticked('category');
    const on = Object.keys(branches).filter(b => cats.includes(b) || branches[b].some(g => ticked(g).length));
    const lo = +minIn.value, hi = +maxIn.value;
    const show = ticked('show');
    matched = cards.filter(card => {
      const cat = card.dataset.category;
      let ok = !on.length || (on.includes(cat) && branches[cat].every(g => { const v = ticked(g); return !v.length || has(card, g, v); }));
      ok = ok && +card.dataset.price >= lo && +card.dataset.price <= hi;
      return ok && (!show.length || show.some(s => card.dataset[s === 'new' ? 'new' : s] === 'true'));
    });
    const shown = matched.length;
    // what is being browsed, above the cards: one category (header tab or its filters), else one Sort By tab, else Shop All
    heading.textContent = on.length === 1 ? CATEGORY_TITLES[on[0]] : show.length === 1 ? SHOW_TITLES[show[0]] : 'Shop All';
    setIntro(on.length === 1 ? on[0] : null);
    page = 1;
    paginate();

    const priceOn = lo > +minIn.min || hi < +maxIn.max;
    const active = $$('input[type="checkbox"]:checked', form).length + (priceOn ? 1 : 0);
    apply.textContent = `Show ${shown} Product${shown === 1 ? '' : 's'}`;
    empty.hidden = shown > 0;
    activeBadge.hidden = active === 0;
    activeBadge.textContent = active;
    $$('[data-filter-clear]', form).forEach(b => { b.disabled = active === 0; });
  }

  /* ---------- pagination: four rows a page, however many cards a row the grid shows right now ---------- */
  const ROWS = 4;
  const pager = $('[data-shop-pager]');
  const bar = $('[data-shop-bar]');
  let matched = [];
  let page = 1;
  const perPage = () => (parseInt(getComputedStyle(grid).getPropertyValue('--cols'), 10) || 3) * ROWS;

  function paginate() {
    const per = perPage();
    const pages = Math.max(1, Math.ceil(matched.length / per));
    page = Math.min(page, pages);
    const from = (page - 1) * per;
    const onPage = new Set(matched.slice(from, from + per));
    cards.forEach(card => { card.hidden = !onPage.has(card); });

    const total = matched.length;
    countEl.textContent = total > per ? `Showing ${from + 1}–${Math.min(from + per, total)} of ${plural(total)}` : plural(total);

    pager.hidden = pages < 2;
    if (pages < 2) { pager.replaceChildren(); return; }
    // numbers: first, last, and the current page with its neighbours; gaps become "…"
    const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter(n => n >= 1 && n <= pages).sort((a, b) => a - b);
    const btn = (label, target, cls = '') => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `round-btn round-btn--sm ${cls}`.trim();
      b.dataset.page = target;
      b.innerHTML = label;
      return b;
    };
    const arrow = '<svg class="icon icon--sm" aria-hidden="true"><use href="#i-chevron"/></svg>';
    const prev = btn(arrow + '<span class="visually-hidden">Previous page</span>', page - 1, 'shop-pager__prev');
    const next = btn(arrow + '<span class="visually-hidden">Next page</span>', page + 1, 'shop-pager__next');
    prev.disabled = page === 1;
    next.disabled = page === pages;
    const items = [prev];
    nums.forEach((n, i) => {
      if (i && n - nums[i - 1] > 1) {
        const gap = document.createElement('span');
        gap.className = 'shop-pager__gap';
        gap.setAttribute('aria-hidden', 'true');
        gap.textContent = '…';
        items.push(gap);
      }
      const b = btn(String(n), n);
      b.setAttribute('aria-label', `Page ${n}`);
      if (n === page) b.setAttribute('aria-current', 'page');
      items.push(b);
    });
    items.push(next);
    pager.replaceChildren(...items);
  }

  pager.addEventListener('click', e => {
    const b = e.target.closest('[data-page]');
    if (!b || b.disabled) return;
    page = +b.dataset.page;
    paginate();
    // back to the first row of the new page, just under the pinned toolbar (the header reappears on the way up)
    const header = document.querySelector('[data-header]');
    const y = layout.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0) - bar.offsetHeight - 24;
    if (window.scrollY > y) window.scrollTo({ top: y, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    (pager.querySelector('[aria-current="page"]') || pager).focus({ preventScroll: true });
  });

  // cards a row change with the window and the sidebar toggle: keep four rows a page
  let lastPer = 0;
  const reflow = () => { const per = perPage(); if (per !== lastPer) { lastPer = per; paginate(); } };
  window.addEventListener('resize', reflow);
  // the sidebar pins just under the toolbar, whatever its height
  const setBarH = () => shop.style.setProperty('--shop-bar-h', bar.offsetHeight + 'px');
  if ('ResizeObserver' in window) new ResizeObserver(setBarH).observe(bar);
  setBarH();

  form.addEventListener('input', e => { if (e.target.type === 'range') syncRange(e.target); filter(); });
  form.addEventListener('change', filter);
  // clearing keeps the category being browsed (its group still open) so its heading and filters stay
  const clear = () => {
    form.reset();
    $$('[data-branch]', form).forEach(g => { const b = form.querySelector(`input[name="category"][value="${g.dataset.branch}"]`); if (b) b.checked = g.open && !g.hidden; });
    syncRange();
    filter();
  };
  $$('[data-filter-clear]').forEach(b => b.addEventListener('click', clear));

  /* ---------- sidebar: fold away on desktop, drawer below it ---------- */
  let hidden = false;   // desktop: sidebar folded away
  let open = false;     // tablet/phone: drawer open

  function render() {
    const isDesktop = desktop.matches;
    layout.classList.toggle('is-filters-hidden', isDesktop && hidden);
    panel.classList.toggle('is-open', !isDesktop && open);
    backdrop.hidden = isDesktop || !open;
    document.documentElement.classList.toggle('has-drawer', !isDesktop && open);
    toggle.setAttribute('aria-expanded', String(isDesktop ? !hidden : open));
    toggleLabel.textContent = isDesktop ? (hidden ? 'Show Filters' : 'Hide Filters') : 'Filters';
    reflow();
  }

  toggle.addEventListener('click', () => {
    if (desktop.matches) hidden = !hidden;
    else { open = !open; if (open) setTimeout(() => $('summary', panel).focus(), 50); }
    render();
  });
  const close = () => { if (!open) return; open = false; render(); toggle.focus(); };
  $$('[data-filter-close]').forEach(b => b.addEventListener('click', close));
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  desktop.addEventListener('change', () => { open = false; render(); });

  // header tabs land here pre-filtered: ?category=diffusers | oils, ?show=sale | best | new
  const params = new URLSearchParams(location.search);
  const tick = (name, value) => { const box = form.querySelector(`input[name="${name}"][value="${value}"]`); if (box) box.checked = true; };
  const cat = params.get('category');
  const showParam = params.get('show');
  const groups = $$('[data-branch]', form);
  // opening a category's filter group (Scent Solutions / Aromatic Oils) browses that category: its heading shows and the
  // grid narrows to it; closing the group lets it go again (unless one of its options is still ticked)
  groups.forEach(g => g.addEventListener('toggle', () => {
    const box = form.querySelector(`input[name="category"][value="${g.dataset.branch}"]`);
    if (box) box.checked = g.open;
    filter();
  }));
  if (cat) {
    tick('category', cat);
    // the banner photo follows the category (its title stays "Explore Our Products")
    const BANNERS = { oils: ['Aromatic Oils', 'assets/img/pages/banner-aromatic-oils.webp'], diffusers: ['Scent Solutions', 'assets/img/pages/banner-scent-solutions.webp'] };
    if (BANNERS[cat]) {
      const [title, src] = BANNERS[cat];
      const img = document.querySelector('[data-shop-banner]');
      if (img) img.src = src;
      const crumb = document.querySelector('.page-hero .breadcrumb [aria-current]');
      if (crumb) crumb.textContent = title;
      const sub = document.querySelector('[data-shop-sub]');
      if (sub) { sub.textContent = CATEGORY_SUBLINES[cat]; sub.hidden = false; }
      document.title = `${title} | Atmocare`;
    }
    // arriving from a category tab: only that category's filters show (Shop All shows both)
    groups.forEach(g => { g.hidden = g.dataset.branch !== cat; if (!g.hidden) g.open = true; });
  }
  if (cat || showParam) {
    // the header tab that brought the visitor here is the current page, not Shop All
    const tabs = [...document.querySelectorAll('.category-nav a, .mobile-nav a')];
    const here = tabs.filter(a => a.getAttribute('href') === (cat ? `shop.html?category=${cat}` : `shop.html?show=${showParam}`));
    if (here.length) {
      tabs.forEach(a => { if (a.getAttribute('href') === 'shop.html') a.removeAttribute('aria-current'); });
      here.forEach(a => a.setAttribute('aria-current', 'page'));
    }
  }
  if (showParam) tick('show', showParam);

  syncRange();
  filter();
  render();
})();
