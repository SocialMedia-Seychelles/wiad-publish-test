/* Look: One scene that changes as you scroll. The canvas shows frame N of a picture sequence, chosen by the scroll.
   Swap the pictures with your own clip: site.py frames my-clip.mp4 <site>  (it updates the count in site.json). */
(() => {
  const site = window.site;
  const sec = document.querySelector('.scrub');
  if (!sec) return;
  const cv = sec.querySelector('canvas'), ctx = cv.getContext('2d');
  const count = Math.max(1, parseInt(sec.dataset.count, 10) || 1);
  const src = sec.dataset.src;                       // e.g. assets/frames/f{n}.webp  ({n} = 001, 002…)
  const fx = parseFloat(sec.dataset.focus || '0.5'), fxPhone = parseFloat(sec.dataset.focusPhone || sec.dataset.focus || '0.5');
  const imgs = new Array(count);
  let want = 0, shown = -1;

  const load = i => {
    if (imgs[i]) return imgs[i].p;
    const im = new Image(); im.decoding = 'async';
    im.p = new Promise(res => { im.onload = () => { im.ok = true; if (Math.abs(i - want) < 6) draw(); res(); }; im.onerror = res; });
    im.src = src.replace('{n}', String(i + 1).padStart(3, '0'));
    imgs[i] = im; return im.p;
  };
  // load the first frame, then a rough pass (every 8th), then fill the gaps, a few at a time
  const order = [];
  [8, 4, 2, 1].forEach(step => { for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i); });
  load(0).then(async () => { for (let k = 0; k < order.length; k += 6) await Promise.all(order.slice(k, k + 6).map(load)); });

  const nearest = i => {
    for (let d = 0; d < count; d++) { if (imgs[i - d] && imgs[i - d].ok) return i - d; if (imgs[i + d] && imgs[i + d].ok) return i + d; }
    return -1;
  };
  const draw = () => {
    const k = nearest(want); if (k < 0 || k === shown) return;
    const im = imgs[k], cw = cv.width, ch = cv.height, s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
    const dw = im.naturalWidth * s, dh = im.naturalHeight * s, f = cw < ch ? fxPhone : fx;
    ctx.drawImage(im, (cw - dw) * f, (ch - dh) * 0.5, dw, dh); shown = k;
  };
  const size = () => { const r = Math.min(devicePixelRatio || 1, 2); cv.width = cv.clientWidth * r; cv.height = cv.clientHeight * r; shown = -1; draw(); };
  addEventListener('resize', size); size();

  const steps = [...sec.querySelectorAll('.step')], rail = [...sec.querySelectorAll('.rail span')];
  const root = document.documentElement;
  site.onFrame(y => {
    const p = site.prog(sec, y);
    want = Math.round(p * (count - 1)); draw();
    steps.forEach(s => s.classList.toggle('on', p >= parseFloat(s.dataset.from) && p <= parseFloat(s.dataset.to)));
    rail.forEach((r, i) => r.style.setProperty('--f', Math.min(1, Math.max(0, p * rail.length - i)).toFixed(3)));
    const r = sec.getBoundingClientRect();
    root.classList.toggle('on-dark', r.top < 60 && r.bottom > 60);
  });
})();
