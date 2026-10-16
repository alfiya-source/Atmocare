/* Policy pages: highlights the contents link of the section being read, and folds the contents list closed on phones. */
(() => {
  const toc = document.querySelector('[data-toc]');
  if (!toc) return;
  const links = [...toc.querySelectorAll('[data-toc-link]')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  // phones: the list sits above the text, so start it closed and close it again after a link is picked
  const narrow = window.matchMedia('(max-width: 64rem)');
  if (narrow.matches) toc.open = false;
  narrow.addEventListener('change', (e) => { toc.open = !e.matches; });
  links.forEach((a) => a.addEventListener('click', () => { if (narrow.matches) toc.open = false; }));

  const setActive = (id) => links.forEach((a) => {
    const on = a.getAttribute('href') === '#' + id;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
  });

  // the active section is the last one whose top has passed the upper third of the viewport
  const update = () => {
    const line = window.innerHeight * 0.33;
    let current = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s;
    // at the very bottom the last sections may never reach the line
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = sections[sections.length - 1];
    if (current) setActive(current.id);
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });
  update();
})();
