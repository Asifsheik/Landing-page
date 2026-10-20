// Responsive navbar: toggle the mobile menu (shared by every page)
(function () {
  var toggle = document.getElementById('nav-toggle');
  var menu = document.getElementById('nav-links');
  if (!toggle || !menu) return;

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
  }

  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setOpen(false); toggle.focus(); }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 767) setOpen(false);
  });
})();