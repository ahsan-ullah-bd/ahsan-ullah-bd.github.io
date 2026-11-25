// Mobile menu
const menuBtn = document.querySelector('.menu-btn');
const nav = document.getElementById('site-nav');
if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = 'Menu';
  }));
}

// Show all / fewer awards
document.querySelectorAll('.toggle').forEach(btn => {
  const list = document.getElementById(btn.dataset.target);
  const total = list.children.length;
  btn.addEventListener('click', () => {
    const showing = list.classList.toggle('show-all');
    btn.setAttribute('aria-expanded', String(showing));
    btn.textContent = showing ? 'Show fewer awards' : `Show all ${total} awards`;
  });
});

// Footer year
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
