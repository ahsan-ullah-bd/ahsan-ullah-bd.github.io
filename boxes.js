(() => {
  const stage = document.getElementById('stage');
  const rig = document.getElementById('rig');
  const boxes = [...stage.querySelectorAll('.box')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const T = ms => (reduced.matches ? 0 : ms);
  const wait = ms => new Promise(r => setTimeout(r, T(ms)));
  const rad = d => (d * Math.PI) / 180;

  // Pile layout as fractions of the stage: x, y, rx, ry, rz
  const PILE = [
    [.48, .66, -14, -24, 6],
    [.13, .86, -16, 28, 16],
    [.36, .90, -12, -20, -10],
    [.60, .88, -14, 24, 12],
    [.86, .86, -16, -30, -14],
    [.25, .68, -14, 30, -12],
    [.73, .68, -14, -26, 16],
  ];
  const BLOB_COLOURS = ['#ffa6d0', '#8fd3ff', '#ffe066', '#9be7c4', '#c9b6ff'];

  // ---------- Build the faces of every box around its content ----------
  const use = (id, colour, cls = '') => `<svg class="${cls}" viewBox="0 0 40 36" style="color:${colour}" aria-hidden="true"><use href="#${id}"/></svg>`;
  boxes.forEach((box, i) => {
    const [l1, l2] = box.dataset.label.split('|');
    const art = `
      <div class="art" aria-hidden="true">
        <p class="label">${l1}<br>${l2}</p>
        <p class="tagline">A box of field notes &amp; some serious fun</p>
        ${use('face', box.dataset.sticker, 'sticker')}
        <span class="numtag">${box.dataset.tag}</span>
      </div>`;
    const content = box.querySelector('.content');
    content.id = content.id || `content-${i}`;
    const tex = 'face tex';
    box.insertAdjacentHTML('afterbegin', `
      <div class="${tex} inner in-back"></div>
      <div class="face inner in-l"></div><div class="face inner in-r"></div>
      <div class="face inner in-t"></div><div class="face inner in-b"></div>
      <div class="${tex} end l"><span class="stamp" aria-hidden="true">ahsan</span></div>
      <div class="${tex} end r"><span class="stamp" aria-hidden="true">ahsan</span></div>
      <div class="${tex} lid"><div class="tape"></div><div class="blobs">${BLOB_COLOURS.map(c => use('blob', c)).join('')}</div></div>
      <div class="${tex} bottom"></div>
      <button class="front" type="button" aria-label="Open the ${box.dataset.name} box" aria-controls="${content.id}">
        <span class="door l"><span class="out tex">${art}</span><span class="in"></span></span>
        <span class="door r"><span class="out tex">${art}</span><span class="in"></span></span>
      </button>`);
    box.querySelector('.in-back').appendChild(content);
    content.inert = true;
    box.addEventListener('click', e => {
      if (e.target.closest('.content')) return; // clicks on links inside an open box
      request(i);
    });
  });

  // ---------- Layout ----------
  let L = {};
  function layout() {
    const sw = stage.clientWidth, sh = stage.clientHeight;
    const phone = sw < 640;
    const W = phone ? Math.min(170, sw * 0.34) : Math.max(200, Math.min(310, sw * 0.2));
    const H = W * (phone ? 0.7 : 0.6);
    const D = W * (phone ? 0.66 : 0.62);
    // On phones the pile is spread over more of the height so the labels stay readable
    const fy = y => (phone ? 0.52 + (y - 0.66) * 1.5 : y);
    const pile = PILE.map(([x, y, rx, ry, rz]) => ({
      x: Math.min(sw - W / 2 - 8, Math.max(W / 2 + 8, x * sw)),
      y: Math.min(sh - H * 0.5 - 14, fy(y) * sh),
      rx, ry, rz, W, H, D,
    }));
    let s = phone ? 2.4 : 1.95;
    s = Math.min(s, (sw - 24) / W, (sh * 0.56) / H);
    const Hh = H * s;
    const held = { x: sw / 2, y: Math.max(84 + Hh / 2, sh * 0.3), rx: -7, ry: -11, rz: 0, W: W * s, H: Hh, D: D * s };
    L = { sw, sh, W, H, D, pile, held };
  }

  // Where the hub sits (the middle of the lid) and how far the prongs reach
  function grip(p) {
    return {
      gx: p.x,
      gy: p.y - (p.H / 2) * Math.cos(rad(p.rx)),
      pw: p.W * 0.53,
      ph: 8 + (p.D / 2) * Math.abs(Math.sin(rad(p.rx))) + p.H * 0.3,
      prz: p.rz,
    };
  }

  function setBox(i, p, ms) {
    const s = boxes[i].style;
    s.setProperty('--bd', `${T(ms)}ms`);
    s.setProperty('--tx', `${p.x}px`); s.setProperty('--ty', `${p.y}px`);
    s.setProperty('--rx', `${p.rx}deg`); s.setProperty('--ry', `${p.ry}deg`); s.setProperty('--rz', `${p.rz}deg`);
    s.setProperty('--W', `${p.W}px`); s.setProperty('--H', `${p.H}px`); s.setProperty('--D', `${p.D}px`);
  }
  function setClaw(g, ms) {
    const s = rig.style;
    s.setProperty('--cd', `${T(ms)}ms`);
    s.setProperty('--gx', `${g.gx}px`); s.setProperty('--gy', `${g.gy}px`);
    s.setProperty('--pw', `${g.pw}px`); s.setProperty('--ph', `${g.ph}px`);
    s.setProperty('--prz', `${g.prz}deg`);
  }
  const zFor = i => Math.round(L.pile[i].y);
  function settle(i) { boxes[i].style.setProperty('--bd', '.25s'); }

  // ---------- The pick sequence ----------
  let held = null;
  async function pick(i) {
    if (held === i) return;
    stage.classList.add('busy');
    if (held !== null) {
      const h = held;
      boxes[h].classList.remove('open');
      boxes[h].querySelector('.content').inert = true;
      await wait(450);
      setBox(h, L.pile[h], 850);
      setClaw(grip(L.pile[h]), 850);
      await wait(850);
      rig.classList.add('open');
      boxes[h].classList.remove('held');
      boxes[h].style.zIndex = zFor(h);
      settle(h);
      held = null;
      await wait(240);
    } else {
      rig.classList.add('open');
    }

    const g = grip(L.pile[i]);
    setClaw({ ...g, gy: Math.max(96, g.gy - 150), prz: 0 }, 750);
    await wait(750);
    setClaw(g, 560);
    await wait(560);
    rig.classList.remove('open');
    await wait(240);

    held = i;
    boxes[i].classList.add('held');
    boxes[i].style.zIndex = 500;
    setBox(i, L.held, 950);
    setClaw(grip(L.held), 950);
    await wait(950);

    boxes[i].classList.add('open');
    const content = boxes[i].querySelector('.content');
    content.inert = false;
    content.scrollTop = 0;
    await wait(750);
    settle(i);
    stage.classList.remove('busy');
    content.querySelector('h2').focus({ preventScroll: true });
  }

  // Clicks during a move wait their turn
  const queue = [];
  let running = false;
  function request(i) {
    if (queue[queue.length - 1] === i) return;
    queue.push(i);
    if (!running) pump();
  }
  async function pump() {
    running = true;
    while (queue.length) await pick(queue.shift());
    running = false;
  }

  document.querySelectorAll('[data-box]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    request(Number(a.dataset.box));
  }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') request(0); });

  // ---------- Place everything (and again on resize) ----------
  function placeAll() {
    layout();
    boxes.forEach((b, i) => {
      if (i === held) setBox(i, L.held, 0);
      else { setBox(i, L.pile[i], 0); b.style.zIndex = zFor(i); }
    });
    if (held !== null) setClaw(grip(L.held), 0);
    else setClaw({ gx: L.sw / 2, gy: 110, pw: L.W * 0.53, ph: 8 + L.H * 0.34, prz: 0 }, 0);
    requestAnimationFrame(() => boxes.forEach((b, i) => { if (!running) settle(i); }));
  }
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(placeAll, 120); });

  placeAll();
  setTimeout(() => request(0), 500);
})();
