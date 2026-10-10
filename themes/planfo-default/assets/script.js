// Planfo CMS Default Theme — Vanilla JavaScript
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav-drawer');

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }
});
