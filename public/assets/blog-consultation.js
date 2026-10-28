(() => {
  const dialog = document.getElementById('blog-consult-dialog');
  const form = document.getElementById('blog-consult-form');
  if (!dialog || !form) return;
  let opener;
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && url.pathname === '/' && url.hash === '#contact') {
      event.preventDefault();
      opener = link;
      if (!dialog.open) dialog.showModal();
      document.documentElement.classList.add('consult-dialog-open');
    }
  });
  dialog.querySelector('[data-close-consult]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('consult-dialog-open');
    if (opener) opener.focus({ preventScroll: true });
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const note = document.getElementById('blog-consult-note');
    const button = form.querySelector('button[type="submit"]');
    const label = button.textContent;
    button.disabled = true;
    button.textContent = 'Sending…';
    note.textContent = '';
    try {
      const data = new FormData(form);
      data.set('article_url', location.origin + location.pathname);
      const response = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (response.ok) {
        form.reset();
        note.textContent = 'Your request was sent. Peak’s coordination team will contact you to arrange a consultation. You can close this form and continue reading.';
      } else {
        const result = await response.json().catch(() => ({}));
        note.textContent = (result.errors && result.errors.map(error => error.message).join(', ')) || 'Unable to send your request. Please try again or contact us on WhatsApp.';
      }
    } catch {
      note.textContent = 'Unable to send your request. Please check your connection and try again, or contact us on WhatsApp.';
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
})();
