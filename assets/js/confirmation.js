/* Order confirmation: "Download Invoice" opens the print dialog; the print stylesheet turns the order details into a
   one-page invoice (save as PDF). Swap for a real invoice file once the order system provides one. */
(() => {
  const btn = document.querySelector('[data-print-invoice]');
  if (btn) btn.addEventListener('click', () => window.print());
})();
