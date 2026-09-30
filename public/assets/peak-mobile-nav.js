/* Shared phone navigation for Peak treatment pages. Desktop menus are unchanged. */
(function () {
  'use strict';
  const header = document.querySelector('header');
  const row = header && header.querySelector('.nav');
  if (!row || header.querySelector('.peak-phone-toggle')) return;
  const desktopNav = row.querySelector('nav');
  if (!desktopNav) return;
  desktopNav.classList.add('peak-desktop-nav');
  header.classList.add('peak-phone-header');
  const style = document.createElement('style');
  style.textContent = `
.peak-phone-toggle,.peak-phone-nav{display:none}
@media(max-width:1120px){
  header.peak-phone-header{z-index:100;overflow:visible}
  .peak-phone-header .menu-btn{display:none!important}
  @media(max-width:600px){.peak-phone-header .nav-cta{display:none!important}}
  .peak-phone-header .nav{min-height:68px;gap:12px}
  .peak-phone-header .peak-desktop-nav,.peak-phone-header .mobile-cta{display:none!important}
  .peak-phone-toggle{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:88px;min-height:44px;margin-left:auto;padding:10px 14px;border:1px solid #233a2b40;border-radius:999px;background:#fcfaf4;color:#233a2b;font:600 14px/1.3 Inter,Arial,sans-serif;cursor:pointer;flex-shrink:0}
  .peak-phone-toggle:focus-visible,.peak-phone-nav a:focus-visible,.peak-phone-nav summary:focus-visible{outline:3px solid #a9c9aa;outline-offset:2px}
  .peak-phone-toggle[aria-expanded="true"]{background:#233a2b;color:#fcfaf4}
  header .peak-phone-nav{position:absolute;top:100%;left:0;right:0;padding:12px 20px 22px;background:#f4f0e5;color:#233a2b;border-top:1px solid #233a2b20;box-shadow:0 16px 24px #15291f20;max-height:calc(100vh - 80px);max-height:calc(100dvh - 80px);overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;font:500 15px/1.5 Inter,Arial,sans-serif}
  header .peak-phone-nav.open{display:flex;flex-direction:column;gap:2px}
  header .peak-phone-nav a,header .peak-phone-nav summary{display:block!important;min-height:44px;padding:11px 14px;border-radius:10px;color:#233a2b;text-decoration:none;white-space:normal;cursor:pointer}
  header .peak-phone-nav a:hover,header .peak-phone-nav a:focus-visible,header .peak-phone-nav summary:hover{background:#e7ebdf}
  header .peak-phone-nav details{display:block;padding:0;border:0;margin:0}
  header .peak-phone-nav summary{font-weight:600;list-style:none}
  header .peak-phone-nav summary::-webkit-details-marker{display:none}
  header .peak-phone-nav summary::after{content:'+';float:right}
  header .peak-phone-nav details[open]>summary{background:#233a2b;color:#fcfaf4}
  header .peak-phone-nav details[open]>summary::after{content:'−'}
  header .peak-phone-nav .peak-treatment-links{padding:5px 0 6px 12px}
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
  nav.innerHTML = '<a href="/">Home</a><details><summary>Treatments</summary><div class="peak-treatment-links"><a href="/fue">FUE Techniques</a><a href="/sapphire-fue-hair-transplant-nyc">Sapphire FUE in NYC</a><a href="/dhi-hair-transplant">DHI Implantation</a><a href="/prp-hair-restoration">PRP Packages</a><a href="/stem-cell-hair-therapy">Stem Cell Information</a><a href="/beard-transplant-nyc">Beard Transplant</a><a href="/afro-hair-transplant-nyc">Afro-Textured Hair</a><a href="/hair-transplant-cost-nyc">Cost &amp; Financing</a></div></details><a href="/#about">About Us</a><a href="/#results">Results</a><a href="/#process">How It Works</a><a href="/#locations">Locations</a><a href="/new-york-hair-transplant">New York Clinic</a><a href="/#faq">FAQ</a><a href="/blog">Blog</a><a class="peak-phone-consult" href="/#contact">Free Consultation</a>';
  header.appendChild(nav);
  const currentPath = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  nav.querySelectorAll('a').forEach(function (link) {
    if (link.getAttribute('href') === currentPath) link.setAttribute('aria-current', 'page');
  });
  function setOpen(open) {
    nav.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    if (!open) nav.querySelector('details').open = false;
  }
  button.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });
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
