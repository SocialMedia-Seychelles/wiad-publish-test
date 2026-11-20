/* base.js: shared by every starter look. Menu, reveals, word-by-word titles, scroll helpers, forms. */
(() => {
  const root = document.documentElement;
  const STILL = new URLSearchParams(location.search).has('still');   // used for screenshots and scroll videos
  const CALM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (STILL) root.classList.add('still');

  // ---- menu (always reachable: pill on computers, Menu button on phones)
  const btn = document.querySelector('.menu-btn'), sheet = document.getElementById('menu-sheet');
  const setMenu = open => {
    root.classList.toggle('menu-open', open);
    btn && btn.setAttribute('aria-expanded', open);
    if (sheet) { if (open) sheet.hidden = false; else setTimeout(() => { if (!root.classList.contains('menu-open')) sheet.hidden = true; }, 350); }
    document.body.style.overflow = open ? 'hidden' : '';
  };
  btn && btn.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  sheet && sheet.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // ---- word-by-word titles
  document.querySelectorAll('[data-words]').forEach(el => {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.textContent = part; w.append(s); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
    });
    walk(el);
    el.querySelectorAll('.w>span').forEach((s, i) => s.style.transitionDelay = (i * 0.045) + 's');
  });

  // ---- reveal on scroll
  const reveal = document.querySelectorAll('[data-rise],[data-words]');
  if (STILL || CALM || !('IntersectionObserver' in window)) reveal.forEach(e => e.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveal.forEach(e => io.observe(e));
  }

  // ---- scroll helpers for the looks: site.onFrame(fn) runs every frame with a smoothed scroll position
  const subs = [];
  let target = scrollY, smooth = scrollY;
  const site = window.site = {
    STILL, CALM,
    onFrame(fn) { subs.push(fn); },
    // 0..1: how far the page has scrolled through a tall (pinned) element
    prog(el, y = smooth) {
      const top = el.getBoundingClientRect().top + scrollY, span = el.offsetHeight - innerHeight;
      return span <= 0 ? 0 : Math.min(1, Math.max(0, (y - top) / span));
    },
    // -1..1: where an element's centre is compared to the screen centre
    centre(el) { const r = el.getBoundingClientRect(); return ((r.top + r.height / 2) - innerHeight / 2) / innerHeight; },
    get y() { return smooth; },
  };
  const par = [...document.querySelectorAll('[data-speed]')];
  const tick = () => {
    target = scrollY;
    smooth = (STILL || CALM) ? target : smooth + (target - smooth) * 0.14;
    if (Math.abs(target - smooth) < 0.1) smooth = target;
    root.classList.toggle('scrolled', target > 24);
    par.forEach(el => { const k = parseFloat(el.dataset.speed) || 0; el.style.transform = `translate3d(0,${(site.centre(el) * k * -120).toFixed(1)}px,0)`; });
    subs.forEach(fn => fn(smooth));
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // ---- marquee: repeat the content so it loops without a gap
  document.querySelectorAll('.marquee').forEach(m => { const d = m.firstElementChild; if (d) m.append(d.cloneNode(true)); });

  // ---- forms: Web3Forms when a key is set, otherwise the visitor's email app (or WhatsApp)
  document.querySelectorAll('form[data-form]').forEach(f => f.addEventListener('submit', async e => {
    e.preventDefault();
    const note = f.querySelector('[data-note]'), data = new FormData(f);
    if (data.get('botcheck')) return;
    const lines = [...data.entries()].filter(([k]) => !['access_key', 'subject', 'botcheck'].includes(k)).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
    if (f.hasAttribute('data-live')) {
      note.textContent = 'Sending…';
      try {
        const r = await fetch(f.action, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
        const j = await r.json();
        note.textContent = j.success ? 'Thank you! We’ll get back to you soon.' : 'That didn’t send. Please try WhatsApp instead.';
        if (j.success) f.reset();
      } catch { note.textContent = 'No connection. Please try again or message us on WhatsApp.'; }
      return;
    }
    const subject = data.get('subject') || 'Website message';
    if (f.dataset.email) location.href = `mailto:${f.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    else if (f.dataset.wa && !f.dataset.wa.startsWith('#')) open(`${f.dataset.wa}?text=${encodeURIComponent(subject + '\n' + lines.join('\n'))}`, '_blank');
    note.textContent = 'Your message is ready to send in the app that just opened.';
  }));
})();
