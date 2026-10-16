/* Cart page: lists what "Add to Cart" stored (main.js → window.AtmoCart), with quantity steppers, remove and a summary.
   Prices are the site's MOCK figures. "Proceed to Checkout" links to checkout.html. */
(() => {
  const root = document.querySelector('[data-cart]');
  if (!root || !window.AtmoCart) return;
  const { read, write } = window.AtmoCart;
  const $ = (s, c = root) => c.querySelector(s);
  const list = $('[data-cart-list]');
  const tpl = document.getElementById('cart-row');
  const fmt = n => 'AED ' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });

  const render = () => {
    const items = read();
    const count = items.reduce((s, i) => s + i.qty, 0);
    root.classList.toggle('is-empty', items.length === 0);
    $('[data-cart-empty]').hidden = items.length > 0;
    $('[data-cart-filled]').hidden = items.length === 0;
    $('[data-cart-heading-count]').textContent = `${count} item${count === 1 ? '' : 's'}`;
    list.replaceChildren(...items.map((item, idx) => {
      const row = tpl.content.firstElementChild.cloneNode(true);
      const img = $('[data-row-img]', row);
      if (item.img) { img.src = item.img; img.alt = item.name; } else img.remove();
      const title = $('[data-row-name]', row);
      if (item.href) { const a = document.createElement('a'); a.href = item.href; a.textContent = item.name; title.append(a); }
      else title.textContent = item.name;
      $('[data-row-type]', row).textContent = item.type;
      $('[data-row-price]', row).textContent = fmt(item.price);
      const was = $('[data-row-was]', row);
      if (item.was > item.price) was.textContent = fmt(item.was); else was.remove();
      $('[data-row-total]', row).textContent = fmt(item.price * item.qty);
      const qty = $('[data-row-qty]', row);
      qty.value = item.qty;
      qty.id = 'qty-' + idx;
      qty.setAttribute('aria-label', `Quantity, ${item.name}`);
      $('[data-row-dec]', row).setAttribute('aria-label', `Decrease quantity, ${item.name}`);
      $('[data-row-inc]', row).setAttribute('aria-label', `Increase quantity, ${item.name}`);
      $('[data-row-remove]', row).setAttribute('aria-label', `Remove ${item.name} from cart`);
      $('[data-row-dec]', row).disabled = item.qty <= 1;
      row.dataset.index = idx;
      return row;
    }));

    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const saved = items.reduce((s, i) => s + Math.max(0, i.was - i.price) * i.qty, 0);
    $('[data-sum-count]').textContent = count;
    $('[data-sum-subtotal]').textContent = fmt(subtotal + saved);
    $('[data-sum-saved]').textContent = '− ' + fmt(saved);
    $('[data-sum-saved-row]').hidden = saved === 0;
    $('[data-sum-total]').textContent = fmt(subtotal);
  };

  const update = (idx, fn) => {
    const items = read();
    if (!items[idx]) return;
    fn(items, items[idx]);
    write(items);
    render();
  };

  list.addEventListener('click', e => {
    const row = e.target.closest('[data-index]');
    if (!row) return;
    const idx = Number(row.dataset.index);
    if (e.target.closest('[data-row-inc]')) update(idx, (_, it) => { it.qty = Math.min(99, it.qty + 1); });
    else if (e.target.closest('[data-row-dec]')) update(idx, (_, it) => { it.qty = Math.max(1, it.qty - 1); });
    else if (e.target.closest('[data-row-remove]')) {
      update(idx, items => items.splice(idx, 1));
      (list.querySelector('[data-row-remove]') || $('[data-cart-empty] a') || $('h2'))?.focus();
      return;
    } else return;
    // keep focus on the stepper button that was pressed after the re-render
    const btn = e.target.closest('button').hasAttribute('data-row-inc') ? '[data-row-inc]' : '[data-row-dec]';
    const next = list.querySelector(`[data-index="${idx}"] ${btn}`);
    if (next && !next.disabled) next.focus(); else list.querySelector(`[data-index="${idx}"] [data-row-qty]`)?.focus();
  });
  list.addEventListener('change', e => {
    const input = e.target.closest('[data-row-qty]');
    if (!input) return;
    const v = Math.min(99, Math.max(1, Math.round(Number(input.value)) || 1));
    update(Number(input.closest('[data-index]').dataset.index), (_, it) => { it.qty = v; });
  });
  $('[data-cart-clear]').addEventListener('click', () => { write([]); render(); $('[data-cart-empty] a').focus(); });
  window.addEventListener('storage', render);
  render();
})();
