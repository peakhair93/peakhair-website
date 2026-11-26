/* Shared phone navigation for Peak treatment pages. Desktop menus are unchanged. */
(function () {
  'use strict';
  const header = document.querySelector('header');
  const row = header && header.querySelector('.nav');
  if (!row || header.querySelector('.peak-phone-toggle')) return;
  const desktopNav = row.querySelector('nav');
  if (!desktopNav) return;
  desktopNav.classList.add('peak-desktop-nav');
  function closeDesktopTreatments() {
    desktopNav.querySelectorAll('details[open]').forEach(function (menu) {
      menu.open = false;
      const summary = menu.querySelector('summary');
      if (summary && document.activeElement === summary) summary.blur();
    });
  }
  // Capture selections before any other navigation handler can stop bubbling.
  document.addEventListener('pointerdown', function (event) {
    const menu = event.target.closest('details');
    if (!menu || !desktopNav.contains(menu)) closeDesktopTreatments();
  }, true);
  document.addEventListener('click', function (event) {
    if (event.target.closest('a')) setTimeout(closeDesktopTreatments, 0);
  }, true);
  // Do not close on focusout: touch/Safari may focus the page body before
  // dispatching a link click, which would hide the link before activation.
  // Outside pointer presses, completed clicks, Escape and navigation close it.
  window.addEventListener('pageshow', closeDesktopTreatments);
  window.addEventListener('pagehide', closeDesktopTreatments);
  window.addEventListener('hashchange', closeDesktopTreatments);
  header.classList.add('peak-phone-header');
  const style = document.createElement('style');
  style.textContent = `
.peak-phone-toggle,.peak-phone-nav{display:none}
.peak-desktop-nav details:not([open])>.nav-treatment-menu{display:none!important}
@media(max-width:600px){.peak-phone-header .nav-cta{display:none!important}}
@media(max-width:1120px){
  header.peak-phone-header{z-index:100;overflow:visible}
  .peak-phone-header .menu-btn{display:none!important}
  .peak-phone-header .nav{min-height:68px;gap:12px}
  .peak-phone-header .peak-desktop-nav,.peak-phone-header .mobile-cta{display:none!important}
  .peak-phone-toggle{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:88px;min-height:44px;margin-left:auto;padding:10px 14px;border:1px solid #233a2b40;border-radius:999px;background:#fcfaf4;color:#233a2b;font:600 14px/1.3 Inter,Arial,sans-serif;cursor:pointer;flex-shrink:0}
  .peak-phone-toggle:focus-visible,.peak-phone-nav a:focus-visible,.peak-phone-nav .peak-treatment-toggle:focus-visible{outline:3px solid #a9c9aa;outline-offset:2px}
  .peak-phone-toggle[aria-expanded="true"]{background:#233a2b;color:#fcfaf4}
  header .peak-phone-nav{position:absolute;top:100%;left:0;right:0;padding:12px 20px 22px;background:#f4f0e5;color:#233a2b;border-top:1px solid #233a2b20;box-shadow:0 16px 24px #15291f20;max-height:calc(100vh - 80px);max-height:calc(100dvh - 80px);overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;font:500 15px/1.5 Inter,Arial,sans-serif}
  header .peak-phone-nav.open{display:flex;flex-direction:column;gap:2px}
  header .peak-phone-nav>*{flex:0 0 auto}
  header .peak-phone-nav a,header .peak-phone-nav .peak-treatment-toggle{display:block!important;box-sizing:border-box;min-height:44px;padding:11px 14px;border-radius:10px;color:#233a2b;text-decoration:none;white-space:normal;cursor:pointer}
  header .peak-phone-nav a:hover,header .peak-phone-nav a:focus-visible,header .peak-phone-nav .peak-treatment-toggle:hover{background:#e7ebdf}
  header .peak-phone-nav .peak-treatment-toggle{width:100%;border:0;background:transparent;text-align:left;font:600 15px/1.5 Inter,Arial,sans-serif}
  header .peak-phone-nav .peak-treatment-toggle::after{content:'+';float:right}
  header .peak-phone-nav .peak-treatment-toggle[aria-expanded="true"]{background:#233a2b;color:#fcfaf4}
  header .peak-phone-nav .peak-treatment-toggle[aria-expanded="true"]::after{content:'−'}
  header .peak-phone-nav .peak-treatment-links{padding:5px 0 6px 12px}
  header .peak-phone-nav .peak-treatment-links[hidden]{display:none!important}
  header .peak-phone-nav a[aria-current="page"]{background:#e7ebdf;font-weight:600}
  header .peak-phone-nav .peak-phone-consult{background:#233a2b;color:#fcfaf4;margin-top:10px;text-align:center}
}
`;
  document.head.appendChild(style);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'peak-phone-toggle';
  button.setAttribute('aria-label', 'Open navigation menu');
  button.setAttribute('aria-controls', 'peak-phone-navigation');
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = '<span aria-hidden="true">☰</span><span>Menu</span>';
  row.appendChild(button);
  const nav = document.createElement('nav');
  nav.id = 'peak-phone-navigation';
  nav.className = 'peak-phone-nav';
  nav.setAttribute('aria-label', 'Mobile main navigation');
  nav.innerHTML = '<a href="/">Home</a><div class="peak-treatment-group"><button type="button" class="peak-treatment-toggle" aria-expanded="false" aria-controls="peak-treatment-links">Treatments</button><div class="peak-treatment-links" id="peak-treatment-links" hidden><a href="/fue">FUE Techniques</a><a href="/sapphire-fue-hair-transplant-nyc">Sapphire FUE in NYC</a><a href="/dhi-hair-transplant">DHI Implantation</a><a href="/prp-hair-restoration">PRP Packages</a><a href="/beard-transplant-nyc">Beard Transplant</a><a href="/eyebrow-transplant-nyc">Eyebrow Transplant</a><a href="/afro-hair-transplant-nyc">Afro-Textured Hair</a><a href="/hair-transplant-cost-nyc">Cost &amp; Financing</a></div></div><a href="/#about">About Us</a><a href="/#results">Before &amp; After</a><a href="/#process">How It Works</a><a href="/#locations">Locations</a><a href="/new-york-hair-transplant">New York Clinic</a><a href="/#faq">FAQ</a><a href="/blog">Blog</a><a class="peak-phone-consult" href="/#contact">Free Consultation</a>';
  header.appendChild(nav);
  const currentPath = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  nav.querySelectorAll('a').forEach(function (link) {
    if (link.getAttribute('href') === currentPath) link.setAttribute('aria-current', 'page');
  });
  const treatmentButton = nav.querySelector('.peak-treatment-toggle');
  const treatmentLinks = nav.querySelector('#peak-treatment-links');
  function setTreatmentsOpen(open) {
    if (!treatmentButton || !treatmentLinks) return;
    treatmentButton.setAttribute('aria-expanded', String(open));
    treatmentLinks.hidden = !open;
  }
  function setOpen(open) {
    nav.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    if (!open) setTreatmentsOpen(false);
  }
  button.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
  if (treatmentButton) treatmentButton.addEventListener('click', function () {
    setTreatmentsOpen(treatmentButton.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) setTimeout(function () { setOpen(false); }, 0);
  }, true);
  window.addEventListener('hashchange', function () { setOpen(false); });
  window.addEventListener('pageshow', function () { setOpen(false); });
  window.addEventListener('pagehide', function () { setOpen(false); });
  document.addEventListener('click', function (event) {
    if (!header.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      setOpen(false);
      button.focus();
    }
  });
  const mobile = window.matchMedia('(max-width:1120px)');
  const reset = function () { setOpen(false); };
  if (mobile.addEventListener) mobile.addEventListener('change', reset);
  else mobile.addListener(reset);
})();

