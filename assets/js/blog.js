/* Atmocare blog: renders the listing (blog.html) and the article + related cards (blog-detail.html) from window.ATMO_BLOG (blog-data.js).
   Cards are the homepage Blog section's .story markup, unchanged. Load before main.js so its scroll reveal picks up the first cards. */
(() => {
  const posts = (window.ATMO_BLOG || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const $ = (s, root = document) => root.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const postUrl = p => `blog-detail.html?slug=${encodeURIComponent(p.slug)}`;
  const longDate = d => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // same markup as the cards in index.html #blog
  const card = (p, reveal = true) => `
    <article class="story${reveal ? ' reveal' : ''}">
      <img src="${esc(p.cover)}" alt="" width="${p.coverWidth}" height="${p.coverHeight}" loading="lazy">
      <div class="story__body">
        <h3 class="story__title"><a href="${postUrl(p)}">${esc(p.title)}</a></h3>
        <span class="story__more" aria-hidden="true">Read More</span>
      </div>
    </article>`;

  /* ---------- listing: nine at a time, "Load More" adds the next nine ---------- */
  const list = $('[data-blog-list]');
  if (list) {
    const step = 9, more = $('[data-blog-more]'), status = $('[data-blog-status]');
    let shown = 0;
    const showNext = first => {
      const next = posts.slice(shown, shown + step);
      list.insertAdjacentHTML('beforeend', next.map(p => card(p, first)).join(''));
      // focus the first new card so keyboard users land on what was just loaded
      if (!first) list.children[shown]?.querySelector('a')?.focus({ preventScroll: false });
      shown += next.length;
      if (status) status.textContent = `Showing ${shown} of ${posts.length} articles`;
      if (more) more.hidden = shown >= posts.length;
    };
    showNext(true);
    more?.addEventListener('click', () => showNext(false));
  }

  /* ---------- article ---------- */
  const article = $('[data-post]');
  if (article) {
    const slug = new URLSearchParams(location.search).get('slug');
    const i = posts.findIndex(p => p.slug === slug);
    const post = posts[i];
    // no or unknown slug: go to the listing
    if (!post) location.replace('blog.html');
    else {
      document.title = `${post.title} | Atmocare Blog`;
      $('meta[name="description"]')?.setAttribute('content', post.excerpt);
      $('[data-post-crumb]').textContent = post.title;
      $('[data-post-title]').textContent = post.title;
      document.querySelectorAll('[data-post-tag]').forEach(el => { el.textContent = post.tag; });
      document.querySelectorAll('[data-post-date]').forEach(el => { el.textContent = longDate(post.date); el.dateTime = post.date; });
      // same photo as the article's card
      const img = $('[data-post-image]');
      Object.assign(img, { src: post.cover, width: post.coverWidth, height: post.coverHeight, alt: '' });
      // body HTML comes from our own data file (copied from atmocare.com), not from user input
      $('[data-post-body]').innerHTML = post.body;

      // previous = newer, next = older
      const pager = (el, p) => { if (!el) return; if (!p) { el.hidden = true; return; } el.href = postUrl(p); $('[data-pager-title]', el).textContent = p.title; };
      pager($('[data-post-newer]'), posts[i - 1]);
      pager($('[data-post-older]'), posts[i + 1]);

      // related: same topic first, then the latest others, never the current article
      const others = posts.filter(p => p.slug !== post.slug);
      const related = [...others.filter(p => p.tag === post.tag), ...others.filter(p => p.tag !== post.tag)].slice(0, 3);
      const relatedList = $('[data-related-list]');
      if (relatedList) relatedList.innerHTML = related.map(p => card(p)).join('');
    }
  }
})();
