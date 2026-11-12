// Accordion FAQ: a shop's delivery questions open one at a time; the answer's panel grows to its measured height while the one before it closes.
// Height is the one layout property worth animating here, so it stays short and eases out. The answer text arrives a beat after the panel starts opening, and leaves first when it closes, so you never see words squeezed by the edge.
const PARAMS = { duration: 280, textDelay: 60 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AW = 440, AH = 352;
  const faq = [
    ['How long does delivery take?', 'Orders placed before 2 pm leave the same day. Most arrive within 2–4 working days anywhere in the EU, and you get a tracking link by email.'],
    ['Can I return something?', 'Yes, within 30 days. Print the prepaid label from your order page and drop the parcel at any pickup point. Refunds land 3–5 days after it reaches us.'],
    ['Do you ship outside the EU?', 'We ship to the UK, Norway and Switzerland. Duties are included in the price you see at checkout, so there is nothing extra to pay on the doorstep.'],
    ['How do I care for linen?', 'Wash at 40 °C with similar colours and hang it to dry. It gets a little softer with every wash, so skip the fabric softener.'],
  ];
  const root = document.createElement('div');
  root.className = 'af-root';
  root.innerHTML = `<style>
    .af-root { position: absolute; inset: 0; background: #e9edf7; overflow: hidden; color: #15171a; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .af-board { position: absolute; left: 50%; top: 50%; width: ${AW}px; height: ${AH}px; box-sizing: border-box; padding: 18px 20px; background: #fff; border-radius: 18px; box-shadow: 0 1px 2px rgba(20,30,60,.06), 0 18px 40px -24px rgba(20,30,60,.35); }
    .af-board h3 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; font-stretch: 106%; }
    .af-board > p { margin: 3px 0 10px; font-size: 12px; color: #5b6066; }
    .af-board > p b { color: #3b5bdb; font-weight: 600; }
    .af-item { border-top: 1px solid #e9ecef; }
    .af-q { position: relative; height: 44px; display: flex; align-items: center; justify-content: space-between; font-size: 13.5px; font-weight: 620; }
    .af-hl { position: absolute; inset: 3px -8px; border-radius: 8px; background: #f1f3f6; opacity: 0; }
    .af-q span, .af-q svg { position: relative; }
    .af-q svg { width: 16px; height: 16px; flex: none; }
    .af-panel { height: 0; overflow: hidden; }
    .af-panel p { margin: 0; padding: 0 28px 14px 0; font-size: 12.5px; line-height: 1.5; color: #5b6066; opacity: 0; }
  </style>
  <div class="af-board"><h3>Delivery &amp; returns</h3><p>Still stuck? <b>Chat with us</b>, we reply within the hour.</p>
    ${faq.map(([q, a]) => `<div class="af-item"><div class="af-q"><i class="af-hl"></i><span>${q}</span><svg viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" fill="none" stroke="#5b6066" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="af-panel"><p>${a}</p></div></div>`).join('')}
  </div>`;
  stage.append(root);
  const board = root.querySelector('.af-board');
  const items = [...root.querySelectorAll('.af-item')].map(el => ({ q: el.querySelector('.af-q'), hl: el.querySelector('.af-hl'), icon: el.querySelector('svg'), panel: el.querySelector('.af-panel'), text: el.querySelector('p'), open: false }));

  const fit = () => { const s = Math.min(stage.clientWidth / AW, stage.clientHeight / AH) * 0.92; board.style.transform = `translate(-50%, -50%) scale(${Math.min(s, 1.6)})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
  function open(it) {
    const h = it.text.offsetHeight; // measured, never animated to 'auto'
    it.panel.animate([{ height: '0px' }, { height: h + 'px' }], { duration: reduce ? 0 : PARAMS.duration, easing: easeOut, fill: 'forwards' });
    it.text.animate([{ opacity: 0, transform: reduce ? 'none' : 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: PARAMS.textDelay, easing: easeOut, fill: 'both' });
    it.icon.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)' }], { duration: reduce ? 0 : PARAMS.duration, easing: easeOut, fill: 'forwards' });
    it.open = true;
  }
  function close(it) {
    const h = it.text.offsetHeight;
    it.text.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: easeOut, fill: 'forwards' });
    it.panel.animate([{ height: h + 'px' }, { height: '0px' }], { duration: reduce ? 0 : Math.round(PARAMS.duration * 0.85), delay: reduce ? 120 : 0, easing: easeOut, fill: 'forwards' });
    it.icon.animate([{ transform: 'rotate(180deg)' }, { transform: 'rotate(0deg)' }], { duration: reduce ? 0 : PARAMS.duration, easing: easeOut, fill: 'forwards' });
    it.open = false;
  }
  const press = it => it.hl.animate([{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], { duration: 420, easing: 'ease' });

  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  // Open each question in turn (closing the previous one), then close the last and start over.
  let i = 0;
  function step() {
    if (i < items.length) {
      const it = items[i++];
      press(it);
      items.forEach(o => o.open && close(o));
      open(it);
      later(step, PARAMS.duration + 2100);
    } else {
      const it = items[items.length - 1];
      press(it); close(it); i = 0;
      later(step, PARAMS.duration + 1100);
    }
  }
  later(step, 600);

  return () => { timers.forEach(clearTimeout); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