(function () {
  if (document.getElementById('peak-quick-contact')) return;
  const style = document.createElement('style');
  style.textContent = `
#peak-quick-contact{position:fixed;left:50%;right:auto;transform:translateX(-50%);bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:990;width:max-content;box-sizing:border-box;max-width:calc(100vw - 24px);padding:10px;background:#faf7ef;color:#103e34;border:1px solid #d9d1bc;border-radius:14px;box-shadow:0 6px 28px #103e3426;font-family:Inter,Arial,sans-serif}
#peak-quick-contact .peak-qc-actions{display:flex;gap:8px;align-items:center}
#peak-quick-contact a{display:flex;gap:8px;align-items:center;justify-content:center;min-height:46px;padding:8px 12px;border:1px solid #b8b6a8;border-radius:8px;text-decoration:none;color:#103e34;background:#fffdf8;font-size:13px;line-height:1.2;font-weight:600}
#peak-quick-contact a:hover,#peak-quick-contact a:focus-visible{background:#e9eee7;outline:2px solid #b99a55;outline-offset:2px}
#peak-quick-contact svg{width:18px;height:18px;flex-shrink:0}
#peak-quick-contact small{display:block;font-size:10px;font-weight:400;margin-top:3px}
#peak-quick-contact p{margin:7px 0 0;font-size:11px;line-height:1.4;color:#555e56}
#peak-quick-contact button{border:0;background:transparent;color:#103e34;cursor:pointer;min-width:36px;min-height:44px;font-size:20px;padding:4px}
#peak-quick-contact.peak-qc-minimized .peak-qc-actions,#peak-quick-contact.peak-qc-minimized p{display:none}
#peak-quick-contact .peak-qc-restore{display:none;font:600 13px Inter,Arial,sans-serif;padding:4px 10px}
#peak-quick-contact.peak-qc-minimized .peak-qc-restore{display:block}
@media(max-width:600px){#peak-quick-contact{left:50%;right:auto;bottom:calc(12px + env(safe-area-inset-bottom,0px));padding:8px}#peak-quick-contact a{padding:7px 10px;font-size:12px}}
@media print{#peak-quick-contact{display:none}}
`;
  document.head.appendChild(style);
  const box = document.createElement('aside');
  box.id = 'peak-quick-contact';
  box.setAttribute('aria-label', 'Quick contact');
  const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8 9 9 0 0 1-3.5-.7L4 20l1.2-4.5a9 9 0 0 1-.7-3.5 8 8 0 0 1 8-8A8 8 0 0 1 20 11.5Z"/><path d="M8 10h8M8 14h6"/></svg>';
  box.innerHTML = '<div class="peak-qc-actions"><a href="https://wa.me/19175322001" target="_blank" rel="noopener" aria-label="WhatsApp Peak at +1 917-532-2001">'+icon+'<span>WhatsApp</span></a><a href="sms:+19175322001" aria-label="Message Peak at +1 917-532-2001 by iMessage or SMS">'+icon+'<span>Message us<small>iMessage / SMS</small></span></a><button type="button" class="peak-qc-hide" aria-label="Minimise quick contact">⌄</button></div><p>For appointments and general questions.</p><button type="button" class="peak-qc-restore" aria-label="Open WhatsApp and text-message contact options">Contact us</button>';
  document.body.appendChild(box);
  box.querySelector('.peak-qc-hide').addEventListener('click', function () {
    box.classList.add('peak-qc-minimized');
    box.querySelector('.peak-qc-restore').focus();
  });
  box.querySelector('.peak-qc-restore').addEventListener('click', function () {
    box.classList.remove('peak-qc-minimized');
    box.querySelector('a').focus();
  });
})();
